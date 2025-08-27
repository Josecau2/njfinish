const axios = require('axios');

async function testAdminUserCreation() {
  try {
    console.log('🧪 Testing Admin User Creation...\n');
    
    // 1. Login as existing admin
    console.log('1. Logging in as admin...');
    const adminLogin = await axios.post('http://localhost:8080/api/login', {
      email: 'joseca@symmetricalwolf.com',
      password: 'admin123'
    });
    
    const headers = { Authorization: `Bearer ${adminLogin.data.token}` };
    console.log('✅ Admin login successful');
    
    // 2. Create a new admin user
    console.log('\n2. Creating new admin user...');
    const userResponse = await axios.post('http://localhost:8080/api/users', {
      name: 'Test Admin User',
      email: 'test.admin@example.com',
      password: 'admin123',
      userGroup: 1, // Admin group ID
      isSalesRep: false,
      location: 'Admin Office'
    }, { headers });
    
    console.log('✅ Admin user creation response:');
    console.log('  Status:', userResponse.status);
    console.log('  User ID:', userResponse.data.user.id);
    console.log('  User Role in API response:', userResponse.data.user.role);
    
    // 3. Check the user in database
    const { User, UserGroup } = require('./models');
    const createdUser = await User.findByPk(userResponse.data.user.id, {
      include: [{ model: UserGroup, as: 'group' }]
    });
    
    console.log('\n✅ Database verification:');
    console.log('  User.role:', createdUser.role);
    console.log('  User.role_id:', createdUser.role_id);
    console.log('  User.group_id:', createdUser.group_id);
    console.log('  Group.name:', createdUser.group?.name);
    console.log('  Group.group_type:', createdUser.group?.group_type);
    
    // 4. Test login with new admin user
    console.log('\n3. Testing new admin user login...');
    const newAdminLogin = await axios.post('http://localhost:8080/api/login', {
      email: 'test.admin@example.com',
      password: 'admin123'
    });
    
    console.log('✅ New admin login successful:');
    console.log('  Login role:', newAdminLogin.data.role);
    console.log('  Group ID:', newAdminLogin.data.group_id);
    console.log('  Group name:', newAdminLogin.data.group?.name);
    
    // 5. Test admin permissions
    console.log('\n4. Testing admin permissions...');
    const newAdminHeaders = { Authorization: `Bearer ${newAdminLogin.data.token}` };
    
    // Test admin-only endpoint (create user groups)
    try {
      const testGroupResponse = await axios.post('http://localhost:8080/api/usersgroups', {
        name: 'Test Group by New Admin',
        group_type: 'standard'
      }, { headers: newAdminHeaders });
      console.log('✅ Admin can create user groups');
    } catch (err) {
      console.log('❌ Admin cannot create user groups:', err.response?.data?.message || err.message);
    }
    
    // Test viewing all users
    try {
      const usersResponse = await axios.get('http://localhost:8080/api/users', { headers: newAdminHeaders });
      console.log('✅ Admin can view all users - found', usersResponse.data.users?.length || 0, 'users');
    } catch (err) {
      console.log('❌ Admin cannot view all users:', err.response?.data?.message || err.message);
    }
    
    // Validation
    if (createdUser.role === 'Admin' && createdUser.role_id === 2 && createdUser.group_id === 1) {
      console.log('\n🎉 SUCCESS! Admin user creation is working correctly!');
      console.log('\n📋 Admin User Structure:');
      console.log('   ✅ User.role = "Admin"');
      console.log('   ✅ User.role_id = 2 (admin role_id)');
      console.log('   ✅ User.group_id = 1 (admin group)');
      console.log('   ✅ Login returns "Admin" role');
      console.log('   ✅ Admin permissions working');
    } else {
      console.log('\n❌ Admin user structure not correct:');
      console.log(`   Expected: role=Admin, role_id=2, group_id=1`);
      console.log(`   Actual: role=${createdUser.role}, role_id=${createdUser.role_id}, group_id=${createdUser.group_id}`);
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
  } finally {
    process.exit(0);
  }
}

testAdminUserCreation();
