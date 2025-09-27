import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getOptimalColors } from '../../utils/colorUtils'
import BrandLogo from '../../components/BrandLogo'
import { getBrand, getLoginBrand, getBrandColors } from '../../brand/useBrand'

const EMPTY_FORM = {
  email: '',
}

const ForgotPasswordPage = () => {
  const { t } = useTranslation()
  const api_url = import.meta.env.VITE_API_URL
  const brand = getBrand()
  const loginBrand = getLoginBrand()
  const brandColors = getBrandColors()
  const logoHeight = Number(loginBrand.logoHeight) || 60
  const loginBackground = loginBrand.backgroundColor || brandColors.surface || '#0e1446'
  const rightPanelColors = getOptimalColors(loginBackground)

  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    try {
      localStorage.setItem('coreui-free-react-admin-template-theme', 'light')
    } catch (_) {
      // ignore
    }
  }, [])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    setMessage('')
    setError('')

    try {
      const trimmedEmail = form.email.trim()
      if (!trimmedEmail) {
        setError(t('auth.emailRequired'))
        setIsSubmitting(false)
        return
      }

      const res = await axios.post(`${api_url}/api/forgot-password`, { email: trimmedEmail })
      const data = res?.data || {}
      setMessage(data.message || t('auth.forgotPassword.success'))
      setForm({ ...EMPTY_FORM })
    } catch (err) {
      const errorMsg = err?.response?.data?.message || t('auth.forgotPassword.error')
      setError(errorMsg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="login-page-wrapper">
      <div className="login-left-panel" style={{ backgroundColor: loginBackground }}>
        <div className="login-left-content">
          <h1 className="mb-3" style={{ color: rightPanelColors.text }}>
            {loginBrand.rightTitle || brand.logoAlt || t('auth.forgotPassword.title')}
          </h1>
          <p className="lead mb-4" style={{ color: rightPanelColors.subtitle }}>
            {loginBrand.rightSubtitle || t('auth.forgotPassword.subtitle')}
          </p>
          <p style={{ color: rightPanelColors.subtitle }}>{loginBrand.rightDescription || ''}</p>
        </div>
      </div>

      <div className="login-right-panel">
        <div className="login-form-container">
          <div className="text-center mb-4">
            <BrandLogo size={logoHeight} />
          </div>
          <h2 className="mb-2 fw-bold">{loginBrand.resetTitle || t('auth.forgotPassword.title')}</h2>
          <p className="text-muted mb-4">{loginBrand.resetSubtitle || t('auth.forgotPassword.subtitle')}</p>

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
                {t('auth.email')} <span className="text-danger">*</span>
              </label>
              <input
                type="email"
                className="form-control form-control-lg"
                id="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder={t('auth.emailPlaceholder')}
                required
              />
            </div>

            <div className="d-grid">
              <button type="submit" className="btn btn-primary btn-lg" style={{ minHeight: 44 }} disabled={isSubmitting}>
                {isSubmitting ? t('auth.forgotPassword.submitting') : t('auth.forgotPassword.submit')}
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

export default ForgotPasswordPage
