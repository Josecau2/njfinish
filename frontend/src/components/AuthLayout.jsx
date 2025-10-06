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

  return (
    <Flex minH="100vh" direction={{ base: 'column', lg: 'row' }}>
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
        bg={rightBg ?? fallbackRightBg}
        position="relative"
        px={{ base: 6, md: 10 }}
        py={{ base: 10, md: 16 }}
      >
        {showLanguageSwitcher ? (
          <Box position="absolute" top={{ base: 4, md: 6 }} right={{ base: 4, md: 6 }}>
            <LanguageSwitcher compact {...languageSwitcherProps} />
          </Box>
        ) : null}
        <Container maxW="md" p={0} {...rightContainerProps}>
          {children}
        </Container>
      </Flex>
    </Flex>
  )
}

export default AuthLayout
