<?php

namespace App\Controllers;

use App\Http\HttpError;
use App\Http\Request;
use App\Repositories\PasswordResetRepository;
use App\Repositories\SessionRepository;
use App\Repositories\UserRepository;
use App\Support\Auth;
use App\Support\Config;
use App\Support\Emails;
use App\Support\Mailer;
use App\Support\Throttle;

/** Staff accounts. Every route here is for the root admin (role "superadmin") only. */
final class AdminUserController
{
    /** GET /admin/users?group=staff|customer|all&search=&page=&limit= */
    public static function getAll(Request $req): array
    {
        $q = $req->validated;
        return [200, UserRepository::list($q['group'], $q['search'] ?? null, $q['page'], $q['limit'])];
    }

    /**
     * POST /admin/users { name, email, role } - adds an admin.
     * A new person gets an email link to set their own password (nobody else ever knows it).
     * An existing customer account is promoted and keeps its password.
     */
    public static function create(Request $req): array
    {
        $d = $req->validated;
        $email = Auth::normalizeEmail($d['email']);
        $role = $d['role'];
        $by = $req->user['name'];

        $existing = UserRepository::findByEmail($email);
        if ($existing) {
            if (Auth::isStaff($existing['role'])) {
                throw HttpError::conflict('This person is already an admin.');
            }
            $id = (int) $existing['id'];
            UserRepository::setRole($id, $role);
            UserRepository::setActive($id, true);
            SessionRepository::removeAllForUser($id); // sign in again to pick up the new role
            $sent = false;
            $login = Emails::link('/login');
            if ($login !== null) {
                [$subject, $text, $html] = Emails::adminGranted($existing['name'], $by, $login);
                $sent = Mailer::send($email, $subject, $text, $html);
            }
            return [200, [
                'user' => UserRepository::toAdminView(UserRepository::findById($id)),
                'created' => false,
                'emailSent' => $sent,
            ]];
        }

        $id = UserRepository::create($d['name'], $email, null, Auth::unusableHash(), $role);
        $minutes = self::linkMinutes();
        $token = PasswordResetRepository::create($id, 'invite', $minutes, $req->ip());
        $link = Emails::link('/reset-password?token=' . $token);
        $sent = false;
        if ($link !== null) {
            [$subject, $text, $html] = Emails::adminInvite($d['name'], $by, $link, $minutes);
            $sent = Mailer::send($email, $subject, $text, $html);
        }
        $out = [
            'user' => UserRepository::toAdminView(UserRepository::findById($id)),
            'created' => true,
            'emailSent' => $sent,
        ];
        if (!$sent) {
            // Email is not set up or failed: the root admin passes the link on personally.
            $out['setupLink'] = $link;
        }
        return [201, $out];
    }

    /** PATCH /admin/users/:id { role?, isActive? } */
    public static function update(Request $req): array
    {
        $d = $req->validated;
        $target = self::mustFind((int) $req->params['id']);
        $id = (int) $target['id'];

        if ($id === $req->user['id']) {
            throw HttpError::forbidden('You cannot change your own role or disable your own account. Ask another root admin.');
        }

        $changed = false;
        $lastRoot = $target['role'] === 'superadmin' && (int) $target['is_active'] && UserRepository::countActiveSuperadmins() <= 1;

        if (array_key_exists('role', $d) && $d['role'] !== $target['role']) {
            if ($lastRoot) {
                throw HttpError::conflict('There must always be at least one active root admin.');
            }
            UserRepository::setRole($id, $d['role']);
            $changed = true;
        }
        if (array_key_exists('isActive', $d) && $d['isActive'] !== (bool) (int) $target['is_active']) {
            if (!$d['isActive'] && $lastRoot) {
                throw HttpError::conflict('There must always be at least one active root admin.');
            }
            UserRepository::setActive($id, $d['isActive']);
            $changed = true;
        }
        if ($changed) {
            SessionRepository::removeAllForUser($id); // the new role / disabled state applies immediately
        }
        return [200, UserRepository::toAdminView(UserRepository::findById($id))];
    }

    /** POST /admin/users/:id/send-reset - emails an admin a link to set a new password. */
    public static function sendReset(Request $req): array
    {
        $target = self::mustFind((int) $req->params['id']);
        if (!Auth::isStaff($target['role'])) {
            throw new HttpError(400, 'NOT_STAFF', 'Customers can reset their own password with "Forgot password" on the sign-in page.');
        }
        if (!(int) $target['is_active']) {
            throw new HttpError(400, 'ACCOUNT_DISABLED', 'Enable this account first.');
        }
        $id = (int) $target['id'];
        $minutes = self::linkMinutes();
        $token = PasswordResetRepository::create($id, 'reset', $minutes, $req->ip());
        Throttle::clear('login-fail', Auth::normalizeEmail($target['email']));
        $link = Emails::link('/reset-password?token=' . $token);
        $sent = false;
        if ($link !== null) {
            [$subject, $text, $html] = Emails::passwordReset($target['name'], $link, $minutes);
            $sent = Mailer::send($target['email'], $subject, $text, $html);
        }
        $out = ['emailSent' => $sent];
        if (!$sent) {
            $out['resetLink'] = $link;
        }
        return [200, $out];
    }

    private static function mustFind(int $id): array
    {
        $user = UserRepository::findById($id);
        if (!$user) {
            throw HttpError::notFound('User');
        }
        return $user;
    }

    private static function linkMinutes(): int
    {
        return max(30, (int) Config::get('auth.invite_link_hours', 48) * 60);
    }
}
