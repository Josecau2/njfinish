const axios = require('axios');

async function testLogin() {
  try {
    const response = await axios.post('http://localhost:8080/api/login', {
      email: 'tkk@tkk.com',
      password: 'admin123'
    });
    
    console.log('✅ Login Response:');
    console.log('Role:', `"${response.data.role}"`);
    console.log('Group Type:', response.data.group?.group_type);
    console.log('Group Name:', response.data.group?.name);
    console.log('User ID:', response.data.userId);
    
    if (response.data.role === 'contractor') {
      console.log('🎉 SUCCESS: Role correctly set to contractor!');
    } else {
      console.log('❌ Role issue:', `Expected "contractor", got "${response.data.role}"`);
    }
    
    console.log('\nFull response:');
    console.log(JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('❌ Login failed:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
    }
  }
}

testLogin();
