<?php

namespace App\Support;

/**
 * Per-account counters (failed logins, reset requests) stored as small files next to the rate limiter's.
 * Unlike RateLimiter, which counts every request from an IP, this counts only what the caller reports.
 */
final class Throttle
{
    /** Seconds until $key may try again (0 when it is not blocked). */
    public static function blockedFor(string $bucket, string $key, int $max): int
    {
        $state = self::read(self::file($bucket, $key));
        if ($state === null || $state['hits'] < $max) {
            return 0;
        }
        return max(1, $state['reset'] - time());
    }

    /** Records one event and returns how many happened in the current window. */
    public static function hit(string $bucket, string $key, int $windowSeconds): int
    {
        $file = self::file($bucket, $key);
        if ($file === null) {
            return 0;
        }
        $fh = @fopen($file, 'c+');
        if ($fh === false) {
            return 0;
        }
        $now = time();
        try {
            flock($fh, LOCK_EX);
            $state = self::decode(stream_get_contents($fh), $now);
            if ($state === null) {
                $state = ['hits' => 0, 'reset' => $now + $windowSeconds];
            }
            $state['hits']++;
            ftruncate($fh, 0);
            rewind($fh);
            fwrite($fh, json_encode($state));
            fflush($fh);
        } finally {
            flock($fh, LOCK_UN);
            fclose($fh);
        }
        return $state['hits'];
    }

    public static function clear(string $bucket, string $key): void
    {
        $file = self::file($bucket, $key);
        if ($file !== null && is_file($file)) {
            @unlink($file);
        }
    }

    private static function read(?string $file): ?array
    {
        if ($file === null || !is_file($file)) {
            return null;
        }
        return self::decode((string) @file_get_contents($file), time());
    }

    private static function decode($raw, int $now): ?array
    {
        $state = $raw ? json_decode($raw, true) : null;
        if (!is_array($state) || !isset($state['hits'], $state['reset']) || (int) $state['reset'] <= $now) {
            return null;
        }
        return ['hits' => (int) $state['hits'], 'reset' => (int) $state['reset']];
    }

    private static function file(string $bucket, string $key): ?string
    {
        $dir = (string) Config::get('rate_limit.storage_dir', '');
        if ($dir === '') {
            $dir = sys_get_temp_dir() . '/surabi-ratelimit';
        }
        if (!is_dir($dir) && !@mkdir($dir, 0700, true) && !is_dir($dir)) {
            return null; // fail open rather than lock everyone out
        }
        return $dir . '/t-' . hash('sha256', $bucket . '|' . strtolower($key)) . '.json';
    }
}
