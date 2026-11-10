<?php

namespace App\Controllers;

use App\Http\Request;
use App\Repositories\ReviewRepository;

final class ReviewController
{
    public static function create(Request $req): array
    {
        return [201, ReviewRepository::create($req->user['id'], $req->validated)];
    }
}
