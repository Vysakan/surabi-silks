<?php

namespace App\Repositories;

use App\Support\Db;
use App\Support\Fmt;
use App\Support\Uploads;

final class ProductRepository
{
    public static function findAll(int $page, int $limit, ?string $sort, array $filters): array
    {
        $where = 'WHERE p.is_archived = 0';
        $params = [];

        if (!empty($filters['categoryId'])) {
            $where .= ' AND p.category_id = ?';
            $params[] = $filters['categoryId'];
        }
        if (!empty($filters['subcategoryId'])) {
            $where .= ' AND p.subcategory_id = ?';
            $params[] = $filters['subcategoryId'];
        }
        if (isset($filters['priceMin'])) {
            $where .= ' AND p.base_price >= ?';
            $params[] = $filters['priceMin'];
        }
        if (isset($filters['priceMax'])) {
            $where .= ' AND p.base_price <= ?';
            $params[] = $filters['priceMax'];
        }
        if (self::filled($filters, 'search')) {
            $q = '%' . $filters['search'] . '%';
            $where .= " AND (p.name LIKE ? OR p.short_description LIKE ? OR JSON_SEARCH(p.tags, 'one', ?) IS NOT NULL)";
            array_push($params, $q, $q, $q);
        }
        if (self::filled($filters, 'fabrics')) {
            $list = explode(',', $filters['fabrics']);
            $where .= ' AND p.fabric IN (' . Db::marks(count($list)) . ')';
            array_push($params, ...$list);
        }
        if (self::filled($filters, 'occasions')) {
            $list = explode(',', $filters['occasions']);
            $where .= ' AND (' . implode(' OR ', array_fill(0, count($list), 'JSON_CONTAINS(p.occasions, ?)')) . ')';
            foreach ($list as $o) {
                $params[] = Fmt::json($o);
            }
        }
        if (self::filled($filters, 'colors')) {
            $list = explode(',', $filters['colors']);
            $where .= ' AND EXISTS (SELECT 1 FROM product_variants pv WHERE pv.product_id = p.id AND pv.color_name IN ('
                . Db::marks(count($list)) . '))';
            array_push($params, ...$list);
        }

        switch ($sort) {
            case 'price-asc':
                $orderBy = 'ORDER BY p.base_price ASC';
                break;
            case 'price-desc':
                $orderBy = 'ORDER BY p.base_price DESC';
                break;
            case 'rating':
                $orderBy = 'ORDER BY p.rating DESC';
                break;
            case 'name-asc':
                $orderBy = 'ORDER BY p.name ASC';
                break;
            case 'name-desc':
                $orderBy = 'ORDER BY p.name DESC';
                break;
            default: // 'newest' and no sort
                $orderBy = 'ORDER BY p.created_at DESC';
        }

        $total = (int) Db::value("SELECT COUNT(*) AS total FROM products p $where", $params);
        $rows = Db::all(
            "SELECT p.* FROM products p $where $orderBy LIMIT ? OFFSET ?",
            array_merge($params, [$limit, ($page - 1) * $limit])
        );

        return [
            'items' => self::hydrate($rows),
            'total' => $total,
            'totalPages' => (int) ceil($total / $limit),
            'page' => $page,
        ];
    }

    public static function findById(int $id): ?array
    {
        $row = Db::one('SELECT * FROM products WHERE id = ?', [$id]);
        return $row ? self::hydrate([$row])[0] : null;
    }

    public static function findBySlug(string $slug): ?array
    {
        $row = Db::one('SELECT * FROM products WHERE slug = ?', [$slug]);
        return $row ? self::hydrate([$row])[0] : null;
    }

    public static function findFeatured(): array
    {
        return self::hydrate(Db::all('SELECT * FROM products WHERE is_featured = 1 AND is_archived = 0 LIMIT 12'));
    }

    public static function findNewArrivals(): array
    {
        return self::hydrate(Db::all('SELECT * FROM products WHERE is_new_arrival = 1 AND is_archived = 0 ORDER BY created_at DESC LIMIT 12'));
    }

    public static function findBestsellers(): array
    {
        return self::hydrate(Db::all('SELECT * FROM products WHERE is_bestseller = 1 AND is_archived = 0 LIMIT 12'));
    }

