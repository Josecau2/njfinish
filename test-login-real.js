const axios = require('axios');
const jwt = require('jsonwebtoken');

async function testLogin() {
  try {
    console.log('Testing login with real credentials...');

    const response = await axios.post('http://localhost:8080/api/auth/login', {
      email: 'joseca@symmetricalwolf.com',
      password: 'admin123'
    });

    console.log('Login successful!');
    console.log('Response status:', response.status);

    const { token, userId, name, role } = response.data;
    console.log('User info:', { userId, name, role });

    // Decode the token to check expiration
    const decoded = jwt.decode(token);
    console.log('Token info:', {
      issuedAt: new Date(decoded.iat * 1000).toISOString(),
      expiresAt: new Date(decoded.exp * 1000).toISOString(),
      timeUntilExpiry: Math.round((decoded.exp * 1000 - Date.now()) / 1000 / 60) + ' minutes'
    });

    // Test an API call with the token
    console.log('\nTesting API call with token...');
    const apiResponse = await axios.get('http://localhost:8080/api/auth/ping', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log('API call successful:', apiResponse.data);

  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.log('This suggests the credentials are wrong or the user doesn\'t exist');
    }
  }
}

testLogin();
