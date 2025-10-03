import StandardCard from '../../../components/StandardCard'
import React, { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { Alert, Badge, Box, CardBody, CardHeader, Flex, Heading, Icon, Input, InputGroup, InputLeftElement, SimpleGrid, Spinner, Stack, Table, TableContainer, Tbody, Td, Text, Th, Thead, Tr, useColorModeValue } from '@chakra-ui/react'
import {
  Search,
  Users,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ChevronUp,
  ChevronDown,
} from 'lucide-react'
import { fetchContractorCustomers } from '../../../store/slices/contractorSlice'
import PaginationComponent from '../../../components/common/PaginationComponent'
import EmptyState from '../../../components/common/EmptyState'
import { notifyError } from '../../../helpers/notify'
import { ICON_SIZE_MD, ICON_BOX_MD } from '../../../constants/iconSizes'

const CustomersTab = ({ contractor, groupId }) => {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const contractorsState = useSelector((state) => state.contractors) || {}
  const cc = contractorsState.contractorCustomers || {}
  const customers = cc.data || []
  const pagination = cc.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 }
  const loading = !!cc.loading
  const error = cc.error || null

  const [searchTerm, setSearchTerm] = useState('')
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  // Dark mode colors
  const textGray500 = useColorModeValue('gray.500', 'gray.400')
  const textGray600 = useColorModeValue('gray.600', 'gray.300')
  const bgGray50 = useColorModeValue('gray.50', 'gray.800')
  const borderGray = useColorModeValue('gray.200', 'gray.600')
  const borderGray100 = useColorModeValue('gray.100', 'gray.700')
  const iconGray = useColorModeValue('gray.400', 'gray.500')

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (groupId) {
        dispatch(
          fetchContractorCustomers({
            groupId,
            page: currentPage,
            limit: itemsPerPage,
            search: searchTerm,
          }),
        )
      }
    }, 300) // 300ms debounce

    return () => clearTimeout(timeoutId)
  }, [dispatch, groupId, currentPage, itemsPerPage, searchTerm])

  // notify on load error
  useEffect(() => {
    if (error) {
      notifyError('Failed to load customers', typeof error === 'string' ? error : '')
    }
  }, [error])

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  const handleSearchChange = (value) => {
    setSearchTerm(value)
    setCurrentPage(1) // Reset to first page when searching
  }

  const handleSort = (key) => {
    setSortConfig((prev) => {
      const direction = prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
      return { key, direction }
    })
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

  const formatPhone = (phone) => {
    if (!phone) return 'N/A'
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
    }
    return phone
  }

  const formatAddress = (customer) => {
    const parts = []

    // Add street address
    if (customer.address) {
      parts.push(customer.address)
    }

    // Add apt/suite if present
    if (customer.aptOrSuite) {
      parts.push(customer.aptOrSuite)
    }

    // Create city, state zip line
    const cityStateZip = []
    if (customer.city) {
      cityStateZip.push(customer.city)
    }
    if (customer.state) {
      cityStateZip.push(customer.state)
    }
    if (customer.zipCode) {
      cityStateZip.push(customer.zipCode)
    }

    if (cityStateZip.length > 0) {
      parts.push(cityStateZip.join(', '))
    }

    return parts.length > 0 ? parts.join(', ') : null
  }

  const filteredAndSortedCustomers = useMemo(() => {
    const base = Array.isArray(customers) ? customers : []
    let filtered = base.filter((customer) => {
      const matchesSearch =
        customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone?.includes(searchTerm)
      return matchesSearch
    })

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aVal = a[sortConfig.key]
        let bVal = b[sortConfig.key]

        if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase()
          bVal = bVal.toLowerCase()
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    }

    return filtered
  }, [customers, searchTerm, sortConfig])

  const paginatedCustomers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredAndSortedCustomers.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredAndSortedCustomers, currentPage, itemsPerPage])

  const totalPages = Math.ceil(filteredAndSortedCustomers.length / itemsPerPage) || 1

  const stats = useMemo(() => {
    const list = Array.isArray(customers) ? customers : []
    const active = list.filter((customer) => !customer.deleted_at).length
    const withEmail = list.filter((customer) => !!customer.email).length
    const withPhone = list.filter((customer) => !!customer.phone).length

    return {
      total: list.length,
      active,
      withEmail,
      withPhone,
    }
  }, [customers])

  const effectiveTotalPages = pagination?.totalPages || totalPages

  if (loading) {
    return (
      <Flex align="center" justify="center" minH="200px">
        <Spinner size="lg" color="brand.500" />
      </Flex>
    )
  }

  const statCards = [
    {
      label: t('contractorsAdmin.detail.customers.stats.total'),
      value: stats.total,
      accent: 'brand.500',
    },
    {
      label: t('contractorsAdmin.detail.customers.stats.active'),
      value: stats.active,
      accent: 'green.500',
    },
    {
      label: t('contractorsAdmin.detail.customers.stats.withEmail'),
      value: stats.withEmail,
      accent: 'orange.500',
    },
    {
      label: t('contractorsAdmin.detail.customers.stats.withPhone'),
      value: stats.withPhone,
      accent: 'purple.500',
    },
  ]

  return (
    <Flex direction="column" gap={6}>
      <StandardCard>
        <CardHeader borderBottomWidth="1px">
          <Flex align="center" gap={4}>
            <Icon as={Users} boxSize={ICON_BOX_MD} color={textGray500} aria-hidden="true" />
            <Heading size="sm">
              {t('contractorsAdmin.detail.customers.header', {
                count: filteredAndSortedCustomers.length,
              })}
            </Heading>
          </Flex>
        </CardHeader>
        <CardBody>
          <Stack spacing={6}>
            {error && (
              <Alert status="error" variant="left-accent">
                {typeof error === 'string' ? error : t('common.genericError', 'Something went wrong')}
              </Alert>
            )}

            <Flex
              direction={{ base: 'column', md: 'row' }}
              justify="space-between"
              align={{ base: 'stretch', md: 'center' }}
              gap={4}
            >
              <InputGroup maxW={{ base: '100%', md: '320px' }}>
                <InputLeftElement pointerEvents="none">
                  <Icon as={Search} boxSize={ICON_BOX_MD} color={iconGray} aria-hidden="true" />
                </InputLeftElement>
                <Input
                  type="text"
                  placeholder={t('contractorsAdmin.detail.customers.searchPlaceholder')}
                  aria-label={t(
                    'contractorsAdmin.detail.customers.searchAria',
                    'Search contractor customers',
                  )}
                  value={searchTerm}
                  onChange={(event) => handleSearchChange(event.target.value)}
                />
              </InputGroup>

              <Text fontSize="sm" color={textGray600}>
                {t('contractorsAdmin.detail.customers.showing', {
                  count: paginatedCustomers.length,
                  total: filteredAndSortedCustomers.length,
                })}
              </Text>
            </Flex>

            <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} gap={4}>
              {statCards.map((card) => (
                <Box
                  key={card.label}
                  borderLeftWidth="4px"
                  borderLeftColor={card.accent}
                  bg={bgGray50}
                  borderRadius="md"
                  px={4}
                  py={3}
                >
                  <Text fontSize="xs" color={textGray500} textTransform="uppercase" letterSpacing="wide">
                    {card.label}
                  </Text>
                  <Text fontSize="lg" fontWeight="semibold">
                    {card.value}
                  </Text>
                </Box>
              ))}
            </SimpleGrid>

            <Box display={{ base: 'none', md: 'block' }}>
              <TableContainer borderWidth="1px" borderColor={borderGray100} borderRadius="lg">
                <Table variant="striped" size="sm">
                  <Thead>
                    <Tr>
                      <Th cursor="pointer" onClick={() => handleSort('name')}>
                        <Flex align="center" gap={4}>
                          <Text>{t('customers.name')}</Text>
                          {sortConfig.key === 'name' && (
                            <Icon
                              as={sortConfig.direction === 'asc' ? ChevronUp : ChevronDown}
                              boxSize={ICON_BOX_MD}
                              aria-hidden="true"
                            />
                          )}
                        </Flex>
                      </Th>
                      <Th cursor="pointer" onClick={() => handleSort('email')}>
                        <Flex align="center" gap={4}>
                          <Text>{t('customers.email')}</Text>
                          {sortConfig.key === 'email' && (
                            <Icon
                              as={sortConfig.direction === 'asc' ? ChevronUp : ChevronDown}
                              boxSize={ICON_BOX_MD}
                              aria-hidden="true"
                            />
                          )}
                        </Flex>
                      </Th>
                      <Th>{t('contractorsAdmin.detail.customers.table.phone')}</Th>
                      <Th>{t('contractorsAdmin.detail.customers.table.address')}</Th>
                      <Th cursor="pointer" onClick={() => handleSort('created_at')}>
                        <Flex align="center" gap={4}>
                          <Text>{t('contractorsAdmin.detail.customers.table.created')}</Text>
                          {sortConfig.key === 'created_at' && (
                            <Icon
                              as={sortConfig.direction === 'asc' ? ChevronUp : ChevronDown}
                              boxSize={ICON_BOX_MD}
                              aria-hidden="true"
                            />
                          )}
                        </Flex>
                      </Th>
                      <Th>{t('contractorsAdmin.detail.customers.table.status')}</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {paginatedCustomers.length === 0 ? (
                      <Tr>
                        <Td colSpan={6}>
                          <EmptyState
                            title={t('contractorsAdmin.detail.customers.empty.title')}
                            subtitle={t('contractorsAdmin.detail.customers.empty.subtitle')}
                          />
                        </Td>
                      </Tr>
                    ) : (
                      paginatedCustomers.map((customer) => (
                        <Tr key={customer.id}>
                          <Td>
                            <Flex align="center" gap={4}>
                              <Icon as={User} boxSize={ICON_BOX_MD} color={iconGray} aria-hidden="true" />
                              <Box>
                                <Text fontWeight="semibold">{customer.name}</Text>
                                <Text fontSize="xs" color={textGray500}>
                                  ID: {customer.id}
                                </Text>
                              </Box>
                            </Flex>
                          </Td>
                          <Td>
                            {customer.email ? (
                              <Flex align="center" gap={4}>
                                <Icon as={Mail} boxSize={ICON_BOX_MD} color={iconGray} aria-hidden="true" />
                                <Text>{customer.email}</Text>
                              </Flex>
                            ) : (
                              <Text fontSize="sm" color={textGray500}>
                                {t('contractorsAdmin.detail.customers.noEmail')}
                              </Text>
                            )}
                          </Td>
                          <Td>
                            {customer.phone ? (
                              <Flex align="center" gap={4}>
                                <Icon as={Phone} boxSize={ICON_BOX_MD} color={iconGray} aria-hidden="true" />
                                <Text>{formatPhone(customer.phone)}</Text>
                              </Flex>
                            ) : (
                              <Text fontSize="sm" color={textGray500}>
                                {t('contractorsAdmin.detail.customers.noPhone', 'No phone')}
                              </Text>
                            )}
                          </Td>
                          <Td>
                            {formatAddress(customer) ? (
                              <Flex align="center" gap={4} alignItems="flex-start">
                                <Icon as={MapPin} boxSize={ICON_BOX_MD} color={iconGray} aria-hidden="true" mt={1} />
                                <Text>{formatAddress(customer)}</Text>
                              </Flex>
                            ) : (
                              <Text fontSize="sm" color={textGray500}>
                                {t('contractorsAdmin.detail.customers.noAddress', 'No address on file')}
                              </Text>
                            )}
                          </Td>
                          <Td>
                            <Flex align="center" gap={4}>
                              <Icon as={Calendar} boxSize={ICON_BOX_MD} color={iconGray} aria-hidden="true" />
                              <Text>{formatDate(customer.created_at)}</Text>
                            </Flex>
                          </Td>
                          <Td>
                            <Badge colorScheme={customer.deleted_at ? 'red' : 'green'}>
                              {customer.deleted_at
                                ? t('contractorsAdmin.detail.customers.inactive')
                                : t('contractorsAdmin.detail.customers.active')}
                            </Badge>
                          </Td>
                        </Tr>
                      ))
                    )}
                  </Tbody>
                </Table>
              </TableContainer>
            </Box>

            <Box display={{ base: 'block', md: 'none' }}>
              {paginatedCustomers.length === 0 ? (
                <EmptyState
                  title={t('contractorsAdmin.detail.customers.empty.title')}
                  subtitle={t('contractorsAdmin.detail.customers.empty.subtitle')}
                />
              ) : (
                <Stack spacing={4}>
                  {paginatedCustomers.map((customer) => (
                    <StandardCard key={customer.id} variant="outline">
                      <CardBody>
                        <Stack spacing={4}>
                          <Flex justify="space-between" align="flex-start" gap={4}>
                            <Flex align="center" gap={4} minW={0}>
                              <Icon as={User} boxSize={ICON_BOX_MD} color={iconGray} aria-hidden="true" />
                              <Box minW={0}>
                                <Text fontWeight="semibold" noOfLines={1}>
                                  {customer.name}
                                </Text>
                                <Text fontSize="xs" color={textGray500}>
                                  ID: {customer.id}
                                </Text>
                              </Box>
                            </Flex>
                            <Badge colorScheme={customer.deleted_at ? 'red' : 'green'}>
                              {customer.deleted_at
                                ? t('contractorsAdmin.detail.customers.inactive')
                                : t('contractorsAdmin.detail.customers.active')}
                            </Badge>
                          </Flex>

                          <Stack spacing={4} fontSize="sm">
                            <Box>
                              <Text color={textGray500}>{t('customers.email')}</Text>
                              {customer.email ? (
                                <Flex align="center" gap={4}>
                                  <Icon as={Mail} boxSize={ICON_BOX_MD} color={iconGray} aria-hidden="true" />
                                  <Text noOfLines={1}>{customer.email}</Text>
                                </Flex>
                              ) : (
                                <Text color={textGray500}>
                                  {t('contractorsAdmin.detail.customers.noEmail')}
                                </Text>
                              )}
                            </Box>

                            <Flex gap={4}>
                              <Box flex={1}>
                                <Text color={textGray500}>
                                  {t('contractorsAdmin.detail.customers.table.phone')}
                                </Text>
                                {customer.phone ? (
                                  <Flex align="center" gap={4}>
                                    <Icon as={Phone} boxSize={ICON_BOX_MD} color={iconGray} aria-hidden="true" />
                                    <Text>{formatPhone(customer.phone)}</Text>
                                  </Flex>
                                ) : (
                                  <Text color={textGray500}>
                                    {t('contractorsAdmin.detail.customers.noPhone', 'No phone')}
                                  </Text>
                                )}
                              </Box>
                              <Box flex={1}>
                                <Text color={textGray500}>
                                  {t('contractorsAdmin.detail.customers.table.created')}
                                </Text>
                                <Flex align="center" gap={4}>
                                  <Icon as={Calendar} boxSize={ICON_BOX_MD} color={iconGray} aria-hidden="true" />
                                  <Text>{formatDate(customer.created_at)}</Text>
                                </Flex>
                              </Box>
                            </Flex>

                            {formatAddress(customer) && (
                              <Box>
                                <Text color={textGray500}>
                                  {t('contractorsAdmin.detail.customers.table.address')}
                                </Text>
                                <Flex align="flex-start" gap={4}>
                                  <Icon as={MapPin} boxSize={ICON_BOX_MD} color={iconGray} aria-hidden="true" mt={1} />
                                  <Text>{formatAddress(customer)}</Text>
                                </Flex>
                              </Box>
                            )}
                          </Stack>
                        </Stack>
                      </CardBody>
                    </StandardCard>
                  ))}
                </Stack>
              )}
            </Box>

            {effectiveTotalPages > 1 && (
              <Box pt={4} borderTopWidth="1px" borderColor={borderGray100}>
                <PaginationComponent
                  currentPage={currentPage}
                  totalPages={effectiveTotalPages}
                  onPageChange={handlePageChange}
                  itemsPerPage={itemsPerPage}
                />
              </Box>
            )}
          </Stack>
        </CardBody>
      </StandardCard>
    </Flex>
  )
}

export default CustomersTab
