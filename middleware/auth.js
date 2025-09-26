const jwt = require('jsonwebtoken');
const User = require('../models/User');
const UserGroup = require('../models/UserGroup');
const { getUserPermissions } = require('./permissions');
require('dotenv').config();
const TOKEN_EXPIRES_IN = process.env.JWT_EXPIRES || process.env.JWT_EXPIRES_IN || '8h';

// Throttle noisy expired-token logs (configurable)
const EXPIRED_LOG_THROTTLE_MS = parseInt(process.env.JWT_EXPIRED_LOG_THROTTLE_MS || '60000', 10); // default 60s per route
const EXPIRED_LOG_ENABLED = !['off', 'false', '0'].includes(String(process.env.JWT_EXPIRED_LOGS || '').toLowerCase());
const __lastExpiredLogByKey = new Map();

function logExpiredOnce(req, scope = 'auth') {
  if (!EXPIRED_LOG_ENABLED) return;
  try {
    const key = `${scope}:${req.method} ${String(req.originalUrl || req.url || '').split('?')[0]}`;
    const now = Date.now();
    const last = __lastExpiredLogByKey.get(key) || 0;
    if (now - last > EXPIRED_LOG_THROTTLE_MS) {
      __lastExpiredLogByKey.set(key, now);
      console.warn('Token expired for', req.method, req.originalUrl);
    }
  } catch (_) {}
}

exports.attachTokenFromQuery = (options = {}) => {
  const primary = options.param || 'token';
  const extras = options.extraParams || options.fallbackParams || [];
  const candidates = [primary, ...(Array.isArray(extras) ? extras : [extras])].filter(Boolean);

  return (req, res, next) => {
    if (!req.headers.authorization) {
      for (const key of candidates) {
        if (!key) continue;
        let candidate = req.query?.[key];
        if (Array.isArray(candidate)) {
          candidate = candidate[0];
        }
        if (typeof candidate === 'string' && candidate.trim()) {
          req.headers.authorization = `Bearer ${candidate.trim()}`;
          break;
        }
      }
    }
    next();
  };
};

exports.verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = /^Bearer\s/i.test(authHeader) ? authHeader.split(' ')[1].trim() : null;
  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findByPk(decoded.id);
    next();
  } catch (error) {
    // Return a clear 401 for auth problems so the client can react (logout/renew)
    const isExpired = error && (error.name === 'TokenExpiredError');
    const message = isExpired ? 'jwt expired' : 'Invalid token';
    // Reduce log noise for common expiry
    try {
      if (!isExpired) {
        console.error('Token verification error (basic):', error);
      } else {
        logExpiredOnce(req, 'basic');
      }
    } catch (_) {}
    try {
      res.setHeader('WWW-Authenticate', `Bearer error="invalid_token", error_description="${message}"`);
    } catch (_) {}
    return res.status(401).json({ message });
  }
};

/**
 * Enhanced token verification that also loads group metadata
 * and injects group information into the request
 */
exports.verifyTokenWithGroup = async (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = /^Bearer\s/i.test(authHeader) ? authHeader.split(' ')[1].trim() : null;

  if (process.env.NODE_ENV === 'development') {
  // console.log('[AUTH DEBUG] verifyTokenWithGroup called for:', req.path);
  // console.log('[AUTH DEBUG] Authorization header exists:', !!authHeader);
  // console.log('[AUTH DEBUG] Token extracted:', token ? `${token.substring(0, 20)}...` : 'null');

    // Show token timestamp to identify which login it's from
    if (token) {
      try {
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
  // console.log('[AUTH DEBUG] Token issued at:', new Date(payload.iat * 1000).toISOString());
  // console.log('[AUTH DEBUG] Token expires at:', new Date(payload.exp * 1000).toISOString());
  // console.log('[AUTH DEBUG] Token user:', payload.email);
      } catch (e) {
  // console.log('[AUTH DEBUG] Could not decode token for inspection');
      }
    }
  }

  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (process.env.NODE_ENV === 'development') {
  // console.log('[AUTH DEBUG] Token decoded successfully for:', decoded.email);
  // console.log('[AUTH DEBUG] Token exp:', new Date(decoded.exp * 1000).toISOString());
  // console.log('[AUTH DEBUG] Current time:', new Date().toISOString());
    }

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
        }, process.env.JWT_SECRET, { expiresIn: TOKEN_EXPIRES_IN });
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
      if (process.env.NODE_ENV === 'development') {
  // console.log('[AUTH DEBUG] User not found in database for ID:', decoded.id);
      }
      return res.status(403).json({ message: 'User not found' });
    }

    if (process.env.NODE_ENV === 'development') {
      /*
      console.log('[AUTH DEBUG] User loaded successfully:', {
        id: req.user.id,
        email: req.user.email,
        hasGroup: !!req.user.group
      });
      */
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
    if (process.env.NODE_ENV === 'development') {
      /*
      console.log('[AUTH DEBUG] verifyTokenWithGroup error:', {
        name: error.name,
        message: error.message,
        path: req.path,
        token: token ? `${token.substring(0, 20)}...` : 'none'
      });
      */
    }

    // Concise logging; throttle noisy expiry stacks
    const isExpired = error && (error.name === 'TokenExpiredError');
    try {
      if (!isExpired) {
        console.error('Token verification error:', error);
      } else {
        logExpiredOnce(req, 'group');
      }
    } catch (_) {}
    const message = isExpired ? 'jwt expired' : 'Invalid token';
    try {
      res.setHeader('WWW-Authenticate', `Bearer error="invalid_token", error_description="${message}"`);
    } catch (_) {}
    return res.status(401).json({ message });
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
