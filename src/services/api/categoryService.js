import axios from 'axios';

const API = import.meta.env.VITE_API_BASE || '/api';

export async function getAll() {
  const { data } = await axios.get(`${API}/categories`);
  return data;
}

export async function getBySlug(slug) {
  const { data } = await axios.get(`${API}/categories/slug/${slug}`);
  return data;
}

export async function getTree() {
  const { data } = await axios.get(`${API}/categories/tree`);
  return data;
}

export async function create(categoryData) {
  const { data } = await axios.post(`${API}/categories`, categoryData);
  return data;
}

export async function update(id, categoryData) {
  const { data } = await axios.put(`${API}/categories/${id}`, categoryData);
  return data;
}

export async function remove(id) {
  await axios.delete(`${API}/categories/${id}`);
  return true;
}
