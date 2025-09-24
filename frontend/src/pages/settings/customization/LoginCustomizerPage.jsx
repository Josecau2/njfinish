import { useState, useEffect } from "react";
import {
  CButton,
  CModal,
  CModalBody,
  CCard,
  CCardBody,
  CForm,
  CFormInput,
  CFormLabel,
  CFormTextarea,
  CFormCheck,
  CRow,
  CCol,
  CContainer,
  CSpinner,
  CInputGroup,
  CFormRange,
} from "@coreui/react";
import CIcon from '@coreui/icons-react';
import { cilSettings, cilPaintBucket, cilText, cilColorPalette, cilSave } from '@coreui/icons';
import axiosInstance from "../../../helpers/axiosInstance";
import LoginPreview from "../../../components/LoginPreview";
import { CUSTOMIZATION_CONFIG as FALLBACK_APP_CUSTOMIZATION } from '../../../config/customization';
import { FaCog, FaPalette } from "react-icons/fa";
import Swal from 'sweetalert2';
import { useTranslation } from 'react-i18next';
import PageHeader from '../../../components/PageHeader';

const DEFAULT_SETTINGS = {
  logo: "",
  logoHeight: 60,
  title: "Sign In",
  subtitle: "Enter your email and password to sign in!",
  backgroundColor: "#0e1446",
  showForgotPassword: true,
  showKeepLoggedIn: true,
  rightTitle: "See Your Cabinet Price in Seconds!",
  rightSubtitle: "CABINET PORTAL",
  rightTagline: "Dealer Portal",
  rightDescription: "Manage end-to-end flow, from pricing cabinets to orders and returns with our premium sales automation software tailored to kitchen industry. A flexible and component-based B2B solution that can integrate with your existing inventory, accounting, and other systems.",
  requestAccessTitle: "Request Access",
  requestAccessSubtitle: "Interested in partnering with NJ Cabinets?",
  requestAccessDescription: "Tell us a bit about your business and we'll follow up with onboarding details.",
  requestAccessBenefits: [
    "Generate accurate cabinet quotes in minutes",
    "Submit and track orders from one dashboard",
    "Collaborate directly with our support specialists",
  ],
  requestAccessSuccessMessage: "Thank you! We've received your request and will be in touch soon.",
  requestAccessAdminSubject: "New Access Request Submitted",
  requestAccessAdminBody: "You have a new access request from {{name}} ({{email}}).{{companyLine}}{{messageBlock}}",
  requestAccessLeadSubject: "We received your request",
  requestAccessLeadBody: "Hi {{firstName}},\n\nThank you for your interest in the NJ Cabinets platform. Our team will review your request and reach out shortly with next steps.\n\nIf you have immediate questions, simply reply to this email.\n\n- The NJ Cabinets Team",
  smtpHost: "",
  smtpPort: "",
  smtpSecure: false,
  smtpUser: "",
  smtpPass: "",
  emailFrom: "",
};

