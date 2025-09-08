import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { getFreshestToken } from '../utils/authToken'

// Minimal guard: check only localStorage token; no API calls. Preserves return_to.
const withAuth = (Component) => {
	return function Wrapped(props) {
		const location = useLocation();
		try {
			const tok = typeof window !== 'undefined' ? getFreshestToken() : null;
			if (!tok) {
				try {
					const here = `${location.pathname}${location.search || ''}${location.hash || ''}`;
					sessionStorage.setItem('return_to', here || '/');
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
