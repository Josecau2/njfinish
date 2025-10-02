import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { CardBody, Box, Flex, Button } from '@chakra-ui/react'
import StandardCard from '../../components/StandardCard'
import PageContainer from '../../components/PageContainer'
import PageHeader from '../../components/PageHeader'
import { ArrowLeft, CreditCard } from 'lucide-react'
import { ICON_SIZE_MD, ICON_BOX_MD } from '../../constants/iconSizes'

const PaymentCancel = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <PageContainer className="payment-result">
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
        <StandardCard>
          <CardBody className="text-center py-5">
              <h4>{t('payments.toast.paymentCancelled', 'Payment Cancelled')}</h4>
              <p>
                {t(
                  'payment.error.generic',
                  'There was an error processing your payment. Please try again.',
                )}
              </p>
              <Flex gap={2} justify="center">
                <Button
                  colorScheme="brand"
                  onClick={() => navigate('/payments')}
                  aria-label={t('payments.title.admin', 'All Payments')}
                  minH="44px"
                >
                  {t('payments.title.admin', 'All Payments')}
                </Button>
                <Button
                  variant="outline"
                  colorScheme="gray"
                  onClick={() => navigate(-1)}
                  aria-label={t('common.goBack', 'Go Back')}
                  minH="44px"
                >
                  <ArrowLeft size={ICON_SIZE_MD} style={{ marginRight: '0.5rem' }} />
                  {t('common.goBack', 'Go Back')}
                </Button>
              </Flex>
            </CardBody>
          </StandardCard>
        </Box>
      </PageContainer>
  )
}
export default PaymentCancel
