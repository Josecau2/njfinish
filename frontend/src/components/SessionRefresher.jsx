import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { logout } from '../store/slices/authSlice'
import { clearAllTokens } from '../utils/authToken'
import { clearSessionFlag } from '../utils/authSession'

const SessionRefresher = ({ children }) => {
  const dispatch = useDispatch()

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const isFreshLogin = urlParams.has('_fresh')
    const isLogoutReload = urlParams.has('_logout')

    if (isFreshLogin || isLogoutReload) {
      clearAllTokens()
      clearSessionFlag()
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

  return children
}

export default SessionRefresher
