import { getPool } from '../config/database.js';

function toCategory(row) {
  return {
    id: row.id,
    parentId: row.parent_id,
    name: row.name,
    slug: row.slug,
    image: row.image,
    description: row.description,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

export const categoryRepository = {
  async findAll() {
    const [rows] = await getPool().execute('SELECT * FROM categories ORDER BY sort_order, name');
    return rows.map(toCategory);
  },

  async findById(id) {
    const [rows] = await getPool().execute('SELECT * FROM categories WHERE id = ?', [id]);
    return rows[0] ? toCategory(rows[0]) : null;
  },

  async findBySlug(slug) {
    const [rows] = await getPool().execute('SELECT * FROM categories WHERE slug = ?', [slug]);
    if (rows.length === 0) return null;
    const cat = toCategory(rows[0]);
    if (!cat.parentId) {
      const [subs] = await getPool().execute(
        'SELECT * FROM categories WHERE parent_id = ? ORDER BY sort_order, name',
        [cat.id],
      );
      cat.subcategories = subs.map(toCategory);
    }
    return cat;
  },

  async findTree() {
    const all = await this.findAll();
    const parents = all.filter((c) => !c.parentId);
    const childMap = new Map();
    for (const c of all) {
      if (c.parentId) {
        if (!childMap.has(c.parentId)) childMap.set(c.parentId, []);
        childMap.get(c.parentId).push(c);
      }
    }
    return parents.map((p) => ({
      ...p,
      subcategories: childMap.get(p.id) || [],
    }));
  },

  async create(data) {
    const [result] = await getPool().execute(
      'INSERT INTO categories (name, slug, image, description, parent_id, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
      [data.name, data.slug, data.image || null, data.description || null, data.parentId || null, data.sortOrder || 0],
    );
    return this.findById(result.insertId);
  },

  async update(id, data) {
    const fields = [];
    const values = [];
    const fieldMap = {
      name: 'name', image: 'image', description: 'description',
      parentId: 'parent_id', sortOrder: 'sort_order',
    };
    for (const [jsKey, dbKey] of Object.entries(fieldMap)) {
      if (data[jsKey] !== undefined) {
        fields.push(`${dbKey} = ?`);
        values.push(data[jsKey]);
      }
    }
    if (fields.length === 0) return this.findById(id);
    values.push(id);
    await getPool().execute(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`, values);
    return this.findById(id);
  },

  async remove(id) {
    await getPool().execute('DELETE FROM categories WHERE id = ?', [id]);
  },
};
