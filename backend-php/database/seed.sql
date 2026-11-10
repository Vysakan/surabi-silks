-- Surabi Silks - demo data (categories, 9 products, variants, images, demo users).
-- OPTIONAL. Import AFTER schema.sql, into an EMPTY database only.
-- Same data as backend/scripts/seed.js. Demo logins (change or delete before going live):
--   admin@surabsilks.com / admin123   (admin)
--   priya@example.com    / password123 (customer; also anitha@, meera@, deepa@example.com)

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- users (5 rows)
INSERT INTO `users` (`id`, `name`, `email`, `phone`, `password_hash`, `role`, `avatar`, `created_at`, `updated_at`) VALUES
(1,'Priya Sharma','priya@example.com','+91 98765 43210','$argon2id$v=19$m=65536,t=3,p=4$j6T+CGY1k0kluhGLg4TcOw$hdad3HFwdsGXERCJrQrQ3ZgXHoS2cOd4vzlSEOCCmPI','customer',NULL,'2026-05-31 18:30:00','2026-11-04 08:00:48'),
(2,'Anitha Rajendran','anitha@example.com','+91 94432 56789','$argon2id$v=19$m=65536,t=3,p=4$j6T+CGY1k0kluhGLg4TcOw$hdad3HFwdsGXERCJrQrQ3ZgXHoS2cOd4vzlSEOCCmPI','customer',NULL,'2026-07-14 18:30:00','2026-11-04 08:00:48'),
(3,'Meera Nair','meera@example.com','+91 90876 54321','$argon2id$v=19$m=65536,t=3,p=4$j6T+CGY1k0kluhGLg4TcOw$hdad3HFwdsGXERCJrQrQ3ZgXHoS2cOd4vzlSEOCCmPI','customer',NULL,'2026-08-19 18:30:00','2026-11-04 08:00:48'),
(4,'Deepa Iyer','deepa@example.com','+91 87654 32109','$argon2id$v=19$m=65536,t=3,p=4$j6T+CGY1k0kluhGLg4TcOw$hdad3HFwdsGXERCJrQrQ3ZgXHoS2cOd4vzlSEOCCmPI','customer',NULL,'2026-09-04 18:30:00','2026-11-04 08:00:48'),
(5,'Admin User','admin@surabsilks.com','+91 99999 00000','$argon2id$v=19$m=65536,t=3,p=4$bRroauJxkLhGwn4iUjq4gw$FxhFGjEia8C8Dv+CEjXhzU3yzgut9NwEL8TW6h3OTIQ','admin',NULL,'2025-12-31 18:30:00','2026-11-04 08:00:48');

-- user_addresses (2 rows)
INSERT INTO `user_addresses` (`id`, `user_id`, `label`, `full_name`, `phone`, `line1`, `line2`, `city`, `state`, `pincode`, `is_default`, `created_at`) VALUES
(1,1,'Home','Priya Sharma','+91 98765 43210','42, MG Road','Near Lalbagh Gate','Bangalore','Karnataka','560004',1,'2026-11-04 08:00:48'),
(2,1,'Office','Priya Sharma','+91 98765 43210','5th Floor, Prestige Tower','Residency Road','Bangalore','Karnataka','560025',0,'2026-11-04 08:00:48');

