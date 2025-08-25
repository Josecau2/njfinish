import React from 'react'
// Minimal permission gate that always allows; replace with real checks using state.notification or user permissions
export default function PermissionGate({ children }) {
	return <>{children}</>
}

