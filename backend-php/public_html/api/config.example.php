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
    //for local development only
    // 'db' => [
    //     'host'     => '127.0.0.1',
    //     'port'     => 3306,
    //     'name'     => 'surabi_php_test',
    //     'user'     => 'root',
    //     'password' => 'YOUR_LOCAL_MYSQL_ROOT_PASSWORD',
    // ],

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
        // Reel videos (MP4). PHP's own limits must allow this too: upload_max_filesize and
        // post_max_size of 128M or more (hPanel > Advanced > PHP Configuration, or the .htaccess file).
        'max_video_size_mb' => 100,
    ],

    // Links in account emails (password reset, admin invites) point here. No slash at the end.
    // Local development with Vite: 'http://localhost:5173'.
    'app' => [
        'name'         => 'Surabhi Silks',
        'frontend_url' => 'http://localhost:5173',
    ],

    'auth' => [
        'reset_link_minutes' => 30,  // "Forgot password" links
        'invite_link_hours'  => 48,  // new-admin invites and resets sent by the root admin
    ],

    // How account emails are sent:
    //   'log'  - not sent; written to api/storage/mail.log (use this on your PC)
    //   'smtp' - a mailbox from hPanel > Emails (recommended on Hostinger)
    //   'mail' - PHP mail() (works on Hostinger, but more likely to land in spam)
    'mail' => [
        'driver'     => 'log',
        'from_email' => 'no-reply@example.com',
        'from_name'  => 'Surabhi Silks',
        'smtp' => [
            'host'       => 'smtp.hostinger.com',
            'port'       => 465,
            'encryption' => 'ssl',            // 465 = 'ssl', 587 = 'tls'
            'username'   => 'no-reply@example.com',
            'password'   => 'CHANGE_ME',
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
