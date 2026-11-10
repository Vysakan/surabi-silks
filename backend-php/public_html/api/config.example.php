<?php
/**
 * Copy this file to config.php (same folder) and fill in your values.
 * config.php holds your database password: never commit it or share it.
 */
return [
    // 'production' on Hostinger (secure cookies, generic error messages).
    // 'development' on your PC (shows real error messages, cookies work over http://).
    'env' => 'production',

    // Used for the year in order numbers (ORD-2026-000001).
    'timezone' => 'Asia/Kolkata',

    // hPanel > Databases > MySQL Databases. On Hostinger the host is usually 'localhost'.
    'db' => [
        'host'     => 'localhost',
        'port'     => 3306,
        'name'     => 'u000000000_surabi',
        'user'     => 'u000000000_surabi',
        'password' => 'CHANGE_ME',
    ],

    'session' => [
        'max_age_hours' => 24,
    ],

    // Only needed when the website and the API are on DIFFERENT domains.
    // Leave '' when both are served from the same Hostinger site (the normal setup).
    // For local development with Vite use 'http://localhost:5173'.
    'cors' => [
        'origin' => '',
    ],

    'upload' => [
        'dir'              => __DIR__ . '/../uploads',   // public_html/uploads
        'url_prefix'       => '/uploads',
        'max_file_size_mb' => 5,
    ],

    'shipping' => [
        'free_threshold' => 2000,
        'cost'           => 99,
    ],

    // [max requests, window in seconds] per IP address - same limits as the Node backend.
    'rate_limit' => [
        'api'         => [200, 900],
        'auth'        => [20, 900],
        'storage_dir' => __DIR__ . '/storage/ratelimit',
    ],
];
