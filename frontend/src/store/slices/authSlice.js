// redux/authSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  token: null,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action) => {
      const payload = action.payload || {};
      const incomingUser = payload.user || null;
      // Normalize role to lowercase for consistent frontend checks
      if (incomingUser && typeof incomingUser.role === 'string') {
        incomingUser.role = incomingUser.role.toLowerCase();
      }
      state.user = incomingUser;
      state.token = payload.token || null;
      state.error = null;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.error = null;

      // Clear ALL possible token storage locations
      const storageKeys = [
        'token', 'user', 'auth', 'persist:auth', 'persist:user',
        'persist:root', 'authToken', 'userToken', 'jwtToken',
        'accessToken', 'refreshToken', 'sessionToken'
      ];

      // Clear from localStorage
      storageKeys.forEach(key => {
        try { localStorage.removeItem(key); } catch {}
      });

      // Clear from sessionStorage
      storageKeys.forEach(key => {
        try { sessionStorage.removeItem(key); } catch {}
      });

      // Clear all cookies that might contain tokens
      const cookiesToClear = [
        'token', 'auth', 'session', 'jwt', 'access_token',
        'refresh_token', 'user', 'authToken', 'sessionToken'
      ];

      cookiesToClear.forEach(name => {
        try {
          if (typeof document !== 'undefined') {
            // Clear cookie for current domain and path
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname}`;
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
            // Also try without domain specification
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname}`;
          }
        } catch {}
      });

      // Clear any axios default headers
      try {
        if (typeof window !== 'undefined' && window.axios) {
          delete window.axios.defaults.headers.common['Authorization'];
          delete window.axios.defaults.headers['Authorization'];
        }
      } catch {}

      // Notify other tabs of logout (safely; avoid ping-pong loops)
      try {
        if (typeof window !== 'undefined') {
          const suppress = window.__SUPPRESS_LOGOUT_BROADCAST__;
          const onLogin = window.location && window.location.pathname === '/login';
          if (!suppress && !onLogin) {
            window.localStorage.setItem('__auth_logout__', String(Date.now()));
            // Mark last broadcast timestamp to throttle bursts
            window.__LAST_LOGOUT_BROADCAST_TS__ = Date.now();
            setTimeout(() => {
              try { window.localStorage.removeItem('__auth_logout__'); } catch {}
            }, 1000);
          }
        }
      } catch {}
    },
  },
});

export const { setUser, setError, logout } = authSlice.actions;
export default authSlice.reducer;
