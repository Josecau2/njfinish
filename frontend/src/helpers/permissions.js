/**
 * Permission utilities for UI gating and access control
 */

// User roles hierarchy (higher number = more permissions)
export const USER_ROLES = {
  contractor: 1,
  sales: 2,
  manager: 3,
  admin: 4,
  super_admin: 5
};

// Available modules for contractors
export const CONTRACTOR_MODULES = {
  proposals: 'proposals',
  customers: 'customers',
  resources: 'resources',
  calendar: 'calendar'
};

// Permission categories
export const PERMISSIONS = {
  // Customer permissions
  'customers:read': ['sales', 'manager', 'admin', 'super_admin'],
  'customers:create': ['sales', 'manager', 'admin', 'super_admin'],
  'customers:update': ['sales', 'manager', 'admin', 'super_admin'],
  'customers:delete': ['manager', 'admin', 'super_admin'],

  // Proposal permissions
  'proposals:read': ['sales', 'manager', 'admin', 'super_admin'],
  'proposals:create': ['sales', 'manager', 'admin', 'super_admin'],
  'proposals:update': ['sales', 'manager', 'admin', 'super_admin'],
  'proposals:delete': ['manager', 'admin', 'super_admin'],
  'proposals:status_change': ['sales', 'manager', 'admin', 'super_admin'],

  // Settings permissions
  'settings:users': ['admin', 'super_admin'],
  'settings:groups': ['admin', 'super_admin'],
  'settings:manufacturers': ['admin', 'super_admin'],
  'settings:locations': ['admin', 'super_admin'],
  'settings:taxes': ['admin', 'super_admin'],
  'settings:customization': ['admin', 'super_admin'],

  // Admin permissions
  'admin:contractors': ['admin', 'super_admin'],
  'admin:notifications': ['admin', 'super_admin'],
  'admin:proposals_view': ['admin', 'super_admin'],
  'admin:users': ['admin', 'super_admin'],
  'admin:groups': ['admin', 'super_admin'],
  'admin:manufacturers': ['admin', 'super_admin'],

  // Resources permissions
  'resources:read': ['sales', 'manager', 'admin', 'super_admin'],
  'resources:create': ['admin', 'super_admin'],
  'resources:update': ['admin', 'super_admin'],
  'resources:delete': ['admin', 'super_admin'],

  // Manufacturer permissions
  'manufacturers:read': ['sales', 'manager', 'admin', 'super_admin'], // Everyone can read manufacturer catalog data
  'manufacturers:create': ['admin', 'super_admin'],
  'manufacturers:update': ['admin', 'super_admin'],
  'manufacturers:delete': ['admin', 'super_admin'],
};

/**
 * Check if a user has a specific permission
 * @param {Object} user - User object with role and group information
 * @param {string} permission - Permission string (e.g., 'customers:read')
 * @returns {boolean} - Whether user has permission
 */
export const hasPermission = (user, permission) => {
  if (!user) return false;

  // ADMIN USERS HAVE ACCESS TO EVERYTHING - NO RESTRICTIONS
  if (isAdmin(user)) {
    return true;
  }

  // First check if user is a contractor by group_type (most reliable)
  const isContractorByGroup = user.group && user.group.group_type === 'contractor';
  const role = typeof user.role === 'string' ? user.role.toLowerCase() : user.role;

  // Handle contractor permissions FIRST (before checking empty role)
  if (isContractorByGroup) {
    let userModules = user.group.modules || {};

    // Handle modules that might be stored as strings
    if (typeof userModules === 'string') {
      try {
        userModules = JSON.parse(userModules);
      } catch (e) {
        console.error('Failed to parse user modules in hasPermission:', userModules);
        return false;
      }
    }

    // Explicit contractor permissions - grant ALL operations for enabled modules
    if (userModules.proposals === true && [
      'proposals:read', 'proposals:create', 'proposals:update', 'proposals:status_change'
    ].includes(permission)) {
      return true;
    }

    if (userModules.customers === true && [
      'customers:read', 'customers:create', 'customers:update', 'customers:delete'
    ].includes(permission)) {
      return true;
    }

    if (userModules.resources === true && [
      'resources:read', 'resources:create', 'resources:update'
    ].includes(permission)) {
      return true;
    }

    // All contractors can read manufacturer catalog data
    if (permission === 'manufacturers:read') {
      return true;
    }

    // Fallback: check if permission starts with module name
    if (permission.startsWith('customers:') && userModules.customers === true) {
      return true;
    }
    if (permission.startsWith('proposals:') && userModules.proposals === true) {
      return true;
    }
    if (permission.startsWith('resources:') && userModules.resources === true) {
      return true;
    }
  }

  // Check direct permission based on role (for non-contractors or as fallback)
  const allowedRoles = PERMISSIONS[permission];
  if (allowedRoles && role && allowedRoles.includes(role)) {
    return true;
  }

  return false;
};

/**
 * Check if user is a contractor
 * @param {Object} user - User object
 * @returns {boolean}
 */
export const isContractor = (user) => {
  // Check both role and group_type to handle cases where role might be empty
  return user && ((user.role && user.role.toLowerCase() === 'contractor') ||
                  (user.group && user.group.group_type === 'contractor'));
};

