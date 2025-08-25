const models = require('./models');
const { UserGroup, UserGroupMultiplier } = models;

async function testCorrectAssociations() {
  try {
    console.log('🔍 Testing Correct Association Names\n');

    console.log('🔗 Testing with correct association name "user_group":');
    const multiplier = await UserGroupMultiplier.findByPk(1, {
      include: [{
        model: UserGroup,
        as: 'user_group', // Use the association alias
        required: false
      }]
    });

    if (multiplier) {
      console.log(`Result with alias:`, {
        id: multiplier.id,
        user_group_id: multiplier.user_group_id,
        multiplier: multiplier.multiplier,
        group: multiplier.user_group ? multiplier.user_group.name : 'NULL'
      });
    }

    console.log('\n🔗 Testing without alias:');
    const multiplier2 = await UserGroupMultiplier.findByPk(2, {
      include: [UserGroup] // Try without specifying alias
    });

    if (multiplier2) {
      console.log(`Result without alias:`, {
        id: multiplier2.id,
        user_group_id: multiplier2.user_group_id,
        multiplier: multiplier2.multiplier,
        group: multiplier2.UserGroup ? multiplier2.UserGroup.name : 'NULL'
      });
    }

    console.log('\n🔗 Testing findAll with correct associations:');
    const multipliers = await UserGroupMultiplier.findAll({
      include: [{
        model: UserGroup,
        as: 'user_group',
        required: false
      }],
      limit: 5
    });

    multipliers.forEach(mult => {
      console.log(`  Multiplier ${mult.id} → Group: ${mult.user_group ? mult.user_group.name : 'NULL'} (${mult.multiplier}x)`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testCorrectAssociations();
