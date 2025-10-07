import { Navigate } from 'react-router-dom'
import { isAuthSessionActive } from '../utils/authSession'

const PublicRoute = ({ children }) => {
  const hasSession = isAuthSessionActive()

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
