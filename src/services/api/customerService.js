import axios from 'axios';

const API = import.meta.env.VITE_API_BASE || '/api';

export async function getById(id) {
  const { data } = await axios.get(`${API}/customers/${id}`);
  return data;
}

export async function update(id, customerData) {
  const { data } = await axios.put(`${API}/customers/${id}`, customerData);
  return data;
}

export async function getAddresses(customerId) {
  const { data } = await axios.get(`${API}/customers/${customerId}/addresses`);
  return data;
}

export async function addAddress(customerId, address) {
  const { data } = await axios.post(`${API}/customers/${customerId}/addresses`, address);
  return data;
}

export async function updateAddress(customerId, addressId, addressData) {
  const { data } = await axios.put(`${API}/customers/${customerId}/addresses/${addressId}`, addressData);
  return data;
}

export async function removeAddress(customerId, addressId) {
  await axios.delete(`${API}/customers/${customerId}/addresses/${addressId}`);
  return true;
}
