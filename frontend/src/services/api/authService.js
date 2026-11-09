import { apiClient } from './client.js';

export async function login(email, password) {
  const { data } = await apiClient.post('/auth/login', { email, password });
  return data;
}

export async function register(userData) {
  const { data } = await apiClient.post('/auth/register', userData);
  return data;
}

export async function logout() {
  await apiClient.post('/auth/logout');
  return true;
}

export async function getCurrentUser() {
  const { data } = await apiClient.get('/auth/me');
  return data;
}
