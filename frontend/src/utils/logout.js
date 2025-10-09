import store from '../store'
import { logout } from '../store/slices/authSlice'
import { clearAllTokens } from './authToken'
import { forceBrowserCleanup } from './browserCleanup'

let logoutPromise = null

export function isLogoutInFlight() {
  return Boolean(logoutPromise)
}

export function performLogout(options = {}) {
  if (logoutPromise) {
    return logoutPromise
  }

  const {
    reason = 'auth-error',
    redirect = true,
    callBackend = true,
    fullCleanup = false,
    suppressBroadcast = false,
  } = options

  logoutPromise = (async () => {
    try {
      // Set suppression flag if needed
      if (suppressBroadcast && typeof window !== 'undefined') {
        window.__SUPPRESS_LOGOUT_BROADCAST__ = true
      }

      if (callBackend && typeof fetch === 'function') {
        try {
          await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include',
            headers: {
              Accept: 'application/json',
            },
          })
        } catch {
          // Swallow network errors; client cleanup still proceeds
        }
      }

      try {
        clearAllTokens()
      } catch {}

      try {
        store.dispatch(logout())
      } catch {}

      if (fullCleanup) {
        try {
          forceBrowserCleanup()
        } catch {}
      }

      if (typeof reason === 'string' && reason.trim().length > 0) {
        try {
          sessionStorage.setItem('logout_reason', reason)
        } catch {}
      } else {
        try {
          sessionStorage.removeItem('logout_reason')
        } catch {}
      }

      try {
        window.localStorage.setItem('__auth_changed__', String(Date.now()))
      } catch {}

      if (redirect && typeof window !== 'undefined' && window.location.pathname !== '/login') {
        try {
          const url = new URL('/login', window.location.origin)
          if (reason && reason.trim().length > 0) {
            url.searchParams.set('reason', reason)
          }
          url.searchParams.set('_t', Date.now().toString())
          window.location.replace(url.toString())
        } catch {
          try {
            window.location.href = '/login'
          } catch {}
        }
      }
    } finally {
      // Clean up suppression flag
      if (suppressBroadcast && typeof window !== 'undefined') {
        try {
          delete window.__SUPPRESS_LOGOUT_BROADCAST__
        } catch {}
      }
    }
  })().finally(() => {
    logoutPromise = null
  })

  return logoutPromise
}
