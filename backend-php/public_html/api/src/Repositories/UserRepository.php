<?php

namespace App\Repositories;

use App\Support\Db;

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
}
