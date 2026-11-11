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
├── tests/
│   └── smoke-test.mjs      ← checks every endpoint (run on your PC, never uploaded)
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

### Authentication and admin security upgrade

For an existing database, back it up and run `database/migrations/014_auth_admin_security.sql` once in phpMyAdmin. It adds root-admin support, recovery-token storage, verified recovery-email fields, and auth audit events without deleting existing users. For a fresh install, the current `database/schema.sql` already includes these structures.

Configure `mail.from` in `api/config.php` to a sender mailbox hosted and authenticated for your domain, and set `app.reset_url` to `https://<your-store-domain>/reset-password`. Hostinger PHP `mail()` must be working for recovery links to arrive. Until both values are configured, reset requests still return a generic success response but no email is sent; the PHP error log records the missing configuration.

After the migration, upload `scripts/root-admin.php` to a private directory outside `public_html`, preserving its sibling `public_html/api` path. Register the initial account, then using Hostinger SSH and the account's PHP CLI run `php root-admin.php bootstrap owner@your-domain` and confirm the recovery mailbox. You may pass a separate recovery mailbox as the optional third argument. This promotes the selected existing account, marks the operator-confirmed recovery address verified, and logs the action. If email recovery is unavailable later, run `php root-admin.php reset owner@your-domain`; enter the new password at the private CLI prompt. This revokes all of that account's sessions. Never place the script under `public_html`.

The shared `/forgot-password` and `/reset-password` pages support customer, admin, and Root Admin recovery. Root Admin requests must use the configured verified recovery email. Tokens are single-use, expire after 30 minutes, and only SHA-256 token hashes are stored. Successful resets revoke all sessions. Customer account Settings also supports an authenticated current-password change; it audits the change and revokes sessions before requiring a fresh sign in.

Only the Root Admin can call the admin creation API. Normal Admins cannot create admin accounts, even if they modify frontend state or call the endpoint directly.

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

## Test it on your PC (Windows)

You need PHP, the MySQL you already use for the Node backend, and Node (already installed for the frontend).

### 1. Install PHP (one time)
1. Download PHP 8.3, **VS16 x64 Thread Safe** zip, from https://windows.php.net/download/ and extract it to `C:\php`, so that `C:\php\php.exe` exists.
2. Add `C:\php` to your PATH: Start, type *environment variables*, open **Edit the system environment variables**, then **Environment Variables**. Select **Path**, click **Edit**, then **New**, and enter `C:\php`. Open a new terminal afterwards.
3. Create `php.ini` with the extensions switched on. In PowerShell:
   ```powershell
   cd C:\php
   (Get-Content php.ini-development) `
     -replace '^;extension_dir = "ext"', 'extension_dir = "C:\php\ext"' `
     -replace '^;extension=pdo_mysql', 'extension=pdo_mysql' `
     -replace '^;extension=fileinfo', 'extension=fileinfo' `
     -replace '^;extension=mbstring', 'extension=mbstring' |
     Set-Content php.ini
   ```
4. Check it:
   ```powershell
   php -v                                              # PHP 8.3.x
   php -m                                              # the list must include pdo_mysql and fileinfo
   php -r "var_dump(defined('PASSWORD_ARGON2ID'));"    # bool(true): the demo logins will work
   ```
   If `php -v` complains about `VCRUNTIME140.dll`, install the Microsoft Visual C++ Redistributable: `winget install Microsoft.VCRedist.2015+.x64`.

### 2. Create a test database
Use a new database, so testing never touches your existing local data. Open the **MySQL Command Line Client**, or run `mysql -u root -p`, and enter the following. Use forward slashes in the paths:
```sql
CREATE DATABASE surabi_php_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE surabi_php_test;
SOURCE C:/Users/<you>/Projects_Local/surabi-silks/backend-php/database/schema.sql;
SOURCE C:/Users/<you>/Projects_Local/surabi-silks/backend-php/database/seed.sql;
EXIT;
```
In MySQL Workbench, do the same with **File → Open SQL Script** and the ⚡ button, once for each file, with `surabi_php_test` selected.
This also tests the two files you will import on Hostinger.

