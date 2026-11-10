<?php

namespace App\Repositories;

use App\Http\HttpError;
use App\Support\Config;
use App\Support\Db;
use App\Support\Fmt;

final class OrderRepository
{
    public static function list(int $page, int $limit, ?string $status, ?int $userId): array
    {
        $where = [];
        $values = [];
        if ($userId) {
            $where[] = 'o.user_id = ?';
            $values[] = $userId;
        }
        if ($status) {
            $where[] = 'o.status = ?';
            $values[] = $status;
        }
        $clause = $where ? 'WHERE ' . implode(' AND ', $where) : '';

        $total = (int) Db::value("SELECT COUNT(*) AS total FROM orders o $clause", $values);
        $rows = Db::all(
            "SELECT o.id FROM orders o JOIN users u ON u.id = o.user_id $clause
             ORDER BY o.created_at DESC LIMIT ? OFFSET ?",
            array_merge($values, [$limit, ($page - 1) * $limit])
        );

        $items = [];
        foreach ($rows as $row) {
            $items[] = self::findById((int) $row['id']);
        }
        return [
            'items' => $items,
            'total' => $total,
            'page' => $page,
            'totalPages' => (int) ceil($total / $limit),
        ];
    }

    /** $id may be the numeric id or the order number (ORD-2026-000001), like the Node backend. */
    public static function findById($id, ?int $userId = null): ?array
    {
        $sql = 'SELECT o.*, u.name AS customer_name, u.email AS customer_email
                FROM orders o JOIN users u ON u.id = o.user_id
                WHERE (o.order_number = ? OR o.id = ?)';
        $params = [(string) $id, (string) $id];
        if ($userId) {
            $sql .= ' AND o.user_id = ?';
            $params[] = $userId;
        }
        $order = Db::one($sql . ' LIMIT 1', $params);
        if (!$order) {
            return null;
        }
        $items = Db::all(
            'SELECT product_id, variant_id, product_name, variant_label, image, sku, unit_price, quantity, line_total
             FROM order_items WHERE order_id = ? ORDER BY id',
            [(int) $order['id']]
        );
        $history = Db::all(
            'SELECT status, created_at FROM order_status_history WHERE order_id = ? ORDER BY id',
            [(int) $order['id']]
        );
        return self::toOrder($order, $items, $history);
    }

    public static function create(int $userId, array $data): ?array
    {
        $orderNumber = Db::transaction(function () use ($userId, $data) {
            // Merge duplicate lines for the same product + variant.
            $grouped = [];
            foreach ($data['items'] as $item) {
                $key = $item['productId'] . ':' . $item['variantId'];
                $grouped[$key] = [
                    'productId' => $item['productId'],
                    'variantId' => $item['variantId'],
                    'quantity' => ($grouped[$key]['quantity'] ?? 0) + $item['quantity'],
                ];
            }

            $lines = [];
            $subtotal = 0.0;
            foreach ($grouped as $item) {
                $p = Db::one(
                    'SELECT p.id AS product_id, p.name AS product_name, p.is_archived,
                            v.id AS variant_id, v.sku, v.color_name, v.size, v.design, v.price, v.stock,
                            (SELECT pi.url FROM product_images pi WHERE pi.variant_id = v.id ORDER BY pi.sort_order LIMIT 1) AS image
                     FROM products p JOIN product_variants v ON v.product_id = p.id
                     WHERE p.id = ? AND v.id = ? FOR UPDATE',
                    [$item['productId'], $item['variantId']]
                );
                if (!$p || (int) $p['is_archived']) {
                    throw new HttpError(400, 'PRODUCT_UNAVAILABLE', 'A product in your cart is no longer available');
                }
                if ((int) $p['stock'] < $item['quantity']) {
                    throw new HttpError(400, 'INSUFFICIENT_STOCK', 'Only ' . (int) $p['stock'] . ' of ' . $p['product_name'] . ' are available');
                }
                $unitPrice = (float) $p['price'];
                $lineTotal = $unitPrice * $item['quantity'];
                $subtotal += $lineTotal;
                $label = implode(' / ', array_values(array_filter(
                    [$p['color_name'], $p['size'], $p['design']],
                    function ($part) {
                        return $part !== null && $part !== '';
                    }
                )));
                $lines[] = [
                    'item' => $item,
                    'product' => $p,
                    'unitPrice' => $unitPrice,
                    'lineTotal' => $lineTotal,
                    'variantLabel' => $label,
                ];
            }

            $freeThreshold = (float) Config::get('shipping.free_threshold', 2000);
            $shippingCost = $subtotal >= $freeThreshold ? 0.0 : (float) Config::get('shipping.cost', 99);
            $total = $subtotal + $shippingCost;

            $orderId = Db::insert(
                'INSERT INTO orders (order_number, user_id, subtotal, shipping_cost, total, shipping_address, payment_method)
                 VALUES (?, ?, ?, ?, ?, ?, ?)',
                [
                    'TMP-' . substr(bin2hex(random_bytes(16)), 0, 24), $userId, $subtotal, $shippingCost, $total,
                    Fmt::json($data['shippingAddress']), $data['paymentMethod'],
                ]
            );
            $orderNumber = sprintf('ORD-%s-%06d', date('Y'), $orderId);
            Db::run('UPDATE orders SET order_number = ? WHERE id = ?', [$orderNumber, $orderId]);
            Db::run('INSERT INTO order_status_history (order_id, status) VALUES (?, ?)', [$orderId, 'pending']);

            foreach ($lines as $line) {
                $p = $line['product'];
                $qty = (int) $line['item']['quantity'];
                Db::run(
                    'INSERT INTO order_items (order_id, product_id, variant_id, product_name, variant_label, image, sku, unit_price, quantity, line_total)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [
                        $orderId, (int) $p['product_id'], (int) $p['variant_id'], $p['product_name'],
                        $line['variantLabel'], $p['image'], $p['sku'], $line['unitPrice'], $qty, $line['lineTotal'],
                    ]
                );
                Db::run('UPDATE product_variants SET stock = stock - ? WHERE id = ?', [$qty, (int) $line['item']['variantId']]);
                Db::run(
                    'INSERT INTO inventory_log (variant_id, quantity_change, reason, reference_id) VALUES (?, ?, ?, ?)',
                    [(int) $line['item']['variantId'], -$qty, 'Order placed', $orderNumber]
                );
            }
            return $orderNumber;
        });

