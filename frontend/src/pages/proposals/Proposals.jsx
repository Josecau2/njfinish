import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, useReducedMotion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useProposals, useUpdateProposalStatus, useAcceptProposal, useDeleteProposal, useAdminDeleteProposal } from '../../queries/proposalQueries'
import { buildEncodedPath, genNoise } from '../../utils/obfuscate'
import axiosInstance from '../../helpers/axiosInstance'
import { hasPermission, isAdmin } from '../../helpers/permissions'
import Swal from 'sweetalert2'
import withContractorScope from '../../components/withContractorScope'
import ProposalAcceptanceModal from '../../components/ProposalAcceptanceModal'
import PermissionGate from '../../components/PermissionGate'
import PaginationComponent from '../../components/common/PaginationComponent'
import PageHeader from '../../components/PageHeader'
import { Badge, Box, Button, CardBody, Container, Flex, HStack, Heading, Icon, IconButton, Input, InputGroup, InputLeftElement, Menu, MenuButton, MenuItem, MenuList, Table, TableContainer, Tbody, Td, Text, Th, Thead, Tr, VStack, useColorModeValue } from '@chakra-ui/react'
import PageContainer from '../../components/PageContainer'
import StandardCard from '../../components/StandardCard'
import {
  Pencil,
  Trash2,
  Search,
  Plus,
  Send,
  Check,
  X,
  Lock,
  BarChart3,
  Briefcase,
  Send as SendIcon,
  CheckCircle,
} from 'lucide-react'
import { ICON_SIZE_MD, ICON_BOX_MD } from '../../constants/iconSizes'

