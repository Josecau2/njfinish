const jwt = require('jsonwebtoken');

// Simple script to validate a JWT token format
function validateToken(token) {
  console.log('Token to validate:');
  console.log(token.substring(0, 50) + '...');
  console.log('Token length:', token.length);

  try {
    // Try to decode without verification first
    const parts = token.split('.');
    console.log('Token parts:', parts.length);

    if (parts.length !== 3) {
      console.log('❌ Invalid JWT format - should have 3 parts');
      return false;
    }

    // Try to decode header
    try {
      const header = JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')));
      console.log('✅ Header decoded:', header);
    } catch (e) {
      console.log('❌ Failed to decode header:', e.message);
    }

    // Try to decode payload
    try {
      let payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      while (payload.length % 4 !== 0) payload += '=';
      const decoded = JSON.parse(atob(payload));
      console.log('✅ Payload decoded:', decoded);
      console.log('Token expires:', new Date(decoded.exp * 1000));
      console.log('Current time:', new Date());
      console.log('Is expired:', decoded.exp < Math.floor(Date.now() / 1000));
    } catch (e) {
      console.log('❌ Failed to decode payload:', e.message);
    }

    // Try to verify with JWT_SECRET
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('✅ Token verification successful:', decoded);
      return true;
    } catch (e) {
      console.log('❌ Token verification failed:', e.message);
      return false;
    }

  } catch (error) {
    console.log('❌ General token validation error:', error.message);
    return false;
  }
}

// Example usage - replace with actual token from localStorage
const exampleToken = process.argv[2];
if (exampleToken) {
  validateToken(exampleToken);
} else {
  console.log('Usage: node debug-token.js "your_jwt_token_here"');
  console.log('You can get the token from localStorage in browser dev tools');
}
