import React from 'react'
import { Box, Text, Icon, VStack, useColorModeValue } from '@chakra-ui/react'
import { Search } from 'lucide-react'

const EmptyState = ({
  title = 'Nothing here yet',
  subtitle = 'Try adjusting your filters or create a new item.',
  icon: IconComponent = Search,
  children,
}) => {
  const subtitleColor = useColorModeValue('gray.500', 'gray.400')

  return (
    <VStack spacing={4} py={4} textAlign="center" role="status" aria-live="polite">
      <Box opacity={0.35}>
        <Icon as={IconComponent} boxSize={8} />
      </Box>
      <Text fontWeight="semibold" aria-atomic="true">
        {title}
      </Text>
      <Text color={subtitleColor} fontSize="sm">
        {subtitle}
      </Text>
      {children}
    </VStack>

  )
}

export default EmptyState
