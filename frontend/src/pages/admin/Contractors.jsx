import StandardCard from '../../components/StandardCard'

import React, { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Alert, AlertIcon, Badge, Box, Button, Container, Flex, HStack, Icon, Input, InputGroup, InputLeftElement, SimpleGrid, Spinner, Stack, Table, TableContainer, Tbody, Td, Th, Thead, Tr, Text } from '@chakra-ui/react'
import { Search, Users, User, Layers, BriefcaseBusiness as Briefcase, BarChart3 as ChartBar } from 'lucide-react'

import { buildEncodedPath, genNoise } from '../../utils/obfuscate'
import { fetchContractors } from '../../store/slices/contractorSlice'
import PaginationComponent from '../../components/common/PaginationComponent'
import PageHeader from '../../components/PageHeader'
import { ICON_SIZE_MD, ICON_BOX_MD } from '../../constants/iconSizes'

const Contractors = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const { list: contractors, loading, error, pagination } = useSelector((state) => state.contractors)

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

  const handlePageChange = (page) => setCurrentPage(page)

  const handleView = (contractor) => {
    const noisy = `/${genNoise(6)}/${genNoise(8)}` + buildEncodedPath('/admin/contractors/:id', { id: contractor.id })
    navigate(noisy)
  }

  const sortedFilteredContractors = useMemo(() => {
    if (!Array.isArray(contractors)) return []

    let filtered = contractors.filter((contractor) =>
      contractor.name?.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    if (sortConfig.key) {
      filtered = [...filtered].sort((a, b) => {
        let aVal = a[sortConfig.key]
        let bVal = b[sortConfig.key]

        if (['user_count', 'customer_count', 'proposal_count'].includes(sortConfig.key)) {
          aVal = Number(aVal) || 0
          bVal = Number(bVal) || 0
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

    const enabledModules = Object.entries(modules)
      .filter(([, value]) => value === true)
      .map(([key]) => (
        <Badge key={key} colorScheme="blue" variant="subtle">
          {moduleLabels[key] || key}
        </Badge>
      ))

    return enabledModules.length > 0 ? enabledModules : <Text fontSize="xs" color="gray.500">{t('contractorsAdmin.noModules')}</Text>
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    if (Number.isNaN(date.getTime())) return 'N/A'
    return date.toLocaleDateString()
  }

  const totalPages = pagination?.totalPages || 1
  const totalContractors = pagination?.total || sortedFilteredContractors.length
  const totalUsers = sortedFilteredContractors.reduce((sum, contractor) => sum + (Number(contractor.user_count) || 0), 0)
  const totalCustomers = sortedFilteredContractors.reduce((sum, contractor) => sum + (Number(contractor.customer_count) || 0), 0)
  const totalProposals = sortedFilteredContractors.reduce((sum, contractor) => sum + (Number(contractor.proposal_count) || 0), 0)

  if (loading && (!contractors || contractors.length === 0)) {
    return (
      <Container maxW="6xl" py={12} textAlign="center">
        <Spinner size="lg" color="blue.500" thickness="4px" speed="0.7s" />
      </Container>
    )
  }

  return (
    <Container maxW="6xl" py={6}>
      <PageHeader
        title={t('contractorsAdmin.title', 'Contractors')}
        subtitle={t('contractorsAdmin.subtitle', 'Manage contractor accounts and module access')}
        icon={Briefcase}
      />

      <Stack spacing={6}>
        {error && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            {error}
          </Alert>
        )}

        <StandardCard variant="outline" borderRadius="xl" shadow="sm">
          <CardBody>
            <Stack spacing={5}>
              <InputGroup maxW={{ base: 'full', lg: '360px' }}>
                <InputLeftElement pointerEvents="none">
                  <Icon as={Search} boxSize={ICON_BOX_MD} color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder={t('contractorsAdmin.searchPlaceholder', 'Search contractors')}
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  minH="44px"
                />
              </InputGroup>

              <SimpleGrid columns={{ base: 1, lg: 4 }} spacing={4}>
                <Box bg="blue.50" borderRadius="lg" p={4}>
                  <HStack spacing={4} align="center">
                    <Icon as={Users} boxSize={ICON_BOX_MD} color="blue.600" />
                    <Box>
                      <Text fontSize="xs" color="blue.700" textTransform="uppercase" fontWeight="semibold">
                        {t('contractorsAdmin.stats.totalContractors', 'Total Contractors')}
                      </Text>
                      <Text fontSize="lg" fontWeight="bold" color="blue.800">
                        {totalContractors}
                      </Text>
                    </Box>
                  </HStack>
                </Box>
                <Box bg="teal.50" borderRadius="lg" p={4}>
                  <HStack spacing={4} align="center">
                    <Icon as={User} boxSize={ICON_BOX_MD} color="teal.600" />
                    <Box>
                      <Text fontSize="xs" color="teal.700" textTransform="uppercase" fontWeight="semibold">
                        {t('contractorsAdmin.table.users', 'Users')}
                      </Text>
                      <Text fontSize="lg" fontWeight="bold" color="teal.800">
                        {totalUsers}
                      </Text>
                    </Box>
                  </HStack>
                </Box>
                <Box bg="orange.50" borderRadius="lg" p={4}>
                  <HStack spacing={4} align="center">
                    <Icon as={Layers} boxSize={ICON_BOX_MD} color="orange.600" />
                    <Box>
                      <Text fontSize="xs" color="orange.700" textTransform="uppercase" fontWeight="semibold">
                        {t('contractorsAdmin.table.customers', 'Customers')}
                      </Text>
                      <Text fontSize="lg" fontWeight="bold" color="orange.800">
                        {totalCustomers}
                      </Text>
                    </Box>
                  </HStack>
                </Box>
                <Box bg="green.50" borderRadius="lg" p={4}>
                  <HStack spacing={4} align="center">
                    <Icon as={ChartBar} boxSize={ICON_BOX_MD} color="green.600" />
                    <Box>
                      <Text fontSize="xs" color="green.700" textTransform="uppercase" fontWeight="semibold">
                        {t('contractorsAdmin.table.proposals', 'Proposals')}
                      </Text>
                      <Text fontSize="lg" fontWeight="bold" color="green.800">
                        {totalProposals}
                      </Text>
                    </Box>
                  </HStack>
                </Box>
              </SimpleGrid>
            </Stack>
          </CardBody>
        </StandardCard>

        <StandardCard variant="outline" borderRadius="xl" shadow="sm">
          <CardBody>
            <TableContainer>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>{t('contractorsAdmin.table.name', 'Name')}</Th>
                    <Th>{t('contractorsAdmin.table.users', 'Users')}</Th>
                    <Th>{t('contractorsAdmin.table.customers', 'Customers')}</Th>
                    <Th>{t('contractorsAdmin.table.proposals', 'Proposals')}</Th>
                    <Th>{t('contractorsAdmin.table.modules', 'Modules')}</Th>
                    <Th>{t('contractorsAdmin.table.created', 'Created')}</Th>
                    <Th textAlign="right">{t('contractorsAdmin.table.actions', 'Actions')}</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {sortedFilteredContractors.length === 0 ? (
                    <Tr>
                      <Td colSpan={7} textAlign="center" py={10}>
                        <Stack spacing={4} align="center">
                          <Icon as={Search} boxSize={8} color="gray.300" />
                          <Text color="gray.500">{t('contractorsAdmin.empty.title', 'No contractors found')}</Text>
                          <Text fontSize="sm" color="gray.400">
                            {t('contractorsAdmin.empty.tryAdjusting', 'Try adjusting your filters.')}
                          </Text>
                        </Stack>
                      </Td>
                    </Tr>
                  ) : (
                    sortedFilteredContractors.map((contractor) => (
                      <Tr key={contractor.id}>
                        <Td>
                          <Stack spacing={4}>
                            <Text fontWeight="semibold">{contractor.name}</Text>
                            <Text fontSize="xs" color="gray.500">
                              ID: {contractor.id}
                            </Text>
                          </Stack>
                        </Td>
                        <Td>{contractor.user_count || 0}</Td>
                        <Td>{contractor.customer_count || 0}</Td>
                        <Td>{contractor.proposal_count || 0}</Td>
                        <Td>
                          <HStack spacing={4} flexWrap="wrap">
                            {getModuleBadges(contractor.modules)}
                          </HStack>
                        </Td>
                        <Td>{formatDate(contractor.created_at)}</Td>
                        <Td textAlign="right">
                          <Button
                            size="sm"
                            variant="outline"
                            colorScheme="blue"
                            leftIcon={<Icon as={ChartBar} boxSize={ICON_BOX_MD} aria-hidden="true" />}
                            onClick={() => handleView(contractor)}
                            minH="36px"
                          >
                            {t('contractorsAdmin.actions.viewDetails', 'View Details')}
                          </Button>
                        </Td>
                      </Tr>
                    ))
                  )}
                </Tbody>
              </Table>
            </TableContainer>

            <Box display={{ base: 'block', lg: 'none' }} mt={6}>
              <Stack spacing={4}>
                {sortedFilteredContractors.map((contractor) => (
                  <StandardCard key={contractor.id} borderRadius="lg" variant="outline">
                    <CardBody>
                      <Stack spacing={4}>
                        <HStack justify="space-between" align="flex-start">
                          <Stack spacing={4}>
                            <Text fontWeight="semibold">{contractor.name}</Text>
                            <Text fontSize="xs" color="gray.500">
                              ID: {contractor.id}
                            </Text>
                          </Stack>
                          <Button
                            size="sm"
                            variant="outline"
                            colorScheme="blue"
                            onClick={() => handleView(contractor)}
                            leftIcon={<Icon as={ChartBar} boxSize={ICON_BOX_MD} aria-hidden="true" />}
                          >
                            {t('contractorsAdmin.actions.view', 'View')}
                          </Button>
                        </HStack>
                        <SimpleGrid columns={3} spacing={4}>
                          <Box textAlign="center">
                            <Text fontSize="xs" color="gray.500">
                              {t('contractorsAdmin.table.users', 'Users')}
                            </Text>
                            <Badge colorScheme="teal" borderRadius="full" px={3}>
                              {contractor.user_count || 0}
                            </Badge>
                          </Box>
                          <Box textAlign="center">
                            <Text fontSize="xs" color="gray.500">
                              {t('contractorsAdmin.table.customers', 'Customers')}
                            </Text>
                            <Badge colorScheme="orange" borderRadius="full" px={3}>
                              {contractor.customer_count || 0}
                            </Badge>
                          </Box>
                          <Box textAlign="center">
                            <Text fontSize="xs" color="gray.500">
                              {t('contractorsAdmin.table.proposals', 'Proposals')}
                            </Text>
                            <Badge colorScheme="green" borderRadius="full" px={3}>
                              {contractor.proposal_count || 0}
                            </Badge>
                          </Box>
                        </SimpleGrid>
                        <Stack spacing={4}>
                          <Text fontSize="xs" color="gray.500">
                            {t('contractorsAdmin.table.modules', 'Modules')}
                          </Text>
                          <HStack spacing={4} flexWrap="wrap" align="flex-start">
                            {getModuleBadges(contractor.modules)}
                          </HStack>
                        </Stack>
                        <Text fontSize="xs" color="gray.500" textAlign="right">
                          {t('contractorsAdmin.table.created', 'Created')}: {formatDate(contractor.created_at)}
                        </Text>
                      </Stack>
                    </CardBody>
                  </StandardCard>
                ))}
              </Stack>
            </Box>

            {totalPages > 1 && (
              <Box mt={6} pt={4} borderTopWidth="1px" borderColor="gray.100">
                <PaginationComponent
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  itemsPerPage={itemsPerPage}
                />
              </Box>
            )}
          </CardBody>
        </StandardCard>
      </Stack>
    </Container>
  )
}

export default Contractors
