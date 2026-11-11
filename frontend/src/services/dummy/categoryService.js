import { categories as initialCategories } from '@/data/categories';

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));
let _categories = JSON.parse(JSON.stringify(initialCategories));

export async function getAll() {
  await delay();
  return _categories;
}

export async function getBySlug(slug) {
  await delay();
  for (const cat of _categories) {
    if (cat.slug === slug) return { ...cat, type: 'category' };
    const sub = cat.subcategories.find((s) => s.slug === slug);
    if (sub) return { ...sub, parentCategory: cat, type: 'subcategory' };
  }
  return null;
}

export async function getTree() {
  await delay();
  return _categories;
}

export async function create(data) {
  await delay();
  const id = `cat-${Date.now()}`;
  const newCat = { ...data, id, subcategories: data.subcategories || [] };
  _categories.push(newCat);
  return newCat;
}

export async function update(id, data) {
  await delay();
  const index = _categories.findIndex((c) => c.id === id);
  if (index !== -1) {
    _categories[index] = { ..._categories[index], ...data };
    return _categories[index];
  }
  for (const cat of _categories) {
    const subIndex = cat.subcategories.findIndex((s) => s.id === id);
    if (subIndex !== -1) {
      cat.subcategories[subIndex] = { ...cat.subcategories[subIndex], ...data };
      return cat.subcategories[subIndex];
    }
  }
  return null;
}

export async function remove(id) {
  await delay();
  _categories = _categories.filter((c) => c.id !== id);
  for (const cat of _categories) {
    cat.subcategories = cat.subcategories.filter((s) => s.id !== id);
  }
  return true;
}

export async function uploadImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