const LoginCustomizerPage = () => {
  const APP_CUSTOMIZATION = (typeof window !== 'undefined' && window.__APP_CUSTOMIZATION__) || FALLBACK_APP_CUSTOMIZATION;
  const { t } = useTranslation();

  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(() => ({
    ...DEFAULT_SETTINGS,
    requestAccessBenefits: [...DEFAULT_SETTINGS.requestAccessBenefits],
  }));
  const [testEmail, setTestEmail] = useState('');
  const [testingEmail, setTestingEmail] = useState(false);

  const normalizeSettings = (incoming = {}) => {
    const merged = {
      ...DEFAULT_SETTINGS,
      requestAccessBenefits: [...DEFAULT_SETTINGS.requestAccessBenefits],
      ...incoming,
    };

    merged.logo = incoming.logo || merged.logo || APP_CUSTOMIZATION.logoImage || '';
    merged.logoHeight = Number(incoming.logoHeight ?? merged.logoHeight) || DEFAULT_SETTINGS.logoHeight;

    const rawBenefits = incoming.requestAccessBenefits ?? merged.requestAccessBenefits;
    merged.requestAccessBenefits = Array.isArray(rawBenefits)
      ? rawBenefits.map((item) => String(item || '').trim()).filter(Boolean)
      : String(rawBenefits || '')
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean);

    const coerceField = (value) => (value === undefined || value === null ? '' : String(value));
    merged.smtpHost = coerceField(incoming.smtpHost ?? merged.smtpHost);
    const rawPort = incoming.smtpPort ?? merged.smtpPort;
    merged.smtpPort = rawPort === undefined || rawPort === null || rawPort === '' ? '' : String(rawPort);
    merged.smtpSecure = incoming.smtpSecure !== undefined
      ? Boolean(incoming.smtpSecure)
      : Boolean(merged.smtpSecure);
    merged.smtpUser = coerceField(incoming.smtpUser ?? merged.smtpUser);
    merged.smtpPass = coerceField(incoming.smtpPass ?? merged.smtpPass);
    merged.emailFrom = coerceField(incoming.emailFrom ?? merged.emailFrom);

    return merged;
  };

  const handleBenefitsChange = (value) => {
    const lines = value
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    setSettings((prev) => ({ ...prev, requestAccessBenefits: lines }));
  };

  const buildPayload = () => {
    const sanitizedBenefits = (settings.requestAccessBenefits || [])
      .map((item) => String(item || '').trim())
      .filter(Boolean);

    const trimmed = (value) => (value === undefined || value === null ? '' : String(value).trim());

    return {
      ...settings,
      requestAccessBenefits: sanitizedBenefits,
      logo: settings.logo || APP_CUSTOMIZATION.logoImage || '',
      logoHeight: Number(settings.logoHeight) || DEFAULT_SETTINGS.logoHeight,
      smtpHost: trimmed(settings.smtpHost),
      smtpPort: settings.smtpPort === '' || settings.smtpPort === null || settings.smtpPort === undefined
        ? ''
        : String(settings.smtpPort).trim(),
      smtpSecure: Boolean(settings.smtpSecure),
      smtpUser: trimmed(settings.smtpUser),
      smtpPass: settings.smtpPass === undefined || settings.smtpPass === null ? '' : String(settings.smtpPass),
      emailFrom: trimmed(settings.emailFrom),
    };
  };

  useEffect(() => {
    const fetchCustomization = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get('/api/login-customization');
        if (res.data.customization) {
          setSettings(normalizeSettings(res.data.customization));
        }
      } catch (err) {
        console.error("Error fetching customization:", err);
        Swal.fire(t('common.error'), t('settings.customization.login.alerts.loadFailed'), 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchCustomization();
  }, []);

  const handleChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = buildPayload();
      await axiosInstance.post('/api/login-customization', payload);
      setSettings(normalizeSettings(payload));
      await Swal.fire(t('common.success'), t('settings.customization.login.alerts.saveSuccess'), 'success');
    } catch (err) {
      console.error("Failed to save customization:", err);
      Swal.fire(t('common.error'), t('settings.customization.login.alerts.saveFailed'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestEmail = async () => {
    const recipient = (testEmail || '').trim();
    if (!recipient) {
      Swal.fire(t('common.error'), t('settings.customization.login.smtp.testMissingEmail'), 'error');
      return;
    }

    try {
      setTestingEmail(true);
      const payload = buildPayload();
      await axiosInstance.post('/api/login-customization/test-email', {
        email: recipient,
        settings: payload,
      });
      await Swal.fire(t('common.success'), t('settings.customization.login.smtp.testSuccess', { email: recipient }), 'success');
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || t('settings.customization.login.smtp.testFailed');
      Swal.fire(t('common.error'), message, 'error');
    } finally {
      setTestingEmail(false);
    }
  };

  const getCharCount = (text, max) => {
    const count = text?.length || 0;
    const isOverLimit = count > max;
    return (
      <small className={`text-${isOverLimit ? 'danger' : 'muted'}`}>
        {/* {count}/{max} characters */}
      </small>
    );
  };

  return (
    <CContainer fluid className="p-2 m-2 main-div-custom-login" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <PageHeader
        title={t('settings.customization.login.headerTitle')}
        subtitle={t('settings.customization.login.headerSubtitle')}
        icon={FaCog}
      >
        <CButton
          color="light"
          className="shadow-sm px-4 fw-semibold"
          onClick={() => setShowPreview(true)}
          disabled={loading}
          style={{
            borderRadius: '8px',
            border: 'none',
            transition: 'all 0.3s ease',
          }}
        >
          <CIcon icon={cilSave} className="me-2" />
          {t('settings.customization.login.buttons.preview')}
        </CButton>
        <CButton
          color="success"
          className="shadow-sm px-4 fw-semibold"
          onClick={handleSave}
          disabled={loading || saving}
          style={{
            borderRadius: '8px',
            border: 'none',
            transition: 'all 0.3s ease',
          }}
        >
          {saving ? (
            <>
              <CSpinner size="sm" className="me-2" />
              {t('settings.customization.login.buttons.saving')}
            </>
          ) : (
            <>
              <CIcon icon={cilSave} className="me-2" />
              {t('settings.customization.login.buttons.saveSettings')}
            </>
          )}
        </CButton>
      </PageHeader>

      {loading && (
        <CCard className="border-0 shadow-sm">
          <CCardBody className="text-center py-5">
            <CSpinner color="primary" size="lg" />
            <p className="text-muted mt-3 mb-0">{t('settings.customization.login.loading')}</p>
          </CCardBody>
        </CCard>
      )}

      {!loading && (
        <CCard className="border-0 shadow-sm">
          <CCardBody>
            <CForm>
              <CRow>
                <CCol lg={6}>
                  <div className="mb-4">
                    <div className="d-flex align-items-center gap-2 mb-3">
                      <div
                        className="d-flex align-items-center justify-content-center"
                        style={{
                          width: '32px',
                          height: '32px',
                          backgroundColor: '#e7f3ff',
                          borderRadius: '8px',
                        }}
                      >
                        <CIcon icon={cilText} style={{ color: '#0d6efd', fontSize: '16px' }} />
                      </div>
                      <h5 className="fw-bold mb-0 text-dark">{t('settings.customization.login.form.title')}</h5>
                    </div>

                    <div className="mb-4">
                      <CFormLabel className="fw-semibold text-dark mb-2">{t('settings.customization.login.form.loginTitle')}</CFormLabel>
                      <CFormInput
                        value={settings.title}
                        onChange={(e) => handleChange('title', e.target.value)}
                        placeholder={t('settings.customization.login.form.placeholders.title')}
                        style={{
                          borderRadius: '8px',
                          border: '1px solid #e3e6f0',
                          fontSize: '14px',
                          padding: '12px 16px',
                        }}
                      />
                      {getCharCount(settings.title, 50)}
                    </div>

                    <div className="mb-4">
                      <CFormLabel className="fw-semibold text-dark mb-2">{t('settings.customization.login.form.loginSubtitle')}</CFormLabel>
                      <CFormInput
                        value={settings.subtitle}
                        onChange={(e) => handleChange('subtitle', e.target.value)}
                        placeholder={t('settings.customization.login.form.placeholders.subtitle')}
                        style={{
                          borderRadius: '8px',
                          border: '1px solid #e3e6f0',
                          fontSize: '14px',
                          padding: '12px 16px',
                        }}
                      />
                      {getCharCount(settings.subtitle, 100)}
                    </div>

                    <div className="mb-4">
                      <CFormLabel className="fw-semibold text-dark mb-2">{t('settings.customization.login.form.backgroundColor')}</CFormLabel>
                      <CInputGroup>
                        <input
                          type="color"
                          className="form-control form-control-color"
                          value={settings.backgroundColor}
                          onChange={(e) => handleChange('backgroundColor', e.target.value)}
                          style={{
                            borderRadius: '8px 0 0 8px',
                            border: '1px solid #e3e6f0',
                            width: '60px',
                          }}
                        />
                        <CFormInput
                          value={settings.backgroundColor}
                          onChange={(e) => handleChange('backgroundColor', e.target.value)}
                          placeholder="#000000"
                          style={{
                            borderRadius: '0 8px 8px 0',
                            border: '1px solid #e3e6f0',
                            borderLeft: 'none',
                            fontSize: '14px',
                          }}
                        />
                      </CInputGroup>
                    </div>

                    <div className="mb-4">
                      <CFormLabel className="fw-semibold text-dark mb-2">{t('settings.customization.login.logoSize.label')}</CFormLabel>
                      <div className="d-flex flex-column flex-md-row align-items-md-center gap-3">
                        <CFormRange
                          min={32}
                          max={160}
                          step={1}
                          value={Number(settings.logoHeight) || 60}
                          onChange={(e) => handleChange('logoHeight', Number(e.target.value))}
                          aria-label={t('settings.customization.login.logoSize.aria')}
                        />
                        <span className="fw-semibold text-muted" style={{ minWidth: '60px' }}>{Math.round(Number(settings.logoHeight) || 60)}px</span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <CFormLabel className="fw-semibold text-dark mb-3">{t('settings.customization.login.options.title')}</CFormLabel>
                      <div className="d-flex flex-column gap-3">
                        <div
                          className="p-3 rounded"
                          style={{ backgroundColor: '#f8f9fa', border: '1px solid #e3e6f0' }}
                        >
                          <CFormCheck
                            className="mb-0"
                            label={t('settings.customization.login.options.showForgot')}
                            checked={settings.showForgotPassword}
                            onChange={(e) => handleChange('showForgotPassword', e.target.checked)}
                            id="forgotPassword"
                          />
                          <small className="text-muted">{t('settings.customization.login.options.showForgotHint')}</small>
                        </div>

                        <div
                          className="p-3 rounded"
                          style={{ backgroundColor: '#f8f9fa', border: '1px solid #e3e6f0' }}
                        >
                          <CFormCheck
                            className="mb-0"
                            label={t('settings.customization.login.options.showKeep')}
                            checked={settings.showKeepLoggedIn}
                            onChange={(e) => handleChange('showKeepLoggedIn', e.target.checked)}
                            id="keepLoggedIn"
                          />
                          <small className="text-muted">{t('settings.customization.login.options.showKeepHint')}</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </CCol>

                <CCol lg={6}>
                  <div className="mb-4">
                    <div className="d-flex align-items-center gap-2 mb-3">
                      <div
                        className="d-flex align-items-center justify-content-center"
                        style={{
                          width: '32px',
                          height: '32px',
                          backgroundColor: '#e6ffed',
                          borderRadius: '8px',
                        }}
                      >
                        <FaPalette style={{ color: '#198754', fontSize: '16px' }} />
                      </div>
                      <h5 className="fw-bold mb-0 text-dark">{t('settings.customization.login.rightPanel.title')}</h5>
                    </div>

                    <div className="mb-4">
                      <CFormLabel className="fw-semibold text-dark mb-2">{t('settings.customization.login.rightPanel.panelTitle')}</CFormLabel>
                      <CFormInput
                        value={settings.rightTitle}
                        onChange={(e) => handleChange('rightTitle', e.target.value)}
                        placeholder={t('settings.customization.login.rightPanel.placeholders.title')}
                        style={{
                          borderRadius: '8px',
                          border: '1px solid #e3e6f0',
                          fontSize: '14px',
                          padding: '12px 16px',
                        }}
                      />
                      {getCharCount(settings.rightTitle, 50)}
                    </div>

                    <div className="mb-4">
                      <CFormLabel className="fw-semibold text-dark mb-2">{t('settings.customization.login.rightPanel.panelSubtitle')}</CFormLabel>
                      <CFormInput
                        value={settings.rightSubtitle}
                        onChange={(e) => handleChange('rightSubtitle', e.target.value)}
                        placeholder={t('settings.customization.login.rightPanel.placeholders.subtitle')}
                        style={{
                          borderRadius: '8px',
                          border: '1px solid #e3e6f0',
                          fontSize: '14px',
                          padding: '12px 16px',
                        }}
                      />
                      {getCharCount(settings.rightSubtitle, 80)}
                    </div>

                    <div className="mb-4">
                      <CFormLabel className="fw-semibold text-dark mb-2">{t('settings.customization.login.rightPanel.tagline')}</CFormLabel>
                      <CFormInput
                        value={settings.rightTagline}
                        onChange={(e) => handleChange('rightTagline', e.target.value)}
                        placeholder={t('settings.customization.login.rightPanel.placeholders.tagline')}
                        style={{
                          borderRadius: '8px',
                          border: '1px solid #e3e6f0',
                          fontSize: '14px',
                          padding: '12px 16px',
                        }}
                      />
                      {getCharCount(settings.rightTagline, 30)}
                    </div>

                    <div className="mb-4">
                      <CFormLabel className="fw-semibold text-dark mb-2">{t('settings.customization.login.rightPanel.description')}</CFormLabel>
                      <CFormTextarea
                        rows={5}
                        value={settings.rightDescription}
                        onChange={(e) => handleChange('rightDescription', e.target.value)}
                        placeholder={t('settings.customization.login.rightPanel.placeholders.description')}
                        style={{
                          borderRadius: '8px',
                          border: '1px solid #e3e6f0',
                          fontSize: '14px',
                          padding: '12px 16px',
                          resize: 'vertical',
                        }}
                      />
                      {getCharCount(settings.rightDescription, 500)}
                    </div>
                  </div>
                </CCol>
              </CRow>

              <CRow className="mt-4">
                <CCol lg={12}>
                  <div className="mb-4">
                    <div className="d-flex align-items-center gap-2 mb-3">
                      <div
                        className="d-flex align-items-center justify-content-center"
                        style={{
                          width: '32px',
                          height: '32px',
                          backgroundColor: '#f0f4ff',
                          borderRadius: '8px',
                        }}
                      >
                        <CIcon icon={cilSettings} style={{ color: '#2b6cb0', fontSize: '16px' }} />
                      </div>
                      <h5 className="fw-bold mb-0 text-dark">{t('settings.customization.login.smtp.title')}</h5>
                    </div>
                    <p className="text-muted mb-4">{t('settings.customization.login.smtp.subtitle')}</p>
                    <CRow className="g-3">
                      <CCol md={6}>
                        <CFormLabel className="fw-semibold text-dark mb-2">{t('settings.customization.login.smtp.host')}</CFormLabel>
                        <CFormInput
                          value={settings.smtpHost}
                          onChange={(e) => handleChange('smtpHost', e.target.value)}
                          placeholder={t('settings.customization.login.smtp.placeholders.host')}
                        />
                      </CCol>
                      <CCol md={3}>
                        <CFormLabel className="fw-semibold text-dark mb-2">{t('settings.customization.login.smtp.port')}</CFormLabel>
                        <CFormInput
                          type="number"
                          value={settings.smtpPort}
                          onChange={(e) => handleChange('smtpPort', e.target.value)}
                          placeholder={t('settings.customization.login.smtp.placeholders.port')}
                        />
                      </CCol>
                      <CCol md={3} className="d-flex align-items-end">
                        <CFormCheck
                          className="mb-3"
                          label={t('settings.customization.login.smtp.secure')}
                          checked={Boolean(settings.smtpSecure)}
                          onChange={(e) => handleChange('smtpSecure', e.target.checked)}
                        />
                      </CCol>
                      <CCol md={6}>
                        <CFormLabel className="fw-semibold text-dark mb-2">{t('settings.customization.login.smtp.user')}</CFormLabel>
                        <CFormInput
                          value={settings.smtpUser}
                          onChange={(e) => handleChange('smtpUser', e.target.value)}
                          placeholder={t('settings.customization.login.smtp.placeholders.user')}
                          autoComplete="username"
                        />
                      </CCol>
                      <CCol md={6}>
                        <CFormLabel className="fw-semibold text-dark mb-2">{t('settings.customization.login.smtp.pass')}</CFormLabel>
                        <CFormInput
                          type="password"
                          value={settings.smtpPass}
                          onChange={(e) => handleChange('smtpPass', e.target.value)}
                          placeholder={t('settings.customization.login.smtp.placeholders.pass')}
                          autoComplete="new-password"
                        />
                      </CCol>
                      <CCol md={6}>
                        <CFormLabel className="fw-semibold text-dark mb-2">{t('settings.customization.login.smtp.from')}</CFormLabel>
                        <CFormInput
                          value={settings.emailFrom}
                          onChange={(e) => handleChange('emailFrom', e.target.value)}
                          placeholder={t('settings.customization.login.smtp.placeholders.from')}
                        />
                      </CCol>
                    </CRow>
                    <hr className="my-4" />
                    <div className="d-flex flex-column flex-md-row align-items-md-end gap-3">
                      <div className="flex-grow-1">
                        <CFormLabel className="fw-semibold text-dark mb-2">{t('settings.customization.login.smtp.testLabel')}</CFormLabel>
                        <CFormInput
                          value={testEmail}
                          onChange={(e) => setTestEmail(e.target.value)}
                          placeholder={t('settings.customization.login.smtp.testPlaceholder')}
                        />
                      </div>
                      <div>
                        <CButton
                          color="primary"
                          className="mt-3 mt-md-0"
                          disabled={testingEmail}
                          onClick={handleSendTestEmail}
                        >
                          {testingEmail ? (
                            <>
                              <CSpinner size="sm" className="me-2" />
                              {t('settings.customization.login.smtp.testing')}
                            </>
                          ) : (
                            t('settings.customization.login.smtp.testButton')
                          )}
                        </CButton>
                      </div>
                    </div>
                  </div>
                </CCol>
              </CRow>

              <CRow className="mt-4">
                <CCol lg={6}>
                  <div className="mb-4">
                    <div className="d-flex align-items-center gap-2 mb-3">
                      <div
                        className="d-flex align-items-center justify-content-center"
                        style={{
                          width: '32px',
                          height: '32px',
                          backgroundColor: '#fff7e6',
                          borderRadius: '8px',
                        }}
                      >
                        <CIcon icon={cilPaintBucket} style={{ color: '#f59f00', fontSize: '16px' }} />
                      </div>
                      <h5 className="fw-bold mb-0 text-dark">{t('settings.customization.login.requestAccess.title')}</h5>
                    </div>

                    <div className="mb-3">
                      <CFormLabel className="fw-semibold text-dark mb-2">{t('settings.customization.login.requestAccess.pageTitle')}</CFormLabel>
                      <CFormInput
                        value={settings.requestAccessTitle}
                        onChange={(e) => handleChange('requestAccessTitle', e.target.value)}
                        placeholder={t('settings.customization.login.requestAccess.placeholders.pageTitle')}
                      />
                    </div>

                    <div className="mb-3">
                      <CFormLabel className="fw-semibold text-dark mb-2">{t('settings.customization.login.requestAccess.subtitle')}</CFormLabel>
                      <CFormInput
                        value={settings.requestAccessSubtitle}
                        onChange={(e) => handleChange('requestAccessSubtitle', e.target.value)}
                        placeholder={t('settings.customization.login.requestAccess.placeholders.subtitle')}
                      />
                    </div>

                    <div className="mb-3">
                      <CFormLabel className="fw-semibold text-dark mb-2">{t('settings.customization.login.requestAccess.description')}</CFormLabel>
                      <CFormTextarea
                        rows={4}
                        value={settings.requestAccessDescription}
                        onChange={(e) => handleChange('requestAccessDescription', e.target.value)}
                        placeholder={t('settings.customization.login.requestAccess.placeholders.description')}
                      />
                    </div>

                    <div className="mb-3">
                      <CFormLabel className="fw-semibold text-dark mb-2">{t('settings.customization.login.requestAccess.benefits')}</CFormLabel>
                      <CFormTextarea
                        rows={5}
                        value={(settings.requestAccessBenefits || []).join('\n')}
                        onChange={(e) => handleBenefitsChange(e.target.value)}
                        placeholder={t('settings.customization.login.requestAccess.placeholders.benefits')}
                      />
                      <small className="text-muted">{t('settings.customization.login.requestAccess.benefitsHint')}</small>
                    </div>
                  </div>
                </CCol>

                <CCol lg={6}>
                  <div className="mb-4">
                    <div className="d-flex align-items-center gap-2 mb-3">
                      <div
                        className="d-flex align-items-center justify-content-center"
                        style={{
                          width: '32px',
                          height: '32px',
                          backgroundColor: '#e7f0ff',
                          borderRadius: '8px',
                        }}
                      >
                        <CIcon icon={cilSettings} style={{ color: '#1d4ed8', fontSize: '16px' }} />
                      </div>
                      <h5 className="fw-bold mb-0 text-dark">{t('settings.customization.login.requestAccess.requestEmails')}</h5>
                    </div>

                    <div className="mb-3">
                      <CFormLabel className="fw-semibold text-dark mb-2">{t('settings.customization.login.requestAccess.successMessage')}</CFormLabel>
                      <CFormInput
                        value={settings.requestAccessSuccessMessage}
                        onChange={(e) => handleChange('requestAccessSuccessMessage', e.target.value)}
                        placeholder={t('settings.customization.login.requestAccess.placeholders.successMessage')}
                      />
                    </div>

                    <div className="mb-3">
                      <CFormLabel className="fw-semibold text-dark mb-2">{t('settings.customization.login.requestAccess.leadEmailSubject')}</CFormLabel>
                      <CFormInput
                        value={settings.requestAccessLeadSubject}
                        onChange={(e) => handleChange('requestAccessLeadSubject', e.target.value)}
                        placeholder={t('settings.customization.login.requestAccess.placeholders.leadEmailSubject')}
                      />
                    </div>

                    <div className="mb-3">
                      <CFormLabel className="fw-semibold text-dark mb-2">{t('settings.customization.login.requestAccess.leadEmailBody')}</CFormLabel>
                      <CFormTextarea
                        rows={6}
                        value={settings.requestAccessLeadBody}
                        onChange={(e) => handleChange('requestAccessLeadBody', e.target.value)}
                        placeholder={t('settings.customization.login.requestAccess.placeholders.leadEmailBody')}
                      />
                      <small className="text-muted">
                        {t('settings.customization.login.requestAccess.placeholdersAvailable')} {'{{firstName}}'}, {'{{name}}'}, {'{{email}}'}
                      </small>
                    </div>

                    <div className="mb-3">
                      <CFormLabel className="fw-semibold text-dark mb-2">{t('settings.customization.login.requestAccess.adminEmailSubject')}</CFormLabel>
                      <CFormInput
                        value={settings.requestAccessAdminSubject}
                        onChange={(e) => handleChange('requestAccessAdminSubject', e.target.value)}
                        placeholder={t('settings.customization.login.requestAccess.placeholders.adminEmailSubject')}
                      />
                    </div>

                    <div className="mb-3">
                      <CFormLabel className="fw-semibold text-dark mb-2">{t('settings.customization.login.requestAccess.adminEmailBody')}</CFormLabel>
                      <CFormTextarea
                        rows={6}
                        value={settings.requestAccessAdminBody}
                        onChange={(e) => handleChange('requestAccessAdminBody', e.target.value)}
                        placeholder={t('settings.customization.login.requestAccess.placeholders.adminEmailBody')}
                      />
                      <small className="text-muted">
                        {t('settings.customization.login.requestAccess.placeholdersAvailable')} {'{{name}}'}, {'{{email}}'}, {'{{companyLine}}'}, {'{{messageBlock}}'}
                      </small>
                    </div>
                  </div>
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>
      )}

      <CModal
        visible={showPreview}
        onClose={() => setShowPreview(false)}
        fullscreen
        className="login-preview-modal"
      >
        <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
          <h5 className="mb-0 fw-bold">{t('settings.customization.login.previewTitle')}</h5>
          <CButton
            color="light"
            size="sm"
            onClick={() => setShowPreview(false)}
            style={{ borderRadius: '6px' }}
          >
            {t('settings.customization.login.closePreview')}
          </CButton>
        </div>
        <CModalBody className="p-0">
          <LoginPreview config={settings} />
        </CModalBody>
      </CModal>

      <style>{`
        .login-preview-modal .modal-content {
          border: none;
          border-radius: 0;
        }

        .form-control-color {
          height: 45px;
        }

        .form-check-input:checked {
          background-color: #0d6efd;
          border-color: #0d6efd;
        }

        .form-check-input:focus {
          border-color: #86b7fe;
          outline: 0;
          box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
        }
      `}</style>
    </CContainer>
  );
};

export default LoginCustomizerPage;
