/**
 * Permission Constants for Module-Based Access Control
 * Maps to the module toggles in UserGroup.modules field
 */

// Permission Action Types
const ACTIONS = {
  READ: 'read',
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  ACCEPT: 'accept'
};

// Module-Based Permissions
const PERMISSIONS = {
  // Admin System Permissions
  ADMIN: {
    USERS: 'admin:users',
    GROUPS: 'admin:groups',
    ROLES: 'admin:roles',
    MANUFACTURERS: 'admin:manufacturers',
    SETTINGS: 'admin:settings',
    REPORTS: 'admin:reports',
    SYSTEM: 'admin:system',
    LEADS: 'admin:leads'
  },

  // Contractor Dashboard Permissions
  CONTRACTORS: {
    READ: 'contractors:read'
  },

  // Proposals Module Permissions
  PROPOSALS: {
    READ: 'proposals:read',
    CREATE: 'proposals:create',
    UPDATE: 'proposals:update',
    DELETE: 'proposals:delete',
    ACCEPT: 'proposals:accept'
  },

  // Customers Module Permissions
  CUSTOMERS: {
    READ: 'customers:read',
    CREATE: 'customers:create',
    UPDATE: 'customers:update',
    DELETE: 'customers:delete'
  },

  // Resources Module Permissions
  RESOURCES: {
    READ: 'resources:read',
    CREATE: 'resources:create',
    UPDATE: 'resources:update',
    DELETE: 'resources:delete'
  },

  // Payments Module Permissions
  PAYMENTS: {
    READ: 'payments:read',
    CREATE: 'payments:create',
    UPDATE: 'payments:update',
    DELETE: 'payments:delete'
  }
};

// Default Permission Sets by Group Type
const DEFAULT_PERMISSIONS = {
  // Standard groups get all permissions (existing behavior)
  standard: [
    ...Object.values(PERMISSIONS.CONTRACTORS),
    ...Object.values(PERMISSIONS.PROPOSALS),
    ...Object.values(PERMISSIONS.CUSTOMERS),
    ...Object.values(PERMISSIONS.RESOURCES),
    ...Object.values(PERMISSIONS.PAYMENTS)
  ],

  // Contractor groups get permissions based on module toggles
  contractor: {
    // When dashboard module is enabled
    dashboard: [
      PERMISSIONS.CONTRACTORS.READ
    ],

    // When proposals module is enabled
    proposals: [
      PERMISSIONS.PROPOSALS.READ,
      PERMISSIONS.PROPOSALS.CREATE,
      PERMISSIONS.PROPOSALS.UPDATE,
      PERMISSIONS.PROPOSALS.ACCEPT
    ],

    // When customers module is enabled
    customers: [
      PERMISSIONS.CUSTOMERS.READ,
      PERMISSIONS.CUSTOMERS.CREATE,
      PERMISSIONS.CUSTOMERS.UPDATE,
      PERMISSIONS.CUSTOMERS.DELETE
    ],

    // When resources module is enabled
    resources: [
      PERMISSIONS.RESOURCES.READ
    ],

    // When payments module is enabled
    payments: [
      PERMISSIONS.PAYMENTS.READ,
      PERMISSIONS.PAYMENTS.CREATE
    ]
  }
};

function getContractorPermissions(modules = {}) {
  const permissions = [];

  if (modules.dashboard) {
    permissions.push(...DEFAULT_PERMISSIONS.contractor.dashboard);
  }

  if (modules.proposals) {
    permissions.push(...DEFAULT_PERMISSIONS.contractor.proposals);
  }

  if (modules.customers) {
    permissions.push(...DEFAULT_PERMISSIONS.contractor.customers);
  }

  if (modules.resources) {
    permissions.push(...DEFAULT_PERMISSIONS.contractor.resources);
  }

  return permissions;
}

function getGroupPermissions(groupType = 'standard', modules = null) {
  if (groupType === 'contractor' && modules) {
    return getContractorPermissions(modules);
  }

  return DEFAULT_PERMISSIONS.standard;
}

function hasPermission(userPermissions = [], requiredPermission) {
  return userPermissions.includes(requiredPermission);
}

function hasAnyPermission(userPermissions = [], requiredPermissions = []) {
  return requiredPermissions.some(permission => userPermissions.includes(permission));
}

function hasAllPermissions(userPermissions = [], requiredPermissions = []) {
  return requiredPermissions.every(permission => userPermissions.includes(permission));
}

module.exports = {
  ACTIONS,
  PERMISSIONS,
  DEFAULT_PERMISSIONS,
  getContractorPermissions,
  getGroupPermissions,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions
};
