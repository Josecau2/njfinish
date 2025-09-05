import axios from 'axios';
import store from '../store';
import { logout } from '../store/slices/authSlice';

const base = (import.meta.env.VITE_API_URL?.replace(/\/api$/, '') || 'http://localhost:8080');

const api = axios.create({
  baseURL: base,
  withCredentials: false // do NOT send cookies automatically
});

// Shared AbortController to cancel all requests on first auth failure
let activeAbortController = new AbortController();
let isLoggingOut = false;
let isRefreshing = false;
let refreshPromise = null;

// Attach token from localStorage (only; no preflights)
api.interceptors.request.use((config) => {
  const t = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (t) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${t}`;
  }
  // Attach abort signal so polling and pending requests stop immediately after 401/403
  try {
    if (!activeAbortController || activeAbortController.signal?.aborted) {
      activeAbortController = new AbortController();
    }
    config.signal = config.signal || activeAbortController.signal;
  } catch (_) {}
  return config;
});

// Store x-refresh-token if server rolls it
api.interceptors.response.use(
  (res) => {
    const rt = res?.headers?.['x-refresh-token'] || res?.headers?.get?.('x-refresh-token');
    if (rt && typeof window !== 'undefined') localStorage.setItem('token', rt);
    return res;
  },
  (err) => {
    const s = err?.response?.status;
    const originalConfig = err?.config || {};
    const suppressLogout = !!originalConfig.__suppressAuthLogout;
    const isRefreshPing = !!originalConfig.__isRefreshPing;

    // If this is our internal ping attempt, do not recurse or logout here
    if ((s === 401 || s === 403) && isRefreshPing) {
      return Promise.reject(err);
    }

    if (s === 401 || s === 403) {
      // Only attempt a single silent refresh per failed request
      if (!originalConfig.__retryAttempted) {
        originalConfig.__retryAttempted = true;

        // Start (or join) a single refresh in flight
        if (!isRefreshing) {
          isRefreshing = true;
          const currentToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
          refreshPromise = api.get('/api/auth/ping', {
            __isRefreshPing: true,
            headers: currentToken ? { Authorization: `Bearer ${currentToken}` } : undefined
          }).finally(() => {
            isRefreshing = false;
          });
        }

        return refreshPromise.then(() => {
          // After successful refresh, retry the original request with the new token
          try {
            // Ensure we don't reuse a potentially aborted signal
            const { signal, ...rest } = originalConfig;
            return api.request(rest);
          } catch (_) {
            return api.request(originalConfig);
          }
        }).catch((refreshErr) => {
          // Refresh failed. Respect suppression flags: do not logout for suppressed requests.
          if (suppressLogout) {
            return Promise.reject(err);
          }

          // Finalize with a clean logout once
          if (!isLoggingOut) {
            isLoggingOut = true;
            try { activeAbortController.abort('auth-expired'); } catch {}
            try { activeAbortController = new AbortController(); } catch {}
            try { localStorage.removeItem('token'); } catch {}
            try { store.dispatch(logout()); } catch {}
            if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
              try { window.location.replace('/login'); } catch {}
            }
            setTimeout(() => { isLoggingOut = false; }, 1500);
          }
          return Promise.reject(err);
        });
      }

      // Already retried and still unauthorized: either suppressed or proceed to logout
      if (suppressLogout) {
        return Promise.reject(err);
      }

      if (!isLoggingOut) {
        isLoggingOut = true;
        try { activeAbortController.abort('auth-expired'); } catch {}
        try { activeAbortController = new AbortController(); } catch {}
        try { localStorage.removeItem('token'); } catch {}
        try { store.dispatch(logout()); } catch {}
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          try { window.location.replace('/login'); } catch {}
        }
        setTimeout(() => { isLoggingOut = false; }, 1500);
      }
    }
    return Promise.reject(err);
  }
);

export default api;