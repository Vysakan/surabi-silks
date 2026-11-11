<?php

namespace App\Repositories;

use App\Support\Db;
use App\Support\Fmt;

final class CategoryRepository
{
    public static function findAll(): array
    {
        return array_map([self::class, 'toCategory'], Db::all('SELECT * FROM categories ORDER BY sort_order, name'));
    }

    public static function findById(int $id): ?array
    {
        $row = Db::one('SELECT * FROM categories WHERE id = ?', [$id]);
        return $row ? self::toCategory($row) : null;
    }

    public static function findBySlug(string $slug): ?array
    {
        $row = Db::one('SELECT * FROM categories WHERE slug = ?', [$slug]);
        if (!$row) {
            return null;
        }
        $cat = self::toCategory($row);
        if (!$cat['parentId']) {
            $subs = Db::all('SELECT * FROM categories WHERE parent_id = ? ORDER BY sort_order, name', [$cat['id']]);
            $cat['subcategories'] = array_map([self::class, 'toCategory'], $subs);
        }
        return $cat;
    }

    public static function slugExists(string $slug): bool
    {
        return (bool) Db::value('SELECT COUNT(*) FROM categories WHERE slug = ?', [$slug]);
    }

    public static function countChildren(int $id): int
    {
        return (int) Db::value('SELECT COUNT(*) FROM categories WHERE parent_id = ?', [$id]);
    }

    public static function findTree(): array
    {
        $all = self::findAll();
        $children = [];
        foreach ($all as $c) {
            if ($c['parentId']) {
                $children[$c['parentId']][] = $c;
            }
        }
        $tree = [];
        foreach ($all as $c) {
            if (!$c['parentId']) {
                $c['subcategories'] = $children[$c['id']] ?? [];
                $tree[] = $c;
            }
        }
        return $tree;
    }

    public static function create(array $d): ?array
    {
        $id = Db::insert(
            'INSERT INTO categories (name, slug, image, description, parent_id, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
            [
                $d['name'], $d['slug'], Fmt::orNull($d['image'] ?? null), Fmt::orNull($d['description'] ?? null),
                Fmt::orNull($d['parentId'] ?? null), $d['sortOrder'] ?? 0,
            ]
        );
        return self::findById($id);
    }

    public static function update(int $id, array $d): ?array
    {
        $map = [
            'name' => 'name', 'image' => 'image', 'description' => 'description',
            'parentId' => 'parent_id', 'sortOrder' => 'sort_order',
        ];
        $fields = [];
        $values = [];
        foreach ($map as $key => $column) {
            if (array_key_exists($key, $d)) {
                $fields[] = $column . ' = ?';
                $values[] = $d[$key];
            }
        }
        if ($fields) {
            $values[] = $id;
            Db::run('UPDATE categories SET ' . implode(', ', $fields) . ' WHERE id = ?', $values);
        }
        return self::findById($id);
    }

    public static function remove(int $id): void
    {
        Db::run('DELETE FROM categories WHERE id = ?', [$id]);
    }

    private static function toCategory(array $row): array
    {
        return [
            'id' => (int) $row['id'],
            'parentId' => Fmt::intOrNull($row['parent_id']),
            'name' => $row['name'],
            'slug' => $row['slug'],
            'image' => $row['image'],
            'description' => $row['description'],
            'sortOrder' => (int) $row['sort_order'],
            'createdAt' => Fmt::date($row['created_at']),
        ];
    }
}
