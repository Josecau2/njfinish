import React, { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { buildEncodedPath, genNoise } from '../../utils/obfuscate'
import { Container, Card, CardBody, CardHeader, Flex, Box, Input, Badge, Spinner, Alert, Icon, InputGroup, InputLeftElement, Button, Table, Thead, Tbody, Tr, Th, Td, TableContainer } from '@chakra-ui/react'
import { fetchContractors } from '../../store/slices/contractorSlice'
import PaginationComponent from '../../components/common/PaginationComponent'
import {
  Search,
  Users,
  User,
  List as ViewModule,
  BriefcaseBusiness as Briefcase,
  BarChart3 as ChartBar,
  Settings,
} from 'lucide-react'

const Contractors = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const {
    list: contractors,
    loading,
    error,
    pagination,
  } = useSelector((state) => state.contractors)

  const [searchTerm, setSearchTerm] = useState('')
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    dispatch(fetchContractors({ page: currentPage, limit: itemsPerPage }))
  }, [dispatch, currentPage, itemsPerPage])

  const handleSort = (key) => {
    setSortConfig((prev) => {
      const direction = prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
      return { key, direction }
    })
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  const handleView = (contractor) => {
    const noisy =
      `/${genNoise(6)}/${genNoise(8)}` +
      buildEncodedPath('/admin/contractors/:id', { id: contractor.id })
    navigate(noisy)
  }

  const sortedFilteredContractors = useMemo(() => {
    // Safety check for undefined contractors
    if (!contractors || !Array.isArray(contractors)) {
      return []
    }

    let filtered = contractors.filter((contractor) =>
      contractor.name?.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aVal = a[sortConfig.key]
        let bVal = b[sortConfig.key]

        if (
          sortConfig.key === 'user_count' ||
          sortConfig.key === 'customer_count' ||
          sortConfig.key === 'proposal_count'
        ) {
          aVal = parseInt(aVal) || 0
          bVal = parseInt(bVal) || 0
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    }

    return filtered
  }, [contractors, searchTerm, sortConfig])

  const getModuleBadges = (modules) => {
    if (!modules) return null

    const moduleLabels = {
      dashboard: t('contractorsAdmin.modules.dashboard'),
      proposals: t('contractorsAdmin.modules.proposals'),
      customers: t('contractorsAdmin.modules.customers'),
      resources: t('contractorsAdmin.modules.resources'),
    }

    return Object.entries(modules)
      .filter(([key, value]) => value === true)
      .map(([key]) => (
        <Badge key={key} status="info" className="me-1">
          {moduleLabels[key] || key}
        </Badge>
      ))
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'

    try {
      const date = new Date(dateString)
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return 'N/A'
      }
      return date.toLocaleDateString()
    } catch (error) {
      console.error('Error formatting date:', error)
      return 'N/A'
    }
  }

  const totalPages = pagination?.totalPages || 1

  if (loading && contractors.length === 0) {
    return (
      <Container>
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ minHeight: '200px' }}
        >
          <Spinner colorScheme="blue" />
        </div>
      </Container>
    )
  }

  return (
    <Container className="px-4">
      <Flex>
        <Box xs={12}>
          <Card className="mb-4">
            <CardHeader>
              <strong>
                <Users className="me-2" size={18} aria-hidden="true" />
                {t('contractorsAdmin.header')}
              </strong>
            </CardHeader>

            <CardBody>
              {error && (
                <Alert status="error" className="mb-3">
                  {error}
                </Alert>
              )}

              {/* Search and Stats */}
              <Flex className="mb-4">
                <Box md={6}>
                  <InputGroup>
                    <InputLeftElement aria-hidden="true">
                      <Search size={16} />
                    </InputLeftElement>
                    <Input
                      type="text"
                      placeholder={t('contractorsAdmin.searchPlaceholder')}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </InputGroup>
                </Box>
                <Box md={6} className="d-flex justify-content-end align-items-center">
                  <div className="text-muted">
                    <small>
                      {t('contractorsAdmin.showing', {
                        count: sortedFilteredContractors?.length || 0,
                        total: pagination?.total || 0,
                      })}
                    </small>
                  </div>
                </Box>
              </Flex>

              {/* Stats Cards */}
              <Flex className="mb-4">
                <Box sm={6} lg={3}>
                  <div className="border-start border-start-4 border-start-info py-1 px-3">
                    <div className="text-muted small">
                      {t('contractorsAdmin.stats.totalContractors')}
                    </div>
                    <div className="fs-5 fw-semibold">{pagination?.total || 0}</div>
                </Box>
                <Box sm={6} lg={3}>
                  <div className="border-start border-start-4 border-start-success py-1 px-3">
                    <div className="text-muted small">{t('contractorsAdmin.stats.totalUsers')}</div>
                    <div className="fs-5 fw-semibold">
                      {(contractors || []).reduce(
                        (sum, c) => sum + (parseInt(c.user_count) || 0),
                        0,
                      )}
                    </div>
                </Box>
                <Box sm={6} lg={3}>
                  <div className="border-start border-start-4 border-start-warning py-1 px-3">
                    <div className="text-muted small">
                      {t('contractorsAdmin.stats.totalCustomers')}
                    </div>
                    <div className="fs-5 fw-semibold">
                      {(contractors || []).reduce(
                        (sum, c) => sum + (parseInt(c.customer_count) || 0),
                        0,
                      )}
                    </div>
                </Box>
                <Box sm={6} lg={3}>
                  <div className="border-start border-start-4 border-start-danger py-1 px-3">
                    <div className="text-muted small">
                      {t('contractorsAdmin.stats.totalProposals')}
                    </div>
                    <div className="fs-5 fw-semibold">
                      {(contractors || []).reduce(
                        (sum, c) => sum + (parseInt(c.proposal_count) || 0),
                        0,
                      )}
                    </div>
                </Box>
              </Flex>

              {/* Desktop Table */}
              <TableContainer className="table-wrap d-none d-md-block">
                <Table variant="striped" className="table-modern">
                  <Thead>
                    <Tr>
                      <Th
                        className="cursor-pointer"
                        onClick={() => handleSort('name')}
                      >
                        {t('contractorsAdmin.table.contractorName')}
                      </Th>
                      <Th
                        className="cursor-pointer text-center"
                        onClick={() => handleSort('user_count')}
                      >
                        {t('contractorsAdmin.table.users')}
                      </Th>
                      <Th
                        className="cursor-pointer text-center"
                        onClick={() => handleSort('customer_count')}
                      >
                        {t('contractorsAdmin.table.customers')}
                      </Th>
                      <Th
                        className="cursor-pointer text-center"
                        onClick={() => handleSort('proposal_count')}
                      >
                        {t('contractorsAdmin.table.proposals')}
                      </Th>
                      <Th>
                        {t('contractorsAdmin.table.modules')}
                      </Th>
                      <Th
                        className="cursor-pointer"
                        onClick={() => handleSort('created_at')}
                      >
                        {t('contractorsAdmin.table.created')}
                      </Th>
                      <Th className="text-center">
                        {t('contractorsAdmin.table.actions')}
                      </Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {sortedFilteredContractors?.length === 0 ? (
                      <Tr>
                        <Td colSpan="7" className="text-center py-4">
                          <Search size={28} className="mb-3 opacity-50" aria-hidden="true" />
                          <p className="text-muted mb-0">{t('contractorsAdmin.empty.title')}</p>
                          <small>{t('contractorsAdmin.empty.tryAdjusting')}</small>
                        </Td>
                      </Tr>
                    ) : (
                      sortedFilteredContractors?.map((contractor) => (
                        <Tr key={contractor.id} className="align-middle">
                          <Td>
                            <div className="d-flex align-items-center">
                              <Users className="me-2 text-muted" size={18} aria-hidden="true" />
                              <div>
                                <div className="fw-semibold">{contractor.name}</div>
                                <small className="text-muted">ID: {contractor.id}</small>
                              </div>
                            </div>
                          </Td>
                          <Td className="text-center">
                            <Badge colorScheme="blue">{contractor.user_count || 0}</Badge>
                          </Td>
                          <Td className="text-center">
                            <Badge colorScheme="orange">{contractor.customer_count || 0}</Badge>
                          </Td>
                          <Td className="text-center">
                            <Badge colorScheme="green">{contractor.proposal_count || 0}</Badge>
                          </Td>
                          <Td>
                            <div className="d-flex flex-wrap gap-1">
                              {getModuleBadges(contractor.modules) || (
                                <small className="text-muted">
                                  {t('contractorsAdmin.noModules')}
                                </small>
                              )}
                            </div>
                          </Td>
                          <Td>
                            <small className="text-muted">
                              {formatDate(contractor.created_at)}
                            </small>
                          </Td>
                          <Td className="text-center">
                            <Button
                              variant="outline"
                              colorScheme="blue"
                              size="sm"
                              onClick={() => handleView(contractor)}
                              className="icon-btn"
                              aria-label={t('contractorsAdmin.actions.viewDetails')}
                              title={t('contractorsAdmin.actions.viewDetails')}
                            >
                              <ChartBar size={16} aria-hidden="true" />
                            </Button>
                          </Td>
                        </Tr>
                      ))
                    )}
                  </Tbody>
                </Table>
              </TableContainer>

              {/* Mobile Card Layout */}
              <div className="d-md-none">
                {sortedFilteredContractors?.length === 0 ? (
                  <Card>
                    <CardBody className="text-center py-4">
                      <Search size={28} className="mb-3 opacity-50" aria-hidden="true" />
                      <p className="text-muted mb-0">{t('contractorsAdmin.empty.title')}</p>
                      <small>{t('contractorsAdmin.empty.tryAdjusting')}</small>
                    </CardBody>
                  </Card>
                ) : (
                  <div className="mobile-contractor-cards">
                    {sortedFilteredContractors?.map((contractor) => (
                      <Card key={contractor.id} className="mb-3 contractor-mobile-card">
                        <CardBody className="p-3">
                          {/* Header with name and action */}
                          <div className="d-flex justify-content-between align-items-start mb-3">
                            <div className="d-flex align-items-center flex-grow-1">
                              <Users className="me-2 text-muted" size={18} aria-hidden="true" />
                              <div className="flex-grow-1 min-width-0">
                                <div className="fw-semibold text-truncate" title={contractor.name}>
                                  {contractor.name}
                                </div>
                                <small className="text-muted">ID: {contractor.id}</small>
                              </div>
                            <Button
                              variant="outline"
                              colorScheme="blue"
                              size="sm"
                              onClick={() => handleView(contractor)}
                              title={t('contractorsAdmin.actions.viewDetails')}
                              aria-label={t('contractorsAdmin.actions.viewDetails')}
                              className="ms-2 contractor-action-btn icon-btn"
                            >
                              <ChartBar size={16} aria-hidden="true" />
                            </Button>
                          </div>

                          {/* Stats row */}
                          <div className="row g-2 mb-3">
                            <div className="col-4 text-center">
                              <div className="small text-muted">
                                {t('contractorsAdmin.table.users')}
                              </div>
                              <Badge colorScheme="blue" className="w-100">
                                {contractor.user_count || 0}
                              </Badge>
                            </div>
                            <div className="col-4 text-center">
                              <div className="small text-muted">
                                {t('contractorsAdmin.table.customers')}
                              </div>
                              <Badge colorScheme="orange" className="w-100">
                                {contractor.customer_count || 0}
                              </Badge>
                            </div>
                            <div className="col-4 text-center">
                              <div className="small text-muted">
                                {t('contractorsAdmin.table.proposals')}
                              </div>
                              <Badge colorScheme="green" className="w-100">
                                {contractor.proposal_count || 0}
                              </Badge>
                            </div>

                          {/* Modules */}
                          <div className="mb-2">
                            <div className="small text-muted mb-1">
                              {t('contractorsAdmin.table.modules')}
                            </div>
                            <div className="d-flex flex-wrap gap-1">
                              {getModuleBadges(contractor.modules) || (
                                <small className="text-muted">
                                  {t('contractorsAdmin.noModules')}
                                </small>
                              )}
                            </div>
                          </div>

                          {/* Created date */}
                          <div className="text-end">
                            <small className="text-muted">
                              {t('contractorsAdmin.table.created')}:{' '}
                              {formatDate(contractor.created_at)}
                            </small>
                          </div>
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="p-3 border-top border-light">
                  <PaginationComponent
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    itemsPerPage={itemsPerPage}
                  />
                </div>
              )}
            </CardBody>
          </Card>
        </Box>
      </Flex>
    </Container>
  )
}

export default Contractors
