import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { buildEncodedPath, genNoise } from '../../../utils/obfuscate'
import {
  Flex,
  Box,
  Card,
  CardBody,
  CardHeader,
  Table,
  Tbody,
  Td,
  Thead,
  Th,
  Tr,
  Badge,
  Button,
  Select,
  InputGroup,
  InputLeftElement,
  Input,
  Spinner,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  List,
  ListItem,
  Alert,
  ButtonGroup,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Progress,
  Tooltip,
  TableContainer,
  Text
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
  ChevronDown
} from 'lucide-react'
import {
  fetchContractorProposals,
  fetchProposalDetails,
  clearProposalDetails
} from '../../../store/slices/contractorSlice'
import PaginationComponent from '../../../components/common/PaginationComponent'

const ProposalsTab = ({ contractor, groupId }) => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const {
    contractorProposals: { data: proposals, pagination, loading, error },
    proposalDetails
  } = useSelector(state => state.contractors)

  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' })
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [showModal, setShowModal] = useState(false)
  const [selectedProposal, setSelectedProposal] = useState(null)

  // Status definitions with counts and colors
  const statusDefinitions = {
    all: { label: t('proposals.tabs.all'), color: 'primary', Icon: Clipboard },
    draft: { label: t('proposals.status.draft'), color: 'secondary', Icon: Clipboard },
    sent: { label: t('proposals.status.sent'), color: 'info', Icon: Send },
    pending: { label: t('contractorsAdmin.detail.proposals.status.pending'), color: 'warning', Icon: Clock },
    approved: { label: t('contractorsAdmin.detail.proposals.status.approved'), color: 'success', Icon: CheckCircle },
    accepted: { label: t('proposals.status.accepted'), color: 'success', Icon: CheckCircle },
    rejected: { label: t('proposals.status.rejected'), color: 'danger', Icon: XCircle },
    expired: { label: t('proposals.status.expired'), color: 'dark', Icon: Clock },
    in_progress: { label: t('contractorsAdmin.detail.proposals.status.inProgress'), color: 'info', Icon: Clock },
    completed: { label: t('contractorsAdmin.detail.proposals.status.completed'), color: 'success', Icon: CheckCircle }
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
      dispatch(fetchContractorProposals({
        groupId,
        page: currentPage,
        limit: itemsPerPage,
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: debouncedSearchTerm
      }))
    }
  }, [dispatch, groupId, currentPage, itemsPerPage, statusFilter, debouncedSearchTerm])

  // notify on load error
  useEffect(() => {
    if (error) {
      notifyError(t('contractorsAdmin.detail.proposals.loadFailed'), typeof error === 'string' ? error : '')
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
    const noisy = `/${genNoise(6)}/${genNoise(8)}` + buildEncodedPath('/quotes/:proposalId/admin-view', { proposalId })
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
      currency: 'USD'
    }).format(amount || 0)
  }

  // Calculate total amount from manufacturersData
  const calculateTotalAmount = (proposal) => {
    if (!proposal.manufacturersData) return 0

    try {
      const manufacturersData = JSON.parse(proposal.manufacturersData)
      let totalAmount = 0

      manufacturersData.forEach(manufacturer => {
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
        minute: '2-digit'
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
        day: 'numeric'
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
      proposals.forEach(proposal => {
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
      completed: true
    })

    // Add sent status if it exists
    if (proposal.sent_at) {
      timeline.push({
        status: 'sent',
        label: 'Sent to Customer',
        date: proposal.sent_at,
        Icon: Send,
        color: 'info',
        completed: true
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
        completed: true
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
        completed: true
      })
    }

    return timeline
  }

  // Since filtering is done server-side, use proposals directly
  const displayProposals = proposals || []

  const totalPages = pagination?.totalPages || 1

  if (loading) {
    return (
      <div minH="200px">
        <Spinner colorScheme="blue" />
      </div>
    )
  }

  return (
    <>
      <Flex>
        <Box xs={12}>
          <Card>
            <CardHeader>
              <strong>
                <BriefcaseBusiness size={16} aria-hidden="true" />
                {t('contractorsAdmin.detail.proposals.header', { count: pagination?.total || 0 })}
              </strong>
            </CardHeader>
            <CardBody>
              {error && notifyError(t('contractorsAdmin.detail.proposals.loadFailed'), typeof error === 'string' ? error : '')}

              {/* Search and Status Filter Chips */}
              <Flex>
                <Box md={6}>
                  <InputGroup>
                    <InputLeftElement aria-hidden="true">
                      <Search size={16} />
                    </InputLeftElement>
                    <Input
                      type="text"
                      placeholder={t('contractorsAdmin.detail.proposals.searchPlaceholder')}
                      aria-label={t('contractorsAdmin.detail.proposals.searchAria', 'Search proposals')}
                      value={searchTerm}
                      onChange={handleSearchChange}
                    />
                  </InputGroup>
                </Box>
                <Box md={6}>
                  <Text fontSize="sm" color="gray.500">{t('contractorsAdmin.detail.proposals.quickFilters')}</Text>
                </Box>
              </Flex>

              {/* Status Filter Chips */}
              <div>
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
                        disabled={count === 0 && status !== 'all'}
                      >
                        {(() => { const Icon = definition.Icon; return <Icon size={14} aria-hidden="true" />; })()}
                        {definition.label}
                        {count > 0 && (
                          <Badge
                            color={isActive ? 'light' : definition.color}
                           
                          >
                            {count}
                          </Badge>
                        )}
                      </Button>
                    )
                  })}
                </ButtonGroup>
              </div>

              {/* Table */}
              <TableContainer className="table-wrap">
                <Table variant="striped" className="table-modern">
                  <Thead>
                    <Tr>
                      <Th
                        className="cursor-pointer"
                        onClick={() => handleSort('title')}
                      >
                        {t('contractorsAdmin.detail.proposals.table.title')}
                        {sortConfig.key === 'title' && (sortConfig.direction === 'asc' ? (
                          <ChevronUp size={14} aria-hidden="true" />
                        ) : (
                          <ChevronDown size={14} aria-hidden="true" />
                        ))}
                      </Th>
                      <Th
                        className="cursor-pointer"
                        onClick={() => handleSort('customer_name')}
                      >
                        {t('proposals.headers.customer')}
                        {sortConfig.key === 'customer_name' && (sortConfig.direction === 'asc' ? (
                          <ChevronUp size={14} aria-hidden="true" />
                        ) : (
                          <ChevronDown size={14} aria-hidden="true" />
                        ))}
                      </Th>
                      <Th
                        className="cursor-pointer"
                        onClick={() => handleSort('status')}
                      >
                        {t('proposals.headers.status')}
                        {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? (
                          <ChevronUp size={14} aria-hidden="true" />
                        ) : (
                          <ChevronDown size={14} aria-hidden="true" />
                        ))}
                      </Th>
                      <Th
                        className="cursor-pointer"
                        onClick={() => handleSort('total_amount')}
                      >
                        {t('contractorsAdmin.detail.proposals.table.amount')}
                        {sortConfig.key === 'total_amount' && (sortConfig.direction === 'asc' ? (
                          <ChevronUp size={14} aria-hidden="true" />
                        ) : (
                          <ChevronDown size={14} aria-hidden="true" />
                        ))}
                      </Th>
                      <Th
                        className="cursor-pointer"
                        onClick={() => handleSort('createdAt')}
                      >
                        {t('proposals.headers.date')}
                        {sortConfig.key === 'createdAt' && (sortConfig.direction === 'asc' ? (
                          <ChevronUp size={14} aria-hidden="true" />
                        ) : (
                          <ChevronDown size={14} aria-hidden="true" />
                        ))}
                      </Th>
                      <Th
                        className="cursor-pointer"
                        onClick={() => handleSort('updatedAt')}
                      >
                        {t('contractorsAdmin.detail.proposals.table.updated')}
                        {sortConfig.key === 'updatedAt' && (sortConfig.direction === 'asc' ? (
                          <ChevronUp size={14} aria-hidden="true" />
                        ) : (
                          <ChevronDown size={14} aria-hidden="true" />
                        ))}
                      </Th>
                      <Th w="150px">
                        {t('proposals.headers.actions')}
                      </Th>
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
                        <Tr key={proposal.id} className="align-middle">
                          <Td>
                            <div>
                              <div>{proposal.title || `Proposal #${proposal.id}`}</div>
                              <small>ID: {proposal.id}</small>
                            </div>
                          </Td>
                          <Td>
                            <div>
                              <User size={14} aria-hidden="true" />
                              {proposal.customer?.name || proposal.customer_name || 'N/A'}
                            </div>
                          </Td>
                          <Td>
                            <Badge
                              color={getStatusColor(proposal.status)} w="fit-content"
                            >
                              {(() => { const Icon = getStatusIcon(proposal.status); return <Icon size={14} aria-hidden="true" />; })()}
                              {statusDefinitions[proposal.status]?.label || proposal.status || t('proposals.status.draft')}
                            </Badge>
                          </Td>
                          <Td>
                            <div>{formatCurrency(calculateTotalAmount(proposal))}</div>
                          </Td>
                          <Td>
                            <div>
                              <small>{formatDateShort(proposal.createdAt)}</small>
                            </div>
                          </Td>
                          <Td>
                            <div>
                              <small>{formatDateShort(proposal.updatedAt)}</small>
                            </div>
                          </Td>
                          <Td>
                            <ButtonGroup size="sm">
                              <Tooltip content="View Details">
                                <Button
                                  color="outline-info"
                                  size="sm"
                                  className="icon-btn"
                                  aria-label={t('contractorsAdmin.detail.proposals.actions.viewDetails', 'View proposal details')}
                                  onClick={() => handleViewProposal(proposal)}
                                >
                                  <Search size={16} aria-hidden="true" />
                                </Button>
                              </Tooltip>
                              <Tooltip content="Go to Proposal">
                                <Button
                                  color="outline-primary"
                                  size="sm"
                                  className="icon-btn"
                                  aria-label={t('contractorsAdmin.detail.proposals.actions.open', 'Open proposal')}
                                  onClick={() => handleGoToProposal(proposal.id)}
                                >
                                  <ExternalLink size={16} aria-hidden="true" />
                                </Button>
                              </Tooltip>
                            </ButtonGroup>
                          </Td>
                        </Tr>
                      ))
                    )}
                  </Tbody>
                </Table>
              </TableContainer>

              {/* Pagination */}
              {pagination?.totalPages > 1 && (
                <div>
                  <PaginationComponent
                    currentPage={currentPage}
                    totalPages={pagination?.totalPages || 1}
                    onPageChange={handlePageChange}
                    itemsPerPage={itemsPerPage}
                  />
                </div>
              )}
            </CardBody>
          </Card>
        </Box>
      </Flex>

      {/* Enhanced Proposal Detail Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        size={{ base: "full", lg: "xl" }}
        scrollable
        className="proposal-detail-modal"
      >
        <ModalOverlay>
          <ModalContent>
            <ModalHeader>
              <BriefcaseBusiness size={16} aria-hidden="true" />
              {t('contractorsAdmin.detail.proposals.modal.title')}
              {selectedProposal && (
                <Badge color={getStatusColor(selectedProposal.status)}>
                  {statusDefinitions[selectedProposal.status]?.label || selectedProposal.status || 'Draft'}
                </Badge>
              )}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {proposalDetails.loading ? (
                <div minH="300px">
                  <Spinner colorScheme="blue" size="lg" />
                  <span>{t('contractorsAdmin.detail.proposals.modal.loading')}</span>
                </div>
              ) : proposalDetails.data ? (
                <div>
                  {/* Header Summary */}
                  <Flex>
                    <Box md={8}>
                      <h4>{proposalDetails.data.title || `Proposal #${proposalDetails.data.id}`}</h4>
                      <div>
                        <div>
                          <User size={14} aria-hidden="true" />
                          <strong>{t('proposalAcceptance.labels.customer')}:</strong> {proposalDetails.data.customer?.name || t('common.na')}
                        </div>
                        <div>
                          <Calendar size={14} aria-hidden="true" />
                          <strong>{t('proposals.headers.date')}:</strong> {formatDate(proposalDetails.data.createdAt)}
                        </div>
                        <div>
                          <MapPin size={14} aria-hidden="true" />
                          <strong>{t('contractorsAdmin.detail.proposals.modal.group')}:</strong> {contractor?.name || t('common.na')}
                        </div>
                      </div>
                    </Box>
                    <Box md={4}>
                      <div>
                        <h3>{formatCurrency(calculateTotalAmount(proposalDetails.data))}</h3>
                        <small>{t('contractorsAdmin.detail.proposals.modal.totalAmount')}</small>
                      </div>
                      <Button
                        colorScheme="blue"
                        size="sm"
                        className="icon-btn"
                        aria-label={t('contractorsAdmin.detail.proposals.modal.goToProposal')}
                        onClick={() => handleGoToProposal(proposalDetails.data.id)}
                      >
                        <ExternalLink size={16} aria-hidden="true" />
                        {t('contractorsAdmin.detail.proposals.modal.goToProposal')}
                      </Button>
                    </Box>
                  </Flex>

                  <Accordion flush>
                    {/* Basic Information */}
                    <AccordionItem>
                      <AccordionButton>
                        <Box flex="1" textAlign="left">
                          <Info size={16} aria-hidden="true" />
                          {t('contractorsAdmin.detail.proposals.modal.basicInfo')}
                        </Box>
                        <AccordionIcon />
                      </AccordionButton>
                      <AccordionPanel>
                        <Flex>
                          <Box md={6}>
                            <List>
                              <ListItem>
                                <span>{t('contractorsAdmin.detail.proposals.modal.proposalId')}</span>
                                <strong>#{proposalDetails.data.id}</strong>
                              </ListItem>
                              <ListItem>
                                <span>{t('proposals.headers.status')}</span>
                                <Badge color={getStatusColor(proposalDetails.data.status)}>
                                  {(() => { const Icon = getStatusIcon(proposalDetails.data.status); return <Icon size={14} aria-hidden="true" />; })()}
                                  {statusDefinitions[proposalDetails.data.status]?.label || proposalDetails.data.status || t('proposals.status.draft')}
                                </Badge>
                              </ListItem>
                              <ListItem>
                                <span>{t('proposalAcceptance.labels.customer')}</span>
                                <span>{proposalDetails.data.customer?.name || 'N/A'}</span>
                              </ListItem>
                              <ListItem>
                                <span>{t('contractorsAdmin.detail.proposals.modal.totalAmount')}</span>
                                <strong>{formatCurrency(calculateTotalAmount(proposalDetails.data))}</strong>
                              </ListItem>
                            </List>
                          </Box>
                          <Box md={6}>
                            <List>
                              <ListItem>
                                <span>{t('contractorsAdmin.detail.proposals.modal.created')}</span>
                                <span>{formatDate(proposalDetails.data.createdAt)}</span>
                              </ListItem>
                              <ListItem>
                                <span>{t('contractorsAdmin.detail.proposals.modal.updated')}</span>
                                <span>{formatDate(proposalDetails.data.updatedAt)}</span>
                              </ListItem>
                              {proposalDetails.data.sent_at && (
                                <ListItem>
                                  <span>{t('contractorsAdmin.detail.proposals.modal.sent')}</span>
                                  <span>{formatDate(proposalDetails.data.sent_at)}</span>
                                </ListItem>
                              )}
                              <ListItem>
                                <span>{t('contractorsAdmin.detail.proposals.modal.contractorGroup')}</span>
                                <span>{contractor?.name || 'N/A'}</span>
                              </ListItem>
                              {proposalDetails.data.accepted_at && (
                                <ListItem>
                                  <span>{t('contractorsAdmin.detail.proposals.modal.accepted')}</span>
                                  <span>{formatDate(proposalDetails.data.accepted_at)}</span>
                                </ListItem>
                              )}
                            </List>
                          </Box>
                        </Flex>

                        {proposalDetails.data.description && (
                          <div>
                            <h6>{t('proposals.labels.description')}</h6>
                            <div className="bg-light p-3 rounded">
                              <p>{proposalDetails.data.description}</p>
                            </div>
                          </div>
                        )}
                      </AccordionPanel>
                    </AccordionItem>

                    {/* Status Timeline */}
                    <AccordionItem>
                      <AccordionButton>
                        <Box flex="1" textAlign="left">
                          <History size={16} aria-hidden="true" />
                          {t('contractorsAdmin.detail.proposals.timeline.title')}
                        </Box>
                        <AccordionIcon />
                      </AccordionButton>
                      <AccordionPanel>
                        <div className="timeline">
                          {getStatusTimeline(proposalDetails.data).map((item, index) => (
                            <div key={index}>
                              <div
                                className={`timeline-icon bg-${item.color} text-white rounded-circle d-flex align-items-center justify-content-center me-3`}
                                style={{ width: '40px', height: '40px', minWidth: '40px' }}
                              >
                                {(() => { const Icon = item.Icon || Clipboard; return <Icon size={18} aria-hidden="true" />; })()}
                              </div>
                              <div>
                                <div>
                                  <strong>{item.label}</strong>
                                  <small>{formatDate(item.date)}</small>
                                </div>
                                {item.status === 'created' && (
                                  <small>{t('contractorsAdmin.detail.proposals.timeline.created')}</small>
                                )}
                                {item.status === 'sent' && (
                                  <small>{t('contractorsAdmin.detail.proposals.timeline.sent')}</small>
                                )}
                                {item.status === 'accepted' && (
                                  <small>{t('contractorsAdmin.detail.proposals.timeline.accepted')}</small>
                                )}
                                {item.status === 'approved' && (
                                  <small>{t('contractorsAdmin.detail.proposals.timeline.approved')}</small>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </AccordionPanel>
                    </AccordionItem>

                    {/* Proposal Items */}
                    {proposalDetails.data.items && proposalDetails.data.items.length > 0 && (
                      <AccordionItem>
                        <AccordionButton>
                          <Box flex="1" textAlign="left">
                            <Clipboard size={16} aria-hidden="true" />
                            {t('contractorsAdmin.detail.proposals.itemsTitle', { count: proposalDetails.data.items.length })}
                          </Box>
                          <AccordionIcon />
                        </AccordionButton>
                        <AccordionPanel>
                          <TableContainer>
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
                                      <strong>{item.name || `Item ${index + 1}`}</strong>
                                    </Td>
                                    <Td>{item.description || 'N/A'}</Td>
                                    <Td>{item.quantity || 1}</Td>
                                    <Td>{formatCurrency(item.unit_price)}</Td>
                                    <Td>
                                      <strong>{formatCurrency((item.quantity || 1) * (item.unit_price || 0))}</strong>
                                    </Td>
                                  </Tr>
                                ))}
                              </Tbody>
                            </Table>
                          </TableContainer>

                          <div>
                            <Flex>
                              <Box md={6}></Box>
                              <Box md={6}>
                                <div>
                                  <span>{t('contractorsAdmin.detail.proposals.totals.subtotal')}:</span>
                                  <span>{formatCurrency(proposalDetails.data.subtotal_amount || proposalDetails.data.total_amount)}</span>
                                </div>
                                {proposalDetails.data.tax_amount > 0 && (
                                  <div>
                                    <span>{t('contractorsAdmin.detail.proposals.totals.tax')}:</span>
                                    <span>{formatCurrency(proposalDetails.data.tax_amount)}</span>
                                  </div>
                                )}
                                <div>
                                  <strong>{t('contractorsAdmin.detail.proposals.totals.total')}:</strong>
                                  <strong>{formatCurrency(proposalDetails.data.total_amount)}</strong>
                                </div>
                              </Box>
                            </Flex>
                          </div>
                        </AccordionPanel>
                      </AccordionItem>
                    )}
                  </Accordion>
                </div>
              ) : (
                <Alert status="warning">
                  <Info size={16} aria-hidden="true" />
                  {t('contractorsAdmin.detail.proposals.modal.failed')}
                </Alert>
              )}
            </ModalBody>
            <ModalFooter>
              <div>
                {selectedProposal && (
                  <Button
                    colorScheme="blue"
                    variant="outline"
                    className="icon-btn"
                    aria-label={t('contractorsAdmin.detail.proposals.modal.openFull')}
                    onClick={() => handleGoToProposal(selectedProposal.id)}
                  >
                    <ExternalLink size={16} aria-hidden="true" />
                    {t('contractorsAdmin.detail.proposals.modal.openFull')}
                  </Button>
                )}
              </div>
              <Button colorScheme="gray" onClick={handleCloseModal}>
                {t('common.cancel')}
              </Button>
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>
      </Modal>
    </>
  )
}

export default ProposalsTab