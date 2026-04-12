import axios from 'axios';

/**
 * Production: set REACT_APP_API_URL to your Render API origin (no trailing slash), e.g. https://api.example.com
 * Development: falls back to http://localhost:5000 when unset (matches backend default PORT).
 */
export function getApiBaseUrl() {
  const raw = process.env.REACT_APP_API_URL;
  if (raw != null && String(raw).trim() !== '') {
    return String(raw).trim().replace(/\/$/, '');
  }
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:5000';
  }
  if (typeof console !== 'undefined' && console.warn) {
    console.warn(
      '[Vitacoin] REACT_APP_API_URL is not set. Configure it in Vercel (or .env) so API calls target your backend.'
    );
  }
  return '';
}

/**
 * Socket.IO URL — usually same host as API. Override with REACT_APP_SOCKET_URL if needed.
 */
export function getSocketUrl() {
  const raw = process.env.REACT_APP_SOCKET_URL;
  if (raw != null && String(raw).trim() !== '') {
    return String(raw).trim().replace(/\/$/, '');
  }
  const api = getApiBaseUrl();
  if (api) return api;
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:5000';
  }
  return '';
}

const api = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function isAxiosCancel(error) {
  return (
    axios.isCancel(error) ||
    error?.code === 'ERR_CANCELED' ||
    error?.name === 'CanceledError'
  );
}

export default api;
