import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Switch,
  Alert,
  AlertIcon,
  Stack,
  Button,
} from '@chakra-ui/react'

const DEFAULT_FORM = {
  name: '',
  email: '',
  multiplier: '',
  enabled: false,
}

const multiplierRegex = /^(?:\d{0,4})(?:\.\d{0,2})?$/

const EditManufacturerModal = ({ show, onClose, manufacturer, onSave }) => {
  const { t } = useTranslation()
  const [formData, setFormData] = useState(DEFAULT_FORM)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (manufacturer) {
      setFormData({
        name: manufacturer.name || '',
        email: manufacturer.email || '',
        multiplier: manufacturer.multiplier?.toString() || '',
        enabled: Boolean(manufacturer.enabled),
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
      <ModalContent as='form' onSubmit={handleSubmit}>
        <ModalHeader>{t('manufacturer.editTitle')}</ModalHeader>
        <ModalCloseButton aria-label={t('common.ariaLabels.closeModal', 'Close modal')} />
        <ModalBody>
          <Stack spacing={4}>
            {error ? (
              <Alert status='error'>
                <AlertIcon />
                {error}
              </Alert>
            ) : null}

            <FormControl>
              <FormLabel htmlFor='name'>{t('manufacturer.name')}</FormLabel>
              <Input
                id='name'
                name='name'
                value={formData.name}
                isReadOnly
                variant='filled'
                placeholder={t('manufacturers.placeholders.name', 'Manufacturer name')}
              />
            </FormControl>

            <FormControl>
              <FormLabel htmlFor='email'>{t('manufacturer.email')}</FormLabel>
              <Input
                id='email'
                name='email'
                type='email'
                value={formData.email}
                isReadOnly
                variant='filled'
                placeholder={t('manufacturers.placeholders.email', 'Manufacturer email')}
              />
            </FormControl>

            <FormControl>
              <FormLabel htmlFor='multiplier'>{t('manufacturer.multiplier')}</FormLabel>
              <Input
                id='multiplier'
                name='multiplier'
                type='number'
                step='0.01'
                value={formData.multiplier}
                onChange={handleMultiplierChange}
                placeholder={t('manufacturers.placeholders.multiplier', 'Enter multiplier')}
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
                Enabled
              </FormLabel>
            </FormControl>
          </Stack>
        </ModalBody>
        <ModalFooter gap={4}>
          <Button variant='outline' onClick={onClose} aria-label={t('manufacturers.actions.cancelEdit', 'Cancel editing manufacturer')} minH="44px">
            {t('common.cancel')}
          </Button>
          <Button colorScheme='brand' type='submit' minH='44px' aria-label={t('manufacturers.actions.saveChanges', 'Save manufacturer changes')}>
            {t('common.save')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default EditManufacturerModal
