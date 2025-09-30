import React from 'react'
import { Button } from '@chakra-ui/react'

// Lightweight wrapper to preserve legacy usage of CButton while using Chakra UI
// - Supports both `colorScheme` and legacy `status` prop (mapped below)
// - Forwards all other props to Chakra's Button
const statusToColorScheme = (status) => {
	switch ((status || '').toLowerCase()) {
		case 'primary':
			return 'blue'
		case 'secondary':
			return 'gray'
		case 'success':
			return 'green'
		case 'danger':
			return 'red'
		case 'warning':
			return 'yellow'
		case 'info':
			return 'blue'
		case 'light':
			return 'gray'
		case 'dark':
			return 'gray'
		default:
			return undefined
	}
}

const CButton = React.forwardRef(function CButton(
	{ status, colorScheme, children, ...rest },
	ref,
) {
	const mappedScheme = colorScheme || statusToColorScheme(status)
	return (
		<Button ref={ref} colorScheme={mappedScheme} {...rest}>
			{children}
		</Button>
	)
})

export default CButton