/**
 * Check if user is admin or super admin
 * @param {Object} user - User object
 * @returns {boolean}
 */
export const isAdmin = (user) => {
  if (!user || !user.role) return false;
  const role = typeof user.role === 'string' ? user.role.toLowerCase() : user.role;
  return role === 'admin' || role === 'super_admin';
};

/**
 * Get contractor modules for a user
 * @param {Object} user - User object
 * @returns {Array} - Array of enabled modules
 */
export const getContractorModules = (user) => {
  if (!isContractor(user)) return [];

  let modules = user.group?.modules || {};

  // Handle modules that might be stored as strings
  if (typeof modules === 'string') {
    try {
      modules = JSON.parse(modules);
    } catch (e) {
      console.error('Failed to parse contractor modules:', modules);
      return [];
    }
  }

  // Convert object to array of enabled module names
  return Object.keys(modules).filter(key => modules[key] === true);
};

/**
 * Check if contractor has access to a specific module
 * @param {Object} user - User object
 * @param {string} module - Module name
 * @returns {boolean}
 */
export const hasModuleAccess = (user, module) => {
  // ADMIN USERS HAVE ACCESS TO ALL MODULES
  if (isAdmin(user)) return true;

  if (!isContractor(user)) return false;
  return getContractorModules(user).includes(module);
};

/**
 * Filter routes based on user permissions
 * @param {Array} routes - Array of route objects
 * @param {Object} user - User object
 * @returns {Array} - Filtered routes
 */
export const filterRoutesByPermission = (routes, user) => {
  if (!user) return [];

  return routes.filter(route => {
    // Always allow dashboard and profile
    if (route.path === '/' || route.path === '/profile') {
      return true;
    }

    // Check specific route permissions
    if (route.path.startsWith('/customers')) {
      return hasPermission(user, 'customers:read');
    }
    if (route.path.startsWith('/quotes')) {
      return hasPermission(user, 'proposals:read');
    }
    if (route.path.startsWith('/resources')) {
      return hasPermission(user, 'resources:read');
    }
    if (route.path.startsWith('/calender') || route.path.startsWith('/calendar')) {
      return hasModuleAccess(user, 'calendar');
    }
    if (route.path.startsWith('/contracts')) {
      // Explicitly block contractors from Contracts routes
      if (isContractor(user)) return false;
      return hasPermission(user, 'proposals:read');
    }
  if (route.path.startsWith('/settings')) {
      // Check specific settings permissions
      if (route.path.includes('/users') || route.path.includes('/group')) {
        return hasPermission(user, 'settings:users');
      }
      if (route.path.includes('/manufacturers')) {
        return hasPermission(user, 'settings:manufacturers');
      }
      if (route.path.includes('/locations')) {
        return hasPermission(user, 'settings:locations');
      }
      if (route.path.includes('/taxes')) {
        return hasPermission(user, 'settings:taxes');
      }
      if (route.path.includes('/customization')) {
        return hasPermission(user, 'settings:customization');
      }
      // Fallback - if no specific match, require admin
      return isAdmin(user);
    }
    if (route.path.startsWith('/admin/notifications')) {
      return hasPermission(user, 'admin:notifications');
    }
    if (route.path.startsWith('/admin')) {
      return isAdmin(user);
    }

    // Default: allow for any authenticated user (like 404 page)
    return true;
  });
};

/**
 * Check if user can perform an action on a button/UI element
 * @param {Object} user - User object
 * @param {string} action - Action type ('create', 'edit', 'delete', etc.)
 * @param {string} resource - Resource type ('customer', 'proposal', etc.)
 * @param {Object} item - Optional item being acted upon (for ownership checks)
 * @returns {boolean}
 */
export const canPerformAction = (user, action, resource, item = null) => {
  // Map singular resources used in UI to plural keys used in PERMISSIONS
  const normalizedResource = resource && resource.endsWith('s') ? resource : `${resource}s`;
  const permission = `${normalizedResource}:${action}`;

  // Check basic permission first
  if (!hasPermission(user, permission)) {
    return false;
  }

  // For contractors, check group ownership
  if (isContractor(user) && item) {
    const userGroupId = user.group_id;
  if (normalizedResource === 'customers' && item.group_id !== userGroupId) {
      return false;
    }
  if (normalizedResource === 'proposals' && item.owner_group_id !== userGroupId) {
      return false;
    }
  }

  return true;
};

/**
 * Get user role display name
 * @param {string} role - User role
 * @returns {string} - Display name
 */
export const getRoleDisplayName = (role) => {
  const roleNames = {
    contractor: 'Contractor',
    sales: 'Sales Representative',
    manager: 'Manager',
    admin: 'Administrator',
    super_admin: 'Super Administrator'
  };
  return roleNames[role] || role;
};

/**
 * Check if user can access navigation item
 * @param {Object} user - User object
 * @param {Object} navItem - Navigation item with permission requirements
 * @returns {boolean}
 */
export const canAccessNavItem = (user, navItem) => {
  if (!navItem.permission) return true;
  return hasPermission(user, navItem.permission);
};
