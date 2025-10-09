/**
 * Hybrid authentication token management
 *
 * This app uses a dual-token architecture:
 * - Memory token: Short-lived (15m) API token for immediate post-login requests
 * - HttpOnly cookie: Long-lived (8h) session token managed by backend
 *
 * The memory token is cleared on page refresh. Subsequent requests use the
 * httpOnly cookie which the backend validates and can use to issue new API tokens.
 *
 * Backend automatically refreshes tokens nearing expiration (< 20 minutes).
 */

let memoryToken = null

const SESSION_COOKIE_NAME = 'authSession'

function clearSessionIndicator() {
  try {
    if (typeof document !== 'undefined') {
      document.cookie = `${SESSION_COOKIE_NAME}=; Max-Age=0; path=/`
    }
  } catch {}
}

export function clearAllTokens(options = {}) {
  memoryToken = null

  const tokenKeys = [
    'token',
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

  tokenKeys.forEach((key) => {
    try {
      localStorage.removeItem(key)
    } catch {}
    try {
      sessionStorage.removeItem(key)
    } catch {}
  })

  clearSessionIndicator()
}

export function installTokenEverywhere(newToken, _options = {}) {
  memoryToken = newToken || null
  return memoryToken
}

export function getFreshestToken() {
  return memoryToken
}

export function detoxAuthStorage() {
  memoryToken = null
  try {
    localStorage.removeItem('token')
    sessionStorage.removeItem('token')
  } catch {}
  clearSessionIndicator()
}

export function debugAuthSnapshot() {
  try {
    return {
      now: new Date().toISOString(),
      memory: memoryToken
        ? {
            tail: memoryToken.slice(-10),
          }
        : null,
    }
  } catch (error) {
    console.error('debugAuthSnapshot error', error)
    return null
  }
}

export { clearSessionIndicator as _clearSessionIndicator }
