import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getOptimalColors } from '../../utils/colorUtils'
import { LOGIN_CUSTOMIZATION as FALLBACK_LOGIN_CUSTOMIZATION } from '../../config/loginCustomization'

const LOGIN_CUSTOMIZATION =
  (typeof window !== 'undefined' && window.__LOGIN_CUSTOMIZATION__) || FALLBACK_LOGIN_CUSTOMIZATION

const ForgotPasswordPage = () => {
  const { t } = useTranslation()
  const api_url = import.meta.env.VITE_API_URL
  const [customization] = useState(LOGIN_CUSTOMIZATION)
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const copy = {
    title: t('auth.forgotPassword.title'),
    subtitle: t('auth.forgotPassword.subtitle'),
    success: t('auth.forgotPassword.success'),
    error: t('auth.forgotPassword.error'),
    submit: t('auth.forgotPassword.submit'),
    submitting: t('auth.forgotPassword.submitting'),
    remember: t('auth.forgotPassword.remember'),
    signIn: t('auth.signIn'),
    emailLabel: t('auth.forgotPassword.emailLabel'),
    emailPlaceholder: t('auth.forgotPassword.emailPlaceholder'),
    logoAlt: t('auth.logoAlt'),
  }
  const requiredAsterisk = <span className="text-danger">*</span>

  useEffect(() => {
    try {
      localStorage.setItem('coreui-free-react-admin-template-theme', 'light')
    } catch (_) {
      // ignore storage failures
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()

    setMessage('')
    setError('')
    setIsSubmitting(true)

    try {
      const res = await fetch(`${api_url}/api/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()
      const feedback = data.message || copy.success

      if (res.ok) {
        setMessage(feedback)
      } else {
        setError(feedback)
      }
    } catch (err) {
      console.error('Forgot password request failed:', err)
      setError(copy.error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const settings = customization
  const rightPanelColors = getOptimalColors(settings.backgroundColor || '#0e1446')

  return (
    <div className="login-page-wrapper">
      {/* Left Panel - Illustration and Branding (matches Login/Request Access) */}
      <div className="login-left-panel" style={{ backgroundColor: settings.backgroundColor }}>
        <div className="login-left-content">
          <h1 className="mb-3" style={{ color: rightPanelColors.text }}>
            {settings.rightTitle}
          </h1>
          <p className="lead mb-4" style={{ color: rightPanelColors.subtitle }}>
            {settings.rightSubtitle}
          </p>
          <p style={{ color: rightPanelColors.subtitle }}>{settings.rightDescription}</p>
        </div>
      </div>

      {/* Right Panel - Forgot Password Form */}
      <div className="login-right-panel">
        <div className="login-form-container">
          {settings.logo && (
            <div className="text-center mb-4">
              <img src={settings.logo} alt={copy.logoAlt} style={{ height: 50 }} />
            </div>
          )}
          <h2 className="fw-bold mb-2">{copy.title}</h2>
          <p className="mb-4 text-muted">{copy.subtitle}</p>

          {message && (
            <div className="alert alert-success" role="status" aria-live="polite">
              {message}
            </div>
          )}
          {error && (
            <div className="alert alert-danger" role="alert" aria-live="assertive">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-3">
              <label htmlFor="email" className="form-label fw-medium">
                {copy.emailLabel} {requiredAsterisk}
              </label>
              <input
                type="email"
                className="form-control form-control-lg"
                placeholder={copy.emailPlaceholder}
                value={email}
                required
                onChange={(e) => setEmail(e.target.value)}
                id="email"
                aria-required="true"
                autoComplete="email"
              />
            </div>

            <div className="d-grid">
              <button
                type="submit"
                className="btn btn-primary btn-lg"
                style={{ minHeight: 44 }}
                disabled={isSubmitting}
                aria-busy={isSubmitting}
              >
                {isSubmitting ? copy.submitting : copy.submit}
              </button>
            </div>
          </form>

          <div className="text-center mt-4">
            <span className="text-muted">{copy.remember}</span>
            <Link to="/login" className="fw-semibold text-decoration-none">
              {copy.signIn}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordPage
