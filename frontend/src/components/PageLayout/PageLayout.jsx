import StandardCard from '../StandardCard'
import { Box, Container, Heading, Text } from '@chakra-ui/react'
import StandardCard from '../StandardCard'

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
  return (
    <Box
      minH="100vh" style={{ backgroundColor: "gray.50" }}
      _dark={{ bg: "gray.900" }}
      pt={6}
      pb={12}
      px={{ base: 4, md: 8 }}
    >
      <Container maxW={maxWidth}>
        {/* Page Header */}
        {title && (
          <Box mb={8}>
            <Heading
              as="h1"
              size="xl"
              mb={subtitle ? 2 : 0}
              style={{ color: "gray.900" }}
              _dark={{ color: "white" }}
            >
              {title}
            </Heading>
            {subtitle && (
              <Text
                fontSize="md"
                style={{ color: "gray.600" }}
                _dark={{ color: "gray.400" }}
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
          <Box style={{ backgroundColor: "white" }}
            _dark={{ bg: "gray.800" }}
            borderRadius="lg"
            boxShadow="sm"
            p={{ base: 4, md: 6 }}
          >
            {children}
          </Box>
        )}
      </Container>
    </Box>
  )
}
