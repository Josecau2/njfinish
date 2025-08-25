import axios from 'axios';

// Normalize a base URL so we don't end up with /api/api/... when endpoints already include /api
const normalizeBaseUrl = (url) => {
  if (!url) return '';
  // Remove trailing slashes
  let normalized = url.replace(/\/$/, '');
  // If the env points at "/api" (reverse proxy style), drop it so our endpoints like "/api/..." still work
  if (/\/api$/i.test(normalized)) {
    normalized = normalized.replace(/\/api$/i, '');
  }
  return normalized;
};

// Get API URL from environment with fallback
const getApiUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;

  // If no environment variable is set, determine based on current domain
  if (!envUrl) {
    const currentDomain = window.location.hostname;
    if (currentDomain.includes('nj.contractors')) {
      return 'https://app.nj.contractors';
    } else if (currentDomain.includes('njcontractors.com')) {
      return 'https://app.njcontractors.com';
    }
    return 'http://localhost:8080'; // Development fallback
  }

  return envUrl;
};

const api_url = normalizeBaseUrl(getApiUrl());

const axiosInstance = axios.create({
  baseURL: api_url, // if empty string, axios will use relative paths, which still work
  withCredentials: true,
});

// Attach Authorization header from localStorage token on every request (if present)
axiosInstance.interceptors.request.use((config) => {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      config.headers = config.headers || {};
      // Only set if not already provided explicitly by the caller
      if (!config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch (_) {
    // no-op if storage is inaccessible
  }
  return config;
});

// Dev-only helper: log full URL on 404s to quickly spot baseURL issues
if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV) {
  axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
      try {
        const status = error?.response?.status;
        if (status === 404) {
          const cfg = error.config || {};
          const fullUrl = `${cfg.baseURL || ''}${cfg.url || ''}`;
          // eslint-disable-next-line no-console
          console.warn('[API 404]', fullUrl);
        }
      } catch (_) {
        // no-op
      }
      return Promise.reject(error);
    }
  );
}

export default axiosInstance;