import React from 'react'
import { Box, Spinner, Text, Center, VStack, useColorModeValue } from '@chakra-ui/react'

const Loader = () => {
  return (
    <Center h="100vh" role="status" aria-live="polite" aria-busy="true">
      <VStack spacing={3}>
        <Spinner
          size="xl"
          thickness="4px"
          speed="0.65s"
          color="brand.500"
          aria-hidden="true"
        />
        <Text fontSize="sm" color={useColorModeValue("gray.500","gray.400")}>
          Loading…
        </Text>
      </VStack>
    </Center>
  )
}

export default Loader
