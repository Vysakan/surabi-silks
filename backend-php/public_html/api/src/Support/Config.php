<?php

namespace App\Support;

final class Config
{
    private static array $values = [];

    public static function load(array $values): void
    {
        self::$values = $values;
    }

    /** Dot-notation lookup, e.g. Config::get('db.host'). */
    public static function get(string $key, $default = null)
    {
        $node = self::$values;
        foreach (explode('.', $key) as $part) {
            if (!is_array($node) || !array_key_exists($part, $node)) {
                return $default;
            }
            $node = $node[$part];
        }
        return $node;
    }

    public static function isProd(): bool
    {
        return self::get('env', 'production') === 'production';
    }
}
