import axios from 'axios';

// Server root (for static files like uploads)
export const SERVER_BASE_URL = `http://${window.location.hostname}:8000`;
// API base (for all API calls)
export const API_BASE_URL = import.meta.env.VITE_API_URL || `${SERVER_BASE_URL}/api/v1`;

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  // Token manually injected via localStorage has been REMOVED for strict XSS protection.
  // The system now natively utilizes HttpOnly secure cookies via withCredentials: true.
  // When uploading files via FormData, the browser must set
  // Content-Type itself (including the multipart boundary hash).
  // If we leave the default 'application/json', file uploads break.
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

let isLoggingOut = false;

// We export a function to allow AuthContext to inject its logout capability
export const setupInterceptors = (logoutFn) => {
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // Prevent infinite redirect loops or toast spam
        if (!isLoggingOut) {
          isLoggingOut = true;
          logoutFn();
          import('react-hot-toast').then(({ default: toast }) => {
            toast.error("Session expired. Please log in again.");
          });
          setTimeout(() => { isLoggingOut = false; }, 2000);
        }
      }
      return Promise.reject(error);
    }
  );
};

export default api;
