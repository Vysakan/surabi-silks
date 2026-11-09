import mysql from 'mysql2/promise';
import argon2 from 'argon2';
import 'dotenv/config';

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'surabi_silks',
  });

  console.log('Seeding users...');
  const password = await argon2.hash('password123');
  const adminPassword = await argon2.hash('admin123');

  await conn.execute(
    `INSERT INTO users (name, email, phone, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE name=VALUES(name)`,
    ['Priya Sharma', 'priya@example.com', '+91 98765 43210', password, 'customer', '2026-06-01'],
  );
  await conn.execute(
    `INSERT INTO users (name, email, phone, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE name=VALUES(name)`,
    ['Anitha Rajendran', 'anitha@example.com', '+91 94432 56789', password, 'customer', '2026-07-15'],
  );
  await conn.execute(
    `INSERT INTO users (name, email, phone, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE name=VALUES(name)`,
    ['Meera Nair', 'meera@example.com', '+91 90876 54321', password, 'customer', '2026-08-20'],
  );
  await conn.execute(
    `INSERT INTO users (name, email, phone, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE name=VALUES(name)`,
    ['Deepa Iyer', 'deepa@example.com', '+91 87654 32109', password, 'customer', '2026-09-05'],
  );
  await conn.execute(
    `INSERT INTO users (name, email, phone, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE name=VALUES(name)`,
    ['Admin User', 'admin@surabsilks.com', '+91 99999 00000', adminPassword, 'admin', '2026-01-01'],
  );

  const [users] = await conn.execute('SELECT id, email FROM users');
  const userMap = Object.fromEntries(users.map((u) => [u.email, u.id]));

  console.log('Seeding addresses...');
  const priyaId = userMap['priya@example.com'];
  await conn.execute(
    `INSERT INTO user_addresses (user_id, label, full_name, phone, line1, line2, city, state, pincode, is_default)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE label=VALUES(label)`,
    [priyaId, 'Home', 'Priya Sharma', '+91 98765 43210', '42, MG Road', 'Near Lalbagh Gate', 'Bangalore', 'Karnataka', '560004', 1],
  );
  await conn.execute(
    `INSERT INTO user_addresses (user_id, label, full_name, phone, line1, line2, city, state, pincode, is_default)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE label=VALUES(label)`,
    [priyaId, 'Office', 'Priya Sharma', '+91 98765 43210', '5th Floor, Prestige Tower', 'Residency Road', 'Bangalore', 'Karnataka', '560025', 0],
  );

  console.log('Seeding categories...');
  const categoryData = [
    { name: 'Sarees', slug: 'sarees', image: '/images/categories/sarees.jpg', description: 'Handcrafted sarees from across India — silk, cotton, and designer collections.' },
    { name: 'Fabrics', slug: 'fabrics', image: '/images/products/fabric-silk-brocade.jpg', description: 'Premium fabrics by the metre — pure silk, cotton, linen, and blends.' },
    { name: 'Dress Materials', slug: 'dress-materials', image: '/images/products/kurta-purple-brocade.jpg', description: 'Unstitched and semi-stitched dress materials for every occasion.' },
    { name: 'Accessories', slug: 'accessories', image: '/images/products/kurta-teal-paithani.jpg', description: 'Blouse pieces, dupattas, and finishing touches for your outfit.' },
  ];

  for (const cat of categoryData) {
    await conn.execute(
      `INSERT INTO categories (name, slug, image, description, parent_id) VALUES (?, ?, ?, ?, NULL)
       ON DUPLICATE KEY UPDATE name=VALUES(name)`,
      [cat.name, cat.slug, cat.image, cat.description],
    );
  }

  const [cats] = await conn.execute('SELECT id, slug FROM categories WHERE parent_id IS NULL');
  const catMap = Object.fromEntries(cats.map((c) => [c.slug, c.id]));

  const subcategoryData = [
    { parentSlug: 'sarees', name: 'Kanchipuram Silk', slug: 'kanchipuram-silk', image: '/images/products/saree-red-gold.jpg' },
    { parentSlug: 'sarees', name: 'Banarasi Silk', slug: 'banarasi-silk', image: '/images/products/saree-collection.jpg' },
    { parentSlug: 'sarees', name: 'Mysore Silk', slug: 'mysore-silk', image: '/images/products/saree-peach-kanchi.jpg' },
    { parentSlug: 'sarees', name: 'Tussar Silk', slug: 'tussar-silk', image: '/images/products/saree-handloom.jpg' },
    { parentSlug: 'sarees', name: 'Cotton Sarees', slug: 'cotton-sarees', image: '/images/products/saree-green.png' },
    { parentSlug: 'sarees', name: 'Georgette', slug: 'georgette', image: '/images/products/saree-pink-draped.jpg' },
    { parentSlug: 'fabrics', name: 'Pure Silk', slug: 'pure-silk', image: '/images/products/fabric-velvet-drape.jpg' },
    { parentSlug: 'fabrics', name: 'Cotton', slug: 'cotton', image: '/images/products/fabric-block-print.jpg' },
    { parentSlug: 'fabrics', name: 'Linen', slug: 'linen', image: '/images/products/fabric-linen-wheel.jpg' },
    { parentSlug: 'dress-materials', name: 'Salwar Suits', slug: 'salwar-suits', image: '/images/products/kurta-maroon-dupatta.jpg' },
    { parentSlug: 'dress-materials', name: 'Unstitched', slug: 'unstitched', image: '/images/products/kurta-green-kalamkari.jpg' },
    { parentSlug: 'accessories', name: 'Blouse Pieces', slug: 'blouse-pieces', image: '/images/products/kurta-green-elephant.jpg' },
    { parentSlug: 'accessories', name: 'Dupattas', slug: 'dupattas', image: '/images/products/kurta-magenta-plain.jpg' },
  ];

  for (const sub of subcategoryData) {
    await conn.execute(
      `INSERT INTO categories (name, slug, image, parent_id) VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name=VALUES(name)`,
      [sub.name, sub.slug, sub.image, catMap[sub.parentSlug]],
    );
  }

  const [allCats] = await conn.execute('SELECT id, slug FROM categories');
  const allCatMap = Object.fromEntries(allCats.map((c) => [c.slug, c.id]));

  console.log('Seeding products...');
  const products = [
    {
      name: 'Kanchipuram Pure Silk Saree — Temple Border', slug: 'kanchipuram-pure-silk-temple-border',
      catSlug: 'sarees', subSlug: 'kanchipuram-silk',
      description: 'A masterpiece of South Indian weaving, this Kanchipuram silk saree features an intricate temple border with real gold zari work.',
      shortDescription: 'Pure silk with gold zari temple border', sellingUnit: 'piece', basePrice: 12500,
      tags: ['wedding', 'festive', 'handloom', 'zari', 'bridal'], fabric: 'Pure Mulberry Silk', weave: 'Handloom', weight: '750g',
      careInstructions: 'Dry clean only. Store in muslin cloth.', occasions: ['Wedding', 'Festival', 'Pooja'],
      rating: 4.7, reviewCount: 23, isFeatured: true, isNewArrival: false, isBestseller: true,
      variants: [
        { sku: 'KPS-TB-MRN-001', colorName: 'Maroon', colorHex: '#800020', size: 'Free Size (6.3m with blouse piece)', design: 'Gold Zari Border', price: 12500, mrp: 15000, stock: 5, images: ['/images/products/saree-red-gold.jpg', '/images/products/saree-peach-kanchi.jpg'] },
        { sku: 'KPS-TB-BLU-001', colorName: 'Royal Blue', colorHex: '#002366', size: 'Free Size (6.3m with blouse piece)', design: 'Gold Zari Border', price: 12500, mrp: 15000, stock: 3, images: ['/images/products/saree-red-gold.jpg', '/images/products/saree-peach-kanchi.jpg'] },
        { sku: 'KPS-TB-GRN-001', colorName: 'Emerald Green', colorHex: '#046307', size: 'Free Size (6.3m with blouse piece)', design: 'Silver Zari Border', price: 13500, mrp: 16000, stock: 0, images: ['/images/products/saree-red-gold.jpg'] },
      ],
    },
    {
      name: 'Kanchipuram Silk Saree — Peacock Motif', slug: 'kanchipuram-silk-peacock-motif',
      catSlug: 'sarees', subSlug: 'kanchipuram-silk',
      description: 'Stunning Kanchipuram silk saree with traditional peacock motifs woven throughout the body.',
      shortDescription: 'Peacock motif with contrast pallu', sellingUnit: 'piece', basePrice: 9500,
      tags: ['festive', 'handloom', 'zari'], fabric: 'Pure Silk', weave: 'Handloom', weight: '650g',
      careInstructions: 'Dry clean only.', occasions: ['Festival', 'Wedding'],
      rating: 4.5, reviewCount: 15, isFeatured: false, isNewArrival: true, isBestseller: false,
      variants: [
        { sku: 'KPS-PM-PNK-001', colorName: 'Dusty Pink', colorHex: '#D4A5A5', size: 'Free Size (6.3m with blouse piece)', design: 'Peacock Motif', price: 9500, mrp: 11500, stock: 8, images: ['/images/products/saree-pink-draped.jpg'] },
        { sku: 'KPS-PM-VLT-001', colorName: 'Violet', colorHex: '#7F00FF', size: 'Free Size (6.3m with blouse piece)', design: 'Peacock Motif', price: 9500, mrp: 11500, stock: 4, images: ['/images/products/saree-collection.jpg'] },
      ],
    },
    {
      name: 'Banarasi Silk Saree — Mughal Jaal', slug: 'banarasi-silk-mughal-jaal',
      catSlug: 'sarees', subSlug: 'banarasi-silk',
      description: 'Exquisite Banarasi silk with intricate Mughal jaal weaving pattern.',
      shortDescription: 'Mughal jaal pattern with rich pallu', sellingUnit: 'piece', basePrice: 15000,
      tags: ['wedding', 'festive', 'zari', 'bridal'], fabric: 'Pure Silk', weave: 'Handloom', weight: '800g',
      careInstructions: 'Dry clean only. Store flat.', occasions: ['Wedding', 'Reception'],
      rating: 4.8, reviewCount: 31, isFeatured: true, isNewArrival: false, isBestseller: true,
      variants: [
        { sku: 'BNS-MJ-WIN-001', colorName: 'Wine', colorHex: '#722F37', size: 'Free Size (6.3m with blouse piece)', design: 'Gold Jaal', price: 15000, mrp: 18000, stock: 6, images: ['/images/products/saree-collection.jpg', '/images/products/saree-pink-draped.jpg'] },
      ],
    },
    {
      name: 'Mysore Crepe Silk Saree — Plain Elegance', slug: 'mysore-crepe-silk-plain-elegance',
      catSlug: 'sarees', subSlug: 'mysore-silk',
      description: 'Light and elegant Mysore crepe silk saree with subtle kasab border.',
      shortDescription: 'Elegant crepe silk with kasab border', sellingUnit: 'piece', basePrice: 5500,
      tags: ['office', 'casual', 'lightweight'], fabric: 'Crepe Silk', weave: 'Power Loom', weight: '450g',
      careInstructions: 'Dry clean recommended.', occasions: ['Office', 'Casual', 'Pooja'],
      rating: 4.3, reviewCount: 18, isFeatured: false, isNewArrival: true, isBestseller: false,
      variants: [
        { sku: 'MCS-PE-RSE-001', colorName: 'Dusty Rose', colorHex: '#DCAE96', size: 'Free Size (6.3m with blouse piece)', design: 'Gold Kasab Border', price: 5500, mrp: 6500, stock: 12, images: ['/images/products/saree-peach-kanchi.jpg'] },
        { sku: 'MCS-PE-TEL-001', colorName: 'Teal', colorHex: '#008080', size: 'Free Size (6.3m with blouse piece)', design: 'Gold Kasab Border', price: 5500, mrp: 6500, stock: 7, images: ['/images/products/saree-green.png'] },
      ],
    },
    {
      name: 'Pure Mulberry Silk Fabric', slug: 'pure-mulberry-silk-fabric',
      catSlug: 'fabrics', subSlug: 'pure-silk',
      description: 'Premium mulberry silk fabric, ideal for blouses and designer wear.',
      shortDescription: 'Premium silk fabric by the metre', sellingUnit: 'metre', basePrice: 1800,
      tags: ['fabric', 'silk', 'premium'], fabric: 'Mulberry Silk', weave: 'Plain', weight: '90g/m',
      careInstructions: 'Dry clean only.', occasions: [],
      rating: 4.6, reviewCount: 12, isFeatured: true, isNewArrival: false, isBestseller: false,
      variants: [
        { sku: 'MSF-PLN-IVR-001', colorName: 'Ivory', colorHex: '#FFFFF0', size: '1 metre', design: 'Plain', price: 1800, mrp: 2200, stock: 25, images: ['/images/products/fabric-silk-brocade.jpg'] },
        { sku: 'MSF-PLN-BLH-001', colorName: 'Blush Pink', colorHex: '#FFB6C1', size: '1 metre', design: 'Plain', price: 1800, mrp: 2200, stock: 20, images: ['/images/products/fabric-velvet-drape.jpg'] },
      ],
    },
    {
      name: 'Handloom Cotton Fabric — Ikat Weave', slug: 'handloom-cotton-fabric-ikat-weave',
      catSlug: 'fabrics', subSlug: 'cotton',
      description: 'Traditional ikat weave cotton fabric from Pochampally weavers.',
      shortDescription: 'Ikat weave handloom cotton', sellingUnit: 'metre', basePrice: 450,
      tags: ['handloom', 'cotton', 'ikat'], fabric: 'Cotton', weave: 'Handloom', weight: '120g/m',
      careInstructions: 'Machine wash cold, line dry.', occasions: [],
      rating: 4.4, reviewCount: 9, isFeatured: false, isNewArrival: true, isBestseller: false,
      variants: [
        { sku: 'HCF-IK-IND-001', colorName: 'Indigo', colorHex: '#4B0082', size: '1 metre', design: 'Ikat', price: 450, mrp: 550, stock: 40, images: ['/images/products/fabric-block-print.jpg'] },
      ],
    },
    {
      name: 'Cotton Printed Salwar Set — Jaipuri Block Print', slug: 'cotton-printed-salwar-jaipuri',
      catSlug: 'dress-materials', subSlug: 'salwar-suits',
      description: 'Charming Jaipuri block print salwar kameez set with matching dupatta.',
      shortDescription: 'Jaipuri block print salwar set', sellingUnit: 'piece', basePrice: 1200,
      tags: ['casual', 'cotton', 'block-print'], fabric: 'Cotton', weave: 'Hand Block Printed', weight: '500g',
      careInstructions: 'Machine wash cold.', occasions: ['Casual', 'Daily'],
      rating: 4.2, reviewCount: 22, isFeatured: false, isNewArrival: false, isBestseller: true,
      variants: [
        { sku: 'CPS-JP-BLW-001', colorName: 'Blue & White', colorHex: '#4169E1', size: 'Free Size (unstitched)', design: 'Floral Block Print', price: 1200, mrp: 1500, stock: 30, images: ['/images/products/kurta-green-kalamkari.jpg'] },
      ],
    },
    {
      name: 'Designer Blouse Piece — Aari Work', slug: 'designer-blouse-piece-aari-work',
      catSlug: 'accessories', subSlug: 'blouse-pieces',
      description: 'Handcrafted designer blouse piece with intricate Aari embroidery.',
      shortDescription: 'Aari embroidered designer blouse piece', sellingUnit: 'piece', basePrice: 1200,
      tags: ['blouse', 'aari', 'embroidery'], fabric: 'Raw Silk', weave: 'Handloom', weight: '150g',
      careInstructions: 'Dry clean only.', occasions: ['Wedding', 'Festival'],
      rating: 4.5, reviewCount: 14, isFeatured: false, isNewArrival: true, isBestseller: false,
      variants: [
        { sku: 'DBP-AA-RDG-001', colorName: 'Red & Gold', colorHex: '#B22222', size: 'Free Size (0.8m)', design: 'Floral Aari', price: 1200, mrp: 1500, stock: 15, images: ['/images/products/kurta-green-elephant.jpg'] },
        { sku: 'DBP-AA-MRG-001', colorName: 'Maroon & Gold', colorHex: '#800020', size: 'Free Size (0.8m)', design: 'Floral Aari', price: 1400, mrp: 1700, stock: 10, images: ['/images/products/kurta-purple-brocade.jpg'] },
      ],
    },
    {
      name: 'Banarasi Silk Dupatta — Zari Weave', slug: 'banarasi-silk-dupatta-zari-weave',
      catSlug: 'accessories', subSlug: 'dupattas',
      description: 'Luxurious Banarasi silk dupatta with rich zari weaving.',
      shortDescription: 'Zari weave Banarasi silk dupatta', sellingUnit: 'piece', basePrice: 2200,
      tags: ['dupatta', 'banarasi', 'zari'], fabric: 'Banarasi Silk', weave: 'Handloom', weight: '200g',
      careInstructions: 'Dry clean only.', occasions: ['Wedding', 'Festival'],
      rating: 4.7, reviewCount: 8, isFeatured: true, isNewArrival: false, isBestseller: false,
      variants: [
        { sku: 'BSD-ZW-RDG-001', colorName: 'Red', colorHex: '#FF0000', size: '2.5m', design: 'Gold Zari Weave', price: 2200, mrp: 2800, stock: 18, images: ['/images/products/kurta-magenta-plain.jpg'] },
      ],
    },
  ];

  for (const p of products) {
    const [result] = await conn.execute(
      `INSERT INTO products (name, slug, category_id, subcategory_id, description, short_description, selling_unit, base_price, tags, fabric, weave, weight, care_instructions, occasions, rating, review_count, is_featured, is_new_arrival, is_bestseller)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name=VALUES(name), id=LAST_INSERT_ID(id)`,
      [p.name, p.slug, allCatMap[p.catSlug], allCatMap[p.subSlug], p.description, p.shortDescription, p.sellingUnit, p.basePrice, JSON.stringify(p.tags), p.fabric, p.weave, p.weight, p.careInstructions, JSON.stringify(p.occasions), p.rating, p.reviewCount, p.isFeatured ? 1 : 0, p.isNewArrival ? 1 : 0, p.isBestseller ? 1 : 0],
    );
    const productId = result.insertId;

    for (const v of p.variants) {
      const [vr] = await conn.execute(
        `INSERT INTO product_variants (product_id, sku, color_name, color_hex, size, design, price, mrp, stock)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE product_id=VALUES(product_id), id=LAST_INSERT_ID(id)`,
        [productId, v.sku, v.colorName, v.colorHex, v.size, v.design, v.price, v.mrp, v.stock],
      );
      const variantId = vr.insertId;

      for (let i = 0; i < v.images.length; i++) {
        await conn.execute(
          `INSERT INTO product_images (product_id, variant_id, url, sort_order) VALUES (?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE url=VALUES(url)`,
          [productId, variantId, v.images[i], i],
        );
      }
    }
  }

  console.log(`Seeded ${products.length} products.`);
  await conn.end();
  console.log('Seeding complete.');
}

run().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
