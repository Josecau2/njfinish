// Debug helper to check authentication state
// Run this in browser console to debug auth issues

console.log('=== AUTH DEBUG INFO ===');
console.log('Token in localStorage:', localStorage.getItem('token'));
console.log('User in localStorage:', localStorage.getItem('user'));

// Try to decode the JWT token if it exists
const token = localStorage.getItem('token');
if (token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    
    const decoded = JSON.parse(jsonPayload);
    console.log('Decoded token payload:', decoded);
    
    const now = Math.floor(Date.now() / 1000);
    console.log('Token expires at:', new Date(decoded.exp * 1000));
    console.log('Token is expired:', decoded.exp < now);
    console.log('Time until expiry (minutes):', Math.floor((decoded.exp - now) / 60));
  } catch (e) {
    console.error('Failed to decode token:', e);
  }
}

// Test the API endpoint directly
const testNotifications = async () => {
  try {
    const response = await fetch('/api/notifications/unread-count', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('API test response status:', response.status);
    const data = await response.json();
    console.log('API test response data:', data);
  } catch (error) {
    console.error('API test failed:', error);
  }
};

if (token) {
  testNotifications();
}

console.log('=== END AUTH DEBUG ===');
