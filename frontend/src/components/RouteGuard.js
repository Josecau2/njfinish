import React from 'react'

// Minimal passthrough guard to unblock build; extend with auth/permission checks if needed
export default function RouteGuard({ children }) {
	return <>{children}</>
}

