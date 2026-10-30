import axios from 'axios';

const API = import.meta.env.VITE_API_BASE || '/api';

export async function login(email, password) {
  const { data } = await axios.post(`${API}/auth/login`, { email, password });
  return data;
}

export async function register(userData) {
  const { data } = await axios.post(`${API}/auth/register`, userData);
  return data;
}

export async function logout() {
  await axios.post(`${API}/auth/logout`);
  return true;
}

export async function getCurrentUser(userId) {
  const { data } = await axios.get(`${API}/auth/me`, { params: { userId } });
  return data;
}
