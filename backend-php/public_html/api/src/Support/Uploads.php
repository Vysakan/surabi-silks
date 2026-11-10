<?php

namespace App\Support;

use App\Http\HttpError;

/** Product image uploads saved to public_html/uploads and served at /uploads/<file>. */
final class Uploads
{
    private const TYPES = [
        'image/jpeg' => 'jpg',
        'image/png'  => 'png',
        'image/webp' => 'webp',
        'image/avif' => 'avif',
    ];

    /**
     * Validates and stores $_FILES[$field]. Returns the public URL, or null when no file was sent.
     * The file type is detected from the file contents and the extension is chosen by the server,
     * so an uploaded script can never be saved with an executable extension.
     */
    public static function saveImage(string $field): ?string
    {
        $file = $_FILES[$field] ?? null;
        if (!is_array($file) || !isset($file['error']) || is_array($file['error'])) {
            return null;
        }
        $maxMb = (int) Config::get('upload.max_file_size_mb', 5);
        switch ((int) $file['error']) {
            case UPLOAD_ERR_OK:
                break;
            case UPLOAD_ERR_NO_FILE:
                return null;
            case UPLOAD_ERR_INI_SIZE:
            case UPLOAD_ERR_FORM_SIZE:
                throw new HttpError(413, 'FILE_TOO_LARGE', 'Image must be ' . $maxMb . ' MB or smaller');
            default:
                throw new HttpError(400, 'UPLOAD_FAILED', 'The image could not be uploaded');
        }
        if ((int) $file['size'] > $maxMb * 1024 * 1024) {
            throw new HttpError(413, 'FILE_TOO_LARGE', 'Image must be ' . $maxMb . ' MB or smaller');
        }

        $tmp = (string) $file['tmp_name'];
        $mime = self::detectMime($tmp, (string) ($file['type'] ?? ''));
        if (!isset(self::TYPES[$mime])) {
            throw new HttpError(400, 'INVALID_FILE_TYPE', 'Allowed types: ' . implode(', ', array_keys(self::TYPES)));
        }

        $dir = self::dir();
        if (!is_dir($dir) && !@mkdir($dir, 0755, true) && !is_dir($dir)) {
            throw new \RuntimeException('Upload folder is missing and could not be created: ' . $dir);
        }
        $name = self::uuid() . '.' . self::TYPES[$mime];
        if (!move_uploaded_file($tmp, $dir . '/' . $name)) {
            throw new \RuntimeException('Could not save uploaded file');
        }
        @chmod($dir . '/' . $name, 0644);

        return rtrim((string) Config::get('upload.url_prefix', '/uploads'), '/') . '/' . $name;
    }

    /** Deletes a file previously returned by saveImage(). */
    public static function remove(string $url): void
    {
        $prefix = rtrim((string) Config::get('upload.url_prefix', '/uploads'), '/') . '/';
        if (strpos($url, $prefix) !== 0) {
            return;
        }
        $path = self::dir() . '/' . basename(substr($url, strlen($prefix)));
        if (is_file($path)) {
            @unlink($path);
        }
    }

    private static function dir(): string
    {
        return rtrim((string) Config::get('upload.dir', dirname(__DIR__, 3) . '/uploads'), '/');
    }

    private static function detectMime(string $path, string $declared): string
    {
        $mime = '';
        if (function_exists('finfo_open')) {
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            if ($finfo) {
                $mime = (string) finfo_file($finfo, $path);
                finfo_close($finfo);
            }
        }
        if (!isset(self::TYPES[$mime])) {
            $info = @getimagesize($path);
            if (is_array($info) && isset($info['mime'])) {
                $mime = (string) $info['mime'];
            }
        }
        // Older libmagic builds do not recognise AVIF: check the ISO-BMFF brand ourselves.
        if (!isset(self::TYPES[$mime]) && $declared === 'image/avif') {
            $head = (string) @file_get_contents($path, false, null, 0, 16);
            if (strlen($head) >= 12 && in_array(substr($head, 4, 8), ['ftypavif', 'ftypavis'], true)) {
                $mime = 'image/avif';
            }
        }
        return $mime;
    }

    private static function uuid(): string
    {
        $b = random_bytes(16);
        $b[6] = chr((ord($b[6]) & 0x0f) | 0x40);
        $b[8] = chr((ord($b[8]) & 0x3f) | 0x80);
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($b), 4));
    }
}
