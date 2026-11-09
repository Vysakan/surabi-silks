import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { buildApp } from './setup.js';
import { getPool, closePool } from '../src/config/database.js';

const app = buildApp();
const testEmail = `test-${Date.now()}@example.com`;
let sessionCookie;

describe('Auth endpoints', () => {
  beforeAll(async () => {
    await getPool().execute('SELECT 1');
  });

  describe('POST /api/v1/auth/register', () => {
    it('registers a new user', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ name: 'Test User', email: testEmail, password: 'testpass123' });

      expect(res.status).toBe(201);
      expect(res.body.email).toBe(testEmail);
      expect(res.body.role).toBe('customer');
      expect(res.body.password).toBeUndefined();
      expect(res.body.password_hash).toBeUndefined();
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('rejects duplicate email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ name: 'Test User 2', email: testEmail, password: 'testpass123' });

      expect(res.status).toBe(409);
    });

    it('validates required fields', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'bad' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('logs in with valid credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testEmail, password: 'testpass123' });

      expect(res.status).toBe(200);
      expect(res.body.email).toBe(testEmail);
      const cookie = res.headers['set-cookie']?.[0];
      expect(cookie).toContain('session_id');
      sessionCookie = cookie;
    });

    it('rejects wrong password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testEmail, password: 'wrongpassword' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('returns current user with valid session', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Cookie', sessionCookie);

      expect(res.status).toBe(200);
      expect(res.body.email).toBe(testEmail);
    });

    it('rejects unauthenticated request', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('logs out and clears session', async () => {
      const res = await request(app)
        .post('/api/v1/auth/logout')
        .set('Cookie', sessionCookie);

      expect(res.status).toBe(200);

      const meRes = await request(app)
        .get('/api/v1/auth/me')
        .set('Cookie', sessionCookie);
      expect(meRes.status).toBe(401);
    });
  });
});
