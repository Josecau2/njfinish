/**
 * Access Control Middleware Examples and Testing
 * Demonstrates how to use the new group-based access control system
 */

const {
  authenticate,
  authenticateWithGroup,
  fullAccessControl,
  requirePermission,
  requireAnyPermission,
  scopeToGroup,
  proposalsRead,
  customersWrite,
  createAccessChain,
  PERMISSIONS,
  logAccessInfo
} = require('../middleware/accessControl');

/**
 * Example route implementations showing different middleware patterns
 * These examples show how routes WOULD be protected, but don't change existing routes
 */

// Example 1: Basic authentication (existing pattern)
function exampleBasicAuth(router) {
  // Existing route pattern - no changes
  router.get('/legacy-endpoint', authenticate, (req, res) => {
    // This route continues to work exactly as before
    res.json({ message: 'Legacy endpoint works' });
  });
}

// Example 2: Enhanced authentication with group metadata
function exampleGroupAuth(router) {
  // New route pattern - gets group information
  router.get('/group-aware-endpoint', authenticateWithGroup, (req, res) => {
    res.json({
      user: req.user.id,
      groupId: req.user.group_id,
      groupMetadata: req.groupMetadata,
      userPermissions: req.userPermissions
    });
  });
}

// Example 3: Full access control with permissions
function exampleFullAccessControl(router) {
  // Complete middleware chain
  router.get('/protected-endpoint', fullAccessControl, requirePermission(PERMISSIONS.PROPOSALS.READ), (req, res) => {
    res.json({ message: 'You have proposals read permission' });
  });
}

// Example 4: Using scoping helpers in controllers
function exampleScopedController() {
  return async (req, res) => {
    try {
      const { Proposals } = require('../models');
      
      // Basic query
      const baseQuery = {
        include: ['customer', 'designerData'],
        order: [['createdAt', 'DESC']]
      };

      // Apply group scoping using the injected helper
      const scopedQuery = req.scopeProposals(baseQuery);
      
      // Execute scoped query
      const proposals = await Proposals.findAll(scopedQuery);
      
      res.json({
        proposals,
        userGroupId: req.user.group_id,
        isScoped: req.user.group_id !== null
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
}

// Example 5: Custom permission combinations
function exampleCustomPermissions(router) {
  // Multiple permissions (any one required)
  router.post('/flexible-endpoint', 
    ...createAccessChain([
      PERMISSIONS.PROPOSALS.CREATE,
      PERMISSIONS.CUSTOMERS.CREATE
    ]),
    (req, res) => {
      res.json({ message: 'You can create either proposals or customers' });
    }
  );

  // Multiple permissions (all required)
  router.post('/strict-endpoint',
    ...createAccessChain([
      PERMISSIONS.PROPOSALS.READ,
      PERMISSIONS.CUSTOMERS.READ
    ], { requireAll: true }),
    (req, res) => {
      res.json({ message: 'You can read both proposals and customers' });
    }
  );
}

// Example 6: Pre-built middleware chains
function examplePrebuiltChains(router) {
  // Proposals read with full access control
  router.get('/proposals', proposalsRead, exampleScopedController());
  
  // Customers write operations
  router.post('/customers', customersWrite, (req, res) => {
    // Customer creation logic with automatic scoping
    res.json({ message: 'Customer creation endpoint' });
  });
}

// Example 7: Manual scoping in complex queries
function exampleManualScoping() {
  return async (req, res) => {
    try {
      const { Proposals, Customer } = require('../models');
      
      // Complex query with joins
      const baseQuery = {
        include: [{
          model: Customer,
          as: 'customer',
          required: true
        }],
        where: {
          status: 'accepted'
        }
      };

      // Manual scoping for specific table
      const scopedQuery = scopeToGroup(baseQuery, req.user.group_id, { 
        table: 'proposals',
        includeUnowned: false 
      });
      
      const acceptedProposals = await Proposals.findAll(scopedQuery);
      
      res.json({ acceptedProposals });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
}

// Example 8: Development logging
function exampleWithLogging(router) {
  router.get('/debug-access', 
    ...fullAccessControl,
    logAccessInfo,
    (req, res) => {
      res.json({ 
        message: 'Check console for access control info',
        timestamp: new Date().toISOString()
      });
    }
  );
}

/**
 * Testing utilities for the access control system
 */

function testScopingHelpers() {
  console.log('=== Testing Scoping Helpers ===\n');
  
  // Test basic scoping
  const baseQuery = { where: { status: 'active' } };
  
  // Admin user (no scoping)
  const adminScoped = scopeToGroup(baseQuery, null, { table: 'proposals' });
  console.log('Admin scoping:', JSON.stringify(adminScoped, null, 2));
  
  // Contractor user (scoped to group 1)
  const contractorScoped = scopeToGroup(baseQuery, 1, { table: 'proposals' });
  console.log('Contractor scoping:', JSON.stringify(contractorScoped, null, 2));
  
  // Include unowned records
  const inclusiveScoped = scopeToGroup(baseQuery, 1, { 
    table: 'proposals', 
    includeUnowned: true 
  });
  console.log('Inclusive scoping:', JSON.stringify(inclusiveScoped, null, 2));
  
  console.log('\n=== Scoping Test Complete ===\n');
}

/**
 * Example route setup function (for reference only)
 * Shows how routes WOULD be updated to use new middleware
 */
function exampleRouteSetup(router) {
  // Don't actually apply these - just examples
  
  console.log('Example route configurations:');
  console.log('');
  
  console.log('// 1. Basic proposals endpoint with scoping');
  console.log('router.get(\'/api/proposals\', proposalsRead, async (req, res) => {');
  console.log('  const query = req.scopeProposals({ include: [\'customer\'] });');
  console.log('  const proposals = await Proposals.findAll(query);');
  console.log('  res.json({ proposals });');
  console.log('});');
  console.log('');
  
  console.log('// 2. Customer creation with permission check');
  console.log('router.post(\'/api/customers\', customersWrite, async (req, res) => {');
  console.log('  const customer = await Customer.create({');
  console.log('    ...req.body,');
  console.log('    group_id: req.user.group_id,');
  console.log('    created_by_user_id: req.user.id');
  console.log('  });');
  console.log('  res.json({ customer });');
  console.log('});');
  console.log('');
  
  console.log('// 3. Custom permission combination');
  console.log('router.get(\'/api/dashboard\',');
  console.log('  ...createAccessChain([PERMISSIONS.CONTRACTORS.READ]),');
  console.log('  (req, res) => {');
  console.log('    // Dashboard logic with scoped data');
  console.log('    res.json({ dashboard: \'data\' });');
  console.log('  }');
  console.log(');');
}

// Export examples for reference
module.exports = {
  exampleBasicAuth,
  exampleGroupAuth,
  exampleFullAccessControl,
  exampleScopedController,
  exampleCustomPermissions,
  examplePrebuiltChains,
  exampleManualScoping,
  exampleWithLogging,
  testScopingHelpers,
  exampleRouteSetup
};

// Run tests if this file is executed directly
if (require.main === module) {
  console.log('🧪 Access Control Middleware Examples\n');
  
  testScopingHelpers();
  
  console.log('🔧 Example Route Configurations:\n');
  exampleRouteSetup();
  
  console.log('\n✅ Access control system ready for implementation!');
  console.log('\nNext steps:');
  console.log('1. Apply middleware to specific routes as needed');
  console.log('2. Use scoping helpers in controllers');
  console.log('3. Test with different user groups and permissions');
}
