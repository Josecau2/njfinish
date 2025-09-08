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
    <>
      <style>{`
        /* Main content paddings separated by breakpoints */
        .modern-content { padding-left: 0; padding-right: 0; overflow-x: hidden; }
        @media (max-width: 767.98px){ .modern-content { padding-left:.5rem; padding-right:.5rem; } }
        @media (min-width: 768px) and (max-width: 991.98px){ .modern-content { padding-left:.75rem; padding-right:.75rem; } }
        @media (min-width: 992px){ .modern-content { padding-left:1rem; padding-right:1rem; } }
        @media (min-width: 1200px){ .modern-content { padding-left:1.5rem; padding-right:1.5rem; } }
      `}</style>
      <CContainer fluid className="modern-content">
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
    </>
  )
}

export default React.memo(AppContent)
