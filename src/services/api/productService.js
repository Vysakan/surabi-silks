import axios from 'axios';

const API = import.meta.env.VITE_API_BASE || '/api';

export async function getAll(params) {
  const { data } = await axios.get(`${API}/products`, { params });
  return data;
}

export async function getById(id) {
  const { data } = await axios.get(`${API}/products/${id}`);
  return data;
}

export async function getBySlug(slug) {
  const { data } = await axios.get(`${API}/products/slug/${slug}`);
  return data;
}

export async function getByCategory(categoryId, subcategoryId) {
  const { data } = await axios.get(`${API}/products`, { params: { categoryId, subcategoryId } });
  return data;
}

export async function search(query) {
  const { data } = await axios.get(`${API}/products/search`, { params: { q: query } });
  return data;
}

export async function getFeatured() {
  const { data } = await axios.get(`${API}/products/featured`);
  return data;
}

export async function getNewArrivals() {
  const { data } = await axios.get(`${API}/products/new-arrivals`);
  return data;
}

export async function getBestsellers() {
  const { data } = await axios.get(`${API}/products/bestsellers`);
  return data;
}

export async function getRelated(productId) {
  const { data } = await axios.get(`${API}/products/${productId}/related`);
  return data;
}

export async function create(productData) {
  const { data } = await axios.post(`${API}/products`, productData);
  return data;
}

export async function update(id, productData) {
  const { data } = await axios.put(`${API}/products/${id}`, productData);
  return data;
}

export async function remove(id) {
  await axios.delete(`${API}/products/${id}`);
  return true;
}
