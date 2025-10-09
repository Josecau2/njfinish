const DEFAULT_MAX_AGE_MS = 8 * 60 * 60 * 1000; // 8 hours

const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'authToken';
const SESSION_COOKIE_NAME = process.env.AUTH_SESSION_COOKIE_NAME || 'authSession';
const SECURE_COOKIE = String(process.env.AUTH_COOKIE_SECURE || '').toLowerCase() === 'true' || process.env.NODE_ENV === 'production';
// In development (often split-origin localhost:3000 -> localhost:8080),
// use SameSite=None so browsers will send cookies on XHR/fetch with credentials.
// In production, default to 'strict' unless overridden by env.
const SAME_SITE = process.env.AUTH_COOKIE_SAMESITE || (process.env.NODE_ENV === 'production' ? 'strict' : 'none');

function parseExpiresToMs(value) {
  if (!value) return DEFAULT_MAX_AGE_MS;
  if (/^\d+$/.test(value)) {
    const seconds = parseInt(value, 10);
    if (seconds > 0) {
      return seconds * 1000;
    }
  }
  const match = /^\s*(\d+)\s*([smhd])\s*$/i.exec(String(value));
  if (match) {
    const amount = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();
    const multiplier = unit === 's' ? 1000 : unit === 'm' ? 60 * 1000 : unit === 'h' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    return amount * multiplier;
  }
  return DEFAULT_MAX_AGE_MS;
}

const COOKIE_MAX_AGE_MS = parseExpiresToMs(process.env.JWT_EXPIRES || process.env.JWT_EXPIRES_IN);

function setAuthCookies(res, token, options = {}) {
  if (!token) {
    clearAuthCookies(res);
    return;
  }

  const secureFlag = typeof options.secure === 'boolean' ? options.secure : SECURE_COOKIE;
  let sameSiteValue = options.sameSite || SAME_SITE;
  if (String(sameSiteValue).toLowerCase() === 'none' && !secureFlag) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('SameSite=None requires HTTPS. Use SameSite=Lax in development or enable HTTPS.');
    }
    console.error('SECURITY ERROR: SameSite=None requires Secure flag');
    throw new Error('Cannot set SameSite=None without Secure flag');
  }

  const commonOptions = {
    secure: secureFlag,
    sameSite: sameSiteValue,
    maxAge: COOKIE_MAX_AGE_MS,
  };

  res.cookie(AUTH_COOKIE_NAME, token, {
    ...commonOptions,
    httpOnly: true,
  });

  res.cookie(SESSION_COOKIE_NAME, '1', {
    ...commonOptions,
    httpOnly: false,
  });
}

function clearAuthCookies(res, options = {}) {
  const secureFlag = typeof options.secure === 'boolean' ? options.secure : SECURE_COOKIE;
  let sameSiteValue = options.sameSite || SAME_SITE;
  if (String(sameSiteValue).toLowerCase() === 'none' && !secureFlag) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('SameSite=None requires HTTPS. Use SameSite=Lax in development or enable HTTPS.');
    }
    console.error('SECURITY ERROR: SameSite=None requires Secure flag');
    throw new Error('Cannot set SameSite=None without Secure flag');
  }

  const expiredOptions = {
    secure: secureFlag,
    sameSite: sameSiteValue,
    maxAge: 0,
  };

  res.cookie(AUTH_COOKIE_NAME, '', {
    ...expiredOptions,
    httpOnly: true,
  });

  res.cookie(SESSION_COOKIE_NAME, '', {
    ...expiredOptions,
    httpOnly: false,
  });
}

function parseCookies(header = '') {
  return header.split(';').reduce((acc, part) => {
    const [rawKey, ...rest] = part.split('=');
    if (!rawKey) return acc;
    const key = rawKey.trim();
    if (!key) return acc;
    const value = rest.join('=');
    acc[key] = decodeURIComponent(value?.trim() || '');
    return acc;
  }, {});
}

function getTokenFromCookies(req) {
  try {
    const header = req?.headers?.cookie;
    if (!header) return null;
    const cookies = parseCookies(header);
    return cookies[AUTH_COOKIE_NAME] || null;
  } catch (error) {
    return null;
  }
}

module.exports = {
  AUTH_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  COOKIE_MAX_AGE_MS,
  setAuthCookies,
  clearAuthCookies,
  getTokenFromCookies,
};
