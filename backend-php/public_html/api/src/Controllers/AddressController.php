<?php

namespace App\Controllers;

use App\Http\HttpError;
use App\Http\Request;
use App\Repositories\AddressRepository;

final class AddressController
{
    public static function getAll(Request $req): array
    {
        $userId = self::owner($req);
        return [200, AddressRepository::findByUser($userId)];
    }

    public static function create(Request $req): array
    {
        $userId = self::owner($req);
        return [201, AddressRepository::create($userId, $req->validated)];
    }

    public static function update(Request $req): array
    {
        $userId = self::owner($req);
        $addressId = (int) $req->params['addressId'];
        if (!AddressRepository::findById($addressId, $userId)) {
            throw HttpError::notFound('Address');
        }
        return [200, AddressRepository::update($addressId, $userId, $req->validated)];
    }

    public static function remove(Request $req): array
    {
        $userId = self::owner($req);
        $addressId = (int) $req->params['addressId'];
        if (!AddressRepository::findById($addressId, $userId)) {
            throw HttpError::notFound('Address');
        }
        AddressRepository::remove($addressId, $userId);
        return [204, null];
    }

    /** Users can only manage their own addresses (/customers/:customerId must be their id). */
    private static function owner(Request $req): int
    {
        if ((int) $req->params['customerId'] !== $req->user['id']) {
            throw HttpError::forbidden('You can only manage your own addresses');
        }
        return $req->user['id'];
    }
}
