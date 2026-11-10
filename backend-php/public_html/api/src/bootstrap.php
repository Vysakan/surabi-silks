<?php

spl_autoload_register(function ($class) {
    if (strncmp($class, 'App\\', 4) !== 0) {
        return;
    }
    $file = __DIR__ . '/' . str_replace('\\', '/', substr($class, 4)) . '.php';
    if (is_file($file)) {
        require $file;
    }
});

ini_set('display_errors', '0');
ini_set('serialize_precision', '-1');

$configFile = dirname(__DIR__) . '/config.php';
if (!is_file($configFile)) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => [
        'code' => 'CONFIG_MISSING',
        'message' => 'Server is not configured: copy api/config.example.php to api/config.php',
    ]]);
    exit;
}

\App\Support\Config::load(require $configFile);
date_default_timezone_set((string) \App\Support\Config::get('timezone', 'UTC'));
