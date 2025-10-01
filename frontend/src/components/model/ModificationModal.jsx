import React from 'react'
import { useSelector } from 'react-redux'
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
  RadioGroup,
  Radio,
  Stack,
  HStack,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Input,
  Checkbox,
  Text,
} from '@chakra-ui/react'
import { isAdmin } from '../../helpers/permissions'

const ModificationModal = ({
  visible,
  onClose,
  onSave,
  modificationType,
  setModificationType,
  existingModifications,
  selectedExistingMod,
  setSelectedExistingMod,
  existingModQty,
  setExistingModQty,
  existingModNote,
  setExistingModNote,
  customModName,
  setCustomModName,
  customModQty,
  setCustomModQty,
  customModPrice,
  setCustomModPrice,
  customModTaxable,
  setCustomModTaxable,
  customModNote,
  setCustomModNote,
  validationAttempted,
}) => {
  const { t } = useTranslation()
  const authUser = useSelector((state) => state.auth?.user)
  const isUserAdmin = isAdmin(authUser)

  const existingModificationsOptions = Array.isArray(existingModifications)
    ? existingModifications
    : []

  const showExistingValidation = validationAttempted && !selectedExistingMod
  const showCustomNameValidation = validationAttempted && !customModName && modificationType === 'custom'

  const handleExistingQtyChange = (_, valueNumber) => {
    setExistingModQty(Math.max(1, valueNumber))
  }

  const handleCustomQtyChange = (_, valueNumber) => {
    setCustomModQty(Math.max(1, valueNumber))
  }

  return (
    <Modal isOpen={visible} onClose={onClose} size="lg" isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{t('modificationModal.title', 'Modification')}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Stack spacing={6}>
            <FormControl>
              <FormLabel fontWeight="semibold">
                {t('modificationModal.type.ariaLabel', 'Choose modification type')}
              </FormLabel>
              <RadioGroup value={modificationType} onChange={setModificationType}>
                <HStack spacing={6} align="flex-start">
                  <Radio value="existing">
                    <Text fontWeight="medium">
                      {t('modificationModal.type.existing', 'Select existing modification')}
                    </Text>
                  </Radio>
                  <Radio value="custom">
                    <Text fontWeight="medium">
                      {t('modificationModal.type.custom', 'Add custom modification')}
                    </Text>
                  </Radio>
                </HStack>
              </RadioGroup>
            </FormControl>

            {modificationType === 'existing' && (
              <Stack spacing={4}>
                <FormControl isRequired isInvalid={showExistingValidation}>
                  <FormLabel>
                    {t('modificationModal.existing.selectLabel', 'Existing modification')}
                  </FormLabel>
                  <Select
                    placeholder={t('modificationModal.existing.selectPlaceholder', 'Select modification')}
                    value={selectedExistingMod || ''}
                    onChange={(event) => setSelectedExistingMod(event.target.value)}
                  >
                    {existingModificationsOptions.length > 0 ? (
                      existingModificationsOptions.map((mod) => (
                        <option key={mod.id} value={mod.id}>
                          {mod.modificationName}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>
                        {t('modificationModal.existing.noneAvailable', 'No modifications available')}
                      </option>
                    )}
                  </Select>
                  {showExistingValidation && (
                    <FormErrorMessage>
                      {t('modificationModal.existing.validation.codeRequired', 'Modification code is required')}
                    </FormErrorMessage>
                  )}
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>{t('modificationModal.existing.qtyPlaceholder', 'Quantity')}</FormLabel>
                  <NumberInput min={1} value={existingModQty} onChange={handleExistingQtyChange}>
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>

                <FormControl>
                  <FormLabel>{t('modificationModal.existing.notePlaceholder', 'Note (optional)')}</FormLabel>
                  <Input
                    value={existingModNote}
                    onChange={(event) => setExistingModNote(event.target.value)}
                    placeholder={t('modificationModal.existing.notePlaceholder', 'Note (optional)')}
                  />
                  <Text fontSize="xs" color="gray.500" mt={2}>
                    {t(
                      'modificationModal.existing.instructionsHelper',
                      'If needed, provide custom instructions for applying the modification.',
                    )}
                  </Text>
                </FormControl>
              </Stack>
            )}

            {modificationType === 'custom' && (
              <Stack spacing={4}>
                <FormControl isRequired isInvalid={showCustomNameValidation}>
                  <FormLabel>
                    {t('modificationModal.custom.namePlaceholder', 'Modification name')}
                  </FormLabel>
                  <Input
                    value={customModName}
                    onChange={(event) => setCustomModName(event.target.value)}
                    placeholder={t('modificationModal.custom.namePlaceholder', 'Modification name')}
                  />
                  {showCustomNameValidation && (
                    <FormErrorMessage>
                      {t('modificationModal.existing.validation.codeRequired', 'Modification code is required')}
                    </FormErrorMessage>
                  )}
                </FormControl>

                <HStack align="flex-start" spacing={4}>
                  <FormControl isRequired maxW="140px">
                    <FormLabel>{t('modificationModal.custom.qtyPlaceholder', 'Qty')}</FormLabel>
                    <NumberInput min={1} value={customModQty} onChange={handleCustomQtyChange}>
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </FormControl>

                  <FormControl>
                    <FormLabel>{t('modificationModal.custom.pricePlaceholder', 'Price')}</FormLabel>
                    <NumberInput
                      min={0}
                      step={0.01}
                      value={customModPrice}
                      onChange={(_, valueNumber) => setCustomModPrice(Math.max(0, valueNumber))}
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </FormControl>

                  <FormControl pt={8}>
                    <Checkbox
                      isChecked={customModTaxable}
                      onChange={(event) => {
                        if (isUserAdmin) {
                          setCustomModTaxable(event.target.checked)
                        }
                      }}
                      isDisabled={!isUserAdmin}
                    >
                      {t('modificationModal.custom.taxable', 'Taxable')}
                    </Checkbox>
                    {!isUserAdmin && (
                      <Text fontSize="xs" color="gray.500" mt={1}>
                        {t('modificationModal.custom.taxableDisabled', 'Only administrators can change tax status.')}
                      </Text>
                    )}
                  </FormControl>
                </HStack>

                <FormControl>
                  <FormLabel>{t('modificationModal.custom.notePlaceholder', 'Note (optional)')}</FormLabel>
                  <Input
                    value={customModNote}
                    onChange={(event) => setCustomModNote(event.target.value)}
                    placeholder={t('modificationModal.custom.notePlaceholder', 'Note (optional)')}
                  />
                  <Text fontSize="xs" color="gray.500" mt={2}>
                    {t(
                      'modificationModal.custom.instructionsHelper',
                      'If needed, provide custom instructions for applying the modification.',
                    )}
                  </Text>
                </FormControl>
              </Stack>
            )}
          </Stack>
        </ModalBody>
        <ModalFooter>
          <HStack spacing={4}>
            <Button variant="outline" onClick={onClose}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button colorScheme="brand" onClick={onSave}>
              {t('modificationModal.actions.save', 'Save')}
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default ModificationModal
