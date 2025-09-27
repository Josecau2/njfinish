import { getFreshestToken } from './authToken';

let cachedBase = null;

function resolveApiBase() {
  if (cachedBase) {
    return cachedBase;
  }

  let raw = import.meta.env.VITE_API_URL || '';

  try {
    if (!raw && typeof window !== 'undefined') {
      const host = window.location.hostname;
      if (host && host !== 'localhost' && host !== '127.0.0.1') {
        raw = window.location.origin;
      } else if (!raw) {
        raw = window.location.origin || '';
      }
    }
  } catch (error) {
    // noop
  }

  if (!raw) {
    cachedBase = '';
    return cachedBase;
  }

  cachedBase = raw.replace(/\/api\/?$/, '').replace(/\/+$/, '');
  return cachedBase;
}

export function withAuthToken(url) {
  if (!url) return '';
  try {
    const token = getFreshestToken();
    if (!token) return url;
    if (url.includes('token=')) return url;
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}token=${encodeURIComponent(token)}`;
  } catch (error) {
    return url;
  }
}

export function buildUploadUrl(inputPath) {
  if (!inputPath) {
    return '';
  }

  const base = resolveApiBase();
  const normalised = typeof inputPath === 'string' ? inputPath : String(inputPath || '');
  const hasUploadsPrefix = normalised.startsWith('/uploads');
  const cleanRelative = hasUploadsPrefix
    ? normalised
    : `/uploads/${normalised.replace(/^\/+/, '')}`;

  const target = base ? `${base}${cleanRelative}` : cleanRelative;
  return withAuthToken(target);
}

export function buildUploadDownloadUrl(inputPath) {
  return buildUploadUrl(inputPath);
}

export function getUploadApiBase() {
  return resolveApiBase();
}
