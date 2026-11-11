<?php
// Operator-only emergency procedure. Keep this script outside public_html.
if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit(1);
}

require dirname(__DIR__) . '/public_html/api/src/bootstrap.php';

use App\Support\Auth;
use App\Support\Db;

function usage(): void
{
    fwrite(STDERR, "Usage:\n  php root-admin.php bootstrap <existing-admin-email> [verified-recovery-email]\n  php root-admin.php reset <root-admin-email>\n");
    exit(2);
}

function hiddenInput(string $prompt): string
{
    fwrite(STDERR, $prompt);
    $isTerminal = function_exists('posix_isatty') && posix_isatty(STDIN);
    if ($isTerminal && (PHP_OS_FAMILY === 'Windows' || !function_exists('shell_exec'))) {
        fwrite(STDERR, "\nCannot securely hide terminal input here. Use a private non-echoing SSH terminal or pipe the password on standard input.\n");
        exit(1);
    }
    $hidden = $isTerminal;
    if ($hidden) shell_exec('stty -echo');
    try {
        $value = fgets(STDIN);
    } finally {
        if ($hidden) shell_exec('stty echo');
        fwrite(STDERR, "\n");
    }
    return trim((string) $value);
}

$action = $argv[1] ?? '';
$email = strtolower(trim($argv[2] ?? ''));
if (!in_array($action, ['bootstrap', 'reset'], true) || !filter_var($email, FILTER_VALIDATE_EMAIL)) usage();
$user = Db::one('SELECT id, role FROM users WHERE email = ?', [$email]);
if (!$user) {
    fwrite(STDERR, "No account found for that email. Register the account first, then run this command as the authorized server operator.\n");
    exit(1);
}

if ($action === 'bootstrap') {
    if ($user['role'] === 'root_admin') {
        fwrite(STDERR, "That account is already a Root Admin.\n");
        exit(1);
    }
    $recoveryEmail = strtolower(trim($argv[3] ?? $email));
    if (!filter_var($recoveryEmail, FILTER_VALIDATE_EMAIL)) {
        fwrite(STDERR, "Recovery email is invalid.\n");
        exit(2);
    }
    fwrite(STDERR, "Confirm you control and have verified {$recoveryEmail} before continuing. Type YES: ");
    if (trim((string) fgets(STDIN)) !== 'YES') {
        fwrite(STDERR, "Cancelled.\n");
        exit(1);
    }
    Db::transaction(function () use ($user, $recoveryEmail) {
        Db::run("UPDATE users SET role = 'root_admin', recovery_email = ?, recovery_email_verified_at = UTC_TIMESTAMP() WHERE id = ?", [$recoveryEmail, (int) $user['id']]);
        Db::run("INSERT INTO auth_audit_log (user_id, event_type, ip_address) VALUES (?, 'root_admin_bootstrapped_cli', '127.0.0.1')", [(int) $user['id']]);
    });
    fwrite(STDOUT, "Root Admin role assigned and the confirmed recovery email marked verified. Sign in with this account.\n");
    exit(0);
}

if ($user['role'] !== 'root_admin') {
    fwrite(STDERR, "Refusing reset: account is not a Root Admin.\n");
    exit(1);
}
$password = hiddenInput('New password (12+ characters): ');
$confirm = hiddenInput('Repeat new password: ');
if (strlen($password) < 12 || strlen($password) > 128 || !hash_equals($password, $confirm)) {
    fwrite(STDERR, "Passwords must match and be 12 to 128 characters.\n");
    exit(1);
}
Db::transaction(function () use ($user, $password) {
    Db::run('UPDATE users SET password_hash = ? WHERE id = ?', [Auth::hashPassword($password), (int) $user['id']]);
    Db::run('DELETE FROM sessions WHERE user_id = ?', [(int) $user['id']]);
    Db::run('DELETE FROM password_reset_tokens WHERE user_id = ?', [(int) $user['id']]);
    Db::run("INSERT INTO auth_audit_log (user_id, event_type, ip_address) VALUES (?, 'root_admin_cli_recovery', '127.0.0.1')", [(int) $user['id']]);
});
fwrite(STDOUT, "Root Admin password updated and sessions revoked.\n");
