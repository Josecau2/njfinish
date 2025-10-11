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
  HStack,
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
  ModalCloseButton,
  UnorderedList,
  ListItem,
  useColorModeValue,
} from '@chakra-ui/react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchManufacturerById } from '../../../store/slices/manufacturersSlice'
import { useCreateProposal, useAcceptProposal } from '../../../queries/proposalQueries'
import { useForm, Controller } from 'react-hook-form'
import { Copy, Edit, File, List, MoreHorizontal, Trash, Trash2, Calendar } from 'lucide-react'
import ItemSelectionContent from '../../../components/ItemSelectionContent'
import { ICON_SIZE_MD, ICON_BOX_MD } from '../../../constants/iconSizes'
import FileUploadSection from './FileUploadSection'
import { setSelectVersionNew } from '../../../store/slices/selectVersionNewSlice'
import { validateProposalSubTypeRequirements, getMissingRequirementMessages } from '../../../helpers/subTypeValidation'
import { getContrastColor } from '../../../utils/colorUtils'

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
  const createProposalMutation = useCreateProposal()
  const acceptProposalMutation = useAcceptProposal()
  const alertCancelRef = useRef(null)
  const requestedManufacturerIdsRef = useRef(new Set())
  const [alertState, setAlertState] = useState({ isOpen: false, title: '', body: null, onConfirm: null })
  const customization = useSelector((state) => state.customization) || {}
  const headerBgFallback = useColorModeValue('brand.500', 'brand.400')
  const resolvedHeaderBg = customization.headerBg && customization.headerBg.trim() ? customization.headerBg : headerBgFallback
  const headerTextColor = customization.headerFontColor || getContrastColor(resolvedHeaderBg)

  const showAlert = (title, body, onConfirm) => {
    setAlertState({
      isOpen: true,
      title,
      body,
      onConfirm: typeof onConfirm === 'function' ? onConfirm : null,
    })
  }

  const closeAlert = () => {
    setAlertState((prev) => {
      const callback = prev.onConfirm
      if (callback) {
        setTimeout(() => callback(), 0)
      }
      return { ...prev, isOpen: false, title: '', body: null, onConfirm: null }
    })
  }

  const showMissingRequirementsDialog = (missingRequirements) => {
    const messages = getMissingRequirementMessages(missingRequirements)
    if (!messages.length) return

    showAlert(
      t('proposals.errors.cannotAccept', 'Cannot accept quote'),
      (
        <Box>
          <Text>
            {t(
              'proposals.errors.missingSelectionsIntro',
              'The following items require additional selections:',
            )}
          </Text>
          <UnorderedList mt={2} pl={4} spacing={1}>
            {messages.map((line, idx) => (
              <ListItem key={`${line}-${idx}`}>{line}</ListItem>
            ))}
          </UnorderedList>
          <Text mt={3} fontSize='sm'>
            {t(
              'proposals.errors.completeSelections',
              'Please complete all required selections before accepting the quote.',
            )}
          </Text>
        </Box>
      ),
    )
  }


  const cancelRef = useRef()

  // Color mode values - MUST be before useState
  const borderGray = useColorModeValue("gray.200", "gray.600")
  const textRed = useColorModeValue("red.600", "red.300")

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
  const loggedInUser = JSON.parse(localStorage.getItem('user') || '{}')
  const loggedInUserId = loggedInUser?.userId

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

  const manufacturerIds = useMemo(() => {
    if (!Array.isArray(formData?.manufacturersData)) {
      return []
    }
    const seen = new Set()
    const ids = []
    formData.manufacturersData.forEach((item) => {
      const manufacturerId = item?.manufacturer
      if (!manufacturerId || seen.has(manufacturerId)) return
      seen.add(manufacturerId)
      ids.push(manufacturerId)
    })
    return ids
  }, [formData?.manufacturersData])

  useEffect(() => {
    if (!manufacturerIds.length) {
      requestedManufacturerIdsRef.current.clear()
      return
    }

    manufacturerIds.forEach((manufacturerId) => {
      if (manufacturersById[manufacturerId]) {
        if (requestedManufacturerIdsRef.current.has(manufacturerId)) {
          requestedManufacturerIdsRef.current.delete(manufacturerId)
        }
        return
      }

      if (requestedManufacturerIdsRef.current.has(manufacturerId)) return

      requestedManufacturerIdsRef.current.add(manufacturerId)
      dispatch(fetchManufacturerById({ id: manufacturerId, includeCatalog: false }))
    })
  }, [manufacturerIds, manufacturersById, dispatch])

  const versionDetails = useMemo(() => {
    if (!Array.isArray(formData?.manufacturersData)) {
      return []
    }
    return formData.manufacturersData.map((item) => ({
      ...item,
      manufacturerData: manufacturersById[item.manufacturer],
    }))
  }, [formData?.manufacturersData, manufacturersById])
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

          showMissingRequirementsDialog(validation.missingRequirements)
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

      const createResponse = await createProposalMutation.mutateAsync(createPayload)

      if (!createResponse?.success) {
        throw new Error(createResponse?.message || 'Failed to create quote')
      }

      const newProposalId = createResponse?.data?.id

      if (!newProposalId) {
        throw new Error('Quote created but no ID returned')
      }

      // Step 2: Now accept the newly created proposal using the acceptance API
      const acceptResponse = await acceptProposalMutation.mutateAsync({ id: newProposalId })

      if (acceptResponse?.success) {
        showAlert(
          t('common.success', 'Success'),
          <Text>{t('proposals.success.acceptConverted', 'Quote accepted and converted to order!')}</Text>,
          () => navigate('/orders'),
        )
      } else {
        throw new Error(acceptResponse?.message || 'Failed to accept quote')
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
        showMissingRequirementsDialog(error.response.data.missingRequirements)
      } else {
        showAlert(
          t('common.error', 'Error'),
          <Text>{error.message || t('proposals.errors.acceptFailed', 'Failed to accept quote. Please try again.')}</Text>,
        )
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
      showAlert(
        t('common.error', 'Error'),
        <Text>{t('proposals.create.summary.duplicate', 'Duplicate')}</Text>,
      )
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
      <Box>
        <Flex gap={3}>
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
        </Flex>
        <Box>
          <Box>
            <SimpleGrid columns={{ base: 1, md: 6 }} spacing={4}>
              <FormControl isInvalid={!!errors.designer}>
                <FormLabel htmlFor="designer">{t('proposals.fields.designer', 'Designer')}</FormLabel>
                <Controller
                  name="designer"
                  control={control}
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

          <Box mt={6} overflowX="auto" sx={{ WebkitOverflowScrolling: 'touch' }}>
            <Flex gap={3} flexWrap="nowrap">
                {versionDetails.map((version, index) => {
                  const isSelected = index === selectedVersionIndex
                  return (
                    <Badge
                      key={index}
                      fontSize="sm"
                      bg={isSelected ? 'blue.700' : 'blue.100'}
                      color={isSelected ? 'blue.50' : 'blue.700'}
                      borderRadius="md"
                      transition="all 0.3s ease"
                      cursor="pointer"
                      _hover={{ transform: 'scale(1.05)' }}
                      onClick={() => handleBadgeClick(index, version)}
                      p={2}
                      display="flex"
                      flexShrink={0}
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
                            aria-label={t('common.ariaLabels.moreOptions', 'More options')}
                          />
                          <MenuList
                            minW={{ base: "calc(100vw - 32px)", sm: "120px" }}
                            maxW={{ base: "calc(100vw - 32px)", sm: "320px" }}
                            borderColor={borderGray}
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
                              color={textRed}
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
            </Flex>
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
                <Button variant='outline' colorScheme='gray' onClick={handleSaveOrder} minH="44px">
                  {t('common.save')}
                </Button>
                <Button
                  colorScheme='green'
                  onClick={handleAcceptOrder}
                  isDisabled={isSubmitting}
                  minH="44px"
                >
                  {isSubmitting ? 'Submitting...' : t('proposals.create.summary.acceptAndOrder')}
                </Button>
                <Button variant='outline' colorScheme='red' onClick={handleRejectOrder} minH="44px">
                  {t('proposals.create.summary.rejectAndArchive')}
                </Button>
            </Stack>
        </Box>
      </Box>

      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} size={{ base: 'full', md: 'md' }} scrollBehavior="inside" isCentered>
        <ModalOverlay />
        <ModalContent borderRadius={{ base: '0', md: 'lg' }} overflow="hidden">
          <ModalHeader bg={resolvedHeaderBg} color={headerTextColor}>
            <Text fontSize="lg" fontWeight="semibold">
              {t('proposals.create.summary.editVersionTitle')}
            </Text>
          </ModalHeader>
          <ModalCloseButton aria-label={t('common.ariaLabels.closeModal', 'Close modal')} color={headerTextColor} />
          <ModalBody>
            <Input
              value={editedVersionName}
              onChange={(e) => setEditedVersionName(e.target.value)}
              placeholder={t('proposals.create.manufacturer.labels.versionName')}
            />
          </ModalBody>
          <ModalFooter pt={4} pb={{ base: 8, md: 4 }}>
            <Button variant="ghost" colorScheme="gray" onClick={() => setEditModalOpen(false)} mr={3} minH="44px">
              {t('common.cancel')}
            </Button>
            <Button colorScheme="brand" onClick={saveEditVersionName} minH="44px">
              {t('common.save')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} size={{ base: 'full', md: 'md' }} scrollBehavior="inside" isCentered>
        <ModalOverlay />
        <ModalContent borderRadius={{ base: '0', md: '12px' }} overflow="hidden">
          <ModalHeader bg={resolvedHeaderBg} color={headerTextColor}>
            <Text fontSize="lg" fontWeight="semibold">
              {t('customers.confirmTitle')}
            </Text>
          </ModalHeader>
          <ModalCloseButton aria-label={t('common.ariaLabels.closeModal', 'Close modal')} color={headerTextColor} />
          <ModalBody>{t('proposals.create.summary.confirmDeleteVersion')}</ModalBody>
          <ModalFooter pt={4} pb={{ base: 8, md: 4 }}>
            <Button variant="ghost" colorScheme="gray" onClick={() => setDeleteModalOpen(false)} mr={3} minH="44px">
              {t('common.cancel')}
            </Button>
            <Button colorScheme="red" onClick={confirmDelete} minH="44px">
              {t('common.delete')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <AlertDialog
        isOpen={alertState.isOpen}
        leastDestructiveRef={alertCancelRef}
        onClose={closeAlert}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent borderRadius={{ base: '0', md: '12px' }} overflow="hidden">
            <AlertDialogHeader bg={resolvedHeaderBg} color={headerTextColor}>
              <Text fontSize="lg" fontWeight="semibold">
                {alertState.title}
              </Text>
            </AlertDialogHeader>
            <AlertDialogBody>
              {typeof alertState.body === 'string' ? <Text>{alertState.body}</Text> : alertState.body}
            </AlertDialogBody>
            <AlertDialogFooter pt={4} pb={{ base: 8, md: 4 }}>
              <Button ref={alertCancelRef} colorScheme='brand' onClick={closeAlert} minH="44px">
                {t('common.ok', 'OK')}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      <AlertDialog
        isOpen={isAcceptDialogOpen}
        leastDestructiveRef={cancelRef}
        onClose={() => setIsAcceptDialogOpen(false)}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent borderRadius={{ base: '0', md: '12px' }} overflow="hidden">
            <AlertDialogHeader bg={resolvedHeaderBg} color={headerTextColor}>
              <Text fontSize="lg" fontWeight="semibold">
                {t('proposals.confirm.submitTitle', 'Confirm Quote Submission')}
              </Text>
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

            <AlertDialogFooter pt={4} pb={{ base: 8, md: 4 }}>
              <Button ref={cancelRef} onClick={() => setIsAcceptDialogOpen(false)} variant="outline" colorScheme="gray" minH="44px">
                {t('proposals.confirm.goBack', 'Go Back')}
              </Button>
              <Button colorScheme="green" onClick={confirmAcceptOrder} ml={3} minH="44px">
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





