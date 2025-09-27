import React, { Suspense, useRef, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { CSpinner } from '@coreui/react'
import './scss/style.scss'
import './scss/examples.scss'
import './main.css'
import './responsive.css'
import './styles/header-override.css'
import './styles/modal-override.css'
import LoginPage from './pages/auth/LoginPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import RequestAccessPage from './pages/auth/RequestAccessPage'
import SignupPage from './pages/auth/SignupPage'
import ProtectedRoute from './components/ProtectedRoute'
import PublicRoute from './components/PublicRoute'
import PublicProposalPage from './pages/public/PublicProposalPage'
import AppInitializer from './components/AppInitializer'
import SessionRefresher from './components/SessionRefresher'
import { setSidebarShow, syncSidebarWithScreenSize } from './store/slices/sidebarSlice'
import { useDispatch } from 'react-redux'
import { debounce } from 'lodash'
import { addLogoutListener } from './utils/browserCleanup'

const DefaultLayout = React.lazy(() => import('./layout/DefaultLayout'))
const Page404 = React.lazy(() => import('./views/pages/page404/Page404'))

const App = () => {
  const dispatch = useDispatch()
  const lastSize = useRef(window.innerWidth <= 768 ? 'mobile' : 'desktop')
  const isInitialized = useRef(false)

  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth <= 768
      const newSize = isMobile ? 'mobile' : 'desktop'

      if (newSize !== lastSize.current || !isInitialized.current) {
        lastSize.current = newSize
        isInitialized.current = true

        // Use the new sync action for better state management
        dispatch(syncSidebarWithScreenSize())

        // Toggle compact density tokens on <html>
        const html = document.documentElement
        if (isMobile) {
          html.setAttribute('data-density', 'compact')
        } else {
          html.removeAttribute('data-density')
        }
      }
    }

    const debouncedResize = debounce(handleResize, 100)
    window.addEventListener('resize', debouncedResize)

    // Initial check - call immediately and mark as initialized
    handleResize()

    return () => {
      window.removeEventListener('resize', debouncedResize)
    }
  }, [dispatch])

  // Add logout listener for cross-tab logout detection
  useEffect(() => {
    const cleanup = addLogoutListener()
    return cleanup
  }, [])




  return (
    <SessionRefresher>
      <Router>
        <Suspense fallback={<div className="text-center pt-5"><CSpinner color="primary" /></div>}>
          <Routes>
          {/* Public Routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <PublicRoute>
                <ForgotPasswordPage />
              </PublicRoute>
            }
          />
          <Route
            path="/reset-password"
            element={<Navigate to="/forgot-password" replace />}
          />
          <Route
            path="/signup"
            element={
              <PublicRoute>
                <SignupPage />
              </PublicRoute>
            }
          />
          <Route
            path="/request-access"
            element={
              <PublicRoute>
                <RequestAccessPage />
              </PublicRoute>
            }
          />

          <Route
            path="/reset-password/:token"
            element={
              <PublicRoute>
                <ResetPasswordPage />
              </PublicRoute>
            }
          />

          {/* Public proposal by token */}
          <Route
            path="/p/:token"
            element={
              <PublicRoute>
                <PublicProposalPage />
              </PublicRoute>
            }
          />

          {/* All Protected Routes */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AppInitializer>
                  <DefaultLayout />
                </AppInitializer>
              </ProtectedRoute>
            }
          />

          {/* Catch-all for undefined routes */}
          <Route
            path="*"
            element={
              <Suspense fallback={<CSpinner color="primary" />}>
                <Page404 />
              </Suspense>
            }
          />
        </Routes>
      </Suspense>
    </Router>
    </SessionRefresher>
  )
}

export default App

