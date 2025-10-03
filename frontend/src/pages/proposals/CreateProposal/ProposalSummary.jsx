import React, { useEffect, useState, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Badge,
  Box,
  Button,
  Divider,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Select,
  Icon,
  IconButton,
  Input,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  SimpleGrid,
  Stack,
  VStack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useToast,
  useColorModeValue,
} from '@chakra-ui/react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchManufacturerById } from '../../../store/slices/manufacturersSlice'
import { sendFormDataToBackend } from '../../../queries/proposalQueries'
import axiosInstance from '../../../helpers/axiosInstance'
import { useForm, Controller } from 'react-hook-form'
import { Copy, Edit, File, List, MoreHorizontal, Trash, Trash2, Calendar } from 'lucide-react'
import ItemSelectionContent from '../../../components/ItemSelectionContent'
import { ICON_SIZE_MD, ICON_BOX_MD } from '../../../constants/iconSizes'
import FileUploadSection from './FileUploadSection'
import { setSelectVersionNew } from '../../../store/slices/selectVersionNewSlice'
import { validateProposalSubTypeRequirements } from '../../../helpers/subTypeValidation'

const ItemSelectionStep = ({
  setFormData,
  formData,
  updateFormData,
  setCurrentStep,
  setBackStep,
  sendToBackend,
  prevStep,
  hideBack,
}) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const toast = useToast()
  const cancelRef = useRef()

  const statusOptions = [
    { label: t('proposals.status.draft'), value: 'Draft' },
    { label: t('proposals.status.followUp1'), value: 'Follow up 1' },
    { label: t('proposals.status.followUp2'), value: 'Follow up 2' },
    { label: t('proposals.status.followUp3'), value: 'Follow up 3' },
    { label: t('proposals.status.measurementScheduled'), value: 'Measurement Scheduled' },
    { label: t('proposals.status.measurementDone'), value: 'Measurement done' },
    { label: t('proposals.status.designDone'), value: 'Design done' },
    { label: t('proposals.status.proposalAccepted'), value: 'Proposal accepted' },
    { label: t('proposals.status.proposalRejected'), value: 'Proposal rejected' },
  ]

  const [activeTab, setActiveTab] = useState('item')
  const { list: users } = useSelector((state) => state.users)
  const loggedInUser = JSON.parse(localStorage.getItem('user'))
  const loggedInUserId = loggedInUser.userId

  // Check if user is a contractor (should not see manufacturer version names)
  const isContractor = loggedInUser?.group && loggedInUser.group.group_type === 'contractor'

  const manufacturersById = useSelector((state) => state.manufacturers.byId)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [currentEditIndex, setCurrentEditIndex] = useState(null)
  const [currentDeleteIndex, setCurrentDeleteIndex] = useState(null)
  const [editedVersionName, setEditedVersionName] = useState('')
  const [selectedVersionIndex, setSelectedVersionIndex] = useState(null)
  const [selectedVersion, setSelectedVersion] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAcceptDialogOpen, setIsAcceptDialogOpen] = useState(false)
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false)

  // React Hook Form initialization
  const defaultValues = useMemo(
    () => ({
      designer: formData.designer || '',
      description: formData.description || '',
      status: formData.status || 'Draft',
      date: formData.date || '',
      designDate: formData.designDate || '',
      measurementDate: formData.measurementDate || '',
    }),
    [formData],
  )

  const {
    control,
    register,
    handleSubmit: handleFormSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    mode: 'onBlur',
    defaultValues,
    shouldUnregister: false,
  })

  const watchedValues = watch()

  // Sync form values with formData
  useEffect(() => {
    reset(defaultValues)
  }, [defaultValues, reset])

  const handleBadgeClick = (index, version) => {
    setSelectedVersionIndex(index)
    setSelectedVersion(version)
  }

  useEffect(() => {
    // Mirror the currently selected version into Redux only when it changes meaningfully
    if (selectedVersion && typeof selectedVersion === 'object') {
      dispatch(setSelectVersionNew(selectedVersion))
    }
  }, [selectedVersion?.versionName, selectedVersion?.manufacturer, dispatch])

  useEffect(() => {
    formData.manufacturersData?.forEach((item) => {
      if (item.manufacturer) {
        // Don't load full catalog data for proposal summary - only manufacturer info needed
        dispatch(fetchManufacturerById({ id: item.manufacturer, includeCatalog: false }))
      }
    })
  }, [formData.manufacturersData, dispatch])

  const versionDetails = formData?.manufacturersData?.map((item) => ({
    ...item,
    manufacturerData: manufacturersById[item.manufacturer],
  }))
  const selectVersion = versionDetails[selectedVersionIndex]

  useEffect(() => {
    if (versionDetails?.length > 0 && selectedVersionIndex === null) {
      setSelectedVersionIndex(0)
      // Initialize with the first version object, not the whole array
      setSelectedVersion(versionDetails[0])
    }
  }, [versionDetails, selectedVersionIndex])

  const handleSaveOrder = () => {
    sendToBackend('0')
  }

  const handleAcceptOrder = async () => {
    if (isSubmitting) return // Prevent duplicate submissions

    try {
      // First, validate sub-type requirements if there are items and a manufacturer
      if (selectedVersion?.items && selectedVersion.items.length > 0 && formData.manufacturerId) {
        const validation = await validateProposalSubTypeRequirements(
          selectedVersion.items,
          formData.manufacturerId,
        )

        if (!validation.isValid) {
          if (import.meta?.env?.DEV)
            console.warn(
              'Sub-type validation failed in ProposalSummary:',
              validation.missingRequirements,
            )

          const itemsText = validation.missingRequirements
            .map((req) => `${req.item}: ${req.requirements.join(', ')}`)
            .join('\n')

          toast({
            title: t('proposals.errors.cannotAccept', 'Cannot accept quote'),
            description: t('proposals.errors.missingRequirements', 'Missing required selections') + ': ' + itemsText,
            status: 'warning',
            duration: 8000,
            isClosable: true,
            position: 'top',
          })
          return
        }
      }

      // Open confirmation dialog
      setIsAcceptDialogOpen(true)
    } catch (_) {
      setIsSubmitting(false)
    }
  }

  const confirmAcceptOrder = async () => {
    setIsAcceptDialogOpen(false)
    setIsSubmitting(true)

    try {
      // Step 1: First create the proposal (save as draft)
      const createPayload = {
        action: '0', // Save as draft first
        formData: { ...formData, type: '0' },
      }

      const createResponse = await dispatch(sendFormDataToBackend(createPayload))

      if (!createResponse.payload.success) {
        throw new Error(createResponse.payload.message || 'Failed to create quote')
      }

      const newProposalId = createResponse.payload.data?.id

      if (!newProposalId) {
        throw new Error('Quote created but no ID returned')
      }

      // Step 2: Now accept the newly created proposal using the acceptance API
      const acceptResponse = await axiosInstance.post(`/api/proposals/${newProposalId}/accept`, {})

      if (acceptResponse.data.success) {
        toast({
          title: t('common.success', 'Success'),
          description: t('proposals.success.acceptConverted', 'Quote accepted and converted to order!'),
          status: 'success',
          duration: 5000,
          isClosable: true,
          position: 'top',
        })
        // Navigate away to prevent duplicate submissions
        navigate('/orders') // Navigate to orders since it's now an accepted quote
      } else {
        throw new Error(acceptResponse.data.message || 'Failed to accept quote')
      }
    } catch (error) {
      if (import.meta?.env?.DEV)
        console.error('Error in handleAcceptOrder:', {
          error: error.message,
          response: error.response?.data,
          stack: error.stack,
          timestamp: new Date().toISOString(),
        })

      // Check if this is a sub-type validation error from backend
      if (error.response?.status === 400 && error.response?.data?.missingRequirements) {
        const itemsText = error.response.data.missingRequirements
          .map((req) => `${req.item}: ${req.requirements.join(', ')}`)
          .join('\n')

        toast({
          title: t('proposals.errors.cannotAccept', 'Cannot accept quote'),
          description: t('proposals.errors.missingRequirements', 'Missing required selections') + ': ' + itemsText,
          status: 'warning',
          duration: 8000,
          isClosable: true,
          position: 'top',
        })
      } else {
        toast({
          title: t('common.error', 'Error'),
          description: error.message || t('proposals.errors.acceptFailed', 'Failed to accept quote. Please try again.'),
          status: 'error',
          duration: 5000,
          isClosable: true,
          position: 'top',
        })
      }
      setIsSubmitting(false)
    }
  }

  const handleRejectOrder = () => {
    sendToBackend('2')
  }

  const handleTabSelect = (tab) => {
    setActiveTab(tab)
  }

  const openEditModal = (index) => {
    setCurrentEditIndex(index)
    setEditedVersionName(versionDetails[index].versionName)
    setEditModalOpen(true)
  }

  const saveEditVersionName = () => {
    const existingEntry = formData.manufacturersData.find(
      (entry) => entry.versionName === editedVersionName,
    )

    if (existingEntry) {
      toast({
        title: t('common.error', 'Error'),
        description: t('proposals.create.summary.duplicate', 'Duplicate'),
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top',
      })
      return
    }

    const updatedManufacturersData = [...formData.manufacturersData]
    updatedManufacturersData[currentEditIndex].versionName = editedVersionName
    updateFormData({ manufacturersData: updatedManufacturersData })
    setEditModalOpen(false)
  }

  const openDeleteModal = (index) => {
    setCurrentDeleteIndex(index)
    setDeleteModalOpen(true)
  }

  const confirmDelete = () => {
    const updatedManufacturersData = formData.manufacturersData.filter(
      (_, i) => i !== currentDeleteIndex,
    )
    updateFormData({ manufacturersData: updatedManufacturersData })
    setDeleteModalOpen(false)
  }

  const duplicateVersion = (index) => {
    const copy = { ...formData.manufacturersData[index] }
    copy.versionName = `${t('common.copyOf', 'Copy of')} ${copy.versionName}`
    updateFormData({ manufacturersData: [...formData.manufacturersData, copy] })
  }

  const designerOptions = users
    .filter((user) => user.id !== loggedInUserId)
    .map((user) => ({ value: user.id, label: user.name }))

  return (
    <>
      <style>{`
        .proposal-summary-form .btn { min-height: 44px; }
        .proposal-version-badges { overflow-x: auto; -webkit-overflow-scrolling: touch; }
      `}</style>
      <div className="quote-form-mobile">
        <div className="button-group">
          {!hideBack && (
            <Button
              variant="outline"
              colorScheme="gray"
              onClick={prevStep}
              aria-label={t('common.back', 'Back')}
              borderRadius="6px"
              minW="90px"
              minH="44px"
            >
              Back
            </Button>
          )}
        </div>
        <Box className="proposal-summary-form">
          <Box className="form-section">
            <SimpleGrid columns={{ base: 1, md: 6 }} spacing={4}>
              <FormControl isInvalid={!!errors.designer}>
                <FormLabel htmlFor="designer">Designer *</FormLabel>
                <Controller
                  name="designer"
                  control={control}
                  rules={{ required: t('proposals.create.customerInfo.validation.designer') }}
                  render={({ field }) => (
                    <Select
                      {...field}
                      id="designer"
                      placeholder={t('proposals.create.customerInfo.designerPlaceholder', 'Select a designer')}
                      onChange={(e) => {
                        field.onChange(e.target.value)
                        updateFormData({
                          ...formData,
                          designer: e.target.value,
                        })
                      }}
                    >
                      {designerOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  )}
                />
                <FormErrorMessage>{errors.designer?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.description}>
                <FormLabel htmlFor="description">
                  {t('proposals.create.customerInfo.description')} *
                </FormLabel>
                <Input
                  {...register('description', {
                    required: t('proposals.create.customerInfo.validation.description'),
                  })}
                  type="text"
                  id="description"
                  placeholder={t('proposals.create.customerInfo.descriptionPlaceholder')}
                  onChange={(e) => {
                    setValue('description', e.target.value)
                    updateFormData({ ...formData, description: e.target.value })
                  }}
                />
                <FormErrorMessage>{errors.description?.message}</FormErrorMessage>
              </FormControl>

              <FormControl>
                <FormLabel htmlFor="status">{t('proposals.headers.status')}</FormLabel>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      id="status"
                      placeholder={t('proposals.status.selectStatus', 'Select status')}
                      onChange={(e) => {
                        field.onChange(e.target.value)
                        updateFormData({
                          ...formData,
                          status: e.target.value,
                        })
                      }}
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  )}
                />
              </FormControl>

              <FormControl>
                <FormLabel htmlFor="date">{t('proposals.headers.date')}</FormLabel>
                <Input
                  {...register('date')}
                  type="date"
                  id="date"
                  onChange={(e) => {
                    setValue('date', e.target.value)
                    updateFormData({ ...formData, date: e.target.value })
                  }}
                />
              </FormControl>

              <FormControl>
                <FormLabel htmlFor="designDate">
                  {t('proposals.create.customerInfo.designDoneDate')}
                </FormLabel>
                <Input
                  {...register('designDate')}
                  type="date"
                  id="designDate"
                  onChange={(e) => {
                    setValue('designDate', e.target.value)
                    updateFormData({ ...formData, designDate: e.target.value })
                  }}
                />
              </FormControl>

              <FormControl>
                <FormLabel htmlFor="measurementDate">
                  {t('proposals.create.customerInfo.measurementDoneDate')}
                </FormLabel>
                <Input
                  {...register('measurementDate')}
                  type="date"
                  id="measurementDate"
                  onChange={(e) => {
                    setValue('measurementDate', e.target.value)
                    updateFormData({ ...formData, measurementDate: e.target.value })
                  }}
                />
              </FormControl>

            </SimpleGrid>
          </Box>

          <Box className="proposal-version-badges" mt={6}>
                {versionDetails.map((version, index) => {
                  const isSelected = index === selectedVersionIndex
                  return (
                    <Badge
                      key={index}
                      className={`proposal-version-badge p-2 d-flex ${isSelected ? 'selected' : ''}`}
                      fontSize="sm"
                      style={{
                        backgroundColor: isSelected ? '#084298' : '#d0e7ff',
                        color: isSelected ? '#d0e7ff' : '#084298',
                        borderRadius: '5px',
                        transition: 'all 0.3s ease',
                      }}
                      onClick={() => handleBadgeClick(index, version)}
                    >
                      <VStack align="start" spacing={1}>
                        {!isContractor && (
                          <Text fontWeight="bold" display="block">{version.versionName}</Text>
                        )}
                        <Text
                          fontSize="xs"
                          color={isSelected ? 'blue.200' : 'blue.700'}
                        >
                          $ {version.manufacturerData?.costMultiplier || 'N/A'}
                        </Text>
                      </VStack>

                      {!isContractor && (
                        <Menu onClick={(e) => e.stopPropagation()}>
                          <MenuButton
                            as={IconButton}
                            icon={<Icon as={MoreHorizontal} />}
                            variant="ghost"
                            size="sm"
                            color={isSelected ? 'blue.200' : 'blue.700'}
                            _hover={{ bg: isSelected ? 'blue.700' : 'blue.50' }}
                            aria-label="More options"
                          />
                          <MenuList
                            minW="120px"
                            borderColor={useColorModeValue("gray.200","gray.600")}
                            boxShadow="md"
                            borderRadius="md"
                            py={1}
                          >
                            <MenuItem
                              onClick={() => openEditModal(index)}
                              py={2}
                              px={3}
                              fontSize="sm"
                              icon={<Icon as={Edit} />}
                            >
                              {t('common.edit')}
                            </MenuItem>
                            <MenuItem
                              onClick={() => openDeleteModal(index)}
                              py={2}
                              px={3}
                              fontSize="sm"
                              color={useColorModeValue("red.600","red.300")}
                              icon={<Icon as={Trash} />}
                            >
                              {t('common.delete')}
                            </MenuItem>
                            <MenuItem
                              onClick={() => duplicateVersion(index)}
                              py={2}
                              px={3}
                              fontSize="sm"
                              icon={<Icon as={Copy} />}
                            >
                              {t('proposals.create.summary.duplicate')}
                            </MenuItem>
                          </MenuList>
                        </Menu>
                      )}
                    </Badge>
                  )
                })}
              </Box>
              <Divider my={6} />

              <Tabs
                index={activeTab === 'file' ? 1 : 0}
                onChange={(index) => handleTabSelect(index === 1 ? 'file' : 'item')}
                colorScheme='brand'
                variant='enclosed'
              >
                <TabList>
                  <Tab>
                    <Flex align='center' gap={4}>
                      <Icon as={List} boxSize={ICON_BOX_MD} />
                      <Text>{t('proposalColumns.items')}</Text>
                    </Flex>
                  </Tab>
                  <Tab>
                    <Flex align='center' gap={4}>
                      <Icon as={File} boxSize={ICON_BOX_MD} />
                      <Text>{t('proposals.create.files.title')}</Text>
                    </Flex>
                  </Tab>
                </TabList>
                <TabPanels>
                  <TabPanel px={0}>
                    <ItemSelectionContent
                      selectedVersion={selectedVersion}
                      formData={formData}
                      setFormData={setFormData}
                      setSelectedVersion={setSelectedVersion}
                      selectVersion={selectVersion}
                    />
                  </TabPanel>
                  <TabPanel px={0}>
                    <Stack spacing={4} mt={2} color='gray.600'>
                      <Text fontSize='lg' fontWeight='semibold' color='gray.800'>
                        {t('proposals.create.files.title')}
                      </Text>
                      <Text>{t('proposals.create.files.subtitle')}</Text>
                      <FileUploadSection
                        proposalId={formData.id}
                        onFilesChange={(files) => updateFormData({ ...formData, files })}
                      />
                    </Stack>
                  </TabPanel>
                </TabPanels>
              </Tabs>

              <Divider my={6} />
              <Stack
                direction={{ base: 'column', md: 'row' }}
                spacing={4}
                justify='flex-start'
                align={{ base: 'stretch', md: 'center' }}
              >
                <Button variant='outline' colorScheme='gray' onClick={handleSaveOrder}>
                  {t('common.save')}
                </Button>
                <Button
                  colorScheme='green'
                  onClick={handleAcceptOrder}
                  isDisabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : t('proposals.create.summary.acceptAndOrder')}
                </Button>
                <Button variant='outline' colorScheme='red' onClick={handleRejectOrder}>
                  {t('proposals.create.summary.rejectAndArchive')}
                </Button>
            </Stack>
        </Box>
      </div>

      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} size={{ base: 'full', md: 'md' }} scrollBehavior="inside" isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{t('proposals.create.summary.editVersionTitle')}</ModalHeader>
          <ModalBody>
            <Input
              value={editedVersionName}
              onChange={(e) => setEditedVersionName(e.target.value)}
              placeholder={t('proposals.create.manufacturer.labels.versionName')}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" colorScheme="gray" onClick={() => setEditModalOpen(false)} mr={3}>
              {t('common.cancel')}
            </Button>
            <Button colorScheme="brand" onClick={saveEditVersionName}>
              {t('common.save')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} size={{ base: 'full', md: 'md' }} scrollBehavior="inside" isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{t('customers.confirmTitle')}</ModalHeader>
          <ModalBody>{t('proposals.create.summary.confirmDeleteVersion')}</ModalBody>
          <ModalFooter>
            <Button variant="ghost" colorScheme="gray" onClick={() => setDeleteModalOpen(false)} mr={3}>
              {t('common.cancel')}
            </Button>
            <Button colorScheme="red" onClick={confirmDelete}>
              {t('common.delete')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <AlertDialog
        isOpen={isAcceptDialogOpen}
        leastDestructiveRef={cancelRef}
        onClose={() => setIsAcceptDialogOpen(false)}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              {t('proposals.confirm.submitTitle', 'Confirm Quote Submission')}
            </AlertDialogHeader>

            <AlertDialogBody>
              <VStack align="start" spacing={3}>
                <Text>
                  {t('proposals.confirm.submitText', 'Once you submit this quote, it will be sent to production and cannot be changed.')}
                </Text>
                <Text>
                  {t('proposals.confirm.submitWarning', 'By continuing, you confirm that all details are correct and you accept the Terms & Conditions.')}
                </Text>
              </VStack>
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={() => setIsAcceptDialogOpen(false)} variant="outline" colorScheme="gray">
                {t('proposals.confirm.goBack', 'Go Back')}
              </Button>
              <Button colorScheme="green" onClick={confirmAcceptOrder} ml={3}>
                {t('proposals.confirm.submitConfirm', 'Accept and Submit')}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  )
}

export default ItemSelectionStep







