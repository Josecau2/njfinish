const axios = require('axios');

async function testListThreadsDebug() {
  try {
    console.log('🔄 Testing listThreads with debug info...\n');
    
    // Test as contractor
    console.log('👤 Testing as contractor...');
    const contractorLogin = await axios.post('http://localhost:8080/api/login', {
      email: 'contractor@test.com',
      password: 'contractor123'
    });
    
    const contractorHeaders = { Authorization: `Bearer ${contractorLogin.data.token}` };
    
    const contractorThreads = await axios.get('http://localhost:8080/api/contact/threads?page=1', { 
      headers: contractorHeaders 
    });
    console.log('📋 Contractor sees', contractorThreads.data.data.length, 'threads');
    
    // Test as admin
    console.log('\n👑 Testing as admin...');
    const adminLogin = await axios.post('http://localhost:8080/api/login', {
      email: 'joseca@symmetricalwolf.com',
      password: 'admin123'
    });
    
    const adminHeaders = { Authorization: `Bearer ${adminLogin.data.token}` };
    
    const adminThreads = await axios.get('http://localhost:8080/api/contact/threads?page=1', { 
      headers: adminHeaders 
    });
    console.log('📋 Admin sees', adminThreads.data.data.length, 'threads');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

testListThreadsDebug();
