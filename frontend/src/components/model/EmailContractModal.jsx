import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
} from '@chakra-ui/react'

const EmailContractModal = ({ show, onClose }) => {
  const { t } = useTranslation()

  return (
    <Modal isOpen={show} onClose={onClose} isCentered size='lg' scrollBehavior='inside'>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{t('contracts.sendTitle', 'Send contract')}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <p className='text-center'>
            {t(
              'contracts.noContractsMsg',
              'No contracts available for selection. Please go to contract settings to add one.',
            )}
          </p>
        </ModalBody>
        <ModalFooter>
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
