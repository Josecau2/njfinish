export const SESSION_COOKIE_NAME = 'authSession';

export function isAuthSessionActive() {
  if (typeof document === 'undefined') return false;
  if (!document.cookie) return false;

  const cookies = document.cookie.split(';');
  return cookies.some(cookie => cookie.trim().startsWith('authSession='));
}
