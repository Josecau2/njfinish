import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { isAuthSessionActive } from '../utils/authSession'

const withAuth = (Component) => {
  return function Wrapped(props) {
    const location = useLocation()

    try {
      if (!isAuthSessionActive()) {
        try {
          const here = `${location.pathname}${location.search || ''}${location.hash || ''}`
          sessionStorage.setItem('return_to', here || '/')
        } catch {}
        return <Navigate to="/login" replace />
      }
    } catch {
      return <Navigate to="/login" replace />
    }

    return <Component {...props} />
  }
}

export default withAuth
