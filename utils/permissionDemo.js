/**
 * Permission System Demonstration Utility
 * Shows how the new permission keys integrate with module toggles
 * This is for demonstration only - no actual enforcement logic
 */

const { 
  PERMISSIONS, 
  getContractorPermissions, 
  getGroupPermissions,
  hasPermission,
  hasAnyPermission 
} = require('../constants/permissions');

/**
 * Demo function to show how permissions work for different scenarios
 */
function demonstratePermissions() {
  console.log('=== Permission System Demonstration ===\n');

  // Example 1: Standard group (existing behavior)
  console.log('1. Standard Group (existing behavior):');
  const standardPermissions = getGroupPermissions('standard');
  console.log('   Permissions:', standardPermissions);
  console.log('   Can read proposals?', hasPermission(standardPermissions, PERMISSIONS.PROPOSALS.READ));
  console.log('   Can create customers?', hasPermission(standardPermissions, PERMISSIONS.CUSTOMERS.CREATE));
  console.log('');

  // Example 2: Contractor group with all modules enabled
  console.log('2. Contractor Group (all modules enabled):');
  const allModulesEnabled = {
    dashboard: true,
    proposals: true, 
    customers: true,
    resources: true
  };
  const contractorAllPermissions = getGroupPermissions('contractor', allModulesEnabled);
  console.log('   Modules:', allModulesEnabled);
  console.log('   Permissions:', contractorAllPermissions);
  console.log('   Can read proposals?', hasPermission(contractorAllPermissions, PERMISSIONS.PROPOSALS.READ));
  console.log('   Can delete proposals?', hasPermission(contractorAllPermissions, PERMISSIONS.PROPOSALS.DELETE));
  console.log('   Can create resources?', hasPermission(contractorAllPermissions, PERMISSIONS.RESOURCES.CREATE));
  console.log('');

  // Example 3: Contractor group with limited modules
  console.log('3. Contractor Group (limited modules):');
  const limitedModules = {
    dashboard: true,
    proposals: false,
    customers: true, 
    resources: false
  };
  const contractorLimitedPermissions = getGroupPermissions('contractor', limitedModules);
  console.log('   Modules:', limitedModules);
  console.log('   Permissions:', contractorLimitedPermissions);
  console.log('   Can read contractors?', hasPermission(contractorLimitedPermissions, PERMISSIONS.CONTRACTORS.READ));
  console.log('   Can read proposals?', hasPermission(contractorLimitedPermissions, PERMISSIONS.PROPOSALS.READ));
  console.log('   Can create customers?', hasPermission(contractorLimitedPermissions, PERMISSIONS.CUSTOMERS.CREATE));
  console.log('   Can read resources?', hasPermission(contractorLimitedPermissions, PERMISSIONS.RESOURCES.READ));
  console.log('');

  // Example 4: Route permission examples
  console.log('4. Route Permission Examples:');
  console.log('   GET /api/proposals would require:', PERMISSIONS.PROPOSALS.READ);
  console.log('   POST /api/proposals would require:', PERMISSIONS.PROPOSALS.CREATE);
  console.log('   PUT /api/customers/:id would require:', PERMISSIONS.CUSTOMERS.UPDATE);
  console.log('   GET /api/resources would require:', PERMISSIONS.RESOURCES.READ);
  console.log('');

  // Example 5: Middleware usage examples
  console.log('5. Middleware Usage Examples:');
  console.log('   // Protect a route:');
  console.log('   router.get(\'/proposals\', verifyToken, requirePermission(PERMISSIONS.PROPOSALS.READ), proposalsController.fetch);');
  console.log('');
  console.log('   // Multiple permissions (any one required):');
  console.log('   router.post(\'/customers\', verifyToken, requireAnyPermission([PERMISSIONS.CUSTOMERS.CREATE]), customerController.add);');
  console.log('');
}

/**
 * Show permission mapping for all module combinations
 */
function showPermissionMappings() {
  console.log('=== Module Toggle to Permission Mapping ===\n');
  
  const moduleOptions = [
    { dashboard: true, proposals: false, customers: false, resources: false },
    { dashboard: false, proposals: true, customers: false, resources: false },
    { dashboard: false, proposals: false, customers: true, resources: false },
    { dashboard: false, proposals: false, customers: false, resources: true },
    { dashboard: true, proposals: true, customers: false, resources: false },
    { dashboard: true, proposals: true, customers: true, resources: true }
  ];

  moduleOptions.forEach((modules, index) => {
    const permissions = getContractorPermissions(modules);
    console.log(`${index + 1}. Modules:`, modules);
    console.log('   Permissions:', permissions);
    console.log('');
  });
}

// Export for use in testing/development
module.exports = {
  demonstratePermissions,
  showPermissionMappings
};

// Run demonstration if this file is executed directly
if (require.main === module) {
  demonstratePermissions();
  showPermissionMappings();
}
