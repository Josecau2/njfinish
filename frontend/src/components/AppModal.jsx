import { useTranslation } from 'react-i18next'
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useColorModeValue,
} from '@chakra-ui/react'

const AppModal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = { base: 'full', md: 'md' },
  scrollBehavior = 'inside',
  ...props
}) => {
  const { t } = useTranslation()
  const overlayBg = useColorModeValue('blackAlpha.600', 'blackAlpha.600')
  const borderColor = useColorModeValue('border', 'gray.600')

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={size}
      scrollBehavior={scrollBehavior}
      isCentered
      {...props}
    >
      <ModalOverlay bg={overlayBg} />
      <ModalContent borderRadius={{ base: '0', md: 'lg' }}>
        {title && (
          <ModalHeader borderBottomWidth="1px" borderColor={borderColor}>
            {title}
          </ModalHeader>
        )}
        <ModalCloseButton aria-label={t('common.ariaLabels.closeModal', 'Close modal')} />
        <ModalBody>
          {children}
        </ModalBody>
        {footer && (
          <ModalFooter pt={4} pb={{ base: 8, md: 4 }}>
            {footer}
          </ModalFooter>
        )}
      </ModalContent>
    </Modal>
  )
}

export default AppModal