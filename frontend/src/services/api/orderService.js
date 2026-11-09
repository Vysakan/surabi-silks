import { apiClient } from './client.js';

export async function getAll(params) {
  const { data } = await apiClient.get('/orders', { params });
  return data;
}

export async function getById(id) {
  const { data } = await apiClient.get(`/orders/${id}`);
  return data;
}

export async function getByCustomerId(customerId) {
  const { data } = await apiClient.get('/orders', { params: { customerId } });
  return data.items;
}

export async function create(orderData) {
  const { data } = await apiClient.post('/orders', orderData);
  return data;
}

export async function updateStatus(id, status) {
  const { data } = await apiClient.patch(`/orders/${id}/status`, { status });
  return data;
}
