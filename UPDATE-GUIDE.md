# Surabhi Silks – update of 11 Nov 2026

This update adds password reset, root-admin account management, stronger login security, category images with subcategories, a category carousel and split category/subcategory dropdowns.

**Do the steps in this order: database, then API, then website.** The new API reads columns that the database update adds. If you upload the API first, every sign-in fails until the database is updated.

---

## 1. What is in this package

| Folder | Where it goes |
|---|---|
| `surabhiwebapi/` | Hostinger: `public_html/surabhiwebapi/`. Your PC: copy only the `api` folder into `backend-php\public_html\`. |
| `frontend/src/` | Your React project's `src` folder (same paths). |
| `database/` | Update scripts. `migration-2026-11-auth.sql` is for your PC and `migration-2026-11-auth-hostinger.sql` is for Hostinger. `schema.sql` is only for new installs. |
| `tests/smoke-test.mjs` | Replaces `backend-php\tests\smoke-test.mjs`. |

The full file list (new or replaced) is at the end of this guide. `config.php` is **not** included, because it holds your passwords. You add the new settings to it yourself in step 3.

---

## 2. Test on your PC first

### 2.1 Update the local database (once)

In PowerShell:

```powershell
cd "D:\Desktop\semi colun\projects\surabi silks\backend-php\database"
# copy migration-2026-11-auth.sql from this package into this folder first
mysql -u root -p --default-character-set=utf8mb4 surabi_php_test
```

Then at the `mysql>` prompt:

```sql
SOURCE migration-2026-11-auth.sql;
```

You should see the `users` column list, which now includes `is_active`, `password_changed_at` and `last_login_at`. If it says *Duplicate column name 'is_active'*, the update has already been applied.

### 2.2 Copy the files

1. Copy `surabhiwebapi\api\` from this package over `backend-php\public_html\api\`. Say **Replace** when asked; your `config.php` is not touched.
2. Copy `frontend\src\` from this package over your frontend's `src\` folder (Replace).
3. Copy `tests\smoke-test.mjs` over `backend-php\tests\smoke-test.mjs`.

### 2.3 Add the new settings to your local `config.php`

Open `backend-php\public_html\api\config.php` and add this block just above `'shipping' => [`:

```php
    'app' => [
        'name'         => 'Surabhi Silks',
        'frontend_url' => 'http://localhost:5173',
    ],

    'auth' => [
        'reset_link_minutes' => 30,
        'invite_link_hours'  => 48,
    ],

    // On your PC emails are not sent: they are written to api\storage\mail.log
    'mail' => [
        'driver'     => 'log',
        'from_email' => 'no-reply@semicoloninnovations.in',
        'from_name'  => 'Surabhi Silks',
    ],
```

### 2.4 Make yourself the root admin

The **root admin** (`superadmin`) can do everything an admin can, plus add, disable and remove admins and send them password links. Admins manage products, categories, orders and inventory only.

The simplest way to become root admin:

1. Start the API and the website (2.5), open the website, **Register** with your own email and sign out.
2. In `mysql`:
   ```sql
   UPDATE users SET role = 'superadmin' WHERE email = 'you@example.com';
   ```
3. Sign in again. **Admin Users** and **My Account** now appear in the dashboard menu.

Alternatively, from `backend-php\public_html` run:

```powershell
php api\bin\root-admin.php you@example.com "Your Name"
```

It makes that account root admin (creating it if needed) and prints a one-time link to set the password.

### 2.5 Run and test

Terminal 1 (API):

```powershell
cd "D:\Desktop\semi colun\projects\surabi silks\backend-php\public_html"
php -S localhost:3000 api/index.php
```

Terminal 2 (website):

```powershell
cd "<your frontend folder>"
npm run dev
```

Terminal 3 (automatic test, 157 checks; all should pass):

```powershell
cd "D:\Desktop\semi colun\projects\surabi silks\backend-php"
node tests\smoke-test.mjs
```

The test signs in as the demo admin (`admin@surabsilks.com`); it works whether that account is an admin or a root admin. It makes 14 sign-in-type requests and the limit is 20 per 15 minutes, so a second run straight away gets 429 errors: delete the files in `api\storage\ratelimit` (or wait 15 minutes) and run it again.

Then click through the checklist in section 5. To find a reset link on your PC, open `backend-php\public_html\api\storage\mail.log` in Notepad.

---

## 3. Put it on Hostinger

### 3.1 Update the live database (once)

hPanel → **Databases** → **Management** → **Enter phpMyAdmin** next to `u484845748_surabi_website` → **SQL** tab. Paste the whole of `database\migration-2026-11-auth-hostinger.sql` and click **Go**.

You should see the column list of `users` including `is_active`. The file names the database in every statement, so the information_schema problem from last time cannot happen.

### 3.2 Create the mailbox that sends the emails

hPanel → **Emails** → your domain → **Create email account**, for example `no-reply@semicoloninnovations.in`, with a strong password. Hostinger Business includes this.

### 3.3 Add the new settings to the live `config.php`

hPanel → **File Manager** → `public_html/surabhiwebapi/api/config.php` → **Edit**. Add above `'shipping' => [`:

```php
    'app' => [
        'name'         => 'Surabhi Silks',
        'frontend_url' => 'https://surabhisilkstest.semicoloninnovations.in',
    ],

    'auth' => [
        'reset_link_minutes' => 30,
        'invite_link_hours'  => 48,
    ],

    'mail' => [
        'driver'     => 'smtp',
        'from_email' => 'no-reply@semicoloninnovations.in',
        'from_name'  => 'Surabhi Silks',
        'smtp' => [
            'host'       => 'smtp.hostinger.com',
            'port'       => 465,
            'encryption' => 'ssl',
            'username'   => 'no-reply@semicoloninnovations.in',
            'password'   => 'THE MAILBOX PASSWORD',
        ],
    ],
```

Also check that `'env' => 'production'` is set; it may still be `development` from the orders debugging. Save.

When the website moves to its final domain, change `frontend_url` **and** `cors.origin` to the new address.

### 3.4 Upload the API files

1. Zip the **contents** of this package's `surabhiwebapi` folder with Windows Explorer (select `.htaccess` and `api`, right-click → **Send to** → **Compressed (zipped) folder**).
2. File Manager → `public_html/surabhiwebapi` → **Upload** the zip → right-click it → **Extract** here → overwrite. Then delete the zip.
3. Your `config.php` stays as it is; the package does not contain one.

### 3.5 Build and upload the website

As before: `npm run build`, zip the **contents** of `dist` with Explorer, upload to `public_html/surabhisilkstest`, extract and overwrite.

### 3.6 Root admin and demo accounts on the live site

1. On the live site, **Register** with your own email, then sign out.
2. phpMyAdmin → SQL:
   ```sql
   UPDATE `u484845748_surabi_website`.`users`
   SET role = 'superadmin', is_active = 1
   WHERE email = 'you@example.com';
   ```
3. Sign in. Test **Forgot password** with your own email (check spam the first time).
4. When you are happy, switch off the demo accounts. They have public passwords:
   ```sql
   UPDATE `u484845748_surabi_website`.`users`
   SET is_active = 0
   WHERE email IN ('admin@surabsilks.com', 'priya@example.com', 'anitha@example.com',
                   'meera@example.com', 'deepa@example.com');
   ```
   This disables them rather than deleting them, so their past orders stay intact.

### 3.7 Run the automatic test against Hostinger (optional)

After the demo admin is disabled, give the test your own admin login:

```powershell
$env:ADMIN_EMAIL="you@example.com"; $env:ADMIN_PASSWORD="your password"
node tests\smoke-test.mjs https://surabhiwebapi.semicoloninnovations.in https://surabhisilkstest.semicoloninnovations.in
```

Expect 161 passed. It creates and removes test data, and asks for a reset email to a `smoke-…@example.com` address, which will simply bounce.

---

## 4. If a root admin loses access

Use the first option that works:

1. **Forgot password** on the sign-in page. A link is emailed; it works once and expires in 30 minutes.
2. **Another root admin** opens **Admin Users** → **Reset password** for you.
3. **SSH** (hPanel → Advanced → SSH Access):
   ```bash
   cd ~/domains/semicoloninnovations.in/public_html/surabhiwebapi
   php api/bin/root-admin.php you@example.com
   ```
   It re-enables the account, signs it out everywhere and prints a one-time link (60 minutes).
4. **phpMyAdmin only.** First make up a random code of 40 letters and numbers, for example in PowerShell:
   ```powershell
   -join ((48..57)+(65..90)+(97..122) | Get-Random -Count 40 | % {[char]$_})
   ```
   Then run this SQL, with your code in place of `PASTE-CODE-HERE` and your email in place of `you@example.com`:
   ```sql
   UPDATE `u484845748_surabi_website`.`users` SET role = 'superadmin', is_active = 1 WHERE email = 'you@example.com';
   INSERT INTO `u484845748_surabi_website`.`password_resets` (user_id, token_hash, purpose, expires_at)
   SELECT id, SHA2('PASTE-CODE-HERE', 256), 'reset', UTC_TIMESTAMP() + INTERVAL 30 MINUTE
   FROM `u484845748_surabi_website`.`users` WHERE email = 'you@example.com';
   ```
   Within 30 minutes, open:
   `https://surabhisilkstest.semicoloninnovations.in/reset-password?token=PASTE-CODE-HERE`

Whoever controls hPanel can always recover the shop. Protect the hPanel login with two-factor authentication: hPanel → Profile → Security.

---

## 5. Click-through checklist

**Accounts**
- [ ] Register with a weak password such as `abcdefgh` or `password123`: it is refused with a clear message.
- [ ] Sign in with a wrong password 5 times: the 5th attempt says the account is locked for 15 minutes. **Forgot password** still works.
- [ ] **Forgot password** → the email arrives → the link opens *Choose a new password* → you can sign in with the new password. Opening the same link again says it has expired.
- [ ] Account → Settings → **Change password**. Another browser that was signed in to the same account is signed out.
- [ ] The **Quick Login (Demo)** buttons no longer appear on the live sign-in page.

**Admins (as root admin)**
- [ ] Admin Users → **Add Admin** with a new email: an invitation email arrives and the link lets them set a password. If email is not working, a copyable link is shown instead.
- [ ] Add Admin with the email of an existing customer: they become an admin and keep their password.
- [ ] **Disable** an admin: they are signed out at once and cannot sign in.
- [ ] A normal admin does not see **Admin Users**, and `/admin/users` sends them away.
- [ ] Every admin can change their own password under **My Account**.

**Categories**
- [ ] Add Category without an image: *Please upload an image for this category*.
- [ ] Add a category with an image, then use **+** on its row to add a subcategory with an image.
- [ ] Edit an existing category (for example the "saree" one with no image, shown in red) and upload an image: it saves.
- [ ] Deleting a category that still has subcategories is refused with an explanation.
- [ ] Home page → **Shop by Category** shows every main category as a swipeable row with arrows, and **View All** opens `/categories` with all of them and their subcategories.
- [ ] New categories also appear in the menu (the first 4 in the desktop bar, all of them in the mobile menu and under *All Categories*) and in the shop filter.

**Products**
- [ ] Add Product: **Category** lists only main categories. **Subcategory** stays disabled until a category is chosen and then lists only its subcategories. Changing the category clears the subcategory.
- [ ] Edit a product that has images and save it: the images are still there.
- [ ] `/shop/<category>` and `/shop/<category>/<subcategory>` show only the matching products.

---

## 6. Files in this package

**API** (`surabhiwebapi/`), new files are marked **new**:

```
.htaccess                                  (also blocks api/bin)
api/bin/.htaccess                          new
api/bin/root-admin.php                     new
api/config.example.php
api/config.hostinger.php
api/src/App.php
api/src/Controllers/AdminUserController.php      new
api/src/Controllers/AuthController.php
api/src/Controllers/CategoryController.php
api/src/Controllers/OrderController.php
api/src/Controllers/ProductController.php
api/src/Http/HttpError.php
api/src/Repositories/CategoryRepository.php
api/src/Repositories/PasswordResetRepository.php new
api/src/Repositories/ProductRepository.php
api/src/Repositories/SessionRepository.php
api/src/Repositories/UserRepository.php
api/src/Routes.php
api/src/Support/Auth.php
api/src/Support/Emails.php                 new
api/src/Support/Mailer.php                 new
api/src/Support/Throttle.php               new
api/src/Support/Uploads.php
api/src/Validation/Schemas.php
```

**Website** (`frontend/src/`):

```
App.jsx
router.jsx
components/auth/ChangePasswordForm.jsx         new
components/storefront/CategoryCard.jsx         new
components/storefront/CategoryCarousel.jsx     new
components/storefront/FilterSidebar.jsx
components/storefront/Navbar.jsx
components/ui/PasswordInput.jsx                new
components/ui/ProtectedRoute.jsx
hooks/useCategoryTree.js                       new
hooks/useLogout.js                             new
layouts/AdminLayout.jsx
layouts/CustomerLayout.jsx
lib/apiError.js                                new
lib/roles.js                                   new
lib/validators.js
pages/admin/AdminAccountPage.jsx               new
pages/admin/AdminUsersPage.jsx                 new
pages/admin/CategoryManagementPage.jsx
pages/admin/ProductFormPage.jsx
pages/auth/ForgotPasswordPage.jsx              new
pages/auth/LoginPage.jsx
pages/auth/RegisterPage.jsx
pages/auth/ResetPasswordPage.jsx               new
pages/customer/SettingsPage.jsx
pages/storefront/CatalogPage.jsx
pages/storefront/CategoriesPage.jsx            new
pages/storefront/HomePage.jsx
services/adminUserService.js                   new
services/api/adminUserService.js               new
services/api/authService.js
services/api/categoryService.js
services/api/client.js
services/api/productService.js
services/authService.js
services/categoryService.js
services/dummy/adminUserService.js             new
services/dummy/authService.js
services/dummy/categoryService.js
stores/useAuthStore.js
```

The replaced website files are whole files, based on the project zip you sent on 10 Nov. If you have edited any of them since then, merge your edits back in or send me the file.
