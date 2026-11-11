<?php

namespace App\Repositories;

use App\Support\Auth;
use App\Support\Db;

/** One-time password links ("reset" from Forgot password, "invite" for new admins). Only token hashes are stored. */
final class PasswordResetRepository
{
    /** Creates a link token for the user (older unused ones stop working) and returns the plain token. */
    public static function create(int $userId, string $purpose, int $minutes, ?string $ip = null): string
    {
        Db::run('DELETE FROM password_resets WHERE user_id = ? AND used_at IS NULL', [$userId]);
        $token = Auth::newToken();
        Db::run(
            'INSERT INTO password_resets (user_id, token_hash, purpose, expires_at, created_ip)
             VALUES (?, ?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL ? MINUTE), ?)',
            [$userId, Auth::hashToken($token), $purpose, $minutes, $ip]
        );
        return $token;
    }

    /** The unused, unexpired token with its user, or null. */
    public static function findValid(string $token): ?array
    {
        return Db::one(
            'SELECT pr.id, pr.user_id, pr.purpose, u.name, u.email, u.role, u.is_active
             FROM password_resets pr JOIN users u ON u.id = pr.user_id
             WHERE pr.token_hash = ? AND pr.used_at IS NULL AND pr.expires_at > UTC_TIMESTAMP()',
            [Auth::hashToken($token)]
        );
    }

    /** Marks the token used. Returns false when another request used it first. */
    public static function consume(int $id): bool
    {
        $stmt = Db::run('UPDATE password_resets SET used_at = UTC_TIMESTAMP() WHERE id = ? AND used_at IS NULL', [$id]);
        return $stmt->rowCount() === 1;
    }

    public static function removeUnusedForUser(int $userId): void
    {
        Db::run('DELETE FROM password_resets WHERE user_id = ? AND used_at IS NULL', [$userId]);
    }

    public static function purgeOld(): void
    {
        Db::run('DELETE FROM password_resets WHERE expires_at < DATE_SUB(UTC_TIMESTAMP(), INTERVAL 7 DAY)');
    }
}
