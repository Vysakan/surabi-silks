<?php

namespace App\Controllers;

use App\Http\HttpError;
use App\Http\Request;
use App\Repositories\CategoryRepository;

final class CategoryController
{
    public static function getAll(Request $req): array
    {
        return [200, CategoryRepository::findAll()];
    }

    public static function getTree(Request $req): array
    {
        return [200, CategoryRepository::findTree()];
    }

    public static function getBySlug(Request $req): array
    {
        $cat = CategoryRepository::findBySlug($req->params['slug']);
        if (!$cat) {
            throw HttpError::notFound('Category');
        }
        return [200, $cat];
    }

    public static function create(Request $req): array
    {
        return [201, CategoryRepository::create($req->validated)];
    }

    public static function update(Request $req): array
    {
        $id = (int) $req->params['id'];
        self::mustExist($id);
        return [200, CategoryRepository::update($id, $req->validated)];
    }

    public static function remove(Request $req): array
    {
        $id = (int) $req->params['id'];
        self::mustExist($id);
        CategoryRepository::remove($id);
        return [204, null];
    }

    private static function mustExist(int $id): void
    {
        if (!CategoryRepository::findById($id)) {
            throw HttpError::notFound('Category');
        }
    }
}
