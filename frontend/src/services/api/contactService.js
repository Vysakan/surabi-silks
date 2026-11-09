import { apiClient } from './client.js';

export async function submitEnquiry(data) {
  const { data: result } = await apiClient.post('/contact', data);
  return result;
}
