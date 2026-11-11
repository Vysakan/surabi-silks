<?php
/**
 * Hostinger settings for https://surabhiwebapi.semicoloninnovations.in
 *
 * 1. Rename this file to config.php (same folder).
 * 2. Fill in the three database lines from hPanel > Databases.
 * config.php holds your database password: never share it or commit it.
 */
return [
    'env' => 'production',

    // Used for the year in order numbers (ORD-2026-000001).
    'timezone' => 'Asia/Kolkata',

    // hPanel > Databases. On Hostinger the host is 'localhost'.
    'db' => [
        'host'     => 'localhost',
        'port'     => 3306,
        'name'     => 'u000000000_surabi',   // database name, e.g. u123456789_surabi
        'user'     => 'u000000000_surabi',   // database user
        'password' => 'CHANGE_ME',           // database user's password
    ],

    'session' => [
        'max_age_hours' => 24,
    ],

    // The website lives on another subdomain, so the browser needs permission (CORS)
    // to call this API with the login cookie. Exact address, no slash at the end.
    'cors' => [
        'origin' => 'https://surabhisilkstest.semicoloninnovations.in',
    ],

    // Uploaded product images are saved in public_html/surabhiwebapi/uploads.
    // The full address is stored, so the website on the other subdomain can show them.
    'upload' => [
        'dir'              => __DIR__ . '/../uploads',
        'url_prefix'       => 'https://surabhiwebapi.semicoloninnovations.in/uploads',
        'max_file_size_mb' => 5,
    ],

    // Links in account emails (password reset, admin invites) open the website. No slash at the end.
    'app' => [
        'name'         => 'Surabhi Silks',
        'frontend_url' => 'https://surabhisilkstest.semicoloninnovations.in',
    ],

    'auth' => [
        'reset_link_minutes' => 30,  // "Forgot password" links
        'invite_link_hours'  => 48,  // new-admin invites and resets sent by the root admin
    ],

    // Account emails go out through a mailbox you create in hPanel > Emails
    // (for example no-reply@semicoloninnovations.in). Use that mailbox's address and password here.
    // 'driver' => 'log' sends nothing and writes the emails to api/storage/mail.log instead.
    'mail' => [
        'driver'     => 'smtp',
        'from_email' => 'no-reply@semicoloninnovations.in',
        'from_name'  => 'Surabhi Silks',
        'smtp' => [
            'host'       => 'smtp.hostinger.com',
            'port'       => 465,
            'encryption' => 'ssl',
            'username'   => 'no-reply@semicoloninnovations.in',
            'password'   => 'CHANGE_ME',      // the mailbox password
        ],
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
