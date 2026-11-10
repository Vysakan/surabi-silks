<?php

namespace App\Repositories;

use App\Support\Db;
use App\Support\Fmt;

final class CartRepository
{
    public static function findOrCreateCart(int $userId): int
    {
        $id = Db::value('SELECT id FROM carts WHERE user_id = ?', [$userId]);
        if ($id !== false && $id !== null) {
            return (int) $id;
        }
        return Db::insert('INSERT INTO carts (user_id) VALUES (?)', [$userId]);
    }

    public static function getItems(int $cartId): array
    {
        $rows = Db::all(
            'SELECT ci.id, ci.product_id, ci.variant_id, ci.quantity,
                    p.name AS product_name, p.slug AS product_slug, p.base_price,
                    p.fabric, p.selling_unit, p.is_archived,
                    pv.color_name, pv.color_hex, pv.size, pv.price AS variant_price,
                    pv.mrp, pv.stock, pv.sku,
                    (SELECT pi.url FROM product_images pi
                     WHERE pi.variant_id = pv.id ORDER BY pi.sort_order LIMIT 1) AS image
             FROM cart_items ci
             JOIN products p ON ci.product_id = p.id
             JOIN product_variants pv ON ci.variant_id = pv.id
             WHERE ci.cart_id = ?
             ORDER BY ci.created_at ASC',
            [$cartId]
        );
        return array_map([self::class, 'toCartItem'], $rows);
    }

    public static function findItem(int $cartId, int $variantId): ?array
    {
        return Db::one('SELECT id, quantity FROM cart_items WHERE cart_id = ? AND variant_id = ?', [$cartId, $variantId]);
    }

    public static function upsertItem(int $cartId, int $productId, int $variantId, int $quantity): void
    {
        Db::run(
            'INSERT INTO cart_items (cart_id, product_id, variant_id, quantity)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity), updated_at = CURRENT_TIMESTAMP',
            [$cartId, $productId, $variantId, $quantity]
        );
    }

    public static function setItemQuantity(int $cartId, int $variantId, int $quantity): void
    {
        Db::run(
            'UPDATE cart_items SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE cart_id = ? AND variant_id = ?',
            [$quantity, $cartId, $variantId]
        );
    }

    public static function removeItem(int $cartId, int $variantId): void
    {
        Db::run('DELETE FROM cart_items WHERE cart_id = ? AND variant_id = ?', [$cartId, $variantId]);
    }

    public static function clearCart(int $cartId): void
    {
        Db::run('DELETE FROM cart_items WHERE cart_id = ?', [$cartId]);
    }

    private static function toCartItem(array $row): array
    {
        $price = (float) $row['variant_price'];
        $qty = (int) $row['quantity'];
        return [
            'id' => (int) $row['id'],
            'productId' => (int) $row['product_id'],
            'variantId' => (int) $row['variant_id'],
            'quantity' => $qty,
            'productName' => $row['product_name'],
            'productSlug' => $row['product_slug'],
            'fabric' => $row['fabric'],
            'sellingUnit' => $row['selling_unit'],
            'isArchived' => (bool) $row['is_archived'],
            'image' => $row['image'] ?: null,
            'variant' => [
                'id' => (int) $row['variant_id'],
                'color' => ['name' => $row['color_name'], 'hex' => $row['color_hex']],
                'size' => $row['size'],
                'price' => $price,
                'mrp' => Fmt::floatOrNull($row['mrp']),
                'stock' => (int) $row['stock'],
                'sku' => $row['sku'],
            ],
            'unitPrice' => $price,
            'lineTotal' => $price * $qty,
        ];
    }
}
