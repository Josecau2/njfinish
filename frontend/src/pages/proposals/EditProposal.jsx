import StandardCard from '../../components/StandardCard'
import PageContainer from '../../components/PageContainer'
import PageHeader from '../../components/PageHeader'
import { useEffect, useState, useRef, useMemo, lazy, Suspense } from 'react'
import { useParams } from 'react-router-dom'
import { decodeParam } from '../../utils/obfuscate'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  CardBody,
  CloseButton,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Icon,
  Input,
  Link,
  ListItem,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  SimpleGrid,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  UnorderedList,
  VStack,
  useToast,
  useColorModeValue,
} from '@chakra-ui/react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchManufacturerById } from '../../store/slices/manufacturersSlice'
import { setSelectVersionNewEdit } from '../../store/slices/selectVersionNewEditSlice'
import { sendFormDataToBackend } from '../../queries/proposalQueries'
// Removed Formik and Yup - using React Hook Form pattern
// Removed react-select/creatable - using Chakra Select
// Removed react-datepicker - using native HTML5 date inputs
import {
  Copy,
  File,
  List,
  MoreHorizontal,
  Edit,
  Trash,
  Trash2,
  Calendar,
  Printer,
  Mail,
  FileText,
  CheckCircle,
} from 'lucide-react'
// Removed react-icons - using lucide-react only
// Removed Swal - using Chakra useToast
import ItemSelectionContentEdit from '../../components/ItemSelectionContentEdit'
import FileUploadSection from './CreateProposal/FileUploadSection'
import Loader from '../../components/Loader'
import axiosInstance from '../../helpers/axiosInstance'
import {
  validateProposalSubTypeRequirements,
  getMissingRequirementMessages
} from '../../helpers/subTypeValidation'

const PrintProposalModal = lazy(() => import('../../components/model/PrintProposalModal'))
const EmailProposalModal = lazy(() => import('../../components/model/EmailProposalModal'))
const EmailContractModal = lazy(() => import('../../components/model/EmailContractModal'))

// Removed Yup validation schema - using simple form validation

const statusOptions = [
  { label: 'Draft', value: 'Draft' },
  { label: 'Follow up 1', value: 'Follow up 1' },
  { label: 'Follow up 2', value: 'Follow up 2' },
  { label: 'Follow up 3', value: 'Follow up 3' },
  { label: 'Measurement Scheduled', value: 'Measurement Scheduled' },
  { label: 'Measurement done', value: 'Measurement done' },
  { label: 'Design done', value: 'Design done' },
  { label: 'Quote done', value: 'Proposal done' },
  { label: 'Quote accepted', value: 'Proposal accepted' },
  { label: 'Quote rejected', value: 'Proposal rejected' },
]

const EditProposal = ({
  isContractor: scopedIsContractor,
  contractorGroupId,
  contractorModules,
  contractorGroupName,
} = {}) => {
  const { id } = useParams()
  const decodedId = decodeParam(id)
  const numericId = Number(decodedId)
  const requestId = Number.isFinite(numericId) ? numericId : decodedId
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const toast = useToast()

  // Dark mode colors - MUST be before any useState hooks
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const textColor = useColorModeValue('gray.500', 'gray.400')
  const labelColor = useColorModeValue('gray.600', 'gray.400')
  const deleteColor = useColorModeValue('red.500', 'red.300')
  const pageBg = useColorModeValue('gray.50', 'gray.900')
  const badgeBgSelected = useColorModeValue('blue.600', 'blue.500')
  const badgeBgUnselected = useColorModeValue('blue.100', 'blue.900')
  const badgeColorSelected = useColorModeValue('white', 'white')
  const badgeColorUnselected = useColorModeValue('blue.600', 'blue.200')
  const toastBgWarning = useColorModeValue('yellow.50', 'yellow.900')
  const toastBorderWarning = useColorModeValue('yellow.200', 'yellow.700')
  const toastColorWarning = useColorModeValue('yellow.900', 'yellow.100')

  const showMissingRequirementsToast = (missingRequirements) => {
    const messages = getMissingRequirementMessages(missingRequirements)
    if (!messages.length) return

    toast.closeAll()

    toast({
      duration: 10000,
      isClosable: true,
      position: 'top',
      render: ({ onClose }) => (
        <Alert
          status='warning'
          variant='left-accent'
          borderRadius='md'
          bg={toastBgWarning}
          color={toastColorWarning}
          borderColor={toastBorderWarning}
          boxShadow='lg'
          alignItems='flex-start'
          px={4}
          py={5}
          position='relative'
        >
          <AlertIcon />
          <Box ml={3} flex={1}>
            <Text fontWeight='bold'>
              {t('proposals.errors.cannotAccept', 'Cannot accept quote')}
            </Text>
            <Text mt={2}>
              {t(
                'proposals.errors.missingSelectionsIntro',
                'The following items require additional selections:'
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
                'Please complete all required selections before accepting the quote.'
              )}
            </Text>
          </Box>
          <CloseButton
            position='absolute'
            right={2}
            top={2}
            onClick={onClose}
            aria-label={t('common.close', 'Close')}
          />
        </Alert>
      ),
    })
  }

  // Get user info from store/localStorage
  const storedUserJson = useMemo(() => localStorage.getItem('user'), [])
  const parsedStoredUser = useMemo(() => {
    if (!storedUserJson) return null
    try {
      return JSON.parse(storedUserJson)
    } catch (error) {
      if (import.meta?.env?.DEV) console.error('Failed to parse stored user JSON:', error)
      return null
    }
  }, [storedUserJson])
  const userInfo = useMemo(() => parsedStoredUser || {}, [parsedStoredUser])
  const isAdmin = userInfo.role === 'Admin' || userInfo.role === 'admin'
  const [initialData, setInitialData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('item')
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [currentEditIndex, setCurrentEditIndex] = useState(null)
  const [currentDeleteIndex, setCurrentDeleteIndex] = useState(null)
  const [editedVersionName, setEditedVersionName] = useState('')
  const [selectedVersionIndex, setSelectedVersionIndex] = useState(null)
  const [selectedVersion, setSelectedVersion] = useState(null)
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [showContractModal, setShowContractModal] = useState(false)
  const [hovered, setHovered] = useState(null)
  const [designerOptions, setDesignerOptions] = useState([])
  const [isCreatingDesigner, setIsCreatingDesigner] = useState(false)
  const [isCreatingStatus, setIsCreatingStatus] = useState(false)
  const [customDesignerInput, setCustomDesignerInput] = useState('')
  const [customStatusInput, setCustomStatusInput] = useState('')
  // Use manufacturers map from Redux so we can attach full manufacturer data
  const manufacturersByIdMap = useSelector((state) => state.manufacturers.byId)
  const loggedInUser = parsedStoredUser
  const loggedInUserId = loggedInUser?.userId
  const hasSetInitialVersion = useRef(false)
  const requestedManufacturerIdsRef = useRef(new Set())

  // Check if user is a contractor (should not see manufacturer version names)
  const isContractor =
    scopedIsContractor ?? (loggedInUser?.group && loggedInUser.group.group_type === 'contractor')

  const defaultFormData = {
    manufacturersData: [],
    designer: '',
    description: '',
    date: null,
    designDate: null,
    measurementDate: null,
    // followUp1Date: null,
    // followUp2Date: null,
    // followUp3Date: null,
    status: 'Draft',
    files: [],
    customerName: '', // Added to match validationSchema
  }

  const [formData, setFormData] = useState(defaultFormData)
  // Determine if form should be disabled (locked quote OR contractor viewing accepted quote)
  const isAccepted = formData?.status === 'Proposal accepted' || formData?.status === 'accepted'
  const isFormDisabled = !!formData?.is_locked || (isAccepted && !isAdmin)

  // Debug logging to see current state
  if (import.meta?.env?.DEV) {
    console.log('🔍 EditProposal Debug:', {
      'formData.is_locked': formData?.is_locked,
      'formData.status': formData?.status,
      userRole: userInfo?.role,
      isAdmin: isAdmin,
      isFormDisabled: isFormDisabled,
      proposal_id: formData?.id,
    })
  }
  // Parse manufacturersData if it's a string
  const parseManufacturersData = (data) => {
    if (!data) return []
    if (Array.isArray(data)) return data
    if (typeof data === 'string') {
      try {
        const parsed = JSON.parse(data)
        if (Array.isArray(parsed)) return parsed
        if (typeof parsed === 'object' && Array.isArray(parsed.manufacturersData)) {
          return parsed.manufacturersData
        }
        return []
      } catch (e) {
        console.error('Failed to parse manufacturersData:', e)
        return []
      }
    }
    if (typeof data === 'object' && Array.isArray(data.manufacturersData)) {
      return data.manufacturersData
    }
    return []
  }

  // Fetch initial data
  useEffect(() => {
    axiosInstance
      .get(`/api/quotes/proposalByID/${requestId}`)
      .then((res) => {
        // Parse manufacturersData immediately upon load to ensure it's always an array
        const loadedData = res.data || defaultFormData
        if (loadedData.manufacturersData) {
          loadedData.manufacturersData = parseManufacturersData(loadedData.manufacturersData)
        }
        setInitialData(loadedData)
        setFormData(loadedData)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Error fetching quote:', err)
        setLoading(false)
      })
  }, [requestId])

  // Fetch designers
  useEffect(() => {
    const fetchDesigners = async () => {
      try {
        const response = await axiosInstance.get('/api/designers')
        const designerData = response.data.users.map((designer) => ({
          value: designer.id,
          label: designer.name,
        }))
        setDesignerOptions(designerData)
      } catch (error) {
        console.error('Error fetching designers:', error)
      }
    }
    fetchDesigners()
  }, [])

  // Update formData when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData(initialData)
    }
  }, [initialData])

  const versionDetails = useMemo(() => {
    if (!Array.isArray(formData?.manufacturersData)) {
      return []
    }
    return formData.manufacturersData.map((item) => ({
      ...item,
      manufacturerData: manufacturersByIdMap[item.manufacturer],
    }))
  }, [formData?.manufacturersData, manufacturersByIdMap])
  // Fetch manufacturers data while avoiding duplicate network requests
  useEffect(() => {
    if (!Array.isArray(formData?.manufacturersData) || formData.manufacturersData.length === 0) {
      return
    }

    if (selectedVersionIndex === null) {
      setSelectedVersionIndex(0)
    }

    formData.manufacturersData.forEach((item) => {
      const manufacturerId = item?.manufacturer
      if (!manufacturerId) return

      if (manufacturersByIdMap[manufacturerId]) {
        if (requestedManufacturerIdsRef.current.has(manufacturerId)) {
          requestedManufacturerIdsRef.current.delete(manufacturerId)
        }
        return
      }

      if (requestedManufacturerIdsRef.current.has(manufacturerId)) return

      requestedManufacturerIdsRef.current.add(manufacturerId)
      dispatch(fetchManufacturerById({ id: manufacturerId, includeCatalog: false }))
    })
  }, [formData?.manufacturersData, manufacturersByIdMap, dispatch, selectedVersionIndex])

  useEffect(() => {
    if (!versionDetails.length) {
      hasSetInitialVersion.current = false
      return
    }

    if (selectedVersionIndex === null && !hasSetInitialVersion.current) {
      setSelectedVersionIndex(0)
      hasSetInitialVersion.current = true
    } else if (selectedVersionIndex !== null && selectedVersionIndex >= versionDetails.length) {
      setSelectedVersionIndex(0)
    }
  }, [selectedVersionIndex, versionDetails])

  useEffect(() => {
    if (!versionDetails.length) {
      setSelectedVersion(null)
      return
    }

    const targetIndex = selectedVersionIndex ?? 0
    const next = versionDetails[targetIndex] ?? versionDetails[0]
    if (!next) return

    const selectedManufacturerId = selectedVersion?.manufacturerData?.id
    const nextManufacturerId = next.manufacturerData?.id

    if (
      !selectedVersion ||
      selectedVersion.versionName !== next.versionName ||
      selectedVersion.manufacturer !== next.manufacturer ||
      selectedManufacturerId !== nextManufacturerId
    ) {
      setSelectedVersion(next)
      dispatch(setSelectVersionNewEdit(next))
    }
  }, [versionDetails, selectedVersionIndex, selectedVersion, dispatch])

  // Update selected version in Redux
  useEffect(() => {
    if (selectedVersion) {
      dispatch(setSelectVersionNewEdit(selectedVersion))
    }
  }, [selectedVersion, dispatch])

  const updateFormData = (updatedFields) => {
    setFormData((prev) => ({
      ...prev,
      ...updatedFields,
    }))
  }

  const handleBadgeClick = (index, version) => {
    setSelectedVersionIndex(index)
    setSelectedVersion(version)
    dispatch(setSelectVersionNewEdit(version))
  }

  const handleTabSelect = (tabName) => {
    setActiveTab(tabName)
  }

  const openEditModal = (index) => {
    setCurrentEditIndex(index)
    setEditedVersionName(versionDetails[index].versionName)
    setEditModalOpen(true)
  }

  const saveEditVersionName = () => {
    const existingEntry = formData.manufacturersData.find(
      (entry, idx) => entry.versionName === editedVersionName && idx !== currentEditIndex,
    )
    if (existingEntry) {
      toast({
        title: t('common.error', 'Error'),
        description: t(
          'proposals.errors.duplicateVersionName',
          `Manufacturer Version "${editedVersionName}" already exists.`,
        ),
        status: 'error',
        duration: 5000,
        isClosable: true,
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
    const updatedManufacturersData = formData.manufacturersData.filter((_, i) => i !== currentDeleteIndex)
    updateFormData({ manufacturersData: updatedManufacturersData })

    if (currentDeleteIndex === selectedVersionIndex) {
      setSelectedVersionIndex(null)
      setSelectedVersion(null)
    } else if (currentDeleteIndex < selectedVersionIndex) {
      setSelectedVersionIndex(selectedVersionIndex - 1)
    }

    setDeleteModalOpen(false)
  }

  const duplicateVersion = (index) => {
    const copy = { ...formData.manufacturersData[index] }
    copy.versionName = `Copy of ${copy.versionName}`
    updateFormData({ manufacturersData: [...formData.manufacturersData, copy] })
  }

  const selectVersion = selectedVersion ?? (versionDetails[selectedVersionIndex] || null)

  const validateForm = () => {
    const errors = []

    // Designer is optional

    if (!formData.description || formData.description.trim() === '') {
      errors.push(t('proposals.validation.descriptionRequired', 'Description is required'))
    }

    return errors
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    // Validate form
    const errors = validateForm()
    if (errors.length > 0) {
      toast({
        title: t('common.validationError', 'Validation Error'),
        description: errors.join('. '),
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      return
    }

    sendToBackend(formData, 'update')
  }

  const handleSaveOrder = () => sendToBackend({ ...formData }, 'update')
  const handleAcceptOrder = async () => {
    if (!formData?.id) {
      toast({
        title: t('common.error', 'Error'),
        description: t('proposals.errors.noId', 'Quote ID not found'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      return
    }
    sendToBackend({ ...formData, status: 'Proposal accepted' }, 'accept')
  }
  const handleRejectOrder = () =>
    sendToBackend({ ...formData, status: 'Proposal rejected' }, 'reject')

  const sendToBackend = async (finalData, action = 'update') => {
    try {
      const payload = { action, formData: finalData }

      // Add validation checks
      if (!finalData.id) {
        if (import.meta?.env?.DEV) console.error('No quote ID found')
        toast({
          title: t('common.error', 'Error'),
          description: t('proposals.errors.noId', 'Quote ID not found'),
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
        return
      }

      // Validate sub-type requirements for acceptance
      if (action === 'accept' && finalData.manufacturerId && selectedVersion?.items) {
        const validation = await validateProposalSubTypeRequirements(
          selectedVersion.items,
          finalData.manufacturerId,
        )

        if (!validation.isValid) {
          if (import.meta?.env?.DEV)
            console.warn(
              'Sub-type validation failed in sendToBackend:',
              validation.missingRequirements,
            )
          showMissingRequirementsToast(validation.missingRequirements)
          return
        }
      }

      const response = await sendFormDataToBackend(payload)

      if (response.data.success) {
        const savedPayload = { ...(response.data?.data || finalData) }
        if (savedPayload.manufacturersData) {
          savedPayload.manufacturersData = parseManufacturersData(savedPayload.manufacturersData)
        }

        if (action === 'reject') {
          toast({
            title: t('common.success', 'Success'),
            description: t('proposals.toast.rejectSuccess', 'Quote rejected successfully!'),
            status: 'success',
            duration: 5000,
            isClosable: true,
          })
        } else {
          if (import.meta?.env?.DEV) console.log('Quote updated successfully')
          toast({
            title: t('common.success', 'Success'),
            description: t('proposals.toast.updateSuccess', 'Quote updated successfully!'),
            status: 'success',
            duration: 5000,
            isClosable: true,
          })
        }

        setFormData(savedPayload)
        setInitialData(savedPayload)
      } else {
        const apiMsg = response.data?.message
        toast({
          title: t('common.error', 'Error'),
          description: apiMsg || t('proposals.errors.operationFailed', 'Operation failed'),
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
      }
    } catch (error) {
      // More specific error handling
      if (error.response?.status === 403) {
        toast({
          title: t('common.error', 'Error'),
          description: t('proposals.toast.errorGeneric', 'An error occurred'),
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
      } else if (error.response?.status === 400) {
        // Check if this is a sub-type validation error from backend
        if (error.response?.data?.missingRequirements) {
          showMissingRequirementsToast(error.response.data.missingRequirements)
        } else {
          const message =
            error.response?.data?.message || t('proposals.toast.errorGeneric', 'An error occurred')
          // If backend returned a descriptive missing-selections string, show as warning for clarity
          const isMissingMsg = /(missing|required selections|is missing)/i.test(message)
          toast({
            title: isMissingMsg
              ? t('proposals.errors.cannotAccept', 'Cannot accept quote')
              : t('common.error', 'Error'),
            description: message,
            status: isMissingMsg ? 'warning' : 'error',
            duration: 5000,
            isClosable: true,
          })
        }
      } else {
        toast({
          title: t('common.error', 'Error'),
          description: error.message || t('proposals.toast.errorGeneric', 'An error occurred'),
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
      }
    }
  }

  if (loading) {
    return <Loader />
  }

  return (
    <>
      <PageContainer maxW="100%" px={{ base: 3, md: 4 }} bg={pageBg} minH="100vh">
        <PageHeader
          title={t('proposals.edit.title', 'Edit Quote')}
          subtitle={formData?.customer?.name ? `${t('common.customer', 'Customer')}: ${formData.customer.name}` : t('proposals.edit.subtitle', 'Update proposal details')}
          icon={Edit}
          actions={[
            <Button
              key="print"
              colorScheme="green"
              leftIcon={<Icon as={Printer} />}
              onClick={() => setShowPrintModal(true)}
              size="sm"
              minH="44px"
              maxW={{ base: '180px', md: 'none' }}
              fontSize={{ base: 'sm', md: 'md' }}
            >
              {t('proposals.create.actions.print', 'Print Quote')}
            </Button>,
            ...(!(loggedInUser?.group && loggedInUser.group.group_type === 'contractor') ? [
              <Button
                key="email"
                colorScheme="cyan"
                leftIcon={<Icon as={Mail} />}
                onClick={() => setShowEmailModal(true)}
                size="sm"
                minH="44px"
                maxW={{ base: '180px', md: 'none' }}
                fontSize={{ base: 'sm', md: 'md' }}
              >
                {t('proposals.create.actions.email', 'Email Quote')}
              </Button>,
              <Button
                key="contract"
                colorScheme="yellow"
                leftIcon={<Icon as={FileText} />}
                onClick={() => setShowContractModal(true)}
                size="sm"
                minH="44px"
                maxW={{ base: '180px', md: 'none' }}
                fontSize={{ base: 'sm', md: 'md' }}
              >
                {t('proposals.create.actions.contract', 'Email Contract')}
              </Button>,
            ] : []),
          ]}
        >
          {(formData?.status === 'Proposal accepted' || formData?.status === 'accepted') && (
            <Badge colorScheme="green" px={2} py={1}>
              {t('proposals.lockedStatus.title')}
            </Badge>
          )}
          {formData?.is_locked && (
            <Badge colorScheme="gray" px={2} py={1} ml={2}>
              {t('common.locked', 'Locked')}
            </Badge>
          )}
        </PageHeader>

        <Box as="form" onSubmit={handleSubmit}>
          {/* Basic Information Card */}
          <StandardCard mb={4}>
            <CardBody p={{ base: 3, md: 4 }}>
              <Text fontSize="lg" fontWeight="medium" mb={4}>
                Basic Information
              </Text>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                <FormControl>
                  <FormLabel htmlFor="designer">{t('common.designer', 'Designer')}</FormLabel>
                  {isCreatingDesigner ? (
                    <HStack>
                      <Input
                        autoFocus
                        value={customDesignerInput}
                        onChange={(e) => setCustomDesignerInput(e.target.value)}
                        placeholder={t('common.enterDesignerName', 'Enter designer name')}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && customDesignerInput.trim()) {
                            updateFormData({ designer: customDesignerInput.trim() })
                            setIsCreatingDesigner(false)
                            setCustomDesignerInput('')
                          } else if (e.key === 'Escape') {
                            setIsCreatingDesigner(false)
                            setCustomDesignerInput('')
                          }
                        }}
                        isDisabled={isFormDisabled}
                      />
                      <Button
                        size="sm"
                        onClick={() => {
                          if (customDesignerInput.trim()) {
                            updateFormData({ designer: customDesignerInput.trim() })
                            setIsCreatingDesigner(false)
                            setCustomDesignerInput('')
                          }
                        }}
                        isDisabled={isFormDisabled}
                      >
                        {t('common.add', 'Add')}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setIsCreatingDesigner(false)
                          setCustomDesignerInput('')
                        }}
                        isDisabled={isFormDisabled}
                      >
                        {t('common.cancel', 'Cancel')}
                      </Button>
                    </HStack>
                  ) : (
                    <HStack>
                      <Select
                        id="designer"
                        name="designer"
                        value={formData.designer ?? ''}
                        onChange={(e) => {
                          if (e.target.value === '__create__') {
                            setIsCreatingDesigner(true)
                          } else {
                            updateFormData({ designer: e.target.value })
                          }
                        }}
                        placeholder={t('common.selectDesigner', 'Select Designer')}
                        isDisabled={isFormDisabled}
                        flex="1"
                      >
                        {designerOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                        <option value="__create__">{t('common.createNew', '+ Create New...')}</option>
                      </Select>
                      {formData.designer && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => updateFormData({ designer: '' })}
                          isDisabled={isFormDisabled}
                        >
                          {t('common.clear', 'Clear')}
                        </Button>
                      )}
                    </HStack>
                  )}
                </FormControl>
                <FormControl>
                  <FormLabel htmlFor="description">
                    {t('common.description', 'Description')} *
                  </FormLabel>
                  <Input
                    type="text"
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={(e) => updateFormData({ description: e.target.value })}
                    placeholder={t('common.description', 'Description')}
                    autoComplete="off"
                    isDisabled={isFormDisabled}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel htmlFor="status">{t('common.status', 'Status')}</FormLabel>
                  {isCreatingStatus ? (
                    <HStack>
                      <Input
                        autoFocus
                        value={customStatusInput}
                        onChange={(e) => setCustomStatusInput(e.target.value)}
                        placeholder={t('common.enterStatusName', 'Enter status name')}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && customStatusInput.trim()) {
                            updateFormData({ status: customStatusInput.trim() })
                            setIsCreatingStatus(false)
                            setCustomStatusInput('')
                          } else if (e.key === 'Escape') {
                            setIsCreatingStatus(false)
                            setCustomStatusInput('')
                          }
                        }}
                        isDisabled={isFormDisabled}
                      />
                      <Button
                        size="sm"
                        onClick={() => {
                          if (customStatusInput.trim()) {
                            updateFormData({ status: customStatusInput.trim() })
                            setIsCreatingStatus(false)
                            setCustomStatusInput('')
                          }
                        }}
                        isDisabled={isFormDisabled}
                      >
                        {t('common.add', 'Add')}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setIsCreatingStatus(false)
                          setCustomStatusInput('')
                        }}
                        isDisabled={isFormDisabled}
                      >
                        {t('common.cancel', 'Cancel')}
                      </Button>
                    </HStack>
                  ) : (
                    <HStack>
                      <Select
                        id="status"
                        name="status"
                        value={formData.status || 'Draft'}
                        onChange={(e) => {
                          if (e.target.value === '__create__') {
                            setIsCreatingStatus(true)
                          } else {
                            updateFormData({ status: e.target.value })
                          }
                        }}
                        isDisabled={isFormDisabled}
                        flex="1"
                      >
                        {statusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                        <option value="__create__">{t('common.createNew', '+ Create New...')}</option>
                      </Select>
                      {formData.status && formData.status !== 'Draft' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => updateFormData({ status: 'Draft' })}
                          isDisabled={isFormDisabled}
                        >
                          {t('common.clear', 'Clear')}
                        </Button>
                      )}
                    </HStack>
                  )}
                </FormControl>
              </SimpleGrid>
            </CardBody>
          </StandardCard>

          {/* Dates Card */}
          <StandardCard mb={4}>
            <CardBody p={{ base: 3, md: 4 }}>
              <Text fontSize="lg" fontWeight="medium" mb={4}>
                Important Dates
              </Text>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                <FormControl>
                  <FormLabel htmlFor="date">{t('proposals.fields.date', 'Date')}</FormLabel>
                  <Input
                    type="date"
                    id="date"
                    value={formData.date ? new Date(formData.date).toISOString().split('T')[0] : ''}
                    onChange={(e) => updateFormData({ date: e.target.value })}
                    isDisabled={isFormDisabled}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel htmlFor="designDate">
                    {t('common.designDate', 'Design Date')}
                  </FormLabel>
                  <Input
                    type="date"
                    id="designDate"
                    value={
                      formData.designDate
                        ? new Date(formData.designDate).toISOString().split('T')[0]
                        : ''
                    }
                    onChange={(e) => updateFormData({ designDate: e.target.value })}
                    isDisabled={isFormDisabled}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel htmlFor="measurementDate">
                    {t('common.measurementDate', 'Measurement Date')}
                  </FormLabel>
                  <Input
                    type="date"
                    id="measurementDate"
                    value={
                      formData.measurementDate
                        ? new Date(formData.measurementDate).toISOString().split('T')[0]
                        : ''
                    }
                    onChange={(e) => updateFormData({ measurementDate: e.target.value })}
                    isDisabled={isFormDisabled}
                  />
                </FormControl>
              </SimpleGrid>
              {/* Follow up dates commented out
                    {!isContractor && (
                      <Flex>
                        <Box xs={12} md={6} lg={4}>
                          <FormLabel htmlFor="followUp1Date">{t('proposals.status.followUp1Date', 'followUp1Date')} {t('proposals.headers.date')}</FormLabel>
                            <Input
                              type="date"
                              id="followUp1Date"
                              value={formData.followUp1Date ? new Date(formData.followUp1Date).toISOString().split('T')[0] : ''}
                              onChange={(e) => updateFormData({ followUp1Date: e.target.value })}
                              isDisabled={isFormDisabled}
                            />
                        </Box>
                        <Box xs={12} md={6} lg={4}>
                          <FormLabel htmlFor="followUp2Date">{t('proposals.status.followUp2Date', 'followUp2Date')} {t('proposals.headers.date')}</FormLabel>
                            <Input
                              type="date"
                              id="followUp2Date"
                              value={formData.followUp2Date ? new Date(formData.followUp2Date).toISOString().split('T')[0] : ''}
                              onChange={(e) => updateFormData({ followUp2Date: e.target.value })}
                              isDisabled={isFormDisabled}
                            />
                        </Box>
                        <Box xs={12} md={6} lg={4}>
                          <FormLabel htmlFor="followUp3Date">{t('proposals.status.followUp3Date', 'followUp3Date')} {t('proposals.headers.date')}</FormLabel>
                            <Input
                              type="date"
                              id="followUp3Date"
                              value={formData.followUp3Date ? new Date(formData.followUp3Date).toISOString().split('T')[0] : ''}
                              onChange={(e) => updateFormData({ followUp3Date: e.target.value })}
                              isDisabled={isFormDisabled}
                            />
                        </Box>
                      </Flex>
                    )}
                    */}
            </CardBody>
          </StandardCard>

          {/* Tabs section for manufacturers */}

          {/* Version badges */}
          <HStack spacing={4} overflowX="auto" pb={2}>
            {versionDetails.map((version, index) => {
              const isSelected = index === selectedVersionIndex
              return (
                <Badge
                  key={index}
                  p={3}
                  display="flex"
                  fontSize="sm"
                  bg={isSelected ? badgeBgSelected : badgeBgUnselected}
                  color={isSelected ? badgeColorSelected : badgeColorUnselected}
                  borderRadius="lg"
                  transition="all 0.3s ease"
                  cursor="pointer"
                  onClick={() => handleBadgeClick(index, version)}
                  minH="44px"
                  alignItems="center"
                  justifyContent="space-between"
                  minW="120px"
                >
                  <VStack spacing={4} alignItems="start">
                    {!isContractor && (
                      <Text fontWeight="bold" fontSize="xs">
                        {version.versionName}
                      </Text>
                    )}
                    <Text fontSize="xs" color={isSelected ? 'blue.200' : 'blue.500'}>
                      $ {version.manufacturerData?.costMultiplier || 'N/A'}
                    </Text>
                  </VStack>
                  {!isContractor && (
                    <Menu>
                      <MenuButton
                        as={Button}
                        variant="ghost"
                        size="sm"
                        onClick={(e) => e.stopPropagation()}
                        p={1}
                        minW="auto"
                        h="auto"
                        color={isSelected ? 'blue.100' : 'blue.600'}
                      >
                        <Icon as={MoreHorizontal} />
                      </MenuButton>
                      <MenuList>
                        <MenuItem onClick={() => openEditModal(index)}>
                          <Icon as={Edit} mr={2} /> {t('common.edit', 'Edit')}
                        </MenuItem>
                        <MenuItem onClick={() => openDeleteModal(index)} color={deleteColor}>
                          <Icon as={Trash} mr={2} /> {t('common.delete', 'Delete')}
                        </MenuItem>
                        <MenuItem onClick={() => duplicateVersion(index)}>
                          <Icon as={Copy} mr={2} /> {t('common.duplicate', 'Duplicate')}
                        </MenuItem>
                      </MenuList>
                    </Menu>
                  )}
                </Badge>
              )
            })}
          </HStack>

          <Box borderTop="1px" borderColor={borderColor} my={4} />

          <Tabs
            index={activeTab === 'item' ? 0 : 1}
            onChange={(index) => handleTabSelect(index === 0 ? 'item' : 'file')}
          >
            <TabList>
              <Tab>
                <HStack spacing={4}>
                  <Icon as={List} />
                  <Text>{t('common.items', 'Items')}</Text>
                </HStack>
              </Tab>
              <Tab>
                <HStack spacing={4}>
                  <Icon as={File} />
                  <Text>{t('common.files', 'Files')}</Text>
                </HStack>
              </Tab>
            </TabList>

            <TabPanels>
              <TabPanel px={0} py={5}>
                <ItemSelectionContentEdit
                  selectedVersion={selectedVersion}
                  formData={formData}
                  setFormData={setFormData}
                  setSelectedVersion={setSelectedVersion}
                  selectVersion={selectVersion}
                  readOnly={isFormDisabled}
                />
              </TabPanel>
              <TabPanel px={0} py={5}>
                <VStack spacing={4} align="start">
                  <Text fontSize="lg" fontWeight="medium">
                    {t('proposals.fileUpload.title', 'File Upload Section')}
                  </Text>
                  <Text color={labelColor}>
                    {t(
                      'proposals.fileUpload.description',
                      'This section allows users to upload or manage files.',
                    )}
                  </Text>
                  <FileUploadSection
                    proposalId={formData.id}
                    onFilesChange={(files) => updateFormData({ files })}
                  />
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>

          <Box borderTop="1px" borderColor={borderColor} my={4} />
          <VStack spacing={4} align="center" p={4} maxW="600px" mx="auto">
            {isFormDisabled ? (
              // Show status message instead of buttons when quote is locked OR when contractor views accepted quote
              <Alert status="success" borderRadius="lg">
                <VStack spacing={4} textAlign="center" w="full">
                  <HStack>
                    <CheckCircle />
                    <Text fontSize="lg" fontWeight="semibold">
                      {t('proposals.lockedStatus.title', 'Quote Locked')}
                    </Text>
                  </HStack>
                  <Text>
                    {t(
                      'proposals.lockedStatus.description',
                      'This quote has been accepted and is now locked.',
                    )}
                  </Text>
                  <Text fontSize="sm" color={labelColor}>
                    {t('proposals.lockedStatus.processingNote', 'No further changes can be made.')}
                  </Text>
                </VStack>
              </Alert>
            ) : (
              // Show action buttons only when quote is not locked
              <HStack spacing={4} flexWrap="wrap" justify="center">
                <Button
                  variant="outline"
                  colorScheme="gray"
                  type="submit"
                  minW={{ base: '110px', md: '140px' }}
                  maxW="200px"
                  minH="44px"
                  flex={{ base: '1', md: 'unset' }}
                  fontSize={{ base: 'sm', md: 'md' }}
                >
                  {t('common.save', 'Save')}
                </Button>
                {formData.status !== 'Proposal accepted' && formData.status !== 'accepted' && (
                  <>
                    <Button
                      colorScheme="green"
                      onClick={handleAcceptOrder}
                      minW={{ base: '110px', md: '140px' }}
                      maxW="220px"
                      minH="44px"
                      flex={{ base: '1', md: 'unset' }}
                      fontSize={{ base: 'sm', md: 'md' }}
                    >
                      {t('proposals.actions.acceptAndOrder', 'Accept and Order')}
                    </Button>
                    <Button
                      variant="outline"
                      colorScheme="red"
                      onClick={handleRejectOrder}
                      minW={{ base: '110px', md: '140px' }}
                      maxW="220px"
                      minH="44px"
                      flex={{ base: '1', md: 'unset' }}
                      fontSize={{ base: 'sm', md: 'md' }}
                    >
                      {t('proposals.actions.rejectAndArchive', 'Reject and Archive')}
                    </Button>
                  </>
                )}
              </HStack>
            )}
          </VStack>
        </Box>
      </PageContainer>

      {/* Modals */}
      <Suspense fallback={null}>
        {showPrintModal && (
          <PrintProposalModal
            show={showPrintModal}
            onClose={() => setShowPrintModal(false)}
            formData={formData}
          />
        )}
      </Suspense>
      <Suspense fallback={null}>
        {showEmailModal && (
          <EmailProposalModal
            show={showEmailModal}
            onClose={() => setShowEmailModal(false)}
            formData={formData}
          />
        )}
      </Suspense>
      <Suspense fallback={null}>
        {showContractModal && (
          <EmailContractModal
            show={showContractModal}
            onClose={() => setShowContractModal(false)}
          />
        )}
      </Suspense>

      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        size={{ base: 'full', md: 'md', lg: 'lg' }}
        scrollBehavior="inside"
        isCentered
      >
        <ModalOverlay>
          <ModalContent>
            <ModalHeader>{t('common.editVersionName', 'Edit Version Name')}</ModalHeader>
            <ModalCloseButton aria-label={t('common.ariaLabels.closeModal', 'Close modal')} />
            <ModalBody>
              <Input
                mb={3}
                value={editedVersionName}
                onChange={(e) => setEditedVersionName(e.target.value)}
                placeholder={t('common.versionName', 'Version Name')}
              />
            </ModalBody>
            <ModalFooter>
              <Button
                variant="outline"
                colorScheme="gray"
                onClick={() => setEditModalOpen(false)}
                mr={3}
              >
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button colorScheme="brand" onClick={saveEditVersionName} minH="44px">
                {t('common.save', 'Save')}
              </Button>
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>
      </Modal>

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        size={{ base: 'full', md: 'sm' }}
        scrollBehavior="inside"
        isCentered
      >
        <ModalOverlay>
          <ModalContent>
            <ModalHeader>{t('common.confirmDelete', 'Confirm Delete')}</ModalHeader>
            <ModalCloseButton aria-label={t('common.ariaLabels.closeModal', 'Close modal')} />
            <ModalBody>
              {t('common.areYouSureDelete', 'Are you sure you want to delete this version?')}
            </ModalBody>
            <ModalFooter>
              <Button
                variant="outline"
                colorScheme="gray"
                onClick={() => setDeleteModalOpen(false)}
                mr={3}
              >
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button colorScheme="red" onClick={confirmDelete} minH="44px">
                {t('common.delete', 'Delete')}
              </Button>
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>
      </Modal>
    </>
  )
}

export default EditProposal
