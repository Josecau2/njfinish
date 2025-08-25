// Debug script to check current user permissions
const jwt = require('jsonwebtoken');

// Replace with your actual JWT token from localStorage in browser
const token = 'your_jwt_token_here';

try {
  const decoded = jwt.decode(token);
  console.log('Decoded JWT token:');
  console.log(JSON.stringify(decoded, null, 2));
} catch (error) {
  console.error('Error decoding token:', error);
}

console.log('\nNote: Replace "your_jwt_token_here" with your actual JWT token from browser localStorage');
console.log('To get your token:');
console.log('1. Open browser developer tools (F12)');
console.log('2. Go to Application/Storage tab');
console.log('3. Look for localStorage');
console.log('4. Find the "token" key');
console.log('5. Copy the value and replace it in this script');
