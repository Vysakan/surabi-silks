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

/** Always answers with the same message, whether or not the email has an account. */
export async function forgotPassword(email) {
  const { data } = await apiClient.post('/auth/forgot-password', { email });
  return data;
}

/** { valid, purpose: 'reset' | 'invite', email (partly hidden) }, or a 400 INVALID_TOKEN error. */
export async function verifyResetToken(token) {
  const { data } = await apiClient.post('/auth/reset-password/verify', { token });
  return data;
}

export async function resetPassword(token, password) {
  const { data } = await apiClient.post('/auth/reset-password', { token, password });
  return data;
}

export async function changePassword(currentPassword, newPassword) {
  const { data } = await apiClient.post('/auth/change-password', { currentPassword, newPassword });
  return data;
}
