<?php

namespace App\Controllers;

use App\Http\HttpError;
use App\Http\Request;
use App\Repositories\CategoryRepository;
use App\Support\Db;
use App\Support\Uploads;

final class CategoryController
{
    /** An uploaded image URL (https://.../uploads/x.jpg) or a site path (/images/x.jpg). */
    private const IMAGE_URL = '#^(https?://|/)[^\s"\'<>]+$#iD';

    public static function getAll(Request $req): array
    {
        return [200, CategoryRepository::findAll()];
    }

    public static function getTree(Request $req): array
    {
        return [200, CategoryRepository::findTree()];
    }

    public static function getBySlug(Request $req): array
    {
        $cat = CategoryRepository::findBySlug($req->params['slug']);
        if (!$cat) {
            throw HttpError::notFound('Category');
        }
        return [200, $cat];
    }

    public static function create(Request $req): array
    {
        $d = $req->validated;
        $d['image'] = self::requireImage($d['image'] ?? null);
        self::checkParent($d['parentId'] ?? null, null);
        if (CategoryRepository::slugExists($d['slug'])) {
            throw HttpError::conflict('A category with the slug "' . $d['slug'] . '" already exists. Choose another slug.');
        }
        try {
            return [201, CategoryRepository::create($d)];
        } catch (\PDOException $e) {
            if (Db::isDuplicateKey($e)) {
                throw HttpError::conflict('A category with the slug "' . $d['slug'] . '" already exists. Choose another slug.');
            }
            throw $e;
        }
    }

    public static function update(Request $req): array
    {
        $id = (int) $req->params['id'];
        $existing = self::mustFind($id);
        $d = $req->validated;

        if (array_key_exists('image', $d)) {
            $d['image'] = self::requireImage($d['image']);
        } elseif (empty($existing['image'])) {
            throw HttpError::field('image', 'Please upload an image for this category');
        }
        if (array_key_exists('parentId', $d)) {
            self::checkParent($d['parentId'], $id);
        }

        $updated = CategoryRepository::update($id, $d);
        if (isset($d['image']) && $existing['image'] && $existing['image'] !== $d['image']) {
            Uploads::removeIfUnused($existing['image']); // only files this API uploaded and nothing else uses
        }
        return [200, $updated];
    }

    public static function remove(Request $req): array
    {
        $id = (int) $req->params['id'];
        $existing = self::mustFind($id);
        $children = CategoryRepository::countChildren($id);
        if ($children > 0) {
            throw HttpError::conflict('This category has ' . $children . ($children === 1 ? ' subcategory' : ' subcategories')
                . '. Delete them or move them to another category first.');
        }
        CategoryRepository::remove($id);
        if ($existing['image']) {
            Uploads::removeIfUnused($existing['image']);
        }
        return [204, null];
    }

    /** POST /categories/images (multipart, field "image") -> { url }. Upload first, then save the category with the url. */
    public static function uploadImage(Request $req): array
    {
        $url = Uploads::saveImage('image');
        if ($url === null) {
            throw new HttpError(400, 'NO_FILE', 'No image uploaded');
        }
        return [201, ['url' => $url]];
    }

    // ---- rules ---------------------------------------------------------------

    private static function requireImage($image): string
    {
        $image = is_string($image) ? trim($image) : '';
        if ($image === '') {
            throw HttpError::field('image', 'Please upload an image for this category');
        }
        if (!preg_match(self::IMAGE_URL, $image)) {
            throw HttpError::field('image', 'The category image must be an uploaded image');
        }
        return $image;
    }

    /** Two levels only: a main category, and subcategories directly under it. */
    private static function checkParent($parentId, ?int $selfId): void
    {
        if ($parentId === null) {
            return;
        }
        $parentId = (int) $parentId;
        if ($selfId !== null && $parentId === $selfId) {
            throw HttpError::field('parentId', 'A category cannot be its own parent');
        }
        $parent = CategoryRepository::findById($parentId);
        if (!$parent) {
            throw HttpError::field('parentId', 'The selected parent category does not exist');
        }
        if ($parent['parentId'] !== null) {
            throw HttpError::field('parentId', 'Subcategories can only be added under a main category');
        }
        if ($selfId !== null && CategoryRepository::countChildren($selfId) > 0) {
            throw HttpError::field('parentId', 'This category has subcategories of its own, so it cannot become a subcategory');
        }
    }

    private static function mustFind(int $id): array
    {
        $cat = CategoryRepository::findById($id);
        if (!$cat) {
            throw HttpError::notFound('Category');
        }
        return $cat;
    }
}
