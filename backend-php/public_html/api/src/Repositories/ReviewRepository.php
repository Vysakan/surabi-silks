<?php

namespace App\Repositories;

use App\Http\HttpError;
use App\Support\Db;
use App\Support\Fmt;

final class ReviewRepository
{
    private const SELECT = 'SELECT r.id, r.product_id, r.user_id, r.rating, r.title, r.comment, r.created_at, u.name AS customer_name
                            FROM reviews r JOIN users u ON u.id = r.user_id';

    public static function findByProductId(int $productId): array
    {
        $rows = Db::all(self::SELECT . ' WHERE r.product_id = ? ORDER BY r.created_at DESC', [$productId]);
        return array_map([self::class, 'toReview'], $rows);
    }

    public static function create(int $userId, array $d): array
    {
        try {
            $reviewId = Db::transaction(function () use ($userId, $d) {
                $product = Db::one('SELECT id FROM products WHERE id = ? AND is_archived = 0 FOR UPDATE', [$d['productId']]);
                if (!$product) {
                    throw HttpError::notFound('Product');
                }
                $existing = Db::one('SELECT id FROM reviews WHERE product_id = ? AND user_id = ?', [$d['productId'], $userId]);
                if ($existing) {
                    throw HttpError::conflict('You have already reviewed this product');
                }
                $id = Db::insert(
                    'INSERT INTO reviews (product_id, user_id, rating, comment) VALUES (?, ?, ?, ?)',
                    [$d['productId'], $userId, $d['rating'], $d['comment']]
                );
                Db::run(
                    'UPDATE products SET review_count = (SELECT COUNT(*) FROM reviews WHERE product_id = ?),
                     rating = (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE product_id = ?) WHERE id = ?',
                    [$d['productId'], $d['productId'], $d['productId']]
                );
                return $id;
            });
        } catch (\PDOException $e) {
            if (Db::isDuplicateKey($e)) {
                throw HttpError::conflict('You have already reviewed this product');
            }
            throw $e;
        }

        $row = Db::one(self::SELECT . ' WHERE r.id = ?', [$reviewId]);
        return self::toReview($row);
    }

    private static function toReview(array $row): array
    {
        return [
            'id' => (int) $row['id'],
            'productId' => (int) $row['product_id'],
            'customerId' => (int) $row['user_id'],
            'customerName' => $row['customer_name'],
            'rating' => (int) $row['rating'],
            'title' => $row['title'] ?? '',
            'comment' => $row['comment'] ?? '',
            'createdAt' => Fmt::date($row['created_at']),
        ];
    }
}
