import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getOptimalColors } from '../../utils/colorUtils'
import { LOGIN_CUSTOMIZATION as FALLBACK_LOGIN_CUSTOMIZATION } from '../../config/loginCustomization'

const LOGIN_CUSTOMIZATION =
  (typeof window !== 'undefined' && window.__LOGIN_CUSTOMIZATION__) || FALLBACK_LOGIN_CUSTOMIZATION

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  city: '',
  state: '',
  zip: '',
  company: '',
  message: '',
}

const RequestAccessPage = () => {
  const { t } = useTranslation()
  const apiUrl = import.meta.env.VITE_API_URL
  const [customization] = useState(LOGIN_CUSTOMIZATION)
  const [form, setForm] = useState(() => ({ ...EMPTY_FORM }))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const copy = {
    title: t('auth.requestAccess.title'),
    subtitle: t('auth.requestAccess.subtitle'),
    description: t('auth.requestAccess.description'),
    success: t('auth.requestAccess.success'),
    submit: t('auth.requestAccess.submit'),
    submitting: t('auth.requestAccess.submitting'),
    submitError: t('auth.requestAccess.submitError'),
    benefitsHeading: t('auth.requestAccess.benefitsHeading'),
    alreadyHaveAccess: t('auth.requestAccess.alreadyHaveAccess'),
    signIn: t('auth.signIn'),
    logoAlt: t('auth.logoAlt'),
    fields: {
      firstNameLabel: t('auth.requestAccess.fields.firstNameLabel'),
      firstNamePlaceholder: t('auth.requestAccess.fields.firstNamePlaceholder'),
      lastNameLabel: t('auth.requestAccess.fields.lastNameLabel'),
      lastNamePlaceholder: t('auth.requestAccess.fields.lastNamePlaceholder'),
      emailLabel: t('auth.requestAccess.fields.emailLabel'),
      emailPlaceholder: t('auth.requestAccess.fields.emailPlaceholder'),
      phoneLabel: t('auth.requestAccess.fields.phoneLabel'),
      phonePlaceholder: t('auth.requestAccess.fields.phonePlaceholder'),
      cityLabel: t('auth.requestAccess.fields.cityLabel'),
      cityPlaceholder: t('auth.requestAccess.fields.cityPlaceholder'),
      stateLabel: t('auth.requestAccess.fields.stateLabel'),
      statePlaceholder: t('auth.requestAccess.fields.statePlaceholder'),
      zipLabel: t('auth.requestAccess.fields.zipLabel'),
      zipPlaceholder: t('auth.requestAccess.fields.zipPlaceholder'),
      companyLabel: t('auth.requestAccess.fields.companyLabel'),
      companyPlaceholder: t('auth.requestAccess.fields.companyPlaceholder'),
      messageLabel: t('auth.requestAccess.fields.messageLabel'),
      messagePlaceholder: t('auth.requestAccess.fields.messagePlaceholder'),
    },
  }
  const requiredAsterisk = <span className="text-danger">*</span>

  useEffect(() => {
    try {
      localStorage.setItem('coreui-free-react-admin-template-theme', 'light')
    } catch (_) {
      // ignore storage failures
    }
  }, [])

  const handleChange = (event) => {
    const { name, value } = event.target
    const nextValue = name === 'state' ? value.toUpperCase() : value
    setForm((prev) => ({ ...prev, [name]: nextValue }))
  }

  const settings = customization
  const rightPanelColors = getOptimalColors(settings.backgroundColor || '#0e1446')
  const benefits = Array.isArray(settings.requestAccessBenefits)
    ? settings.requestAccessBenefits
    : String(settings.requestAccessBenefits || '')
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
  const pageTitle = settings.requestAccessTitle || copy.title
  const pageSubtitle = settings.requestAccessSubtitle || copy.subtitle
  const pageDescription = settings.requestAccessDescription || copy.description
  const successCopy = settings.requestAccessSuccessMessage || copy.success

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    setErrorMessage('')
    setSuccessMessage('')

    const trimmedForm = Object.fromEntries(
      Object.entries(form).map(([key, value]) => [
        key,
        typeof value === 'string' ? value.trim() : value,
      ]),
    )
    const payload = {
      ...trimmedForm,
      name: `${trimmedForm.firstName} ${trimmedForm.lastName}`.trim(),
    }

    try {
      const res = await axios.post(`${apiUrl}/api/request-access`, payload)
      const data = res?.data || {}
      setSuccessMessage(data.message || successCopy)
      setForm(() => ({ ...EMPTY_FORM }))
    } catch (err) {
      const message = err?.response?.data?.message || copy.submitError
      setErrorMessage(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="login-page-wrapper">
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

      <div className="login-right-panel">
        <div className="login-form-container">
          {settings.logo && (
            <div className="text-center mb-4">
              <img src={settings.logo} alt={copy.logoAlt} style={{ height: 50 }} />
            </div>
          )}
          <h2 className="mb-2 fw-bold">{pageTitle}</h2>
          <p className="text-muted mb-2 small">{pageSubtitle}</p>
          {pageDescription && <p className="text-muted small">{pageDescription}</p>}
          {benefits.length > 0 && (
            <div className="mb-3">
              <p className="mb-1 fw-medium text-muted small">{copy.benefitsHeading}</p>
              <ul
                className="list-unstyled text-muted small mb-0"
                style={{ fontSize: '0.85rem', lineHeight: '1.3' }}
              >
                {benefits.map((item, idx) => (
                  <li key={idx}>&bull; {item}</li>
                ))}
              </ul>
            </div>
          )}

          {successMessage && (
            <div className="alert alert-success" role="status" aria-live="polite">
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <div className="alert alert-danger" role="alert" aria-live="assertive">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Name fields in one row */}
            <div className="row g-2 mb-3">
              <div className="col-md-6">
                <label htmlFor="firstName" className="form-label fw-medium">
                  {copy.fields.firstNameLabel} {requiredAsterisk}
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  className="form-control"
                  placeholder={copy.fields.firstNamePlaceholder}
                  value={form.firstName}
                  onChange={handleChange}
                  required
                  maxLength={191}
                  autoComplete="given-name"
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="lastName" className="form-label fw-medium">
                  {copy.fields.lastNameLabel} {requiredAsterisk}
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  className="form-control"
                  placeholder={copy.fields.lastNamePlaceholder}
                  value={form.lastName}
                  onChange={handleChange}
                  required
                  maxLength={191}
                  autoComplete="family-name"
                />
              </div>
            </div>

            {/* Email and Phone in one row */}
            <div className="row g-2 mb-3">
              <div className="col-md-7">
                <label htmlFor="email" className="form-label fw-medium">
                  {copy.fields.emailLabel} {requiredAsterisk}
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="form-control"
                  placeholder={copy.fields.emailPlaceholder}
                  value={form.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="col-md-5">
                <label htmlFor="phone" className="form-label fw-medium">
                  {copy.fields.phoneLabel} {requiredAsterisk}
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  className="form-control"
                  placeholder={copy.fields.phonePlaceholder}
                  value={form.phone}
                  onChange={handleChange}
                  required
                  maxLength={32}
                  autoComplete="tel"
                />
              </div>
            </div>

            {/* Location fields in one row */}
            <div className="row g-2 mb-3">
              <div className="col-md-5">
                <label htmlFor="city" className="form-label fw-medium">
                  {copy.fields.cityLabel}
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  className="form-control"
                  placeholder={copy.fields.cityPlaceholder}
                  value={form.city}
                  onChange={handleChange}
                  maxLength={191}
                  autoComplete="address-level2"
                />
              </div>
              <div className="col-md-3">
                <label htmlFor="state" className="form-label fw-medium">
                  {copy.fields.stateLabel}
                </label>
                <input
                  type="text"
                  id="state"
                  name="state"
                  className="form-control"
                  placeholder={copy.fields.statePlaceholder}
                  value={form.state}
                  onChange={handleChange}
                  maxLength={64}
                  autoComplete="address-level1"
                />
              </div>
              <div className="col-md-4">
                <label htmlFor="zip" className="form-label fw-medium">
                  {copy.fields.zipLabel}
                </label>
                <input
                  type="text"
                  id="zip"
                  name="zip"
                  className="form-control"
                  placeholder={copy.fields.zipPlaceholder}
                  value={form.zip}
                  onChange={handleChange}
                  maxLength={32}
                  inputMode="numeric"
                  autoComplete="postal-code"
                />
              </div>
            </div>

            {/* Company field */}
            <div className="mb-3">
              <label htmlFor="company" className="form-label fw-medium">
                {copy.fields.companyLabel}
              </label>
              <input
                type="text"
                id="company"
                name="company"
                className="form-control"
                placeholder={copy.fields.companyPlaceholder}
                value={form.company}
                onChange={handleChange}
                maxLength={191}
                autoComplete="organization"
              />
            </div>

            {/* Message field - smaller */}
            <div className="mb-3">
              <label htmlFor="message" className="form-label fw-medium">
                {copy.fields.messageLabel}
              </label>
              <textarea
                id="message"
                name="message"
                className="form-control"
                placeholder={copy.fields.messagePlaceholder}
                rows={3}
                value={form.message}
                onChange={handleChange}
                maxLength={2000}
              />
              <div className="form-text text-end small">{form.message.length}/2000</div>
            </div>

            <div className="d-grid">
              <button
                type="submit"
                className="btn btn-primary"
                style={{ minHeight: 40 }}
                disabled={isSubmitting}
                aria-busy={isSubmitting}
              >
                {isSubmitting ? copy.submitting : copy.submit}
              </button>
            </div>
          </form>

          <div className="text-center mt-3">
            <span className="text-muted small">{copy.alreadyHaveAccess}</span>
            <Link to="/login" className="fw-semibold text-decoration-none small">
              {copy.signIn}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RequestAccessPage
