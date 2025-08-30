const axios = require('axios');

async function testUserRoles() {
  try {
    console.log('🔄 Testing user roles...');
    
    // Login as admin
    const loginRes = await axios.post('http://localhost:8080/api/login', {
      email: 'joseca@symmetricalwolf.com',
      password: 'admin123'
    });
    
    const token = loginRes.data.token;
    console.log('✅ Login successful');
    console.log('📋 User data from login:', {
      userId: loginRes.data.userId,
      name: loginRes.data.name,
      role: loginRes.data.role,
      role_id: loginRes.data.role_id,
      group_id: loginRes.data.group_id
    });
    
    const headers = { Authorization: `Bearer ${token}` };
    
    // Test current user endpoint
    try {
      const meRes = await axios.get('http://localhost:8080/api/me', { headers });
      console.log('📋 User data from /api/me:', {
        id: meRes.data.id,
        name: meRes.data.name,
        role: meRes.data.role,
        role_id: meRes.data.role_id,
        group_id: meRes.data.group_id
      });
    } catch (e) {
      console.log('❌ GET /api/me failed:', e.response?.status, e.response?.data);
    }
    
    // Create a test thread as a non-admin user would
    try {
      const threadRes = await axios.post('http://localhost:8080/api/contact/threads', {
        subject: 'Test Message from Admin',
        message: 'This is a test message to check if threads are created properly'
      }, { headers });
      console.log('✅ Thread creation successful:', threadRes.data);
    } catch (e) {
      console.log('❌ Thread creation failed:', e.response?.status, e.response?.data);
    }
    
    // List threads to see what shows up
    try {
      const threadsRes = await axios.get('http://localhost:8080/api/contact/threads?page=1', { headers });
      console.log('✅ Thread listing successful');
      console.log('📋 Threads found:', threadsRes.data.data.length);
      threadsRes.data.data.forEach((thread, i) => {
        console.log(`   ${i+1}. "${thread.subject}" by user_id:${thread.user_id} (unread: ${thread.unreadCount})`);
      });
    } catch (e) {
      console.log('❌ Thread listing failed:', e.response?.status, e.response?.data);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testUserRoles();
