// frontend/src/api/axios.ts
// ─────────────────────────────────────────────────────────────
// Axios Instance — Centralized HTTP Client
// ─────────────────────────────────────────────────────────────

import axios from 'axios';

// ─── Axios Instance Create karo ───────────────────────────────
// baseURL → .env se aata hai (VITE_API_BASE_URL)
// timeout → 60 seconds: Render free tier 15 min idle ke baad so jata hai,
//           pehli request pe server jagne me ~50s lagte hain
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── REQUEST Interceptor ──────────────────────────────────────
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('apt_token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ─── RESPONSE Interceptor ─────────────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // 🔴 Unauthorized → Auto logout
    if (error.response?.status === 401) {
      localStorage.removeItem('apt_token');
      localStorage.removeItem('apt_user');

      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
