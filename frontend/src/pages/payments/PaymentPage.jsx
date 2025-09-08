import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CContainer,
  CRow,
  CSpinner,
  CAlert,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilCreditCard, cilArrowLeft, cilCheckCircle } from '../../icons';
import PageHeader from '../../components/PageHeader';
import {
  fetchPaymentById,
  fetchPublicPaymentConfig,
  updatePaymentStatus,
} from '../../store/slices/paymentsSlice';
import { FaCreditCard } from 'react-icons/fa';
import Swal from 'sweetalert2';

const PaymentPage = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const { currentPayment, publicPaymentConfig, loading } = useSelector((state) => state.payments);
  const [embedLoaded, setEmbedLoaded] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchPaymentById(id));
      dispatch(fetchPublicPaymentConfig());
    }
  }, [dispatch, id]);

  const handleGoBack = () => {
    navigate(-1);
  };

  const handlePaymentSuccess = async (transactionData) => {
    try {
      setPaymentProcessing(true);

      await dispatch(updatePaymentStatus({
        id: currentPayment.id,
        status: 'completed',
        transactionId: transactionData.transactionId,
        gatewayResponse: transactionData,
      })).unwrap();

      Swal.fire({
        title: t('payment.success.title', 'Payment Successful!'),
        text: t('payment.success.message', 'Your payment has been processed successfully.'),
        icon: 'success',
        confirmButtonText: t('payment.success.continue', 'Continue'),
      }).then(() => {
        navigate('/payments');
      });
    } catch (error) {
      console.error('Error updating payment status:', error);
      Swal.fire(
        t('common.error', 'Error'),
        t('payment.error.statusUpdate', 'Payment was successful but there was an error updating the status. Please contact support.'),
        'warning'
      );
    } finally {
      setPaymentProcessing(false);
    }
  };

  const handlePaymentError = (error) => {
    console.error('Payment error:', error);
    Swal.fire(
      t('payment.error.title', 'Payment Failed'),
      error.message || t('payment.error.generic', 'There was an error processing your payment. Please try again.'),
      'error'
    );
  };

  const renderEmbeddedPayment = () => {
    if (!publicPaymentConfig?.embedCode) {
      return (
        <CAlert color="warning">
          {t('payment.embed.notConfigured', 'Embedded payment form is not configured. Please contact support.')}
        </CAlert>
      );
    }

    // Create a script element that will handle the embedded payment form
    const embedScript = `
      ${publicPaymentConfig.embedCode}

      // Add event listeners for payment completion
      window.addEventListener('paymentSuccess', (event) => {
        window.handlePaymentSuccess(event.detail);
      });

      window.addEventListener('paymentError', (event) => {
        window.handlePaymentError(event.detail);
      });
    `;

    return (
      <div className="payment-embed-container">
        <div
          id="payment-form-container"
          dangerouslySetInnerHTML={{ __html: publicPaymentConfig.embedCode }}
        />
        <script dangerouslySetInnerHTML={{ __html: embedScript }} />
      </div>
    );
  };

  const renderExternalPayment = () => {
    if (!publicPaymentConfig?.gatewayUrl) {
      return (
        <CAlert color="warning">
          {t('payment.gateway.notConfigured', 'Payment gateway is not configured. Please contact support.')}
        </CAlert>
      );
    }

    const paymentUrl = `${publicPaymentConfig.gatewayUrl}?orderId=${currentPayment.orderId}&amount=${currentPayment.amount}&currency=${currentPayment.currency}&paymentId=${currentPayment.id}`;

    return (
      <div className="text-center">
        <CIcon icon={cilCreditCard} size="4xl" className="text-primary mb-4" />
        <h4>{t('payment.external.title', 'Secure Payment')}</h4>
        <p className="text-muted mb-4">
          {t('payment.external.description', 'You will be redirected to our secure payment gateway to complete your transaction.')}
        </p>
        <CButton
          color="primary"
          size="lg"
          href={paymentUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          <CIcon icon={cilCreditCard} className="me-2" />
          {t('payment.external.button', 'Pay Now')}
        </CButton>
        <div className="mt-3">
          <small className="text-muted">
            {t('payment.external.security', 'Your payment is processed securely through our certified payment partner.')}
          </small>
        </div>
      </div>
    );
  };

  if (loading || !currentPayment) {
    return (
      <CContainer fluid className="payment-page">
        <style>{`
          .payment-page .btn { min-height: 44px; }
          .payment-embed-container { overflow-x: hidden; }
          .payment-embed-container iframe { width: 100% !important; max-width: 100%; min-height: 420px; border: 0; }
        `}</style>
        <div className="text-center py-5" role="status" aria-live="polite">
          <CSpinner size="lg" aria-label={t('common.loading', 'Loading...')} />
          <p className="mt-3">{t('common.loading', 'Loading...')}</p>
        </div>
      </CContainer>
    );
  }

  if (currentPayment.status === 'completed') {
    return (
      <CContainer fluid className="payment-page">
        <style>{`
          .payment-page .btn { min-height: 44px; }
          .payment-embed-container { overflow-x: hidden; }
          .payment-embed-container iframe { width: 100% !important; max-width: 100%; min-height: 420px; border: 0; }
        `}</style>
        <PageHeader
          title={t('payment.completed.title', 'Payment Completed')}
          subtitle={t('payment.completed.subtitle', 'This payment has already been processed')}
          icon={FaCreditCard}
        />

        <CCard>
          <CCardBody className="text-center py-5">
            <CIcon icon={cilCheckCircle} size="4xl" className="text-success mb-4" />
            <h4 className="text-success">{t('payment.completed.message', 'Payment Successfully Completed')}</h4>
            <p className="text-muted mb-4">
              {t('payment.completed.details', 'This payment was completed on')} {new Date(currentPayment.paidAt).toLocaleDateString()}
            </p>
            {currentPayment.transactionId && (
              <p className="text-muted">
                {t('payment.transactionId', 'Transaction ID')}: <code>{currentPayment.transactionId}</code>
              </p>
            )}
            <CButton color="primary" onClick={handleGoBack}>
              <CIcon icon={cilArrowLeft} className="me-2" />
              {t('common.goBack', 'Go Back')}
            </CButton>
          </CCardBody>
        </CCard>
      </CContainer>
    );
  }

  if (currentPayment.status !== 'pending') {
    return (
      <CContainer fluid className="payment-page">
        <style>{`
          .payment-page .btn { min-height: 44px; }
          .payment-embed-container { overflow-x: hidden; }
          .payment-embed-container iframe { width: 100% !important; max-width: 100%; min-height: 420px; border: 0; }
        `}</style>
        <PageHeader
          title={t('payment.unavailable.title', 'Payment Unavailable')}
          subtitle={t('payment.unavailable.subtitle', 'This payment cannot be processed at this time')}
          icon={FaCreditCard}
        />

        <CCard>
          <CCardBody className="text-center py-5">
            <CAlert color="warning">
              {t('payment.unavailable.message', 'This payment is not available for processing. Status:')} <strong>{currentPayment.status}</strong>
            </CAlert>
            <CButton color="primary" onClick={handleGoBack}>
              <CIcon icon={cilArrowLeft} className="me-2" />
              {t('common.goBack', 'Go Back')}
            </CButton>
          </CCardBody>
        </CCard>
      </CContainer>
    );
  }

  // Expose functions to global scope for embedded payment forms
  if (typeof window !== 'undefined') {
    window.handlePaymentSuccess = handlePaymentSuccess;
    window.handlePaymentError = handlePaymentError;
  }

  return (
    <CContainer fluid className="payment-page">
      <style>{`
        .payment-page .btn { min-height: 44px; }
        .payment-embed-container { overflow-x: hidden; }
        .payment-embed-container iframe { width: 100% !important; max-width: 100%; min-height: 420px; border: 0; }
      `}</style>
      <PageHeader
        title={t('payment.title', 'Make Payment')}
        subtitle={t('payment.subtitle', 'Complete your payment securely')}
        icon={FaCreditCard}
      />

      <CRow>
        <CCol lg={8} className="mx-auto">
          <CCard>
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-0">{t('payment.details.title', 'Payment Details')}</h5>
                <small className="text-muted">
                  {t('payment.order', 'Order')} #{currentPayment.orderId}
                </small>
              </div>
              <div className="text-end">
                <h4 className="mb-0 text-primary">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: currentPayment.currency || 'USD'
                  }).format(currentPayment.amount)}
                </h4>
              </div>
            </CCardHeader>
            <CCardBody>
              {paymentProcessing && (
                <CAlert color="info" role="status" aria-live="polite">
                  <CSpinner size="sm" className="me-2" aria-hidden />
                  {t('payment.processing', 'Processing payment...')}
                </CAlert>
              )}

              {/* Customer info */}
              {currentPayment.order && (
                <div className="mb-4 p-3 bg-light rounded">
                  <h6>{t('payment.customer.title', 'Customer Information')}</h6>
                  <div className="row">
                    <div className="col-md-6">
                      <strong>{t('payment.customer.name', 'Name')}:</strong><br />
                      {currentPayment.order.customer?.name || currentPayment.order.proposal?.customerName || t('common.na')}
                    </div>
                    <div className="col-md-6">
                      <strong>{t('payment.customer.order', 'Order Date')}:</strong><br />
                      {new Date(currentPayment.order.createdAt || currentPayment.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              )}

              {/* Payment form */}
              <div className="payment-form-container" role="region" aria-label={t('payment.formRegion', 'Payment form')}>
                {publicPaymentConfig?.embedCode ? renderEmbeddedPayment() : renderExternalPayment()}
              </div>
            </CCardBody>
          </CCard>

          <div className="text-center mt-3">
            <CButton color="secondary" variant="outline" onClick={handleGoBack}>
              <CIcon icon={cilArrowLeft} className="me-2" />
              {t('common.goBack', 'Go Back')}
            </CButton>
          </div>
        </CCol>
      </CRow>
    </CContainer>
  );
};

export default PaymentPage;
