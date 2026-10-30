import axios from 'axios';

const API = import.meta.env.VITE_API_BASE || '/api';

export async function getAll(params) {
  const { data } = await axios.get(`${API}/orders`, { params });
  return data;
}

export async function getById(id) {
  const { data } = await axios.get(`${API}/orders/${id}`);
  return data;
}

export async function getByCustomerId(customerId) {
  const { data } = await axios.get(`${API}/orders`, { params: { customerId } });
  return data;
}

export async function create(orderData) {
  const { data } = await axios.post(`${API}/orders`, orderData);
  return data;
}

export async function updateStatus(id, status) {
  const { data } = await axios.patch(`${API}/orders/${id}/status`, { status });
  return data;
}
