// Lightweight auth token helpers retained for backward compatibility.
// Tokens are no longer persisted client-side; authentication relies on httpOnly cookies.

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
