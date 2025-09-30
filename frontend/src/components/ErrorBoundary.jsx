import { Component } from 'react';
import { Box, Button, Heading, Text } from '@chakra-ui/react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: undefined };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box p={8} textAlign="center" maxW="600px" mx="auto" mt={20}>
          <Heading size="lg" mb={4}>Something went wrong</Heading>
          <Text mb={4} color="gray.600">
            The application encountered an error. Please refresh to try again.
          </Text>
          {this.state.error && (
            <Text fontSize="sm" color="gray.500" mb={4} fontFamily="mono">
              {this.state.error.message}
            </Text>
          )}
          <Button onClick={() => window.location.reload()} colorScheme="brand">
            Refresh Page
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}