import React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  Text,
  useColorModeValue,
} from '@chakra-ui/react'
import { getContrastColor } from '../../utils/colorUtils'

const EmailContractModal = ({ show, onClose }) => {
  const { t } = useTranslation()
  const customization = useSelector((state) => state.customization) || {}
  const headerBgFallback = useColorModeValue('brand.500', 'brand.400')
  const resolvedHeaderBg = customization.headerBg && customization.headerBg.trim() ? customization.headerBg : headerBgFallback
  const headerTextColor = customization.headerFontColor || getContrastColor(resolvedHeaderBg)

  return (
    <Modal isOpen={show} onClose={onClose} isCentered size={{ base: 'full', md: 'xl', lg: '3xl' }} scrollBehavior='inside'>
      <ModalOverlay />
      <ModalContent borderRadius={{ base: '0', md: '12px' }}>
        <ModalHeader bg={resolvedHeaderBg} color={headerTextColor}>
          <Text fontSize="lg" fontWeight="semibold">
            {t('contracts.sendTitle', 'Send contract')}
          </Text>
        </ModalHeader>
        <ModalCloseButton color={headerTextColor} aria-label={t('common.ariaLabels.closeModal', 'Close modal')} />
        <ModalBody>
          <Text>
            {t(
              'contracts.noContractsMsg',
              'No contracts available for selection. Please go to contract settings to add one.',
            )}
          </Text>
        </ModalBody>
        <ModalFooter pt={4} pb={{ base: 8, md: 4 }}>
          <Button
            variant='outline'
            colorScheme='gray'
            onClick={onClose}
            minH='44px'
            aria-label={t('common.close', 'Close')}
          >
            {t('common.close', 'Close')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default EmailContractModal
