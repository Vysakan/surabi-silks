import { getPool } from '../config/database.js';
import { randomUUID } from 'node:crypto';
import { AppError } from '../utils/AppError.js';

export const orderRepository = {
  async list({ page, limit, status, userId }) {
    const pool = getPool();
    const where = [];
    const values = [];
    if (userId) { where.push('o.user_id = ?'); values.push(userId); }
    if (status) { where.push('o.status = ?'); values.push(status); }
    const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const [[{ total }]] = await pool.execute(`SELECT COUNT(*) AS total FROM orders o ${clause}`, values);
    const [rows] = await pool.execute(
      `SELECT o.id, o.order_number, o.user_id, o.status, o.subtotal, o.shipping_cost, o.discount, o.total,
              o.shipping_address, o.payment_method, o.created_at, o.updated_at,
              u.name AS customer_name, u.email AS customer_email
       FROM orders o JOIN users u ON u.id = o.user_id ${clause}
       ORDER BY o.created_at DESC LIMIT ? OFFSET ?`, [...values, limit, (page - 1) * limit],
    );
    const items = await Promise.all(rows.map((row) => this.findById(row.id)));
    return { items, total: Number(total), page, totalPages: Math.ceil(Number(total) / limit) };
  },

  async findById(id, userId = null) {
    const pool = getPool();
    const userClause = userId ? 'AND o.user_id = ?' : '';
    const [rows] = await pool.execute(
      `SELECT o.*, u.name AS customer_name, u.email AS customer_email
       FROM orders o JOIN users u ON u.id = o.user_id WHERE (o.order_number = ? OR o.id = ?) ${userClause} LIMIT 1`,
      userId ? [id, id, userId] : [id, id],
    );
    if (!rows[0]) return null;
    const order = rows[0];
    const [items] = await pool.execute(
      `SELECT product_id, variant_id, product_name, variant_label, image, sku, unit_price, quantity, line_total
       FROM order_items WHERE order_id = ? ORDER BY id`, [order.id],
    );
    const [history] = await pool.execute(
      'SELECT status, created_at FROM order_status_history WHERE order_id = ? ORDER BY id', [order.id],
    );
    return toOrder(order, items, history);
  },

  async create(userId, data) {
    const conn = await getPool().getConnection();
    try {
      await conn.beginTransaction();
      const quantities = new Map();
      for (const item of data.items) {
        const key = `${item.productId}:${item.variantId}`;
        const existing = quantities.get(key);
        quantities.set(key, { ...item, quantity: (existing?.quantity || 0) + item.quantity });
      }
      const lineItems = [];
      let subtotal = 0;
      for (const item of quantities.values()) {
        const [rows] = await conn.execute(
          `SELECT p.id AS product_id, p.name AS product_name, p.is_archived,
                  v.id AS variant_id, v.sku, v.color_name, v.size, v.design, v.price, v.stock,
                  (SELECT pi.url FROM product_images pi WHERE pi.variant_id = v.id ORDER BY pi.sort_order LIMIT 1) AS image
           FROM products p JOIN product_variants v ON v.product_id = p.id
           WHERE p.id = ? AND v.id = ? FOR UPDATE`, [item.productId, item.variantId],
        );
        const product = rows[0];
        if (!product || product.is_archived) throw new AppError(400, 'PRODUCT_UNAVAILABLE', 'A product in your cart is no longer available');
        if (product.stock < item.quantity) throw new AppError(400, 'INSUFFICIENT_STOCK', `Only ${product.stock} of ${product.product_name} are available`);
        const unitPrice = Number(product.price);
        const lineTotal = unitPrice * item.quantity;
        subtotal += lineTotal;
        lineItems.push({ ...item, product, unitPrice, lineTotal, variantLabel: [product.color_name, product.size, product.design].filter(Boolean).join(' / ') });
      }
      const shippingCost = subtotal >= 2000 ? 0 : 99;
      const total = subtotal + shippingCost;
      const [result] = await conn.execute(
        `INSERT INTO orders (order_number, user_id, subtotal, shipping_cost, total, shipping_address, payment_method)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [`TMP-${randomUUID().replaceAll('-', '').slice(0, 24)}`, userId, subtotal, shippingCost, total, JSON.stringify(data.shippingAddress), data.paymentMethod],
      );
      const orderNumber = `ORD-${new Date().getFullYear()}-${String(result.insertId).padStart(6, '0')}`;
      await conn.execute('UPDATE orders SET order_number = ? WHERE id = ?', [orderNumber, result.insertId]);
      await conn.execute('INSERT INTO order_status_history (order_id, status) VALUES (?, ?)', [result.insertId, 'pending']);
      for (const item of lineItems) {
        await conn.execute(
          `INSERT INTO order_items (order_id, product_id, variant_id, product_name, variant_label, image, sku, unit_price, quantity, line_total)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [result.insertId, item.product.product_id, item.product.variant_id, item.product.product_name,
            item.variantLabel, item.product.image, item.product.sku, item.unitPrice, item.quantity, item.lineTotal],
        );
        await conn.execute('UPDATE product_variants SET stock = stock - ? WHERE id = ?', [item.quantity, item.variantId]);
        await conn.execute('INSERT INTO inventory_log (variant_id, quantity_change, reason, reference_id) VALUES (?, ?, ?, ?)',
          [item.variantId, -item.quantity, 'Order placed', orderNumber]);
      }
      await conn.commit();
      return this.findById(orderNumber);
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  },

  async updateStatus(id, status) {
    const pool = getPool();
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [rows] = await conn.execute('SELECT id, status FROM orders WHERE order_number = ? OR id = ? FOR UPDATE', [id, id]);
      if (!rows[0]) { await conn.rollback(); return null; }
      await conn.execute('UPDATE orders SET status = ? WHERE id = ?', [status, rows[0].id]);
      if (status === 'cancelled') {
        const [items] = await conn.execute('SELECT variant_id, quantity FROM order_items WHERE order_id = ? AND variant_id IS NOT NULL', [rows[0].id]);
        for (const item of items) {
          await conn.execute('UPDATE product_variants SET stock = stock + ? WHERE id = ?', [item.quantity, item.variant_id]);
          await conn.execute('INSERT INTO inventory_log (variant_id, quantity_change, reason, reference_id) VALUES (?, ?, ?, ?)',
            [item.variant_id, item.quantity, 'Order cancelled', String(id)]);
        }
      }
      await conn.execute('INSERT INTO order_status_history (order_id, status) VALUES (?, ?)', [rows[0].id, status]);
      await conn.commit();
      return this.findById(rows[0].id);
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally { conn.release(); }
  },
};

function toOrder(row, items, history) {
  return {
    id: row.order_number,
    customerId: row.user_id,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    status: row.status,
    subtotal: Number(row.subtotal),
    shippingCost: Number(row.shipping_cost),
    discount: Number(row.discount),
    total: Number(row.total),
    shippingAddress: typeof row.shipping_address === 'string' ? JSON.parse(row.shipping_address) : row.shipping_address,
    paymentMethod: row.payment_method,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    items: items.map((item) => ({
      productId: item.product_id, variantId: item.variant_id,
      productName: item.product_name, variantLabel: item.variant_label,
      image: item.image, sku: item.sku, unitPrice: Number(item.unit_price),
      quantity: item.quantity, total: Number(item.line_total),
    })),
    statusHistory: history.map((entry) => ({ status: entry.status, timestamp: entry.created_at })),
  };
}
