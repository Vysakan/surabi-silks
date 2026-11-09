import { apiClient } from './client.js';

export async function getAll(params) {
  const { data } = await apiClient.get('/products', { params });
  return data;
}

export async function getById(id) {
  const { data } = await apiClient.get(`/products/${id}`);
  return data;
}

export async function getBySlug(slug) {
  const { data } = await apiClient.get(`/products/slug/${slug}`);
  return data;
}

export async function getByCategory(categoryId, subcategoryId) {
  const { data } = await apiClient.get('/products', { params: { categoryId, subcategoryId } });
  return data;
}

export async function search(query) {
  const { data } = await apiClient.get('/products/search', { params: { q: query } });
  return data;
}

export async function getFeatured() {
  const { data } = await apiClient.get('/products/featured');
  return data;
}

export async function getNewArrivals() {
  const { data } = await apiClient.get('/products/new-arrivals');
  return data;
}

export async function getBestsellers() {
  const { data } = await apiClient.get('/products/bestsellers');
  return data;
}

export async function getRelated(productId) {
  const { data } = await apiClient.get(`/products/${productId}/related`);
  return data;
}

export async function create(productData) {
  const { data } = await apiClient.post('/products', productData);
  return data;
}

export async function update(id, productData) {
  const { data } = await apiClient.put(`/products/${id}`, productData);
  return data;
}

export async function remove(id) {
  await apiClient.delete(`/products/${id}`);
  return true;
}
