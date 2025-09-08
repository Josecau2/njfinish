import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CContainer,
  CForm,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CFormTextarea,
  CRow,
  CSpinner,
  CAlert,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilSettings, cilSave } from '../../icons';
import PageHeader from '../../components/PageHeader';
import {
  fetchPaymentConfig,
  savePaymentConfig,
  updatePaymentConfig,
  clearConfigError,
} from '../../store/slices/paymentsSlice';
import { FaCogs } from 'react-icons/fa';
import Swal from 'sweetalert2';

const PaymentConfiguration = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { paymentConfig, configLoading, configError } = useSelector((state) => state.payments);

  const [formData, setFormData] = useState({
    gatewayProvider: 'stripe',
    gatewayUrl: '',
    embedCode: '',
    supportedCurrencies: ['USD'],
    settings: {},
  });

  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    dispatch(fetchPaymentConfig());
  }, [dispatch]);

  useEffect(() => {
    if (paymentConfig) {
      console.log('PaymentConfig received:', paymentConfig);
      console.log('supportedCurrencies type:', typeof paymentConfig.supportedCurrencies);
      console.log('supportedCurrencies isArray:', Array.isArray(paymentConfig.supportedCurrencies));

      setFormData({
        gatewayProvider: paymentConfig.gatewayProvider || 'stripe',
        gatewayUrl: paymentConfig.gatewayUrl || '',
        embedCode: paymentConfig.embedCode || '',
    // Normalize to an array; handle string (comma-separated) or null/undefined
    supportedCurrencies: Array.isArray(paymentConfig.supportedCurrencies)
      ? paymentConfig.supportedCurrencies
      : (typeof paymentConfig.supportedCurrencies === 'string'
        ? paymentConfig.supportedCurrencies
          .split(',')
          .map((c) => c.trim().toUpperCase())
          .filter(Boolean)
        : ['USD']),
        settings: paymentConfig.settings || {},
      });
    }
  }, [paymentConfig]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setIsDirty(true);
  };

  const handleCurrenciesChange = (value) => {
    const currencies = (value || '')
      .split(',')
      .map((c) => c.trim().toUpperCase())
      .filter((c) => c);
    handleInputChange('supportedCurrencies', currencies);
  };

  const handleSave = async () => {
    try {
      const payload = {
        ...formData,
        settings: typeof formData.settings === 'string' ? JSON.parse(formData.settings) : formData.settings,
      };

      if (paymentConfig?.id) {
        await dispatch(updatePaymentConfig({ id: paymentConfig.id, ...payload })).unwrap();
      } else {
        await dispatch(savePaymentConfig(payload)).unwrap();
      }

      setIsDirty(false);

      Swal.fire(
        t('common.success', 'Success'),
        t('paymentConfig.save.success', 'Payment configuration saved successfully'),
        'success'
      );
    } catch (error) {
      Swal.fire(
        t('common.error', 'Error'),
        error.message || t('paymentConfig.save.error', 'Failed to save payment configuration'),
        'error'
      );
    }
  };

  const handleTestConfiguration = async () => {
    if (!formData.gatewayUrl) {
      Swal.fire(
        t('common.error', 'Error'),
        t('paymentConfig.test.noUrl', 'Please configure a gateway URL first'),
        'warning'
      );
      return;
    }

    try {
      // Simple URL validation
      new URL(formData.gatewayUrl);

      Swal.fire(
        t('common.success', 'Success'),
        t('paymentConfig.test.success', 'Configuration appears valid. Please test with a real payment to confirm.'),
        'success'
      );
    } catch (error) {
      Swal.fire(
        t('common.error', 'Error'),
        t('paymentConfig.test.invalidUrl', 'Invalid gateway URL'),
        'error'
      );
    }
  };

  // Safe getter for currencies text representation
  const getCurrenciesText = () => {
    if (Array.isArray(formData.supportedCurrencies)) {
      return formData.supportedCurrencies.join(', ');
    }
    if (typeof formData.supportedCurrencies === 'string') {
      return formData.supportedCurrencies;
    }
    return '';
  };

  return (
    <CContainer fluid className="payment-config">
      <style>{`
        /* Small, safe, component-scoped mobile tweaks */
        .payment-config .card-header .d-flex { gap: 0.5rem; flex-wrap: wrap; }
        @media (max-width: 576px) {
          .payment-config .card-header .d-flex > .btn { flex: 1 1 auto; min-height: 44px; }
          .payment-config .card-body .row + .row { margin-top: 0.5rem; }
          .payment-config textarea, .payment-config input, .payment-config select { min-height: 44px; }
        }
      `}</style>
      <PageHeader
        title={t('paymentConfig.title', 'Payment Configuration')}
        subtitle={t('paymentConfig.subtitle', 'Configure payment gateway settings and embedded payment forms')}
        icon={FaCogs}
      />

      {configError && (
        <CAlert color="danger" dismissible onClose={() => dispatch(clearConfigError())}>
          {configError}
        </CAlert>
      )}

      <CCard>
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <CIcon icon={cilSettings} className="me-2" />
            {t('paymentConfig.gateway.title', 'Payment Gateway Settings')}
          </h5>
          <div className="d-flex gap-2">
            <CButton
              color="secondary"
              variant="outline"
              onClick={handleTestConfiguration}
              disabled={configLoading}
            >
              {t('paymentConfig.test.button', 'Test Configuration')}
            </CButton>
            <CButton
              color="primary"
              onClick={handleSave}
              disabled={configLoading || !isDirty}
            >
              {configLoading ? (
                <CSpinner size="sm" className="me-2" />
              ) : (
                <CIcon icon={cilSave} className="me-2" />
              )}
              {t('common.save', 'Save')}
            </CButton>
          </div>
        </CCardHeader>
        <CCardBody>
          <CForm>
            <CRow className="mb-3">
              <CCol md={6}>
                <CFormLabel htmlFor="gatewayProvider">
                  {t('paymentConfig.gateway.provider', 'Gateway Provider')}
                </CFormLabel>
                <CFormSelect
                  id="gatewayProvider"
                  value={formData.gatewayProvider}
                  onChange={(e) => handleInputChange('gatewayProvider', e.target.value)}
                >
                  <option value="stripe">{t('paymentConfig.providers.stripe', 'Stripe')}</option>
                  <option value="paypal">{t('paymentConfig.providers.paypal', 'PayPal')}</option>
                  <option value="square">{t('paymentConfig.providers.square', 'Square')}</option>
                  <option value="custom">{t('paymentConfig.providers.custom', 'Custom')}</option>
                </CFormSelect>
              </CCol>
              <CCol md={6}>
                <CFormLabel htmlFor="supportedCurrencies">
                  {t('paymentConfig.currencies.label', 'Supported Currencies')}
                </CFormLabel>
                <CFormInput
                  id="supportedCurrencies"
                  type="text"
                  value={getCurrenciesText()}
                  onChange={(e) => handleCurrenciesChange(e.target.value)}
                  placeholder={t('paymentConfig.currencies.placeholder', 'USD, EUR, CAD')}
                />
                <small className="text-muted">
                  {t('paymentConfig.currencies.help', 'Separate multiple currencies with commas')}
                </small>
              </CCol>
            </CRow>

            <CRow className="mb-3">
              <CCol md={12}>
                <CFormLabel htmlFor="gatewayUrl">
                  {t('paymentConfig.gateway.url', 'Gateway URL')} *
                </CFormLabel>
                <CFormInput
                  id="gatewayUrl"
                  type="url"
                  value={formData.gatewayUrl}
                  onChange={(e) => handleInputChange('gatewayUrl', e.target.value)}
                  placeholder={t('paymentConfig.gateway.urlPlaceholder', 'https://your-payment-gateway.com/checkout')}
                  required
                />
                <small className="text-muted">
                  {t('paymentConfig.gateway.urlHelp', 'The URL where customers will be redirected to make payments')}
                </small>
              </CCol>
            </CRow>

            <CRow className="mb-3">
              <CCol md={12}>
                <CFormLabel htmlFor="embedCode">
                  {t('paymentConfig.embed.title', 'Embedded Payment Form Code')}
                </CFormLabel>
                <CFormTextarea
                  id="embedCode"
                  rows={8}
                  value={formData.embedCode}
                  onChange={(e) => handleInputChange('embedCode', e.target.value)}
                  placeholder={t('paymentConfig.embed.placeholder', 'Paste your payment gateway\'s embed code here...')}
                />
                <small className="text-muted">
                  {t('paymentConfig.embed.help', 'Optional: HTML/JavaScript code to embed payment forms directly in your pages')}
                </small>
              </CCol>
            </CRow>

            <CRow className="mb-3">
              <CCol md={12}>
                <CFormLabel htmlFor="settings">
                  {t('paymentConfig.advanced.title', 'Advanced Settings (JSON)')}
                </CFormLabel>
                <CFormTextarea
                  id="settings"
                  rows={6}
                  value={typeof formData.settings === 'object' ? JSON.stringify(formData.settings, null, 2) : formData.settings}
                  onChange={(e) => handleInputChange('settings', e.target.value)}
                  placeholder={`{\n  "theme": "light",\n  "locale": "en",\n  "allowedPaymentMethods": ["card", "bank_transfer"]\n}`}
                />
                <small className="text-muted">
                  {t('paymentConfig.advanced.help', 'Additional configuration options in JSON format')}
                </small>
              </CCol>
            </CRow>
          </CForm>
        </CCardBody>
      </CCard>

      <CCard className="mt-4">
        <CCardHeader>
          <h5 className="mb-0">{t('paymentConfig.preview.title', 'Configuration Preview')}</h5>
        </CCardHeader>
        <CCardBody>
          <div className="border rounded p-3 bg-light">
            <h6>{t('paymentConfig.preview.current', 'Current Configuration')}</h6>
            <div className="row">
              <div className="col-md-6">
                <strong>{t('paymentConfig.gateway.provider', 'Provider')}:</strong> {formData.gatewayProvider}
              </div>
              <div className="col-md-6">
                <strong>{t('paymentConfig.currencies.label', 'Currencies')}:</strong> {getCurrenciesText()}
              </div>
            </div>
            <div className="mt-2">
              <strong>{t('paymentConfig.gateway.url', 'Gateway URL')}:</strong>
              <br />
              <code className="text-break">{formData.gatewayUrl || t('paymentConfig.preview.notSet', 'Not configured')}</code>
            </div>
            {formData.embedCode && (
              <div className="mt-2">
                <strong>{t('paymentConfig.embed.title', 'Embed Code')}:</strong>
                <br />
                <small className="text-muted">{t('paymentConfig.preview.embedConfigured', 'Embedded payment form configured')}</small>
              </div>
            )}
          </div>
        </CCardBody>
      </CCard>
    </CContainer>
  );
};

export default PaymentConfiguration;
