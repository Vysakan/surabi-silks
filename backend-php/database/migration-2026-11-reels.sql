-- Surabhi Silks - reels for the home page (November 2026)
-- Local / any database: select your database first, then run this ONCE.
--   * reels: short videos with a cover picture, managed in Admin > Reels
-- If it says the table already exists, this update has already been applied.

CREATE TABLE IF NOT EXISTS reels (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(150) DEFAULT NULL,
  video_url VARCHAR(500) NOT NULL,
  cover_url VARCHAR(500) NOT NULL,
  product_id INT UNSIGNED DEFAULT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_reels_active_order (is_active, sort_order),
  INDEX idx_reels_product (product_id),
  CONSTRAINT fk_reels_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SHOW COLUMNS FROM reels;
