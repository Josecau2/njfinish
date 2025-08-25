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
  CBadge,
  CSpinner,
  CInputGroup,
  CInputGroupText,
} from "@coreui/react";
import CIcon from '@coreui/icons-react';
import { cilSettings, cilPaintBucket, cilText, cilColorPalette, cilSave, cilImage } from '@coreui/icons';
import axios from "axios";
import axiosInstance from "../../../helpers/axiosInstance";
import LoginPreview from "../../../components/LoginPreview";
import { FaCog, FaPalette, FaEye } from "react-icons/fa";
import Swal from 'sweetalert2';
import { useTranslation } from 'react-i18next';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

const LoginCustomizerPage = () => {
  const api_url = import.meta.env.VITE_API_URL;
  const { t } = useTranslation();

  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    logo: "",
    title: "Sign In",
    subtitle: "Enter your email and password to sign in!",
    backgroundColor: "#0e1446",
    showForgotPassword: true,
    showKeepLoggedIn: true,
    rightTitle: "NJ Cabinets",
    rightSubtitle: "Configure - Price - Quote",
    rightTagline: "Dealer Portal",
    rightDescription:
      "Manage end-to-end flow, from pricing cabinets to orders and returns with our premium sales automation software tailored to kitchen industry. A flexible and component-based B2B solution that can integrate with your existing inventory, accounting, and other systems.",
  });

  useEffect(() => {
    const fetchCustomization = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get('/api/login-customization', {
          headers: getAuthHeaders()
        });
        if (res.data.customization) {
          setSettings(res.data.customization);
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

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings((prev) => ({ ...prev, logo: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
  await axiosInstance.post('/api/login-customization', settings, {
        headers: getAuthHeaders()
      });
  await Swal.fire(t('common.success'), t('settings.customization.login.alerts.saveSuccess'), 'success');
    } catch (err) {
      console.error("Failed to save customization:", err);
  Swal.fire(t('common.error'), t('settings.customization.login.alerts.saveFailed'), 'error');
    } finally {
      setSaving(false);
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
  {/* Header Section */}
      <CCard className="border-0 shadow-sm mb-2" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <CCardBody className="py-4">
          <CRow className="align-items-center">
            <CCol>
              <div className="d-flex align-items-center gap-3">
                <div 
                  className="d-flex align-items-center justify-content-center setting-icon-div"
                  
                >
                  <FaCog className="text-white" style={{ fontSize: '24px' }} />
                </div>
                <div>
          <h3 className="text-white mb-1 fw-bold">{t('settings.customization.login.headerTitle')}</h3>
          <p className="text-white-50 mb-0">{t('settings.customization.login.headerSubtitle')}</p>
                </div>
              </div>
            </CCol>
            <CCol xs="auto">
              <div className="d-flex gap-2 preview-save-button">
                <CButton 
                  color="light" 
                  className="shadow-sm px-4 fw-semibold"
                  onClick={() => setShowPreview(true)}
                  disabled={loading}
                  style={{ 
                    borderRadius: '8px',
                    border: 'none',
                    transition: 'all 0.3s ease'
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
                    transition: 'all 0.3s ease'
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
              </div>
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      {/* Loading State */}
      {loading && (
        <CCard className="border-0 shadow-sm">
          <CCardBody className="text-center py-5">
            <CSpinner color="primary" size="lg" />
            <p className="text-muted mt-3 mb-0">{t('settings.customization.login.loading')}</p>
          </CCardBody>
        </CCard>
      )}

      {/* Main Form */}
      {!loading && (
        <CCard className="border-0 shadow-sm">
          <CCardBody>
            <CForm>
              <CRow>
                {/* Left Column - Login Form Settings */}
                <CCol lg={6}>
                  <div className="mb-4">
                    <div className="d-flex align-items-center gap-2 mb-3">
                      <div 
                        className="d-flex align-items-center justify-content-center"
                        style={{
                          width: '32px',
                          height: '32px',
                          backgroundColor: '#e7f3ff',
                          borderRadius: '8px'
                        }}
                      >
                        <CIcon icon={cilText} style={{ color: '#0d6efd', fontSize: '16px' }} />
                      </div>
                      <h5 className="fw-bold mb-0 text-dark">{t('settings.customization.login.form.title')}</h5>
                    </div>

                    {/* Logo Upload */}
                    {/* <div className="mb-4">
                      <CFormLabel className="fw-semibold text-dark mb-2">
                        <CIcon icon={cilImage} className="me-2" />
                        Upload Logo
                      </CFormLabel>
                      <input 
                        type="file" 
                        className="form-control"
                        onChange={handleFileUpload}
                        accept="image/*"
                        style={{ 
                          borderRadius: '8px',
                          border: '1px solid #e3e6f0',
                          fontSize: '14px'
                        }}
                      />
                      <small className="text-muted">Recommended size: 200x60 pixels</small>
                    </div> */}

                    {/* Title */}
                    <div className="mb-4">
                      <CFormLabel className="fw-semibold text-dark mb-2">{t('settings.customization.login.form.loginTitle')}</CFormLabel>
                      <CFormInput
                        value={settings.title}
                        onChange={(e) => handleChange("title", e.target.value)}
                        placeholder={t('settings.customization.login.form.placeholders.title')}
                        style={{ 
                          borderRadius: '8px',
                          border: '1px solid #e3e6f0',
                          fontSize: '14px',
                          padding: '12px 16px'
                        }}
                      />
                      {getCharCount(settings.title, 50)}
                    </div>

                    {/* Subtitle */}
                    <div className="mb-4">
                      <CFormLabel className="fw-semibold text-dark mb-2">{t('settings.customization.login.form.loginSubtitle')}</CFormLabel>
                      <CFormInput
                        value={settings.subtitle}
                        onChange={(e) => handleChange("subtitle", e.target.value)}
                        placeholder={t('settings.customization.login.form.placeholders.subtitle')}
                        style={{ 
                          borderRadius: '8px',
                          border: '1px solid #e3e6f0',
                          fontSize: '14px',
                          padding: '12px 16px'
                        }}
                      />
                      {getCharCount(settings.subtitle, 100)}
                    </div>

                    {/* Background Color */}
                    <div className="mb-4">
                      <CFormLabel className="fw-semibold text-dark mb-2">
                        <CIcon icon={cilColorPalette} className="me-2" />
                        {t('settings.customization.login.form.backgroundColor')}
                      </CFormLabel>
                      <CInputGroup>
                        <input
                          type="color"
                          className="form-control form-control-color"
                          value={settings.backgroundColor}
                          onChange={(e) => handleChange("backgroundColor", e.target.value)}
                          style={{ 
                            borderRadius: '8px 0 0 8px',
                            border: '1px solid #e3e6f0',
                            width: '60px'
                          }}
                        />
                        <CFormInput
                          value={settings.backgroundColor}
                          onChange={(e) => handleChange("backgroundColor", e.target.value)}
                          placeholder="#000000"
                          style={{ 
                            borderRadius: '0 8px 8px 0',
                            border: '1px solid #e3e6f0',
                            borderLeft: 'none',
                            fontSize: '14px'
                          }}
                        />
                      </CInputGroup>
                    </div>

                    {/* Options */}
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
                            onChange={(e) => handleChange("showForgotPassword", e.target.checked)}
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
                            onChange={(e) => handleChange("showKeepLoggedIn", e.target.checked)}
                            id="keepLoggedIn"
                          />
                          <small className="text-muted">{t('settings.customization.login.options.showKeepHint')}</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </CCol>

                {/* Right Column - Right Panel Settings */}
                <CCol lg={6}>
                  <div className="mb-4">
                    <div className="d-flex align-items-center gap-2 mb-3">
                      <div 
                        className="d-flex align-items-center justify-content-center"
                        style={{
                          width: '32px',
                          height: '32px',
                          backgroundColor: '#e6ffed',
                          borderRadius: '8px'
                        }}
                      >
                        <FaPalette style={{ color: '#198754', fontSize: '16px' }} />
                      </div>
                      <h5 className="fw-bold mb-0 text-dark">{t('settings.customization.login.rightPanel.title')}</h5>
                    </div>

                    {/* Panel Title */}
                    <div className="mb-4">
                      <CFormLabel className="fw-semibold text-dark mb-2">{t('settings.customization.login.rightPanel.panelTitle')}</CFormLabel>
                      <CFormInput
                        value={settings.rightTitle}
                        onChange={(e) => handleChange("rightTitle", e.target.value)}
                        placeholder={t('settings.customization.login.rightPanel.placeholders.title')}
                        style={{ 
                          borderRadius: '8px',
                          border: '1px solid #e3e6f0',
                          fontSize: '14px',
                          padding: '12px 16px'
                        }}
                      />
                      {getCharCount(settings.rightTitle, 50)}
                    </div>

                    {/* Panel Subtitle */}
                    <div className="mb-4">
                      <CFormLabel className="fw-semibold text-dark mb-2">{t('settings.customization.login.rightPanel.panelSubtitle')}</CFormLabel>
                      <CFormInput
                        value={settings.rightSubtitle}
                        onChange={(e) => handleChange("rightSubtitle", e.target.value)}
                        placeholder={t('settings.customization.login.rightPanel.placeholders.subtitle')}
                        style={{ 
                          borderRadius: '8px',
                          border: '1px solid #e3e6f0',
                          fontSize: '14px',
                          padding: '12px 16px'
                        }}
                      />
                      {getCharCount(settings.rightSubtitle, 80)}
                    </div>

                    {/* Tagline */}
                    <div className="mb-4">
                      <CFormLabel className="fw-semibold text-dark mb-2">{t('settings.customization.login.rightPanel.tagline')}</CFormLabel>
                      <CFormInput
                        value={settings.rightTagline}
                        onChange={(e) => handleChange("rightTagline", e.target.value)}
                        placeholder={t('settings.customization.login.rightPanel.placeholders.tagline')}
                        style={{ 
                          borderRadius: '8px',
                          border: '1px solid #e3e6f0',
                          fontSize: '14px',
                          padding: '12px 16px'
                        }}
                      />
                      {getCharCount(settings.rightTagline, 30)}
                    </div>

                    {/* Description */}
                    <div className="mb-4">
                      <CFormLabel className="fw-semibold text-dark mb-2">{t('settings.customization.login.rightPanel.description')}</CFormLabel>
                      <CFormTextarea
                        rows={5}
                        value={settings.rightDescription}
                        onChange={(e) => handleChange("rightDescription", e.target.value)}
                        placeholder={t('settings.customization.login.rightPanel.placeholders.description')}
                        style={{ 
                          borderRadius: '8px',
                          border: '1px solid #e3e6f0',
                          fontSize: '14px',
                          padding: '12px 16px',
                          resize: 'vertical'
                        }}
                      />
                      {getCharCount(settings.rightDescription, 500)}
                    </div>

                    {/* Preview Badge */}
                    <div className="mt-4">
                      <CBadge 
                        color="info" 
                        className="px-3 py-2"
                        style={{ 
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}
                      >
                        <FaEye className="me-1" />
                        {t('settings.customization.login.previewBadge')}
                      </CBadge>
                    </div>
                  </div>
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>
      )}

      {/* Preview Modal */}
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

      {/* Custom Styles */}
      <style jsx>{`
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