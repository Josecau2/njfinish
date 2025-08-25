const models = require('./models');
const { UserGroup, UserGroupMultiplier } = models;

async function debugAssociationsProperly() {
  try {
    console.log('🔍 Debugging with Proper Model Loading\n');

    // First, let's check if the models have the associations
    console.log('🔧 Model Association Check:');
    console.log(`UserGroup associations:`, Object.keys(UserGroup.associations || {}));
    console.log(`UserGroupMultiplier associations:`, Object.keys(UserGroupMultiplier.associations || {}));

    console.log('\n📊 Testing Direct Query:');
    const multiplier = await UserGroupMultiplier.findByPk(1, {
      include: [{
        model: UserGroup,
        required: false
      }]
    });

    if (multiplier) {
      console.log(`Direct query result:`, {
        id: multiplier.id,
        user_group_id: multiplier.user_group_id,
        multiplier: multiplier.multiplier,
        group: multiplier.UserGroup ? multiplier.UserGroup.name : 'NULL'
      });
    }

    console.log('\n🔍 Raw SQL Check:');
    const sequelize = require('./config/db');
    const [results] = await sequelize.query(`
      SELECT ugm.id, ugm.user_group_id, ugm.multiplier, ug.name as group_name
      FROM user_group_multipliers ugm
      LEFT JOIN user_groups ug ON ugm.user_group_id = ug.id
      LIMIT 3
    `);

    console.log('Raw SQL Results:');
    results.forEach(row => {
      console.log(`  ID: ${row.id}, GroupID: ${row.user_group_id}, Name: ${row.group_name}, Multiplier: ${row.multiplier}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

debugAssociationsProperly();
