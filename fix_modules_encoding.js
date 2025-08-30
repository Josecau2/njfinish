const { UserGroup } = require('./models');

async function fixModulesEncoding() {
  try {
    console.log('Fixing modules encoding...');
    
    // Get all UserGroups
    const userGroups = await UserGroup.findAll();
    
    console.log(`Found ${userGroups.length} user groups`);
    
    for (const group of userGroups) {
      console.log(`\nProcessing Group ${group.id} (${group.name}):`);
      console.log('Current modules type:', typeof group.modules);
      
      let fixedModules = {};
      
      if (typeof group.modules === 'string') {
        try {
          // Try to parse the string as JSON
          const parsed = JSON.parse(group.modules);
          console.log('Successfully parsed as JSON:', parsed);
          fixedModules = parsed;
        } catch (e) {
          console.log('Failed to parse as JSON, setting default modules');
          fixedModules = {
            dashboard: true,
            proposals: true,
            customers: true,
            resources: true
          };
        }
      } else if (typeof group.modules === 'object' && group.modules !== null) {
        // Check if it's the weird numbered object
        const keys = Object.keys(group.modules);
        if (keys.length > 10 && keys.every(key => !isNaN(key))) {
          console.log('Found numbered keys, attempting to reconstruct JSON...');
          
          // Reconstruct the string from numbered keys
          let reconstructed = '';
          for (let i = 0; i < keys.length; i++) {
            if (group.modules[i.toString()]) {
              reconstructed += group.modules[i.toString()];
            }
          }
          
          console.log('Reconstructed string:', reconstructed.substring(0, 100) + '...');
          
          try {
            const parsed = JSON.parse(reconstructed);
            console.log('Successfully reconstructed and parsed:', parsed);
            fixedModules = parsed;
          } catch (e) {
            console.log('Failed to reconstruct, setting default modules');
            fixedModules = {
              dashboard: true,
              proposals: true,
              customers: true,
              resources: true
            };
          }
        } else {
          console.log('Modules object looks normal');
          fixedModules = group.modules;
        }
      } else {
        console.log('Setting default modules');
        fixedModules = {
          dashboard: true,
          proposals: true,
          customers: true,
          resources: true
        };
      }
      
      // Update the group with properly formatted modules
      await group.update({ modules: fixedModules });
      console.log(`Updated Group ${group.id} with modules:`, fixedModules);
    }
    
    console.log('\n✅ Successfully fixed modules encoding for all groups');
    
  } catch (error) {
    console.error('❌ Error fixing modules:', error);
  }
}

// Run the fix
fixModulesEncoding().then(() => {
  console.log('Script completed');
  process.exit(0);
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});
