<?php

namespace App\Support;

use App\Http\HttpError;

/** Image and video uploads, saved in the uploads folder and served at upload.url_prefix/<file>. */
final class Uploads
{
    private const TYPES = [
        'image/jpeg' => 'jpg',
        'image/png'  => 'png',
        'image/webp' => 'webp',
        'image/avif' => 'avif',
    ];

    /** Videos for the home-page reels. MP4 (H.264) plays on every phone and browser. */
    private const VIDEO_TYPES = [
        'video/mp4'  => 'mp4',
        'video/webm' => 'webm',
    ];

    /**
     * Validates and stores $_FILES[$field]. Returns the public URL, or null when no file was sent.
     * The file type is detected from the file contents and the extension is chosen by the server,
     * so an uploaded script can never be saved with an executable extension.
     */
    public static function saveImage(string $field): ?string
    {
        self::assertBodyNotDropped();
        $file = $_FILES[$field] ?? null;
        if (!is_array($file) || !isset($file['error']) || is_array($file['error'])) {
            return null;
        }
        $maxMb = self::maxImageMb();
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

        return self::store($tmp, self::TYPES[$mime]);
    }

    /**
     * Validates and stores an uploaded video ($_FILES[$field]): MP4 or WebM, up to maxVideoMb().
     * Returns the public URL, or null when no file was sent.
     */
    public static function saveVideo(string $field): ?string
    {
        self::assertBodyNotDropped();
        $file = $_FILES[$field] ?? null;
        if (!is_array($file) || !isset($file['error']) || is_array($file['error'])) {
            return null;
        }
        $maxMb = self::maxVideoMb();
        switch ((int) $file['error']) {
            case UPLOAD_ERR_OK:
                break;
            case UPLOAD_ERR_NO_FILE:
                return null;
            case UPLOAD_ERR_INI_SIZE:
            case UPLOAD_ERR_FORM_SIZE:
                throw new HttpError(413, 'FILE_TOO_LARGE', 'The video must be ' . $maxMb . ' MB or smaller');
            case UPLOAD_ERR_PARTIAL:
                throw new HttpError(400, 'UPLOAD_FAILED', 'The video upload was interrupted. Please try again.');
            default:
                throw new HttpError(400, 'UPLOAD_FAILED', 'The video could not be uploaded');
        }
        if ((int) $file['size'] > $maxMb * 1024 * 1024) {
            throw new HttpError(413, 'FILE_TOO_LARGE', 'The video must be ' . $maxMb . ' MB or smaller');
        }

        $tmp = (string) $file['tmp_name'];
        $mime = self::detectVideoMime($tmp);
        if ($mime === 'video/quicktime') {
            throw new HttpError(400, 'INVALID_FILE_TYPE', 'MOV videos do not play on every phone. Save or export the video as MP4 and upload that.');
        }
        if (!isset(self::VIDEO_TYPES[$mime])) {
            throw new HttpError(400, 'INVALID_FILE_TYPE', 'Upload the video as an MP4 (or WebM) file');
        }
        return self::store($tmp, self::VIDEO_TYPES[$mime]);
    }

    /** Largest image upload in MB: the configured limit, lowered to what PHP accepts. */
    public static function maxImageMb(): int
    {
        return self::cappedMb((int) Config::get('upload.max_file_size_mb', 5));
    }

    /** Largest video upload in MB: upload.max_video_size_mb, lowered to what PHP accepts. */
    public static function maxVideoMb(): int
    {
        return self::cappedMb((int) Config::get('upload.max_video_size_mb', 50));
    }

    private static function cappedMb(int $configured): int
    {
        $mb = max(1, $configured);
        foreach (['upload_max_filesize', 'post_max_size'] as $key) {
            $bytes = self::iniBytes((string) ini_get($key));
            if ($bytes > 0) {
                $mb = min($mb, max(1, (int) floor($bytes / 1048576)));
            }
        }
        return $mb;
    }

