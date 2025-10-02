import StandardCard from '../../../../components/StandardCard'
import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import PageHeader from '../../../../components/PageHeader'
import { AlertDialog, AlertDialogBody, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogOverlay, Badge, Box, Button, CardBody, Checkbox, FormControl, FormLabel, HStack, Icon, Image, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Select, Spinner, Table, Tbody, Td, Text, Textarea, Th, Thead, Tr, VStack, useToast } from '@chakra-ui/react'
// Use lucide icons (React components) only via centralized module
import { Plus, ChevronDown, ChevronUp, RefreshCw, Sparkles, Upload, Wrench } from '@/icons-lucide'
import { fetchManufacturerById } from '../../../../store/slices/manufacturersSlice'
import axiosInstance from '../../../../helpers/axiosInstance'
import { ICON_SIZE_MD, ICON_BOX_MD } from '../../../../constants/iconSizes'
// Removed Swal - using Chakra useToast
// Removed CreatableSelect - using Chakra Select

const CatalogMappingTab = ({ manufacturer, id }) => {
  const { t } = useTranslation()
  const toast = useToast()
  const api_url = import.meta.env.VITE_API_URL
  const customization = useSelector((state) => state.customization)
  const headerBg = customization?.headerBg || "blue.600"
  const textColor = customization?.headerTextColor || "white"

  // AlertDialog confirmation system (replaces SweetAlert)
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    description: '',
    confirmText: t('common.confirm', 'Confirm'),
    cancelText: t('common.cancel', 'Cancel'),
    onConfirm: () => {},
    onCancel: () => {},
  })
  const cancelRef = React.useRef()

  // Helper function for confirmations (replaces Swal.fire with confirm)
  const askConfirm = (title, description, confirmText = t('common.confirm', 'Confirm'), cancelText = t('common.cancel', 'Cancel')) => {
    return new Promise((resolve) => {
      setConfirmDialog({
        isOpen: true,
        title,
        description,
        confirmText,
        cancelText,
        onConfirm: () => {
          setConfirmDialog(prev => ({ ...prev, isOpen: false }))
          resolve(true)
        },
        onCancel: () => {
          setConfirmDialog(prev => ({ ...prev, isOpen: false }))
          resolve(false)
        },
      })
    })
  }

  // Server-side paginated catalog data (avoid loading all items at once)
  const [catalogData, setCatalogData] = useState([])
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 50, totalPages: 0 })
  const [filterMeta, setFilterMeta] = useState({ uniqueTypes: [], uniqueStyles: [] })
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState(null)

  // Sorting state - default to alphabetical by code
  const [sortBy, setSortBy] = useState('code')
  const [sortOrder, setSortOrder] = useState('ASC')

  const getInitialItemsPerPage = () => {
    const saved = localStorage.getItem('catalogItemsPerPage')
    return saved ? parseInt(saved, 10) : 50
  }

  const [typeFilter, setTypeFilter] = useState('')
  const [styleFilter, setStyleFilter] = useState('')
  const [searchFilter, setSearchFilter] = useState('')

  const uniqueTypes = filterMeta.uniqueTypes || []
  const typeOptions = uniqueTypes.map((type) => ({
    value: type,
    label: type,
  }))

  const [fileModalVisible, setFileModalVisible] = useState(false)
  const [manualModalVisible, setManualModalVisible] = useState(false)

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(getInitialItemsPerPage())

  const [isUpdating, setIsUpdating] = useState(false)
  const [isSaving, setIsSaving] = useState(false) // Add loading state for manual save

  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage

  // const currentItems = catalogData.slice(indexOfFirstItem, indexOfLastItem);
  // const totalPages = Math.ceil(catalogData.length / itemsPerPage);
  // const filteredCatalogData = typeFilter
  //   ? catalogData.filter(item => item.type === typeFilter)
  //   : catalogData;

  // Use data as-is; backend applies filters and pagination
  const filteredCatalogData = catalogData
  const totalPages = pagination.totalPages || Math.ceil(filteredCatalogData.length / itemsPerPage)
  const currentItems = filteredCatalogData

  const [showAssemblyModal, setShowAssemblyModal] = useState(false)
  const [isAssemblyCostSaving, setIsAssemblyCostSaving] = useState(false)
  const [showHingesModal, setShowHingesModal] = useState(false)
  const [showModificationModal, setShowModificationModal] = useState(false)
  // Main Modification Management Modal
  const [showMainModificationModal, setShowMainModificationModal] = useState(false)
  // Quick edit states for categories/templates within Modification Management
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false)
  const [editCategory, setEditCategory] = useState({ id: '', name: '', orderIndex: 0, image: '' })
  const [showDeleteCategoryModal, setShowDeleteCategoryModal] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState(null)
  const [showMoveModificationModal, setShowMoveModificationModal] = useState(false)
  const [modificationToMove, setModificationToMove] = useState(null)
  const [showQuickEditTemplateModal, setShowQuickEditTemplateModal] = useState(false)
  // Keep full context so quick-save doesn't wipe fields on server
  const [editTemplate, setEditTemplate] = useState({
    id: '',
    categoryId: '',
    name: '',
    defaultPrice: '',
    sampleImage: '',
    isReady: false,
    fieldsConfig: null,
  })
  const [editGuidedBuilder, setEditGuidedBuilder] = useState({
    sliders: {
      height: {
        enabled: false,
        min: 0,
        max: 0,
        step: 1,
        useCustomIncrements: false,
        customIncrements: ['1/8', '1/4', '3/8', '1/2', '5/8', '3/4', '7/8'],
        label: 'Height',
      },
      width: {
        enabled: false,
        min: 0,
        max: 0,
        step: 1,
        useCustomIncrements: false,
        customIncrements: ['1/8', '1/4', '3/8', '1/2', '5/8', '3/4', '7/8'],
        label: 'Width',
      },
      depth: {
        enabled: false,
        min: 0,
        max: 0,
        step: 1,
        useCustomIncrements: false,
        customIncrements: ['1/8', '1/4', '3/8', '1/2', '5/8', '3/4', '7/8'],
        label: 'Depth',
      },
    },
    sideSelector: { enabled: false, options: ['L', 'R'], label: 'Side' },
    qtyRange: { enabled: false, min: 1, max: 10, label: 'Quantity' },
    notes: { enabled: false, placeholder: '', showInRed: true, label: 'Customer Notes' },
    customerUpload: { enabled: false, required: false, title: '', label: 'File Upload' },
    descriptions: { internal: '', customer: '', installer: '', both: false },
    modSampleImage: { enabled: false, label: 'Sample Image' },
  })
  const [modificationView, setModificationView] = useState('cards') // 'cards', 'addNew', 'gallery'
  const [selectedModificationCategory, setSelectedModificationCategory] = useState(null)
  const [modificationStep, setModificationStep] = useState(1) // 1: submenu, 2: template builder
  // Track editing state for template builder
  const [editingTemplateId, setEditingTemplateId] = useState(null)
  // Global Mods integration
  const [showAssignGlobalModsModal, setShowAssignGlobalModsModal] = useState(false)
  const [showItemGlobalModsModal, setShowItemGlobalModsModal] = useState(false)
  const [globalGallery, setGlobalGallery] = useState([])
  const [globalAssignments, setGlobalAssignments] = useState([])
  const [assignLoading, setAssignLoading] = useState(false)
  const [assignFormGM, setAssignFormGM] = useState({
    templateId: '',
    scope: 'all',
    targetStyle: '',
    targetType: '',
    overridePrice: '',
  })
  const [includeDraftTemplates, setIncludeDraftTemplates] = useState(false)
  const [itemGlobalList, setItemGlobalList] = useState([])

  const [assemblyData, setAssemblyData] = useState({
    type: '',
    price: '',
    applyTo: 'one',
    selectedTypes: [],
  })
  const [availableTypes, setAvailableTypes] = useState([])
  const [assemblyCostsByType, setAssemblyCostsByType] = useState({})

  const [hingesData, setHingesData] = useState({
    leftHingePrice: '',
    rightHingePrice: '',
    bothHingePrice: '',
    exposedSidePrice: '',
  })
  const [modificationData, setModificationData] = useState({
    modificationName: '',
    price: '',
    notes: '',
    description: '',
  })

  // Comprehensive Template Builder State
  const [newTemplate, setNewTemplate] = useState({
    categoryId: '',
    name: '',
    defaultPrice: '',
    isReady: false,
    sampleImage: '',
    saveAsBlueprint: false, // Task 5: Add blueprint checkbox support
  })
  const [newCategory, setNewCategory] = useState({ name: '', orderIndex: 0 })
  const [guidedBuilder, setGuidedBuilder] = useState({
    sliders: {
      height: {
        enabled: false,
        min: 0,
        max: 0,
        step: 1,
        useCustomIncrements: false,
        customIncrements: ['1/8', '1/4', '3/8', '1/2', '5/8', '3/4', '7/8'],
        label: 'Height',
      },
      width: {
        enabled: false,
        min: 0,
        max: 0,
        step: 1,
        useCustomIncrements: false,
        customIncrements: ['1/8', '1/4', '3/8', '1/2', '5/8', '3/4', '7/8'],
        label: 'Width',
      },
      depth: {
        enabled: false,
        min: 0,
        max: 0,
        step: 1,
        useCustomIncrements: false,
        customIncrements: ['1/8', '1/4', '3/8', '1/2', '5/8', '3/4', '7/8'],
        label: 'Depth',
      },
    },
    sideSelector: { enabled: false, options: ['L', 'R'], label: 'Side' },
    qtyRange: { enabled: false, min: 1, max: 10, label: 'Quantity' },
    notes: { enabled: false, placeholder: '', showInRed: true, label: 'Customer Notes' },
    customerUpload: { enabled: false, required: false, title: '', label: 'File Upload' },
    descriptions: { internal: '', customer: '', installer: '', both: false },
    modSampleImage: { enabled: false, label: 'Sample Image' },
  })
  const [builderErrors, setBuilderErrors] = useState({})
  const [creatingModification, setCreatingModification] = useState(false)

  // Selected Items for bulk operations
  const [selectedCatalogItem, setSelectedCatalogItem] = useState([])

  // Sub-types management
  const [subTypes, setSubTypes] = useState([])
  const [showSubTypeModal, setShowSubTypeModal] = useState(false)
  const [showAssignSubTypeModal, setShowAssignSubTypeModal] = useState(false)
  const [subTypeForm, setSubTypeForm] = useState({
    name: '',
    description: '',
    requires_hinge_side: false,
    requires_exposed_side: false,
  })

  // State for grouped catalog view in assignment modal
  const [groupedCatalogData, setGroupedCatalogData] = useState([])
  const [selectedCatalogCodes, setSelectedCatalogCodes] = useState([])
  const [editingSubType, setEditingSubType] = useState(null)
  const [selectedSubType, setSelectedSubType] = useState(null)
  const [subTypeAssignments, setSubTypeAssignments] = useState({})

  // Style management states
  const [styleImage, setStyleImage] = useState(null)

  const uniqueStyles = filterMeta.uniqueStyles || []
  const sortedUniqueStyles = [...uniqueStyles]
  const styleOptions = sortedUniqueStyles.map((style) => ({
    value: style,
    label: style,
  }))

  // Initialize form with proper default values
  const initialManualForm = {
    style: '',
    type: '',
    code: '',
    description: '',
    price: '',
  }

  const [manualForm, setManualForm] = useState(initialManualForm)

  // Fetch paginated catalog data from backend
  const fetchCatalogData = async (
    page = currentPage,
    limit = itemsPerPage,
    type = typeFilter,
    style = styleFilter,
    sort = sortBy,
    order = sortOrder,
  ) => {
    if (!id) return
    setLoading(true)
    setLoadError(null)
    try {
      const params = {
        page: String(page),
        limit: String(limit),
        sortBy: sort,
        sortOrder: order,
        ...(type ? { typeFilter: type } : {}),
        ...(style ? { styleFilter: style } : {}),
      }
      const { data } = await axiosInstance.get(`/api/manufacturers/${id}/catalog`, {
        params,
      })
      setCatalogData(Array.isArray(data.catalogData) ? data.catalogData : [])
      setPagination(data.pagination || { total: 0, page, limit, totalPages: 0 })
      if (page === 1 && data.filters) setFilterMeta(data.filters)
      if (data.sorting) {
        setSortBy(data.sorting.sortBy)
        setSortOrder(data.sorting.sortOrder)
      }
      setCurrentPage(page)
      setItemsPerPage(limit)
    } catch (e) {
      setLoadError(e.message)
      setCatalogData([])
    } finally {
      setLoading(false)
    }
  }

  // Load sub-types for this manufacturer
  const loadSubTypes = async () => {
    if (!id) return
    try {
      const { data } = await axiosInstance.get(`/api/manufacturers/${id}/sub-types`)
      setSubTypes(data.data || [])
    } catch (error) {
      setSubTypes([])
    }
  }

  // Create or update sub-type
  const handleSubTypeSave = async () => {
    try {
      if (editingSubType) {
        await axiosInstance.put(`/api/sub-types/${editingSubType.id}`, subTypeForm)
        toast({
          title: t('common.success', 'Success'),
          description: t(
            'settings.manufacturers.catalogMapping.subTypeUpdated',
            'Sub-type updated successfully!',
          ),
          status: 'success',
          duration: 5000,
          isClosable: true,
        })
      } else {
        await axiosInstance.post(`/api/manufacturers/${id}/sub-types`, subTypeForm)
        toast({
          title: t('common.success', 'Success'),
          description: t(
            'settings.manufacturers.catalogMapping.subTypeCreated',
            'Sub-type created successfully!',
          ),
          status: 'success',
          duration: 5000,
          isClosable: true,
        })
      }

      setShowSubTypeModal(false)
      setSubTypeForm({
        name: '',
        description: '',
        requires_hinge_side: false,
        requires_exposed_side: false,
      })
      setEditingSubType(null)
      await loadSubTypes()
    } catch (error) {
      toast({
        title: t('common.error', 'Error'),
        description:
          error.response?.data?.message ||
          t('settings.manufacturers.catalogMapping.subTypes.saveFailed', 'Failed to save sub-type'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  // Delete sub-type
  const handleSubTypeDelete = async (subType) => {
    const confirmed = await askConfirm({
      title: t('settings.manufacturers.catalogMapping.subTypes.deleteTitle'),
      description: t('settings.manufacturers.catalogMapping.subTypes.deleteConfirm', { name: subType.name }),
      confirmText: t('common.delete', 'Delete'),
      cancelText: t('common.cancel', 'Cancel'),
    })

    if (!confirmed) return

    try {
      await axiosInstance.delete(`/api/sub-types/${subType.id}`)
      toast({
        title: t('common.deleted'),
        description: t('settings.manufacturers.catalogMapping.subTypes.deleteSuccess'),
        status: 'success',
        duration: 4000,
        isClosable: true,
      })
      await loadSubTypes()
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('settings.manufacturers.catalogMapping.subTypes.deleteFailed'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  // Assign selected items to sub-type
  const handleAssignToSubType = async () => {
    if (!selectedSubType || selectedCatalogItem.length === 0) return

    try {
      await axiosInstance.post(`/api/sub-types/${selectedSubType}/assign-items`, {
        catalogItemIds: selectedCatalogItem,
      })
      toast({
        title: t('common.success'),
        description: t('settings.manufacturers.catalogMapping.subTypes.assignSuccess', {
          count: selectedCatalogItem.length,
        }),
        status: 'success',
        duration: 4000,
        isClosable: true,
      })
      setShowAssignSubTypeModal(false)
      setSelectedCatalogItem([])
      setSelectedSubType(null)
      await fetchCatalogData() // Refresh to show assignments
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('settings.manufacturers.catalogMapping.subTypes.assignFailed'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  // Group catalog data by code for assignment modal
  const groupCatalogDataByCode = (catalogItems) => {
    const groups = {}

    catalogItems.forEach((item) => {
      const code = item.code
      if (!groups[code]) {
        groups[code] = {
          code: code,
          description: item.description,
          type: item.type,
          styles: [],
          itemIds: [],
        }
      }

      groups[code].styles.push(item.style)
      groups[code].itemIds.push(item.id)
    })

    // Convert to array and sort by code
    return Object.values(groups).sort((a, b) => a.code.localeCompare(b.code))
  }

  // Handle code selection (selects all items with that code)
  const handleCodeSelection = (code, isSelected) => {
    const group = groupedCatalogData.find((g) => g.code === code)
    if (!group) return

    if (isSelected) {
      // Add all item IDs for this code
      setSelectedCatalogItem((prev) => [
        ...prev.filter((id) => !group.itemIds.includes(id)), // Remove any existing
        ...group.itemIds, // Add all for this code
      ])
      setSelectedCatalogCodes((prev) => [...prev.filter((c) => c !== code), code])
    } else {
      // Remove all item IDs for this code
      setSelectedCatalogItem((prev) => prev.filter((id) => !group.itemIds.includes(id)))
      setSelectedCatalogCodes((prev) => prev.filter((c) => c !== code))
    }
  }

  // Update grouped data when catalog data changes
  useEffect(() => {
    if (showAssignSubTypeModal && catalogData.length > 0) {
      setGroupedCatalogData(groupCatalogDataByCode(catalogData))
      // Load existing assignments for the selected sub-type
      if (selectedSubType) {
        loadExistingAssignments()
      }
    }
  }, [showAssignSubTypeModal, catalogData, selectedSubType])

  // Load existing assignments for the selected sub-type
  const loadExistingAssignments = async () => {
    if (!selectedSubType) return

    try {
      const { data } = await axiosInstance.get(`/api/sub-types/${selectedSubType}/assignments`)
      const assignedItems = data.data || []

      // Extract the assigned item IDs
      const assignedItemIds = assignedItems.map((item) => item.id)
      setSelectedCatalogItem(assignedItemIds)

      // Extract the codes that are assigned
      const assignedCodes = [...new Set(assignedItems.map((item) => item.code))]
      setSelectedCatalogCodes(assignedCodes)
    } catch (error) {
      // Don't show error to user as this is just for display purposes
    }
  }

  // Global mods helpers
  const loadGlobalGallery = async () => {
    try {
      const { data } = await axiosInstance.get('/api/global-mods/gallery')
      setGlobalGallery(data?.gallery || [])
    } catch (e) {
      setGlobalGallery([])
    }
  }

  // Load manufacturer-specific categories
  const [manufacturerCategories, setManufacturerCategories] = useState([])
  const loadManufacturerCategories = async () => {
    if (!id) return
    try {
      const { data } = await axiosInstance.get('/api/global-mods/categories', {
        params: { scope: 'manufacturer', manufacturerId: id, includeTemplates: true },
      })
      setManufacturerCategories(data?.categories || [])
    } catch (e) {
      setManufacturerCategories([])
    }
  }
  const loadGlobalAssignments = async () => {
    if (!id) return
    setAssignLoading(true)
    try {
      const { data } = await axiosInstance.get('/api/global-mods/assignments', {
        params: { manufacturerId: id },
      })
      setGlobalAssignments(data?.assignments || [])
    } catch (e) {
      setGlobalAssignments([])
    } finally {
      setAssignLoading(false)
    }
  }

  // Image upload helper (reuses backend /api/global-mods/upload/image)
  const uploadImageFile = async (file) => {
    if (!file) return null
    const form = new FormData()
    form.append('logoImage', file)
    const { data } = await axiosInstance.post('/api/global-mods/upload/image', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data?.filename || null
  }

  // Create modification category (submenu)
  const createModificationCategory = async () => {
    try {
      const { data } = await axiosInstance.post('/api/global-mods/categories', {
        name: newCategory.name,
        scope: 'manufacturer', // Always manufacturer scope in this context
        manufacturerId: id, // Current manufacturer ID
        orderIndex: parseInt(newCategory.orderIndex) || 0,
      })
      await loadManufacturerCategories() // Reload manufacturer categories to show new category
      return data.category
    } catch (error) {
      throw error
    }
  }

  // Create modification template
  const createModificationTemplate = async (categoryId) => {
    try {
      // Task 5: Ensure manufacturerId is present for proper isolation
      if (!id) {
        throw new Error('Manufacturer ID is required to create modifications')
      }

      const fieldsConfig = {
        sliders: guidedBuilder.sliders,
        sideSelector: guidedBuilder.sideSelector,
        qtyRange: guidedBuilder.qtyRange,
        notes: guidedBuilder.notes,
        customerUpload: guidedBuilder.customerUpload,
        descriptions: guidedBuilder.descriptions,
        modSampleImage: guidedBuilder.modSampleImage,
      }

      // Task 5: Handle blueprint vs manufacturer mod logic
      const isBlueprint = newTemplate.saveAsBlueprint || false
      const requestData = {
        categoryId: isBlueprint ? null : categoryId || null, // Blueprints don't need categories
        name: newTemplate.name,
        isReady: newTemplate.isReady,
        fieldsConfig: fieldsConfig,
        sampleImage: newTemplate.sampleImage || null,
        isBlueprint: isBlueprint,
      }

      // Business rule: Blueprints cannot have manufacturerId or price
      if (isBlueprint) {
        // Creating blueprint - no manufacturerId, no price
        requestData.manufacturerId = null
        requestData.defaultPrice = null
      } else {
        // Creating manufacturer-specific mod - has manufacturerId and price
        requestData.manufacturerId = id
        requestData.defaultPrice = newTemplate.defaultPrice
          ? parseFloat(newTemplate.defaultPrice)
          : null
      }

      const { data } = await axiosInstance.post('/api/global-mods/templates', requestData)

      await loadGlobalGallery() // Reload gallery to show new template
      await loadManufacturerCategories() // Reload manufacturer categories in case category was created
      return data.template
    } catch (error) {
      throw error
    }
  }

  // Update modification template (edit mode)
  const updateModificationTemplate = async (templateId, categoryId) => {
    try {
      const fieldsConfig = {
        sliders: guidedBuilder.sliders,
        sideSelector: guidedBuilder.sideSelector,
        qtyRange: guidedBuilder.qtyRange,
        notes: guidedBuilder.notes,
        customerUpload: guidedBuilder.customerUpload,
        descriptions: guidedBuilder.descriptions,
        modSampleImage: guidedBuilder.modSampleImage,
      }

      await axiosInstance.put(`/api/global-mods/templates/${templateId}`, {
        categoryId: categoryId || null,
        name: newTemplate.name,
        defaultPrice: newTemplate.defaultPrice ? parseFloat(newTemplate.defaultPrice) : null,
        isReady: newTemplate.isReady,
        fieldsConfig,
        sampleImage: newTemplate.sampleImage || null,
      })

      await loadGlobalGallery()
    } catch (error) {
      throw error
    }
  }

  // Reset modification form
  const resetModificationForm = () => {
    setNewTemplate({
      categoryId: '',
      name: '',
      defaultPrice: '',
      isReady: false,
      sampleImage: '',
    })
    setNewCategory({ name: '', orderIndex: 0 })
    setGuidedBuilder({
      sliders: {
        height: {
          enabled: false,
          min: 0,
          max: 0,
          step: 1,
          useCustomIncrements: false,
          customIncrements: ['1/8', '1/4', '3/8', '1/2', '5/8', '3/4', '7/8'],
          label: 'Height',
        },
        width: {
          enabled: false,
          min: 0,
          max: 0,
          step: 1,
          useCustomIncrements: false,
          customIncrements: ['1/8', '1/4', '3/8', '1/2', '5/8', '3/4', '7/8'],
          label: 'Width',
        },
        depth: {
          enabled: false,
          min: 0,
          max: 0,
          step: 1,
          useCustomIncrements: false,
          customIncrements: ['1/8', '1/4', '3/8', '1/2', '5/8', '3/4', '7/8'],
          label: 'Depth',
        },
      },
      sideSelector: { enabled: false, options: ['L', 'R'], label: 'Side' },
      qtyRange: { enabled: false, min: 1, max: 10, label: 'Quantity' },
      notes: { enabled: false, placeholder: '', showInRed: true, label: 'Customer Notes' },
      customerUpload: { enabled: false, required: false, title: '', label: 'File Upload' },
      descriptions: { internal: '', customer: '', installer: '', both: false },
      modSampleImage: { enabled: false, label: 'Sample Image' },
    })
    setSelectedModificationCategory(null)
    setModificationStep(1)
    setModificationView('cards')
    setEditingTemplateId(null)
  }

  // Delete modification template
  const deleteModificationTemplate = async (templateId) => {
    try {
      await axiosInstance.delete(`/api/global-mods/templates/${templateId}`)
      await loadGlobalGallery() // Reload gallery to update the list
      toast({
        title: t(
          'settings.manufacturers.catalogMapping.modificationDeleted',
          'Modification deleted successfully',
        ),
        status: 'success',
        duration: 1500,
        isClosable: true,
      })
    } catch (error) {
      toast({
        title: t('common.error', 'Error'),
        description: t('settings.manufacturers.catalogMapping.deleteFailed', 'Failed to delete modification'),
        status: 'error',
        duration: 4000,
        isClosable: true,
      })
    }
  }

  // Delete category
  const deleteCategory = async (categoryId, mode = 'only') => {
    try {
      const url = `/api/global-mods/categories/${categoryId}${mode !== 'only' ? `?mode=${mode}` : ''}`
      await axiosInstance.delete(url)

      // Reload both gallery and manufacturer categories to update the lists
      await loadGlobalGallery()
      await loadManufacturerCategories()

      toast({
        title: t('common.success', 'Success'),
        description: t('settings.manufacturers.catalogMapping.categoryDeleted', 'Category deleted successfully'),
        status: 'success',
        duration: 4000,
        isClosable: true,
      })
    } catch (error) {
      toast({
        title: t('common.error', 'Error'),
        description: error.response?.data?.message || t('settings.manufacturers.catalogMapping.deleteCategoryFailed', 'Failed to delete category'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  // Move modification to different category
  const moveModification = async (templateId, newCategoryId) => {
    try {
      await axiosInstance.put(`/api/global-mods/templates/${templateId}`, {
        categoryId: newCategoryId,
      })

      // Reload both gallery and manufacturer categories to update the lists
      await loadGlobalGallery()
      await loadManufacturerCategories()

      toast({
        title: t('common.success', 'Success'),
        description: t('settings.manufacturers.catalogMapping.modificationMoved', 'Modification moved successfully'),
        status: 'success',
        duration: 4000,
        isClosable: true,
      })
    } catch (error) {
      toast({
        title: t('common.error', 'Error'),
        description: error.response?.data?.message || t('settings.manufacturers.catalogMapping.moveFailed', 'Failed to move modification'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  // Build fieldsConfig from edit guided builder
  const buildEditFieldsConfig = () => {
    const fieldsConfig = {
      sliders: editGuidedBuilder.sliders,
      sideSelector: editGuidedBuilder.sideSelector,
      qtyRange: editGuidedBuilder.qtyRange,
      notes: editGuidedBuilder.notes,
      customerUpload: editGuidedBuilder.customerUpload,
      descriptions: editGuidedBuilder.descriptions,
      modSampleImage: editGuidedBuilder.modSampleImage,
    }
    return fieldsConfig
  }
  useEffect(() => {
    loadGlobalGallery()
  }, [])
  useEffect(() => {
    loadGlobalAssignments()
    loadManufacturerCategories() // Load manufacturer-specific categories
    loadSubTypes() // Load sub-types for this manufacturer
  }, [id])

  const flatTemplates = React.useMemo(() => {
    const list = []
    // Add only manufacturer-specific templates
    ;(manufacturerCategories || []).forEach((cat) =>
      (cat.templates || []).forEach((t) =>
        list.push({ ...t, categoryName: cat.name, isGlobal: false }),
      ),
    )
    return list
      .filter((t) => includeDraftTemplates || t.isReady)
      .sort(
        (a, b) =>
          (a.categoryName || '').localeCompare(b.categoryName) || a.name.localeCompare(b.name),
      )
  }, [manufacturerCategories, includeDraftTemplates])

  const openAssignGlobal = () => {
    setAssignFormGM({
      templateId: '',
      scope: styleFilter ? 'style' : 'all',
      targetStyle: styleFilter || '',
      targetType: typeFilter || '',
      overridePrice: '',
    })
    setShowAssignGlobalModsModal(true)
  }

  // Transform fieldsConfig from template to guidedBuilder shape
  const makeGuidedFromFields = (fc) => {
    const base = {
      sliders: {
        height: {
          enabled: false,
          min: 0,
          max: 0,
          step: 1,
          useCustomIncrements: false,
          customIncrements: ['1/8', '1/4', '3/8', '1/2', '5/8', '3/4', '7/8'],
          label: 'Height',
        },
        width: {
          enabled: false,
          min: 0,
          max: 0,
          step: 1,
          useCustomIncrements: false,
          customIncrements: ['1/8', '1/4', '3/8', '1/2', '5/8', '3/4', '7/8'],
          label: 'Width',
        },
        depth: {
          enabled: false,
          min: 0,
          max: 0,
          step: 1,
          useCustomIncrements: false,
          customIncrements: ['1/8', '1/4', '3/8', '1/2', '5/8', '3/4', '7/8'],
          label: 'Depth',
        },
      },
      sideSelector: { enabled: false, options: ['L', 'R'], label: 'Side' },
      qtyRange: { enabled: false, min: 1, max: 10, label: 'Quantity' },
      notes: { enabled: false, placeholder: '', showInRed: true, label: 'Customer Notes' },
      customerUpload: { enabled: false, required: false, title: '', label: 'File Upload' },
      descriptions: { internal: '', customer: '', installer: '', both: false },
      modSampleImage: { enabled: false, label: 'Sample Image' },
    }
    if (!fc) return base
    // sliders
    if (fc.sliders) {
      ;['height', 'width', 'depth'].forEach((k) => {
        if (fc.sliders[k]) {
          base.sliders[k].enabled = !!fc.sliders[k].enabled
          base.sliders[k].min = Number(fc.sliders[k].min ?? 0)
          base.sliders[k].max = Number(fc.sliders[k].max ?? 0)
          base.sliders[k].step = Number(fc.sliders[k].step ?? 1)
          if (
            Array.isArray(fc.sliders[k].customIncrements) &&
            fc.sliders[k].customIncrements.length > 0
          ) {
            base.sliders[k].useCustomIncrements = true
            base.sliders[k].customIncrements = fc.sliders[k].customIncrements
          } else {
            base.sliders[k].useCustomIncrements = false
          }
        }
      })
    }
    if (fc.sideSelector) {
      base.sideSelector.enabled = !!fc.sideSelector.enabled
      base.sideSelector.options =
        Array.isArray(fc.sideSelector.options) && fc.sideSelector.options.length
          ? fc.sideSelector.options
          : ['L', 'R']
    }
    if (fc.qtyRange) {
      base.qtyRange.enabled = !!fc.qtyRange.enabled
      base.qtyRange.min = Number(fc.qtyRange.min ?? 1)
      base.qtyRange.max = Number(fc.qtyRange.max ?? 10)
    }
    if (fc.notes) {
      base.notes.enabled = !!fc.notes.enabled
      base.notes.placeholder = fc.notes.placeholder || ''
      base.notes.showInRed = !!fc.notes.showInRed
    }
    if (fc.customerUpload) {
      base.customerUpload.enabled = !!fc.customerUpload.enabled
      base.customerUpload.required = !!fc.customerUpload.required
      base.customerUpload.title = fc.customerUpload.title || ''
    }
    if (fc.descriptions) {
      base.descriptions.internal = fc.descriptions.internal || ''
      base.descriptions.customer = fc.descriptions.customer || ''
      base.descriptions.installer = fc.descriptions.installer || ''
      base.descriptions.both = !!fc.descriptions.both
    }
    if (fc.modSampleImage) {
      base.modSampleImage.enabled = !!fc.modSampleImage.enabled
    }
    return base
  }

  const submitAssignGlobal = async () => {
    if (!assignFormGM.templateId) return
    try {
      // Support applying to selected items
      if (assignFormGM.scope === 'item' && selectedItems.length > 0) {
        await Promise.all(
          selectedItems.map((catalogDataId) =>
            axiosInstance.post('/api/global-mods/assignments', {
              templateId: Number(assignFormGM.templateId),
              manufacturerId: id,
              scope: 'item',
              catalogDataId,
              overridePrice:
                assignFormGM.overridePrice === '' ? null : Number(assignFormGM.overridePrice),
            }),
          ),
        )
      } else {
        await axiosInstance.post('/api/global-mods/assignments', {
          templateId: Number(assignFormGM.templateId),
          manufacturerId: id,
          scope: assignFormGM.scope,
          targetStyle: assignFormGM.scope === 'style' ? assignFormGM.targetStyle || null : null,
          targetType: assignFormGM.scope === 'type' ? assignFormGM.targetType || null : null,
          catalogDataId: assignFormGM.scope === 'item' ? selectedCatalogItem?.id || null : null,
          overridePrice:
            assignFormGM.overridePrice === '' ? null : Number(assignFormGM.overridePrice),
        })
      }
      await loadGlobalAssignments()
      setShowAssignGlobalModsModal(false)
      toast({
        title: t('common.success', 'Success'),
        description: t('settings.manufacturers.catalogMapping.assigned', 'Assigned'),
        status: 'success',
        duration: 4000,
        isClosable: true,
      })
    } catch (e) {
      toast({
        title: t('common.error', 'Error'),
        description: e.message || t('settings.manufacturers.catalogMapping.assignmentFailed', 'Assignment failed'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  const removeGlobalAssignment = async (assignmentId) => {
    try {
      await axiosInstance.delete(`/api/global-mods/assignments/${assignmentId}`)
      await loadGlobalAssignments()
    } catch (e) {
      // ignore
    }
  }

  const openItemGlobalMods = async (item) => {
    setSelectedCatalogItem(item)
    try {
      const { data } = await axiosInstance.get(`/api/global-mods/item/${item.id}`)
      setItemGlobalList(Array.isArray(data?.assignments) ? data.assignments : [])
    } catch (e) {
      setItemGlobalList([])
    }
    setShowItemGlobalModsModal(true)
  }

  const suppressTemplateForItem = async (templateId, active) => {
    // active=false => create a suppression assignment; true => remove suppression if exists
    try {
      if (active === false) {
        await axiosInstance.post('/api/global-mods/assignments', {
          templateId,
          manufacturerId: id,
          scope: 'item',
          catalogDataId: selectedCatalogItem.id,
          isActive: false,
        })
      } else {
        // find suppression assignment to delete (scope=item, isActive=false)
        const suppress = itemGlobalList.find(
          (a) => a.template?.id === templateId && a.scope === 'item' && a.isActive === false,
        )
        if (suppress) await axiosInstance.delete(`/api/global-mods/assignments/${suppress.id}`)
      }
      const { data } = await axiosInstance.get(`/api/global-mods/item/${selectedCatalogItem.id}`)
      setItemGlobalList(Array.isArray(data?.assignments) ? data.assignments : [])
    } catch (e) {
      // ignore
    }
  }

  // Keep filters in sync and refetch when they change
  useEffect(() => {
    fetchCatalogData(1, itemsPerPage, typeFilter, styleFilter, sortBy, sortOrder)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter, styleFilter, id, sortBy, sortOrder])

  // Initial load
  useEffect(() => {
    if (id) {
      fetchCatalogData(1, itemsPerPage, typeFilter, styleFilter, sortBy, sortOrder)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // Persist items per page
  useEffect(() => {
    localStorage.setItem('catalogItemsPerPage', String(itemsPerPage))
  }, [itemsPerPage])

  const [editModalVisible, setEditModalVisible] = useState(false)
  const [editForm, setEditForm] = useState({
    id: null,
    style: '',
    type: '',
    code: '',
    description: '',
    price: '',
  })

  // Delete style modal states
  const [deleteStyleModalVisible, setDeleteStyleModalVisible] = useState(false)
  const [styleToDelete, setStyleToDelete] = useState('')
  const [mergeToStyle, setMergeToStyle] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  // Bulk delete states
  const [selectedItems, setSelectedItems] = useState([])
  const [isSelectAll, setIsSelectAll] = useState(false)
  const [bulkDeleteModalVisible, setBulkDeleteModalVisible] = useState(false)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)

  // Individual delete states
  const [deleteItemModalVisible, setDeleteItemModalVisible] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null)
  const [isDeletingItem, setIsDeletingItem] = useState(false)

  // Cleanup duplicates states
  const [isCleaningDuplicates, setIsCleaningDuplicates] = useState(false)

  // Rollback states
  const [rollbackModalVisible, setRollbackModalVisible] = useState(false)
  const [availableBackups, setAvailableBackups] = useState([])
  const [selectedBackup, setSelectedBackup] = useState('')
  const [isLoadingBackups, setIsLoadingBackups] = useState(false)
  const [isRollingBack, setIsRollingBack] = useState(false)

  // Bulk edit states
  const [bulkEditModalVisible, setBulkEditModalVisible] = useState(false)
  const [isBulkEditing, setIsBulkEditing] = useState(false)
  const [bulkEditForm, setBulkEditForm] = useState({
    style: '',
    type: '',
    description: '',
    price: '',
  })

  // Style name edit states
  const [editStyleNameModalVisible, setEditStyleNameModalVisible] = useState(false)
  const [isEditingStyleName, setIsEditingStyleName] = useState(false)
  const [styleNameEditForm, setStyleNameEditForm] = useState({
    oldStyleName: '',
    newStyleName: '',
  })

  const [file, setFile] = useState(null)
  const dispatch = useDispatch()

  // Sort handler function
  const handleSort = (field) => {
    let newSortOrder = 'ASC'
    if (sortBy === field && sortOrder === 'ASC') {
      newSortOrder = 'DESC'
    }
    setSortBy(field)
    setSortOrder(newSortOrder)
    // Fetch data with new sorting
    fetchCatalogData(1, itemsPerPage, typeFilter, styleFilter, field, newSortOrder)
    setCurrentPage(1)
  }

  const [errors, setErrors] = useState({})
  const handleManualChange = (event) => {
    setManualForm({ ...manualForm, [event.currentTarget.name]: event.currentTarget.value })
  }

  const validateManualForm = () => {
    const newErrors = {}
    Object.entries(manualForm).forEach(([key, value]) => {
      if (!value || !value.toString().trim()) {
        newErrors[key] = `${key.charAt(0).toUpperCase() + key.slice(1)} is required`
      }
    })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const resetManualForm = () => {
    setManualForm(initialManualForm)
    setErrors({})
  }

  const handleSaveManualItem = async () => {
    if (isSaving) return // Prevent double submission
    if (!validateManualForm()) return
    setIsSaving(true)

    try {
      await axiosInstance.post(`/api/manufacturers/catalog/${manufacturer.id}`, manualForm)
      toast({
        title: t('common.success', 'Success'),
        description: t('settings.manufacturers.catalogMapping.catalogAdded', 'Catalog added successfully'),
        status: 'success',
        duration: 4000,
        isClosable: true,
      })
      // Reset and close modal
      setManualForm({ style: '', color: '', code: '', type: '', description: '', price: '' })
      // Refresh list (keep filters, reset to page 1 to show newest)
      fetchCatalogData(1, itemsPerPage, typeFilter, styleFilter, sortBy, sortOrder)

      setErrors({})
      resetManualForm()
      setManualModalVisible(false)
    } catch (err) {
      toast({
        title: t('common.error', 'Error'),
        description: t('settings.manufacturers.catalogMapping.saveFailed', 'Failed to save catalog'),
        status: 'error',
        duration: 4000,
        isClosable: true,
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleEditClick = (item) => {
    setEditForm({
      id: item.id,
      style: item.style || '',
      type: item.type || '',
      code: item.code || '',
      description: item.description || '',
      price: item.price || '',
    })
    setEditModalVisible(true)
  }

  const handleUpdateItem = async () => {
    // if (!validateManualForm()) return;
    setIsUpdating(true) // Start loading
    try {
      await axiosInstance.put(`/api/manufacturers/catalog/edit/${editForm.id}`, editForm)

      toast({
        title: t('common.success', 'Success'),
        description: t('settings.manufacturers.catalogMapping.catalogUpdated', 'Catalog updated successfully'),
        status: 'success',
        duration: 4000,
        isClosable: true,
      })

      setEditModalVisible(false)
      fetchCatalogData(currentPage, itemsPerPage, typeFilter, styleFilter, sortBy, sortOrder)
    } catch (err) {
      toast({
        title: t('common.error', 'Error'),
        description: t('settings.manufacturers.catalogMapping.updateFailed', 'Failed to update catalog'),
        status: 'error',
        duration: 4000,
        isClosable: true,
      })
    } finally {
      setIsUpdating(false) // End loading
    }
  }

  // Bulk selection handlers
  const handleSelectAll = (checked) => {
    setIsSelectAll(checked)
    if (checked) {
      setSelectedItems(currentItems.map((item) => item.id))
    } else {
      setSelectedItems([])
    }
  }

  const handleSelectItem = (itemId, checked) => {
    if (checked) {
      const newSelectedItems = [...selectedItems, itemId]
      setSelectedItems(newSelectedItems)

      // Check if all current page items are selected
      const currentPageIds = currentItems.map((item) => item.id)
      const allCurrentPageSelected = currentPageIds.every((id) => newSelectedItems.includes(id))
      setIsSelectAll(allCurrentPageSelected)
    } else {
      setSelectedItems((prev) => prev.filter((id) => id !== itemId))
      setIsSelectAll(false)
    }
  }

  // Update select all state when page changes
  React.useEffect(() => {
    const currentPageIds = currentItems.map((item) => item.id)
    const allCurrentPageSelected =
      currentPageIds.length > 0 && currentPageIds.every((id) => selectedItems.includes(id))
    setIsSelectAll(allCurrentPageSelected)
  }, [currentItems, selectedItems])

  // Individual delete handlers
  const handleDeleteItemClick = (item) => {
    setItemToDelete(item)
    setDeleteItemModalVisible(true)
  }

  const handleDeleteItem = async () => {
    if (!itemToDelete || isDeletingItem) return

    setIsDeletingItem(true)

    try {
      await axiosInstance.delete(`/api/manufacturers/catalog/edit/${itemToDelete.id}`)

      toast({
        title: t('common.success', 'Success'),
        description: t('settings.manufacturers.catalogMapping.itemDeleted', 'Item deleted successfully'),
        status: 'success',
        duration: 4000,
        isClosable: true,
      })

      // Reset modal state
      setDeleteItemModalVisible(false)
      setItemToDelete(null)

      // Refresh data
      fetchCatalogData(currentPage, itemsPerPage, typeFilter, styleFilter, sortBy, sortOrder)
    } catch (err) {
      toast({
        title: t('common.error', 'Error'),
        description: t('settings.manufacturers.catalogMapping.deleteFailed', 'Failed to delete item'),
        status: 'error',
        duration: 4000,
        isClosable: true,
      })
    } finally {
      setIsDeletingItem(false)
    }
  }

  // Bulk delete handlers
  const handleBulkDeleteClick = () => {
    if (selectedItems.length === 0) return
    setBulkDeleteModalVisible(true)
  }

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0 || isBulkDeleting) return

    setIsBulkDeleting(true)

    try {
      // Delete items one by one (could be optimized with a bulk endpoint)
      const deletePromises = selectedItems.map((itemId) =>
        axiosInstance.delete(`/api/manufacturers/catalog/edit/${itemId}`),
      )
      await Promise.all(deletePromises)

      toast({
        title: t('common.success', 'Success'),
        description: t('settings.manufacturers.catalogMapping.bulkDeleteSuccess', `Successfully deleted ${selectedItems.length} items`),
        status: 'success',
        duration: 4000,
        isClosable: true,
      })

      // Reset states
      setBulkDeleteModalVisible(false)
      setSelectedItems([])
      setIsSelectAll(false)

      // Refresh data
      fetchCatalogData(currentPage, itemsPerPage, typeFilter, styleFilter, sortBy, sortOrder)
    } catch (err) {
      toast({
        title: t('common.error', 'Error'),
        description: t('settings.manufacturers.catalogMapping.bulkDeleteFailed', 'Failed to delete some items'),
        status: 'error',
        duration: 4000,
        isClosable: true,
      })
    } finally {
      setIsBulkDeleting(false)
    }
  }

  // Cleanup duplicates handler
  const handleCleanupDuplicates = async () => {
    if (isCleaningDuplicates) return

    setIsCleaningDuplicates(true)

    try {
      const { data: result } = await axiosInstance.post(
        `/api/manufacturers/${id}/cleanup-duplicates`,
        null,
      )

      toast({
        title: result.duplicatesRemoved > 0 ? t('common.success', 'Success') : t('common.info', 'Info'),
        description: result.message,
        status: result.duplicatesRemoved > 0 ? 'success' : 'info',
        duration: 4000,
        isClosable: true,
      })

      // Refresh data if duplicates were removed
      if (result.duplicatesRemoved > 0) {
        fetchCatalogData(1, itemsPerPage, typeFilter, styleFilter, sortBy, sortOrder)
        setCurrentPage(1)
      }
    } catch (err) {
      toast({
        title: t('common.error', 'Error'),
        description: t('settings.manufacturers.catalogMapping.cleanupFailed', 'Failed to cleanup duplicates'),
        status: 'error',
        duration: 4000,
        isClosable: true,
      })
    } finally {
      setIsCleaningDuplicates(false)
    }
  }

  // Rollback functions
  const handleRollbackClick = async () => {
    setIsLoadingBackups(true)
    setRollbackModalVisible(true)

    try {
      const { data: result } = await axiosInstance.get(`/api/manufacturers/${id}/catalog/backups`)
      setAvailableBackups(result.backups || [])
    } catch (err) {
      toast({
        title: t('common.error', 'Error'),
        description: t('settings.manufacturers.catalogMapping.backupLoadFailed', 'Failed to load backup history'),
        status: 'error',
        duration: 4000,
        isClosable: true,
      })
    } finally {
      setIsLoadingBackups(false)
    }
  }

  const handleRollback = async () => {
    if (!selectedBackup || isRollingBack) return

    setIsRollingBack(true)

    try {
      const { data: result } = await axiosInstance.post(
        `/api/manufacturers/${id}/catalog/rollback`,
        { uploadSessionId: selectedBackup },
      )

      toast({
        title: t('common.success', 'Success'),
        description: result.message || t('settings.manufacturers.catalogMapping.rollback.success'),
        status: 'success',
        duration: 4000,
        isClosable: true,
      })

      // Reset modal state
      setRollbackModalVisible(false)
      setSelectedBackup('')
      setAvailableBackups([])

      // Refresh data
      fetchCatalogData(1, itemsPerPage, typeFilter, styleFilter, sortBy, sortOrder)
      setCurrentPage(1)
    } catch (err) {
      toast({
        title: t('common.error', 'Error'),
        description: t('settings.manufacturers.catalogMapping.rollback.failed'),
        status: 'error',
        duration: 4000,
        isClosable: true,
      })
    } finally {
      setIsRollingBack(false)
    }
  }

  const handleDeleteStyleClick = (styleName) => {
    setStyleToDelete(styleName)
    setMergeToStyle('')
    setDeleteStyleModalVisible(true)
  }

  const handleDeleteStyle = async () => {
    if (!styleToDelete || isDeleting) return

    setIsDeleting(true)

    try {
      const requestBody = mergeToStyle ? { mergeToStyle } : {}

      const { data: result } = await axiosInstance.delete(
        `/api/manufacturers/${id}/style/${encodeURIComponent(styleToDelete)}`,
        {
          data: requestBody,
        },
      )

      toast({
        title: t('common.success', 'Success'),
        description: result.message || t('settings.manufacturers.catalogMapping.styleOperationSuccess', 'Style operation completed successfully'),
        status: 'success',
        duration: 4000,
        isClosable: true,
      })

      // Reset modal state
      setDeleteStyleModalVisible(false)
      setStyleToDelete('')
      setMergeToStyle('')

      // Refresh data
      fetchCatalogData(1, itemsPerPage, typeFilter, styleFilter, sortBy, sortOrder)

      // Reset current page if we're beyond the new total pages
      setCurrentPage(1)
    } catch (err) {
      toast({
        title: t('common.error', 'Error'),
        description: t('settings.manufacturers.catalogMapping.styleDeleteFailed', 'Failed to delete/merge style'),
        status: 'error',
        duration: 4000,
        isClosable: true,
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // Bulk edit handlers
  const handleBulkEditClick = () => {
    if (selectedItems.length === 0) return
    setBulkEditForm({
      style: '',
      type: '',
      description: '',
      price: '',
    })
    setBulkEditModalVisible(true)
  }

  const handleBulkEdit = async () => {
    if (selectedItems.length === 0 || isBulkEditing) return

    // Check if at least one field is filled
    const hasUpdates = Object.values(bulkEditForm).some((value) => value && value.trim() !== '')
    if (!hasUpdates) {
      toast({
        title: t('common.warning', 'Warning'),
        description: t('settings.manufacturers.catalogMapping.fillAtLeastOneField', 'Please fill at least one field to update'),
        status: 'warning',
        duration: 4000,
        isClosable: true,
      })
      return
    }

    setIsBulkEditing(true)

    try {
      // Prepare updates object (only include non-empty fields)
      const updates = {}
      Object.keys(bulkEditForm).forEach((key) => {
        if (bulkEditForm[key] && bulkEditForm[key].trim() !== '') {
          updates[key] = bulkEditForm[key].trim()
        }
      })

      const { data: result } = await axiosInstance.put(`/api/manufacturers/catalog/bulk-edit`, {
        itemIds: selectedItems,
        updates,
      })

      toast({
        title: t('common.success', 'Success'),
        description: result.message || t('settings.manufacturers.catalogMapping.bulkEditSuccess', `Successfully updated ${selectedItems.length} items`),
        status: 'success',
        duration: 4000,
        isClosable: true,
      })

      // Reset states
      setBulkEditModalVisible(false)
      setSelectedItems([])
      setIsSelectAll(false)
      setBulkEditForm({
        style: '',
        type: '',
        description: '',
        price: '',
      })

      // Refresh data
      fetchCatalogData(currentPage, itemsPerPage, typeFilter, styleFilter, sortBy, sortOrder)
    } catch (err) {
      toast({
        title: t('common.error', 'Error'),
        description: t('settings.manufacturers.catalogMapping.bulkEditFailed', 'Failed to bulk edit items'),
        status: 'error',
        duration: 4000,
        isClosable: true,
      })
    } finally {
      setIsBulkEditing(false)
    }
  }

  // Style name edit handlers
  const handleEditStyleNameClick = (styleName) => {
    setStyleNameEditForm({
      oldStyleName: styleName,
      newStyleName: '',
    })
    setEditStyleNameModalVisible(true)
  }

  const handleEditStyleName = async () => {
    if (!styleNameEditForm.oldStyleName || !styleNameEditForm.newStyleName || isEditingStyleName)
      return

    if (styleNameEditForm.oldStyleName.trim() === styleNameEditForm.newStyleName.trim()) {
      toast({
        title: t('common.warning', 'Warning'),
        description: t('settings.manufacturers.catalogMapping.styleNameMustBeDifferent', 'New style name must be different from the old one'),
        status: 'warning',
        duration: 4000,
        isClosable: true,
      })
      return
    }

    setIsEditingStyleName(true)

    try {
      const { data: result } = await axiosInstance.put(`/api/manufacturers/${id}/style-name`, {
        oldStyleName: styleNameEditForm.oldStyleName.trim(),
        newStyleName: styleNameEditForm.newStyleName.trim(),
      })

      toast({
        title: t('common.success', 'Success'),
        description: result.message || t('settings.manufacturers.catalogMapping.styleNameUpdated', 'Style name updated successfully'),
        status: 'success',
        duration: 4000,
        isClosable: true,
      })

      // Reset modal state
      setEditStyleNameModalVisible(false)
      setStyleNameEditForm({
        oldStyleName: '',
        newStyleName: '',
      })

      // Refresh data
      fetchCatalogData(currentPage, itemsPerPage, typeFilter, styleFilter, sortBy, sortOrder)
    } catch (err) {
      toast({
        title: t('common.error', 'Error'),
        description: err.message || t('settings.manufacturers.catalogMapping.styleNameEditFailed', 'Failed to edit style name'),
        status: 'error',
        duration: 4000,
        isClosable: true,
      })
    } finally {
      setIsEditingStyleName(false)
    }
  }

  const handleFileChange = (event) => {
    const selectedFile = event.currentTarget.files[0]
    if (selectedFile) {
      const allowedTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ]

      if (!allowedTypes.includes(selectedFile.type)) {
        toast({
          title: t('common.error', 'Error'),
          description: t(
            'settings.manufacturers.catalogMapping.unsupportedFileType',
            'Please upload a CSV or Excel file.',
          ),
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
        return
      }

      setFile(selectedFile)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    // Check file size and show appropriate warning
    const fileSizeInMB = file.size / (1024 * 1024)
    const isLargeFile = fileSizeInMB > 10

    if (fileSizeInMB > 50) {
      toast({
        title: t('common.error', 'Error'),
        description: `File too large (${fileSizeInMB.toFixed(2)}MB). Maximum size is 50MB. Please split your file into smaller chunks.`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      return
    }

    if (isLargeFile) {
      const proceed = await askConfirm({
        title: t('settings.manufacturers.catalogMapping.largeFileTitle', 'Large File Warning'),
        description: t('settings.manufacturers.catalogMapping.largeFileMessage', `This file is ${fileSizeInMB.toFixed(2)}MB. Large files may take several minutes to process. Continue?`),
        confirmText: t('common.continue', 'Continue'),
        cancelText: t('common.cancel', 'Cancel'),
      })
      if (!proceed) return
    }

    const formData = new FormData()
    formData.append('catalogFiles', file)

    // Show loading with progress for large files
    const uploadToastId = 'upload-progress'
    if (isLargeFile && !toast.isActive(uploadToastId)) {
      toast({
        id: uploadToastId,
        title: 'Processing Large File',
        description: `Processing ${fileSizeInMB.toFixed(2)}MB file... This may take a few minutes.`,
        status: 'info',
        duration: null,
        isClosable: false,
      })
    }

    try {
      const startTime = Date.now()

      const { data: result } = await axiosInstance.post(
        `/api/manufacturers/${id}/catalog/upload`,
        formData,
      )
      const processingTime = ((Date.now() - startTime) / 1000).toFixed(1)

      // Close progress toast if it was shown
      if (isLargeFile) toast.close(uploadToastId)

      // Enhanced success message with detailed stats
      let successMessage = t('settings.manufacturers.catalogMapping.file.uploadSuccess')
      if (result.stats) {
        successMessage += `\n\nFile: ${fileSizeInMB.toFixed(2)}MB`
        successMessage += `\nProcessing: ${result.stats.processingMethod || 'regular'}`
        successMessage += `\nTime: ${processingTime}s`
        successMessage += `\n\nItems processed: ${result.stats.totalProcessed}`
        successMessage += `\nCreated: ${result.stats.created} | Updated: ${result.stats.updated}`

        if (result.stats.backupCreated) {
          successMessage += `\n\n✅ Backup created - you can rollback this upload if needed.`
        }
      }

      toast({
        title: t('common.success', 'Success'),
        description: successMessage,
        status: 'success',
        duration: 6000,
        isClosable: true,
      })

      setFileModalVisible(false)
      setFile(null)
      fetchCatalogData(1, itemsPerPage, typeFilter, styleFilter, sortBy, sortOrder) // Reload updated data
    } catch (err) {
      // Close progress toast if it was shown
      if (isLargeFile) toast.close(uploadToastId)

      let errorMessage = err.message || t('settings.manufacturers.catalogMapping.file.uploadFailed')
      toast({
        title: t('common.error', 'Error'),
        description:
          isLargeFile
            ? `${errorMessage}\nTip: For very large files (>10,000 rows), consider splitting them into smaller files.`
            : errorMessage,
        status: 'error',
        duration: 6000,
        isClosable: true,
      })
    }
  }

  const [showStyleModal, setShowStyleModal] = useState(false)
  const [selectedStyle, setSelectedStyle] = useState('')
  const [styleForm, setStyleForm] = useState({
    name: '',
    shortName: '',
    description: '',
    image: '',
    catalogId: '',
    manufacturerId: '',
    code: '',
  })

  const handleManageStyleClick = async (item) => {
    const { id: catalogId, manufacturerId, style, code } = item

    try {
      const response = await axiosInstance.get(`/api/manufacturers/style/${catalogId}`)
      const data = response.data

      if (data) {
        // Prefill the form with existing DB data
        setSelectedStyle(data.name || style || '')
        setStyleForm({
          name: data.name || '',
          shortName: data.shortName || '',
          description: data.description || '',
          image: data.image || '',
          catalogId,
          manufacturerId,
          code,
        })
        setStyleImage(null) // Clear any previously selected image
      } else {
        // No existing data
        setSelectedStyle(style || '')
        setStyleForm({
          name: style || '',
          shortName: '',
          description: '',
          image: '',
          catalogId,
          manufacturerId,
          code,
        })
        setStyleImage(null)
      }

      setShowStyleModal(true)
    } catch (error) {
      // Fallback to minimal data
      setSelectedStyle(style || '')
      setStyleForm({
        name: style || '',
        shortName: '',
        description: '',
        image: '',
        catalogId,
        manufacturerId,
        code,
      })
      setStyleImage(null)
      setShowStyleModal(true)
    }
  }

  const handleStyleFormChange = (event) => {
    const { name, value } = event.currentTarget
    setStyleForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSaveStyle = async (e) => {
    e.preventDefault()
    try {
      const formDataToSend = new FormData()
      Object.keys(styleForm).forEach((key) => {
        formDataToSend.append(key, styleForm[key])
      })
      if (styleImage) {
        formDataToSend.append('styleImage', styleImage)
      }
      const response = await axiosInstance.post('/api/manufacturers/style/create', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      if (response.data.status == 200) {
        setStyleForm({
          name: '',
          shortName: '',
          description: '',
          image: '',
        })

        toast({
          title: t('common.success', 'Success'),
          description: t('settings.manufacturers.catalogMapping.styleUpdated', 'Catalog Style Updated successfully'),
          status: 'success',
          duration: 4000,
          isClosable: true,
        })
      }
    } catch (error) {
      // Error handling for style save
    } finally {
      // setLoading(false);
      setStyleImage('')
      setShowStyleModal(false)
    }
  }

  const [showStyleViewModal, setShowStyleViewModal] = useState(false)
  const [styleDetails, setStyleDetails] = useState(null)

  const handleShowStyleOnClick = async (item) => {
    try {
      const { id } = item
      const res = await axiosInstance.get(`/api/manufacturers/style/${id}`)

      if (res.data) {
        setStyleDetails(res.data)
        setShowStyleViewModal(true)
      }
    } catch (error) {
      console.error('Error fetching style:', error)
      setStyleDetails(null)
    } finally {
      setShowStyleViewModal(true)
    }
  }

  // Fetch available types for the manufacturer
  const fetchAvailableTypes = async () => {
    if (!id) return
    try {
      const response = await axiosInstance.get(`/api/manufacturers/${id}/types`)
      if (response.data.success) {
        setAvailableTypes(response.data.data || [])
      }
    } catch (error) {
      setAvailableTypes([])
    }
  }

  // Fetch assembly costs by types
  const fetchAssemblyCostsByTypes = async () => {
    if (!id) return
    try {
      const response = await axiosInstance.get(`/api/manufacturers/${id}/assembly-costs-by-types`)
      if (response.data.success) {
        setAssemblyCostsByType(response.data.data || {})
      }
    } catch (error) {
      setAssemblyCostsByType({})
    }
  }

  const handleAssemblyCostClick = async (item) => {
    try {
      const { id } = item

      const res = await axiosInstance.get(`/api/manufacturers/assemblycost/${id}`)

      const { type, price } = res.data || {}
      setSelectedCatalogItem(item)

      // Fetch available types and assembly costs for the dropdown
      await fetchAvailableTypes()
      await fetchAssemblyCostsByTypes()

      setAssemblyData({
        type: type || '',
        price: price || '',
        applyTo: 'one',
        selectedItemType: item.type || '',
        selectedTypes: [],
      })
    } catch (error) {
      // Fetch available types even if assembly cost fetch fails
      await fetchAvailableTypes()
      await fetchAssemblyCostsByTypes()
      setSelectedCatalogItem(item)
      setAssemblyData({
        type: '',
        price: '',
        applyTo: 'one',
        selectedItemType: item.type || '',
        selectedTypes: [],
      })
    } finally {
      setShowAssemblyModal(true)
    }
  }

  // const handleHingesDetailsClick = async (item) => {
  //   try {
  //     setSelectedCatalogItem(item);

  //     const res = await axiosInstance.get(`/api/manufacturers/items/hinges/${item.id}`);
  //     const { leftHingePrice, rightHingePrice, bothHingesPrice, exposedSidePrice } = res.data.data || {};

  //     setHingesData({
  //       leftHingePrice: leftHingePrice || '',
  //       rightHingePrice: rightHingePrice || '',
  //       bothHingePrice: bothHingesPrice || '',
  //       exposedSidePrice: exposedSidePrice || '',
  //     });
  //   } catch (error) {
  //     console.error('Error fetching hinges details:', error);
  //     setHingesData({
  //       leftHingePrice: '',
  //       rightHingePrice: '',
  //       bothHingePrice: '',
  //       exposedSidePrice: '',
  //     }); // fallback to blank if error
  //   } finally {
  //     setShowHingesModal(true);
  //   }
  // };

  const saveAssemblyCost = async () => {
    if (isAssemblyCostSaving) return // Prevent multiple submissions

    try {
      setIsAssemblyCostSaving(true)

      // Validation
      if (assemblyData.applyTo === 'type' && !assemblyData.selectedItemType) {
        toast({
          title: t('common.validationError', 'Validation Error'),
          description: t('settings.manufacturers.catalogMapping.selectItemType', 'Please select an item type when applying by type.'),
          status: 'warning',
          duration: 5000,
          isClosable: true,
        })
        return
      }

      if (assemblyData.applyTo === 'types' && assemblyData.selectedTypes.length === 0) {
        toast({
          title: t('common.validationError', 'Validation Error'),
          description: t('settings.manufacturers.catalogMapping.selectTypes', 'Please select at least one item type when applying by types.'),
          status: 'warning',
          duration: 5000,
          isClosable: true,
        })
        return
      }

      if (
        !assemblyData.type ||
        assemblyData.price === '' ||
        assemblyData.price === null ||
        assemblyData.price === undefined
      ) {
        toast({
          title: t('common.validationError', 'Validation Error'),
          description: t(
            'settings.manufacturers.catalogMapping.fillBothFields',
            'Please fill in both Type and Price fields.',
          ),
          status: 'warning',
          duration: 5000,
          isClosable: true,
        })
        return
      }

      const payload = {
        catalogDataId: selectedCatalogItem.id,
        type: assemblyData.type,
        price: parseFloat(assemblyData.price) || 0,
        applyTo: assemblyData.applyTo || 'one',
        manufacturerId: selectedCatalogItem.manufacturerId,
      }

      // Add itemType if applying by single type
      if (assemblyData.applyTo === 'type') {
        payload.itemType = assemblyData.selectedItemType
      }

      // Add selectedTypes if applying by multiple types
      if (assemblyData.applyTo === 'types') {
        payload.selectedTypes = assemblyData.selectedTypes
      }

      await axiosInstance.post('/api/manufacturers/items/assembly-cost', payload)

      // Refresh the assembly costs data to show updated badges
      await fetchAssemblyCostsByTypes()

      // Close modal and show success message
      setShowAssemblyModal(false)

      // Show success message based on application scope
      const price = parseFloat(assemblyData.price) || 0
      const priceText = price === 0 ? 'No assembly cost (0$)' : `$${price.toFixed(2)} assembly cost`
      let successMessage = ''
      switch (assemblyData.applyTo) {
        case 'one':
          successMessage = `${priceText} applied to item "${selectedCatalogItem.code}"`
          break
        case 'type':
          successMessage = `${priceText} applied to all items of type "${assemblyData.selectedItemType}"`
          break
        case 'types':
          successMessage = `${priceText} applied to ${assemblyData.selectedTypes.length} selected types`
          break
        case 'all':
          successMessage = `${priceText} applied to all items`
          break
        default:
          successMessage = 'Assembly cost saved successfully'
      }

      toast({
        title: t('common.success', 'Success'),
        description: successMessage,
        status: 'success',
        duration: 5000,
        isClosable: true,
      })

      // Refresh the catalog data to show updated assembly costs
      fetchCatalogData()
    } catch (error) {
      toast({
        title: t('common.error', 'Error'),
        description: t(
          'settings.manufacturers.catalogMapping.saveError',
          'Failed to save assembly cost. Please try again.',
        ),
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsAssemblyCostSaving(false)
    }
  }

  const handleModificationDetailsClick = async (item) => {
    setSelectedCatalogItem(item)
    setModificationData({
      modificationName: '',
      description: '',
      notes: '',
      price: '',
    })
    setShowModificationModal(true)
  }
  const saveHingesDetails = async () => {
    try {
      const payload = {
        catalogDataId: selectedCatalogItem.id,
        leftHingePrice: parseFloat(hingesData.leftHingePrice) || 0,
        rightHingePrice: parseFloat(hingesData.rightHingePrice) || 0,
        bothHingesPrice: parseFloat(hingesData.bothHingePrice) || 0,
        exposedSidePrice: parseFloat(hingesData.exposedSidePrice) || 0,
      }
      await axiosInstance.post('/api/manufacturers/items/hinges', payload)
      setShowHingesModal(false)
    } catch (error) {
      // Error saving hinges details
    }
  }

  const saveModificationDetails = async () => {
    try {
      const payload = {
        catalogDataId: selectedCatalogItem.id,
        modificationName: modificationData.modificationName,
        description: modificationData.description,
        notes: modificationData.notes,
        price: parseFloat(modificationData.price) || 0,
      }

      await axiosInstance.post('/api/manufacturers/items/modifications', payload)
      setShowModificationModal(false)
    } catch (error) {
      // Error saving modification details
    }
  }

  return (
    <div>
      <style>
        {`
          .form-check-input:not(:checked) {
            background-color: white !important;
            border-color: var(--chakra-colors-gray-500) !important;
            border-width: 2px !important;
            opacity: 1 !important;
          }
          .form-check-input:checked {
            background-color: var(--chakra-colors-green-500) !important;
            border-color: var(--chakra-colors-green-500) !important;
          }
          .form-check-input:focus {
            border-color: var(--chakra-colors-green-500) !important;
            box-shadow: 0 0 0 0.25rem rgba(72, 187, 120, 0.25) !important;
          }

          /* Mobile responsive styles */
      @media (max-width: 767px) {
            .table-responsive {
              border: none;
            }
            .table td {
              padding: 8px 4px !important;
              font-size: 12px;
            }
            .table th {
              padding: 8px 4px !important;
              font-size: 11px;
              font-weight: 600;
            }
            .btn-sm {
        padding: 6px 10px !important;
        font-size: 12px !important;
        min-height: 44px;
            }
            .mobile-stack {
              display: flex;
              flex-direction: column;
              gap: 4px;
            }
          }

          @media (max-width: 576px) {
            .table td, .table th {
              padding: 6px 2px !important;
            }
            .actions-column {
              min-width: 120px;
            }
          }
        `}
      </style>

      {/* Page Header with Mobile-Optimized Layout */}
      <PageHeader
        title={t('settings.manufacturers.catalogMapping.title')}
        mobileLayout="compact"
        rightContent={
          <HStack spacing={4} flexWrap="wrap" className="catalog-actions">
            <Button
              bg={headerBg}
              color={textColor}
              borderColor={headerBg}
              _hover={{ bg: headerBg, opacity: 0.9 }}
              size="sm"
              onClick={() => setFileModalVisible(true)}
              aria-label={t('settings.manufacturers.catalogMapping.buttons.uploadCsv')}
              leftIcon={<Icon as={Upload} boxSize={ICON_BOX_MD} />}
              minH="44px"
            >
              <Text display={{ base: 'none', sm: 'inline' }}>
                {t('settings.manufacturers.catalogMapping.buttons.uploadCsv')}
              </Text>
              <Text display={{ base: 'inline', sm: 'none' }}>CSV</Text>
            </Button>
            <Button
              bg={headerBg}
              color={textColor}
              borderColor={headerBg}
              _hover={{ bg: headerBg, opacity: 0.9 }}
              size="sm"
              onClick={() => setManualModalVisible(true)}
              aria-label={t('settings.manufacturers.catalogMapping.buttons.addItem')}
              leftIcon={<Icon as={Plus} boxSize={ICON_BOX_MD} />}
              minH="44px"
            >
              <Text display={{ base: 'none', sm: 'inline' }}>
                {t('settings.manufacturers.catalogMapping.buttons.addItem')}
              </Text>
              <Text display={{ base: 'inline', sm: 'none' }}>
                {t('settings.manufacturers.catalogMapping.buttons.addShort', 'Add')}
              </Text>
            </Button>
            <Button
              colorScheme="brand"
              size="sm"
              onClick={() => setShowMainModificationModal(true)}
              title={t('settings.manufacturers.catalogMapping.actions.modificationManagementTitle')}
              aria-label={t(
                'settings.manufacturers.catalogMapping.actions.modificationManagementTitle',
              )}
              leftIcon={<Icon as={Wrench} boxSize={ICON_BOX_MD} />}
              minH="44px"
            >
              <Text display={{ base: 'none', sm: 'inline' }}>
                {t('settings.manufacturers.catalogMapping.actions.modification')}
              </Text>
              <Text display={{ base: 'inline', sm: 'none' }}>
                {t('settings.manufacturers.catalogMapping.actions.modificationShort', 'Mods')}
              </Text>
            </Button>
            <Button
              colorScheme="purple"
              size="sm"
              onClick={openAssignGlobal}
              title={t('settings.manufacturers.catalogMapping.actions.assignGlobalModsTitle')}
              aria-label={t('settings.manufacturers.catalogMapping.actions.assignGlobalModsTitle')}
              leftIcon={<Icon as={Sparkles} boxSize={ICON_BOX_MD} />}
              minH="44px"
            >
              <Text display={{ base: 'none', sm: 'inline' }}>
                {t('settings.manufacturers.catalogMapping.actions.assignMods')}
              </Text>
              <Text display={{ base: 'inline', sm: 'none' }}>
                {t('settings.manufacturers.catalogMapping.actions.assignModsShort', 'Assign')}
              </Text>
            </Button>
            <Button
              colorScheme="orange"
              size="sm"
              onClick={handleCleanupDuplicates}
              isDisabled={isCleaningDuplicates}
              title={t('settings.manufacturers.catalogMapping.cleanupDuplicates.tooltip')}
              aria-label={t('settings.manufacturers.catalogMapping.cleanupDuplicates.tooltip')}
              leftIcon={
                isCleaningDuplicates ? <Spinner size="sm" /> : <Icon as={RefreshCw} boxSize={ICON_BOX_MD} />
              }
              minH="44px"
            >
              <Text display={{ base: 'none', sm: 'inline' }}>
                {isCleaningDuplicates
                  ? t('settings.manufacturers.catalogMapping.cleanupDuplicates.cleaning')
                  : t(
                      'settings.manufacturers.catalogMapping.cleanupDuplicates.cta',
                      'Cleanup duplicates',
                    )}
              </Text>
              <Text display={{ base: 'inline', sm: 'none' }}>
                {isCleaningDuplicates ? '...' : t('common.clean', 'Clean')}
              </Text>
            </Button>
            <Button
              bg={headerBg}
              color={textColor}
              borderColor={headerBg}
              _hover={{ bg: headerBg, opacity: 0.9 }}
              size="sm"
              onClick={handleRollbackClick}
              isDisabled={(pagination.total || 0) === 0}
              title={t(
                'settings.manufacturers.catalogMapping.rollback.tooltip',
                'Rollback recent catalog upload',
              )}
              aria-label={t('settings.manufacturers.catalogMapping.rollback.buttonText')}
              leftIcon={<Icon as={ChevronDown} boxSize={ICON_BOX_MD} transform="rotate(90deg)" />}
              minH="44px"
            >
              <Text display={{ base: 'none', sm: 'inline' }}>
                {t('settings.manufacturers.catalogMapping.rollback.buttonText')}
              </Text>
              <Text display={{ base: 'inline', sm: 'none' }}>
                {t('settings.manufacturers.catalogMapping.rollback.short', 'Undo')}
              </Text>
            </Button>
          </HStack>
        }
      />

      <style>{`
        .catalog-actions {
          width: 100%;
        }

        /* Mobile card styles */
        .mobile-catalog-card {
          border: 1px solid var(--chakra-colors-gray-200);
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          transition: box-shadow 0.2s ease;
        }

        .mobile-catalog-card:hover {
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }

        .mobile-cards-container {
          max-height: 70vh;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
        }

        /* Improved touch targets for mobile */
          .mobile-catalog-card .btn {
            min-height: 44px;
            font-size: 12px;
            white-space: nowrap;
          }

        .mobile-catalog-card .form-check-input {
          width: 18px;
          height: 18px;
        }

        @media (max-width: 767px) {
          .catalog-actions {
            justify-content: stretch;
          }

          .catalog-actions .btn {
            flex: 1;
            min-width: 0;
            min-height: 44px;
            font-size: 0.875rem !important;
            padding: 0.5rem 0.75rem !important;
          }

          /* Better mobile table */
          .table-responsive {
            -webkit-overflow-scrolling: touch;
          }

          .table td, .table th {
            min-width: 100px;
            white-space: nowrap;
          }

          /* Mobile-optimized filters */
          .form-select, .form-control {
            min-height: 44px;
            font-size: 0.95rem;
          }

          /* Mobile card specific improvements */
          .mobile-catalog-card .card-body {
            padding: 0.75rem !important;
          }

          .mobile-catalog-card .btn {
            padding: 6px 10px;
            font-size: 11px;
          }

          .mobile-catalog-card .row.g-2 > .col-6 {
            margin-bottom: 0.5rem;
          }

          /* Compact header for mobile */
          .page-header-dynamic {
            margin-bottom: 0.75rem !important;
          }
        }

        @media (max-width: 575px) {
          .catalog-actions {
            flex-direction: row; /* Keep inline on small screens */
            gap: 0.25rem;
          }

          .catalog-actions .btn {
            flex: 1;
            min-width: 0;
            font-size: 0.8rem !important;
            padding: 0.4rem 0.5rem !important;
            min-height: 44px;
          }

          /* Stack filters vertically on very small screens */
          .row.g-2 > .col-12 {
            margin-bottom: 0.5rem; /* Reduced spacing */
          }

          .row.g-2 > .col-12:last-child {
            margin-bottom: 0;
          }

          /* Mobile card actions more compact */
          .mobile-catalog-card .d-flex.flex-wrap .btn {
            padding: 4px 8px;
            font-size: 10px;
            margin-bottom: 0.15rem;
          }

          .mobile-catalog-card .card-body {
            padding: 0.5rem !important;
          }

          .mobile-catalog-card .card-title {
            font-size: 0.9rem;
            margin-bottom: 0.25rem;
          }

          .mobile-catalog-card small {
            font-size: 0.75rem;
          }
        }

        /* Better touch scrolling for table */
        .table-container {
          -webkit-overflow-scrolling: touch;
          overflow-x: auto;
        }

        /* Better mobile pagination */
        @media (max-width: 767px) {
          .pagination {
            flex-wrap: wrap;
            justify-content: center;
          }

          .page-item .page-link {
            min-width: 44px;
            min-height: 44px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.875rem;
          }
        }

        /* Hide unnecessary elements on mobile */
        @media (max-width: 576px) {
          .mobile-catalog-card .card-title {
            font-size: 14px;
          }

          .mobile-catalog-card small {
            font-size: 11px;
          }
        }
  `}</style>

      {/* Sub-Types Management Section */}
      <StandardCard>
        <CardHeader>
          <h6>{t('settings.manufacturers.catalogMapping.subTypes.header')}</h6>
          <Button
            colorScheme="blue"
            size="sm"
            onClick={() => {
              setSubTypeForm({
                name: '',
                description: '',
                requires_hinge_side: false,
                requires_exposed_side: false,
              })
              setEditingSubType(null)
              setShowSubTypeModal(true)
            }}
          >
            <Plus size={ICON_SIZE_MD} aria-hidden="true" />{' '}
            {t('settings.manufacturers.catalogMapping.subTypes.create')}
          </Button>
        </CardHeader>
        <CardBody>
          {subTypes.length === 0 ? (
            <p>
              {t('settings.manufacturers.catalogMapping.subTypes.empty')}
            </p>
          ) : (
            <div className="row g-3">
              {subTypes.map((subType) => (
                <div key={subType.id} className="col-md-6 col-lg-4">
                  <StandardCard>
                    <CardBody>
                      <h6>{subType.name}</h6>
                      {subType.description && (
                        <p className="card-text small text-muted">{subType.description}</p>
                      )}
                      <div>
                        {subType.requires_hinge_side && (
                          <Badge colorScheme="info">
                            {t('settings.manufacturers.catalogMapping.subTypes.requiresHinge')}
                          </Badge>
                        )}
                        {subType.requires_exposed_side && (
                          <Badge colorScheme="warning">
                            {t('settings.manufacturers.catalogMapping.subTypes.requiresExposed')}
                          </Badge>
                        )}
                      </div>
                      <div>
                        <Button
                          colorScheme="blue"
                          size="sm"
                          onClick={() => {
                            setSubTypeForm({
                              name: subType.name,
                              description: subType.description || '',
                              requires_hinge_side: subType.requires_hinge_side,
                              requires_exposed_side: subType.requires_exposed_side,
                            })
                            setEditingSubType(subType)
                            setShowSubTypeModal(true)
                          }}
                          aria-label={t('common.edit')}
                        >
                          {t('common.edit')}
                        </Button>
                        <Button
                          color="success"
                          size="sm"
                          onClick={() => {
                            setSelectedSubType(subType.id)
                            setShowAssignSubTypeModal(true)
                          }}
                          aria-label={t(
                            'settings.manufacturers.catalogMapping.subTypes.assignItems',
                          )}
                        >
                          {t('settings.manufacturers.catalogMapping.subTypes.assignItems')}
                        </Button>
                        <Button
                          colorScheme="red"
                          size="sm"
                          onClick={() => handleSubTypeDelete(subType)}
                          aria-label={t('common.delete')}
                        >
                          {t('common.delete')}
                        </Button>
                      </div>
                    </CardBody>
                  </StandardCard>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </StandardCard>

      {/* Mobile-Optimized Filters and Pagination */}
      <div className="row g-2 mb-3">
        {/* Items per page - Full width on mobile */}
        <div className="col-12 col-sm-6 col-lg-auto">
          <div>
            <select
              className="form-select form-select-sm"
              style={{ width: 'auto', minWidth: '60px' }}
              value={itemsPerPage}
              aria-label={t(
                'settings.manufacturers.catalogMapping.pagination.itemsPerPage',
                'Items per page',
              )}
              onChange={(event) => {
                const value = parseInt(event.currentTarget.value, 10)
                setItemsPerPage(value)
                localStorage.setItem('catalogItemsPerPage', value)
                setCurrentPage(1)
                fetchCatalogData(1, value, typeFilter, styleFilter, sortBy, sortOrder)
              }}
            >
              {[10, 25, 50, 100, 200].map((num) => (
                <option key={num} value={num}>
                  {num}
                </option>
              ))}
            </select>
            <span className="text-muted small d-none d-sm-inline">
              {t('settings.manufacturers.catalogMapping.pagination.perPage')}
            </span>
            <span className="text-muted small d-sm-none">per page</span>
          </div>
        </div>

        {/* Search Filter - Prominent on mobile */}
        <div className="col-12 col-sm-12 col-lg-4 order-first order-lg-3">
          <div>
            <input
              aria-label={t('settings.manufacturers.catalogMapping.search', 'Search styles')}
              type="text"
              className="form-control form-control-sm"
              placeholder="🔍 Search styles..."
              value={searchFilter}
              onChange={(event) => setSearchFilter(event.currentTarget.value)}
              style={{ paddingRight: searchFilter ? '35px' : '12px' }}
            />
            {searchFilter && (
              <button
                type="button"
                aria-label={t('common.clearSearch', 'Clear search')}
                className="btn btn-sm btn-link position-absolute top-0 end-0 p-1"
                onClick={() => setSearchFilter('')}
                style={{ color: "gray.500", textDecoration: 'none', zIndex: 5 }}
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Type Filter */}
        <div className="col-6 col-sm-6 col-lg-auto">
          <select
            className="form-select form-select-sm"
            aria-label={t('settings.manufacturers.catalogMapping.filters.type', 'Filter by type')}
            value={typeFilter}
            onChange={(event) => {
              setCurrentPage(1)
              setTypeFilter(event.currentTarget.value)
            }}
          >
            <option value="">All Types</option>
            {uniqueTypes.map((type, idx) => (
              <option key={idx} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Style Filter */}
        <div className="col-6 col-sm-6 col-lg-auto">
          <select
            className="form-select form-select-sm"
            aria-label={t('settings.manufacturers.catalogMapping.filters.style', 'Filter by style')}
            value={styleFilter}
            onChange={(event) => {
              setCurrentPage(1)
              setStyleFilter(event.currentTarget.value)
            }}
          >
            <option value="">All Styles</option>
            {sortedUniqueStyles.map((style, idx) => (
              <option key={idx} value={style}>
                {style}
              </option>
            ))}
          </select>
        </div>
      </div>

      <>
        {/* Debug info - remove this later */}
        {process.env.NODE_ENV === 'development' && (
          <small>
            Style Filter: "{styleFilter}" | Styles Count: {sortedUniqueStyles.length}
          </small>
        )}

        {/* Style Management Section */}
        {styleFilter && (
          <div className="mb-3 p-3 border rounded bg-light">
            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2">
              <div>
                <strong>Managing Style: "{styleFilter}"</strong>
                <br />
                <small>
                  {catalogData.filter((item) => item.style === styleFilter).length} items with this
                  style
                </small>
              </div>
              <div className="d-flex gap-2 flex-shrink-0">
                <Button
                  color="info"
                  size="sm"
                  onClick={() => handleEditStyleNameClick(styleFilter)}
                  disabled={isEditingStyleName}
                >
                  {isEditingStyleName ? (
                    <>
                      <span role="status"></span>
                      Saving...
                    </>
                  ) : (
                    <>✏️ Rename Style</>
                  )}
                </Button>
                <Button
                  color="warning"
                  size="sm"
                  onClick={() => handleDeleteStyleClick(styleFilter)}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <span role="status"></span>
                      Processing...
                    </>
                  ) : (
                    <>🗑️ Delete/Merge Style</>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Actions */}
        {selectedItems.length > 0 && (
          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-3 p-3 bg-light rounded gap-2">
            <span>
              {t('settings.manufacturers.catalogMapping.pagination.itemsSelected', {
                count: selectedItems.length,
              })}
            </span>
            <div className="d-flex gap-2 flex-shrink-0">
              <Button
                colorScheme="blue"
                size="sm"
                onClick={handleBulkEditClick}
                disabled={isBulkEditing}
              >
                {isBulkEditing ? (
                  <>
                    <span role="status"></span>
                    Editing...
                  </>
                ) : (
                  <>✏️ Edit Selected</>
                )}
              </Button>
              <Button
                colorScheme="red"
                size="sm"
                onClick={handleBulkDeleteClick}
                disabled={isBulkDeleting}
              >
                {isBulkDeleting ? (
                  <>
                    <span role="status"></span>
                    {t('settings.manufacturers.catalogMapping.bulk.deleting')}
                  </>
                ) : (
                  <>{t('settings.manufacturers.catalogMapping.buttons.deleteSelected')}</>
                )}
              </Button>
            </div>
          </div>
        )}
      </>

      {/* Table - Desktop and Mobile Views */}
      {catalogData.length === 0 ? (
        <p>{t('settings.manufacturers.catalogMapping.empty')}</p>
      ) : (
        <>
          {/* Desktop Table View - Hidden on mobile */}
          <div className="table-responsive table-container d-none d-md-block">
            <Table>
              <Thead>
                <Tr>
                  <Th style={{ width: '35px', minWidth: '35px' }}>
                    <input
                      type="checkbox"
                      checked={isSelectAll}
                      onChange={(event) => handleSelectAll(event.currentTarget.checked)}

                      style={{
                        bordercolor: "gray.500",
                        borderWidth: '2px',
                        transform: 'scale(1.1)',
                      }}
                    />
                  </Th>
                  <Th
                    style={{ minWidth: '80px', userSelect: 'none' }}
                    scope="col"
                    aria-sort={
                      sortBy === 'code'
                        ? sortOrder === 'ASC'
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                    }
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('code')}
                      justifyContent="flex-start"
                      width="100%"
                      px={0}
                      color="inherit"
                      fontWeight="inherit"
                      aria-label={`${t('settings.manufacturers.catalogMapping.table.code')} ${sortBy === 'code' ? (sortOrder === 'ASC' ? t('common.sortAscending', 'ascending') : t('common.sortDescending', 'descending')) : t('common.sortable', 'sortable')}`}
                      rightIcon={
                        sortBy === 'code' ? (
                          <Icon
                            as={sortOrder === 'ASC' ? ChevronUp : ChevronDown}
                            boxSize={ICON_BOX_MD}
                            aria-hidden="true"
                          />
                        ) : undefined
                      }
                    >
                      {t('settings.manufacturers.catalogMapping.table.code')}
                    </Button>
                  </Th>
                  <Th style={{ minWidth: '120px', maxWidth: '180px' }}>
                    {t('settings.manufacturers.catalogMapping.table.description')}
                  </Th>
                  <Th minW="80px">
                    {t('settings.manufacturers.catalogMapping.table.style')}
                  </Th>
                  <Th minW="70px">
                    {t('settings.manufacturers.catalogMapping.table.price')}
                  </Th>
                  <Th minW="70px">
                    {t('settings.manufacturers.catalogMapping.table.type')}
                  </Th>
                  <Th minW="120px" className="actions-column">
                    {t('settings.manufacturers.catalogMapping.table.actions')}
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {currentItems.map((item, index) => (
                  <Tr key={index}>
                    <Td>
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.id)}
                        onChange={(event) => handleSelectItem(item.id, event.currentTarget.checked)}

                        aria-label={`${t('common.select', 'Select')} ${item.code || ''}`}
                        style={{
                          bordercolor: "gray.500",
                          borderWidth: '2px',
                          transform: 'scale(1.1)',
                        }}
                      />
                    </Td>
                    <Td>{item.code}</Td>
                    <Td
                      style={{
                        maxWidth: '200px',
                        wordWrap: 'break-word',
                        whiteSpace: 'normal',
                      }}
                    >
                      {item.description ? item.description : t('common.na')}
                    </Td>
                    <Td style={{ cursor: 'pointer' }}>
                      <Button
                        size="sm"
                        color="dark"
                        onClick={() => handleShowStyleOnClick(item)}

                        style={{
                          backgroundcolor: "gray.500",
                          bordercolor: "gray.500",
                          color: 'white',
                          fontSize: "xs",
                          padding: '4px 8px',
                        }}
                      >
                        {item.style}
                      </Button>
                    </Td>
                    <Td>{item.price}</Td>
                    <Td>{item.type ? item.type : 'N/A'}</Td>
                    <Td>
                      <div className="d-flex flex-wrap gap-1">
                        <Button
                          size="sm"
                          colorScheme="gray"
                          onClick={() => handleEditClick(item)}
                          style={{
                            fontSize: "xs",
                            padding: '2px 6px',
                            minWidth: 'auto',
                          }}
                        >
                          ✏️
                        </Button>

                        <Button
                          size="sm"
                          onClick={() => handleManageStyleClick(item)}
                          style={{
                            fontSize: "xs",
                            padding: '2px 6px',
                            backgroundColor: headerBg,
                            borderColor: headerBg,
                            color: textColor,
                            minWidth: 'auto',
                          }}
                          title={t('settings.manufacturers.catalogMapping.actions.manageStyle')}
                        >
                          🎨
                        </Button>

                        <Button
                          size="sm"
                          onClick={() => handleAssemblyCostClick(item)}
                          style={{
                            fontSize: "xs",
                            padding: '2px 6px',
                            backgroundColor: headerBg,
                            borderColor: headerBg,
                            color: textColor,
                            minWidth: 'auto',
                          }}
                          title={t('settings.manufacturers.catalogMapping.actions.assemblyCost')}
                        >
                          🔧
                        </Button>

                        <Button
                          size="sm"
                          onClick={() => handleModificationDetailsClick(item)}
                          style={{
                            fontSize: "xs",
                            padding: '2px 6px',
                            backgroundColor: headerBg,
                            borderColor: headerBg,
                            color: textColor,
                            minWidth: 'auto',
                          }}
                          title={t('settings.manufacturers.catalogMapping.actions.modification')}
                        >
                          ⚙️
                        </Button>

                        <Button
                          size="sm"
                          onClick={() => openItemGlobalMods(item)}
                          style={{
                            fontSize: "xs",
                            padding: '2px 6px',
                            backgroundColor: "teal.400",
                            borderColor: "teal.400",
                            color: "white",
                            minWidth: 'auto',
                          }}
                          title="Global Mods for item"
                        >
                          🧩
                        </Button>

                        <Button
                          size="sm"
                          colorScheme="red"
                          onClick={() => handleDeleteItemClick(item)}
                          style={{
                            fontSize: "xs",
                            padding: '2px 6px',
                            minWidth: 'auto',
                          }}
                          title={`Delete item: ${item.code}`}
                        >
                          🗑️
                        </Button>
                      </div>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </div>

          {/* Mobile Card View - Visible only on mobile */}
          <div className="d-block d-md-none">
            {/* Mobile Select All */}
            <div className="d-flex align-items-center mb-3 p-3 bg-light rounded">
              <input
                type="checkbox"
                checked={isSelectAll}
                onChange={(event) => handleSelectAll(event.currentTarget.checked)}
                className="form-check-input me-2"
                id="mobile-select-all"
              />
              <label htmlFor="mobile-select-all" className="form-check-label mb-0">
                Select All ({currentItems.length} items)
              </label>
            </div>

            {/* Mobile Cards */}
            <VStack spacing={3} align="stretch">
              {currentItems.map((item, index) => (
                <StandardCard key={index} p={3}>
                  {/* Card Header with checkbox and style */}
                  <HStack justify="space-between" align="start" mb={2}>
                    <HStack align="start" spacing={2}>
                      <Checkbox
                        isChecked={selectedItems.includes(item.id)}
                        onChange={(event) =>
                          handleSelectItem(item.id, event.target.checked)
                        }
                      />
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="semibold">{item.code}</Text>
                        <Text fontSize="sm" color="gray.600">{item.description}</Text>
                      </VStack>
                    </HStack>
                    <Badge
                      colorScheme="gray"
                      fontSize="xs"
                      px={2}
                      py={1}
                    >
                      {item.style}
                    </Badge>
                  </HStack>

                  {/* Card Content */}
                  <HStack spacing={4} mb={3}>
                    <VStack align="start" spacing={0}>
                      <Text fontSize="xs" color="gray.500">Price</Text>
                      <Text>${item.price}</Text>
                    </VStack>
                    <VStack align="start" spacing={0}>
                      <Text fontSize="xs" color="gray.500">Type</Text>
                      <Text>{item.type || 'N/A'}</Text>
                    </VStack>
                  </HStack>

                  {/* Card Actions */}
                  <HStack spacing={2} wrap="wrap">
                    <Button
                      size="sm"
                      colorScheme="gray"
                      onClick={() => handleEditClick(item)}
                      flex={1}
                    >
                      ✏️ Edit
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => handleManageStyleClick(item)}
                      bg={headerBg}
                      color={textColor}
                      _hover={{ opacity: 0.8 }}
                      flex={1}
                      title={t('settings.manufacturers.catalogMapping.actions.manageStyle')}
                    >
                      🎨 Style
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => handleModificationDetailsClick(item)}
                      bg={headerBg}
                      color={textColor}
                      _hover={{ opacity: 0.8 }}
                      flex={1}
                      title={t(
                        'settings.manufacturers.catalogMapping.actions.modificationDetails',
                      )}
                    >
                      🔧 Modify
                    </Button>

                    <Button
                      size="sm"
                      colorScheme="red"
                      onClick={() => handleDeleteClick(item.id)}
                      fontSize="xs"
                      px={2}
                    >
                      🗑️
                    </Button>
                  </HStack>
                </StandardCard>
              ))}
            </VStack>
          </div>
        </>
      )}
      {catalogData.length > 0 ? (
        <div className="d-flex justify-content-between align-items-center mt-3">
          <div>
            {loading
              ? 'Loading…'
              : t('pagination.pageInfo', {
                  current: pagination.page || 1,
                  total: pagination.totalPages || 1,
                })}
          </div>
          <div>
            <Button
              size="sm"
              colorScheme="gray"
              disabled={loading || (pagination.page || 1) === 1}
              onClick={() =>
                fetchCatalogData(
                  (pagination.page || 1) - 1,
                  itemsPerPage,
                  typeFilter,
                  styleFilter,
                  sortBy,
                  sortOrder,
                )
              }

            >
              {t('pagination.prevPageTitle')}
            </Button>
            <Button
              size="sm"
              colorScheme="gray"
              disabled={loading || (pagination.page || 1) >= (pagination.totalPages || 1)}
              onClick={() =>
                fetchCatalogData(
                  (pagination.page || 1) + 1,
                  itemsPerPage,
                  typeFilter,
                  styleFilter,
                  sortBy,
                  sortOrder,
                )
              }
            >
              {t('pagination.nextPageTitle')}
            </Button>
          </div>
        </div>
      ) : (
        ''
      )}

      {/* File Upload Modal */}
      <Modal isOpen={fileModalVisible} onClose={() => setFileModalVisible(false)} size={{ base: 'full', md: 'md' }} scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent>
          <PageHeader title={t('settings.manufacturers.catalogMapping.file.modalTitle')} />
          <ModalBody>
            <FormControl>
              <Input type="file" name="catalogFiles" onChange={handleFileChange} />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="gray" onClick={() => setFileModalVisible(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              style={{ backgroundColor: headerBg, color: textColor, borderColor: headerBg }}
              onClick={handleUpload}
            >
              {t('settings.manufacturers.catalogMapping.file.uploadBtn')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Assign Global Mods Modal */}
      <Modal isOpen={showAssignGlobalModsModal} onClose={() => setShowAssignGlobalModsModal(false)} size={{ base: 'full', md: 'md', lg: 'lg' }} scrollBehavior="inside"
      >
        <ModalOverlay />
        <ModalContent>
          <PageHeader
            title={t(
              'settings.manufacturers.catalogMapping.assign.header',
              'Assign Global Modifications',
            )}
          />
          <ModalBody>
            <div className="mb-3 d-flex align-items-center gap-2">
              <Checkbox
                isChecked={includeDraftTemplates}
                onChange={(event) => setIncludeDraftTemplates(event.currentTarget.checked)}
              >
                Include drafts
              </Checkbox>
            </div>
            <div className="row g-3">
              <div>
                <FormLabel>Template</FormLabel>
                <Select
                  value={assignFormGM.templateId}
                  onChange={(event) =>
                    setAssignFormGM((f) => ({ ...f, templateId: event.currentTarget.value }))
                  }
                >
                  <option value="">Select template…</option>
                  {flatTemplates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.categoryName ? `[${t.categoryName}] ` : ''}
                      {t.name}
                      {t.defaultPrice != null
                        ? ` — $${Number(t.defaultPrice).toFixed(2)}`
                        : ' — blueprint'}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <FormLabel>Scope</FormLabel>
                <Select
                  value={assignFormGM.scope}
                  onChange={(event) =>
                    setAssignFormGM((f) => ({ ...f, scope: event.currentTarget.value }))
                  }
                >
                  <option value="all">All</option>
                  <option value="style">Style</option>
                  <option value="type">Type</option>
                  <option value="item">Selected items</option>
                </Select>
              </div>
              <div>
                <FormLabel>Override price</FormLabel>
                <Input
                  type="number"
                  value={assignFormGM.overridePrice}
                  onChange={(event) =>
                    setAssignFormGM((f) => ({ ...f, overridePrice: event.currentTarget.value }))
                  }
                  placeholder="optional"
                />
              </div>
            </div>
            {assignFormGM.scope === 'style' && (
              <div>
                <FormLabel>Target style</FormLabel>
                <Select
                  value={assignFormGM.targetStyle}
                  onChange={(event) =>
                    setAssignFormGM((f) => ({ ...f, targetStyle: event.currentTarget.value }))
                  }
                >
                  <option value="">Select style…</option>
                  {sortedUniqueStyles.map((s, i) => (
                    <option key={i} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </div>
            )}
            {assignFormGM.scope === 'type' && (
              <div>
                <FormLabel>Target type</FormLabel>
                <Select
                  value={assignFormGM.targetType}
                  onChange={(event) =>
                    setAssignFormGM((f) => ({ ...f, targetType: event.currentTarget.value }))
                  }
                >
                  <option value="">Select type…</option>
                  {uniqueTypes.map((t, i) => (
                    <option key={i} value={t}>
                      {t}
                    </option>
                  ))}
                </Select>
              </div>
            )}
            {assignFormGM.scope === 'item' && (
              <div className="mt-2 text-muted small">
                {selectedItems.length} selected item(s) will receive this assignment.
              </div>
            )}
            <hr />
            <div>
              <h6>Existing assignments</h6>
              {assignLoading ? (
                <div>Loading…</div>
              ) : (
                <div>
                  <table className="table table-sm align-middle">
                    <thead>
                      <tr>
                        <th>Template</th>
                        <th>Scope</th>
                        <th>Target</th>
                        <th>Price</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {globalAssignments.map((a) => (
                        <tr key={a.id}>
                          <td>{a.template?.name}</td>
                          <td>{a.scope}</td>
                          <td>
                            {a.scope === 'style'
                              ? a.targetStyle
                              : a.scope === 'type'
                                ? a.targetType
                                : a.scope === 'item'
                                  ? `Item ${a.catalogDataId}`
                                  : 'All'}
                          </td>
                          <td>
                            {a.overridePrice != null
                              ? `$${Number(a.overridePrice).toFixed(2)}`
                              : a.template?.defaultPrice != null
                                ? `$${Number(a.template.defaultPrice).toFixed(2)}`
                                : '—'}
                          </td>
                          <td>
                            <Button
                              colorScheme="red"
                              size="sm"
                              onClick={() => removeGlobalAssignment(a.id)}
                            >
                              Remove
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {globalAssignments.length === 0 && (
                        <tr>
                          <td colSpan="5">
                            No assignments
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="gray" onClick={() => setShowAssignGlobalModsModal(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              style={{ backgroundColor: headerBg, color: textColor, borderColor: headerBg }}
              onClick={submitAssignGlobal}
              disabled={!assignFormGM.templateId}
            >
              Assign
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Item Global Mods Modal */}
      <Modal
        isOpen={showItemGlobalModsModal}
        onClose={() => setShowItemGlobalModsModal(false)}
        size={{ base: 'full', md: 'md', lg: 'lg' }}
      >
        <ModalOverlay />
        <ModalContent>
          <PageHeader title={`Global Mods — ${selectedCatalogItem?.code || ''}`} />
          <ModalBody>
            <div>
              <table className="table table-sm align-middle">
                <thead>
                  <tr>
                    <th>Template</th>
                    <th>Category</th>
                    <th>Scope</th>
                    <th>Price</th>
                    <th>Active</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {itemGlobalList.map((a) => (
                    <tr key={a.id}>
                      <td>{a.template?.name}</td>
                      <td>{a.template?.category?.name || '-'}</td>
                      <td>{a.scope}</td>
                      <td>
                        {a.overridePrice != null
                          ? `$${Number(a.overridePrice).toFixed(2)}`
                          : a.template?.defaultPrice != null
                            ? `$${Number(a.template.defaultPrice).toFixed(2)}`
                            : '—'}
                      </td>
                      <td>{a.isActive === false ? 'Suppressed' : 'Active'}</td>
                      <td>
                        {a.scope === 'item' ? (
                          <Button
                            colorScheme="red"
                            size="sm"
                            onClick={() => removeGlobalAssignment(a.id)}
                          >
                            Remove
                          </Button>
                        ) : a.isActive === false ? (
                          <Button
                            colorScheme="green"
                            size="sm"
                            onClick={() => suppressTemplateForItem(a.template?.id, true)}
                          >
                            Unsuppress
                          </Button>
                        ) : (
                          <Button
                            colorScheme="orange"
                            size="sm"
                            onClick={() => suppressTemplateForItem(a.template?.id, false)}
                          >
                            Suppress
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {itemGlobalList.length === 0 && (
                    <tr>
                      <td colSpan="6">
                        No global templates apply
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <hr />
            <div className="row g-3">
              <div>
                <FormLabel>Add template to this item</FormLabel>
                <Select
                  value={assignFormGM.templateId}
                  onChange={(event) =>
                    setAssignFormGM((f) => ({ ...f, templateId: event.currentTarget.value }))
                  }
                >
                  <option value="">Select template…</option>
                  {flatTemplates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.categoryName ? `[${t.categoryName}] ` : ''}
                      {t.name}
                      {t.defaultPrice != null
                        ? ` — $${Number(t.defaultPrice).toFixed(2)}`
                        : ' — blueprint'}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <FormLabel>Override price</FormLabel>
                <Input
                  type="number"
                  value={assignFormGM.overridePrice}
                  onChange={(event) =>
                    setAssignFormGM((f) => ({ ...f, overridePrice: event.currentTarget.value }))
                  }
                  placeholder="optional"
                />
              </div>
              <div className="col-md-3 d-flex align-items-end">
                <Button
                  colorScheme="blue"
                  disabled={!assignFormGM.templateId}
                  onClick={async () => {
                    try {
                      await axiosInstance.post('/api/global-mods/assignments', {
                        templateId: Number(assignFormGM.templateId),
                        manufacturerId: id,
                        scope: 'item',
                        catalogDataId: selectedCatalogItem.id,
                        overridePrice:
                          assignFormGM.overridePrice === ''
                            ? null
                            : Number(assignFormGM.overridePrice),
                      })
                      const { data } = await axiosInstance.get(
                        `/api/global-mods/item/${selectedCatalogItem.id}`,
                      )
                      setItemGlobalList(Array.isArray(data?.assignments) ? data.assignments : [])
                      setAssignFormGM((f) => ({ ...f, templateId: '', overridePrice: '' }))
                    } catch (e) {}
                  }}
                >
                  Add
                </Button>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="gray" onClick={() => setShowItemGlobalModsModal(false)}>
              {t('common.close', 'Close')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Manual Upload Modal */}
      <Modal isOpen={manualModalVisible} onClose={() => setManualModalVisible(false)} size={{ base: 'full', md: 'md' }} scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent>
          <PageHeader title={t('settings.manufacturers.catalogMapping.manual.modalTitle')} />
          <ModalBody>
            <Select
              placeholder={t(
                'settings.manufacturers.catalogMapping.stylePlaceholder',
                'Select or enter style',
              )}
              value={manualForm.style || ''}
              onChange={(e) =>
                setManualForm({
                  ...manualForm,
                  style: e.target.value,
                })
              }
              mb={2}
            >
              {styleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <FormControl isInvalid={!!errors.code}>
              <FormLabel>{t('settings.manufacturers.catalogMapping.fields.code')}</FormLabel>
              <Input name="code" value={manualForm.code} onChange={handleManualChange} />
            </FormControl>
            <FormControl isInvalid={!!errors.description}>
              <FormLabel>{t('settings.manufacturers.catalogMapping.fields.description')}</FormLabel>
              <Input
                name="description"
                value={manualForm.description}
                onChange={handleManualChange}
              />
            </FormControl>
            <FormControl isInvalid={!!errors.price}>
              <FormLabel>{t('settings.manufacturers.catalogMapping.fields.price')}</FormLabel>
              <Input
                type="number"
                name="price"
                value={manualForm.price}
                onChange={handleManualChange}
              />
            </FormControl>

            <FormControl isInvalid={!!errors.type}>
              <FormLabel>{t('settings.manufacturers.catalogMapping.fields.type')}</FormLabel>
              <Input name="type" value={manualForm.type} onChange={handleManualChange} />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="gray" onClick={() => setManualModalVisible(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              style={{ backgroundColor: headerBg, color: textColor, borderColor: headerBg }}
              onClick={handleSaveManualItem}
            >
              {t('common.save')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={editModalVisible} onClose={() => setEditModalVisible(false)} size={{ base: 'full', md: 'md' }} scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent>
          <PageHeader title={t('settings.manufacturers.catalogMapping.edit.modalTitle')} />
          <ModalBody>
            <Select
              placeholder={t(
                'settings.manufacturers.catalogMapping.stylePlaceholder',
                'Select or enter style',
              )}
              value={editForm.style || ''}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  style: e.target.value,
                })
              }
            >
              {styleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>

            {['code', 'description', 'type'].map((field) => (
              <FormControl key={field}>
                <FormLabel>
                  {field === 'code'
                    ? t('settings.manufacturers.catalogMapping.fields.code')
                    : field === 'description'
                      ? t('settings.manufacturers.catalogMapping.fields.description')
                      : t('settings.manufacturers.catalogMapping.fields.type')}
                </FormLabel>
                <Input
                  name={field}
                  value={editForm[field]}
                  onChange={(event) =>
                    setEditForm({ ...editForm, [field]: event.currentTarget.value })
                  }
                />
              </FormControl>
            ))}

            <FormControl>
              <FormLabel>{t('settings.manufacturers.catalogMapping.fields.price')}</FormLabel>
              <Input
                type="number"
                step="0.01"
                min="0"
                name="price"
                value={editForm.price}
                onChange={(event) => {
                  const val = event.currentTarget.value
                  setEditForm({ ...editForm, price: val })
                }}
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="gray" onClick={() => setEditModalVisible(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              style={{ backgroundColor: headerBg, color: textColor, borderColor: headerBg }}
              onClick={handleUpdateItem}
              disabled={isUpdating}
            >
              {isUpdating
                ? t('settings.manufacturers.catalogMapping.edit.updating')
                : t('settings.manufacturers.catalogMapping.edit.update')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Style Modal */}
      <Modal isOpen={showStyleModal} onClose={() => setShowStyleModal(false)} size={{ base: 'full', md: 'md' }} scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent>
          <PageHeader
            title={t('settings.manufacturers.catalogMapping.style.manageTitle', {
              style: selectedStyle,
            })}
          />

          <ModalBody>
            {/* Short Name */}
            <FormControl>
              <FormLabel>{t('settings.manufacturers.catalogMapping.style.shortName')}</FormLabel>
              <Input
                name="shortName"
                value={styleForm.shortName}
                onChange={handleStyleFormChange}
              />
            </FormControl>

            {/* Description */}
            <FormControl>
              <FormLabel>{t('settings.manufacturers.catalogMapping.fields.description')}</FormLabel>
              <Textarea
                name="description"
                value={styleForm.description}
                onChange={handleStyleFormChange}
                rows={4}
              />
            </FormControl>

            {/* Image Upload */}
            <FormControl>
              <FormLabel>{t('settings.manufacturers.catalogMapping.style.uploadImage')}</FormLabel>
              <Input
                type="file"
                accept="image/*"
                id="styleImage"
                onChange={(event) => setStyleImage(event.currentTarget.files[0])}
              />
            </FormControl>

            {/* Show selected image name or current image */}
            {styleImage ? (
              <div className="mt-2 text-success">
                {t('settings.manufacturers.catalogMapping.style.imageSelected', {
                  name: styleImage.name,
                })}
              </div>
            ) : styleForm.image ? (
              <div>
                <p>
                  <strong>{t('settings.manufacturers.catalogMapping.style.currentImage')}</strong>
                </p>
                <Image
                  src={styleForm.image ? `${api_url}/uploads/images/${styleForm.image}` : undefined}
                  alt={t('settings.manufacturers.catalogMapping.style.previewAlt', 'Style preview')}
                  fallbackSrc="/images/nologo.png"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '300px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    display: 'block',
                    margin: '0 auto',
                  }}
                  onError={(event) => {
                    if (styleForm.image && !event.currentTarget.dataset.fallbackTried) {
                      event.currentTarget.dataset.fallbackTried = '1'
                      event.currentTarget.src = `${api_url}/uploads/manufacturer_catalogs/${styleForm.image}`
                    } else {
                      event.currentTarget.src = '/images/nologo.png'
                    }
                  }}
                />
              </div>
            ) : null}
          </ModalBody>

          <ModalFooter>
            <Button
              style={{ backgroundColor: headerBg, color: textColor, borderColor: headerBg }}
              onClick={handleSaveStyle}
            >
              {t('common.save')}
            </Button>
            <Button colorScheme="gray" onClick={() => setShowStyleModal(false)}>
              {t('common.cancel')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Style View Modal */}
      <Modal isOpen={showStyleViewModal} onClose={() => setShowStyleViewModal(false)} size={{ base: 'full', md: 'md', lg: 'lg' }} scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent>
          <PageHeader
            title={`📝 ${t('settings.manufacturers.catalogMapping.style.detailsTitle')}`}
          />
          <ModalBody>
            {styleDetails ? (
              <div style={{ padding: '10px 5px' }}>
                <div style={{ marginBottom: '1rem', display: 'flex', flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 100%', paddingRight: '10px' }}>
                    <p>
                      <strong>
                        🏷️ {t('settings.manufacturers.catalogMapping.style.shortName')}:
                      </strong>{' '}
                      {styleDetails.shortName ? styleDetails.shortName : t('common.na')}
                    </p>
                    <p>
                      <strong>
                        📝 {t('settings.manufacturers.catalogMapping.fields.description')}:
                      </strong>{' '}
                      {styleDetails.description ? styleDetails.description : t('common.na')}
                    </p>
                  </div>
                </div>
                {styleDetails.image ? (
                  <div style={{ marginTop: '20px' }}>
                    <Image
                      src={
                        styleDetails.image
                          ? `${api_url}/uploads/images/${styleDetails.image}`
                          : undefined
                      }
                      alt={t(
                        'settings.manufacturers.catalogMapping.style.detailsImageAlt',
                        'Style preview',
                      )}
                      fallbackSrc="/images/nologo.png"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '300px',
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                      }}
                      onError={(event) => {
                        if (styleDetails.image && !event.currentTarget.dataset.fallbackTried) {
                          event.currentTarget.dataset.fallbackTried = '1'
                          event.currentTarget.src = `${api_url}/uploads/manufacturer_catalogs/${styleDetails.image}`
                        } else {
                          event.currentTarget.src = '/images/nologo.png'
                        }
                      }}
                    />
                  </div>
                ) : (
                  <p style={{ textAlign: 'center', color: "gray.500" }}>
                    {t('settings.manufacturers.catalogMapping.style.noImage')}
                  </p>
                )}
              </div>
            ) : (
              <p>{t('settings.manufacturers.catalogMapping.style.noData')}</p>
            )}
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="gray" onClick={() => setShowStyleViewModal(false)}>
              {t('common.cancel')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal
        isOpen={showAssemblyModal}
        onClose={() => !isAssemblyCostSaving && setShowAssemblyModal(false)}
      >
        <ModalOverlay />
        <ModalContent>
          <PageHeader title={t('settings.manufacturers.catalogMapping.assembly.modalTitle')} />
          <ModalBody style={{ position: 'relative' }}>
            {isAssemblyCostSaving && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10,
                  borderRadius: '8px',
                }}
              >
                <div>
                  <div className="spinner-border text-primary mb-2" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <div>Applying assembly cost...</div>
                </div>
              </div>
            )}
            <FormLabel>{t('settings.manufacturers.catalogMapping.assembly.type')}</FormLabel>
            <Select
              value={assemblyData.type}
              onChange={(event) =>
                setAssemblyData({ ...assemblyData, type: event.currentTarget.value })
              }
              disabled={isAssemblyCostSaving}
            >
              <option value="">
                {t('settings.manufacturers.catalogMapping.assembly.selectType')}
              </option>
              <option value="percentage">
                {t('settings.manufacturers.catalogMapping.assembly.percentage')}
              </option>
              <option value="fixed">
                {t('settings.manufacturers.catalogMapping.assembly.fixed')}
              </option>
            </Select>

            <FormLabel>
              {t('settings.manufacturers.catalogMapping.fields.price')}
            </FormLabel>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={assemblyData.price}
              onChange={(event) =>
                setAssemblyData({ ...assemblyData, price: event.currentTarget.value })
              }
              placeholder="Enter price (0 for no assembly cost)"
              disabled={isAssemblyCostSaving}
            />

            <FormLabel>
              {t('settings.manufacturers.catalogMapping.assembly.applyTo')}
            </FormLabel>
            <Select
              value={assemblyData.applyTo}
              onChange={(event) =>
                setAssemblyData({ ...assemblyData, applyTo: event.currentTarget.value })
              }
              disabled={isAssemblyCostSaving}
            >
              <option value="one">
                {t('settings.manufacturers.catalogMapping.assembly.applyOne')}
              </option>
              <option value="type">
                {t('settings.manufacturers.catalogMapping.assembly.applyType')}
              </option>
              <option value="types">
                {t(
                  'settings.manufacturers.catalogMapping.assembly.applyTypes',
                  'Apply by Multiple Types',
                )}
              </option>
              <option value="all">
                {t('settings.manufacturers.catalogMapping.assembly.applyAll')}
              </option>
            </Select>

            {assemblyData.applyTo === 'one' &&
              selectedCatalogItem &&
              selectedCatalogItem.type &&
              assemblyCostsByType[selectedCatalogItem.type]?.assemblyCosts?.length > 0 && (
                <div className="mt-3 p-3 bg-light rounded">
                  <small className="fw-bold text-muted">
                    Existing Assembly Costs for "{selectedCatalogItem.code}" (
                    {selectedCatalogItem.type}):
                  </small>
                  <div>
                    {assemblyCostsByType[selectedCatalogItem.type].assemblyCosts.map(
                      (cost, idx) => (
                        <span
                          key={idx}
                          className={`badge ${cost.price === 0 ? 'bg-secondary' : 'bg-info'} me-1`}
                          title={`${cost.assemblyType}: $${cost.price.toFixed(2)} (${cost.itemsWithCost} items)`}
                        >
                          {cost.assemblyType}: ${cost.price.toFixed(2)}
                        </span>
                      ),
                    )}
                  </div>
                </div>
              )}

            {assemblyData.applyTo === 'all' && Object.keys(assemblyCostsByType).length > 0 && (
              <div className="mt-3 p-3 bg-light rounded">
                <small className="fw-bold text-muted">Existing Assembly Costs by Type:</small>
                <div>
                  {availableTypes.map((typeItem) => {
                    const typeAssemblyCosts =
                      assemblyCostsByType[typeItem.type]?.assemblyCosts || []
                    if (typeAssemblyCosts.length === 0) return null

                    return (
                      <div
                        key={typeItem.type}
                        className="d-flex justify-content-between align-items-center mb-1"
                      >
                        <small>{typeItem.type}:</small>
                        <div>
                          {typeAssemblyCosts.map((cost, idx) => (
                            <span
                              key={idx}
                              className={`badge ${cost.price === 0 ? 'bg-secondary' : 'bg-info'} ms-1`}
                              title={`${cost.assemblyType}: $${cost.price.toFixed(2)} (${cost.itemsWithCost} items)`}
                            >
                              ${cost.price.toFixed(2)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {assemblyData.applyTo === 'type' && (
              <>
                <FormLabel>
                  {t('settings.manufacturers.catalogMapping.assembly.selectItemType')}
                </FormLabel>
                <div
                  className="border rounded p-3"
                  style={{ maxHeight: '300px', overflowY: 'auto' }}
                >
                  {availableTypes.map((typeItem) => {
                    const isSelected = assemblyData.selectedItemType === typeItem.type
                    const typeAssemblyCosts =
                      assemblyCostsByType[typeItem.type]?.assemblyCosts || []

                    return (
                      <div key={typeItem.type} className="form-check mb-2">
                        <input

                          type="radio"
                          name="singleTypeSelection"
                          id={`single-type-${typeItem.type}`}
                          checked={isSelected}
                          onChange={() =>
                            setAssemblyData({ ...assemblyData, selectedItemType: typeItem.type })
                          }
                        />
                        <label

                          htmlFor={`single-type-${typeItem.type}`}
                        >
                          <div>
                            <div>{typeItem.type}</div>
                            <small>{typeItem.count} items</small>
                          </div>
                          <div>
                            {typeAssemblyCosts.map((cost, idx) => (
                              <span
                                key={idx}
                                className={`badge ${cost.price === 0 ? 'bg-secondary' : 'bg-info'} ms-1`}
                                title={`${cost.assemblyType}: $${cost.price.toFixed(2)} (${cost.itemsWithCost} items)`}
                              >
                                ${cost.price.toFixed(2)}
                              </span>
                            ))}
                          </div>
                        </label>
                      </div>
                    )
                  })}
                </div>
              </>
            )}

            {assemblyData.applyTo === 'types' && (
              <>
                <FormLabel>
                  {t(
                    'settings.manufacturers.catalogMapping.assembly.selectMultipleTypes',
                    'Select Item Types',
                  )}
                </FormLabel>
                <div
                  className="border rounded p-3"
                  style={{ maxHeight: '300px', overflowY: 'auto' }}
                >
                  {availableTypes.map((typeItem) => {
                    const isSelected = assemblyData.selectedTypes.includes(typeItem.type)
                    const typeAssemblyCosts =
                      assemblyCostsByType[typeItem.type]?.assemblyCosts || []

                    return (
                      <div key={typeItem.type} className="form-check mb-2">
                        <input

                          type="checkbox"
                          id={`type-${typeItem.type}`}
                          checked={isSelected}
                          onChange={(event) => {
                            if (event.currentTarget.checked) {
                              setAssemblyData((prev) => ({
                                ...prev,
                                selectedTypes: [...prev.selectedTypes, typeItem.type],
                              }))
                            } else {
                              setAssemblyData((prev) => ({
                                ...prev,
                                selectedTypes: prev.selectedTypes.filter(
                                  (t) => t !== typeItem.type,
                                ),
                              }))
                            }
                          }}
                        />
                        <label

                          htmlFor={`type-${typeItem.type}`}
                        >
                          <div>
                            <div>{typeItem.type}</div>
                            <small>{typeItem.count} items</small>
                          </div>
                          <div>
                            {typeAssemblyCosts.map((cost, idx) => (
                              <span
                                key={idx}
                                className={`badge ${cost.price === 0 ? 'bg-secondary' : 'bg-info'} ms-1`}
                                title={`${cost.assemblyType}: $${cost.price.toFixed(2)} (${cost.itemsWithCost} items)`}
                              >
                                ${cost.price.toFixed(2)}
                              </span>
                            ))}
                          </div>
                        </label>
                      </div>
                    )
                  })}
                </div>

                <div className="mt-3 d-flex gap-2">
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    type="button"
                    onClick={() => {
                      const allTypes = availableTypes.map((t) => t.type)
                      setAssemblyData((prev) => ({ ...prev, selectedTypes: allTypes }))
                    }}
                  >
                    {t('common.selectAll', 'Select All')}
                  </button>
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    type="button"
                    onClick={() => setAssemblyData((prev) => ({ ...prev, selectedTypes: [] }))}
                  >
                    {t('common.selectNone', 'Select None')}
                  </button>
                </div>

                {assemblyData.selectedTypes.length > 0 && (
                  <div className="alert alert-info mt-3">
                    <small>
                      {t(
                        'settings.manufacturers.catalogMapping.assembly.multipleTypesWarning',
                        'This will apply the assembly cost to all items in {{count}} selected types.',
                        { count: assemblyData.selectedTypes.length },
                      )}
                    </small>
                  </div>
                )}
              </>
            )}
          </ModalBody>

          <ModalFooter>
            <Button
              colorScheme="gray"
              onClick={() => setShowAssemblyModal(false)}
              disabled={isAssemblyCostSaving}
            >
              {t('common.cancel')}
            </Button>
            <Button
              style={{ backgroundColor: headerBg, color: textColor, borderColor: headerBg }}
              onClick={saveAssemblyCost}
              disabled={isAssemblyCostSaving}
            >
              {isAssemblyCostSaving ? (
                <>
                  <span

                    role="status"
                    aria-hidden="true"
                  ></span>
                  Applying...
                </>
              ) : (
                t('common.save')
              )}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={showHingesModal} onClose={() => setShowHingesModal(false)} size={{ base: 'full', md: 'md' }} scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent>
          <PageHeader title={t('settings.manufacturers.catalogMapping.hinges.modalTitle')} />
          <ModalBody>
            <FormLabel>{t('settings.manufacturers.catalogMapping.hinges.left')}</FormLabel>
            <Input
              type="number"
              value={hingesData.leftHingePrice}
              onChange={(event) =>
                setHingesData({ ...hingesData, leftHingePrice: event.currentTarget.value })
              }
              placeholder={t('settings.manufacturers.catalogMapping.hinges.placeholderLeft')}
            />

            <FormLabel>
              {t('settings.manufacturers.catalogMapping.hinges.right')}
            </FormLabel>
            <Input
              type="number"
              value={hingesData.rightHingePrice}
              onChange={(event) =>
                setHingesData({ ...hingesData, rightHingePrice: event.currentTarget.value })
              }
              placeholder={t('settings.manufacturers.catalogMapping.hinges.placeholderRight')}
            />

            <FormLabel>
              {t('settings.manufacturers.catalogMapping.hinges.both')}
            </FormLabel>
            <Input
              type="number"
              value={hingesData.bothHingePrice}
              onChange={(event) =>
                setHingesData({ ...hingesData, bothHingePrice: event.currentTarget.value })
              }
              placeholder={t('settings.manufacturers.catalogMapping.hinges.placeholderBoth')}
            />

            <FormLabel>
              {t('settings.manufacturers.catalogMapping.hinges.exposedSide')}
            </FormLabel>
            <Input
              type="number"
              value={hingesData.exposedSidePrice}
              onChange={(event) =>
                setHingesData({ ...hingesData, exposedSidePrice: event.currentTarget.value })
              }
              placeholder={t('settings.manufacturers.catalogMapping.hinges.placeholderExposed')}
            />
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="gray" onClick={() => setShowHingesModal(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              style={{ backgroundColor: headerBg, color: textColor, borderColor: headerBg }}
              onClick={saveHingesDetails}
            >
              {t('common.save')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={showModificationModal} onClose={() => setShowModificationModal(false)} size={{ base: 'full', md: 'md' }} scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent>
          <PageHeader title={t('settings.manufacturers.catalogMapping.mod.modalTitle')} />
          <ModalBody>
            <FormLabel>{t('settings.manufacturers.catalogMapping.mod.name')}</FormLabel>
            <Input
              value={modificationData.modificationName}
              onChange={(event) =>
                setModificationData({
                  ...modificationData,
                  modificationName: event.currentTarget.value,
                })
              }
            />

            <FormLabel>
              {t('settings.manufacturers.catalogMapping.fields.description')}
            </FormLabel>
            <Textarea
              value={modificationData.description}
              onChange={(event) =>
                setModificationData({ ...modificationData, description: event.currentTarget.value })
              }
              rows={3}
            />

            <FormLabel>
              {t('settings.manufacturers.catalogMapping.mod.notes')}
            </FormLabel>
            <Textarea
              value={modificationData.notes}
              onChange={(event) =>
                setModificationData({ ...modificationData, notes: event.currentTarget.value })
              }
              rows={2}
            />

            <FormLabel>
              {t('settings.manufacturers.catalogMapping.fields.price')}
            </FormLabel>
            <Input
              type="number"
              value={modificationData.price}
              onChange={(event) =>
                setModificationData({ ...modificationData, price: event.currentTarget.value })
              }
            />
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="gray" onClick={() => setShowModificationModal(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              style={{ backgroundColor: headerBg, color: textColor, borderColor: headerBg }}
              onClick={saveModificationDetails}
            >
              {t('common.save')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Style Modal */}
      <Modal isOpen={deleteStyleModalVisible} onClose={() => setDeleteStyleModalVisible(false)} size={{ base: 'full', md: 'md' }} scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent>
          <PageHeader
            title={t('settings.manufacturers.catalogMapping.deleteStyle.modalTitle', {
              style: styleToDelete,
            })}
          />
          <ModalBody>
            <div>
              <p>
                You are about to delete the style "<strong>{styleToDelete}</strong>". This will
                affect{' '}
                <strong>{catalogData.filter((item) => item.style === styleToDelete).length}</strong>{' '}
                catalog items.
              </p>

              <p>What would you like to do with the items that currently have this style?</p>

              <div>
                <div className="form-check mb-2">
                  <input

                    type="radio"
                    name="deleteOption"
                    id="deleteItems"
                    checked={!mergeToStyle}
                    onChange={() => setMergeToStyle('')}
                  />
                  <label className="form-check-label text-danger" htmlFor="deleteItems">
                    <strong>Delete all items</strong> with this style permanently
                  </label>
                </div>

                <div>
                  <input

                    type="radio"
                    name="deleteOption"
                    id="mergeItems"
                    checked={!!mergeToStyle}
                    onChange={() =>
                      setMergeToStyle(sortedUniqueStyles.find((s) => s !== styleToDelete) || '')
                    }
                  />
                  <label className="form-check-label text-primary" htmlFor="mergeItems">
                    <strong>Merge items</strong> to another style
                  </label>
                </div>
              </div>

              {mergeToStyle !== '' && (
                <div>
                  <FormLabel>Select target style:</FormLabel>
                  <Select
                    value={mergeToStyle}
                    onChange={(event) => setMergeToStyle(event.currentTarget.value)}
                  >
                    <option value="">Select a style...</option>
                    {sortedUniqueStyles
                      .filter((style) => style !== styleToDelete)
                      .map((style, idx) => (
                        <option key={idx} value={style}>
                          {style}
                        </option>
                      ))}
                  </Select>
                </div>
              )}

              <div className="mt-3 p-3 bg-light rounded">
                <small>
                  {mergeToStyle ? (
                    <>
                      <strong>Smart Merge Action:</strong> All{' '}
                      {catalogData.filter((item) => item.style === styleToDelete).length} items with
                      style "{styleToDelete}" will be processed:
                      <ul className="mt-1 mb-0">
                        <li>Items with unique codes will be merged to style "{mergeToStyle}"</li>
                        <li>Duplicate items (same code + style) will be automatically removed</li>
                      </ul>
                    </>
                  ) : (
                    <>
                      <strong>Delete Action:</strong> All{' '}
                      {catalogData.filter((item) => item.style === styleToDelete).length} items with
                      style "{styleToDelete}" will be permanently deleted. This action cannot be
                      undone.
                    </>
                  )}
                </small>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              colorScheme="gray"
              onClick={() => setDeleteStyleModalVisible(false)}
              disabled={isDeleting}
            >
              {t('common.cancel')}
            </Button>
            <Button
              color={mergeToStyle ? 'primary' : 'danger'}
              onClick={handleDeleteStyle}
              disabled={isDeleting || (mergeToStyle !== '' && !mergeToStyle)}
            >
              {isDeleting ? (
                <>
                  <span

                    role="status"
                    aria-hidden="true"
                  ></span>
                  Processing...
                </>
              ) : mergeToStyle ? (
                `Merge to "${mergeToStyle}"`
              ) : (
                'Delete Permanently'
              )}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Individual Delete Item Modal */}
      <Modal isOpen={deleteItemModalVisible} onClose={() => setDeleteItemModalVisible(false)} size={{ base: 'full', md: 'md' }} scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent>
          <PageHeader title={t('settings.manufacturers.catalogMapping.deleteItem.modalTitle')} />
          <ModalBody>
            {itemToDelete && (
              <div>
                <p>Are you sure you want to delete this catalog item?</p>
                <div className="p-3 bg-light rounded">
                  <strong>Code:</strong> {itemToDelete.code}
                  <br />
                  <strong>Description:</strong> {itemToDelete.description || 'N/A'}
                  <br />
                  <strong>Style:</strong> {itemToDelete.style || 'N/A'}
                  <br />
                  <strong>Price:</strong> ${itemToDelete.price || '0.00'}
                </div>
                <p className="text-danger mt-3">
                  <small>⚠️ This action cannot be undone.</small>
                </p>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              colorScheme="gray"
              onClick={() => setDeleteItemModalVisible(false)}
              disabled={isDeletingItem}
            >
              {t('common.cancel')}
            </Button>
            <Button colorScheme="red" onClick={handleDeleteItem} disabled={isDeletingItem}>
              {isDeletingItem ? (
                <>
                  <span

                    role="status"
                    aria-hidden="true"
                  ></span>
                  Deleting...
                </>
              ) : (
                'Delete Item'
              )}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Bulk Delete Modal */}
      <Modal isOpen={bulkDeleteModalVisible} onClose={() => setBulkDeleteModalVisible(false)} size={{ base: 'full', md: 'md' }} scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent>
          <PageHeader title={t('settings.manufacturers.catalogMapping.bulk.deleteModalTitle')} />
          <ModalBody>
            <div>
              <p>
                Are you sure you want to delete <strong>{selectedItems.length}</strong> selected
                catalog items?
              </p>

              <div className="p-3 bg-light rounded">
                <strong>Items to be deleted:</strong>
                <ul className="mt-2 mb-0">
                  {currentItems
                    .filter((item) => selectedItems.includes(item.id))
                    .slice(0, 10) // Show first 10 items
                    .map((item) => (
                      <li key={item.id}>
                        {item.code} - {item.description || 'N/A'}
                      </li>
                    ))}
                  {selectedItems.length > 10 && (
                    <li>
                      <em>... and {selectedItems.length - 10} more items</em>
                    </li>
                  )}
                </ul>
              </div>

              <p className="text-danger mt-3">
                <small>
                  ⚠️ This action cannot be undone. All selected items will be permanently deleted.
                </small>
              </p>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              colorScheme="gray"
              onClick={() => setBulkDeleteModalVisible(false)}
              disabled={isBulkDeleting}
            >
              {t('common.cancel')}
            </Button>
            <Button colorScheme="red" onClick={handleBulkDelete} disabled={isBulkDeleting}>
              {isBulkDeleting ? (
                <>
                  <span

                    role="status"
                    aria-hidden="true"
                  ></span>
                  Deleting {selectedItems.length} items...
                </>
              ) : (
                `Delete ${selectedItems.length} Items`
              )}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Rollback Modal */}
      <Modal isOpen={rollbackModalVisible} onClose={() => setRollbackModalVisible(false)} size={{ base: 'full', md: 'md' }} scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent>
          <PageHeader title={t('settings.manufacturers.catalogMapping.rollback.modalTitle')} />
          <ModalBody>
            <div>
              <p>{t('settings.manufacturers.catalogMapping.rollback.selectBackup')}</p>

              {isLoadingBackups ? (
                <div className="text-center py-3">
                  <span role="status"></span>
                  Loading backups...
                </div>
              ) : availableBackups.length === 0 ? (
                <div className="alert alert-info">
                  {t('settings.manufacturers.catalogMapping.rollback.noBackups')}
                </div>
              ) : (
                <div>
                  {availableBackups.map((backup) => (
                    <div key={backup.uploadSessionId} className="form-check mb-2">
                      <input

                        type="radio"
                        name="backupSelection"
                        id={`backup-${backup.uploadSessionId}`}
                        value={backup.uploadSessionId}
                        checked={selectedBackup === backup.uploadSessionId}
                        onChange={(event) => setSelectedBackup(event.currentTarget.value)}
                      />
                      <label

                        htmlFor={`backup-${backup.uploadSessionId}`}
                        aria-label={`Select backup ${backup.originalName}`}
                      >
                        <div>
                          <strong>{backup.originalName}</strong>
                          <br />
                          <small>
                            {new Date(backup.uploadedAt).toLocaleString()} - {backup.itemsCount}{' '}
                            items
                          </small>
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedBackup && (
              <div className="alert alert-warning">
                <strong>{t('settings.manufacturers.catalogMapping.rollback.warning')}</strong>
                <br />
                {t('settings.manufacturers.catalogMapping.rollback.confirmText')}
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              colorScheme="gray"
              onClick={() => {
                setRollbackModalVisible(false)
                setSelectedBackup('')
                setAvailableBackups([])
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button
              color="warning"
              onClick={handleRollback}
              disabled={!selectedBackup || isRollingBack}
            >
              {isRollingBack ? (
                <>
                  <span

                    role="status"
                    aria-hidden="true"
                  ></span>
                  {t('settings.manufacturers.catalogMapping.rollback.rolling')}
                </>
              ) : (
                t('settings.manufacturers.catalogMapping.rollback.rollbackButton')
              )}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Bulk Edit Modal */}
      <Modal isOpen={bulkEditModalVisible} onClose={() => setBulkEditModalVisible(false)} size={{ base: 'full', md: 'md', lg: 'lg' }} scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent>
          <PageHeader
            title={t('settings.manufacturers.catalogMapping.bulkEdit.header', {
              count: selectedItems.length,
            })}
          />
          <ModalBody>
            <div>
              <p>
                Edit the following fields for the selected {selectedItems.length} catalog items.
                Leave fields empty to keep existing values.
              </p>

              <div className="row g-3">
                <div>
                  <FormLabel>Style</FormLabel>
                  <Input
                    type="text"
                    value={bulkEditForm.style}
                    onChange={(event) =>
                      setBulkEditForm({ ...bulkEditForm, style: event.currentTarget.value })
                    }
                    placeholder="Leave empty to keep existing"
                  />
                </div>

                <div>
                  <FormLabel>Type</FormLabel>
                  <Input
                    type="text"
                    value={bulkEditForm.type}
                    onChange={(event) =>
                      setBulkEditForm({ ...bulkEditForm, type: event.currentTarget.value })
                    }
                    placeholder="Leave empty to keep existing"
                  />
                </div>

                <div>
                  <FormLabel>Description</FormLabel>
                  <Textarea
                    value={bulkEditForm.description}
                    onChange={(event) =>
                      setBulkEditForm({ ...bulkEditForm, description: event.currentTarget.value })
                    }
                    placeholder="Leave empty to keep existing"
                    rows={3}
                  />
                </div>

                <div>
                  <FormLabel>Price</FormLabel>
                  <Input
                    type="number"
                    step="0.01"
                    value={bulkEditForm.price}
                    onChange={(event) =>
                      setBulkEditForm({ ...bulkEditForm, price: event.currentTarget.value })
                    }
                    placeholder="Leave empty to keep existing"
                  />
                </div>
              </div>

              <div className="mt-3 p-3 bg-light rounded">
                <small>
                  <strong>Note:</strong> Only the fields you fill will be updated. Empty fields will
                  preserve the existing values for each item.
                </small>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              colorScheme="gray"
              onClick={() => setBulkEditModalVisible(false)}
              disabled={isBulkEditing}
            >
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleBulkEdit} disabled={isBulkEditing}>
              {isBulkEditing ? (
                <>
                  <span

                    role="status"
                    aria-hidden="true"
                  ></span>
                  Updating {selectedItems.length} Items...
                </>
              ) : (
                `Update ${selectedItems.length} Items`
              )}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Style Name Modal */}
      <Modal isOpen={editStyleNameModalVisible} onClose={() => setEditStyleNameModalVisible(false)} size={{ base: 'full', md: 'md' }} scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent>
          <PageHeader title="Edit Style Name" />
          <ModalBody>
            <div>
              <p>
                Rename the style for all items of this manufacturer. This will affect all catalog
                items currently using this style.
              </p>

              <div>
                <FormLabel>Current Style Name</FormLabel>
                <Input
                  type="text"
                  value={styleNameEditForm.oldStyleName}
                  disabled
                  className="bg-light"
                />
              </div>

              <div>
                <FormLabel>New Style Name</FormLabel>
                <Input
                  type="text"
                  value={styleNameEditForm.newStyleName}
                  onChange={(event) =>
                    setStyleNameEditForm({
                      ...styleNameEditForm,
                      newStyleName: event.currentTarget.value,
                    })
                  }
                  placeholder="Enter new style name"
                />
              </div>

              <div className="p-3 bg-warning bg-opacity-10 rounded">
                <small>
                  <strong>Warning:</strong> This will rename the style for all items currently using
                  "{styleNameEditForm.oldStyleName}". The change applies to all{' '}
                  {
                    catalogData.filter((item) => item.style === styleNameEditForm.oldStyleName)
                      .length
                  }{' '}
                  items with this style.
                </small>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              colorScheme="gray"
              onClick={() => setEditStyleNameModalVisible(false)}
              disabled={isEditingStyleName}
            >
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleEditStyleName}
              disabled={isEditingStyleName || !styleNameEditForm.newStyleName.trim()}
            >
              {isEditingStyleName ? (
                <>
                  <span

                    role="status"
                    aria-hidden="true"
                  ></span>
                  Renaming Style...
                </>
              ) : (
                'Rename Style'
              )}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Main Modification Management Modal */}
      <Modal
        isOpen={showMainModificationModal}
        onClose={() => setShowMainModificationModal(false)}
        size="xl"
      >
        <ModalOverlay />
        <ModalContent>
          <PageHeader
            title={t(
              'settings.manufacturers.catalogMapping.modManagement.title',
              'Modification Management',
            )}
          />
          <ModalBody>
            {modificationView === 'cards' && (
              <Box>
                {/* Main Action Buttons */}
                <HStack spacing={3} mb={4} justify="center">
                  <Button
                    colorScheme="blue"
                    size="lg"
                    onClick={() => {
                      setEditingTemplateId(null)
                      setSelectedModificationCategory('')
                      setNewTemplate((n) => ({
                        categoryId: '',
                        name: '',
                        defaultPrice: '',
                        isReady: false,
                        sampleImage: '',
                        saveAsBlueprint: false,
                      }))
                      setGuidedBuilder(makeGuidedFromFields(null))
                      setModificationView('addNew')
                      setModificationStep(1)
                    }}
                  >
                    {t('globalMods.ui.buttons.addModification', 'Add Modification')}
                  </Button>
                  <Button colorScheme="blue" size="lg" onClick={() => setModificationView('gallery')}>
                    {t('globalMods.ui.buttons.gallery', 'Gallery')}
                  </Button>
                  <Button
                    colorScheme="green"
                    size="lg"
                    onClick={() => setShowAssignGlobalModsModal(true)}
                  >
                    {t('globalMods.ui.buttons.assignModification', 'Assign Modification')}
                  </Button>
                </HStack>

                {/* Existing Modification Cards */}
                <VStack spacing={4} align="stretch">
                  {manufacturerCategories.map((category) => (
                    <StandardCard key={category.id} h="full">
                      <Box p={4}>
                        <HStack justify="space-between" mb={3}>
                          <HStack spacing={2}>
                            {category.image && (
                              <>
                                <Image
                                  src={`${import.meta.env.VITE_API_URL || ''}/uploads/images/${category.image}`}
                                  alt={category.name}
                                  width={24}
                                  height={24}
                                  style={{
                                    objectFit: 'cover',
                                    borderRadius: 4,
                                    border: '1px solid',
                                    borderColor: 'gray.100',
                                  }}
                                  onError={(event) => {
                                    event.currentTarget.src = '/images/nologo.png'
                                  }}
                                />
                                <Badge
                                  colorScheme="info"
                                  title={t(
                                    'globalMods.modal.gallery.categoryImageUploaded',
                                    'Category image uploaded',
                                  )}
                                >
                                  {t('settings.manufacturers.catalogMapping.gallery.badges.img')}
                                </Badge>
                              </>
                            )}
                            <Text fontWeight="semibold" fontSize="lg">{category.name}</Text>
                          </HStack>
                          <HStack spacing={2}>
                            <Badge colorScheme="gray">
                              {t('settings.manufacturers.catalogMapping.modManagement.modsCount', {
                                count: category.templates?.length || 0,
                              })}
                            </Badge>
                            <Button
                              size="sm"
                              colorScheme="yellow"
                              variant="outline"
                              title={t('globalMods.category.editTooltip')}
                              onClick={() => {
                                setEditCategory({
                                  id: category.id,
                                  name: category.name || '',
                                  orderIndex: category.orderIndex || 0,
                                  image: category.image || '',
                                })
                                setShowEditCategoryModal(true)
                              }}
                            >
                              ✏️ {t('common.edit')}
                            </Button>
                            <Button
                              size="sm"
                              colorScheme="red"
                              variant="outline"
                              title={t('globalMods.category.deleteTooltip')}
                              onClick={() => {
                                setCategoryToDelete(category)
                                setShowDeleteCategoryModal(true)
                              }}
                            >
                              🗑️ {t('common.delete')}
                            </Button>
                          </HStack>
                        </HStack>
                        <VStack spacing={2} align="stretch">
                          {category.templates?.length ? (
                            category.templates.map((template) => (
                              <HStack
                                key={template.id}
                                p={3}
                                borderWidth="1px"
                                borderRadius="md"
                                justify="space-between"
                                align="center"
                              >
                                <HStack spacing={3}>
                                  {template.sampleImage && (
                                    <Image
                                      src={`${import.meta.env.VITE_API_URL || ''}/uploads/images/${template.sampleImage}`}
                                      alt={template.name}
                                      width={32}
                                      height={32}
                                      style={{
                                        objectFit: 'cover',
                                        borderRadius: 4,
                                        border: '1px solid',
                                        borderColor: 'gray.100',
                                      }}
                                      onError={(event) => {
                                        event.currentTarget.src = '/images/nologo.png'
                                      }}
                                    />
                                  )}
                                  <VStack align="start" spacing={1}>
                                    <HStack>
                                      <Text fontWeight="semibold">{template.name}</Text>
                                      {template.defaultPrice && (
                                        <Text color="gray.600">
                                          - ${Number(template.defaultPrice).toFixed(2)}
                                        </Text>
                                      )}
                                    </HStack>
                                    <HStack spacing={2}>
                                      <Badge colorScheme={template.isReady ? 'green' : 'yellow'}>
                                        {template.isReady
                                          ? t(
                                              'settings.manufacturers.catalogMapping.gallery.badges.ready',
                                            )
                                          : t(
                                              'settings.manufacturers.catalogMapping.gallery.badges.draft',
                                            )}
                                      </Badge>
                                      {template.sampleImage && (
                                        <Badge
                                          colorScheme="info"
                                          title={t(
                                            'settings.manufacturers.catalogMapping.gallery.tooltips.sampleUploaded',
                                          )}
                                        >
                                          {t(
                                            'settings.manufacturers.catalogMapping.gallery.badges.img',
                                          )}
                                        </Badge>
                                      )}
                                    </HStack>
                                  </VStack>
                                </HStack>
                                <HStack spacing={1}>
                                  <Button
                                    size="sm"
                                    colorScheme="blue"
                                    variant="outline"
                                    title={t(
                                      'settings.manufacturers.catalogMapping.gallery.tooltips.edit',
                                    )}
                                    onClick={() => {
                                      // Preserve full state so PUT payload includes required fields
                                      setEditTemplate({
                                        id: template.id,
                                        categoryId: String(template.categoryId || ''),
                                        name: template.name || '',
                                        defaultPrice:
                                          template.defaultPrice !== null &&
                                          template.defaultPrice !== undefined
                                            ? String(template.defaultPrice)
                                            : '',
                                        sampleImage: template.sampleImage || '',
                                        isReady: !!template.isReady,
                                        fieldsConfig: template.fieldsConfig || null,
                                      })
                                      // Load guided builder state from fieldsConfig
                                      setEditGuidedBuilder(
                                        makeGuidedFromFields(template.fieldsConfig),
                                      )
                                      setShowQuickEditTemplateModal(true)
                                    }}
                                  >
                                    ✏️
                                  </Button>
                                  <Button
                                    size="sm"
                                    colorScheme="red"
                                    variant="outline"
                                    title={t(
                                      'settings.manufacturers.catalogMapping.gallery.tooltips.delete',
                                    )}
                                    onClick={async () => {
                                      const confirmed = await askConfirm({
                                        title: t('settings.manufacturers.catalogMapping.gallery.deleteTitle', 'Delete Template'),
                                        description: t('settings.manufacturers.catalogMapping.gallery.confirmDelete', { name: template.name }),
                                        confirmText: t('common.delete', 'Delete'),
                                        cancelText: t('common.cancel', 'Cancel'),
                                      })
                                      if (confirmed) {
                                        deleteModificationTemplate(template.id)
                                      }
                                    }}
                                  >
                                    🗑️
                                  </Button>
                                  <Button
                                    size="sm"
                                    colorScheme="yellow"
                                    variant="outline"
                                    title={t(
                                      'settings.manufacturers.catalogMapping.gallery.tooltips.move',
                                    )}
                                    onClick={() => {
                                      setModificationToMove(template)
                                      setShowMoveModificationModal(true)
                                    }}
                                  >
                                    📁
                                  </Button>
                                  <Button
                                    size="sm"
                                    colorScheme="green"
                                    variant="outline"
                                    title={t('globalMods.modal.assign.title')}
                                    onClick={() => {
                                      setAssignFormGM((f) => ({ ...f, templateId: template.id }))
                                      setShowAssignGlobalModsModal(true)
                                    }}
                                  >
                                    🎯
                                  </Button>
                                </HStack>
                              </HStack>
                            ))
                          ) : (
                            <Text color="gray.500" py={4} textAlign="center">
                              {t('settings.manufacturers.catalogMapping.gallery.emptyCategory')}
                            </Text>
                          )}
                        </VStack>
                      </Box>
                    </StandardCard>
                  ))}
                  {!manufacturerCategories.length && (
                    <Box textAlign="center" py={4}>
                      <Text>
                        {t('settings.manufacturers.catalogMapping.modManagement.noCategories', {
                          addLabel: t('globalMods.ui.buttons.addModification', 'Add Modification'),
                        })}
                      </Text>
                    </Box>
                  )}
                </VStack>
              </Box>
            )}


            {modificationView === 'addNew' && (
              <div>
                {modificationStep === 1 && (
                  <div>
                    <h5>{t('globalMods.modal.add.step1Title')}</h5>
                    <div>
                      <Select
                        value={selectedModificationCategory}
                        onChange={(event) =>
                          setSelectedModificationCategory(event.currentTarget.value)
                        }
                      >
                        <option value="">{t('globalMods.modal.add.selectExisting')}</option>
                        {/* Show manufacturer categories only for manufacturer context */}
                        {manufacturerCategories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                        <option value="new">{t('globalMods.modal.add.createNew')}</option>
                      </Select>
                    </div>

                    {selectedModificationCategory === 'new' && (
                      <div className="border rounded p-3 mb-3">
                        <h6>{t('globalMods.modal.add.createNew')}</h6>
                        <div>
                          <div>
                            <Input
                              placeholder={t('globalMods.modal.add.newSubmenuName')}
                              value={newCategory.name}
                              onChange={(event) =>
                                setNewCategory((n) => ({ ...n, name: event.currentTarget.value }))
                              }
                            />
                          </div>
                          <div>
                            <Input
                              type="number"
                              placeholder={t('globalMods.modal.add.orderIndex')}
                              value={newCategory.orderIndex}
                              onChange={(event) =>
                                setNewCategory((n) => ({
                                  ...n,
                                  orderIndex: event.currentTarget.value,
                                }))
                              }
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <Button colorScheme="gray" onClick={() => setModificationView('cards')}>
                        Back to Overview
                      </Button>
                      <Button
                        colorScheme="blue"
                        onClick={() => setModificationStep(2)}
                        disabled={
                          !selectedModificationCategory ||
                          (selectedModificationCategory === 'new' && !newCategory.name)
                        }
                      >
                        Next: Template Builder
                      </Button>
                    </div>
                  </div>
                )}

                {modificationStep === 2 && (
                  <div>
                    <h5>Step 2: Build Modification Template</h5>

                    {/* Default Required Fields */}
                    <div className="border rounded p-3 mb-3">
                      <h6>Required Fields</h6>
                      <div>
                        <div>
                          <Input
                            placeholder="Modification name *"
                            value={newTemplate.name}
                            onChange={(event) =>
                              setNewTemplate((n) => ({ ...n, name: event.currentTarget.value }))
                            }
                          />
                        </div>
                        <div>
                          <Input
                            type="number"
                            placeholder={
                              newTemplate.saveAsBlueprint
                                ? "Blueprints don't have prices"
                                : 'Default price *'
                            }
                            value={newTemplate.saveAsBlueprint ? '' : newTemplate.defaultPrice}
                            onChange={(event) =>
                              setNewTemplate((n) => ({
                                ...n,
                                defaultPrice: event.currentTarget.value,
                              }))
                            }
                            disabled={newTemplate.saveAsBlueprint}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Optional Field Builder */}
                    <div className="border rounded p-3 mb-3">
                      <h6>Optional Field Builder (Building Blocks)</h6>

                      {/* Slider Controls */}
                      <div className="row mb-3">
                        <div>
                          <div>
                            <div>
                              <Checkbox
                                label="Height Slider"
                                isChecked={guidedBuilder.sliders.height.enabled}
                                onChange={(event) =>
                                  setGuidedBuilder((g) => ({
                                    ...g,
                                    sliders: {
                                      ...g.sliders,
                                      height: {
                                        ...g.sliders.height,
                                        enabled: event.currentTarget.checked,
                                      },
                                    },
                                  }))
                                }
                              />
                            </div>
                            {guidedBuilder.sliders.height.enabled && (
                              <div>
                                <div>
                                  <Input
                                    type="number"
                                    placeholder="Min height"
                                    value={guidedBuilder.sliders.height.min}
                                    onChange={(event) =>
                                      setGuidedBuilder((g) => ({
                                        ...g,
                                        sliders: {
                                          ...g.sliders,
                                          height: {
                                            ...g.sliders.height,
                                            min: event.currentTarget.value,
                                          },
                                        },
                                      }))
                                    }
                                  />
                                </div>
                                <div>
                                  <Input
                                    type="number"
                                    placeholder="Max height"
                                    value={guidedBuilder.sliders.height.max}
                                    onChange={(event) =>
                                      setGuidedBuilder((g) => ({
                                        ...g,
                                        sliders: {
                                          ...g.sliders,
                                          height: {
                                            ...g.sliders.height,
                                            max: event.currentTarget.value,
                                          },
                                        },
                                      }))
                                    }
                                  />
                                </div>
                                <Select
                                  value={
                                    guidedBuilder.sliders.height.useCustomIncrements
                                      ? 'custom'
                                      : guidedBuilder.sliders.height.step
                                  }
                                  onChange={(event) =>
                                    setGuidedBuilder((g) => ({
                                      ...g,
                                      sliders: {
                                        ...g.sliders,
                                        height: {
                                          ...g.sliders.height,
                                          step:
                                            event.currentTarget.value === 'custom'
                                              ? 1
                                              : event.currentTarget.value,
                                          useCustomIncrements:
                                            event.currentTarget.value === 'custom',
                                        },
                                      },
                                    }))
                                  }
                                >
                                  <option value="1">1 inch increments</option>
                                  <option value="0.5">0.5 inch increments</option>
                                  <option value="0.25">0.25 inch increments</option>
                                  <option value="custom">
                                    Custom fractions (1/8, 1/4, 3/8, etc.)
                                  </option>
                                </Select>
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <div>
                            <div>
                              <Checkbox
                                label="Width Slider"
                                isChecked={guidedBuilder.sliders.width.enabled}
                                onChange={(event) =>
                                  setGuidedBuilder((g) => ({
                                    ...g,
                                    sliders: {
                                      ...g.sliders,
                                      width: {
                                        ...g.sliders.width,
                                        enabled: event.currentTarget.checked,
                                      },
                                    },
                                  }))
                                }
                              />
                            </div>
                            {guidedBuilder.sliders.width.enabled && (
                              <div>
                                <div>
                                  <Input
                                    type="number"
                                    placeholder="Min width"
                                    value={guidedBuilder.sliders.width.min}
                                    onChange={(event) =>
                                      setGuidedBuilder((g) => ({
                                        ...g,
                                        sliders: {
                                          ...g.sliders,
                                          width: {
                                            ...g.sliders.width,
                                            min: event.currentTarget.value,
                                          },
                                        },
                                      }))
                                    }
                                  />
                                </div>
                                <div>
                                  <Input
                                    type="number"
                                    placeholder="Max width"
                                    value={guidedBuilder.sliders.width.max}
                                    onChange={(event) =>
                                      setGuidedBuilder((g) => ({
                                        ...g,
                                        sliders: {
                                          ...g.sliders,
                                          width: {
                                            ...g.sliders.width,
                                            max: event.currentTarget.value,
                                          },
                                        },
                                      }))
                                    }
                                  />
                                </div>
                                <Select
                                  value={
                                    guidedBuilder.sliders.width.useCustomIncrements
                                      ? 'custom'
                                      : guidedBuilder.sliders.width.step
                                  }
                                  onChange={(event) =>
                                    setGuidedBuilder((g) => ({
                                      ...g,
                                      sliders: {
                                        ...g.sliders,
                                        width: {
                                          ...g.sliders.width,
                                          step:
                                            event.currentTarget.value === 'custom'
                                              ? 1
                                              : event.currentTarget.value,
                                          useCustomIncrements:
                                            event.currentTarget.value === 'custom',
                                        },
                                      },
                                    }))
                                  }
                                >
                                  <option value="1">1 inch increments</option>
                                  <option value="0.5">0.5 inch increments</option>
                                  <option value="0.25">0.25 inch increments</option>
                                  <option value="custom">
                                    Custom fractions (1/8, 1/4, 3/8, etc.)
                                  </option>
                                </Select>
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <div>
                            <div>
                              <Checkbox
                                label="Depth Slider"
                                isChecked={guidedBuilder.sliders.depth.enabled}
                                onChange={(event) =>
                                  setGuidedBuilder((g) => ({
                                    ...g,
                                    sliders: {
                                      ...g.sliders,
                                      depth: {
                                        ...g.sliders.depth,
                                        enabled: event.currentTarget.checked,
                                      },
                                    },
                                  }))
                                }
                              />
                            </div>
                            {guidedBuilder.sliders.depth.enabled && (
                              <div>
                                <div>
                                  <Input
                                    type="number"
                                    placeholder="Min depth"
                                    value={guidedBuilder.sliders.depth.min}
                                    onChange={(event) =>
                                      setGuidedBuilder((g) => ({
                                        ...g,
                                        sliders: {
                                          ...g.sliders,
                                          depth: {
                                            ...g.sliders.depth,
                                            min: event.currentTarget.value,
                                          },
                                        },
                                      }))
                                    }
                                  />
                                </div>
                                <div>
                                  <Input
                                    type="number"
                                    placeholder="Max depth"
                                    value={guidedBuilder.sliders.depth.max}
                                    onChange={(event) =>
                                      setGuidedBuilder((g) => ({
                                        ...g,
                                        sliders: {
                                          ...g.sliders,
                                          depth: {
                                            ...g.sliders.depth,
                                            max: event.currentTarget.value,
                                          },
                                        },
                                      }))
                                    }
                                  />
                                </div>
                                <Select
                                  value={
                                    guidedBuilder.sliders.depth.useCustomIncrements
                                      ? 'custom'
                                      : guidedBuilder.sliders.depth.step
                                  }
                                  onChange={(event) =>
                                    setGuidedBuilder((g) => ({
                                      ...g,
                                      sliders: {
                                        ...g.sliders,
                                        depth: {
                                          ...g.sliders.depth,
                                          step:
                                            event.currentTarget.value === 'custom'
                                              ? 1
                                              : event.currentTarget.value,
                                          useCustomIncrements:
                                            event.currentTarget.value === 'custom',
                                        },
                                      },
                                    }))
                                  }
                                >
                                  <option value="1">1 inch increments</option>
                                  <option value="0.5">0.5 inch increments</option>
                                  <option value="0.25">0.25 inch increments</option>
                                  <option value="custom">
                                    Custom fractions (1/8, 1/4, 3/8, etc.)
                                  </option>
                                </Select>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Additional Controls */}
                      <div className="row mb-3">
                        <div>
                          <div>
                            <div>
                              <Checkbox
                                label="Side Selector"
                                isChecked={guidedBuilder.sideSelector.enabled}
                                onChange={(event) =>
                                  setGuidedBuilder((g) => ({
                                    ...g,
                                    sideSelector: {
                                      ...g.sideSelector,
                                      enabled: event.currentTarget.checked,
                                    },
                                  }))
                                }
                              />
                            </div>
                            {guidedBuilder.sideSelector.enabled && (
                              <div>
                                <small>
                                  Limited to Left/Right options
                                </small>
                                <Input
                                  placeholder="L,R"
                                  value={guidedBuilder.sideSelector.options?.join(',')}
                                  onChange={(event) =>
                                    setGuidedBuilder((g) => ({
                                      ...g,
                                      sideSelector: {
                                        ...g.sideSelector,
                                        options: event.currentTarget.value
                                          .split(',')
                                          .map((s) => s.trim())
                                          .filter(Boolean),
                                      },
                                    }))
                                  }
                                  disabled
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <div>
                            <div>
                              <Checkbox
                                label="Quantity Limits"
                                isChecked={guidedBuilder.qtyRange.enabled}
                                onChange={(event) =>
                                  setGuidedBuilder((g) => ({
                                    ...g,
                                    qtyRange: {
                                      ...g.qtyRange,
                                      enabled: event.currentTarget.checked,
                                    },
                                  }))
                                }
                              />
                            </div>
                            {guidedBuilder.qtyRange.enabled && (
                              <div>
                                <div>
                                  <Input
                                    type="number"
                                    placeholder="Min qty"
                                    value={guidedBuilder.qtyRange.min}
                                    onChange={(event) =>
                                      setGuidedBuilder((g) => ({
                                        ...g,
                                        qtyRange: { ...g.qtyRange, min: event.currentTarget.value },
                                      }))
                                    }
                                  />
                                </div>
                                <Input
                                  type="number"
                                  placeholder="Max qty"
                                  value={guidedBuilder.qtyRange.max}
                                  onChange={(event) =>
                                    setGuidedBuilder((g) => ({
                                      ...g,
                                      qtyRange: { ...g.qtyRange, max: event.currentTarget.value },
                                    }))
                                  }
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <div>
                            <div>
                              <Checkbox
                                label="Customer Notes"
                                isChecked={guidedBuilder.notes.enabled}
                                onChange={(event) =>
                                  setGuidedBuilder((g) => ({
                                    ...g,
                                    notes: { ...g.notes, enabled: event.currentTarget.checked },
                                  }))
                                }
                              />
                            </div>
                            {guidedBuilder.notes.enabled && (
                              <div>
                                <div>
                                  <Input
                                    placeholder="Notes placeholder"
                                    value={guidedBuilder.notes.placeholder}
                                    onChange={(event) =>
                                      setGuidedBuilder((g) => ({
                                        ...g,
                                        notes: {
                                          ...g.notes,
                                          placeholder: event.currentTarget.value,
                                        },
                                      }))
                                    }
                                  />
                                </div>
                                <Checkbox
                                  label="Show in red for customer warning"
                                  isChecked={guidedBuilder.notes.showInRed}
                                  onChange={(event) =>
                                    setGuidedBuilder((g) => ({
                                      ...g,
                                      notes: { ...g.notes, showInRed: event.currentTarget.checked },
                                    }))
                                  }
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <div>
                            <div>
                              <Checkbox
                                label="Customer Upload"
                                isChecked={guidedBuilder.customerUpload.enabled}
                                onChange={(event) =>
                                  setGuidedBuilder((g) => ({
                                    ...g,
                                    customerUpload: {
                                      ...g.customerUpload,
                                      enabled: event.currentTarget.checked,
                                    },
                                  }))
                                }
                              />
                            </div>
                            {guidedBuilder.customerUpload.enabled && (
                              <div>
                                <div>
                                  <Input
                                    placeholder={t(
                                      'settings.manufacturers.catalogMapping.builder.uploadTitlePh',
                                    )}
                                    value={guidedBuilder.customerUpload.title}
                                    onChange={(event) =>
                                      setGuidedBuilder((g) => ({
                                        ...g,
                                        customerUpload: {
                                          ...g.customerUpload,
                                          title: event.currentTarget.value,
                                        },
                                      }))
                                    }
                                  />
                                </div>
                                <Checkbox
                                  isChecked={guidedBuilder.customerUpload.required}
                                  onChange={(event) =>
                                    setGuidedBuilder((g) => ({
                                      ...g,
                                      customerUpload: {
                                        ...g.customerUpload,
                                        required: event.currentTarget.checked,
                                      },
                                    }))
                                  }
                                >
                                  {t(
                                    'settings.manufacturers.catalogMapping.builder.requiredUpload',
                                  )}
                                </Checkbox>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Description and Sample Image */}
                      <div className="row mb-3">
                        <div>
                          <div>
                            <div>
                              <h6>
                                {t(
                                  'settings.manufacturers.catalogMapping.builder.descriptions.header',
                                )}
                              </h6>
                            </div>
                            <div>
                              <div>
                                <div>
                                  <Input
                                    placeholder={t(
                                      'settings.manufacturers.catalogMapping.builder.descriptions.internal',
                                    )}
                                    value={guidedBuilder.descriptions.internal}
                                    onChange={(event) =>
                                      setGuidedBuilder((g) => ({
                                        ...g,
                                        descriptions: {
                                          ...g.descriptions,
                                          internal: event.currentTarget.value,
                                        },
                                      }))
                                    }
                                  />
                                </div>
                                <div>
                                  <Input
                                    placeholder={t(
                                      'settings.manufacturers.catalogMapping.builder.descriptions.customer',
                                    )}
                                    value={guidedBuilder.descriptions.customer}
                                    onChange={(event) =>
                                      setGuidedBuilder((g) => ({
                                        ...g,
                                        descriptions: {
                                          ...g.descriptions,
                                          customer: event.currentTarget.value,
                                        },
                                      }))
                                    }
                                  />
                                </div>
                                <div>
                                  <Input
                                    placeholder={t(
                                      'settings.manufacturers.catalogMapping.builder.descriptions.installer',
                                    )}
                                    value={guidedBuilder.descriptions.installer}
                                    onChange={(event) =>
                                      setGuidedBuilder((g) => ({
                                        ...g,
                                        descriptions: {
                                          ...g.descriptions,
                                          installer: event.currentTarget.value,
                                        },
                                      }))
                                    }
                                  />
                                </div>
                              </div>
                              <div>
                                <Checkbox
                                  isChecked={guidedBuilder.descriptions.both}
                                  onChange={(event) =>
                                    setGuidedBuilder((g) => ({
                                      ...g,
                                      descriptions: {
                                        ...g.descriptions,
                                        both: event.currentTarget.checked,
                                      },
                                    }))
                                  }
                                >
                                  {t(
                                    'settings.manufacturers.catalogMapping.builder.descriptions.showBoth',
                                  )}
                                </Checkbox>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div>
                          <div>
                            <div>
                              <Checkbox
                                isChecked={guidedBuilder.modSampleImage.enabled}
                                onChange={(event) =>
                                  setGuidedBuilder((g) => ({
                                    ...g,
                                    modSampleImage: {
                                      ...g.modSampleImage,
                                      enabled: event.currentTarget.checked,
                                    },
                                  }))
                                }
                              >
                                {t(
                                  'settings.manufacturers.catalogMapping.builder.sampleImage.label',
                                )}
                              </Checkbox>
                            </div>
                            {guidedBuilder.modSampleImage.enabled && (
                              <div>
                                <div>
                                  <FormLabel>
                                    {t(
                                      'settings.manufacturers.catalogMapping.builder.sampleImage.upload',
                                    )}
                                  </FormLabel>
                                  <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={async (event) => {
                                      const file = event.currentTarget.files?.[0]
                                      const fname = await uploadImageFile(file)
                                      if (fname)
                                        setNewTemplate((n) => ({ ...n, sampleImage: fname }))
                                    }}
                                  />
                                </div>
                                {newTemplate.sampleImage && (
                                  <div
                                    className="p-2 bg-light border rounded"
                                    style={{
                                      height: 200,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                    }}
                                  >
                                    <Image
                                      src={`${import.meta.env.VITE_API_URL || ''}/uploads/images/${newTemplate.sampleImage}`}
                                      alt={t(
                                        'settings.manufacturers.catalogMapping.builder.sampleImage.alt',
                                      )}
                                      style={{
                                        maxHeight: '100%',
                                        maxWidth: '100%',
                                        objectFit: 'contain',
                                      }}
                                      onError={(event) => {
                                        event.currentTarget.src = '/images/nologo.png'
                                      }}
                                    />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Ready Checkbox */}
                      <div className="border-top pt-3">
                        <Checkbox
                          isChecked={newTemplate.isReady}
                          onChange={(event) =>
                            setNewTemplate((n) => ({ ...n, isReady: event.currentTarget.checked }))
                          }
                        >
                          {t('settings.manufacturers.catalogMapping.builder.ready.markAsReady')}
                        </Checkbox>
                        {/* Task 5: Blueprint checkbox for saving to gallery */}
                        <Checkbox
                          isChecked={newTemplate.saveAsBlueprint}
                          onChange={(event) =>
                            setNewTemplate((n) => ({
                              ...n,
                              saveAsBlueprint: event.currentTarget.checked,
                            }))
                          }

                        >
                          {t('settings.manufacturers.catalogMapping.builder.ready.saveAsBlueprint')}
                        </Checkbox>
                        <small className="text-muted d-block mt-1">
                          {t('settings.manufacturers.catalogMapping.builder.ready.blueprintHint')}
                        </small>
                      </div>
                    </div>

                    <div>
                      <Button colorScheme="gray" onClick={() => setModificationStep(1)}>
                        {t('settings.manufacturers.catalogMapping.builder.buttons.back')}
                      </Button>
                      <Button colorScheme="gray" onClick={() => setModificationView('cards')}>
                        {t('settings.manufacturers.catalogMapping.builder.buttons.cancel')}
                      </Button>
                      {editingTemplateId ? (
                        <Button
                          colorScheme="blue"
                          onClick={async () => {
                            setCreatingModification(true)
                            try {
                              let categoryIdToUse = selectedModificationCategory
                              if (selectedModificationCategory === 'new') {
                                const newCat = await createModificationCategory()
                                categoryIdToUse = newCat.id
                              }
                              await updateModificationTemplate(editingTemplateId, categoryIdToUse)
                              resetModificationForm()
                              toast({
                                title: t('common.success', 'Success'),
                                description: t('settings.manufacturers.catalogMapping.builder.toast.updateSuccess'),
                                status: 'success',
                                duration: 4000,
                                isClosable: true,
                              })
                            } catch (error) {
                              toast({
                                title: t('common.error', 'Error'),
                                description: error.response?.data?.message || t('settings.manufacturers.catalogMapping.builder.toast.updateFailed'),
                                status: 'error',
                                duration: 4000,
                                isClosable: true,
                              })
                            } finally {
                              setCreatingModification(false)
                            }
                          }}
                          disabled={!newTemplate.name || creatingModification}
                        >
                          {creatingModification ? (
                            <>
                              <span

                                role="status"
                                aria-hidden="true"
                              ></span>
                              {t('common.saving')}
                            </>
                          ) : (
                            t('settings.manufacturers.catalogMapping.builder.buttons.saveChanges')
                          )}
                        </Button>
                      ) : (
                        <Button
                          colorScheme="blue"
                          onClick={async () => {
                            // Task 5: Block creation if manufacturerId is missing
                            if (!id) {
                              toast({
                                title: t('settings.manufacturers.catalogMapping.builder.toast.manufacturerMissingTitle'),
                                description: t('settings.manufacturers.catalogMapping.builder.toast.manufacturerMissingText'),
                                status: 'error',
                                duration: 5000,
                                isClosable: true,
                              })
                              return
                            }

                            setCreatingModification(true)
                            try {
                              let categoryIdToUse = selectedModificationCategory

                              // Create new category if needed
                              if (selectedModificationCategory === 'new') {
                                const newCat = await createModificationCategory()
                                categoryIdToUse = newCat.id
                              }

                              // Create the template
                              await createModificationTemplate(categoryIdToUse)

                              // Reset form and go back to cards view
                              resetModificationForm()

                              // Show success message
                              toast({
                                title: t('settings.manufacturers.catalogMapping.builder.toast.createSuccessTitle'),
                                description: t('settings.manufacturers.catalogMapping.builder.toast.createSuccessText'),
                                status: 'success',
                                duration: 4000,
                                isClosable: true,
                              })
                            } catch (error) {
                              toast({
                                title: t('settings.manufacturers.catalogMapping.builder.toast.createFailedTitle'),
                                description: error.response?.data?.message || t('settings.manufacturers.catalogMapping.builder.toast.createFailedText'),
                                status: 'error',
                                duration: 5000,
                                isClosable: true,
                              })
                            } finally {
                              setCreatingModification(false)
                            }
                          }}
                          disabled={
                            !newTemplate.name || !newTemplate.defaultPrice || creatingModification
                          }
                        >
                          {creatingModification ? (
                            <>
                              <span

                                role="status"
                                aria-hidden="true"
                              ></span>
                              {t('common.creating')}
                            </>
                          ) : (
                            t('settings.manufacturers.catalogMapping.builder.buttons.create')
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {modificationView === 'gallery' && (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5>{t('settings.manufacturers.catalogMapping.gallery.title')}</h5>
                  <Button colorScheme="gray" onClick={() => setModificationView('cards')}>
                    {t('settings.manufacturers.catalogMapping.gallery.back')}
                  </Button>
                </div>

                <div>
                  {globalGallery.map((category) => (
                    <div key={category.id} className="col-md-6 mb-4">
                      <div>
                        <div>
                          <h6>{category.name}</h6>
                          <div>
                            <Button
                              size="sm"
                              colorScheme="red"
                              variant="outline"
                              title={t(
                                'settings.manufacturers.catalogMapping.gallery.tooltips.deleteCategory',
                              )}
                              onClick={() => {
                                setCategoryToDelete(category)
                                setShowDeleteCategoryModal(true)
                              }}
                            >
                              {t('settings.manufacturers.catalogMapping.gallery.actions.delete')}
                            </Button>
                          </div>
                        </div>
                        <div>
                          {category.templates?.length ? (
                            category.templates.map((template) => (
                              <div
                                key={template.id}

                              >
                                <div>
                                  {template.sampleImage && (
                                    <Image
                                      src={`${import.meta.env.VITE_API_URL || ''}/uploads/images/${template.sampleImage}`}
                                      alt={template.name}
                                      width={32}
                                      height={32}
                                      style={{
                                        objectFit: 'cover',
                                        borderRadius: 4,
                                        border: '1px solid',
                                        borderColor: 'gray.100',
                                      }}
                                      onError={(event) => {
                                        event.currentTarget.src = '/images/nologo.png'
                                      }}
                                    />
                                  )}
                                  <div>
                                    <strong>{template.name}</strong>
                                    {template.defaultPrice && (
                                      <span>
                                        {' '}
                                        - ${Number(template.defaultPrice).toFixed(2)}
                                      </span>
                                    )}
                                    <div>
                                      <Badge color={template.isReady ? 'success' : 'warning'}>
                                        {template.isReady
                                          ? t(
                                              'settings.manufacturers.catalogMapping.gallery.badges.ready',
                                            )
                                          : t(
                                              'settings.manufacturers.catalogMapping.gallery.badges.draft',
                                            )}
                                      </Badge>
                                      {template.sampleImage && (
                                        <Badge
                                          colorScheme="info"
                                          title={t(
                                            'settings.manufacturers.catalogMapping.gallery.tooltips.sampleUploaded',
                                          )}
                                        >
                                          {t(
                                            'settings.manufacturers.catalogMapping.gallery.badges.img',
                                          )}
                                        </Badge>
                                      )}
                                    </div>
                                    <div>
                                      {template.fieldsConfig?.descriptions?.customer ||
                                        t(
                                          'settings.manufacturers.catalogMapping.gallery.noDescription',
                                        )}
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <Button
                                    size="sm"
                                    color="outline-primary"
                                    title={t(
                                      'settings.manufacturers.catalogMapping.gallery.tooltips.edit',
                                    )}
                                    onClick={() => {
                                      // Set up edit state
                                      setEditTemplate({
                                        id: template.id,
                                        categoryId: String(template.categoryId || ''),
                                        name: template.name || '',
                                        defaultPrice:
                                          template.defaultPrice !== null &&
                                          template.defaultPrice !== undefined
                                            ? String(template.defaultPrice)
                                            : '',
                                        sampleImage: template.sampleImage || '',
                                        isReady: !!template.isReady,
                                        fieldsConfig: template.fieldsConfig || null,
                                      })
                                      setEditGuidedBuilder(
                                        makeGuidedFromFields(template.fieldsConfig),
                                      )
                                      setShowQuickEditTemplateModal(true)
                                    }}
                                  >
                                    ✏️
                                  </Button>
                                  <Button
                                    size="sm"
                                    color="outline-danger"
                                    title={t(
                                      'settings.manufacturers.catalogMapping.gallery.tooltips.delete',
                                    )}
                                    onClick={async () => {
                                      const confirmed = await askConfirm({
                                        title: t('settings.manufacturers.catalogMapping.gallery.deleteTitle', 'Delete Template'),
                                        description: t('settings.manufacturers.catalogMapping.gallery.confirmDeleteWithAssignments', `Are you sure you want to delete "${template.name}"? This will also remove all assignments of this modification.`),
                                        confirmText: t('common.delete', 'Delete'),
                                        cancelText: t('common.cancel', 'Cancel'),
                                      })
                                      if (confirmed) {
                                        deleteModificationTemplate(template.id)
                                      }
                                    }}
                                  >
                                    🗑️
                                  </Button>
                                  <Button
                                    size="sm"
                                    color="outline-warning"
                                    title={t(
                                      'settings.manufacturers.catalogMapping.gallery.tooltips.move',
                                    )}
                                    onClick={() => {
                                      setModificationToMove(template)
                                      setShowMoveModificationModal(true)
                                    }}
                                  >
                                    {t(
                                      'settings.manufacturers.catalogMapping.gallery.actions.move',
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    colorScheme="blue"
                                    title={t(
                                      'settings.manufacturers.catalogMapping.gallery.tooltips.useAsBlueprint',
                                    )}
                                    onClick={async () => {
                                      try {
                                        await axiosInstance.post('/api/global-mods/templates', {
                                          categoryId: template.categoryId || null,
                                          name: `${template.name} (Copy)`,
                                          defaultPrice: 0,
                                          isReady: false,
                                          fieldsConfig: template.fieldsConfig || {},
                                          sampleImage: template.sampleImage || null,
                                        })
                                        await loadGlobalGallery()
                                      } catch (e) {
                                        alert(e?.response?.data?.message || e.message)
                                      }
                                    }}
                                  >
                                    📋
                                  </Button>
                                  <Button
                                    size="sm"
                                    color="success"
                                    title={t(
                                      'settings.manufacturers.catalogMapping.gallery.tooltips.assignToManufacturer',
                                    )}
                                    onClick={() => {
                                      // Assign this template
                                      setAssignFormGM((prev) => ({
                                        ...prev,
                                        templateId: template.id,
                                      }))
                                      setShowAssignGlobalModsModal(true)
                                    }}
                                  >
                                    🎯
                                  </Button>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p>
                              {t('settings.manufacturers.catalogMapping.gallery.emptyCategory')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="gray" onClick={() => setShowMainModificationModal(false)}>
              {t('common.close', 'Close')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Category Modal */}
      <Modal
        isOpen={showEditCategoryModal}
        onClose={() => setShowEditCategoryModal(false)}
        size={{ base: 'full', md: 'md', lg: 'lg' }}
      >
        <ModalOverlay />
        <ModalContent>
          <PageHeader title={t('globalMods.modal.editCategory.title', 'Edit Category')} />
          <ModalBody>
            <div className="row g-3">
              <div>
                <FormLabel>
                  {t('globalMods.modal.editCategory.nameLabel', 'Category Name')}
                </FormLabel>
                <Input
                  value={editCategory.name}
                  onChange={(event) =>
                    setEditCategory((c) => ({ ...c, name: event.currentTarget.value }))
                  }
                />
              </div>
              <div>
                <FormLabel>{t('globalMods.modal.editCategory.orderLabel', 'Order')}</FormLabel>
                <Input
                  type="number"
                  value={editCategory.orderIndex}
                  onChange={(event) =>
                    setEditCategory((c) => ({ ...c, orderIndex: event.currentTarget.value }))
                  }
                />
              </div>
              <div>
                <FormLabel>
                  {t('globalMods.modal.editCategory.imageLabel', 'Category Image')}
                </FormLabel>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={async (event) => {
                    const file = event.currentTarget.files?.[0]
                    const fname = await uploadImageFile(file)
                    if (fname) setEditCategory((c) => ({ ...c, image: fname }))
                  }}
                />
                {editCategory.image && (
                  <div
                    className="mt-2 p-2 bg-light border rounded"
                    style={{
                      height: 220,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Image
                      src={`${import.meta.env.VITE_API_URL || ''}/uploads/images/${editCategory.image}`}
                      alt={t('globalMods.modal.editCategory.imageLabel', 'Category Image')}
                      style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                      onError={(event) => {
                        event.currentTarget.src = '/images/nologo.png'
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="d-flex gap-2 justify-content-end mt-3">
              <Button colorScheme="gray" onClick={() => setShowEditCategoryModal(false)}>
                {t('globalMods.modal.editCategory.cancel', 'Cancel')}
              </Button>
              <Button
                colorScheme="blue"
                onClick={async () => {
                  if (!editCategory.id || !editCategory.name.trim()) return
                  await axiosInstance.put(`/api/global-mods/categories/${editCategory.id}`, {
                    name: editCategory.name.trim(),
                    orderIndex: Number(editCategory.orderIndex || 0),
                    image: editCategory.image || null,
                  })
                  setShowEditCategoryModal(false)
                  await loadGlobalGallery()
                }}
              >
                {t('globalMods.modal.editCategory.save', 'Save')}
              </Button>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Delete Category Modal */}
      <Modal isOpen={showDeleteCategoryModal} onClose={() => setShowDeleteCategoryModal(false)} size={{ base: 'full', md: 'md' }} scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent>
          <PageHeader
            title={t('globalMods.modal.deleteCategory.title', {
              name: categoryToDelete?.name || '',
            })}
          />
          <ModalBody>
            {categoryToDelete && (
              <>
                <p>
                  <strong>{t('globalMods.modal.deleteCategory.warning', '⚠️ Warning:')}</strong>{' '}
                  {t('globalMods.modal.deleteCategory.aboutToDelete', {
                    name: categoryToDelete.name,
                  })}
                </p>
                {categoryToDelete.templates?.length > 0 && (
                  <div className="alert alert-warning">
                    <strong>{t('globalMods.modal.deleteCategory.warning', '⚠️ Warning:')}</strong>{' '}
                    {t('globalMods.modal.deleteCategory.contains', {
                      count: categoryToDelete.templates.length,
                    })}
                    <div>
                      <div>
                        <input

                          type="radio"
                          name="deleteMode"
                          id="deleteCancel"
                          value="cancel"
                          defaultChecked
                        />
                        <label htmlFor="deleteCancel">
                          {t('globalMods.modal.deleteCategory.cancel')}
                        </label>
                      </div>
                      <div>
                        <input

                          type="radio"
                          name="deleteMode"
                          id="deleteWithMods"
                          value="withMods"
                        />
                        <label htmlFor="deleteWithMods">
                          {t('globalMods.modal.deleteCategory.deleteWithMods')}
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
            <div className="d-flex gap-2 justify-content-end mt-3">
              <Button colorScheme="gray" onClick={() => setShowDeleteCategoryModal(false)}>
                {t('globalMods.modal.deleteCategory.cancel', 'Cancel')}
              </Button>
              <Button
                colorScheme="red"
                onClick={async () => {
                  if (!categoryToDelete) return

                  let deleteMode = 'only' // Default mode for empty categories
                  if (categoryToDelete.templates?.length > 0) {
                    const selectedMode = document.querySelector(
                      'input[name="deleteMode"]:checked',
                    )?.value
                    if (selectedMode === 'withMods') {
                      deleteMode = 'withMods'
                    } else {
                      // User chose to cancel deletion
                      setShowDeleteCategoryModal(false)
                      return
                    }
                  }

                  await deleteCategory(categoryToDelete.id, deleteMode)
                  setShowDeleteCategoryModal(false)
                  setCategoryToDelete(null)
                }}
              >
                {t('globalMods.modal.deleteCategory.deleteOnly', 'Delete Category')}
              </Button>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Move Modification Modal */}
      <Modal isOpen={showMoveModificationModal} onClose={() => setShowMoveModificationModal(false)} size={{ base: 'full', md: 'md' }} scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent>
          <PageHeader title={t('common.move', 'Move Modification')} />
          <ModalBody>
            {modificationToMove && (
              <>
                <p>
                  {t('common.move', 'Move')} <strong>"{modificationToMove.name}"</strong>{' '}
                  {t('common.to', 'to')} {t('common.whichCategory', 'which category?')}
                </p>
                <div>
                  <label>
                    {t(
                      'globalMods.modal.deleteCategory.move.selectTarget',
                      'Select destination category',
                    )}
                  </label>
                  <select
                    className="form-select"
                    id="moveToCategory"
                    defaultValue={modificationToMove.categoryId || ''}
                  >
                    <option value="">{t('common.uncategorized', '-- Uncategorized --')}</option>
                    {/* Gallery categories */}
                    <optgroup label={t('common.galleryCategories', 'Gallery Categories')}>
                      {globalGallery.map((cat) => (
                        <option key={`gallery-${cat.id}`} value={cat.id}>
                          {cat.name} ({t('common.gallery', 'Gallery')})
                        </option>
                      ))}
                    </optgroup>
                    {/* Manufacturer categories */}
                    <optgroup label={t('common.manufacturerCategories', 'Manufacturer Categories')}>
                      {manufacturerCategories.map((cat) => (
                        <option key={`mfg-${cat.id}`} value={cat.id}>
                          {cat.name} ({t('common.manufacturer', 'Manufacturer')})
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
                <div className="alert alert-info">
                  <small>
                    <strong>{t('common.note', 'Note')}:</strong>{' '}
                    {t(
                      'settings.manufacturers.catalogMapping.gallery.tooltips.move',
                      'Move to different category',
                    )}
                  </small>
                </div>
              </>
            )}
            <div className="d-flex gap-2 justify-content-end mt-3">
              <Button colorScheme="gray" onClick={() => setShowMoveModificationModal(false)}>
                {t('common.cancel')}
              </Button>
              <Button
                colorScheme="blue"
                onClick={async () => {
                  if (!modificationToMove) return

                  const newCategoryId = document.getElementById('moveToCategory').value
                  await moveModification(modificationToMove.id, newCategoryId || null)
                  setShowMoveModificationModal(false)
                  setModificationToMove(null)
                }}
              >
                {t('common.move', 'Move')}
              </Button>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Enhanced Edit Template Modal */}
      <Modal
        isOpen={showQuickEditTemplateModal}
        onClose={() => setShowQuickEditTemplateModal(false)}
        size="xl"
      >
        <ModalOverlay />
        <ModalContent>
          <PageHeader title={t('globalMods.modal.editTemplate.title', 'Edit Modification')} />
          <ModalBody>
            {/* Basic Information */}
            <div className="border rounded p-3 mb-3">
              <h6>{t('common.basicInformation', 'Basic Information')}</h6>
              <div className="row g-3">
                <div>
                  <FormLabel>{t('globalMods.modal.editTemplate.nameLabel', 'Name')}</FormLabel>
                  <Input
                    value={editTemplate.name}
                    onChange={(event) =>
                      setEditTemplate((t) => ({ ...t, name: event.currentTarget.value }))
                    }
                  />
                </div>
                <div>
                  <FormLabel>
                    {t('globalMods.modal.editTemplate.priceLabel', 'Default Price')}{' '}
                    {editTemplate.saveAsBlueprint &&
                      t('common.disabledForBlueprints', '(disabled for blueprints)')}
                  </FormLabel>
                  <Input
                    type="number"
                    step="0.01"
                    value={editTemplate.saveAsBlueprint ? '' : editTemplate.defaultPrice}
                    onChange={(event) =>
                      setEditTemplate((t) => ({ ...t, defaultPrice: event.currentTarget.value }))
                    }
                    disabled={editTemplate.saveAsBlueprint}
                    placeholder={
                      editTemplate.saveAsBlueprint
                        ? t('common.blueprintsNoPrice', "Blueprints don't have prices")
                        : t('globalMods.template.defaultPricePlaceholder', 'Enter default price')
                    }
                  />
                </div>
                <div>
                  <FormLabel>{t('globalMods.template.statusLabel', 'Status')}</FormLabel>
                  <Select
                    value={editTemplate.isReady ? 'ready' : 'draft'}
                    onChange={(event) =>
                      setEditTemplate((t) => ({
                        ...t,
                        isReady: event.currentTarget.value === 'ready',
                      }))
                    }
                  >
                    <option value="draft">{t('globalMods.template.status.draft', 'Draft')}</option>
                    <option value="ready">{t('globalMods.template.status.ready', 'Ready')}</option>
                  </Select>
                </div>
                <div>
                  <div className="form-check form-switch mt-4">
                    <input

                      type="checkbox"
                      id="showToBoth"
                      checked={editTemplate.showToBoth || false}
                      onChange={(event) =>
                        setEditTemplate((t) => ({ ...t, showToBoth: event.currentTarget.checked }))
                      }
                    />
                    <label htmlFor="showToBoth">
                      {t('globalMods.builder.descriptions.customer', 'Customer description')} &{' '}
                      {t('globalMods.builder.descriptions.installer', 'Installer description')}{' '}
                      {t('common.showToBoth', 'shown to both')}
                    </label>
                  </div>
                </div>
                <div>
                  <FormLabel>
                    {t('globalMods.modal.editTemplate.sampleUploadLabel', 'Sample Image')}
                  </FormLabel>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={async (event) => {
                      const file = event.currentTarget.files?.[0]
                      const fname = await uploadImageFile(file)
                      if (fname) setEditTemplate((t) => ({ ...t, sampleImage: fname }))
                    }}
                  />
                  {editTemplate.sampleImage && (
                    <div
                      className="mt-2 p-2 bg-light border rounded"
                      style={{
                        height: 240,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Image
                        src={`${import.meta.env.VITE_API_URL || ''}/uploads/images/${editTemplate.sampleImage}`}
                        alt={t('globalMods.modal.editTemplate.sampleAlt', 'Sample')}
                        style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                        onError={(event) => {
                          event.currentTarget.src = '/images/nologo.png'
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Advanced Field Configuration */}
            <div className="border rounded p-3 mb-3">
              <h6>{t('common.advancedFieldConfiguration', 'Advanced Field Configuration')}</h6>

              {/* Slider Controls */}
              <div className="row mb-3">
                <div>
                  <div>
                    <div>
                      <Checkbox
                        isChecked={editGuidedBuilder.sliders.height.enabled}
                        onChange={(event) =>
                          setEditGuidedBuilder((g) => ({
                            ...g,
                            sliders: {
                              ...g.sliders,
                              height: { ...g.sliders.height, enabled: event.currentTarget.checked },
                            },
                          }))
                        }
                      >
                        {t('globalMods.builder.heightSlider', 'Height Slider')}
                      </Checkbox>
                    </div>
                    {editGuidedBuilder.sliders.height.enabled && (
                      <div>
                        <div>
                          <div>
                            <Input
                              placeholder={t('globalMods.builder.min', 'Min')}
                              type="number"
                              value={editGuidedBuilder.sliders.height.min}
                              onChange={(event) =>
                                setEditGuidedBuilder((g) => ({
                                  ...g,
                                  sliders: {
                                    ...g.sliders,
                                    height: {
                                      ...g.sliders.height,
                                      min: Number(event.currentTarget.value) || 0,
                                    },
                                  },
                                }))
                              }
                            />
                          </div>
                          <div>
                            <Input
                              placeholder={t('globalMods.builder.max', 'Max')}
                              type="number"
                              value={editGuidedBuilder.sliders.height.max}
                              onChange={(event) =>
                                setEditGuidedBuilder((g) => ({
                                  ...g,
                                  sliders: {
                                    ...g.sliders,
                                    height: {
                                      ...g.sliders.height,
                                      max: Number(event.currentTarget.value) || 0,
                                    },
                                  },
                                }))
                              }
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <div>
                    <div>
                      <Checkbox
                        isChecked={editGuidedBuilder.sliders.width.enabled}
                        onChange={(event) =>
                          setEditGuidedBuilder((g) => ({
                            ...g,
                            sliders: {
                              ...g.sliders,
                              width: { ...g.sliders.width, enabled: event.currentTarget.checked },
                            },
                          }))
                        }
                      >
                        {t('globalMods.builder.widthSlider', 'Width Slider')}
                      </Checkbox>
                    </div>
                    {editGuidedBuilder.sliders.width.enabled && (
                      <div>
                        <div>
                          <div>
                            <Input
                              placeholder={t('globalMods.builder.min', 'Min')}
                              type="number"
                              value={editGuidedBuilder.sliders.width.min}
                              onChange={(event) =>
                                setEditGuidedBuilder((g) => ({
                                  ...g,
                                  sliders: {
                                    ...g.sliders,
                                    width: {
                                      ...g.sliders.width,
                                      min: Number(event.currentTarget.value) || 0,
                                    },
                                  },
                                }))
                              }
                            />
                          </div>
                          <div>
                            <Input
                              placeholder={t('globalMods.builder.max', 'Max')}
                              type="number"
                              value={editGuidedBuilder.sliders.width.max}
                              onChange={(event) =>
                                setEditGuidedBuilder((g) => ({
                                  ...g,
                                  sliders: {
                                    ...g.sliders,
                                    width: {
                                      ...g.sliders.width,
                                      max: Number(event.currentTarget.value) || 0,
                                    },
                                  },
                                }))
                              }
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <div>
                    <div>
                      <Checkbox
                        isChecked={editGuidedBuilder.sliders.depth.enabled}
                        onChange={(event) =>
                          setEditGuidedBuilder((g) => ({
                            ...g,
                            sliders: {
                              ...g.sliders,
                              depth: { ...g.sliders.depth, enabled: event.currentTarget.checked },
                            },
                          }))
                        }
                      >
                        {t('globalMods.builder.depthSlider', 'Depth Slider')}
                      </Checkbox>
                    </div>
                    {editGuidedBuilder.sliders.depth.enabled && (
                      <div>
                        <div>
                          <div>
                            <Input
                              placeholder={t('globalMods.builder.min', 'Min')}
                              type="number"
                              value={editGuidedBuilder.sliders.depth.min}
                              onChange={(event) =>
                                setEditGuidedBuilder((g) => ({
                                  ...g,
                                  sliders: {
                                    ...g.sliders,
                                    depth: {
                                      ...g.sliders.depth,
                                      min: Number(event.currentTarget.value) || 0,
                                    },
                                  },
                                }))
                              }
                            />
                          </div>
                          <div>
                            <Input
                              placeholder={t('globalMods.builder.max', 'Max')}
                              type="number"
                              value={editGuidedBuilder.sliders.depth.max}
                              onChange={(event) =>
                                setEditGuidedBuilder((g) => ({
                                  ...g,
                                  sliders: {
                                    ...g.sliders,
                                    depth: {
                                      ...g.sliders.depth,
                                      max: Number(event.currentTarget.value) || 0,
                                    },
                                  },
                                }))
                              }
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Additional Controls */}
              <div className="row mb-3">
                <div>
                  <div>
                    <div>
                      <Checkbox
                        isChecked={editGuidedBuilder.sideSelector.enabled}
                        onChange={(event) =>
                          setEditGuidedBuilder((g) => ({
                            ...g,
                            sideSelector: {
                              ...g.sideSelector,
                              enabled: event.currentTarget.checked,
                            },
                          }))
                        }
                      >
                        {t('globalMods.builder.sideSelector.label', 'Side Selector')}
                      </Checkbox>
                    </div>
                    {editGuidedBuilder.sideSelector.enabled && (
                      <div>
                        <Input
                          placeholder={t(
                            'globalMods.builder.sideSelector.placeholder',
                            'Options (comma-separated: L,R)',
                          )}
                          value={
                            Array.isArray(editGuidedBuilder.sideSelector.options)
                              ? editGuidedBuilder.sideSelector.options.join(',')
                              : 'L,R'
                          }
                          onChange={(event) =>
                            setEditGuidedBuilder((g) => ({
                              ...g,
                              sideSelector: {
                                ...g.sideSelector,
                                options: event.currentTarget.value
                                  .split(',')
                                  .map((s) => s.trim())
                                  .filter(Boolean),
                              },
                            }))
                          }
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <div>
                    <div>
                      <Checkbox
                        isChecked={editGuidedBuilder.qtyRange.enabled}
                        onChange={(event) =>
                          setEditGuidedBuilder((g) => ({
                            ...g,
                            qtyRange: { ...g.qtyRange, enabled: event.currentTarget.checked },
                          }))
                        }
                      >
                        {t('globalMods.builder.quantityLimits.label', 'Quantity Range')}
                      </Checkbox>
                    </div>
                    {editGuidedBuilder.qtyRange.enabled && (
                      <div>
                        <div>
                          <div>
                            <Input
                              placeholder={t('globalMods.builder.quantityLimits.minQty', 'Min qty')}
                              type="number"
                              value={editGuidedBuilder.qtyRange.min}
                              onChange={(event) =>
                                setEditGuidedBuilder((g) => ({
                                  ...g,
                                  qtyRange: {
                                    ...g.qtyRange,
                                    min: Number(event.currentTarget.value) || 1,
                                  },
                                }))
                              }
                            />
                          </div>
                          <div>
                            <Input
                              placeholder={t('globalMods.builder.quantityLimits.maxQty', 'Max qty')}
                              type="number"
                              value={editGuidedBuilder.qtyRange.max}
                              onChange={(event) =>
                                setEditGuidedBuilder((g) => ({
                                  ...g,
                                  qtyRange: {
                                    ...g.qtyRange,
                                    max: Number(event.currentTarget.value) || 10,
                                  },
                                }))
                              }
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes and Upload Controls */}
              <div className="row mb-3">
                <div>
                  <div>
                    <div>
                      <Checkbox
                        isChecked={editGuidedBuilder.notes.enabled}
                        onChange={(event) =>
                          setEditGuidedBuilder((g) => ({
                            ...g,
                            notes: { ...g.notes, enabled: event.currentTarget.checked },
                          }))
                        }
                      >
                        {t('globalMods.builder.customerNotes.label', 'Customer Notes Field')}
                      </Checkbox>
                    </div>
                    {editGuidedBuilder.notes.enabled && (
                      <div>
                        <Input
                          placeholder={t(
                            'globalMods.builder.customerNotes.placeholder',
                            'Placeholder text',
                          )}
                          value={editGuidedBuilder.notes.placeholder}
                          onChange={(event) =>
                            setEditGuidedBuilder((g) => ({
                              ...g,
                              notes: { ...g.notes, placeholder: event.currentTarget.value },
                            }))
                          }
                        />
                        <Checkbox

                          isChecked={editGuidedBuilder.notes.showInRed}
                          onChange={(event) =>
                            setEditGuidedBuilder((g) => ({
                              ...g,
                              notes: { ...g.notes, showInRed: event.currentTarget.checked },
                            }))
                          }
                        >
                          {t('globalMods.builder.customerNotes.showInRed', 'Show in red')}
                        </Checkbox>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <div>
                    <div>
                      <Checkbox
                        isChecked={editGuidedBuilder.customerUpload.enabled}
                        onChange={(event) =>
                          setEditGuidedBuilder((g) => ({
                            ...g,
                            customerUpload: {
                              ...g.customerUpload,
                              enabled: event.currentTarget.checked,
                            },
                          }))
                        }
                      >
                        {t('globalMods.builder.customerUpload.label', 'Customer File Upload')}
                      </Checkbox>
                    </div>
                    {editGuidedBuilder.customerUpload.enabled && (
                      <div>
                        <Input
                          placeholder={t(
                            'globalMods.builder.customerUpload.titlePlaceholder',
                            'Upload title',
                          )}
                          value={editGuidedBuilder.customerUpload.title}
                          onChange={(event) =>
                            setEditGuidedBuilder((g) => ({
                              ...g,
                              customerUpload: {
                                ...g.customerUpload,
                                title: event.currentTarget.value,
                              },
                            }))
                          }
                        />
                        <Checkbox

                          isChecked={editGuidedBuilder.customerUpload.required}
                          onChange={(event) =>
                            setEditGuidedBuilder((g) => ({
                              ...g,
                              customerUpload: {
                                ...g.customerUpload,
                                required: event.currentTarget.checked,
                              },
                            }))
                          }
                        >
                          {t('globalMods.builder.customerUpload.required', 'Required')}
                        </Checkbox>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Descriptions */}
              <div>
                <div>
                  <h6>{t('globalMods.builder.title', 'Guided Builder')}</h6>
                </div>
                <div>
                  <div>
                    <div>
                      <Input
                        placeholder={t(
                          'globalMods.builder.descriptions.internal',
                          'Internal description',
                        )}
                        value={editGuidedBuilder.descriptions.internal}
                        onChange={(event) =>
                          setEditGuidedBuilder((g) => ({
                            ...g,
                            descriptions: {
                              ...g.descriptions,
                              internal: event.currentTarget.value,
                            },
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Input
                        placeholder={t(
                          'globalMods.builder.descriptions.customer',
                          'Customer description',
                        )}
                        value={editGuidedBuilder.descriptions.customer}
                        onChange={(event) =>
                          setEditGuidedBuilder((g) => ({
                            ...g,
                            descriptions: {
                              ...g.descriptions,
                              customer: event.currentTarget.value,
                            },
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Input
                        placeholder={t(
                          'globalMods.builder.descriptions.installer',
                          'Installer description',
                        )}
                        value={editGuidedBuilder.descriptions.installer}
                        onChange={(event) =>
                          setEditGuidedBuilder((g) => ({
                            ...g,
                            descriptions: {
                              ...g.descriptions,
                              installer: event.currentTarget.value,
                            },
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="d-flex gap-2 justify-content-end mt-3">
              <Button colorScheme="gray" onClick={() => setShowQuickEditTemplateModal(false)}>
                {t('globalMods.modal.add.cancel', 'Cancel')}
              </Button>
              <Button
                colorScheme="blue"
                onClick={async () => {
                  if (!editTemplate.id || !editTemplate.name.trim()) return
                  // Build fieldsConfig from edit guided builder
                  const fieldsConfig = buildEditFieldsConfig()
                  // Important: send full payload so server doesn't reset fields to null/false
                  await axiosInstance.put(`/api/global-mods/templates/${editTemplate.id}`, {
                    categoryId: editTemplate.categoryId ? Number(editTemplate.categoryId) : null,
                    name: editTemplate.name.trim(),
                    defaultPrice: editTemplate.defaultPrice
                      ? Number(editTemplate.defaultPrice)
                      : null,
                    fieldsConfig,
                    sampleImage: editTemplate.sampleImage || null,
                    isReady: !!editTemplate.isReady,
                  })
                  setShowQuickEditTemplateModal(false)
                  await loadGlobalGallery()
                }}
              >
                {t('globalMods.modal.editTemplate.saveChanges', 'Save Changes')}
              </Button>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Sub-Type Create/Edit Modal */}
      <Modal
        isOpen={showSubTypeModal}
        onClose={() => {
          setShowSubTypeModal(false)
          setSubTypeForm({
            name: '',
            description: '',
            requires_hinge_side: false,
            requires_exposed_side: false,
          })
          setEditingSubType(null)
        }}
        size="lg"
      >
        <PageHeader
          title={
            editingSubType
              ? t('settings.manufacturers.catalogMapping.subTypes.editTitle')
              : t('settings.manufacturers.catalogMapping.subTypes.create')
          }
          className="rounded-0 border-0"
          cardClassName="rounded-0 border-bottom"
        />
        <ModalBody>
          <Box>
            <div>
              <FormLabel>{t('common.name', 'Name')} *</FormLabel>
              <Input
                value={subTypeForm.name}
                onChange={(event) =>
                  setSubTypeForm((prev) => ({ ...prev, name: event.currentTarget.value }))
                }
                placeholder={t(
                  'settings.manufacturers.catalogMapping.subTypes.namePlaceholder',
                  'e.g., Single Door Cabinets',
                )}
              />
            </div>
            <div>
              <FormLabel>{t('common.description')}</FormLabel>
              <Textarea
                rows={3}
                value={subTypeForm.description}
                onChange={(event) =>
                  setSubTypeForm((prev) => ({ ...prev, description: event.currentTarget.value }))
                }
                placeholder={t(
                  'settings.manufacturers.catalogMapping.subTypes.descriptionPlaceholder',
                  'Optional description for this sub-type',
                )}
              />
            </div>
            <div>
              <Checkbox
                id="requiresHingeSide"
                isChecked={subTypeForm.requires_hinge_side}
                onChange={(event) =>
                  setSubTypeForm((prev) => ({
                    ...prev,
                    requires_hinge_side: event.currentTarget.checked,
                  }))
                }
              >
                {t('settings.manufacturers.catalogMapping.subTypes.requiresHingeSelection')}
              </Checkbox>
              <small>
                {t('settings.manufacturers.catalogMapping.subTypes.requiresHingeHelp')}
              </small>
            </div>
            <div>
              <Checkbox
                id="requiresExposedSide"
                isChecked={subTypeForm.requires_exposed_side}
                onChange={(event) =>
                  setSubTypeForm((prev) => ({
                    ...prev,
                    requires_exposed_side: event.currentTarget.checked,
                  }))
                }
              >
                {t('settings.manufacturers.catalogMapping.subTypes.requiresExposedSelection')}
              </Checkbox>
              <small>
                {t('settings.manufacturers.catalogMapping.subTypes.requiresExposedHelp')}
              </small>
            </div>
          </Box>
        </ModalBody>
        <ModalFooter>
          <Button
            colorScheme="gray"
            onClick={() => {
              setShowSubTypeModal(false)
              setSubTypeForm({
                name: '',
                description: '',
                requires_hinge_side: false,
                requires_exposed_side: false,
              })
              setEditingSubType(null)
            }}
          >
            {t('common.cancel')}
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleSubTypeSave}
            disabled={!subTypeForm.name.trim()}
          >
            {editingSubType ? t('common.update', 'Update') : t('common.create', 'Create')}{' '}
            {t('settings.manufacturers.catalogMapping.subTypes.singular', 'Sub-Type')}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Assign Items to Sub-Type Modal */}
      <Modal
        isOpen={showAssignSubTypeModal}
        onClose={() => {
          setShowAssignSubTypeModal(false)
          setSelectedSubType(null)
          setSelectedCatalogItem([])
          setSelectedCatalogCodes([])
        }}
        size="xl"
      >
        <PageHeader
          title={t(
            'settings.manufacturers.catalogMapping.subTypes.assignModal.title',
            'Assign Catalog Items to Sub-Type',
          )}
          className="rounded-0 border-0"
          cardClassName="rounded-0 border-bottom"
        />
        <ModalBody>
          <div>
            <FormLabel>
              {t(
                'settings.manufacturers.catalogMapping.subTypes.assignModal.selectLabel',
                'Select catalog items to assign to this sub-type:',
              )}
            </FormLabel>
            <small className="d-block text-muted mb-3">
              {t('settings.manufacturers.catalogMapping.subTypes.assignModal.selectedSummary', {
                codes: selectedCatalogCodes.length,
                items: selectedCatalogItem.length,
              })}
            </small>
          </div>

          <div style={{ maxHeight: '400px' }}>
            <Table>
              <Thead>
                <Tr>
                  <Th>
                    <Checkbox
                      isChecked={
                        selectedCatalogCodes.length === groupedCatalogData.length &&
                        groupedCatalogData.length > 0
                      }
                      onChange={(event) => {
                        if (event.currentTarget.checked) {
                          // Select all codes
                          const allCodes = groupedCatalogData.map((group) => group.code)
                          const allItemIds = groupedCatalogData.flatMap((group) => group.itemIds)
                          setSelectedCatalogCodes(allCodes)
                          setSelectedCatalogItem(allItemIds)
                        } else {
                          // Deselect all
                          setSelectedCatalogCodes([])
                          setSelectedCatalogItem([])
                        }
                      }}
                    />
                  </Th>
                  <Th>{t('settings.manufacturers.catalogMapping.table.code')}</Th>
                  <Th>{t('settings.manufacturers.catalogMapping.table.description')}</Th>
                  <Th>{t('settings.manufacturers.catalogMapping.table.type')}</Th>
                  <Th>
                    {t('settings.manufacturers.catalogMapping.assignModal.stylesHeader', 'Styles')}
                  </Th>
                  <Th>
                    {t(
                      'settings.manufacturers.catalogMapping.subTypes.assignModal.itemsCount',
                      'Items Count',
                    )}
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {groupedCatalogData.map((group) => (
                  <Tr key={group.code}>
                    <Td>
                      <Checkbox
                        isChecked={selectedCatalogCodes.includes(group.code)}
                        onChange={(event) => {
                          handleCodeSelection(group.code, event.currentTarget.checked)
                        }}
                      />
                    </Td>
                    <Td>{group.code}</Td>
                    <Td>{group.description}</Td>
                    <Td>{group.type}</Td>
                    <Td>
                      <small>
                        {group.styles.slice(0, 3).join(', ')}
                        {group.styles.length > 3 &&
                          ` +${group.styles.length - 3} ${t('settings.manufacturers.catalogMapping.subTypes.assignModal.more', 'more')}`}
                      </small>
                    </Td>
                    <Td>
                      <Badge colorScheme="info">{group.itemIds.length}</Badge>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            colorScheme="gray"
            onClick={() => {
              setShowAssignSubTypeModal(false)
              setSelectedSubType(null)
              setSelectedCatalogItem([])
              setSelectedCatalogCodes([])
            }}
          >
            {t('common.cancel')}
          </Button>
          <Button
            colorScheme="blue"
            onClick={() => {
              if (selectedSubType && selectedCatalogItem.length > 0) {
                handleAssignToSubType()
                setShowAssignSubTypeModal(false)
                setSelectedSubType(null)
                setSelectedCatalogItem([])
                setSelectedCatalogCodes([])
              }
            }}
            disabled={selectedCatalogItem.length === 0}
          >
            {t('settings.manufacturers.catalogMapping.subTypes.assignModal.assignCTA', {
              count: selectedCatalogItem.length,
            })}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}

export default CatalogMappingTab
