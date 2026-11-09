import { apiClient } from './client.js';

export async function getAll() {
  const { data } = await apiClient.get('/wishlist');
  return data;
}

export async function add(productId, variantId) {
  const { data } = await apiClient.post('/wishlist', { productId, variantId });
  return data;
}

export async function remove(productId) {
  await apiClient.delete(`/wishlist/${productId}`);
  return true;
}
