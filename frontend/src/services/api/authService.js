import { apiClient } from './client.js';

export async function login(email, password) {
  const { data } = await apiClient.post('/auth/login', { email, password });
  return data;
}

export async function register(userData) {
  const { data } = await apiClient.post('/auth/register', userData);
  return data;
}

export async function forgotPassword(email) {
  const { data } = await apiClient.post('/auth/forgot-password', { email });
  return data;
}

export async function resetPassword(token, password) {
  const { data } = await apiClient.post('/auth/reset-password', { token, password });
  return data;
}

export async function changePassword(currentPassword, newPassword) {
  const { data } = await apiClient.put('/auth/password', { currentPassword, newPassword });
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
