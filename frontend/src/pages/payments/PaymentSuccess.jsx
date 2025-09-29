import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Alert, AlertIcon, Container, Card, CardBody, Box, Icon, Button } from '@chakra-ui/react'
import PageHeader from '../../components/PageHeader'
import { FaCreditCard } from 'react-icons/fa'
import { ArrowLeft, CheckCircle } from 'lucide-react'

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
    <Container fluid className="payment-result">
      <style>{`
        .payment-result .btn { min-height: 44px; }
      `}</style>
      <PageHeader
        title={t('payment.success.title', 'Payment Successful!')}
        subtitle={t('payment.success.message', 'Your payment has been processed successfully.')}
        icon={FaCreditCard}
      />
      <Box maxW="800px" mx="auto">
        <Card>
          <CardBody className="text-center py-5">
              <Icon as={CheckCircle} size="4xl" className="text-success mb-3" />
              <h4 className="mb-2">{t('payment.completed.title', 'Payment Completed')}</h4>
              <p className="text-muted mb-4">
                {t('payment.completed.subtitle', 'This payment has already been processed')}
              </p>
              {transactionId && (
                <Alert status="light" className="mx-auto" role="status" aria-live="polite">
                  {t('payment.transactionId', 'Transaction ID')}: <code>{transactionId}</code>
                </Alert>
              )}
              <div className="d-flex gap-2 justify-content-center mt-3">
                <Button
                  colorScheme="brand"
                  onClick={() => navigate('/payments')}
                  aria-label={t('payments.title.admin', 'All Payments')}
                  whileTap={{ scale: 0.98 }}
                  minH="44px"
                >
                  {t('payments.title.admin', 'All Payments')}
                </Button>
                <Button
                  variant="outline"
                  colorScheme="gray"
                  onClick={() => navigate(-1)}
                  aria-label={t('common.goBack', 'Go Back')}
                  whileTap={{ scale: 0.98 }}
                  minH="44px"
                >
                  <Icon as={ArrowLeft} mr={2} boxSize={4} />
                  {t('common.goBack', 'Go Back')}
                </Button>
              </div>
            </CardBody>
          </Card>
        </Box>
    </Container>
  )
}
export default PaymentSuccess
