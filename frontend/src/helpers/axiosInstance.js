import axios from 'axios'
import { getFreshestToken, installTokenEverywhere } from '../utils/authToken'
import { performLogout } from '../utils/logout'

let rawBase = import.meta.env.VITE_API_URL || ''

try {
  if (!rawBase && typeof window !== 'undefined') {
    const host = window.location.hostname
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      rawBase = window.location.origin
    }
  }
  // If VITE_API_URL is pointing to localhost:8080 but we're on Vite dev port 3000, prefer proxy
  if (
    import.meta.env.DEV &&
    typeof window !== 'undefined' &&
    String(window.location.port) === '3000'
  ) {
    if (rawBase && /localhost:8080/.test(String(rawBase))) {
      console.warn(
        '[axiosInstance] Overriding VITE_API_URL (localhost:8080) to use Vite proxy (relative base) for dev',
      )
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
  const msg =
    '[axiosInstance] Using relative base (Vite proxy) — set VITE_API_URL for absolute base in prod.'
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

const refreshClient = axios.create({
  baseURL: base || undefined,
  withCredentials: true,
})

let activeAbortController = new AbortController()
let refreshPromise = null

// Request queue for handling concurrent refresh
const pendingRequests = []
let isRefreshing = false

function handleUnauthorized(originalConfig, reason = 'invalid') {
  if (originalConfig && originalConfig.__suppressAuthLogout) {
    return
  }

  try {
    activeAbortController.abort()
  } catch {}
  activeAbortController = new AbortController()

  performLogout({ reason }).catch(() => {})
}

async function fetchApiToken() {
  if (!refreshPromise) {
    refreshPromise = refreshClient
      .post('/api/auth/token', undefined, {
        headers: { Accept: 'application/json' },
        timeout: 10000,
        __suppressAuthLogout: true,
      })
      .then((response) => {
        const nextToken = response?.data?.token
        if (!nextToken) {
          throw new Error('Token refresh response missing token')
        }
        installTokenEverywhere(nextToken)
        return nextToken
      })
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

async function processQueue(token, error = null) {
  pendingRequests.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error)
    } else {
      resolve(token)
    }
  })
  pendingRequests.length = 0
}

api.interceptors.request.use(async (config) => {
  try {
    let token = getFreshestToken()

    // Lightweight retry loop to bridge the gap between login response and token install
    if (!token) {
      for (let i = 0; i < 10 && !token; i += 1) {
        await new Promise((resolve) => setTimeout(resolve, 30))
        token = getFreshestToken()
      }
      // Only log if retries were needed and still no token
      if (!token && process.env.NODE_ENV === 'development') {
        console.warn('[Auth] Token not available after 300ms retry window')
      }
    }

    if (token) {
      config.headers = config.headers || {}
      if (!config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }

    try {
      config.signal = activeAbortController.signal
    } catch {}
  } catch {}

  return config
})

api.interceptors.response.use(
  (res) => {
    return res
  },
  async (err) => {
    const status = err?.response?.status
    const originalConfig = err?.config || {}

    if (status === 401) {
      const wwwAuthHeader = err?.response?.headers?.['www-authenticate']
      const wwwAuth = typeof wwwAuthHeader === 'string' ? wwwAuthHeader.toLowerCase() : ''
      const isExpired = wwwAuth.includes('jwt expired')

      if (isExpired && !originalConfig.__retry) {
        if (!isRefreshing) {
          isRefreshing = true

          try {
            const nextToken = await fetchApiToken()
            processQueue(nextToken)

            const retryConfig = {
              ...originalConfig,
              __retry: true,
              headers: {
                ...(originalConfig.headers || {}),
                Authorization: `Bearer ${nextToken}`,
              },
            }
            retryConfig.signal = activeAbortController.signal

            return api.request(retryConfig)
          } catch (err) {
            processQueue(null, err)
            handleUnauthorized(originalConfig, 'expired')
            return Promise.reject(err)
          } finally {
            isRefreshing = false
          }
        }

        // Queue this request
        return new Promise((resolve, reject) => {
          pendingRequests.push({
            resolve: (token) => {
              const retryConfig = {
                ...originalConfig,
                __retry: true,
                headers: {
                  ...(originalConfig.headers || {}),
                  Authorization: `Bearer ${token}`,
                },
              }
              retryConfig.signal = activeAbortController.signal
              resolve(api.request(retryConfig))
            },
            reject,
          })
        })
      }

      handleUnauthorized(originalConfig, isExpired ? 'expired' : 'invalid')
    }

    return Promise.reject(err)
  },
)

export default api
export { fetchApiToken }
