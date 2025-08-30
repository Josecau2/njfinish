const axios = require('axios');

async function testContactEndpoints() {
  try {
    console.log('🔄 Testing contact endpoints...');
    
    // First, login to get a token
    const loginRes = await axios.post('http://localhost:8080/api/login', {
      email: 'joseca@symmetricalwolf.com',
      password: 'admin123'
    });
    
    const token = loginRes.data.token;
    console.log('✅ Login successful');
    
    const headers = { Authorization: `Bearer ${token}` };
    
    // Test GET /api/contact/info
    try {
      const infoRes = await axios.get('http://localhost:8080/api/contact/info', { headers });
      console.log('✅ GET /api/contact/info successful:', infoRes.status);
      console.log('   Response:', infoRes.data);
    } catch (e) {
      console.log('❌ GET /api/contact/info failed:', e.response?.status, e.response?.data);
    }
    
    // Test GET /api/contact/threads
    try {
      const threadsRes = await axios.get('http://localhost:8080/api/contact/threads?page=1', { headers });
      console.log('✅ GET /api/contact/threads successful:', threadsRes.status);
      console.log('   Response:', threadsRes.data);
    } catch (e) {
      console.log('❌ GET /api/contact/threads failed:', e.response?.status, e.response?.data);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testContactEndpoints();
