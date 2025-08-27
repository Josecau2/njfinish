const { UserGroup } = require('./models');
const sequelize = require('./config/db');

async function testUserGroupData() {
  try {
    await sequelize.authenticate();
    console.log('🧪 Testing User Group Data Structure\n');

    // Get all user groups
    console.log('1. Fetching all user groups...');
    const groups = await UserGroup.findAll({
      attributes: ['id', 'name', 'group_type', 'modules']
    });

    console.log(`   Found ${groups.length} user groups:`);
    groups.forEach(group => {
      console.log(`   - ID: ${group.id}, Name: "${group.name}", Type: ${group.group_type}`);
    });

    // Check contractor groups specifically
    console.log('\n2. Contractor groups:');
    const contractorGroups = groups.filter(g => g.group_type === 'contractor');
    console.log(`   Found ${contractorGroups.length} contractor groups:`);
    contractorGroups.forEach(group => {
      console.log(`   - ID: ${group.id}, Name: "${group.name}"`);
    });

    // Check what the frontend API would return
    console.log('\n3. Simulating frontend API call (userGroupController)...');
    // This simulates what the frontend gets from the API
    const frontendResponse = groups.map(group => ({
      id: group.id,
      name: group.name,
      group_type: group.group_type,
      modules: group.modules
    }));

    console.log('   Frontend would receive this data structure:');
    frontendResponse.forEach(group => {
      console.log(`   - { id: ${group.id}, name: "${group.name}", group_type: "${group.group_type}" }`);
    });

    console.log('\n4. Testing form field population:');
    console.log('   The dropdown should use:');
    frontendResponse.forEach(group => {
      console.log(`   - <option value="${group.id}">${group.name}</option>`);
    });

    await sequelize.close();
  } catch (error) {
    console.error('❌ Test failed:', error);
    await sequelize.close();
  }
}

testUserGroupData();
