import crypto from 'node:crypto';
import { getPool } from '../config/database.js';
import { env } from '../config/env.js';

export const sessionRepository = {
  async create(userId) {
    const id = crypto.randomBytes(48).toString('base64url');
    const expiresAt = new Date(Date.now() + env.session.maxAgeHours * 3600_000);
    await getPool().execute(
      'INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)',
      [id, userId, expiresAt],
    );
    return { id, userId, expiresAt };
  },

  async findValid(sessionId) {
    const [rows] = await getPool().execute(
      'SELECT * FROM sessions WHERE id = ? AND expires_at > NOW()',
      [sessionId],
    );
    return rows[0] || null;
  },

  async remove(sessionId) {
    await getPool().execute('DELETE FROM sessions WHERE id = ?', [sessionId]);
  },

  async removeAllForUser(userId) {
    await getPool().execute('DELETE FROM sessions WHERE user_id = ?', [userId]);
  },

  async cleanup() {
    await getPool().execute('DELETE FROM sessions WHERE expires_at <= NOW()');
  },
};
