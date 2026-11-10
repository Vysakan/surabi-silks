<?php

namespace App\Http;

final class Response
{
    public static function json(int $status, $data): void
    {
        $json = json_encode(
            $data,
            JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE
        );
        if ($json === false) {
            $status = 500;
            $json = '{"error":{"code":"INTERNAL_ERROR","message":"Could not encode response"}}';
        }
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo $json;
    }
}
