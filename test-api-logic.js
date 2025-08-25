const models = require('./models');
const { UserGroup, UserGroupMultiplier } = models;

async function testAPILogic() {
  try {
    console.log('🧪 Testing API Logic After Fix\n');

    // Simulate the API call logic
    console.log('📡 Simulating getAllMultiManufacturers API call:');
    const manufacturers = await UserGroupMultiplier.findAll({
      include: [{
        model: UserGroup,
        as: 'user_group',
        required: false
      }]
    });

    console.log(`Found ${manufacturers.length} multipliers:`);
    manufacturers.forEach(mult => {
      console.log(`  ID: ${mult.id}, Group: ${mult.user_group ? mult.user_group.name : 'NULL'} (ID: ${mult.user_group_id}), Multiplier: ${mult.multiplier}, Enabled: ${mult.enabled}`);
    });

    console.log('\n🔍 Testing specific group multipliers:');
    const contractorMultipliers = manufacturers.filter(m => m.user_group && m.user_group.name === 'Contractor');
    console.log(`Contractor group has ${contractorMultipliers.length} multipliers:`);
    contractorMultipliers.forEach(mult => {
      console.log(`  - ${mult.multiplier}x (${mult.enabled ? 'enabled' : 'disabled'})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testAPILogic();
