import React from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import 'core-js'
import './i18n'

import App from './App'
import store from './store'
import axiosInstance from './helpers/axiosInstance'

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
