// Centralized token installation helper with in-memory cache to avoid transient gaps

let memoryToken = null // last known good token held in-memory for immediate access

function b64urlToString(part) {
  try {
    if (!part) return ''
    // Base64url -> Base64
    const pad = '='.repeat((4 - (part.length % 4)) % 4)
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/') + pad
    return atob(b64)
  } catch {
    return ''
  }
}

function decodePayload(token) {
  try {
    const seg = (token || '').split('.')[1]
    if (!seg) return null
    const json = b64urlToString(seg)
    return JSON.parse(json)
  } catch {
    return null
  }
}

// Force clear all tokens and memory cache
export function clearAllTokens(options = {}) {
  const { preserveUser = false } = options

  // Clear memory cache immediately
  memoryToken = null

  // Keys that strictly hold authentication state/token shards
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

  // Clear from localStorage
  tokenKeys.forEach((key) => {
    try {
      localStorage.removeItem(key)
    } catch {}
  })

  // Clear from sessionStorage
  tokenKeys.forEach((key) => {
    try {
      sessionStorage.removeItem(key)
    } catch {}
  })

  if (!preserveUser) {
    try {
      localStorage.removeItem('user')
    } catch {}
    try {
      sessionStorage.removeItem('user')
    } catch {}
  }

  if (import.meta?.env?.DEV) {
    const note = preserveUser ? ' (preserved user profile)' : ''
    console.debug(`[CLEAR_ALL] Auth storage cleared${note}`)
  }
}

export function installTokenEverywhere(newToken, options = {}) {
  const { preserveUser = true } = options

  try {
    // Clear previous auth shards but preserve user payload by default
    clearAllTokens({ preserveUser })

    // Write fresh token redundantly
    if (newToken) {
      try {
        localStorage.removeItem('token')
      } catch {}
      sessionStorage.setItem('token', newToken)
      memoryToken = newToken

      // Force immediate validation that token is properly stored
      const testSS = sessionStorage.getItem('token')

      // Dev log (base64url-safe)
      try {
        if (import.meta?.env?.DEV) {
          const seg = (newToken || '').split('.')[1]
          const pad = '='.repeat((4 - (seg.length % 4)) % 4)
          const b64 = seg.replace(/-/g, '+').replace(/_/g, '/') + pad
          const payload = JSON.parse(atob(b64) || '{}')
          console.debug(
            '[INSTALL] New token installed, exp:',
            payload?.exp ? new Date(payload.exp * 1000).toISOString() : 'n/a',
          )
          console.debug(
            '[INSTALL] Verification - SS:',
            testSS === newToken,
            'Memory:',
            memoryToken === newToken,
          )
        }
      } catch {}
    }
  } catch (e) {
    try {
      if (import.meta?.env?.DEV) console.error('[INSTALL] Error installing token:', e)
    } catch {}
  }
}

// Get the freshest token from storage (prefers sessionStorage; migrates legacy localStorage tokens)
export function getFreshestToken() {
  try {
    if (typeof window === 'undefined') return null

    const getTokenExp = (token) => {
      if (!token) return -1
      const payload = decodePayload(token)
      return payload && payload.exp ? Number(payload.exp) : -1
    }

    const isTokenValid = (token) => {
      if (!token) return false
      const exp = getTokenExp(token)
      const now = Math.floor(Date.now() / 1000)
      return exp > now
    }

    const candidates = []

    if (memoryToken && isTokenValid(memoryToken)) {
      candidates.push({ token: memoryToken, exp: getTokenExp(memoryToken), source: 'memory' })
    }

    let legacyToken = null
    try {
      legacyToken = localStorage.getItem('token')
    } catch {}

    if (legacyToken) {
      if (isTokenValid(legacyToken)) {
        candidates.push({
          token: legacyToken,
          exp: getTokenExp(legacyToken),
          source: 'legacy-localStorage',
        })
      }
      try {
        sessionStorage.setItem('token', legacyToken)
      } catch {}
      try {
        localStorage.removeItem('token')
      } catch {}
    }

    let sessionToken = null
    try {
      sessionToken = sessionStorage.getItem('token')
    } catch {}

    if (sessionToken && !isTokenValid(sessionToken)) {
      try {
        sessionStorage.removeItem('token')
      } catch {}
      sessionToken = null
    }

    if (sessionToken && isTokenValid(sessionToken)) {
      const already = candidates.some((candidate) => candidate.token === sessionToken)
      if (!already) {
        candidates.push({
          token: sessionToken,
          exp: getTokenExp(sessionToken),
          source: 'sessionStorage',
        })
      }
    }

    if (candidates.length === 0) {
      memoryToken = null
      try {
        if (import.meta?.env?.DEV) console.debug('[GET_FRESHEST] No valid tokens found')
      } catch {}
      return null
    }

    candidates.sort((a, b) => b.exp - a.exp)
    const best = candidates[0]

    memoryToken = best.token
    try {
      sessionStorage.setItem('token', best.token)
    } catch {}

    try {
      if (import.meta?.env?.DEV)
        console.debug(
          '[GET_FRESHEST] Using token from:',
          best.source,
          'exp:',
          new Date(best.exp * 1000).toISOString(),
        )
    } catch {}
    return best.token
  } catch (e) {
    try {
      if (import.meta?.env?.DEV) console.error('[GET_FRESHEST] Error:', e)
    } catch {}
    return null
  }
}

