const jwt = require('jsonwebtoken');
const User = require('../models/User');
const UserGroup = require('../models/UserGroup');
const { setAuthCookies, clearAuthCookies, getTokenFromCookies } = require('../utils/authCookies');
const { getUserPermissions } = require('./permissions');
require('dotenv').config();
const TOKEN_EXPIRES_IN = process.env.JWT_EXPIRES || process.env.JWT_EXPIRES_IN || '8h';

// Throttle noisy expired-token logs (configurable)
const EXPIRED_LOG_THROTTLE_MS = parseInt(process.env.JWT_EXPIRED_LOG_THROTTLE_MS || '60000', 10); // default 60s per route
const EXPIRED_LOG_ENABLED = !['off', 'false', '0'].includes(String(process.env.JWT_EXPIRED_LOGS || '').toLowerCase());
const __lastExpiredLogByKey = new Map();

function extractAuthToken(req) {
  try {
    const header = req?.headers?.authorization;
    if (typeof header === 'string') {
      const match = header.match(/^Bearer\s+(.+)$/i);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
  } catch (_) {}

  try {
    const tokenFromCookie = getTokenFromCookies(req);
    if (tokenFromCookie) {
      return tokenFromCookie;
    }
  } catch (_) {}

  return null;
}

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

    if (!req.headers.authorization) {
      const tokenFromCookie = getTokenFromCookies(req);
      if (tokenFromCookie) {
        req.headers.authorization = `Bearer ${tokenFromCookie}`;
      }
    }

    next();
  };
};

exports.verifyToken = async (req, res, next) => {
  const token = extractAuthToken(req);
  if (!token) {
    try {
      const o = req.get('origin') || req.headers.origin;
      const r = req.get('referer') || req.headers.referer;
      const c = (req.headers.cookie || '').slice(0, 120);
      console.warn('[AUTH] No token provided', { path: req.originalUrl, origin: o, referer: r, cookiePreview: c });
    } catch (_) {}
    clearAuthCookies(res, { secure: req.secure || req.get('x-forwarded-proto') === 'https' });
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    if (!user) {
      clearAuthCookies(res, { secure: req.secure || req.get('x-forwarded-proto') === 'https' });
      return res.status(403).json({ message: 'User not found' });
    }
    req.user = user;
    next();
  } catch (error) {
    const isExpired = error && (error.name === 'TokenExpiredError');
    const message = isExpired ? 'jwt expired' : 'Invalid token';
    clearAuthCookies(res, { secure: req.secure || req.get('x-forwarded-proto') === 'https' });
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

exports.verifyTokenWithGroup = async (req, res, next) => {
  let token = extractAuthToken(req);

  if (process.env.NODE_ENV === 'development') {
    if (token) {
      try {
        JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      } catch (_) {}
    }
  }

  if (!token) {
    clearAuthCookies(res, { secure: req.secure || req.get('x-forwarded-proto') === 'https' });
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    try {
      const nowSec = Math.floor(Date.now() / 1000);
      const exp = Number(decoded?.exp || 0);
      const timeLeft = exp - nowSec;
      const REFRESH_THRESHOLD_SEC = 20 * 60;
      if (timeLeft > 0 && timeLeft < REFRESH_THRESHOLD_SEC) {
        const newToken = jwt.sign(
          {
            id: decoded.id,
            email: decoded.email,
            name: decoded.name,
            role: decoded.role,
            role_id: decoded.role_id,
            group_id: decoded.group_id,
          },
          process.env.JWT_SECRET,
          { expiresIn: TOKEN_EXPIRES_IN }
        );
        setAuthCookies(res, newToken, { secure: req.secure || req.get('x-forwarded-proto') === 'https' });
        req.headers.authorization = `Bearer ${newToken}`;
        token = newToken;
      }
    } catch (_) {}

    const user = await User.findByPk(decoded.id, {
      include: [
        {
          model: UserGroup,
          as: 'group',
          required: false,
        },
      ],
    });

    if (!user) {
      clearAuthCookies(res, { secure: req.secure || req.get('x-forwarded-proto') === 'https' });
      return res.status(403).json({ message: 'User not found' });
    }

    user.group_id = user.group_id ? parseInt(user.group_id, 10) : null;
    req.user = user;

    req.groupMetadata = user.group
      ? {
          id: user.group.id,
          name: user.group.name,
          group_type: user.group.group_type,
          modules: user.group.modules,
          contractor_settings: user.group.contractor_settings,
        }
      : null;

    req.userPermissions = await getUserPermissions(user);

    next();
  } catch (error) {
    const isExpired = error && (error.name === 'TokenExpiredError');
    try {
      const o = req.get('origin') || req.headers.origin;
      const r = req.get('referer') || req.headers.referer;
      const c = (req.headers.cookie || '').slice(0, 120);
      console.warn('[AUTH] Token verification failed', { path: req.originalUrl, origin: o, referer: r, cookiePreview: c, name: error?.name, message: error?.message });
    } catch (_) {}
    clearAuthCookies(res, { secure: req.secure || req.get('x-forwarded-proto') === 'https' });
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

exports.enforceGroupScoping = (options = {}) => {
  const {
    resourceType = 'proposals',
    idParam = 'id',
    allowCreate = true,
    idFromBody = false,
  } = options;

  return async (req, res, next) => {
    try {
      if (req.user.role === 'admin' || req.user.role === 'super_admin') {
        return next();
      }

      if (!req.user.group_id || !req.user.group || req.user.group.group_type !== 'contractor') {
        return next();
      }

      const contractorGroupId = req.user.group_id;

      if (req.method === 'POST' && allowCreate) {
        if (resourceType === 'proposals') {
          req.body.owner_group_id = contractorGroupId;
        } else if (resourceType === 'customers') {
          req.body.group_id = contractorGroupId;
        }
        return next();
      }

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
            message: `${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)} not found`,
          });
        }

        if (resource[groupField] !== contractorGroupId) {
          return res.status(403).json({
            success: false,
            message: 'Access denied: insufficient permissions to access this resource',
          });
        }

        if (req.method === 'PUT' || req.method === 'PATCH' || req.method === 'POST') {
          let dataToCheck = req.body;
          if (req.body.formData) {
            dataToCheck = req.body.formData;
          }

          if (
            resourceType === 'proposals' &&
            dataToCheck.owner_group_id &&
            String(dataToCheck.owner_group_id) !== String(contractorGroupId)
          ) {
            return res.status(403).json({
              success: false,
              message: 'Access denied: cannot change group ownership',
            });
          } else if (
            resourceType === 'customers' &&
            dataToCheck.group_id &&
            String(dataToCheck.group_id) !== String(contractorGroupId)
          ) {
            return res.status(403).json({
              success: false,
              message: 'Access denied: cannot change group ownership',
            });
          }
        }
      }

      next();
    } catch (error) {
      console.error('Group scoping enforcement error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during access control validation',
      });
    }
  };
};


