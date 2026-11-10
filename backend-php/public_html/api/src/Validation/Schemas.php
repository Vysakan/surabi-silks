<?php

namespace App\Validation;

/** The Node backend's Zod schemas (src/schemas/*.js), one method each. */
final class Schemas
{
    private const SLUG = '/^[a-z0-9]+(?:-[a-z0-9]+)*$/D';
    private const HEX = '/^#[0-9a-fA-F]{6}$/D';
    private const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];

    // auth.js
    public static function register(): Rule
    {
        return Rule::obj([
            'name' => Rule::str()->min(2)->max(255),
            'email' => Rule::str()->email()->max(255),
            'phone' => Rule::str()->min(10)->max(20)->optional(),
            'password' => Rule::str()->min(8)->max(128),
        ]);
    }

    public static function login(): Rule
    {
        return Rule::obj([
            'email' => Rule::str()->email(),
            'password' => Rule::str()->min(1),
        ]);
    }

    // address.js
    public static function address(): Rule
    {
        return Rule::obj([
            'label' => Rule::str()->max(50)->optional()->withDefault(''),
            'fullName' => Rule::str()->min(1)->max(255),
            'phone' => Rule::str()->max(20)->optional()->withDefault(''),
            'line1' => Rule::str()->min(1)->max(500),
            'line2' => Rule::str()->max(500)->optional()->withDefault(''),
            'city' => Rule::str()->min(1)->max(100),
            'state' => Rule::str()->min(1)->max(100),
            'pincode' => Rule::str()->min(1)->max(10),
            'isDefault' => Rule::bool()->optional()->withDefault(false),
        ]);
    }

    // cart.js
    public static function addCartItem(): Rule
    {
        return Rule::obj([
            'productId' => Rule::num()->integer()->positive(),
            'variantId' => Rule::num()->integer()->positive(),
            'quantity' => Rule::num()->integer()->min(1)->max(100)->withDefault(1),
        ]);
    }

    public static function updateCartQuantity(): Rule
    {
        return Rule::obj([
            'quantity' => Rule::num()->integer()->min(1)->max(100),
        ]);
    }

    // category.js
    public static function createCategory(): Rule
    {
        return Rule::obj([
            'name' => Rule::str()->min(1)->max(255),
            'slug' => Rule::str()->min(1)->max(255)->regex(self::SLUG),
            'image' => Rule::str()->max(500)->optional(),
            'description' => Rule::str()->optional(),
            'parentId' => Rule::num()->integer()->positive()->nullable()->withDefault(null),
            'sortOrder' => Rule::num()->integer()->min(0)->withDefault(0),
        ]);
    }

    public static function updateCategory(): Rule
    {
        return self::createCategory()->partial()->omit(['slug']);
    }

    // order.js
    private static function orderAddress(): Rule
    {
        return Rule::obj([
            'fullName' => Rule::str()->trimmed()->min(1)->max(255),
            'phone' => Rule::str()->trimmed()->min(1)->max(30),
            'line1' => Rule::str()->trimmed()->min(1)->max(500),
            'line2' => Rule::str()->trimmed()->max(500)->optional()->withDefault(''),
            'city' => Rule::str()->trimmed()->min(1)->max(100),
            'state' => Rule::str()->trimmed()->min(1)->max(100),
            'pincode' => Rule::str()->trimmed()->min(1)->max(10),
        ]);
    }

    public static function createOrder(): Rule
    {
        return Rule::obj([
            'items' => Rule::listOf(Rule::obj([
                'productId' => Rule::coerceNum()->integer()->positive(),
                'variantId' => Rule::coerceNum()->integer()->positive(),
                'quantity' => Rule::num()->integer()->min(1)->max(100),
            ]))->min(1)->max(100),
            'shippingAddress' => self::orderAddress(),
            'paymentMethod' => Rule::oneOf(['upi', 'card', 'cod']),
        ]);
    }

    public static function orderQuery(): Rule
    {
        return Rule::obj([
            'page' => Rule::coerceNum()->integer()->min(1)->withDefault(1),
            'limit' => Rule::coerceNum()->integer()->min(1)->max(100)->withDefault(20),
            'status' => Rule::oneOf(self::ORDER_STATUSES)->optional(),
        ]);
    }

    public static function orderStatus(): Rule
    {
        return Rule::obj([
            'status' => Rule::oneOf(self::ORDER_STATUSES),
        ]);
    }

    // product.js
    private static function variant(): Rule
    {
        return Rule::obj([
            'colorName' => Rule::str()->max(100),
            'colorHex' => Rule::str()->regex(self::HEX),
            'size' => Rule::str()->max(255),
            'design' => Rule::str()->max(255)->optional(),
            'price' => Rule::num()->positive(),
            'mrp' => Rule::num()->positive()->optional(),
            'stock' => Rule::num()->integer()->min(0)->withDefault(0),
            'sku' => Rule::str()->min(1)->max(100),
        ]);
    }

    public static function createProduct(): Rule
    {
        return Rule::obj([
            'name' => Rule::str()->min(1)->max(255),
            'slug' => Rule::str()->min(1)->max(255)->regex(self::SLUG),
            'categoryId' => Rule::num()->integer()->positive(),
            'subcategoryId' => Rule::num()->integer()->positive()->optional(),
            'description' => Rule::str()->optional(),
            'shortDescription' => Rule::str()->max(500)->optional(),
            'sellingUnit' => Rule::oneOf(['piece', 'metre'])->withDefault('piece'),
            'basePrice' => Rule::num()->positive(),
            'tags' => Rule::listOf(Rule::str())->withDefault([]),
            'fabric' => Rule::str()->max(100)->optional(),
            'weave' => Rule::str()->max(100)->optional(),
            'weight' => Rule::str()->max(50)->optional(),
            'careInstructions' => Rule::str()->optional(),
            'occasions' => Rule::listOf(Rule::str())->withDefault([]),
            'isFeatured' => Rule::bool()->withDefault(false),
            'isNewArrival' => Rule::bool()->withDefault(false),
            'isBestseller' => Rule::bool()->withDefault(false),
            'variants' => Rule::listOf(self::variant())->min(1),
        ]);
    }

    public static function updateProduct(): Rule
    {
        return self::createProduct()->partial()->omit(['slug']);
    }

    public static function productQuery(): Rule
    {
        return Rule::obj([
            'page' => Rule::coerceNum()->integer()->positive()->withDefault(1),
            'limit' => Rule::coerceNum()->integer()->min(1)->max(100)->withDefault(12),
            'sort' => Rule::oneOf(['price-asc', 'price-desc', 'newest', 'rating', 'name-asc', 'name-desc'])->optional(),
            'categoryId' => Rule::coerceNum()->integer()->positive()->optional(),
            'subcategoryId' => Rule::coerceNum()->integer()->positive()->optional(),
            'priceMin' => Rule::coerceNum()->min(0)->optional(),
            'priceMax' => Rule::coerceNum()->min(0)->optional(),
            'colors' => Rule::str()->optional(),
            'fabrics' => Rule::str()->optional(),
            'occasions' => Rule::str()->optional(),
            'search' => Rule::str()->max(200)->optional(),
        ]);
    }

    // review.js
    public static function createReview(): Rule
    {
        return Rule::obj([
            'productId' => Rule::coerceNum()->integer()->positive(),
            'rating' => Rule::num()->integer()->min(1)->max(5),
            'comment' => Rule::str()->trimmed()->min(5)->max(5000),
        ]);
    }

    // wishlist.js
    public static function addWishlist(): Rule
    {
        return Rule::obj([
            'productId' => Rule::num()->integer()->positive(),
            'variantId' => Rule::num()->integer()->positive()->optional(),
        ]);
    }
}
