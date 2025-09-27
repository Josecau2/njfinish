import React, { useMemo } from 'react'
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
} from '@coreui/react'
import { useSelector } from 'react-redux'

// A neutral, branded modal that uses solid colors from customization (no gradients)
// Props:
// - visible: boolean
// - onClose: () => void
// - title: string | ReactNode
// - size: 'sm' | 'lg' | 'xl'
// - footer: ReactNode (optional)
// - children: ReactNode (modal body)
// - className: string (optional)
export default function NeutralModal({
  visible,
  onClose,
  title,
  size = 'xl',
  footer = null,
  children,
  className = '',
}) {
  const customization = useSelector((state) => state.customization) || {}

  const getContrastColor = (backgroundColor) => {
    if (!backgroundColor || typeof backgroundColor !== 'string') return '#ffffff'
    const hex = backgroundColor.replace('#', '')
    if (hex.length !== 6) return '#ffffff'
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return luminance > 0.5 ? '#2d3748' : '#ffffff'
  }

  const headerBg = useMemo(() => {
    const val = customization?.headerBg
    if (!val) return customization?.primaryColor || '#0f172a'
    if (typeof val === 'string') return val
    if (typeof val === 'object') {
      if (typeof val.hex === 'string' && val.hex.trim()) return val.hex.trim()
      if (typeof val.value === 'string' && val.value.trim()) return val.value.trim()
    }
    return customization?.primaryColor || '#0f172a'
  }, [customization])

  const headerTextColor = customization?.headerFontColor || getContrastColor(headerBg)

  const headerStyle = useMemo(
    () => ({
      background: headerBg,
      color: headerTextColor,
      borderBottom: `1px solid ${headerBg}33`,
      // Ensure CoreUI close button inherits our color
      '--cui-btn-close-color': headerTextColor,
      '--cui-btn-close-opacity': 0.9,
      '--cui-btn-close-hover-opacity': 1,
    }),
    [headerBg, headerTextColor]
  )

  return (
    <CModal
      visible={visible}
      onClose={onClose}
      alignment="center"
      size={size}
      scrollable={true}
      className={`neutral-modal ${className}`}
    >
      <CModalHeader closeButton className="border-0" style={headerStyle}>
        <CModalTitle style={{ color: headerTextColor }}>{title}</CModalTitle>
      </CModalHeader>
      <CModalBody>{children}</CModalBody>
      {footer && <CModalFooter>{footer}</CModalFooter>}
    </CModal>
  )
}
