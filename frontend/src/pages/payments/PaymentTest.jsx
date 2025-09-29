import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Alert, Card, CardBody, Box, Container, FormControl, Input, FormLabel, Flex, Icon, Button } from '@chakra-ui/react'
import { ArrowLeft, CreditCard } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import { FaCreditCard } from 'react-icons/fa'
import { useState } from 'react'

const PaymentTest = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [txn, setTxn] = useState('TEST-TXN-12345')

  const handleDispatchSuccess = () => {
    const detail = { transactionId: txn || 'TEST-TXN-12345', provider: 'test' }
    window.dispatchEvent(new CustomEvent('paymentSuccess', { detail }))
  }

  const handleDispatchError = () => {
    const detail = { message: t('payment.test.simulatedFailure', 'Simulated failure') }
    window.dispatchEvent(new CustomEvent('paymentError', { detail }))
  }

  return (
    <Container fluid className="payment-test">
      <style>{`
        .payment-test .btn { min-height: 44px; }
      `}</style>
      <PageHeader
        title={t('paymentConfig.test.button', 'Test Configuration')}
        subtitle={t('payment.subtitle', 'Complete your payment securely')}
        icon={FaCreditCard}
      />
      <Flex>
        <Box md={8} className="mx-auto">
          <Card>
            <CardBody>
              <Alert status="info" aria-live="polite" role="status">
                {t(
                  'payment.embed.notConfigured',
                  'Embedded payment form is not configured. Please contact support.',
                )}
              </Alert>
              <FormControl className="mt-3">
                <div className="mb-3">
                  <FormLabel htmlFor="txn">
                    {t('payment.test.transactionIdLabel', 'Transaction ID')}
                  </FormLabel>
                  <Input id="txn" value={txn} onChange={(e) => setTxn(e.target.value)} />
                </div>
                <div className="d-flex gap-2 flex-wrap">
                  <Button
                    colorScheme="green"
                    onClick={handleDispatchSuccess}
                    aria-label={t('payment.test.dispatchSuccess', 'Dispatch paymentSuccess')}
                  >
                    <Icon as={CreditCard} className="me-2" />
                    {t('payment.test.dispatchSuccess', 'Dispatch paymentSuccess')}
                  </Button>
                  <Button
                    colorScheme="red"
                    variant="outline"
                    onClick={handleDispatchError}
                    aria-label={t('payment.test.dispatchError', 'Dispatch paymentError')}
                  >
                    {t('payment.test.dispatchError', 'Dispatch paymentError')}
                  </Button>
                  <Button
                    colorScheme="gray"
                    variant="outline"
                    onClick={() => navigate(-1)}
                    aria-label={t('common.goBack', 'Go Back')}
                  >
                    <Icon as={ArrowLeft} className="me-2" />
                    {t('common.goBack', 'Go Back')}
                  </Button>
                </div>
              </FormControl>
            </CardBody>
          </Card>
        </Box>
      </Flex>
    </Container>
  )
}
export default PaymentTest
