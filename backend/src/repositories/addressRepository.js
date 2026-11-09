import { getPool } from '../config/database.js';

export const addressRepository = {
  async findByUser(userId) {
    const [rows] = await getPool().execute(
      'SELECT * FROM user_addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC',
      [userId],
    );
    return rows.map(toAddress);
  },

  async findById(id, userId) {
    const [rows] = await getPool().execute(
      'SELECT * FROM user_addresses WHERE id = ? AND user_id = ?',
      [id, userId],
    );
    return rows[0] ? toAddress(rows[0]) : null;
  },

  async create(userId, data) {
    const pool = getPool();

    if (data.isDefault) {
      await pool.execute(
        'UPDATE user_addresses SET is_default = 0 WHERE user_id = ?',
        [userId],
      );
    }

    const [result] = await pool.execute(
      `INSERT INTO user_addresses (user_id, label, full_name, phone, line1, line2, city, state, pincode, is_default)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, data.label || null, data.fullName, data.phone || null, data.line1, data.line2 || null, data.city, data.state, data.pincode, data.isDefault ? 1 : 0],
    );

    return this.findById(result.insertId, userId);
  },

  async update(id, userId, data) {
    const pool = getPool();

    if (data.isDefault) {
      await pool.execute(
        'UPDATE user_addresses SET is_default = 0 WHERE user_id = ?',
        [userId],
      );
    }

    await pool.execute(
      `UPDATE user_addresses
       SET label = ?, full_name = ?, phone = ?, line1 = ?, line2 = ?, city = ?, state = ?, pincode = ?, is_default = ?
       WHERE id = ? AND user_id = ?`,
      [data.label || null, data.fullName, data.phone || null, data.line1, data.line2 || null, data.city, data.state, data.pincode, data.isDefault ? 1 : 0, id, userId],
    );

    return this.findById(id, userId);
  },

  async remove(id, userId) {
    await getPool().execute(
      'DELETE FROM user_addresses WHERE id = ? AND user_id = ?',
      [id, userId],
    );
  },
};

function toAddress(row) {
  return {
    id: row.id,
    label: row.label || '',
    fullName: row.full_name,
    phone: row.phone || '',
    line1: row.line1,
    line2: row.line2 || '',
    city: row.city,
    state: row.state,
    pincode: row.pincode,
    isDefault: !!row.is_default,
  };
}
