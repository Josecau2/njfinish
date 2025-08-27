const sequelize = require('./config/db');

async function updateContractorRole() {
  try {
    console.log('🔧 Updating ENUM to use Contractor (capitalized)...\n');
    
    // Update the ENUM to use Contractor (capitalized)
    await sequelize.query(`ALTER TABLE users MODIFY COLUMN role ENUM('User', 'Admin', 'Manufacturers', 'Contractor') DEFAULT 'User';`);
    
    console.log('✅ Successfully updated role ENUM to use Contractor');
    
    // Test user creation
    const axios = require('axios');
    const adminLogin = await axios.post('http://localhost:8080/api/login', {
      email: 'joseca@symmetricalwolf.com',
      password: 'admin123'
    });
    
    const headers = { Authorization: `Bearer ${adminLogin.data.token}` };
    
    const userResponse = await axios.post('http://localhost:8080/api/users', {
      name: 'Capitalized Test Contractor',
      email: 'capitalized.test@example.com',
      password: 'contractor123',
      userGroup: 16,
      isSalesRep: false,
      location: 'Test Location'
    }, { headers });
    
    console.log('\n✅ User creation response:');
    console.log('  User Role:', userResponse.data.user.role);
    
    const { User } = require('./models');
    const createdUser = await User.findByPk(userResponse.data.user.id);
    
    console.log('\n✅ Database verification:');
    console.log('  User.role in DB:', createdUser.role);
    
    if (createdUser.role === 'Contractor') {
      console.log('\n🎉 SUCCESS! Role is now properly capitalized as Contractor');
    }
    
    // Test login
    console.log('\n🧪 Testing login...');
    const loginResponse = await axios.post('http://localhost:8080/api/login', {
      email: 'capitalized.test@example.com',
      password: 'contractor123'
    });
    
    console.log('✅ Login response role:', loginResponse.data.role);
    
  } catch (error) {
    console.error('❌ Operation failed:', error.message);
  } finally {
    process.exit(0);
  }
}

updateContractorRole();
