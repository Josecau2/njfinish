const axios = require('axios');

async function testUnauthenticated() {
  try {
    console.log('Testing unauthenticated endpoint...');
    const res = await axios.get('http://localhost:8080/api/settings/customization/pdf');
    console.log('PDF customization works:', res.status, Object.keys(res.data));
  } catch (error) {
    console.error('PDF customization error:', error.response?.status, error.response?.data || error.message);
  }

  try {
    console.log('Testing contact info without auth...');
    const res = await axios.get('http://localhost:8080/api/contact/info');
    console.log('Contact info response:', res.data);
  } catch (error) {
    console.error('Contact info error:', error.response?.status, error.response?.data || error.message);
  }
}

testUnauthenticated();
