# Surabi Silks: PHP backend for Hostinger

This folder replaces the Node.js backend (`backend/`) with a plain PHP backend.
It needs no Composer, no Node and no build step: you upload the files and it runs.

- **Same API:** all 42 endpoints, URLs, JSON responses and error codes are unchanged, so the React frontend needs no code changes.
- **Same database:** the tables are identical. Existing user passwords (Argon2) keep working.
- **Requirements:** PHP 8.1 or newer with `pdo_mysql` and `fileinfo` (both on by default on Hostinger), and MySQL 8 or MariaDB 10.4+.

## Folder layout

```
backend-php/
├── database/
│   ├── schema.sql          ← creates all tables (import first)
│   └── seed.sql            ← optional demo products, categories and demo logins
└── public_html/            ← everything in here goes into Hostinger's public_html
    ├── .htaccess           ← sends /api/v1/* to PHP and everything else to React
    ├── uploads/            ← product images uploaded from the admin panel
    └── api/
        ├── index.php       ← the API entry point
        ├── config.example.php  ← copy to config.php and fill in
        ├── src/            ← the code (blocked from web access)
        └── storage/        ← rate-limit counters (blocked from web access)
```

## Deploy to Hostinger (step by step)

### 1. Create the database
1. In **hPanel**, go to **Databases → MySQL Databases**.
2. Create a database and a user, for example `u123456789_surabi`, and pick a strong password.
3. Write down the **database name**, **username** and **password**. The host is `localhost`.

### 2. Create the tables
1. Go to **Databases → phpMyAdmin → Enter phpMyAdmin** for that database.
2. Open **Import**, choose `database/schema.sql` and click **Import**.
3. (Optional) Import `database/seed.sql` to load the demo catalogue: 4 categories, 13 subcategories and 9 products. It also creates demo logins (`admin@surabsilks.com` / `admin123` and `priya@example.com` / `password123`). Change those passwords or delete the demo users before you go live.

### 3. Build the frontend
On your PC, in the `frontend` folder:
```bash
npm install
npm run build
```
This uses `frontend/.env.production`, which switches the site from dummy data to the real API at `/api/v1`. The result is in `frontend/dist/`.

### 4. Upload the files
In **hPanel → Files → File Manager**, open `public_html`:
1. Upload **everything inside `frontend/dist/`**: `index.html`, `assets/`, `images/`, `logo.jpg`, and so on.
2. Upload **everything inside `backend-php/public_html/`**: `.htaccess`, `api/` and `uploads/`. Replace the `.htaccess` Hostinger created, if there is one.
   - Files starting with a dot can be hidden. In File Manager, turn on *Show hidden files* to check that `.htaccess` is there.

### 5. Configure the API
1. In `public_html/api/`, copy `config.example.php` to **`config.php`**.
2. Edit `config.php` and enter your database name, user and password from step 1. Leave `env` set to `'production'`.

### 6. Turn on HTTPS
Go to **hPanel → Security → SSL** and install the free SSL certificate, then turn on **Force HTTPS**.
Login only works over HTTPS in production, because the session cookie is marked `Secure`.

### 7. Check that it works
- `https://your-domain/api/v1/health` should show `{"status":"ok", ...}`.
- `https://your-domain/api/v1/categories` should list your categories.
- `https://your-domain/api/config.php` should be **blocked** (403).
- Open the site, register an account, add to cart, and place an order.

If the API returns `{"error":{"code":"CONFIG_MISSING"...}}`, `config.php` is missing or misnamed.
For any other 500 error, check **hPanel → Advanced → PHP Configuration / Error logs**.

## Run it on your PC (optional)

With PHP 8.1+ and MySQL installed:
```bash
cd backend-php/public_html
cp api/config.example.php api/config.php     # set env => 'development', your local DB details
php -S localhost:3000 api/index.php
```
The existing Vite proxy (`frontend/vite.config.js`) already forwards `/api/v1` and `/uploads` to `localhost:3000`. Run `npm run dev` in `frontend` with `VITE_DATA_PROVIDER=api` in `frontend/.env`.

## Moving data from your current local database
To keep the users, orders and other data you already have, export them from your local MySQL. Use phpMyAdmin Export or `mysqldump surabi_silks > data.sql`, then import that file into the Hostinger database instead of `schema.sql` and `seed.sql`.
Before you import, delete the `CREATE DATABASE` and `USE` lines near the top. Hostinger names the database for you.

## Differences from the Node backend
- `.env` is replaced by `api/config.php`, which has the same settings.
- Rate limits (200 API / 20 login requests per 15 minutes per IP) are stored in small files under `api/storage/`.
- New passwords are hashed with Argon2id when the server supports it, and bcrypt otherwise. Both kinds verify.
- The server detects the type of an uploaded image from its contents and chooses the file extension itself. `uploads/.htaccess` stops anything in that folder from running as a script.
- The frontend's contact form (`POST /contact`) and profile endpoints (`/customers/:id`) didn't exist in the Node backend either. They are still to be built.
