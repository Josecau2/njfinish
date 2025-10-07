import { Navigate, useLocation } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { useEffect } from 'react'
import { setUser } from '../store/slices/authSlice'
import { isAuthSessionActive } from '../utils/authSession'

const ProtectedRoute = ({ children }) => {
  const dispatch = useDispatch()
  const location = useLocation()
  const user = useSelector((state) => state.auth?.user)

  useEffect(() => {
    if (!user) {
      try {
        const storedUser = localStorage.getItem('user')
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser)
          dispatch(setUser({ user: parsedUser, token: null }))
        }
      } catch (error) {
        console.error('Error parsing stored user data:', error)
        try {
          localStorage.removeItem('user')
        } catch {}
      }
    }
  }, [dispatch, user])

  const isAuthenticated = isAuthSessionActive()

  if (!isAuthenticated) {
    try {
      const here = `${location.pathname}${location.search || ''}${location.hash || ''}`
      sessionStorage.setItem('return_to', here || '/')
    } catch {}
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute
