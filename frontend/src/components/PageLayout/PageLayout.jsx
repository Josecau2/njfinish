import { Box, Heading, Text, useColorModeValue } from '@chakra-ui/react'
import PageContainer from '../PageContainer'

/**
 * PageLayout - Consistent page wrapper for all application pages
 *
 * Provides:
 * - Consistent spacing and padding
 * - Responsive container sizing
 * - Optional page header with title and subtitle
 * - Content card with proper shadows and borders
 *
 * @param {string} title - Page title (required)
 * @param {string} subtitle - Optional subtitle/description
 * @param {ReactNode} children - Page content
 * @param {string} maxWidth - Max container width (default: 1400px)
 * @param {boolean} noCard - If true, skip the card wrapper (default: false)
 */
export function PageLayout({
  title,
  subtitle,
  children,
  maxWidth = '1400px',
  noCard = false,
}) {
  const bgColor = useColorModeValue('background', 'gray.900')
  const cardBg = useColorModeValue('surface', 'gray.800')
  const titleColor = useColorModeValue('text', 'white')
  const subtitleColor = useColorModeValue('muted', 'gray.400')

  return (
    <Box
      minH="100vh"
      bg={bgColor}
      pt={6}
      pb={12}
      px={{ base: 4, md: 8 }}
    >
      <PageContainer>
        {/* Page Header */}
        {title && (
          <Box mb={8}>
            <Heading
              as="h1"
              size="xl"
              mb={subtitle ? 2 : 0}
              color={titleColor}
            >
              {title}
            </Heading>
            {subtitle && (
              <Text
                fontSize="md"
                color={subtitleColor}
              >
                {subtitle}
              </Text>
            )}
          </Box>
        )}

        {/* Page Content */}
        {noCard ? (
          children
        ) : (
          <Box
            bg={cardBg}
            borderRadius="lg"
            boxShadow="sm"
            p={{ base: 4, md: 6 }}
          >
            {children}
          </Box>
        )}
      </PageContainer>
    </Box>
  )
}
