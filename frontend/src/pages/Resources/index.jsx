import StandardCard from '../../components/StandardCard'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import axiosInstance from '../../helpers/axiosInstance'
import { getFreshestToken } from '../../utils/authToken'
import { getContrastColor } from '../../utils/colorUtils'
import { Alert, AspectRatio, Badge, Box, Button, CardBody, CardHeader, Center, Container, Divider, Flex, FormControl, FormLabel, Grid, GridItem, HStack, Heading, Icon, Image, Input, InputGroup, InputLeftElement, Link, List, ListItem, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Select, SimpleGrid, Spinner, Stack, Switch, Tab, TabList, TabPanel, TabPanels, Tabs, Text, Textarea, VStack, useColorModeValue, useToast } from '@chakra-ui/react'
import {
  ArrowLeft,
  Download,
  FileText,
  List as ListIcon,
  Edit,
  Search,
  Plus,
  Trash,
  Code,
  Mail,
  File,
  Settings,
  User,
  Folder,
  Link as LinkIcon,
  Video,
  Heart,
  Home,
  Info,
  Laptop,
  Lightbulb,
  Map as MapIcon,
  Phone,
  Star,
  Tag,
  Camera,
  Building,
  Briefcase,
  Book,
  Bookmark,
  Globe,
  Wallet,
  Shield,
  Upload,
  Eye,
  Pin
} from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import withContractorScope from '../../components/withContractorScope'
import FileViewerModal from '../../components/FileViewerModal'
import { ICON_SIZE_MD, ICON_BOX_MD } from '../../constants/iconSizes'

const LINK_TYPE_OPTIONS = [
  { value: 'external', icon: LinkIcon, color: 'blue', key: 'resources.linkType.external' },
  { value: 'internal', icon: Folder, color: 'green', key: 'resources.linkType.internal' },
  { value: 'document', icon: FileText, color: 'cyan', key: 'resources.linkType.document' },
  { value: 'video', icon: Video, color: 'purple', key: 'resources.linkType.video' },
  { value: 'help', icon: ListIcon, color: 'orange', key: 'resources.linkType.help' },
]

const FILE_TYPE_META = {
  pdf: { color: 'red', icon: FileText, key: 'resources.fileType.pdf' },
  spreadsheet: { color: 'green', icon: FileText, key: 'resources.fileType.spreadsheet' },
  document: { color: 'blue', icon: FileText, key: 'resources.fileType.document' },
  video: { color: 'purple', icon: Video, key: 'resources.fileType.video' },
  audio: { color: 'gray', icon: Video, key: 'resources.fileType.audio' },
  image: { color: 'cyan', icon: FileText, key: 'resources.fileType.image' },
  archive: { color: 'gray', icon: FileText, key: 'resources.fileType.archive' },
  other: { color: 'gray', icon: FileText, key: 'resources.fileType.other' },
}

const GROUP_VISIBILITY_OPTIONS = ['admin', 'contractor']

const ICON_OPTIONS = [
  { value: 'Folder', icon: Folder, label: 'Folder' },
  { value: 'Book', icon: Book, label: 'Book' },
  { value: 'Bookmark', icon: Bookmark, label: 'Bookmark' },
  { value: 'Briefcase', icon: Briefcase, label: 'Briefcase' },
  { value: 'Building', icon: Building, label: 'Building' },
  { value: 'Camera', icon: Camera, label: 'Camera' },
  { value: 'Code', icon: Code, label: 'Code' },
  { value: 'Settings', icon: Settings, label: 'Settings' },
  { value: 'FileText', icon: FileText, label: 'Document' },
  { value: 'Mail', icon: Mail, label: 'Email' },
  { value: 'File', icon: File, label: 'File' },
  { value: 'Globe', icon: Globe, label: 'Globe' },
  { value: 'Heart', icon: Heart, label: 'Heart' },
  { value: 'Home', icon: Home, label: 'Home' },
  { value: 'Info', icon: Info, label: 'Information' },
  { value: 'Laptop', icon: Laptop, label: 'Laptop' },
  { value: 'Lightbulb', icon: Lightbulb, label: 'Lightbulb' },
  { value: 'LinkIcon', icon: LinkIcon, label: 'Link' },
  { value: 'ListIcon', icon: ListIcon, label: 'List' },
  { value: 'MapIcon', icon: MapIcon, label: 'Map' },
  { value: 'Phone', icon: Phone, label: 'Phone' },
  { value: 'Star', icon: Star, label: 'Star' },
  { value: 'Tag', icon: Tag, label: 'Tag' },
  { value: 'User', icon: User, label: 'User' },
  { value: 'Video', icon: Video, label: 'Video' },
  { value: 'Wallet', icon: Wallet, label: 'Wallet' }
]

const API_ROOT = '/api/resources'
const CATEGORY_ENDPOINT = `${API_ROOT}/categories`
const LINKS_ENDPOINT = `${API_ROOT}/links`
const FILES_ENDPOINT = `${API_ROOT}/files`
const ANNOUNCEMENTS_ENDPOINT = `${API_ROOT}/announcements`
const SCAFFOLD_ENDPOINT = `${CATEGORY_ENDPOINT}/scaffold`

const emptyCategoryForm = {
  id: null,
  name: '',
  slug: '',
  description: '',
  color: '',
  icon: '',
  parentId: '',
  sortOrder: 0,
  isActive: true,
  isPinned: false,
  pinnedOrder: 0,
  pendingThumbnail: null,
  pendingThumbnailPreview: null,
}

const emptyLinkForm = {
  id: null,
  title: '',
  url: '',
  type: 'external',
  description: '',
  categoryId: '',
  thumbnailUrl: '',
  isPinned: false,
  pinnedOrder: 0,
  tags: '',
  ctaLabel: '',
  ctaUrl: '',
  status: 'active',
  visibleToGroupTypes: ['admin'],
  visibleToGroupIds: '',
}

const emptyFileForm = {
  id: null,
  name: '',
  description: '',
  categoryId: '',
  pendingThumbnail: null,
  pendingThumbnailPreview: null,
  uploadedThumbnailUrl: null,
  isPinned: false,
  pinnedOrder: 0,
  tags: '',
  ctaLabel: '',
  ctaUrl: '',
  status: 'active',
  visibleToGroupTypes: ['admin'],
  visibleToGroupIds: '',
  file: null,
}

