import React, { useEffect, useMemo, useState } from 'react'
import { AppContent, AppSidebar, AppFooter, AppHeader } from '../components/index'
import TermsModal from '../components/TermsModal'
import { useSelector, useDispatch } from 'react-redux'
import { getLatestTerms } from '../helpers/termsApi'
import { isAdmin as isAdminCheck } from '../helpers/permissions'
import { logout } from '../store/slices/authSlice'
import { useLocation } from 'react-router-dom'
import { setSidebarShow } from '../store/slices/sidebarSlice'

// Import global style layers after CoreUI
import '../styles/_tokens.scss'
import '../styles/_mixins.scss'
import '../styles/_modern.scss'
import '../styles/_coreui-overrides.scss'
import '../styles/_responsive.scss'

const DefaultLayout = () => {
  const user = useSelector((s) => s.auth.user)
  const isAdmin = useMemo(() => isAdminCheck(user), [user])
  const [forceTerms, setForceTerms] = useState(false)
  const [latestVersion, setLatestVersion] = useState(null)
  const [loading, setLoading] = useState(true)
  const dispatch = useDispatch()
  const location = useLocation()

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
    // Don't check terms until we have user data
    if (!user) {
      setLoading(true)
      return
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
  }, [user, isAdmin])

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

  // Show loading while checking user status
  if (loading || !user) {
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
    <div>
      <AppSidebar />
      <div className="wrapper d-flex flex-column min-vh-100">
        <AppHeader />
        <div className="body flex-grow-1 main">
          <AppContent />
        </div>
        <AppFooter />
      </div>
    </div>
  )
}

export default DefaultLayout
