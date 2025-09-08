import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  CButton,
  CCard,
  CCardBody,
  CCol,
  CContainer,
  CRow,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilArrowLeft } from '../../icons';
import PageHeader from '../../components/PageHeader';
import { FaCreditCard } from 'react-icons/fa';

const PaymentCancel = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <CContainer fluid className="payment-result">
      <style>{`
        .payment-result .btn { min-height: 44px; }
      `}</style>
      <PageHeader
        title={t('payments.toast.paymentCancelled', 'Payment Cancelled')}
        subtitle={t('payment.unavailable.subtitle', 'This payment cannot be processed at this time')}
        icon={FaCreditCard}
      />
      <CRow>
        <CCol md={8} className="mx-auto">
          <CCard>
            <CCardBody className="text-center py-5">
              <h4 className="mb-2">{t('payments.toast.paymentCancelled', 'Payment Cancelled')}</h4>
              <p className="text-muted mb-4">{t('payment.error.generic', 'There was an error processing your payment. Please try again.')}</p>
              <div className="d-flex gap-2 justify-content-center">
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

export default PaymentCancel;
