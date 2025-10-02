import { useState, useEffect, useMemo, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { fetchDashboardCounts, fetchLatestProposals } from '../../store/slices/dashboardSlice'
import { useTranslation } from 'react-i18next'
import { getFreshestToken } from '../../utils/authToken'
import { Badge, Box, Button, CardBody, Flex, HStack, Icon, List, ListItem, SimpleGrid, Spinner, Stack, Text } from '@chakra-ui/react'
import PageContainer from '../../components/PageContainer'
import StandardCard from '../../components/StandardCard'
import { useNavigate } from 'react-router-dom'
import axiosInstance from '../../helpers/axiosInstance'
import ContractorDashboard from '../contractor/ContractorDashboard'
import PageHeader from '../../components/PageHeader'
import {
  ClipboardCheck,
  ClipboardList,
  ExternalLink,
  File as FileIcon,
  FileSpreadsheet,
  FileText,
  HelpCircle,
  Link2,
  Newspaper,
  Video,
} from 'lucide-react'
import { ICON_SIZE_MD, ICON_BOX_MD } from '../../constants/iconSizes'

const modernCardStyle = {
  borderRadius: '16px',
  border: 'none',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  cursor: 'pointer',
  overflow: 'hidden',
  position: 'relative',
}

const hoverStyle = {
  transform: 'translateY(-4px)',
  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
}

const fileIconMap = {
  pdf: FileText,
  doc: FileText,
  docx: FileText,
  word: FileText,
  excel: FileSpreadsheet,
  xls: FileSpreadsheet,
  xlsx: FileSpreadsheet,
  video: Video,
}

const linkIconMap = {
  external: ExternalLink,
  internal: Link2,
  document: FileText,
  help: HelpCircle,
}

const Dashboard = () => {
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}')
    } catch (error) {
      console.warn('Failed to parse user from localStorage', error)
      return {}
    }
  }, [])

  const isContractor = user?.group?.group_type === 'contractor'

  if (isContractor) {
    return <ContractorDashboard />
  }

  const { t } = useTranslation()
  const activeProposals = useSelector((state) => state.dashboard.activeProposals)
  const activeOrders = useSelector((state) => state.dashboard.activeOrders)
  const latestProposals = useSelector((state) => state.dashboard.latestProposals || [])
  const [displayedProposals, setDisplayedProposals] = useState(0)
  const [displayedOrders, setDisplayedOrders] = useState(0)
  const [hoveredCard, setHoveredCard] = useState(null)
  const [resourceLinks, setResourceLinks] = useState([])
  const [resourceFiles, setResourceFiles] = useState([])
  const navigate = useNavigate()

  const dispatch = useDispatch()

  const productUpdates = []

  useEffect(() => {
    let cancelled = false

    const kickoff = async () => {
      let token = getFreshestToken()
      if (!token) {
        for (let attempt = 0; attempt < 6 && !token; attempt += 1) {
          // Roughly 150ms backoff window to wait for token hydration
          // eslint-disable-next-line no-await-in-loop
          await new Promise((resolve) => setTimeout(resolve, 25))
          token = getFreshestToken()
        }
      }

      if (!cancelled && token) {
        dispatch(fetchDashboardCounts())
        dispatch(fetchLatestProposals())
      }
    }

    kickoff()

    return () => {
      cancelled = true
    }
  }, [dispatch])

  useEffect(() => {
    const timer = setTimeout(() => {
      const token = getFreshestToken()
      if (token) {
        fetchLinks()
        fetchFiles()
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  const fetchLinks = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/api/resources/links')
      if (response.data.success) {
        setResourceLinks(response.data.data || [])
      }
    } catch (error) {
      console.warn('Failed to load resource links', error)
    }
  }, [])

  const fetchFiles = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/api/resources/files')
      if (response.data.success) {
        setResourceFiles(response.data.data || [])
      }
    } catch (error) {
      console.warn('Failed to load resource files', error)
    }
  }, [])

  useEffect(() => {
    let interval = null
    if (typeof activeProposals === 'number' && activeProposals > 0) {
      interval = setInterval(() => {
        setDisplayedProposals((prev) => {
          if (prev < activeProposals) {
            return prev + 1
          }
          clearInterval(interval)
          return prev
        })
      }, 50)
    } else if (activeProposals === 0) {
      setDisplayedProposals(0)
    }

    return () => clearInterval(interval)
  }, [activeProposals])

  useEffect(() => {
    let interval = null
    if (typeof activeOrders === 'number' && activeOrders > 0) {
      interval = setInterval(() => {
        setDisplayedOrders((prev) => {
          if (prev < activeOrders) {
            return prev + 1
          }
          clearInterval(interval)
          return prev
        })
      }, 50)
    } else if (activeOrders === 0) {
      setDisplayedOrders(0)
    }

    return () => clearInterval(interval)
  }, [activeOrders])

  const handleCreateProposal = useCallback(() => {
    navigate('/quotes/create')
  }, [navigate])

  const handleCreateQuickProposal = useCallback(() => {
    navigate('/quotes/create?quick=yes')
  }, [navigate])

  const handleViewAllProposals = useCallback(() => {
    navigate('/quotes')
  }, [navigate])

  const getStatusColor = useCallback((status) => {
    switch (status) {
      case 'active':
      case 'approved':
        return 'green'
      case 'pending':
      case 'in-review':
        return 'yellow'
      case 'draft':
        return 'blue'
      case 'completed':
        return 'purple'
      default:
        return 'gray'
    }
  }, [])

  const translateStatus = useCallback((status) => {
    if (!status) return ''
    const normalizedStatus = status.toLowerCase().replace(/\s+/g, '')

    const statusMap = {
      draft: 'draft',
      sent: 'sent',
      accepted: 'accepted',
      rejected: 'rejected',
      expired: 'expired',
      proposaldone: 'proposalDone',
      measurementscheduled: 'measurementScheduled',
      measurementdone: 'measurementDone',
      designdone: 'designDone',
      followup1: 'followUp1',
      followup2: 'followUp2',
      followup3: 'followUp3',
      proposalaccepted: 'proposalAccepted',
      proposalrejected: 'proposalRejected',
    }

    const translationKey = statusMap[normalizedStatus] || normalizedStatus
    return t(`status.${translationKey}`, status)
  }, [t])

  const getFileIcon = useCallback((type) => {
    const IconComponent = fileIconMap[type?.toLowerCase()] || FileIcon
    return <Icon as={IconComponent} boxSize={ICON_BOX_MD} color="blue.500" />
  }, [])

  const getLinkIcon = useCallback((type) => {
    const IconComponent = linkIconMap[type?.toLowerCase()] || Link2
    return <Icon as={IconComponent} boxSize={ICON_BOX_MD} color="blue.500" />
  }, [])

  const proposalStatLoading = typeof activeProposals !== 'number'
  const ordersStatLoading = typeof activeOrders !== 'number'

  const statCards = [
    {
      id: 'proposals',
      label: t('dashboard.activeProposals'),
      value: displayedProposals,
      loading: proposalStatLoading,
      icon: ClipboardList,
      accent: 'blue.500',
    },
    {
      id: 'orders',
      label: t('dashboard.activeOrders'),
      value: displayedOrders,
      loading: ordersStatLoading,
      icon: ClipboardCheck,
      accent: 'green.500',
    },
  ]

  return (
    <PageContainer>
      <Stack spacing={6}>
        <PageHeader
          title={t('dashboard.title', 'Dashboard')}
          actions={[
            <Button
              key="new"
              colorScheme="brand"
              onClick={handleCreateProposal}
            >
              {t('dashboard.newProposal')}
            </Button>,
            <Button
              key="quick"
              colorScheme="green"
              onClick={handleCreateQuickProposal}
            >
              {t('dashboard.quickProposal')}
            </Button>,
          ]}
        />

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
          {statCards.map(({ id, label, value, loading, icon, accent }) => (
            <StandardCard
              key={id}
              sx={{ ...modernCardStyle, ...(hoveredCard === id ? hoverStyle : {}) }}
              onMouseEnter={() => setHoveredCard(id)}
              onMouseLeave={() => setHoveredCard(null)}
              role="group"
            >
              <CardBody>
                <Flex justify="space-between" align="center">
                  <HStack spacing={4} align="center">
                    <Flex
                      align="center"
                      justify="center"
                      w={12}
                      h={12}
                      borderRadius="full"
                      bg={`${accent}20`}
                      color={accent}
                    >
                      <Icon as={icon} boxSize={6} />
                    </Flex>
                    <Text fontSize="md" color="gray.600" fontWeight="medium">
                      {label}
                    </Text>
                  </HStack>
                  <Text
                    fontSize="3xl"
                    fontWeight="bold"
                    color="gray.800"
                    aria-live="polite"
                    aria-atomic="true"
                  >
                    {loading ? <Spinner size="sm" color={accent} /> : value}
                  </Text>
                </Flex>
              </CardBody>
            </StandardCard>
          ))}
        </SimpleGrid>

        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
          <StandardCard>
            <CardBody>
              <HStack justify="space-between" mb={4}>
                <HStack spacing={4}>
                  <Icon as={Newspaper} boxSize={6} color="purple.500" />
                  <Text fontSize="lg" fontWeight="semibold">
                    {t('dashboard.latestProductUpdates')}
                  </Text>
                </HStack>
              </HStack>

              {productUpdates.length > 0 ? (
                <List spacing={4}>
                  {productUpdates.map((update) => (
                    <ListItem key={update.id}>
                      <Flex justify="space-between" align="center" gap={4}>
                        <Box>
                          <Text fontWeight="semibold">{update.title}</Text>
                          <Text fontSize="sm" color="gray.500">
                            {update.date}
                          </Text>
                        </Box>
                        <Badge colorScheme={getStatusColor(update.status)}>
                          {translateStatus(update.status)}
                        </Badge>
                      </Flex>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box textAlign="center" py={8} color="gray.500">
                  {t('dashboard.noProductUpdates')}
                </Box>
              )}
            </CardBody>
          </StandardCard>

          <StandardCard>
            <CardBody>
              <HStack spacing={4} mb={4}>
                <Icon as={Link2} boxSize={6} color="blue.500" />
                <Text fontSize="lg" fontWeight="semibold">
                  {t('dashboard.quickLinks')}
                </Text>
              </HStack>

              {resourceLinks.length > 0 ? (
                <List spacing={4}>
                  {resourceLinks.map((link) => (
                    <ListItem key={link.id}>
                      <HStack align="flex-start" spacing={4}>
                        {getLinkIcon(link.type)}
                        <Box>
                          <Text fontWeight="medium">{link.title}</Text>
                          <Button
                            as="a"
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            variant="link"
                            colorScheme="brand"
                            fontSize="sm"
                            wordBreak="break-all"
                          >
                            {link.url}
                          </Button>
                        </Box>
                      </HStack>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box textAlign="center" py={8} color="gray.500">
                  {t('dashboard.noQuickLinks', 'No quick links yet')}
                </Box>
              )}
            </CardBody>
          </StandardCard>
        </SimpleGrid>

        <SimpleGrid columns={{ base: 1, xl: 3 }} spacing={6}>
          <StandardCard>
            <CardBody>
              <HStack spacing={4} mb={4}>
                <Icon as={FileIcon} boxSize={6} color="orange.500" />
                <Text fontSize="lg" fontWeight="semibold">
                  {t('dashboard.recentFiles')}
                </Text>
              </HStack>

              {resourceFiles.length > 0 ? (
                <List spacing={4}>
                  {resourceFiles.map((file) => (
                    <ListItem key={file.id}>
                      <HStack align="flex-start" spacing={4}>
                        {getFileIcon(file.type)}
                        <Box>
                          <Text fontWeight="medium" fontSize="sm" wordBreak="break-all">
                            {file.name}
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            {file.size} | {file.date}
                          </Text>
                        </Box>
                      </HStack>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box textAlign="center" py={8} color="gray.500">
                  {t('dashboard.noRecentFiles', 'No files uploaded yet')}
                </Box>
              )}
            </CardBody>
          </StandardCard>

          <StandardCard gridColumn={{ base: 'span 1', xl: 'span 2' }}>
            <CardBody>
              <HStack spacing={4} mb={4}>
                <Icon as={ClipboardList} boxSize={6} color="teal.500" />
                <Text fontSize="lg" fontWeight="semibold">
                  {t('dashboard.myLatestProposals')}
                </Text>
              </HStack>

              {latestProposals.length > 0 ? (
                <List spacing={4}>
                  {latestProposals.slice(0, 5).map((proposal) => (
                    <ListItem key={proposal.id}>
                      <Flex justify="space-between" align="flex-start" gap={4}>
                        <Box>
                          <Text fontWeight="medium" fontSize="sm" wordBreak="break-word">
                            {proposal.description || t('dashboard.noDescription', 'No description')}
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            {new Date(proposal.createdAt).toLocaleDateString()}
                          </Text>
                        </Box>
                        <Badge colorScheme={getStatusColor(proposal.status)}>
                          {translateStatus(proposal.status)}
                        </Badge>
                      </Flex>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box textAlign="center" py={8} color="gray.500">
                  {t('dashboard.noRecentProposals', 'No proposals yet')}
                </Box>
              )}

              <Box textAlign="center" mt={4}>
                <Button variant="outline" colorScheme="gray" onClick={handleViewAllProposals}>
                  {t('dashboard.viewAllProposals')}
                </Button>
              </Box>
            </CardBody>
          </StandardCard>
        </SimpleGrid>
      </Stack>
    </PageContainer>
  )
}

export default Dashboard
