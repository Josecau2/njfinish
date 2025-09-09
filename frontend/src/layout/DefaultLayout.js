import React, { useEffect, useMemo, useState } from 'react'
import { AppContent, AppSidebar, AppFooter, AppHeader } from '../components/index'
import TermsModal from '../components/TermsModal'
import { useSelector, useDispatch } from 'react-redux'
import { getLatestTerms } from '../helpers/termsApi'
import { isAdmin as isAdminCheck } from '../helpers/permissions'
import { logout } from '../store/slices/authSlice'
import { useLocation, useNavigate } from 'react-router-dom'
import { setSidebarShow } from '../store/slices/sidebarSlice'

// Import global style layers after CoreUI
import '../styles/_tokens.scss'
import '../styles/_mixins.scss'
import '../styles/_modern.scss'
import '../styles/_coreui-overrides.scss'
import '../styles/_responsive.scss'

const DefaultLayout = () => {
  const user = useSelector((s) => s.auth.user)
  const sidebarShow = useSelector((state) => state.sidebar.sidebarShow)
  const isAdmin = useMemo(() => isAdminCheck(user), [user])
  const [forceTerms, setForceTerms] = useState(false)
  const [latestVersion, setLatestVersion] = useState(null)
  const [loading, setLoading] = useState(true)
  const [hasInitialized, setHasInitialized] = useState(false)
  const dispatch = useDispatch()
  const location = useLocation()
  const navigate = useNavigate()

  // Set compact density on mobile
  useEffect(() => {
    const updateDensity = () => {
      if (window.innerWidth <= 576) {
        document.documentElement.dataset.density = 'compact'
      } else {
        delete document.documentElement.dataset.density
      }
    }

    updateDensity()
    window.addEventListener('resize', updateDensity)
    return () => window.removeEventListener('resize', updateDensity)
  }, [])

  useEffect(() => {
    // Handle initial app load vs logout scenarios
    if (!user) {
      if (!hasInitialized) {
        // Initial app load - user will be loaded by auth middleware
        setLoading(true)
        return
      } else {
        // User was logged out - navigate to login immediately
        setLoading(false)
        navigate('/login', { replace: true })
        return
      }
    }

    // Mark that we've seen a user (app has initialized)
    if (!hasInitialized) {
      setHasInitialized(true)
    }

    (async () => {
      try {
        // If user is admin, never show terms
        if (isAdmin) {
          setForceTerms(false)
          setLoading(false)
          return
        }

        const res = await getLatestTerms()
        const v = res?.data?.data?.version
        const alreadyAccepted = !!res?.data?.data?.accepted
        setLatestVersion(v || null)

        if (v) {
          const key = `terms.accepted.v${v}`
          // Prefer server truth; fall back to cached localStorage if server couldn’t say
          if (alreadyAccepted) {
            localStorage.setItem(key, '1')
            setForceTerms(false)
          } else {
            const cached = localStorage.getItem(key)
            setForceTerms(!cached)
          }
        } else {
          setForceTerms(false)
        }
        setLoading(false)
      } catch {
        setForceTerms(false)
        setLoading(false)
      }
    })()
  }, [user, isAdmin, hasInitialized, navigate])

  const handleAccepted = () => {
    if (latestVersion) {
      localStorage.setItem(`terms.accepted.v${latestVersion}`, '1')
    }
    setForceTerms(false)
  }

  const handleRejected = () => {
    dispatch(logout())
  }

  // Auto-close sidebar on route changes for small screens
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      dispatch(setSidebarShow(false))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  // Show loading only during initial load or terms checking
  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    )
  }

  // If user is null and we're not loading, we shouldn't be here
  // This should have been handled by the useEffect navigation
  if (!user) {
    return null
  }

  // If non-admin user must accept terms, block the entire app
  if (!isAdmin && forceTerms) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="text-center">
          <h4 className="mb-4">Terms & Conditions Required</h4>
          <p className="text-muted mb-4">You must review and accept the terms and conditions to continue.</p>
          <TermsModal
            visible={true}
            onClose={handleAccepted}
            onReject={handleRejected}
            isForced={true}
            requireScroll={true}
          />
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Mobile-optimized CSS injection */}
      <style>{`
        .modern-layout {
          min-height: 100vh;
          position: relative;
          /* Guard against any accidental horizontal overflow on desktop */
          overflow-x: hidden;
        }

        .modern-layout__wrapper {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          margin-left: 0;
          transition: margin-left 0.15s ease-in-out;
        }

        .modern-layout__main {
          flex: 1;
          padding: 0;
          overflow-x: hidden;
        }

  /* Mobile-first responsive adjustments */
        @media (max-width: 767.98px) {
          .modern-layout__wrapper {
            margin-left: 0 !important;
          }

          .modern-layout__main {
            padding: 0.5rem;
          }

          /* Use general sibling: overlay sits between .sidebar and wrapper */
          .sidebar.show ~ .modern-layout__wrapper {
            margin-left: 0;
          }
        }

        /* Tablet adjustments */
        @media (min-width: 768px) and (max-width: 991.98px) {
          .modern-layout__main {
            padding: 0.75rem;
          }
        }

      /* Desktop adjustments */
        @media (min-width: 992px) {
       .modern-layout__wrapper { margin-left: 260px; }
       /* When the sidebar collapses to narrow, shrink content offset too.
         Use general sibling (~) because the overlay element is between */
       .sidebar.sidebar-narrow ~ .modern-layout__wrapper { margin-left: 56px; }

          .modern-layout__main {
            padding: 1rem;
          }
        }

        @media (min-width: 1200px) {
          .modern-layout__main {
            padding: 1.5rem;
          }
        }

        /* Overlay for mobile sidebar */
        .mobile-sidebar-overlay {
          position: fixed;
          top: 0;
          left: 0;
          /* Avoid 100vw trap which can cause right-side overflow on desktop */
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          z-index: 1030;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.15s ease-in-out, visibility 0.15s ease-in-out;
        }

        .mobile-sidebar-overlay.show {
          opacity: 1;
          visibility: visible;
        }

        @media (min-width: 768px) {
          .mobile-sidebar-overlay {
            display: none !important;
          }
        }
      `}</style>

      <div className="modern-layout">
        <AppSidebar />

        {/* Mobile overlay */}
        <div
          className={`mobile-sidebar-overlay d-lg-none ${sidebarShow ? 'show' : ''}`}
          onClick={() => dispatch(setSidebarShow(false))}
        />

  {/* Drop CoreUI's .wrapper here to avoid sidebar padding-inline affecting content width */}
  <div className="modern-layout__wrapper d-flex flex-column">
          <AppHeader />
          <div className="modern-layout__main body flex-grow-1 main">
            <AppContent />
          </div>
          <AppFooter />
        </div>
      </div>
    </>
  )
}

export default DefaultLayout
