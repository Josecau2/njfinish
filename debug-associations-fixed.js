const { UserGroup, UserGroupMultiplier } = require('./models');

async function debugAssociations() {
  try {
    console.log('🔍 Debugging Database Associations - Fixed Version\n');

    // Test 1: Get all UserGroups
    console.log('📋 UserGroups:');
    const groups = await UserGroup.findAll();
    groups.forEach(group => {
      console.log(`  ID: ${group.id}, Name: ${group.name}`);
    });

    console.log('\n🔢 UserGroupMultipliers:');
    const multipliers = await UserGroupMultiplier.findAll();
    multipliers.forEach(mult => {
      console.log(`  ID: ${mult.id}, GroupID: ${mult.user_group_id}, Multiplier: ${mult.multiplier}, Enabled: ${mult.enabled}`);
    });

    console.log('\n🔗 Testing Association with Include:');
    const multipliersWithGroups = await UserGroupMultiplier.findAll({
      include: [{
        model: UserGroup,
        required: false // LEFT JOIN instead of INNER JOIN
      }],
      limit: 5
    });

    multipliersWithGroups.forEach(mult => {
      console.log(`  Multiplier ${mult.id} → Group: ${mult.UserGroup ? mult.UserGroup.name : 'NULL'} (ID: ${mult.user_group_id})`);
    });

    console.log('\n🔗 Testing Reverse Association:');
    const groupsWithMultipliers = await UserGroup.findAll({
      include: [{
        model: UserGroupMultiplier,
        required: false
      }],
      limit: 3
    });

    groupsWithMultipliers.forEach(group => {
      console.log(`  Group ${group.id} (${group.name}) → Multipliers: ${group.UserGroupMultipliers ? group.UserGroupMultipliers.length : 0}`);
    });

    console.log('\n🧪 Testing Manual Join:');
    const manualJoin = await UserGroupMultiplier.findAll({
      include: [{
        model: UserGroup,
        where: {}, // Force join
        required: false
      }],
      limit: 3
    });

    manualJoin.forEach(mult => {
      console.log(`  Manual Join - Multiplier ${mult.id} → Group: ${mult.UserGroup ? mult.UserGroup.name : 'NULL'}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

debugAssociations();
