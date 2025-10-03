import React, { useEffect, useRef } from 'react'
import { Box, useColorModeValue } from '@chakra-ui/react'

export default function EmbeddedPaymentForm({
  src,
  title = 'Secure payment',
  onLoad,
  height = 780,
  allow = 'payment *; clipboard-write *',
  sandbox,
  className = '',
}) {
  const frameRef = useRef(null)
  const frameBg = useColorModeValue('white', 'gray.800')

  useEffect(() => {
    const onMessage = (event) => {
      try {
        if (!event?.data || typeof event.data !== 'object') return
        if (event.data.type === 'embed:resize' && event.data.height && frameRef.current) {
          const nextHeight = Math.max(400, Number(event.data.height))
          frameRef.current.style.height = `${nextHeight}px`
        }
      } catch (error) {
        // ignore malformed postMessage payloads
      }
    }

    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  return (
    <Box className={className} maxW="900px" mx="auto">
      <Box as="iframe"
        ref={frameRef}
        src={src}
        title={title}
        aria-label={title}
        height={height}
        allow={allow}
        sandbox={sandbox}
        scrolling="no"
        width="100%"
        border="0"
        borderRadius="lg"
        bg={frameBg}
        boxShadow="sm"
        onLoad={onLoad}
      />
    </Box>
  )
}
