import React from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import 'core-js'
import './i18n'

import App from './App'
import { detoxAuthStorage } from './utils/authToken'
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
  const tok = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (tok) {
    const [, p] = tok.split('.')
    if (p) {
      try {
        const payload = JSON.parse(atob(p.replace(/-/g, '+').replace(/_/g, '/')))
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
