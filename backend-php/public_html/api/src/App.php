<?php

namespace App;

use App\Http\HttpError;
use App\Http\Request;
use App\Http\Response;
use App\Support\Config;
use App\Support\RateLimiter;

final class App
{
    public static function run(): void
    {
        try {
            header_remove('X-Powered-By');
            self::securityHeaders();

            $req = Request::fromGlobals();

            if (self::cors($req)) {
                return; // CORS preflight answered
            }
            if (preg_match('#^/(auth|admin)(/|$)#', $req->path)) {
                header('Cache-Control: no-store'); // account data must never be cached
            }
            self::checkOrigin($req);

            [$max, $window] = Config::get('rate_limit.api', [200, 900]);
            RateLimiter::hit('api', (int) $max, (int) $window, $req->ip());

            [$status, $data] = Routes::build()->dispatch($req);

            if ($status === 204) {
                http_response_code(204);
                return;
            }
            Response::json($status, $data);
        } catch (HttpError $e) {
            $body = ['error' => ['code' => $e->errorCode, 'message' => $e->getMessage()]];
            if ($e->details !== null) {
                $body['error']['details'] = $e->details;
            }
            Response::json($e->status, $body);
        } catch (\Throwable $e) {
            error_log('[unhandled] ' . $e);
            Response::json(500, ['error' => [
                'code' => 'INTERNAL_ERROR',
                'message' => Config::isProd() ? 'Internal server error' : $e->getMessage(),
            ]]);
        }
    }

    /** Same headers helmet() set on the Node backend. */
    private static function securityHeaders(): void
    {
        header("Content-Security-Policy: default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests");
        header('Cross-Origin-Opener-Policy: same-origin');
        header('Cross-Origin-Resource-Policy: same-origin');
        header('Origin-Agent-Cluster: ?1');
        header('Referrer-Policy: no-referrer');
        header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
        header('X-Content-Type-Options: nosniff');
        header('X-DNS-Prefetch-Control: off');
        header('X-Download-Options: noopen');
        header('X-Frame-Options: SAMEORIGIN');
        header('X-Permitted-Cross-Domain-Policies: none');
        header('X-XSS-Protection: 0');
    }

    /**
     * CSRF defence in depth (the session cookie is already SameSite): a browser request that changes
     * something must come from the website itself. Requests without an Origin header (curl, the smoke
     * test, same-origin GETs) are not affected.
     */
    private static function checkOrigin(Request $req): void
    {
        if (in_array($req->method, ['GET', 'HEAD', 'OPTIONS'], true)) {
            return;
        }
        $origin = $req->header('origin');
        if ($origin === null || $origin === '') {
            return;
        }
        $allowed = [];
        foreach ([Config::get('cors.origin', ''), Config::get('app.frontend_url', '')] as $value) {
            $value = rtrim(trim((string) $value), '/');
            if ($value !== '') {
                $allowed[] = strtolower($value);
            }
        }
        if (!$allowed) {
            return; // website and API on the same address: nothing to compare against
        }
        $origin = strtolower(rtrim($origin, '/'));
        // The API's own address (website and API on one domain). Browsers set Host themselves.
        $parts = parse_url($origin);
        $originHost = ($parts['host'] ?? '') . (isset($parts['port']) ? ':' . $parts['port'] : '');
        if ($originHost !== '' && $originHost === strtolower((string) ($_SERVER['HTTP_HOST'] ?? ''))) {
            return;
        }
        if (!Config::isProd() && preg_match('#^https?://(localhost|127\.0\.0\.1)(:\d+)?$#', $origin)) {
            return; // on your PC: Vite dev server, vite preview, 127.0.0.1 ...
        }
        if (!in_array($origin, $allowed, true)) {
            throw HttpError::forbidden('Requests from ' . $origin . ' are not allowed');
        }
    }

    /** Returns true when the request was a preflight that has been answered. */
    private static function cors(Request $req): bool
    {
        $origin = (string) Config::get('cors.origin', '');
        if ($origin === '') {
            return false;
        }
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Access-Control-Allow-Credentials: true');
        header('Vary: Origin');

        if ($req->method !== 'OPTIONS') {
            return false;
        }
        header('Access-Control-Allow-Methods: GET,HEAD,PUT,PATCH,POST,DELETE');
        $requested = $req->header('access-control-request-headers');
        if ($requested !== null && $requested !== '') {
            header('Access-Control-Allow-Headers: ' . $requested);
            header('Vary: Origin, Access-Control-Request-Headers');
        }
        header('Content-Length: 0');
        http_response_code(204);
        return true;
    }
}