const emptyAnnouncementForm = {
  id: null,
  title: '',
  summary: '',
  body: '',
  categoryId: '',
  isPinned: false,
  pinnedOrder: 0,
  publishAt: '',
  expireAt: '',
  ctaLabel: '',
  ctaUrl: '',
  status: 'published',
  visibleToGroupTypes: ['admin'],
  visibleToGroupIds: '',
}

const flattenCategories = (categories = [], level = 0, list = []) => {
  categories.forEach((category) => {
    list.push({ id: category.id, name: category.name, level, data: category })
    if (Array.isArray(category.children) && category.children.length) {
      flattenCategories(category.children, level + 1, list)
    }
  })
  return list
}

const buildCategoryMap = (categories = []) => {
  const map = new Map()
  const traverse = (nodes, parentId = null) => {
    nodes.forEach((node) => {
      map.set(node.id, { ...node, parentId })
      if (Array.isArray(node.children) && node.children.length) {
        traverse(node.children, node.id)
      }
    })
  }
  traverse(categories)
  return map
}

const normalizeTagsInput = (value) => {
  if (!value) return []
  if (Array.isArray(value)) return value
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => tag.length)
}

const serializeTags = (tags) => (Array.isArray(tags) && tags.length ? tags.join(', ') : '')

const normalizeVisibilityInput = (value) => {
  if (!value) return []
  if (Array.isArray(value)) return value
  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length)
}

const formatDateTimeForInput = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (num) => `${num}`.padStart(2, '0')
  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())
  const hours = pad(date.getHours())
  const minutes = pad(date.getMinutes())
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

const toISOStringOrNull = (value) => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

