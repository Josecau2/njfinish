import { useEffect, useMemo, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { useParams, useNavigate } from 'react-router-dom'
import { Alert, Card, CardBody, CardHeader, Box, Container, Flex, Spinner, Icon, Button } from '@chakra-ui/react'
import { ArrowLeft } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import { fetchPaymentById, fetchPublicPaymentConfig } from '../../store/slices/paymentsSlice'
import { FaCreditCard } from 'react-icons/fa'
import Swal from 'sweetalert2'
import axiosInstance from '../../helpers/axiosInstance'
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'

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
    <form onSubmit={handleSubmit} className="stack gap-3">
      <PaymentElement options={{ layout: 'tabs' }} />
      <div className="d-flex justify-content-end gap-2">
        <Button type="submit" colorScheme="blue" disabled={!stripe || !elements || submitting}>
          {submitting ? <Spinner size="sm" aria-hidden /> : null}
          <span className={submitting ? 'ms-2' : ''}>{submitLabel}</span>
        </Button>
      </div>
    </form>
  
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
        setStatusVariant('danger')
        setStatusMessage(t('payment.status.failed', 'Payment failed. Please try again.'))
        setClientSecret('')
        return 'failed'
      }
      await new Promise((resolve) => setTimeout(resolve, 2000))
    }
    setStatusVariant('info')
    setStatusMessage(t('payment.status.pending', 'Awaiting confirmation...'))
    return 'pending'
  }, [refreshPayment, t])

  const initializeIntent = useCallback(async () => {
    if (!id) return
    setIntentLoading(true)
    setIntentError(null)
    try {
      const { data } = await axiosInstance.post(`/api/payments/${id}/stripe-intent`)
      setClientSecret(data.clientSecret)
      setStatusVariant('info')
      setStatusMessage('')
      await refreshPayment()
    } catch (error) {
      setIntentError(
        error.response?.data?.error || error.message || 'Unable to initialize payment.',
      )
    } finally {
      setIntentLoading(false)
    }
  }, [id, refreshPayment])

  useEffect(() => {
    if (!publicPaymentConfig?.cardPaymentsEnabled || !publicPaymentConfig?.publishableKey) {
      return
    }
    if (!currentPayment || !['pending', 'failed'].includes(currentPayment.status)) {
      return
    }
    if (!clientSecret && !intentLoading) {
      initializeIntent()
    }
  }, [publicPaymentConfig, currentPayment?.status, clientSecret, intentLoading, initializeIntent])

  useEffect(() => {
    if (!currentPayment) return

    if (currentPayment.status === 'completed') {
      setStatusVariant('success')
      setStatusMessage(t('payment.status.completed', 'Payment completed successfully.'))
      return
    }

    if (currentPayment.status === 'failed') {
      setStatusVariant('danger')
      setStatusMessage(t('payment.status.failed', 'Payment failed. Please try again.'))
      if (clientSecret) {
        setClientSecret('')
      }
      return
    }

    if (currentPayment.status === 'processing') {
      setStatusVariant('info')
      setStatusMessage(t('payment.status.processing', 'Payment is processing. Please wait...'))
      return
    }

    if (currentPayment.status === 'pending') {
      setStatusVariant('info')
      setStatusMessage('')
    }
  }, [currentPayment, clientSecret, t])

  const handleGoBack = () => {
    navigate(-1)
  }

  const handleViewPayments = useCallback(() => {
    navigate('/payments')
  }, [navigate])

  const handlePaymentComplete = useCallback(async () => {
    const status = await pollForStatus()

    if (status === 'completed') {
      const result = await Swal.fire({
        title: t('payment.success.title', 'Payment Successful!'),
        text: t('payment.success.message', 'Your payment has been processed successfully.'),
        icon: 'success',
        showCancelButton: true,
        confirmButtonText: t('payment.success.viewPayments', 'View payments'),
        cancelButtonText: t('payment.success.stay', 'Stay here'),
      })
      if (result.isConfirmed) {
        handleViewPayments()
      }
      return
    }

    if (status === 'failed') {
      await Swal.fire({
        title: t('payment.failed.title', 'Payment failed'),
        text: t(
          'payment.failed.message',
          'Stripe was unable to complete the payment. Please try again.',
        ),
        icon: 'error',
      })
      return
    }

    await Swal.fire({
      title: t('payment.status.pendingTitle', 'Awaiting confirmation'),
      text: t('payment.status.pending', 'Awaiting confirmation...'),
      icon: 'info',
    })
  }, [pollForStatus, t, handleViewPayments])

  const handleRetryPayment = useCallback(() => {
    setClientSecret('')
    initializeIntent()
  }, [initializeIntent])

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

  if (loading || !currentPayment) {
    return (
      <Container fluid className="py-5 text-center">
        <Spinner colorScheme="blue" />
      </Container>
  
  )
  }

  if (!publicPaymentConfig?.cardPaymentsEnabled) {
    return (
      <Container fluid className="payment-page">
        <PageHeader
          title={t('payment.unavailable.title', 'Payment Unavailable')}
          subtitle={t('payment.unavailable.subtitle', 'Card payments are currently disabled')}
          icon={FaCreditCard}
        />
        <Card>
          <CardBody className="text-center py-5">
            <Alert status="warning">
              {t(
                'payment.unavailable.configuration',
                'Please contact an administrator to enable Stripe payments.',
              )}
            </Alert>
            <Button colorScheme="blue" onClick={handleGoBack}>
              <Icon as={ArrowLeft} className="me-2" />
              {t('common.goBack', 'Go Back')}
            </Button>
          </CardBody>
        </Card>
      </Container>
  
  )
  }

  const showPaymentForm = Boolean(
    stripePromise && options && clientSecret && canAttemptPayment && !isCompleted,
  )
  const showUnavailableAlert = !canAttemptPayment && !isCompleted && !receiptUrl && !isFailed

  return (
    <Container fluid className="payment-page">
      <PageHeader
        title={t('payment.title', 'Make Payment')}
        subtitle={t('payment.subtitle', 'Complete your payment securely')}
        icon={FaCreditCard}
      />

      <Flex>
        <Box lg={8} className="mx-auto">
          <Card>
            <CardHeader className="d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-0">{t('payment.details.title', 'Payment Details')}</h5>
                <small className="text-muted">
                  {t('payment.order', 'Order')} #{currentPayment.orderId}
                </small>
              </div>
              <div className="text-end">
                <h4 className="mb-0 text-primary">
                  {formatCurrency(amountCents, currentPayment.currency)}
                </h4>
                <small className="text-muted text-uppercase">
                  {currentPayment.currency || 'USD'}
                </small>
              </div>
            </CardHeader>
            <CardBody className="stack gap-4">
              {processing ? (
                <Alert status="info" role="status" aria-live="polite">
                  <Spinner size="sm" className="me-2" aria-hidden />
                  {t('payment.processing', 'Processing payment...')}
                </Alert>
              ) : null}

              {statusMessage ? (
                <Alert color={statusVariant} role="status" aria-live="polite">
                  <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap">
                    <span>{statusMessage}</span>
                    {isFailed ? (
                      <Button
                        size="sm"
                        colorScheme="red"
                        variant="outline"
                        onClick={handleRetryPayment}
                        disabled={intentLoading}
                      >
                        {intentLoading ? <Spinner size="sm" aria-hidden /> : null}
                        <span className={intentLoading ? 'ms-2' : ''}>
                          {t('payment.retry', 'Retry Payment')}
                        </span>
                      </Button>
                    ) : null}
                  </div>
                </Alert>
              ) : null}

              {intentError ? (
                <div className="stack gap-2">
                  <Alert status="error" role="alert">
                    {intentError}
                  </Alert>
                  <div>
                    <Button
                      colorScheme="blue"
                      variant="outline"
                      onClick={initializeIntent}
                      disabled={intentLoading}
                    >
                      {intentLoading ? <Spinner size="sm" aria-hidden /> : null}
                      <span className={intentLoading ? 'ms-2' : ''}>
                        {t('payment.retry', 'Retry Payment')}
                      </span>
                    </Button>
                  </div>
              ) : null}

              {receiptUrl ? (
                <Alert status="success" role="status">
                  <strong>{t('payment.receipt.available', 'Receipt available')}:</strong>{' '}
                  <a href={receiptUrl} target="_blank" rel="noopener noreferrer">
                    {t('payment.receipt.view', 'View Receipt')}
                  </a>
                </Alert>
              ) : null}

              {!clientSecret && intentLoading ? (
                <div className="text-center py-4">
                  <Spinner colorScheme="blue" />
                </div>
              ) : null}

              {showPaymentForm ? (
                <Elements stripe={stripePromise} options={options}>
                  <StripeCheckoutForm
                    paymentId={currentPayment.id}
                    onProcessingChange={setProcessing}
                    onPaymentComplete={handlePaymentComplete}
                    onError={setIntentError}
                    submitLabel={t('payment.confirm', 'Confirm Payment')}
                  />
                </Elements>
              ) : null}

              {showUnavailableAlert ? (
                <Alert status="warning">
                  {t(
                    'payment.unavailable.status',
                    'This payment is not available for processing right now. Current status:',
                  )}{' '}
                  <strong>{currentPayment.status}</strong>
                </Alert>
              ) : null}

              <div className="d-flex justify-content-end gap-2">
                {isCompleted ? (
                  <Button colorScheme="blue" onClick={handleViewPayments}>
                    {t('payment.viewPayments', 'View Payments')}
                  </Button>
                ) : null}
                <Button colorScheme="gray" variant="outline" onClick={handleGoBack}>
                  <Icon as={ArrowLeft} className="me-2" />
                  {t('common.goBack', 'Go Back')}
                </Button>
              </div>
            </CardBody>
          </Card>
        </Box>
      </Flex>
    </Container>
  )
}

export default PaymentPage
