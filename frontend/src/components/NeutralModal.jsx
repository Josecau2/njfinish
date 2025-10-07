import React, { useMemo } from 'react'
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
  size = 'xl',
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

  // Responsive size mapping
  const getResponsiveSize = (size) => {
    const sizeMap = {
      xs: { base: 'full', md: 'xs' },
      sm: { base: 'full', md: 'sm' },
      md: { base: 'full', md: 'md' },
      lg: { base: 'full', md: 'lg', lg: '4xl' },
      xl: { base: 'full', md: 'xl', lg: '6xl' },
      '2xl': { base: 'full', md: '2xl' },
      '3xl': { base: 'full', md: '3xl' },
      '4xl': { base: 'full', md: '4xl' },
      '5xl': { base: 'full', md: '5xl' },
      '6xl': { base: 'full', md: '6xl' },
    }
    return sizeMap[size] || sizeMap.xl
  }

  return (
    <Modal
      isOpen={visible}
      onClose={onClose}
      isCentered
      size={getResponsiveSize(size)}
      scrollBehavior="inside"
    >
      <ModalOverlay />
      <ModalContent borderRadius={{ base: '0', md: '12px' }} overflow="hidden">
        <ModalHeader
          bg={headerBg}
          color={headerTextColor}
          borderBottom={`1px solid ${headerBg}33`}
        >
          {title}
        </ModalHeader>
        <ModalCloseButton color={headerTextColor} aria-label={t('common.ariaLabels.closeModal', 'Close modal')} minW="44px" minH="44px" />
        <ModalBody>{children}</ModalBody>
        {footer ? <ModalFooter gap={3} flexWrap="wrap">{footer}</ModalFooter> : null}
      </ModalContent>
    </Modal>
  )
}
