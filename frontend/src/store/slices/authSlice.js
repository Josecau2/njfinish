// redux/authSlice.js
import { createSlice } from '@reduxjs/toolkit'
import { normalizeError } from '../../utils/errorUtils'

const initialState = {
  user: null,
  error: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Redux Toolkit uses Immer - direct state assignments are safe and converted to immutable updates
    setUser: (state, action) => {
      const payload = action.payload || {}
      const incomingUser = payload.user || null
      // Normalize role to lowercase for consistent frontend checks
      if (incomingUser && typeof incomingUser.role === 'string') {
        incomingUser.role = incomingUser.role.toLowerCase()
      }
      state.user = incomingUser
      state.error = null
      // Clear redirect counter on successful authentication
      try {
        sessionStorage.removeItem('auth_redirect_count')
      } catch {}
    },
    setError: (state, action) => {
      state.error = normalizeError(action.payload)
    },
    logout: (state) => {
      state.user = null
      state.error = null

      // Clear ALL possible token storage locations
      const storageKeys = [
        'token',
        'user',
        'auth',
        'persist:auth',
        'persist:user',
        'persist:root',
        'authToken',
        'userToken',
        'jwtToken',
        'accessToken',
        'refreshToken',
        'sessionToken',
      ]

      // Clear from localStorage
      storageKeys.forEach((key) => {
        try {
          localStorage.removeItem(key)
        } catch {}
      })

      // Clear from sessionStorage
      storageKeys.forEach((key) => {
        try {
          sessionStorage.removeItem(key)
        } catch {}
      })

      // Clear any axios default headers
      try {
        if (typeof window !== 'undefined' && window.axios) {
          delete window.axios.defaults.headers.common['Authorization']
          delete window.axios.defaults.headers['Authorization']
        }
      } catch {}

      // Cross-tab logout using BroadcastChannel API
      try {
        if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
          const suppress = window.__SUPPRESS_LOGOUT_BROADCAST__
          const onLogin = window.location && window.location.pathname === '/login'

          if (!suppress && !onLogin) {
            // Create a broadcast channel for cross-tab communication
            const logoutChannel = new BroadcastChannel('auth_logout_channel')

            // Broadcast logout event to other tabs
            logoutChannel.postMessage({
              type: 'LOGOUT',
              timestamp: Date.now(),
            })

            // Close channel after broadcasting
            setTimeout(() => {
              logoutChannel.close()
            }, 100)
          }
        } else {
          // Fallback to localStorage for older browsers
          if (typeof window !== 'undefined') {
            const suppress = window.__SUPPRESS_LOGOUT_BROADCAST__
            const onLogin = window.location && window.location.pathname === '/login'

            if (!suppress && !onLogin) {
              window.localStorage.setItem('__auth_logout__', String(Date.now()))
              setTimeout(() => {
                try {
                  window.localStorage.removeItem('__auth_logout__')
                } catch {}
              }, 1000)
            }
          }
        }
      } catch {}
    },
  },
})

export const { setUser, setError, logout } = authSlice.actions
export default authSlice.reducer
