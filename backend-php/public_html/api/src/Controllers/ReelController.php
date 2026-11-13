<?php

namespace App\Controllers;

use App\Http\HttpError;
use App\Http\Request;
use App\Repositories\ReelRepository;
use App\Support\Db;
use App\Support\Instagram;
use App\Support\Uploads;

/**
 * Home-page reels ("See it in action"). Shop staff add them in the admin dashboard, either
 *  - an uploaded video: upload the video and a cover picture first (POST /reels/videos,
 *    POST /reels/covers), then save the reel with the returned URLs, or
 *  - an Instagram reel: save the reel with its Instagram link as videoUrl. The cover picture
 *    is optional for these, because Instagram does not share its own cover with other websites.
 */
final class ReelController
{
    /** An uploaded file (https://.../uploads/x.mp4) or a site path (/videos/x.mp4). */
    private const MEDIA_URL = '#^(https?://|/)[^\s"\'<>]+$#iD';

    /** YouTube and Facebook page links are not video files, so a browser cannot play them. */
    private const PAGE_LINK = '#^https?://([a-z0-9-]+\.)*(youtube\.com|youtu\.be|facebook\.com|fb\.watch)(/|$)#i';

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
        $d['coverUrl'] = self::checkCover($d['coverUrl'] ?? null, self::isInstagram($d['videoUrl']));
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
        $instagram = self::isInstagram($d['videoUrl'] ?? $existing['videoUrl']);
        if (array_key_exists('coverUrl', $d)) {
            $d['coverUrl'] = self::checkCover($d['coverUrl'], $instagram);
        } elseif (!$instagram && (string) ($existing['coverUrl'] ?? '') === '') {
            // An Instagram reel without a cover is being changed into an uploaded video.
            throw HttpError::field('coverUrl', 'Please upload a cover picture');
        }
        if (array_key_exists('productId', $d)) {
            self::checkProduct($d['productId']);
        }

        $updated = ReelRepository::update($id, $d);
        // Replaced files are deleted when nothing else uses them.
        foreach (['videoUrl', 'coverUrl'] as $key) {
            $old = (string) ($existing[$key] ?? '');
            if (array_key_exists($key, $d) && $old !== '' && $old !== (string) $d[$key]) {
                Uploads::removeIfUnused($old);
            }
        }
        return [200, $updated];
    }

    public static function remove(Request $req): array
    {
        $id = (int) $req->params['id'];
        $existing = self::mustFind($id);
        ReelRepository::remove($id);
        foreach (['videoUrl', 'coverUrl'] as $key) {
            $old = (string) ($existing[$key] ?? '');
            if ($old !== '') {
                Uploads::removeIfUnused($old);
            }
        }
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

    /** An uploaded video, a video file link, or an Instagram reel link (stored in its standard form). */
    private static function requireVideo($url): string
    {
        $url = is_string($url) ? trim($url) : '';
        if ($url === '') {
            throw HttpError::field('videoUrl', 'Please upload the reel video or paste an Instagram reel link');
        }
        $instagram = Instagram::canonical($url);
        if ($instagram !== null) {
            return $instagram;
        }
        if (Instagram::isInstagramAddress($url)) {
            throw HttpError::field('videoUrl', 'This is not a link to one Instagram reel. On Instagram, open the reel, tap Share > Copy link and paste that link (it looks like https://www.instagram.com/reel/ABC123/).');
        }
        if (preg_match(self::PAGE_LINK, $url)) {
            throw HttpError::field('videoUrl', 'YouTube and Facebook links cannot be played on the website. Upload the video file, or use an Instagram reel link.');
        }
        if (!preg_match(self::MEDIA_URL, $url)) {
            throw HttpError::field('videoUrl', 'Upload a video file, or enter a link that starts with https://');
        }
        return $url;
    }

    /** The cover picture: required for uploaded videos, optional ('' when missing) for Instagram reels. */
    private static function checkCover($url, bool $optional): string
    {
        $url = is_string($url) ? trim($url) : '';
        if ($url === '') {
            if ($optional) {
                return '';
            }
            throw HttpError::field('coverUrl', 'Please upload a cover picture');
        }
        if (!preg_match(self::MEDIA_URL, $url)) {
            throw HttpError::field('coverUrl', 'The cover must be an uploaded picture');
        }
        return $url;
    }

    private static function isInstagram($url): bool
    {
        return Instagram::canonical(is_string($url) ? $url : null) !== null;
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
                    'Reels are not set up in the database yet. Run database/migration-2026-11-reels-hostinger.sql in phpMyAdmin '
                        . '(on your own PC: database/migration-2026-11-reels.sql), then try again.'
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
