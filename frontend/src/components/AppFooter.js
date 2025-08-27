import React from 'react'
import { CFooter } from '@coreui/react'
import { useSelector } from 'react-redux'

const AppFooter = () => {
  const currentYear = new Date().getFullYear()
  const customization = useSelector((state) => state.customization)
  
  return (
    <CFooter className="px-4 footer">
      <div>
        {/* <a href="https://coreui.io" target="_blank" rel="noopener noreferrer">
          CoreUI
        </a> */}
        <span className="ms-1">&copy; {currentYear} {customization.logoText || 'NJ Cabinets'}. All rights reserved.</span>
      </div>
      <div className="ms-auto">
        {/* <span className="me-1">Powered by</span>
        <a href="https://coreui.io/react" target="_blank" rel="noopener noreferrer">
          CoreUI React Admin &amp; Dashboard Template
        </a> */}
      </div>
    </CFooter>
  )
}

export default React.memo(AppFooter)
