<?php

namespace App\Controllers;

use App\Http\HttpError;
use App\Http\Request;
use App\Repositories\PasswordResetRepository;
use App\Repositories\SessionRepository;
use App\Repositories\UserRepository;
use App\Support\Auth;
use App\Support\Config;
use App\Support\Db;
use App\Support\Emails;
use App\Support\Fmt;
use App\Support\Mailer;
use App\Support\Throttle;

final class AuthController
{
    /** Failed sign-ins allowed per account before it is locked for the window. */
    private const MAX_FAILED_LOGINS = 5;
    private const LOGIN_WINDOW = 900;
    /** Reset emails per address per hour (extra requests are silently ignored). */
    private const MAX_RESET_EMAILS = 3;

    private const FORGOT_MESSAGE = 'If an account exists for that email, we have sent a link to reset the password. Please check your inbox and spam folder.';

    public static function register(Request $req): array
    {
        $d = $req->validated;
        $email = Auth::normalizeEmail($d['email']);
        $problem = Auth::passwordProblem($d['password'], $email);
        if ($problem !== null) {
            throw HttpError::field('password', $problem);
        }
        if (UserRepository::findByEmail($email)) {
            throw HttpError::conflict('This email is already registered. Sign in, or use "Forgot password" to reset it.');
        }
        try {
            $id = UserRepository::create($d['name'], $email, $d['phone'] ?? null, Auth::hashPassword($d['password']));
        } catch (\PDOException $e) {
            if (Db::isDuplicateKey($e)) {
                throw HttpError::conflict('This email is already registered. Sign in, or use "Forgot password" to reset it.');
            }
            throw $e;
        }
        self::dropSessionFromCookie($req);
        Auth::setSessionCookie(SessionRepository::create($id));
        UserRepository::touchLogin($id);

        $user = ['id' => $id, 'name' => $d['name'], 'email' => $email];
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
        $email = Auth::normalizeEmail($d['email']);

        $wait = Throttle::blockedFor('login-fail', $email, self::MAX_FAILED_LOGINS);
        if ($wait > 0) {
            throw self::locked($wait);
        }

        $user = UserRepository::findByEmail($email);
        if ($user) {
            $ok = Auth::verifyPassword($d['password'], (string) $user['password_hash']);
        } else {
            Auth::burnPasswordCheck($d['password']); // same response time for unknown emails
            $ok = false;
        }
        if (!$ok) {
            $fails = Throttle::hit('login-fail', $email, self::LOGIN_WINDOW);
            if ($fails >= self::MAX_FAILED_LOGINS) {
                throw self::locked(self::LOGIN_WINDOW);
            }
            throw HttpError::unauthorized('Invalid email or password');
        }
        if (!(int) $user['is_active']) {
            throw new HttpError(403, 'ACCOUNT_DISABLED', 'This account has been disabled. Please contact the store.');
        }
        Throttle::clear('login-fail', $email);

        $id = (int) $user['id'];
        if (Auth::needsRehash((string) $user['password_hash'])) {
            UserRepository::updatePassword($id, Auth::hashPassword($d['password']), false);
        }
        self::dropSessionFromCookie($req);
        Auth::setSessionCookie(SessionRepository::create($id));
        UserRepository::touchLogin($id);
        if (random_int(1, 50) === 1) {
            SessionRepository::purgeExpired();
            PasswordResetRepository::purgeOld();
        }
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

    /** POST /auth/forgot-password { email } - always the same answer, so it never reveals who has an account. */
    public static function forgotPassword(Request $req): array
    {
        $email = Auth::normalizeEmail($req->validated['email']);
        $user = UserRepository::findByEmail($email);

        if ($user && (int) $user['is_active']
            && Throttle::hit('reset-mail', $email, 3600) <= self::MAX_RESET_EMAILS) {
            $minutes = self::resetMinutes();
            $token = PasswordResetRepository::create((int) $user['id'], 'reset', $minutes, $req->ip());
            $link = Emails::link('/reset-password?token=' . $token);
            if ($link !== null) {
                [$subject, $text, $html] = Emails::passwordReset($user['name'], $link, $minutes);
                Mailer::send($user['email'], $subject, $text, $html);
            }
        }
        return [200, ['message' => self::FORGOT_MESSAGE]];
    }

    /** POST /auth/reset-password/verify { token } - lets the page show "link expired" before the form. */
    public static function verifyResetToken(Request $req): array
    {
        $row = self::validToken($req->validated['token']);
        return [200, [
            'valid' => true,
            'purpose' => $row['purpose'],
            'email' => self::maskEmail($row['email']),
        ]];
    }

    /** POST /auth/reset-password { token, password } */
    public static function resetPassword(Request $req): array
    {
        $d = $req->validated;
        $row = self::validToken($d['token']);
        $problem = Auth::passwordProblem($d['password'], $row['email']);
        if ($problem !== null) {
            throw HttpError::field('password', $problem);
        }
        $userId = (int) $row['user_id'];
        $hash = Auth::hashPassword($d['password']);

        Db::transaction(function () use ($row, $userId, $hash) {
            if (!PasswordResetRepository::consume((int) $row['id'])) {
                throw self::invalidToken();
            }
            UserRepository::updatePassword($userId, $hash);
            PasswordResetRepository::removeUnusedForUser($userId);
            SessionRepository::removeAllForUser($userId); // sign out everywhere
        });
        Throttle::clear('login-fail', Auth::normalizeEmail($row['email']));

        if ($row['purpose'] === 'reset') {
            [$subject, $text, $html] = Emails::passwordChanged($row['name'], Emails::link('/forgot-password'));
            Mailer::send($row['email'], $subject, $text, $html);
        }
        return [200, ['message' => $row['purpose'] === 'invite'
            ? 'Your password is set. You can now sign in.'
            : 'Your password has been reset. You can now sign in with the new password.']];
    }

    /** POST /auth/change-password { currentPassword, newPassword } (signed in) */
    public static function changePassword(Request $req): array
    {
        $d = $req->validated;
        $userId = $req->user['id'];
        $user = UserRepository::findById($userId);
        if (!$user) {
            throw HttpError::unauthorized();
        }
        $email = Auth::normalizeEmail($user['email']);

        $wait = Throttle::blockedFor('login-fail', $email, self::MAX_FAILED_LOGINS);
        if ($wait > 0) {
            throw self::locked($wait);
        }
        if (!Auth::verifyPassword($d['currentPassword'], (string) $user['password_hash'])) {
            Throttle::hit('login-fail', $email, self::LOGIN_WINDOW);
            throw HttpError::field('currentPassword', 'Your current password is not correct');
        }
        if (hash_equals($d['currentPassword'], $d['newPassword'])) {
            throw HttpError::field('newPassword', 'The new password must be different from the current one');
        }
        $problem = Auth::passwordProblem($d['newPassword'], $email);
        if ($problem !== null) {
            throw HttpError::field('newPassword', $problem);
        }

        UserRepository::updatePassword($userId, Auth::hashPassword($d['newPassword']));
        SessionRepository::removeAllForUser($userId, $req->sessionId); // other devices are signed out
        PasswordResetRepository::removeUnusedForUser($userId);
        Throttle::clear('login-fail', $email);

        [$subject, $text, $html] = Emails::passwordChanged($user['name'], Emails::link('/forgot-password'));
        Mailer::send($user['email'], $subject, $text, $html);

        return [200, ['message' => 'Password updated. You have been signed out on your other devices.']];
    }

    // ---- helpers -------------------------------------------------------------

    public static function sanitize(array $u): array
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

    public static function resetMinutes(): int
    {
        return max(5, (int) Config::get('auth.reset_link_minutes', 30));
    }

    private static function validToken(string $token): array
    {
        $row = PasswordResetRepository::findValid($token);
        if (!$row || !(int) $row['is_active']) {
            throw self::invalidToken();
        }
        return $row;
    }

    private static function invalidToken(): HttpError
    {
        return new HttpError(400, 'INVALID_TOKEN', 'This link is invalid or has expired. Please request a new one.');
    }

    private static function locked(int $seconds): HttpError
    {
        $minutes = max(1, (int) ceil($seconds / 60));
        return new HttpError(429, 'ACCOUNT_LOCKED', 'Too many failed attempts. Try again in ' . $minutes
            . ($minutes === 1 ? ' minute' : ' minutes') . ', or use "Forgot password" to reset your password.');
    }

    /** A new login replaces whatever session the browser had before. */
    private static function dropSessionFromCookie(Request $req): void
    {
        $old = $req->cookies[Auth::COOKIE] ?? null;
        if (is_string($old) && $old !== '' && strlen($old) <= 128) {
            SessionRepository::remove($old);
        }
    }

    private static function maskEmail(string $email): string
    {
        $at = strrpos($email, '@');
        if ($at === false || $at < 1) {
            return $email;
        }
        $name = substr($email, 0, $at);
        $shown = substr($name, 0, min(2, strlen($name)));
        return $shown . str_repeat('*', max(1, strlen($name) - strlen($shown))) . substr($email, $at);
    }
}
