import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { hasPermission, isContractor, hasModuleAccess } from '../helpers/permissions'

/**
 * RouteGuard component that checks if user has permission to access a route
 * @param {Object} props - Component props
 * @param {ReactNode} props.children - Child components to render if access is granted
 * @param {string} props.permission - Required permission string
 * @param {string} props.module - Required module for contractors
 * @param {string} props.fallbackPath - Path to redirect to if access denied (default: '/')
 * @param {boolean} props.adminOnly - Whether route is admin-only
 * @returns {ReactNode} - Child components or redirect
 */
const RouteGuard = ({ children, permission, module, fallbackPath = '/', adminOnly = false }) => {
  const user = useSelector((state) => state.auth?.user)
  const location = useLocation()

  // If no user, set return_to and redirect to login (usually handled by ProtectedRoute)
  if (!user) {
    try {
      const here = `${location.pathname}${location.search || ''}${location.hash || ''}`
      sessionStorage.setItem('return_to', here || '/')
    } catch {}
    return <Navigate to="/login" replace />
  }

  // Check admin-only routes
  const role = typeof user.role === 'string' ? user.role.toLowerCase() : user.role
  if (adminOnly && !['admin', 'super_admin'].includes(role)) {
    return <Navigate to={fallbackPath} replace />
  }

  // Check specific permission
  if (permission && !hasPermission(user, permission)) {
    return <Navigate to={fallbackPath} replace />
  }

  // Check module access for contractors
  if (module && isContractor(user) && !hasModuleAccess(user, module)) {
    return <Navigate to={fallbackPath} replace />
  }

  // Access granted
  return children
}

export default RouteGuard
