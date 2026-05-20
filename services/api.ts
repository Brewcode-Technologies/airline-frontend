import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      // Don't auto-redirect on login or /auth/me — let the page handle the error
      if (!err.config?.url?.includes('/auth/me') && !err.config?.url?.includes('/auth/login')) {
        const role = localStorage.getItem('role');
        localStorage.clear();
        const redirect =
          role === 'airline' ? '/airline-staff-login' :
          role === 'driver'  ? '/driver-login'  :
          role === 'vendor'  ? '/vendor-login'  :
          role === 'customer' ? '/customer-login' :
          '/admin-login';
        window.location.replace(redirect);
      }
    }
    return Promise.reject(err);
  }
);

export default api;
