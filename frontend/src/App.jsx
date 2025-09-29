import React, { Suspense, useEffect, useRef } from 'react'
import { BrowserRouter as Router, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Center, Spinner } from '@chakra-ui/react'
import './tailwind.css'
import './scss/style.scss'
import './scss/examples.scss'
import './main.css'
import './responsive.css'
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
import { syncSidebarWithScreenSize } from './store/slices/sidebarSlice'
import { useDispatch } from 'react-redux'
import { debounce } from 'lodash'
import { addLogoutListener } from './utils/browserCleanup'
import performanceMonitor from './utils/performanceMonitor'

const DefaultLayout = React.lazy(() => import('./layout/DefaultLayout.jsx'))
const Page404 = React.lazy(() => import('./views/pages/page404/Page404.jsx'))

const LoadingFallback = () => (
  <Center py={10}>
    <Spinner size='lg' color='brand.500' thickness='3px' speed='0.65s' />
  </Center>
)

const AppContent = () => {
  const dispatch = useDispatch()
  const location = useLocation()
  const lastSize = useRef(
    typeof window !== 'undefined' && window.innerWidth <= 768 ? 'mobile' : 'desktop',
  )
  const isInitialized = useRef(false)

  useEffect(() => {
    const timer = setTimeout(() => performanceMonitor.init(), 100)
    return () => clearTimeout(timer)
  }, [location.pathname])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return () => {}
    }

    const handleResize = () => {
      const isMobile = window.innerWidth <= 768
      const nextSize = isMobile ? 'mobile' : 'desktop'

      if (nextSize !== lastSize.current || !isInitialized.current) {
        lastSize.current = nextSize
        isInitialized.current = true

        dispatch(syncSidebarWithScreenSize())

        if (isMobile) {
          document.documentElement.setAttribute('data-density', 'compact')
        } else {
          document.documentElement.removeAttribute('data-density')
        }
      }
    }

    const debouncedResize = debounce(handleResize, 250)
    window.addEventListener('resize', debouncedResize)
    handleResize()

    return () => {
      window.removeEventListener('resize', debouncedResize)
      debouncedResize.cancel()
    }
  }, [dispatch])

  useEffect(() => {
    addLogoutListener()
  }, [])

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path='/login'
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path='/forgot-password'
        element={
          <PublicRoute>
            <ForgotPasswordPage />
          </PublicRoute>
        }
      />
      <Route path='/reset-password' element={<Navigate to='/forgot-password' replace />} />
      <Route
        path='/signup'
        element={
          <PublicRoute>
            <SignupPage />
          </PublicRoute>
        }
      />
      <Route
        path='/request-access'
        element={
          <PublicRoute>
            <RequestAccessPage />
          </PublicRoute>
        }
      />
      <Route
        path='/reset-password/:token'
        element={
          <PublicRoute>
            <ResetPasswordPage />
          </PublicRoute>
        }
      />

      {/* Public proposal by token */}
      <Route
        path='/p/:token'
        element={
          <PublicRoute>
            <PublicProposalPage />
          </PublicRoute>
        }
      />

      {/* Protected application */}
      <Route
        path='/*'
        element={
          <ProtectedRoute>
            <AppInitializer>
              <DefaultLayout />
            </AppInitializer>
          </ProtectedRoute>
        }
      />

      {/* Catch-all */}
      <Route
        path='*'
        element={
          <Suspense fallback={<LoadingFallback />}>
            <Page404 />
          </Suspense>
        }
      />
    </Routes>
  )
}

const App = () => (
  <SessionRefresher>
    <Router>
      <Suspense fallback={<LoadingFallback />}>
        <AppContent />
      </Suspense>
    </Router>
  </SessionRefresher>
)

export default App
