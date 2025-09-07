import React, { Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { CContainer, CSpinner } from '@coreui/react'
import { useSelector } from 'react-redux'
import routes from '../routes'
import RouteGuard from './RouteGuard'
import { filterRoutesByPermission } from '../helpers/permissions'

const AppContent = () => {
  const reduxUser = useSelector(state => state.auth?.user);
  const user = reduxUser || (() => {
    try { return JSON.parse(localStorage.getItem('user')) || null } catch { return null }
  })();

  // Filter routes based on user permissions
  const allowedRoutes = user ? filterRoutesByPermission(routes, user) : [];

  return (
    <CContainer fluid className="px-0">
      <Suspense fallback={<CSpinner color="primary" />}>
        <Routes>
          {allowedRoutes.map((route, idx) => {
            return (
              route.element && (
                <Route
                  key={idx}
                  path={route.path}
                  exact={route.exact}
                  name={route.name}
                  element={
                    <RouteGuard
                      permission={route.permission}
                      module={route.module}
                      adminOnly={route.adminOnly}
                    >
                      <route.element />
                    </RouteGuard>
                  }
                />
              )
            )
          })}
          {/* Fallback route for unauthorized access */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </CContainer>
  )
}

export default React.memo(AppContent)