        return self::findById($orderNumber);
    }

    public static function updateStatus($id, string $status): ?array
    {
        $orderId = Db::transaction(function () use ($id, $status) {
            $row = Db::one(
                'SELECT id, status FROM orders WHERE order_number = ? OR id = ? FOR UPDATE',
                [(string) $id, (string) $id]
            );
            if (!$row) {
                return null;
            }
            $orderId = (int) $row['id'];
            Db::run('UPDATE orders SET status = ? WHERE id = ?', [$status, $orderId]);

            if ($status === 'cancelled') {
                // Put the stock back.
                $items = Db::all(
                    'SELECT variant_id, quantity FROM order_items WHERE order_id = ? AND variant_id IS NOT NULL',
                    [$orderId]
                );
                foreach ($items as $item) {
                    Db::run('UPDATE product_variants SET stock = stock + ? WHERE id = ?', [(int) $item['quantity'], (int) $item['variant_id']]);
                    Db::run(
                        'INSERT INTO inventory_log (variant_id, quantity_change, reason, reference_id) VALUES (?, ?, ?, ?)',
                        [(int) $item['variant_id'], (int) $item['quantity'], 'Order cancelled', (string) $id]
                    );
                }
            }
            Db::run('INSERT INTO order_status_history (order_id, status) VALUES (?, ?)', [$orderId, $status]);
            return $orderId;
        });

        return $orderId === null ? null : self::findById($orderId);
    }

    private static function toOrder(array $row, array $items, array $history): array
    {
        $address = $row['shipping_address'];
        if (is_string($address)) {
            $address = json_decode($address, true);
        }
        return [
            'id' => $row['order_number'],
            'customerId' => (int) $row['user_id'],
            'customerName' => $row['customer_name'],
            'customerEmail' => $row['customer_email'],
            'status' => $row['status'],
            'subtotal' => (float) $row['subtotal'],
            'shippingCost' => (float) $row['shipping_cost'],
            'discount' => (float) $row['discount'],
            'total' => (float) $row['total'],
            'shippingAddress' => $address,
            'paymentMethod' => $row['payment_method'],
            'createdAt' => Fmt::date($row['created_at']),
            'updatedAt' => Fmt::date($row['updated_at']),
            'items' => array_map(function ($item) {
                return [
                    'productId' => Fmt::intOrNull($item['product_id']),
                    'variantId' => Fmt::intOrNull($item['variant_id']),
                    'productName' => $item['product_name'],
                    'variantLabel' => $item['variant_label'],
                    'image' => $item['image'],
                    'sku' => $item['sku'],
                    'unitPrice' => (float) $item['unit_price'],
                    'quantity' => (int) $item['quantity'],
                    'total' => (float) $item['line_total'],
                ];
            }, $items),
            'statusHistory' => array_map(function ($entry) {
                return ['status' => $entry['status'], 'timestamp' => Fmt::date($entry['created_at'])];
            }, $history),
        ];
    }
}
