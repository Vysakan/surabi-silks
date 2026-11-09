import { apiClient } from './client.js';

export async function getByProductId(productId) {
  const { data } = await apiClient.get(`/products/${productId}/reviews`);
  return data;
}

export async function create(reviewData) {
  const { data } = await apiClient.post('/reviews', reviewData);
  return data;
}
