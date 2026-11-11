<?php

namespace App\Support;

/**
 * Sends email without any library.
 *   driver 'smtp' : a mailbox you created in hPanel > Emails (smtp.hostinger.com, port 465, SSL)
 *   driver 'mail' : PHP mail() (works on Hostinger, but messages land in spam more often)
 *   driver 'log'  : nothing is sent; the message is written to api/storage/mail.log (local testing)
 */
final class Mailer
{
    /** Returns true when the message was handed to a mail server, false otherwise (never throws). */
    public static function send(string $to, string $subject, string $text, string $html): bool
    {
        $to = trim($to);
        if (filter_var($to, FILTER_VALIDATE_EMAIL) === false) {
            error_log('[mail] invalid recipient address');
            return false;
        }
        $driver = (string) Config::get('mail.driver', 'log');
        try {
            if ($driver === 'smtp') {
                self::smtp($to, self::build($to, $subject, $text, $html));
                return true;
            }
            if ($driver === 'mail') {
                return self::phpMail($to, $subject, $text, $html);
            }
            self::log($to, $subject, $text);
            return false;
        } catch (\Throwable $e) {
            error_log('[mail] ' . $driver . ' failed: ' . $e->getMessage());
            return false;
        }
    }

    // ---- message ---------------------------------------------------------------

    private static function fromAddress(): string
    {
        $from = trim((string) Config::get('mail.from_email', ''));
        if ($from === '' || filter_var($from, FILTER_VALIDATE_EMAIL) === false) {
            throw new \RuntimeException("mail.from_email is missing or invalid in api/config.php");
        }
        return $from;
    }

    private static function fromHeader(): string
    {
        $name = self::clean((string) Config::get('mail.from_name', Config::get('app.name', 'Surabhi Silks')));
        return self::encode($name) . ' <' . self::fromAddress() . '>';
    }

    /** Headers + body with CRLF line endings, ready for SMTP DATA. */
    private static function build(string $to, string $subject, string $text, string $html): string
    {
        [$headers, $body] = self::parts($subject, $text, $html);
        array_unshift($headers, 'To: <' . $to . '>', 'Subject: ' . self::encode(self::clean($subject)));
        return implode("\r\n", $headers) . "\r\n\r\n" . $body;
    }

    /** Returns [header lines without To/Subject, MIME body]. */
    private static function parts(string $subject, string $text, string $html): array
    {
        $from = self::fromAddress();
        $domain = substr(strrchr($from, '@'), 1);
        $boundary = 'b' . bin2hex(random_bytes(12));
        $headers = [
            'Date: ' . date('r'),
            'From: ' . self::fromHeader(),
            'Message-ID: <' . bin2hex(random_bytes(16)) . '@' . $domain . '>',
            'MIME-Version: 1.0',
            'Content-Type: multipart/alternative; boundary="' . $boundary . '"',
        ];
        $body = '--' . $boundary . "\r\n"
            . "Content-Type: text/plain; charset=UTF-8\r\n"
            . "Content-Transfer-Encoding: base64\r\n\r\n"
            . rtrim(chunk_split(base64_encode($text), 76, "\r\n")) . "\r\n"
            . '--' . $boundary . "\r\n"
            . "Content-Type: text/html; charset=UTF-8\r\n"
            . "Content-Transfer-Encoding: base64\r\n\r\n"
            . rtrim(chunk_split(base64_encode($html), 76, "\r\n")) . "\r\n"
            . '--' . $boundary . "--\r\n";
        return [$headers, $body];
    }

    private static function clean(string $value): string
    {
        return trim(str_replace(["\r", "\n"], ' ', $value));
    }

    private static function encode(string $value): string
    {
        return preg_match('/[^\x20-\x7E]/', $value) ? '=?UTF-8?B?' . base64_encode($value) . '?=' : $value;
    }

    // ---- drivers -------------------------------------------------------------

    private static function phpMail(string $to, string $subject, string $text, string $html): bool
    {
        [$headers, $body] = self::parts($subject, $text, $html);
        $ok = mail($to, self::encode(self::clean($subject)), $body, implode("\r\n", $headers), '-f' . self::fromAddress());
        if (!$ok) {
            error_log('[mail] PHP mail() returned false');
        }
        return $ok;
    }

