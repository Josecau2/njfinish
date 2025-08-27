const sequelize = require('./config/db');

async function addContractorRole() {
  try {
    console.log('🔧 Adding contractor to role ENUM...\n');
    
    // Add 'contractor' to the role ENUM
    await sequelize.query(`ALTER TABLE users MODIFY COLUMN role ENUM('User', 'Admin', 'Manufacturers', 'contractor') DEFAULT 'User';`);
    
    console.log('✅ Successfully added contractor to role ENUM');
    
    // Test the update
    console.log('\n🧪 Testing user creation with updated ENUM...');
    
    const axios = require('axios');
    
    // Login as admin
    const adminLogin = await axios.post('http://localhost:8080/api/login', {
      email: 'joseca@symmetricalwolf.com',
      password: 'admin123'
    });
    
    const headers = { Authorization: `Bearer ${adminLogin.data.token}` };
    
    // Create a contractor user to test
    const userResponse = await axios.post('http://localhost:8080/api/users', {
      name: 'ENUM Test Contractor',
      email: 'enum.test.contractor@example.com',
      password: 'contractor123',
      userGroup: 16,
      isSalesRep: false,
      location: 'ENUM Test Location'
    }, { headers });
    
    console.log('✅ User creation response:');
    console.log('  User ID:', userResponse.data.user.id);
    console.log('  User Role in API:', userResponse.data.user.role);
    
    // Check database
    const { User, UserGroup } = require('./models');
    const createdUser = await User.findByPk(userResponse.data.user.id, {
      include: [{ model: UserGroup, as: 'group' }]
    });
    
    console.log('\n✅ Database verification:');
    console.log('  User.role in DB:', createdUser.role);
    console.log('  User.role_id:', createdUser.role_id);
    console.log('  User.group_id:', createdUser.group_id);
    
    if (createdUser.role === 'contractor') {
      console.log('\n🎉 SUCCESS! Role assignment is now working correctly!');
    } else {
      console.log('\n❌ Role assignment still not working correctly');
    }
    
  } catch (error) {
    console.error('❌ Operation failed:', error.message);
  } finally {
    process.exit(0);
  }
}

addContractorRole();
