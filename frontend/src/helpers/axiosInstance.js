import axios from 'axios'
import { clearAllTokens } from '../utils/authToken'

let rawBase = import.meta.env.VITE_API_URL || ''

try {
  if (!rawBase && typeof window !== 'undefined') {
    const host = window.location.hostname
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      rawBase = window.location.origin
    }
  }
  // If VITE_API_URL is pointing to localhost:8080 but we're on Vite dev port 3000, prefer proxy
  if (import.meta.env.DEV && typeof window !== 'undefined' && String(window.location.port) === '3000') {
    if (rawBase && /localhost:8080/.test(String(rawBase))) {
      console.warn('[axiosInstance] Overriding VITE_API_URL (localhost:8080) to use Vite proxy (relative base) for dev')
      rawBase = ''
    }
  }
} catch {}

// In Vite dev running in the browser on port 3000 with a proxy configured,
// prefer relative URLs to leverage the proxy and avoid cross-origin cookies.
if (!rawBase && import.meta.env.DEV) {
  try {
    if (typeof window !== 'undefined' && String(window.location.port) === '3000') {
      rawBase = '' // use relative base, e.g., '/api/...'
    } else {
      rawBase = 'http://localhost:8080'
    }
  } catch {
    rawBase = 'http://localhost:8080'
  }
}

try {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname
    if (rawBase.includes('localhost') && host && host !== 'localhost' && host !== '127.0.0.1') {
      console.warn(
        '[axiosInstance] Overriding localhost base to window.origin at runtime. Check missing VITE_API_URL in build.',
      )
      rawBase = window.location.origin
    }
  }
} catch {}

if (!rawBase) {
  const msg = '[axiosInstance] Using relative base (Vite proxy) — set VITE_API_URL for absolute base in prod.'
  if (import.meta.env.DEV) {
    console.info(msg)
  } else {
    console.warn(msg)
  }
}

const base = rawBase.replace(/\/api\/?$/, '').replace(/\/+$/, '')

const api = axios.create({
  baseURL: base || undefined, // undefined => relative URL requests
  withCredentials: true,
})

let activeAbortController = new AbortController()
let isLoggingOut = false

function handleUnauthorized(originalConfig, reason = 'invalid') {
  if (originalConfig && originalConfig.__suppressAuthLogout) {
    return
  }

  if (isLoggingOut) return
  isLoggingOut = true

  try {
    activeAbortController.abort()
  } catch {}
  activeAbortController = new AbortController()

  try {
    clearAllTokens()
  } catch {}

  // Store reason for login page to show appropriate message
  const logoutReason = reason === 'expired' ? 'expired' : 'auth-error'
  try {
    sessionStorage.setItem('logout_reason', logoutReason)
  } catch {}
  try {
    window.localStorage.setItem('__auth_changed__', String(Date.now()))
  } catch {}

  if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
    try {
      window.location.replace(`/login?reason=${logoutReason}`)
    } catch {}
  }

  setTimeout(() => {
    isLoggingOut = false
  }, 1000)
}

api.interceptors.request.use((config) => {
  try {
    config.signal = activeAbortController.signal
  } catch {}
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status
    const originalConfig = err?.config || {}

    if (status === 401) {
      const wwwAuth = err?.response?.headers?.['www-authenticate']

      // Check if it's an expired token
      if (wwwAuth && wwwAuth.toLowerCase().includes('jwt expired')) {
        handleUnauthorized(originalConfig, 'expired')
      } else {
        // Invalid token or other auth error
        handleUnauthorized(originalConfig, 'invalid')
      }
    }

    return Promise.reject(err)
  },
)

export default api
