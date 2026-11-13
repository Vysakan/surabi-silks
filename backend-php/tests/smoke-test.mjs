#!/usr/bin/env node
/**
 * Surabi Silks API smoke test: calls every endpoint of the backend and checks the answers.
 *
 * Needs Node 18 or newer. No npm install.
 *
 *   node tests/smoke-test.mjs                          (tests http://localhost:3000)
 *   node tests/smoke-test.mjs http://127.0.0.1:3000    (or any other address)
 *
 * When the website and the API are on different addresses (two subdomains), add the
 * website's address as well. The test then also checks the CORS headers the browser needs:
 *   node tests/smoke-test.mjs https://api.example.com https://shop.example.com
 *
 * The admin checks log in as the demo admin from database/seed.sql. If you changed it,
 * set ADMIN_EMAIL and ADMIN_PASSWORD before running (PowerShell: $env:ADMIN_PASSWORD="...").
 *
 * It writes test data: a new customer "Smoke Test", a category with a subcategory, a product and a reel
 * (all removed again at the end), an address (deleted), a review, and an order (cancelled again).
 * It also asks for a password-reset email for the test customer (an @example.com address).
 * Run it against your local or test database, not the live shop.
 */

const BASE = (process.argv[2] || process.env.API_URL || 'http://localhost:3000').replace(/\/+$/, '');
const API = `${BASE}/api/v1`;
const ORIGIN = (process.argv[3] || process.env.FRONTEND_ORIGIN || '').replace(/\/+$/, '');
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@surabsilks.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const STAMP = Date.now().toString(36);
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
// A real 1x1 pixel PNG, for the image upload.
const PNG_1PX = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

// The first bytes of an MP4 and of a QuickTime MOV: enough for the server's file-type check.
const MP4_TINY = Buffer.concat([
  Buffer.from([0, 0, 0, 0x20]), Buffer.from('ftypisom'), Buffer.from([0, 0, 2, 0]), Buffer.from('isomiso2avc1mp41'),
  Buffer.from([0, 0, 0, 8]), Buffer.from('free'),
]);
const MOV_TINY = Buffer.concat([Buffer.from([0, 0, 0, 0x14]), Buffer.from('ftypqt  '), Buffer.from([0, 0, 0, 0]), Buffer.from('qt  ')]);

let passed = 0;
let failed = 0;
let skipped = 0;
let rateLimited = false;
const failures = [];

// ---------------------------------------------------------------- helpers

function short(value) {
  const s = typeof value === 'string' ? value : JSON.stringify(value);
  if (!s) return '';
  const oneLine = s.replace(/\s+/g, ' ');
  return oneLine.length > 400 ? `${oneLine.slice(0, 400)}...` : oneLine;
}

function section(title) {
  console.log(`\n=== ${title} ===`);
}

function check(name, good, info) {
  if (good) {
    passed++;
    console.log(`  PASS  ${name}`);
  } else {
    failed++;
    failures.push(name);
    console.log(`  FAIL  ${name}`);
    if (info) console.log(`        ${short(info)}`);
  }
  return good;
}

function skip(name, why) {
  skipped++;
  console.log(`  SKIP  ${name} (${why})`);
}

/** Passes when the HTTP status matches and cond(body) is true. */
function expect(name, res, status, cond) {
  let good = res.status === status;
  if (good && cond) {
    try {
      good = Boolean(cond(res.json, res));
    } catch {
      good = false;
    }
  }
  return check(name, good, `got HTTP ${res.status}: ${short(res.text)}`);
}

async function request(method, url, { json, raw, form, cookie, headers: extra } = {}) {
  const headers = { ...extra };
  let body;
  if (form) {
    body = form;
  } else if (raw !== undefined) {
    body = raw;
    headers['Content-Type'] = 'application/json';
  } else if (json !== undefined) {
    body = JSON.stringify(json);
    headers['Content-Type'] = 'application/json';
  }
  if (cookie) headers.Cookie = cookie;

  const res = await fetch(url, { method, headers, body, redirect: 'manual' });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    // not JSON (an image, an HTML error page...)
  }
  if (res.status === 429) rateLimited = true;
  return { status: res.status, json: data, text, headers: res.headers };
}