### 3. Create a local config.php
Copy `public_html/api/config.example.php` to `public_html/api/config.php` and change these lines:
```php
'env' => 'development',
'db' => [
    'host'     => '127.0.0.1',
    'port'     => 3306,
    'name'     => 'surabi_php_test',
    'user'     => 'root',
    'password' => 'your local MySQL password',
],
// Higher limits, so repeated test runs are not blocked (keep the defaults on Hostinger):
'rate_limit' => [
    'api'         => [5000, 900],
    'auth'        => [500, 900],
    'storage_dir' => __DIR__ . '/storage/ratelimit',
],
```
Don't upload this local `config.php` to Hostinger. Hostinger gets its own, with `'production'` and the Hostinger database.

### 4. Start the PHP API
Stop the Node backend first, because both use port 3000. Then:
```powershell
cd C:\Users\<you>\Projects_Local\surabi-silks\backend-php\public_html
php -S localhost:3000 api/index.php
```
Leave this window open: every request and every PHP error appears here. Open http://localhost:3000/api/v1/health in the browser. It should show `{"status":"ok",...}`.

### 5. Run the automatic test
In a second terminal:
```powershell
cd C:\Users\<you>\Projects_Local\surabi-silks\backend-php
node tests\smoke-test.mjs
```
It calls all 42 endpoints and prints `PASS`, `FAIL` or `SKIP` for each check. It ends with `=== Result: N passed, 0 failed, 0 skipped ===`.
The checks cover the catalogue and filters, registration and login, addresses, wishlist, cart and shipping, orders and stock, reviews, admin product, category and image management, order status changes, and the security rules.
A failed check prints the server's answer. With `'env' => 'development'`, a 500 error includes the real PHP error message, and the PHP window shows it too.
It adds a customer called "Smoke Test" (smoke-…@example.com) and a cancelled order. To remove them, see *Removing test data* below.

### 6. Test the website against the PHP API
`frontend/.env` already has `VITE_DATA_PROVIDER=api`, and the Vite proxy sends `/api/v1` and `/uploads` to `localhost:3000`. Then:
```powershell
cd C:\Users\<you>\Projects_Local\surabi-silks\frontend
npm run dev
```
Open http://localhost:5173 and click through:
- [ ] Home page sections (featured, new arrivals, bestsellers) show products from the database
- [ ] Shop pages: categories, filters (price, colour, fabric, occasion), sorting, search
- [ ] Product page: switching variants changes price, stock and images; reviews and related products
- [ ] Register, log out, log in again; refreshing the page keeps you logged in
- [ ] Wishlist: add and remove
- [ ] Cart: add, change quantity, remove; ₹99 shipping under ₹2,000 and free above
- [ ] Checkout: place a COD order, then see it under Account → Orders
- [ ] Account → Addresses: add, edit, delete
- [ ] Admin (log in as `admin@surabsilks.com` / `admin123`): create a product with variants, upload an image, edit, delete
- [ ] Admin: categories, orders (change the status; cancelling puts the stock back), inventory

The contact form and the profile Settings page won't save. Those endpoints didn't exist in the Node backend either.

**If the site can't reach the API** (Vite prints `http proxy error ... ECONNREFUSED`): start PHP with `php -S 127.0.0.1:3000 api/index.php` instead. Then change both `target` lines in `frontend/vite.config.js` to `http://127.0.0.1:3000`.

### Removing test data
Run this in the database the test used:
```sql
DELETE FROM orders   WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'smoke-%@example.com');
DELETE FROM users    WHERE email LIKE 'smoke-%@example.com';
DELETE FROM products WHERE slug LIKE 'smoke-test-saree-%';
```
To start completely fresh, drop and recreate `surabi_php_test` and run step 2 again.

## Moving data from your current local database
To keep the users, orders and other data you already have, export them from your local MySQL. Use phpMyAdmin Export or `mysqldump surabi_silks > data.sql`, then import that file into the Hostinger database instead of `schema.sql` and `seed.sql`.
Before you import, delete the `CREATE DATABASE` and `USE` lines near the top. Hostinger names the database for you.

## Differences from the Node backend
- `.env` is replaced by `api/config.php`, which has the same settings.
- Rate limits (200 API / 20 login requests per 15 minutes per IP) are stored in small files under `api/storage/`.
- New passwords are hashed with Argon2id when the server supports it, and bcrypt otherwise. Both kinds verify.
- The server detects the type of an uploaded image from its contents and chooses the file extension itself. `uploads/.htaccess` stops anything in that folder from running as a script.
- The frontend's contact form (`POST /contact`) and profile endpoints (`/customers/:id`) didn't exist in the Node backend either. They are still to be built.
