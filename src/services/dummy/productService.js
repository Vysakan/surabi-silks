import { products as initialProducts } from '@/data/products';

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));
let _products = [...initialProducts];

export async function getAll({ page = 1, limit = 12, sort, filters = {} } = {}) {
  await delay();
  let result = [..._products];

  if (filters.categoryId) result = result.filter((p) => p.categoryId === filters.categoryId);
  if (filters.subcategoryId) result = result.filter((p) => p.subcategoryId === filters.subcategoryId);
  if (filters.priceMin != null) result = result.filter((p) => p.basePrice >= filters.priceMin);
  if (filters.priceMax != null) result = result.filter((p) => p.basePrice <= filters.priceMax);
  if (filters.colors?.length) {
    result = result.filter((p) => p.variants.some((v) => filters.colors.includes(v.color.name)));
  }
  if (filters.fabrics?.length) {
    result = result.filter((p) => filters.fabrics.includes(p.fabric));
  }
  if (filters.occasions?.length) {
    result = result.filter((p) => p.occasion?.some((o) => filters.occasions.includes(o)));
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.shortDescription.toLowerCase().includes(q) ||
        p.tags.some((t) => t.includes(q))
    );
  }

  if (sort === 'price-asc') result.sort((a, b) => a.basePrice - b.basePrice);
  else if (sort === 'price-desc') result.sort((a, b) => b.basePrice - a.basePrice);
  else if (sort === 'newest') result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  else if (sort === 'rating') result.sort((a, b) => b.rating - a.rating);
  else if (sort === 'name-asc') result.sort((a, b) => a.name.localeCompare(b.name));
  else if (sort === 'name-desc') result.sort((a, b) => b.name.localeCompare(a.name));

  const total = result.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const items = result.slice(start, start + limit);

  return { items, total, totalPages, page };
}

export async function getById(id) {
  await delay();
  return _products.find((p) => p.id === id) || null;
}

export async function getBySlug(slug) {
  await delay();
  return _products.find((p) => p.slug === slug) || null;
}

export async function getByCategory(categoryId, subcategoryId) {
  await delay();
  let result = _products.filter((p) => p.categoryId === categoryId);
  if (subcategoryId) result = result.filter((p) => p.subcategoryId === subcategoryId);
  return result;
}

export async function search(query) {
  return getAll({ filters: { search: query }, limit: 50 });
}

export async function getFeatured() {
  await delay();
  return _products.filter((p) => p.isFeatured);
}

export async function getNewArrivals() {
  await delay();
  return _products.filter((p) => p.isNewArrival);
}

export async function getBestsellers() {
  await delay();
  return _products.filter((p) => p.isBestseller);
}

export async function getRelated(productId) {
  await delay();
  const product = _products.find((p) => p.id === productId);
  if (!product) return [];
  return _products
    .filter((p) => p.id !== productId && p.categoryId === product.categoryId)
    .slice(0, 4);
}

export async function create(data) {
  await delay();
  const id = `prod-${String(_products.length + 1).padStart(3, '0')}`;
  const newProduct = { ...data, id, createdAt: new Date().toISOString().split('T')[0] };
  _products.push(newProduct);
  return newProduct;
}

export async function update(id, data) {
  await delay();
  const index = _products.findIndex((p) => p.id === id);
  if (index === -1) return null;
  _products[index] = { ..._products[index], ...data };
  return _products[index];
}

export async function remove(id) {
  await delay();
  _products = _products.filter((p) => p.id !== id);
  return true;
}
