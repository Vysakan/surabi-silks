# Surabhi Silks Authentication and Admin Audit

Audit performed before implementation on the checked-out project. Deployment documentation identifies `backend-php/public_html` as the Hostinger API; the separate `backend/` Node service is a parallel development implementation. Frontend provider defaults to dummy data unless `VITE_DATA_PROVIDER=api` is set.

## Findings

| Feature | Status | Evidence |
|---|---|---|
| Customer registration | Implemented, with gaps | React registration page; PHP `POST /auth/register`, server-assigned `customer`, `password_hash`, unique email key. Frontend phone validation exists. PHP requires only minimum lengths and API currently returns a SQL duplicate error instead of consistently mapping a race to conflict. |
| Customer forgot/reset password | Missing | No reset UI, API, token table, or reset logic. |
| Admin forgot/reset password | Missing | No recovery UI or API. Admins use the same existing login/session implementation. |
| Root Admin provisioning/recovery | Missing | User role enum only has `customer` and `admin`; no root role, recovery email, root-only bootstrap, or recovery audit mechanism. |
| Root Admin creates admins | Missing | No management API or UI. Existing `UserRepository::create` accepts a role internally, but no route exposes it. |
| Login/logout and session | Implemented | PHP stores random 48-byte session IDs in `sessions`, uses HttpOnly cookies, and checks expiration. Logout removes only the current session. Production cookies are Secure and SameSite Strict. |
| Admin authorization | Partially implemented | Admin APIs use server-side `Auth::requireRole('admin')`; React route checks role only for display. No root role hierarchy or admin account controls. |
| Password storage | Mostly sound | New PHP passwords use `password_hash` (Argon2id where available, otherwise bcrypt); login uses `password_verify`. The Node backend separately uses Argon2. |
| Database support | Partial | `users` and `sessions` exist; email uniqueness and session foreign key exist. No reset tokens or security audit log. `users.role` enum cannot represent a root admin. |

## Security issues and implementation risks

- The React auth store persists `isAuthenticated` and user role in local storage. This is client-controlled state and can be stale; it must not be treated as authorization. Backend middleware is the security boundary.
- Frontend registration accepts a six-character password, while the PHP API requires eight; server-side enforcement is correct, but the UI should match it.
- Signup has an email pre-check but must also handle the unique-index race cleanly.
- Existing password reset and root recovery are absent. A root role cannot be safely introduced without a schema migration and an operator-controlled initial provisioning path.
- Deployment notes include demo admin credentials and suggest changing a customer role directly in phpMyAdmin. Those are setup notes, not an authenticated provisioning workflow, and must be treated as insecure for production.
- Production email delivery is not configured in the sample PHP config. Email-based reset cannot be relied on until a sender and mail transport are configured and verified.
- Customer account Settings initially displayed a demo password-change form with no authenticated password-change API.

## Implementation completed

- Customer and Admin email recovery use 256-bit random tokens, SHA-256 token hashes, 30-minute expiry, single-use consumption, generic request responses, auth rate limits, reset audit events, and all-session revocation.
- Root Admin recovery uses an operator-confirmed recovery email set during CLI bootstrap. A request submitted to that verified mailbox is delivered a reset link and successful use is logged as `root_admin_password_reset`. The CLI can also reset the password without web/email and revokes sessions.
- Root Admin can list and create Admin accounts. The API checks the live session role server-side; no public request accepts an Admin or Root Admin role. Admin password length on creation is at least 12 characters.
- Customer registration retains its existing flow, with server-side customer-only role assignment and consistent duplicate-email conflict responses, including unique-index races. Frontend password minimum now matches PHP's eight-character rule.
- Frontend added forgot/reset pages and Root Admin account-management navigation. Frontend logout now calls the PHP endpoint so the server session is removed.
- The existing customer Settings form now verifies the current password server-side, updates the hash, audits the change, and revokes all sessions before requiring a fresh sign in.
- Existing users and sessions are preserved by the separately supplied migration. Fresh `backend-php/database/schema.sql` includes the matching role, verified recovery email, reset-token, and audit structures.
- Remaining deployment requirement: configure a working Hostinger `mail()` sender and reset-page URL, apply the migration to an existing database, and initialize Root Admin through the CLI.
