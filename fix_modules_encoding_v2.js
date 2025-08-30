const { UserGroup } = require('./models');

async function fixModulesEncoding() {
  try {
    console.log('Fixing modules encoding...');
    
    // Get all UserGroups
    const userGroups = await UserGroup.findAll();
    
    console.log(`Found ${userGroups.length} user groups`);
    
    for (const group of userGroups) {
      console.log(`\nProcessing Group ${group.id} (${group.name}):`);
      
      let fixedModules = {};
      let needsUpdate = false;
      
      if (typeof group.modules === 'object' && group.modules !== null) {
        const keys = Object.keys(group.modules);
        
        // Check if it has both numbered keys and proper module keys
        const hasNumberedKeys = keys.some(key => !isNaN(key));
        const hasModuleKeys = keys.some(key => ['dashboard', 'proposals', 'customers', 'resources'].includes(key));
        
        if (hasNumberedKeys && hasModuleKeys) {
          console.log('Found mixed numbered and module keys, extracting module keys only...');
          
          // Extract only the module keys
          fixedModules = {
            dashboard: group.modules.dashboard || false,
            proposals: group.modules.proposals || false,
            customers: group.modules.customers || false,
            resources: group.modules.resources || false
          };
          needsUpdate = true;
          
        } else if (hasNumberedKeys && !hasModuleKeys) {
          console.log('Found only numbered keys, reconstructing from string...');
          
          // Reconstruct the string from numbered keys
          let reconstructed = '';
          for (let i = 0; i < keys.length; i++) {
            if (group.modules[i.toString()]) {
              reconstructed += group.modules[i.toString()];
            }
          }
          
          try {
            const parsed = JSON.parse(reconstructed);
            console.log('Successfully reconstructed:', parsed);
            
            fixedModules = {
              dashboard: parsed.dashboard || false,
              proposals: parsed.proposals || false,
              customers: parsed.customers || false,
              resources: parsed.resources || false
            };
            needsUpdate = true;
            
          } catch (e) {
            console.log('Failed to reconstruct, setting default modules');
            fixedModules = {
              dashboard: true,
              proposals: true,
              customers: true,
              resources: true
            };
            needsUpdate = true;
          }
          
        } else if (hasModuleKeys && !hasNumberedKeys) {
          console.log('Modules object looks normal, keeping as is');
          fixedModules = {
            dashboard: group.modules.dashboard || false,
            proposals: group.modules.proposals || false,
            customers: group.modules.customers || false,
            resources: group.modules.resources || false
          };
          
        } else {
          console.log('Setting default modules');
          fixedModules = {
            dashboard: true,
            proposals: true,
            customers: true,
            resources: true
          };
          needsUpdate = true;
        }
        
      } else {
        console.log('Setting default modules');
        fixedModules = {
          dashboard: true,
          proposals: true,
          customers: true,
          resources: true
        };
        needsUpdate = true;
      }
      
      // Update the group with properly formatted modules
      if (needsUpdate) {
        await group.update({ modules: fixedModules });
        console.log(`Updated Group ${group.id} with modules:`, fixedModules);
      } else {
        console.log(`Group ${group.id} modules are already correct:`, fixedModules);
      }
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
