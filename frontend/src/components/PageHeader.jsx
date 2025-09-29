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
  Container,
} from '@chakra-ui/react'
import { ChevronRight } from 'lucide-react'
import { Link as RouterLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const PageHeader = ({
  title,
  subtitle,
  icon: Icon,
  breadcrumbs = [],
  actions = [],
  children,
}) => {
  const { t } = useTranslation()
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const subtitleColor = useColorModeValue('gray.600', 'gray.400')

  return (
    <Box
      borderBottom="1px solid"
      borderColor={borderColor}
      pb={6}
      mb={6}
      as="header"
      role="banner"
    >
      <Container maxW="1200px" px={{ base: 4, md: 6 }}>
        {/* Breadcrumbs */}
        {breadcrumbs.length > 0 && (
          <Breadcrumb
            spacing="8px"
            separator={<ChevronRight size={14} />}
            fontSize="sm"
            color="gray.500"
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

        {/* Header Content */}
        <Flex
          direction={{ base: 'column', md: 'row' }}
          justify="space-between"
          align={{ base: 'flex-start', md: 'flex-end' }}
          gap={4}
        >
          {/* Title Section */}
          <Box flex="1" minW="0">
            <Flex align="center" gap={3} mb={2}>
              {Icon && (
                <Box
                  p={2}
                  borderRadius="md"
                  bg="brand.50"
                  color="brand.500"
                  aria-hidden="true"
                >
                  <Icon size={24} />
                </Box>
              )}
              <Heading
                as="h1"
                size="lg"
                fontWeight="semibold"
                color="gray.900"
                _dark={{ color: 'white' }}
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

          {/* Actions Section */}
          {(actions.length > 0 || children) && (
            <Box flexShrink={0}>
              <HStack
                spacing={3}
                flexWrap={{ base: 'wrap', md: 'nowrap' }}
                justify={{ base: 'flex-start', md: 'flex-end' }}
              >
                {actions.map((action, index) => (
                  <Box key={index}>{action}</Box>
                ))}
                {children}
              </HStack>
            </Box>
          )}
        </Flex>
      </Container>
    </Box>
  )
}
export default PageHeader
