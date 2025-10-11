import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
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
  size = { base: 'full', md: 'xl' },
  footer = null,
  children,
}) {
  const { t } = useTranslation()
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

  // Handle both string and responsive object sizes
  const chakraSize = useMemo(() => {
    if (typeof size === 'object') {
      // If it's a responsive object, use it directly
      return size
    }
    // Legacy string size mapping
    return size === 'xl' ? '6xl' : size === 'lg' ? '4xl' : '2xl'
  }, [size])

  return (
    <Modal
      isOpen={visible}
      onClose={onClose}
      isCentered
      size={chakraSize}
      scrollBehavior="inside"
    >
      <ModalOverlay />
      <ModalContent borderRadius={{ base: '0', md: 'lg' }}>
        <ModalHeader
          bg={headerBg}
          color={headerTextColor}
          borderBottom={`1px solid ${headerBg}33`}
        >
          {title}
        </ModalHeader>
        <ModalCloseButton color={headerTextColor} aria-label={t('common.ariaLabels.closeModal', 'Close modal')} />
        <ModalBody>{children}</ModalBody>
        {footer ? <ModalFooter pt={4} pb={{ base: 8, md: 4 }}>{footer}</ModalFooter> : null}
      </ModalContent>
    </Modal>
  )
}
