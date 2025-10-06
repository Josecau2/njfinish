import React from 'react'
import { Box, Heading, Text, VStack, Code } from '@chakra-ui/react'

/**
 * Developer-only audit playground routes.
 *
 * The legacy audit workspace was removed to keep the repo clean, but App.jsx
 * still expects an `AuditRoutes` component for dev builds. This placeholder
 * keeps the lazy import working and provides guidance when the route is visited.
 */
export const AuditRoutes = () => {
  return (
    <Box px={6} py={10} maxW="3xl">
      <VStack align="start" spacing={6}>
        <Heading size="lg">Audit Workspace Placeholder</Heading>
        <Text>
          The previous audit tooling has been intentionally removed. If you need
          to reintroduce audit dashboards or route experiments, replace this file
          with the desired implementation. The rest of the application will
          continue to function even if this route remains a stub.
        </Text>
        <Text>
          To restore custom audit tooling, implement your own routes here and
          export them as <Code>AuditRoutes</Code>.
        </Text>
      </VStack>
    </Box>
  )
}

export default AuditRoutes