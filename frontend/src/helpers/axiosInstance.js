import axios from 'axios'
import { clearAllTokens } from '../utils/authToken'
import { clearSessionFlag } from '../utils/authSession'

let rawBase = import.meta.env.VITE_API_URL || ''

try {
  if (!rawBase && typeof window !== 'undefined') {
    const host = window.location.hostname
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      rawBase = window.location.origin
    }
  }
} catch {}

if (!rawBase && import.meta.env.DEV) {
  rawBase = 'http://localhost:8080'
}

try {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname
    if (rawBase.includes('localhost') && host && host !== 'localhost' && host !== '127.0.0.1') {
      console.warn('[axiosInstance] Overriding localhost base to window.origin at runtime. Check missing VITE_API_URL in build.')
      rawBase = window.location.origin
    }
  }
} catch {}

if (!rawBase) {
  console.error('[axiosInstance] API base URL could not be resolved. Set VITE_API_URL or investigate build config.')
}

const base = rawBase.replace(/\/api\/?$/, '').replace(/\/+$/, '')

const api = axios.create({
  baseURL: base,
  withCredentials: true,
})

let activeAbortController = new AbortController()
let isLoggingOut = false

function handleUnauthorized(originalConfig) {
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
  try {
    clearSessionFlag()
  } catch {}
  try {
    sessionStorage.setItem('logout_reason', 'auth-error')
  } catch {}
  try {
    window.localStorage.setItem('__auth_changed__', String(Date.now()))
  } catch {}

  if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
    try {
      window.location.replace('/login?reason=auth-error')
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
      handleUnauthorized(originalConfig)
    }
    return Promise.reject(err)
  },
)

export default api

