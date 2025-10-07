import React from 'react'
import { Box, Container, Flex, useColorModeValue } from '@chakra-ui/react'
import LanguageSwitcher from './LanguageSwitcher'

const AuthLayout = ({
  leftContent,
  leftBg,
  leftTextColor,
  leftProps,
  rightBg,
  children,
  showLanguageSwitcher = true,
  languageSwitcherProps,
  rightContainerProps,
}) => {
  const fallbackLeftBg = useColorModeValue('gray.900', 'gray.900')
  const fallbackLeftText = useColorModeValue('white', 'gray.100')
  const fallbackRightBg = useColorModeValue('white', 'gray.800')

  // Enhanced mobile gradients
  const mobileGradient = useColorModeValue(
    'linear-gradient(180deg, rgba(226,232,240,1) 0%, rgba(248,250,252,1) 100%)',
    'linear-gradient(180deg, rgba(15,23,42,1) 0%, rgba(30,41,59,1) 100%)'
  )

  return (
    <Flex
      minH="100vh"
      direction={{ base: 'column', lg: 'row' }}
      bg={{ base: mobileGradient, lg: 'transparent' }}
    >
      {leftContent ? (
        <Flex
          flex={{ base: '0', lg: 1 }}
          display={{ base: 'none', lg: 'flex' }}
          bg={leftBg ?? fallbackLeftBg}
          color={leftTextColor ?? fallbackLeftText}
          align="center"
          justify="center"
          px={{ lg: 12 }}
          py={{ lg: 16 }}
          {...leftProps}
        >
          {leftContent}
        </Flex>
      ) : null}

      <Flex
        flex="1"
        align="center"
        justify="center"
        bg={{ base: 'transparent', lg: rightBg ?? fallbackRightBg }}
        position="relative"
        px={{ base: 4, sm: 6, md: 10 }}
        py={{ base: 8, sm: 10, md: 16 }}
        pt={{ base: showLanguageSwitcher ? '60px' : 8, sm: showLanguageSwitcher ? '70px' : 10, md: 16 }}
      >
        {showLanguageSwitcher ? (
          <Box
            position="absolute"
            top={{ base: 3, sm: 4, md: 6 }}
            right={{ base: 3, sm: 4, md: 6 }}
            zIndex="dropdown"
            bg={{ base: useColorModeValue('white', 'gray.800'), lg: 'transparent' }}
            borderRadius={{ base: 'lg', lg: 'none' }}
            boxShadow={{ base: useColorModeValue('0 2px 8px rgba(0,0,0,0.1)', '0 2px 8px rgba(0,0,0,0.3)'), lg: 'none' }}
            p={{ base: 2, lg: 0 }}
          >
            <LanguageSwitcher compact {...languageSwitcherProps} />
          </Box>
        ) : null}
        <Container
          maxW="md"
          p={0}
          {...rightContainerProps}
        >
          <Box
            bg={{ base: useColorModeValue('white', 'gray.800'), lg: 'transparent' }}
            borderRadius={{ base: 'xl', lg: 'none' }}
            boxShadow={{ base: useColorModeValue('0 8px 24px rgba(0,0,0,0.12)', '0 8px 24px rgba(0,0,0,0.4)'), lg: 'none' }}
            p={{ base: 6, sm: 8, md: 10 }}
            backdropFilter={{ base: 'blur(10px)', lg: 'none' }}
            border={{ base: '1px solid', lg: 'none' }}
            borderColor={{ base: useColorModeValue('gray.200', 'gray.700'), lg: 'transparent' }}
          >
            {children}
          </Box>
        </Container>
      </Flex>
    </Flex>
  )
}

export default AuthLayout
