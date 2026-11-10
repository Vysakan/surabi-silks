<?php
/**
 * Surabi Silks API (PHP) - front controller.
 * Every request to /api/v1/... is routed here by public_html/.htaccess.
 *
 * Local development:  cd backend-php/public_html && php -S localhost:3000 api/index.php
 */

if (PHP_SAPI === 'cli-server') {
    // Built-in dev server: let it serve static files such as /uploads/... directly.
    $devPath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
    if (strpos($devPath, '/api/') !== 0) {
        return false;
    }
}

require __DIR__ . '/src/bootstrap.php';

\App\App::run();
