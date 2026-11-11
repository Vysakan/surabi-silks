<?php

namespace App\Repositories;

use App\Support\Db;
use App\Support\Fmt;

final class UserRepository
{
    public static function findByEmail(string $email): ?array
    {
        return Db::one('SELECT * FROM users WHERE email = ?', [$email]);
    }

    public static function findById(int $id): ?array
    {
        return Db::one('SELECT * FROM users WHERE id = ?', [$id]);
    }

    public static function create(string $name, string $email, ?string $phone, string $passwordHash, string $role = 'customer'): int
    {
        return Db::insert(
            'INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)',
            [$name, $email, $phone ?: null, $passwordHash, $role]
        );
    }

    public static function updatePassword(int $id, string $passwordHash, bool $markChanged = true): void
    {
        if ($markChanged) {
            Db::run('UPDATE users SET password_hash = ?, password_changed_at = UTC_TIMESTAMP() WHERE id = ?', [$passwordHash, $id]);
        } else {
            Db::run('UPDATE users SET password_hash = ? WHERE id = ?', [$passwordHash, $id]);
        }
    }

    public static function touchLogin(int $id): void
    {
        Db::run('UPDATE users SET last_login_at = UTC_TIMESTAMP() WHERE id = ?', [$id]);
    }

    public static function setRole(int $id, string $role): void
    {
        Db::run('UPDATE users SET role = ? WHERE id = ?', [$role, $id]);
    }

    public static function setActive(int $id, bool $active): void
    {
        Db::run('UPDATE users SET is_active = ? WHERE id = ?', [$active ? 1 : 0, $id]);
    }

    public static function countActiveSuperadmins(): int
    {
        return (int) Db::value("SELECT COUNT(*) FROM users WHERE role = 'superadmin' AND is_active = 1");
    }

    /** Paged user list for the root admin. $group: staff | customer | all. */
    public static function list(string $group, ?string $search, int $page, int $limit): array
    {
        $where = [];
        $params = [];
        if ($group === 'staff') {
            $where[] = "role IN ('admin', 'superadmin')";
        } elseif ($group === 'customer') {
            $where[] = "role = 'customer'";
        }
        if ($search !== null && trim($search) !== '') {
            $like = '%' . addcslashes(trim($search), '%_\\') . '%';
            $where[] = '(name LIKE ? OR email LIKE ?)';
            array_push($params, $like, $like);
        }
        $sqlWhere = $where ? 'WHERE ' . implode(' AND ', $where) : '';

        $total = (int) Db::value("SELECT COUNT(*) FROM users $sqlWhere", $params);
        $rows = Db::all(
            "SELECT * FROM users $sqlWhere ORDER BY FIELD(role, 'superadmin', 'admin', 'customer'), created_at DESC LIMIT ? OFFSET ?",
            array_merge($params, [$limit, ($page - 1) * $limit])
        );
        return [
            'items' => array_map([self::class, 'toAdminView'], $rows),
            'total' => $total,
            'totalPages' => (int) ceil($total / $limit),
            'page' => $page,
        ];
    }

    /** What the root admin sees about an account (never the password hash). */
    public static function toAdminView(array $u): array
    {
        return [
            'id' => (int) $u['id'],
            'name' => $u['name'],
            'email' => $u['email'],
            'phone' => $u['phone'],
            'role' => $u['role'],
            'isActive' => (bool) $u['is_active'],
            'createdAt' => Fmt::date($u['created_at']),
            'lastLoginAt' => Fmt::date($u['last_login_at'] ?? null),
        ];
    }
}
