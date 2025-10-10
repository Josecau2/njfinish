import { useEffect, useMemo, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  CardBody,
  CardHeader,
  Container,
  Flex,
  HStack,
  Heading,
  Icon,
  Spinner,
  Stack,
  Text,
  useColorMode,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react'
import PageContainer from '../../components/PageContainer'
import StandardCard from '../../components/StandardCard'
import { ArrowLeft, CreditCard } from 'lucide-react'
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

const StripeCheckoutForm = ({
  paymentId,
  onPaymentComplete,
  onProcessingChange,
  onError,
  submitLabel,
}) => {
  const stripe = useStripe()
  const elements = useElements()

  // Theme-aware color values
  const iconBlue500 = useColorModeValue('blue.500', 'blue.300')
  const iconGray500 = useColorModeValue('gray.500', 'gray.400')
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
    <Stack as="form" onSubmit={handleSubmit} spacing={6}>
      <Box>
        <PaymentElement
          options={{
            layout: 'tabs',
            defaultValues: {
              billingDetails: {}
            }
          }}
        />
      </Box>
      <Flex justify="flex-end" pt={2}>
        <Button
          type="submit"
          colorScheme="brand"
          isDisabled={!stripe || !elements || submitting}
          minH="52px"
          px={10}
          fontSize="lg"
          fontWeight="bold"
          borderRadius="xl"
          shadow="md"
          _hover={{
            transform: 'translateY(-2px)',
            shadow: 'lg'
          }}
          _active={{
            transform: 'translateY(0)',
            shadow: 'md'
          }}
          transition="all 0.2s"
          w={{ base: 'full', sm: 'auto' }}
        >
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
  const toast = useToast()
  const { id } = useParams()
  const { colorMode } = useColorMode()

  // Theme-aware color values
  const iconBlue500 = useColorModeValue('blue.500', 'blue.300')
  const iconGray500 = useColorModeValue('gray.500', 'gray.400')
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const headerBg = useColorModeValue('gray.50', 'gray.900')
  const textSecondary = useColorModeValue('gray.600', 'gray.400')
  const textPrimary = useColorModeValue('gray.900', 'gray.100')
  const shadowColor = useColorModeValue('lg', 'dark-lg')
  const amountBg = useColorModeValue('blue.50', 'blue.900')
  const amountBorder = useColorModeValue('blue.200', 'blue.700')

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
        toast({
          title: t('payment.success.title', 'Payment successful'),
          description: t('payment.success.message', 'Your payment has been processed successfully.'),
          status: 'success',
          duration: 5000,
          isClosable: true,
        })
        navigate('/payments')
        return
      }

      if (status === 'failed') {
        toast({
          title: t('payment.failed.title', 'Payment failed'),
          description: t(
            'payment.failed.message',
            'Stripe was unable to complete the payment. Please try again.',
          ),
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
        return
      }

      toast({
        title: t('payment.status.pendingTitle', 'Awaiting confirmation'),
        description: t('payment.status.pending', 'Awaiting confirmation...'),
        status: 'info',
        duration: 5000,
        isClosable: true,
      })
    },
    [pollForStatus, t, navigate, toast],
  )

  const initializeIntent = useCallback(async () => {
    if (!currentPayment?.id) return

    try {
      setIntentLoading(true)
      setIntentError(null)
      const { data } = await axiosInstance.post(`/api/payments/${currentPayment.id}/stripe-intent`)
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
            appearance: {
              theme: colorMode === 'dark' ? 'night' : 'stripe',
              variables: {
                colorPrimary: colorMode === 'dark' ? '#63b3ed' : '#3182ce',
                colorBackground: colorMode === 'dark' ? '#1a202c' : '#ffffff',
                colorText: colorMode === 'dark' ? '#e2e8f0' : '#1a202c',
                colorDanger: colorMode === 'dark' ? '#fc8181' : '#e53e3e',
                fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                spacingUnit: '4px',
                borderRadius: '8px',
                fontSizeBase: '16px',
                fontWeightNormal: '400',
                fontWeightMedium: '500',
                fontWeightBold: '600',
              },
              rules: {
                '.Input': {
                  backgroundColor: colorMode === 'dark' ? '#2d3748' : '#f7fafc',
                  border: colorMode === 'dark' ? '1px solid #4a5568' : '1px solid #e2e8f0',
                  color: colorMode === 'dark' ? '#e2e8f0' : '#1a202c',
                  boxShadow: 'none',
                },
                '.Input:focus': {
                  border: colorMode === 'dark' ? '1px solid #63b3ed' : '1px solid #3182ce',
                  boxShadow: colorMode === 'dark'
                    ? '0 0 0 1px #63b3ed'
                    : '0 0 0 1px #3182ce',
                },
                '.Label': {
                  color: colorMode === 'dark' ? '#a0aec0' : '#4a5568',
                  fontWeight: '500',
                  fontSize: '14px',
                },
                '.Tab': {
                  backgroundColor: colorMode === 'dark' ? '#2d3748' : '#f7fafc',
                  border: colorMode === 'dark' ? '1px solid #4a5568' : '1px solid #e2e8f0',
                  color: colorMode === 'dark' ? '#a0aec0' : '#4a5568',
                },
                '.Tab:hover': {
                  backgroundColor: colorMode === 'dark' ? '#4a5568' : '#edf2f7',
                  color: colorMode === 'dark' ? '#e2e8f0' : '#2d3748',
                },
                '.Tab--selected': {
                  backgroundColor: colorMode === 'dark' ? '#2b6cb0' : '#3182ce',
                  color: '#ffffff',
                  border: colorMode === 'dark' ? '1px solid #2b6cb0' : '1px solid #3182ce',
                },
                '.TabIcon--selected': {
                  fill: '#ffffff',
                },
                '.Error': {
                  color: colorMode === 'dark' ? '#fc8181' : '#e53e3e',
                },
              },
            },
          }
        : null,
    [clientSecret, colorMode],
  )

  useEffect(() => {
    if (canAttemptPayment && !clientSecret) {
      initializeIntent()
    }
  }, [canAttemptPayment, clientSecret, initializeIntent])

  if (loading || !currentPayment) {
    return (
      <PageContainer>
        <Flex justify="center" align="center" minH="60vh">
          <Stack align="center" spacing={4}>
            <Spinner
              size="xl"
              color={iconBlue500}
              thickness="4px"
              speed="0.65s"
            />
            <Text color={useColorModeValue('gray.600', 'gray.400')} fontSize="lg">
              Loading payment details...
            </Text>
          </Stack>
        </Flex>
      </PageContainer>
    )
  }

  if (!publicPaymentConfig?.cardPaymentsEnabled) {
    return (
      <PageContainer>
        <PageHeader
          title={t('payment.unavailable.title', 'Payment Unavailable')}
          subtitle={t('payment.unavailable.subtitle', 'Card payments are currently disabled')}
          icon={CreditCard}
        />
        <Flex justify="center" px={{ base: 4, md: 0 }}>
          <StandardCard
            w="full"
            maxW="2xl"
            borderRadius="2xl"
            shadow={shadowColor}
            bg={cardBg}
            borderWidth="1px"
            borderColor={borderColor}
          >
            <CardBody textAlign="center" py={12} px={{ base: 4, md: 8 }}>
              <Alert
                status="warning"
                borderRadius="xl"
                mb={8}
                bg={useColorModeValue('orange.50', 'orange.900')}
                borderWidth="1px"
                borderColor={useColorModeValue('orange.200', 'orange.700')}
                py={4}
              >
                <AlertIcon />
                <Text fontWeight="medium">
                  {t(
                    'payment.unavailable.configuration',
                    'Please contact an administrator to enable Stripe payments.',
                  )}
                </Text>
              </Alert>
              <Button
                colorScheme="brand"
                onClick={handleGoBack}
                minH="48px"
                px={8}
                borderRadius="lg"
                fontWeight="semibold"
                fontSize="md"
                leftIcon={<Icon as={ArrowLeft} boxSize={ICON_BOX_MD} aria-hidden="true" />}
                _hover={{
                  transform: 'translateY(-2px)',
                  shadow: 'lg'
                }}
                transition="all 0.2s"
              >
                {t('common.goBack', 'Go Back')}
              </Button>
            </CardBody>
          </StandardCard>
        </Flex>
      </PageContainer>
    )
  }

  const showPaymentForm = Boolean(
    stripePromise && options && clientSecret && canAttemptPayment && !isCompleted,
  )
  const showUnavailableAlert = !canAttemptPayment && !isCompleted && !receiptUrl && !isFailed
  const alertStatus =
    statusVariant === 'error' ? 'error' : statusVariant === 'success' ? 'success' : 'info'

  return (
    <PageContainer>
      <PageHeader
        title={t('payment.title', 'Make Payment')}
        subtitle={t('payment.subtitle', 'Complete your payment securely')}
        icon={CreditCard}
      />

      <Flex justify="center" px={{ base: 4, md: 0 }}>
        <StandardCard
          w="full"
          maxW="2xl"
          borderRadius="2xl"
          shadow={shadowColor}
          bg={cardBg}
          borderWidth="1px"
          borderColor={borderColor}
          overflow="hidden"
        >
          <CardHeader
            bg={headerBg}
            borderBottomWidth="1px"
            borderColor={borderColor}
            py={6}
            px={{ base: 4, md: 8 }}
          >
            <Flex justify="space-between" align="center" gap={4} wrap="wrap">
              <Box flex="1">
                <Heading as="h5" size="md" mb={2} color={textPrimary} fontWeight="bold">
                  {t('payment.details.title', 'Payment Details')}
                </Heading>
                <Text fontSize="sm" color={textSecondary} fontWeight="medium">
                  {t('payment.order', 'Order')} #{currentPayment.orderId}
                </Text>
              </Box>
              <Box
                textAlign="right"
                bg={amountBg}
                px={6}
                py={4}
                borderRadius="xl"
                borderWidth="1px"
                borderColor={amountBorder}
                minW={{ base: 'full', sm: 'auto' }}
              >
                <Heading as="h4" size="lg" color={iconBlue500} fontWeight="bold" mb={1}>
                  {formatCurrency(amountCents, currentPayment.currency)}
                </Heading>
                <Text fontSize="xs" color={textSecondary} textTransform="uppercase" fontWeight="semibold" letterSpacing="wider">
                  {currentPayment.currency || 'USD'}
                </Text>
              </Box>
            </Flex>
          </CardHeader>
          <CardBody py={8} px={{ base: 4, md: 8 }}>
            <Stack spacing={6}>
              {processing && (
                <Alert
                  status="info"
                  borderRadius="xl"
                  bg={useColorModeValue('blue.50', 'blue.900')}
                  borderWidth="1px"
                  borderColor={useColorModeValue('blue.200', 'blue.700')}
                  py={4}
                >
                  <AlertIcon color={iconBlue500} />
                  <Text fontWeight="medium" color={textPrimary}>
                    {t('payment.processing', 'Processing payment...')}
                  </Text>
                </Alert>
              )}

              {statusMessage && (
                <Alert
                  status={alertStatus}
                  borderRadius="xl"
                  borderWidth="1px"
                  py={4}
                >
                  <AlertIcon />
                  <Flex justify="space-between" align="center" gap={4} wrap="wrap" w="full">
                    <Text fontWeight="medium">{statusMessage}</Text>
                    {isFailed && (
                      <Button
                        size="md"
                        colorScheme="red"
                        variant="solid"
                        onClick={handleRetryPayment}
                        isLoading={intentLoading}
                        minH="44px"
                        borderRadius="lg"
                        fontWeight="semibold"
                        px={6}
                        _hover={{
                          transform: 'translateY(-2px)',
                          shadow: 'md'
                        }}
                        transition="all 0.2s"
                      >
                        {t('payment.retry', 'Retry Payment')}
                      </Button>
                    )}
                  </Flex>
                </Alert>
              )}

              {intentError && (
                <Stack spacing={4}>
                  <Alert
                    status="error"
                    borderRadius="xl"
                    bg={useColorModeValue('red.50', 'red.900')}
                    borderWidth="1px"
                    borderColor={useColorModeValue('red.200', 'red.700')}
                    py={4}
                  >
                    <AlertIcon />
                    <Text fontWeight="medium">{intentError}</Text>
                  </Alert>
                  <Button
                    colorScheme="brand"
                    variant="solid"
                    onClick={initializeIntent}
                    isLoading={intentLoading}
                    minH="44px"
                    borderRadius="lg"
                    fontWeight="semibold"
                    px={6}
                    _hover={{
                      transform: 'translateY(-2px)',
                      shadow: 'md'
                    }}
                    transition="all 0.2s"
                  >
                    {t('payment.retry', 'Retry Payment')}
                  </Button>
                </Stack>
              )}

              {receiptUrl && (
                <Alert
                  status="success"
                  borderRadius="xl"
                  bg={useColorModeValue('green.50', 'green.900')}
                  borderWidth="1px"
                  borderColor={useColorModeValue('green.200', 'green.700')}
                  py={4}
                >
                  <AlertIcon />
                  <HStack spacing={4} wrap="wrap">
                    <Text fontWeight="medium">{t('payment.receipt.available', 'Receipt available')}:</Text>
                    <Button
                      as="a"
                      href={receiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="link"
                      colorScheme="green"
                      fontWeight="bold"
                      minH="44px"
                      fontSize="md"
                      _hover={{
                        textDecoration: 'underline'
                      }}
                    >
                      {t('payment.receipt.view', 'View Receipt')}
                    </Button>
                  </HStack>
                </Alert>
              )}

              {!clientSecret && intentLoading && (
                <Flex justify="center" py={8}>
                  <Spinner
                    color={iconBlue500}
                    size="xl"
                    thickness="4px"
                    speed="0.65s"
                  />
                </Flex>
              )}

              {showPaymentForm && (
                <Box
                  p={{ base: 4, md: 6 }}
                  bg={useColorModeValue('gray.50', 'gray.900')}
                  borderRadius="xl"
                  borderWidth="1px"
                  borderColor={borderColor}
                >
                  <Elements stripe={stripePromise} options={options}>
                    <StripeCheckoutForm
                      paymentId={currentPayment.id}
                      onProcessingChange={setProcessing}
                      onPaymentComplete={handlePaymentComplete}
                      onError={setIntentError}
                      submitLabel={t('payment.confirm', 'Confirm Payment')}
                    />
                  </Elements>
                </Box>
              )}

              {showUnavailableAlert && (
                <Alert
                  status="warning"
                  borderRadius="xl"
                  bg={useColorModeValue('orange.50', 'orange.900')}
                  borderWidth="1px"
                  borderColor={useColorModeValue('orange.200', 'orange.700')}
                  py={4}
                >
                  <AlertIcon />
                  <Text fontWeight="medium">
                    {t(
                      'payment.unavailable.status',
                      'This payment is not available for processing right now. Current status:',
                    )}{' '}
                    <Text as="span" fontWeight="bold" color={iconBlue500}>
                      {currentPayment.status}
                    </Text>
                  </Text>
                </Alert>
              )}

              <HStack justify="flex-end" spacing={4} wrap="wrap" pt={4}>
                {isCompleted && (
                  <Button
                    colorScheme="brand"
                    onClick={handleViewPayments}
                    minH="48px"
                    px={8}
                    borderRadius="lg"
                    fontWeight="semibold"
                    fontSize="md"
                    _hover={{
                      transform: 'translateY(-2px)',
                      shadow: 'lg'
                    }}
                    transition="all 0.2s"
                  >
                    {t('payment.viewPayments', 'View Payments')}
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={handleGoBack}
                  minH="48px"
                  px={8}
                  borderRadius="lg"
                  fontWeight="semibold"
                  fontSize="md"
                  leftIcon={<Icon as={ArrowLeft} boxSize={ICON_BOX_MD} aria-hidden="true" />}
                  borderColor={borderColor}
                  color={textSecondary}
                  _hover={{
                    bg: useColorModeValue('gray.100', 'gray.700'),
                    transform: 'translateY(-2px)',
                    shadow: 'md'
                  }}
                  transition="all 0.2s"
                >
                  {t('common.goBack', 'Go Back')}
                </Button>
              </HStack>
            </Stack>
          </CardBody>
        </StandardCard>
      </Flex>
    </PageContainer>
  )
}

export default PaymentPage
