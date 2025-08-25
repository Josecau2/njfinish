import React from 'react';
import { useSelector } from 'react-redux';
import { hasPermission, isContractor, hasModuleAccess, canPerformAction } from '../helpers/permissions';

/**
 * PermissionGate component that conditionally renders UI elements based on permissions
 * @param {Object} props - Component props
 * @param {ReactNode} props.children - Child components to render if permission granted
 * @param {string} props.permission - Required permission string
 * @param {string} props.module - Required module for contractors
 * @param {boolean} props.adminOnly - Whether element is admin-only
 * @param {string} props.action - Action type for permission check (create, edit, delete, etc.)
 * @param {string} props.resource - Resource type (customer, proposal, etc.)
 * @param {Object} props.item - Item being acted upon (for ownership checks)
 * @param {boolean} props.fallback - Whether to render children as disabled instead of hiding
 * @param {ReactNode} props.fallbackComponent - Component to render when permission denied
 * @returns {ReactNode|null} - Child components, fallback, or null
 */
const PermissionGate = ({ 
  children, 
  permission, 
  module, 
  adminOnly = false,
  action,
  resource,
  item,
  fallback = false,
  fallbackComponent = null
}) => {
  const user = useSelector(state => state.auth.user);

  // If no user, don't render anything
  if (!user) {
    return fallback ? fallbackComponent : null;
  }

  let hasAccess = true;

  // Check admin-only elements
  if (adminOnly && !['admin', 'super_admin'].includes(user.role)) {
    hasAccess = false;
  }

  // Check specific permission
  if (hasAccess && permission && !hasPermission(user, permission)) {
    hasAccess = false;
  }

  // Check module access for contractors
  if (hasAccess && module && isContractor(user) && !hasModuleAccess(user, module)) {
    hasAccess = false;
  }

  // Check action-based permissions
  if (hasAccess && action && resource) {
    hasAccess = canPerformAction(user, action, resource, item);
  }

  // Render based on access and fallback settings
  if (!hasAccess) {
    if (fallback && React.isValidElement(children)) {
      // Clone children and add disabled prop
      return React.cloneElement(children, { disabled: true });
    }
    return fallbackComponent;
  }

  return children;
};

// Helper components for common use cases
export const AdminOnly = ({ children, fallback, fallbackComponent }) => (
  <PermissionGate adminOnly={true} fallback={fallback} fallbackComponent={fallbackComponent}>
    {children}
  </PermissionGate>
);

export const ContractorModule = ({ module, children, fallback, fallbackComponent }) => (
  <PermissionGate module={module} fallback={fallback} fallbackComponent={fallbackComponent}>
    {children}
  </PermissionGate>
);

export const RequirePermission = ({ permission, children, fallback, fallbackComponent }) => (
  <PermissionGate permission={permission} fallback={fallback} fallbackComponent={fallbackComponent}>
    {children}
  </PermissionGate>
);

export default PermissionGate;
