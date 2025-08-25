// Force refresh user data utility
// Add this to browser console to clear cached data

console.log('🔄 Clearing cached user data...');

// Clear localStorage
localStorage.removeItem('user');
localStorage.removeItem('token');

// Clear sessionStorage
sessionStorage.removeItem('user');
sessionStorage.removeItem('token');

console.log('✅ Cached data cleared!');
console.log('📱 Please refresh the page and login again to get fresh user data with role: "contractor"');

// Auto refresh
setTimeout(() => {
  window.location.reload();
}, 1000);
