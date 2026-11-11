<?php

namespace App;

use App\Controllers\AddressController;
use App\Controllers\AuthController;
use App\Controllers\AdminManagementController;
use App\Controllers\CartController;
use App\Controllers\CategoryController;
use App\Controllers\OrderController;
use App\Controllers\ProductController;
use App\Controllers\ReviewController;
use App\Controllers\WishlistController;
use App\Http\Request;
use App\Http\Router;
use App\Support\Auth;
use App\Support\Config;
use App\Support\RateLimiter;
use App\Validation\Rule;
use App\Validation\Schemas as S;

/** Every endpoint of the Node backend, under /api/v1. */
final class Routes
{
    public static function build(): Router
    {
        $r = new Router();

        $auth = [Auth::class, 'authenticate'];
        $admin = Auth::requireRole('admin', 'root_admin');
        $rootAdmin = Auth::requireRole('root_admin');
        $body = function (Rule $schema) {
            return function (Request $req) use ($schema) {
                $req->validated = $schema->parse($req->body());
            };
        };
        $query = function (Rule $schema) {
            return function (Request $req) use ($schema) {
                $req->validated = $schema->parse($req->query);
            };
        };
        $authLimit = function (Request $req) {
            [$max, $window] = Config::get('rate_limit.auth', [20, 900]);
            RateLimiter::hit('auth', (int) $max, (int) $window, $req->ip());
        };

        // Health
        $r->get('/health', [], function () {
            return [200, ['status' => 'ok', 'timestamp' => gmdate('Y-m-d\TH:i:s.000\Z')]];
        });

        // Auth
        $r->post('/auth/register', [$authLimit, $body(S::register())], [AuthController::class, 'register']);
        $r->post('/auth/login', [$authLimit, $body(S::login())], [AuthController::class, 'login']);
        $r->post('/auth/forgot-password', [$authLimit, $body(S::forgotPassword())], [AuthController::class, 'forgotPassword']);
        $r->post('/auth/reset-password', [$authLimit, $body(S::resetPassword())], [AuthController::class, 'resetPassword']);
        $r->put('/auth/password', [$auth, $body(S::changePassword())], [AuthController::class, 'changePassword']);
        $r->post('/auth/logout', [$auth], [AuthController::class, 'logout']);
        $r->get('/auth/me', [$auth], [AuthController::class, 'me']);
        $r->get('/admin/admins', [$auth, $rootAdmin], [AdminManagementController::class, 'list']);
        $r->post('/admin/admins', [$auth, $rootAdmin, $body(S::createAdmin())], [AdminManagementController::class, 'create']);

        // Products
        $r->get('/products', [$query(S::productQuery())], [ProductController::class, 'getAll']);
        $r->get('/products/featured', [], [ProductController::class, 'featured']);
        $r->get('/products/new-arrivals', [], [ProductController::class, 'newArrivals']);
        $r->get('/products/bestsellers', [], [ProductController::class, 'bestsellers']);
        $r->get('/products/search', [], [ProductController::class, 'search']);
        $r->get('/products/slug/:slug', [], [ProductController::class, 'getBySlug']);
        $r->get('/products/:id/reviews', [], [ProductController::class, 'reviews']);
        $r->get('/products/:id', [], [ProductController::class, 'getById']);
        $r->get('/products/:id/related', [], [ProductController::class, 'related']);
        $r->post('/products', [$auth, $admin, $body(S::createProduct())], [ProductController::class, 'create']);
        $r->put('/products/:id', [$auth, $admin, $body(S::updateProduct())], [ProductController::class, 'update']);
        $r->delete('/products/:id', [$auth, $admin], [ProductController::class, 'remove']);
        $r->post('/products/:id/images', [$auth, $admin], [ProductController::class, 'uploadImage']);
        $r->delete('/products/:id/images/:imageId', [$auth, $admin], [ProductController::class, 'removeImage']);

        // Categories
        $r->get('/categories', [], [CategoryController::class, 'getAll']);
        $r->get('/categories/tree', [], [CategoryController::class, 'getTree']);
        $r->get('/categories/slug/:slug', [], [CategoryController::class, 'getBySlug']);
        $r->post('/categories', [$auth, $admin, $body(S::createCategory())], [CategoryController::class, 'create']);
        $r->put('/categories/:id', [$auth, $admin, $body(S::updateCategory())], [CategoryController::class, 'update']);
        $r->delete('/categories/:id', [$auth, $admin], [CategoryController::class, 'remove']);

        // Wishlist
        $r->get('/wishlist', [$auth], [WishlistController::class, 'getAll']);
        $r->post('/wishlist', [$auth, $body(S::addWishlist())], [WishlistController::class, 'add']);
        $r->delete('/wishlist/:productId', [$auth], [WishlistController::class, 'remove']);

        // Cart
        $r->get('/cart', [$auth], [CartController::class, 'get']);
        $r->post('/cart/items', [$auth, $body(S::addCartItem())], [CartController::class, 'addItem']);
        $r->patch('/cart/items/:variantId', [$auth, $body(S::updateCartQuantity())], [CartController::class, 'updateQuantity']);
        $r->delete('/cart/items/:variantId', [$auth], [CartController::class, 'removeItem']);
        $r->delete('/cart', [$auth], [CartController::class, 'clear']);

        // Orders
        $r->get('/orders', [$auth, $query(S::orderQuery())], [OrderController::class, 'getAll']);
        $r->get('/orders/:id', [$auth], [OrderController::class, 'getById']);
        $r->post('/orders', [$auth, $body(S::createOrder())], [OrderController::class, 'create']);
        $r->patch('/orders/:id/status', [$auth, $admin, $body(S::orderStatus())], [OrderController::class, 'updateStatus']);

        // Reviews
        $r->post('/reviews', [$auth, $body(S::createReview())], [ReviewController::class, 'create']);

        // Customer addresses
        $r->get('/customers/:customerId/addresses', [$auth], [AddressController::class, 'getAll']);
        $r->post('/customers/:customerId/addresses', [$auth, $body(S::address())], [AddressController::class, 'create']);
        $r->put('/customers/:customerId/addresses/:addressId', [$auth, $body(S::address())], [AddressController::class, 'update']);
        $r->delete('/customers/:customerId/addresses/:addressId', [$auth], [AddressController::class, 'remove']);

        return $r;
    }
}
