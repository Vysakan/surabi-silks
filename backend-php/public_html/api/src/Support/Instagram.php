<?php

namespace App\Support;

/**
 * Instagram reel and post links (shown on the website with Instagram's own player).
 *
 * Accepts the link from Instagram's Share > Copy link, for example
 *   https://www.instagram.com/reel/C9abc123XYZ/?igsh=...
 *   https://www.instagram.com/surabhisilks/reel/C9abc123XYZ/
 *   instagram.com/p/C9abc123XYZ
 * and stores it in one standard form: https://www.instagram.com/reel/C9abc123XYZ/
 */
final class Instagram
{
    private const LINK = '#^https?://(?:www\.|m\.)?(?:instagram\.com|instagr\.am)/(?:[A-Za-z0-9._]+/)?(reels?|p|tv)/([A-Za-z0-9_-]{5,64})/?(?:[?\#].*)?$#iD';

    private const HOST = '#^(?:https?://)?(?:[a-z0-9-]+\.)*(?:instagram\.com|instagr\.am)(?:[/?\#]|$)#i';

    /** The standard link for one reel or post, or null when $url is not one. */
    public static function canonical(?string $url): ?string
    {
        $url = trim((string) $url);
        if ($url === '') {
            return null;
        }
        if (!preg_match('#^https?://#i', $url) && preg_match(self::HOST, $url)) {
            $url = 'https://' . $url;
        }
        if (!preg_match(self::LINK, $url, $m)) {
            return null;
        }
        $kind = strtolower($m[1]);
        if ($kind === 'reels') {
            $kind = 'reel';
        }
        return 'https://www.instagram.com/' . $kind . '/' . $m[2] . '/';
    }

    /** True for any instagram.com address (a profile, a story, a reel...). */
    public static function isInstagramAddress(?string $url): bool
    {
        return (bool) preg_match(self::HOST, trim((string) $url));
    }
}
