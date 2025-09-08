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
      // Clear tokens from all locations
      try { localStorage.removeItem('token'); } catch {}
      try { sessionStorage.removeItem('token'); } catch {}
      try { localStorage.removeItem('user'); } catch {}
      try { sessionStorage.removeItem('user'); } catch {}
      // Clear other auth-related items but don't wipe everything
      const keysToRemove = ['persist:auth', 'persist:user'];
      keysToRemove.forEach(key => {
        try { localStorage.removeItem(key); } catch {}
        try { sessionStorage.removeItem(key); } catch {}
      });
      try {
        if (typeof document !== 'undefined') {
          document.cookie = 'token=; Max-Age=0; path=/';
          document.cookie = 'auth=; Max-Age=0; path=/';
        }
      } catch {}
    },
  },
});

export const { setUser, setError, logout } = authSlice.actions;
export default authSlice.reducer;
