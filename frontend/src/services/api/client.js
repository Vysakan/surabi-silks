import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

export const apiClient = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

let onUnauthorized = null;

/** Called when the API says the session is no longer valid (expired, signed out elsewhere, account disabled). */
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    const isLoginAttempt = url.startsWith('/auth/login') || url.startsWith('/auth/register');
    if (error.response?.status === 401 && !isLoginAttempt && onUnauthorized) {
      onUnauthorized();
    }
    return Promise.reject(error);
  }
);
