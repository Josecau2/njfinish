import React from 'react'
import { Link } from 'react-router-dom'
import { CButton, CContainer, CForm, CFormInput } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilArrowLeft, cilMagnifyingGlass } from '@coreui/icons'

const Page404 = () => {
  return (
    <div className="status-shell" role="main">
      <CContainer className="p-0">
        <div className="status-card" role="alert" aria-live="polite">
          <div className="status-card__code">404</div>
          <div>
            <h1 className="status-card__title">We couldn&apos;t find that page</h1>
            <p className="status-card__body">
              The content you&apos;re looking for may have moved or no longer exists. Try searching for
              a similar page or return to your dashboard.
            </p>
          </div>

          <CForm className="status-card__search" role="search" aria-label="Search site">
            <div className="position-relative">
              <CIcon
                icon={cilMagnifyingGlass}
                className="position-absolute top-50 translate-middle-y ms-3 text-body-secondary"
                aria-hidden="true"
              />
              <CFormInput
                type="search"
                placeholder="Search proposals, customers, or settings"
                className="ps-5"
              />
            </div>
            <CButton color="primary" type="submit">
              Search
            </CButton>
          </CForm>

          <Link to="/" className="auth-meta-link justify-content-center">
            <CIcon icon={cilArrowLeft} /> Back to dashboard
          </Link>
        </div>
      </CContainer>
    </div>
  )
}

export default Page404
