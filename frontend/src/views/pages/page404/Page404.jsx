import React from 'react'
import { Box, Container, Input, Flex, Heading, Text, InputGroup, InputLeftElement, VStack, HStack, Icon } from '@chakra-ui/react'
import { AppButton } from '../../../components/common/AppButton'
import { Search } from 'lucide-react'

const Page404 = () => {
  return (
    <Box minH="100vh" display="flex" alignItems="center" bg="gray.50" role="main">
      <Container maxW="container.md">
        <Flex justify="center">
          <Box maxW="md" w="full">
            <Box role="region" aria-label="Page not found">
              <HStack spacing={4} align="start" mb={6}>
                <Heading
                  size="4xl"
                  fontWeight="bold"
                  color="gray.400"
                  aria-hidden="true"
                >
                  404
                </Heading>
                <VStack align="start" spacing={4}>
                  <Heading size="lg" pt={3}>
                    Oops! You're lost.
                  </Heading>
                  <Text color="gray.600">
                    The page you are looking for was not found.
                  </Text>
                </VStack>
              </HStack>
            </Box>
            <InputGroup role="search" size="lg">
              <InputLeftElement pointerEvents="none">
                <Icon as={Search} color="gray.400" />
              </InputLeftElement>
              <Input
                type="text"
                placeholder="What are you looking for?"
                aria-label="Search site"
                name="search"
                id="page404-search"
                borderRightRadius={0}
              />
              <AppButton
                colorScheme="brand"
                size="lg"
                type="button"
                aria-label="Search"
                borderLeftRadius={0}
              >
                Search
              </AppButton>
            </InputGroup>
          </Box>
        </Flex>
      </Container>
    </Box>
  )
}
export default Page404
