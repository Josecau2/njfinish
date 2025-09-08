// Enhanced browser cache cleaner - run in browser console
console.log('🧹 Clearing all authentication data...');

// Clear all token storage
try {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
  console.log('✓ Cleared localStorage and sessionStorage tokens');
} catch (e) {
  console.error('Error clearing storage:', e);
}

// Clear redux-persist data
try {
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('persist:')) {
      localStorage.removeItem(key);
      console.log('✓ Cleared persist key:', key);
    }
  });
} catch (e) {
  console.error('Error clearing persist data:', e);
}

// Clear auth cookies
try {
  document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  document.cookie = 'auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  document.cookie = 'jwt=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  console.log('✓ Cleared auth cookies');
} catch (e) {
  console.error('Error clearing cookies:', e);
}

// Clear axios default headers
try {
  if (window.axios?.defaults?.headers?.common) {
    delete window.axios.defaults.headers.common['Authorization'];
    console.log('✓ Cleared axios headers');
  }
} catch (e) {
  console.error('Error clearing axios headers:', e);
}

// Check current storage state
console.log('\n📊 Current storage state:');
console.log('localStorage token:', localStorage.getItem('token') ? 'EXISTS' : 'CLEARED');
console.log('sessionStorage token:', sessionStorage.getItem('token') ? 'EXISTS' : 'CLEARED');
console.log('localStorage user:', localStorage.getItem('user') ? 'EXISTS' : 'CLEARED');

console.log('\n✅ Cache clearing complete! Please refresh the page and try logging in again.');
