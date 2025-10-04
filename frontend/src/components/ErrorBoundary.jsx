import { Component } from 'react';
import { Box, Button, Heading, Text } from '@chakra-ui/react';
import { withTranslation } from 'react-i18next';

class ErrorBoundary extends Component {
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
    const { t } = this.props;

    if (this.state.hasError) {
      return (
        <Box p={8} textAlign="center" maxW="600px" mx="auto" mt={20}>
          <Heading size="lg" mb={4}>{t('errors.somethingWentWrong')}</Heading>
          <Text mb={4} color="text">
            The application encountered an error. Please refresh to try again.
          </Text>
          {this.state.error && (
            <Text fontSize="sm" color="muted" mb={4} fontFamily="mono">
              {this.state.error.message}
            </Text>
          )}
          <Button onClick={() => window.location.reload()} colorScheme="brand">
            {t('errors.actions.refreshPage', 'Refresh Page')}
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default withTranslation()(ErrorBoundary);
