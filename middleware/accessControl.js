/**
 * Access Control Middleware Utilities
 * Provides comprehensive group-based scoping and permission checking
 */

const { verifyToken, verifyTokenWithGroup } = require('./auth');
const { 
  requirePermission, 
  requireAnyPermission, 
  requireAllPermissions,
  attachPermissions,
  scopeToGroup,
  injectGroupScoping,
  getUserPermissions,
  PERMISSIONS 
} = require('./permissions');

/**
 * Standard middleware chain for basic authentication
 * Use for existing routes that don't need group features
 */
exports.authenticate = verifyToken;

/**
 * Enhanced middleware chain for group-aware authentication
 * Use for new routes that need group scoping and permissions
 */
exports.authenticateWithGroup = verifyTokenWithGroup;

/**
 * Complete middleware chain that includes authentication, group metadata, and permissions
 * Recommended for all new protected routes
 */
exports.fullAccessControl = [
  verifyTokenWithGroup,
  attachPermissions,
  injectGroupScoping
];

/**
 * Permission checking middleware
 */
exports.requirePermission = requirePermission;
exports.requireAnyPermission = requireAnyPermission;
exports.requireAllPermissions = requireAllPermissions;

/**
 * Scoping utilities
 */
exports.scopeToGroup = scopeToGroup;
exports.injectGroupScoping = injectGroupScoping;

/**
 * Helper functions for controllers
 */
exports.getUserPermissions = getUserPermissions;

/**
 * Permission constants
 */
exports.PERMISSIONS = PERMISSIONS;

/**
 * Convenience middleware factories for common permission patterns
 */

// Proposals permissions
exports.requireProposalsRead = () => requirePermission(PERMISSIONS.PROPOSALS.READ);
exports.requireProposalsCreate = () => requirePermission(PERMISSIONS.PROPOSALS.CREATE);
exports.requireProposalsUpdate = () => requirePermission(PERMISSIONS.PROPOSALS.UPDATE);
exports.requireProposalsDelete = () => requirePermission(PERMISSIONS.PROPOSALS.DELETE);
exports.requireProposalsAccept = () => requirePermission(PERMISSIONS.PROPOSALS.ACCEPT);

// Customers permissions
exports.requireCustomersRead = () => requirePermission(PERMISSIONS.CUSTOMERS.READ);
exports.requireCustomersCreate = () => requirePermission(PERMISSIONS.CUSTOMERS.CREATE);
exports.requireCustomersUpdate = () => requirePermission(PERMISSIONS.CUSTOMERS.UPDATE);
exports.requireCustomersDelete = () => requirePermission(PERMISSIONS.CUSTOMERS.DELETE);

// Resources permissions
exports.requireResourcesRead = () => requirePermission(PERMISSIONS.RESOURCES.READ);
exports.requireResourcesCreate = () => requirePermission(PERMISSIONS.RESOURCES.CREATE);
exports.requireResourcesUpdate = () => requirePermission(PERMISSIONS.RESOURCES.UPDATE);
exports.requireResourcesDelete = () => requirePermission(PERMISSIONS.RESOURCES.DELETE);

// Contractors permissions
exports.requireContractorsRead = () => requirePermission(PERMISSIONS.CONTRACTORS.READ);

/**
 * Common middleware combinations for different resource types
 */

// Proposals middleware chains
exports.proposalsRead = [
  ...exports.fullAccessControl,
  exports.requireProposalsRead()
];

exports.proposalsWrite = [
  ...exports.fullAccessControl,
  requireAnyPermission([
    PERMISSIONS.PROPOSALS.CREATE,
    PERMISSIONS.PROPOSALS.UPDATE
  ])
];

// Customers middleware chains
exports.customersRead = [
  ...exports.fullAccessControl,
  exports.requireCustomersRead()
];

exports.customersWrite = [
  ...exports.fullAccessControl,
  requireAnyPermission([
    PERMISSIONS.CUSTOMERS.CREATE,
    PERMISSIONS.CUSTOMERS.UPDATE
  ])
];

// Resources middleware chains
exports.resourcesRead = [
  ...exports.fullAccessControl,
  exports.requireResourcesRead()
];

exports.resourcesWrite = [
  ...exports.fullAccessControl,
  requireAnyPermission([
    PERMISSIONS.RESOURCES.CREATE,
    PERMISSIONS.RESOURCES.UPDATE
  ])
];

/**
 * Utility to create custom middleware chains
 * @param {Array} permissions - Required permissions (any one required)
 * @param {Object} options - Additional options
 * @returns {Array} Middleware chain
 */
exports.createAccessChain = (permissions = [], options = {}) => {
  const { requireAll = false, skipGroupScoping = false } = options;
  
  const chain = skipGroupScoping 
    ? [verifyTokenWithGroup, attachPermissions]
    : [...exports.fullAccessControl];

  if (permissions.length > 0) {
    const permissionMiddleware = requireAll 
      ? requireAllPermissions(permissions)
      : requireAnyPermission(permissions);
    chain.push(permissionMiddleware);
  }

  return chain;
};

/**
 * Development/testing helper to log request access control info
 */
exports.logAccessInfo = (req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('\n=== Access Control Info ===');
    console.log('User ID:', req.user?.id);
    console.log('User Role:', req.user?.role);
    console.log('User Group ID:', req.user?.group_id);
    console.log('Group Metadata:', req.groupMetadata);
    console.log('User Permissions:', req.userPermissions);
    console.log('===========================\n');
  }
  next();
};
