import React from 'react'
import { CAlert } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilSearch } from '@coreui/icons'

const EmptyState = ({
  title = 'Nothing here yet',
  subtitle = 'Try adjusting your filters or create a new item.',
  icon = cilSearch,
  className = '',
  children,
}) => {
  return (
    <div className={`text-center py-4 ${className}`}>
      <div className="mb-2" style={{ opacity: 0.35 }}>
        <CIcon icon={icon} size="xl" />
      </div>
      <div className="fw-semibold">{title}</div>
      <div className="text-muted small">{subtitle}</div>
      {children}
    </div>
  )
}

export default EmptyState
