// Browser cleanup script - paste this into browser console

console.log('=== CLEARING ALL AUTH DATA ===');

// 1. Check current tokens
const oldToken = localStorage.getItem('token');
const oldUser = localStorage.getItem('user');

console.log('Current token exists:', !!oldToken);
console.log('Current user exists:', !!oldUser);

if (oldToken) {
  try {
    const payload = JSON.parse(atob(oldToken.split('.')[1]));
    console.log('Old token info:', {
      email: payload.email,
      exp: new Date(payload.exp * 1000).toISOString(),
      isExpired: payload.exp < Date.now() / 1000
    });
  } catch (e) {
    console.log('Could not decode old token');
  }
}

// 2. Clear all auth data
localStorage.clear();
sessionStorage.clear();

// 3. Clear any cookies
document.cookie.split(";").forEach(function(c) {
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
});

console.log('✅ All auth data cleared');
console.log('🔄 Please refresh the page and try logging in again');

// 4. Check axios default headers
if (window.axios && window.axios.defaults.headers.common.Authorization) {
  delete window.axios.defaults.headers.common.Authorization;
  console.log('✅ Cleared axios default auth header');
}
