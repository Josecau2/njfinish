import React from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Container } from '@chakra-ui/react'

const PaymentModal = () => {
  const { t } = useTranslation()

  return (
    <Container py={4} role='status' aria-live='polite'>
      <Box>{t('paymentModal.placeholder')}</Box>
    </Container>
  )
}

export default PaymentModal
