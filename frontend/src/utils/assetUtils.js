import { buildUploadUrl, withAuthToken } from './uploads';
const ABSOLUTE_URL_PATTERN = /^(?:[a-z]+:)?\/\//i;

const normalizeBaseUrl = (base) => {
  if (!base || typeof base !== 'string') return '';
  return base.trim().replace(/\/$/, '');
};

const normalizePath = (input) => {
  if (!input || typeof input !== 'string') return '';
  const value = input.trim();
  if (!value) return '';
  if (value.startsWith('/')) return value;
  return `/${value}`;
};

/**
 * Convert an arbitrary logo or asset path into a URL the frontend can load.
 * Falls back to the API base for uploaded assets and leaves bundled assets intact.
 */
export const resolveAssetUrl = (input, apiUrl = import.meta.env?.VITE_API_URL) => {
  if (input === undefined || input === null) return '';
  const raw = String(input).trim();
  if (!raw) return '';

  if (ABSOLUTE_URL_PATTERN.test(raw)) {
    if (raw.includes('/uploads/')) {
      return withAuthToken(raw);
    }
    return raw;
  }

  if (raw.startsWith('data:')) {
    return raw;
  }

  if (raw.startsWith('/uploads') || raw.startsWith('uploads/')) {
    const uploadPath = raw.startsWith('/') ? raw : `/${raw}`;
    return buildUploadUrl(uploadPath);
  }

  if (raw.startsWith('/assets/') || raw.startsWith('assets/')) {
    return raw.startsWith('/') ? raw : `/${raw}`;
  }

  const normalizedBase = normalizeBaseUrl(apiUrl);
  const normalizedPath = normalizePath(raw);

  if (!normalizedBase) {
    return normalizedPath;
  }

  return `${normalizedBase}${normalizedPath}`;
};

export default resolveAssetUrl;
