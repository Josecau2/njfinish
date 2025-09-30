import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Container, Card, CardBody, Box, Button, Icon } from '@chakra-ui/react'
import PageHeader from '../../components/PageHeader'
import { ArrowLeft, CreditCard } from 'lucide-react'

const PaymentCancel = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <Container fluid className="payment-result">
      <style>{`
        .payment-result .btn { min-height: 44px; }
      `}</style>
      <PageHeader
        title={t('payments.toast.paymentCancelled', 'Payment Cancelled')}
        subtitle={t(
          'payment.unavailable.subtitle',
          'This payment cannot be processed at this time',
        )}
        icon={CreditCard}
      />
      <Box maxW="800px" mx="auto">
        <Card>
          <CardBody className="text-center py-5">
              <h4 className="mb-2">{t('payments.toast.paymentCancelled', 'Payment Cancelled')}</h4>
              <p className="text-muted mb-4">
                {t(
                  'payment.error.generic',
                  'There was an error processing your payment. Please try again.',
                )}
              </p>
              <div className="d-flex gap-2 justify-content-center">
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
export default PaymentCancel
