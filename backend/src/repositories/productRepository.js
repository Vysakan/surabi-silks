import { getPool } from '../config/database.js';

function toProduct(row) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    categoryId: row.category_id,
    subcategoryId: row.subcategory_id,
    description: row.description,
    shortDescription: row.short_description,
    sellingUnit: row.selling_unit,
    basePrice: parseFloat(row.base_price),
    tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : (row.tags || []),
    fabric: row.fabric,
    weave: row.weave,
    weight: row.weight,
    careInstructions: row.care_instructions,
    occasion: typeof row.occasions === 'string' ? JSON.parse(row.occasions) : (row.occasions || []),
    rating: parseFloat(row.rating),
    reviewCount: row.review_count,
    isFeatured: !!row.is_featured,
    isNewArrival: !!row.is_new_arrival,
    isBestseller: !!row.is_bestseller,
    isArchived: !!row.is_archived,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toVariant(row) {
  return {
    id: row.id,
    productId: row.product_id,
    color: { name: row.color_name, hex: row.color_hex },
    size: row.size,
    design: row.design,
    price: parseFloat(row.price),
    mrp: row.mrp ? parseFloat(row.mrp) : null,
    stock: row.stock,
    sku: row.sku,
    images: [],
  };
}

export const productRepository = {
  async findAll({ page = 1, limit = 12, sort, filters = {} }) {
    let where = 'WHERE p.is_archived = 0';
    const params = [];

    if (filters.categoryId) {
      where += ' AND p.category_id = ?';
      params.push(filters.categoryId);
    }
    if (filters.subcategoryId) {
      where += ' AND p.subcategory_id = ?';
      params.push(filters.subcategoryId);
    }
    if (filters.priceMin != null) {
      where += ' AND p.base_price >= ?';
      params.push(filters.priceMin);
    }
    if (filters.priceMax != null) {
      where += ' AND p.base_price <= ?';
      params.push(filters.priceMax);
    }
    if (filters.search) {
      where += ' AND (p.name LIKE ? OR p.short_description LIKE ? OR JSON_SEARCH(p.tags, "one", ?) IS NOT NULL)';
      const q = `%${filters.search}%`;
      params.push(q, q, `%${filters.search}%`);
    }
    if (filters.fabrics) {
      const list = filters.fabrics.split(',');
      where += ` AND p.fabric IN (${list.map(() => '?').join(',')})`;
      params.push(...list);
    }
    if (filters.occasions) {
      const list = filters.occasions.split(',');
      const conds = list.map(() => 'JSON_CONTAINS(p.occasions, ?)');
      where += ` AND (${conds.join(' OR ')})`;
      params.push(...list.map((o) => JSON.stringify(o)));
    }
    if (filters.colors) {
      const list = filters.colors.split(',');
      where += ` AND EXISTS (SELECT 1 FROM product_variants pv WHERE pv.product_id = p.id AND pv.color_name IN (${list.map(() => '?').join(',')}))`;
      params.push(...list);
    }

    let orderBy = 'ORDER BY p.created_at DESC';
    if (sort === 'price-asc') orderBy = 'ORDER BY p.base_price ASC';
    else if (sort === 'price-desc') orderBy = 'ORDER BY p.base_price DESC';
    else if (sort === 'newest') orderBy = 'ORDER BY p.created_at DESC';
    else if (sort === 'rating') orderBy = 'ORDER BY p.rating DESC';
    else if (sort === 'name-asc') orderBy = 'ORDER BY p.name ASC';
    else if (sort === 'name-desc') orderBy = 'ORDER BY p.name DESC';

    const countParams = [...params];
    const [countRows] = await getPool().execute(
      `SELECT COUNT(*) AS total FROM products p ${where}`,
      countParams,
    );
    const total = countRows[0].total;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;

    params.push(limit, offset);
    const [rows] = await getPool().execute(
      `SELECT p.* FROM products p ${where} ${orderBy} LIMIT ? OFFSET ?`,
      params,
    );

    const items = rows.map(toProduct);
    await this._attachVariantsAndImages(items);

    return { items, total, totalPages, page };
  },

  async findById(id) {
    const [rows] = await getPool().execute('SELECT * FROM products WHERE id = ?', [id]);
    if (rows.length === 0) return null;
    const product = toProduct(rows[0]);
    await this._attachVariantsAndImages([product]);
    return product;
  },

  async findBySlug(slug) {
    const [rows] = await getPool().execute('SELECT * FROM products WHERE slug = ?', [slug]);
    if (rows.length === 0) return null;
    const product = toProduct(rows[0]);
    await this._attachVariantsAndImages([product]);
    return product;
  },

  async findFeatured() {
    const [rows] = await getPool().execute('SELECT * FROM products WHERE is_featured = 1 AND is_archived = 0 LIMIT 12');
    const items = rows.map(toProduct);
    await this._attachVariantsAndImages(items);
    return items;
  },

  async findNewArrivals() {
    const [rows] = await getPool().execute('SELECT * FROM products WHERE is_new_arrival = 1 AND is_archived = 0 ORDER BY created_at DESC LIMIT 12');
    const items = rows.map(toProduct);
    await this._attachVariantsAndImages(items);
    return items;
  },

  async findBestsellers() {
    const [rows] = await getPool().execute('SELECT * FROM products WHERE is_bestseller = 1 AND is_archived = 0 LIMIT 12');
    const items = rows.map(toProduct);
    await this._attachVariantsAndImages(items);
    return items;
  },

  async findRelated(productId, categoryId, limit = 4) {
    const [rows] = await getPool().execute(
      'SELECT * FROM products WHERE id != ? AND category_id = ? AND is_archived = 0 LIMIT ?',
      [productId, categoryId, limit],
    );
    const items = rows.map(toProduct);
    await this._attachVariantsAndImages(items);
    return items;
  },

  async create(data) {
    const [result] = await getPool().execute(
      `INSERT INTO products (name, slug, category_id, subcategory_id, description, short_description, selling_unit, base_price, tags, fabric, weave, weight, care_instructions, occasions, is_featured, is_new_arrival, is_bestseller)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.name, data.slug, data.categoryId, data.subcategoryId || null, data.description || null, data.shortDescription || null, data.sellingUnit, data.basePrice, JSON.stringify(data.tags || []), data.fabric || null, data.weave || null, data.weight || null, data.careInstructions || null, JSON.stringify(data.occasions || []), data.isFeatured ? 1 : 0, data.isNewArrival ? 1 : 0, data.isBestseller ? 1 : 0],
    );
    const productId = result.insertId;

    if (data.variants?.length) {
      for (const v of data.variants) {
        await this._createVariant(productId, v);
      }
    }

    return this.findById(productId);
  },

  async update(id, data) {
    const fields = [];
    const values = [];
    const fieldMap = {
      name: 'name', categoryId: 'category_id', subcategoryId: 'subcategory_id',
      description: 'description', shortDescription: 'short_description', sellingUnit: 'selling_unit',
      basePrice: 'base_price', fabric: 'fabric', weave: 'weave', weight: 'weight',
      careInstructions: 'care_instructions', isFeatured: 'is_featured',
      isNewArrival: 'is_new_arrival', isBestseller: 'is_bestseller',
    };

    for (const [jsKey, dbKey] of Object.entries(fieldMap)) {
      if (data[jsKey] !== undefined) {
        fields.push(`${dbKey} = ?`);
        const val = typeof data[jsKey] === 'boolean' ? (data[jsKey] ? 1 : 0) : data[jsKey];
        values.push(val);
      }
    }
    if (data.tags !== undefined) {
      fields.push('tags = ?');
      values.push(JSON.stringify(data.tags));
    }
    if (data.occasions !== undefined) {
      fields.push('occasions = ?');
      values.push(JSON.stringify(data.occasions));
    }

    if (fields.length > 0) {
      values.push(id);
      await getPool().execute(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`, values);
    }

    if (data.variants?.length) {
      await getPool().execute('DELETE FROM product_variants WHERE product_id = ?', [id]);
      for (const v of data.variants) {
        await this._createVariant(id, v);
      }
    }

    return this.findById(id);
  },

  async archive(id) {
    await getPool().execute('UPDATE products SET is_archived = 1 WHERE id = ?', [id]);
  },

  async _createVariant(productId, v) {
    const [vResult] = await getPool().execute(
      `INSERT INTO product_variants (product_id, sku, color_name, color_hex, size, design, price, mrp, stock)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [productId, v.sku, v.colorName, v.colorHex, v.size, v.design || null, v.price, v.mrp || null, v.stock],
    );
    return vResult.insertId;
  },

  async _attachVariantsAndImages(products) {
    if (products.length === 0) return;
    const ids = products.map((p) => p.id);
    const placeholders = ids.map(() => '?').join(',');

    const [variants] = await getPool().execute(
      `SELECT * FROM product_variants WHERE product_id IN (${placeholders}) ORDER BY id`,
      ids,
    );
    const [images] = await getPool().execute(
      `SELECT * FROM product_images WHERE product_id IN (${placeholders}) ORDER BY sort_order`,
      ids,
    );

    const variantMap = new Map();
    for (const v of variants) {
      const mapped = toVariant(v);
      if (!variantMap.has(v.product_id)) variantMap.set(v.product_id, []);
      variantMap.get(v.product_id).push(mapped);
    }

    const imageMap = new Map();
    for (const img of images) {
      const key = img.variant_id || `product-${img.product_id}`;
      if (!imageMap.has(key)) imageMap.set(key, []);
      imageMap.get(key).push(img.url);
    }

    for (const p of products) {
      p.variants = variantMap.get(p.id) || [];
      for (const v of p.variants) {
        v.images = imageMap.get(v.id) || imageMap.get(`product-${p.id}`) || [];
      }
    }
  },

  async addImage(productId, variantId, url, sortOrder = 0) {
    const [result] = await getPool().execute(
      'INSERT INTO product_images (product_id, variant_id, url, sort_order) VALUES (?, ?, ?, ?)',
      [productId, variantId || null, url, sortOrder],
    );
    return result.insertId;
  },

  async removeImage(imageId) {
    const [rows] = await getPool().execute('SELECT url FROM product_images WHERE id = ?', [imageId]);
    await getPool().execute('DELETE FROM product_images WHERE id = ?', [imageId]);
    return rows[0]?.url || null;
  },
};
