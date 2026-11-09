import { getPool } from '../config/database.js';
import { UnauthorizedError, ForbiddenError } from '../utils/AppError.js';

export async function authenticate(req, _res, next) {
  try {
    const sessionId = req.cookies?.session_id;
    if (!sessionId) return next(new UnauthorizedError());

    const pool = getPool();
    const [rows] = await pool.execute(
      `SELECT s.id AS session_id, s.user_id, s.expires_at, u.id, u.name, u.email, u.phone, u.role, u.avatar
       FROM sessions s JOIN users u ON s.user_id = u.id
       WHERE s.id = ? AND s.expires_at > NOW()`,
      [sessionId],
    );

    if (rows.length === 0) return next(new UnauthorizedError('Session expired or invalid'));

    const row = rows[0];
    req.user = {
      id: row.user_id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      role: row.role,
      avatar: row.avatar,
    };
    req.sessionId = row.session_id;
    next();
  } catch (err) {
    next(err);
  }
}

export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(new UnauthorizedError());
    if (!roles.includes(req.user.role)) return next(new ForbiddenError());
    next();
  };
}