const Resources = ({ isContractor, contractorGroupName }) => {
  const { t } = useTranslation()
  const customization = useSelector((state) => state.customization)
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [scaffoldLoading, setScaffoldLoading] = useState(false)
  const [resourceData, setResourceData] = useState(null)
  const [categoryReference, setCategoryReference] = useState([])
  const [filters, setFilters] = useState({ search: '', categoryId: 'all', medium: 'all' })
  const [activeTab, setActiveTab] = useState(0)
  const [fileDownloadPermissions, setFileDownloadPermissions] = useState({})
  const [categoryModal, setCategoryModal] = useState({ visible: false, isEdit: false, form: { ...emptyCategoryForm } })
  const [linkModal, setLinkModal] = useState({ visible: false, isEdit: false, form: { ...emptyLinkForm } })
  const [fileModal, setFileModal] = useState({ visible: false, isEdit: false, form: { ...emptyFileForm } })
  const [announcementModal, setAnnouncementModal] = useState({ visible: false, isEdit: false, form: { ...emptyAnnouncementForm } })
  const [viewerModal, setViewerModal] = useState({ visible: false, file: null })

  const isAdmin = !isContractor

  const bgColor = useColorModeValue('gray.50', 'gray.900')
  const cardBg = useColorModeValue('white', 'gray.800')
  const accentColor = customization?.primaryColor || 'blue.600'

  const canDownloadFile = useCallback((fileId) => {
    return isAdmin || fileDownloadPermissions[fileId] === true
  }, [isAdmin, fileDownloadPermissions])

  const toggleFileDownloadPermission = useCallback((fileId) => {
    setFileDownloadPermissions(prev => ({
      ...prev,
      [fileId]: !prev[fileId]
    }))
  }, [])

  const apiBaseUrl = useMemo(() => {
    if (axiosInstance.defaults.baseURL) {
      return axiosInstance.defaults.baseURL
    }
    if (typeof window !== 'undefined') {
      return window.location.origin
    }
    return ''
  }, [])

  const resolveFileUrl = useCallback(
    (file, mode = 'download') => {
      if (!file?.url) return null
      const base = apiBaseUrl || (typeof window !== 'undefined' ? window.location.origin : '')
      if (!base) return null
      try {
        const url = new URL(file.url, base)
        if (mode && mode !== 'download') {
          url.searchParams.set('mode', mode)
        }
        const token = getFreshestToken()
        if (token) {
          url.searchParams.set('token', token)
        }
        return url.toString()
      } catch (error) {
        console.error('Error building secure resource URL', error)
        return null
      }
    },
    [apiBaseUrl]
  )

  const resolveCategoryThumbUrl = useCallback((categoryOrUrl) => {
    const token = getFreshestToken()
    let urlStr = null
    if (!categoryOrUrl) return null
    if (typeof categoryOrUrl === 'string') {
      urlStr = categoryOrUrl
    } else if (categoryOrUrl.thumbnailUrl) {
      urlStr = categoryOrUrl.thumbnailUrl
    }
    if (!urlStr) return null
    try {
      if (/^https?:\/\//i.test(urlStr)) {
        return urlStr
      }
      const base = apiBaseUrl || (typeof window !== 'undefined' ? window.location.origin : '')
      if (!base) return null
      const u = new URL(urlStr, base)
      if (token) u.searchParams.set('token', token)
      return u.toString()
    } catch (e) {
      console.error('Error building category thumbnail URL', e)
      return null
    }
  }, [apiBaseUrl])

  const getFileKind = useCallback((file) => {
    const type = (file?.mimeType || file?.mime_type || file?.fileType || '').toString().toLowerCase()
    const name = (file?.originalName || file?.original_name || file?.name || '').toString().toLowerCase()
    const ext = name.includes('.') ? name.split('.').pop() : ''
    const isImage = type.startsWith('image/') || ['jpg','jpeg','png','gif','bmp','webp','svg'].includes(ext)
    const isVideo = type.startsWith('video/') || ['mp4','mov','m4v','webm','ogg','avi','mkv'].includes(ext)
    const isPdf = type.includes('pdf') || ext === 'pdf'
    if (isImage) return 'image'
    if (isVideo) return 'video'
    if (isPdf) return 'pdf'
    return 'other'
  }, [])

  const resolveFileThumbUrl = useCallback((file) => {
    if (!file) return null
    if (file.thumbnailUrl) {
      return resolveCategoryThumbUrl(file.thumbnailUrl)
    }
    const kind = getFileKind(file)
    const apiThumb = resolveFileUrl(file, 'thumbnail')
    if (apiThumb) return apiThumb
    if (kind === 'image') {
      return resolveFileUrl(file)
    }
    return null
  }, [getFileKind, resolveCategoryThumbUrl, resolveFileUrl])

  const showFeedback = (type, message) => {
    toast({
      title: message,
      status: type === 'danger' ? 'error' : type,
      duration: 5000,
      isClosable: true,
    })
  }

  const fetchResources = useCallback(async () => {
    try {
      setLoading(true)
      const response = await axiosInstance.get(API_ROOT, {
        params: { includeInactive: isAdmin },
      })
      setResourceData(response.data?.data || null)
    } catch (error) {
      console.error('Error loading resources:', error)
      const message = error.response?.data?.message || t('resources.messages.loadFailed', 'Failed to load resources')
      showFeedback('error', message)
      setResourceData(null)
    } finally {
      setLoading(false)
    }
  }, [isAdmin, t])

  const fetchCategories = useCallback(async () => {
    if (!isAdmin) return
    try {
      const response = await axiosInstance.get(CATEGORY_ENDPOINT, {
        params: { includeInactive: true },
      })
      setCategoryReference(response.data?.data || [])
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }, [isAdmin])

  useEffect(() => {
    fetchResources()
    if (isAdmin) {
      fetchCategories()
    }
  }, [fetchResources, fetchCategories, isAdmin])

  const categoriesForDisplay = useMemo(
    () => (isAdmin ? categoryReference : resourceData?.categories || []),
    [isAdmin, categoryReference, resourceData]
  )

  const categoryMap = useMemo(() => buildCategoryMap(categoriesForDisplay), [categoriesForDisplay])

  const flattenedCategories = useMemo(() => flattenCategories(categoriesForDisplay), [categoriesForDisplay])

  const parentCategoryOptions = useMemo(() => {
    const excludeId = categoryModal.isEdit ? categoryModal.form.id : null
    return flattenedCategories.filter(({ id }) => String(id) !== String(excludeId))
  }, [flattenedCategories, categoryModal.isEdit, categoryModal.form.id])

  const normalizedSearch = useMemo(() => filters.search.trim().toLowerCase(), [filters.search])

  const passesCategory = useCallback(
    (categoryId) => {
      if (filters.categoryId === 'all') return true
      if (filters.categoryId === 'uncategorized') return !categoryId
      return Number(filters.categoryId) === Number(categoryId)
    },
    [filters.categoryId]
  )

  const passesFilters = useCallback(
    (item, type) => {
      const categoryId = item?.categoryId ?? item?.category_id ?? null
      if (filters.medium !== 'all' && filters.medium !== type) {
        return false
      }
      if (!passesCategory(categoryId)) {
        return false
      }
      if (!normalizedSearch) {
        return true
      }
      const haystack = []
      if (type === 'announcements') {
        haystack.push(item.title, item.summary, item.body)
      } else if (type === 'links') {
        haystack.push(item.title, item.url, item.description)
      } else if (type === 'files') {
        haystack.push(item.name, item.originalName || item.original_name, item.description)
      }
      return haystack.some((value) => value && value.toLowerCase().includes(normalizedSearch))
    },
    [filters.medium, normalizedSearch, passesCategory]
  )

  const passesFiltersIgnoringMedium = useCallback(
    (item, type) => {
      const categoryId = item?.categoryId ?? item?.category_id ?? null
      if (!passesCategory(categoryId)) {
        return false
      }
      if (!normalizedSearch) {
        return true
      }
      const haystack = []
      if (type === 'announcements') {
        haystack.push(item.title, item.summary, item.body)
      } else if (type === 'links') {
        haystack.push(item.title, item.url, item.description)
      } else if (type === 'files') {
        haystack.push(item.name, item.originalName || item.original_name, item.description)
      }
      return haystack.some((value) => value && value.toLowerCase().includes(normalizedSearch))
    },
    [normalizedSearch, passesCategory]
  )

  const resourcesByCategory = useMemo(() => {
    const buckets = {}
    const ensure = (key) => {
      if (!buckets[key]) {
        buckets[key] = { announcements: [], links: [], files: [] }
      }
      return buckets[key]
    }

    flattenedCategories.forEach(({ id }) => ensure(String(id)))

    if (resourceData) {
      const assign = (list = [], type) => {
        list.forEach((item) => {
          const categoryId = item?.categoryId ?? item?.category_id ?? null
          const key = categoryId != null ? String(categoryId) : 'uncategorized'
          ensure(key)[type].push(item)
        })
      }
      assign(resourceData.announcements, 'announcements')
      assign(resourceData.links, 'links')
      assign(resourceData.files, 'files')
    }

    return buckets
  }, [flattenedCategories, resourceData])

  const hasUncategorized = useMemo(() => {
    if (!resourceData) return false
    return (
      resourceData.links?.some((link) => !link.categoryId) ||
      resourceData.files?.some((file) => !file.categoryId) ||
      resourceData.announcements?.some((announcement) => !announcement.categoryId)
    )
  }, [resourceData])

  // Modal handlers
  const openCategoryModal = (category = null, parentId = null) => {
    setCategoryModal({
      visible: true,
      isEdit: !!category,
      form: category
        ? {
            ...category,
            parentId: category.parentId || '',
            color: category.color || '',
            icon: category.icon || '',
            pendingThumbnail: null,
            pendingThumbnailPreview: null
          }
        : { ...emptyCategoryForm, parentId: parentId || '' },
    })
  }

  const closeCategoryModal = () => {
    setCategoryModal({ visible: false, isEdit: false, form: { ...emptyCategoryForm } })
  }

  const openLinkModal = (link = null) => {
    setLinkModal({
      visible: true,
      isEdit: !!link,
      form: link ? {
        ...link,
        categoryId: link.categoryId || '',
        type: link.type || 'external',
        tags: serializeTags(link.tags)
      } : { ...emptyLinkForm },
    })
  }

  const closeLinkModal = () => {
    setLinkModal({ visible: false, isEdit: false, form: { ...emptyLinkForm } })
  }

  const openFileModal = (file = null) => {
    setFileModal({
      visible: true,
      isEdit: !!file,
      form: file
        ? {
            ...file,
            categoryId: file.categoryId || '',
            tags: serializeTags(file.tags),
            pendingThumbnail: null,
            pendingThumbnailPreview: null,
            file: null
          }
        : { ...emptyFileForm },
    })
  }

  const closeFileModal = () => {
    setFileModal({ visible: false, isEdit: false, form: { ...emptyFileForm } })
  }

  const openAnnouncementModal = (announcement = null) => {
    setAnnouncementModal({
      visible: true,
      isEdit: !!announcement,
      form: announcement
        ? {
            ...announcement,
            categoryId: announcement.categoryId || '',
            tags: serializeTags(announcement.tags),
            publishAt: formatDateTimeForInput(announcement.publishAt),
            expireAt: formatDateTimeForInput(announcement.expireAt),
          }
        : { ...emptyAnnouncementForm },
    })
  }

  const closeAnnouncementModal = () => {
    setAnnouncementModal({ visible: false, isEdit: false, form: { ...emptyAnnouncementForm } })
  }

  // CRUD handlers
  const handleSaveCategory = async () => {
    try {
      setActionLoading(true)
      const token = getFreshestToken()
      const payload = { ...categoryModal.form }
      delete payload.pendingThumbnail
      delete payload.pendingThumbnailPreview

      if (categoryModal.isEdit) {
        await axiosInstance.put(`${CATEGORY_ENDPOINT}/${categoryModal.form.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        })
      } else {
        await axiosInstance.post(CATEGORY_ENDPOINT, payload, {
          headers: { Authorization: `Bearer ${token}` },
        })
      }

      await fetchResources()
      if (isAdmin) await fetchCategories()
      closeCategoryModal()
      showFeedback('success', t('resources.messages.categorySaved', 'Category saved successfully'))
    } catch (error) {
      console.error('Error saving category:', error)
      const message = error.response?.data?.message || t('resources.messages.categorySaveFailed', 'Failed to save category')
      showFeedback('error', message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteCategory = async (category) => {
    if (!confirm(t('resources.messages.confirmDeleteCategory', 'Are you sure you want to delete this category?'))) return
    try {
      setActionLoading(true)
      const token = getFreshestToken()
      await axiosInstance.delete(`${CATEGORY_ENDPOINT}/${category.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      await fetchResources()
      if (isAdmin) await fetchCategories()
      showFeedback('success', t('resources.messages.categoryDeleted', 'Category deleted successfully'))
    } catch (error) {
      console.error('Error deleting category:', error)
      const message = error.response?.data?.message || t('resources.messages.categoryDeleteFailed', 'Failed to delete category')
      showFeedback('error', message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleCreateCategoryScaffold = async () => {
    setScaffoldLoading(true)
    try {
      const token = getFreshestToken()
      await axiosInstance.post(SCAFFOLD_ENDPOINT, {}, {
        headers: { Authorization: `Bearer ${token}` },
      })
      await fetchResources()
      if (isAdmin) await fetchCategories()
      showFeedback('success', t('resources.messages.scaffoldCreated', 'Category scaffold created successfully'))
    } catch (error) {
      console.error('Error creating scaffold:', error)
      const message = error.response?.data?.message || t('resources.messages.scaffoldFailed', 'Failed to create scaffold')
      showFeedback('error', message)
    } finally {
      setScaffoldLoading(false)
    }
  }

  if (loading) {
    return (
      <Container maxW="container.xl" py={6}>
        <Center h="400px">
          <Spinner size="xl" color={accentColor} thickness="4px" />
        </Center>
      </Container>
    )
  }

  // Main render - simplified category tiles + resources list
  return (
    <Container maxW="container.xl" py={6}>
      <PageHeader
        title={t('resources.title', 'Resources')}
        subtitle={isContractor ? t('resources.contractorSubtitle', 'Browse available resources and documentation') : t('resources.adminSubtitle', 'Manage resources, categories, and content')}
      />

      <VStack spacing={6} align="stretch">
        {/* Search and filters */}
        <StandardCard bg={cardBg}>
          <CardBody>
            <HStack spacing={4}>
              <InputGroup flex={1}>
                <InputLeftElement>
                  <Search color="gray.400" size={ICON_SIZE_MD} />
                </InputLeftElement>
                <Input
                  placeholder={t('resources.search.placeholder', 'Search resources...')}
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                />
              </InputGroup>

              <Select
                w="200px"
                value={filters.categoryId}
                onChange={(e) => setFilters(prev => ({ ...prev, categoryId: e.target.value }))}
              >
                <option value="all">{t('resources.filters.allCategories', 'All Categories')}</option>
                {flattenedCategories.map(({ id, name, level }) => (
                  <option key={id} value={id}>
                    {'  '.repeat(level)}{name}
                  </option>
                ))}
                {hasUncategorized && (
                  <option value="uncategorized">{t('resources.filters.uncategorized', 'Uncategorized')}</option>
                )}
              </Select>

              <Select
                w="150px"
                value={filters.medium}
                onChange={(e) => setFilters(prev => ({ ...prev, medium: e.target.value }))}
              >
                <option value="all">{t('resources.filters.allTypes', 'All Types')}</option>
                <option value="announcements">{t('resources.types.announcements', 'Announcements')}</option>
                <option value="links">{t('resources.types.links', 'Links')}</option>
                <option value="files">{t('resources.types.files', 'Files')}</option>
              </Select>
            </HStack>
          </CardBody>
        </StandardCard>

        {/* Admin controls */}
        {isAdmin && (
          <HStack spacing={4}>
            <Button
              leftIcon={<Plus size={ICON_SIZE_MD} />}
              colorScheme="blue"
              onClick={() => openCategoryModal()}
            >
              {t('resources.actions.newCategory', 'New Category')}
            </Button>
            <Button
              leftIcon={<Settings size={ICON_SIZE_MD} />}
              variant="outline"
              onClick={handleCreateCategoryScaffold}
              isLoading={scaffoldLoading}
            >
              {t('resources.actions.scaffold', 'Create Scaffold')}
            </Button>
          </HStack>
        )}

        {/* Show category tiles when viewing all */}
        {filters.categoryId === 'all' && (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={6}>
            {categoriesForDisplay.map((category) => {
              const thumbUrl = resolveCategoryThumbUrl(category)
              const color = category.color || accentColor

              // Calculate totals for this category
              const totals = {
                announcements: (resourceData?.announcements || []).filter(item =>
                  (item.categoryId === category.id) && passesFiltersIgnoringMedium(item, 'announcements')
                ).length,
                links: (resourceData?.links || []).filter(item =>
                  (item.categoryId === category.id) && passesFiltersIgnoringMedium(item, 'links')
                ).length,
                files: (resourceData?.files || []).filter(item =>
                  (item.categoryId === category.id) && passesFiltersIgnoringMedium(item, 'files')
                ).length,
              }

              return (
                <StandardCard
                  key={category.id}
                  bg="white"
                  shadow="sm"
                  cursor="pointer"
                  transition="all 0.2s"
                  _hover={{ transform: 'translateY(-2px)', shadow: 'md' }}
                  onClick={() => setFilters(prev => ({ ...prev, categoryId: String(category.id) }))}
                  h="300px"
                  overflow="hidden"
                >
                  {thumbUrl && (
                    <AspectRatio ratio={16/9} h="120px">
                      <Image src={thumbUrl} alt={category.name} objectFit="cover" />
                    </AspectRatio>
                  )}

                  <CardHeader pb={2}>
                    <HStack justify="space-between">
                      <HStack>
                        <Box
                          w={8}
                          h={8}
                          rounded="full"
                          bg={`${color}20`}
                          border={`2px solid ${color}40`}
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Folder color={color} size={ICON_SIZE_MD} />
                        </Box>
                        <VStack align="start" spacing={0}>
                          <Text fontWeight="bold" fontSize="sm" noOfLines={1}>
                            {category.name}
                          </Text>
                          {category.isPinned && (
                            <Badge colorScheme="yellow" size="sm">
                              {t('resources.labels.pinned', 'Pinned')}
                            </Badge>
                          )}
                        </VStack>
                      </HStack>

                      {isAdmin && (
                        <HStack opacity={0.7} _groupHover={{ opacity: 1 }}>
                          <Button
            minH="44px"
                            size="sm"
                            variant="ghost"
                            p={1}
                            onClick={(e) => { e.stopPropagation(); openCategoryModal(category); }}
                          >
                            <Edit size={14} />
                          </Button>
                          <Button
            minH="44px"
                            size="sm"
                            variant="ghost"
                            p={1}
                            colorScheme="green"
                            onClick={(e) => { e.stopPropagation(); openCategoryModal(null, category.id); }}
                          >
                            <Plus size={14} />
                          </Button>
                          <Button
            minH="44px"
                            size="sm"
                            variant="ghost"
                            p={1}
                            colorScheme="red"
                            onClick={(e) => { e.stopPropagation(); handleDeleteCategory(category); }}
                          >
                            <Trash size={14} />
                          </Button>
                        </HStack>
                      )}
                    </HStack>
                  </CardHeader>

                  <CardBody pt={0}>
                    {category.description && (
                      <Text fontSize="sm" color="gray.600" noOfLines={2} mb={3}>
                        {category.description}
                      </Text>
                    )}

                    <HStack spacing={4}>
                      <Badge colorScheme="orange">
                        {totals.announcements}
                      </Badge>
                      <Badge colorScheme="green">
                        {totals.links}
                      </Badge>
                      <Badge colorScheme="blue">
                        {totals.files}
                      </Badge>
                    </HStack>
                  </CardBody>
                </StandardCard>
              )
            })}
          </SimpleGrid>
        )}

        {/* Show resource tabs when viewing specific category */}
        {filters.categoryId !== 'all' && (
          <VStack spacing={6} align="stretch">
            {/* Back button */}
            <Button
              leftIcon={<ArrowLeft size={ICON_SIZE_MD} />}
              variant="ghost"
              alignSelf="flex-start"
              onClick={() => setFilters(prev => ({ ...prev, categoryId: 'all' }))}
            >
              {t('resources.actions.backToCategories', 'Back to Categories')}
            </Button>

            {/* Resource tabs */}
            <Tabs index={activeTab} onChange={setActiveTab} variant="enclosed" colorScheme="blue">
              <TabList>
                <Tab>{t('resources.types.announcements', 'Announcements')} ({(resourceData?.announcements || []).filter(item => passesFilters(item, 'announcements')).length})</Tab>
                <Tab>{t('resources.types.links', 'Links')} ({(resourceData?.links || []).filter(item => passesFilters(item, 'links')).length})</Tab>
                <Tab>{t('resources.types.files', 'Files')} ({(resourceData?.files || []).filter(item => passesFilters(item, 'files')).length})</Tab>
              </TabList>

              <TabPanels>
                <TabPanel px={0}>
                  <VStack spacing={4} align="stretch">
                    {isAdmin && (
                      <Button leftIcon={<Plus size={ICON_SIZE_MD} />} colorScheme="blue" onClick={() => openAnnouncementModal()} alignSelf="flex-start">
                        {t('resources.actions.newAnnouncement', 'New Announcement')}
                      </Button>
                    )}

                    {(resourceData?.announcements || []).filter(item => passesFilters(item, 'announcements')).map((announcement) => (
                      <StandardCard key={announcement.id} bg="white">
                        <CardBody>
                          <HStack justify="space-between">
                            <VStack align="start" flex={1}>
                              <Heading size="sm">{announcement.title}</Heading>
                              {announcement.summary && (
                                <Text fontSize="sm" color="gray.600">{announcement.summary}</Text>
                              )}
                              {announcement.isPinned && (
                                <Badge colorScheme="yellow">
                                  <Pin size={12} style={{ marginRight: 4 }} />
                                  {t('resources.labels.pinned', 'Pinned')}
                                </Badge>
                              )}
                            </VStack>

                            {isAdmin && (
                              <HStack>
                                <Button size="sm" variant="ghost" minH="44px" onClick={() => openAnnouncementModal(announcement)}>
                                  <Edit size={ICON_SIZE_MD} />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  colorScheme="red"
                                  onClick={async () => {
                                    if (!confirm(t('common.confirmDelete', 'Are you sure you want to delete this announcement?'))) return
                                    try {
                                      const token = getFreshestToken()
                                      await axiosInstance.delete(`${ANNOUNCEMENTS_ENDPOINT}/${announcement.id}`, {
                                        headers: { Authorization: `Bearer ${token}` }
                                      })
                                      await fetchResources()
                                      showFeedback('success', t('resources.messages.announcementDeleted', 'Announcement deleted'))
                                    } catch (error) {
                                      console.error('Error deleting announcement:', error)
                                      showFeedback('error', t('resources.messages.announcementDeleteFailed', 'Failed to delete announcement'))
                                    }
                                  }}
                                >
                                  <Trash size={ICON_SIZE_MD} />
                                </Button>
                              </HStack>
                            )}
                          </HStack>
                        </CardBody>
                      </StandardCard>
                    ))}

                    {(resourceData?.announcements || []).filter(item => passesFilters(item, 'announcements')).length === 0 && (
                      <Text textAlign="center" color="gray.500" py={8}>
                        {t('resources.empty.announcements', 'No announcements found')}
                      </Text>
                    )}
                  </VStack>
                </TabPanel>

                <TabPanel px={0}>
                  <VStack spacing={4} align="stretch">
                    {isAdmin && (
                      <Button leftIcon={<Plus size={ICON_SIZE_MD} />} colorScheme="blue" onClick={() => openLinkModal()} alignSelf="flex-start">
                        {t('resources.actions.newLink', 'New Link')}
                      </Button>
                    )}

                    {(resourceData?.links || []).filter(item => passesFilters(item, 'links')).map((link) => (
                      <StandardCard key={link.id} bg="white">
                        <CardBody>
                          <HStack justify="space-between">
                            <VStack align="start" flex={1}>
                              <Link href={link.url} isExternal color="blue.500" fontWeight="bold">
                                minH="44px"
                                py={2}
                                {link.title}
                              </Link>
                              {link.description && (
                                <Text fontSize="sm" color="gray.600">{link.description}</Text>
                              )}
                              <HStack>
                                <Badge>{link.type}</Badge>
                                {link.isPinned && (
                                  <Badge colorScheme="yellow">
                                    <Pin size={12} style={{ marginRight: 4 }} />
                                    {t('resources.labels.pinned', 'Pinned')}
                                  </Badge>
                                )}
                              </HStack>
                            </VStack>

                            {isAdmin && (
                              <HStack>
                                <Button size="sm" variant="ghost" minH="44px" onClick={() => openLinkModal(link)}>
                                  <Edit size={ICON_SIZE_MD} />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  colorScheme="red"
                                  onClick={async () => {
                                    if (!confirm(t('common.confirmDelete', 'Are you sure you want to delete this link?'))) return
                                    try {
                                      const token = getFreshestToken()
                                      await axiosInstance.delete(`${LINKS_ENDPOINT}/${link.id}`, {
                                        headers: { Authorization: `Bearer ${token}` }
                                      })
                                      await fetchResources()
                                      showFeedback('success', t('resources.messages.linkDeleted', 'Link deleted'))
                                    } catch (error) {
                                      console.error('Error deleting link:', error)
                                      showFeedback('error', t('resources.messages.linkDeleteFailed', 'Failed to delete link'))
                                    }
                                  }}
                                >
                                  <Trash size={ICON_SIZE_MD} />
                                </Button>
                              </HStack>
                            )}
                          </HStack>
                        </CardBody>
                      </StandardCard>
                    ))}

                    {(resourceData?.links || []).filter(item => passesFilters(item, 'links')).length === 0 && (
                      <Text textAlign="center" color="gray.500" py={8}>
                        {t('resources.empty.links', 'No links found')}
                      </Text>
                    )}
                  </VStack>
                </TabPanel>

                <TabPanel px={0}>
                  <VStack spacing={4} align="stretch">
                    {isAdmin && (
                      <Button leftIcon={<Plus size={ICON_SIZE_MD} />} colorScheme="blue" onClick={() => openFileModal()} alignSelf="flex-start">
                        {t('resources.actions.newFile', 'New File')}
                      </Button>
                    )}

                    {(resourceData?.files || []).filter(item => passesFilters(item, 'files')).map((file) => {
                      const thumbUrl = resolveFileThumbUrl(file)
                      const fileKind = getFileKind(file)
                      const canDownload = canDownloadFile(file.id)

                      return (
                        <StandardCard key={file.id} bg="white">
                          <CardBody>
                            <HStack justify="space-between">
                              <HStack flex={1}>
                                {thumbUrl && (
                                  <Image src={thumbUrl} alt={file.name} boxSize="60px" objectFit="cover" rounded="md" />
                                )}
                                <VStack align="start" flex={1}>
                                  <Text fontWeight="bold">{file.name}</Text>
                                  {file.description && (
                                    <Text fontSize="sm" color="gray.600">{file.description}</Text>
                                  )}
                                  <HStack>
                                    <Badge>{fileKind}</Badge>
                                    {file.isPinned && (
                                      <Badge colorScheme="yellow">
                                        <Pin size={12} style={{ marginRight: 4 }} />
                                        {t('resources.labels.pinned', 'Pinned')}
                                      </Badge>
                                    )}
                                  </HStack>
                                </VStack>
                              </HStack>

                              <HStack>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setViewerModal({ visible: true, file })}
                                >
                                  <Eye size={ICON_SIZE_MD} />
                                </Button>
                                {canDownload && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      const url = resolveFileUrl(file)
                                      if (url) window.open(url, '_blank')
                                    }}
                                  >
                                    <Download size={ICON_SIZE_MD} />
                                  </Button>
                                )}
                                {isAdmin && (
                                  <>
                                    <Button size="sm" variant="ghost" minH="44px" onClick={() => openFileModal(file)}>
                                      <Edit size={ICON_SIZE_MD} />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      colorScheme="red"
                                      onClick={async () => {
                                        if (!confirm(t('common.confirmDelete', 'Are you sure you want to delete this file?'))) return
                                        try {
                                          const token = getFreshestToken()
                                          await axiosInstance.delete(`${FILES_ENDPOINT}/${file.id}`, {
                                            headers: { Authorization: `Bearer ${token}` }
                                          })
                                          await fetchResources()
                                          showFeedback('success', t('resources.messages.fileDeleted', 'File deleted'))
                                        } catch (error) {
                                          console.error('Error deleting file:', error)
                                          showFeedback('error', t('resources.messages.fileDeleteFailed', 'Failed to delete file'))
                                        }
                                      }}
                                    >
                                      <Trash size={ICON_SIZE_MD} />
                                    </Button>
                                  </>
                                )}
                              </HStack>
                            </HStack>
                          </CardBody>
                        </StandardCard>
                      )
                    })}

                    {(resourceData?.files || []).filter(item => passesFilters(item, 'files')).length === 0 && (
                      <Text textAlign="center" color="gray.500" py={8}>
                        {t('resources.empty.files', 'No files found')}
                      </Text>
                    )}
                  </VStack>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </VStack>
        )}
      </VStack>

      {/* Category Modal */}
      <Modal isOpen={categoryModal.visible} onClose={closeCategoryModal} size={{ base: "full", lg: "lg" }} scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {categoryModal.isEdit ? t('resources.modals.editCategory', 'Edit Category') : t('resources.modals.newCategory', 'New Category')}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>{t('resources.fields.name', 'Name')}</FormLabel>
                <Input
                  value={categoryModal.form.name}
                  onChange={(e) => setCategoryModal(prev => ({ ...prev, form: { ...prev.form, name: e.target.value } }))}
                />
              </FormControl>

              <FormControl>
                <FormLabel>{t('resources.fields.description', 'Description')}</FormLabel>
                <Textarea
                  rows={3}
                  value={categoryModal.form.description}
                  onChange={(e) => setCategoryModal(prev => ({ ...prev, form: { ...prev.form, description: e.target.value } }))}
                />
              </FormControl>

              <FormControl>
                <FormLabel>{t('resources.fields.parentCategory', 'Parent Category')}</FormLabel>
                <Select
                  value={categoryModal.form.parentId}
                  onChange={(e) => setCategoryModal(prev => ({ ...prev, form: { ...prev.form, parentId: e.target.value } }))}
                >
                  <option value="">{t('resources.options.noParent', 'No Parent')}</option>
                  {parentCategoryOptions.map(({ id, name, level }) => (
                    <option key={id} value={id}>
                      {'  '.repeat(level)}{name}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>{t('resources.fields.color', 'Color')}</FormLabel>
                <Input
                  type="color"
                  value={categoryModal.form.color}
                  onChange={(e) => setCategoryModal(prev => ({ ...prev, form: { ...prev.form, color: e.target.value } }))}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={closeCategoryModal}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button colorScheme="blue" onClick={handleSaveCategory} isLoading={actionLoading}>
              {t('common.save', 'Save')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Link Modal */}
      <Modal isOpen={linkModal.visible} onClose={closeLinkModal} size={{ base: "full", lg: "lg" }} scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {linkModal.isEdit ? t('resources.modals.editLink', 'Edit Link') : t('resources.modals.newLink', 'New Link')}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>{t('resources.fields.title', 'Title')}</FormLabel>
                <Input
                  value={linkModal.form.title}
                  onChange={(e) => setLinkModal(prev => ({ ...prev, form: { ...prev.form, title: e.target.value } }))}
                />
              </FormControl>

              <FormControl>
                <FormLabel>{t('resources.fields.url', 'URL')}</FormLabel>
                <Input
                  value={linkModal.form.url}
                  onChange={(e) => setLinkModal(prev => ({ ...prev, form: { ...prev.form, url: e.target.value } }))}
                  placeholder="https://example.com"
                />
              </FormControl>

              <FormControl>
                <FormLabel>{t('resources.fields.type', 'Type')}</FormLabel>
                <Select
                  value={linkModal.form.type}
                  onChange={(e) => setLinkModal(prev => ({ ...prev, form: { ...prev.form, type: e.target.value } }))}
                >
                  {LINK_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {t(option.key, option.value)}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>{t('resources.fields.description', 'Description')}</FormLabel>
                <Textarea
                  rows={3}
                  value={linkModal.form.description}
                  onChange={(e) => setLinkModal(prev => ({ ...prev, form: { ...prev.form, description: e.target.value } }))}
                />
              </FormControl>

              <FormControl>
                <FormLabel>{t('resources.fields.category', 'Category')}</FormLabel>
                <Select
                  value={linkModal.form.categoryId}
                  onChange={(e) => setLinkModal(prev => ({ ...prev, form: { ...prev.form, categoryId: e.target.value } }))}
                >
                  <option value="">{t('resources.options.noCategory', 'No Category')}</option>
                  {flattenedCategories.map(({ id, name, level }) => (
                    <option key={id} value={id}>
                      {'  '.repeat(level)}{name}
                    </option>
                  ))}
                </Select>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={closeLinkModal}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              colorScheme="blue"
              onClick={async () => {
                try {
                  setActionLoading(true)
                  const token = getFreshestToken()
                  const payload = {
                    ...linkModal.form,
                    tags: normalizeTagsInput(linkModal.form.tags),
                    visibleToGroupTypes: normalizeVisibilityInput(linkModal.form.visibleToGroupTypes),
                  }

                  if (linkModal.isEdit) {
                    await axiosInstance.put(`${LINKS_ENDPOINT}/${linkModal.form.id}`, payload, {
                      headers: { Authorization: `Bearer ${token}` },
                    })
                  } else {
                    await axiosInstance.post(LINKS_ENDPOINT, payload, {
                      headers: { Authorization: `Bearer ${token}` },
                    })
                  }

                  await fetchResources()
                  closeLinkModal()
                  showFeedback('success', t('resources.messages.linkSaved', 'Link saved successfully'))
                } catch (error) {
                  console.error('Error saving link:', error)
                  showFeedback('error', t('resources.messages.linkSaveFailed', 'Failed to save link'))
                } finally {
                  setActionLoading(false)
                }
              }}
              isLoading={actionLoading}
            >
              {t('common.save', 'Save')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* File Modal */}
      <Modal isOpen={fileModal.visible} onClose={closeFileModal} size={{ base: "full", lg: "lg" }} scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {fileModal.isEdit ? t('resources.modals.editFile', 'Edit File') : t('resources.modals.newFile', 'New File')}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>{t('resources.fields.name', 'Name')}</FormLabel>
                <Input
                  value={fileModal.form.name}
                  onChange={(e) => setFileModal(prev => ({ ...prev, form: { ...prev.form, name: e.target.value } }))}
                />
              </FormControl>

              <FormControl>
                <FormLabel>{t('resources.fields.file', 'File')}</FormLabel>
                <Input
                  type="file"
                  onChange={(e) => setFileModal(prev => ({ ...prev, form: { ...prev.form, file: e.target.files[0] } }))}
                />
              </FormControl>

              <FormControl>
                <FormLabel>{t('resources.fields.description', 'Description')}</FormLabel>
                <Textarea
                  rows={3}
                  value={fileModal.form.description}
                  onChange={(e) => setFileModal(prev => ({ ...prev, form: { ...prev.form, description: e.target.value } }))}
                />
              </FormControl>

              <FormControl>
                <FormLabel>{t('resources.fields.category', 'Category')}</FormLabel>
                <Select
                  value={fileModal.form.categoryId}
                  onChange={(e) => setFileModal(prev => ({ ...prev, form: { ...prev.form, categoryId: e.target.value } }))}
                >
                  <option value="">{t('resources.options.noCategory', 'No Category')}</option>
                  {flattenedCategories.map(({ id, name, level }) => (
                    <option key={id} value={id}>
                      {'  '.repeat(level)}{name}
                    </option>
                  ))}
                </Select>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={closeFileModal}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              colorScheme="blue"
              onClick={async () => {
                try {
                  setActionLoading(true)
                  const token = getFreshestToken()
                  const formData = new FormData()

                  // Add file if present
                  if (fileModal.form.file) {
                    formData.append('file', fileModal.form.file)
                  }

                  // Add other fields
                  const payload = {
                    ...fileModal.form,
                    tags: normalizeTagsInput(fileModal.form.tags),
                    visibleToGroupTypes: normalizeVisibilityInput(fileModal.form.visibleToGroupTypes),
                  }
                  delete payload.file
                  delete payload.pendingThumbnail
                  delete payload.pendingThumbnailPreview

                  Object.entries(payload).forEach(([key, value]) => {
                    if (value !== null && value !== undefined) {
                      formData.append(key, value)
                    }
                  })

                  if (fileModal.isEdit) {
                    await axiosInstance.put(`${FILES_ENDPOINT}/${fileModal.form.id}`, formData, {
                      headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                      },
                    })
                  } else {
                    await axiosInstance.post(FILES_ENDPOINT, formData, {
                      headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                      },
                    })
                  }

                  await fetchResources()
                  closeFileModal()
                  showFeedback('success', t('resources.messages.fileSaved', 'File saved successfully'))
                } catch (error) {
                  console.error('Error saving file:', error)
                  showFeedback('error', t('resources.messages.fileSaveFailed', 'Failed to save file'))
                } finally {
                  setActionLoading(false)
                }
              }}
              isLoading={actionLoading}
            >
              {t('common.save', 'Save')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Announcement Modal */}
      <Modal isOpen={announcementModal.visible} onClose={closeAnnouncementModal} size={{ base: "full", lg: "lg" }} scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {announcementModal.isEdit ? t('resources.modals.editAnnouncement', 'Edit Announcement') : t('resources.modals.newAnnouncement', 'New Announcement')}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>{t('resources.fields.title', 'Title')}</FormLabel>
                <Input
                  value={announcementModal.form.title}
                  onChange={(e) => setAnnouncementModal(prev => ({ ...prev, form: { ...prev.form, title: e.target.value } }))}
                />
              </FormControl>

              <FormControl>
                <FormLabel>{t('resources.fields.summary', 'Summary')}</FormLabel>
                <Textarea
                  rows={2}
                  value={announcementModal.form.summary}
                  onChange={(e) => setAnnouncementModal(prev => ({ ...prev, form: { ...prev.form, summary: e.target.value } }))}
                />
              </FormControl>

              <FormControl>
                <FormLabel>{t('resources.fields.body', 'Body')}</FormLabel>
                <Textarea
                  rows={5}
                  value={announcementModal.form.body}
                  onChange={(e) => setAnnouncementModal(prev => ({ ...prev, form: { ...prev.form, body: e.target.value } }))}
                />
              </FormControl>

              <FormControl>
                <FormLabel>{t('resources.fields.category', 'Category')}</FormLabel>
                <Select
                  value={announcementModal.form.categoryId}
                  onChange={(e) => setAnnouncementModal(prev => ({ ...prev, form: { ...prev.form, categoryId: e.target.value } }))}
                >
                  <option value="">{t('resources.options.noCategory', 'No Category')}</option>
                  {flattenedCategories.map(({ id, name, level }) => (
                    <option key={id} value={id}>
                      {'  '.repeat(level)}{name}
                    </option>
                  ))}
                </Select>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={closeAnnouncementModal}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              colorScheme="blue"
              onClick={async () => {
                try {
                  setActionLoading(true)
                  const token = getFreshestToken()
                  const payload = {
                    ...announcementModal.form,
                    tags: normalizeTagsInput(announcementModal.form.tags),
                    visibleToGroupTypes: normalizeVisibilityInput(announcementModal.form.visibleToGroupTypes),
                    publishAt: toISOStringOrNull(announcementModal.form.publishAt),
                    expireAt: toISOStringOrNull(announcementModal.form.expireAt),
                  }

                  if (announcementModal.isEdit) {
                    await axiosInstance.put(`${ANNOUNCEMENTS_ENDPOINT}/${announcementModal.form.id}`, payload, {
                      headers: { Authorization: `Bearer ${token}` },
                    })
                  } else {
                    await axiosInstance.post(ANNOUNCEMENTS_ENDPOINT, payload, {
                      headers: { Authorization: `Bearer ${token}` },
                    })
                  }

                  await fetchResources()
                  closeAnnouncementModal()
                  showFeedback('success', t('resources.messages.announcementSaved', 'Announcement saved successfully'))
                } catch (error) {
                  console.error('Error saving announcement:', error)
                  showFeedback('error', t('resources.messages.announcementSaveFailed', 'Failed to save announcement'))
                } finally {
                  setActionLoading(false)
                }
              }}
              isLoading={actionLoading}
            >
              {t('common.save', 'Save')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* File Viewer Modal */}
      <FileViewerModal
        isOpen={viewerModal.visible}
        onClose={() => setViewerModal({ visible: false, file: null })}
        file={viewerModal.file}
      />
    </Container>
  )
}

export default withContractorScope(Resources, 'resources')