import { Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import axiosInstance from '../helpers/axiosInstance'
import { isAuthSessionActive } from '../utils/authSession'

const PublicRoute = ({ children }) => {
  const [checked, setChecked] = useState(false)
  const [hasSession, setHasSession] = useState(false)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      // Optimization/noise reduction: if there is clearly no visible session cookie,
      // skip calling /api/me on the login page to avoid a 401 network entry.
      const hintHasCookie = isAuthSessionActive()
      if (!hintHasCookie) {
        if (mounted) {
          setHasSession(false)
          setChecked(true)
        }
        return
      }

      try {
        const res = await axiosInstance.get('/api/me')
        if (!mounted) return
        setHasSession(!!res?.data?.id)
      } catch (_) {
        if (!mounted) return
        setHasSession(false)
      } finally {
        if (mounted) setChecked(true)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  if (!checked) return children

  if (hasSession) {
    let dest = '/'
    try {
      const stored = sessionStorage.getItem('return_to')
      if (stored && typeof stored === 'string' && stored.startsWith('/')) {
        dest = stored
      }
      sessionStorage.removeItem('return_to')
    } catch {}
    return <Navigate to={dest} replace />
  }

  return children
}

export default PublicRoute
