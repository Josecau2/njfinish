import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import axiosInstance from '../../helpers/axiosInstance'
import { getFreshestToken } from '../../utils/authToken'
import { getContrastColor } from '../../utils/colorUtils'
import {
  Alert,
  Badge,
  Card,
  CardBody,
  CardHeader,
  Box,
  Container,
  FormControl,
  Input,
  Select,
  Switch,
  Textarea,
  FormLabel,
  Flex,
  Link,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalCloseButton,
  Spinner,
  Button,
  Icon,
  Text,
  Heading,
  VStack,
  HStack,
  Divider,
  List,
  ListItem
} from '@chakra-ui/react'
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
  Map,
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
  Shield
} from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import withContractorScope from '../../components/withContractorScope'
import FileViewerModal from '../../components/FileViewerModal'

const LINK_TYPE_OPTIONS = [
  { value: 'external', icon: LinkIcon, color: 'blue', key: 'resources.linkType.external' },
  { value: 'internal', icon: Folder, color: 'green', key: 'resources.linkType.internal' },
  { value: 'document', icon: FileText, color: 'blue', key: 'resources.linkType.document' },
  { value: 'video', icon: Video, color: 'purple', key: 'resources.linkType.video' },
  { value: 'help', icon: ListIcon, color: 'orange', key: 'resources.linkType.help' },
]

const FILE_TYPE_META = {
  pdf: { color: 'red', icon: FileText, key: 'resources.fileType.pdf' },
  spreadsheet: { color: 'green', icon: FileText, key: 'resources.fileType.spreadsheet' },
  document: { color: 'blue', icon: FileText, key: 'resources.fileType.document' },
  video: { color: 'purple', icon: Video, key: 'resources.fileType.video' },
  audio: { color: 'gray', icon: FileText, key: 'resources.fileType.audio' },
  image: { color: 'blue', icon: FileText, key: 'resources.fileType.image' },
  archive: { color: 'gray', icon: FileText, key: 'resources.fileType.archive' },
  other: { color: 'gray', icon: FileText, key: 'resources.fileType.other' },
}

const GROUP_VISIBILITY_OPTIONS = ['admin', 'contractor']

const ICON_OPTIONS = [
  { value: 'folder', icon: Folder, label: 'Folder' },
  { value: 'book', icon: Book, label: 'Book' },
  { value: 'bookmark', icon: Bookmark, label: 'Bookmark' },
  { value: 'briefcase', icon: Briefcase, label: 'Briefcase' },
  { value: 'building', icon: Building, label: 'Building' },
  { value: 'video', icon: Video, label: 'Video' },
  { value: 'camera', icon: Camera, label: 'Camera' },
  { value: 'code', icon: Code, label: 'Code' },
  { value: 'download', icon: Download, label: 'Download' },
  { value: 'settings', icon: Settings, label: 'Settings' },
  { value: 'file', icon: File, label: 'File' },
  { value: 'mail', icon: Mail, label: 'Email' },
  { value: 'globe', icon: Globe, label: 'Globe' },
  { value: 'heart', icon: Heart, label: 'Heart' },
  { value: 'home', icon: Home, label: 'Home' },
  { value: 'info', icon: Info, label: 'Info' },
  { value: 'laptop', icon: Laptop, label: 'Laptop' },
  { value: 'lightbulb', icon: Lightbulb, label: 'Lightbulb' },
  { value: 'map', icon: Map, label: 'Map' },
  { value: 'shield', icon: Shield, label: 'Shield' },
  { value: 'phone', icon: Phone, label: 'Phone' },
  { value: 'star', icon: Star, label: 'Star' },
  { value: 'tag', icon: Tag, label: 'Tag' },
  { value: 'user', icon: User, label: 'User' },
  { value: 'wallet', icon: Wallet, label: 'Wallet' },
]

// Helper functions
const flattenCategories = (categories = [], level = 0, list = []) => {
  categories.forEach((category) => {
    list.push({ ...category, level })
    if (category.children && category.children.length > 0) {
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
      if (node.children && node.children.length > 0) {
        traverse(node.children, node.id)
      }
    })
  }
  traverse(categories)
  return map
}

const normalizeTagsInput = (value) => {
  if (!value || typeof value !== 'string') return []
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
}

const serializeTags = (tags) => (Array.isArray(tags) && tags.length ? tags.join(', ') : '')

const normalizeVisibilityInput = (value) => {
  if (!value || typeof value !== 'string') return ['admin']
  return value
    .split(',')
    .map((type) => type.trim())
    .filter((type) => GROUP_VISIBILITY_OPTIONS.includes(type))
}

const formatDateTimeForInput = (value) => {
  const date = new Date(value)
  const pad = (num) => `${num}`.padStart(2, '0')
  return (
    `${date.getFullYear()}-` +
    `${pad(date.getMonth() + 1)}-` +
    `${pad(date.getDate())}T` +
    `${pad(date.getHours())}:` +
    `${pad(date.getMinutes())}`
  )
}

