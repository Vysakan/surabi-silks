<?php

namespace App\Controllers;

use App\Http\HttpError;
use App\Http\Request;
use App\Repositories\OrderRepository;
use App\Support\Auth;

final class OrderController
{
    private const NEXT_STATUS = [
        'pending' => ['confirmed', 'cancelled'],
        'confirmed' => ['processing', 'cancelled'],
        'processing' => ['shipped', 'cancelled'],
        'shipped' => ['out_for_delivery', 'delivered'],
        'out_for_delivery' => ['delivered'],
        'delivered' => [],
        'cancelled' => [],
    ];

    /** Customers see their own orders; admins see everyone's. */
    public static function getAll(Request $req): array
    {
        $q = $req->validated;
        return [200, OrderRepository::list($q['page'], $q['limit'], $q['status'] ?? null, self::scope($req))];
    }

    public static function getById(Request $req): array
    {
        $order = OrderRepository::findById($req->params['id'], self::scope($req));
        if (!$order) {
            throw HttpError::notFound('Order');
        }
        return [200, $order];
    }

    public static function create(Request $req): array
    {
        return [201, OrderRepository::create($req->user['id'], $req->validated)];
    }

    public static function updateStatus(Request $req): array
    {
        $id = $req->params['id'];
        $status = $req->validated['status'];
        $current = OrderRepository::findById($id);
        if (!$current) {
            throw HttpError::notFound('Order');
        }
        if (!in_array($status, self::NEXT_STATUS[$current['status']] ?? [], true)) {
            throw new HttpError(
                400,
                'INVALID_STATUS_TRANSITION',
                'Cannot change order status from ' . $current['status'] . ' to ' . $status
            );
        }
        return [200, OrderRepository::updateStatus($id, $status)];
    }

    private static function scope(Request $req): ?int
    {
        return Auth::isStaff($req->user['role']) ? null : $req->user['id'];
    }
}
