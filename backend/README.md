# Surabi Silks — Backend API

REST API backend for the Surabi Silks textile e-commerce application.

## Tech Stack

- **Runtime:** Node.js (ES Modules)
- **Framework:** Express.js 5
- **Database:** MySQL with mysql2/promise
- **Validation:** Zod
- **Authentication:** Argon2 + secure cookie sessions
- **Testing:** Vitest + Supertest

## Local Setup

### Prerequisites

- Node.js 20+ (LTS)
- MySQL 8.0+

### 1. Install dependencies

```bash
cd backend
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your MySQL credentials
```

### 3. Run migrations

```bash
npm run migrate
```

To reset the database and re-run all migrations:

```bash
npm run migrate:fresh
```

### 4. Seed data

```bash
npm run seed
```

This seeds categories, subcategories, products with variants and images, and test users:

| Email                  | Password     | Role     |
|------------------------|-------------|----------|
| admin@surabsilks.com   | admin123    | admin    |
| priya@example.com      | password123 | customer |
| anitha@example.com     | password123 | customer |
| meera@example.com      | password123 | customer |
| deepa@example.com      | password123 | customer |

### 5. Start the server

```bash
npm run dev    # with auto-reload
npm start      # production
```

Server runs at `http://localhost:3000`.

### 6. Run tests

```bash
npm test
```

> Tests require a running MySQL instance with the seeded database.

---

## API Endpoints

Base URL: `/api/v1`

### Health

| Method | Endpoint   | Description     |
|--------|-----------|-----------------|
| GET    | `/health` | Health check    |

### Authentication

| Method | Endpoint         | Auth | Description          |
|--------|-----------------|------|----------------------|
| POST   | `/auth/register` | —    | Register new customer |
| POST   | `/auth/login`    | —    | Login                |
| POST   | `/auth/logout`   | Yes  | Logout               |
| GET    | `/auth/me`       | Yes  | Get current user     |

**Request/Response examples:**

```json
// POST /auth/register
{ "name": "Test", "email": "test@example.com", "password": "mypassword" }
// → 201: { "id": 1, "name": "Test", "email": "test@example.com", "role": "customer" }

// POST /auth/login
{ "email": "test@example.com", "password": "mypassword" }
// → 200: { "id": 1, "name": "Test", ... } + Set-Cookie: session_id=...
```

### Products

| Method | Endpoint                      | Auth  | Description               |
|--------|------------------------------|-------|---------------------------|
| GET    | `/products`                  | —     | List products (paginated) |
| GET    | `/products/featured`         | —     | Featured products         |
| GET    | `/products/new-arrivals`     | —     | New arrivals              |
| GET    | `/products/bestsellers`      | —     | Bestsellers               |
| GET    | `/products/search?q=`        | —     | Search products           |
| GET    | `/products/slug/:slug`       | —     | Get by slug               |
| GET    | `/products/:id`              | —     | Get by ID                 |
| GET    | `/products/:id/related`      | —     | Related products          |
| POST   | `/products`                  | Admin | Create product            |
| PUT    | `/products/:id`              | Admin | Update product            |
| DELETE | `/products/:id`              | Admin | Archive product           |
| POST   | `/products/:id/images`       | Admin | Upload image              |
| DELETE | `/products/:id/images/:imgId`| Admin | Remove image              |

**Query parameters for `GET /products`:**

| Param          | Type   | Description                    |
|----------------|--------|--------------------------------|
| page           | number | Page number (default: 1)       |
| limit          | number | Items per page (default: 12)   |
| sort           | string | price-asc, price-desc, newest, rating, name-asc, name-desc |
| categoryId     | number | Filter by category             |
| subcategoryId  | number | Filter by subcategory          |
| priceMin       | number | Minimum price                  |
| priceMax       | number | Maximum price                  |
| colors         | string | Comma-separated color names    |
| fabrics        | string | Comma-separated fabric types   |
| occasions      | string | Comma-separated occasions      |
| search         | string | Search term                    |

**Response format:**

```json
{
  "items": [...],
  "total": 26,
  "totalPages": 3,
  "page": 1
}
```

### Categories

| Method | Endpoint              | Auth  | Description           |
|--------|----------------------|-------|-----------------------|
| GET    | `/categories`        | —     | List all categories   |
| GET    | `/categories/tree`   | —     | Category tree         |
| GET    | `/categories/slug/:s`| —     | Get by slug           |
| POST   | `/categories`        | Admin | Create category       |
| PUT    | `/categories/:id`    | Admin | Update category       |
| DELETE | `/categories/:id`    | Admin | Delete category       |

### Error Responses

All errors return:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": [...]  // for validation errors
  }
}
```

| Code              | Status | Description              |
|-------------------|--------|--------------------------|
| VALIDATION_ERROR  | 400    | Invalid input            |
| UNAUTHORIZED      | 401    | Not authenticated        |
| FORBIDDEN         | 403    | Insufficient permissions |
| NOT_FOUND         | 404    | Resource not found       |
| CONFLICT          | 409    | Duplicate resource       |
| RATE_LIMITED      | 429    | Too many requests        |
| INTERNAL_ERROR    | 500    | Server error             |

---

## Architecture

```
backend/
├── src/
│   ├── index.js              # Server entry point
│   ├── app.js                # Express app setup
│   ├── config/
│   │   ├── env.js            # Environment configuration
│   │   └── database.js       # MySQL connection pool
│   ├── middleware/
│   │   ├── auth.js           # Session authentication
│   │   ├── errorHandler.js   # Centralized error handling
│   │   ├── rateLimiter.js    # Rate limiting
│   │   ├── upload.js         # Multer file upload
│   │   └── validate.js       # Zod validation middleware
│   ├── routes/               # Route definitions
│   ├── controllers/          # Request handlers
│   ├── services/             # Business logic
│   ├── repositories/         # Data access layer
│   ├── schemas/              # Zod validation schemas
│   └── utils/                # Shared utilities
├── migrations/               # Versioned SQL migrations
├── scripts/                  # CLI scripts (migrate, seed)
├── tests/                    # Test files
└── uploads/                  # Uploaded images
```

**Flow:** Routes → Controllers → Services → Repositories → MySQL

---

## Remaining Backend Phases

### Phase 2 — Orders & Checkout
- Order creation and management
- Order status updates with history
- Order listing (customer + admin)
- Stock deduction on order confirmation

### Phase 3 — Customer Management
- Profile update
- Address CRUD
- Order history per customer
- Admin customer listing

### Phase 4 — Reviews & Ratings
- Submit review (authenticated customers)
- List reviews per product
- Rating aggregation
- Admin review moderation

### Phase 5 — Admin Dashboard
- Sales analytics
- Inventory alerts
- Customer statistics
- Contact enquiry management

### Phase 6 — Production Readiness
- Payment gateway integration
- Email notifications (order confirmation, shipping)
- Production image storage (S3/Cloudinary)
- Logging and monitoring
- CI/CD pipeline
