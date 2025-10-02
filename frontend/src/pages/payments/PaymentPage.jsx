
import { useEffect, useMemo, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { useParams, useNavigate } from 'react-router-dom'
import { Alert, AlertIcon, Box, Button, CardBody, Container, Flex, HStack, Heading, Icon, Spinner, Stack, Text } from '@chakra-ui/react'
import StandardCard from '../../components/StandardCard'
import { ArrowLeft, CreditCard } from 'lucide-react'
import Swal from 'sweetalert2'
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'

import PageHeader from '../../components/PageHeader'
import { fetchPaymentById, fetchPublicPaymentConfig } from '../../store/slices/paymentsSlice'
import axiosInstance from '../../helpers/axiosInstance'
import { ICON_SIZE_MD, ICON_BOX_MD } from '../../constants/iconSizes'

const formatCurrency = (amountCents = 0, currency = 'USD') => {
  const value = (amountCents || 0) / 100
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
  }).format(value)
}

const StripeCheckoutForm = ({ paymentId, onPaymentComplete, onProcessingChange, onError, submitLabel }) => {
  const stripe = useStripe()
  const elements = useElements()
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!stripe || !elements) return

    setSubmitting(true)
    onProcessingChange(true)
    onError(null)

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payments/success?paymentId=${paymentId}`,
        },
        redirect: 'if_required',
      })

      if (error) {
        onError(error.message || 'Payment failed.')
        return
      }

      if (paymentIntent) {
        await onPaymentComplete(paymentIntent)
      }
    } catch (err) {
      onError(err.message || 'Unable to confirm payment.')
    } finally {
      setSubmitting(false)
      onProcessingChange(false)
    }
  }

  return (
    <Stack as="form" onSubmit={handleSubmit} spacing={4}>
      <PaymentElement options={{ layout: 'tabs' }} />
      <Flex justify="flex-end">
        <Button type="submit" colorScheme="blue" isDisabled={!stripe || !elements || submitting} minH="44px">
          {submitting && <Spinner size="sm" mr={2} />}
          {submitLabel}
        </Button>
      </Flex>
    </Stack>
  )
}

const PaymentPage = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { id } = useParams()

  const { currentPayment, publicPaymentConfig, loading } = useSelector((state) => state.payments)
  const [stripePromise, setStripePromise] = useState(null)
  const [clientSecret, setClientSecret] = useState('')
  const [intentLoading, setIntentLoading] = useState(false)
  const [intentError, setIntentError] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [statusVariant, setStatusVariant] = useState('info')

  useEffect(() => {
    if (id) {
      dispatch(fetchPaymentById(id))
      dispatch(fetchPublicPaymentConfig())
    }
  }, [dispatch, id])

  useEffect(() => {
    if (publicPaymentConfig?.publishableKey) {
      setStripePromise(loadStripe(publicPaymentConfig.publishableKey))
    }
  }, [publicPaymentConfig?.publishableKey])

  const refreshPayment = useCallback(async () => {
    try {
      const result = await dispatch(fetchPaymentById(id)).unwrap()
      return result
    } catch (err) {
      console.warn('Failed to refresh payment:', err?.message || err)
      return null
    }
  }, [dispatch, id])

  const pollForStatus = useCallback(async () => {
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const refreshed = await refreshPayment()
      if (refreshed?.status === 'completed') {
        setStatusVariant('success')
        setStatusMessage(t('payment.status.completed', 'Payment completed successfully.'))
        return 'completed'
      }
      if (refreshed?.status === 'failed') {
        setStatusVariant('error')
        setStatusMessage(t('payment.status.failed', 'Payment failed. Please try again.'))
        return 'failed'
      }
      await new Promise((resolve) => setTimeout(resolve, 2000))
    }
    return 'pending'
  }, [refreshPayment, t])

  const handlePaymentComplete = useCallback(
    async (intent) => {
      setStatusVariant('info')
      setStatusMessage(t('payment.status.pending', 'Awaiting confirmation...'))
      const status = await pollForStatus()

      if (status === 'completed') {
        await Swal.fire({
          title: t('payment.success.title', 'Payment successful'),
          text: t('payment.success.message', 'Your payment has been processed successfully.'),
          icon: 'success',
        })
        navigate('/payments')
        return
      }

      if (status === 'failed') {
        await Swal.fire({
          title: t('payment.failed.title', 'Payment failed'),
          text: t('payment.failed.message', 'Stripe was unable to complete the payment. Please try again.'),
          icon: 'error',
        })
        return
      }

      await Swal.fire({
        title: t('payment.status.pendingTitle', 'Awaiting confirmation'),
        text: t('payment.status.pending', 'Awaiting confirmation...'),
        icon: 'info',
      })
    },
    [pollForStatus, t, navigate],
  )

  const initializeIntent = useCallback(async () => {
    if (!currentPayment?.id) return

    try {
      setIntentLoading(true)
      setIntentError(null)
      const { data } = await axiosInstance.post(`/api/payments/${currentPayment.id}/intent`)
      if (data?.clientSecret) {
        setClientSecret(data.clientSecret)
      } else {
        throw new Error('Missing client secret from Stripe')
      }
    } catch (err) {
      console.error('Failed to initialize intent:', err)
      setIntentError(err?.response?.data?.message || err.message || 'Unable to initialize payment')
    } finally {
      setIntentLoading(false)
    }
  }, [currentPayment?.id])

  const handleRetryPayment = useCallback(() => {
    setClientSecret('')
    initializeIntent()
  }, [initializeIntent])

  const handleGoBack = useCallback(() => {
    navigate(-1)
  }, [navigate])

  const handleViewPayments = useCallback(() => {
    navigate('/payments')
  }, [navigate])

  const canAttemptPayment = Boolean(
    publicPaymentConfig?.cardPaymentsEnabled &&
      publicPaymentConfig?.publishableKey &&
      currentPayment &&
      ['pending', 'failed'].includes(currentPayment.status),
  )

  const isCompleted = currentPayment?.status === 'completed'
  const isFailed = currentPayment?.status === 'failed'
  const receiptUrl = currentPayment?.receipt_url

  const amountCents =
    currentPayment?.amount_cents ?? Math.round((currentPayment?.amount || 0) * 100)

  const options = useMemo(
    () =>
      clientSecret
        ? {
            clientSecret,
            appearance: { theme: 'stripe' },
          }
        : null,
    [clientSecret],
  )

  useEffect(() => {
    if (canAttemptPayment && !clientSecret) {
      initializeIntent()
    }
  }, [canAttemptPayment, clientSecret, initializeIntent])

  if (loading || !currentPayment) {
    return (
      <Container maxW="4xl" py={12} textAlign="center">
        <Spinner size="lg" color="blue.500" thickness="4px" speed="0.7s" />
      </Container>
    )
  }

  if (!publicPaymentConfig?.cardPaymentsEnabled) {
    return (
      <Container maxW="4xl" py={6}>
        <PageHeader
          title={t('payment.unavailable.title', 'Payment Unavailable')}
          subtitle={t('payment.unavailable.subtitle', 'Card payments are currently disabled')}
          icon={CreditCard}
        />
        <StandardCard variant="outline" borderRadius="xl" shadow="sm">
          <CardBody textAlign="center" py={10}>
            <Alert status="warning" borderRadius="md" mb={6}>
              <AlertIcon />
              {t('payment.unavailable.configuration', 'Please contact an administrator to enable Stripe payments.')}
            </Alert>
            <Button colorScheme="blue" onClick={handleGoBack} minH="44px" leftIcon={<Icon as={ArrowLeft} boxSize={ICON_BOX_MD} aria-hidden="true" />}>
              {t('common.goBack', 'Go Back')}
            </Button>
          </CardBody>
        </StandardCard>
      </Container>
    )
  }

  const showPaymentForm = Boolean(stripePromise && options && clientSecret && canAttemptPayment && !isCompleted)
  const showUnavailableAlert = !canAttemptPayment && !isCompleted && !receiptUrl && !isFailed
  const alertStatus = statusVariant === 'error' ? 'error' : statusVariant === 'success' ? 'success' : 'info'

  return (
    <Container maxW="4xl" py={6} className="payment-page">
      <PageHeader
        title={t('payment.title', 'Make Payment')}
        subtitle={t('payment.subtitle', 'Complete your payment securely')}
        icon={CreditCard}
      />

      <Flex justify="center">
        <StandardCard w="full" maxW="xl" borderRadius="xl" shadow="sm">
          <CardHeader borderBottomWidth="1px">
            <Flex justify="space-between" align="center" gap={4} wrap="wrap">
              <Box>
                <Heading as="h5" size="sm" mb={1}>
                  {t('payment.details.title', 'Payment Details')}
                </Heading>
                <Text fontSize="sm" color="gray.500">
                  {t('payment.order', 'Order')} #{currentPayment.orderId}
                </Text>
              </Box>
              <Box textAlign="right">
                <Heading as="h4" size="md" color="blue.500">
                  {formatCurrency(amountCents, currentPayment.currency)}
                </Heading>
                <Text fontSize="xs" color="gray.500" textTransform="uppercase">
                  {currentPayment.currency || 'USD'}
                </Text>
              </Box>
            </Flex>
          </CardHeader>
          <CardBody>
            <Stack spacing={4}>
              {processing && (
                <Alert status="info" borderRadius="md">
                  <AlertIcon />
                  {t('payment.processing', 'Processing payment...')}
                </Alert>
              )}

              {statusMessage && (
                <Alert status={alertStatus} borderRadius="md">
                  <AlertIcon />
                  <Flex justify="space-between" align="center" gap={4} wrap="wrap">
                    <Text>{statusMessage}</Text>
                    {isFailed && (
                      <Button
                        size="sm"
                        colorScheme="red"
                        variant="outline"
                        onClick={handleRetryPayment}
                        isLoading={intentLoading}
                        minH="44px"
                      >
                        {t('payment.retry', 'Retry Payment')}
                      </Button>
                    )}
                  </Flex>
                </Alert>
              )}

              {intentError && (
                <Stack spacing={4}>
                  <Alert status="error" borderRadius="md">
                    <AlertIcon />
                    {intentError}
                  </Alert>
                  <Button
                    colorScheme="blue"
                    variant="outline"
                    onClick={initializeIntent}
                    isLoading={intentLoading}
                    minH="44px"
                  >
                    {t('payment.retry', 'Retry Payment')}
                  </Button>
                </Stack>
              )}

              {receiptUrl && (
                <Alert status="success" borderRadius="md">
                  <AlertIcon />
                  <HStack spacing={4}>
                    <Text>
                      {t('payment.receipt.available', 'Receipt available')}:
                    </Text>
                    <Button
                      as="a"
                      href={receiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="link"
                      colorScheme="blue"
                      fontWeight="semibold"
                      minH="44px"
                    >
                      {t('payment.receipt.view', 'View Receipt')}
                    </Button>
                  </HStack>
                </Alert>
              )}

              {!clientSecret && intentLoading && (
                <Flex justify="center" py={6}>
                  <Spinner color="blue.500" />
                </Flex>
              )}

              {showPaymentForm && (
                <Elements stripe={stripePromise} options={options}>
                  <StripeCheckoutForm
                    paymentId={currentPayment.id}
                    onProcessingChange={setProcessing}
                    onPaymentComplete={handlePaymentComplete}
                    onError={setIntentError}
                    submitLabel={t('payment.confirm', 'Confirm Payment')}
                  />
                </Elements>
              )}

              {showUnavailableAlert && (
                <Alert status="warning" borderRadius="md">
                  <AlertIcon />
                  {t(
                    'payment.unavailable.status',
                    'This payment is not available for processing right now. Current status:',
                  )}{' '}
                  <Text as="span" fontWeight="semibold">
                    {currentPayment.status}
                  </Text>
                </Alert>
              )}

              <HStack justify="flex-end" spacing={4} wrap="wrap">
                {isCompleted && (
                  <Button colorScheme="blue" onClick={handleViewPayments} minH="44px">
                    {t('payment.viewPayments', 'View Payments')}
                  </Button>
                )}
                <Button
                  colorScheme="gray"
                  variant="outline"
                  onClick={handleGoBack}
                  minH="44px"
                  leftIcon={<Icon as={ArrowLeft} boxSize={ICON_BOX_MD} aria-hidden="true" />}
                >
                  {t('common.goBack', 'Go Back')}
                </Button>
              </HStack>
            </Stack>
          </CardBody>
        </StandardCard>
      </Flex>
    </Container>
  )
}

export default PaymentPage
