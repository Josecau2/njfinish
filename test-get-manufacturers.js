const axios = require('axios');

async function testManufacturerGet() {
  try {
    console.log('Testing GET /api/manufacturers...');
    
    const response = await axios.get('http://localhost:8080/api/manufacturers');
    
    console.log('GET Response:');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('Error fetching manufacturers:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data || error.message);
    console.error('Error details:', error.code);
  }
}

testManufacturerGet();
