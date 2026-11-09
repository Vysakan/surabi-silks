import { authService } from '../services/authService.js';
import { env } from '../config/env.js';

function setSessionCookie(res, session) {
  res.cookie('session_id', session.id, {
    httpOnly: true,
    secure: env.isProd,
    sameSite: env.isProd ? 'strict' : 'lax',
    maxAge: env.session.maxAgeHours * 3600_000,
    path: '/',
  });
}

export const authController = {
  async register(req, res, next) {
    try {
      const { user, session } = await authService.register(req.validated);
      setSessionCookie(res, session);
      res.status(201).json(user);
    } catch (err) {
      next(err);
    }
  },

  async login(req, res, next) {
    try {
      const { user, session } = await authService.login(req.validated.email, req.validated.password);
      setSessionCookie(res, session);
      res.json(user);
    } catch (err) {
      next(err);
    }
  },

  async logout(req, res, next) {
    try {
      if (req.sessionId) {
        await authService.logout(req.sessionId);
      }
      res.clearCookie('session_id', { path: '/' });
      res.json({ message: 'Logged out' });
    } catch (err) {
      next(err);
    }
  },

  async me(req, res, next) {
    try {
      const user = await authService.getCurrentUser(req.user.id);
      if (!user) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
      res.json(user);
    } catch (err) {
      next(err);
    }
  },
};
