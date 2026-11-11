<?php

namespace App\Support;

use App\Http\HttpError;
use App\Http\Request;

/** Cookie-session authentication, roles and password rules. */
final class Auth
{
    public const COOKIE = 'session_id';

    /** customer < admin < superadmin (the root admin, who manages the other admins). */
    public const ROLES = ['customer', 'admin', 'superadmin'];
    public const STAFF = ['admin', 'superadmin'];

    /** Used when an email is unknown, so a failed login takes as long as a real one. */
    private const DUMMY_HASH = '$argon2id$v=19$m=65536,t=3,p=4$j6T+CGY1k0kluhGLg4TcOw$hdad3HFwdsGXERCJrQrQ3ZgXHoS2cOd4vzlSEOCCmPI';

    private const COMMON_PASSWORDS = [
        'password', 'password1', 'password12', 'password123', 'passw0rd', 'p@ssw0rd', '12345678', '123456789',
        '1234567890', '0987654321', '11111111', '12341234', '87654321', 'qwerty12', 'qwerty123', 'qwertyuiop',
        'iloveyou1', 'admin123', 'admin1234', 'administrator1', 'welcome1', 'welcome123', 'abc12345', 'abcd1234',
        'letmein1', 'changeme1', 'test1234', 'india123', 'surabhi123', 'surabi123', 'surabhisilks1', 'surabisilks1',
    ];

    /** Middleware: loads the logged-in, active user into $req->user or throws 401. */
    public static function authenticate(Request $req): void
    {
        $sid = $req->cookies[self::COOKIE] ?? null;
        if (!is_string($sid) || $sid === '' || strlen($sid) > 128) {
            throw HttpError::unauthorized();
        }
        $row = Db::one(
            'SELECT s.id AS session_id, s.user_id, u.name, u.email, u.phone, u.role, u.avatar
             FROM sessions s JOIN users u ON s.user_id = u.id
             WHERE s.id = ? AND s.expires_at > NOW() AND u.is_active = 1',
            [$sid]
        );
        if (!$row) {
            throw HttpError::unauthorized('Session expired or invalid');
        }
        $req->user = [
            'id' => (int) $row['user_id'],
            'name' => $row['name'],
            'email' => $row['email'],
            'phone' => $row['phone'],
            'role' => $row['role'],
            'avatar' => $row['avatar'],
        ];
        $req->sessionId = $row['session_id'];
    }

    /** Middleware factory: requires one of the given roles (use after authenticate). */
    public static function requireRole(string ...$roles): callable
    {
        return function (Request $req) use ($roles) {
            if ($req->user === null) {
                throw HttpError::unauthorized();
            }
            if (!in_array($req->user['role'], $roles, true)) {
                throw HttpError::forbidden();
            }
        };
    }

    public static function isStaff(?string $role): bool
    {
        return in_array($role, self::STAFF, true);
    }

    public static function setSessionCookie(string $sessionId): void
    {
        $hours = (int) Config::get('session.max_age_hours', 24);
        setcookie(self::COOKIE, $sessionId, self::cookieOptions(time() + $hours * 3600));
    }

    public static function clearSessionCookie(): void
    {
        setcookie(self::COOKIE, '', self::cookieOptions(1));
    }

    private static function cookieOptions(int $expires): array
    {
        $prod = Config::isProd();
        return [
            'expires' => $expires,
            'path' => '/',
            'secure' => $prod,
            'httponly' => true,
            'samesite' => $prod ? 'Strict' : 'Lax',
        ];
    }

    // ---- passwords -----------------------------------------------------------

    public static function hashPassword(string $password): string
    {
        // Argon2id like the Node backend when this PHP build supports it, bcrypt otherwise.
        if (defined('PASSWORD_ARGON2ID')) {
            return password_hash($password, PASSWORD_ARGON2ID);
        }
        return password_hash($password, PASSWORD_BCRYPT);
    }

    public static function verifyPassword(string $password, string $hash): bool
    {
        if (strncmp($hash, '$argon2', 7) === 0 && !defined('PASSWORD_ARGON2ID')) {
            error_log('[auth] This PHP build has no Argon2 support, so passwords created by the Node backend cannot be verified.');
            return false;
        }
        return password_verify($password, $hash);
    }

    /** Spends the same time as a real password check (for unknown emails). */
    public static function burnPasswordCheck(string $password): void
    {
        self::verifyPassword($password, self::DUMMY_HASH);
    }

    public static function needsRehash(string $hash): bool
    {
        return password_needs_rehash($hash, defined('PASSWORD_ARGON2ID') ? PASSWORD_ARGON2ID : PASSWORD_BCRYPT);
    }

    /** A hash nobody knows the password for (accounts that must set their password from an email link). */
    public static function unusableHash(): string
    {
        return self::hashPassword(bin2hex(random_bytes(32)));
    }

    /** Returns why a new password is not acceptable, or null when it is fine. */
    public static function passwordProblem(string $password, string $email = ''): ?string
    {
        $len = function_exists('mb_strlen') ? mb_strlen($password, 'UTF-8') : strlen($password);
        if ($len < 8) {
            return 'Password must be at least 8 characters';
        }
        if ($len > 128) {
            return 'Password must be 128 characters or fewer';
        }
        if (!preg_match('/\p{L}/u', $password) || !preg_match('/\d/', $password)) {
            return 'Password must contain at least one letter and one number';
        }
        $lower = strtolower($password);
        if ($email !== '' && $lower === strtolower(trim($email))) {
            return 'Password must not be the same as your email address';
        }
        if (in_array($lower, self::COMMON_PASSWORDS, true)) {
            return 'This password is too common. Please choose a less predictable one';
        }
        return null;
    }

    // ---- one-time tokens -----------------------------------------------------

    /** 43-character url-safe random token (256 bits). Only its SHA-256 hash is stored. */
    public static function newToken(): string
    {
        return rtrim(strtr(base64_encode(random_bytes(32)), '+/', '-_'), '=');
    }

    public static function hashToken(string $token): string
    {
        return hash('sha256', $token);
    }

    public static function normalizeEmail(string $email): string
    {
        return strtolower(trim($email));
    }
}
