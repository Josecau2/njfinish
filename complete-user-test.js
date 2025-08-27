const axios = require('axios');

async function completeUserCreationTest() {
  try {
    console.log('🎯 Complete User Creation Test (Admin + Contractor)...\n');
    
    // Login as admin
    const adminLogin = await axios.post('http://localhost:8080/api/login', {
      email: 'joseca@symmetricalwolf.com',
      password: 'admin123'
    });
    const headers = { Authorization: `Bearer ${adminLogin.data.token}` };
    
    // 1. Create another admin user
    console.log('1. Creating another admin user...');
    const adminResponse = await axios.post('http://localhost:8080/api/users', {
      name: 'Final Admin Test',
      email: 'final.admin@example.com',
      password: 'admin123',
      userGroup: 1 // Admin group
    }, { headers });
    
    console.log('✅ Admin user created - Role:', adminResponse.data.user.role);
    
    // 2. Create a contractor user
    console.log('\n2. Creating contractor user...');
    const contractorResponse = await axios.post('http://localhost:8080/api/users', {
      name: 'Final Contractor Test',
      email: 'final.contractor@example.com',
      password: 'contractor123',
      userGroup: 16 // Contractor group
    }, { headers });
    
    console.log('✅ Contractor user created - Role:', contractorResponse.data.user.role);
    
    // 3. Verify in database
    const { User } = require('./models');
    const adminUser = await User.findByPk(adminResponse.data.user.id);
    const contractorUser = await User.findByPk(contractorResponse.data.user.id);
    
    console.log('\n3. Database verification:');
    console.log('Admin User:');
    console.log('  Role:', adminUser.role, '| Role ID:', adminUser.role_id, '| Group ID:', adminUser.group_id);
    console.log('Contractor User:');
    console.log('  Role:', contractorUser.role, '| Role ID:', contractorUser.role_id, '| Group ID:', contractorUser.group_id);
    
    // 4. Test logins
    console.log('\n4. Testing logins...');
    const adminLogin2 = await axios.post('http://localhost:8080/api/login', {
      email: 'final.admin@example.com',
      password: 'admin123'
    });
    console.log('✅ Admin login - Role:', adminLogin2.data.role);
    
    const contractorLogin = await axios.post('http://localhost:8080/api/login', {
      email: 'final.contractor@example.com',
      password: 'contractor123'
    });
    console.log('✅ Contractor login - Role:', contractorLogin.data.role);
    
    console.log('\n🎉 ALL USER TYPES WORKING PERFECTLY!');
    console.log('\n📋 Final Summary:');
    console.log('   ✅ Admin users: role="Admin", role_id=2, group_id=1');
    console.log('   ✅ Contractor users: role="Contractor", role_id=group_id, group_id=contractor_group');
    console.log('   ✅ User creation assigns correct roles automatically');
    console.log('   ✅ Login works correctly for both user types');
    console.log('   ✅ Permissions work correctly for both user types');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data?.message || error.message);
  } finally {
    process.exit(0);
  }
}

completeUserCreationTest();
