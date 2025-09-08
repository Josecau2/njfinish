import React from 'react'
import {
  CButton,
  CCol,
  CContainer,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CRow,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilMagnifyingGlass } from '@coreui/icons'

const Page404 = () => {
  return (
    <div className="bg-body-tertiary min-vh-100 d-flex flex-row align-items-center" role="main">
      <CContainer>
        <style>{`
          @media (max-width: 576px){
            .input-prepend .form-control{ min-height:44px; }
            .input-prepend .btn{ min-height:44px; }
          }
        `}</style>
        <CRow className="justify-content-center">
          <CCol md={6}>
            <div className="clearfix" role="region" aria-label="Page not found">
              <h1 className="float-start display-3 me-4" aria-hidden="true">404</h1>
              <h4 className="pt-3">Oops! You{"'"}re lost.</h4>
              <p className="text-body-secondary float-start">
                The page you are looking for was not found.
              </p>
            </div>
            <CInputGroup className="input-prepend" role="search">
              <CInputGroupText aria-hidden="true">
                <CIcon icon={cilMagnifyingGlass} />
              </CInputGroupText>
              <CFormInput
                type="text"
                placeholder="What are you looking for?"
                aria-label="Search site"
                style={{ minHeight: '44px' }}
              />
              <CButton color="info" type="button" aria-label="Search" style={{ minHeight: '44px' }}>
                Search
              </CButton>
            </CInputGroup>
          </CCol>
        </CRow>
      </CContainer>
    </div>
  )
}

export default Page404
