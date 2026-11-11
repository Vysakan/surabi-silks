-- Apply once to an existing Surabi Silks database. Keeps all existing users and sessions.
ALTER TABLE users MODIFY role ENUM('customer', 'admin', 'root_admin') NOT NULL DEFAULT 'customer';
ALTER TABLE users ADD COLUMN recovery_email VARCHAR(255) DEFAULT NULL AFTER email;
ALTER TABLE users ADD COLUMN recovery_email_verified_at DATETIME DEFAULT NULL AFTER recovery_email;

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  consumed_at DATETIME DEFAULT NULL,
  request_ip VARCHAR(45) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_password_reset_token_hash (token_hash),
  INDEX idx_password_reset_user (user_id),
  INDEX idx_password_reset_expiry (expires_at),
  CONSTRAINT fk_password_reset_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS auth_audit_log (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED DEFAULT NULL,
  actor_user_id INT UNSIGNED DEFAULT NULL,
  event_type VARCHAR(64) NOT NULL,
  ip_address VARCHAR(45) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_auth_audit_user_created (user_id, created_at),
  INDEX idx_auth_audit_actor_created (actor_user_id, created_at),
  INDEX idx_auth_audit_event_created (event_type, created_at),
  CONSTRAINT fk_auth_audit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_auth_audit_actor FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
