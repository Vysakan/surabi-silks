<?php
/**
 * Root admin bootstrap and recovery (command line only).
 *
 * Makes the account with this email a root admin (creating it if needed), re-enables it,
 * signs it out everywhere and prints a one-time link to set a new password (valid 60 minutes).
 *
 * Hostinger (hPanel > Advanced > SSH Access, then):
 *   cd ~/domains/semicoloninnovations.in/public_html/surabhiwebapi
 *   php api/bin/root-admin.php you@example.com "Your Name"
 *
 * Local:
 *   cd backend-php\public_html
 *   php api\bin\root-admin.php you@example.com "Your Name"
 */

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require dirname(__DIR__) . '/src/bootstrap.php';

use App\Repositories\PasswordResetRepository;
use App\Repositories\SessionRepository;
use App\Repositories\UserRepository;
use App\Support\Auth;
use App\Support\Emails;
use App\Support\Throttle;

$email = Auth::normalizeEmail((string) ($argv[1] ?? ''));
$name = trim((string) ($argv[2] ?? ''));

if ($email === '' || filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
    fwrite(STDERR, "Usage: php api/bin/root-admin.php you@example.com \"Your Name\"\n");
    exit(1);
}

try {
    $user = UserRepository::findByEmail($email);
    if ($user) {
        $id = (int) $user['id'];
        UserRepository::setRole($id, 'superadmin');
        UserRepository::setActive($id, true);
        echo "Existing account {$user['email']} is now an active root admin.\n";
    } else {
        $id = UserRepository::create($name !== '' ? $name : 'Store Owner', $email, null, Auth::unusableHash(), 'superadmin');
        echo "Created root admin account $email.\n";
    }
    SessionRepository::removeAllForUser($id);
    Throttle::clear('login-fail', $email);

    $token = PasswordResetRepository::create($id, 'reset', 60, 'cli');
    $link = Emails::link('/reset-password?token=' . $token);
    if ($link === null) {
        echo "\nSet 'app' => ['frontend_url' => 'https://your-website'] in api/config.php, then open:\n";
        echo "  <your website>/reset-password?token=$token\n";
    } else {
        echo "\nOpen this link within 60 minutes to set the password (it works once):\n  $link\n";
    }
    exit(0);
} catch (\Throwable $e) {
    fwrite(STDERR, 'Failed: ' . $e->getMessage() . "\n");
    exit(1);
}
