<?php

namespace App\Repositories;

use App\Support\Db;
use App\Support\Fmt;

final class WishlistRepository
{
    public static function findByUser(int $userId): array
    {
        $rows = Db::all(
            'SELECT w.id, w.product_id, w.variant_id, w.created_at,
                    p.name AS product_name, p.slug AS product_slug, p.base_price,
                    p.fabric, p.selling_unit, p.is_archived,
                    pv.color_name, pv.color_hex, pv.size, pv.price AS variant_price,
                    pv.mrp, pv.stock, pv.sku,
                    (SELECT pi.url FROM product_images pi
                     WHERE pi.variant_id = pv.id ORDER BY pi.sort_order LIMIT 1) AS image
             FROM wishlists w
             JOIN products p ON w.product_id = p.id
             LEFT JOIN product_variants pv ON w.variant_id = pv.id
             WHERE w.user_id = ?
             ORDER BY w.created_at DESC',
            [$userId]
        );
        return array_map([self::class, 'toWishlistItem'], $rows);
    }

    public static function add(int $userId, int $productId, ?int $variantId): void
    {
        Db::run(
            'INSERT INTO wishlists (user_id, product_id, variant_id) VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE created_at = CURRENT_TIMESTAMP',
            [$userId, $productId, $variantId ?: null]
        );
    }

    public static function remove(int $userId, int $productId): void
    {
        Db::run('DELETE FROM wishlists WHERE user_id = ? AND product_id = ?', [$userId, $productId]);
    }

    private static function toWishlistItem(array $row): array
    {
        $variantId = Fmt::intOrNull($row['variant_id']);
        return [
            'id' => (int) $row['id'],
            'productId' => (int) $row['product_id'],
            'variantId' => $variantId,
            'productName' => $row['product_name'],
            'productSlug' => $row['product_slug'],
            'fabric' => $row['fabric'],
            'sellingUnit' => $row['selling_unit'],
            'isArchived' => (bool) $row['is_archived'],
            'image' => $row['image'] ?: null,
            'variant' => $variantId ? [
                'id' => $variantId,
                'color' => ['name' => $row['color_name'], 'hex' => $row['color_hex']],
                'size' => $row['size'],
                // A deleted variant leaves NULLs here; JavaScript's parseFloat(null) gave NaN -> null in JSON.
                'price' => Fmt::floatOrNull($row['variant_price']),
                'mrp' => Fmt::floatOrNull($row['mrp']),
                'stock' => Fmt::intOrNull($row['stock']),
                'sku' => $row['sku'],
            ] : null,
            'createdAt' => Fmt::date($row['created_at']),
        ];
    }
}
