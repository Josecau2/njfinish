import { Navigate } from 'react-router-dom'
import { getFreshestToken } from '../utils/authToken'

const PublicRoute = ({ children }) => {
  const token = getFreshestToken()

  if (token) {
    // If already authenticated, redirect to the last intended route if any
    let dest = '/'
    try {
      const stored = sessionStorage.getItem('return_to')
      if (stored && typeof stored === 'string' && stored.startsWith('/')) {
        dest = stored
      }
      // Clear the hint to avoid loops on subsequent visits
      sessionStorage.removeItem('return_to')
    } catch {}
    return <Navigate to={dest} replace />
  }

  return children
}

export default PublicRoute
