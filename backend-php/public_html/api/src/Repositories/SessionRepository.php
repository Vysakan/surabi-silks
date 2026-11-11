<?php

namespace App\Repositories;

use App\Support\Config;
use App\Support\Db;

final class SessionRepository
{
    /** Creates a session and returns its id (64-char url-safe token, like crypto.randomBytes(48).toString('base64url')). */
    public static function create(int $userId): string
    {
        $id = rtrim(strtr(base64_encode(random_bytes(48)), '+/', '-_'), '=');
        $hours = (int) Config::get('session.max_age_hours', 24);
        Db::run(
            'INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? HOUR))',
            [$id, $userId, $hours]
        );
        return $id;
    }

    public static function remove(string $sessionId): void
    {
        Db::run('DELETE FROM sessions WHERE id = ?', [$sessionId]);
    }

    /** Signs the user out everywhere (optionally keeping one session, e.g. the current one). */
    public static function removeAllForUser(int $userId, ?string $exceptSessionId = null): void
    {
        if ($exceptSessionId !== null) {
            Db::run('DELETE FROM sessions WHERE user_id = ? AND id <> ?', [$userId, $exceptSessionId]);
        } else {
            Db::run('DELETE FROM sessions WHERE user_id = ?', [$userId]);
        }
    }

    public static function purgeExpired(): void
    {
        Db::run('DELETE FROM sessions WHERE expires_at < NOW()');
    }
}
