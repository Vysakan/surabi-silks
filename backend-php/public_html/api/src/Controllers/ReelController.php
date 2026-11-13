<?php

namespace App\Controllers;

use App\Http\HttpError;
use App\Http\Request;
use App\Repositories\ReelRepository;
use App\Support\Db;
use App\Support\Uploads;

/**
 * Home-page reels ("See it in action"). Shop staff add them in the admin dashboard:
 * upload the video and a cover picture first (POST /reels/videos, POST /reels/covers),
 * then save the reel with the returned URLs.
 */
final class ReelController
{
    /** An uploaded file (https://.../uploads/x.mp4) or a site path (/videos/x.mp4). */
    private const MEDIA_URL = '#^(https?://|/)[^\s"\'<>]+$#iD';

    /** Social-media page links are not video files, so a browser cannot play them. */
    private const PAGE_LINK = '#^https?://([a-z0-9-]+\.)*(instagram\.com|instagr\.am|youtube\.com|youtu\.be|facebook\.com|fb\.watch)(/|$)#i';

    /** Most reels shown on the website. */
    private const PUBLIC_LIMIT = 24;

    /** GET /reels - the reels customers see (switched on), in display order. */
    public static function getActive(Request $req): array
    {
        try {
            return [200, ReelRepository::findAll(true, self::PUBLIC_LIMIT)];
        } catch (\PDOException $e) {
            if (self::tableMissing($e)) {
                return [200, []]; // not set up yet: the website simply shows no reels
            }
            throw $e;
        }
    }

    /** GET /admin/reels - every reel, plus the upload size limits for the form. */
    public static function adminList(Request $req): array
    {
        $items = self::guard(function () {
            return ReelRepository::findAll(false);
        });
        return [200, [
            'items' => $items,
            'maxVideoMb' => Uploads::maxVideoMb(),
            'maxImageMb' => Uploads::maxImageMb(),
        ]];
    }

    public static function create(Request $req): array
    {
        $d = $req->validated;
        $d['videoUrl'] = self::requireVideo($d['videoUrl'] ?? null);
        $d['coverUrl'] = self::requireCover($d['coverUrl'] ?? null);
        self::checkProduct($d['productId'] ?? null);
        return [201, self::guard(function () use ($d) {
            return ReelRepository::create($d);
        })];
    }

    public static function update(Request $req): array
    {
        $id = (int) $req->params['id'];
        $existing = self::mustFind($id);
        $d = $req->validated;
        if (array_key_exists('videoUrl', $d)) {
            $d['videoUrl'] = self::requireVideo($d['videoUrl']);
        }
        if (array_key_exists('coverUrl', $d)) {
            $d['coverUrl'] = self::requireCover($d['coverUrl']);
        }
        if (array_key_exists('productId', $d)) {
            self::checkProduct($d['productId']);
        }

        $updated = ReelRepository::update($id, $d);
        // Replaced files are deleted when nothing else uses them.
        foreach (['videoUrl', 'coverUrl'] as $key) {
            if (isset($d[$key]) && $existing[$key] !== $d[$key]) {
                Uploads::removeIfUnused($existing[$key]);
            }
        }
        return [200, $updated];
    }

    public static function remove(Request $req): array
    {
        $id = (int) $req->params['id'];
        $existing = self::mustFind($id);
        ReelRepository::remove($id);
        Uploads::removeIfUnused($existing['videoUrl']);
        Uploads::removeIfUnused($existing['coverUrl']);
        return [204, null];
    }

    /** POST /reels/videos (multipart, field "video") -> { url }. */
    public static function uploadVideo(Request $req): array
    {
        $url = Uploads::saveVideo('video');
        if ($url === null) {
            throw new HttpError(400, 'NO_FILE', 'No video uploaded');
        }
        return [201, ['url' => $url]];
    }

    /** POST /reels/covers (multipart, field "image") -> { url }. */
    public static function uploadCover(Request $req): array
    {
        $url = Uploads::saveImage('image');
        if ($url === null) {
            throw new HttpError(400, 'NO_FILE', 'No image uploaded');
        }
        return [201, ['url' => $url]];
    }

    // ---- rules ---------------------------------------------------------------

    private static function requireVideo($url): string
    {
        $url = is_string($url) ? trim($url) : '';
        if ($url === '') {
            throw HttpError::field('videoUrl', 'Please upload the reel video');
        }
        if (preg_match(self::PAGE_LINK, $url)) {
            throw HttpError::field('videoUrl', 'Instagram, YouTube and Facebook links cannot be played on the website. Download the video and upload the file instead.');
        }
        if (!preg_match(self::MEDIA_URL, $url)) {
            throw HttpError::field('videoUrl', 'Upload a video file, or enter a link that starts with https://');
        }
        return $url;
    }

    private static function requireCover($url): string
    {
        $url = is_string($url) ? trim($url) : '';
        if ($url === '') {
            throw HttpError::field('coverUrl', 'Please upload a cover picture');
        }
        if (!preg_match(self::MEDIA_URL, $url)) {
            throw HttpError::field('coverUrl', 'The cover must be an uploaded picture');
        }
        return $url;
    }

    private static function checkProduct($productId): void
    {
        if ($productId === null) {
            return;
        }
        $found = (int) Db::value('SELECT COUNT(*) FROM products WHERE id = ? AND is_archived = 0', [(int) $productId]);
        if ($found === 0) {
            throw HttpError::field('productId', 'The selected product does not exist or is archived');
        }
    }

    private static function mustFind(int $id): array
    {
        $reel = self::guard(function () use ($id) {
            return ReelRepository::findById($id);
        });
        if (!$reel) {
            throw HttpError::notFound('Reel');
        }
        return $reel;
    }

    /** Runs $fn, turning "table reels doesn't exist" into a message that says what to do. */
    private static function guard(callable $fn)
    {
        try {
            return $fn();
        } catch (\PDOException $e) {
            if (self::tableMissing($e)) {
                throw new HttpError(
                    503,
                    'SETUP_REQUIRED',
                    'Reels are not set up in the database yet. Run database/migration-2026-11-reels-hostinger.sql in phpMyAdmin, then try again.'
                );
            }
            throw $e;
        }
    }

    private static function tableMissing(\PDOException $e): bool
    {
        return (int) ($e->errorInfo[1] ?? 0) === 1146;
    }
}
