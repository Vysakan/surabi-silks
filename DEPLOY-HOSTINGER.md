# Deploy Surabi Silks on Hostinger (two subdomains)

| What | Address | Hostinger folder |
|---|---|---|
| Website (React) | https://surabhisilkstest.semicoloninnovations.in | `public_html/surabhisilkstest` |
| API (PHP) | https://surabhiwebapi.semicoloninnovations.in/api/v1 | `public_html/surabhiwebapi` |

What's in this package:

| File | Use |
|---|---|
| `surabhiwebapi-upload.zip` | The PHP API. Upload it to `public_html/surabhiwebapi` and extract it there. |
| `frontend-files/` | Two files to copy into your React project before `npm run build`. |
| `database/schema.sql`, `database/seed.sql` | The tables, and the optional demo data. |
| `tests/smoke-test.mjs` | Automatic test of the live API (run on your PC). |

The two addresses are already filled in everywhere. You only add your database login.

---

## Step 1. Check hPanel (5 minutes)

1. **Subdomains:** go to hPanel → **Domains → Subdomains**. Both subdomains must be listed, with the folders `public_html/surabhisilkstest` and `public_html/surabhiwebapi`.
2. **SSL:** go to hPanel → **Security → SSL**. Both subdomains must show **Active**. If one doesn't, install the free SSL for it; it can take a few minutes. This is required, because login only works over HTTPS.
3. **PHP version:** go to hPanel → **Advanced → PHP Configuration** and choose **PHP 8.3** (8.1 or newer works). Leave the default extensions on.
4. Open both folders in **File Manager** and delete any Hostinger placeholder files, such as `default.php`.

## Step 2. Database

1. Go to hPanel → **Databases → Management** (called *MySQL Databases* in older hPanel). Create a database and a user with a strong password.
   Hostinger adds a prefix, for example `u123456789_surabi`. Write down the **full** database name, user name and password.
2. Go to **Databases → phpMyAdmin**, and click **Enter phpMyAdmin** next to that database.
3. Open **Import**, choose `database/schema.sql` and click **Import**. Then do the same with `database/seed.sql`.
4. Check: the `products` table has 9 rows and `users` has 5.

## Step 3. API → `public_html/surabhiwebapi`

1. In **File Manager**, open `public_html/surabhiwebapi` and upload `surabhiwebapi-upload.zip`.
2. Right-click the zip and choose **Extract**, into this same folder. Afterwards it must look like this:
   ```
   public_html/surabhiwebapi/
   ├── .htaccess
   ├── api/
   │   ├── index.php
   │   ├── config.hostinger.php
   │   ├── config.example.php
   │   ├── src/
   │   └── storage/
   └── uploads/
   ```
   If the files landed in an extra subfolder, move them up one level. Then delete the zip.
   `.htaccess` starts with a dot. If you don't see it, turn on *Show hidden files* in File Manager's settings.
3. Rename `api/config.hostinger.php` to **`config.php`**. Open it, enter the database **name**, **user** and **password** from step 2, and save.
   The website address (CORS) and the image address are already filled in.
4. Check in your browser:
   - https://surabhiwebapi.semicoloninnovations.in/api/v1/health shows `{"status":"ok",...}`
   - https://surabhiwebapi.semicoloninnovations.in/api/v1/categories shows a list of categories
   - https://surabhiwebapi.semicoloninnovations.in/api/config.php shows **403 Forbidden**. That's correct: the file is protected.

   The bare address https://surabhiwebapi.semicoloninnovations.in/ also shows 403. That's normal, because the API lives under `/api/v1`.

## Step 4. Website → `public_html/surabhisilkstest`

On your PC:
1. Copy `frontend-files/.env.production` into your `frontend` folder, replacing the old one.
   Copy `frontend-files/public/.htaccess` into `frontend/public/`.
2. In the `frontend` folder, run:
   ```powershell
   npm install
   npm run build
   ```
3. Open `frontend/dist`. It must contain `.htaccess`, `index.html`, `assets/`, `images/` and `logo.jpg`.
4. Select **everything inside** `dist`, not the `dist` folder itself. Right-click and choose **Compress to ZIP file** (Windows 11), or **Send to → Compressed (zipped) folder** (Windows 10).

