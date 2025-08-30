const axios = require('axios');

async function test() {
  try {
    console.log('Logging in...');
    const loginRes = await axios.post('http://localhost:8080/api/login', {
      email: 'joseca@symmetricalwolf.com',
      password: 'admin123'
    });
    
    const token = loginRes.data.token;
    console.log('Login successful, token:', token.substring(0, 20) + '...');
    
    console.log('\nTesting contact info endpoint...');
    const contactRes = await axios.get('http://localhost:8080/api/contact/info', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('Contact info response:', contactRes.data);
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    if (error.response?.status === 500) {
      console.log('Full error response:', error.response.data);
    }
  }
}

test();
