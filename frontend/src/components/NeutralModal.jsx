import React, { useMemo } from 'react'
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
} from '@chakra-ui/react'
import { useSelector } from 'react-redux'

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
    if (!backgroundColor || typeof backgroundColor !== 'string') return "white"
    const hex = backgroundColor.replace('#', '')
    if (hex.length !== 6) return "white"
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return luminance > 0.5 ? "gray.700" : "white"
  }

  const headerBg = useMemo(() => {
    const value = customization?.headerBg
    if (!value) return customization?.primaryColor || "gray.900"
    if (typeof value === 'string') return value
    if (typeof value === 'object') {
      if (typeof value.hex === 'string' && value.hex.trim()) return value.hex.trim()
      if (typeof value.value === 'string' && value.value.trim()) return value.value.trim()
    }
    return customization?.primaryColor || "gray.900"
  }, [customization])

  const headerTextColor = customization?.headerFontColor || getContrastColor(headerBg)

  const chakraSize = size === 'xl' ? '6xl' : size === 'lg' ? '4xl' : '2xl'

  return (
    <Modal
      isOpen={visible}
      onClose={onClose}
      isCentered
      size={chakraSize}
      scrollBehavior="inside"
      className={`neutral-modal ${className}`.trim()}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader
          bg={headerBg}
          color={headerTextColor}
          borderBottom={`1px solid ${headerBg}33`}
        >
          {title}
        </ModalHeader>
        <ModalCloseButton color={headerTextColor} aria-label="Close modal" />
        <ModalBody>{children}</ModalBody>
        {footer ? <ModalFooter>{footer}</ModalFooter> : null}
      </ModalContent>
    </Modal>
  )
}
