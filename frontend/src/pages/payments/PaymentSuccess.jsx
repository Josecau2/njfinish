import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  CAlert,
  CButton,
  CCard,
  CCardBody,
  CCol,
  CContainer,
  CRow,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilCheckCircle, cilArrowLeft } from '../../icons';
import PageHeader from '../../components/PageHeader';
import { FaCreditCard } from 'react-icons/fa';

const PaymentSuccess = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  // Optional: auto-redirect back to payments after a delay
  useEffect(() => {
    const timer = setTimeout(() => {
      // no-op auto redirect; leave manual navigation
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const transactionId = params.get('transactionId');

  return (
    <CContainer fluid className="payment-result">
      <style>{`
        .payment-result .btn { min-height: 44px; }
      `}</style>
      <PageHeader
        title={t('payment.success.title', 'Payment Successful!')}
        subtitle={t('payment.success.message', 'Your payment has been processed successfully.')}
        icon={FaCreditCard}
      />
      <CRow>
        <CCol md={8} className="mx-auto">
          <CCard>
            <CCardBody className="text-center py-5">
              <CIcon icon={cilCheckCircle} size="4xl" className="text-success mb-3" />
              <h4 className="mb-2">{t('payment.completed.title', 'Payment Completed')}</h4>
              <p className="text-muted mb-4">{t('payment.completed.subtitle', 'This payment has already been processed')}</p>
              {transactionId && (
                <CAlert color="light" className="mx-auto" role="status" aria-live="polite">
                  {t('payment.transactionId', 'Transaction ID')}: <code>{transactionId}</code>
                </CAlert>
              )}
              <div className="d-flex gap-2 justify-content-center mt-3">
                <CButton color="primary" onClick={() => navigate('/payments')} aria-label={t('payments.title.admin', 'All Payments')}>
                  {t('payments.title.admin', 'All Payments')}
                </CButton>
                <CButton color="secondary" variant="outline" onClick={() => navigate(-1)} aria-label={t('common.goBack','Go Back')}>
                  <CIcon icon={cilArrowLeft} className="me-2" />
                  {t('common.goBack', 'Go Back')}
                </CButton>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </CContainer>
  );
};

export default PaymentSuccess;
