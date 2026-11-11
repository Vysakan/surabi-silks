<?php

namespace App\Support;

/** The account emails (password reset, admin invite, notices). Each returns [subject, text, html]. */
final class Emails
{
    /** Absolute website URL for $path, or null when app.frontend_url is not configured. */
    public static function link(string $path): ?string
    {
        $base = trim((string) Config::get('app.frontend_url', ''));
        if ($base === '') {
            $base = trim((string) Config::get('cors.origin', ''));
        }
        if ($base === '' || !preg_match('#^https?://#i', $base)) {
            error_log('[mail] Set app.frontend_url in api/config.php so emails can link to the website.');
            return null;
        }
        return rtrim($base, '/') . $path;
    }

    public static function passwordReset(string $name, string $link, int $minutes): array
    {
        $shop = self::shop();
        return self::render(
            "Reset your $shop password",
            "Hi $name,",
            [
                "We received a request to reset the password for your $shop account.",
                "This link works once and expires in " . self::duration($minutes) . '.',
            ],
            'Choose a new password',
            $link,
            'If you did not ask for this, you can ignore this email. Your password will not change.'
        );
    }

    public static function adminInvite(string $name, string $invitedBy, string $link, int $minutes): array
    {
        $shop = self::shop();
        return self::render(
            "You have been added as an admin of $shop",
            "Hi $name,",
            [
                "$invitedBy has given you admin access to the $shop store dashboard.",
                'Set your password to activate your account. This link works once and expires in ' . self::duration($minutes) . '.',
            ],
            'Set my password',
            $link,
            'If you were not expecting this, ignore this email and tell the store owner.'
        );
    }

    public static function adminGranted(string $name, string $invitedBy, string $loginLink): array
    {
        $shop = self::shop();
        return self::render(
            "You now have admin access to $shop",
            "Hi $name,",
            ["$invitedBy has given your existing $shop account admin access. Sign in with your usual password to open the dashboard."],
            'Sign in',
            $loginLink,
            'If you were not expecting this, tell the store owner.'
        );
    }

    public static function passwordChanged(string $name, ?string $forgotLink): array
    {
        $shop = self::shop();
        return self::render(
            "Your $shop password was changed",
            "Hi $name,",
            [
                "The password for your $shop account was just changed, and you were signed out on your other devices.",
                'If this was you, there is nothing else to do.',
            ],
            $forgotLink ? 'This was not me: reset my password' : null,
            $forgotLink,
            'If you did not change it, reset your password straight away and contact the store.'
        );
    }

    // ---- layout --------------------------------------------------------------

    private static function shop(): string
    {
        return (string) Config::get('app.name', 'Surabhi Silks');
    }

    private static function duration(int $minutes): string
    {
        if ($minutes % 1440 === 0) {
            $d = intdiv($minutes, 1440);
            return $d . ($d === 1 ? ' day' : ' days');
        }
        if ($minutes % 60 === 0) {
            $h = intdiv($minutes, 60);
            return $h . ($h === 1 ? ' hour' : ' hours');
        }
        return $minutes . ' minutes';
    }

    private static function render(string $subject, string $greeting, array $paragraphs, ?string $button, ?string $link, string $footer): array
    {
        $text = $greeting . "\n\n" . implode("\n\n", $paragraphs) . "\n\n";
        if ($button && $link) {
            $text .= $button . ":\n" . $link . "\n\n";
        }
        $text .= $footer . "\n\n- " . self::shop() . "\n";

        $e = function (string $s): string {
            return htmlspecialchars($s, ENT_QUOTES, 'UTF-8');
        };
        $html = '<!doctype html><html><body style="margin:0;padding:24px;background:#f6f4f1;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a">'
            . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">'
            . '<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;padding:32px">'
            . '<tr><td style="font-size:20px;font-weight:bold;color:#ED0103;padding-bottom:16px">' . $e(self::shop()) . '</td></tr>'
            . '<tr><td style="font-size:15px;line-height:1.6"><p>' . $e($greeting) . '</p>';
        foreach ($paragraphs as $p) {
            $html .= '<p>' . $e($p) . '</p>';
        }
        if ($button && $link) {
            $html .= '<p style="padding:12px 0"><a href="' . $e($link) . '" style="background:#ED0103;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:8px;display:inline-block;font-weight:bold">'
                . $e($button) . '</a></p>'
                . '<p style="font-size:13px;color:#666666">If the button does not work, copy this address into your browser:<br><span style="word-break:break-all">'
                . $e($link) . '</span></p>';
        }
        $html .= '<p style="font-size:13px;color:#666666">' . $e($footer) . '</p></td></tr></table></td></tr></table></body></html>';

        return [$subject, $text, $html];
    }
}
