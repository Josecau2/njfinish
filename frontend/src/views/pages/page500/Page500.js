import React from 'react'
import { Link } from 'react-router-dom'
import { CButton, CContainer, CForm, CFormInput } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilArrowLeft, cilWarning } from '@coreui/icons'

const Page500 = () => {
  return (
    <div className="status-shell" role="main">
      <CContainer className="p-0">
        <div className="status-card" role="alert" aria-live="assertive">
          <div className="status-card__code text-warning">500</div>
          <div>
            <h1 className="status-card__title">Something went wrong on our end</h1>
            <p className="status-card__body">
              We&apos;re experiencing an unexpected issue. Please try again in a moment or let our
              support team know so we can resolve the problem quickly.
            </p>
          </div>

          <CForm className="status-card__search" role="search" aria-label="Report issue">
            <div className="position-relative">
              <CIcon
                icon={cilWarning}
                className="position-absolute top-50 translate-middle-y ms-3 text-warning"
                aria-hidden="true"
              />
              <CFormInput
                type="text"
                placeholder="Describe what you were doing"
                className="ps-5"
              />
            </div>
            <CButton color="warning" type="submit" className="text-dark fw-semibold">
              Send report
            </CButton>
          </CForm>

          <Link to="/" className="auth-meta-link justify-content-center">
            <CIcon icon={cilArrowLeft} /> Back to safety
          </Link>
        </div>
      </CContainer>
    </div>
  )
}

export default Page500
