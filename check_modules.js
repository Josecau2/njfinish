// Check what modules data is stored in the database
const { UserGroup } = require('./models/index');

async function checkModulesData() {
  try {
    console.log('Checking modules data...');
    
    // Check the usergroup with id 1 (Admin group)
    const group = await UserGroup.findByPk(1);
    if (group) {
      console.log('UserGroup 1 raw data:', {
        id: group.id,
        name: group.name,
        group_type: group.group_type,
        modules: group.modules,
        moduleType: typeof group.modules,
        moduleLength: group.modules ? group.modules.length : 'null'
      });
      
      // Try to parse if it's a string
      if (typeof group.modules === 'string') {
        try {
          const parsed = JSON.parse(group.modules);
          console.log('Parsed modules:', parsed);
          console.log('Parsed keys:', Object.keys(parsed));
        } catch (e) {
          console.log('Failed to parse modules as JSON:', e.message);
        }
      }
    }
    
    // Check a few more groups
    const allGroups = await UserGroup.findAll({
      attributes: ['id', 'name', 'modules'],
      limit: 5
    });
    
    console.log('\nAll groups modules:');
    allGroups.forEach(group => {
      console.log(`Group ${group.id} (${group.name}): ${typeof group.modules} - ${group.modules}`);
    });
    
  } catch (error) {
    console.error('Check error:', error);
  }
  
  process.exit(0);
}

checkModulesData();
