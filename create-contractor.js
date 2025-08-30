const bcrypt = require('bcrypt');
const sequelize = require('./config/db');
const { User, UserGroup } = require('./models/index');

async function createContractorUser() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // First, create or get a contractor group
    let contractorGroup = await UserGroup.findOne({ where: { group_type: 'contractor' } });
    
    if (!contractorGroup) {
      contractorGroup = await UserGroup.create({
        name: 'Test Contractors',
        group_type: 'contractor',
        modules: JSON.stringify(['proposals', 'customers']),
        contractor_settings: JSON.stringify({})
      });
      console.log('✅ Created contractor group:', contractorGroup.id);
    } else {
      console.log('✅ Found existing contractor group:', contractorGroup.id);
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash('contractor123', 10);
    console.log('Password hashed successfully');
    
    // Check if contractor user exists
    const existingUser = await User.findOne({ where: { email: 'contractor@test.com' } });
    
    if (existingUser) {
      // Update existing user
      await existingUser.update({
        password: hashedPassword,
        role: 'Contractor',
        role_id: 3,
        group_id: contractorGroup.id,
        isActive: 'true'
      });
      console.log('✅ Contractor user updated successfully');
    } else {
      // Create new contractor user
      const newUser = await User.create({
        name: 'Test Contractor',
        email: 'contractor@test.com',
        password: hashedPassword,
        role: 'Contractor',
        role_id: 3,
        group_id: contractorGroup.id,
        location: '1',
        isSalesRep: false,
        isDeleted: false,
        isActive: 'true'
      });
      console.log('✅ New contractor user created successfully:', newUser.email);
    }
    
    console.log('   Email: contractor@test.com');
    console.log('   Password: contractor123');
    console.log('   Role: Contractor');
    console.log('   Group ID:', contractorGroup.id);
    
  } catch (error) {
    console.error('❌ Error creating contractor user:', error.message);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

createContractorUser();
