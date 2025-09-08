import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  CAlert,
  CButton,
  CCard,
  CCardBody,
  CCol,
  CContainer,
  CForm,
  CFormInput,
  CFormLabel,
  CRow,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilCreditCard, cilArrowLeft } from '../../icons';
import PageHeader from '../../components/PageHeader';
import { FaCreditCard } from 'react-icons/fa';
import { useState } from 'react';

const PaymentTest = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [txn, setTxn] = useState('TEST-TXN-12345');

  const handleDispatchSuccess = () => {
    const detail = { transactionId: txn || 'TEST-TXN-12345', provider: 'test' };
    window.dispatchEvent(new CustomEvent('paymentSuccess', { detail }));
  };

  const handleDispatchError = () => {
    const detail = { message: 'Simulated failure' };
    window.dispatchEvent(new CustomEvent('paymentError', { detail }));
  };

  return (
    <CContainer fluid className="payment-test">
      <style>{`
        .payment-test .btn { min-height: 44px; }
      `}</style>
      <PageHeader
        title={t('paymentConfig.test.button', 'Test Configuration')}
        subtitle={t('payment.subtitle', 'Complete your payment securely')}
        icon={FaCreditCard}
      />
      <CRow>
        <CCol md={8} className="mx-auto">
          <CCard>
            <CCardBody>
              <CAlert color="info" aria-live="polite" role="status">
                {t('payment.embed.notConfigured', 'Embedded payment form is not configured. Please contact support.')}
              </CAlert>
              <CForm className="mt-3">
                <div className="mb-3">
                  <CFormLabel htmlFor="txn">Transaction ID</CFormLabel>
                  <CFormInput id="txn" value={txn} onChange={(e) => setTxn(e.target.value)} />
                </div>
                <div className="d-flex gap-2 flex-wrap">
                  <CButton color="success" onClick={handleDispatchSuccess} aria-label="Dispatch paymentSuccess">
                    <CIcon icon={cilCreditCard} className="me-2" />
                    Dispatch paymentSuccess
                  </CButton>
                  <CButton color="danger" variant="outline" onClick={handleDispatchError} aria-label="Dispatch paymentError">
                    Dispatch paymentError
                  </CButton>
                  <CButton color="secondary" variant="outline" onClick={() => navigate(-1)} aria-label={t('common.goBack','Go Back')}>
                    <CIcon icon={cilArrowLeft} className="me-2" />
                    {t('common.goBack', 'Go Back')}
                  </CButton>
                </div>
              </CForm>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </CContainer>
  );
};

export default PaymentTest;