const api = (method, path, opts) => request(method, API + path, opts);
const site = (method, path, opts) => request(method, BASE + path, opts);
// Uploaded image URLs are either "/uploads/x.png" or a full "https://.../uploads/x.png".
const fullUrl = (url) => (/^https?:\/\//i.test(url) ? url : BASE + url);

function setCookies(res) {
  if (typeof res.headers.getSetCookie === 'function') return res.headers.getSetCookie();
  const raw = res.headers.get('set-cookie');
  return raw ? [raw] : [];
}

function sessionCookie(res) {
  for (const c of setCookies(res)) {
    const m = /(?:^|[,;]\s*)session_id=([^;,\s]+)/.exec(c);
    if (m && m[1] !== 'deleted') return `session_id=${m[1]}`;
  }
  return null;
}

const errCode = (res) => res.json?.error?.code;
const ids = (list) => (Array.isArray(list) ? list.map((x) => x.id) : []);
const variantOf = (product, variantId) => product?.variants?.find((v) => v.id === variantId);
const near = (a, b) => typeof a === 'number' && typeof b === 'number' && Math.abs(a - b) < 0.01;
const cartMathOk = (c) =>
  Boolean(c) && near(c.total, c.subtotal + c.shipping) && (c.subtotal >= c.freeShippingThreshold ? c.shipping === 0 : c.shipping > 0);

async function stockOf(productId, variantId) {
  const res = await api('GET', `/products/${productId}`);
  return variantOf(res.json, variantId)?.stock;
}

// ---------------------------------------------------------------- the test

async function main() {
  console.log('Surabi Silks API smoke test');
  console.log(`Target: ${API}`);
  if (ORIGIN) console.log(`Website: ${ORIGIN} (CORS checks on)`);
  let r;

  // ------------------------------------------------------------ 1
  section('1. Server basics');
  try {
    r = await api('GET', '/health');
  } catch (e) {
    console.error(`\nCould not reach ${BASE} (${e.cause?.code || e.message}).`);
    console.error('Is the PHP server running? In backend-php/public_html run:');
    console.error('  php -S localhost:3000 api/index.php');
    console.error('If it is running, try the other address: node tests/smoke-test.mjs http://127.0.0.1:3000');
    process.exit(2);
  }
  if (errCode(r) === 'CONFIG_MISSING') {
    console.error('\napi/config.php is missing. Copy api/config.example.php to api/config.php and fill in your database details.');
    process.exit(2);
  }
  expect('GET /health answers {"status":"ok"}', r, 200, (b) => b.status === 'ok' && ISO.test(b.timestamp));
  check('Security headers are sent (X-Content-Type-Options)', r.headers.get('x-content-type-options') === 'nosniff');
  check('Rate-limit headers are sent (RateLimit-Limit)', r.headers.has('ratelimit-limit'));

  r = await api('GET', '/no-such-endpoint');
  expect('An unknown endpoint returns 404', r, 404, () => errCode(r) === 'ROUTE_NOT_FOUND');

  for (const path of ['/api/config.php', '/api/src/bootstrap.php']) {
    r = await site('GET', path);
    check(`${path} cannot be read from the web`, !(r.status === 200 && /<\?php|password/i.test(r.text)), `got HTTP ${r.status}`);
  }

  if (ORIGIN) {
    r = await api('OPTIONS', '/auth/login', {
      headers: { Origin: ORIGIN, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type' },
    });
    const allowed = (r.headers.get('access-control-allow-headers') || '').toLowerCase();
    check(
      `CORS: the browser may send logins from ${ORIGIN}`,
      r.status < 300 && r.headers.get('access-control-allow-origin') === ORIGIN && r.headers.get('access-control-allow-credentials') === 'true' && allowed.includes('content-type'),
      `got HTTP ${r.status}, Access-Control-Allow-Origin: ${r.headers.get('access-control-allow-origin')}, Allow-Credentials: ${r.headers.get('access-control-allow-credentials')}, Allow-Headers: ${allowed || '(none)'}`,
    );
    r = await api('GET', '/categories', { headers: { Origin: ORIGIN } });
    check(
      'CORS: API answers carry the website address and allow cookies',
      r.headers.get('access-control-allow-origin') === ORIGIN && r.headers.get('access-control-allow-credentials') === 'true',
      `got Access-Control-Allow-Origin: ${r.headers.get('access-control-allow-origin')}. Set 'cors' => ['origin' => '${ORIGIN}'] in api/config.php`,
    );
  }

  // ------------------------------------------------------------ 2
  section('2. Catalogue (public pages)');
  if (ORIGIN) {
    r = await api('POST', '/cart/items', { headers: { Origin: 'https://evil.example' }, json: { productId: 1, variantId: 1 } });
    expect('A change requested from another website is refused (403)', r, 403);
    r = await api('POST', '/cart/items', { headers: { Origin: ORIGIN }, json: { productId: 1, variantId: 1 } });
    expect('The same request from your website passes that check (then 401: not signed in)', r, 401);
  }

  r = await api('GET', '/categories');
  expect('GET /categories returns a list', r, 200, (b) => Array.isArray(b));
  if (r.status >= 500) {
    console.log('        Hint: a 500 here usually means the db settings in api/config.php are wrong,');
    console.log('        or database/schema.sql has not been imported.');
  }
  const categories = Array.isArray(r.json) ? r.json : [];
  if (r.status === 200 && !categories.length) console.log('        Note: no categories yet. Import database/seed.sql for demo data.');

  r = await api('GET', '/categories/tree');
  expect('GET /categories/tree returns categories with subcategories', r, 200, (b) => Array.isArray(b) && b.every((c) => Array.isArray(c.subcategories)));
  if (categories.length) {
    r = await api('GET', `/categories/slug/${categories[0].slug}`);
    expect('GET /categories/slug/:slug finds a category', r, 200, (b) => b.slug === categories[0].slug);
  }
  r = await api('GET', '/categories/slug/no-such-category-zz');
  expect('An unknown category slug returns 404', r, 404);

  r = await api('GET', '/products');
  expect('GET /products returns a page of products', r, 200, (b) => Array.isArray(b.items) && typeof b.total === 'number' && b.page === 1 && typeof b.totalPages === 'number');
  const products = Array.isArray(r.json?.items) ? r.json.items : [];
  if (r.status === 200 && !products.length) console.log('        Note: no products yet. Import database/seed.sql for demo data.');

  r = await api('GET', '/products?page=1&limit=2');
  expect('GET /products?limit=2 returns at most 2', r, 200, (b) => b.items.length <= 2);
  for (const sort of ['price-asc', 'price-desc', 'newest', 'rating', 'name-asc', 'name-desc']) {
    r = await api('GET', `/products?sort=${sort}&limit=100`);
    let cond;
    if (sort === 'price-asc') cond = (b) => b.items.every((p, i, a) => i === 0 || a[i - 1].basePrice <= p.basePrice);
    if (sort === 'price-desc') cond = (b) => b.items.every((p, i, a) => i === 0 || a[i - 1].basePrice >= p.basePrice);
    expect(`GET /products?sort=${sort}`, r, 200, cond);
  }
  r = await api('GET', '/products?limit=1000');
  expect('GET /products?limit=1000 is refused (VALIDATION_ERROR)', r, 400, () => errCode(r) === 'VALIDATION_ERROR');

  for (const path of ['/products/featured', '/products/new-arrivals', '/products/bestsellers']) {
    r = await api('GET', path);
    expect(`GET ${path} returns a list`, r, 200, (b) => Array.isArray(b));
  }
  r = await api('GET', '/products/search?q=silk');
  expect('GET /products/search?q=silk', r, 200, (b) => Array.isArray(b.items));

  if (products.length) {
    const p = products[0];
    r = await api('GET', `/products/slug/${p.slug}`);
    expect('GET /products/slug/:slug returns variants and images', r, 200, (b) => b.slug === p.slug && Array.isArray(b.variants) && b.variants.every((v) => Array.isArray(v.images)));
    r = await api('GET', `/products/${p.id}`);
    expect('GET /products/:id', r, 200, (b) => b.id === p.id && ISO.test(b.createdAt));
    r = await api('GET', `/products/${p.id}/related`);
    expect('GET /products/:id/related (without the product itself)', r, 200, (b) => Array.isArray(b) && !ids(b).includes(p.id));
    r = await api('GET', `/products/${p.id}/reviews`);
    expect('GET /products/:id/reviews', r, 200, (b) => Array.isArray(b));
  } else {
    skip('Product detail endpoints', 'no products in the database');
  }
  r = await api('GET', '/products/999999999');
  expect('An unknown product id returns 404', r, 404);
  r = await api('GET', '/products/slug/no-such-product-zz');
  expect('An unknown product slug returns 404', r, 404);

  // ------------------------------------------------------------ 3
  section('3. Customer account');
  const email = `smoke-${STAMP}@example.com`;
  let password = 'SmokeTest123';

  r = await api('POST', '/auth/register', { json: { name: 'Smoke Test', email, phone: '9876543210', password: 'abcdefghij' } });
  expect('Register refuses a password without a number', r, 400, () => errCode(r) === 'VALIDATION_ERROR');
  r = await api('POST', '/auth/register', { json: { name: 'Smoke Test', email, phone: '9876543210', password: 'password123' } });
  expect('Register refuses a very common password', r, 400, () => errCode(r) === 'VALIDATION_ERROR');

  r = await api('POST', '/auth/register', { json: { name: 'Smoke Test', email, phone: '9876543210', password } });
  expect('POST /auth/register creates a customer', r, 201, (b) => b.email === email && b.role === 'customer' && !('password_hash' in b) && !('password' in b));
  check('Register sets the session_id cookie', Boolean(sessionCookie(r)));
  const registerSession = sessionCookie(r);
  check('The session cookie is HttpOnly', setCookies(r).some((c) => /session_id=/.test(c) && /httponly/i.test(c)));
  const custId = r.json?.id;

  r = await api('POST', '/auth/register', { json: { name: 'Smoke Test', email, password } });
  expect('Registering the same email again returns 409', r, 409, () => errCode(r) === 'CONFLICT');
  r = await api('POST', '/auth/register', { json: { email: 'not-an-email' } });
  expect('Register with bad input returns 400 VALIDATION_ERROR', r, 400, () => errCode(r) === 'VALIDATION_ERROR');
  r = await api('POST', '/auth/login', { json: { email, password: 'wrong-password' } });
  expect('Login with a wrong password returns 401', r, 401);

  r = await api('POST', '/auth/login', { json: { email, password } });
  expect('POST /auth/login', r, 200, (b) => b.email === email && ISO.test(b.createdAt));
  const cust = sessionCookie(r);
  check('Login sets the session_id cookie', Boolean(cust));

  r = await api('GET', '/auth/me', { cookie: cust });
  expect('GET /auth/me returns the logged-in customer', r, 200, (b) => b.email === email && b.id === custId);
  r = await api('GET', '/auth/me');
  expect('GET /auth/me without logging in returns 401', r, 401, () => errCode(r) === 'UNAUTHORIZED');
  r = await api('GET', '/auth/me', { cookie: 'session_id=not-a-real-session' });
  expect('GET /auth/me with a fake session returns 401', r, 401);

  // Forgot / reset password. The answer must not reveal whether an account exists.
  r = await api('POST', '/auth/forgot-password', { json: { email } });
  const forgotKnown = r.json?.message;
  expect('POST /auth/forgot-password answers 200', r, 200, (b) => typeof b.message === 'string');
  r = await api('POST', '/auth/forgot-password', { json: { email: `nobody-${STAMP}@example.com` } });
  expect('Forgot password gives the same answer for an unknown email', r, 200, (b) => b.message === forgotKnown);
  const fakeToken = 'x'.repeat(43);
  r = await api('POST', '/auth/reset-password/verify', { json: { token: fakeToken } });
  expect('A made-up reset link is refused (400 INVALID_TOKEN)', r, 400, () => errCode(r) === 'INVALID_TOKEN');
  r = await api('POST', '/auth/reset-password', { json: { token: fakeToken, password: 'NewSmoke456' } });
  expect('Resetting with a made-up link is refused', r, 400, () => errCode(r) === 'INVALID_TOKEN');

  // Change password while signed in
  if (cust) {
    r = await api('POST', '/auth/change-password', { cookie: cust, json: { currentPassword: 'not-my-password1', newPassword: 'NewSmoke456' } });
    expect('Change password with a wrong current password returns 400', r, 400, () => errCode(r) === 'VALIDATION_ERROR');
    r = await api('POST', '/auth/change-password', { cookie: cust, json: { currentPassword: password, newPassword: 'NewSmoke456' } });
    expect('POST /auth/change-password', r, 200);
    if (r.status === 200) {
      r = await api('GET', '/auth/me', { cookie: cust });
      expect('The session that changed the password still works', r, 200);
      if (registerSession) {
        r = await api('GET', '/auth/me', { cookie: registerSession });
        expect('Other sessions are signed out after a password change', r, 401);
      }
      r = await api('POST', '/auth/login', { json: { email, password } });
      expect('The old password no longer works', r, 401);
      password = 'NewSmoke456';
      r = await api('POST', '/auth/login', { json: { email, password } });
      expect('The new password works', r, 200);
    }
  }

  if (!cust || !custId) {
    console.log('\nStopping: the remaining tests need a logged-in customer.');
    return;
  }

  // ------------------------------------------------------------ 4
  section('4. Admin: categories, products, images');
  r = await api('POST', '/auth/login', { json: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } });
  const adminRole = r.json?.role;
  const admin = r.status === 200 && ['admin', 'superadmin'].includes(adminRole) ? sessionCookie(r) : null;
  check(`Admin login (${ADMIN_EMAIL})`, Boolean(admin), `got HTTP ${r.status}: ${short(r.text)}`);
  if (!admin) {
    console.log('        Hint: the demo admin comes from database/seed.sql. If you changed its password, set');
    console.log('        ADMIN_EMAIL and ADMIN_PASSWORD. If the password is right, check that your PHP supports Argon2:');
    console.log('        php -r "var_dump(defined(\'PASSWORD_ARGON2ID\'));"   (should print bool(true))');
  }

  r = await api('GET', '/admin/users', { cookie: cust });
  expect('A customer cannot list admin accounts (403)', r, 403);
  if (admin) {
    r = await api('GET', '/admin/users', { cookie: admin });
    if (adminRole === 'superadmin') {
      expect('The root admin can list admin accounts', r, 200, (b) => Array.isArray(b.items) && b.items.every((u) => !('password_hash' in u)));
    } else {
      expect('A normal admin cannot list admin accounts (403, root admin only)', r, 403);
    }
  }

  const fabric = 'Smoke Test Silk';
  const skuMain = `SMK-A-${STAMP}`.toUpperCase();
  const catSlug = `smoke-test-${STAMP}`;
  const productBody = {
    name: 'Smoke Test Saree',
    slug: `smoke-test-saree-${STAMP}`,
    categoryId: 1,
    description: 'Created by the smoke test.',
    shortDescription: 'Smoke test product',
    sellingUnit: 'piece',
    basePrice: 1500,
    tags: ['smoke-test'],
    fabric,
    weave: 'Test weave',
    occasions: ['Smoke Test'],
    isNewArrival: true,
    variants: [
      { colorName: 'Smoke Red', colorHex: '#AA0000', size: 'Free Size', price: 1500, mrp: 1800, stock: 5, sku: skuMain },
      { colorName: 'Smoke Blue', colorHex: '#0000AA', size: 'Free Size', price: 2500, stock: 2, sku: `SMK-B-${STAMP}`.toUpperCase() },
    ],
  };

  r = await api('POST', '/products', { json: productBody });
  expect('Creating a product without logging in returns 401', r, 401);
  r = await api('POST', '/products', { json: productBody, cookie: cust });
  expect('Creating a product as a customer returns 403', r, 403, () => errCode(r) === 'FORBIDDEN');

  let catId = null;
  let subId = null;
  let subImage = null;
  let product = null; // the product the shopping tests use
  let testProduct = false; // true when this script created it (so it can clean it up)
  let vMain = null;
  let image = null;

  if (admin) {
    r = await api('POST', '/categories', { cookie: admin, json: { name: 'Smoke Test Category', slug: catSlug, description: 'Created by the smoke test', sortOrder: 99 } });
    expect('Creating a category without an image returns 400', r, 400, () => errCode(r) === 'VALIDATION_ERROR' && r.json?.error?.details?.[0]?.path === 'image');
    r = await api('POST', '/categories', { cookie: admin, json: { name: 'Smoke Test Category', slug: catSlug, image: '/images/categories/sarees.jpg', description: 'Created by the smoke test', sortOrder: 99 } });
    expect('POST /categories creates a category', r, 201, (b) => b.slug === catSlug && b.sortOrder === 99 && b.image === '/images/categories/sarees.jpg');
    catId = r.status === 201 ? r.json?.id ?? null : null;
  }
  if (admin && catId) {
    r = await api('PUT', `/categories/${catId}`, { cookie: admin, json: { name: 'Smoke Test Category (edited)' } });
    expect('PUT /categories/:id renames it', r, 200, (b) => b.name === 'Smoke Test Category (edited)' && b.sortOrder === 99);
    r = await api('GET', `/categories/slug/${catSlug}`);
    expect('The new category is found by its slug', r, 200, (b) => b.id === catId);
    r = await api('POST', '/categories', { cookie: admin, json: { name: 'Bad', slug: 'Not A Slug!', image: '/images/categories/sarees.jpg' } });
    expect('A category with an invalid slug returns 400', r, 400);
    r = await api('PUT', `/categories/${catId}`, { cookie: admin, json: { image: null } });
    expect('Removing the image of a category returns 400 (image is required)', r, 400, () => errCode(r) === 'VALIDATION_ERROR');
    r = await api('POST', '/categories', { cookie: admin, json: { name: 'Smoke Test Category', slug: catSlug, image: '/images/categories/sarees.jpg' } });
    expect('A second category with the same slug returns 409', r, 409);

    // Subcategory with an uploaded image
    const catForm = new FormData();
    catForm.append('image', new Blob([PNG_1PX], { type: 'image/png' }), 'smoke-category.png');
    r = await api('POST', '/categories/images', { cookie: admin, form: catForm });
    expect('POST /categories/images uploads a category image', r, 201, (b) => /^(https?:\/\/[^/]+)?\/uploads\/[^/]+\.png$/.test(b.url));
    subImage = r.status === 201 ? r.json.url : null;
    if (subImage) {
      r = await api('POST', '/categories', { cookie: admin, json: { name: 'Smoke Test Sub', slug: `${catSlug}-sub`, image: subImage, parentId: catId } });
      expect('POST /categories creates a subcategory under it', r, 201, (b) => b.parentId === catId && b.image === subImage);
      subId = r.status === 201 ? r.json?.id ?? null : null;
    }
    if (subId) {
      r = await api('GET', '/categories/tree');
      expect('The tree lists the subcategory under its category', r, 200, (b) => b.find((c) => c.id === catId)?.subcategories?.some((sc) => sc.id === subId));
      r = await api('POST', '/categories', { cookie: admin, json: { name: 'Too Deep', slug: `${catSlug}-deep`, image: subImage, parentId: subId } });
      expect('A subcategory cannot have its own subcategories (400)', r, 400);
      r = await api('DELETE', `/categories/${catId}`, { cookie: admin });
      expect('A category with subcategories cannot be deleted (409)', r, 409);
      r = await api('POST', '/products', { cookie: admin, json: { ...productBody, slug: `${productBody.slug}-x`, categoryId: subId } });
      expect('A product cannot use a subcategory as its main category (400)', r, 400);
      r = await api('POST', '/products', { cookie: admin, json: { ...productBody, slug: `${productBody.slug}-y`, categoryId: 1, subcategoryId: subId } });
      expect('A product subcategory must belong to its category (400)', r, 400);
    }

    productBody.categoryId = catId;
    if (subId) productBody.subcategoryId = subId;
    r = await api('POST', '/products', { cookie: admin, json: productBody });
    expect('POST /products creates a product with 2 variants', r, 201, (b) => b.slug === productBody.slug && b.variants.length === 2 && b.occasion.includes('Smoke Test') && b.tags.includes('smoke-test'));
    if (r.status === 201 && r.json?.id) {
      product = r.json;
      testProduct = true;
      vMain = product.variants?.find((v) => v.sku === skuMain)?.id ?? null;
    }
    r = await api('POST', '/products', { cookie: admin, json: productBody });
    expect('Creating a product with a slug that exists returns 409', r, 409);
  }

  if (testProduct) {
    r = await api('PUT', `/products/${product.id}`, { cookie: admin, json: { name: 'Smoke Test Saree (edited)', basePrice: 1600 } });
    expect('PUT /products/:id changes name and price and keeps the variants', r, 200, (b) => b.name === 'Smoke Test Saree (edited)' && b.basePrice === 1600 && b.variants.length === 2);

    const filters = [
      ['category', `categoryId=${catId}`],
      ...(subId ? [['subcategory', `subcategoryId=${subId}`]] : []),
      ['price range', 'priceMin=1600&priceMax=1600'],
      ['colour', `colors=${encodeURIComponent('Smoke Blue')}`],
      ['fabric', `fabrics=${encodeURIComponent(fabric)}`],
      ['occasion', `occasions=${encodeURIComponent('Smoke Test')}`],
      ['search text', `search=${encodeURIComponent('Smoke Test Saree')}`],
    ];
    for (const [label, qs] of filters) {
      r = await api('GET', `/products?${qs}&limit=100`);
      expect(`Filter by ${label} finds the new product`, r, 200, (b) => ids(b.items).includes(product.id));
    }
    r = await api('GET', `/products?fabrics=${encodeURIComponent('No Such Fabric')}&limit=100`);
    expect('Filter by another fabric leaves it out', r, 200, (b) => !ids(b.items).includes(product.id));

    const form = new FormData();
    form.append('image', new Blob([PNG_1PX], { type: 'image/png' }), 'smoke.png');
    form.append('variantId', String(vMain));
    form.append('sortOrder', '0');
    r = await api('POST', `/products/${product.id}/images`, { cookie: admin, form });
    expect('POST /products/:id/images uploads an image', r, 201, (b) => Number.isInteger(b.id) && /^(https?:\/\/[^/]+)?\/uploads\/[^/]+\.png$/.test(b.url));
    image = r.status === 201 && r.json?.url ? r.json : null;
    if (image) {
      r = await request('GET', fullUrl(image.url));
      check(`The uploaded image is served (${fullUrl(image.url)})`, r.status === 200 && (r.headers.get('content-type') || '').startsWith('image/'), `got HTTP ${r.status}, ${r.headers.get('content-type')}`);
      r = await api('GET', `/products/${product.id}`);
      expect('The image is attached to its variant', r, 200, (b) => variantOf(b, vMain)?.images.includes(image.url));
    }

    const noFile = new FormData();
    noFile.append('sortOrder', '0');
    r = await api('POST', `/products/${product.id}/images`, { cookie: admin, form: noFile });
    expect('Uploading without a file returns 400 NO_FILE', r, 400, () => errCode(r) === 'NO_FILE');

    const fake = new FormData();
    fake.append('image', new Blob(['<?php echo "hacked"; ?>'], { type: 'image/png' }), 'evil.php.png');
    r = await api('POST', `/products/${product.id}/images`, { cookie: admin, form: fake });
    expect('A PHP file pretending to be a PNG is refused', r, 400, () => errCode(r) === 'INVALID_FILE_TYPE');
  } else if (admin) {
    skip('Product update, filters and image upload', 'the test product could not be created');
  } else {
    skip('Category, product and image admin tests', 'admin login failed');
  }

  // Without the admin, shop with an existing product instead (its stock goes down by 2).
  if (!product) {
    const candidate = products.find((p) => p.variants?.some((v) => v.stock >= 5));
    if (candidate) {
      product = candidate;
      vMain = candidate.variants.find((v) => v.stock >= 5).id;
      console.log(`        Using the existing product "${candidate.name}" for the shopping tests.`);
    }
  }

  // ------------------------------------------------------------ 5
  section('5. Customer: addresses, wishlist, cart, orders, reviews');
  const address = { label: 'Home', fullName: 'Smoke Test', phone: '9876543210', line1: '1 Test Street', city: 'Chennai', state: 'Tamil Nadu', pincode: '600001', isDefault: true };
  const shippingAddress = { fullName: 'Smoke Test', phone: '9876543210', line1: '1 Test Street', city: 'Chennai', state: 'Tamil Nadu', pincode: '600001' };

  r = await api('GET', `/customers/${custId}/addresses`, { cookie: cust });
  expect('GET addresses (a new customer has none)', r, 200, (b) => Array.isArray(b) && b.length === 0);
  r = await api('POST', `/customers/${custId}/addresses`, { cookie: cust, json: address });
  expect('POST an address', r, 201, (b) => b.city === 'Chennai' && b.isDefault === true);
  const addrId = r.json?.id;
  r = await api('PUT', `/customers/${custId}/addresses/${addrId}`, { cookie: cust, json: { ...address, city: 'Coimbatore' } });
  expect('PUT the address', r, 200, (b) => b.city === 'Coimbatore');
  r = await api('GET', `/customers/${custId}/addresses`, { cookie: cust });
  expect('The address is listed', r, 200, (b) => ids(b).includes(addrId));
  r = await api('GET', `/customers/${custId + 1}/addresses`, { cookie: cust });
  expect("Another customer's addresses return 403", r, 403);
  r = await api('POST', `/customers/${custId}/addresses`, { cookie: cust, json: { fullName: '' } });
  expect('An incomplete address returns 400', r, 400, () => errCode(r) === 'VALIDATION_ERROR');
  r = await api('DELETE', `/customers/${custId}/addresses/${addrId}`, { cookie: cust });
  expect('DELETE the address', r, 204);
  r = await api('DELETE', `/customers/${custId}/addresses/${addrId}`, { cookie: cust });
  expect('Deleting it again returns 404', r, 404);

  let orderId = null;
  let stockBefore = null;

  if (!product || !vMain) {
    skip('Wishlist, cart, order and review tests', 'no product with stock to test with');
  } else {
    const pid = product.id;
    const price = variantOf(product, vMain).price;

    // Wishlist
    r = await api('GET', '/wishlist');
    expect('GET /wishlist without logging in returns 401', r, 401);
    r = await api('POST', '/wishlist', { cookie: cust, json: { productId: pid, variantId: vMain } });
    expect('POST /wishlist adds the product', r, 201, (b) => b.some((w) => w.productId === pid && w.variantId === vMain));
    r = await api('GET', '/wishlist', { cookie: cust });
    expect('GET /wishlist lists it', r, 200, (b) => b.some((w) => w.productId === pid));
    r = await api('DELETE', `/wishlist/${pid}`, { cookie: cust });
    expect('DELETE /wishlist/:productId', r, 204);
    r = await api('GET', '/wishlist', { cookie: cust });
    expect('The wishlist is empty again', r, 200, (b) => !b.some((w) => w.productId === pid));

    // Cart
    r = await api('GET', '/cart', { cookie: cust });
    expect('GET /cart (empty for a new customer)', r, 200, (b) => Array.isArray(b.items) && b.items.length === 0 && b.totalItems === 0);
    r = await api('POST', '/cart/items', { cookie: cust, json: { productId: pid, variantId: vMain, quantity: 2 } });
    expect('POST /cart/items adds 2 pieces', r, 201, (b) => b.totalItems === 2 && near(b.subtotal, price * 2) && b.items[0]?.variant?.id === vMain);
    check('Cart total = subtotal + shipping (free above the threshold)', cartMathOk(r.json), short(r.json));

    if (variantOf(product, vMain).stock < 100) {
      r = await api('POST', '/cart/items', { cookie: cust, json: { productId: pid, variantId: vMain, quantity: 100 } });
      expect('Adding more than the stock returns 400 INSUFFICIENT_STOCK', r, 400, () => errCode(r) === 'INSUFFICIENT_STOCK');
    }
    r = await api('POST', '/cart/items', { cookie: cust, json: { productId: pid, variantId: 999999999, quantity: 1 } });
    expect('Adding an unknown variant returns 404', r, 404);
    r = await api('POST', '/cart/items', { cookie: cust, json: { productId: 'abc', variantId: vMain } });
    expect('Adding with productId "abc" returns 400 VALIDATION_ERROR', r, 400, () => errCode(r) === 'VALIDATION_ERROR');
    r = await api('POST', '/cart/items', { cookie: cust, raw: '{"productId": 1,' });
    expect('Malformed JSON returns 400 INVALID_JSON', r, 400, () => errCode(r) === 'INVALID_JSON');

    r = await api('PATCH', `/cart/items/${vMain}`, { cookie: cust, json: { quantity: 1 } });
    expect('PATCH /cart/items/:variantId changes the quantity', r, 200, (b) => b.totalItems === 1 && cartMathOk(b));
    r = await api('PATCH', `/cart/items/${vMain}`, { cookie: cust, json: { quantity: 0 } });
    expect('Quantity 0 returns 400', r, 400);
    r = await api('PATCH', '/cart/items/999999999', { cookie: cust, json: { quantity: 1 } });
    expect('Changing an item that is not in the cart returns 404', r, 404);
    r = await api('DELETE', `/cart/items/${vMain}`, { cookie: cust });
    expect('DELETE /cart/items/:variantId removes it', r, 200, (b) => b.items.length === 0);
    r = await api('POST', '/cart/items', { cookie: cust, json: { productId: pid, variantId: vMain } });
    expect('Adding without a quantity adds 1', r, 201, (b) => b.totalItems === 1);
    r = await api('DELETE', '/cart', { cookie: cust });
    expect('DELETE /cart empties the cart', r, 204);
    r = await api('GET', '/cart', { cookie: cust });
    expect('The cart is empty', r, 200, (b) => b.items.length === 0);

    // Orders
    stockBefore = await stockOf(pid, vMain);
    r = await api('POST', '/orders', { cookie: cust, json: { items: [{ productId: pid, variantId: vMain, quantity: 2 }], shippingAddress, paymentMethod: 'cod' } });
    expect('POST /orders places an order', r, 201, (b) =>
      /^ORD-\d{4}-\d{6}$/.test(b.id)
      && b.status === 'pending'
      && b.items.length === 1
      && b.items[0].quantity === 2
      && near(b.subtotal, price * 2)
      && near(b.total, b.subtotal + b.shippingCost)
      && b.statusHistory?.[0]?.status === 'pending'
      && b.customerEmail === email
      && b.shippingAddress?.city === 'Chennai');
    orderId = r.status === 201 ? r.json?.id ?? null : null;
    const stockAfter = await stockOf(pid, vMain);
    check('Placing the order took 2 off the stock', stockAfter === stockBefore - 2, `stock before ${stockBefore}, after ${stockAfter}`);

    if (typeof stockAfter === 'number' && stockAfter < 100) {
      r = await api('POST', '/orders', { cookie: cust, json: { items: [{ productId: String(pid), variantId: String(vMain), quantity: 100 }], shippingAddress, paymentMethod: 'upi' } });
      expect('Ordering more than the stock returns 400 INSUFFICIENT_STOCK', r, 400, () => errCode(r) === 'INSUFFICIENT_STOCK');
    }
    r = await api('POST', '/orders', { cookie: cust, json: { items: [], shippingAddress, paymentMethod: 'cod' } });
    expect('An order with no items returns 400', r, 400, () => errCode(r) === 'VALIDATION_ERROR');
    r = await api('POST', '/orders', { cookie: cust, json: { items: [{ productId: pid, variantId: vMain, quantity: 1 }], shippingAddress, paymentMethod: 'bitcoin' } });
    expect('An unknown payment method returns 400', r, 400);

    if (orderId) {
      r = await api('GET', '/orders', { cookie: cust });
      expect('GET /orders lists the order', r, 200, (b) => ids(b.items).includes(orderId) && b.total === 1);
      r = await api('GET', '/orders?status=pending', { cookie: cust });
      expect('GET /orders?status=pending includes it', r, 200, (b) => ids(b.items).includes(orderId));
      r = await api('GET', '/orders?status=delivered', { cookie: cust });
      expect('GET /orders?status=delivered leaves it out', r, 200, (b) => !ids(b.items).includes(orderId));
      r = await api('GET', `/orders/${orderId}`, { cookie: cust });
      expect('GET /orders/:id', r, 200, (b) => b.id === orderId && ISO.test(b.createdAt));
      r = await api('PATCH', `/orders/${orderId}/status`, { cookie: cust, json: { status: 'confirmed' } });
      expect('A customer cannot change the order status (403)', r, 403);
    }
    r = await api('GET', '/orders?status=bogus', { cookie: cust });
    expect('GET /orders?status=bogus returns 400', r, 400);
    r = await api('GET', '/orders/ORD-1999-999999', { cookie: cust });
    expect('An unknown order returns 404', r, 404);

    // Reviews
    r = await api('POST', '/reviews', { cookie: cust, json: { productId: pid, rating: 4, comment: 'Lovely fabric. Written by the smoke test.' } });
    expect('POST /reviews', r, 201, (b) => b.rating === 4 && b.customerName === 'Smoke Test' && b.productId === pid);
    const reviewId = r.json?.id;
    r = await api('POST', '/reviews', { cookie: cust, json: { productId: pid, rating: 5, comment: 'A second review attempt.' } });
    expect('A second review of the same product returns 409', r, 409);
    r = await api('POST', '/reviews', { cookie: cust, json: { productId: pid, rating: 9, comment: 'x' } });
    expect('An invalid review returns 400', r, 400);
    r = await api('GET', `/products/${pid}/reviews`);
    expect('The review shows on the product', r, 200, (b) => ids(b).includes(reviewId));
    if (testProduct) {
      r = await api('GET', `/products/${pid}`);
      expect('The product rating is updated (4.0 from 1 review)', r, 200, (b) => b.rating === 4 && b.reviewCount === 1);
    }
  }

  // ------------------------------------------------------------ 6
  section('6. Admin: orders');
  if (!admin || !orderId) {
    skip('Order status tests', admin ? 'no order was placed' : 'admin login failed');
  } else {
    r = await api('GET', '/orders?limit=100', { cookie: admin });
    expect("The admin sees customers' orders", r, 200, (b) => ids(b.items).includes(orderId));
    r = await api('PATCH', `/orders/${orderId}/status`, { cookie: admin, json: { status: 'delivered' } });
    expect('pending -> delivered is refused (INVALID_STATUS_TRANSITION)', r, 400, () => errCode(r) === 'INVALID_STATUS_TRANSITION');
    r = await api('PATCH', `/orders/${orderId}/status`, { cookie: admin, json: { status: 'shipping' } });
    expect('An unknown status returns 400', r, 400, () => errCode(r) === 'VALIDATION_ERROR');
    for (const status of ['confirmed', 'processing']) {
      r = await api('PATCH', `/orders/${orderId}/status`, { cookie: admin, json: { status } });
      expect(`The admin moves the order to "${status}"`, r, 200, (b) => b.status === status);
    }
    r = await api('PATCH', `/orders/${orderId}/status`, { cookie: admin, json: { status: 'cancelled' } });
    expect('The admin cancels the order (status history is kept)', r, 200, (b) =>
      b.status === 'cancelled' && b.statusHistory.map((h) => h.status).join(',') === 'pending,confirmed,processing,cancelled');
    const restored = await stockOf(product.id, vMain);
    check('Cancelling put the stock back', restored === stockBefore, `stock before the order ${stockBefore}, now ${restored}`);
    r = await api('PATCH', `/orders/${orderId}/status`, { cookie: admin, json: { status: 'confirmed' } });
    expect('A cancelled order cannot be reopened', r, 400);
    r = await api('GET', `/orders/${orderId}`, { cookie: cust });
    expect('The customer sees the order as cancelled', r, 200, (b) => b.status === 'cancelled');
  }

  // ------------------------------------------------------------ 6b
  section('6b. Reels (home page videos)');
  r = await api('GET', '/reels');
  expect('GET /reels (the reels customers see)', r, 200, (b) => Array.isArray(b));
  r = await api('GET', '/admin/reels', { cookie: cust });
  expect('A customer cannot manage reels (403)', r, 403);
  if (!admin) {
    skip('Reel management', 'admin login failed');
  } else {
    r = await api('GET', '/admin/reels', { cookie: admin });
    if (r.status === 503 && errCode(r) === 'SETUP_REQUIRED') {
      check('The reels table exists (run database/migration-2026-11-reels.sql)', false, r.text);
    } else {
      expect('GET /admin/reels lists every reel and the upload limits', r, 200, (b) => Array.isArray(b.items) && b.maxVideoMb >= 1 && b.maxImageMb >= 1);

      const videoForm = new FormData();
      videoForm.append('video', new Blob([MP4_TINY], { type: 'video/mp4' }), 'smoke-reel.mp4');
      r = await api('POST', '/reels/videos', { cookie: admin, form: videoForm });
      expect('POST /reels/videos uploads a video', r, 201, (b) => /^(https?:\/\/[^/]+)?\/uploads\/[^/]+\.mp4$/.test(b.url));
      const videoUrl = r.status === 201 ? r.json.url : null;

      const fakeVideo = new FormData();
      fakeVideo.append('video', new Blob(['<?php echo "hacked"; ?>'], { type: 'video/mp4' }), 'evil.mp4');
      r = await api('POST', '/reels/videos', { cookie: admin, form: fakeVideo });
      expect('A file that is not a video is refused', r, 400, () => errCode(r) === 'INVALID_FILE_TYPE');
      const movForm = new FormData();
      movForm.append('video', new Blob([MOV_TINY], { type: 'video/quicktime' }), 'clip.mov');
      r = await api('POST', '/reels/videos', { cookie: admin, form: movForm });
      expect('A MOV video is refused with a hint to use MP4', r, 400, (b) => errCode(r) === 'INVALID_FILE_TYPE' && /MP4/.test(b.error.message));
      r = await api('POST', '/reels/videos', { cookie: cust, form: videoForm });
      expect('A customer cannot upload reel videos (403)', r, 403);

      const coverForm = new FormData();
      coverForm.append('image', new Blob([PNG_1PX], { type: 'image/png' }), 'smoke-cover.png');
      r = await api('POST', '/reels/covers', { cookie: admin, form: coverForm });
      expect('POST /reels/covers uploads a cover picture', r, 201, (b) => /^(https?:\/\/[^/]+)?\/uploads\/[^/]+\.png$/.test(b.url));
      const coverUrl = r.status === 201 ? r.json.url : null;

      r = await api('POST', '/reels', { cookie: admin, json: { coverUrl } });
      expect('A reel without a video is refused', r, 400, (b) => b.error.details?.[0]?.path === 'videoUrl');
      r = await api('POST', '/reels', { cookie: admin, json: { videoUrl } });
      expect('A reel without a cover picture is refused', r, 400, (b) => b.error.details?.[0]?.path === 'coverUrl');
      r = await api('POST', '/reels', { cookie: admin, json: { videoUrl: 'https://www.instagram.com/reel/abc123/', coverUrl } });
      expect('An Instagram page link is refused (it cannot play on the website)', r, 400, (b) => b.error.details?.[0]?.path === 'videoUrl');

      let reel = null;
      if (videoUrl && coverUrl) {
        const reelBody = { title: `Smoke reel ${STAMP}`, videoUrl, coverUrl, sortOrder: 0 };
        if (product) reelBody.productId = product.id;
        r = await api('POST', '/reels', { cookie: admin, json: reelBody });
        expect('POST /reels creates a reel', r, 201, (b) => b.videoUrl === videoUrl && b.coverUrl === coverUrl && b.isActive === true
          && (!product || b.product?.slug === product.slug) && ISO.test(b.createdAt));
        reel = r.status === 201 ? r.json : null;
      }
      if (reel) {
        r = await api('GET', '/reels');
        expect('The new reel is on the website', r, 200, (b) => ids(b).includes(reel.id));
        r = await api('PUT', `/reels/${reel.id}`, { cookie: admin, json: { isActive: false } });
        expect('PUT /reels/:id hides the reel', r, 200, (b) => b.isActive === false && b.videoUrl === videoUrl);
        r = await api('GET', '/reels');
        expect('A hidden reel is not on the website', r, 200, (b) => !ids(b).includes(reel.id));
        r = await api('PUT', `/reels/${reel.id}`, { cookie: admin, json: { productId: 999999999 } });
        expect('Linking a product that does not exist is refused', r, 400, (b) => b.error.details?.[0]?.path === 'productId');
        r = await api('PUT', `/reels/${reel.id}`, { cookie: cust, json: { isActive: true } });
        expect('A customer cannot change reels (403)', r, 403);
        r = await api('DELETE', `/reels/${reel.id}`, { cookie: admin });
        expect('DELETE /reels/:id', r, 204);
        r = await request('GET', fullUrl(videoUrl));
        check('The deleted reel\'s video file is removed', !(r.status === 200 && (r.headers.get('content-type') || '').startsWith('video/')), `got HTTP ${r.status}`);
        r = await api('PUT', `/reels/${reel.id}`, { cookie: admin, json: { isActive: true } });
        expect('The deleted reel is gone', r, 404);
      }
    }
  }

  // ------------------------------------------------------------ 7
  section('7. Admin: clean-up (image, product, category)');
  if (!admin) {
    skip('Clean-up', 'admin login failed');
  }
  if (admin && image && testProduct) {
    // The website sends existing image URLs back when it saves the variants; they must be kept.
    const variants = productBody.variants.map((v) => ({ ...v, images: v.sku === skuMain ? [image.url] : [] }));
    r = await api('PUT', `/products/${product.id}`, { cookie: admin, json: { variants } });
    expect('Saving variants with their image URLs keeps the images', r, 200, (b) => b.variants.find((v) => v.sku === skuMain)?.images?.includes(image.url));
    r = await request('GET', fullUrl(image.url));
    check('The image file is still there after the edit', r.status === 200, `got HTTP ${r.status}`);
    image = null; // the re-attached image has a new id; the next save removes it instead
    r = await api('PUT', `/products/${product.id}`, { cookie: admin, json: { variants: productBody.variants.map((v) => ({ ...v, images: [] })) } });
    expect('Saving variants without an image removes it', r, 200, (b) => b.variants.every((v) => v.images.length === 0));
    vMain = r.json?.variants?.find((v) => v.sku === skuMain)?.id ?? vMain; // variants are re-created on save
    const removedUrl = variants.find((v) => v.images.length)?.images[0];
    if (removedUrl) {
      r = await request('GET', fullUrl(removedUrl));
      check('The image file nobody uses any more is deleted', !(r.status === 200 && (r.headers.get('content-type') || '').startsWith('image/')), `got HTTP ${r.status}`);
    }
    // A fresh image for the DELETE /products/:id/images/:imageId check below.
    const again = new FormData();
    again.append('image', new Blob([PNG_1PX], { type: 'image/png' }), 'smoke-2.png');
    again.append('variantId', String(vMain));
    r = await api('POST', `/products/${product.id}/images`, { cookie: admin, form: again });
    expect('POST /products/:id/images uploads a second image', r, 201, (b) => Number.isInteger(b.id));
    image = r.status === 201 && r.json?.url ? r.json : null;
  }
  if (admin && image) {
    r = await api('DELETE', `/products/${product.id}/images/${image.id}`, { cookie: admin });
    expect('DELETE /products/:id/images/:imageId', r, 204);
    r = await request('GET', fullUrl(image.url));
    check('The image file is deleted', !(r.status === 200 && (r.headers.get('content-type') || '').startsWith('image/')), `got HTTP ${r.status}`);
  }
  if (admin && testProduct) {
    r = await api('DELETE', `/products/${product.id}`, { cookie: admin });
    expect('DELETE /products/:id archives the product', r, 204);
    r = await api('GET', `/products?search=${encodeURIComponent('Smoke Test Saree')}&limit=100`);
    expect('Archived products are hidden from the shop', r, 200, (b) => !ids(b.items).includes(product.id));
    r = await api('POST', '/cart/items', { cookie: cust, json: { productId: product.id, variantId: vMain, quantity: 1 } });
    expect('An archived product cannot be added to the cart', r, 400, () => errCode(r) === 'PRODUCT_UNAVAILABLE');
    r = await api('POST', '/orders', { cookie: cust, json: { items: [{ productId: product.id, variantId: vMain, quantity: 1 }], shippingAddress, paymentMethod: 'cod' } });
    expect('An archived product cannot be ordered', r, 400, () => errCode(r) === 'PRODUCT_UNAVAILABLE');
  }
  if (admin && subId) {
    r = await api('DELETE', `/categories/${subId}`, { cookie: admin });
    expect('DELETE /categories/:id removes the subcategory', r, 204);
    if (subImage) {
      r = await request('GET', fullUrl(subImage));
      check('The subcategory image file is deleted', !(r.status === 200 && (r.headers.get('content-type') || '').startsWith('image/')), `got HTTP ${r.status}`);
    }
  }
  if (admin && catId) {
    r = await api('DELETE', `/categories/${catId}`, { cookie: admin });
    expect('DELETE /categories/:id', r, 204);
    r = await api('GET', `/categories/slug/${catSlug}`);
    expect('The deleted category is gone', r, 404);
  }

  // ------------------------------------------------------------ 8
  section('8. Logout');
  r = await api('POST', '/auth/logout', { cookie: cust });
  expect('POST /auth/logout', r, 200);
  r = await api('GET', '/auth/me', { cookie: cust });
  expect('The old session no longer works', r, 401);
  if (admin) await api('POST', '/auth/logout', { cookie: admin });
}

main()
  .catch((e) => {
    failed++;
    failures.push(`The test script stopped: ${e.message}`);
    console.error(e);
  })
  .finally(() => {
    console.log(`\n=== Result: ${passed} passed, ${failed} failed, ${skipped} skipped ===`);
    if (failures.length) {
      console.log('Failed checks:');
      for (const f of failures) console.log(`  - ${f}`);
      console.log('Tip: with \'env\' => \'development\' in api/config.php, a 500 error shows the real PHP error message above.');
    }
    if (rateLimited) {
      console.log('Some requests were rate-limited (HTTP 429). Wait 15 minutes, delete the files in');
      console.log('public_html/api/storage/ratelimit, or raise the rate_limit numbers in api/config.php for local testing.');
    }
    process.exitCode = failed ? 1 : 0;
  });
