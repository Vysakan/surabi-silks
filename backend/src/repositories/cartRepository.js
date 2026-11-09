import { getPool } from '../config/database.js';

export const cartRepository = {
  async findOrCreateCart(userId) {
    const pool = getPool();
    const [existing] = await pool.execute(
      'SELECT id FROM carts WHERE user_id = ?',
      [userId],
    );
    if (existing.length > 0) return existing[0].id;

    const [result] = await pool.execute(
      'INSERT INTO carts (user_id) VALUES (?)',
      [userId],
    );
    return result.insertId;
  },

  async getItems(cartId) {
    const [rows] = await getPool().execute(
      `SELECT ci.id, ci.product_id, ci.variant_id, ci.quantity,
              p.name AS product_name, p.slug AS product_slug, p.base_price,
              p.fabric, p.selling_unit, p.is_archived,
              pv.color_name, pv.color_hex, pv.size, pv.price AS variant_price,
              pv.mrp, pv.stock, pv.sku,
              (SELECT pi.url FROM product_images pi
               WHERE pi.variant_id = pv.id ORDER BY pi.sort_order LIMIT 1) AS image
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       JOIN product_variants pv ON ci.variant_id = pv.id
       WHERE ci.cart_id = ?
       ORDER BY ci.created_at ASC`,
      [cartId],
    );
    return rows.map(toCartItem);
  },

  async findItem(cartId, variantId) {
    const [rows] = await getPool().execute(
      'SELECT id, quantity FROM cart_items WHERE cart_id = ? AND variant_id = ?',
      [cartId, variantId],
    );
    return rows[0] || null;
  },

  async upsertItem(cartId, productId, variantId, quantity) {
    await getPool().execute(
      `INSERT INTO cart_items (cart_id, product_id, variant_id, quantity)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity), updated_at = CURRENT_TIMESTAMP`,
      [cartId, productId, variantId, quantity],
    );
  },

  async setItemQuantity(cartId, variantId, quantity) {
    await getPool().execute(
      'UPDATE cart_items SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE cart_id = ? AND variant_id = ?',
      [quantity, cartId, variantId],
    );
  },

  async removeItem(cartId, variantId) {
    await getPool().execute(
      'DELETE FROM cart_items WHERE cart_id = ? AND variant_id = ?',
      [cartId, variantId],
    );
  },

  async clearCart(cartId) {
    await getPool().execute('DELETE FROM cart_items WHERE cart_id = ?', [cartId]);
  },
};

function toCartItem(row) {
  return {
    id: row.id,
    productId: row.product_id,
    variantId: row.variant_id,
    quantity: row.quantity,
    productName: row.product_name,
    productSlug: row.product_slug,
    fabric: row.fabric,
    sellingUnit: row.selling_unit,
    isArchived: !!row.is_archived,
    image: row.image || null,
    variant: {
      id: row.variant_id,
      color: { name: row.color_name, hex: row.color_hex },
      size: row.size,
      price: parseFloat(row.variant_price),
      mrp: row.mrp ? parseFloat(row.mrp) : null,
      stock: row.stock,
      sku: row.sku,
    },
    unitPrice: parseFloat(row.variant_price),
    lineTotal: parseFloat(row.variant_price) * row.quantity,
  };
}