In **File Manager**:
5. Open `public_html/surabhisilkstest`, upload that zip, extract it into the same folder, and delete the zip.
   `index.html`, `.htaccess` and `assets/` must be directly inside `surabhisilkstest`.
6. Open https://surabhisilkstest.semicoloninnovations.in. The home page should show products from the database.

## Step 5. Test everything

**Automatic test.** On your PC, in the folder where you extracted this package, run:
```powershell
node tests\smoke-test.mjs https://surabhiwebapi.semicoloninnovations.in https://surabhisilkstest.semicoloninnovations.in
```
It should end with `=== Result: 127 passed, 0 failed, 0 skipped ===`. It also checks that the API allows the website to call it with the login cookie (CORS).
It makes about 125 requests, and Hostinger allows 200 per 15 minutes from your IP. If you see `429` failures, wait 15 minutes and run it again.

**In the browser** (https://surabhisilkstest.semicoloninnovations.in):
- [ ] Home, shop pages, filters, search and product pages show data
- [ ] Open https://surabhisilkstest.semicoloninnovations.in/shop directly and press F5. You should see the shop, not a 404.
- [ ] Register, log out, log in, then refresh the page: you stay logged in
- [ ] Wishlist, cart (₹99 shipping under ₹2,000), and checkout with a COD order, which then appears under Account → Orders
- [ ] Admin (`admin@surabsilks.com` / `admin123`): create a product, upload an image (it shows on the product page), change an order's status

**Remove the test data** afterwards: in phpMyAdmin, open the **SQL** tab and run:
```sql
DELETE FROM orders   WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'smoke-%@example.com');
DELETE FROM users    WHERE email LIKE 'smoke-%@example.com';
DELETE FROM products WHERE slug LIKE 'smoke-test-saree-%';
```

## Before real customers use it

- **Remove the demo logins.** Register your own account on the website, then make it the admin and delete the demo users in phpMyAdmin → SQL:
  ```sql
  UPDATE users SET role = 'admin' WHERE email = 'you@yourmail.com';
  DELETE FROM users WHERE email IN ('admin@surabsilks.com','priya@example.com','anitha@example.com','meera@example.com','deepa@example.com');
  ```
  If MySQL refuses because a demo user has orders, delete those orders first.
- **Moving the website to the main domain later?** Change the three addresses: `cors.origin` and `upload.url_prefix` in `api/config.php`, and `VITE_API_BASE` in `frontend/.env.production`. Then build and upload again.

## Updating later

- **API:** upload a new `surabhiwebapi-upload.zip` and extract it over the folder. It contains no `config.php`, so yours is kept.
- **Website:** run `npm run build` again, then upload and extract the new zip over `surabhisilkstest`. Press Ctrl+F5 in the browser to see the new version.

## Troubleshooting

| What you see | What to do |
|---|---|
| The website shows no products, and the browser console (F12) says *blocked by CORS policy* | In `api/config.php`, `cors.origin` must be exactly `https://surabhisilkstest.semicoloninnovations.in` (the website's address, with https and no slash at the end). |
| The website shows no products and the console shows *Network Error* with no CORS message | `VITE_API_BASE` in `frontend/.env.production` is wrong, or the build was made without it. Fix it, then build and upload again. |
| Login seems to work, but you're logged out straight away | Open the website with `https://`, and check that SSL is **Active** for both subdomains. |
| `/api/v1/...` shows a Hostinger 404 page | `.htaccess` is missing from `surabhiwebapi`, or the files were extracted into a subfolder. |
| Refreshing a page such as `/shop` gives a 404 | `.htaccess` is missing from `surabhisilkstest`. Check that `dist` contained it. |
| The API says `Internal server error` | Set `'env' => 'development'` in `api/config.php`: the API then shows the real error message. Set it back to `'production'` afterwards. The usual cause is the database name, user or password; remember the `u123456789_` prefix. |
| `CONFIG_MISSING` | `api/config.hostinger.php` wasn't renamed to `config.php`. |
| Images uploaded in the admin don't show | `upload.url_prefix` in `config.php` must be `https://surabhiwebapi.semicoloninnovations.in/uploads`, and the `uploads` folder must exist. |
| `429 Too many requests` | Wait 15 minutes. |
