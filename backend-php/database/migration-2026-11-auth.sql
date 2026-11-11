-- Surabi Silks - account security update (November 2026)
-- Run ONCE on a database that already has the shop tables (your PC: surabi_php_test).
--   * users: adds the root-admin role ("superadmin"), an on/off switch (is_active) and two dates
--   * password_resets: one-time links for "Forgot password" and admin invites
-- If it says "Duplicate column name 'is_active'", this update has already been applied.
-- For Hostinger use migration-2026-11-auth-hostinger.sql (same thing, with the database name written in).

ALTER TABLE users
  MODIFY role ENUM('customer', 'admin', 'superadmin') NOT NULL DEFAULT 'customer',
  ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER avatar,
  ADD COLUMN password_changed_at DATETIME DEFAULT NULL AFTER is_active,
  ADD COLUMN last_login_at DATETIME DEFAULT NULL AFTER password_changed_at;

CREATE TABLE IF NOT EXISTS password_resets (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL,
  purpose ENUM('reset', 'invite') NOT NULL DEFAULT 'reset',
  expires_at DATETIME NOT NULL,
  used_at DATETIME DEFAULT NULL,
  created_ip VARCHAR(45) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_password_resets_token (token_hash),
  INDEX idx_password_resets_user (user_id),
  CONSTRAINT fk_password_resets_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SHOW COLUMNS FROM users;
