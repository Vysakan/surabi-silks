import { getPool } from '../config/database.js';
import { ConflictError, NotFoundError } from '../utils/AppError.js';

export const reviewRepository = {
  async findByProductId(productId) {
    const [rows] = await getPool().execute(
      `SELECT r.id, r.product_id, r.user_id, r.rating, r.title, r.comment, r.created_at, u.name AS customer_name
       FROM reviews r JOIN users u ON u.id = r.user_id WHERE r.product_id = ? ORDER BY r.created_at DESC`, [productId],
    );
    return rows.map(toReview);
  },

  async create(userId, data) {
    const conn = await getPool().getConnection();
    try {
      await conn.beginTransaction();
      const [products] = await conn.execute('SELECT id FROM products WHERE id = ? AND is_archived = 0 FOR UPDATE', [data.productId]);
      if (!products.length) throw new NotFoundError('Product');
      const [existing] = await conn.execute('SELECT id FROM reviews WHERE product_id = ? AND user_id = ?', [data.productId, userId]);
      if (existing.length) throw new ConflictError('You have already reviewed this product');
      const [result] = await conn.execute(
        'INSERT INTO reviews (product_id, user_id, rating, comment) VALUES (?, ?, ?, ?)',
        [data.productId, userId, data.rating, data.comment],
      );
      await conn.execute(
        `UPDATE products SET review_count = (SELECT COUNT(*) FROM reviews WHERE product_id = ?),
         rating = (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE product_id = ?) WHERE id = ?`,
        [data.productId, data.productId, data.productId],
      );
      await conn.commit();
      const [rows] = await getPool().execute(
        `SELECT r.id, r.product_id, r.user_id, r.rating, r.title, r.comment, r.created_at, u.name AS customer_name
         FROM reviews r JOIN users u ON u.id = r.user_id WHERE r.id = ?`, [result.insertId],
      );
      return toReview(rows[0]);
    } catch (error) {
      await conn.rollback();
      if (error.code === 'ER_DUP_ENTRY') throw new ConflictError('You have already reviewed this product');
      throw error;
    } finally { conn.release(); }
  },
};

function toReview(row) {
  return {
    id: row.id,
    productId: row.product_id,
    customerId: row.user_id,
    customerName: row.customer_name,
    rating: row.rating,
    title: row.title || '',
    comment: row.comment || '',
    createdAt: row.created_at,
  };
}
