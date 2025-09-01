import React from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import 'core-js'
import './i18n'

import App from './App'
import Swal from 'sweetalert2'
import store from './store'
import axiosInstance from './helpers/axiosInstance'
import { logout } from './store/slices/authSlice'

// On boot: if a token exists but is already expired, immediately log out and redirect
try {
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
              title: 'Your session expired — please log in again.',
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
  }
} catch {}

// Keep-alive: ping a cheap endpoint periodically when the tab is active to roll tokens
if (typeof window !== 'undefined') {
  let keepAliveTimer;
  const PING_MS = 5 * 60 * 1000; // 5 minutes
  const startKeepAlive = () => {
    clearInterval(keepAliveTimer);
    keepAliveTimer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        axiosInstance.get('/api/me').catch(() => {});
      }
    }, PING_MS);
  };
  document.addEventListener('visibilitychange', startKeepAlive);
  window.addEventListener('focus', startKeepAlive);
  startKeepAlive();
}

createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <App />
  </Provider>,
)
