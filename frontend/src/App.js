import React, { Suspense, useRef, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { CSpinner } from '@coreui/react'
import './scss/style.scss'
import './scss/examples.scss'
import './main.css'
import './responsive.css'
import LoginPage from './pages/auth/LoginPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import SignupPage from './pages/auth/SignupPage'
import ProtectedRoute from './components/ProtectedRoute'
import PublicRoute from './components/PublicRoute'
import PublicProposalPage from './pages/public/PublicProposalPage'
import AppInitializer from './components/AppInitializer'
import { setSidebarShow } from './store/slices/sidebarSlice' 
import { useDispatch } from 'react-redux'
import { debounce } from 'lodash' 


const DefaultLayout = React.lazy(() => import('./layout/DefaultLayout'))
const Page404 = React.lazy(() => import('./views/pages/page404/Page404'))

const App = () => {

  const dispatch = useDispatch()

  const lastSize = useRef(window.innerWidth <= 768 ? 'mobile' : 'desktop');
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth <= 768
      const newSize = isMobile ? 'mobile' : 'desktop'

      if (newSize !== lastSize.current) {
        lastSize.current = newSize
        dispatch(setSidebarShow(!isMobile)) // ✅ Show on desktop, hide on mobile
      }
    }

    const debouncedResize = debounce(handleResize, 150)
    window.addEventListener('resize', debouncedResize)

    // Initial check (call only once)
    handleResize()

    return () => {
      window.removeEventListener('resize', debouncedResize)
    }
  }, [dispatch])




  return (
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
            path="/reset-password"
            element={
              <PublicRoute>
                <ForgotPasswordPage />
              </PublicRoute>
            }
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
  )
}

export default App
