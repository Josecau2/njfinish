import { Navigate, useLocation } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { useEffect, useState } from 'react'
import { setUser } from '../store/slices/authSlice'
import { isAuthSessionActive } from '../utils/authSession'
import axiosInstance from '../helpers/axiosInstance'
import { performLogout } from '../utils/logout'
import { Center, Spinner, Box, Text, Button, VStack } from '@chakra-ui/react'

const ProtectedRoute = ({ children }) => {
  const dispatch = useDispatch()
  const location = useLocation()
  const user = useSelector((state) => state.auth?.user)
  const [isValidating, setIsValidating] = useState(true)
  const [isValid, setIsValid] = useState(false)
  const [redirectLoopDetected, setRedirectLoopDetected] = useState(false)

  useEffect(() => {
    const validateSession = async () => {
      // Check for infinite redirect loop
      const redirectCount = parseInt(sessionStorage.getItem('auth_redirect_count') || '0', 10)

      if (redirectCount >= 3) {
        // Clear the counter and show error
        sessionStorage.removeItem('auth_redirect_count')
        setIsValidating(false)
        setIsValid(false)
        setRedirectLoopDetected(true)
        return
      }

      // Always validate session with backend, regardless of frontend cookie visibility
      try {
        const response = await axiosInstance.get('/api/me')
        if (response.data) {
          // Session is valid, update Redux state
          // Clear redirect counter on success
          sessionStorage.removeItem('auth_redirect_count')
          dispatch(setUser({ user: response.data }))
          setIsValid(true)
        } else {
          // Invalid response
          // Increment redirect counter
          const newCount = redirectCount + 1
          sessionStorage.setItem('auth_redirect_count', String(newCount))
          await performLogout({ reason: 'session-invalid' })
          setIsValid(false)
        }
      } catch (error) {
        // Session validation failed - logout
        console.error('Session validation failed:', error)
        // Increment redirect counter
        const newCount = redirectCount + 1
        sessionStorage.setItem('auth_redirect_count', String(newCount))
        await performLogout({ reason: 'session-invalid' })
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
      <Center h="100vh" role="status" aria-live="polite" aria-label="Validating session">
        <Spinner size="lg" color="brand.500" thickness="3px" speed="0.65s" />
      </Center>
    )
  }

  // Show error page if redirect loop detected
  if (redirectLoopDetected) {
    return (
      <Center h="100vh" p={4}>
        <VStack gap={4} maxW="md" textAlign="center">
          <Box fontSize="4xl">⚠️</Box>
          <Text fontSize="2xl" fontWeight="bold">
            Authentication Error
          </Text>
          <Text color="gray.600">
            We detected an authentication redirect loop. This typically occurs when there's a
            session configuration issue.
          </Text>
          <Text color="gray.600">
            Please try clearing your browser cache and cookies, or contact support if the problem
            persists.
          </Text>
          <Button
            colorScheme="brand"
            onClick={() => {
              sessionStorage.clear()
              window.location.href = '/login'
            }}
            aria-label="Return to login page"
          >
            Return to Login
          </Button>
        </VStack>
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
