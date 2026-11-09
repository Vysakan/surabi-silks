import { apiClient } from './client.js';

export async function get() {
  const { data } = await apiClient.get('/cart');
  return data;
}

export async function addItem(productId, variantId, quantity = 1) {
  const { data } = await apiClient.post('/cart/items', { productId, variantId, quantity });
  return data;
}

export async function updateQuantity(variantId, quantity) {
  const { data } = await apiClient.patch(`/cart/items/${variantId}`, { quantity });
  return data;
}

export async function removeItem(variantId) {
  const { data } = await apiClient.delete(`/cart/items/${variantId}`);
  return data;
}

export async function clear() {
  await apiClient.delete('/cart');
  return true;
}
