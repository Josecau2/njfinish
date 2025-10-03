import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Button,
  Flex,
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
  VStack,
  useColorModeValue,
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

  const cardBg = useColorModeValue('surface', 'gray.800')
  const borderColor = useColorModeValue('border', 'gray.600')
  const subtitleColor = useColorModeValue('gray.500', 'gray.400')
  const descriptionColor = useColorModeValue('gray.600', 'gray.400')

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

  // Shared modal (rendered for both compact and full modes)
  const ModalUI = (
    <Modal isOpen={showModal} onClose={() => setShowModal(false)} isCentered size={{ base: 'full', md: 'sm' }} scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{t('showroom.modal.titleExact', 'Showroom Mode Configuration')}</ModalHeader>
        <ModalCloseButton aria-label="Close modal" />
        <ModalBody>
          <Alert status="info" borderRadius="md" mb={4}>
            <AlertIcon />
            <Text fontSize="sm">
              {t(
                'showroom.modal.noticeExact',
                'Showroom Mode applies a pricing multiplier to all proposal calculations, PDF generation, and order snapshots. This is useful for displaying adjusted pricing to customers.',
              )}
            </Text>
          </Alert>

          <FormControl isInvalid={!!validationError} mb={4}>
            <FormLabel>{t('showroom.modal.multiplierLabelExact', 'Pricing Multiplier')}</FormLabel>
            <Input
              value={tempMultiplier}
              onChange={handleMultiplierChange}
              type="number"
              step="0.01"
              min="0.01"
              max="10.0"
              placeholder="1.00"
            />
            <FormHelperText>
              {t(
                'showroom.modal.helperExact',
                'Enter a multiplier (e.g., 1.25 for 25% markup, 0.8 for 20% discount)',
              )}
            </FormHelperText>
            {validationError && (
              <Text fontSize="xs" color={useColorModeValue("red.500","red.300")} mt={1}>
                {validationError}
              </Text>
            )}
          </FormControl>

          <VStack align="start" spacing={4}>
            <HStack>
              <Text fontWeight="semibold">{t('showroom.modal.status', 'Status')}:</Text>
              <Button
                size="sm"
                colorScheme="green"
                variant={showroomMode ? 'solid' : 'outline'}
                onClick={toggleMode}
                px={3}
              >
                {showroomMode ? t('common.on', 'ON') : t('common.off', 'OFF')}
              </Button>
            </HStack>
            <Text fontSize="sm" color={descriptionColor}>
              {showroomMode
                ? t(
                    'showroom.modal.activeText',
                    `Showroom mode is active with ${showroomMultiplier.toFixed(2)}x multiplier`,
                  )
                : t('showroom.modal.inactiveText', 'Showroom mode is inactive')}
            </Text>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" mr={3} onClick={() => setShowModal(false)}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button colorScheme="brand" onClick={saveMultiplier} isDisabled={!!validationError || !tempMultiplier}>
            {t('common.saveChanges', 'Save Changes')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )

  if (compact) {
    if (collapsed) {
      return null
    }

    const tooltipLabel = showroomMode
      ? t(
          'showroom.tooltip.active',
          `Showroom Mode Active (${showroomMultiplier.toFixed(2)}x multiplier) - Click to configure`,
        )
      : t('showroom.tooltip.inactive', 'Showroom Mode Inactive - Click to configure')

    return (
      <>
        <Tooltip label={tooltipLabel} placement="right">
          <Button
            size="sm"
            variant="outline"
            onClick={openModal}
            leftIcon={<Icon as={Eye} color={showroomMode ? 'green.500' : 'currentColor'} />}
            color={showroomMode ? 'green.500' : 'whiteAlpha.800'}
            borderColor={showroomMode ? 'green.500' : 'whiteAlpha.300'}
            flex="1"
            _hover={{
              bg: showroomMode ? 'rgba(34, 197, 94, 0.1)' : 'whiteAlpha.100',
              borderColor: showroomMode ? 'green.600' : 'whiteAlpha.500',
              color: showroomMode ? 'green.400' : 'white'
            }}
            fontSize="xs"
            className="sidebar-footer-pin-btn"
          >
            <Text as="span" fontWeight="medium" className="pin-label">
              {showroomMode ? `${showroomMultiplier.toFixed(2)}x` : t('showroom.compact.label', 'Show')}
            </Text>
          </Button>
        </Tooltip>
        {ModalUI}
      </>
    )
  }

  return (
    <Box borderWidth="1px" borderColor={borderColor} borderRadius="lg" p={4} bg={cardBg} shadow="sm">
      <Stack spacing={4}>
        <HStack justify="space-between">
          <HStack spacing={4}>
            <Icon as={Eye} color={showroomMode ? 'green.500' : 'gray.400'} />
            <Stack spacing={0}>
              <Text fontWeight="semibold">{t('showroom.title', 'Showroom Mode')}</Text>
              <Text fontSize="sm" color={subtitleColor}>
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
        <Text fontSize="sm" color={descriptionColor}>
          {t('showroom.currentMultiplier', 'Current multiplier')}: {showroomMultiplier.toFixed(2)}x
        </Text>
        <Button variant="outline" leftIcon={<Icon as={Settings} />} onClick={openModal} alignSelf="flex-start">
          {t('showroom.configure', 'Configure multiplier')}
        </Button>
      </Stack>

      {ModalUI}
    </Box>
  )
}

export default ShowroomModeToggle
