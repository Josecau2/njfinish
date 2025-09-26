// Centralized token installation helper with in-memory cache to avoid transient gaps

let memoryToken = null; // last known good token held in-memory for immediate access

function b64urlToString(part) {
  try {
    if (!part) return '';
    // Base64url -> Base64
    const pad = '='.repeat((4 - (part.length % 4)) % 4);
    const b64 = (part.replace(/-/g, '+').replace(/_/g, '/')) + pad;
    return atob(b64);
  } catch {
    return '';
  }
}

function decodePayload(token) {
  try {
    const seg = (token || '').split('.')[1];
    if (!seg) return null;
    const json = b64urlToString(seg);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// Force clear all tokens and memory cache
export function clearAllTokens(options = {}) {
  const { preserveUser = false } = options;

  // Clear memory cache immediately
  memoryToken = null;

  // Keys that strictly hold authentication state/token shards
  const tokenKeys = [
    'token', 'auth', 'persist:auth', 'persist:user',
    'persist:root', 'authToken', 'userToken', 'jwtToken',
    'accessToken', 'refreshToken', 'sessionToken'
  ];

  // Clear from localStorage
  tokenKeys.forEach((key) => {
    try { localStorage.removeItem(key); } catch {}
  });

  // Clear from sessionStorage
  tokenKeys.forEach((key) => {
    try { sessionStorage.removeItem(key); } catch {}
  });

  if (!preserveUser) {
    try { localStorage.removeItem('user'); } catch {}
    try { sessionStorage.removeItem('user'); } catch {}
  }

  if (import.meta?.env?.DEV) {
    const note = preserveUser ? ' (preserved user profile)' : '';
    console.debug(`[CLEAR_ALL] Auth storage cleared${note}`);
  }
}


export function installTokenEverywhere(newToken, options = {}) {
  const { preserveUser = true } = options;

  try {
    // Clear previous auth shards but preserve user payload by default
    clearAllTokens({ preserveUser });

    // Write fresh token redundantly
    if (newToken) {
      localStorage.setItem('token', newToken);
      sessionStorage.setItem('token', newToken);
      memoryToken = newToken;

      // Force immediate validation that token is properly stored
      const testLS = localStorage.getItem('token');
      const testSS = sessionStorage.getItem('token');

      // Dev log (base64url-safe)
      try {
        if (import.meta?.env?.DEV) {
          const seg = (newToken || '').split('.')[1]
          const pad = '='.repeat((4 - (seg.length % 4)) % 4)
          const b64 = (seg.replace(/-/g, '+').replace(/_/g, '/')) + pad
          const payload = JSON.parse(atob(b64) || '{}')
          console.debug('[INSTALL] New token installed, exp:', payload?.exp ? new Date(payload.exp * 1000).toISOString() : 'n/a')
          console.debug('[INSTALL] Verification - LS:', testLS === newToken, 'SS:', testSS === newToken, 'Memory:', memoryToken === newToken)
        }
      } catch {}
    }
  } catch (e) {
    try { if (import.meta?.env?.DEV) console.error('[INSTALL] Error installing token:', e) } catch {}
  }
}


// Get the freshest token from storage (checking both localStorage and sessionStorage)
export function getFreshestToken() {
  try {
    if (typeof window === 'undefined') return null;

    const getTokenExp = (token) => {
      if (!token) return -1;
      const payload = decodePayload(token);
      return payload && payload.exp ? Number(payload.exp) : -1;
    };

    const isTokenValid = (token) => {
      if (!token) return false;
      const exp = getTokenExp(token);
      const now = Math.floor(Date.now() / 1000);
      return exp > now;
    };

    // Always check all sources and pick the best one
    const memValid = (() => {
      if (!memoryToken) return false;
      return isTokenValid(memoryToken);
    })();

    const lsToken = localStorage.getItem('token');
    const ssToken = sessionStorage.getItem('token');

    const lsValid = isTokenValid(lsToken);
    const ssValid = isTokenValid(ssToken);

    try { if (import.meta?.env?.DEV) {
      const details = {
        memValid,
        lsExists: !!lsToken,
        ssExists: !!ssToken,
        lsValid,
        ssValid,
        storage: {
          hasLS: !!lsToken,
          hasLS_valid: lsValid,
          hasSS: !!ssToken,
          hasSS_valid: ssValid
        }
      };
      console.debug('[GET_FRESHEST] Status:', details);
    }} catch {}

    // Clean up expired tokens immediately
    if (!lsValid && lsToken) {
      localStorage.removeItem('token');
      try { if (import.meta?.env?.DEV) console.debug('[GET_FRESHEST] Removed expired localStorage token') } catch {}
    }
    if (!ssValid && ssToken) {
      sessionStorage.removeItem('token');
      try { if (import.meta?.env?.DEV) console.debug('[GET_FRESHEST] Removed expired sessionStorage token') } catch {}
    }

    // Pick the best available token - prefer the one with latest expiration
    const candidates = [];
    if (memValid) candidates.push({ token: memoryToken, exp: getTokenExp(memoryToken), source: 'memory' });
    if (lsValid) candidates.push({ token: lsToken, exp: getTokenExp(lsToken), source: 'localStorage' });
    if (ssValid) candidates.push({ token: ssToken, exp: getTokenExp(ssToken), source: 'sessionStorage' });

    if (candidates.length === 0) {
      memoryToken = null; // Clear stale memory cache
      try { if (import.meta?.env?.DEV) console.debug('[GET_FRESHEST] No valid tokens found') } catch {}
      return null;
    }

    // Sort by expiration time, pick latest
    candidates.sort((a, b) => b.exp - a.exp);
    const best = candidates[0];

    // Update memory cache with the best token
    memoryToken = best.token;

    try { if (import.meta?.env?.DEV) console.debug('[GET_FRESHEST] Using token from:', best.source, 'exp:', new Date(best.exp * 1000).toISOString()) } catch {}
    return best.token;
  } catch (e) {
    try { if (import.meta?.env?.DEV) console.error('[GET_FRESHEST] Error:', e) } catch {}
    return null;
  }
}

export function detoxAuthStorage() {
  try {
    const pickExp = (tok) => {
      if (!tok) return -1;
      const p = decodePayload(tok);
      return p && p.exp ? Number(p.exp) : -1;
    };

    const isTokenValid = (token) => {
      if (!token) return false;
      const exp = pickExp(token);
      const now = Math.floor(Date.now() / 1000);
      return exp > now;
    };

    const ls = localStorage.getItem('token');
    const ss = sessionStorage.getItem('token');

    // Debug logging to see what tokens we found
    try { if (import.meta?.env?.DEV) {
      console.debug('[DETOX] ls exp:', ls ? new Date(pickExp(ls) * 1000).toISOString() : 'none');
      console.debug('[DETOX] ss exp:', ss ? new Date(pickExp(ss) * 1000).toISOString() : 'none');
    }} catch {}

    const lsValid = isTokenValid(ls);
    const ssValid = isTokenValid(ss);

    // Pick the token with the latest expiration that's not expired
    let winner = null;
    if (lsValid && ssValid) {
      // Both valid, pick later expiration
      const lsExp = pickExp(ls);
      const ssExp = pickExp(ss);
      winner = (lsExp >= ssExp) ? ls : ss;
    } else if (lsValid) {
      // Only localStorage valid
      winner = ls;
    } else if (ssValid) {
      // Only sessionStorage valid
      winner = ss;
    }
    // If both expired or missing, winner stays null

    // Clear both storages first
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');

    // Install winner in both if we have one
    if (winner) {
      localStorage.setItem('token', winner);
      sessionStorage.setItem('token', winner);
      memoryToken = winner;
      try { if (import.meta?.env?.DEV) console.debug('[DETOX] Installed fresh token expiring:', new Date(pickExp(winner) * 1000).toISOString()) } catch {}
    } else {
      memoryToken = null;
      try { if (import.meta?.env?.DEV) console.debug('[DETOX] No valid tokens found, cleared all storage') } catch {}
    }

    // Clear redux-persist shards that might resurrect stale auth
    Object.keys(localStorage).forEach(k => { if (k.startsWith('persist:')) localStorage.removeItem(k); });
  } catch (e) {
    try { if (import.meta?.env?.DEV) console.error('[DETOX] Error during token cleanup:', e) } catch {}
  }
}

// Handy dev helper to quickly inspect token state from the console
export function debugAuthSnapshot() {
  try {
    const ls = localStorage.getItem('token');
    const ss = sessionStorage.getItem('token');
    const lsp = decodePayload(ls);
    const ssp = decodePayload(ss);
    const now = new Date();
    const out = {
      now: now.toISOString(),
      localStorage: ls ? { tail: ls.slice(-10), exp: lsp?.exp ? new Date(lsp.exp * 1000).toISOString() : 'n/a' } : null,
      sessionStorage: ss ? { tail: ss.slice(-10), exp: ssp?.exp ? new Date(ssp.exp * 1000).toISOString() : 'n/a' } : null,
      memory: memoryToken ? (() => { const p = decodePayload(memoryToken); return { tail: memoryToken.slice(-10), exp: p?.exp ? new Date(p.exp * 1000).toISOString() : 'n/a' } })() : null,
    };
    // eslint-disable-next-line no-console
    console.table(out);
    return out;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('debugAuthSnapshot error', e);
    return null;
  }
}

// Sync memory cache across tabs when localStorage token changes
try {
  window.addEventListener('storage', (ev) => {
    if (ev.key === 'token') {
      memoryToken = ev.newValue || null;
    }
  });
} catch {}