const Resources = ({ isContractor, contractorGroupName }) => {
  const { t } = useTranslation()
  const customization = useSelector((state) => state.customization)
  const isAdmin = !isContractor

  // State management
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [scaffoldLoading, setScaffoldLoading] = useState(false)
  const [categories, setCategories] = useState([])
  const [resources, setResources] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [activeView, setActiveView] = useState('categories')
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [fileViewerModal, setFileViewerModal] = useState({ isOpen: false, file: null })

  // Modal states
  const [categoryModal, setCategoryModal] = useState({
    isOpen: false,
    mode: 'create',
    form: {
      name: '',
      description: '',
      parentId: '',
      icon: 'folder',
      isVisible: true,
      visibleToGroupTypes: ['admin'],
      visibleToGroupIds: '',
      tags: '',
      sortOrder: 0,
    },
  })

  const [resourceModal, setResourceModal] = useState({
    isOpen: false,
    mode: 'create',
    form: {
      title: '',
      description: '',
      type: 'external',
      url: '',
      categoryId: '',
      isVisible: true,
      visibleToGroupTypes: ['admin'],
      visibleToGroupIds: '',
      tags: '',
      sortOrder: 0,
    },
  })

  const [announcementModal, setAnnouncementModal] = useState({
    isOpen: false,
    mode: 'create',
    form: {
      title: '',
      content: '',
      ctaText: '',
      ctaUrl: '',
      isVisible: true,
      visibleToGroupTypes: ['admin'],
      visibleToGroupIds: '',
      expiresAt: '',
    },
  })

  // Computed values
  const accentColor = customization?.primaryColor || '#0d6efd'
  const FolderIcon = Folder
  const headerSubtitle = isContractor
    ? t(
        'resources.headerContractor',
        { group: contractorGroupName || '' },
        `Resources for ${contractorGroupName || 'your group'}`,
      )
    : t('resources.headerAdmin', 'Manage resources and documentation')

  // API functions
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const token = getFreshestToken()
      const [categoriesRes, resourcesRes, announcementsRes] = await Promise.all([
        axiosInstance.get('/api/resource-categories', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axiosInstance.get('/api/resources', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axiosInstance.get('/api/announcements', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      setCategories(categoriesRes.data?.data || [])
      setResources(resourcesRes.data?.data || [])
      setAnnouncements(announcementsRes.data?.data || [])
    } catch (error) {
      console.error('Error fetching resources data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Event handlers
  const handleCreateCategoryScaffold = async () => {
    setScaffoldLoading(true)
    try {
      const token = getFreshestToken()
      await axiosInstance.post('/api/resource-categories/scaffold', {}, {
        headers: { Authorization: `Bearer ${token}` },
      })
      await fetchData()
    } catch (error) {
      console.error('Error creating category scaffold:', error)
    } finally {
      setScaffoldLoading(false)
    }
  }

  const closeCategoryModal = () => {
    setCategoryModal({
      isOpen: false,
      mode: 'create',
      form: {
        name: '',
        description: '',
        parentId: '',
        icon: 'folder',
        isVisible: true,
        visibleToGroupTypes: ['admin'],
        visibleToGroupIds: '',
        tags: '',
        sortOrder: 0,
      },
    })
  }

  const closeResourceModal = () => {
    setResourceModal({
      isOpen: false,
      mode: 'create',
      form: {
        title: '',
        description: '',
        type: 'external',
        url: '',
        categoryId: '',
        isVisible: true,
        visibleToGroupTypes: ['admin'],
        visibleToGroupIds: '',
        tags: '',
        sortOrder: 0,
      },
    })
  }

  const closeAnnouncementModal = () => {
    setAnnouncementModal({
      isOpen: false,
      mode: 'create',
      form: {
        title: '',
        content: '',
        ctaText: '',
        ctaUrl: '',
        isVisible: true,
        visibleToGroupTypes: ['admin'],
        visibleToGroupIds: '',
        expiresAt: '',
      },
    })
  }

  // Filtered data
  const filteredCategories = useMemo(() => {
    if (!searchQuery) return categories
    return categories.filter((category) =>
      category.name.toLowerCase().includes(searchQuery.toLowerCase()),
    )
  }, [categories, searchQuery])

  const filteredResources = useMemo(() => {
    if (!searchQuery) return resources
    return resources.filter((resource) =>
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()),
    )
  }, [resources, searchQuery])

  const filteredAnnouncements = useMemo(() => {
    if (!searchQuery) return announcements
    return announcements.filter((announcement) =>
      announcement.title.toLowerCase().includes(searchQuery.toLowerCase()),
    )
  }, [announcements, searchQuery])

  return (
    <Container maxW="container.xl" className="resources-page" p={6}>
      <PageHeader
        title={t('nav.resources', 'Resources')}
        subtitle={headerSubtitle}
        icon={FolderIcon}
        rightContent={
          isAdmin && (
            <HStack spacing={2}>
              <Button
                colorScheme="brand"
                size="sm"
                onClick={handleCreateCategoryScaffold}
                isLoading={scaffoldLoading}
                leftIcon={<Icon as={Folder} />}
              >
                {t('resources.actions.scaffoldCategories', 'Create Starter Categories')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCategoryModal({ ...categoryModal, isOpen: true })}
                leftIcon={<Icon as={Plus} />}
              >
                {t('resources.actions.addCategory', 'Add Category')}
              </Button>
            </HStack>
          )
        }
      />

      {loading ? (
        <Flex justify="center" align="center" h="200px">
          <Spinner size="lg" />
        </Flex>
      ) : (
        <VStack spacing={6} align="stretch">
          {/* Search */}
          <FormControl>
            <Input
              placeholder={t('resources.search.placeholder', 'Search resources...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftElement={<Icon as={Search} />}
            />
          </FormControl>

          {/* Categories */}
          <Card>
            <CardHeader>
              <Heading size="md">{t('resources.categories.title', 'Categories')}</Heading>
            </CardHeader>
            <CardBody>
              {filteredCategories.length === 0 ? (
                <Text color="gray.500">
                  {t('resources.categories.empty', 'No categories found')}
                </Text>
              ) : (
                <List spacing={2}>
                  {filteredCategories.map((category) => (
                    <ListItem key={category.id}>
                      <HStack justify="space-between">
                        <HStack>
                          <Icon as={Folder} />
                          <Text>{category.name}</Text>
                          {category.description && (
                            <Text fontSize="sm" color="gray.500">
                              - {category.description}
                            </Text>
                          )}
                        </HStack>
                        {isAdmin && (
                          <HStack>
                            <Button size="xs" variant="ghost">
                              <Icon as={Edit} />
                            </Button>
                            <Button size="xs" variant="ghost" colorScheme="red">
                              <Icon as={Trash} />
                            </Button>
                          </HStack>
                        )}
                      </HStack>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardBody>
          </Card>

          {/* Resources */}
          <Card>
            <CardHeader>
              <HStack justify="space-between">
                <Heading size="md">{t('resources.items.title', 'Resources')}</Heading>
                {isAdmin && (
                  <Button
                    size="sm"
                    onClick={() => setResourceModal({ ...resourceModal, isOpen: true })}
                    leftIcon={<Icon as={Plus} />}
                  >
                    {t('resources.actions.addResource', 'Add Resource')}
                  </Button>
                )}
              </HStack>
            </CardHeader>
            <CardBody>
              {filteredResources.length === 0 ? (
                <Text color="gray.500">
                  {t('resources.items.empty', 'No resources found')}
                </Text>
              ) : (
                <List spacing={2}>
                  {filteredResources.map((resource) => (
                    <ListItem key={resource.id}>
                      <HStack justify="space-between">
                        <HStack>
                          <Icon as={FileText} />
                          <Link href={resource.url} isExternal>
                            {resource.title}
                          </Link>
                          {resource.description && (
                            <Text fontSize="sm" color="gray.500">
                              - {resource.description}
                            </Text>
                          )}
                        </HStack>
                        {isAdmin && (
                          <HStack>
                            <Button size="xs" variant="ghost">
                              <Icon as={Edit} />
                            </Button>
                            <Button size="xs" variant="ghost" colorScheme="red">
                              <Icon as={Trash} />
                            </Button>
                          </HStack>
                        )}
                      </HStack>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardBody>
          </Card>

          {/* Announcements */}
          <Card>
            <CardHeader>
              <HStack justify="space-between">
                <Heading size="md">{t('resources.announcements.title', 'Announcements')}</Heading>
                {isAdmin && (
                  <Button
                    size="sm"
                    onClick={() => setAnnouncementModal({ ...announcementModal, isOpen: true })}
                    leftIcon={<Icon as={Plus} />}
                  >
                    {t('resources.actions.addAnnouncement', 'Add Announcement')}
                  </Button>
                )}
              </HStack>
            </CardHeader>
            <CardBody>
              {filteredAnnouncements.length === 0 ? (
                <Text color="gray.500">
                  {t('resources.announcements.empty', 'No announcements found')}
                </Text>
              ) : (
                <VStack spacing={4} align="stretch">
                  {filteredAnnouncements.map((announcement) => (
                    <Alert key={announcement.id} status="info">
                      <VStack align="start" spacing={2}>
                        <Text fontWeight="bold">{announcement.title}</Text>
                        <Text>{announcement.content}</Text>
                        {announcement.ctaText && announcement.ctaUrl && (
                          <Link href={announcement.ctaUrl} isExternal>
                            {announcement.ctaText}
                          </Link>
                        )}
                      </VStack>
                    </Alert>
                  ))}
                </VStack>
              )}
            </CardBody>
          </Card>
        </VStack>
      )}

      {/* File Viewer Modal */}
      <FileViewerModal
        isOpen={fileViewerModal.isOpen}
        onClose={() => setFileViewerModal({ isOpen: false, file: null })}
        file={fileViewerModal.file}
      />
    </Container>
  )
}

export default withContractorScope(Resources, 'resources')