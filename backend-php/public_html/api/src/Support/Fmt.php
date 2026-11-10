<?php

namespace App\Support;

/** Row-mapping helpers that reproduce the Node backend's JSON shapes. */
final class Fmt
{
    /** MySQL "Y-m-d H:i:s" (UTC session) -> "2026-11-04T08:00:48.000Z", like a JS Date in JSON. */
    public static function date($value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }
        $dt = \DateTime::createFromFormat('Y-m-d H:i:s', substr((string) $value, 0, 19), new \DateTimeZone('UTC'));
        return $dt ? $dt->format('Y-m-d\TH:i:s.v\Z') : (string) $value;
    }

    public static function intOrNull($value): ?int
    {
        return $value === null ? null : (int) $value;
    }

    public static function floatOrNull($value): ?float
    {
        return $value === null ? null : (float) $value;
    }

    /** JavaScript "value || null". */
    public static function orNull($value)
    {
        if ($value === null || $value === false || $value === '' || $value === 0 || $value === 0.0) {
            return null;
        }
        return $value;
    }

    public static function json($value): string
    {
        return json_encode($value, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
    }

    public static function jsonDecodeArray($value): array
    {
        if ($value === null || $value === '') {
            return [];
        }
        if (is_array($value)) {
            return $value;
        }
        $decoded = json_decode((string) $value, true);
        return is_array($decoded) ? $decoded : [];
    }
}
