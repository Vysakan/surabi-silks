import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { buildApp } from './setup.js';
import { getPool } from '../src/config/database.js';

const app = buildApp();
let adminCookie;

describe('Product endpoints', () => {
  beforeAll(async () => {
    await getPool().execute('SELECT 1');
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@surabsilks.com', password: 'admin123' });
    if (res.status === 200) {
      adminCookie = res.headers['set-cookie']?.[0];
    }
  });

  describe('GET /api/v1/products', () => {
    it('returns paginated product list', async () => {
      const res = await request(app).get('/api/v1/products');
      expect(res.status).toBe(200);
      expect(res.body.items).toBeDefined();
      expect(res.body.total).toBeGreaterThanOrEqual(0);
      expect(res.body.page).toBe(1);
    });

    it('supports pagination params', async () => {
      const res = await request(app).get('/api/v1/products?page=1&limit=2');
      expect(res.status).toBe(200);
      expect(res.body.items.length).toBeLessThanOrEqual(2);
    });

    it('supports sort param', async () => {
      const res = await request(app).get('/api/v1/products?sort=price-asc');
      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/v1/products/featured', () => {
    it('returns featured products', async () => {
      const res = await request(app).get('/api/v1/products/featured');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /api/v1/products/new-arrivals', () => {
    it('returns new arrivals', async () => {
      const res = await request(app).get('/api/v1/products/new-arrivals');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /api/v1/products/bestsellers', () => {
    it('returns bestsellers', async () => {
      const res = await request(app).get('/api/v1/products/bestsellers');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /api/v1/products/search', () => {
    it('searches products by query', async () => {
      const res = await request(app).get('/api/v1/products/search?q=silk');
      expect(res.status).toBe(200);
      expect(res.body.items).toBeDefined();
    });
  });

  describe('GET /api/v1/products/slug/:slug', () => {
    it('returns product by slug', async () => {
      const listRes = await request(app).get('/api/v1/products?limit=1');
      if (listRes.body.items?.length > 0) {
        const slug = listRes.body.items[0].slug;
        const res = await request(app).get(`/api/v1/products/slug/${slug}`);
        expect(res.status).toBe(200);
        expect(res.body.slug).toBe(slug);
        expect(res.body.variants).toBeDefined();
      }
    });

    it('returns 404 for unknown slug', async () => {
      const res = await request(app).get('/api/v1/products/slug/nonexistent-product');
      expect(res.status).toBe(404);
    });
  });

  describe('Admin product CRUD', () => {
    let createdProductId;

    it('rejects unauthenticated create', async () => {
      const res = await request(app)
        .post('/api/v1/products')
        .send({ name: 'Test', slug: 'test', basePrice: 100, categoryId: 1, variants: [{ sku: 'T-001', colorName: 'Red', colorHex: '#FF0000', size: 'M', price: 100, stock: 5 }] });
      expect(res.status).toBe(401);
    });

    it('creates product as admin', async () => {
      if (!adminCookie) return;
      const res = await request(app)
        .post('/api/v1/products')
        .set('Cookie', adminCookie)
        .send({
          name: 'Test Product',
          slug: `test-product-${Date.now()}`,
          basePrice: 999,
          categoryId: 1,
          sellingUnit: 'piece',
          variants: [{ sku: `TST-${Date.now()}`, colorName: 'Red', colorHex: '#FF0000', size: 'Free Size', price: 999, stock: 10 }],
        });
      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Test Product');
      createdProductId = res.body.id;
    });

    it('updates product as admin', async () => {
      if (!adminCookie || !createdProductId) return;
      const res = await request(app)
        .put(`/api/v1/products/${createdProductId}`)
        .set('Cookie', adminCookie)
        .send({ name: 'Updated Test Product', basePrice: 1099 });
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Updated Test Product');
    });

    it('archives (deletes) product as admin', async () => {
      if (!adminCookie || !createdProductId) return;
      const res = await request(app)
        .delete(`/api/v1/products/${createdProductId}`)
        .set('Cookie', adminCookie);
      expect(res.status).toBe(204);
    });
  });
});

describe('Category endpoints', () => {
  describe('GET /api/v1/categories', () => {
    it('returns all categories', async () => {
      const res = await request(app).get('/api/v1/categories');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /api/v1/categories/tree', () => {
    it('returns category tree with subcategories', async () => {
      const res = await request(app).get('/api/v1/categories/tree');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      if (res.body.length > 0) {
        expect(res.body[0].subcategories).toBeDefined();
      }
    });
  });
});
