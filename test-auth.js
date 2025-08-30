const axios = require('axios');

async function testAuth() {
  try {
    console.log('Testing basic server connection...');
    const testRes = await axios.get('http://localhost:8080/api/settings/customization/pdf');
    console.log('Server is reachable, status:', testRes.status);
  } catch (error) {
    console.error('Server connection error:', error.code, error.message);
    return;
  }

  try {
    console.log('Testing login...');
    const response = await axios.post('http://localhost:8080/api/login', {
      email: 'joseca@symmetricalwolf.com',
      password: 'admin123'
    });
    console.log('Login successful! Status:', response.status);
    console.log('Token received:', response.data.token.substring(0, 20) + '...');
    return response.data.token;
  } catch (error) {
    console.error('Login error:', error.response?.status, error.response?.data || error.message);
  }
}

testAuth();
