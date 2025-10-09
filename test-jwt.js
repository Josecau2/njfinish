const jwt = require('jsonwebtoken');
require('dotenv').config();

// Test token generation and verification
console.log('Testing JWT Configuration...');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');
console.log('JWT_EXPIRES_IN:', process.env.JWT_EXPIRES_IN || 'NOT SET (using default 8h)');

// Create a test token
const testPayload = {
  id: 1,
  email: 'test@example.com',
  name: 'Test User',
  role: 'admin'
};

try {
  const token = jwt.sign(testPayload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    algorithm: 'HS256'
  });

  console.log('\n✅ Token created successfully');
  console.log('Token length:', token.length);

  // Decode to check contents
  const decoded = jwt.decode(token);
  console.log('\nToken contents:');
  console.log('- Issued at:', new Date(decoded.iat * 1000).toISOString());
  console.log('- Expires at:', new Date(decoded.exp * 1000).toISOString());
  console.log('- Time until expiry:', Math.round((decoded.exp - Date.now()/1000)/3600), 'hours');

  // Verify the token
  const verified = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
  console.log('\n✅ Token verification successful');
  console.log('Verified payload:', verified);

} catch (error) {
  console.error('\n❌ JWT Error:', error.message);
}
