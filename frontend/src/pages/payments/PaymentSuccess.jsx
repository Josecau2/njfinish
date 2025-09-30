import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  AlertIcon,
  Container,
  Card,
  CardBody,
  Box,
  Icon,
  Button,
  Heading,
  Text,
  HStack,
  VStack,
  Code
} from '@chakra-ui/react'
import PageHeader from '../../components/PageHeader'
import { ArrowLeft, CheckCircle, CreditCard } from 'lucide-react'

const PaymentSuccess = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [params] = useSearchParams()

  // Optional: auto-redirect back to payments after a delay
  useEffect(() => {
    const timer = setTimeout(() => {
      // no-op auto redirect; leave manual navigation
    }, 0)
    return () => clearTimeout(timer)
  }, [])

  const transactionId = params.get('transactionId')

  return (
    <Container maxW="4xl" py={6}>
      <PageHeader
        title={t('payment.success.title', 'Payment Successful!')}
        subtitle={t('payment.success.message', 'Your payment has been processed successfully.')}
        icon={CreditCard}
      />

      <Box maxW="800px" mx="auto">
        <Card variant="outline" borderRadius="xl" shadow="sm">
          <CardBody textAlign="center" py={10}>
            <VStack spacing={6}>
              <Icon
                as={CheckCircle}
                boxSize={16}
                color="green.500"
                aria-hidden="true"
              />

              <VStack spacing={2}>
                <Heading as="h4" size="lg" color="gray.800">
                  {t('payment.completed.title', 'Payment Completed')}
                </Heading>
                <Text color="gray.600" fontSize="md">
                  {t('payment.completed.subtitle', 'This payment has already been processed')}
                </Text>
              </VStack>

              {transactionId && (
                <Alert
                  status="info"
                  borderRadius="md"
                  maxW="400px"
                  role="status"
                  aria-live="polite"
                >
                  <AlertIcon />
                  <Box>
                    <Text fontSize="sm">
                      {t('payment.transactionId', 'Transaction ID')}: <Code fontSize="sm">{transactionId}</Code>
                    </Text>
                  </Box>
                </Alert>
              )}

              <HStack spacing={3} wrap="wrap" justify="center">
                <Button
                  colorScheme="blue"
                  onClick={() => navigate('/payments')}
                  aria-label={t('payments.title.admin', 'All Payments')}
                  minH="44px"
                  size="lg"
                >
                  {t('payments.title.admin', 'All Payments')}
                </Button>
                <Button
                  variant="outline"
                  colorScheme="gray"
                  onClick={() => navigate(-1)}
                  aria-label={t('common.goBack', 'Go Back')}
                  leftIcon={<Icon as={ArrowLeft} boxSize={4} />}
                  minH="44px"
                  size="lg"
                >
                  {t('common.goBack', 'Go Back')}
                </Button>
              </HStack>
            </VStack>
          </CardBody>
        </Card>
      </Box>
    </Container>
  )
}
export default PaymentSuccess
