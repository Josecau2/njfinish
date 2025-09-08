// Debug token storage - paste this in browser console after login
console.log('=== TOKEN STORAGE DEBUG ===');

// Check all possible token storage locations
console.log('localStorage token:', localStorage.getItem('token'));
console.log('sessionStorage token:', sessionStorage.getItem('token'));

// Check if tokens are the same
const lsToken = localStorage.getItem('token');
const ssToken = sessionStorage.getItem('token');
console.log('Tokens match:', lsToken === ssToken);

// Decode tokens to see their details
function decodeToken(token) {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      issued: new Date(payload.iat * 1000).toISOString(),
      expires: new Date(payload.exp * 1000).toISOString(),
      user: payload.email,
      userId: payload.userId
    };
  } catch (e) {
    return 'Invalid token';
  }
}

if (lsToken) {
  console.log('localStorage token details:', decodeToken(lsToken));
}

if (ssToken) {
  console.log('sessionStorage token details:', decodeToken(ssToken));
}

// Check for any other storage that might contain tokens
console.log('\n=== OTHER STORAGE LOCATIONS ===');
Object.keys(localStorage).forEach(key => {
  if (key.toLowerCase().includes('token') || key.toLowerCase().includes('auth')) {
    console.log(`localStorage.${key}:`, localStorage.getItem(key));
  }
});

Object.keys(sessionStorage).forEach(key => {
  if (key.toLowerCase().includes('token') || key.toLowerCase().includes('auth')) {
    console.log(`sessionStorage.${key}:`, sessionStorage.getItem(key));
  }
});

// Check cookies
console.log('\n=== COOKIES ===');
document.cookie.split(';').forEach(cookie => {
  const [name, value] = cookie.trim().split('=');
  if (name.toLowerCase().includes('token') || name.toLowerCase().includes('auth')) {
    console.log(`Cookie ${name}:`, value);
  }
});

// Check axios default headers
console.log('\n=== AXIOS HEADERS ===');
if (window.axios?.defaults?.headers?.common?.Authorization) {
  console.log('Global axios Authorization:', window.axios.defaults.headers.common.Authorization);
}

console.log('\n=== END DEBUG ===');
