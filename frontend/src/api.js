import axios from 'axios';
import { auth } from './firebase';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

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
