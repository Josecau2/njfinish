const axios = require('axios');

async function quickTest() {
  try {
    console.log('Testing login...');
    const response = await axios.post('http://localhost:8080/api/login', {
      email: 'tkk@tkk.com',
      password: 'admin123'
    });
    
    console.log('✅ Login successful!');
    console.log('Role:', `"${response.data.role}"`);
    console.log('Group Type:', response.data.group?.group_type);
    console.log('Has userId:', !!response.data.userId);
    
  } catch (error) {
    console.log('❌ Error:', error.code || error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
    }
  }
}

quickTest();
