import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setUser, setError } from '../../store/slices/authSlice';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'react-i18next';
import { getOptimalColors } from '../../utils/colorUtils';
import { installTokenEverywhere } from '../../utils/authToken';

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const api_url = import.meta.env.VITE_API_URL;
  const { t } = useTranslation();

  const [customization, setCustomization] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [noticeMessage, setNoticeMessage] = useState('');

  useEffect(() => {
    const fetchCustomization = async () => {
      try {
        const res = await axios.get(`${api_url}/api/login-customization`);
        if (res.data.customization) {
          setCustomization(res.data.customization);
        }
      } catch (err) {
        console.error('Failed to load customization settings:', err);
      }
    };

    // Force light mode on login page
    localStorage.setItem('coreui-free-react-admin-template-theme', 'light');

    fetchCustomization();
  }, []);

  // Detect redirect reasons (e.g., session expired) and show a banner
  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search || '');
      const reason = params.get('reason') || sessionStorage.getItem('logout_reason') || '';
      if (reason) {
        // Clear the stored reason so it doesn't persist
        try { sessionStorage.removeItem('logout_reason'); } catch {}
      }
      if (reason === 'expired' || reason === 'auth-error') {
        setNoticeMessage(t('auth.sessionExpired') || 'Your session expired. Please sign in again.');
      } else if (reason) {
        setNoticeMessage(t('auth.loginRequired') || 'Please sign in to continue.');
      }
    } catch (_) {
      // no-op
    }
  }, [location.search, t]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${api_url}/api/login`, {
        email,
        password,
      });

      const { token, userId, name, role, role_id, group_id, group } = response.data;
      const user = { email, userId, name, role: String(role || '').toLowerCase(), role_id, group_id, group };

      // Install token everywhere (hard reset) and persist user
      installTokenEverywhere(token);
      try { localStorage.setItem('user', JSON.stringify(user)); } catch {}

      // Wait a brief moment to ensure token is fully installed before proceeding
      await new Promise(resolve => setTimeout(resolve, 50));

      // Notify other tabs
      try { window.localStorage.setItem('__auth_changed__', String(Date.now())); } catch {}

      dispatch(setUser({ user, token }));

      // Force light mode as default theme on login
      localStorage.setItem('coreui-free-react-admin-template-theme', 'light');

      const returnTo = (() => { try { return sessionStorage.getItem('return_to') || '/' } catch { return '/' } })();
      try { sessionStorage.removeItem('return_to'); } catch {}
      navigate(returnTo);
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || t('auth.loginFailed');
      dispatch(setError(errorMsg));
      setErrorMessage(errorMsg);
    }
  };

  const settings = customization || {
    logo: "",
  title: t('auth.signIn'),
  subtitle: t('auth.enterCredentials'),
    backgroundColor: "#0e1446",
    showForgotPassword: true,
    showKeepLoggedIn: true,
  rightTitle: t('common.appName'),
  rightSubtitle: t('auth.rightSubtitle'),
  rightTagline: t('common.dealerPortal'),
  rightDescription: t('auth.rightDescription'),
  };

  // Compute optimal text colors for the right panel based on background
  const rightPanelColors = getOptimalColors(settings.backgroundColor || '#0e1446');

  return (
    <div className="login-page-wrapper">
      {/* Left Panel - Illustration and Branding */}
      <div
        className="login-left-panel"
        style={{ backgroundColor: settings.backgroundColor }}
      >
        <div className="login-left-content">
          <h1 className="mb-3" style={{ color: rightPanelColors.text }}>{settings.rightTitle}</h1>
          <p className="lead mb-4" style={{ color: rightPanelColors.subtitle }}>{settings.rightSubtitle}</p>
          <p style={{ color: rightPanelColors.subtitle }}>{settings.rightDescription}</p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="login-right-panel">
        <div className="login-form-container">
          {settings.logo && (
            <div className="text-center mb-4">
              <img src={settings.logo} alt="Logo" style={{ height: 50 }} />
            </div>
          )}
          <h2 className="mb-2 fw-bold">{settings.title}</h2>
          <p className="text-muted mb-4">{settings.subtitle}</p>

          {noticeMessage && (
            <div className="alert alert-info" role="status" aria-live="polite">
              {noticeMessage}
            </div>
          )}

          {errorMessage && (
            <div className="alert alert-danger" role="alert" aria-live="assertive">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="email" className="form-label fw-medium">
                {t('auth.email')} <span className="text-danger">*</span>
              </label>
              <input
                type="email"
                className="form-control form-control-lg"
                placeholder={t('auth.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                id="email"
                aria-required="true"
                required
              />
            </div>

            <div className="mb-4">
              <label htmlFor="password" className="form-label fw-medium">
                {t('auth.password')} <span className="text-danger">*</span>
              </label>
              <div className="input-group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control form-control-lg"
                  placeholder={t('auth.passwordPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  id="password"
                  aria-required="true"
                  required
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                  tabIndex={-1}
                  style={{ minHeight: 44, minWidth: 44 }}
                >
                  <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                </button>
              </div>
            </div>

            <div className="d-flex justify-content-between align-items-center mb-4">
              {settings.showKeepLoggedIn && (
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="keepLoggedIn"
                    checked={keepLoggedIn}
                    onChange={(e) => setKeepLoggedIn(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="keepLoggedIn">
                    {t('auth.keepLoggedIn')}
                  </label>
                </div>
              )}
              {settings.showForgotPassword && (
                <a href="/reset-password" className="small text-decoration-none">
                  {t('auth.forgotPassword')}
                </a>
              )}
            </div>

            <div className="d-grid">
              <button type="submit" className="btn btn-primary btn-lg" style={{ minHeight: 44 }}>
                {t('auth.signIn')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
