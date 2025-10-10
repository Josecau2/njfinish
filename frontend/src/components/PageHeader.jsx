import React from 'react'
import {
  Box,
  Flex,
  Heading,
  HStack,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Text,
  useColorModeValue,
} from '@chakra-ui/react'
import { ChevronRight } from 'lucide-react'
import { Link as RouterLink } from 'react-router-dom'

const DEFAULT_HEADER_CONTAINER_PROPS = {
  px: { base: 4, md: 6 },
  width: '100%',
  maxW: '100%',
  mx: 'auto',
}

const PageHeader = ({
  title,
  subtitle,
  icon: Icon,
  breadcrumbs = [],
  actions = [],
  rightContent,
  children,
  noContainer = false,
  containerProps = {},
}) => {
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const subtitleColor = useColorModeValue('gray.600', 'gray.400')
  const iconBg = useColorModeValue('brand.50', 'brand.900')
  const iconColor = useColorModeValue('brand.500', 'brand.300')

  // Professional gradient for title text
  const gradientStart = useColorModeValue('brand.600', 'brand.300')
  const gradientEnd = useColorModeValue('brand.400', 'brand.500')
  const titleGradient = `linear-gradient(135deg, var(--chakra-colors-${gradientStart.replace('.', '-')}) 0%, var(--chakra-colors-${gradientEnd.replace('.', '-')}) 100%)`

  // Sophisticated background and shadow for depth
  const headerBg = useColorModeValue('white', 'gray.800')
  const headerBorder = useColorModeValue('gray.200', 'gray.700')
  const headerShadow = useColorModeValue(
    '0 4px 12px -2px rgba(0, 0, 0, 0.12), 0 2px 6px -1px rgba(0, 0, 0, 0.08), 0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(0, 0, 0, 0.03)',
    '0 4px 12px -2px rgba(0, 0, 0, 0.35), 0 2px 6px -1px rgba(0, 0, 0, 0.25), 0 1px 3px 0 rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.08)'
  )
  const accentGradient = useColorModeValue(
    'linear-gradient(90deg, rgba(37, 99, 235, 0.08) 0%, rgba(96, 165, 250, 0.04) 100%)',
    'linear-gradient(90deg, rgba(37, 99, 235, 0.15) 0%, rgba(96, 165, 250, 0.08) 100%)'
  )

  const content = (
    <Box
      bg={headerBg}
      border="1px solid"
      borderColor={headerBorder}
      borderRadius="xl"
      boxShadow={headerShadow}
      p={{ base: 5, md: 6 }}
      mb={6}
      position="relative"
      overflow="hidden"
      as="header"
      role="banner"
      _before={{
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: accentGradient,
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      <Box position="relative" zIndex={1}>
      {breadcrumbs.length > 0 && (
        <Breadcrumb
          spacing="8px"
          separator={<ChevronRight size={14} />}
          fontSize="sm"
          color={useColorModeValue('gray.500', 'gray.400')}
          mb={4}
        >
          {breadcrumbs.map((crumb, index) => (
            <BreadcrumbItem key={index}>
              {crumb.href ? (
                <BreadcrumbLink
                  as={RouterLink}
                  to={crumb.href}
                  _hover={{ color: 'brand.500' }}
                  maxW="200px"
                  isTruncated
                >
                  {crumb.label}
                </BreadcrumbLink>
              ) : (
                <Text maxW="200px" isTruncated>
                  {crumb.label}
                </Text>
              )}
            </BreadcrumbItem>
          ))}
        </Breadcrumb>
      )}

      <Flex
        direction={{ base: 'column', md: 'row' }}
        justify="space-between"
        align={{ base: 'flex-start', md: 'flex-end' }}
        gap={4}
      >
        <Box flex="1" minW="0">
          <Flex align="center" gap={4} mb={2}>
            {Icon && (
              <Box
                p={2}
                borderRadius="md"
                bg={iconBg}
                color={iconColor}
                aria-hidden="true"
              >
                <Icon size={24} />
              </Box>
            )}
            <Heading
              as="h1"
              size="lg"
              fontWeight="bold"
              bgGradient={titleGradient}
              bgClip="text"
              letterSpacing="-0.02em"
              noOfLines={2}
              sx={{
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                textFillColor: 'transparent',
              }}
            >
              {title}
            </Heading>
          </Flex>
          {subtitle && (
            <Text color={subtitleColor} fontSize="md" maxW="600px">
              {subtitle}
            </Text>
          )}
        </Box>

        {(actions.length > 0 || rightContent || children) && (
          <Box flexShrink={0} w={{ base: '100%', md: 'auto' }}>
            <HStack
              spacing={{ base: 2, md: 4 }}
              flexWrap="wrap"
              justify={{ base: 'flex-start', md: 'flex-end' }}
            >
              {actions.map((action, index) => (
                <Box key={index}>{action}</Box>
              ))}
              {rightContent}
              {children}
            </HStack>
          </Box>
        )}
      </Flex>
      </Box>
    </Box>
  )

  if (noContainer) {
    return content
  }

  const mergedContainerProps = {
    ...DEFAULT_HEADER_CONTAINER_PROPS,
    ...containerProps,
  }

  return <Box {...mergedContainerProps}>{content}</Box>
}
export default PageHeader
