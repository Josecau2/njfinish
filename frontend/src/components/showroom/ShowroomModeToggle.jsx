import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Button,
  HStack,
  Icon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  FormHelperText,
  Input,
  Alert,
  AlertIcon,
  Tooltip,
  Text,
  Switch,
  Stack,
} from '@chakra-ui/react'
import { Settings, Eye } from 'lucide-react'
import { isAdmin } from '../../helpers/permissions'

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null')
  } catch (_) {
    return null
  }
}

const ShowroomModeToggle = ({ compact = false, collapsed = false }) => {
  const { t } = useTranslation()
  const authUser = useSelector((state) => state.auth?.user)
  const user = authUser || getStoredUser()

  const [showroomMode, setShowroomMode] = useState(false)
  const [showroomMultiplier, setShowroomMultiplier] = useState(1.0)
  const [showModal, setShowModal] = useState(false)
  const [tempMultiplier, setTempMultiplier] = useState(1.0)
  const [validationError, setValidationError] = useState('')

  const allowed = isAdmin(user)
  useEffect(() => {
    if (!allowed) return
    try {
      const savedMode = localStorage.getItem('showroomMode') === 'true'
      const savedMultiplier = parseFloat(localStorage.getItem('showroomMultiplier')) || 1.0
      setShowroomMode(savedMode)
      setShowroomMultiplier(savedMultiplier)
      setTempMultiplier(savedMultiplier)
    } catch (error) {
      console.warn('Failed to load showroom settings:', error)
    }
  }, [allowed])

  if (!allowed) {
    return null
  }

  const persistSettings = (mode, multiplier) => {
    try {
      localStorage.setItem('showroomMode', mode.toString())
      localStorage.setItem('showroomMultiplier', multiplier.toString())
      window.dispatchEvent(new CustomEvent('showroomSettingsChanged', {
        detail: { mode, multiplier },
      }))
    } catch (error) {
      console.error('Failed to persist showroom settings:', error)
    }
  }

  const toggleMode = () => {
    const nextMode = !showroomMode
    setShowroomMode(nextMode)
    persistSettings(nextMode, showroomMultiplier)
  }

  const openModal = () => {
    setTempMultiplier(showroomMultiplier)
    setValidationError('')
    setShowModal(true)
  }

  const validateMultiplier = (value) => {
    const numeric = parseFloat(value)
    if (Number.isNaN(numeric)) {
      return t('showroom.multiplier.invalid', 'Multiplier must be a valid number.')
    }
    if (numeric <= 0) {
      return t('showroom.multiplier.min', 'Multiplier must be greater than 0.')
    }
    if (numeric > 10) {
      return t('showroom.multiplier.max', 'Multiplier cannot exceed 10.0.')
    }
    return ''
  }

  const handleMultiplierChange = (event) => {
    const next = event.target.value
    setTempMultiplier(next)
    setValidationError(next ? validateMultiplier(next) : '')
  }

  const saveMultiplier = () => {
    const error = validateMultiplier(tempMultiplier)
    if (error) {
      setValidationError(error)
      return
    }
    const numeric = parseFloat(tempMultiplier)
    setShowroomMultiplier(numeric)
    persistSettings(showroomMode, numeric)
    setShowModal(false)
  }

  if (compact) {
    if (collapsed) {
      return null
    }

    return (
      <Tooltip
        label={t('showroom.tooltip', 'Toggle showroom pricing mode and multiplier')}
        placement="top"
      >
        <HStack spacing={3} align="center">
          <Icon as={Eye} color={showroomMode ? 'green.500' : 'gray.400'} />
          <Switch
            isChecked={showroomMode}
            onChange={toggleMode}
            colorScheme="green"
            size="md"
          />
          <Button variant="ghost" size="sm" onClick={openModal} leftIcon={<Icon as={Settings} />}>
            {showroomMultiplier.toFixed(2)}x
          </Button>
        </HStack>
      </Tooltip>
    )
  }

  return (
    <Box borderWidth="1px" borderRadius="lg" p={4} bg="white" shadow="sm">
      <Stack spacing={3}>
        <HStack justify="space-between">
          <HStack spacing={3}>
            <Icon as={Eye} color={showroomMode ? 'green.500' : 'gray.400'} />
            <Stack spacing={0}>
              <Text fontWeight="semibold">{t('showroom.title', 'Showroom Mode')}</Text>
              <Text fontSize="sm" color="gray.500">
                {t('showroom.subtitle', 'Adjust pricing with a temporary multiplier for customers.')}
              </Text>
            </Stack>
          </HStack>
          <Switch
            isChecked={showroomMode}
            onChange={toggleMode}
            colorScheme="green"
            size="lg"
          />
        </HStack>
        <Text fontSize="sm" color="gray.600">
          {t('showroom.currentMultiplier', 'Current multiplier')}: {showroomMultiplier.toFixed(2)}x
        </Text>
        <Button variant="outline" leftIcon={<Icon as={Settings} />} onClick={openModal} alignSelf="flex-start">
          {t('showroom.configure', 'Configure multiplier')}
        </Button>
      </Stack>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} isCentered size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{t('showroom.modal.title', 'Showroom configuration')}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Alert status="info" borderRadius="md" mb={4}>
              <AlertIcon />
              <Text fontSize="sm">
                {t(
                  'showroom.modal.notice',
                  'Showroom mode applies a pricing multiplier to proposals, PDFs, and orders for customer-facing presentations.',
                )}
              </Text>
            </Alert>
            <FormControl isInvalid={!!validationError}>
              <FormLabel>{t('showroom.modal.multiplierLabel', 'Pricing multiplier')}</FormLabel>
              <Input
                value={tempMultiplier}
                onChange={handleMultiplierChange}
                type="number"
                step="0.01"
                min="0.01"
                max="10"
                placeholder="1.00"
              />
              <FormHelperText>
                {t(
                  'showroom.modal.helper',
                  'Enter a multiplier (e.g., 1.20 for 20% markup or 0.85 for a 15% discount).',
                )}
              </FormHelperText>
              {validationError && (
                <Text fontSize="xs" color="red.500" mt={1}>
                  {validationError}
                </Text>
              )}
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" mr={3} onClick={() => setShowModal(false)}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button colorScheme="brand" onClick={saveMultiplier} isDisabled={!!validationError || !tempMultiplier}>
              {t('common.save', 'Save')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  )
}

export default ShowroomModeToggle
