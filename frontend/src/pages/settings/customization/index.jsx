import React, { useState } from 'react'
import {
  CCard,
  CCardBody,
  CNav,
  CNavItem,
  CNavLink,
  CTabContent,
  CTabPane,
} from '@coreui/react'
import CustomizationPage from './CustomizationPage'
import PdfLayoutCustomization from './PdfLayoutCustomization'
import LoginCustomizerPage from './LoginCustomizerPage'

const CustomizationIndex = () => {
  const [activeKey, setActiveKey] = useState(1)

  return (
    <CCard className='main-div-cutomization'>
      <CCardBody>
        <CNav variant="tabs" role="tablist">
          <CNavItem>
            <CNavLink
              active={activeKey === 1}
              onClick={() => setActiveKey(1)}
              style={{ cursor: 'pointer' }}
            >
              General Customization
            </CNavLink>
          </CNavItem>
          <CNavItem>
            <CNavLink
              active={activeKey === 2}
              onClick={() => setActiveKey(2)}
              style={{ cursor: 'pointer' }}
            >
              PDF Layout
            </CNavLink>
          </CNavItem>
          <CNavItem>
            <CNavLink
              active={activeKey === 3}
              onClick={() => setActiveKey(3)}
              style={{ cursor: 'pointer' }}
            >
              Login Page
            </CNavLink>
          </CNavItem>
        </CNav>

        <CTabContent>
          <CTabPane visible={activeKey === 1}>
            <CustomizationPage />
          </CTabPane>
          <CTabPane visible={activeKey === 2}>
            <PdfLayoutCustomization />
          </CTabPane>
          <CTabPane visible={activeKey === 3}>
            <LoginCustomizerPage />
          </CTabPane>
        </CTabContent>
      </CCardBody>
    </CCard>
  )
}

export default CustomizationIndex
