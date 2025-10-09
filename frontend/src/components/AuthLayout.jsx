import React from 'react'
import PropTypes from 'prop-types'
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
  accentColor, // New prop for customization-based accent
}) => {
  const fallbackLeftBg = useColorModeValue('gray.900', 'gray.900')
  const fallbackLeftText = useColorModeValue('white', 'gray.100')
  const fallbackRightBg = useColorModeValue('white', 'gray.800')

  // Derive gradient colors from accent (login background) or use subtle neutral default
  const derivedAccent = accentColor || leftBg || 'rgba(100, 116, 139, 0.15)' // slate as neutral fallback
  
  // Create subtle gradients from the accent color
  const gradientBefore = accentColor 
    ? `linear-gradient(135deg, ${accentColor}15 0%, ${accentColor}10 50%, ${accentColor}15 100%)`
    : useColorModeValue(
        'linear-gradient(135deg, rgba(100, 116, 139, 0.08) 0%, rgba(71, 85, 105, 0.08) 100%)',
        'linear-gradient(135deg, rgba(100, 116, 139, 0.15) 0%, rgba(71, 85, 105, 0.15) 100%)',
      )
  
  const gradientAfter = accentColor
    ? `linear-gradient(135deg, ${accentColor}40, ${accentColor}30, ${accentColor}40)`
    : useColorModeValue(
        'linear-gradient(135deg, rgba(100, 116, 139, 0.3), rgba(71, 85, 105, 0.3))',
        'linear-gradient(135deg, rgba(100, 116, 139, 0.4), rgba(71, 85, 105, 0.4))',
      )

  // Extracted hooks for Box styling
  const boxBg = useColorModeValue('white', 'gray.800')
  const boxShadow = useColorModeValue(
    '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
  )
  const borderColorValue = useColorModeValue('gray.200', 'gray.700')
  const hoverShadow = useColorModeValue(
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
  )

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
          <Box position="absolute" top={{ base: 4, md: 6 }} right={{ base: 4, md: 6 }} zIndex={20}>
            <LanguageSwitcher compact {...languageSwitcherProps} />
          </Box>
        ) : null}
        <Container maxW="md" p={0} {...rightContainerProps}>
          <Box
            position="relative"
            bg={boxBg}
            borderRadius="3xl"
            p={{ base: 8, md: 10 }}
            mt={{ base: 12, md: 0 }}
            boxShadow={boxShadow}
            border="1px solid"
            borderColor={borderColorValue}
            transition="all 0.3s ease-in-out"
            _hover={{
              boxShadow: hoverShadow,
              transform: 'translateY(-2px)',
            }}
            _before={{
              content: '""',
              position: 'absolute',
              top: '-2px',
              left: '-2px',
              right: '-2px',
              bottom: '-2px',
              borderRadius: '3xl',
              background: gradientBefore,
              zIndex: -1,
              opacity: 0.6,
              filter: 'blur(12px)',
            }}
            _after={{
              content: '""',
              position: 'absolute',
              inset: 0,
              borderRadius: '3xl',
              padding: '2px',
              background: gradientAfter,
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
              pointerEvents: 'none',
              zIndex: 1,
            }}
          >
            {children}
          </Box>
        </Container>
      </Flex>
    </Flex>
  )
}

AuthLayout.propTypes = {
  leftContent: PropTypes.node,
  leftBg: PropTypes.string,
  leftTextColor: PropTypes.string,
  leftProps: PropTypes.object,
  rightBg: PropTypes.string,
  children: PropTypes.node.isRequired,
  showLanguageSwitcher: PropTypes.bool,
  languageSwitcherProps: PropTypes.object,
  rightContainerProps: PropTypes.object,
  accentColor: PropTypes.string, // Accent color from login background customization
}

AuthLayout.defaultProps = {
  leftContent: null,
  leftBg: null,
  leftTextColor: null,
  leftProps: {},
  rightBg: null,
  showLanguageSwitcher: true,
  languageSwitcherProps: {},
  rightContainerProps: {},
  accentColor: null,
}

export default AuthLayout
