import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Alert, AlertIcon, Container, Box, Icon, Button, Heading, Text, HStack, VStack, Code } from '@chakra-ui/react'
import StandardCard from '../../components/StandardCard'
import PageHeader from '../../components/PageHeader'
import { ArrowLeft, CheckCircle, CreditCard } from 'lucide-react'
import { ICON_SIZE_MD, ICON_BOX_MD } from '../../constants/iconSizes'

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
        <StandardCard variant="outline" borderRadius="xl" shadow="sm">
          <CardBody textAlign="center" py={10}>
            <VStack spacing={6}>
              <Icon
                as={CheckCircle}
                boxSize={16}
                color="green.500"
                aria-hidden="true"
              />

              <VStack spacing={4}>
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

              <HStack spacing={4} wrap="wrap" justify="center">
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
                  leftIcon={<Icon as={ArrowLeft} boxSize={ICON_BOX_MD} />}
                  minH="44px"
                  size="lg"
                >
                  {t('common.goBack', 'Go Back')}
                </Button>
              </HStack>
            </VStack>
          </CardBody>
        </StandardCard>
      </Box>
    </Container>
  )
}
export default PaymentSuccess
