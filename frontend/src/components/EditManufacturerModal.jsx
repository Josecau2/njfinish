import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
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
  Alert,
  AlertIcon,
  Switch,
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
    <Modal isOpen={show} onClose={onClose} size={{ base: "full", lg: "lg" }} scrollBehavior="inside" isCentered>
      <ModalOverlay />
      <ModalContent as="form" onSubmit={handleSubmit} className="edit-manufacturer-modal">
        <ModalHeader>{t('editManufacturerModal.title')}</ModalHeader>
        <ModalBody pb={6}>
          <Stack spacing={4}>
            {error ? (
              <Alert status="error" variant="left-accent">
                <AlertIcon />
                {error}
              </Alert>
            ) : null}

            <FormControl>
              <FormLabel htmlFor="name">{t('editManufacturerModal.labels.name')}</FormLabel>
              <Input
                id="name"
                name="name"
                value={formData.name}
                isReadOnly
                variant="filled"
                focusBorderColor="brand.500"
                placeholder={t('editManufacturerModal.placeholders.name')}
              />
            </FormControl>

            <FormControl>
              <FormLabel htmlFor="email">{t('editManufacturerModal.labels.email')}</FormLabel>
              <Input
                id="email"
                name="email"
                value={formData.email}
                isReadOnly
                variant="filled"
                focusBorderColor="brand.500"
                placeholder={t('editManufacturerModal.placeholders.email')}
              />
            </FormControl>

            <FormControl>
              <FormLabel htmlFor="multiplier">{t('editManufacturerModal.labels.multiplier')}</FormLabel>
              <Input
                id="multiplier"
                name="multiplier"
                type="number"
                step="0.01"
                value={formData.multiplier}
                onChange={handleMultiplierChange}
                focusBorderColor="brand.500"
                placeholder={t('editManufacturerModal.placeholders.multiplier')}
              />
            </FormControl>

            <FormControl display="flex" alignItems="center">
              <Switch
                id="enabled"
                name="enabled"
                isChecked={formData.enabled}
                onChange={handleChange}
                mr={3}
              />
              <FormLabel htmlFor="enabled" mb={0}>
                {t('editManufacturerModal.labels.enabled')}
              </FormLabel>
            </FormControl>
          </Stack>
        </ModalBody>
        <ModalFooter gap={4}>
          <Button variant="outline" onClick={onClose} aria-label="Cancel editing manufacturer">
            {t('editManufacturerModal.actions.cancel')}
          </Button>
          <Button colorScheme="blue" type="submit" aria-label="Save manufacturer changes">
            {t('editManufacturerModal.actions.save')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default EditManufacturerModal
