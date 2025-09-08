import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { hasPermission, isContractor, hasModuleAccess } from '../helpers/permissions';
import { getFreshestToken } from '../utils/authToken';

/**
 * HOC that enforces authentication and optional permission/module/admin checks.
 * Usage: export default withAuthGuard(Component, { permission: 'x', module: 'y', adminOnly: false, fallbackPath: '/' })
 */
const withAuthGuard = (
  WrappedComponent,
  { permission, module, adminOnly = false, fallbackPath = '/' } = {}
) => {
  const Guarded = (props) => {
    const location = useLocation();
    let user = null;
    try { user = JSON.parse(localStorage.getItem('user') || 'null'); } catch {}
    const token = (() => { try { return getFreshestToken(); } catch { return null } })();

    if (!token) {
      try {
        const here = `${location.pathname}${location.search || ''}${location.hash || ''}`;
        sessionStorage.setItem('return_to', here || '/');
      } catch {}
      return <Navigate to="/login" replace />;
    }

    // If no user object, allow rendering; WrappedComponent can load profile.
    if (user) {
      const role = typeof user.role === 'string' ? user.role.toLowerCase() : user.role;
      if (adminOnly && !['admin', 'super_admin'].includes(role)) {
        return <Navigate to={fallbackPath} replace />;
      }
      if (permission && !hasPermission(user, permission)) {
        return <Navigate to={fallbackPath} replace />;
      }
      if (module && isContractor(user) && !hasModuleAccess(user, module)) {
        return <Navigate to={fallbackPath} replace />;
      }
    }

    return <WrappedComponent {...props} />;
  };

  Guarded.displayName = `withAuthGuard(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;
  return Guarded;
};

export default withAuthGuard;
