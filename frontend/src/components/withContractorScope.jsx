import React from 'react';
import { Navigate } from 'react-router-dom';
import { hasPermission } from '../helpers/permissions';

/**
 * Higher-order component that ensures contractor users can only access
 * modules that are enabled for their group
 */
const withContractorScope = (WrappedComponent, requiredModule = null, requiredPermissions = []) => {
  return function ContractorScopedComponent(props) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isContractor = user.group && user.group.group_type === 'contractor';

    // Handle modules that might be stored as strings
    let contractorModules = user.group?.modules || {};
    if (typeof contractorModules === 'string') {
      try {
        contractorModules = JSON.parse(contractorModules);
      } catch (e) {
        console.error('Failed to parse contractor modules:', contractorModules);
        contractorModules = {
          dashboard: false,
          proposals: false,
          customers: false,
          resources: false
        };
      }
    }

    // If not a contractor, allow access (admin/regular users)
    if (!isContractor) {
      return <WrappedComponent {...props} />;
    }

    // If contractor but module is required and not enabled, redirect to dashboard
    if (requiredModule && contractorModules[requiredModule] !== true) {
      return <Navigate to="/" replace />;
    }

    // Check specific permissions if required - USE THE FIXED hasPermission function
    if (requiredPermissions.length > 0) {
      const hasAllPermissions = requiredPermissions.every(permission => {
        const hasThisPermission = hasPermission(user, permission);
        return hasThisPermission;
      });

      if (!hasAllPermissions) {
        // For contractors with the right module, let them through anyway
        if (requiredModule && contractorModules[requiredModule] === true) {
          // Allow access
        } else {
          return <Navigate to="/" replace />;
        }
      }
    }

    // Pass contractor scope data to the component
    const contractorScopeProps = {
      ...props,
      isContractor: true,
      contractorGroupId: user.group_id,
      contractorModules,
      contractorGroupName: user.group?.name
    };

    return <WrappedComponent {...contractorScopeProps} />;
  };
};

export default withContractorScope;
