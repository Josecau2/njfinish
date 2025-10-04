import StandardCard from '../../components/StandardCard'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import axiosInstance from '../../helpers/axiosInstance'
import { getFreshestToken } from '../../utils/authToken'
import { getContrastColor } from '../../utils/colorUtils'
import {
  Alert,
  AspectRatio,
  Badge,
  Box,
  Button,
  CardBody,
  CardFooter,
  CardHeader,
  Center,
  Checkbox,
  Container,
  Divider,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  Grid,
  GridItem,
  HStack,
  Heading,
  Icon,
  IconButton,
  Image,
  Input,
  InputGroup,
  InputLeftElement,
  Link,
  List,
  ListItem,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Progress,
  Select,
  SimpleGrid,
  Spinner,
  Stack,
  Switch,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  Textarea,
  VStack,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react'
import PageContainer from '../../components/PageContainer'
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
  Pin,
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
  { value: 'Wallet', icon: Wallet, label: 'Wallet' },
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

// Helper to safely create color variants with alpha channel
// Handles both hex colors (#RRGGBB) and Chakra tokens (blue.600)
const getColorWithAlpha = (color, alpha) => {
  if (!color) return `rgba(0, 0, 0, ${alpha / 100})`

  // If it's a hex color, append the alpha directly
  if (color.startsWith('#')) {
    return `${color}${Math.round(alpha * 2.55).toString(16).padStart(2, '0')}`
  }

  // If it's a Chakra theme token (e.g., blue.600), use rgba fallback
  // This will use the CSS variable if available, or fallback to a safe default
  return `rgba(59, 130, 246, ${alpha / 100})` // blue.600 approximation
}

const Resources = ({ isContractor, contractorGroupName }) => {
  const { t } = useTranslation()
  const customization = useSelector((state) => state.customization)
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [scaffoldLoading, setScaffoldLoading] = useState(false)
  const [resourceData, setResourceData] = useState(null)
  const [categoryReference, setCategoryReference] = useState([])
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filters, setFilters] = useState({ search: '', categoryId: 'all', medium: 'all' })
  const [activeTab, setActiveTab] = useState(0)
  const [fileDownloadPermissions, setFileDownloadPermissions] = useState({})
  const [deleteLoading, setDeleteLoading] = useState({})
  const [uploadProgress, setUploadProgress] = useState({})
  const [categoryModal, setCategoryModal] = useState({
    visible: false,
    isEdit: false,
    form: { ...emptyCategoryForm },
  })
  const [linkModal, setLinkModal] = useState({
    visible: false,
    isEdit: false,
    form: { ...emptyLinkForm },
  })
  const [fileModal, setFileModal] = useState({
    visible: false,
    isEdit: false,
    form: { ...emptyFileForm },
  })
  const [announcementModal, setAnnouncementModal] = useState({
    visible: false,
    isEdit: false,
    form: { ...emptyAnnouncementForm },
  })
  const [viewerModal, setViewerModal] = useState({ visible: false, file: null })

  const isAdmin = !isContractor

  const bgColor = useColorModeValue('gray.50', 'gray.900')
  const cardBg = useColorModeValue('white', 'gray.800')
  const searchIconColor = useColorModeValue('gray.400', 'gray.500')
  const textSecondary = useColorModeValue('gray.600', 'gray.400')
  const textMuted = useColorModeValue('gray.500', 'gray.400')
  const linkColor = useColorModeValue('blue.500', 'blue.300')
  const previewBg = useColorModeValue('blackAlpha.50', 'whiteAlpha.50')
  const previewHoverBg = useColorModeValue('blackAlpha.100', 'whiteAlpha.100')
  const accentColor = customization?.primaryColor || 'blue.600'

  const canDownloadFile = useCallback(
    (fileId) => {
      return isAdmin || fileDownloadPermissions[fileId] === true
    },
    [isAdmin, fileDownloadPermissions],
  )

  const toggleFileDownloadPermission = useCallback((fileId) => {
    setFileDownloadPermissions((prev) => ({
      ...prev,
      [fileId]: !prev[fileId],
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
    [apiBaseUrl],
  )

  const resolveCategoryThumbUrl = useCallback(
    (categoryOrUrl) => {
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
    },
    [apiBaseUrl],
  )

  const getFileKind = useCallback((file) => {
    const type = (file?.mimeType || file?.mime_type || file?.fileType || '')
      .toString()
      .toLowerCase()
    const name = (file?.originalName || file?.original_name || file?.name || '')
      .toString()
      .toLowerCase()
    const ext = name.includes('.') ? name.split('.').pop() : ''
    const isImage =
      type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext)
    const isVideo =
      type.startsWith('video/') || ['mp4', 'mov', 'm4v', 'webm', 'ogg', 'avi', 'mkv'].includes(ext)
    const isPdf = type.includes('pdf') || ext === 'pdf'
    if (isImage) return 'image'
    if (isVideo) return 'video'
    if (isPdf) return 'pdf'
    return 'other'
  }, [])

  const resolveFileThumbUrl = useCallback(
    (file) => {
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
    },
    [getFileKind, resolveCategoryThumbUrl, resolveFileUrl],
  )

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
      setLoadError(null)
      const response = await axiosInstance.get(API_ROOT, {
        params: { includeInactive: isAdmin },
      })
      setResourceData(response.data?.data || null)
    } catch (error) {
      console.error('Error loading resources:', error)
      const message =
        error.response?.data?.message ||
        t('resources.messages.loadFailed', 'Failed to load resources')
      showFeedback('error', message)
      setResourceData(null)
      setLoadError(message)
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

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput)
      setFilters((prev) => ({ ...prev, search: searchInput }))
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  // Tab sync effect
  useEffect(() => {
    const mediumMap = { announcements: 0, links: 1, files: 2 }
    const tabIndex = mediumMap[filters.medium]
    if (tabIndex !== undefined && tabIndex !== activeTab) {
      setActiveTab(tabIndex)
    }
  }, [filters.medium, activeTab])

  const categoriesForDisplay = useMemo(
    () => (isAdmin ? categoryReference : resourceData?.categories || []),
    [isAdmin, categoryReference, resourceData],
  )

  const categoryMap = useMemo(() => buildCategoryMap(categoriesForDisplay), [categoriesForDisplay])

  const flattenedCategories = useMemo(
    () => flattenCategories(categoriesForDisplay),
    [categoriesForDisplay],
  )

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
    [filters.categoryId],
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
    [filters.medium, normalizedSearch, passesCategory],
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
    [normalizedSearch, passesCategory],
  )

  // Memoized resource counts for tabs
  const announcementsCount = useMemo(
    () => (resourceData?.announcements || []).filter((item) => passesFiltersIgnoringMedium(item, 'announcements')).length,
    [resourceData, passesFiltersIgnoringMedium]
  )

  const linksCount = useMemo(
    () => (resourceData?.links || []).filter((item) => passesFiltersIgnoringMedium(item, 'links')).length,
    [resourceData, passesFiltersIgnoringMedium]
  )

  const filesCount = useMemo(
    () => (resourceData?.files || []).filter((item) => passesFiltersIgnoringMedium(item, 'files')).length,
    [resourceData, passesFiltersIgnoringMedium]
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

  // Helper function to compare pinned items for sorting
  const comparePinned = (a, b) => {
    const pa = a?.isPinned ? 1 : 0
    const pb = b?.isPinned ? 1 : 0
    if (pa !== pb) return pb - pa // pinned first
    const poa = Number(a?.pinnedOrder ?? a?.pinned_order ?? 0)
    const pob = Number(b?.pinnedOrder ?? b?.pinned_order ?? 0)
    if (poa !== pob) return poa - pob // lower pinned order first
    return 0
  }

  // Get all descendant category IDs for a given category
  const getDescendantIds = useCallback((category) => {
    const ids = []
    const walk = (node) => {
      if (!node) return
      if (Array.isArray(node.children)) {
        node.children.forEach((child) => {
          ids.push(child.id)
          walk(child)
        })
      }
    }
    walk(category)
    return ids
  }, [])

  // Aggregate category data including resources from subcategories
  const aggregateCategoryData = useCallback(
    (category) => {
      const allIds = new Set([String(category.id), ...getDescendantIds(category).map(String)])
      const anns = (resourceData?.announcements || []).filter(
        (a) =>
          allIds.has(String(a?.categoryId ?? a?.category_id)) &&
          passesFiltersIgnoringMedium(a, 'announcements'),
      )
      const links = (resourceData?.links || []).filter(
        (l) =>
          allIds.has(String(l?.categoryId ?? l?.category_id)) &&
          passesFiltersIgnoringMedium(l, 'links'),
      )
      const files = (resourceData?.files || []).filter(
        (f) =>
          allIds.has(String(f?.categoryId ?? f?.category_id)) &&
          passesFiltersIgnoringMedium(f, 'files'),
      )

      const sortPinnedThen = (arr, by) =>
        arr.slice().sort((a, b) => {
          const pc = comparePinned(a, b)
          if (pc !== 0) return pc
          if (by === 'date') {
            const da = a?.publishAt ? new Date(a.publishAt).getTime() : 0
            const db = b?.publishAt ? new Date(b.publishAt).getTime() : 0
            return db - da
          }
          return String(a?.title || a?.name || '').localeCompare(String(b?.title || b?.name || ''))
        })

      const annsSorted = sortPinnedThen(anns, 'date')
      const linksSorted = sortPinnedThen(links, 'alpha')
      const filesSorted = sortPinnedThen(files, 'alpha')

      // Build a mixed preview list (max 3)
      const preview = []
      annsSorted.slice(0, 1).forEach((a) => preview.push({ type: 'announcement', item: a }))
      linksSorted.slice(0, 1).forEach((l) => preview.push({ type: 'link', item: l }))
      filesSorted.slice(0, 1).forEach((f) => preview.push({ type: 'file', item: f }))
      // If less than 3, fill with remaining by highest volumes
      const remaining = [
        ...annsSorted.slice(1),
        ...linksSorted.slice(1),
        ...filesSorted.slice(1),
      ].slice(0, Math.max(0, 3 - preview.length))
      remaining.forEach((it) => {
        const type = it.title && it.summary ? 'announcement' : it.url ? 'link' : 'file'
        preview.push({ type, item: it })
      })

      const totals = { announcements: anns.length, links: links.length, files: files.length }
      const dominant = Object.entries(totals).sort((a, b) => b[1] - a[1])[0]?.[0] || 'links'
      return { totals, preview, dominant }
    },
    [getDescendantIds, resourceData, passesFiltersIgnoringMedium],
  )

  // Handler to open links in new tab
  const handleOpenLink = (link) => {
    if (link?.url) {
      window.open(link.url, '_blank', 'noopener')
    }
  }

  // Handler to download files with permission check
  const handleDownloadFile = (file) => {
    if (!canDownloadFile(file.id)) {
      showFeedback(
        'warning',
        t(
          'resources.messages.downloadNotAllowed',
          'Downloads are not allowed for this file. Contact an administrator for access.',
        ),
      )
      return
    }

    const url = resolveFileUrl(file)
    if (!url) {
      showFeedback('error', t('resources.messages.fileAccessFailed', 'Failed to access file'))
      return
    }
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener')
    }
  }

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
            pendingThumbnailPreview: null,
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
      form: link
        ? {
            ...link,
            categoryId: link.categoryId || '',
            type: link.type || 'external',
            tags: serializeTags(link.tags),
          }
        : { ...emptyLinkForm },
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
            file: null,
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
    const form = categoryModal.form
    const payload = {
      name: form.name,
      description: form.description,
      color: form.color,
      icon: form.icon,
      slug: form.slug,
      parent_id: form.parentId ? Number(form.parentId) : null,
      sort_order: Number(form.sortOrder) || 0,
      is_active: !!form.isActive,
      is_pinned: !!form.isPinned,
      pinned_order: Number(form.pinnedOrder) || 0,
    }

    try {
      setActionLoading(true)
      let categoryId = form.id

      if (categoryModal.isEdit && form.id) {
        await axiosInstance.put(`${CATEGORY_ENDPOINT}/${form.id}`, payload)
      } else {
        const { data } = await axiosInstance.post(CATEGORY_ENDPOINT, payload)
        categoryId = data?.data?.id
      }

      // Upload pending thumbnail if exists
      if (form.pendingThumbnail && categoryId) {
        try {
          const fd = new FormData()
          fd.append('thumbnail', form.pendingThumbnail)
          await axiosInstance.post(`${CATEGORY_ENDPOINT}/${categoryId}/thumbnail`, fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
          })
        } catch (thumbnailError) {
          console.error('Error uploading pending thumbnail:', thumbnailError)
          showFeedback(
            'warning',
            t('resources.messages.thumbnailUploadFailed', 'Failed to upload thumbnail'),
          )
        }
      }

      await fetchResources()
      if (isAdmin) await fetchCategories()
      closeCategoryModal()
      showFeedback('success', t('resources.messages.categorySaved', 'Category saved successfully'))
    } catch (error) {
      console.error('Error saving category:', error)
      const message =
        error.response?.data?.message ||
        t('resources.messages.categorySaveFailed', 'Failed to save category')
      showFeedback('error', message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteCategory = async (category) => {
    if (
      !confirm(
        t(
          'resources.messages.confirmDeleteCategory',
          'Are you sure you want to delete this category?',
        ),
      )
    )
      return
    try {
      setActionLoading(true)
      const token = getFreshestToken()
      await axiosInstance.delete(`${CATEGORY_ENDPOINT}/${category.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      await fetchResources()
      if (isAdmin) await fetchCategories()
      showFeedback(
        'success',
        t('resources.messages.categoryDeleted', 'Category deleted successfully'),
      )
    } catch (error) {
      console.error('Error deleting category:', error)
      const message =
        error.response?.data?.message ||
        t('resources.messages.categoryDeleteFailed', 'Failed to delete category')
      showFeedback('error', message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleCreateCategoryScaffold = async () => {
    setScaffoldLoading(true)
    try {
      const token = getFreshestToken()
      await axiosInstance.post(
        SCAFFOLD_ENDPOINT,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )
      await fetchResources()
      if (isAdmin) await fetchCategories()
      showFeedback(
        'success',
        t('resources.messages.scaffoldCreated', 'Category scaffold created successfully'),
      )
    } catch (error) {
      console.error('Error creating scaffold:', error)
      const message =
        error.response?.data?.message ||
        t('resources.messages.scaffoldFailed', 'Failed to create scaffold')
      showFeedback('error', message)
    } finally {
      setScaffoldLoading(false)
    }
  }

  if (loading) {
    return (
      <PageContainer>
        <Center h="400px">
          <Spinner size="xl" color={accentColor} thickness="4px" />
        </Center>
      </PageContainer>
    )
  }

  if (loadError) {
    return (
      <PageContainer>
        <Center h="400px">
          <VStack spacing={4}>
            <Alert status="error" borderRadius="md" maxW="500px">
              <VStack spacing={2} align="stretch" w="full">
                <Text fontWeight="medium">{loadError}</Text>
              </VStack>
            </Alert>
            <Button colorScheme="blue" onClick={fetchResources} minH="44px" minW="44px">
              {t('common.retry', 'Retry')}
            </Button>
          </VStack>
        </Center>
      </PageContainer>
    )
  }

  // Main render - simplified category tiles + resources list
  return (
    <PageContainer>
      <PageHeader
        title={t('resources.title', 'Resources')}
        subtitle={
          isContractor
            ? t('resources.contractorSubtitle', 'Browse available resources and documentation')
            : t('resources.adminSubtitle', 'Manage resources, categories, and content')
        }
      />

      <VStack spacing={6} align="stretch">
        {/* Search and filters */}
        <StandardCard bg={cardBg}>
          <CardBody>
            <HStack spacing={4}>
              <InputGroup flex={1} role="search">
                <InputLeftElement>
                  <Search color={searchIconColor} size={ICON_SIZE_MD} />
                </InputLeftElement>
                <Input
                  placeholder={t('resources.search.placeholder', 'Search resources...')}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  name="resources-search"
                  id="resources-search"
                  aria-label={t('resources.search.label', 'Search resources')}
                />
              </InputGroup>

              <Select
                w="200px"
                value={filters.categoryId}
                onChange={(e) => setFilters((prev) => ({ ...prev, categoryId: e.target.value }))}
                name="resources-category"
                id="resources-category"
              >
                <option value="all">
                  {t('resources.filters.allCategories', 'All Categories')}
                </option>
                {flattenedCategories.map(({ id, name, level }) => (
                  <option key={id} value={id}>
                    {'  '.repeat(level)}
                    {name}
                  </option>
                ))}
                {hasUncategorized && (
                  <option value="uncategorized">
                    {t('resources.filters.uncategorized', 'Uncategorized')}
                  </option>
                )}
              </Select>

              <Select
                w="150px"
                value={filters.medium}
                onChange={(e) => setFilters((prev) => ({ ...prev, medium: e.target.value }))}
                name="resources-medium"
                id="resources-medium"
              >
                <option value="all">{t('resources.filters.allTypes', 'All Types')}</option>
                <option value="announcements">
                  {t('resources.types.announcements', 'Announcements')}
                </option>
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
              colorScheme="brand"
              onClick={() => openCategoryModal()}
              minH="44px"
              maxW={{ base: '180px', md: 'none' }}
              fontSize={{ base: 'sm', md: 'md' }}
            >
              {t('resources.actions.newCategory', 'New Category')}
            </Button>
            <Button
              leftIcon={<Settings size={ICON_SIZE_MD} />}
              variant="outline"
              onClick={handleCreateCategoryScaffold}
              isLoading={scaffoldLoading}
              minH="44px"
              maxW={{ base: '180px', md: 'none' }}
              fontSize={{ base: 'sm', md: 'md' }}
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
              const { totals, preview, dominant } = aggregateCategoryData(category)

              return (
                <StandardCard
                  key={category.id}
                  bg={cardBg}
                  shadow="sm"
                  cursor="pointer"
                  transition="all 0.2s"
                  _hover={{ transform: 'translateY(-2px)', shadow: 'md' }}
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      categoryId: String(category.id),
                      medium: dominant,
                    }))
                  }
                  minH={{ base: '320px', md: '380px' }}
                  display="flex"
                  flexDirection="column"
                >
                  {thumbUrl && (
                    <Box position="relative" h="120px" overflow="hidden">
                      <Image
                        src={thumbUrl}
                        alt={category.name}
                        w="100%"
                        h="100%"
                        objectFit="cover"
                        transition="transform 0.3s ease"
                        _hover={{ transform: 'scale(1.05)' }}
                      />
                      <Box
                        position="absolute"
                        top={0}
                        left={0}
                        w="100%"
                        h="100%"
                        bgGradient={`linear(135deg, ${getColorWithAlpha(color, 15)} 0%, transparent 50%)`}
                        pointerEvents="none"
                      />
                    </Box>
                  )}

                  <CardHeader pb={2}>
                    <HStack justify="space-between" align="start">
                      <HStack align="start" flex={1} minW={0}>
                        <Box
                          w={8}
                          h={8}
                          rounded="full"
                          bg={getColorWithAlpha(color, 20)}
                          border={`2px solid ${getColorWithAlpha(color, 40)}`}
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          flexShrink={0}
                        >
                          <Folder color={color} size={ICON_SIZE_MD} />
                        </Box>
                        <VStack align="start" spacing={0} flex={1} minW={0}>
                          <Text fontWeight="bold" fontSize="sm">
                            {category.name}
                          </Text>
                          {category.isPinned && (
                            <Badge colorScheme="yellow" size="sm" fontSize="0.65rem">
                              {t('resources.labels.pinned', 'Pinned')}
                            </Badge>
                          )}
                        </VStack>
                      </HStack>

                      {isAdmin && (
                        <HStack
                          opacity={0.7}
                          _groupHover={{ opacity: 1 }}
                          flexShrink={0}
                          spacing={1}
                          display={{ base: 'none', lg: 'flex' }}
                        >
                          <IconButton
                            size={{ base: 'sm', md: 'md' }}
                            minH={{ base: '36px', md: '44px' }}
                            minW={{ base: '36px', md: '44px' }}
                            variant="ghost"
                            icon={<Edit size={16} />}
                            aria-label={t('resources.actions.editCategory', 'Edit category')}
                            onClick={(e) => {
                              e.stopPropagation()
                              openCategoryModal(category)
                            }}
                          />
                          <IconButton
                            size={{ base: 'sm', md: 'md' }}
                            minH={{ base: '36px', md: '44px' }}
                            minW={{ base: '36px', md: '44px' }}
                            variant="ghost"
                            colorScheme="green"
                            icon={<Plus size={16} />}
                            aria-label={t('resources.actions.addSubcategory', 'Add subcategory')}
                            onClick={(e) => {
                              e.stopPropagation()
                              openCategoryModal(null, category.id)
                            }}
                          />
                          <IconButton
                            size={{ base: 'sm', md: 'md' }}
                            minH={{ base: '36px', md: '44px' }}
                            minW={{ base: '36px', md: '44px' }}
                            variant="ghost"
                            colorScheme="red"
                            icon={<Trash size={16} />}
                            aria-label={t('resources.actions.deleteCategory', 'Delete category')}
                            isLoading={deleteLoading[`category-${category.id}`]}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteCategory(category)
                            }}
                          />
                        </HStack>
                      )}
                    </HStack>
                  </CardHeader>

                  <CardBody pt={0} flex={1} display="flex" flexDirection="column" overflow="visible">
                    {category.description && (
                      <Text
                        fontSize="sm"
                        color={textSecondary}
                        mb={3}
                        lineHeight="1.3"
                      >
                        {category.description}
                      </Text>
                    )}

                    <HStack spacing={2} mb={3} flexWrap="wrap">
                      <Badge
                        colorScheme="orange"
                        display="flex"
                        alignItems="center"
                        gap={1}
                        fontSize="0.7rem"
                      >
                        <Video size={10} />
                        {totals.announcements}
                      </Badge>
                      <Badge
                        colorScheme="green"
                        display="flex"
                        alignItems="center"
                        gap={1}
                        fontSize="0.7rem"
                      >
                        <LinkIcon size={10} />
                        {totals.links}
                      </Badge>
                      <Badge
                        colorScheme="blue"
                        display="flex"
                        alignItems="center"
                        gap={1}
                        fontSize="0.7rem"
                      >
                        <Download size={10} />
                        {totals.files}
                      </Badge>
                    </HStack>

                    {preview.length > 0 ? (
                      <Box flex={1} minH="100px" maxH="120px">
                        <Text
                          color={textMuted}
                          textTransform="uppercase"
                          fontWeight="bold"
                          mb={2}
                          fontSize="0.7rem"
                          letterSpacing="0.5px"
                        >
                          {t('resources.labels.preview', 'Preview')}
                        </Text>
                        <VStack spacing={1} align="stretch" maxH="90px" overflowY="auto">
                          {preview.slice(0, 3).map(({ type, item }, idx) => {
                            const IconComponent =
                              type === 'announcement'
                                ? Video
                                : type === 'link'
                                  ? LinkIcon
                                  : Download
                            const label = item.title || item.name || item.url || ''
                            const handleClick = (e) => {
                              if (e) e.stopPropagation()
                              if (type === 'link') handleOpenLink(item)
                              if (type === 'file') handleDownloadFile(item)
                              if (type === 'announcement')
                                setFilters((prev) => ({
                                  ...prev,
                                  medium: 'announcements',
                                  categoryId: String(category.id),
                                }))
                            }
                            const handleKeyDown = (e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                handleClick()
                              }
                            }
                            return (
                              <HStack
                                key={`prev-${category.id}-${idx}`}
                                p={2}
                                rounded="md"
                                bg={previewBg}
                                cursor="pointer"
                                transition="background 0.2s"
                                _hover={{ bg: previewHoverBg }}
                                onClick={handleClick}
                                onKeyDown={handleKeyDown}
                                tabIndex={0}
                                role="button"
                                spacing={3}
                              >
                                <Icon
                                  as={IconComponent}
                                  boxSize={4}
                                  flexShrink={0}
                                  color={textMuted}
                                />
                                <Text
                                  fontSize="0.8rem"
                                  fontWeight="medium"
                                  flex={1}
                                  overflow="hidden"
                                  textOverflow="ellipsis"
                                  whiteSpace="nowrap"
                                >
                                  {label}
                                </Text>
                              </HStack>
                            )
                          })}
                        </VStack>
                      </Box>
                    ) : (
                      <Box
                        flex={1}
                        minH="100px"
                        display="flex"
                        flexDirection="column"
                        justifyContent="center"
                        alignItems="center"
                        py={3}
                      >
                        <Icon
                          as={Folder}
                          boxSize={6}
                          opacity={0.5}
                          color={textMuted}
                          mb={2}
                        />
                        <Text fontSize="0.75rem" color={textMuted}>
                          {t('resources.messages.noContent', 'No content available')}
                        </Text>
                      </Box>
                    )}
                  </CardBody>

                  <CardFooter pt={2} pb={3} px={4}>
                    <Button
                      size="sm"
                      colorScheme="blue"
                      w="full"
                      minH="44px"
                      fontSize={{ base: 'sm', md: '0.75rem' }}
                      rounded="full"
                      fontWeight="medium"
                      onClick={(e) => {
                        e.stopPropagation()
                        setFilters((prev) => ({
                          ...prev,
                          categoryId: String(category.id),
                          medium: dominant,
                        }))
                      }}
                    >
                      {t('common.view', 'View')}
                    </Button>
                  </CardFooter>
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
              onClick={() => setFilters((prev) => ({ ...prev, categoryId: 'all' }))}
              minH="44px"
              maxW={{ base: '220px', md: 'none' }}
              fontSize={{ base: 'sm', md: 'md' }}
            >
              {t('resources.actions.backToCategories', 'Back to Categories')}
            </Button>

            {/* Resource tabs */}
            <Tabs
              index={activeTab}
              onChange={(index) => {
                setActiveTab(index)
                const tabToMediumMap = { 0: 'announcements', 1: 'links', 2: 'files' }
                const medium = tabToMediumMap[index]
                if (medium) {
                  setFilters((prev) => ({ ...prev, medium }))
                }
              }}
              variant="enclosed"
              colorScheme="brand"
            >
              <TabList>
                <Tab>
                  {t('resources.types.announcements', 'Announcements')} ({announcementsCount})
                </Tab>
                <Tab>
                  {t('resources.types.links', 'Links')} ({linksCount})
                </Tab>
                <Tab>
                  {t('resources.types.files', 'Files')} ({filesCount})
                </Tab>
              </TabList>

              <TabPanels>
                <TabPanel px={0}>
                  <VStack spacing={4} align="stretch">
                    {isAdmin && (
                      <Button
                        leftIcon={<Plus size={ICON_SIZE_MD} />}
                        colorScheme="brand"
                        onClick={() => openAnnouncementModal()}
                        alignSelf="flex-start"
                        minH="44px"
                        maxW={{ base: '220px', md: 'none' }}
                        fontSize={{ base: 'sm', md: 'md' }}
                      >
                        {t('resources.actions.newAnnouncement', 'New Announcement')}
                      </Button>
                    )}

                    {(resourceData?.announcements || [])
                      .filter((item) => passesFilters(item, 'announcements'))
                      .map((announcement) => (
                        <StandardCard key={announcement.id} bg={cardBg}>
                          <CardBody>
                            <Stack
                              direction={{ base: 'column', md: 'row' }}
                              justify="space-between"
                              spacing={{ base: 3, md: 4 }}
                            >
                              <VStack align="start" flex={1} minW={0}>
                                <Heading size="sm">{announcement.title}</Heading>
                                {announcement.summary && (
                                  <Text fontSize="sm" color={textSecondary}>
                                    {announcement.summary}
                                  </Text>
                                )}
                                {announcement.isPinned && (
                                  <Badge colorScheme="yellow" display="flex" alignItems="center" gap={1}>
                                    <Icon as={Pin} boxSize={3} />
                                    {t('resources.labels.pinned', 'Pinned')}
                                  </Badge>
                                )}
                              </VStack>

                              {isAdmin && (
                                <HStack
                                  flexShrink={0}
                                  spacing={2}
                                  alignSelf={{ base: 'flex-end', md: 'flex-start' }}
                                >
                                  <IconButton
                                    size="sm"
                                    variant="ghost"
                                    minH="44px"
                                    minW="44px"
                                    icon={<Edit size={ICON_SIZE_MD} />}
                                    aria-label={t('resources.actions.editAnnouncement', 'Edit announcement')}
                                    onClick={() => openAnnouncementModal(announcement)}
                                  />
                                  <IconButton
                                    size="sm"
                                    variant="ghost"
                                    colorScheme="red"
                                    minH="44px"
                                    minW="44px"
                                    icon={<Trash size={ICON_SIZE_MD} />}
                                    aria-label={t('resources.actions.deleteAnnouncement', 'Delete announcement')}
                                    isLoading={deleteLoading[`announcement-${announcement.id}`]}
                                    onClick={async () => {
                                      if (
                                        !confirm(
                                          t(
                                            'common.confirmDelete',
                                            'Are you sure you want to delete this announcement?',
                                          ),
                                        )
                                      )
                                        return
                                      try {
                                        setDeleteLoading((prev) => ({ ...prev, [`announcement-${announcement.id}`]: true }))
                                        const token = getFreshestToken()
                                        await axiosInstance.delete(
                                          `${ANNOUNCEMENTS_ENDPOINT}/${announcement.id}`,
                                          {
                                            headers: { Authorization: `Bearer ${token}` },
                                          },
                                        )
                                        await fetchResources()
                                        showFeedback(
                                          'success',
                                          t(
                                            'resources.messages.announcementDeleted',
                                            'Announcement deleted',
                                          ),
                                        )
                                      } catch (error) {
                                        console.error('Error deleting announcement:', error)
                                        showFeedback(
                                          'error',
                                          t(
                                            'resources.messages.announcementDeleteFailed',
                                            'Failed to delete announcement',
                                          ),
                                        )
                                      } finally {
                                        setDeleteLoading((prev) => ({ ...prev, [`announcement-${announcement.id}`]: false }))
                                      }
                                    }}
                                  />
                                </HStack>
                              )}
                            </Stack>
                          </CardBody>
                        </StandardCard>
                      ))}

                    {(resourceData?.announcements || []).filter((item) =>
                      passesFilters(item, 'announcements'),
                    ).length === 0 && (
                      <Text textAlign="center" color={textMuted} py={8}>
                        {t('resources.empty.announcements', 'No announcements found')}
                      </Text>
                    )}
                  </VStack>
                </TabPanel>

                <TabPanel px={0}>
                  <VStack spacing={4} align="stretch">
                    {isAdmin && (
                      <Button
                        leftIcon={<Plus size={ICON_SIZE_MD} />}
                        colorScheme="brand"
                        onClick={() => openLinkModal()}
                        alignSelf="flex-start"
                        minH="44px"
                        maxW={{ base: '140px', md: 'none' }}
                        fontSize={{ base: 'sm', md: 'md' }}
                      >
                        {t('resources.actions.newLink', 'New Link')}
                      </Button>
                    )}

                    {(resourceData?.links || [])
                      .filter((item) => passesFilters(item, 'links'))
                      .map((link) => (
                        <StandardCard key={link.id} bg={cardBg}>
                          <CardBody>
                            <Stack
                              direction={{ base: 'column', md: 'row' }}
                              justify="space-between"
                              spacing={{ base: 3, md: 4 }}
                            >
                              <VStack align="start" flex={1} minW={0}>
                                <Link
                                  href={link.url}
                                  isExternal
                                  color={linkColor}
                                  fontWeight="bold"
                                  minH="44px"
                                  display="inline-flex"
                                  alignItems="center"
                                >
                                  {link.title}
                                </Link>
                                {link.description && (
                                  <Text fontSize="sm" color={textSecondary}>
                                    {link.description}
                                  </Text>
                                )}
                                <HStack flexWrap="wrap">
                                  <Badge>{link.type}</Badge>
                                  {link.isPinned && (
                                    <Badge colorScheme="yellow" display="flex" alignItems="center" gap={1}>
                                      <Icon as={Pin} boxSize={3} />
                                      {t('resources.labels.pinned', 'Pinned')}
                                    </Badge>
                                  )}
                                </HStack>
                              </VStack>

                              {isAdmin && (
                                <HStack
                                  flexShrink={0}
                                  spacing={2}
                                  alignSelf={{ base: 'flex-end', md: 'flex-start' }}
                                >
                                  <IconButton
                                    size="sm"
                                    variant="ghost"
                                    minH="44px"
                                    minW="44px"
                                    icon={<Edit size={ICON_SIZE_MD} />}
                                    aria-label={t('resources.actions.editLink', 'Edit link')}
                                    onClick={() => openLinkModal(link)}
                                  />
                                  <IconButton
                                    size="sm"
                                    variant="ghost"
                                    colorScheme="red"
                                    minH="44px"
                                    minW="44px"
                                    icon={<Trash size={ICON_SIZE_MD} />}
                                    aria-label={t('resources.actions.deleteLink', 'Delete link')}
                                    isLoading={deleteLoading[`link-${link.id}`]}
                                    onClick={async () => {
                                      if (
                                        !confirm(
                                          t(
                                            'common.confirmDelete',
                                            'Are you sure you want to delete this link?',
                                          ),
                                        )
                                      )
                                        return
                                      try {
                                        setDeleteLoading((prev) => ({ ...prev, [`link-${link.id}`]: true }))
                                        const token = getFreshestToken()
                                        await axiosInstance.delete(`${LINKS_ENDPOINT}/${link.id}`, {
                                          headers: { Authorization: `Bearer ${token}` },
                                        })
                                        await fetchResources()
                                        showFeedback(
                                          'success',
                                          t('resources.messages.linkDeleted', 'Link deleted'),
                                        )
                                      } catch (error) {
                                        console.error('Error deleting link:', error)
                                        showFeedback(
                                          'error',
                                          t(
                                            'resources.messages.linkDeleteFailed',
                                            'Failed to delete link',
                                          ),
                                        )
                                      } finally {
                                        setDeleteLoading((prev) => ({ ...prev, [`link-${link.id}`]: false }))
                                      }
                                    }}
                                  />
                                </HStack>
                              )}
                            </Stack>
                          </CardBody>
                        </StandardCard>
                      ))}

                    {(resourceData?.links || []).filter((item) => passesFilters(item, 'links'))
                      .length === 0 && (
                      <Text textAlign="center" color={textMuted} py={8}>
                        {t('resources.empty.links', 'No links found')}
                      </Text>
                    )}
                  </VStack>
                </TabPanel>

                <TabPanel px={0}>
                  <VStack spacing={4} align="stretch">
                    {isAdmin && (
                      <Button
                        leftIcon={<Plus size={ICON_SIZE_MD} />}
                        colorScheme="brand"
                        onClick={() => openFileModal()}
                        alignSelf="flex-start"
                        minH="44px"
                        maxW={{ base: '140px', md: 'none' }}
                        fontSize={{ base: 'sm', md: 'md' }}
                      >
                        {t('resources.actions.newFile', 'New File')}
                      </Button>
                    )}

                    {(resourceData?.files || [])
                      .filter((item) => passesFilters(item, 'files'))
                      .map((file) => {
                        const thumbUrl = resolveFileThumbUrl(file)
                        const fileKind = getFileKind(file)
                        const canDownload = canDownloadFile(file.id)

                        return (
                          <StandardCard key={file.id} bg={cardBg}>
                            <CardBody>
                              <Stack
                                direction={{ base: 'column', sm: 'row' }}
                                spacing={{ base: 3, sm: 4 }}
                                align={{ base: 'stretch', sm: 'flex-start' }}
                              >
                                <HStack flex={1} minW={0} align="flex-start">
                                  {thumbUrl && (
                                    <AspectRatio
                                      ratio={1}
                                      w={{ base: '50px', md: '60px' }}
                                      flexShrink={0}
                                    >
                                      <Image
                                        src={thumbUrl}
                                        alt={file.name}
                                        objectFit="cover"
                                        rounded="md"
                                      />
                                    </AspectRatio>
                                  )}
                                  <VStack align="start" flex={1} minW={0} spacing={1}>
                                    <Text fontWeight="bold">{file.name}</Text>
                                    {file.description && (
                                      <Text fontSize="sm" color={textSecondary}>
                                        {file.description}
                                      </Text>
                                    )}
                                    <HStack flexWrap="wrap">
                                      <Badge>{fileKind}</Badge>
                                      {file.isPinned && (
                                        <Badge colorScheme="yellow" display="flex" alignItems="center" gap={1}>
                                          <Icon as={Pin} boxSize={3} />
                                          {t('resources.labels.pinned', 'Pinned')}
                                        </Badge>
                                      )}
                                    </HStack>
                                  </VStack>
                                </HStack>

                                <HStack
                                  flexShrink={0}
                                  spacing={1}
                                  flexWrap={{ base: 'wrap', sm: 'nowrap' }}
                                  justify={{ base: 'flex-end', sm: 'flex-start' }}
                                >
                                  <IconButton
                                    size="sm"
                                    variant="ghost"
                                    minH="44px"
                                    minW="44px"
                                    icon={<Eye size={ICON_SIZE_MD} />}
                                    aria-label={t('resources.actions.viewFile', 'View file')}
                                    onClick={() => setViewerModal({ visible: true, file })}
                                  />
                                  {canDownload && (
                                    <IconButton
                                      size="sm"
                                      variant="ghost"
                                      minH="44px"
                                      minW="44px"
                                      icon={<Download size={ICON_SIZE_MD} />}
                                      aria-label={t('resources.actions.downloadFile', 'Download file')}
                                      onClick={() => {
                                        const url = resolveFileUrl(file)
                                        if (url) window.open(url, '_blank')
                                      }}
                                    />
                                  )}
                                  {isAdmin && (
                                    <>
                                      <IconButton
                                        size="sm"
                                        variant="ghost"
                                        minH="44px"
                                        minW="44px"
                                        icon={<Edit size={ICON_SIZE_MD} />}
                                        aria-label={t('resources.actions.editFile', 'Edit file')}
                                        onClick={() => openFileModal(file)}
                                      />
                                      <IconButton
                                        size="sm"
                                        variant="ghost"
                                        colorScheme="red"
                                        minH="44px"
                                        minW="44px"
                                        icon={<Trash size={ICON_SIZE_MD} />}
                                        aria-label={t('resources.actions.deleteFile', 'Delete file')}
                                        isLoading={deleteLoading[`file-${file.id}`]}
                                        onClick={async () => {
                                          if (
                                            !confirm(
                                              t(
                                                'common.confirmDelete',
                                                'Are you sure you want to delete this file?',
                                              ),
                                            )
                                          )
                                            return
                                          try {
                                            setDeleteLoading((prev) => ({ ...prev, [`file-${file.id}`]: true }))
                                            const token = getFreshestToken()
                                            await axiosInstance.delete(
                                              `${FILES_ENDPOINT}/${file.id}`,
                                              {
                                                headers: { Authorization: `Bearer ${token}` },
                                              },
                                            )
                                            await fetchResources()
                                            showFeedback(
                                              'success',
                                              t('resources.messages.fileDeleted', 'File deleted'),
                                            )
                                          } catch (error) {
                                            console.error('Error deleting file:', error)
                                            showFeedback(
                                              'error',
                                              t(
                                                'resources.messages.fileDeleteFailed',
                                                'Failed to delete file',
                                              ),
                                            )
                                          } finally {
                                            setDeleteLoading((prev) => ({ ...prev, [`file-${file.id}`]: false }))
                                          }
                                        }}
                                      />
                                    </>
                                  )}
                                </HStack>
                              </Stack>
                            </CardBody>
                          </StandardCard>
                        )
                      })}

                    {(resourceData?.files || []).filter((item) => passesFilters(item, 'files'))
                      .length === 0 && (
                      <Text textAlign="center" color={textMuted} py={8}>
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
      <Modal
        isOpen={categoryModal.visible}
        onClose={closeCategoryModal}
        size={{ base: 'full', md: 'lg', lg: 'xl' }}
        scrollBehavior="inside"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {categoryModal.isEdit
              ? t('resources.modals.editCategory', 'Edit Category')
              : t('resources.modals.newCategory', 'New Category')}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>{t('resources.fields.name', 'Name')}</FormLabel>
                <Input
                  value={categoryModal.form.name}
                  onChange={(e) =>
                    setCategoryModal((prev) => ({
                      ...prev,
                      form: { ...prev.form, name: e.target.value },
                    }))
                  }
                />
              </FormControl>

              <FormControl>
                <FormLabel>{t('resources.fields.description', 'Description')}</FormLabel>
                <Textarea
                  rows={3}
                  value={categoryModal.form.description}
                  onChange={(e) =>
                    setCategoryModal((prev) => ({
                      ...prev,
                      form: { ...prev.form, description: e.target.value },
                    }))
                  }
                />
              </FormControl>

              <FormControl>
                <FormLabel>{t('resources.fields.parentCategory', 'Parent Category')}</FormLabel>
                <Select
                  value={categoryModal.form.parentId}
                  onChange={(e) =>
                    setCategoryModal((prev) => ({
                      ...prev,
                      form: { ...prev.form, parentId: e.target.value },
                    }))
                  }
                >
                  <option value="">{t('resources.options.noParent', 'No Parent')}</option>
                  {parentCategoryOptions.map(({ id, name, level }) => (
                    <option key={id} value={id}>
                      {'\u00A0\u00A0'.repeat(level)}
                      {name}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>{t('resources.fields.color', 'Color')}</FormLabel>
                <HStack spacing={2}>
                  <Input
                    type="color"
                    value={categoryModal.form.color}
                    onChange={(e) =>
                      setCategoryModal((prev) => ({
                        ...prev,
                        form: { ...prev.form, color: e.target.value },
                      }))
                    }
                    w="80px"
                  />
                  <Input
                    type="text"
                    value={categoryModal.form.color}
                    onChange={(e) =>
                      setCategoryModal((prev) => ({
                        ...prev,
                        form: { ...prev.form, color: e.target.value },
                      }))
                    }
                    placeholder="#000000"
                    flex={1}
                  />
                </HStack>
              </FormControl>

              <FormControl>
                <FormLabel>{t('resources.fields.icon', 'Icon')}</FormLabel>
                <Select
                  value={categoryModal.form.icon}
                  onChange={(e) =>
                    setCategoryModal((prev) => ({
                      ...prev,
                      form: { ...prev.form, icon: e.target.value },
                    }))
                  }
                >
                  <option value="">{t('resources.fields.selectIcon', 'Select an icon...')}</option>
                  {ICON_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>{t('resources.fields.thumbnailUpload', 'Thumbnail Upload')}</FormLabel>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      const preview = URL.createObjectURL(file)
                      setCategoryModal((prev) => ({
                        ...prev,
                        form: {
                          ...prev.form,
                          pendingThumbnail: file,
                          pendingThumbnailPreview: preview,
                        },
                      }))
                    }
                  }}
                />
                {categoryModal.form.pendingThumbnailPreview && (
                  <Box mt={2}>
                    <AspectRatio ratio={16 / 9} maxW="300px">
                      <Image
                        src={categoryModal.form.pendingThumbnailPreview}
                        alt="Thumbnail preview"
                        objectFit="cover"
                        rounded="md"
                        border="1px solid"
                        borderColor="gray.200"
                      />
                    </AspectRatio>
                    <Text fontSize="sm" color="gray.500" mt={1}>
                      {t('resources.fields.pendingUpload', 'Will be uploaded when saved')}
                    </Text>
                  </Box>
                )}
              </FormControl>

              <FormControl>
                <FormLabel>{t('resources.fields.slug', 'Slug')}</FormLabel>
                <Input
                  value={categoryModal.form.slug}
                  onChange={(e) =>
                    setCategoryModal((prev) => ({
                      ...prev,
                      form: { ...prev.form, slug: e.target.value },
                    }))
                  }
                  placeholder={t('resources.fields.slugHelp', 'Used for URLs and quick references')}
                />
              </FormControl>

              <FormControl>
                <FormLabel>{t('resources.fields.sortOrder', 'Sort Order')}</FormLabel>
                <Input
                  type="number"
                  value={categoryModal.form.sortOrder}
                  onChange={(e) =>
                    setCategoryModal((prev) => ({
                      ...prev,
                      form: { ...prev.form, sortOrder: e.target.value },
                    }))
                  }
                />
              </FormControl>

              <FormControl display="flex" alignItems="center">
                <FormLabel mb="0">{t('resources.fields.active', 'Active')}</FormLabel>
                <Switch
                  isChecked={categoryModal.form.isActive}
                  onChange={(e) =>
                    setCategoryModal((prev) => ({
                      ...prev,
                      form: { ...prev.form, isActive: e.target.checked },
                    }))
                  }
                />
              </FormControl>

              <FormControl display="flex" alignItems="center">
                <FormLabel mb="0">{t('resources.fields.pinned', 'Pinned')}</FormLabel>
                <Switch
                  isChecked={categoryModal.form.isPinned}
                  onChange={(e) =>
                    setCategoryModal((prev) => ({
                      ...prev,
                      form: { ...prev.form, isPinned: e.target.checked },
                    }))
                  }
                />
              </FormControl>

              {categoryModal.form.isPinned && (
                <FormControl>
                  <FormLabel>{t('resources.fields.pinnedOrder', 'Pinned Order')}</FormLabel>
                  <Input
                    type="number"
                    value={categoryModal.form.pinnedOrder}
                    onChange={(e) =>
                      setCategoryModal((prev) => ({
                        ...prev,
                        form: { ...prev.form, pinnedOrder: e.target.value },
                      }))
                    }
                  />
                </FormControl>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={closeCategoryModal}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button colorScheme="brand" onClick={handleSaveCategory} isLoading={actionLoading}>
              {t('common.save', 'Save')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Link Modal */}
      <Modal
        isOpen={linkModal.visible}
        onClose={closeLinkModal}
        size={{ base: 'full', md: 'lg', lg: 'xl' }}
        scrollBehavior="inside"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {linkModal.isEdit
              ? t('resources.modals.editLink', 'Edit Link')
              : t('resources.modals.newLink', 'New Link')}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>{t('resources.fields.title', 'Title')}</FormLabel>
                <Input
                  value={linkModal.form.title}
                  onChange={(e) =>
                    setLinkModal((prev) => ({
                      ...prev,
                      form: { ...prev.form, title: e.target.value },
                    }))
                  }
                />
              </FormControl>

              <FormControl>
                <FormLabel>{t('resources.fields.url', 'URL')}</FormLabel>
                <Input
                  value={linkModal.form.url}
                  onChange={(e) =>
                    setLinkModal((prev) => ({
                      ...prev,
                      form: { ...prev.form, url: e.target.value },
                    }))
                  }
                  placeholder="https://example.com"
                />
              </FormControl>

              <FormControl>
                <FormLabel>{t('resources.fields.type', 'Type')}</FormLabel>
                <Select
                  value={linkModal.form.type}
                  onChange={(e) =>
                    setLinkModal((prev) => ({
                      ...prev,
                      form: { ...prev.form, type: e.target.value },
                    }))
                  }
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
                  onChange={(e) =>
                    setLinkModal((prev) => ({
                      ...prev,
                      form: { ...prev.form, description: e.target.value },
                    }))
                  }
                />
              </FormControl>

              <FormControl>
                <FormLabel>{t('resources.fields.category', 'Category')}</FormLabel>
                <Select
                  value={linkModal.form.categoryId}
                  onChange={(e) =>
                    setLinkModal((prev) => ({
                      ...prev,
                      form: { ...prev.form, categoryId: e.target.value },
                    }))
                  }
                >
                  <option value="">{t('resources.options.noCategory', 'No Category')}</option>
                  {flattenedCategories.map(({ id, name, level }) => (
                    <option key={id} value={id}>
                      {'\u00A0\u00A0'.repeat(level)}
                      {name}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>{t('resources.fields.thumbnailUrl', 'Thumbnail URL')}</FormLabel>
                <Input
                  value={linkModal.form.thumbnailUrl}
                  onChange={(e) =>
                    setLinkModal((prev) => ({
                      ...prev,
                      form: { ...prev.form, thumbnailUrl: e.target.value },
                    }))
                  }
                  placeholder="https://"
                />
              </FormControl>

              <FormControl>
                <FormLabel>{t('resources.fields.tags', 'Tags')}</FormLabel>
                <Input
                  value={linkModal.form.tags}
                  onChange={(e) =>
                    setLinkModal((prev) => ({
                      ...prev,
                      form: { ...prev.form, tags: e.target.value },
                    }))
                  }
                  placeholder="tag1, tag2"
                />
                <FormHelperText>{t('resources.fields.tagsHelp', 'Comma-separated tags')}</FormHelperText>
              </FormControl>

              <FormControl>
                <FormLabel>{t('resources.fields.ctaLabel', 'CTA Label')}</FormLabel>
                <Input
                  value={linkModal.form.ctaLabel}
                  onChange={(e) =>
                    setLinkModal((prev) => ({
                      ...prev,
                      form: { ...prev.form, ctaLabel: e.target.value },
                    }))
                  }
                />
              </FormControl>

              <FormControl>
                <FormLabel>{t('resources.fields.ctaUrl', 'CTA URL')}</FormLabel>
                <Input
                  value={linkModal.form.ctaUrl}
                  onChange={(e) =>
                    setLinkModal((prev) => ({
                      ...prev,
                      form: { ...prev.form, ctaUrl: e.target.value },
                    }))
                  }
                  placeholder="https://"
                />
              </FormControl>

              <FormControl>
                <FormLabel>{t('resources.fields.status', 'Status')}</FormLabel>
                <Select
                  value={linkModal.form.status}
                  onChange={(e) =>
                    setLinkModal((prev) => ({
                      ...prev,
                      form: { ...prev.form, status: e.target.value },
                    }))
                  }
                >
                  <option value="active">{t('resources.status.active', 'Active')}</option>
                  <option value="draft">{t('resources.status.draft', 'Draft')}</option>
                  <option value="archived">{t('resources.status.archived', 'Archived')}</option>
                </Select>
              </FormControl>

              <FormControl display="flex" alignItems="center">
                <FormLabel mb="0">{t('resources.fields.pinned', 'Pinned')}</FormLabel>
                <Switch
                  isChecked={linkModal.form.isPinned}
                  onChange={(e) =>
                    setLinkModal((prev) => ({
                      ...prev,
                      form: { ...prev.form, isPinned: e.target.checked },
                    }))
                  }
                />
              </FormControl>

              {linkModal.form.isPinned && (
                <FormControl>
                  <FormLabel>{t('resources.fields.pinnedOrder', 'Pinned Order')}</FormLabel>
                  <Input
                    type="number"
                    value={linkModal.form.pinnedOrder}
                    onChange={(e) =>
                      setLinkModal((prev) => ({
                        ...prev,
                        form: { ...prev.form, pinnedOrder: e.target.value },
                      }))
                    }
                  />
                </FormControl>
              )}

              <FormControl>
                <FormLabel>{t('resources.fields.visibility', 'Visibility')}</FormLabel>
                <VStack align="start" spacing={2}>
                  {GROUP_VISIBILITY_OPTIONS.map((option) => (
                    <Checkbox
                      key={option}
                      isChecked={linkModal.form.visibleToGroupTypes.includes(option)}
                      onChange={(e) => {
                        setLinkModal((prev) => ({
                          ...prev,
                          form: {
                            ...prev.form,
                            visibleToGroupTypes: e.target.checked
                              ? [...prev.form.visibleToGroupTypes, option]
                              : prev.form.visibleToGroupTypes.filter((v) => v !== option),
                          },
                        }))
                      }}
                    >
                      {t(`resources.visibility.${option}`, option)}
                    </Checkbox>
                  ))}
                </VStack>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={closeLinkModal}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              colorScheme="brand"
              onClick={async () => {
                try {
                  setActionLoading(true)
                  const token = getFreshestToken()
                  const payload = {
                    ...linkModal.form,
                    tags: normalizeTagsInput(linkModal.form.tags),
                    visibleToGroupTypes: normalizeVisibilityInput(
                      linkModal.form.visibleToGroupTypes,
                    ),
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
                  showFeedback(
                    'success',
                    t('resources.messages.linkSaved', 'Link saved successfully'),
                  )
                } catch (error) {
                  console.error('Error saving link:', error)
                  showFeedback(
                    'error',
                    t('resources.messages.linkSaveFailed', 'Failed to save link'),
                  )
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
      <Modal
        isOpen={fileModal.visible}
        onClose={closeFileModal}
        size={{ base: 'full', md: 'lg', lg: 'xl' }}
        scrollBehavior="inside"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {fileModal.isEdit
              ? t('resources.modals.editFile', 'Edit File')
              : t('resources.modals.newFile', 'New File')}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>{t('resources.fields.name', 'Name')}</FormLabel>
                <Input
                  value={fileModal.form.name}
                  onChange={(e) =>
                    setFileModal((prev) => ({
                      ...prev,
                      form: { ...prev.form, name: e.target.value },
                    }))
                  }
                />
              </FormControl>

              <FormControl>
                <FormLabel>{t('resources.fields.file', 'File')}</FormLabel>
                <Input
                  type="file"
                  onChange={(e) =>
                    setFileModal((prev) => ({
                      ...prev,
                      form: { ...prev.form, file: e.target.files[0] },
                    }))
                  }
                />
              </FormControl>

              <FormControl>
                <FormLabel>{t('resources.fields.description', 'Description')}</FormLabel>
                <Textarea
                  rows={3}
                  value={fileModal.form.description}
                  onChange={(e) =>
                    setFileModal((prev) => ({
                      ...prev,
                      form: { ...prev.form, description: e.target.value },
                    }))
                  }
                />
              </FormControl>

              <FormControl>
                <FormLabel>{t('resources.fields.category', 'Category')}</FormLabel>
                <Select
                  value={fileModal.form.categoryId}
                  onChange={(e) =>
                    setFileModal((prev) => ({
                      ...prev,
                      form: { ...prev.form, categoryId: e.target.value },
                    }))
                  }
                >
                  <option value="">{t('resources.options.noCategory', 'No Category')}</option>
                  {flattenedCategories.map(({ id, name, level }) => (
                    <option key={id} value={id}>
                      {'\u00A0\u00A0'.repeat(level)}
                      {name}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>{t('resources.fields.thumbnailUpload', 'Thumbnail Upload')}</FormLabel>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      const preview = URL.createObjectURL(file)
                      setFileModal((prev) => ({
                        ...prev,
                        form: {
                          ...prev.form,
                          pendingThumbnail: file,
                          pendingThumbnailPreview: preview,
                        },
                      }))
                    }
                  }}
                />
                {fileModal.form.pendingThumbnailPreview && (
                  <Box mt={2}>
                    <AspectRatio ratio={16 / 9} maxW="300px">
                      <Image
                        src={fileModal.form.pendingThumbnailPreview}
                        alt="Thumbnail preview"
                        objectFit="cover"
                        rounded="md"
                        border="1px solid"
                        borderColor="gray.200"
                      />
                    </AspectRatio>
                    <Text fontSize="sm" color="gray.500" mt={1}>
                      {t('resources.fields.pendingUpload', 'Will be uploaded when saved')}
                    </Text>
                  </Box>
                )}
              </FormControl>

              <FormControl>
                <FormLabel>{t('resources.fields.tags', 'Tags')}</FormLabel>
                <Input
                  value={fileModal.form.tags}
                  onChange={(e) =>
                    setFileModal((prev) => ({
                      ...prev,
                      form: { ...prev.form, tags: e.target.value },
                    }))
                  }
                  placeholder="tag1, tag2"
                />
                <FormHelperText>{t('resources.fields.tagsHelp', 'Comma-separated tags')}</FormHelperText>
              </FormControl>

              <FormControl>
                <FormLabel>{t('resources.fields.ctaLabel', 'CTA Label')}</FormLabel>
                <Input
                  value={fileModal.form.ctaLabel || ''}
                  onChange={(e) =>
                    setFileModal((prev) => ({
                      ...prev,
                      form: { ...prev.form, ctaLabel: e.target.value },
                    }))
                  }
                />
              </FormControl>

              <FormControl>
                <FormLabel>{t('resources.fields.ctaUrl', 'CTA URL')}</FormLabel>
                <Input
                  value={fileModal.form.ctaUrl}
                  onChange={(e) =>
                    setFileModal((prev) => ({
                      ...prev,
                      form: { ...prev.form, ctaUrl: e.target.value },
                    }))
                  }
                  placeholder="https://"
                />
              </FormControl>

              <FormControl>
                <FormLabel>{t('resources.fields.status', 'Status')}</FormLabel>
                <Select
                  value={fileModal.form.status}
                  onChange={(e) =>
                    setFileModal((prev) => ({
                      ...prev,
                      form: { ...prev.form, status: e.target.value },
                    }))
                  }
                >
                  <option value="active">{t('resources.status.active', 'Active')}</option>
                  <option value="draft">{t('resources.status.draft', 'Draft')}</option>
                  <option value="archived">{t('resources.status.archived', 'Archived')}</option>
                </Select>
              </FormControl>

              <FormControl display="flex" alignItems="center">
                <FormLabel mb="0">{t('resources.fields.pinned', 'Pinned')}</FormLabel>
                <Switch
                  isChecked={fileModal.form.isPinned}
                  onChange={(e) =>
                    setFileModal((prev) => ({
                      ...prev,
                      form: { ...prev.form, isPinned: e.target.checked },
                    }))
                  }
                />
              </FormControl>

              {fileModal.form.isPinned && (
                <FormControl>
                  <FormLabel>{t('resources.fields.pinnedOrder', 'Pinned Order')}</FormLabel>
                  <Input
                    type="number"
                    value={fileModal.form.pinnedOrder}
                    onChange={(e) =>
                      setFileModal((prev) => ({
                        ...prev,
                        form: { ...prev.form, pinnedOrder: e.target.value },
                      }))
                    }
                  />
                </FormControl>
              )}

              <FormControl>
                <FormLabel>{t('resources.fields.visibility', 'Visibility')}</FormLabel>
                <VStack align="start" spacing={2}>
                  {GROUP_VISIBILITY_OPTIONS.map((option) => (
                    <Checkbox
                      key={option}
                      isChecked={fileModal.form.visibleToGroupTypes.includes(option)}
                      onChange={(e) => {
                        setFileModal((prev) => ({
                          ...prev,
                          form: {
                            ...prev.form,
                            visibleToGroupTypes: e.target.checked
                              ? [...prev.form.visibleToGroupTypes, option]
                              : prev.form.visibleToGroupTypes.filter((v) => v !== option),
                          },
                        }))
                      }}
                    >
                      {t(`resources.visibility.${option}`, option)}
                    </Checkbox>
                  ))}
                </VStack>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={closeFileModal}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              colorScheme="brand"
              onClick={async () => {
                try {
                  setActionLoading(true)
                  const token = getFreshestToken()
                  const formData = new FormData()

                  // Add file if present
                  if (fileModal.form.file) {
                    formData.append('file', fileModal.form.file)
                  }

                  // Do NOT send thumbnail in main payload - it's uploaded via dedicated endpoint
                  const payload = {
                    name: fileModal.form.name || '',
                    description: fileModal.form.description || '',
                    category_id: fileModal.form.categoryId || '',
                    is_pinned: fileModal.form.isPinned ? 'true' : 'false',
                    pinned_order: fileModal.form.pinnedOrder ? String(fileModal.form.pinnedOrder) : '0',
                    tags: JSON.stringify(normalizeTagsInput(fileModal.form.tags)),
                    cta_label: fileModal.form.ctaLabel || '',
                    cta_url: fileModal.form.ctaUrl || '',
                    status: fileModal.form.status || 'active',
                    visible_to_group_types: JSON.stringify(fileModal.form.visibleToGroupTypes || ['admin']),
                    visible_to_group_ids: JSON.stringify(normalizeVisibilityInput(fileModal.form.visibleToGroupIds)),
                  }

                  Object.entries(payload).forEach(([key, value]) => {
                    formData.append(key, value)
                  })

                  let savedFileId = fileModal.form.id

                  if (fileModal.isEdit) {
                    await axiosInstance.put(`${FILES_ENDPOINT}/${fileModal.form.id}`, formData, {
                      headers: { 'Content-Type': 'multipart/form-data' },
                    })
                    showFeedback('success', t('resources.messages.fileUpdated', 'File updated successfully'))
                  } else {
                    const { data } = await axiosInstance.post(FILES_ENDPOINT, formData, {
                      headers: { 'Content-Type': 'multipart/form-data' },
                    })
                    savedFileId = data?.data?.id
                    showFeedback('success', t('resources.messages.fileUploaded', 'File uploaded successfully'))
                  }

                  // If a pending thumbnail exists, upload it now via separate endpoint
                  if (fileModal.form.pendingThumbnail && savedFileId) {
                    try {
                      const thumbnailFormData = new FormData()
                      thumbnailFormData.append('thumbnail', fileModal.form.pendingThumbnail)
                      await axiosInstance.post(`${FILES_ENDPOINT}/${savedFileId}/thumbnail`, thumbnailFormData, {
                        headers: { 'Content-Type': 'multipart/form-data' },
                      })
                      showFeedback('success', t('resources.messages.thumbnailUploaded', 'Thumbnail uploaded successfully'))
                    } catch (thumbnailError) {
                      console.error('Error uploading file thumbnail:', thumbnailError)
                      showFeedback('warning', t('resources.messages.thumbnailUploadFailed', 'Failed to upload thumbnail'))
                    }
                  }

                  await fetchResources()
                  closeFileModal()
                } catch (error) {
                  console.error('Error saving file:', error)
                  showFeedback(
                    'error',
                    t('resources.messages.fileSaveFailed', 'Failed to save file'),
                  )
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
      <Modal
        isOpen={announcementModal.visible}
        onClose={closeAnnouncementModal}
        size={{ base: 'full', md: 'lg', lg: 'xl' }}
        scrollBehavior="inside"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {announcementModal.isEdit
              ? t('resources.modals.editAnnouncement', 'Edit Announcement')
              : t('resources.modals.newAnnouncement', 'New Announcement')}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>{t('resources.fields.title', 'Title')}</FormLabel>
                <Input
                  value={announcementModal.form.title}
                  onChange={(e) =>
                    setAnnouncementModal((prev) => ({
                      ...prev,
                      form: { ...prev.form, title: e.target.value },
                    }))
                  }
                />
              </FormControl>

              <FormControl>
                <FormLabel>{t('resources.fields.summary', 'Summary')}</FormLabel>
                <Textarea
                  rows={2}
                  value={announcementModal.form.summary}
                  onChange={(e) =>
                    setAnnouncementModal((prev) => ({
                      ...prev,
                      form: { ...prev.form, summary: e.target.value },
                    }))
                  }
                />
              </FormControl>

              <FormControl>
                <FormLabel>{t('resources.fields.body', 'Body')}</FormLabel>
                <Textarea
                  rows={5}
                  value={announcementModal.form.body}
                  onChange={(e) =>
                    setAnnouncementModal((prev) => ({
                      ...prev,
                      form: { ...prev.form, body: e.target.value },
                    }))
                  }
                />
              </FormControl>

              <FormControl>
                <FormLabel>{t('resources.fields.category', 'Category')}</FormLabel>
                <Select
                  value={announcementModal.form.categoryId}
                  onChange={(e) =>
                    setAnnouncementModal((prev) => ({
                      ...prev,
                      form: { ...prev.form, categoryId: e.target.value },
                    }))
                  }
                >
                  <option value="">{t('resources.options.noCategory', 'No Category')}</option>
                  {flattenedCategories.map(({ id, name, level }) => (
                    <option key={id} value={id}>
                      {'\u00A0\u00A0'.repeat(level)}
                      {name}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>{t('resources.fields.status', 'Status')}</FormLabel>
                <Select
                  value={announcementModal.form.status}
                  onChange={(e) =>
                    setAnnouncementModal((prev) => ({
                      ...prev,
                      form: { ...prev.form, status: e.target.value },
                    }))
                  }
                >
                  <option value="published">{t('resources.status.published', 'Published')}</option>
                  <option value="draft">{t('resources.status.draft', 'Draft')}</option>
                  <option value="archived">{t('resources.status.archived', 'Archived')}</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>{t('resources.fields.publishAt', 'Publish At')}</FormLabel>
                <Input
                  type="datetime-local"
                  value={announcementModal.form.publishAt}
                  onChange={(e) =>
                    setAnnouncementModal((prev) => ({
                      ...prev,
                      form: { ...prev.form, publishAt: e.target.value },
                    }))
                  }
                />
                <FormHelperText>{t('resources.fields.dateTimeHelp', 'Times are in UTC timezone. Browser support varies.')}</FormHelperText>
              </FormControl>

              <FormControl>
                <FormLabel>{t('resources.fields.expireAt', 'Expire At')}</FormLabel>
                <Input
                  type="datetime-local"
                  value={announcementModal.form.expireAt}
                  onChange={(e) =>
                    setAnnouncementModal((prev) => ({
                      ...prev,
                      form: { ...prev.form, expireAt: e.target.value },
                    }))
                  }
                />
                <FormHelperText>{t('resources.fields.dateTimeHelp', 'Times are in UTC timezone. Browser support varies.')}</FormHelperText>
              </FormControl>

              <FormControl>
                <FormLabel>{t('resources.fields.ctaLabel', 'CTA Label')}</FormLabel>
                <Input
                  value={announcementModal.form.ctaLabel}
                  onChange={(e) =>
                    setAnnouncementModal((prev) => ({
                      ...prev,
                      form: { ...prev.form, ctaLabel: e.target.value },
                    }))
                  }
                />
              </FormControl>

              <FormControl>
                <FormLabel>{t('resources.fields.ctaUrl', 'CTA URL')}</FormLabel>
                <Input
                  value={announcementModal.form.ctaUrl}
                  onChange={(e) =>
                    setAnnouncementModal((prev) => ({
                      ...prev,
                      form: { ...prev.form, ctaUrl: e.target.value },
                    }))
                  }
                  placeholder="https://"
                />
              </FormControl>

              <FormControl display="flex" alignItems="center">
                <FormLabel mb="0">{t('resources.fields.pinned', 'Pinned')}</FormLabel>
                <Switch
                  isChecked={announcementModal.form.isPinned}
                  onChange={(e) =>
                    setAnnouncementModal((prev) => ({
                      ...prev,
                      form: { ...prev.form, isPinned: e.target.checked },
                    }))
                  }
                />
              </FormControl>

              {announcementModal.form.isPinned && (
                <FormControl>
                  <FormLabel>{t('resources.fields.pinnedOrder', 'Pinned Order')}</FormLabel>
                  <Input
                    type="number"
                    value={announcementModal.form.pinnedOrder}
                    onChange={(e) =>
                      setAnnouncementModal((prev) => ({
                        ...prev,
                        form: { ...prev.form, pinnedOrder: e.target.value },
                      }))
                    }
                  />
                </FormControl>
              )}

              <FormControl>
                <FormLabel>{t('resources.fields.visibility', 'Visibility')}</FormLabel>
                <VStack align="start" spacing={2}>
                  {GROUP_VISIBILITY_OPTIONS.map((option) => (
                    <Checkbox
                      key={option}
                      isChecked={announcementModal.form.visibleToGroupTypes.includes(option)}
                      onChange={(e) => {
                        setAnnouncementModal((prev) => ({
                          ...prev,
                          form: {
                            ...prev.form,
                            visibleToGroupTypes: e.target.checked
                              ? [...prev.form.visibleToGroupTypes, option]
                              : prev.form.visibleToGroupTypes.filter((v) => v !== option),
                          },
                          }))
                        }}
                      >
                        {t(`resources.visibility.${option}`, option)}
                      </Checkbox>
                  ))}
                </VStack>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={closeAnnouncementModal}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              colorScheme="brand"
              onClick={async () => {
                try {
                  setActionLoading(true)
                  const token = getFreshestToken()
                  const payload = {
                    ...announcementModal.form,
                    tags: normalizeTagsInput(announcementModal.form.tags),
                    visibleToGroupTypes: normalizeVisibilityInput(
                      announcementModal.form.visibleToGroupTypes,
                    ),
                    publishAt: toISOStringOrNull(announcementModal.form.publishAt),
                    expireAt: toISOStringOrNull(announcementModal.form.expireAt),
                  }

                  if (announcementModal.isEdit) {
                    await axiosInstance.put(
                      `${ANNOUNCEMENTS_ENDPOINT}/${announcementModal.form.id}`,
                      payload,
                      {
                        headers: { Authorization: `Bearer ${token}` },
                      },
                    )
                  } else {
                    await axiosInstance.post(ANNOUNCEMENTS_ENDPOINT, payload, {
                      headers: { Authorization: `Bearer ${token}` },
                    })
                  }

                  await fetchResources()
                  closeAnnouncementModal()
                  showFeedback(
                    'success',
                    t('resources.messages.announcementSaved', 'Announcement saved successfully'),
                  )
                } catch (error) {
                  console.error('Error saving announcement:', error)
                  showFeedback(
                    'error',
                    t('resources.messages.announcementSaveFailed', 'Failed to save announcement'),
                  )
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
    </PageContainer>
  )
}

export default withContractorScope(Resources, 'resources')
