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
import { cilLockLocked, cilShieldAlt, cilUser } from '@coreui/icons'

const Login = () => {
  return (
    <div className="auth-shell" role="main">
      <CContainer className="p-0">
        <div className="auth-card">
          <div className="auth-card__grid">
            <div className="auth-card__media" aria-hidden="true">
              <span className="auth-card__badge">
                <CIcon icon={cilShieldAlt} size="lg" /> Secure Access
              </span>
              <div>
                <h1>Welcome back</h1>
                <p>
                  Sign in to manage proposals, customers, and your daily workflow from one modern
                  dashboard.
                </p>
              </div>
              <div>
                <p className="mb-1">Need an account?</p>
                <Link to="/register" className="auth-meta-link">
                  Request a new seat
                </Link>
              </div>
            </div>

            <div className="auth-card__body">
              <div className="auth-card__header">
                <h1>Sign in</h1>
                <p className="text-body-secondary">Enter your credentials to continue</p>
              </div>

              <CForm className="auth-form" role="form" aria-label="Sign in form">
                <div>
                  <label htmlFor="login-username" className="form-label fw-semibold">
                    Username
                  </label>
                  <CInputGroup>
                    <CInputGroupText>
                      <CIcon icon={cilUser} />
                    </CInputGroupText>
                    <CFormInput
                      id="login-username"
                      placeholder="Enter your username"
                      autoComplete="username"
                    />
                  </CInputGroup>
                </div>

                <div>
                  <label htmlFor="login-password" className="form-label fw-semibold">
                    Password
                  </label>
                  <CInputGroup>
                    <CInputGroupText>
                      <CIcon icon={cilLockLocked} />
                    </CInputGroupText>
                    <CFormInput
                      id="login-password"
                      type="password"
                      placeholder="Enter your password"
                      autoComplete="current-password"
                    />
                  </CInputGroup>
                </div>

                <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center">
                  <CButton color="primary" className="px-4">
                    Login
                  </CButton>
                  <Link to="/forgot-password" className="auth-meta-link">
                    Forgot password?
                  </Link>
                </div>
              </CForm>

              <div className="auth-form__footer">
                <span>Or continue with your organization&apos;s sign-in flow.</span>
                <CRow className="g-2" role="group" aria-label="Alternate sign-in actions">
                  <CCol xs={12} sm={6}>
                    <CButton color="light" className="w-100 border-0 shadow-sm">
                      Use SSO
                    </CButton>
                  </CCol>
                  <CCol xs={12} sm={6}>
                    <CButton color="light" className="w-100 border-0 shadow-sm">
                      Request access
                    </CButton>
                  </CCol>
                </CRow>
              </div>
            </div>
          </div>
        </div>
      </CContainer>
    </div>
  )
}

export default Login
