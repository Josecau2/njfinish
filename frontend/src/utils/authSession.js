export const SESSION_COOKIE_NAME = 'authSession';
export const SESSION_FLAG_KEY = 'session_active';

export function markSessionActive() {
  try {
    localStorage.setItem(SESSION_FLAG_KEY, '1');
  } catch {}
}

export function clearSessionFlag() {
  try {
    localStorage.removeItem(SESSION_FLAG_KEY);
  } catch {}
}

export function isAuthSessionActive() {
  try {
    if (typeof document !== 'undefined' && document.cookie) {
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        if (cookie && cookie.trim().startsWith(`${SESSION_COOKIE_NAME}=`)) {
          return true;
        }
      }
    }
  } catch {}

  try {
    return localStorage.getItem(SESSION_FLAG_KEY) === '1';
  } catch {}

  return false;
}
