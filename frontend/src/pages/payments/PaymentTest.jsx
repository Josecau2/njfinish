import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Alert, CardBody, Box, FormControl, Input, FormLabel, Flex, Button, SimpleGrid, Icon, Stack } from '@chakra-ui/react'
import StandardCard from '../../components/StandardCard'
import PageContainer from '../../components/PageContainer'
import { ArrowLeft, CreditCard } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import { useState } from 'react'
import { ICON_SIZE_MD, ICON_BOX_MD } from '../../constants/iconSizes'

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
    <PageContainer>
      <PageHeader
        title={t('paymentConfig.test.button', 'Test Configuration')}
        subtitle={t('payment.subtitle', 'Complete your payment securely')}
        icon={CreditCard}
      />
      <SimpleGrid columns={{ base: 1 }} spacing={4}>
        <Box maxW="container.md" mx="auto">
          <StandardCard>
            <CardBody>
              <Stack spacing={4}>
                <Alert status="info" aria-live="polite" role="status">
                  {t(
                    'payment.embed.notConfigured',
                    'Embedded payment form is not configured. Please contact support.',
                  )}
                </Alert>
                <FormControl>
                  <FormLabel htmlFor="txn">
                    {t('payment.test.transactionIdLabel', 'Transaction ID')}
                  </FormLabel>
                  <Input id="txn" value={txn} onChange={(e) => setTxn(e.target.value)} minH="44px" />
                </FormControl>
                <Flex gap={2} flexWrap="wrap">
                  <Button
                    colorScheme="green"
                    onClick={handleDispatchSuccess}
                    aria-label={t('payment.test.dispatchSuccess', 'Dispatch paymentSuccess')}
                    minH="44px"
                    leftIcon={<Icon as={CreditCard} boxSize={ICON_BOX_MD} aria-hidden="true" />}
                  >
                    {t('payment.test.dispatchSuccess', 'Dispatch paymentSuccess')}
                  </Button>
                  <Button
                    colorScheme="red"
                    variant="outline"
                    onClick={handleDispatchError}
                    aria-label={t('payment.test.dispatchError', 'Dispatch paymentError')}
                    minH="44px"
                  >
                    {t('payment.test.dispatchError', 'Dispatch paymentError')}
                  </Button>
                  <Button
                    colorScheme="gray"
                    variant="outline"
                    onClick={() => navigate(-1)}
                    aria-label={t('common.goBack', 'Go Back')}
                    minH="44px"
                    leftIcon={<Icon as={ArrowLeft} boxSize={ICON_BOX_MD} aria-hidden="true" />}
                  >
                    {t('common.goBack', 'Go Back')}
                  </Button>
                </Flex>
              </Stack>
            </CardBody>
          </StandardCard>
        </Box>
      </SimpleGrid>
    </PageContainer>
  )
}
export default PaymentTest
