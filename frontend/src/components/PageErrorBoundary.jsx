import { Component } from 'react'
import { Alert, AlertIcon, AlertTitle, AlertDescription, Box, Button, CardBody, Container, Heading, Stack, Text } from '@chakra-ui/react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

/**
 * Page-level error boundary for graceful error handling
 * Wraps individual routes to prevent entire app crashes
 */
class PageErrorBoundaryClass extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: undefined, errorInfo: undefined }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Page error:', error, errorInfo)
    this.setState({ errorInfo })
  }

  render() {
    if (this.state.hasError) {
      const { navigate, pageName = 'Page' } = this.props

      return (
        <Container maxW="4xl" py={12}>
          <StandardCard borderColor="red.200">
            <CardBody>
              <Stack spacing={6} align="center" textAlign="center">
                <Box style={{ color="red.500" }}>
                  <AlertTriangle size={48} />
                </Box>

                <Stack spacing={2}>
                  <Heading size="lg" style={{ color="#bb2d3b" }}>
                    {pageName} Error
                  </Heading>
                  <Text style={{ color="#495057" }} fontSize="lg">
                    Something went wrong while loading this page.
                  </Text>
                </Stack>

                {this.state.error && (
                  <Alert status="error" borderRadius="md" w="full">
                    <AlertIcon />
                    <Box flex="1">
                      <AlertTitle>Error Details</AlertTitle>
                      <AlertDescription display="block" fontFamily="mono" fontSize="sm">
                        {this.state.error.message}
                      </AlertDescription>
                    </Box>
                  </Alert>
                )}

                <Stack direction={{ base: 'column', md: 'row' }} spacing={2} w="full" justify="center">
                  <Button
                    leftIcon={<RefreshCw size={16} />}
                    colorScheme="blue"
                    onClick={() => window.location.reload()}
                    minH="44px"
                  >
                    Reload Page
                  </Button>
                  <Button
                    leftIcon={<Home size={16} />}
                    variant="outline"
                    colorScheme="gray"
                    onClick={() => {
                      this.setState({ hasError: false, error: undefined, errorInfo: undefined })
                      if (navigate) navigate('/')
                      else window.location.href = '/'
                    minH="44px"
                  >
                    Go to Dashboard
                  </Button>
                </Stack>

                <Text fontSize="sm" style={{ color="gray.500" }}>
                  If this problem persists, please contact support.
                </Text>
              </Stack>
            </CardBody>
          </StandardCard>
        </Container>
      )
    }

    return this.props.children
  }
}

/**
 * Wrapper component to provide navigate function to class component
 */
export function PageErrorBoundary({ children, pageName }) {
  const navigate = useNavigate()
  return (
    <PageErrorBoundaryClass navigate={navigate} pageName={pageName}>
      {children}
    </PageErrorBoundaryClass>
  )
}

export default PageErrorBoundary
