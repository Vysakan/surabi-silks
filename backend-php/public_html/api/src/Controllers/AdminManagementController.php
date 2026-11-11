<?php

namespace App\Controllers;

use App\Http\HttpError;
use App\Http\Request;
use App\Repositories\UserRepository;
use App\Support\Auth;
use App\Support\Db;

final class AdminManagementController
{
    public static function list(Request $req): array
    {
        return [200, Db::all("SELECT id, name, email, phone, role, created_at AS createdAt FROM users WHERE role IN ('admin', 'root_admin') ORDER BY role DESC, name ASC")];
    }

    public static function create(Request $req): array
    {
        $d = $req->validated;
        $email = strtolower(trim($d['email']));
        if (UserRepository::findByEmail($email)) throw HttpError::conflict('Email already registered');
        try {
            $id = UserRepository::create($d['name'], $email, $d['phone'] ?? null, Auth::hashPassword($d['password']), 'admin');
        } catch (\PDOException $e) {
            if ($e->getCode() === '23000') throw HttpError::conflict('Email already registered');
            throw $e;
        }
        Db::run("INSERT INTO auth_audit_log (user_id, actor_user_id, event_type, ip_address) VALUES (?, ?, 'admin_created', ?)", [$id, (int) $req->user['id'], $req->ip()]);
        return [201, ['id' => $id, 'name' => $d['name'], 'email' => $email, 'phone' => $d['phone'] ?? null, 'role' => 'admin']];
    }
}
