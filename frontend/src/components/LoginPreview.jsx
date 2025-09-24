import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from 'react-redux';
import { getContrastColor, getOptimalColors } from '../utils/colorUtils';
import { resolveAssetUrl } from '../utils/assetUtils';
import { CUSTOMIZATION_CONFIG as FALLBACK_APP_CUSTOMIZATION } from '../config/customization';
import { Eye, EyeOff } from '@/icons-lucide';

const LoginPreview = ({ config }) => {
  const [activeView, setActiveView] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const appCustomization = useSelector((state) => state.customization);
  const apiUrl = import.meta.env.VITE_API_URL;
  const resolvedAppCustomization = appCustomization && Object.keys(appCustomization).length
    ? appCustomization
    : FALLBACK_APP_CUSTOMIZATION;

  useEffect(() => {
    if (activeView === 'forgot' && !config.showForgotPassword) {
      setActiveView('login');
    }
  }, [activeView, config.showForgotPassword]);

  const headerBg = config.headerBg || '#667eea';
  const buttonTextColor = getContrastColor(headerBg);
  const marketingColors = useMemo(
    () => getOptimalColors(config.backgroundColor || '#0e1446'),
    [config.backgroundColor]
  );
  const rawLogo = config.logo || resolvedAppCustomization.logoImage || '';
  const brandLogo = useMemo(() => resolveAssetUrl(rawLogo, apiUrl), [rawLogo, apiUrl]);
  const logoHeight = Number(config.logoHeight) || Number(resolvedAppCustomization.logoHeight) || 60;

  const previewOptions = useMemo(() => [
    { key: 'login', label: 'Login' },
    { key: 'forgot', label: 'Forgot Password', disabled: !config.showForgotPassword },
    { key: 'request', label: 'Request Access' },
  ], [config.showForgotPassword]);

  const benefits = useMemo(() => {
    if (Array.isArray(config.requestAccessBenefits)) {
      return config.requestAccessBenefits.map((item) => String(item || '').trim()).filter(Boolean);
    }
    if (typeof config.requestAccessBenefits === 'string') {
      return config.requestAccessBenefits
        .split(/\r?\n/)
        .map((item) => item.trim())
        .filter(Boolean);
    }
    return [];
  }, [config.requestAccessBenefits]);

  const PreviewWrapper = ({ children }) => (
    <div className="d-flex flex-column flex-lg-row min-vh-75 border rounded shadow overflow-hidden bg-body-secondary">
      {children}
    </div>
  );

  const MarketingPanel = () => (
    <div
      className="d-flex align-items-center justify-content-center w-100 w-lg-50 px-4 py-5"
      style={{ backgroundColor: config.backgroundColor }}
    >
      <div className="text-center px-3 px-lg-5">
        <h2 style={{ color: marketingColors.text }} className="fw-bold mb-2">{config.rightTitle}</h2>
        <p className="mb-1" style={{ color: marketingColors.subtitle }}>{config.rightSubtitle}</p>
        {config.rightTagline && (
          <p className="mb-2" style={{ color: marketingColors.subtitle }}>{config.rightTagline}</p>
        )}
        <p className="mb-0" style={{ color: marketingColors.subtitle }}>{config.rightDescription}</p>
      </div>
    </div>
  );

  const renderLoginForm = () => (
    <div className="w-100" style={{ maxWidth: '400px' }}>
      {brandLogo && (
        <img
          src={brandLogo}
          alt="Logo preview"
          className="mb-4"
          style={{ height: logoHeight, objectFit: 'contain' }}
        />
      )}
      <h2 className="mb-1 fw-bold">{config.title}</h2>
      <p className="text-muted mb-4">{config.subtitle}</p>

      <form onSubmit={(e) => e.preventDefault()}>
        <div className="mb-3">
          <label className="form-label fw-medium">Email</label>
          <input type="email" className="form-control" disabled />
        </div>
        <div className="mb-3">
          <label className="form-label fw-medium">Password</label>
          <div className="input-group">
            <input
              type={showPassword ? 'text' : 'password'}
              className="form-control"
              disabled
            />
            <button
              type="button"
              className="btn btn-outline-secondary icon-btn"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              style={{ minHeight: 44, minWidth: 44 }}
            >
              {showPassword ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
            </button>
          </div>
        </div>

        <div className="d-flex justify-content-between align-items-center mb-3">
          {config.showKeepLoggedIn && (
            <div className="form-check">
              <input className="form-check-input" type="checkbox" disabled />
              <label className="form-check-label">Keep me logged in</label>
            </div>
          )}
          {config.showForgotPassword && (
            <span className="small text-primary text-decoration-none">Forgot password?</span>
          )}
        </div>

        <button
          type="button"
          className="btn w-100"
          aria-label="Sign in (preview)"
          disabled
          style={{ background: headerBg, color: buttonTextColor, border: 'none', minHeight: 44 }}
        >
          Sign in
        </button>
      </form>
    </div>
  );

  const renderForgotPasswordForm = () => (
    <div className="w-100" style={{ maxWidth: '400px' }}>
      {brandLogo && (
        <img
          src={brandLogo}
          alt="Logo preview"
          className="mb-4"
          style={{ height: logoHeight, objectFit: 'contain' }}
        />
      )}
      <h2 className="fw-bold mb-2">Forgot your password?</h2>
      <p className="text-muted mb-4 small">Enter the email associated with your account and we'll send a reset link.</p>
      <form onSubmit={(e) => e.preventDefault()}>
        <div className="mb-3">
          <label className="form-label fw-medium">Email</label>
          <input type="email" className="form-control" disabled placeholder="you@example.com" />
        </div>
        <button
          type="button"
          className="btn w-100"
          disabled
          style={{ background: headerBg, color: buttonTextColor, border: 'none', minHeight: 44 }}
        >
          Send reset link
        </button>
        <p className="text-center text-muted small mt-3 mb-0">
          Remembered your password? <span className="text-primary fw-semibold">Sign in</span>
        </p>
      </form>
    </div>
  );

  const renderRequestAccessForm = () => (
    <div className="w-100" style={{ maxWidth: '520px' }}>
      {brandLogo && (
        <img
          src={brandLogo}
          alt="Logo preview"
          className="mb-4"
          style={{ height: logoHeight, objectFit: 'contain' }}
        />
      )}
      <h2 className="fw-bold mb-2">{config.requestAccessTitle || 'Request Access'}</h2>
      {config.requestAccessSubtitle && (
        <p className="text-muted small mb-2">{config.requestAccessSubtitle}</p>
      )}
      {config.requestAccessDescription && (
        <p className="text-muted small mb-3">{config.requestAccessDescription}</p>
      )}
      {benefits.length > 0 && (
        <div className="mb-3">
          <p className="fw-medium text-muted small mb-1">Benefits</p>
          <ul className="list-unstyled text-muted small mb-0" style={{ fontSize: '0.85rem', lineHeight: '1.3' }}>
            {benefits.map((item, idx) => (
              <li key={idx}>&bull; {item}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={(e) => e.preventDefault()}>
        <div className="row g-2 mb-3">
          <div className="col-md-6">
            <label className="form-label fw-medium">First name</label>
            <input className="form-control" disabled placeholder="Jane" />
          </div>
          <div className="col-md-6">
            <label className="form-label fw-medium">Last name</label>
            <input className="form-control" disabled placeholder="Doe" />
          </div>
        </div>
        <div className="row g-2 mb-3">
          <div className="col-md-7">
            <label className="form-label fw-medium">Email</label>
            <input className="form-control" disabled placeholder="dealer@example.com" />
          </div>
          <div className="col-md-5">
            <label className="form-label fw-medium">Phone</label>
            <input className="form-control" disabled placeholder="(555) 123-4567" />
          </div>
        </div>
        <div className="row g-2 mb-3">
          <div className="col-md-5">
            <label className="form-label fw-medium">City</label>
            <input className="form-control" disabled placeholder="City" />
          </div>
          <div className="col-md-3">
            <label className="form-label fw-medium">State</label>
            <input className="form-control" disabled placeholder="NJ" />
          </div>
          <div className="col-md-4">
            <label className="form-label fw-medium">ZIP</label>
            <input className="form-control" disabled placeholder="07030" />
          </div>
        </div>
        <div className="mb-3">
          <label className="form-label fw-medium">Company</label>
          <input className="form-control" disabled placeholder="Your business name" />
        </div>
        <div className="mb-4">
          <label className="form-label fw-medium">Tell us about your projects</label>
          <textarea className="form-control" rows={3} disabled placeholder="Share a brief overview" />
        </div>
        <button
          type="button"
          className="btn w-100"
          disabled
          style={{ background: headerBg, color: buttonTextColor, border: 'none', minHeight: 44 }}
        >
          Submit request
        </button>
      </form>
    </div>
  );

  const renderActiveView = () => {
    switch (activeView) {
      case 'forgot':
        return renderForgotPasswordForm();
      case 'request':
        return renderRequestAccessForm();
      case 'login':
      default:
        return renderLoginForm();
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-center flex-wrap gap-2 mb-4">
        {previewOptions.map((option) => (
          <button
            key={option.key}
            type="button"
            className={`btn btn-sm ${activeView === option.key ? 'btn-primary text-white' : 'btn-outline-secondary'}`}
            onClick={() => !option.disabled && setActiveView(option.key)}
            disabled={option.disabled}
          >
            {option.label}
          </button>
        ))}
      </div>
      <PreviewWrapper>
        <div className="d-flex align-items-center justify-content-center w-100 w-lg-50 px-4 py-5 bg-body">
          {renderActiveView()}
        </div>
        <MarketingPanel />
      </PreviewWrapper>
    </div>
  );
};

export default LoginPreview;

