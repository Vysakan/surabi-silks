<?php

namespace App\Repositories;

use App\Support\Db;
use App\Support\Fmt;

/** Home-page reels: short videos with a cover picture, optionally linked to a product. */
final class ReelRepository
{
    private const SELECT = 'SELECT r.*, p.name AS product_name, p.slug AS product_slug,
            COALESCE((SELECT MIN(v.price) FROM product_variants v WHERE v.product_id = p.id), p.base_price) AS product_price,
            (SELECT pi.url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.sort_order, pi.id LIMIT 1) AS product_image
        FROM reels r
        LEFT JOIN products p ON p.id = r.product_id AND p.is_archived = 0';

    /** Shown first: lowest display order, then the newest. */
    private const ORDER = ' ORDER BY r.sort_order, r.id DESC';

    public static function findAll(bool $activeOnly, ?int $limit = null): array
    {
        $sql = self::SELECT . ($activeOnly ? ' WHERE r.is_active = 1' : '') . self::ORDER;
        $params = [];
        if ($limit !== null) {
            $sql .= ' LIMIT ?';
            $params[] = $limit;
        }
        return array_map([self::class, 'toReel'], Db::all($sql, $params));
    }

    public static function findById(int $id): ?array
    {
        $row = Db::one(self::SELECT . ' WHERE r.id = ?', [$id]);
        return $row ? self::toReel($row) : null;
    }

    public static function create(array $d): ?array
    {
        $id = Db::insert(
            'INSERT INTO reels (title, video_url, cover_url, product_id, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?)',
            [
                Fmt::orNull($d['title'] ?? null), $d['videoUrl'], $d['coverUrl'],
                Fmt::orNull($d['productId'] ?? null), $d['sortOrder'] ?? 0, !empty($d['isActive']),
            ]
        );
        return self::findById($id);
    }

    public static function update(int $id, array $d): ?array
    {
        $map = [
            'title' => 'title', 'videoUrl' => 'video_url', 'coverUrl' => 'cover_url',
            'productId' => 'product_id', 'sortOrder' => 'sort_order', 'isActive' => 'is_active',
        ];
        $fields = [];
        $values = [];
        foreach ($map as $key => $column) {
            if (array_key_exists($key, $d)) {
                $fields[] = $column . ' = ?';
                $value = $d[$key];
                if ($key === 'title') {
                    $value = Fmt::orNull($value);
                } elseif ($key === 'isActive') {
                    $value = (bool) $value;
                }
                $values[] = $value;
            }
        }
        if ($fields) {
            $values[] = $id;
            Db::run('UPDATE reels SET ' . implode(', ', $fields) . ' WHERE id = ?', $values);
        }
        return self::findById($id);
    }

    public static function remove(int $id): void
    {
        Db::run('DELETE FROM reels WHERE id = ?', [$id]);
    }

    private static function toReel(array $row): array
    {
        $product = null;
        if ($row['product_id'] !== null && $row['product_slug'] !== null) {
            $product = [
                'id' => (int) $row['product_id'],
                'name' => $row['product_name'],
                'slug' => $row['product_slug'],
                'price' => Fmt::floatOrNull($row['product_price']),
                'image' => $row['product_image'],
            ];
        }
        return [
            'id' => (int) $row['id'],
            'title' => $row['title'],
            'videoUrl' => $row['video_url'],
            'coverUrl' => $row['cover_url'],
            'productId' => Fmt::intOrNull($row['product_id']),
            'product' => $product,
            'sortOrder' => (int) $row['sort_order'],
            'isActive' => (bool) $row['is_active'],
            'createdAt' => Fmt::date($row['created_at']),
            'updatedAt' => Fmt::date($row['updated_at']),
        ];
    }
}
