import React, { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Center, Spinner } from '@chakra-ui/react'
import { isAuthSessionActive } from '../utils/authSession'

const withAuthGuard = (Component) => {
  return function Guarded(props) {
    const [isChecking, setIsChecking] = useState(true)
    const [hasSession, setHasSession] = useState(false)

    useEffect(() => {
      try {
        setHasSession(isAuthSessionActive())
      } catch {
        setHasSession(false)
      } finally {
        setIsChecking(false)
      }
    }, [])

    if (isChecking) {
      return (
        <Center h="100vh" role="status" aria-live="polite" aria-label="Checking authentication">
          <Spinner size="lg" color="brand.500" thickness="3px" speed="0.65s" />
        </Center>
      )
    }

    if (!hasSession) {
      return <Navigate to="/login" replace />
    }

    return <Component {...props} />
  }
}

export default withAuthGuard
