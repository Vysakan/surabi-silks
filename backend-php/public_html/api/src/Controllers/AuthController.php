<?php

namespace App\Controllers;

use App\Http\HttpError;
use App\Http\Request;
use App\Repositories\SessionRepository;
use App\Repositories\UserRepository;
use App\Support\Auth;
use App\Support\Fmt;

final class AuthController
{
    public static function register(Request $req): array
    {
        $d = $req->validated;
        if (UserRepository::findByEmail($d['email'])) {
            throw HttpError::conflict('Email already registered');
        }
        $id = UserRepository::create($d['name'], $d['email'], $d['phone'] ?? null, Auth::hashPassword($d['password']));
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
