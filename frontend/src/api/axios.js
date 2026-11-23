import axios from 'axios';

// Get base URL from environment or default to local backend
let rawBaseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').trim();

// Strip any trailing slash
rawBaseUrl = rawBaseUrl.replace(/\/+$/, '');

// If the configured URL does not end with /api, append it automatically
// (Prevents 404 when developers configure VITE_API_URL="https://annasetu.onrender.com" without /api)
if (!rawBaseUrl.endsWith('/api')) {
  rawBaseUrl = `${rawBaseUrl}/api`;
}

const api = axios.create({
  baseURL: rawBaseUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token from localStorage to outgoing requests if not explicitly overridden (e.g. tempToken)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercept responses for central auth error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If unauthorized and not on login page, clear token
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
