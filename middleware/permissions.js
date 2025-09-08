const { PERMISSIONS, getGroupPermissions, hasPermission, hasAnyPermission, hasAllPermissions } = require('../constants/permissions');
const UserGroup = require('../models/UserGroup');
const { Op } = require('sequelize');

/**
 * Middleware to check if user has specific permission(s)
 * This extends the existing role-based auth without breaking current functionality
 */

/**
 * Check if user has a specific permission
 * @param {string} permission - Required permission (e.g., 'proposals:read')
 * @returns {Function} Express middleware
 */
exports.requirePermission = (permission) => {
  return async (req, res, next) => {
    try {
      // If no user in request, authentication failed upstream
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      // Use cached permissions if available, otherwise get them
      let userPermissions = req.userPermissions;
      if (!userPermissions) {
        userPermissions = await getUserPermissions(req.user);
      }

      // Check if user has the required permission
      if (hasPermission(userPermissions, permission)) {
        next();
      } else {
        res.status(403).json({
          message: 'Insufficient permissions',
          required: permission,
          user: req.user.id
        });
      }
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ message: 'Permission check failed' });
    }
  };
};

/**
 * Check if user has any of the specified permissions
 * @param {Array} permissions - Array of permissions (any one required)
 * @returns {Function} Express middleware
 */
exports.requireAnyPermission = (permissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      let userPermissions = req.userPermissions;
      if (!userPermissions) {
        userPermissions = await getUserPermissions(req.user);
      }

      if (hasAnyPermission(userPermissions, permissions)) {
        next();
      } else {
        res.status(403).json({
          message: 'Insufficient permissions',
          required: permissions,
          user: req.user.id
        });
      }
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ message: 'Permission check failed' });
    }
  };
};

/**
 * Check if user has all of the specified permissions
 * @param {Array} permissions - Array of permissions (all required)
 * @returns {Function} Express middleware
 */
exports.requireAllPermissions = (permissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      let userPermissions = req.userPermissions;
      if (!userPermissions) {
        userPermissions = await getUserPermissions(req.user);
      }

      if (hasAllPermissions(userPermissions, permissions)) {
        next();
      } else {
        res.status(403).json({
          message: 'Insufficient permissions',
          required: permissions,
          user: req.user.id
        });
      }
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ message: 'Permission check failed' });
    }
  };
};

/**
 * Get user's permissions based on their group membership
 * @param {Object} user - User object from database
 * @returns {Array} Array of permission strings
 */
function isAdminRole(role) {
  const r = String(role || '').toLowerCase().trim();
  return r === 'admin' || r === 'super_admin' || r === 'superadmin' || r === 'super admin' || r === 'manufacturers' || r === 'manufacturer';
}

async function getUserPermissions(user) {
  try {
    // For backward compatibility: Admin and Manufacturers roles get all permissions
    if (isAdminRole(user.role)) {
      return [
        ...Object.values(PERMISSIONS.ADMIN),
        ...Object.values(PERMISSIONS.CONTRACTORS),
        ...Object.values(PERMISSIONS.PROPOSALS),
        ...Object.values(PERMISSIONS.CUSTOMERS),
        ...Object.values(PERMISSIONS.RESOURCES),
        ...Object.values(PERMISSIONS.PAYMENTS)
      ];
    }

    // Get user's group - prefer the pre-loaded group data if available
    let userGroup = user.group;
    if (!userGroup && user.group_id) {
      userGroup = await UserGroup.findByPk(user.group_id);
    }

    if (userGroup) {
      // Ensure modules is parsed as an object if it's stored as a string
      let modules = userGroup.modules;
      if (typeof modules === 'string') {
        try {
          modules = JSON.parse(modules);
        } catch (e) {
          console.error('Failed to parse user group modules:', modules);
          modules = { dashboard: false, proposals: false, customers: false, resources: false };
        }
      }

  // Debug log removed to reduce noise

      return getGroupPermissions(userGroup.group_type, modules);
    }

    // Default: regular users get standard permissions for backward compatibility
    return getGroupPermissions('standard');

  } catch (error) {
    console.error('Error getting user permissions:', error);
    // On error, return empty permissions for safety
    return [];
  }
}

/**
 * Add user permissions to request object for use in controllers
 * This middleware should be used after authentication but before permission checks
 */
exports.attachPermissions = async (req, res, next) => {
  try {
    if (req.user) {
      req.userPermissions = await getUserPermissions(req.user);
    }
    next();
  } catch (error) {
    console.error('Error attaching permissions:', error);
    next(); // Continue without permissions rather than blocking
  }
};

/**
 * Scoping helper to automatically filter records by group ownership
 * @param {Object} baseQuery - Base Sequelize query object
 * @param {number|null} groupId - Group ID to scope to (null for admin access)
 * @param {string} options.table - Table type: 'proposals' or 'customers'
 * @param {boolean} options.includeUnowned - Include records without group (default: false for contractors, true for admin)
 * @returns {Object} Modified query with group scoping
 */
exports.scopeToGroup = (baseQuery = {}, groupId, options = {}) => {
  const { table = 'proposals', includeUnowned = null } = options;

  // No scoping for admin users (null groupId means admin)
  if (groupId === null) {
    return baseQuery;
  }

  // Determine the foreign key field based on table
  const groupField = table === 'proposals' ? 'owner_group_id' : 'group_id';

  // Default includeUnowned behavior
  const shouldIncludeUnowned = includeUnowned !== null ? includeUnowned : false;

  // Build where clause for group scoping
  const groupWhere = shouldIncludeUnowned
    ? { [Op.or]: [{ [groupField]: groupId }, { [groupField]: null }] }
    : { [groupField]: groupId };

  // Merge with existing where clause
  const existingWhere = baseQuery.where || {};

  let scopedWhere;
  if (Object.keys(existingWhere).length > 0) {
    scopedWhere = { [Op.and]: [existingWhere, groupWhere] };
  } else {
    scopedWhere = groupWhere;
  }

  return {
    ...baseQuery,
    where: scopedWhere
  };
};

/**
 * Middleware to automatically scope queries to user's group
 * Injects scoped query helpers into request object
 */
exports.injectGroupScoping = (req, res, next) => {
  try {
    const userGroupId = req.user?.group_id || null;
    const isAdmin = isAdminRole(req.user?.role);

    // Inject scoping helpers into request
    req.scopeToUserGroup = (baseQuery = {}, options = {}) => {
      // Admin users see everything
      const groupId = isAdmin ? null : userGroupId;
      return exports.scopeToGroup(baseQuery, groupId, options);
    };

    req.scopeProposals = (baseQuery = {}, options = {}) => {
      const groupId = isAdmin ? null : userGroupId;
      return exports.scopeToGroup(baseQuery, groupId, { ...options, table: 'proposals' });
    };

    req.scopeCustomers = (baseQuery = {}, options = {}) => {
      const groupId = isAdmin ? null : userGroupId;
      return exports.scopeToGroup(baseQuery, groupId, { ...options, table: 'customers' });
    };

    next();
  } catch (error) {
    console.error('Error injecting group scoping:', error);
    next(); // Continue without scoping rather than blocking
  }
};

/**
 * Helper function to get permissions for a user (for use in controllers)
 * @param {Object} user - User object
 * @returns {Array} Array of permission strings
 */
exports.getUserPermissions = getUserPermissions;

// Export permission constants for use in routes
exports.PERMISSIONS = PERMISSIONS;
