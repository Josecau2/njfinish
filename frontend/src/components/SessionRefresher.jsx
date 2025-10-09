import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useToast } from '@chakra-ui/react'
import { jwtDecode } from 'jwt-decode'
import { logout } from '../store/slices/authSlice'
import { clearAllTokens, getFreshestToken } from '../utils/authToken'
import { fetchApiToken } from '../helpers/axiosInstance'

const SessionRefresher = ({ children }) => {
  const dispatch = useDispatch()
  const toast = useToast()

  // Handle URL params for fresh login/logout
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const isFreshLogin = urlParams.has('_fresh')
    const isLogoutReload = urlParams.has('_logout')

    if (isFreshLogin || isLogoutReload) {
      clearAllTokens()
      dispatch(logout())

      try {
        const url = new URL(window.location)
        url.searchParams.delete('_fresh')
        url.searchParams.delete('_logout')
        url.searchParams.delete('_t')
        if (url.search !== window.location.search) {
          window.history.replaceState({}, '', url)
        }
      } catch {}
    }
  }, [dispatch])

  // Proactive token refresh - check every 60 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const token = getFreshestToken()
        if (token) {
          const decoded = jwtDecode(token)
          const timeLeft = decoded.exp - Math.floor(Date.now() / 1000)

          // If less than 5 minutes remaining, refresh proactively
          if (timeLeft > 0 && timeLeft < 5 * 60) {
            await fetchApiToken()
            toast({
              title: 'Session Extended',
              description: 'Your session has been extended',
              status: 'info',
              duration: 3000,
              isClosable: true,
              position: 'bottom-right',
            })
          }
        }
      } catch {
        // Silently fail - token may be invalid or missing
      }
    }, 60000) // Every minute

    return () => clearInterval(interval)
  }, [toast])

  // Page Visibility API - refresh on tab focus if < 10 minutes
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!document.hidden) {
        try {
          const token = getFreshestToken()
          if (token) {
            const decoded = jwtDecode(token)
            const timeLeft = decoded.exp - Math.floor(Date.now() / 1000)

            // If less than 10 minutes remaining, refresh when user returns to tab
            if (timeLeft > 0 && timeLeft < 10 * 60) {
              await fetchApiToken()
            }
          }
        } catch {
          // Silently fail
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  return children
}

export default SessionRefresher
