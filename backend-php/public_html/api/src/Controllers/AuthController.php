<?php

namespace App\Controllers;

use App\Http\HttpError;
use App\Http\Request;
use App\Repositories\SessionRepository;
use App\Repositories\UserRepository;
use App\Support\Auth;
use App\Support\Fmt;
use App\Support\Db;
use App\Support\Config;

final class AuthController
{
    public static function register(Request $req): array
    {
        $d = $req->validated;
        $d['email'] = strtolower(trim($d['email']));
        if (UserRepository::findByEmail($d['email'])) {
            throw HttpError::conflict('Email already registered');
        }
        try {
            $id = UserRepository::create($d['name'], $d['email'], $d['phone'] ?? null, Auth::hashPassword($d['password']));
        } catch (\PDOException $e) {
            if ($e->getCode() === '23000') throw HttpError::conflict('Email already registered');
            throw $e;
        }
        Auth::setSessionCookie(SessionRepository::create($id));

        $user = ['id' => $id, 'name' => $d['name'], 'email' => $d['email']];
        if (array_key_exists('phone', $d)) {
            $user['phone'] = $d['phone'];
        }
        $user['role'] = 'customer';
        $user['avatar'] = null;
        return [201, $user];
    }

    public static function login(Request $req): array
    {
        $d = $req->validated;
        $user = UserRepository::findByEmail($d['email']);
        if (!$user || !Auth::verifyPassword($d['password'], (string) $user['password_hash'])) {
            throw HttpError::unauthorized('Invalid email or password');
        }
        Auth::setSessionCookie(SessionRepository::create((int) $user['id']));
        return [200, self::sanitize($user)];
    }

    public static function logout(Request $req): array
    {
        if ($req->sessionId) {
            SessionRepository::remove($req->sessionId);
        }
        Auth::clearSessionCookie();
        return [200, ['message' => 'Logged out']];
    }

    public static function me(Request $req): array
    {
        $user = UserRepository::findById($req->user['id']);
        if (!$user) {
            throw new HttpError(404, 'NOT_FOUND', 'User not found');
        }
        return [200, self::sanitize($user)];
    }

    public static function forgotPassword(Request $req): array
    {
        $email = strtolower(trim($req->validated['email']));
        $user = Db::one("SELECT * FROM users WHERE (email = ? AND role IN ('customer', 'admin')) OR (role = 'root_admin' AND recovery_email = ? AND recovery_email_verified_at IS NOT NULL) LIMIT 1", [$email, $email]);
        // Keep the response identical whether the account exists or email delivery is configured.
        if ($user && in_array($user['role'], ['customer', 'admin', 'root_admin'], true)) {
            self::issueReset($user, $req->ip(), $user['role'] === 'root_admin' ? $user['recovery_email'] : $user['email']);
        }
        return [200, ['message' => 'If an account exists for that email, a reset link will be sent.']];
    }

    public static function resetPassword(Request $req): array
    {
        $d = $req->validated;
        $hash = hash('sha256', $d['token']);
        Db::transaction(function () use ($hash, $d) {
            $row = Db::one('SELECT id, user_id FROM password_reset_tokens WHERE token_hash = ? AND consumed_at IS NULL AND expires_at > UTC_TIMESTAMP() FOR UPDATE', [$hash]);
            if (!$row) throw new HttpError(400, 'INVALID_RESET_TOKEN', 'Reset link is invalid or expired');
            Db::run('UPDATE users SET password_hash = ? WHERE id = ?', [Auth::hashPassword($d['password']), (int) $row['user_id']]);
            Db::run('UPDATE password_reset_tokens SET consumed_at = UTC_TIMESTAMP() WHERE id = ?', [(int) $row['id']]);
            Db::run('DELETE FROM password_reset_tokens WHERE user_id = ? AND id <> ?', [(int) $row['user_id'], (int) $row['id']]);
            Db::run('DELETE FROM sessions WHERE user_id = ?', [(int) $row['user_id']]);
            $role = Db::value('SELECT role FROM users WHERE id = ?', [(int) $row['user_id']]);
            $event = $role === 'root_admin' ? 'root_admin_password_reset' : 'password_reset';
            Db::run('INSERT INTO auth_audit_log (user_id, event_type, ip_address) VALUES (?, ?, ?)', [(int) $row['user_id'], $event, $_SERVER['REMOTE_ADDR'] ?? null]);
        });
        Auth::clearSessionCookie();
        return [200, ['message' => 'Password updated. Please sign in again.']];
    }

    public static function changePassword(Request $req): array
    {
        $d = $req->validated;
        Db::transaction(function () use ($req, $d) {
            $user = Db::one('SELECT password_hash FROM users WHERE id = ? FOR UPDATE', [(int) $req->user['id']]);
            if (!$user || !Auth::verifyPassword($d['currentPassword'], (string) $user['password_hash'])) {
                throw new HttpError(400, 'INVALID_CURRENT_PASSWORD', 'Current password is incorrect');
            }
            Db::run('UPDATE users SET password_hash = ? WHERE id = ?', [Auth::hashPassword($d['newPassword']), (int) $req->user['id']]);
            Db::run('DELETE FROM sessions WHERE user_id = ?', [(int) $req->user['id']]);
            Db::run("INSERT INTO auth_audit_log (user_id, event_type, ip_address) VALUES (?, 'password_changed', ?)", [(int) $req->user['id'], $req->ip()]);
        });
        Auth::clearSessionCookie();
        return [200, ['message' => 'Password updated. Please sign in again.']];
    }

    private static function issueReset(array $user, string $ip, string $destination): void
    {
        if (!Config::get('mail.from') || !Config::get('app.reset_url')) {
            error_log('[auth] Password reset requested but mail.from or app.reset_url is not configured.');
            return;
        }
        $token = rtrim(strtr(base64_encode(random_bytes(32)), '+/', '-_'), '=');
        $url = rtrim((string) Config::get('app.reset_url'), '/') . '?token=' . rawurlencode($token);
        $tokenHash = hash('sha256', $token);
        Db::transaction(function () use ($user, $ip, $tokenHash) {
            Db::run('DELETE FROM password_reset_tokens WHERE user_id = ?', [(int) $user['id']]);
            Db::run('INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, request_ip) VALUES (?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 30 MINUTE), ?)', [(int) $user['id'], $tokenHash, $ip]);
            Db::run("INSERT INTO auth_audit_log (user_id, event_type, ip_address) VALUES (?, 'password_reset_requested', ?)", [(int) $user['id'], $ip]);
        });
        $subject = 'Reset your Surabi Silks password';
        $message = "A password reset was requested for your Surabi Silks account. This link expires in 30 minutes and can be used once:\n\n" . $url . "\n\nIf you did not request this, you can ignore this email.";
        $headers = "From: " . str_replace(["\r", "\n"], '', (string) Config::get('mail.from')) . "\r\nContent-Type: text/plain; charset=UTF-8";
        if (!mail($destination, $subject, $message, $headers)) {
            error_log('[auth] PHP mail() failed to deliver a password reset email. Configure working Hostinger mail delivery.');
        }
    }

    private static function sanitize(array $u): array
    {
        return [
            'id' => (int) $u['id'],
            'name' => $u['name'],
            'email' => $u['email'],
            'phone' => $u['phone'],
            'role' => $u['role'],
            'avatar' => $u['avatar'],
            'createdAt' => Fmt::date($u['created_at']),
        ];
    }
}
