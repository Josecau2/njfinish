// Browser test - paste this into the browser console after logging in

console.log('=== BROWSER AUTH TEST ===');

// Check if token exists
const token = localStorage.getItem('token');
console.log('Token exists:', !!token);

if (token) {
  // Decode token to check expiration
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Date.now() / 1000;
    const timeLeft = payload.exp - now;

    console.log('Token info:', {
      issuedAt: new Date(payload.iat * 1000).toISOString(),
      expiresAt: new Date(payload.exp * 1000).toISOString(),
      timeLeftMinutes: Math.round(timeLeft / 60),
      isExpired: timeLeft <= 0
    });
  } catch (e) {
    console.error('Failed to decode token:', e);
  }
}

// Test API call
fetch('/api/auth/ping', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(response => {
  console.log('API test response status:', response.status);
  if (response.status === 401) {
    console.error('❌ Still getting 401 - token issue persists');
  } else if (response.status === 200) {
    console.log('✅ API call successful - token is working');
  }
  return response.json();
})
.then(data => console.log('API response:', data))
.catch(err => console.error('API call failed:', err));
