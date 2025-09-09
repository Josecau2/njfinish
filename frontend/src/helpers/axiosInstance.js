import axios from 'axios';
import { installTokenEverywhere, getFreshestToken } from '../utils/authToken';

// Determine raw base WITHOUT embedding a localhost literal in production bundles.
// Priority: explicit VITE_API_URL > runtime window.origin (non-dev) > dev fallback.
let rawBase = import.meta.env.VITE_API_URL || '';

// If not provided at build time and we are in the browser, infer.
try {
  if (!rawBase && typeof window !== 'undefined') {
    const host = window.location.hostname;
    // Use origin if we're not on a dev host.
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      rawBase = window.location.origin;
    }
  }
} catch {}

// Dev-only convenience fallback (never leaks into prod if Vite replaces DEV flag correctly)
if (!rawBase && import.meta.env.DEV) {
  rawBase = 'http://localhost:8080';
}

// Final safety: if we still have a localhost base while running on a non-local host, switch to origin.
try {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (rawBase.includes('localhost') && host && host !== 'localhost' && host !== '127.0.0.1') {
      console.warn('[axiosInstance] Overriding localhost base to window.origin at runtime. Check missing VITE_API_URL in build.');
      rawBase = window.location.origin;
    }
  }
} catch {}

// Fail-fast (console error) in production if base is still empty.
if (!rawBase) {
  // eslint-disable-next-line no-console
  console.error('[axiosInstance] API base URL could not be resolved. Set VITE_API_URL or investigate build config.');
}

const base = rawBase
  .replace(/\/api\/?$/, '')
  .replace(/\/+$/, '');

const api = axios.create({
  baseURL: base,
  withCredentials: false // do NOT send cookies automatically
});

// Shared AbortController to cancel all requests on first auth failure
let activeAbortController = new AbortController();
let isLoggingOut = false;
let isRefreshing = false;
let refreshPromise = null;

function compactDecodeExp(token) {
  try {
  const seg = (token || '').split('.')[1];
  if (!seg) return 0;
  const pad = '='.repeat((4 - (seg.length % 4)) % 4);
  const b64 = (seg.replace(/-/g, '+').replace(/_/g, '/')) + pad;
  const payload = JSON.parse(atob(b64));
  return Number(payload.exp) * 1000;
  } catch {
    return 0;
  }
}

function handleUnauthorized(originalConfig) {
  // Allow callers to opt-out of global logout (e.g., notification bell)
  if (originalConfig && originalConfig.__suppressAuthLogout) {
    return;
  }

  if (isLoggingOut) return;
  isLoggingOut = true;

  // Abort all in-flight requests to prevent thundering herd of 401s
  try { activeAbortController.abort(); } catch {}
  activeAbortController = new AbortController();

  // Clear tokens and user locally
  try { localStorage.removeItem('token'); } catch {}
  try { sessionStorage.removeItem('token'); } catch {}
  try { localStorage.removeItem('user'); } catch {}
  try { sessionStorage.setItem('logout_reason', 'auth-error'); } catch {}
  // Notify other tabs
  try { window.localStorage.setItem('__auth_changed__', String(Date.now())); } catch {}

  // Redirect to login if not already there
  if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
    try { window.location.replace('/login?reason=auth-error'); } catch {}
  }

  setTimeout(() => { isLoggingOut = false; }, 1000);
}

// Get the freshest token from both localStorage and sessionStorage, with debugging
api.interceptors.request.use(async (config) => {
  try {
    let t = getFreshestToken();
    // If no token yet, poll briefly to avoid startup race conditions
    if (!t) {
      for (let i = 0; i < 5 && !t; i++) {
        // ~100ms max wait
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, 20));
        t = getFreshestToken();
      }
    }

    if (t) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${t}`;
    }

    // Attach abort signal so we can cancel on first global 401
    try { config.signal = activeAbortController.signal; } catch {}

    // Compact one-line debug to see auth per request quickly
    const authTail = config.headers?.Authorization ? String(config.headers.Authorization).slice(-10) : 'none';
    const expMs = t ? compactDecodeExp(t) : 0;
    const expIso = expMs ? new Date(expMs).toISOString() : 'n/a';
    const isExp = expMs ? Date.now() >= expMs : false;
    console.info(`[HTTP] ${String(config.method || 'get').toUpperCase()} ${base}${config.url} auth=${authTail==='none'?'no':'yes'} tail=${authTail} exp=${expIso} expired=${isExp}`);
  } catch {}

  return config;
});

// Store x-refresh-token if server rolls it
api.interceptors.response.use(
  (res) => {
    const rt = res?.headers?.['x-refresh-token'] || res?.headers?.get?.('x-refresh-token');
    if (rt && typeof window !== 'undefined') {
      // Use installTokenEverywhere to ensure token is stored in both localStorage and sessionStorage
      installTokenEverywhere(rt);
      console.debug('[AUTH] Token refreshed from server');
    }
    return res;
  },
  (err) => {
    const s = err?.response?.status;
    const originalConfig = err?.config || {};
    // Compact response debug
    try {
      const tail = originalConfig.headers?.Authorization ? String(originalConfig.headers.Authorization).slice(-10) : 'none';
      console.info(`[HTTP] ${s || 'ERR'} ${String(originalConfig.method || 'get').toUpperCase()} ${base}${originalConfig.url} auth=${tail==='none'?'no':'yes'} tail=${tail}`);
    } catch {}

    if (s === 401 || s === 403) {
      handleUnauthorized(originalConfig);
    }
    return Promise.reject(err);
  }
);

export default api;
