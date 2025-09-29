import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Box,
  FormControl,
  Input,
  Flex,
  Link,
  Badge,
  FormLabel,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Alert,
  Container,
  Card,
  CardBody,
  Icon,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  SimpleGrid,
  VStack,
  HStack,
  Text,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Select,
  useToast,
} from '@chakra-ui/react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchManufacturerById } from '../../store/slices/manufacturersSlice'
import { setSelectVersionNewEdit } from '../../store/slices/selectVersionNewEditSlice'
import { sendFormDataToBackend } from '../../queries/proposalQueries'
// Removed Formik and Yup - using React Hook Form pattern
// Removed react-select/creatable - using Chakra Select
import DatePicker from 'react-datepicker'
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
  FileContract,
  CheckCircle,
} from 'lucide-react'
// Removed react-icons - using lucide-react only
// Removed Swal - using Chakra useToast
import ItemSelectionContentEdit from '../../components/ItemSelectionContentEdit'
import FileUploadSection from './CreateProposal/FileUploadSection'
import PrintProposalModal from '../../components/model/PrintProposalModal'
import EmailProposalModal from '../../components/model/EmailProposalModal'
import EmailContractModal from '../../components/model/EmailContractModal'
import Loader from '../../components/Loader'
import axiosInstance from '../../helpers/axiosInstance'
import {
  validateProposalSubTypeRequirements,
  showSubTypeValidationError,
} from '../../helpers/subTypeValidation'

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