    public static function findRelated(int $productId, ?int $categoryId, int $limit = 4): array
    {
        return self::hydrate(Db::all(
            'SELECT * FROM products WHERE id != ? AND category_id = ? AND is_archived = 0 LIMIT ?',
            [$productId, $categoryId, $limit]
        ));
    }

    public static function create(array $d): ?array
    {
        $productId = Db::insert(
            'INSERT INTO products (name, slug, category_id, subcategory_id, description, short_description, selling_unit, base_price, tags, fabric, weave, weight, care_instructions, occasions, is_featured, is_new_arrival, is_bestseller)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                $d['name'], $d['slug'], $d['categoryId'], Fmt::orNull($d['subcategoryId'] ?? null),
                Fmt::orNull($d['description'] ?? null), Fmt::orNull($d['shortDescription'] ?? null),
                $d['sellingUnit'], $d['basePrice'], Fmt::json($d['tags'] ?? []),
                Fmt::orNull($d['fabric'] ?? null), Fmt::orNull($d['weave'] ?? null), Fmt::orNull($d['weight'] ?? null),
                Fmt::orNull($d['careInstructions'] ?? null), Fmt::json($d['occasions'] ?? []),
                !empty($d['isFeatured']) ? 1 : 0, !empty($d['isNewArrival']) ? 1 : 0, !empty($d['isBestseller']) ? 1 : 0,
            ]
        );
        foreach ($d['variants'] ?? [] as $v) {
            self::createVariant($productId, $v);
        }
        return self::findById($productId);
    }

    public static function update(int $id, array $d): ?array
    {
        $map = [
            'name' => 'name', 'categoryId' => 'category_id', 'subcategoryId' => 'subcategory_id',
            'description' => 'description', 'shortDescription' => 'short_description', 'sellingUnit' => 'selling_unit',
            'basePrice' => 'base_price', 'fabric' => 'fabric', 'weave' => 'weave', 'weight' => 'weight',
            'careInstructions' => 'care_instructions', 'isFeatured' => 'is_featured',
            'isNewArrival' => 'is_new_arrival', 'isBestseller' => 'is_bestseller',
        ];
        $fields = [];
        $values = [];
        foreach ($map as $key => $column) {
            if (array_key_exists($key, $d)) {
                $fields[] = $column . ' = ?';
                $values[] = is_bool($d[$key]) ? ($d[$key] ? 1 : 0) : $d[$key];
            }
        }
        if (array_key_exists('tags', $d)) {
            $fields[] = 'tags = ?';
            $values[] = Fmt::json($d['tags']);
        }
        if (array_key_exists('occasions', $d)) {
            $fields[] = 'occasions = ?';
            $values[] = Fmt::json($d['occasions']);
        }
        if ($fields) {
            $values[] = $id;
            Db::run('UPDATE products SET ' . implode(', ', $fields) . ' WHERE id = ?', $values);
        }

        $unused = [];
        if (!empty($d['variants'])) {
            // Same as the Node backend: replace all variants (their images are removed by ON DELETE CASCADE).
            // The website sends each variant's existing image URLs in "images", so they are re-attached.
            $sendsImages = false;
            $kept = [];
            foreach ($d['variants'] as $v) {
                if (array_key_exists('images', $v)) {
                    $sendsImages = true;
                    foreach ($v['images'] as $url) {
                        $kept[$url] = true;
                    }
                }
            }
            $old = $sendsImages
                ? array_column(Db::all('SELECT url FROM product_images WHERE product_id = ? AND variant_id IS NOT NULL', [$id]), 'url')
                : [];

            Db::run('DELETE FROM product_variants WHERE product_id = ?', [$id]);
            foreach ($d['variants'] as $v) {
                self::createVariant($id, $v);
            }
            foreach (array_unique($old) as $url) {
                if (!isset($kept[$url])) {
                    $unused[] = $url;
                }
            }
        }
        // Delete image files nothing uses any more (only files this API uploaded).
        foreach ($unused as $url) {
            Uploads::removeIfUnused($url);
        }
        return self::findById($id);
    }

    public static function archive(int $id): void
    {
        Db::run('UPDATE products SET is_archived = 1 WHERE id = ?', [$id]);
    }

    public static function addImage(int $productId, ?int $variantId, string $url, int $sortOrder = 0): int
    {
        return Db::insert(
            'INSERT INTO product_images (product_id, variant_id, url, sort_order) VALUES (?, ?, ?, ?)',
            [$productId, $variantId ?: null, $url, $sortOrder]
        );
    }

    /** Deletes the image row and returns its URL (or null). */
    public static function removeImage(int $imageId): ?string
    {
        $url = Db::value('SELECT url FROM product_images WHERE id = ?', [$imageId]);
        Db::run('DELETE FROM product_images WHERE id = ?', [$imageId]);
        return $url === false || $url === null ? null : (string) $url;
    }

    private static function createVariant(int $productId, array $v): int
    {
        $variantId = Db::insert(
            'INSERT INTO product_variants (product_id, sku, color_name, color_hex, size, design, price, mrp, stock)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                $productId, $v['sku'], $v['colorName'], $v['colorHex'], $v['size'], Fmt::orNull($v['design'] ?? null),
                $v['price'], Fmt::orNull($v['mrp'] ?? null), $v['stock'] ?? 0,
            ]
        );
        foreach (array_values($v['images'] ?? []) as $sortOrder => $url) {
            self::addImage($productId, $variantId, $url, $sortOrder);
        }
        return $variantId;
    }

    /** Maps product rows and attaches variants + images (two queries for the whole list). */
    private static function hydrate(array $rows): array
    {
        if (!$rows) {
            return [];
        }
        $products = array_map([self::class, 'toProduct'], $rows);
        $ids = array_column($products, 'id');
        $marks = Db::marks(count($ids));

        $variants = Db::all("SELECT * FROM product_variants WHERE product_id IN ($marks) ORDER BY id", $ids);
        $images = Db::all("SELECT * FROM product_images WHERE product_id IN ($marks) ORDER BY sort_order", $ids);

        $imageMap = [];
        foreach ($images as $img) {
            $key = $img['variant_id'] ? 'v' . $img['variant_id'] : 'p' . $img['product_id'];
            $imageMap[$key][] = $img['url'];
        }
        $variantMap = [];
        foreach ($variants as $v) {
            $variantMap[(int) $v['product_id']][] = self::toVariant($v);
        }

        foreach ($products as $i => $p) {
            $list = $variantMap[$p['id']] ?? [];
            foreach ($list as $j => $v) {
                $list[$j]['images'] = $imageMap['v' . $v['id']] ?? $imageMap['p' . $p['id']] ?? [];
            }
            $products[$i]['variants'] = $list;
        }
        return $products;
    }

    private static function filled(array $filters, string $key): bool
    {
        return isset($filters[$key]) && $filters[$key] !== '';
    }

    private static function toProduct(array $row): array
    {
        return [
            'id' => (int) $row['id'],
            'name' => $row['name'],
            'slug' => $row['slug'],
            'categoryId' => Fmt::intOrNull($row['category_id']),
            'subcategoryId' => Fmt::intOrNull($row['subcategory_id']),
            'description' => $row['description'],
            'shortDescription' => $row['short_description'],
            'sellingUnit' => $row['selling_unit'],
            'basePrice' => (float) $row['base_price'],
            'tags' => Fmt::jsonDecodeArray($row['tags']),
            'fabric' => $row['fabric'],
            'weave' => $row['weave'],
            'weight' => $row['weight'],
            'careInstructions' => $row['care_instructions'],
            'occasion' => Fmt::jsonDecodeArray($row['occasions']),
            'rating' => (float) $row['rating'],
            'reviewCount' => (int) $row['review_count'],
            'isFeatured' => (bool) $row['is_featured'],
            'isNewArrival' => (bool) $row['is_new_arrival'],
            'isBestseller' => (bool) $row['is_bestseller'],
            'isArchived' => (bool) $row['is_archived'],
            'createdAt' => Fmt::date($row['created_at']),
            'updatedAt' => Fmt::date($row['updated_at']),
        ];
    }

    private static function toVariant(array $row): array
    {
        return [
            'id' => (int) $row['id'],
            'productId' => (int) $row['product_id'],
            'color' => ['name' => $row['color_name'], 'hex' => $row['color_hex']],
            'size' => $row['size'],
            'design' => $row['design'],
            'price' => (float) $row['price'],
            'mrp' => Fmt::floatOrNull($row['mrp']),
            'stock' => (int) $row['stock'],
            'sku' => $row['sku'],
            'images' => [],
        ];
    }
}