    /** php.ini size ("128M", "2G", "512K", "1048576") in bytes; 0 means no limit. */
    private static function iniBytes(string $value): int
    {
        $value = trim($value);
        if ($value === '' || $value === '-1') {
            return 0;
        }
        $number = (int) $value;
        switch (strtolower(substr($value, -1))) {
            case 'g':
                return $number * 1073741824;
            case 'm':
                return $number * 1048576;
            case 'k':
                return $number * 1024;
        }
        return $number;
    }

    /** When a request is bigger than post_max_size, PHP drops the whole body: say so instead of "no file". */
    private static function assertBodyNotDropped(): void
    {
        $length = (int) ($_SERVER['CONTENT_LENGTH'] ?? 0);
        $limit = self::iniBytes((string) ini_get('post_max_size'));
        if ($limit > 0 && $length > $limit && empty($_FILES) && empty($_POST)) {
            throw new HttpError(
                413,
                'FILE_TOO_LARGE',
                'This file is larger than the server accepts (' . (int) floor($limit / 1048576) . ' MB). '
                    . 'Use a smaller file, or raise post_max_size and upload_max_filesize in hPanel > Advanced > PHP Configuration.'
            );
        }
    }

    /** Moves an uploaded temp file into the uploads folder under a random name. */
    private static function store(string $tmp, string $extension): string
    {
        $dir = self::dir();
        if (!is_dir($dir) && !@mkdir($dir, 0755, true) && !is_dir($dir)) {
            throw new \RuntimeException('Upload folder is missing and could not be created: ' . $dir);
        }
        $name = self::uuid() . '.' . $extension;
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

    /** Deletes the file only when no product image, category or reel uses this URL any more. */
    public static function removeIfUnused(string $url): void
    {
        $used = (int) Db::value('SELECT COUNT(*) FROM product_images WHERE url = ?', [$url])
            + (int) Db::value('SELECT COUNT(*) FROM categories WHERE image = ?', [$url]);
        try {
            $used += (int) Db::value('SELECT COUNT(*) FROM reels WHERE video_url = ? OR cover_url = ?', [$url, $url]);
        } catch (\PDOException $e) {
            // The reels table does not exist until migration-2026-11-reels.sql has been run.
            if (($e->errorInfo[1] ?? null) != 1146) {
                throw $e;
            }
        }
        if ($used === 0) {
            self::remove($url);
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

    /** Video type from the file's first bytes (finfo as a second opinion). */
    private static function detectVideoMime(string $path): string
    {
        $head = (string) @file_get_contents($path, false, null, 0, 64);
        if (strlen($head) >= 12 && substr($head, 4, 4) === 'ftyp') {
            // ISO base media file. The brand says what it is: MP4 video, QuickTime MOV,
            // or something else in the same container (HEIC/AVIF photos, M4A audio).
            $brand = substr($head, 8, 4);
            if ($brand === 'qt  ') {
                return 'video/quicktime';
            }
            $mp4Brands = ['isom', 'iso2', 'iso3', 'iso4', 'iso5', 'iso6', 'mp41', 'mp42', 'mp71', 'avc1',
                'M4V ', 'M4VH', 'M4VP', 'dash', 'mmp4', 'MSNV', 'XAVC'];
            if (in_array($brand, $mp4Brands, true)) {
                return 'video/mp4';
            }
        }
        if (strncmp($head, "\x1A\x45\xDF\xA3", 4) === 0 && strpos($head, 'webm') !== false) {
            return 'video/webm';
        }
        if (function_exists('finfo_open')) {
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            if ($finfo) {
                $mime = (string) finfo_file($finfo, $path);
                finfo_close($finfo);
                if ($mime === 'video/x-m4v') {
                    return 'video/mp4';
                }
                return $mime;
            }
        }
        return '';
    }

    private static function uuid(): string
    {
        $b = random_bytes(16);
        $b[6] = chr((ord($b[6]) & 0x0f) | 0x40);
        $b[8] = chr((ord($b[8]) & 0x3f) | 0x80);
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($b), 4));
    }
}
