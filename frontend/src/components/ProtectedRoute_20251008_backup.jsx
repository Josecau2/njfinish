import { Navigate, useLocation } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { useEffect, useState } from 'react'
import { setUser, logout } from '../store/slices/authSlice'
import { isAuthSessionActive } from '../utils/authSession'
import axiosInstance from '../helpers/axiosInstance'
import { Center, Spinner } from '@chakra-ui/react'

const ProtectedRoute = ({ children }) => {
  const dispatch = useDispatch()
  const location = useLocation()
  const user = useSelector((state) => state.auth?.user)
  const [isValidating, setIsValidating] = useState(true)
  const [isValid, setIsValid] = useState(false)

  useEffect(() => {
    const validateSession = async () => {
      // Check if we have session cookie
      const hasSession = isAuthSessionActive()

      if (!hasSession) {
        // No session cookie - user is not authenticated
        setIsValidating(false)
        setIsValid(false)
        return
      }

      // Validate session with backend
      try {
        const response = await axiosInstance.get('/api/me')
        if (response.data) {
          // Session is valid, update Redux state
          dispatch(setUser({ user: response.data }))
          setIsValid(true)
        } else {
          // Invalid response
          dispatch(logout())
          setIsValid(false)
        }
      } catch (error) {
        // Session validation failed - logout
        console.error('Session validation failed:', error)
        dispatch(logout())
        setIsValid(false)
      } finally {
        setIsValidating(false)
      }
    }

    validateSession()
  }, [dispatch])

  // Show loading spinner while validating
  if (isValidating) {
    return (
      <Center h="100vh">
        <Spinner size="lg" color="brand.500" thickness="3px" speed="0.65s" />
      </Center>
    )
  }

  // If session is not valid, redirect to login
  if (!isValid) {
    try {
      const here = `${location.pathname}${location.search || ''}${location.hash || ''}`
      sessionStorage.setItem('return_to', here || '/')
    } catch {}
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute
