const jwt = require('jsonwebtoken');
const User = require('../models/User');
const UserGroup = require('../models/UserGroup');
const { getUserPermissions } = require('./permissions');
require('dotenv').config();

exports.verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findByPk(decoded.id);
    next();
  } catch {
    res.status(403).json({ message: 'Invalid token' });
  }
};

/**
 * Enhanced token verification that also loads group metadata
 * and injects group information into the request
 */
exports.verifyTokenWithGroup = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Rolling token refresh: if token is close to expiring, mint a fresh one
    try {
      const nowSec = Math.floor(Date.now() / 1000);
      const exp = Number(decoded?.exp || 0);
      const timeLeft = exp - nowSec;
      // Refresh when less than 20 minutes remain
      const REFRESH_THRESHOLD_SEC = 20 * 60;
      if (timeLeft > 0 && timeLeft < REFRESH_THRESHOLD_SEC) {
        // Use the original claims to sign a new token
        const newToken = jwt.sign({
          id: decoded.id,
          email: decoded.email,
          name: decoded.name,
          role: decoded.role,
          role_id: decoded.role_id,
          group_id: decoded.group_id,
        }, process.env.JWT_SECRET, { expiresIn: '1h' });
        // Expose header to browser (CORS) if needed
        res.setHeader('x-refresh-token', newToken);
        res.setHeader('Access-Control-Expose-Headers', 'x-refresh-token');
      }
    } catch (e) {
      // Non-fatal; proceed without refresh header
    }

    // Load user with group information
    req.user = await User.findByPk(decoded.id, {
      include: [{
        model: UserGroup,
        as: 'group',
        required: false
      }]
    });

    if (!req.user) {
      return res.status(403).json({ message: 'User not found' });
    }

    // Ensure group_id is properly set (convert to integer if needed)
    req.user.group_id = req.user.group_id ? parseInt(req.user.group_id) : null;

    req.groupMetadata = req.user.group ? {
      id: req.user.group.id,
      name: req.user.group.name,
      group_type: req.user.group.group_type,
      modules: req.user.group.modules,
      contractor_settings: req.user.group.contractor_settings
    } : null;

    // Inject user permissions
    req.userPermissions = await getUserPermissions(req.user);

    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(403).json({ message: 'Invalid token' });
  }
};

exports.allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  };
};

/**
 * Scoping enforcement middleware that ensures contractors can only access
 * data within their group scope. Admins have full access.
 */
exports.enforceGroupScoping = (options = {}) => {
  const {
    resourceType = 'proposals', // 'proposals' or 'customers'
    idParam = 'id', // parameter name that contains the resource ID
    allowCreate = true, // whether to allow creation of new resources
    idFromBody = false // whether to get ID from request body instead of params
  } = options;

  return async (req, res, next) => {
    try {
      // Admin users have full access - skip scoping
      if (req.user.role === 'admin' || req.user.role === 'super_admin') {
        return next();
      }

      // Only enforce scoping for contractor users
      if (!req.user.group_id || !req.user.group || req.user.group.group_type !== 'contractor') {
        return next();
      }

      const contractorGroupId = req.user.group_id;

      // For POST requests (create operations)
      if (req.method === 'POST' && allowCreate) {
        // Inject the contractor's group_id into the request body
        if (resourceType === 'proposals') {
          req.body.owner_group_id = contractorGroupId;
        } else if (resourceType === 'customers') {
          req.body.group_id = contractorGroupId;
        }
        return next();
      }

      // For GET/PUT/DELETE requests that target specific resources
      let resourceId;
      if (idFromBody) {
        resourceId = req.body.formData ? req.body.formData[idParam] : req.body[idParam];
      } else {
        resourceId = req.params[idParam];
      }

      if (resourceId) {
        const { Proposals, Customer } = require('../models/index');

        let resource;
        let groupField;

        if (resourceType === 'proposals') {
          resource = await Proposals.findByPk(resourceId);
          groupField = 'owner_group_id';
        } else if (resourceType === 'customers') {
          resource = await Customer.findByPk(resourceId);
          groupField = 'group_id';
        }

        if (!resource) {
          return res.status(404).json({
            success: false,
            message: `${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)} not found`
          });
        }

        // Check if the resource belongs to the contractor's group
        if (resource[groupField] !== contractorGroupId) {
          return res.status(403).json({
            success: false,
            message: 'Access denied: insufficient permissions to access this resource'
          });
        }

        // For PUT requests, ensure the group_id isn't being changed
        if (req.method === 'PUT' || req.method === 'PATCH' || req.method === 'POST') {
          let dataToCheck = req.body;
          if (req.body.formData) {
            dataToCheck = req.body.formData;
          }

          // Convert to strings for comparison to avoid type mismatch issues
          if (resourceType === 'proposals' && dataToCheck.owner_group_id && String(dataToCheck.owner_group_id) !== String(contractorGroupId)) {
            return res.status(403).json({
              success: false,
              message: 'Access denied: cannot change group ownership'
            });
          } else if (resourceType === 'customers' && dataToCheck.group_id && String(dataToCheck.group_id) !== String(contractorGroupId)) {
            return res.status(403).json({
              success: false,
              message: 'Access denied: cannot change group ownership'
            });
          }
        }
      }

      next();
    } catch (error) {
      console.error('Group scoping enforcement error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during access control validation'
      });
    }
  };
};
