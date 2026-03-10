import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    // Add logic here if implementing refresh tokens via cookies or separate endpoint later.
    // Right now, if 401, we can redirect or clear session.
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      // Depending on auth flow, could trigger a logout event here.
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        window.dispatchEvent(new Event('unauthorized'));
      }
    }
    return Promise.reject(error);
  },
);

export default api;
