const axios = require('axios');

async function testLogin() {
  try {
    console.log('Testing login endpoint...');

    const response = await axios.post('http://localhost:8080/api/auth/login', {
      email: 'admin@example.com', // Use whatever admin credentials you have
      password: 'admin123'        // Adjust this to your actual admin password
    });

    console.log('✅ Login successful!');
    console.log('Response status:', response.status);
    console.log('Token received:', response.data.token ? 'YES' : 'NO');

    if (response.data.token) {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.decode(response.data.token);
      console.log('Token expires at:', new Date(decoded.exp * 1000).toISOString());
      console.log('Time until expiry:', Math.round((decoded.exp - Date.now()/1000)/3600), 'hours');
    }

    // Test an authenticated endpoint
    console.log('\nTesting authenticated endpoint...');
    const authResponse = await axios.get('http://localhost:8080/api/auth/ping', {
      headers: {
        'Authorization': `Bearer ${response.data.token}`
      }
    });

    console.log('✅ Authenticated request successful!');
    console.log('Auth response:', authResponse.data);

  } catch (error) {
    console.error('❌ Login test failed:', error.response?.data || error.message);
  }
}

testLogin();