export function detoxAuthStorage() {
  try {
    const pickExp = (tok) => {
      if (!tok) return -1
      const p = decodePayload(tok)
      return p && p.exp ? Number(p.exp) : -1
    }

    const isTokenValid = (token) => {
      if (!token) return false
      const exp = pickExp(token)
      const now = Math.floor(Date.now() / 1000)
      return exp > now
    }

    let legacy = null
    try {
      legacy = localStorage.getItem('token')
    } catch {}
    let sessionToken = null
    try {
      sessionToken = sessionStorage.getItem('token')
    } catch {}

    if (legacy) {
      try {
        sessionStorage.setItem('token', legacy)
        sessionToken = legacy
      } catch {}
      try {
        localStorage.removeItem('token')
      } catch {}
    }

    const sessionValid = isTokenValid(sessionToken)

    try {
      sessionStorage.removeItem('token')
    } catch {}

    if (sessionValid) {
      try {
        sessionStorage.setItem('token', sessionToken)
      } catch {}
      memoryToken = sessionToken
      try {
        if (import.meta?.env?.DEV)
          console.debug(
            '[DETOX] Installed fresh session token expiring:',
            new Date(pickExp(sessionToken) * 1000).toISOString(),
          )
      } catch {}
    } else {
      memoryToken = null
      try {
        if (import.meta?.env?.DEV)
          console.debug('[DETOX] No valid session token found, cleared storage')
      } catch {}
    }

    // Clear redux-persist shards that might resurrect stale auth
    try {
      Object.keys(localStorage).forEach((k) => {
        if (k.startsWith('persist:')) localStorage.removeItem(k)
      })
    } catch {}
  } catch (e) {
    try {
      if (import.meta?.env?.DEV) console.error('[DETOX] Error during token cleanup:', e)
    } catch {}
  }
}

// Handy dev helper to quickly inspect token state from the console
export function debugAuthSnapshot() {
  try {
    const ls = localStorage.getItem('token')
    const ss = sessionStorage.getItem('token')
    const lsp = decodePayload(ls)
    const ssp = decodePayload(ss)
    const now = new Date()
    const out = {
      now: now.toISOString(),
      localStorage: ls
        ? { tail: ls.slice(-10), exp: lsp?.exp ? new Date(lsp.exp * 1000).toISOString() : 'n/a' }
        : null,
      sessionStorage: ss
        ? { tail: ss.slice(-10), exp: ssp?.exp ? new Date(ssp.exp * 1000).toISOString() : 'n/a' }
        : null,
      memory: memoryToken
        ? (() => {
            const p = decodePayload(memoryToken)
            return {
              tail: memoryToken.slice(-10),
              exp: p?.exp ? new Date(p.exp * 1000).toISOString() : 'n/a',
            }
          })()
        : null,
    }
    console.table(out)
    return out
  } catch (e) {
    console.error('debugAuthSnapshot error', e)
    return null
  }
}

// Sync memory cache across tabs when localStorage token changes
try {
  window.addEventListener('storage', (ev) => {
    if (ev.key === 'token') {
      memoryToken = ev.newValue || null
    }
  })
} catch {}