-- categories (17 rows)
INSERT INTO `categories` (`id`, `parent_id`, `name`, `slug`, `image`, `description`, `sort_order`, `created_at`, `updated_at`) VALUES
(1,NULL,'Sarees','sarees','/images/categories/sarees.jpg','Handcrafted sarees from across India — silk, cotton, and designer collections.',0,'2026-11-04 08:00:48','2026-11-04 08:00:48'),
(2,NULL,'Fabrics','fabrics','/images/products/fabric-silk-brocade.jpg','Premium fabrics by the metre — pure silk, cotton, linen, and blends.',0,'2026-11-04 08:00:48','2026-11-04 08:00:48'),
(3,NULL,'Dress Materials','dress-materials','/images/products/kurta-purple-brocade.jpg','Unstitched and semi-stitched dress materials for every occasion.',0,'2026-11-04 08:00:48','2026-11-04 08:00:48'),
(4,NULL,'Accessories','accessories','/images/products/kurta-teal-paithani.jpg','Blouse pieces, dupattas, and finishing touches for your outfit.',0,'2026-11-04 08:00:48','2026-11-04 08:00:48'),
(5,1,'Kanchipuram Silk','kanchipuram-silk','/images/products/saree-red-gold.jpg',NULL,0,'2026-11-04 08:00:48','2026-11-04 08:00:48'),
(6,1,'Banarasi Silk','banarasi-silk','/images/products/saree-collection.jpg',NULL,0,'2026-11-04 08:00:48','2026-11-04 08:00:48'),
(7,1,'Mysore Silk','mysore-silk','/images/products/saree-peach-kanchi.jpg',NULL,0,'2026-11-04 08:00:48','2026-11-04 08:00:48'),
(8,1,'Tussar Silk','tussar-silk','/images/products/saree-handloom.jpg',NULL,0,'2026-11-04 08:00:48','2026-11-04 08:00:48'),
(9,1,'Cotton Sarees','cotton-sarees','/images/products/saree-green.png',NULL,0,'2026-11-04 08:00:48','2026-11-04 08:00:48'),
(10,1,'Georgette','georgette','/images/products/saree-pink-draped.jpg',NULL,0,'2026-11-04 08:00:48','2026-11-04 08:00:48'),
(11,2,'Pure Silk','pure-silk','/images/products/fabric-velvet-drape.jpg',NULL,0,'2026-11-04 08:00:48','2026-11-04 08:00:48'),
(12,2,'Cotton','cotton','/images/products/fabric-block-print.jpg',NULL,0,'2026-11-04 08:00:48','2026-11-04 08:00:48'),
(13,2,'Linen','linen','/images/products/fabric-linen-wheel.jpg',NULL,0,'2026-11-04 08:00:48','2026-11-04 08:00:48'),
(14,3,'Salwar Suits','salwar-suits','/images/products/kurta-maroon-dupatta.jpg',NULL,0,'2026-11-04 08:00:48','2026-11-04 08:00:48'),
(15,3,'Unstitched','unstitched','/images/products/kurta-green-kalamkari.jpg',NULL,0,'2026-11-04 08:00:48','2026-11-04 08:00:48'),
(16,4,'Blouse Pieces','blouse-pieces','/images/products/kurta-green-elephant.jpg',NULL,0,'2026-11-04 08:00:48','2026-11-04 08:00:48'),
(17,4,'Dupattas','dupattas','/images/products/kurta-magenta-plain.jpg',NULL,0,'2026-11-04 08:00:48','2026-11-04 08:00:48');

