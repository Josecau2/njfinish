import StandardCard from '../../../components/StandardCard'
import { TableCard } from '../../../components/TableCard'
import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { buildEncodedPath, genNoise } from '../../../utils/obfuscate'
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Alert,
  Badge,
  Box,
  Button,
  ButtonGroup,
  CardBody,
  CardHeader,
  Divider,
  Flex,
  Heading,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
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
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tooltip,
  Tr,
  useColorModeValue,
  VStack,
} from '@chakra-ui/react'
import EmptyState from '../../../components/common/EmptyState'
import { notifyError } from '../../../helpers/notify'
import {
  Search,
  BriefcaseBusiness,
  Calendar,
  User,
  MapPin,
  ExternalLink,
  Clipboard,
  History,
  CheckCircle,
  XCircle,
  Clock,
  Info,
  Send,
  ChevronUp,
  ChevronDown,
} from 'lucide-react'
import {
  fetchContractorProposals,
  fetchProposalDetails,
  clearProposalDetails,
} from '../../../store/slices/contractorSlice'
import PaginationComponent from '../../../components/common/PaginationComponent'
import { ICON_SIZE_MD, ICON_BOX_MD } from '../../../constants/iconSizes'

const ProposalsTab = ({ contractor, groupId }) => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const {
    contractorProposals: { data: proposals, pagination, loading, error },
    proposalDetails,
  } = useSelector((state) => state.contractors)

  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' })
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [showModal, setShowModal] = useState(false)
  const [selectedProposal, setSelectedProposal] = useState(null)

  // Color mode values
  const textGray500 = useColorModeValue('gray.500', 'gray.400')
  const bgLight = useColorModeValue('gray.50', 'gray.800')
  const textWhite = 'white'
  const timelineIconBg = {
    secondary: useColorModeValue('gray.500', 'gray.600'),
    info: useColorModeValue('blue.500', 'blue.600'),
    success: useColorModeValue('green.500', 'green.600'),
    brand: useColorModeValue('brand.500', 'brand.600'),
  }

  // Status definitions with counts and colors
  const statusDefinitions = {
    all: { label: t('proposals.tabs.all'), color: 'brand', Icon: Clipboard },
    draft: { label: t('proposals.status.draft'), color: 'gray', Icon: Clipboard },
    sent: { label: t('proposals.status.sent'), color: 'blue', Icon: Send },
    pending: {
      label: t('contractorsAdmin.detail.proposals.status.pending'),
      color: 'orange',
      Icon: Clock,
    },
    approved: {
      label: t('contractorsAdmin.detail.proposals.status.approved'),
      color: 'green',
      Icon: CheckCircle,
    },
    accepted: { label: t('proposals.status.accepted'), color: 'green', Icon: CheckCircle },
    rejected: { label: t('proposals.status.rejected'), color: 'red', Icon: XCircle },
    expired: { label: t('proposals.status.expired'), color: 'gray', Icon: Clock },
    in_progress: {
      label: t('contractorsAdmin.detail.proposals.status.inProgress'),
      color: 'blue',
      Icon: Clock,
    },
    completed: {
      label: t('contractorsAdmin.detail.proposals.status.completed'),
      color: 'green',
      Icon: CheckCircle,
    },
  }

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    if (groupId) {
      dispatch(
        fetchContractorProposals({
          groupId,
          page: currentPage,
          limit: itemsPerPage,
          status: statusFilter === 'all' ? undefined : statusFilter,
          search: debouncedSearchTerm,
        }),
      )
    }
  }, [dispatch, groupId, currentPage, itemsPerPage, statusFilter, debouncedSearchTerm])

  // notify on load error
  useEffect(() => {
    if (error) {
      notifyError(
        t('contractorsAdmin.detail.proposals.loadFailed'),
        typeof error === 'string' ? error : '',
      )
    }
  }, [error])

  const handleViewProposal = (proposal) => {
    setSelectedProposal(proposal)
    setShowModal(true)
    dispatch(fetchProposalDetails(proposal.id))
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setSelectedProposal(null)
    dispatch(clearProposalDetails())
  }

  const handleGoToProposal = (proposalId) => {
    // Navigate to admin read-only proposal view
    const noisy =
      `/${genNoise(6)}/${genNoise(8)}` +
      buildEncodedPath('/quotes/:proposalId/admin-view', { proposalId })
    navigate(noisy)
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  const handleStatusFilterChange = (status) => {
    setStatusFilter(status)
    setCurrentPage(1) // Reset to first page when filter changes
  }

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value)
    setCurrentPage(1) // Reset to first page when search changes
  }

  const handleSort = (key) => {
    setSortConfig((prev) => {
      const direction = prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
      return { key, direction }
    })
  }

  const getStatusColor = (status) => {
    return statusDefinitions[status]?.color || 'secondary'
  }

  const getStatusIcon = (status) => {
    return statusDefinitions[status]?.Icon || Clipboard
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0)
  }

  // Calculate total amount from manufacturersData
  const calculateTotalAmount = (proposal) => {
    if (!proposal.manufacturersData) return 0

    try {
      const manufacturersData = JSON.parse(proposal.manufacturersData)
      let totalAmount = 0

      manufacturersData.forEach((manufacturer) => {
        if (manufacturer.summary && manufacturer.summary.grandTotal) {
          totalAmount += manufacturer.summary.grandTotal
        }
      })

      return totalAmount
    } catch (error) {
      console.error('Error parsing manufacturer data for proposal', proposal.id, error)
      return 0
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'

    try {
      const date = new Date(dateString)
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return 'N/A'
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch (error) {
      console.error('Error formatting date:', error)
      return 'N/A'
    }
  }

  const formatDateShort = (dateString) => {
    if (!dateString) return 'N/A'

    try {
      const date = new Date(dateString)
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return 'N/A'
      }
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    } catch (error) {
      console.error('Error formatting date:', error)
      return 'N/A'
    }
  }

  // Calculate status counts from the actual proposals data
  const statusCounts = useMemo(() => {
    const counts = { all: proposals?.length || 0 }
    if (proposals && proposals.length > 0) {
      proposals.forEach((proposal) => {
        const status = proposal.status || 'draft'
        counts[status] = (counts[status] || 0) + 1
      })
    }
    return counts
  }, [proposals])

  // Create status timeline for proposal
  const getStatusTimeline = (proposal) => {
    const timeline = []

    // Always show creation
    timeline.push({
      status: 'created',
      label: 'Created',
      date: proposal.createdAt,
      Icon: Clipboard,
      color: 'secondary',
      completed: true,
    })

    // Add sent status if it exists
    if (proposal.sent_at) {
      timeline.push({
        status: 'sent',
        label: 'Sent to Customer',
        date: proposal.sent_at,
        Icon: Send,
        color: 'info',
        completed: true,
      })
    }

    // Add accepted status if it exists
    if (proposal.accepted_at) {
      timeline.push({
        status: 'accepted',
        label: 'Accepted',
        date: proposal.accepted_at,
        Icon: CheckCircle,
        color: 'success',
        completed: true,
      })
    }

    // Add current status if it's different from sent/accepted
    if (proposal.status && !['draft', 'sent', 'accepted'].includes(proposal.status)) {
      timeline.push({
        status: proposal.status,
        label: statusDefinitions[proposal.status]?.label || proposal.status,
        date: proposal.updatedAt,
        Icon: getStatusIcon(proposal.status),
        color: getStatusColor(proposal.status),
        completed: true,
      })
    }

    return timeline
  }

  // Since filtering is done server-side, use proposals directly
  const displayProposals = proposals || []

  const totalPages = pagination?.totalPages || 1

  if (loading) {
    return (
      <Flex minH="200px" justify="center" align="center">
        <Spinner colorScheme="brand" />
      </Flex>
    )
  }

  return (
    <>
      <SimpleGrid columns={{ base: 1 }} spacing={4}>
        <Box>
          <StandardCard>
            <CardHeader>
              <HStack spacing={2}>
                <BriefcaseBusiness size={ICON_SIZE_MD} aria-hidden="true" />
                <Text fontWeight="bold">
                  {t('contractorsAdmin.detail.proposals.header', { count: pagination?.total || 0 })}
                </Text>
              </HStack>
            </CardHeader>
            <CardBody>
              {error &&
                notifyError(
                  t('contractorsAdmin.detail.proposals.loadFailed'),
                  typeof error === 'string' ? error : '',
                )}

              {/* Search and Status Filter Chips */}
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <Box>
                  <InputGroup>
                    <InputLeftElement aria-hidden="true">
                      <Search size={ICON_SIZE_MD} />
                    </InputLeftElement>
                    <Input
                      type="text"
                      placeholder={t('contractorsAdmin.detail.proposals.searchPlaceholder')}
                      aria-label={t(
                        'contractorsAdmin.detail.proposals.searchAria',
                        'Search proposals',
                      )}
                      value={searchTerm}
                      onChange={handleSearchChange}
                    />
                  </InputGroup>
                </Box>
                <Box>
                  <Text fontSize="sm" color={textGray500}>
                    {t('contractorsAdmin.detail.proposals.quickFilters')}
                  </Text>
                </Box>
              </SimpleGrid>

              {/* Status Filter Chips */}
              <Box>
                <ButtonGroup>
                  {Object.entries(statusDefinitions).map(([status, definition]) => {
                    const count = statusCounts[status] || 0
                    const isActive = statusFilter === status

                    return (
                      <Button
                        key={status}
                        variant={isActive ? 'solid' : 'outline'}
                        color={definition.color}
                        size="sm"
                        onClick={() => handleStatusFilterChange(status)}
                        isDisabled={count === 0 && status !== 'all'}
                      >
                        {(() => {
                          const Icon = definition.Icon
                          return <Icon size={14} aria-hidden="true" />
                        })()}
                        {definition.label}
                        {count > 0 && (
                          <Badge color={isActive ? 'light' : definition.color}>{count}</Badge>
                        )}
                      </Button>
                    )
                  })}
                </ButtonGroup>
              </Box>

              {/* Table */}
              <Box display={{ base: 'none', lg: 'block' }}>
              <TableCard>
                <Table variant="striped">
                  <Thead>
                    <Tr>
                      <Th cursor="pointer" onClick={() => handleSort('title')}>
                        {t('contractorsAdmin.detail.proposals.table.title')}
                        {sortConfig.key === 'title' &&
                          (sortConfig.direction === 'asc' ? (
                            <ChevronUp size={14} aria-hidden="true" />
                          ) : (
                            <ChevronDown size={14} aria-hidden="true" />
                          ))}
                      </Th>
                      <Th cursor="pointer" onClick={() => handleSort('customer_name')}>
                        {t('proposals.headers.customer')}
                        {sortConfig.key === 'customer_name' &&
                          (sortConfig.direction === 'asc' ? (
                            <ChevronUp size={14} aria-hidden="true" />
                          ) : (
                            <ChevronDown size={14} aria-hidden="true" />
                          ))}
                      </Th>
                      <Th cursor="pointer" onClick={() => handleSort('status')}>
                        {t('proposals.headers.status')}
                        {sortConfig.key === 'status' &&
                          (sortConfig.direction === 'asc' ? (
                            <ChevronUp size={14} aria-hidden="true" />
                          ) : (
                            <ChevronDown size={14} aria-hidden="true" />
                          ))}
                      </Th>
                      <Th cursor="pointer" onClick={() => handleSort('total_amount')}>
                        {t('contractorsAdmin.detail.proposals.table.amount')}
                        {sortConfig.key === 'total_amount' &&
                          (sortConfig.direction === 'asc' ? (
                            <ChevronUp size={14} aria-hidden="true" />
                          ) : (
                            <ChevronDown size={14} aria-hidden="true" />
                          ))}
                      </Th>
                      <Th cursor="pointer" onClick={() => handleSort('createdAt')}>
                        {t('proposals.headers.date')}
                        {sortConfig.key === 'createdAt' &&
                          (sortConfig.direction === 'asc' ? (
                            <ChevronUp size={14} aria-hidden="true" />
                          ) : (
                            <ChevronDown size={14} aria-hidden="true" />
                          ))}
                      </Th>
                      <Th cursor="pointer" onClick={() => handleSort('updatedAt')}>
                        {t('contractorsAdmin.detail.proposals.table.updated')}
                        {sortConfig.key === 'updatedAt' &&
                          (sortConfig.direction === 'asc' ? (
                            <ChevronUp size={14} aria-hidden="true" />
                          ) : (
                            <ChevronDown size={14} aria-hidden="true" />
                          ))}
                      </Th>
                      <Th w="150px">{t('proposals.headers.actions')}</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {displayProposals.length === 0 ? (
                      <Tr>
                        <Td colSpan="7">
                          <EmptyState
                            title={t('contractorsAdmin.detail.proposals.empty.title')}
                            subtitle={t('contractorsAdmin.detail.proposals.empty.subtitle')}
                          />
                        </Td>
                      </Tr>
                    ) : (
                      displayProposals.map((proposal) => (
                        <Tr key={proposal.id} verticalAlign="middle">
                          <Td>
                            <VStack align="start" spacing={0}>
                              <Text>{proposal.title || `Proposal #${proposal.id}`}</Text>
                              <Text fontSize="sm">ID: {proposal.id}</Text>
                            </VStack>
                          </Td>
                          <Td>
                            <HStack spacing={2}>
                              <User size={14} aria-hidden="true" />
                              <Text>{proposal.customer?.name || proposal.customer_name || 'N/A'}</Text>
                            </HStack>
                          </Td>
                          <Td>
                            <Badge color={getStatusColor(proposal.status)} w="fit-content">
                              {(() => {
                                const Icon = getStatusIcon(proposal.status)
                                return <Icon size={14} aria-hidden="true" />
                              })()}
                              {statusDefinitions[proposal.status]?.label ||
                                proposal.status ||
                                t('proposals.status.draft')}
                            </Badge>
                          </Td>
                          <Td>
                            <Text>{formatCurrency(calculateTotalAmount(proposal))}</Text>
                          </Td>
                          <Td>
                            <Text fontSize="sm">{formatDateShort(proposal.createdAt)}</Text>
                          </Td>
                          <Td>
                            <Text fontSize="sm">{formatDateShort(proposal.updatedAt)}</Text>
                          </Td>
                          <Td>
                            <ButtonGroup size="sm">
                              <Tooltip content="View Details">
                                <Button
                                  variant="outline"
                                  colorScheme="brand"
                                  size="sm"
                                  minH="44px"
                                  aria-label={t(
                                    'contractorsAdmin.detail.proposals.actions.viewDetails',
                                    'View proposal details',
                                  )}
                                  onClick={() => handleViewProposal(proposal)}
                                >
                                  <Search size={ICON_SIZE_MD} aria-hidden="true" />
                                </Button>
                              </Tooltip>
                              <Tooltip content="Go to Proposal">
                                <Button
                                  variant="outline"
                                  colorScheme="brand"
                                  size="sm"
                                  minH="44px"
                                  aria-label={t(
                                    'contractorsAdmin.detail.proposals.actions.open',
                                    'Open proposal',
                                  )}
                                  onClick={() => handleGoToProposal(proposal.id)}
                                >
                                  <ExternalLink size={ICON_SIZE_MD} aria-hidden="true" />
                                </Button>
                              </Tooltip>
                            </ButtonGroup>
                          </Td>
                        </Tr>
                      ))
                    )}
                  </Tbody>
                </Table>
              </TableCard>
              </Box>

              {/* Pagination */}
              {pagination?.totalPages > 1 && (
                <Box>
                  <PaginationComponent
                    currentPage={currentPage}
                    totalPages={pagination?.totalPages || 1}
                    onPageChange={handlePageChange}
                    itemsPerPage={itemsPerPage}
                  />
                </Box>
              )}
            </CardBody>
          </StandardCard>
        </Box>
      </SimpleGrid>

      {/* Enhanced Proposal Detail Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        size={{ base: 'full', lg: 'xl' }}
        scrollBehavior="inside"
      >
        <ModalOverlay>
          <ModalContent borderRadius={{ base: '0', md: '12px' }}>
            <ModalHeader>
              <HStack spacing={2}>
                <BriefcaseBusiness size={ICON_SIZE_MD} aria-hidden="true" />
                <Text>{t('contractorsAdmin.detail.proposals.modal.title')}</Text>
                {selectedProposal && (
                  <Badge colorScheme={getStatusColor(selectedProposal.status)} borderRadius="full">
                    {statusDefinitions[selectedProposal.status]?.label ||
                      selectedProposal.status ||
                      'Draft'}
                  </Badge>
                )}
              </HStack>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {proposalDetails.loading ? (
                <VStack minH="300px" justify="center" align="center" spacing={3}>
                  <Spinner colorScheme="brand" size="lg" />
                  <Text>{t('contractorsAdmin.detail.proposals.modal.loading')}</Text>
                </VStack>
              ) : proposalDetails.data ? (
                <VStack spacing={4} align="stretch">
                  {/* Header Summary */}
                  <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                    <Box gridColumn={{ base: '1', md: 'span 2' }}>
                      <Heading size="md" mb={3}>
                        {proposalDetails.data.title || `Proposal #${proposalDetails.data.id}`}
                      </Heading>
                      <VStack align="start" spacing={2}>
                        <HStack spacing={2}>
                          <User size={14} aria-hidden="true" />
                          <Text fontWeight="bold">{t('proposalAcceptance.labels.customer')}:</Text>
                          <Text>{proposalDetails.data.customer?.name || t('common.na')}</Text>
                        </HStack>
                        <HStack spacing={2}>
                          <Calendar size={14} aria-hidden="true" />
                          <Text fontWeight="bold">{t('proposals.headers.date')}:</Text>
                          <Text>{formatDate(proposalDetails.data.createdAt)}</Text>
                        </HStack>
                        <HStack spacing={2}>
                          <MapPin size={14} aria-hidden="true" />
                          <Text fontWeight="bold">
                            {t('contractorsAdmin.detail.proposals.modal.group')}:
                          </Text>
                          <Text>{contractor?.name || t('common.na')}</Text>
                        </HStack>
                      </VStack>
                    </Box>
                    <Box>
                      <VStack align="start" spacing={2}>
                        <Heading size="lg">{formatCurrency(calculateTotalAmount(proposalDetails.data))}</Heading>
                        <Text fontSize="sm">{t('contractorsAdmin.detail.proposals.modal.totalAmount')}</Text>
                      </VStack>
                      <Button
                        colorScheme="brand"
                        size="sm"
                        leftIcon={<ExternalLink size={ICON_SIZE_MD} />}
                        minH="44px"
                        maxW={{ base: '180px', md: 'none' }}
                        aria-label={t('contractorsAdmin.detail.proposals.modal.goToProposal')}
                        onClick={() => handleGoToProposal(proposalDetails.data.id)}
                        fontSize={{ base: 'sm', md: 'md' }}
                      >
                        {t('contractorsAdmin.detail.proposals.modal.goToProposal')}
                      </Button>
                    </Box>
                  </SimpleGrid>

                  <Accordion flush>
                    {/* Basic Information */}
                    <AccordionItem>
                      <AccordionButton>
                        <Box flex="1" textAlign="left">
                          <Info size={ICON_SIZE_MD} aria-hidden="true" />
                          {t('contractorsAdmin.detail.proposals.modal.basicInfo')}
                        </Box>
                        <AccordionIcon />
                      </AccordionButton>
                      <AccordionPanel>
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                          <Box>
                            <List>
                              <ListItem>
                                <HStack justify="space-between">
                                  <Text>
                                    {t('contractorsAdmin.detail.proposals.modal.proposalId')}
                                  </Text>
                                  <Text fontWeight="bold">#{proposalDetails.data.id}</Text>
                                </HStack>
                              </ListItem>
                              <ListItem>
                                <HStack justify="space-between">
                                  <Text>{t('proposals.headers.status')}</Text>
                                <Badge
                                  colorScheme={getStatusColor(proposalDetails.data.status)}
                                  borderRadius="full"
                                  px={3}
                                  py={1}
                                >
                                  {(() => {
                                    const Icon = getStatusIcon(proposalDetails.data.status)
                                    return <Icon size={14} aria-hidden="true" />
                                  })()}
                                  {statusDefinitions[proposalDetails.data.status]?.label ||
                                    proposalDetails.data.status ||
                                    t('proposals.status.draft')}
                                </Badge>
                                </HStack>
                              </ListItem>
                              <ListItem>
                                <HStack justify="space-between">
                                  <Text>{t('proposalAcceptance.labels.customer')}</Text>
                                  <Text>{proposalDetails.data.customer?.name || 'N/A'}</Text>
                                </HStack>
                              </ListItem>
                              <ListItem>
                                <HStack justify="space-between">
                                  <Text>
                                    {t('contractorsAdmin.detail.proposals.modal.totalAmount')}
                                  </Text>
                                  <Text fontWeight="bold">
                                    {formatCurrency(calculateTotalAmount(proposalDetails.data))}
                                  </Text>
                                </HStack>
                              </ListItem>
                            </List>
                          </Box>
                          <Box>
                            <List>
                              <ListItem>
                                <HStack justify="space-between">
                                  <Text>{t('contractorsAdmin.detail.proposals.modal.created')}</Text>
                                  <Text>{formatDate(proposalDetails.data.createdAt)}</Text>
                                </HStack>
                              </ListItem>
                              <ListItem>
                                <HStack justify="space-between">
                                  <Text>{t('contractorsAdmin.detail.proposals.modal.updated')}</Text>
                                  <Text>{formatDate(proposalDetails.data.updatedAt)}</Text>
                                </HStack>
                              </ListItem>
                              {proposalDetails.data.sent_at && (
                                <ListItem>
                                  <HStack justify="space-between">
                                    <Text>{t('contractorsAdmin.detail.proposals.modal.sent')}</Text>
                                    <Text>{formatDate(proposalDetails.data.sent_at)}</Text>
                                  </HStack>
                                </ListItem>
                              )}
                              <ListItem>
                                <HStack justify="space-between">
                                  <Text>
                                    {t('contractorsAdmin.detail.proposals.modal.contractorGroup')}
                                  </Text>
                                  <Text>{contractor?.name || 'N/A'}</Text>
                                </HStack>
                              </ListItem>
                              {proposalDetails.data.accepted_at && (
                                <ListItem>
                                  <HStack justify="space-between">
                                    <Text>
                                      {t('contractorsAdmin.detail.proposals.modal.accepted')}
                                    </Text>
                                    <Text>{formatDate(proposalDetails.data.accepted_at)}</Text>
                                  </HStack>
                                </ListItem>
                              )}
                            </List>
                          </Box>
                        </SimpleGrid>

                        {proposalDetails.data.description && (
                          <Box>
                            <Heading size="xs" mb={2}>{t('proposals.labels.description')}</Heading>
                            <Box bg={bgLight} p={3} borderRadius="md">
                              <Text>{proposalDetails.data.description}</Text>
                            </Box>
                          </Box>
                        )}
                      </AccordionPanel>
                    </AccordionItem>

                    {/* Status Timeline */}
                    <AccordionItem>
                      <AccordionButton>
                        <Box flex="1" textAlign="left">
                          <History size={ICON_SIZE_MD} aria-hidden="true" />
                          {t('contractorsAdmin.detail.proposals.timeline.title')}
                        </Box>
                        <AccordionIcon />
                      </AccordionButton>
                      <AccordionPanel>
                        <VStack align="stretch" spacing={4}>
                          {getStatusTimeline(proposalDetails.data).map((item, index) => (
                            <HStack key={index} align="start" spacing={3}>
                              <Flex
                                bg={timelineIconBg[item.color] || timelineIconBg.brand}
                                color={textWhite}
                                borderRadius="full"
                                align="center"
                                justify="center"
                                w="40px"
                                h="40px"
                                minW="40px"
                              >
                                {(() => {
                                  const Icon = item.Icon || Clipboard
                                  return <Icon size={ICON_SIZE_MD} aria-hidden="true" />
                                })()}
                              </Flex>
                              <Box flex="1">
                                <HStack justify="space-between" mb={1}>
                                  <Text fontWeight="bold">{item.label}</Text>
                                  <Text fontSize="sm">{formatDate(item.date)}</Text>
                                </HStack>
                                {item.status === 'created' && (
                                  <Text fontSize="sm">
                                    {t('contractorsAdmin.detail.proposals.timeline.created')}
                                  </Text>
                                )}
                                {item.status === 'sent' && (
                                  <Text fontSize="sm">
                                    {t('contractorsAdmin.detail.proposals.timeline.sent')}
                                  </Text>
                                )}
                                {item.status === 'accepted' && (
                                  <Text fontSize="sm">
                                    {t('contractorsAdmin.detail.proposals.timeline.accepted')}
                                  </Text>
                                )}
                                {item.status === 'approved' && (
                                  <Text fontSize="sm">
                                    {t('contractorsAdmin.detail.proposals.timeline.approved')}
                                  </Text>
                                )}
                              </Box>
                            </HStack>
                          ))}
                        </VStack>
                      </AccordionPanel>
                    </AccordionItem>

                    {/* Proposal Items */}
                    {proposalDetails.data.items && proposalDetails.data.items.length > 0 && (
                      <AccordionItem>
                        <AccordionButton>
                          <Box flex="1" textAlign="left">
                            <Clipboard size={ICON_SIZE_MD} aria-hidden="true" />
                            {t('contractorsAdmin.detail.proposals.itemsTitle', {
                              count: proposalDetails.data.items.length,
                            })}
                          </Box>
                          <AccordionIcon />
                        </AccordionButton>
                        <AccordionPanel>
                          <Box display={{ base: 'none', lg: 'block' }}>
                          <TableCard>
                            <Table variant="striped">
                              <Thead>
                                <Tr>
                                  <Th>{t('proposalColumns.item')}</Th>
                                  <Th>{t('proposals.labels.description')}</Th>
                                  <Th>{t('proposalColumns.qty')}</Th>
                                  <Th>{t('proposalDoc.catalog.unitPrice')}</Th>
                                  <Th>{t('proposalColumns.total')}</Th>
                                </Tr>
                              </Thead>
                              <Tbody>
                                {proposalDetails.data.items.map((item, index) => (
                                  <Tr key={index}>
                                    <Td>
                                      <Text fontWeight="bold">{item.name || `Item ${index + 1}`}</Text>
                                    </Td>
                                    <Td><Text>{item.description || 'N/A'}</Text></Td>
                                    <Td><Text>{item.quantity || 1}</Text></Td>
                                    <Td><Text>{formatCurrency(item.unit_price)}</Text></Td>
                                    <Td>
                                      <Text fontWeight="bold">
                                        {formatCurrency(
                                          (item.quantity || 1) * (item.unit_price || 0),
                                        )}
                                      </Text>
                                    </Td>
                                  </Tr>
                                ))}
                              </Tbody>
                            </Table>
                          </TableCard>
                          </Box>

                          <Box>
                            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                              <Box></Box>
                              <VStack align="stretch" spacing={2}>
                                <HStack justify="space-between">
                                  <Text>
                                    {t('contractorsAdmin.detail.proposals.totals.subtotal')}:
                                  </Text>
                                  <Text>
                                    {formatCurrency(
                                      proposalDetails.data.subtotal_amount ||
                                        proposalDetails.data.total_amount,
                                    )}
                                  </Text>
                                </HStack>
                                {proposalDetails.data.tax_amount > 0 && (
                                  <HStack justify="space-between">
                                    <Text>
                                      {t('contractorsAdmin.detail.proposals.totals.tax')}:
                                    </Text>
                                    <Text>{formatCurrency(proposalDetails.data.tax_amount)}</Text>
                                  </HStack>
                                )}
                                <HStack justify="space-between">
                                  <Text fontWeight="bold">
                                    {t('contractorsAdmin.detail.proposals.totals.total')}:
                                  </Text>
                                  <Text fontWeight="bold">
                                    {formatCurrency(proposalDetails.data.total_amount)}
                                  </Text>
                                </HStack>
                              </VStack>
                            </SimpleGrid>
                          </Box>
                        </AccordionPanel>
                      </AccordionItem>
                    )}
                  </Accordion>
                </VStack>
              ) : (
                <Alert status="warning">
                  <Info size={ICON_SIZE_MD} aria-hidden="true" />
                  {t('contractorsAdmin.detail.proposals.modal.failed')}
                </Alert>
              )}
            </ModalBody>
            <ModalFooter pt={4} pb={{ base: 8, md: 4 }}>
              <HStack spacing={3} w="full" justify="space-between">
                <Box>
                  {selectedProposal && (
                    <Button
                      colorScheme="brand"
                      variant="outline"
                      leftIcon={<ExternalLink size={ICON_SIZE_MD} />}
                      minH="44px"
                      maxW={{ base: '180px', md: 'none' }}
                      aria-label={t('contractorsAdmin.detail.proposals.modal.openFull')}
                      onClick={() => handleGoToProposal(selectedProposal.id)}
                      fontSize={{ base: 'sm', md: 'md' }}
                    >
                      {t('contractorsAdmin.detail.proposals.modal.openFull')}
                    </Button>
                  )}
                </Box>
                <Button
                  colorScheme="gray"
                  onClick={handleCloseModal}
                  minH="44px"
                  maxW={{ base: '140px', md: 'none' }}
                  fontSize={{ base: 'sm', md: 'md' }}
                >
                  {t('common.cancel')}
                </Button>
              </HStack>
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>
      </Modal>
    </>
  )
}

export default ProposalsTab
