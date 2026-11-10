<?php

namespace App\Support;

/** Thin PDO (MySQL / MariaDB) wrapper. All queries use bound parameters. */
final class Db
{
    private static ?\PDO $pdo = null;

    public static function pdo(): \PDO
    {
        if (self::$pdo === null) {
            $c = Config::get('db', []);
            $dsn = sprintf(
                'mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',
                $c['host'] ?? 'localhost',
                (int) ($c['port'] ?? 3306),
                $c['name'] ?? ''
            );
            self::$pdo = new \PDO($dsn, $c['user'] ?? '', $c['password'] ?? '', [
                \PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION,
                \PDO::ATTR_DEFAULT_FETCH_MODE => \PDO::FETCH_ASSOC,
                \PDO::ATTR_EMULATE_PREPARES => false,
            ]);
            // Store and read TIMESTAMPs in UTC so API dates are real UTC ISO strings.
            self::$pdo->exec("SET time_zone = '+00:00'");
        }
        return self::$pdo;
    }

    public static function run(string $sql, array $params = []): \PDOStatement
    {
        $stmt = self::pdo()->prepare($sql);
        $i = 1;
        foreach (array_values($params) as $value) {
            if (is_bool($value)) {
                $stmt->bindValue($i, $value ? 1 : 0, \PDO::PARAM_INT);
            } elseif (is_int($value)) {
                $stmt->bindValue($i, $value, \PDO::PARAM_INT);
            } elseif ($value === null) {
                $stmt->bindValue($i, null, \PDO::PARAM_NULL);
            } else {
                $stmt->bindValue($i, (string) $value, \PDO::PARAM_STR);
            }
            $i++;
        }
        $stmt->execute();
        return $stmt;
    }

    public static function all(string $sql, array $params = []): array
    {
        return self::run($sql, $params)->fetchAll();
    }

    public static function one(string $sql, array $params = []): ?array
    {
        $row = self::run($sql, $params)->fetch();
        return $row === false ? null : $row;
    }

    public static function value(string $sql, array $params = [])
    {
        return self::run($sql, $params)->fetchColumn();
    }

    /** Runs an INSERT and returns the new auto-increment id. */
    public static function insert(string $sql, array $params = []): int
    {
        self::run($sql, $params);
        return (int) self::pdo()->lastInsertId();
    }

    /** Runs $fn inside a transaction; rolls back and rethrows on any error. */
    public static function transaction(callable $fn)
    {
        $pdo = self::pdo();
        $pdo->beginTransaction();
        try {
            $result = $fn();
            $pdo->commit();
            return $result;
        } catch (\Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $e;
        }
    }

    public static function isDuplicateKey(\Throwable $e): bool
    {
        return $e instanceof \PDOException
            && isset($e->errorInfo[1])
            && (int) $e->errorInfo[1] === 1062;
    }

    /** "?, ?, ?" for IN (...) lists. */
    public static function marks(int $count): string
    {
        return implode(',', array_fill(0, $count, '?'));
    }
}