const EditProposal = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const toast = useToast()

  // Get user info from store/localStorage
  const userInfo = JSON.parse(localStorage.getItem('user') || '{}')
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
  // Use manufacturers map from Redux so we can attach full manufacturer data
  const manufacturersByIdMap = useSelector((state) => state.manufacturers.byId)
  const loggedInUser = JSON.parse(localStorage.getItem('user'))
  const loggedInUserId = loggedInUser?.userId
  const hasSetInitialVersion = useRef(false)

  // Check if user is a contractor (should not see manufacturer version names)
  const isContractor = loggedInUser?.group && loggedInUser.group.group_type === 'contractor'

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
  console.log('🔍 EditProposal Debug:', {
    'formData.is_locked': formData?.is_locked,
    'formData.status': formData?.status,
    userRole: userInfo?.role,
    isAdmin: isAdmin,
    isFormDisabled: isFormDisabled,
    proposal_id: formData?.id,
  })
  // Fetch initial data
  useEffect(() => {
    axiosInstance
      .get(`/api/quotes/proposalByID/${id}`)
      .then((res) => {
        setInitialData(res.data)
        setFormData(res.data || defaultFormData)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Error fetching quote:', err)
        setLoading(false)
      })
  }, [id])

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

  // Fetch manufacturers data
  useEffect(() => {
    if (formData?.manufacturersData?.length > 0) {
      // Initialize index; actual selectedVersion will be set when details are ready
      if (selectedVersionIndex === null) setSelectedVersionIndex(0)

      formData.manufacturersData.forEach((item) => {
        if (item.manufacturer && !manufacturersByIdMap[item.manufacturer]) {
          // Don't load full catalog data for quote editing - only manufacturer info needed
          dispatch(fetchManufacturerById({ id: item.manufacturer, includeCatalog: false }))
        }
      })
    }
  }, [formData?.manufacturersData, dispatch, manufacturersByIdMap, selectedVersionIndex])

  useEffect(() => {
    if (!Array.isArray(formData.manufacturersData) || formData.manufacturersData.length === 0)
      return

    const details = formData.manufacturersData.map((item) => ({
      ...item,
      manufacturerData: manufacturersByIdMap[item.manufacturer],
    }))

    if (details.length === 0) return

    // First-time init
    if (selectedVersionIndex === null && !hasSetInitialVersion.current) {
      setSelectedVersionIndex(0)
      setSelectedVersion(details[0])
      hasSetInitialVersion.current = true
      dispatch(setSelectVersionNewEdit(details[0]))
      return
    }

    // Keep selectedVersion in sync when manufacturer data loads or index changes
    if (selectedVersionIndex !== null) {
      const next = details[selectedVersionIndex] || details[0]
      if (
        !selectedVersion ||
        selectedVersion.versionName !== next.versionName ||
        (!selectedVersion.manufacturerData && next.manufacturerData)
      ) {
        setSelectedVersion(next)
        dispatch(setSelectVersionNewEdit(next))
      }
    }
  }, [formData.manufacturersData, manufacturersByIdMap, selectedVersionIndex])

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
    const updatedManufacturersData = formData.manufacturersData.filter(
      (_, i) => i !== currentDeleteIndex,
    )
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

  const versionDetails =
    formData?.manufacturersData?.map((item) => ({
      ...item,
      manufacturerData: manufacturersByIdMap[item.manufacturer],
    })) || []

  const selectVersion = versionDetails[selectedVersionIndex] || null

  const handleSubmit = (values) => {
    sendToBackend({ ...formData, ...values }, 'update')
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
          toast({
            title: t('proposals.errors.cannotAccept', 'Cannot accept quote'),
            description: t('proposals.errors.missingRequirements', 'Missing required selections'),
            status: 'warning',
            duration: 5000,
            isClosable: true,
          })
          return
        }
      }

      const response = await dispatch(sendFormDataToBackend(payload))

      if (response.payload.success) {
        if (action === 'reject') {
          toast({
            title: t('common.success', 'Success'),
            description: t('proposals.toast.rejectSuccess', 'Quote rejected successfully!'),
            status: 'success',
            duration: 5000,
            isClosable: true,
          })
          setTimeout(() => {
            window.location.reload()
          }, 1000)
        } else {
          if (import.meta?.env?.DEV) console.log('Quote updated successfully')
          toast({
            title: t('common.success', 'Success'),
            description: t('proposals.toast.updateSuccess', 'Quote updated successfully!'),
            status: 'success',
            duration: 5000,
            isClosable: true,
          })
          setFormData(response.payload.data || finalData)
        }
      } else {
        const apiMsg = response.payload?.message
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
          toast({
            title: t('proposals.errors.cannotAccept', 'Cannot accept quote'),
            description: t('proposals.errors.missingRequirements', 'Missing required selections'),
            status: 'warning',
            duration: 5000,
            isClosable: true,
          })
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
      <Box
        py={3}
        px={4}
        borderBottom="1px"
        borderColor="gray.200"
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
      >
        <HStack spacing={3}>
          <Text fontSize="lg" color="gray.500" fontWeight="medium">
            {t('proposals.edit.title', 'Edit Quote')}
          </Text>
          {(formData?.status === 'Proposal accepted' || formData?.status === 'accepted') && (
            <Badge colorScheme="green" px={2} py={1}>
              {t('proposals.lockedStatus.title')}
            </Badge>
          )}
          {formData?.is_locked && (
            <Badge colorScheme="gray" px={2} py={1}>
              {t('common.locked', 'Locked')}
            </Badge>
          )}
        </HStack>
        <HStack spacing={2} flexWrap="wrap">
          <Button
            colorScheme="green"
            leftIcon={<Printer />}
            onClick={() => setShowPrintModal(true)}
          >
            {t('proposals.create.actions.print', 'Print Quote')}
          </Button>
          {!(loggedInUser?.group && loggedInUser.group.group_type === 'contractor') && (
            <>
              <Button
                colorScheme="cyan"
                leftIcon={<Mail />}
                onClick={() => setShowEmailModal(true)}
              >
                {t('proposals.create.actions.email', 'Email Quote')}
              </Button>
              <Button
                colorScheme="yellow"
                leftIcon={<FileContract />}
                onClick={() => setShowContractModal(true)}
              >
                {t('proposals.create.actions.contract', 'Email Contract')}
              </Button>
            </>
          )}
        </HStack>
      </Box>

      <Container
        fluid
        className="dashboard-container"
        style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}
      >
        <Box
          as="form"
          onSubmit={(e) => {
            e.preventDefault()
            handleSubmit(formData)
          }}
        >
          {/* Basic Information Card */}
          <Card mb={4}>
            <CardBody>
              <Text fontSize="lg" fontWeight="medium" mb={4}>
                Basic Information
              </Text>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                <FormControl>
                  <FormLabel htmlFor="designer">{t('common.designer', 'Designer')} *</FormLabel>
                  <Select
                    id="designer"
                    name="designer"
                    value={formData.designer}
                    onChange={(e) => updateFormData({ designer: e.target.value })}
                    placeholder={t('common.selectDesigner', 'Select Designer')}
                    isDisabled={isFormDisabled}
                  >
                    {designerOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
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
                  <Select
                    id="status"
                    name="status"
                    value={formData.status || 'Draft'}
                    onChange={(e) => updateFormData({ status: e.target.value })}
                    isDisabled={isFormDisabled}
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </FormControl>
              </SimpleGrid>
            </CardBody>
          </Card>

          {/* Dates Card */}
          <Card mb={4}>
            <CardBody>
              <Text fontSize="lg" fontWeight="medium" mb={4}>
                Important Dates
              </Text>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                <FormControl>
                  <Box position="relative">
                    <FormLabel htmlFor="date">Date</FormLabel>
                    <DatePicker
                      id="date"
                      selected={formData.date ? new Date(formData.date) : new Date()}
                      onChange={(date) => updateFormData({ date })}
                      className="form-control"
                      dateFormat="MM/dd/yyyy"
                      wrapperClassName="w-100"
                      disabled={isFormDisabled}
                      placeholderText={t('common.date', 'Date')}
                    />
                    <Calendar
                      style={{
                        position: 'absolute',
                        top: '70%',
                        right: '12px',
                        transform: 'translateY(-50%)',
                        color: '#6c757d',
                        pointerEvents: 'none',
                      }}
                    />
                  </Box>
                </FormControl>
                <FormControl>
                  <Box position="relative">
                    <FormLabel htmlFor="designDate">
                      {t('common.designDate', 'Design Date')}
                    </FormLabel>
                    <DatePicker
                      id="designDate"
                      selected={formData.designDate ? new Date(formData.designDate) : null}
                      onChange={(date) => updateFormData({ designDate: date })}
                      className="form-control"
                      dateFormat="MM/dd/yyyy"
                      wrapperClassName="w-100"
                      disabled={isFormDisabled}
                      placeholderText={t('common.designDate', 'Design Date')}
                    />
                    <Calendar
                      style={{
                        position: 'absolute',
                        top: '70%',
                        right: '12px',
                        transform: 'translateY(-50%)',
                        color: '#6c757d',
                        pointerEvents: 'none',
                      }}
                    />
                  </Box>
                </FormControl>
                <FormControl>
                  <Box position="relative">
                    <FormLabel htmlFor="measurementDate">
                      {t('common.measurementDate', 'Measurement Date')}
                    </FormLabel>
                    <DatePicker
                      id="measurementDate"
                      selected={
                        formData.measurementDate ? new Date(formData.measurementDate) : null
                      }
                      onChange={(date) => updateFormData({ measurementDate: date })}
                      className="form-control"
                      dateFormat="MM/dd/yyyy"
                      wrapperClassName="w-100"
                      disabled={isFormDisabled}
                      placeholderText={t('common.measurementDate', 'Measurement Date')}
                    />
                    <Calendar
                      style={{
                        position: 'absolute',
                        top: '70%',
                        right: '12px',
                        transform: 'translateY(-50%)',
                        color: '#6c757d',
                        pointerEvents: 'none',
                      }}
                    />
                  </Box>
                </FormControl>
              </SimpleGrid>
              {/* Follow up dates commented out
                    {!isContractor && (
                      <Flex>
                        <Box xs={12} md={6} lg={4} className="mb-3">
                          <div style={{ position: 'relative' }}>
                            <FormLabel htmlFor="followUp1Date">Follow up 1 Date</FormLabel>
                            <DatePicker
                              id="followUp1Date"
                              selected={formData.followUp1Date ? new Date(formData.followUp1Date) : null}
                              onChange={(date) => updateFormData({ followUp1Date: date })}
                              className="form-control"
                              dateFormat="MM/dd/yyyy"
                              wrapperClassName="w-100"
                              disabled={isFormDisabled}
                              placeholderText="Follow up 1 Date"
                            />
                            <FaCalendarAlt
                              style={{
                                position: 'absolute',
                                top: '70%',
                                right: '12px',
                                transform: 'translateY(-50%)',
                                color: '#6c757d',
                                pointerEvents: 'none',
                              }}
                            />
                          </div>
                        </Box>
                        <Box xs={12} md={6} lg={4} className="mb-3">
                          <div style={{ position: 'relative' }}>
                            <FormLabel htmlFor="followUp2Date">Follow up 2 Date</FormLabel>
                            <DatePicker
                              id="followUp2Date"
                              selected={formData.followUp2Date ? new Date(formData.followUp2Date) : null}
                              onChange={(date) => updateFormData({ followUp2Date: date })}
                              className="form-control"
                              dateFormat="MM/dd/yyyy"
                              wrapperClassName="w-100"
                              disabled={isFormDisabled}
                              placeholderText="Follow up 2 Date"
                            />
                            <FaCalendarAlt
                              style={{
                                position: 'absolute',
                                top: '70%',
                                right: '12px',
                                transform: 'translateY(-50%)',
                                color: '#6c757d',
                                pointerEvents: 'none',
                              }}
                            />
                          </div>
                        </Box>
                        <Box xs={12} md={6} lg={4} className="mb-3">
                          <div style={{ position: 'relative' }}>
                            <FormLabel htmlFor="followUp3Date">Follow up 3 Date</FormLabel>
                            <DatePicker
                              id="followUp3Date"
                              selected={formData.followUp3Date ? new Date(formData.followUp3Date) : null}
                              onChange={(date) => updateFormData({ followUp3Date: date })}
                              className="form-control"
                              dateFormat="MM/dd/yyyy"
                              wrapperClassName="w-100"
                              disabled={isFormDisabled}
                              placeholderText="Follow up 3 Date"
                            />
                            <FaCalendarAlt
                              style={{
                                position: 'absolute',
                                top: '70%',
                                right: '12px',
                                transform: 'translateY(-50%)',
                                color: '#6c757d',
                                pointerEvents: 'none',
                              }}
                            />
                          </div>
                        </Box>
                      </Flex>
                    )}
                    */}
            </CardBody>
          </Card>

          {/* Tabs section for manufacturers */}

          {/* Version badges */}
          <HStack spacing={3} overflowX="auto" pb={2}>
            {versionDetails.map((version, index) => {
              const isSelected = index === selectedVersionIndex
              return (
                <Badge
                  key={index}
                  p={3}
                  display="flex"
                  fontSize="sm"
                  bg={isSelected ? 'blue.600' : 'blue.100'}
                  color={isSelected ? 'blue.100' : 'blue.600'}
                  borderRadius="lg"
                  transition="all 0.3s ease"
                  cursor="pointer"
                  onClick={() => handleBadgeClick(index, version)}
                  minH="44px"
                  alignItems="center"
                  justifyContent="space-between"
                  minW="120px"
                >
                  <VStack spacing={1} alignItems="start">
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
                        <MenuItem onClick={() => openDeleteModal(index)} color="red.500">
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

          <Box borderTop="1px" borderColor="gray.200" my={4} />

          <Tabs
            index={activeTab === 'item' ? 0 : 1}
            onChange={(index) => handleTabSelect(index === 0 ? 'item' : 'file')}
          >
            <TabList>
              <Tab>
                <HStack spacing={2}>
                  <Icon as={List} />
                  <Text>{t('common.items', 'Items')}</Text>
                </HStack>
              </Tab>
              <Tab>
                <HStack spacing={2}>
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
                  <Text color="gray.600">
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

          <Box borderTop="1px" borderColor="gray.200" my={4} />
          <VStack spacing={4} align="center" p={4} maxW="600px" mx="auto">
            {isFormDisabled ? (
              // Show status message instead of buttons when quote is locked OR when contractor views accepted quote
              <Alert status="success" borderRadius="lg">
                <VStack spacing={2} textAlign="center" w="full">
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
                  <Text fontSize="sm" color="gray.600">
                    {t('proposals.lockedStatus.processingNote', 'No further changes can be made.')}
                  </Text>
                </VStack>
              </Alert>
            ) : (
              // Show action buttons only when quote is not locked
              <HStack spacing={4} flexWrap="wrap" justify="center">
                <Button variant="outline" colorScheme="gray" type="submit" minW="140px">
                  {t('common.save', 'Save')}
                </Button>
                {formData.status !== 'Proposal accepted' && formData.status !== 'accepted' && (
                  <>
                    <Button colorScheme="green" onClick={handleAcceptOrder} minW="140px">
                      {t('proposals.actions.acceptAndOrder', 'Accept and Order')}
                    </Button>
                    <Button
                      variant="outline"
                      colorScheme="red"
                      onClick={handleRejectOrder}
                      minW="140px"
                    >
                      {t('proposals.actions.rejectAndArchive', 'Reject and Archive')}
                    </Button>
                  </>
                )}
              </HStack>
            )}
          </VStack>
        </Box>
      </Container>

      {/* Modals */}
      <PrintProposalModal
        show={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        formData={formData}
      />
      <EmailProposalModal
        show={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        formData={formData}
      />
      <EmailContractModal show={showContractModal} onClose={() => setShowContractModal(false)} />

      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} size="lg" isCentered>
        <ModalOverlay>
          <ModalContent>
            <ModalHeader>{t('common.editVersionName', 'Edit Version Name')}</ModalHeader>
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
              <Button colorScheme="blue" onClick={saveEditVersionName}>
                {t('common.save', 'Save')}
              </Button>
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>
      </Modal>

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        size="sm"
        isCentered
      >
        <ModalOverlay>
          <ModalContent>
            <ModalHeader>{t('common.confirmDelete', 'Confirm Delete')}</ModalHeader>
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
              <Button colorScheme="red" onClick={confirmDelete}>
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
