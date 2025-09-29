import React from 'react'
import { Link } from 'react-router-dom'
import {
  CButton,
  CCol,
  CContainer,
  CForm,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CRow,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilAt, cilBadge, cilLockLocked, cilUser } from '@coreui/icons'

const Register = () => {
  return (
    <div className="auth-shell" role="main">
      <CContainer className="p-0">
        <div className="auth-card">
          <div className="auth-card__grid">
            <div className="auth-card__media" aria-hidden="true">
              <span className="auth-card__badge">
                <CIcon icon={cilBadge} size="lg" /> Team Collaboration
              </span>
              <div>
                <h1>Set up your workspace</h1>
                <p>
                  Invite team members, manage permissions, and tailor proposals with a cohesive,
                  branded experience.
                </p>
              </div>
            </div>

            <div className="auth-card__body">
              <div className="auth-card__header">
                <h1>Create account</h1>
                <p className="text-body-secondary">
                  Provide your details to request access for your organization
                </p>
              </div>

              <CForm className="auth-form" role="form" aria-label="Create account form">
                <div>
                  <label htmlFor="register-name" className="form-label fw-semibold">
                    Full name
                  </label>
                  <CInputGroup>
                    <CInputGroupText>
                      <CIcon icon={cilUser} />
                    </CInputGroupText>
                    <CFormInput id="register-name" placeholder="Alex Johnson" autoComplete="name" />
                  </CInputGroup>
                </div>

                <div>
                  <label htmlFor="register-email" className="form-label fw-semibold">
                    Work email
                  </label>
                  <CInputGroup>
                    <CInputGroupText>
                      <CIcon icon={cilAt} />
                    </CInputGroupText>
                    <CFormInput
                      id="register-email"
                      type="email"
                      placeholder="you@company.com"
                      autoComplete="email"
                    />
                  </CInputGroup>
                </div>

                <div>
                  <label htmlFor="register-password" className="form-label fw-semibold">
                    Password
                  </label>
                  <CInputGroup>
                    <CInputGroupText>
                      <CIcon icon={cilLockLocked} />
                    </CInputGroupText>
                    <CFormInput
                      id="register-password"
                      type="password"
                      placeholder="Create a strong password"
                      autoComplete="new-password"
                    />
                  </CInputGroup>
                </div>

                <div>
                  <label htmlFor="register-password-repeat" className="form-label fw-semibold">
                    Confirm password
                  </label>
                  <CInputGroup>
                    <CInputGroupText>
                      <CIcon icon={cilLockLocked} />
                    </CInputGroupText>
                    <CFormInput
                      id="register-password-repeat"
                      type="password"
                      placeholder="Repeat password"
                      autoComplete="new-password"
                    />
                  </CInputGroup>
                </div>

                <div className="d-grid gap-3">
                  <CButton color="success">Create account</CButton>
                  <span className="text-body-secondary small text-center">
                    By creating an account you agree to our{' '}
                    <a href="#terms" className="text-decoration-none fw-semibold">
                      terms &amp; privacy policy
                    </a>
                    .
                  </span>
                </div>
              </CForm>

              <div className="auth-form__footer">
                <span>Already onboarded?</span>
                <Link to="/login" className="auth-meta-link">
                  Return to login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </CContainer>
    </div>
  )
}

export default Register
