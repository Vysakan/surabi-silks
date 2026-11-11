import { apiClient } from './client.js';

export async function getAll() {
  const { data } = await apiClient.get('/categories');
  return data;
}

export async function getBySlug(slug) {
  const { data } = await apiClient.get(`/categories/slug/${slug}`);
  return data;
}

export async function getTree() {
  const { data } = await apiClient.get('/categories/tree');
  return data;
}

export async function create(categoryData) {
  const { data } = await apiClient.post('/categories', categoryData);
  return data;
}

export async function update(id, categoryData) {
  const { data } = await apiClient.put(`/categories/${id}`, categoryData);
  return data;
}

export async function remove(id) {
  await apiClient.delete(`/categories/${id}`);
  return true;
}

/** Uploads a category image file and returns its URL (save the category with it afterwards). */
export async function uploadImage(file) {
  const formData = new FormData();
  formData.append('image', file);
  const { data } = await apiClient.post('/categories/images', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.url;
}
