import React from 'react'
import { Flex, HStack, Badge, useColorModeValue } from '@chakra-ui/react'

const SecondaryToolbar = ({ children, ...props }) => {
  const bg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('rgba(15,23,42,0.15)', 'rgba(255,255,255,0.08)')

  return (
    <Flex
      position="sticky"
      top="60px"
      h="50px"
      w="full"
      zIndex="1010"
      bg={bg}
      borderBottom="1px solid"
      borderColor={borderColor}
      px={{ base: 4, md: 6 }}
      align="center"
      overflowX="auto"
      data-scroll-region
      {...props}
    >
      <HStack spacing={2} align="center" minW="fit-content">
        {children}
      </HStack>
    </Flex>
  )
}

export default SecondaryToolbar