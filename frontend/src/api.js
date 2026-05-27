import axios from 'axios';
import { auth } from './firebase';

const normalizeBaseUrl = (value) => (
  String(value || 'http://localhost:5000')
    .trim()
    .replace(/[/?#]+$/, '')
);

export const API_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL);

export const getAuthToken = async () => {
  const user = auth.currentUser;
  return user ? user.getIdToken() : null;
};

export const getAuthHeaders = async () => {
  const token = await getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

axios.interceptors.request.use(async (config) => {
  const token = await getAuthToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authFetch = async (path, options = {}) => {
  const authHeaders = await getAuthHeaders();
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;

  return fetch(url, {
    ...options,
    headers: {
      ...authHeaders,
      ...(options.headers || {})
    }
  });
};
