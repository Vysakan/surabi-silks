+-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: surabi_silks
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `surabi_silks`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `surabi_silks` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `surabi_silks`;

--
-- Table structure for table `_migrations`
--

DROP TABLE IF EXISTS `_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `_migrations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `executed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_migration_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_migrations`
--

LOCK TABLES `_migrations` WRITE;
/*!40000 ALTER TABLE `_migrations` DISABLE KEYS */;
INSERT INTO `_migrations` VALUES (1,'001_create_users.sql','2026-11-04 08:00:26'),(2,'002_create_sessions.sql','2026-11-04 08:00:27'),(3,'003_create_user_addresses.sql','2026-11-04 08:00:27'),(4,'004_create_categories.sql','2026-11-04 08:00:27'),(5,'005_create_products.sql','2026-11-04 08:00:28'),(6,'006_create_product_variants.sql','2026-11-04 08:00:28'),(7,'007_create_product_images.sql','2026-11-04 08:00:28'),(8,'008_create_inventory.sql','2026-11-04 08:00:28'),(9,'009_create_reviews.sql','2026-11-04 08:00:28'),(10,'010_create_contact_enquiries.sql','2026-11-04 08:00:28'),(11,'011_create_wishlists.sql','2026-11-04 09:38:41'),(12,'012_create_carts.sql','2026-11-04 09:38:41');
/*!40000 ALTER TABLE `_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cart_items`
--

DROP TABLE IF EXISTS `cart_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cart_items` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `cart_id` int unsigned NOT NULL,
  `product_id` int unsigned NOT NULL,
  `variant_id` int unsigned NOT NULL,
  `quantity` int unsigned NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_cart_items_variant` (`cart_id`,`variant_id`),
  KEY `idx_cart_items_cart` (`cart_id`),
  KEY `fk_cart_items_product` (`product_id`),
  KEY `fk_cart_items_variant` (`variant_id`),
  CONSTRAINT `fk_cart_items_cart` FOREIGN KEY (`cart_id`) REFERENCES `carts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cart_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cart_items_variant` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_cart_items_qty` CHECK ((`quantity` > 0))
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cart_items`
--

LOCK TABLES `cart_items` WRITE;
/*!40000 ALTER TABLE `cart_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `cart_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `carts`
--

DROP TABLE IF EXISTS `carts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `carts` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_carts_user` (`user_id`),
  CONSTRAINT `fk_carts_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `carts`
--

LOCK TABLES `carts` WRITE;
/*!40000 ALTER TABLE `carts` DISABLE KEYS */;
INSERT INTO `carts` VALUES (1,6,'2026-11-04 09:42:03','2026-11-04 09:42:03');
/*!40000 ALTER TABLE `carts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `parent_id` int unsigned DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `image` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `sort_order` int NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_categories_slug` (`slug`),
  KEY `idx_categories_parent` (`parent_id`),
  CONSTRAINT `fk_categories_parent` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (1,NULL,'Sarees','sarees','/images/categories/sarees.jpg','Handcrafted sarees from across India — silk, cotton, and designer collections.',0,'2026-11-04 08:00:48','2026-11-04 08:00:48'),(2,NULL,'Fabrics','fabrics','/images/products/fabric-silk-brocade.jpg','Premium fabrics by the metre — pure silk, cotton, linen, and blends.',0,'2026-11-04 08:00:48','2026-11-04 08:00:48'),(3,NULL,'Dress Materials','dress-materials','/images/products/kurta-purple-brocade.jpg','Unstitched and semi-stitched dress materials for every occasion.',0,'2026-11-04 08:00:48','2026-11-04 08:00:48'),(4,NULL,'Accessories','accessories','/images/products/kurta-teal-paithani.jpg','Blouse pieces, dupattas, and finishing touches for your outfit.',0,'2026-11-04 08:00:48','2026-11-04 08:00:48'),(5,1,'Kanchipuram Silk','kanchipuram-silk','/images/products/saree-red-gold.jpg',NULL,0,'2026-11-04 08:00:48','2026-11-04 08:00:48'),(6,1,'Banarasi Silk','banarasi-silk','/images/products/saree-collection.jpg',NULL,0,'2026-11-04 08:00:48','2026-11-04 08:00:48'),(7,1,'Mysore Silk','mysore-silk','/images/products/saree-peach-kanchi.jpg',NULL,0,'2026-11-04 08:00:48','2026-11-04 08:00:48'),(8,1,'Tussar Silk','tussar-silk','/images/products/saree-handloom.jpg',NULL,0,'2026-11-04 08:00:48','2026-11-04 08:00:48'),(9,1,'Cotton Sarees','cotton-sarees','/images/products/saree-green.png',NULL,0,'2026-11-04 08:00:48','2026-11-04 08:00:48'),(10,1,'Georgette','georgette','/images/products/saree-pink-draped.jpg',NULL,0,'2026-11-04 08:00:48','2026-11-04 08:00:48'),(11,2,'Pure Silk','pure-silk','/images/products/fabric-velvet-drape.jpg',NULL,0,'2026-11-04 08:00:48','2026-11-04 08:00:48'),(12,2,'Cotton','cotton','/images/products/fabric-block-print.jpg',NULL,0,'2026-11-04 08:00:48','2026-11-04 08:00:48'),(13,2,'Linen','linen','/images/products/fabric-linen-wheel.jpg',NULL,0,'2026-11-04 08:00:48','2026-11-04 08:00:48'),(14,3,'Salwar Suits','salwar-suits','/images/products/kurta-maroon-dupatta.jpg',NULL,0,'2026-11-04 08:00:48','2026-11-04 08:00:48'),(15,3,'Unstitched','unstitched','/images/products/kurta-green-kalamkari.jpg',NULL,0,'2026-11-04 08:00:48','2026-11-04 08:00:48'),(16,4,'Blouse Pieces','blouse-pieces','/images/products/kurta-green-elephant.jpg',NULL,0,'2026-11-04 08:00:48','2026-11-04 08:00:48'),(17,4,'Dupattas','dupattas','/images/products/kurta-magenta-plain.jpg',NULL,0,'2026-11-04 08:00:48','2026-11-04 08:00:48');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contact_enquiries`
--

DROP TABLE IF EXISTS `contact_enquiries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contact_enquiries` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subject` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contact_enquiries`
--

LOCK TABLES `contact_enquiries` WRITE;
/*!40000 ALTER TABLE `contact_enquiries` DISABLE KEYS */;
/*!40000 ALTER TABLE `contact_enquiries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory_log`
--

DROP TABLE IF EXISTS `inventory_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory_log` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `variant_id` int unsigned NOT NULL,
  `quantity_change` int NOT NULL,
  `reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reference_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_inventory_variant` (`variant_id`),
  KEY `idx_inventory_created` (`created_at`),
  CONSTRAINT `fk_inventory_variant` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory_log`
--

LOCK TABLES `inventory_log` WRITE;
/*!40000 ALTER TABLE `inventory_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `inventory_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_images`
--

DROP TABLE IF EXISTS `product_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_images` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `product_id` int unsigned NOT NULL,
  `variant_id` int unsigned DEFAULT NULL,
  `url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `alt_text` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sort_order` int NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_images_product` (`product_id`),
  KEY `idx_images_variant` (`variant_id`),
  CONSTRAINT `fk_images_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_images_variant` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_images`
--

LOCK TABLES `product_images` WRITE;
/*!40000 ALTER TABLE `product_images` DISABLE KEYS */;
INSERT INTO `product_images` VALUES (1,1,1,'/images/products/saree-red-gold.jpg',NULL,0,'2026-11-04 08:00:49'),(2,1,1,'/images/products/saree-peach-kanchi.jpg',NULL,1,'2026-11-04 08:00:49'),(3,1,2,'/images/products/saree-red-gold.jpg',NULL,0,'2026-11-04 08:00:49'),(4,1,2,'/images/products/saree-peach-kanchi.jpg',NULL,1,'2026-11-04 08:00:49'),(5,1,3,'/images/products/saree-red-gold.jpg',NULL,0,'2026-11-04 08:00:49'),(6,2,4,'/images/products/saree-pink-draped.jpg',NULL,0,'2026-11-04 08:00:49'),(7,2,5,'/images/products/saree-collection.jpg',NULL,0,'2026-11-04 08:00:49'),(8,3,6,'/images/products/saree-collection.jpg',NULL,0,'2026-11-04 08:00:49'),(9,3,6,'/images/products/saree-pink-draped.jpg',NULL,1,'2026-11-04 08:00:49'),(10,4,7,'/images/products/saree-peach-kanchi.jpg',NULL,0,'2026-11-04 08:00:49'),(11,4,8,'/images/products/saree-green.png',NULL,0,'2026-11-04 08:00:49'),(12,5,9,'/images/products/fabric-silk-brocade.jpg',NULL,0,'2026-11-04 08:00:49'),(13,5,10,'/images/products/fabric-velvet-drape.jpg',NULL,0,'2026-11-04 08:00:49'),(14,6,11,'/images/products/fabric-block-print.jpg',NULL,0,'2026-11-04 08:00:49'),(15,7,12,'/images/products/kurta-green-kalamkari.jpg',NULL,0,'2026-11-04 08:00:49'),(16,8,13,'/images/products/kurta-green-elephant.jpg',NULL,0,'2026-11-04 08:00:49'),(17,8,14,'/images/products/kurta-purple-brocade.jpg',NULL,0,'2026-11-04 08:00:49'),(18,9,15,'/images/products/kurta-magenta-plain.jpg',NULL,0,'2026-11-04 08:00:49');
/*!40000 ALTER TABLE `product_images` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_variants`
--

DROP TABLE IF EXISTS `product_variants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_variants` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `product_id` int unsigned NOT NULL,
  `sku` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `color_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `color_hex` varchar(7) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `size` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `design` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `mrp` decimal(10,2) DEFAULT NULL,
  `stock` int unsigned NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_variants_sku` (`sku`),
  KEY `idx_variants_product` (`product_id`),
  KEY `idx_variants_stock` (`stock`),
  CONSTRAINT `fk_variants_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_variants`
--

LOCK TABLES `product_variants` WRITE;
/*!40000 ALTER TABLE `product_variants` DISABLE KEYS */;
INSERT INTO `product_variants` VALUES (1,1,'KPS-TB-MRN-001','Maroon','#800020','Free Size (6.3m with blouse piece)','Gold Zari Border',12500.00,15000.00,5,'2026-11-04 08:00:48','2026-11-04 08:00:48'),(2,1,'KPS-TB-BLU-001','Royal Blue','#002366','Free Size (6.3m with blouse piece)','Gold Zari Border',12500.00,15000.00,3,'2026-11-04 08:00:49','2026-11-04 08:00:49'),(3,1,'KPS-TB-GRN-001','Emerald Green','#046307','Free Size (6.3m with blouse piece)','Silver Zari Border',13500.00,16000.00,0,'2026-11-04 08:00:49','2026-11-04 08:00:49'),(4,2,'KPS-PM-PNK-001','Dusty Pink','#D4A5A5','Free Size (6.3m with blouse piece)','Peacock Motif',9500.00,11500.00,8,'2026-11-04 08:00:49','2026-11-04 08:00:49'),(5,2,'KPS-PM-VLT-001','Violet','#7F00FF','Free Size (6.3m with blouse piece)','Peacock Motif',9500.00,11500.00,4,'2026-11-04 08:00:49','2026-11-04 08:00:49'),(6,3,'BNS-MJ-WIN-001','Wine','#722F37','Free Size (6.3m with blouse piece)','Gold Jaal',15000.00,18000.00,6,'2026-11-04 08:00:49','2026-11-04 08:00:49'),(7,4,'MCS-PE-RSE-001','Dusty Rose','#DCAE96','Free Size (6.3m with blouse piece)','Gold Kasab Border',5500.00,6500.00,12,'2026-11-04 08:00:49','2026-11-04 08:00:49'),(8,4,'MCS-PE-TEL-001','Teal','#008080','Free Size (6.3m with blouse piece)','Gold Kasab Border',5500.00,6500.00,7,'2026-11-04 08:00:49','2026-11-04 08:00:49'),(9,5,'MSF-PLN-IVR-001','Ivory','#FFFFF0','1 metre','Plain',1800.00,2200.00,25,'2026-11-04 08:00:49','2026-11-04 08:00:49'),(10,5,'MSF-PLN-BLH-001','Blush Pink','#FFB6C1','1 metre','Plain',1800.00,2200.00,20,'2026-11-04 08:00:49','2026-11-04 08:00:49'),(11,6,'HCF-IK-IND-001','Indigo','#4B0082','1 metre','Ikat',450.00,550.00,40,'2026-11-04 08:00:49','2026-11-04 08:00:49'),(12,7,'CPS-JP-BLW-001','Blue & White','#4169E1','Free Size (unstitched)','Floral Block Print',1200.00,1500.00,30,'2026-11-04 08:00:49','2026-11-04 08:00:49'),(13,8,'DBP-AA-RDG-001','Red & Gold','#B22222','Free Size (0.8m)','Floral Aari',1200.00,1500.00,15,'2026-11-04 08:00:49','2026-11-04 08:00:49'),(14,8,'DBP-AA-MRG-001','Maroon & Gold','#800020','Free Size (0.8m)','Floral Aari',1400.00,1700.00,10,'2026-11-04 08:00:49','2026-11-04 08:00:49'),(15,9,'BSD-ZW-RDG-001','Red','#FF0000','2.5m','Gold Zari Weave',2200.00,2800.00,18,'2026-11-04 08:00:49','2026-11-04 08:00:49');
/*!40000 ALTER TABLE `product_variants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `slug` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category_id` int unsigned DEFAULT NULL,
  `subcategory_id` int unsigned DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `short_description` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `selling_unit` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'piece',
  `base_price` decimal(10,2) NOT NULL,
  `tags` json DEFAULT NULL,
  `fabric` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `weave` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `weight` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `care_instructions` text COLLATE utf8mb4_unicode_ci,
  `occasions` json DEFAULT NULL,
  `rating` decimal(3,2) NOT NULL DEFAULT '0.00',
  `review_count` int unsigned NOT NULL DEFAULT '0',
  `is_featured` tinyint(1) NOT NULL DEFAULT '0',
  `is_new_arrival` tinyint(1) NOT NULL DEFAULT '0',
  `is_bestseller` tinyint(1) NOT NULL DEFAULT '0',
  `is_archived` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_products_slug` (`slug`),
  KEY `idx_products_category` (`category_id`),
  KEY `idx_products_subcategory` (`subcategory_id`),
  KEY `idx_products_featured` (`is_featured`),
  KEY `idx_products_new_arrival` (`is_new_arrival`),
  KEY `idx_products_bestseller` (`is_bestseller`),
  KEY `idx_products_archived` (`is_archived`),
  KEY `idx_products_base_price` (`base_price`),
  FULLTEXT KEY `ft_products_search` (`name`,`short_description`),
  CONSTRAINT `fk_products_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_products_subcategory` FOREIGN KEY (`subcategory_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (1,'kanchipuram-pure-silk-temple-border','Kanchipuram Pure Silk Saree — Temple Border',1,5,'A masterpiece of South Indian weaving, this Kanchipuram silk saree features an intricate temple border with real gold zari work.','Pure silk with gold zari temple border','piece',12500.00,'[\"wedding\", \"festive\", \"handloom\", \"zari\", \"bridal\"]','Pure Mulberry Silk','Handloom','750g','Dry clean only. Store in muslin cloth.','[\"Wedding\", \"Festival\", \"Pooja\"]',4.70,23,1,0,1,0,'2026-11-04 08:00:48','2026-11-04 08:00:48'),(2,'kanchipuram-silk-peacock-motif','Kanchipuram Silk Saree — Peacock Motif',1,5,'Stunning Kanchipuram silk saree with traditional peacock motifs woven throughout the body.','Peacock motif with contrast pallu','piece',9500.00,'[\"festive\", \"handloom\", \"zari\"]','Pure Silk','Handloom','650g','Dry clean only.','[\"Festival\", \"Wedding\"]',4.50,15,0,1,0,0,'2026-11-04 08:00:49','2026-11-04 08:00:49'),(3,'banarasi-silk-mughal-jaal','Banarasi Silk Saree — Mughal Jaal',1,6,'Exquisite Banarasi silk with intricate Mughal jaal weaving pattern.','Mughal jaal pattern with rich pallu','piece',15000.00,'[\"wedding\", \"festive\", \"zari\", \"bridal\"]','Pure Silk','Handloom','800g','Dry clean only. Store flat.','[\"Wedding\", \"Reception\"]',4.80,31,1,0,1,0,'2026-11-04 08:00:49','2026-11-04 08:00:49'),(4,'mysore-crepe-silk-plain-elegance','Mysore Crepe Silk Saree — Plain Elegance',1,7,'Light and elegant Mysore crepe silk saree with subtle kasab border.','Elegant crepe silk with kasab border','piece',5500.00,'[\"office\", \"casual\", \"lightweight\"]','Crepe Silk','Power Loom','450g','Dry clean recommended.','[\"Office\", \"Casual\", \"Pooja\"]',4.30,18,0,1,0,0,'2026-11-04 08:00:49','2026-11-04 08:00:49'),(5,'pure-mulberry-silk-fabric','Pure Mulberry Silk Fabric',2,11,'Premium mulberry silk fabric, ideal for blouses and designer wear.','Premium silk fabric by the metre','metre',1800.00,'[\"fabric\", \"silk\", \"premium\"]','Mulberry Silk','Plain','90g/m','Dry clean only.','[]',4.60,12,1,0,0,0,'2026-11-04 08:00:49','2026-11-04 08:00:49'),(6,'handloom-cotton-fabric-ikat-weave','Handloom Cotton Fabric — Ikat Weave',2,12,'Traditional ikat weave cotton fabric from Pochampally weavers.','Ikat weave handloom cotton','metre',450.00,'[\"handloom\", \"cotton\", \"ikat\"]','Cotton','Handloom','120g/m','Machine wash cold, line dry.','[]',4.40,9,0,1,0,0,'2026-11-04 08:00:49','2026-11-04 08:00:49'),(7,'cotton-printed-salwar-jaipuri','Cotton Printed Salwar Set — Jaipuri Block Print',3,14,'Charming Jaipuri block print salwar kameez set with matching dupatta.','Jaipuri block print salwar set','piece',1200.00,'[\"casual\", \"cotton\", \"block-print\"]','Cotton','Hand Block Printed','500g','Machine wash cold.','[\"Casual\", \"Daily\"]',4.20,22,0,0,1,0,'2026-11-04 08:00:49','2026-11-04 08:00:49'),(8,'designer-blouse-piece-aari-work','Designer Blouse Piece — Aari Work',4,16,'Handcrafted designer blouse piece with intricate Aari embroidery.','Aari embroidered designer blouse piece','piece',1200.00,'[\"blouse\", \"aari\", \"embroidery\"]','Raw Silk','Handloom','150g','Dry clean only.','[\"Wedding\", \"Festival\"]',4.50,14,0,1,0,0,'2026-11-04 08:00:49','2026-11-04 08:00:49'),(9,'banarasi-silk-dupatta-zari-weave','Banarasi Silk Dupatta — Zari Weave',4,17,'Luxurious Banarasi silk dupatta with rich zari weaving.','Zari weave Banarasi silk dupatta','piece',2200.00,'[\"dupatta\", \"banarasi\", \"zari\"]','Banarasi Silk','Handloom','200g','Dry clean only.','[\"Wedding\", \"Festival\"]',4.70,8,1,0,0,0,'2026-11-04 08:00:49','2026-11-04 08:00:49');
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reviews`
--

DROP TABLE IF EXISTS `reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reviews` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `product_id` int unsigned NOT NULL,
  `user_id` int unsigned NOT NULL,
  `rating` tinyint unsigned NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `comment` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_reviews_product` (`product_id`),
  KEY `idx_reviews_user` (`user_id`),
  CONSTRAINT `fk_reviews_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_reviews_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_reviews_rating` CHECK ((`rating` between 1 and 5))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reviews`
--

LOCK TABLES `reviews` WRITE;
/*!40000 ALTER TABLE `reviews` DISABLE KEYS */;
/*!40000 ALTER TABLE `reviews` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `id` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` int unsigned NOT NULL,
  `expires_at` timestamp NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sessions_user` (`user_id`),
  KEY `idx_sessions_expires` (`expires_at`),
  CONSTRAINT `fk_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
INSERT INTO `sessions` VALUES ('614gKj9mcWUkrj5LlO_r7WWPosOzDeOihQpyPMPSeZ9TOSUl-KgGw6G06oz1S7Xu',6,'2026-11-05 09:41:43','2026-11-04 09:41:42'),('GZPvqF1K5yxmcDKAYz23njaaBF-qTZBx9FKCaWy69a7-aykodrLYn2luYXkDMVgE',6,'2026-11-05 09:41:43','2026-11-04 09:41:42');
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_addresses`
--

DROP TABLE IF EXISTS `user_addresses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_addresses` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `label` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `full_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `line1` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `line2` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `state` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `pincode` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_addresses_user` (`user_id`),
  CONSTRAINT `fk_addresses_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_addresses`
--

LOCK TABLES `user_addresses` WRITE;
/*!40000 ALTER TABLE `user_addresses` DISABLE KEYS */;
INSERT INTO `user_addresses` VALUES (1,1,'Home','Priya Sharma','+91 98765 43210','42, MG Road','Near Lalbagh Gate','Bangalore','Karnataka','560004',1,'2026-11-04 08:00:48'),(2,1,'Office','Priya Sharma','+91 98765 43210','5th Floor, Prestige Tower','Residency Road','Bangalore','Karnataka','560025',0,'2026-11-04 08:00:48'),(3,6,'Home','Test User','9876543210','123 Main St','Apt 4','Chennai','Tamil Nadu','600001',1,'2026-11-04 09:42:09');
/*!40000 ALTER TABLE `user_addresses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('customer','admin') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'customer',
  `avatar` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_users_email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Priya Sharma','priya@example.com','+91 98765 43210','$argon2id$v=19$m=65536,t=3,p=4$j6T+CGY1k0kluhGLg4TcOw$hdad3HFwdsGXERCJrQrQ3ZgXHoS2cOd4vzlSEOCCmPI','customer',NULL,'2026-05-31 18:30:00','2026-11-04 08:00:48'),(2,'Anitha Rajendran','anitha@example.com','+91 94432 56789','$argon2id$v=19$m=65536,t=3,p=4$j6T+CGY1k0kluhGLg4TcOw$hdad3HFwdsGXERCJrQrQ3ZgXHoS2cOd4vzlSEOCCmPI','customer',NULL,'2026-07-14 18:30:00','2026-11-04 08:00:48'),(3,'Meera Nair','meera@example.com','+91 90876 54321','$argon2id$v=19$m=65536,t=3,p=4$j6T+CGY1k0kluhGLg4TcOw$hdad3HFwdsGXERCJrQrQ3ZgXHoS2cOd4vzlSEOCCmPI','customer',NULL,'2026-08-19 18:30:00','2026-11-04 08:00:48'),(4,'Deepa Iyer','deepa@example.com','+91 87654 32109','$argon2id$v=19$m=65536,t=3,p=4$j6T+CGY1k0kluhGLg4TcOw$hdad3HFwdsGXERCJrQrQ3ZgXHoS2cOd4vzlSEOCCmPI','customer',NULL,'2026-09-04 18:30:00','2026-11-04 08:00:48'),(5,'Admin User','admin@surabsilks.com','+91 99999 00000','$argon2id$v=19$m=65536,t=3,p=4$bRroauJxkLhGwn4iUjq4gw$FxhFGjEia8C8Dv+CEjXhzU3yzgut9NwEL8TW6h3OTIQ','admin',NULL,'2025-12-31 18:30:00','2026-11-04 08:00:48'),(6,'Test User','test@example.com',NULL,'$argon2id$v=19$m=65536,t=3,p=4$EtYNDEX9opYP6mT/CinVuQ$sqj+OOHyChAwOU0dTGimeOSOsaPUhZrsCbOStsasl2Y','customer',NULL,'2026-11-04 09:41:42','2026-11-04 09:41:42');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wishlists`
--

DROP TABLE IF EXISTS `wishlists`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wishlists` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `product_id` int unsigned NOT NULL,
  `variant_id` int unsigned DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_wishlist_user_product` (`user_id`,`product_id`,`variant_id`),
  KEY `idx_wishlist_user` (`user_id`),
  KEY `fk_wishlist_product` (`product_id`),
  KEY `fk_wishlist_variant` (`variant_id`),
  CONSTRAINT `fk_wishlist_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_wishlist_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_wishlist_variant` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wishlists`
--

LOCK TABLES `wishlists` WRITE;
/*!40000 ALTER TABLE `wishlists` DISABLE KEYS */;
/*!40000 ALTER TABLE `wishlists` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-07 11:00:09