-- products (9 rows)
INSERT INTO `products` (`id`, `slug`, `name`, `category_id`, `subcategory_id`, `description`, `short_description`, `selling_unit`, `base_price`, `tags`, `fabric`, `weave`, `weight`, `care_instructions`, `occasions`, `rating`, `review_count`, `is_featured`, `is_new_arrival`, `is_bestseller`, `is_archived`, `created_at`, `updated_at`) VALUES
(1,'kanchipuram-pure-silk-temple-border','Kanchipuram Pure Silk Saree — Temple Border',1,5,'A masterpiece of South Indian weaving, this Kanchipuram silk saree features an intricate temple border with real gold zari work.','Pure silk with gold zari temple border','piece',12500.00,'[\"wedding\", \"festive\", \"handloom\", \"zari\", \"bridal\"]','Pure Mulberry Silk','Handloom','750g','Dry clean only. Store in muslin cloth.','[\"Wedding\", \"Festival\", \"Pooja\"]',4.70,23,1,0,1,0,'2026-11-04 08:00:48','2026-11-04 08:00:48'),
(2,'kanchipuram-silk-peacock-motif','Kanchipuram Silk Saree — Peacock Motif',1,5,'Stunning Kanchipuram silk saree with traditional peacock motifs woven throughout the body.','Peacock motif with contrast pallu','piece',9500.00,'[\"festive\", \"handloom\", \"zari\"]','Pure Silk','Handloom','650g','Dry clean only.','[\"Festival\", \"Wedding\"]',4.50,15,0,1,0,0,'2026-11-04 08:00:49','2026-11-04 08:00:49'),
(3,'banarasi-silk-mughal-jaal','Banarasi Silk Saree — Mughal Jaal',1,6,'Exquisite Banarasi silk with intricate Mughal jaal weaving pattern.','Mughal jaal pattern with rich pallu','piece',15000.00,'[\"wedding\", \"festive\", \"zari\", \"bridal\"]','Pure Silk','Handloom','800g','Dry clean only. Store flat.','[\"Wedding\", \"Reception\"]',4.80,31,1,0,1,0,'2026-11-04 08:00:49','2026-11-04 08:00:49'),
(4,'mysore-crepe-silk-plain-elegance','Mysore Crepe Silk Saree — Plain Elegance',1,7,'Light and elegant Mysore crepe silk saree with subtle kasab border.','Elegant crepe silk with kasab border','piece',5500.00,'[\"office\", \"casual\", \"lightweight\"]','Crepe Silk','Power Loom','450g','Dry clean recommended.','[\"Office\", \"Casual\", \"Pooja\"]',4.30,18,0,1,0,0,'2026-11-04 08:00:49','2026-11-04 08:00:49'),
(5,'pure-mulberry-silk-fabric','Pure Mulberry Silk Fabric',2,11,'Premium mulberry silk fabric, ideal for blouses and designer wear.','Premium silk fabric by the metre','metre',1800.00,'[\"fabric\", \"silk\", \"premium\"]','Mulberry Silk','Plain','90g/m','Dry clean only.','[]',4.60,12,1,0,0,0,'2026-11-04 08:00:49','2026-11-04 08:00:49'),
(6,'handloom-cotton-fabric-ikat-weave','Handloom Cotton Fabric — Ikat Weave',2,12,'Traditional ikat weave cotton fabric from Pochampally weavers.','Ikat weave handloom cotton','metre',450.00,'[\"handloom\", \"cotton\", \"ikat\"]','Cotton','Handloom','120g/m','Machine wash cold, line dry.','[]',4.40,9,0,1,0,0,'2026-11-04 08:00:49','2026-11-04 08:00:49'),
(7,'cotton-printed-salwar-jaipuri','Cotton Printed Salwar Set — Jaipuri Block Print',3,14,'Charming Jaipuri block print salwar kameez set with matching dupatta.','Jaipuri block print salwar set','piece',1200.00,'[\"casual\", \"cotton\", \"block-print\"]','Cotton','Hand Block Printed','500g','Machine wash cold.','[\"Casual\", \"Daily\"]',4.20,22,0,0,1,0,'2026-11-04 08:00:49','2026-11-04 08:00:49'),
(8,'designer-blouse-piece-aari-work','Designer Blouse Piece — Aari Work',4,16,'Handcrafted designer blouse piece with intricate Aari embroidery.','Aari embroidered designer blouse piece','piece',1200.00,'[\"blouse\", \"aari\", \"embroidery\"]','Raw Silk','Handloom','150g','Dry clean only.','[\"Wedding\", \"Festival\"]',4.50,14,0,1,0,0,'2026-11-04 08:00:49','2026-11-04 08:00:49'),
(9,'banarasi-silk-dupatta-zari-weave','Banarasi Silk Dupatta — Zari Weave',4,17,'Luxurious Banarasi silk dupatta with rich zari weaving.','Zari weave Banarasi silk dupatta','piece',2200.00,'[\"dupatta\", \"banarasi\", \"zari\"]','Banarasi Silk','Handloom','200g','Dry clean only.','[\"Wedding\", \"Festival\"]',4.70,8,1,0,0,0,'2026-11-04 08:00:49','2026-11-04 08:00:49');

