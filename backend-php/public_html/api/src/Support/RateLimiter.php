<?php

namespace App\Support;

use App\Http\HttpError;

/**
 * Fixed-window rate limiter stored in small files (works on shared hosting without Redis).
 * Mirrors express-rate-limit: per-IP counters, RateLimit-* headers, 429 RATE_LIMITED.
 */
final class RateLimiter
{
    public static function hit(string $name, int $max, int $windowSeconds, string $ip): void
    {
        if ($max <= 0 || $windowSeconds <= 0) {
            return;
        }
        $dir = (string) Config::get('rate_limit.storage_dir', '');
        if ($dir === '') {
            $dir = sys_get_temp_dir() . '/surabi-ratelimit';
        }
        if (!is_dir($dir) && !@mkdir($dir, 0700, true) && !is_dir($dir)) {
            return; // fail open rather than take the site down
        }

        $file = $dir . '/' . hash('sha256', $name . '|' . $ip) . '.json';
        $fh = @fopen($file, 'c+');
        if ($fh === false) {
            return;
        }

        $now = time();
        try {
            flock($fh, LOCK_EX);
            $raw = stream_get_contents($fh);
            $state = $raw ? json_decode($raw, true) : null;
            if (!is_array($state) || !isset($state['hits'], $state['reset']) || (int) $state['reset'] <= $now) {
                $state = ['hits' => 0, 'reset' => $now + $windowSeconds];
            }
            $state['hits'] = (int) $state['hits'] + 1;
            ftruncate($fh, 0);
            rewind($fh);
            fwrite($fh, json_encode($state));
            fflush($fh);
        } finally {
            flock($fh, LOCK_UN);
            fclose($fh);
        }

        if (random_int(1, 500) === 1) {
            self::cleanup($dir, $now);
        }

        $resetIn = max(0, (int) $state['reset'] - $now);
        header('RateLimit-Policy: ' . $max . ';w=' . $windowSeconds);
        header('RateLimit-Limit: ' . $max);
        header('RateLimit-Remaining: ' . max(0, $max - $state['hits']));
        header('RateLimit-Reset: ' . $resetIn);

        if ($state['hits'] > $max) {
            header('Retry-After: ' . $resetIn);
            throw new HttpError(429, 'RATE_LIMITED', 'Too many requests, please try again later');
        }
    }

    private static function cleanup(string $dir, int $now): void
    {
        foreach (glob($dir . '/*.json') ?: [] as $f) {
            if (@filemtime($f) < $now - 86400) {
                @unlink($f);
            }
        }
    }
}
