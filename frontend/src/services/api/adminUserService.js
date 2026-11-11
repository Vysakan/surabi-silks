import { apiClient } from './client.js';

/** Root admin only. group: 'staff' (admins) | 'customer' | 'all' */
export async function list(params = {}) {
  const { data } = await apiClient.get('/admin/users', { params: { group: 'staff', ...params } });
  return data;
}

/** Adds an admin: { name, email, role: 'admin' | 'superadmin' } -> { user, created, emailSent, setupLink? } */
export async function create(userData) {
  const { data } = await apiClient.post('/admin/users', userData);
  return data;
}

/** { role?, isActive? } */
export async function update(id, changes) {
  const { data } = await apiClient.patch(`/admin/users/${id}`, changes);
  return data;
}

/** -> { emailSent, resetLink? } */
export async function sendReset(id) {
  const { data } = await apiClient.post(`/admin/users/${id}/send-reset`);
  return data;
}
