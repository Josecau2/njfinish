import React from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import 'core-js'
import './i18n'

import App from './App'
import { detoxAuthStorage, getFreshestToken, debugAuthSnapshot } from './utils/authToken'
import Swal from 'sweetalert2'
import i18n from './i18n'
import store from './store'
import axiosInstance from './helpers/axiosInstance'
import { logout } from './store/slices/authSlice'

// Early detox: unify to a single freshest token & clear stale persisted shards
try { detoxAuthStorage(); } catch {}

// On boot hygiene: remove legacy auth cookies and validate token freshness before components mount
try {
  try {
    if (typeof document !== 'undefined') {
      document.cookie = 'token=; Max-Age=0; path=/';
      document.cookie = 'auth=; Max-Age=0; path=/';
    }
  } catch {}
  const tok = typeof window !== 'undefined' ? getFreshestToken() : null;
  // Expose a quick debug helper
  try { window.debugAuth = debugAuthSnapshot; } catch {}
  try { console.info('[AUTH] Tip: run window.debugAuth() to inspect token tails and expirations'); } catch {}
  if (tok) {
    const [, p] = tok.split('.')
    if (p) {
      try {
        const pad = '='.repeat((4 - (p.length % 4)) % 4)
        const b64 = (p.replace(/-/g, '+').replace(/_/g, '/')) + pad
        const payload = JSON.parse(atob(b64))
        const now = Math.floor(Date.now() / 1000)
        if (payload?.exp && payload.exp <= now) {
          store.dispatch(logout())
          try {
            Swal.fire({
              toast: true,
              icon: 'info',
              title: i18n.t('auth.sessionExpired','Your session expired. Please sign in again.'),
              position: 'top-end',
              showConfirmButton: false,
              timer: 2500,
              timerProgressBar: true
            })
          } catch {}
          if (window.location.pathname !== '/login') {
            window.location.replace('/login')
          }
        }
      } catch {}
    }
  } else {
    // No token at boot: ensure no stale cookie interferes then optionally redirect if on protected page
    try {
      if (window.location.pathname !== '/login' && window.location.pathname !== '/reset-password') {
        // Let route guards handle it or redirect to login depending on app flow
      }
    } catch {}
  }
} catch {}

// Removed proactive /api/me keep-alive pings to avoid token refresh gymnastics

createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <App />
  </Provider>,
)
