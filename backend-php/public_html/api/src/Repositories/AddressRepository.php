<?php

namespace App\Repositories;

use App\Support\Db;

final class AddressRepository
{
    public static function findByUser(int $userId): array
    {
        $rows = Db::all(
            'SELECT * FROM user_addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC',
            [$userId]
        );
        return array_map([self::class, 'toAddress'], $rows);
    }

    public static function findById(int $id, int $userId): ?array
    {
        $row = Db::one('SELECT * FROM user_addresses WHERE id = ? AND user_id = ?', [$id, $userId]);
        return $row ? self::toAddress($row) : null;
    }

    public static function create(int $userId, array $d): ?array
    {
        if (!empty($d['isDefault'])) {
            Db::run('UPDATE user_addresses SET is_default = 0 WHERE user_id = ?', [$userId]);
        }
        $id = Db::insert(
            'INSERT INTO user_addresses (user_id, label, full_name, phone, line1, line2, city, state, pincode, is_default)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                $userId, self::orNull($d['label']), $d['fullName'], self::orNull($d['phone']), $d['line1'],
                self::orNull($d['line2']), $d['city'], $d['state'], $d['pincode'], !empty($d['isDefault']) ? 1 : 0,
            ]
        );
        return self::findById($id, $userId);
    }

    public static function update(int $id, int $userId, array $d): ?array
    {
        if (!empty($d['isDefault'])) {
            Db::run('UPDATE user_addresses SET is_default = 0 WHERE user_id = ?', [$userId]);
        }
        Db::run(
            'UPDATE user_addresses
             SET label = ?, full_name = ?, phone = ?, line1 = ?, line2 = ?, city = ?, state = ?, pincode = ?, is_default = ?
             WHERE id = ? AND user_id = ?',
            [
                self::orNull($d['label']), $d['fullName'], self::orNull($d['phone']), $d['line1'],
                self::orNull($d['line2']), $d['city'], $d['state'], $d['pincode'], !empty($d['isDefault']) ? 1 : 0,
                $id, $userId,
            ]
        );
        return self::findById($id, $userId);
    }

    public static function remove(int $id, int $userId): void
    {
        Db::run('DELETE FROM user_addresses WHERE id = ? AND user_id = ?', [$id, $userId]);
    }

    private static function orNull($v)
    {
        return ($v === null || $v === '') ? null : $v;
    }

    private static function toAddress(array $row): array
    {
        return [
            'id' => (int) $row['id'],
            'label' => $row['label'] ?? '',
            'fullName' => $row['full_name'],
            'phone' => $row['phone'] ?? '',
            'line1' => $row['line1'],
            'line2' => $row['line2'] ?? '',
            'city' => $row['city'],
            'state' => $row['state'],
            'pincode' => $row['pincode'],
            'isDefault' => (bool) $row['is_default'],
        ];
    }
}
