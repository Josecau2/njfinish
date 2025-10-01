import React from 'react'
import { Box, Text, Icon, VStack } from '@chakra-ui/react'
import { Search } from 'lucide-react'

const EmptyState = ({
  title = 'Nothing here yet',
  subtitle = 'Try adjusting your filters or create a new item.',
  icon: IconComponent = Search,
  className = '',
  children,
}) => {
  return (
    <VStack spacing={4} py={4} textAlign="center" className={className} role="status" aria-live="polite">
      <Box opacity={0.35}>
        <Icon as={IconComponent} boxSize={8} />
      </Box>
      <Text fontWeight="semibold" aria-atomic="true">
        {title}
      </Text>
      <Text color="gray.500" fontSize="sm">
        {subtitle}
      </Text>
      {children}
    </VStack>
  
  )
}

export default EmptyState
