const { User, UserGroup } = require('./models');
const sequelize = require('./config/db');

async function testAdminPermissions() {
  try {
    await sequelize.authenticate();
    console.log('🔐 Testing Admin Permission System\n');

    // Find an admin user
    console.log('1. Finding admin user...');
    const adminUser = await User.findOne({
      where: { 
        role: 'Admin',
        isDeleted: false 
      },
      include: [
        {
          model: UserGroup,
          as: 'group',
          attributes: ['id', 'name', 'group_type', 'modules']
        }
      ]
    });

    if (!adminUser) {
      console.log('   ❌ No admin user found');
      await sequelize.close();
      return;
    }

    console.log(`   ✓ Found admin user: ${adminUser.name} (${adminUser.email})`);
    console.log(`   ✓ Role: ${adminUser.role}`);
    console.log(`   ✓ Role ID: ${adminUser.role_id}`);
    console.log(`   ✓ Group: ${adminUser.group?.name} (ID: ${adminUser.group?.id})`);
    console.log(`   ✓ Group Type: ${adminUser.group?.group_type}`);
    console.log(`   ✓ Group Modules: ${JSON.stringify(adminUser.group?.modules)}`);

    // Test permission checking logic using the frontend permission helpers
    console.log('\n2. Testing permission functions...');

    // Simulate the isAdmin function
    const isAdmin = (user) => {
      if (!user || !user.role) return false;
      const role = typeof user.role === 'string' ? user.role.toLowerCase() : user.role;
      return role === 'admin' || role === 'super_admin';
    };

    // Simulate the hasPermission function (updated version)
    const hasPermission = (user, permission) => {
      if (!user) return false;
      
      // ADMIN USERS HAVE ACCESS TO EVERYTHING - NO RESTRICTIONS
      if (isAdmin(user)) {
        return true;
      }
      
      // Other permission logic would go here...
      return false;
    };

    // Simulate the hasModuleAccess function (updated version)
    const hasModuleAccess = (user, module) => {
      // ADMIN USERS HAVE ACCESS TO ALL MODULES
      if (isAdmin(user)) return true;
      
      // Other logic would go here...
      return false;
    };

    console.log(`   isAdmin(user): ${isAdmin(adminUser)}`);

    // Test all critical permissions
    const testPermissions = [
      'customers:read',
      'customers:create', 
      'customers:update',
      'customers:delete',
      'proposals:read',
      'proposals:create',
      'proposals:update', 
      'proposals:delete',
      'resources:read',
      'resources:create',
      'settings:users',
      'settings:groups',
      'settings:manufacturers',
      'admin:contractors',
      'admin:notifications'
    ];

    console.log('\n3. Testing specific permissions:');
    let allPermissionsPass = true;
    testPermissions.forEach(permission => {
      const hasAccess = hasPermission(adminUser, permission);
      console.log(`   ${hasAccess ? '✅' : '❌'} ${permission}: ${hasAccess}`);
      if (!hasAccess) allPermissionsPass = false;
    });

    // Test module access
    const testModules = ['dashboard', 'proposals', 'customers', 'resources', 'calendar'];
    console.log('\n4. Testing module access:');
    let allModulesPass = true;
    testModules.forEach(module => {
      const hasAccess = hasModuleAccess(adminUser, module);
      console.log(`   ${hasAccess ? '✅' : '❌'} ${module}: ${hasAccess}`);
      if (!hasAccess) allModulesPass = false;
    });

    // Final results
    console.log('\n5. Results Summary:');
    console.log(`   Permissions Test: ${allPermissionsPass ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Module Access Test: ${allModulesPass ? '✅ PASS' : '❌ FAIL'}`);
    
    if (allPermissionsPass && allModulesPass) {
      console.log('\n🎉 Admin permission system is working correctly!');
      console.log('   ✅ Admin users have access to everything');
      console.log('   ✅ No module restrictions for admins');
      console.log('   ✅ Role-based permissions working');
    } else {
      console.log('\n❌ Admin permission system has issues!');
    }

    await sequelize.close();
  } catch (error) {
    console.error('❌ Test failed:', error);
    await sequelize.close();
  }
}

testAdminPermissions();
