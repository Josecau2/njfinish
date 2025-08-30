const axios = require('axios');

async function checkUserRole() {
  try {
    console.log('🔄 Checking current user role...\n');
    
    // Login as the admin user
    const loginRes = await axios.post('http://localhost:8080/api/login', {
      email: 'joseca@symmetricalwolf.com',
      password: 'admin123'
    });
    
    console.log('📋 Login response data:');
    console.log('   userId:', loginRes.data.userId);
    console.log('   name:', loginRes.data.name);
    console.log('   role:', loginRes.data.role);
    console.log('   role_id:', loginRes.data.role_id);
    console.log('   group_id:', loginRes.data.group_id);
    
    const token = loginRes.data.token;
    const headers = { Authorization: `Bearer ${token}` };
    
    // Get current user info from /api/me
    const meRes = await axios.get('http://localhost:8080/api/me', { headers });
    console.log('\n📋 /api/me response data:');
    console.log('   id:', meRes.data.id);
    console.log('   name:', meRes.data.name);
    console.log('   role:', meRes.data.role);
    console.log('   role_id:', meRes.data.role_id);
    console.log('   group_id:', meRes.data.group_id);
    console.log('   group info:', meRes.data.group);
    
    // Test the isAdmin logic
    const user = meRes.data;
    const isAdminCheck1 = user && (user.role === 'Admin' || user.role_id === 1);
    const isAdminCheck2 = user && (user.role === 'Admin' || user.role_id === 2);
    
    console.log('\n🔍 Admin check results:');
    console.log('   user.role === "Admin":', user.role === 'Admin');
    console.log('   user.role_id === 1:', user.role_id === 1);
    console.log('   user.role_id === 2:', user.role_id === 2);
    console.log('   isAdmin (old logic - role_id === 1):', isAdminCheck1);
    console.log('   isAdmin (new logic - role_id === 2):', isAdminCheck2);
    
  } catch (error) {
    console.error('❌ Error checking user role:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

checkUserRole();
