import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Card,
  CardBody,
  CardHeader,
  Flex,
  Box,
  Spinner,
  Alert,
  Badge,
  Input,
  FormLabel,
  Modal,
  ModalBody,
  ModalFooter,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  Textarea,
  Checkbox,
  Button,
  Text,
  HStack,
  VStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  InputGroup,
  InputLeftElement,
  IconButton,
  Stack,
  SimpleGrid,
  Image,
  useToast,
} from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import axiosInstance from '../../../../helpers/axiosInstance'
import PageHeader from '../../../../components/PageHeader'
import { Pencil, Trash, Search, Plus, ChevronDown } from '@/icons-lucide'

// Helper function to get auth headers


const TypesTab = ({ manufacturer }) => {
  const { t } = useTranslation()
  const toast = useToast()
  const api_url = import.meta.env.VITE_API_URL
  const [types, setTypes] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [hoveredId, setHoveredId] = useState(null)
  const [selectedItems, setSelectedItems] = useState([])
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'table'
  // Create Type modal state
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [creatingType, setCreatingType] = useState(false)
  const [createError, setCreateError] = useState(null)
  const [createForm, setCreateForm] = useState({
    typeName: '',
    longDescription: '',
    imageFile: null,
  })

  // Filter states
  const [styleFilter, setStyleFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [catalogItems, setCatalogItems] = useState([])

  // Bulk type change modal states
  const [bulkTypeChangeModalVisible, setBulkTypeChangeModalVisible] = useState(false)
  const [newTypeCategory, setNewTypeCategory] = useState('')
  const [isChangingType, setIsChangingType] = useState(false)

  // Edit modal states
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [selectedType, setSelectedType] = useState(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)

  // Modal catalog items for type assignment
  const [modalCatalogItems, setModalCatalogItems] = useState([])
  const [modalCatalogLoading, setModalCatalogLoading] = useState(false)
  const [modalTypeFilter, setModalTypeFilter] = useState('')
  const [selectedModalItems, setSelectedModalItems] = useState([])
  const [modalSearchTerm, setModalSearchTerm] = useState('')
  const [assignSuccess, setAssignSuccess] = useState(null) // { count, type }
  // Modal pagination state
  const [modalPage, setModalPage] = useState(1)
  const [modalLimit, setModalLimit] = useState(50)
  const [modalHasMore, setModalHasMore] = useState(true)
  const [modalLoadingMore, setModalLoadingMore] = useState(false)

  // Bulk edit modal states
  const [bulkEditModalVisible, setBulkEditModalVisible] = useState(false)
  const [bulkEditForm, setBulkEditForm] = useState({
    type: '',
    description: '',
  })
  const [isBulkEditing, setIsBulkEditing] = useState(false)

  // Type rename modal states
  const [renameModalVisible, setRenameModalVisible] = useState(false)
  const [typeNameEditForm, setTypeNameEditForm] = useState({
    oldTypeName: '',
    newTypeName: '',
  })
  const [isRenamingType, setIsRenamingType] = useState(false)
  // Delete type
  const [deleteTypeAsk, setDeleteTypeAsk] = useState({ open: false, typeName: '' })
  const [reassignTypeTo, setReassignTypeTo] = useState('')

  // Handle image load error - memoized to prevent re-renders
  const handleImageError = useCallback((e) => {
    // Only set fallback if not already set to prevent loops
    if (
      e.target.src.indexOf('/images/nologo.png') === -1 &&
      e.target.src.indexOf('/default-image.png') === -1
    ) {
      e.target.src = '/images/nologo.png'
    }
  }, [])

  // Get image source with fallback logic
  const getImageSrc = useCallback(
    (type) => {
      if (type?.image) {
        return `${api_url}/uploads/types/${type.image}`
      }
      return '/images/nologo.png'
    },
    [api_url],
  )

  const fetchTypes = useCallback(async () => {
    if (!manufacturer?.id) return

    setLoading(true)
    setError(null)

    try {
      const response = await axiosInstance.get(`/api/manufacturers/${manufacturer.id}/types-meta`, {
        // Authorization handled by axios interceptors
      })

      if (response.data && Array.isArray(response.data)) {
        setTypes(response.data)
      } else {
        setTypes([])
      }
    } catch (error) {
      console.error('Error fetching types:', error)
      setError('Failed to load types')
      setTypes([])
    } finally {
      setLoading(false)
    }
  }, [manufacturer?.id])

  const fetchCatalogItems = useCallback(async () => {
    if (!manufacturer?.id) return

    try {
      const response = await axiosInstance.get(`/api/manufacturers/${manufacturer.id}/catalog`, {
        // Authorization handled by axios interceptors
      })

      if (response.data && Array.isArray(response.data)) {
        setCatalogItems(response.data)
      } else {
        setCatalogItems([])
      }
    } catch (error) {
      console.error('Error fetching catalog items:', error)
      setCatalogItems([])
    }
  }, [manufacturer?.id])

  useEffect(() => {
    fetchTypes()
    fetchCatalogItems()
  }, [fetchTypes, fetchCatalogItems])

  // Filter types based on search term and filters - memoized to prevent unnecessary re-renders
  const filteredTypes = useMemo(() => {
    return types.filter((type) => {
      const matchesSearch =
        type.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        type.description?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStyleFilter =
        !styleFilter ||
        catalogItems.some(
          (item) =>
            item.type === type.type &&
            item.style?.toLowerCase().includes(styleFilter.toLowerCase()),
        )

      const matchesTypeFilter =
        !typeFilter || type.type?.toLowerCase().includes(typeFilter.toLowerCase())

      return matchesSearch && matchesStyleFilter && matchesTypeFilter
    })
  }, [types, searchTerm, styleFilter, typeFilter, catalogItems])

  // Group types by type name - memoized to prevent unnecessary re-renders
  const groupedTypes = useMemo(() => {
    return filteredTypes.reduce((acc, type) => {
      const typeName = type.type || 'Unnamed'
      if (!acc[typeName]) {
        acc[typeName] = []
      }
      acc[typeName].push(type)
      return acc
    }, {})
  }, [filteredTypes])

  // Handle type selection
  const handleTypeSelection = useCallback((typeId, checked) => {
    if (checked) {
      setSelectedItems((prev) => [...prev, typeId])
    } else {
      setSelectedItems((prev) => prev.filter((id) => id !== typeId))
    }
  }, [])

  // Handle select all types
  const handleSelectAll = useCallback(
    (checked) => {
      if (checked) {
        setSelectedItems(filteredTypes.map((type) => type.id))
      } else {
        setSelectedItems([])
      }
    },
    [filteredTypes],
  )

  // Fetch catalog items for modal
  const fetchModalCatalogItems = useCallback(
    async ({ reset = false } = {}) => {
      if (!manufacturer?.id) {
        return
      }

      const pageToLoad = reset ? 1 : modalPage
      // Fetch modal catalog items
      if (reset) {
        setModalCatalogLoading(true)
      } else {
        setModalLoadingMore(true)
      }
      try {
        const response = await axiosInstance.get(`/api/manufacturers/${manufacturer.id}/catalog`, {
          // Authorization handled by axios interceptors
          params: {
            page: pageToLoad,
            limit: modalLimit,
            search: modalSearchTerm || undefined,
            typeFilter: modalTypeFilter || undefined,
            excludeType: selectedType?.type || undefined,
            sortBy: 'code',
            sortOrder: 'ASC',
          },
        })
        // Modal catalog response received

        // Normalize and store response so the UI can access catalogData, filters, etc.
        const payload = response.data
        if (payload && Array.isArray(payload.catalogData)) {
          // Preferred shape from API: { success, catalogData: [...], pagination, filters, sorting }
          if (reset || !modalCatalogItems || !Array.isArray(modalCatalogItems.catalogData)) {
            setModalCatalogItems(payload)
          } else {
            // Append for pagination
            setModalCatalogItems((prev) => ({
              ...payload,
              catalogData: [...(prev?.catalogData || []), ...payload.catalogData],
            }))
          }
          // Update pagination helpers
          const pg = payload.pagination || {}
          setModalHasMore(pg.page < pg.totalPages)
          setModalPage(pg.page + 1)
        } else if (Array.isArray(payload)) {
          // Fallback: API returned raw array
          setModalCatalogItems(payload)
          setModalHasMore(false)
        } else if (payload && Array.isArray(payload.data)) {
          // Fallback: some endpoints use { data: [...] }
          setModalCatalogItems({ catalogData: payload.data })
          setModalHasMore(false)
        } else {
          // Unexpected catalog data format
          setModalCatalogItems([])
          setModalHasMore(false)
        }
      } catch (error) {
        console.error('Error fetching modal catalog items:', error)
        setModalCatalogItems([])
        setModalHasMore(false)
      } finally {
        if (reset) {
          setModalCatalogLoading(false)
        } else {
          setModalLoadingMore(false)
        }
      }
    },
    [
      manufacturer?.id,
      modalPage,
      modalLimit,
      modalSearchTerm,
      modalTypeFilter,
      selectedType?.type,
      modalCatalogItems,
    ],
  )

  // Handle edit type
  const handleEditType = useCallback(
    (type) => {
      setSelectedType(type)
      setEditModalVisible(true)
      setSelectedModalItems([])
      setModalSearchTerm('')
      setModalTypeFilter('')
      setModalPage(1)
      setModalHasMore(true)
      // Fetch catalog items for this manufacturer when modal opens
      setTimeout(() => {
        fetchModalCatalogItems({ reset: true })
      }, 100)
    },
    [fetchModalCatalogItems],
  )

  // Debounce search and type changes to refetch from server with reset
  useEffect(() => {
    if (!editModalVisible) return
    const h = setTimeout(() => {
      setModalPage(1)
      fetchModalCatalogItems({ reset: true })
    }, 300)
    return () => clearTimeout(h)
  }, [modalSearchTerm, modalTypeFilter, selectedType?.type, editModalVisible])

  // Load more handler
  const handleLoadMoreModal = useCallback(() => {
    if (modalCatalogLoading || modalLoadingMore || !modalHasMore) return
    fetchModalCatalogItems({ reset: false })
  }, [modalCatalogLoading, modalLoadingMore, modalHasMore, fetchModalCatalogItems])

  // Handle file change
  const handleFileChange = useCallback((e) => {
    const file = e.target.files[0]
    setSelectedFile(file)
  }, [])

  // Handle image upload
  const handleImageUpload = useCallback(async () => {
    if (!selectedType || !selectedFile || !manufacturer?.id) return

    setUploadingImage(true)

    try {
      const formData = new FormData()
      formData.append('typeImage', selectedFile)
      formData.append('type', selectedType.type)
      // Keep short description and also include the longDescription metadata
      formData.append('description', selectedType.description || '')
      formData.append(
        'longDescription',
        descDrafts[selectedType.type] ?? selectedType.longDescription ?? '',
      )
      formData.append('manufacturerId', manufacturer.id)
      formData.append('catalogId', selectedType.id)

      const response = await axiosInstance.post('/api/manufacturers/type/create', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          // Authorization handled by axios interceptors
        },
      })

      if (response.data.success) {
        await fetchTypes()
        setEditModalVisible(false)
        setSelectedType(null)
        setSelectedFile(null)
      } else {
        setError('Failed to upload image')
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      setError('Failed to upload image')
    } finally {
      setUploadingImage(false)
    }
  }, [selectedType, selectedFile, manufacturer?.id, fetchTypes])

  // Handle bulk edit
  const handleBulkEdit = useCallback(async () => {
    if (selectedItems.length === 0 || !manufacturer?.id) return

    setIsBulkEditing(true)

    try {
      const response = await axiosInstance.post(
        '/api/manufacturers/bulk-edit-types',
        {
          manufacturerId: manufacturer.id,
          itemIds: selectedItems,
          updates: bulkEditForm,
        },
        {
          // Authorization handled by axios interceptors
        },
      )

      if (response.data.success) {
        await fetchTypes()
        setBulkEditModalVisible(false)
        setSelectedItems([])
        setBulkEditForm({ type: '', description: '' })
      } else {
        setError('Failed to update types')
      }
    } catch (error) {
      console.error('Error updating types:', error)
      setError('Failed to update types')
    } finally {
      setIsBulkEditing(false)
    }
  }, [selectedItems, manufacturer?.id, bulkEditForm, fetchTypes])

  // Handle type rename
  const handleTypeRename = useCallback(async () => {
    if (!typeNameEditForm.oldTypeName || !typeNameEditForm.newTypeName || !manufacturer?.id) return

    setIsRenamingType(true)

    try {
      const response = await axiosInstance.post(
        '/api/manufacturers/edit-type-name',
        {
          manufacturerId: manufacturer.id,
          oldTypeName: typeNameEditForm.oldTypeName,
          newTypeName: typeNameEditForm.newTypeName,
        },
        {
          // Authorization handled by axios interceptors
        },
      )

      if (response.data.success) {
        await fetchTypes()
        setRenameModalVisible(false)
        setTypeNameEditForm({ oldTypeName: '', newTypeName: '' })
      } else {
        setError('Failed to rename type')
      }
    } catch (error) {
      console.error('Error renaming type:', error)
      setError('Failed to rename type')
    } finally {
      setIsRenamingType(false)
    }
  }, [typeNameEditForm.oldTypeName, typeNameEditForm.newTypeName, manufacturer?.id, fetchTypes])

  // Handle bulk type change
  const handleBulkTypeChange = useCallback(async () => {
    if (selectedItems.length === 0 || !manufacturer?.id || !newTypeCategory) return

    setIsChangingType(true)

    try {
      const response = await axiosInstance.post(
        '/api/manufacturers/bulk-change-type',
        {
          manufacturerId: manufacturer.id,
          itemIds: selectedItems,
          newType: newTypeCategory,
        },
        {
          // Authorization handled by axios interceptors
        },
      )

      if (response.data.success) {
        await fetchTypes()
        await fetchCatalogItems()
        setBulkTypeChangeModalVisible(false)
        setSelectedItems([])
        setNewTypeCategory('')
      } else {
        setError('Failed to change type category')
      }
    } catch (error) {
      console.error('Error changing type category:', error)
      setError('Failed to change type category')
    } finally {
      setIsChangingType(false)
    }
  }, [selectedItems, manufacturer?.id, newTypeCategory, fetchTypes, fetchCatalogItems])

  // Handle modal catalog item selection
  const handleModalItemSelection = useCallback((itemId, isSelected) => {
    setSelectedModalItems((prev) =>
      isSelected ? [...prev, itemId] : prev.filter((id) => id !== itemId),
    )
  }, [])

  // Handle select all modal items
  const handleSelectAllModalItems = useCallback((isSelected) => {
    if (isSelected) {
      setSelectedModalItems(filteredModalItems.map((item) => item.id))
    } else {
      setSelectedModalItems([])
    }
  }, [])

  // Assign selected catalog items to current type
  const handleAssignItemsToType = useCallback(async () => {
    if (!selectedType || selectedModalItems.length === 0 || !manufacturer?.id) return

    setModalCatalogLoading(true)
    try {
      const response = await axiosInstance.post(
        '/api/manufacturers/assign-items-to-type',
        {
          manufacturerId: manufacturer.id,
          itemIds: selectedModalItems,
          newType: selectedType.type,
        },
        {
          // Authorization handled by axios interceptors
        },
      )

      if (response.data.success) {
        await fetchTypes()
        await fetchCatalogItems()
        await fetchModalCatalogItems()
        setSelectedModalItems([])
        // Show in-app success confirmation (auto hides)
        setAssignSuccess({ count: selectedModalItems.length, type: selectedType.type })
        setTimeout(() => setAssignSuccess(null), 3000)
      } else {
        setError('Failed to assign items to type')
      }
    } catch (error) {
      console.error('Error assigning items to type:', error)
      setError('Failed to assign items to type')
    } finally {
      setModalCatalogLoading(false)
    }
  }, [
    selectedType,
    selectedModalItems,
    manufacturer?.id,
    fetchTypes,
    fetchCatalogItems,
    fetchModalCatalogItems,
  ])

  // Filter modal catalog items
  const filteredModalItems = useMemo(() => {
    // Compute filtered modal items

    // Extract the actual catalog data from the API response (supports multiple shapes)
    const catalogData =
      modalCatalogItems && Array.isArray(modalCatalogItems.catalogData)
        ? modalCatalogItems.catalogData
        : Array.isArray(modalCatalogItems)
          ? modalCatalogItems
          : []

    if (!Array.isArray(catalogData)) {
      // catalogData not in expected array format
      return []
    }

    // Gate: don't show anything until the user searches or selects a type
    if (!modalSearchTerm && !modalTypeFilter) {
      return []
    }

    const filtered = catalogData.filter((item) => {
      // Exclude items that already belong to the current type
      const doesNotHaveCurrentType = item.type !== selectedType?.type

      const matchesSearch =
        !modalSearchTerm ||
        item.description?.toLowerCase().includes(modalSearchTerm.toLowerCase()) ||
        item.code?.toLowerCase().includes(modalSearchTerm.toLowerCase()) ||
        item.style?.toLowerCase().includes(modalSearchTerm.toLowerCase())

      const matchesTypeFilter = !modalTypeFilter || item.type === modalTypeFilter

      return doesNotHaveCurrentType && matchesSearch && matchesTypeFilter
    })

    return filtered
  }, [modalCatalogItems, modalSearchTerm, modalTypeFilter, selectedType])

  // Fix the dependency array for handleSelectAllModalItems
  const handleSelectAllModalItemsFixed = useCallback(
    (isSelected) => {
      if (isSelected) {
        setSelectedModalItems(filteredModalItems.map((item) => item.id))
      } else {
        setSelectedModalItems([])
      }
    },
    [filteredModalItems],
  )

  // Get unique styles and types for filter dropdowns
  const uniqueStyles = useMemo(() => {
    const styles = [...new Set(catalogItems.map((item) => item.style).filter(Boolean))]
    return styles.sort()
  }, [catalogItems])

  const uniqueTypes = useMemo(() => {
    const types = [...new Set(catalogItems.map((item) => item.type).filter(Boolean))]
    return types.sort()
  }, [catalogItems])

  // New state and handler for type description drafts
  const [savingDescId, setSavingDescId] = useState(null)
  const [descDrafts, setDescDrafts] = useState({}) // { [typeName]: string }

  const saveTypeDescription = useCallback(
    async (typeName) => {
      if (!manufacturer?.id) return
      const newDesc = descDrafts[typeName] ?? ''
      setSavingDescId(typeName)
      try {
        const res = await axiosInstance.post('/api/manufacturers/type/update-meta', {
          manufacturerId: manufacturer.id,
          type: typeName,
          longDescription: newDesc,
        })
        if (res.data?.success) {
          await fetchTypes()
        }
      } catch (e) {
        console.error('Failed to save type description', e)
        setError(t('types.meta.saveFailed', 'Failed to save description'))
      } finally {
        setSavingDescId(null)
      }
    },
    [manufacturer?.id, descDrafts, fetchTypes, t],
  )

  if (!manufacturer) {
    return (
      <Box minH="400px" display="flex" alignItems="center" justifyContent="center">
        <Alert status="warning">
          <Text>{t('common.pleaseSelectManufacturer')}</Text>
        </Alert>
      </Box>
    )
  }

  if (loading) {
    return (
      <Box minH="400px" display="flex" alignItems="center" justifyContent="center">
        <VStack spacing={3}>
          <Spinner color="brand.500" size="lg" />
          <Text>{t('types.loading', 'Loading types...')}</Text>
        </VStack>
      </Box>
    )
  }

  return (
    <Box>
      <Card>
        <CardHeader bg="gray.50" borderBottom="1px" borderColor="gray.200">
          <Flex justify="space-between" align="center" wrap="wrap" gap={3}>
            <Text fontSize="xl" fontWeight="bold" color="brand.600">
              {t('types.ui.header', 'Type Pictures & Management')}
            </Text>
            <HStack spacing={2} wrap="wrap">
              <Button
                colorScheme="green"
                leftIcon={<Plus size={16} />}
                onClick={() => {
                  setCreateForm({ typeName: '', longDescription: '', imageFile: null })
                  setCreateError(null)
                  setCreateModalVisible(true)
                }}
                size="md"
              >
                {t('types.ui.createType', 'Create Type')}
              </Button>
              <Button
                colorScheme="blue"
                variant="outline"
                onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}
                size="md"
              >
                {viewMode === 'grid'
                  ? t('types.ui.tableView', 'Table View')
                  : t('types.ui.gridView', 'Grid View')}
              </Button>

              {selectedItems.length > 0 && (
                <Menu>
                  <MenuButton as={Button} rightIcon={<ChevronDown size={16} />} colorScheme="gray" size="md">
                    {t('types.ui.actions', 'Actions')} ({selectedItems.length})
                  </MenuButton>
                  <MenuList>
                    <MenuItem onClick={() => setBulkEditModalVisible(true)}>
                      Bulk Edit
                    </MenuItem>
                    <MenuItem
                      onClick={() => {
                        const firstType = types.find((t) => selectedItems.includes(t.id))
                        if (firstType) {
                          setTypeNameEditForm({
                            oldTypeName: firstType.type,
                            newTypeName: '',
                          })
                          setRenameModalVisible(true)
                        }
                      }}
                    >
                      Rename Type Globally
                    </MenuItem>
                  </MenuList>
                </Menu>
              )}
            </HStack>
          </Flex>
        </CardHeader>
        <CardBody p={6}>
          {/* Search Bar */}
          <Box mb={6}>
            <FormLabel fontWeight="semibold" color="gray.700" mb={2}>
              {t('types.ui.searchLabel', 'Search Types')}
            </FormLabel>
            <InputGroup size="lg">
              <InputLeftElement pointerEvents="none">
                <Search color="gray.400" size={20} />
              </InputLeftElement>
              <Input
                placeholder={t('types.ui.searchPlaceholder', 'Search types...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>
          </Box>

          {/* Filter Controls */}
          <Box mb={6} p={4} bg="gray.50" borderRadius="md">
            <Flex gap={3} wrap="wrap">
              <Box flex="1" minW="200px">
                <FormLabel fontWeight="semibold" color="brand.600">
                  {t('types.ui.filterByStyle', 'Filter by Style')}
                </FormLabel>
                <Input
                  placeholder="Filter by style..."
                  value={styleFilter}
                  onChange={(e) => setStyleFilter(e.target.value)}
                  list="stylesList"
                  borderColor="brand.300"
                />
                <datalist id="stylesList">
                  {uniqueStyles.map((style) => (
                    <option key={style} value={style} />
                  ))}
                </datalist>
              </Box>
              <Box flex="1" minW="200px">
                <FormLabel fontWeight="semibold" color="brand.600">
                  {t('types.ui.filterByType', 'Filter by Type')}
                </FormLabel>
                <Input
                  placeholder="Filter by type..."
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  list="typesList"
                  borderColor="brand.300"
                />
                <datalist id="typesList">
                  {uniqueTypes.map((type) => (
                    <option key={type} value={type} />
                  ))}
                </datalist>
              </Box>
              <Box display="flex" alignItems="end">
                <Button
                  variant="outline"
                  colorScheme="brand"
                  onClick={() => {
                    setStyleFilter('')
                    setTypeFilter('')
                    setSearchTerm('')
                  }}
                  fontWeight="semibold"
                >
                  {t('types.ui.clearFilters', 'Clear Filters')}
                </Button>
              </Box>
            </Flex>
          </Box>

          {/* Bulk Actions */}
          {selectedItems.length > 0 && (
            <Box mb={4}>
              <Alert status="info" borderRadius="md">
                <VStack align="start" spacing={3} w="full">
                  <Text>{selectedItems.length} item(s) selected</Text>
                  <HStack spacing={3} wrap="wrap">
                    <Button
                      colorScheme="blue"
                      onClick={() => setBulkTypeChangeModalVisible(true)}
                      size="sm"
                    >
                      Change Type Category
                    </Button>
                    <Button
                      colorScheme="orange"
                      onClick={() => setBulkEditModalVisible(true)}
                      size="sm"
                    >
                      Bulk Edit
                    </Button>
                    <Button colorScheme="gray" onClick={() => setSelectedItems([])} size="sm">
                      Clear Selection
                    </Button>
                  </HStack>
                </VStack>
              </Alert>
            </Box>
          )}

          {error && (
            <Alert status="error" dismissible onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {viewMode === 'grid' ? (
            // Grid View
            <>
              <Box mb={4} p={3} bg="brand.50" borderRadius="md" border="1px" borderColor="brand.200">
                <Checkbox
                  isChecked={
                    selectedItems.length === filteredTypes.length && filteredTypes.length > 0
                  }
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  fontWeight="semibold"
                  color="brand.600"
                  fontSize="lg"
                >
                  Select All ({filteredTypes.length} types)
                </Checkbox>
              </Box>

              {Object.keys(groupedTypes).length === 0 ? (
                <VStack spacing={4} py={10} textAlign="center">
                  <Box fontSize="6xl" color="gray.400">
                    📷
                  </Box>
                  <Text fontSize="xl" color="gray.500" fontWeight="medium">
                    {t('types.ui.noTypesFound', 'No types found')}
                  </Text>
                  <Text color="gray.500">
                    {searchTerm
                      ? t('types.ui.tryAdjust', 'Try adjusting your search criteria')
                      : t('types.ui.typesWillAppear', 'Types will appear here when available')}
                  </Text>
                </VStack>
              ) : (
                <Stack spacing={6}>
                  {Object.entries(groupedTypes).map(([typeName, typeItems]) => (
                    <Box key={typeName}>
                      <Text fontWeight="semibold" color="brand.600" mb={2}>
                        {typeName}
                      </Text>
                      <SimpleGrid columns={{ base: 2, md: 3, lg: 4 }} spacing={3}>
                        {typeItems.map((type) => {
                          const isSelected = selectedItems.includes(type.id)
                          return (
                            <Box
                              key={type.id}
                              bg="gray.50"
                              borderRadius="md"
                              borderWidth="1px"
                              borderColor={isSelected ? 'brand.200' : 'gray.200'}
                              overflow="hidden"
                              onMouseEnter={() => setHoveredId(type.id)}
                              onMouseLeave={() => setHoveredId(null)}
                            >
                              <Box position="relative" p={3} display="flex" justifyContent="center" minH="170px">
                                <Image
                                  src={getImageSrc(type)}
                                  alt={type.type}
                                  onError={handleImageError}
                                  maxH="130px"
                                  objectFit="contain"
                                  bg="white"
                                  borderRadius="md"
                                  w="full"
                                />
                                {!isContractor && (
                                  <Flex
                                    position="absolute"
                                    inset={0}
                                    align="center"
                                    justify="center"
                                    bg="rgba(0, 0, 0, 0.6)"
                                    opacity={hoveredId === type.id ? 1 : 0}
                                    transition="opacity 0.3s ease"
                                    gap={2}
                                  >
                                    <Button
                                      size="sm"
                                      colorScheme="brand"
                                      onClick={(event) => {
                                        event.stopPropagation()
                                        handleEditType(type)
                                      }}
                                    >
                                      <Pencil size={16} aria-hidden="true" mr={1} />{' '}
                                      {t('types.meta.editType', 'Edit Type')}
                                    </Button>
                                    <Button
                                      size="sm"
                                      colorScheme="red"
                                      onClick={(event) => {
                                        event.stopPropagation()
                                        setDeleteTypeAsk({ open: true, typeName: type.type })
                                        setReassignTypeTo('')
                                      }}
                                    >
                                      <Trash size={16} aria-hidden="true" />
                                    </Button>
                                  </Flex>
                                )}
                              </Box>
                              <Stack spacing={2} px={3} pb={3}>
                                <Text fontSize="sm" color="gray.600" minH="2.5em">
                                  {type.longDescription ||
                                    t(
                                      'types.meta.descriptionPlaceholder',
                                      'Add a description for this type',
                                    )}
                                </Text>
                                <Flex justify="flex-end">
                                  <Checkbox
                                    id={`type-${type.id}`}
                                    isChecked={selectedItems.includes(type.id)}
                                    onChange={(event) => handleTypeSelection(type.id, event.target.checked)}
                                  />
                                </Flex>
                              </Stack>
                            </Box>
                          )
                        })}
                      </SimpleGrid>
                    </Box>
                  ))}
                </Stack>
              )}
            </>
          ) : (
            // Table View
            <Table hover responsive>
              <Thead>
                <Tr>
                  <Th>
                    <Checkbox
                      id="selectAllTable"
                      checked={
                        selectedItems.length === filteredTypes.length && filteredTypes.length > 0
                      }
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </Th>
                  <Th>{t('settings.manufacturers.types.table.image')}</Th>
                  <Th>{t('settings.manufacturers.types.table.type')}</Th>
                  <Th>{t('settings.manufacturers.types.table.description')}</Th>
                  <Th>{t('settings.manufacturers.types.table.actions')}</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredTypes.map((type) => (
                  <Tr key={type.id}>
                    <Td>
                      <Checkbox
                        id={`table-type-${type.id}`}
                        checked={selectedItems.includes(type.id)}
                        onChange={(e) => handleTypeSelection(type.id, e.target.checked)}
                      />
                    </Td>
                    <Td>
                      <img
                        src={getImageSrc(type)}
                        alt={type.type}
                        style={{
                          width: '40px',
                          height: '40px',
                          objectFit: 'contain',
                          backgroundColor: '#f8f9fa',
                          borderRadius: '4px',
                        }}
                        onError={handleImageError}
                      />
                    </Td>
                    <Td>
                      <Badge colorScheme="gray">{type.type}</Badge>
                    </Td>
                    <Td>{type.description || 'No description'}</Td>
                    <Td>
                      <Button
                        colorScheme="blue"
                        aria-label={t('types.meta.editType', 'Edit Type')}
                        onClick={() => handleEditType(type)}
                        style={{ minHeight: '44px', minWidth: '44px' }}
                      >
                        <Pencil size={18} aria-hidden="true" />
                      </Button>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* Image Edit Modal */}
      <style>{`
        .no-gradient-modal .modal-header {
          background: #fff !important;
          border-bottom: 1px solid #dee2e6 !important;
          color: #212529 !important;
        }
        .no-gradient-modal .modal-title {
          color: #212529 !important;
        }
      `}</style>
      <Modal
        isOpen={editModalVisible}
        onClose={() => {
          setEditModalVisible(false)
          setSelectedType(null)
          setSelectedFile(null)
        }}
        size="xl"
        className="no-gradient-modal"
      >
        <ModalOverlay />
        <ModalContent>
        <PageHeader title="Edit Type" />
        <ModalBody>
          {selectedType && (
            <Flex>
              {/* Left Column - Image Management */}
              <Box md={6}>
                <div>
                  <strong>{t('types.meta.type', 'Type')}:</strong> {selectedType.type}
                </div>

                {/* Current Image Preview */}
                <div>
                  <h6>{t('types.meta.currentImage', 'Current Image')}:</h6>
                  <div
                    className="d-flex justify-content-center p-3 border rounded"
                    style={{ backgroundColor: '#f8f9fa' }}
                  >
                    <img
                      src={getImageSrc(selectedType)}
                      alt={selectedType.type}
                      style={{
                        maxWidth: '200px',
                        maxHeight: '200px',
                        objectFit: 'contain',
                        border: '1px solid #dee2e6',
                        borderRadius: '4px',
                      }}
                      onError={handleImageError}
                    />
                  </div>
                </div>

                {/* File Upload */}
                <Box mb={4}>
                  <FormLabel htmlFor="imageUpload">
                    {t('types.meta.uploadNewImage', 'Upload New Image')}:
                  </FormLabel>
                  <Input
                    type="file"
                    id="imageUpload"
                    accept="image/*"
                    onChange={handleFileChange}
                    p={1}
                  />
                  <Text mt={2} color="gray.600" fontSize="sm">
                    {selectedFile ? (
                      <>{t('types.ui.selected', 'Selected')}: {selectedFile.name}</>
                    ) : selectedType.image ? (
                      <>Current: {selectedType.image}</>
                    ) : (
                      <>{t('types.ui.noImage', 'No image uploaded')}</>
                    )}
                  </Text>
                </Box>

                {/* Preview of new image */}
                {selectedFile && (
                  <Box mb={4}>
                    <Text fontWeight="semibold" mb={2}>{t('types.meta.newImagePreview', 'New Image Preview')}:</Text>
                    <Flex
                      justify="center"
                      p={3}
                      border="1px"
                      borderColor="gray.200"
                      borderRadius="md"
                      bg="gray.50"
                    >
                      <img
                        src={URL.createObjectURL(selectedFile)}
                        alt="Preview"
                        style={{
                          maxWidth: '200px',
                          maxHeight: '200px',
                          objectFit: 'contain',
                          border: '1px solid #dee2e6',
                          borderRadius: '4px',
                        }}
                      />
                    </Flex>
                  </Box>
                )}

                {/* Type description editor inside modal (optional) */}
                <Box mt={4}>
                  <FormLabel>{t('types.meta.descriptionLabel', 'Type Description')}</FormLabel>
                  <Textarea
                    rows={3}
                    placeholder={t(
                      'types.meta.descriptionPlaceholder',
                      'Add a description for this type',
                    )}
                    value={descDrafts[selectedType.type] ?? selectedType.longDescription ?? ''}
                    onChange={(e) =>
                      setDescDrafts((prev) => ({ ...prev, [selectedType.type]: e.target.value }))
                    }
                  />
                  <HStack mt={2}>
                    <Button
                      colorScheme="blue"
                      isDisabled={savingDescId === selectedType.type}
                      onClick={() => saveTypeDescription(selectedType.type)}
                      isLoading={savingDescId === selectedType.type}
                      loadingText={t('common.saving', 'Saving...')}
                    >
                      {t('common.save', 'Save')}
                    </Button>
                  </HStack>
                </Box>
              </Box>

              {/* Right Column - Catalog Items Assignment */}
              <Box w={{ base: 'full', md: '50%' }} pl={{ md: 4 }}>
                <Box mb={4}>
                  <Text fontWeight="bold" color="brand.600" fontSize="lg" mb={2}>
                    {t('types.assign.header', 'Assign Catalog Items to This Type')}
                  </Text>
                  <Text color="gray.600" fontSize="sm" mb={4}>
                    {t(
                      'types.assign.help',
                      'Select catalog items from this manufacturer to assign them to the "{{type}}" type.',
                      { type: selectedType.type },
                    )}
                  </Text>

                  {/* Search and Filter */}
                  <InputGroup mb={3}>
                    <InputLeftElement pointerEvents="none">
                      <Search color="gray.400" size={16} />
                    </InputLeftElement>
                    <Input
                      placeholder={t('common.searchItems', 'Search items...')}
                      value={modalSearchTerm}
                      onChange={(e) => setModalSearchTerm(e.target.value)}
                    />
                  </InputGroup>

                  <Input
                    placeholder={t('types.assign.filterByCurrentType', 'Filter by current type...')}
                    value={modalTypeFilter}
                    onChange={(e) => setModalTypeFilter(e.target.value)}
                    mb={3}
                  />

                  {/* Type badges sourced from API filters (complete set) */}
                  {modalCatalogItems?.filters?.uniqueTypes?.length && (
                    <Box mb={3}>
                      <Text fontSize="sm" color="gray.600" mb={2}>
                        {t('types.assign.filterByType', 'Filter by type:')}
                      </Text>
                      <Flex wrap="wrap" gap={1}>
                        {modalCatalogItems.filters.uniqueTypes
                          .filter((tn) => tn && tn !== selectedType?.type)
                          .slice(0, 40)
                          .map((type, index) => (
                            <Badge
                              key={index}
                              colorScheme="gray"
                              cursor="pointer"
                              onClick={() => setModalTypeFilter(type)}
                              _hover={{ bg: 'gray.200' }}
                            >
                              {type}
                            </Badge>
                          ))}
                      </Flex>
                    </Box>
                  )}

                  {/* Select All */}
                  <Box mb={3} p={2} bg="gray.50" borderRadius="md">
                    <Checkbox
                      isChecked={
                        selectedModalItems.length === filteredModalItems.length &&
                        filteredModalItems.length > 0
                      }
                      onChange={(e) => handleSelectAllModalItemsFixed(e.target.checked)}
                      fontWeight="semibold"
                    >
                      {t('common.selectAll', 'Select All')} ({filteredModalItems.length} {t('common.items', 'items')})
                    </Checkbox>
                  </Box>

                  {/* Catalog Items List */}
                  <Box maxH="400px" overflowY="auto">
                    {modalCatalogLoading ? (
                      <VStack py={4}>
                        <Spinner size="sm" />
                        <Text>{t('types.assign.loading', 'Loading catalog items...')}</Text>
                      </VStack>
                    ) : !modalSearchTerm && !modalTypeFilter ? (
                      <VStack py={4}>
                        <Text color="gray.500" textAlign="center">
                          {t(
                            'types.assign.startHint',
                            'Search or filter to see available items'
                          )}
                        </Text>
                      </VStack>
                    ) : filteredModalItems.length === 0 ? (
                      <VStack py={4}>
                        <Text color="gray.500" textAlign="center">
                          {modalCatalogItems?.catalogData?.length > 0
                            ? modalSearchTerm || modalTypeFilter
                              ? t('types.assign.noMatch', 'No items match your search criteria')
                              : t(
                                  'types.assign.noneAvailable',
                                  'No items available to assign (all items already belong to "{{type}}" or other types)',
                                  { type: selectedType?.type },
                                )
                            : t(
                                'types.assign.noCatalog',
                                'No catalog items found for this manufacturer',
                              )}
                        </Text>
                      </VStack>
                    ) : (
                      <>
                        {filteredModalItems.map((item) => (
                          <Box
                            key={item.id}
                            border="1px"
                            borderColor="gray.200"
                            borderRadius="md"
                            p={3}
                            mb={2}
                            bg="white"
                            cursor="pointer"
                            _hover={{ bg: 'gray.50' }}
                            onClick={() =>
                              handleModalItemSelection(
                                item.id,
                                !selectedModalItems.includes(item.id),
                              )
                            }
                          >
                            <Checkbox
                              isChecked={selectedModalItems.includes(item.id)}
                              onChange={(e) => handleModalItemSelection(item.id, e.target.checked)}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <VStack align="start" spacing={1}>
                                <Text fontWeight="semibold">{item.description}</Text>
                                <Text fontSize="sm" color="gray.600">
                                  {t('types.assign.currentType', 'Current Type')}: {item.type || t('common.none', 'None')} | {t('common.style', 'Style')}: {item.style || t('common.none', 'None')}
                                </Text>
                              </VStack>
                            </Checkbox>
                          </Box>
                        ))}
                        {modalHasMore && (modalSearchTerm || modalTypeFilter) && (
                          <Box textAlign="center" py={2}>
                            <Button
                              variant="outline"
                              isDisabled={modalLoadingMore}
                              onClick={handleLoadMoreModal}
                              isLoading={modalLoadingMore}
                              loadingText={t('common.loading', 'Loading…')}
                            >
                              {t('common.loadMore', 'Load more')}
                            </Button>
                          </Box>
                        )}
                      </>
                    )}
                  </Box>

                  {/* Assignment Button */}
                  {selectedModalItems.length > 0 && (
                    <Box mt={4}>
                      <Button
                        colorScheme="green"
                        onClick={handleAssignItemsToType}
                        isDisabled={modalCatalogLoading}
                        w="full"
                        size="lg"
                      >
                        {t('types.assign.assignCTA', 'Assign {{count}} item(s) to "{{type}}"', {
                          count: selectedModalItems.length,
                          type: selectedType.type,
                        })}
                      </Button>
                    </Box>
                  )}
                </Box>
              </Box>
            </Flex>
          )}
        </ModalBody>
        {assignSuccess && (
          <Box px={6} pb={4}>
            <Alert status="success" borderRadius="md">
              <Text>
                {t(
                  'types.assign.assignedSuccess',
                  'Successfully assigned {{count}} items to {{type}}',
                  { count: assignSuccess.count, type: assignSuccess.type },
                )}
              </Text>
            </Alert>
          </Box>
        )}
        <ModalFooter>
          <Button
            variant="ghost"
            mr={3}
            onClick={() => {
              setEditModalVisible(false)
              setSelectedType(null)
              setSelectedFile(null)
              setSelectedModalItems([])
              setModalSearchTerm('')
              setModalTypeFilter('')
            }}
          >
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleImageUpload}
            isDisabled={!selectedFile || uploadingImage}
            isLoading={uploadingImage}
            loadingText={t('common.uploading', 'Uploading...')}
          >
            {t('types.assign.uploadImage', 'Upload Image')}
          </Button>
        </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Type Confirm */}
      <Modal
        isOpen={deleteTypeAsk.open}
        onClose={() => setDeleteTypeAsk({ open: false, typeName: '' })}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{t('types.delete.header', 'Delete Type')}</ModalHeader>
          <ModalBody>
            <Text mb={4}>
              {t('types.delete.confirm', 'Delete type')} <Text as="strong">{deleteTypeAsk.typeName}</Text>?
            </Text>
            <FormLabel>
              {t('types.delete.reassign', 'Reassign items to (leave empty to clear)')}
            </FormLabel>
            <Input
              value={reassignTypeTo}
              onChange={(e) => setReassignTypeTo(e.target.value)}
              placeholder={t('types.delete.reassignPh', 'New type name or blank')}
            />
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              mr={3}
              onClick={() => setDeleteTypeAsk({ open: false, typeName: '' })}
            >
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              colorScheme="red"
              onClick={async () => {
                try {
                  await axiosInstance.delete(
                    `/api/manufacturers/${manufacturer.id}/type/${encodeURIComponent(deleteTypeAsk.typeName)}`,
                    { data: { reassignTo: reassignTypeTo } },
                  )
                  await fetchTypes()
                  await fetchCatalogItems()
                } catch (e) {
                  console.error(e)
                } finally {
                  setDeleteTypeAsk({ open: false, typeName: '' })
                  setReassignTypeTo('')
                }
              }}
            >
              {t('common.delete', 'Delete')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Create Type Modal */}
      <Modal
        isOpen={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{t('types.create.header', 'Create New Type')}</ModalHeader>
          <ModalBody>
            {createError && (
              <Alert status="error" mb={4} borderRadius="md">
                <Text>{createError}</Text>
              </Alert>
            )}
            <VStack spacing={4} align="stretch">
              <Box>
                <FormLabel>{t('types.create.typeName', 'Type Name')}</FormLabel>
                <Input
                  value={createForm.typeName}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, typeName: e.target.value }))}
                  placeholder={t('types.create.typeNamePh', 'e.g., Base Drawer Cabinet')}
                />
              </Box>
              <Box>
                <FormLabel>{t('types.create.description', 'Description')}</FormLabel>
                <Textarea
                  rows={3}
                  value={createForm.longDescription}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, longDescription: e.target.value }))
                  }
                  placeholder={t(
                    'types.meta.descriptionPlaceholder',
                    'Add a description for this type',
                  )}
                />
              </Box>
              <Box>
                <FormLabel>{t('types.create.image', 'Image (optional)')}</FormLabel>
                <Input
                  type="file"
                  accept="image/*"
                  p={1}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, imageFile: e.target.files?.[0] || null }))
                  }
                />
                {createForm.imageFile && (
                  <Text fontSize="sm" color="gray.600" mt={1}>
                    {t('types.ui.selected', 'Selected')}: {createForm.imageFile.name}
                  </Text>
                )}
              </Box>
              <Alert status="info" borderRadius="md">
                <Text fontSize="sm">
                  {t(
                    'types.create.note',
                    'Note: If this manufacturer has no catalog items yet, you will need to upload a catalog before creating type metadata.',
                  )}
                </Text>
              </Alert>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              mr={3}
              onClick={() => setCreateModalVisible(false)}
              isDisabled={creatingType}
            >
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              colorScheme="blue"
              isDisabled={creatingType || !createForm.typeName.trim()}
              isLoading={creatingType}
              loadingText={t('common.saving', 'Saving...')}
              onClick={async () => {
                if (!manufacturer?.id) return
                setCreatingType(true)
                setCreateError(null)
                try {
                  // 1) Create/update metadata
                  const metaRes = await axiosInstance.post('/api/manufacturers/type/update-meta', {
                    manufacturerId: manufacturer.id,
                    type: createForm.typeName.trim(),
                    longDescription: createForm.longDescription || '',
                  })

                  if (!metaRes.data?.success) {
                    throw new Error(metaRes.data?.message || 'Failed to save type metadata')
                  }

                  // 2) Optional image upload
                  if (createForm.imageFile) {
                    const fd = new FormData()
                    fd.append('typeImage', createForm.imageFile)
                    fd.append('type', createForm.typeName.trim())
                    fd.append('manufacturerId', manufacturer.id)
                    fd.append('longDescription', createForm.longDescription || '')
                    await axiosInstance.post('/api/manufacturers/type/create', fd, {
                      headers: { 'Content-Type': 'multipart/form-data' },
                    })
                  }

                  // Refresh and close
                  await fetchTypes()
                  setCreateModalVisible(false)
                } catch (err) {
                  console.error('Create type failed:', err)
                  const msg = err?.response?.data?.message || err?.message || 'Failed to create type'
                  setCreateError(msg)
                } finally {
                  setCreatingType(false)
                }
              }}
            >
              {t('types.create.createCta', 'Create Type')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Bulk Edit Modal */}
      <Modal
        isOpen={bulkEditModalVisible}
        onClose={() => setBulkEditModalVisible(false)}
        size="lg"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Bulk Edit {selectedItems.length} Types</ModalHeader>
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Text>
                Edit the following fields for the selected {selectedItems.length} types. Leave fields
                empty to keep existing values.
              </Text>

              <Flex gap={4} wrap="wrap">
                <Box flex="1" minW="200px">
                  <FormLabel>{t('common.type', 'Type')}</FormLabel>
                  <Input
                    value={bulkEditForm.type}
                    onChange={(e) => setBulkEditForm({ ...bulkEditForm, type: e.target.value })}
                    placeholder="Leave empty to keep existing"
                  />
                </Box>
              </Flex>

              <Box>
                <FormLabel>{t('common.description', 'Description')}</FormLabel>
                <Textarea
                  value={bulkEditForm.description}
                  onChange={(e) =>
                    setBulkEditForm({ ...bulkEditForm, description: e.target.value })
                  }
                  placeholder="Leave empty to keep existing"
                  rows={3}
                />
              </Box>

              <Alert status="info" borderRadius="md">
                <Text fontSize="sm">
                  <Text as="strong">Note:</Text> Empty fields will preserve the existing values for each item.
                </Text>
              </Alert>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              mr={3}
              onClick={() => setBulkEditModalVisible(false)}
              isDisabled={isBulkEditing}
            >
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleBulkEdit}
              isDisabled={isBulkEditing}
              isLoading={isBulkEditing}
              loadingText={`Updating ${selectedItems.length} Types...`}
            >
              Update {selectedItems.length} Types
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Type Rename Modal */}
      <Modal
        isOpen={renameModalVisible}
        onClose={() => setRenameModalVisible(false)}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Rename Type Globally</ModalHeader>
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Text>
                Rename the type for all items of this manufacturer. This will affect all catalog items
                currently using this type.
              </Text>

              <Box>
                <FormLabel>{t('settings.manufacturers.types.form.currentName', 'Current Name')}</FormLabel>
                <Input
                  value={typeNameEditForm.oldTypeName}
                  isDisabled
                  bg="gray.50"
                />
              </Box>

              <Box>
                <FormLabel>{t('settings.manufacturers.types.form.newName', 'New Name')}</FormLabel>
                <Input
                  value={typeNameEditForm.newTypeName}
                  onChange={(e) =>
                    setTypeNameEditForm({ ...typeNameEditForm, newTypeName: e.target.value })
                  }
                  placeholder="Enter new type name"
                />
              </Box>

              <Alert status="warning" borderRadius="md">
                <Text fontSize="sm">
                  <Text as="strong">Warning:</Text> This will rename the type across the entire manufacturer's catalog.
                </Text>
              </Alert>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              mr={3}
              onClick={() => setRenameModalVisible(false)}
              isDisabled={isRenamingType}
            >
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleTypeRename}
              isDisabled={isRenamingType || !typeNameEditForm.newTypeName.trim()}
              isLoading={isRenamingType}
              loadingText="Renaming..."
            >
              Rename Type
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Bulk Type Change Modal */}
      <Modal
        isOpen={bulkTypeChangeModalVisible}
        onClose={() => {
          setBulkTypeChangeModalVisible(false)
          setNewTypeCategory('')
        }}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Change Type Category</ModalHeader>
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Text>
                {t('settings.manufacturers.types.changeCategory',
                  'Change the type category for {{count}} selected items',
                  { count: selectedItems.length }
                )}
              </Text>

              <Box>
                <FormLabel>{t('settings.manufacturers.types.form.category', 'Category')}</FormLabel>
                <Input
                  placeholder="Enter new type category..."
                  value={newTypeCategory}
                  onChange={(e) => setNewTypeCategory(e.target.value)}
                  list="existingTypesList"
                />
                <datalist id="existingTypesList">
                  {uniqueTypes.map((type) => (
                    <option key={type} value={type} />
                  ))}
                </datalist>
                <Text fontSize="sm" color="gray.600" mt={2}>
                  You can enter a new type category or select from existing ones.
                </Text>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              mr={3}
              onClick={() => {
                setBulkTypeChangeModalVisible(false)
                setNewTypeCategory('')
              }}
              isDisabled={isChangingType}
            >
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleBulkTypeChange}
              isDisabled={isChangingType || !newTypeCategory.trim()}
              isLoading={isChangingType}
              loadingText="Changing..."
            >
              Change Type Category
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  )
}

export default TypesTab

