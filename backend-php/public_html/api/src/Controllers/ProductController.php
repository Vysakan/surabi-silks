<?php

namespace App\Controllers;

use App\Http\HttpError;
use App\Http\Request;
use App\Repositories\CategoryRepository;
use App\Repositories\ProductRepository;
use App\Repositories\ReviewRepository;
use App\Support\Uploads;

final class ProductController
{
    public static function getAll(Request $req): array
    {
        $q = $req->validated;
        $filters = [];
        foreach (['categoryId', 'subcategoryId'] as $key) {
            if (!empty($q[$key])) {
                $filters[$key] = $q[$key];
            }
        }
        foreach (['priceMin', 'priceMax'] as $key) {
            if (isset($q[$key])) {
                $filters[$key] = $q[$key];
            }
        }
        foreach (['colors', 'fabrics', 'occasions', 'search'] as $key) {
            if (isset($q[$key]) && $q[$key] !== '') {
                $filters[$key] = $q[$key];
            }
        }
        return [200, ProductRepository::findAll($q['page'], $q['limit'], $q['sort'] ?? null, $filters)];
    }

    public static function getById(Request $req): array
    {
        return [200, self::mustFind((int) $req->params['id'])];
    }

    public static function getBySlug(Request $req): array
    {
        $product = ProductRepository::findBySlug($req->params['slug']);
        if (!$product) {
            throw HttpError::notFound('Product');
        }
        return [200, $product];
    }

    public static function search(Request $req): array
    {
        $q = $req->query['q'] ?? '';
        $filters = is_string($q) && $q !== '' ? ['search' => $q] : [];
        return [200, ProductRepository::findAll(1, 50, null, $filters)];
    }

    public static function featured(Request $req): array
    {
        return [200, ProductRepository::findFeatured()];
    }

    public static function newArrivals(Request $req): array
    {
        return [200, ProductRepository::findNewArrivals()];
    }

    public static function bestsellers(Request $req): array
    {
        return [200, ProductRepository::findBestsellers()];
    }

    public static function related(Request $req): array
    {
        $product = self::mustFind((int) $req->params['id']);
        return [200, ProductRepository::findRelated($product['id'], $product['categoryId'])];
    }

    public static function reviews(Request $req): array
    {
        return [200, ReviewRepository::findByProductId((int) $req->params['id'])];
    }

    public static function create(Request $req): array
    {
        $d = $req->validated;
        self::checkCategories($d['categoryId'], $d['subcategoryId'] ?? null);
        if (ProductRepository::findBySlug($d['slug'])) {
            throw HttpError::conflict('Product slug already exists');
        }
        return [201, ProductRepository::create($d)];
    }

    public static function update(Request $req): array
    {
        $id = (int) $req->params['id'];
        $existing = self::mustFind($id);
        $d = $req->validated;

        if (array_key_exists('categoryId', $d) || array_key_exists('subcategoryId', $d)) {
            $categoryId = array_key_exists('categoryId', $d) ? $d['categoryId'] : $existing['categoryId'];
            if (array_key_exists('subcategoryId', $d)) {
                $subcategoryId = $d['subcategoryId'];
            } else {
                // Category changed without a subcategory: keep the old one only if it still belongs.
                $old = $existing['subcategoryId'] ? CategoryRepository::findById($existing['subcategoryId']) : null;
                $subcategoryId = $old && $old['parentId'] === $categoryId ? $old['id'] : null;
                $d['subcategoryId'] = $subcategoryId;
            }
            self::checkCategories($categoryId, $subcategoryId);
        }
        return [200, ProductRepository::update($id, $d)];
    }

    /** The category must be a main category; the subcategory (optional) must sit under it. */
    private static function checkCategories(?int $categoryId, ?int $subcategoryId): void
    {
        if ($categoryId === null) {
            throw HttpError::field('categoryId', 'Please choose a category');
        }
        $cat = CategoryRepository::findById($categoryId);
        if (!$cat) {
            throw HttpError::field('categoryId', 'The selected category does not exist');
        }
        if ($cat['parentId'] !== null) {
            throw HttpError::field('categoryId', 'Choose a main category here, and pick the subcategory in the Subcategory field');
        }
        if ($subcategoryId === null) {
            return;
        }
        $sub = CategoryRepository::findById($subcategoryId);
        if (!$sub) {
            throw HttpError::field('subcategoryId', 'The selected subcategory does not exist');
        }
        if ($sub['parentId'] !== $categoryId) {
            throw HttpError::field('subcategoryId', 'The selected subcategory does not belong to "' . $cat['name'] . '"');
        }
    }

    /** DELETE archives the product (it stays in past orders). */
    public static function remove(Request $req): array
    {
        $id = (int) $req->params['id'];
        self::mustFind($id);
        ProductRepository::archive($id);
        return [204, null];
    }

    /** multipart/form-data: image (file), variantId?, sortOrder? */
    public static function uploadImage(Request $req): array
    {
        $url = Uploads::saveImage('image');
        if ($url === null) {
            throw new HttpError(400, 'NO_FILE', 'No image uploaded');
        }
        $productId = (int) $req->params['id'];
        $variantId = !empty($_POST['variantId']) ? (int) $_POST['variantId'] : null;
        $sortOrder = (int) ($_POST['sortOrder'] ?? 0);
        try {
            $imageId = ProductRepository::addImage($productId, $variantId, $url, $sortOrder);
        } catch (\Throwable $e) {
            Uploads::remove($url); // don't leave an orphaned file behind
            throw $e;
        }
        return [201, ['id' => $imageId, 'url' => $url]];
    }

    public static function removeImage(Request $req): array
    {
        $url = ProductRepository::removeImage((int) $req->params['imageId']);
        if ($url !== null) {
            Uploads::removeIfUnused($url);
        }
        return [204, null];
    }

    private static function mustFind(int $id): array
    {
        $product = ProductRepository::findById($id);
        if (!$product) {
            throw HttpError::notFound('Product');
        }
        return $product;
    }
}