    private static function log(string $to, string $subject, string $text): void
    {
        $dir = dirname(__DIR__, 2) . '/storage';
        if (!is_dir($dir)) {
            @mkdir($dir, 0700, true);
        }
        $entry = '==== ' . date('c') . "\nTo: " . $to . "\nSubject: " . $subject . "\n\n" . $text . "\n\n";
        @file_put_contents($dir . '/mail.log', $entry, FILE_APPEND | LOCK_EX);
    }

    private static function smtp(string $to, string $message): void
    {
        $c = Config::get('mail.smtp', []);
        $host = (string) ($c['host'] ?? 'smtp.hostinger.com');
        $port = (int) ($c['port'] ?? 465);
        $encryption = strtolower((string) ($c['encryption'] ?? 'ssl')); // ssl | tls | none
        $user = (string) ($c['username'] ?? '');
        $pass = (string) ($c['password'] ?? '');
        $timeout = (int) ($c['timeout'] ?? 15);
        $from = self::fromAddress();

        $context = stream_context_create(['ssl' => [
            'verify_peer' => true,
            'verify_peer_name' => true,
            'peer_name' => $host,
        ]]);
        $remote = ($encryption === 'ssl' ? 'ssl://' : 'tcp://') . $host . ':' . $port;
        $fp = @stream_socket_client($remote, $errno, $errstr, $timeout, STREAM_CLIENT_CONNECT, $context);
        if (!$fp) {
            throw new \RuntimeException("cannot connect to $host:$port ($errstr)");
        }
        stream_set_timeout($fp, $timeout);

        try {
            $hello = substr(strrchr($from, '@'), 1);
            self::expect($fp, [220], 'greeting');
            self::command($fp, 'EHLO ' . $hello, [250]);
            if ($encryption === 'tls') {
                self::command($fp, 'STARTTLS', [220]);
                $method = STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT
                    | (defined('STREAM_CRYPTO_METHOD_TLSv1_3_CLIENT') ? STREAM_CRYPTO_METHOD_TLSv1_3_CLIENT : 0);
                if (!stream_socket_enable_crypto($fp, true, $method)) {
                    throw new \RuntimeException('STARTTLS failed');
                }
                self::command($fp, 'EHLO ' . $hello, [250]);
            }
            if ($user !== '') {
                self::command($fp, 'AUTH LOGIN', [334]);
                self::command($fp, base64_encode($user), [334], 'username');
                self::command($fp, base64_encode($pass), [235], 'password (check mail.smtp.password)');
            }
            self::command($fp, 'MAIL FROM:<' . $from . '>', [250]);
            self::command($fp, 'RCPT TO:<' . $to . '>', [250, 251]);
            self::command($fp, 'DATA', [354]);
            // Dot-stuffing: a line starting with "." gets a second one.
            $data = preg_replace('/^\./m', '..', str_replace(["\r\n", "\r"], "\n", $message));
            fwrite($fp, str_replace("\n", "\r\n", $data) . "\r\n.\r\n");
            self::expect($fp, [250], 'message');
            @fwrite($fp, "QUIT\r\n");
        } finally {
            fclose($fp);
        }
    }

    private static function command($fp, string $line, array $codes, ?string $label = null): void
    {
        fwrite($fp, $line . "\r\n");
        self::expect($fp, $codes, $label ?? $line);
    }

    private static function expect($fp, array $codes, string $label): void
    {
        $reply = '';
        $code = 0;
        while (($line = fgets($fp, 1024)) !== false) {
            $reply .= $line;
            // Multi-line replies use "250-..." until the last line "250 ...".
            if (strlen($line) < 4 || $line[3] !== '-') {
                $code = (int) substr($line, 0, 3);
                break;
            }
        }
        if (!in_array($code, $codes, true)) {
            $meta = stream_get_meta_data($fp);
            $why = !empty($meta['timed_out']) ? 'timed out' : trim($reply);
            throw new \RuntimeException("SMTP $label: $why");
        }
    }
}
