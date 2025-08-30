// Lightweight ID obfuscation using hashids
import Hashids from 'hashids';

// Salt can be configured via env to rotate encoding; fall back to a safe default
const SALT = import.meta.env.VITE_URL_ID_SALT || 'njcabinets-default-salt';
const MIN_LENGTH = Number(import.meta.env.VITE_URL_ID_MINLEN || 8);
const hashids = new Hashids(SALT, MIN_LENGTH);

// Encode a numeric ID -> string (e.g., 123 -> 'jR')
export function encodeId(id) {
  if (id === null || id === undefined) return '';
  const num = Number(id);
  if (!Number.isFinite(num)) return String(id);
  return hashids.encode(num);
}

// Decode a string -> numeric ID; returns original if decode fails
export function decodeId(str) {
  if (str === null || str === undefined) return str;
  // If it's already a number-like string, keep it
  if (/^\d+$/.test(String(str))) return Number(str);
  try {
    const [num] = hashids.decode(str) || [];
    return typeof num === 'number' && Number.isFinite(num) ? num : str;
  } catch {
    return str;
  }
}

// Build an encoded path by replacing :id-like segments with their encoded value
// Example: buildEncodedPath('/proposals/edit/:id', { id: 123 }) -> '/proposals/edit/jR...'
export function buildEncodedPath(template, params = {}) {
  return template.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, (m, key) => {
    const val = params[key];
    return encodeURIComponent(encodeId(val));
  });
}

// Decode a route param value safely (handles numeric and encoded)
export function decodeParam(value) {
  const v = decodeURIComponent(String(value ?? ''));
  return decodeId(v);
}

// Generate a random base62 noise string of given length
export function genNoise(length = 8) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  for (let i = 0; i < length; i++) {
    out += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }
  return out;
}
