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
          <Box position="absolute" top={{ base: 4, md: 6 }} right={{ base: 4, md: 6 }} zIndex={20}>
            <LanguageSwitcher compact {...languageSwitcherProps} />
          </Box>
        ) : null}
        <Container maxW="md" p={0} {...rightContainerProps}>
          <Box
            position="relative"
            bg={useColorModeValue('white', 'gray.800')}
            borderRadius="3xl"
            p={{ base: 8, md: 10 }}
            mt={{ base: 12, md: 0 }}
            boxShadow={useColorModeValue(
              '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2)'
            )}
            border="1px solid"
            borderColor={useColorModeValue('gray.200', 'gray.700')}
            transition="all 0.3s ease-in-out"
            _hover={{
              boxShadow: useColorModeValue(
                '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                '0 25px 50px -12px rgba(0, 0, 0, 0.6)'
              ),
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
              background: useColorModeValue(
                'linear-gradient(135deg, rgba(66, 153, 225, 0.15) 0%, rgba(159, 122, 234, 0.15) 50%, rgba(237, 100, 166, 0.15) 100%)',
                'linear-gradient(135deg, rgba(66, 153, 225, 0.2) 0%, rgba(159, 122, 234, 0.2) 50%, rgba(237, 100, 166, 0.2) 100%)'
              ),
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
              background: useColorModeValue(
                'linear-gradient(135deg, rgba(66, 153, 225, 0.4), rgba(159, 122, 234, 0.4), rgba(237, 100, 166, 0.4))',
                'linear-gradient(135deg, rgba(66, 153, 225, 0.5), rgba(159, 122, 234, 0.5), rgba(237, 100, 166, 0.5))'
              ),
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

export default AuthLayout
