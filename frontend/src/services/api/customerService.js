import { apiClient } from './client.js';

export async function getById(id) {
  const { data } = await apiClient.get(`/customers/${id}`);
  return data;
}

export async function update(id, customerData) {
  const { data } = await apiClient.put(`/customers/${id}`, customerData);
  return data;
}

export async function getAddresses(customerId) {
  const { data } = await apiClient.get(`/customers/${customerId}/addresses`);
  return data;
}

export async function addAddress(customerId, address) {
  const { data } = await apiClient.post(`/customers/${customerId}/addresses`, address);
  return data;
}

export async function updateAddress(customerId, addressId, addressData) {
  const { data } = await apiClient.put(`/customers/${customerId}/addresses/${addressId}`, addressData);
  return data;
}

export async function removeAddress(customerId, addressId) {
  await apiClient.delete(`/customers/${customerId}/addresses/${addressId}`);
  return true;
}
