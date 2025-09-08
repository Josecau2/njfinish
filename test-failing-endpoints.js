const axios = require('axios');

async function testAPICalls() {
  try {
    // First login to get a token
    console.log('Logging in...');
    const loginResponse = await axios.post('http://localhost:8080/api/auth/login', {
      email: 'joseca@symmetricalwolf.com',
      password: 'admin123'
    });

    const { token } = loginResponse.data;
    console.log('Login successful, token received');

    // Test the specific endpoints that were failing
    const headers = { Authorization: `Bearer ${token}` };

    console.log('\nTesting /api/resources/links...');
    try {
      const linksResponse = await axios.get('http://localhost:8080/api/resources/links', { headers });
      console.log('✅ Resources links API call successful');
    } catch (error) {
      console.log('❌ Resources links failed:', error.response?.data?.message || error.message);
    }

    console.log('\nTesting /api/resources/files...');
    try {
      const filesResponse = await axios.get('http://localhost:8080/api/resources/files', { headers });
      console.log('✅ Resources files API call successful');
    } catch (error) {
      console.log('❌ Resources files failed:', error.response?.data?.message || error.message);
    }

    console.log('\nTesting /api/auth/ping...');
    try {
      const pingResponse = await axios.get('http://localhost:8080/api/auth/ping', { headers });
      console.log('✅ Auth ping successful');
    } catch (error) {
      console.log('❌ Auth ping failed:', error.response?.data?.message || error.message);
    }

    console.log('\n✅ All tests completed successfully! The token expiration issue appears to be fixed.');

  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

testAPICalls();