-- product_variants (15 rows)
INSERT INTO `product_variants` (`id`, `product_id`, `sku`, `color_name`, `color_hex`, `size`, `design`, `price`, `mrp`, `stock`, `created_at`, `updated_at`) VALUES
(1,1,'KPS-TB-MRN-001','Maroon','#800020','Free Size (6.3m with blouse piece)','Gold Zari Border',12500.00,15000.00,5,'2026-11-04 08:00:48','2026-11-04 08:00:48'),
(2,1,'KPS-TB-BLU-001','Royal Blue','#002366','Free Size (6.3m with blouse piece)','Gold Zari Border',12500.00,15000.00,3,'2026-11-04 08:00:49','2026-11-04 08:00:49'),
(3,1,'KPS-TB-GRN-001','Emerald Green','#046307','Free Size (6.3m with blouse piece)','Silver Zari Border',13500.00,16000.00,0,'2026-11-04 08:00:49','2026-11-04 08:00:49'),
(4,2,'KPS-PM-PNK-001','Dusty Pink','#D4A5A5','Free Size (6.3m with blouse piece)','Peacock Motif',9500.00,11500.00,8,'2026-11-04 08:00:49','2026-11-04 08:00:49'),
(5,2,'KPS-PM-VLT-001','Violet','#7F00FF','Free Size (6.3m with blouse piece)','Peacock Motif',9500.00,11500.00,4,'2026-11-04 08:00:49','2026-11-04 08:00:49'),
(6,3,'BNS-MJ-WIN-001','Wine','#722F37','Free Size (6.3m with blouse piece)','Gold Jaal',15000.00,18000.00,6,'2026-11-04 08:00:49','2026-11-04 08:00:49'),
(7,4,'MCS-PE-RSE-001','Dusty Rose','#DCAE96','Free Size (6.3m with blouse piece)','Gold Kasab Border',5500.00,6500.00,12,'2026-11-04 08:00:49','2026-11-04 08:00:49'),
(8,4,'MCS-PE-TEL-001','Teal','#008080','Free Size (6.3m with blouse piece)','Gold Kasab Border',5500.00,6500.00,7,'2026-11-04 08:00:49','2026-11-04 08:00:49'),
(9,5,'MSF-PLN-IVR-001','Ivory','#FFFFF0','1 metre','Plain',1800.00,2200.00,25,'2026-11-04 08:00:49','2026-11-04 08:00:49'),
(10,5,'MSF-PLN-BLH-001','Blush Pink','#FFB6C1','1 metre','Plain',1800.00,2200.00,20,'2026-11-04 08:00:49','2026-11-04 08:00:49'),
(11,6,'HCF-IK-IND-001','Indigo','#4B0082','1 metre','Ikat',450.00,550.00,40,'2026-11-04 08:00:49','2026-11-04 08:00:49'),
(12,7,'CPS-JP-BLW-001','Blue & White','#4169E1','Free Size (unstitched)','Floral Block Print',1200.00,1500.00,30,'2026-11-04 08:00:49','2026-11-04 08:00:49'),
(13,8,'DBP-AA-RDG-001','Red & Gold','#B22222','Free Size (0.8m)','Floral Aari',1200.00,1500.00,15,'2026-11-04 08:00:49','2026-11-04 08:00:49'),
(14,8,'DBP-AA-MRG-001','Maroon & Gold','#800020','Free Size (0.8m)','Floral Aari',1400.00,1700.00,10,'2026-11-04 08:00:49','2026-11-04 08:00:49'),
(15,9,'BSD-ZW-RDG-001','Red','#FF0000','2.5m','Gold Zari Weave',2200.00,2800.00,18,'2026-11-04 08:00:49','2026-11-04 08:00:49');

-- product_images (18 rows)
INSERT INTO `product_images` (`id`, `product_id`, `variant_id`, `url`, `alt_text`, `sort_order`, `created_at`) VALUES
(1,1,1,'/images/products/saree-red-gold.jpg',NULL,0,'2026-11-04 08:00:49'),
(2,1,1,'/images/products/saree-peach-kanchi.jpg',NULL,1,'2026-11-04 08:00:49'),
(3,1,2,'/images/products/saree-red-gold.jpg',NULL,0,'2026-11-04 08:00:49'),
(4,1,2,'/images/products/saree-peach-kanchi.jpg',NULL,1,'2026-11-04 08:00:49'),
(5,1,3,'/images/products/saree-red-gold.jpg',NULL,0,'2026-11-04 08:00:49'),
(6,2,4,'/images/products/saree-pink-draped.jpg',NULL,0,'2026-11-04 08:00:49'),
(7,2,5,'/images/products/saree-collection.jpg',NULL,0,'2026-11-04 08:00:49'),
(8,3,6,'/images/products/saree-collection.jpg',NULL,0,'2026-11-04 08:00:49'),
(9,3,6,'/images/products/saree-pink-draped.jpg',NULL,1,'2026-11-04 08:00:49'),
(10,4,7,'/images/products/saree-peach-kanchi.jpg',NULL,0,'2026-11-04 08:00:49'),
(11,4,8,'/images/products/saree-green.png',NULL,0,'2026-11-04 08:00:49'),
(12,5,9,'/images/products/fabric-silk-brocade.jpg',NULL,0,'2026-11-04 08:00:49'),
(13,5,10,'/images/products/fabric-velvet-drape.jpg',NULL,0,'2026-11-04 08:00:49'),
(14,6,11,'/images/products/fabric-block-print.jpg',NULL,0,'2026-11-04 08:00:49'),
(15,7,12,'/images/products/kurta-green-kalamkari.jpg',NULL,0,'2026-11-04 08:00:49'),
(16,8,13,'/images/products/kurta-green-elephant.jpg',NULL,0,'2026-11-04 08:00:49'),
(17,8,14,'/images/products/kurta-purple-brocade.jpg',NULL,0,'2026-11-04 08:00:49'),
(18,9,15,'/images/products/kurta-magenta-plain.jpg',NULL,0,'2026-11-04 08:00:49');

SET FOREIGN_KEY_CHECKS = 1;
