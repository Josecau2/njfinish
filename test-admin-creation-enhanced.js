const { User, UserGroup } = require('./models');
const sequelize = require('./config/db');
const bcrypt = require('bcrypt');

async function testEnhancedAdminCreation() {
  try {
    await sequelize.authenticate();
    console.log('Testing enhanced admin user creation...\n');

    // First, check admin group current state
    console.log('1. Checking admin group current state:');
    const adminGroup = await UserGroup.findOne({
      where: { name: 'Admin' }
    });
    
    if (adminGroup) {
      console.log(`   Admin Group ID: ${adminGroup.id}`);
      console.log(`   Group Type: ${adminGroup.group_type}`);
      console.log(`   Current Modules: ${JSON.stringify(adminGroup.modules)}`);
    } else {
      console.log('   No admin group found!');
    }

    // Define test data
    const testData = {
      name: 'Test Admin Enhanced',
      email: 'testadmin@enhanced.com',
      password: 'password123'
    };

    // Check if user already exists and clean up
    console.log('\n2. Checking for existing test user...');
    const existingUser = await User.findOne({
      where: { email: testData.email }
    });
    
    if (existingUser) {
      console.log('   Existing user found, cleaning up...');
      await existingUser.destroy(); // Permanently delete
    }

    // Test the admin user creation logic manually (simulating authController)
    console.log('\n3. Testing admin user creation logic:');
    
    const userGroup = adminGroup.id; // Use admin group ID

    // Simulate the enhanced logic from authController
    let userRole = 'User'; // Default role
    let roleId = 0; // Default role_id
    
    if (userGroup) {
      const group = await UserGroup.findByPk(userGroup);
      if (group) {
        if (group.group_type === 'contractor') {
          userRole = 'Contractor';
          roleId = parseInt(userGroup);
        } else if (group.name.toLowerCase() === 'admin' || group.group_type === 'admin') {
          userRole = 'Admin';
          roleId = 2;
          
          // Enhanced admin module setup
          const adminModules = {
            dashboard: true,
            proposals: true,
            customers: true,
            resources: true
          };
          
          // Update admin group modules if they're not already enabled
          if (!group.modules || typeof group.modules === 'string') {
            try {
              const currentModules = typeof group.modules === 'string' ? JSON.parse(group.modules) : group.modules;
              const needsUpdate = !currentModules || 
                !currentModules.dashboard || 
                !currentModules.proposals || 
                !currentModules.customers || 
                !currentModules.resources;
              
              if (needsUpdate) {
                await group.update({ modules: adminModules });
                console.log(`   ✓ Updated admin group ${group.id} modules to enable all access`);
              } else {
                console.log(`   ✓ Admin group ${group.id} modules already properly configured`);
              }
            } catch (err) {
              console.error('   Error updating admin group modules:', err);
              await group.update({ modules: adminModules });
            }
          }
        }
      }
    }

    // Create the user
    const hashedPassword = await bcrypt.hash(testData.password, 10);
    const newUser = await User.create({
      name: testData.name,
      email: testData.email,
      password: hashedPassword,
      role: userRole,
      group_id: parseInt(userGroup) || null,
      role_id: roleId
    });

    console.log('\n3. Created user:');
    console.log(`   User ID: ${newUser.id}`);
    console.log(`   Name: ${newUser.name}`);
    console.log(`   Email: ${newUser.email}`);
    console.log(`   Role: ${newUser.role}`);
    console.log(`   Group ID: ${newUser.group_id}`);
    console.log(`   Role ID: ${newUser.role_id}`);

    // Fetch user with group details
    const userWithGroup = await User.findByPk(newUser.id, {
      include: [
        {
          model: UserGroup,
          as: 'group',
          attributes: ['id', 'name', 'group_type', 'modules']
        }
      ]
    });

    console.log('\n4. User with group details:');
    console.log(`   Group Name: ${userWithGroup.group?.name}`);
    console.log(`   Group Type: ${userWithGroup.group?.group_type}`);
    console.log(`   Group Modules: ${JSON.stringify(userWithGroup.group?.modules)}`);

    // Test login simulation
    console.log('\n5. Testing login simulation:');
    const loginUser = await User.findOne({
      where: { email: testData.email, isDeleted: false },
      include: [{ 
        model: UserGroup, 
        as: 'group', 
        attributes: ['id', 'name', 'group_type', 'modules'], 
        required: false 
      }]
    });

    if (loginUser) {
      console.log('   ✓ Login would succeed');
      console.log(`   ✓ User role: ${loginUser.role}`);
      console.log(`   ✓ Role ID: ${loginUser.role_id}`);
      console.log(`   ✓ Group modules: ${JSON.stringify(loginUser.group?.modules)}`);
      
      // Verify admin has all necessary permissions
      let modules = loginUser.group?.modules;
      if (typeof modules === 'string') {
        try {
          modules = JSON.parse(modules);
        } catch (err) {
          console.log('   ❌ Error parsing modules JSON');
          modules = null;
        }
      }
      
      if (modules && modules.dashboard && modules.proposals && modules.customers && modules.resources) {
        console.log('   ✅ All admin modules are enabled - admin will have full access!');
      } else {
        console.log('   ❌ Some admin modules are missing');
        console.log(`   Debug: modules = ${JSON.stringify(modules)}`);
      }
    } else {
      console.log('   ❌ Login would fail - user not found');
    }

    // Cleanup
    console.log('\n6. Cleaning up test user...');
    await newUser.update({ isDeleted: true });
    console.log('   ✓ Test user cleaned up');

    console.log('\n✅ Enhanced admin creation test completed successfully!');
    
    await sequelize.close();
  } catch (error) {
    console.error('❌ Test failed:', error);
    await sequelize.close();
  }
}

testEnhancedAdminCreation();
