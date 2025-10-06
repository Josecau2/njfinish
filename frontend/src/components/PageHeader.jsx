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
  const titleColor = useColorModeValue('gray.900', 'white')

  const content = (
    <Box
      borderBottom="1px solid"
      borderColor={borderColor}
      pb={6}
      mb={6}
      as="header"
      role="banner"
    >
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
              fontWeight="semibold"
              color={titleColor}
              noOfLines={2}
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
          <Box flexShrink={0}>
            <HStack
              spacing={4}
              flexWrap={{ base: 'wrap', md: 'nowrap' }}
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
