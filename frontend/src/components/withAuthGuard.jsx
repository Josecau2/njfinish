import React, { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
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
      return null
    }

    if (!hasSession) {
      return <Navigate to="/login" replace />
    }

    return <Component {...props} />
  }
}

export default withAuthGuard
