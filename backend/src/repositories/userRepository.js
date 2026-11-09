import { getPool } from '../config/database.js';

export const userRepository = {
  async findByEmail(email) {
    const [rows] = await getPool().execute('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0] || null;
  },

  async findById(id) {
    const [rows] = await getPool().execute('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async create({ name, email, phone, passwordHash, role = 'customer' }) {
    const [result] = await getPool().execute(
      'INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)',
      [name, email, phone || null, passwordHash, role],
    );
    return { id: result.insertId, name, email, phone, role };
  },

  async update(id, fields) {
    const allowed = ['name', 'phone', 'avatar'];
    const sets = [];
    const values = [];
    for (const key of allowed) {
      if (fields[key] !== undefined) {
        sets.push(`${key} = ?`);
        values.push(fields[key]);
      }
    }
    if (sets.length === 0) return null;
    values.push(id);
    await getPool().execute(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, values);
    return this.findById(id);
  },
};
