import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

export const apiClient = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});