const Proposals = ({ isContractor, contractorGroupId, contractorModules, contractorGroupName }) => {
  const { t } = useTranslation()
  const prefersReducedMotion = useReducedMotion()

  // Color mode values - MUST be before useState
  const cardBg = useColorModeValue("white", "gray.800")
  const iconGray400 = useColorModeValue("gray.400", "gray.500")
  const iconGray500 = useColorModeValue("gray.500", "gray.400")
  const iconBlue500 = useColorModeValue("blue.500", "blue.400")
  const borderGray600 = useColorModeValue("gray.600", "gray.400")
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('All')
  const [currentPage, setCurrentPage] = useState(1)
  const [showAcceptanceModal, setShowAcceptanceModal] = useState(false)
  const [selectedProposalForAcceptance, setSelectedProposalForAcceptance] = useState(null)
  const [mobileCount, setMobileCount] = useState(20)
  const itemsPerPage = 10
  const mobilePageSize = 20
  const navigate = useNavigate()

  // TanStack Query hooks
  const { data: proposalsData, isLoading: loading, error } = useProposals(contractorGroupId)
  const updateStatusMutation = useUpdateProposalStatus()
  const acceptProposalMutation = useAcceptProposal()
  const deleteProposalMutation = useDeleteProposal()
  const adminDeleteMutation = useAdminDeleteProposal()

  const proposal = Array.isArray(proposalsData) ? proposalsData : []

  // Get user data for permission checks
  const loggedInUser = JSON.parse(localStorage.getItem('user'))
  const canAssignDesigner = hasPermission(loggedInUser, 'admin:users')

  const tabs = [
    'All',
    'draft',
    'sent',
    'accepted',
    'rejected',
    'expired',
    // Legacy statuses for backward compatibility
    'Draft',
    'Measurement Scheduled',
    'Measurement done',
    'Design done',
    'Follow up 1',
    'Follow up 2',
    'Follow up 3',
    'Proposal accepted',
    'Proposal rejected',
  ]

  const getTabLabel = (tab) => {
    switch (tab) {
      case 'All':
        return t('proposals.tabs.all')
      case 'draft':
        return t('proposals.status.draft')
      case 'sent':
        return t('proposals.status.sent')
      case 'accepted':
        return t('proposals.status.accepted')
      case 'rejected':
        return t('proposals.status.rejected')
      case 'expired':
        return t('proposals.status.expired')
      case 'Draft':
        return t('proposals.status.draft')
      case 'Measurement Scheduled':
        return t('proposals.status.measurementScheduled')
      case 'Measurement done':
        return t('proposals.status.measurementDone')
      case 'Design done':
        return t('proposals.status.designDone')
      case 'Follow up 1':
        return t('proposals.status.followUp1')
      case 'Follow up 2':
        return t('proposals.status.followUp2')
      case 'Follow up 3':
        return t('proposals.status.followUp3')
      case 'Proposal accepted':
        return t('proposals.status.proposalAccepted')
      case 'Proposal rejected':
        return t('proposals.status.proposalRejected')
      default:
        return tab
    }
  }



  const getTabCounts = () => {
    const counts = {
      All: proposal?.length,
      draft: 0,
      sent: 0,
      accepted: 0,
      rejected: 0,
      expired: 0,
      // Legacy statuses
      Draft: 0,
      'Measurement Scheduled': 0,
      'Measurement done': 0,
      'Design done': 0,
      'Follow up 1': 0,
      'Follow up 2': 0,
      'Follow up 3': 0,
      'Proposal accepted': 0,
      'Proposal rejected': 0,
    }

    proposal?.forEach((item) => {
      const status = item.status || 'draft'
      if (counts[status] !== undefined) {
        counts[status]++
      }
    })

    return counts
  }

  const tabCounts = getTabCounts()

  const filteredProposals = proposal?.filter((item) => {
    // By default, hide accepted/locked items from the All tab so accepted quotes "disappear" from quotes
    const normalized = (item.status || '').toLowerCase()
    const isAcceptedLike =
      normalized === 'accepted' || item.status === 'Proposal accepted' || item.is_locked
    if (activeTab === 'All' && isAcceptedLike) return false

    const matchStatus = activeTab === 'All' || item.status === activeTab
    const customerName = item.customer?.name || ''
    const matchSearch =
      searchTerm === '' || customerName.toLowerCase().includes(searchTerm.toLowerCase())

    return matchStatus && matchSearch
  })

  const paginatedItems = filteredProposals?.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  )

  // Mobile items for progressive loading
  const mobileItems = filteredProposals?.slice(0, mobileCount) || []

  const totalPages = Math.ceil((filteredProposals?.length || 0) / itemsPerPage)

  const handlePageChange = (number) => {
    setCurrentPage(number)
  }

  const handleCreateProposal = () => {
    navigate('/quotes/create')
  }

  const handleCreateQuickProposal = () => {
    navigate('/quotes/create?quick=yes')
  }

  const getAvailableActions = (proposal) => {
    const status = proposal.status?.toLowerCase() || 'draft'
    const isLocked = proposal.is_locked

    if (isLocked) {
      return [] // No actions available for locked proposals
    }

    const actions = []

    switch (status) {
      case 'draft':
        actions.push({
          type: 'send',
          label: t('proposals.actions.send'),
          icon: Send,
          colorScheme: 'blue',
        })
        actions.push({
          type: 'share',
          label: t('proposals.actions.share'),
          icon: SendIcon,
          colorScheme: 'blue',
        })
        break
      case 'sent':
        actions.push({
          type: 'accept',
          label: t('proposals.actions.accept'),
          icon: Check,
          colorScheme: 'green',
        })
        actions.push({
          type: 'reject',
          label: t('proposals.actions.reject'),
          icon: X,
          colorScheme: 'red',
        })
        actions.push({
          type: 'share',
          label: t('proposals.actions.share'),
          icon: SendIcon,
          colorScheme: 'blue',
        })
        break
      case 'rejected':
      case 'expired':
        actions.push({
          type: 'send',
          label: t('proposals.actions.resend'),
          icon: Send,
          colorScheme: 'blue',
        })
        actions.push({
          type: 'share',
          label: t('proposals.actions.share'),
          icon: SendIcon,
          colorScheme: 'blue',
        })
        break
      default:
        break
    }
    // Hide internal-only actions for contractors until fully implemented
    if (isContractor) {
      return actions.filter((a) => a.type !== 'send' && a.type !== 'share')
    }

    return actions
  }

  const renderStatusActions = (proposal) => {
    const availableActions = getAvailableActions(proposal)

    return availableActions.map((action) => {
      const IconComponent = action.icon
      return (
        <IconButton
          key={action.type}
          aria-label={action.label}
          icon={<IconComponent size={ICON_SIZE_MD} />}
          variant="outline"
          colorScheme={action.colorScheme}
          minW="44px"
          minH="44px"
          onClick={() => {
            if (action.type === 'send') {
              handleSendProposal(proposal.id)
            } else if (action.type === 'accept') {
              handleAcceptProposal(proposal)
            } else if (action.type === 'reject') {
              handleRejectProposal(proposal.id)
            } else if (action.type === 'share') {
              handleCreateShareLink(proposal)
            }
          }}
        />
      )
    })
  }

  const handleStatusAction = async (proposalId, action, newStatus) => {
    try {
      await updateStatusMutation.mutateAsync({ id: proposalId, action, status: newStatus })
      const successMap = {
        send: t('proposals.toast.successSend'),
        accept: t('proposals.toast.successAccept'),
        reject: t('proposals.toast.successReject'),
      }
      Swal.fire(
        t('common.success') || 'Success',
        successMap[action] || t('proposals.toast.successSend'),
        'success',
      )
    } catch (error) {
      console.error('Status update error:', error)
      Swal.fire(t('common.error'), error.message || t('proposals.toast.errorGeneric'), 'error')
    }
  }

  const handleSendProposal = (proposalId) => {
    // Defense-in-depth: contractors should not trigger send
    if (isContractor) return
    Swal.fire({
      title: t('proposals.confirm.sendTitle'),
      text: t('proposals.confirm.sendText'),
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: t('proposals.confirm.sendConfirm'),
      cancelButtonText: t('proposals.confirm.cancel'),
    }).then((result) => {
      if (result.isConfirmed) {
        handleStatusAction(proposalId, 'send', 'sent')
      }
    })
  }

  const handleAcceptProposal = (proposal) => {
    setSelectedProposalForAcceptance(proposal)
    setShowAcceptanceModal(true)
  }

  const handleAcceptanceComplete = () => {
    // Refresh proposals list (for counts) and redirect to Orders so users immediately see the new order
    setSelectedProposalForAcceptance(null)
    const ordersPath = isContractor ? '/my-orders' : '/orders'
    navigate(ordersPath)
  }

  const handleRejectProposal = (proposalId) => {
    Swal.fire({
      title: t('proposals.confirm.rejectTitle'),
      text: t('proposals.confirm.rejectText'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: t('proposals.confirm.rejectConfirm'),
      cancelButtonText: t('proposals.confirm.cancel'),
    }).then((result) => {
      if (result.isConfirmed) {
        handleStatusAction(proposalId, 'reject', 'rejected')
      }
    })
  }

  const handleDelete = (id) => {
    Swal.fire({
      title: t('proposals.confirm.deleteTitle'),
      text: t('proposals.confirm.deleteText'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'var(--chakra-colors-red-500)',
      cancelButtonColor: 'var(--chakra-colors-blue-500)',
      confirmButtonText: t('proposals.confirm.deleteConfirm'),
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const user = JSON.parse(localStorage.getItem('user'))
          const mutation = isAdmin(user) ? adminDeleteMutation : deleteProposalMutation
          await mutation.mutateAsync(id)
          Swal.fire(
            t('common.deleted') || 'Deleted',
            t('proposals.toast.deleted') || 'Your quote has been deleted.',
            'success',
          )
        } catch (error) {
          Swal.fire(
            t('common.error'),
            t('proposals.toast.deleteFailed') || 'Failed to delete the quote.',
            'error',
          )
        }
      }
    })
  }

  const handleCreateShareLink = async (proposal) => {
    // Defense-in-depth: contractors should not create share links
    if (isContractor) return
    try {
      const res = await axiosInstance.post(`/api/quotes/${proposal.id}/sessions`)
      const payload = res.data
      if (!payload?.success) throw new Error(payload?.message || 'Failed to create share link')
      const { token, expires_at } = payload.data || {}
      if (!token) throw new Error('Session token missing in response')
      const link = `${window.location.origin}/p/${encodeURIComponent(token)}`
      const expiryStr = expires_at ? new Date(expires_at).toLocaleString() : t('common.na')

      await Swal.fire({
        title: t('proposals.share.createdTitle'),
        html: `
          <div class="mb-2">${t('proposals.share.expires')} <b>${expiryStr}</b></div>
          <input id="share-link" class="swal2-input" value="${link}" readonly />
        `,
        showCancelButton: true,
        confirmButtonText: t('proposals.share.copy'),
        didOpen: () => {
          const el = document.getElementById('share-link')
          if (el) {
            el.focus()
            el.select()
          }
        },
        preConfirm: async () => {
          try {
            await navigator.clipboard.writeText(link)
          } catch (e) {
            /* ignore */
          }
        },
      })

      // TanStack Query will automatically refresh the list after mutations
    } catch (err) {
      console.error('Create share link error:', err)
      Swal.fire(t('common.error'), err.message || t('proposals.share.error'), 'error')
    }
  }

  const handleNavigate = (id) => {
    const noisy = `/${genNoise(6)}/${genNoise(8)}` + buildEncodedPath('/quotes/edit/:id', { id })
    navigate(noisy)
  }

  const getStatusColor = (status) => {
    const normalized = (status || '').toLowerCase()
    switch (normalized) {
      case 'accepted':
      case 'proposal accepted':
        return 'success'
      case 'sent':
        return 'info'
      case 'rejected':
      case 'proposal rejected':
        return 'danger'
      case 'expired':
        return 'warning'
      case 'draft':
      default:
        return 'secondary'
    }
  }

  const getStatusColorScheme = (status) => {
    const colorMap = {
      success: 'green',
      info: 'blue',
      danger: 'red',
      warning: 'orange',
      secondary: 'gray',
      primary: 'blue',
    }
    return colorMap[getStatusColor(status)] || 'gray'
  }

  return (
    <PageContainer className="dashboard-container">
      {/* Scoped mobile layout improvements for Quotes */}
      <style>{`
        /* Visibility helpers hook into our global _responsive.scss classes */
        .q-toolbar { position: sticky; top: 0; z-index: 1030; background: var(--chakra-colors-chakra-body-bg); padding: .5rem; border-bottom: 1px solid var(--chakra-colors-chakra-border-color); }
        .q-chips { display: grid; grid-auto-flow: column; grid-auto-columns: max-content; gap: .5rem; overflow-x: auto; -webkit-overflow-scrolling: touch; padding: .25rem .125rem; }
        .q-search .form-control { min-height: 44px; }
        .q-list { display: grid; gap: .5rem; content-visibility: auto; contain-intrinsic-size: 300px; }
        .q-list .card--compact { border-radius: 12px; border: 1px solid var(--chakra-colors-chakra-border-color); }
        .q-list .card__head { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: .5rem; }
        .q-list .status-pill { justify-self: end; }
        .q-actions { display: flex; gap: .375rem; align-items: center; margin-top: .5rem; }
        .q-actions .icon-btn, .q-actions .btn-icon { min-width: 44px; min-height: 44px; }
        .bottom-bar { position: sticky; bottom: 0; z-index: 1030; display: grid; grid-template-columns: 1fr 1fr; gap: .5rem; padding: .5rem; background: var(--chakra-colors-chakra-body-bg); border-top: 1px solid var(--chakra-colors-chakra-border-color); }
        .clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        /* Desktop table wrapper */
        .table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
      `}</style>
      {/* Header Section */}
      <PageHeader
        title={t('proposals.header')}
        subtitle={t('proposals.subtitle')}
        icon={Briefcase}
      >
        <PermissionGate permission="proposals:create">
          <motion.div whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}>
            <Button variant="outline" onClick={handleCreateProposal}>
              <Plus size={ICON_SIZE_MD} style={{ marginRight: 8 }} />
              {t('proposals.new')}
            </Button>
          </motion.div>
        </PermissionGate>
        <PermissionGate permission="proposals:create">
          <motion.div whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}>
            <Button colorScheme="green" onClick={handleCreateQuickProposal}>
              {t('proposals.quick')}
            </Button>
          </motion.div>
        </PermissionGate>
      </PageHeader>

      {/* Status Tabs (desktop only) */}
      <Box display={{ base: 'none', lg: 'block' }} mb={4}>
        <HStack spacing={4} wrap="wrap">
          {tabs.map((tab, idx) => {
            const isActive = activeTab === tab
            const count = tabCounts[tab] || 0
            if (count === 0 && tab !== 'All' && !tabs.slice(0, 6).includes(tab)) return null
            return (
              <Button
                key={idx}
                variant={isActive ? 'solid' : 'outline'}
                colorScheme={isActive ? 'brand' : 'gray'}
                minH="44px"
                maxW="220px"
                onClick={() => {
                  setActiveTab(tab)
                  setCurrentPage(1)
                }}
                rightIcon={
                  <Badge colorScheme={isActive ? 'brand' : 'gray'} fontSize="xs">
                    {count}
                  </Badge>
                }
              >
                <Text noOfLines={1}>{getTabLabel(tab)}</Text>
              </Button>
            )
          })}
        </HStack>
      </Box>

      {/* Search and Filters (desktop only) */}
      <Box display={{ base: 'none', lg: 'block' }} mb={4}>
        <Flex justify="space-between" align="center" role="search">
          <Box flex={1} maxW={{ base: 'full', lg: '360px' }}>
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <Icon as={Search} boxSize={ICON_BOX_MD} color={iconGray400} />
              </InputLeftElement>
              <Input
                id="proposals-search"
                name="proposalsSearch"
                type="search"
                placeholder={t('proposals.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label={t('proposals.searchPlaceholder')}
                autoComplete="off"
              />
            </InputGroup>
          </Box>
          <Text fontSize="sm" color={iconGray500} aria-live="polite" aria-atomic="true">
            {t('proposals.showingCount', {
              count: filteredProposals?.length || 0,
              total: proposal?.length || 0,
            })}
          </Text>
        </Flex>
      </Box>

      {/* Desktop Table */}
      <Box display={{ base: 'none', lg: 'block' }}>
        <StandardCard>
          <CardBody p={0}>
            <TableContainer>
              <Table variant="simple">
              <Thead>
                <Tr>
                  <Th
                    scope="col"
                    position="sticky"
                    left={0}
                    bg={cardBg}
                    zIndex={1}
                  >
                    {t('proposals.headers.date')}
                  </Th>
                  <Th scope="col">{t('proposals.headers.quoteNumber', 'Quote #')}</Th>
                  <Th scope="col">{t('proposals.headers.customer')}</Th>
                  <Th scope="col">{t('proposals.headers.description')}</Th>
                  {canAssignDesigner && <Th scope="col">{t('proposals.headers.designer')}</Th>}
                  <Th scope="col">{t('proposals.headers.status')}</Th>
                  <Th scope="col" textAlign="center">{t('proposals.headers.actions')}</Th>
                </Tr>
              </Thead>
              <Tbody>
                {paginatedItems?.length === 0 ? (
                  <Tr>
                    <Td colSpan={canAssignDesigner ? 7 : 6} textAlign="center" py={8}>
                      <VStack spacing={4}>
                        <Search size={48} color="gray" />
                        <Text>{t('proposals.empty.title')}</Text>
                        <Text fontSize="sm" color={iconGray500}>
                          {t('proposals.empty.subtitle')}
                        </Text>
                      </VStack>
                    </Td>
                  </Tr>
                ) : (
                  paginatedItems?.map((item) => (
                    <Tr key={item.id}>
                      <Td>{new Date(item.date || item.createdAt).toLocaleDateString()}</Td>
                      <Td>{item.proposal_number || '-'}</Td>
                      <Td
                        fontWeight="medium"
                        cursor="pointer"
                        color={iconBlue500}
                        _hover={{ textDecoration: 'underline' }}
                        onClick={() =>
                          item.customer?.id && navigate(`/customers/edit/${item.customer.id}`)
                        }
                        isTruncated
                        maxW="200px"
                      >
                        {item.customer?.name || t('common.na')}
                      </Td>
                      <Td color={borderGray600} isTruncated maxW="250px">{item.description || t('common.na')}</Td>
                      {canAssignDesigner && <Td>{item.designerData?.name || t('common.na')}</Td>}
                      <Td>
                        <Badge colorScheme={getStatusColorScheme(item.status || 'Draft')}>
                          {getTabLabel(item.status || 'Draft')}
                        </Badge>
                      </Td>
                      <Td textAlign="center">
                        <HStack spacing={4} justify="center">
                          {renderStatusActions(item)}
                          <PermissionGate action="update" resource="proposal" item={item}>
                            <IconButton
                              aria-label={t('common.edit')}
                              icon={<Pencil size={ICON_SIZE_MD} />}
                              variant="ghost"
                              minW="44px"
                              minH="44px"
                              onClick={() => handleNavigate(item.id)}
                            />
                          </PermissionGate>
                          {(isAdmin(loggedInUser) || !item.is_locked) && (
                            <PermissionGate action="delete" resource="proposal" item={item}>
                              <IconButton
                                aria-label={t('common.delete')}
                                icon={<Trash2 size={ICON_SIZE_MD} />}
                                variant="ghost"
                                colorScheme="red"
                                minW="44px"
                                minH="44px"
                                onClick={() => handleDelete(item.id)}
                              />
                            </PermissionGate>
                          )}
                        </HStack>
                      </Td>
                    </Tr>
                  ))
                )}
              </Tbody>
            </Table>
            </TableContainer>
          </CardBody>
        </StandardCard>
      </Box>

      {/* Mobile Compact UI */}
      <Box display={{ base: 'block', lg: 'none' }}>
        {/* Compact card list */}
        <VStack spacing={4} align="stretch">
          {mobileItems.length === 0 ? (
            <StandardCard>
              <CardBody textAlign="center" py={8}>
                <VStack spacing={4}>
                  <Search size={32} color="gray" />
                  <Text>{t('proposals.empty.title')}</Text>
                  <Text fontSize="sm" color={iconGray500}>
                    {t('proposals.empty.subtitle')}
                  </Text>
                </VStack>
              </CardBody>
            </StandardCard>
          ) : (
            mobileItems.map((item) => (
              <StandardCard key={item.id}>
                <CardBody>
                  <Flex justify="space-between" align="center" mb={3}>
                    <Heading size="md">{item.customer?.name || t('common.na')}</Heading>
                    <Badge colorScheme={getStatusColorScheme(item.status || 'Draft')}>
                      {getTabLabel(item.status || 'Draft')}
                    </Badge>
                  </Flex>
                  <VStack spacing={4} align="stretch" mb={3}>
                    <Text fontSize="sm">
                      {new Date(item.date || item.createdAt).toLocaleDateString()}
                    </Text>
                    <Text fontSize="sm">
                      {t('proposals.headers.quoteNumber', 'Quote #')}: {item.proposal_number || '-'}
                    </Text>
                    {canAssignDesigner && (
                      <Text fontSize="sm">
                        {t('proposals.headers.designer')}:{' '}
                        {item.designerData?.name || t('common.na')}
                      </Text>
                    )}
                    {item.manufacturer?.name && <Text fontSize="sm">{item.manufacturer.name}</Text>}
                  </VStack>
                  {item.description && (
                    <Text fontSize="sm" color={borderGray600} mb={3} noOfLines={2}>
                      {item.description}
                    </Text>
                  )}
                  <HStack spacing={4}>
                    {/* Primary visible actions */}
                    {!item.is_locked && (
                      <IconButton
                        aria-label={t('proposals.actions.send')}
                        icon={<Send size={ICON_SIZE_MD} />}
                        variant="outline"
                        minW="44px"
                        minH="44px"
                        onClick={() => handleSendProposal(item.id)}
                      />
                    )}
                    <IconButton
                      aria-label={t('common.edit')}
                      icon={<Pencil size={ICON_SIZE_MD} />}
                      variant="outline"
                      minW="44px"
                      minH="44px"
                      onClick={() => handleNavigate(item.id)}
                    />
                    {/* Overflow menu for secondary actions */}
                    <Menu>
                      <MenuButton
                        as={IconButton}
                        aria-label={t('common.moreActions', 'More actions')}
                        icon={<Text fontSize="lg">⋮</Text>}
                        variant="outline"
                        minW="44px"
                        minH="44px"
                      />
                      <MenuList>
                        {(isAdmin(loggedInUser) || !item.is_locked) && (
                          <MenuItem onClick={() => handleDelete(item.id)}>
                            <Trash2 size={ICON_SIZE_MD} style={{ marginRight: 8 }} />
                            {t('common.delete')}
                          </MenuItem>
                        )}
                        <MenuItem onClick={() => handleCreateShareLink(item)}>
                          <SendIcon size={ICON_SIZE_MD} style={{ marginRight: 8 }} />
                          {t('proposals.actions.share')}
                        </MenuItem>
                      </MenuList>
                    </Menu>
                  </HStack>
                </CardBody>
              </StandardCard>
            ))
          )}
          {filteredProposals && mobileCount < filteredProposals.length && (
            <Box textAlign="center" mt={4}>
              <Button variant="outline" onClick={() => setMobileCount((c) => c + mobilePageSize)}>
                {t('common.loadMore', 'Load more')}
              </Button>
            </Box>
          )}
        </VStack>
      </Box>

      {/* Pagination */}
      <StandardCard mt={4}>
        <CardBody>
          <PaginationComponent
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            itemsPerPage={itemsPerPage}
          />
        </CardBody>
      </StandardCard>

      {/* Proposal Acceptance Modal */}
      <ProposalAcceptanceModal
        show={showAcceptanceModal}
        onClose={() => setShowAcceptanceModal(false)}
        proposal={selectedProposalForAcceptance}
        onAcceptanceComplete={handleAcceptanceComplete}
        isContractor={isContractor}
      />
    </PageContainer>
  )
}

export default withContractorScope(Proposals, 'proposals')
