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
  state.user = payload.user || null;
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
      try { localStorage.clear(); } catch {}
      try { sessionStorage.clear(); } catch {}
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
