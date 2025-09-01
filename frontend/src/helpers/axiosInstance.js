import axios from 'axios';
import Swal from 'sweetalert2';
import { decodeId } from '../utils/obfuscate';
import store from '../store';
import { logout } from '../store/slices/authSlice';

// Lightweight JWT decoder to read exp without verifying signature
const decodeJwt = (token) => {
  try {
    const [, payload] = token.split('.');
    const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return json || {};
  } catch {
    return {};
  }
};

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

// A bare client without interceptors for refresh pings to avoid recursion
const bareClient = axios.create({ baseURL: api_url, withCredentials: true });

// Simple in-flight refresh coordination
let refreshPromise = null;
let isLoggingOut = false;
const forceLogout = (reason) => {
  try {
    if (isLoggingOut) return;
    isLoggingOut = true;
    // Clear token proactively to stop further authed calls
    if (typeof window !== 'undefined') {
      try { localStorage.removeItem('token'); } catch {}
    }
    // Dispatch Redux logout
    try { store.dispatch(logout()); } catch {}
    // Toast to inform user
    try {
      Swal.fire({
        toast: true,
        icon: 'info',
        title: 'Your session expired — please log in again.',
        position: 'top-end',
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true
      });
    } catch {}
    // Redirect to login
    if (typeof window !== 'undefined') {
      const target = '/login';
      if (window.location.pathname !== target) {
        window.location.replace(target);
      }
    }
  } catch {
    // no-op
  }
};
const ensureFreshToken = async () => {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;

    const { exp } = decodeJwt(token);
    if (!exp) return;
    const nowSec = Math.floor(Date.now() / 1000);
    const timeLeft = exp - nowSec;

    // If token expires within 60s, attempt a refresh ping
    if (timeLeft <= 60) {
      if (!refreshPromise) {
        refreshPromise = (async () => {
          try {
            const res = await bareClient.get('/api/me', {
              headers: { Authorization: `Bearer ${token}` },
            });
            const refreshed = res?.headers?.['x-refresh-token'] || res?.headers?.get?.('x-refresh-token');
            if (refreshed && typeof window !== 'undefined') {
              localStorage.setItem('token', refreshed);
            }
          } catch {
            // ignore; caller will proceed and hit normal auth handling
          } finally {
            const p = refreshPromise; // allow awaiters to resolve before clearing
            refreshPromise = null;
            return p;
          }
        })();
      }
      // Wait for ongoing refresh attempt
      await refreshPromise;
    }
  } catch {
    // noop
  }
};

// Attach Authorization header from localStorage token on every request (if present)
axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      // Proactively refresh if token is about to expire
      await ensureFreshToken();

      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (token) {
        config.headers = config.headers || {};
        // Only set if not already provided explicitly by the caller
        if (!config.headers.Authorization) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }

      // Transparently decode encoded IDs in path params for known API routes
      if (config.url) {
        const original = config.url;
        // Only touch our API calls that start with /api/
        if (/^\s*\/api\//.test(original)) {
          const [pathPart, queryPart] = original.split('?');
          const decodedPath = pathPart
            .split('/')
            .map((seg) => {
              if (!seg) return seg; // keep empty
              try {
                const raw = decodeURIComponent(seg);
                const maybe = decodeId(raw);
                // Replace only if we got a finite number (successful decode)
                if (typeof maybe === 'number' && Number.isFinite(maybe)) {
                  return String(maybe);
                }
                return seg;
              } catch {
                return seg;
              }
            })
            .join('/');
          config.url = queryPart ? `${decodedPath}?${queryPart}` : decodedPath;
        }
      }
    } catch (_) {
      // no-op if storage is inaccessible
    }
    return config;
  }
);

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

// Automatically store refreshed tokens sent by the server
axiosInstance.interceptors.response.use(
  (response) => {
    try {
      const refreshed = response?.headers?.['x-refresh-token'] || response?.headers?.get?.('x-refresh-token');
      if (refreshed && typeof window !== 'undefined') {
        localStorage.setItem('token', refreshed);
      }
    } catch (_) {}
    return response;
  },
  async (error) => {
    try {
      const refreshed = error?.response?.headers?.['x-refresh-token'] || error?.response?.headers?.get?.('x-refresh-token');
      if (refreshed && typeof window !== 'undefined') {
        localStorage.setItem('token', refreshed);
      }

      const status = error?.response?.status;
      const original = error?.config;
      const shouldRetry = (status === 401 || status === 403) && original && !original.__isRetryRequest;
      if (shouldRetry) {
        // Attempt a proactive refresh, then retry once
        await ensureFreshToken();
        const newToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (newToken) {
          original.headers = original.headers || {};
          original.headers.Authorization = `Bearer ${newToken}`;
        }
        original.__isRetryRequest = true;
        return axiosInstance(original);
      }

      // If still unauthorized/forbidden after retry (or we didn't retry), and it looks like an auth problem, log out
      const dataMsg = (error?.response?.data?.message || '').toLowerCase();
      const isAuthProblem = status === 401
        || (status === 403 && (dataMsg.includes('invalid token') || dataMsg.includes('user not found') || dataMsg.includes('no token')));
      if (isAuthProblem) {
        forceLogout('expired');
      }
    } catch (_) {
      // fallthrough
    }
    return Promise.reject(error);
  }
);