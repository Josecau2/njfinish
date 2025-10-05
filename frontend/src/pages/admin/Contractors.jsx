import StandardCard from '../../components/StandardCard'
import { TableCard } from '../../components/TableCard'

import React, { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  CardBody,
  Container,
  Flex,
  HStack,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
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
  Tr,
  useColorModeValue,
} from '@chakra-ui/react'
import PageContainer from '../../components/PageContainer'
import {
  Search,
  Users,
  User,
  Layers,
  BriefcaseBusiness as Briefcase,
  BarChart3 as ChartBar,
} from 'lucide-react'

import { buildEncodedPath, genNoise } from '../../utils/obfuscate'
import { fetchContractors } from '../../store/slices/contractorSlice'
import PaginationComponent from '../../components/common/PaginationComponent'
import PageHeader from '../../components/PageHeader'
import { ICON_SIZE_MD, ICON_BOX_MD } from '../../constants/iconSizes'

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

  // Color mode values
  const textGray500 = useColorModeValue('gray.500', 'gray.400')
  const textGray400 = useColorModeValue('gray.400', 'gray.500')
  const spinnerColor = useColorModeValue('blue.500', 'blue.300')
  const iconGray = useColorModeValue('gray.400', 'gray.500')
  const bgBlue = useColorModeValue('blue.50', 'blue.900')
  const iconBlue = useColorModeValue('blue.600', 'blue.300')
  const textBlue700 = useColorModeValue('blue.700', 'blue.300')
  const textBlue800 = useColorModeValue('blue.800', 'blue.200')
  const bgTeal = useColorModeValue('teal.50', 'teal.900')
  const bgOrange = useColorModeValue('orange.50', 'orange.900')
  const bgGreen = useColorModeValue('green.50', 'green.900')
  const iconGreen = useColorModeValue('green.600', 'green.300')
  const textGreen700 = useColorModeValue('green.700', 'green.300')
  const textGreen800 = useColorModeValue('green.800', 'green.200')
  const iconGray300 = useColorModeValue('gray.300', 'gray.600')
  const borderGray = useColorModeValue('gray.100', 'gray.700')

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
    const noisy =
      `/${genNoise(6)}/${genNoise(8)}` +
      buildEncodedPath('/admin/contractors/:id', { id: contractor.id })
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
        <Badge key={key} colorScheme="brand" variant="subtle">
          {moduleLabels[key] || key}
        </Badge>
      ))

    return enabledModules.length > 0 ? (
      enabledModules
    ) : (
      <Text fontSize="xs" color={textGray500}>
        {t('contractorsAdmin.noModules')}
      </Text>
    )
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    if (Number.isNaN(date.getTime())) return 'N/A'
    return date.toLocaleDateString()
  }

  const totalPages = pagination?.totalPages || 1
  const totalContractors = pagination?.total || sortedFilteredContractors.length
  const totalUsers = sortedFilteredContractors.reduce(
    (sum, contractor) => sum + (Number(contractor.user_count) || 0),
    0,
  )
  const totalCustomers = sortedFilteredContractors.reduce(
    (sum, contractor) => sum + (Number(contractor.customer_count) || 0),
    0,
  )
  const totalProposals = sortedFilteredContractors.reduce(
    (sum, contractor) => sum + (Number(contractor.proposal_count) || 0),
    0,
  )

  if (loading && (!contractors || contractors.length === 0)) {
    return (
      <PageContainer textAlign="center">
        <Spinner size="lg" color={spinnerColor} thickness="4px" speed="0.7s" />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
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
              <Box flex={1} maxW={{ base: 'full', lg: '360px' }}>
                <InputGroup>
                  <InputLeftElement pointerEvents="none">
                    <Icon as={Search} boxSize={ICON_BOX_MD} color={iconGray} />
                  </InputLeftElement>
                  <Input
                    type="search"
                    placeholder={t('contractorsAdmin.searchPlaceholder', 'Search contractors')}
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    aria-label={t('contractorsAdmin.searchPlaceholder', 'Search contractors')}
                    minH="44px"
                  />
                </InputGroup>
              </Box>

              <SimpleGrid columns={{ base: 1, lg: 4 }} spacing={4}>
                <Box bg={bgBlue} borderRadius="lg" p={4}>
                  <HStack spacing={4} align="center">
                    <Icon as={Users} boxSize={ICON_BOX_MD} color={iconBlue} />
                    <Box>
                      <Text
                        fontSize="xs"
                        color={textBlue700}
                        textTransform="uppercase"
                        fontWeight="semibold"
                      >
                        {t('contractorsAdmin.stats.totalContractors', 'Total Contractors')}
                      </Text>
                      <Text fontSize="lg" fontWeight="bold" color={textBlue800}>
                        {totalContractors}
                      </Text>
                    </Box>
                  </HStack>
                </Box>
                <Box bg={bgTeal} borderRadius="lg" p={4}>
                  <HStack spacing={4} align="center">
                    <Icon as={User} boxSize={ICON_BOX_MD} color="teal.600" />
                    <Box>
                      <Text
                        fontSize="xs"
                        color="teal.700"
                        textTransform="uppercase"
                        fontWeight="semibold"
                      >
                        {t('contractorsAdmin.table.users', 'Users')}
                      </Text>
                      <Text fontSize="lg" fontWeight="bold" color="teal.800">
                        {totalUsers}
                      </Text>
                    </Box>
                  </HStack>
                </Box>
                <Box bg={bgOrange} borderRadius="lg" p={4}>
                  <HStack spacing={4} align="center">
                    <Icon as={Layers} boxSize={ICON_BOX_MD} color="orange.600" />
                    <Box>
                      <Text
                        fontSize="xs"
                        color="orange.700"
                        textTransform="uppercase"
                        fontWeight="semibold"
                      >
                        {t('contractorsAdmin.table.customers', 'Customers')}
                      </Text>
                      <Text fontSize="lg" fontWeight="bold" color="orange.800">
                        {totalCustomers}
                      </Text>
                    </Box>
                  </HStack>
                </Box>
                <Box bg={bgGreen} borderRadius="lg" p={4}>
                  <HStack spacing={4} align="center">
                    <Icon as={ChartBar} boxSize={ICON_BOX_MD} color={iconGreen} />
                    <Box>
                      <Text
                        fontSize="xs"
                        color={textGreen700}
                        textTransform="uppercase"
                        fontWeight="semibold"
                      >
                        {t('contractorsAdmin.table.proposals', 'Proposals')}
                      </Text>
                      <Text fontSize="lg" fontWeight="bold" color={textGreen800}>
                        {totalProposals}
                      </Text>
                    </Box>
                  </HStack>
                </Box>
              </SimpleGrid>
            </Stack>
          </CardBody>
        </StandardCard>

        <Box display={{ base: 'none', lg: 'block' }}>
        <TableCard>
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
                          <Icon as={Search} boxSize={8} color={iconGray300} />
                          <Text color={textGray500}>
                            {t('contractorsAdmin.empty.title', 'No contractors found')}
                          </Text>
                          <Text fontSize="sm" color={textGray400}>
                            {t(
                              'contractorsAdmin.empty.tryAdjusting',
                              'Try adjusting your filters.',
                            )}
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
                            <Text fontSize="xs" color={textGray500}>
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
                            colorScheme="brand"
                            leftIcon={
                              <Icon as={ChartBar} boxSize={ICON_BOX_MD} aria-hidden="true" />
                            }
                            onClick={() => handleView(contractor)}
                            minH="44px"
                            maxW={{ base: '180px', md: 'none' }}
                            fontSize={{ base: 'xs', md: 'sm' }}
                          >
                            {t('contractorsAdmin.actions.viewDetails', 'View Details')}
                          </Button>
                        </Td>
                      </Tr>
                    ))
                  )}
                </Tbody>
              </Table>
        </TableCard>
        </Box>

            <Box display={{ base: 'block', lg: 'none' }} mt={6}>
              <Stack spacing={4}>
                {sortedFilteredContractors.map((contractor) => (
                  <StandardCard key={contractor.id} borderRadius="lg" variant="outline">
                    <CardBody>
                      <Stack spacing={4}>
                        <HStack justify="space-between" align="flex-start">
                          <Stack spacing={4}>
                            <Text fontWeight="semibold">{contractor.name}</Text>
                            <Text fontSize="xs" color={textGray500}>
                              ID: {contractor.id}
                            </Text>
                          </Stack>
                          <Button
                            size="sm"
                            variant="outline"
                            colorScheme="brand"
                            onClick={() => handleView(contractor)}
                            leftIcon={
                              <Icon as={ChartBar} boxSize={ICON_BOX_MD} aria-hidden="true" />
                            }
                            minH="44px"
                            maxW={{ base: '140px', md: 'none' }}
                            fontSize={{ base: 'xs', md: 'sm' }}
                          >
                            {t('contractorsAdmin.actions.view', 'View')}
                          </Button>
                        </HStack>
                        <SimpleGrid columns={3} spacing={4}>
                          <Box textAlign="center">
                            <Text fontSize="xs" color={textGray500}>
                              {t('contractorsAdmin.table.users', 'Users')}
                            </Text>
                            <Badge colorScheme="teal" borderRadius="full" px={3}>
                              {contractor.user_count || 0}
                            </Badge>
                          </Box>
                          <Box textAlign="center">
                            <Text fontSize="xs" color={textGray500}>
                              {t('contractorsAdmin.table.customers', 'Customers')}
                            </Text>
                            <Badge colorScheme="orange" borderRadius="full" px={3}>
                              {contractor.customer_count || 0}
                            </Badge>
                          </Box>
                          <Box textAlign="center">
                            <Text fontSize="xs" color={textGray500}>
                              {t('contractorsAdmin.table.proposals', 'Proposals')}
                            </Text>
                            <Badge colorScheme="green" borderRadius="full" px={3}>
                              {contractor.proposal_count || 0}
                            </Badge>
                          </Box>
                        </SimpleGrid>
                        <Stack spacing={4}>
                          <Text fontSize="xs" color={textGray500}>
                            {t('contractorsAdmin.table.modules', 'Modules')}
                          </Text>
                          <HStack spacing={4} flexWrap="wrap" align="flex-start">
                            {getModuleBadges(contractor.modules)}
                          </HStack>
                        </Stack>
                        <Text fontSize="xs" color={textGray500} textAlign="right">
                          {t('contractorsAdmin.table.created', 'Created')}:{' '}
                          {formatDate(contractor.created_at)}
                        </Text>
                      </Stack>
                    </CardBody>
                  </StandardCard>
                ))}
              </Stack>
            </Box>

            {totalPages > 1 && (
              <Box mt={6} pt={4} borderTopWidth="1px" borderColor={borderGray}>
                <PaginationComponent
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  itemsPerPage={itemsPerPage}
                />
              </Box>
            )}
      </Stack>
    </PageContainer>
  )
}

export default Contractors
