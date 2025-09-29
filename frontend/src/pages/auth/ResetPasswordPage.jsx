import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import BrandLogo from '../../components/BrandLogo'
import { getBrand, getLoginBrand, getBrandColors } from '../../brand/useBrand'
import { getOptimalColors } from '../../utils/colorUtils'

const ResetPasswordPage = () => {
  const { t } = useTranslation()
  const api_url = import.meta.env.VITE_API_URL
  const { token } = useParams()
  const navigate = useNavigate()
  const brand = getBrand()
  const loginBrand = getLoginBrand()
  const brandColors = getBrandColors()
  const logoHeight = Number(loginBrand.logoHeight) || 60
  const loginBackground = loginBrand.backgroundColor || brandColors.surface || '#0e1446'
  const rightPanelColors = getOptimalColors(loginBackground)

  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleReset = async (e) => {
    e.preventDefault()
    setMessage('')
    setError('')
    setIsSubmitting(true)

    try {
      const res = await fetch(`${api_url}/api/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      })

      const data = await res.json()

      if (res.ok) {
        setMessage(data.message || t('auth.resetPassword.success'))
        setTimeout(() => navigate('/login'), 3000)
      } else {
        setError(data.message || t('auth.resetPassword.error'))
      }
    } catch (err) {
      setError(t('auth.resetPassword.requestError'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="login-page-wrapper">
      <div className="login-left-panel" style={{ backgroundColor: loginBackground }}>
        <div className="login-left-content">
          <h1 className="mb-3" style={{ color: rightPanelColors.text }}>
            {loginBrand.rightTitle || brand.logoAlt || t('auth.resetPassword.title')}
          </h1>
          <p className="lead mb-4" style={{ color: rightPanelColors.subtitle }}>
            {loginBrand.rightSubtitle || t('auth.resetPassword.subtitle')}
          </p>
          <p style={{ color: rightPanelColors.subtitle }}>{loginBrand.rightDescription || ''}</p>
        </div>
      </div>

      <div className="login-right-panel">
        <div className="login-form-container">
          <div className="text-center mb-4">
            <BrandLogo size={logoHeight} />
          </div>
          <h2 className="mb-2 fw-bold">
            {loginBrand.resetTitle || t('auth.resetPassword.formTitle')}
          </h2>
          <p className="text-muted mb-4">
            {loginBrand.resetSubtitle || t('auth.resetPassword.formDescription')}
          </p>

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

          <form onSubmit={handleReset}>
            <div className="mb-3">
              <label htmlFor="password" className="form-label fw-medium">
                {t('auth.resetPassword.passwordLabel')}
                <span className="text-danger">*</span>
              </label>
              <input
                type="password"
                className="form-control form-control-lg"
                id="password"
                placeholder={t('auth.resetPassword.passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>

            <div className="d-grid">
              <button
                type="submit"
                className="btn btn-primary btn-lg"
                style={{ minHeight: 44 }}
                disabled={isSubmitting}
              >
                {isSubmitting ? t('auth.resetPassword.submitting') : t('auth.resetPassword.submit')}
              </button>
            </div>
          </form>

          <div className="text-center mt-4">
            <Link to="/login" className="text-decoration-none">
              {t('auth.backToLogin')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResetPasswordPage
