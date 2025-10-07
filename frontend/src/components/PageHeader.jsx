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
  // Enhanced gradient background for header - darker and more pronounced
  const headerBg = useColorModeValue(
    'linear-gradient(180deg, rgba(226,232,240,1) 0%, rgba(203,213,225,0.95) 100%)',
    'linear-gradient(180deg, rgba(30,41,59,1) 0%, rgba(15,23,42,0.95) 100%)'
  )
  
  // Enhanced border with subtle shadow - more pronounced on mobile
  const borderColor = useColorModeValue('gray.300', 'gray.600')
  const boxShadow = useColorModeValue(
    '0 3px 12px rgba(0,0,0,0.08)',
    '0 3px 12px rgba(0,0,0,0.3)'
  )
  const mobileBoxShadow = useColorModeValue(
    '0 4px 16px rgba(0,0,0,0.12)',
    '0 4px 16px rgba(0,0,0,0.4)'
  )
  
  const subtitleColor = useColorModeValue('gray.600', 'gray.400')
  const iconBg = useColorModeValue('brand.50', 'brand.900')
  const iconColor = useColorModeValue('brand.500', 'brand.300')
  const titleColor = useColorModeValue('gray.900', 'white')
  const breadcrumbColor = useColorModeValue('gray.600', 'gray.400')

  const content = (
    <Box
      background={headerBg}
      borderBottom="2px solid"
      borderColor={borderColor}
      pb={{ base: 6, md: 6 }}
      pt={{ base: 5, md: 5 }}
      mb={{ base: 5, md: 6 }}
      as="header"
      role="banner"
      position="relative"
      boxShadow={{ base: mobileBoxShadow, md: boxShadow }}
      backdropFilter={{ base: 'blur(10px)', md: 'blur(8px)' }}
      borderRadius={{ base: 'lg', md: 'md' }}
      transition="all 0.2s ease"
      mx={{ base: '-4', md: '0' }}
      px={{ base: '4', md: '0' }}
      _hover={{
        boxShadow: useColorModeValue(
          '0 5px 16px rgba(0,0,0,0.1)',
          '0 5px 16px rgba(0,0,0,0.4)'
        ),
      }}
    >
      {breadcrumbs.length > 0 && (
        <Breadcrumb
          spacing="8px"
          separator={<ChevronRight size={14} />}
          fontSize={{ base: 'xs', md: 'sm' }}
          color={breadcrumbColor}
          mb={{ base: 5, md: 4 }}
          fontWeight="medium"
          px={{ base: 1, md: 0 }}
        >
          {breadcrumbs.map((crumb, index) => (
            <BreadcrumbItem key={index}>
              {crumb.href ? (
                <BreadcrumbLink
                  as={RouterLink}
                  to={crumb.href}
                  _hover={{ 
                    color: 'brand.500',
                    textDecoration: 'none',
                    transform: 'translateY(-1px)',
                  }}
                  maxW="200px"
                  isTruncated
                  transition="all 0.2s ease"
                >
                  {crumb.label}
                </BreadcrumbLink>
              ) : (
                <Text maxW="200px" isTruncated fontWeight="semibold">
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
        gap={{ base: 5, md: 6 }}
        px={{ base: 1, md: 4 }}
      >
        <Box flex="1" minW="0">
          <Flex align="center" gap={{ base: 3, md: 4 }} mb={{ base: 3, md: 2 }}>
            {Icon && (
              <Box
                p={{ base: 2.5, md: 3 }}
                borderRadius="lg"
                bg={iconBg}
                color={iconColor}
                aria-hidden="true"
                boxShadow={{ base: 'md', md: 'sm' }}
                transition="all 0.2s ease"
                display={{ base: 'flex', md: 'flex' }}
                alignItems="center"
                justifyContent="center"
                _hover={{
                  transform: 'scale(1.05)',
                  boxShadow: 'lg',
                }}
              >
                <Icon size={24} />
              </Box>
            )}
            <Heading
              as="h1"
              size={{ base: 'md', md: 'lg' }}
              fontWeight="bold"
              color={titleColor}
              noOfLines={2}
              letterSpacing="tight"
              fontSize={{ base: '1.5rem', md: '1.875rem' }}
            >
              {title}
            </Heading>
          </Flex>
          {subtitle && (
            <Text 
              color={subtitleColor} 
              fontSize={{ base: 'sm', md: 'md' }}
              maxW="600px"
              fontWeight="medium"
              lineHeight="tall"
              pl={{ base: Icon ? '44px' : '0', md: '0' }}
            >
              {subtitle}
            </Text>
          )}
        </Box>

        {(actions.length > 0 || rightContent || children) && (
          <Box flexShrink={0} w={{ base: '100%', md: 'auto' }}>
            <HStack
              spacing={{ base: 3, md: 4 }}
              flexWrap={{ base: 'wrap', md: 'nowrap' }}
              justify={{ base: 'flex-start', md: 'flex-end' }}
              w="100%"
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
