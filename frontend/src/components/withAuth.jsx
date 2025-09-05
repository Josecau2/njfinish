import React from 'react'
import { Navigate } from 'react-router-dom'

// Minimal guard: check only localStorage token; no API calls.
const withAuth = (Component) => {
	return function Wrapped(props) {
		try {
			const tok = typeof window !== 'undefined' ? localStorage.getItem('token') : null
			if (!tok) return <Navigate to="/login" replace />
		} catch {
			return <Navigate to="/login" replace />
		}
		return <Component {...props} />
	}
}

export default withAuth
