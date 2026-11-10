<?php

namespace App\Support;

use App\Http\HttpError;
use App\Http\Request;

/** Cookie-session authentication (same sessions table and cookie as the Node backend). */
final class Auth
{
    public const COOKIE = 'session_id';

    /** Middleware: loads the logged-in user into $req->user or throws 401. */
    public static function authenticate(Request $req): void
    {
        $sid = $req->cookies[self::COOKIE] ?? null;
        if (!is_string($sid) || $sid === '') {
            throw HttpError::unauthorized();
        }
        $row = Db::one(
            'SELECT s.id AS session_id, s.user_id, u.name, u.email, u.phone, u.role, u.avatar
             FROM sessions s JOIN users u ON s.user_id = u.id
             WHERE s.id = ? AND s.expires_at > NOW()',
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
}
