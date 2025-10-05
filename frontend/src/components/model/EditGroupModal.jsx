import React, { useEffect, useState } from 'react'
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  FormControl,
  FormLabel,
  Input,
  Switch,
  Alert,
  AlertIcon,
  Stack,
  Button,
} from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'

const DEFAULT_FORM = {
  name: '',
  multiplier: '',
  enabled: false,
}

const multiplierRegex = /^(?:\d{0,4})(?:\.\d{0,2})?$/

const EditGroupModal = ({ show, onClose, manufacturer, onSave }) => {
  const { t } = useTranslation()
  const [formData, setFormData] = useState(DEFAULT_FORM)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (manufacturer) {
      setFormData({
        name: manufacturer?.user_group?.name || '',
        multiplier: manufacturer?.multiplier?.toString() || '',
        enabled: Boolean(manufacturer?.enabled),
      })
    } else {
      setFormData(DEFAULT_FORM)
    }
  }, [manufacturer])

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleMultiplierChange = (event) => {
    const { value } = event.target
    if (value === '' || multiplierRegex.test(value)) {
      setFormData((prev) => ({
        ...prev,
        multiplier: value,
      }))
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setError(null)
    onSave(formData)
  }

  return (
    <Modal isOpen={show} onClose={onClose} size={{ base: 'full', md: 'md', lg: 'lg' }} scrollBehavior="inside" isCentered>
      <ModalOverlay />
      <ModalContent as='form' onSubmit={handleSubmit} borderRadius="12px" overflow="hidden">
        <ModalHeader>{t('settings.userGroups.multipliers.modal.title')}</ModalHeader>
        <ModalBody>
          <Stack spacing={4}>
            {error ? (
              <Alert status='error'>
                <AlertIcon />
                {error}
              </Alert>
            ) : null}

            <FormControl>
              <FormLabel htmlFor='name'>
                {t('settings.userGroups.multipliers.modal.labels.name')}
              </FormLabel>
              <Input
                id='name'
                name='name'
                value={formData.name}
                isReadOnly
                variant='filled'
                placeholder={t('settings.userGroups.multipliers.modal.placeholders.name')}
              />
            </FormControl>

            <FormControl>
              <FormLabel htmlFor='multiplier'>
                {t('settings.userGroups.multipliers.modal.labels.multiplier')}
              </FormLabel>
              <Input
                id='multiplier'
                name='multiplier'
                type='number'
                step='0.01'
                value={formData.multiplier}
                onChange={handleMultiplierChange}
                placeholder={t('settings.userGroups.multipliers.modal.placeholders.multiplier')}
              />
            </FormControl>

            <FormControl display='flex' alignItems='center'>
              <Switch
                id='enabled'
                name='enabled'
                isChecked={formData.enabled}
                onChange={handleChange}
                mr={3}
              />
              <FormLabel htmlFor='enabled' mb={0}>
                {t('settings.userGroups.multipliers.modal.labels.enabled')}
              </FormLabel>
            </FormControl>
          </Stack>
        </ModalBody>
        <ModalFooter gap={4}>
          <Button variant='outline' onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button colorScheme='brand' type='submit' minH='44px'>
            {t('common.save')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default EditGroupModal
