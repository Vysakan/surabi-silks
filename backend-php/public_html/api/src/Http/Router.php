<?php

namespace App\Http;

/**
 * Tiny Express-style router. Patterns use ":name" placeholders.
 * Middleware are callables taking the Request; they throw HttpError to stop the request.
 * Handlers return [statusCode, data]; status 204 sends no body.
 */
final class Router
{
    private array $routes = [];

    public function get(string $pattern, array $middleware, callable $handler): void
    {
        $this->add('GET', $pattern, $middleware, $handler);
    }

    public function post(string $pattern, array $middleware, callable $handler): void
    {
        $this->add('POST', $pattern, $middleware, $handler);
    }

    public function put(string $pattern, array $middleware, callable $handler): void
    {
        $this->add('PUT', $pattern, $middleware, $handler);
    }

    public function patch(string $pattern, array $middleware, callable $handler): void
    {
        $this->add('PATCH', $pattern, $middleware, $handler);
    }

    public function delete(string $pattern, array $middleware, callable $handler): void
    {
        $this->add('DELETE', $pattern, $middleware, $handler);
    }

    private function add(string $method, string $pattern, array $middleware, callable $handler): void
    {
        $regex = preg_replace_callback(
            '#:([A-Za-z_][A-Za-z0-9_]*)#',
            function ($m) {
                return '(?P<' . $m[1] . '>[^/]+)';
            },
            $pattern
        );
        $this->routes[] = [
            'method' => $method,
            'regex' => '#^' . $regex . '$#i',
            'middleware' => $middleware,
            'handler' => $handler,
        ];
    }

    public function dispatch(Request $req): array
    {
        $method = $req->method === 'HEAD' ? 'GET' : $req->method;

        foreach ($this->routes as $route) {
            if ($route['method'] !== $method || !preg_match($route['regex'], $req->path, $m)) {
                continue;
            }
            $params = [];
            foreach ($m as $key => $value) {
                if (is_string($key)) {
                    $params[$key] = rawurldecode($value);
                }
            }
            $req->params = $params;

            foreach ($route['middleware'] as $mw) {
                $mw($req);
            }
            return ($route['handler'])($req);
        }

        throw new HttpError(404, 'ROUTE_NOT_FOUND', 'The requested endpoint does not exist');
    }
}
