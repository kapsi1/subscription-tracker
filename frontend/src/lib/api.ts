import axios from 'axios';

declare module 'axios' {
  interface InternalAxiosRequestConfig {
    _skipAuthRedirect?: boolean;
  }
  interface AxiosRequestConfig {
    _skipAuthRedirect?: boolean;
  }
}

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
    if (
      error.response?.status === 401 &&
      !originalRequest?._retry &&
      !originalRequest?._skipAuthRedirect
    ) {
      originalRequest._retry = true;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        window.dispatchEvent(new Event('unauthorized'));
      }
    } else if (axios.isAxiosError(error) && !error.response && error.message === 'Network Error') {
      import('./i18n').then((module) => {
        error.message = module.default.t('common.connectionError');
      });
      try {
        const i18n = require('./i18n').default;
        error.message = i18n.t('common.connectionError');
      } catch (_e) {
        // ignore
      }
    }
    return Promise.reject(error);
  },
);

export default api;
