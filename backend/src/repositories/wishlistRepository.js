import { getPool } from '../config/database.js';

export const wishlistRepository = {
  async findByUser(userId) {
    const [rows] = await getPool().execute(
      `SELECT w.id, w.product_id, w.variant_id, w.created_at,
              p.name AS product_name, p.slug AS product_slug, p.base_price,
              p.fabric, p.selling_unit, p.is_archived,
              pv.color_name, pv.color_hex, pv.size, pv.price AS variant_price,
              pv.mrp, pv.stock, pv.sku,
              (SELECT pi.url FROM product_images pi
               WHERE pi.variant_id = pv.id ORDER BY pi.sort_order LIMIT 1) AS image
       FROM wishlists w
       JOIN products p ON w.product_id = p.id
       LEFT JOIN product_variants pv ON w.variant_id = pv.id
       WHERE w.user_id = ?
       ORDER BY w.created_at DESC`,
      [userId],
    );
    return rows.map(toWishlistItem);
  },

  async add(userId, productId, variantId) {
    await getPool().execute(
      `INSERT INTO wishlists (user_id, product_id, variant_id) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE created_at = CURRENT_TIMESTAMP`,
      [userId, productId, variantId || null],
    );
  },

  async remove(userId, productId) {
    await getPool().execute(
      'DELETE FROM wishlists WHERE user_id = ? AND product_id = ?',
      [userId, productId],
    );
  },

  async exists(userId, productId) {
    const [rows] = await getPool().execute(
      'SELECT 1 FROM wishlists WHERE user_id = ? AND product_id = ?',
      [userId, productId],
    );
    return rows.length > 0;
  },
};

function toWishlistItem(row) {
  return {
    id: row.id,
    productId: row.product_id,
    variantId: row.variant_id,
    productName: row.product_name,
    productSlug: row.product_slug,
    fabric: row.fabric,
    sellingUnit: row.selling_unit,
    isArchived: !!row.is_archived,
    image: row.image || null,
    variant: row.variant_id ? {
      id: row.variant_id,
      color: { name: row.color_name, hex: row.color_hex },
      size: row.size,
      price: parseFloat(row.variant_price),
      mrp: row.mrp ? parseFloat(row.mrp) : null,
      stock: row.stock,
      sku: row.sku,
    } : null,
    createdAt: row.created_at,
  };
}
