import { Navigate, useLocation } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { useEffect } from 'react'
import { setUser } from '../store/slices/authSlice'
import { getFreshestToken } from '../utils/authToken'

const ProtectedRoute = ({ children }) => {
  const dispatch = useDispatch()
  const location = useLocation()
  const token = useSelector((state) => state.auth?.token)
  const user = useSelector((state) => state.auth?.user)

  // Restore user data from localStorage if not in Redux
  useEffect(() => {
    const storedToken = getFreshestToken()
    const storedUser = localStorage.getItem('user')

    if (storedToken && storedUser && !user) {
      try {
        const parsedUser = JSON.parse(storedUser)
        dispatch(setUser({ user: parsedUser, token: storedToken }))
      } catch (error) {
        console.error('Error parsing stored user data:', error)
        localStorage.removeItem('user')
        localStorage.removeItem('token')
      }
    }
  }, [dispatch, user])

  // Check both Redux store and localStorage for backward compatibility
  const isAuthenticated = token || getFreshestToken()

  if (!isAuthenticated) {
    // Preserve intended destination to return after login
    try {
      const here = `${location.pathname}${location.search || ''}${location.hash || ''}`
      sessionStorage.setItem('return_to', here || '/')
    } catch {}
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute
