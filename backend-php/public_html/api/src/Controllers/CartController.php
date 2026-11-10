<?php

namespace App\Controllers;

use App\Http\HttpError;
use App\Http\Request;
use App\Repositories\CartRepository;
use App\Support\Config;
use App\Support\Db;

final class CartController
{
    public static function get(Request $req): array
    {
        $cartId = CartRepository::findOrCreateCart($req->user['id']);
        return [200, self::cart($cartId)];
    }

    public static function addItem(Request $req): array
    {
        $d = $req->validated;
        $variant = self::validateVariant($d['productId'], $d['variantId']);
        $cartId = CartRepository::findOrCreateCart($req->user['id']);

        $existing = CartRepository::findItem($cartId, $d['variantId']);
        $newQty = ($existing ? (int) $existing['quantity'] : 0) + $d['quantity'];
        if ($newQty > (int) $variant['stock']) {
            throw new HttpError(400, 'INSUFFICIENT_STOCK', 'Only ' . (int) $variant['stock'] . ' available');
        }

        if ($existing) {
            CartRepository::setItemQuantity($cartId, $d['variantId'], $newQty);
        } else {
            CartRepository::upsertItem($cartId, $d['productId'], $d['variantId'], $d['quantity']);
        }
        return [201, self::cart($cartId)];
    }

    public static function updateQuantity(Request $req): array
    {
        $variantId = (int) $req->params['variantId'];
        $quantity = $req->validated['quantity'];
        $cartId = CartRepository::findOrCreateCart($req->user['id']);

        if (!CartRepository::findItem($cartId, $variantId)) {
            throw HttpError::notFound('Cart item');
        }
        $stock = Db::value('SELECT stock FROM product_variants WHERE id = ?', [$variantId]);
        if ($stock === false || $stock === null) {
            throw HttpError::notFound('Product variant');
        }
        if ($quantity > (int) $stock) {
            throw new HttpError(400, 'INSUFFICIENT_STOCK', 'Only ' . (int) $stock . ' available');
        }

        CartRepository::setItemQuantity($cartId, $variantId, $quantity);
        return [200, self::cart($cartId)];
    }

    public static function removeItem(Request $req): array
    {
        $cartId = CartRepository::findOrCreateCart($req->user['id']);
        CartRepository::removeItem($cartId, (int) $req->params['variantId']);
        return [200, self::cart($cartId)];
    }

    public static function clear(Request $req): array
    {
        $cartId = CartRepository::findOrCreateCart($req->user['id']);
        CartRepository::clearCart($cartId);
        return [204, null];
    }

    private static function validateVariant(int $productId, int $variantId): array
    {
        $product = Db::one('SELECT id, is_archived FROM products WHERE id = ?', [$productId]);
        if (!$product) {
            throw HttpError::notFound('Product');
        }
        if ((int) $product['is_archived']) {
            throw new HttpError(400, 'PRODUCT_UNAVAILABLE', 'Product is no longer available');
        }
        $variant = Db::one('SELECT id, stock, price FROM product_variants WHERE id = ? AND product_id = ?', [$variantId, $productId]);
        if (!$variant) {
            throw HttpError::notFound('Product variant');
        }
        return $variant;
    }

    private static function cart(int $cartId): array
    {
        $items = CartRepository::getItems($cartId);
        $freeThreshold = (float) Config::get('shipping.free_threshold', 2000);
        $subtotal = 0.0;
        $totalItems = 0;
        foreach ($items as $item) {
            $subtotal += $item['lineTotal'];
            $totalItems += $item['quantity'];
        }
        $shipping = $subtotal >= $freeThreshold ? 0.0 : (float) Config::get('shipping.cost', 99);
        return [
            'items' => $items,
            'totalItems' => $totalItems,
            'subtotal' => $subtotal,
            'shipping' => $shipping,
            'total' => $subtotal + $shipping,
            'freeShippingThreshold' => $freeThreshold,
        ];
    }
}
