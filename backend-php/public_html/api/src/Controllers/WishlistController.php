<?php

namespace App\Controllers;

use App\Http\HttpError;
use App\Http\Request;
use App\Repositories\WishlistRepository;
use App\Support\Db;

final class WishlistController
{
    public static function getAll(Request $req): array
    {
        return [200, WishlistRepository::findByUser($req->user['id'])];
    }

    public static function add(Request $req): array
    {
        $productId = $req->validated['productId'];
        $variantId = $req->validated['variantId'] ?? null;

        $product = Db::one('SELECT id, is_archived FROM products WHERE id = ?', [$productId]);
        if (!$product) {
            throw HttpError::notFound('Product');
        }
        if ((int) $product['is_archived']) {
            throw new HttpError(400, 'PRODUCT_UNAVAILABLE', 'Product is no longer available');
        }
        if ($variantId) {
            $variant = Db::one('SELECT id FROM product_variants WHERE id = ? AND product_id = ?', [$variantId, $productId]);
            if (!$variant) {
                throw HttpError::notFound('Product variant');
            }
        }

        WishlistRepository::add($req->user['id'], $productId, $variantId);
        return [201, WishlistRepository::findByUser($req->user['id'])];
    }

    public static function remove(Request $req): array
    {
        WishlistRepository::remove($req->user['id'], (int) $req->params['productId']);
        return [204, null];
    }
}
