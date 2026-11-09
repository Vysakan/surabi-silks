import argon2 from 'argon2';
import { userRepository } from '../repositories/userRepository.js';
import { sessionRepository } from '../repositories/sessionRepository.js';
import { ConflictError, UnauthorizedError } from '../utils/AppError.js';

function sanitizeUser(user) {
  const { password_hash, ...rest } = user;
  return {
    id: rest.id,
    name: rest.name,
    email: rest.email,
    phone: rest.phone,
    role: rest.role,
    avatar: rest.avatar,
    createdAt: rest.created_at,
  };
}

export const authService = {
  async register({ name, email, phone, password }) {
    const existing = await userRepository.findByEmail(email);
    if (existing) throw new ConflictError('Email already registered');

    const passwordHash = await argon2.hash(password);
    const created = await userRepository.create({ name, email, phone, passwordHash });
    const session = await sessionRepository.create(created.id);

    return {
      user: { id: created.id, name: created.name, email: created.email, phone: created.phone, role: created.role, avatar: null },
      session,
    };
  },

  async login(email, password) {
    const user = await userRepository.findByEmail(email);
    if (!user) throw new UnauthorizedError('Invalid email or password');

    const valid = await argon2.verify(user.password_hash, password);
    if (!valid) throw new UnauthorizedError('Invalid email or password');

    const session = await sessionRepository.create(user.id);
    return { user: sanitizeUser(user), session };
  },

  async logout(sessionId) {
    await sessionRepository.remove(sessionId);
  },

  async getCurrentUser(userId) {
    const user = await userRepository.findById(userId);
    if (!user) return null;
    return sanitizeUser(user);
  },
};
