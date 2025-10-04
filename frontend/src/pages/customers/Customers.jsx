import React, { useState, useMemo, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, AlertDialog, AlertDialogBody, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogOverlay, AlertIcon, Badge, Box, Button, CardBody, Center, Container, HStack, Icon, IconButton, Input, InputGroup, InputLeftElement, Select, SimpleGrid, Skeleton, SkeletonText, Spinner, Stack, Stat, StatLabel, StatNumber, Table, TableContainer, Tbody, Td, Text, Th, Thead, Tr, VStack, useDisclosure, useToast, useColorModeValue } from '@chakra-ui/react'
import PageContainer from '../../components/PageContainer'
import StandardCard from '../../components/StandardCard'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Search, Pencil, Trash, Plus, User, Mail, Phone, MapPin, Users, ChevronsUpDown, ChevronUp, ChevronDown } from 'lucide-react'

import { fetchCustomers, deleteCustomer } from '../../store/slices/customerSlice'
import { buildEncodedPath, genNoise } from '../../utils/obfuscate'
import PaginationComponent from '../../components/common/PaginationComponent'
import withContractorScope from '../../components/withContractorScope'
import PermissionGate from '../../components/PermissionGate'
import PageHeader from '../../components/PageHeader'
import { ICON_SIZE_MD, ICON_BOX_MD } from '../../constants/iconSizes'

const CustomerTable = ({
  isContractor,
  contractorGroupId,
  contractorModules,
  contractorGroupName,
}) => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  // Color mode values - MUST be before useState
  const statLabelColor = useColorModeValue("gray.500", "gray.400")
  const borderBlue = useColorModeValue("blue.500", "blue.400")
  const iconGray = useColorModeValue("gray.400", "gray.500")
  const textGray500 = useColorModeValue("gray.500", "gray.400")
  const iconGray300 = useColorModeValue("gray.300", "gray.600")
  const textGray600 = useColorModeValue("gray.600", "gray.400")

  const customers = useSelector((state) => state.customers.list)
  const loading = useSelector((state) => state.customers.loading)
  const error = useSelector((state) => state.customers.error)
  const totalPages = useSelector((state) => state.customers.totalPages)
  const total = useSelector((state) => state.customers.total)

  const [searchTerm, setSearchTerm] = useState('')
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  const { isOpen, onOpen, onClose } = useDisclosure()
  const [deleteCustomerId, setDeleteCustomerId] = useState(null)
  const cancelRef = useRef()
  const toast = useToast()

  useEffect(() => {
    const groupId = isContractor ? contractorGroupId : null
    dispatch(fetchCustomers({ page: currentPage, limit: itemsPerPage, groupId }))
  }, [dispatch, currentPage, itemsPerPage, isContractor, contractorGroupId])

  const formatAddress = (customer) => {
    const parts = []
    if (customer.address) parts.push(customer.address)
    if (customer.aptOrSuite) parts.push(customer.aptOrSuite)

    const cityStateZip = []
    if (customer.city) cityStateZip.push(customer.city)
    if (customer.state) cityStateZip.push(customer.state)
    if (customer.zipCode) cityStateZip.push(customer.zipCode)

    if (cityStateZip.length > 0) {
      parts.push(cityStateZip.join(', '))
    }

    return parts.length > 0 ? parts.join(', ') : null
  }

  const handleSort = (key) => {
    setSortConfig((prev) => {
      const direction = prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
      return { key, direction }
    })
  }

  const handleEdit = (customer) => {
    const noisyPath = `/${genNoise(6)}/${genNoise(8)}` + buildEncodedPath('/customers/edit/:id', { id: customer.id })
    navigate(noisyPath)
  }

  const handleDelete = (id) => {
    setDeleteCustomerId(id)
    onOpen()
  }

  const handleCancelDelete = () => {
    if (!deleteCustomerId) {
      onClose()
      return
    }

    toast({
      title: t('customers.cancelled', 'Cancelled'),
      description: t('customers.notDeleted', 'The customer was not deleted.'),
      status: 'info',
      duration: 3000,
      isClosable: true,
    })
    setDeleteCustomerId(null)
    onClose()
  }

  const confirmDelete = async () => {
    if (!deleteCustomerId) return

    try {
      await dispatch(deleteCustomer(deleteCustomerId)).unwrap()
      toast({
        title: t('customers.deleted', 'Deleted!'),
        description: t('customers.deletedMsg', 'The customer has been deleted.'),
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      const groupId = isContractor ? contractorGroupId : null
      dispatch(fetchCustomers({ page: currentPage, limit: itemsPerPage, groupId }))
    } catch (err) {
      console.error('Delete error:', err)
      toast({
        title: t('common.error', 'Error!'),
        description:
          err.message || t('customers.deleteFailed', 'Failed to delete customer. Please try again.'),
        status: 'error',
        duration: 4000,
        isClosable: true,
      })
    } finally {
      setDeleteCustomerId(null)
      onClose()
    }
  }

  const sortedFilteredCustomers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    let filtered = customers.filter((cust) =>
      cust.name?.toLowerCase().includes(query) || cust.email?.toLowerCase().includes(query),
    )

    if (sortConfig.key) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = a[sortConfig.key]?.toLowerCase?.() ?? ''
        const bVal = b[sortConfig.key]?.toLowerCase?.() ?? ''
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    }

    return filtered
  }, [customers, searchTerm, sortConfig])

  const handlePageChange = (page) => setCurrentPage(page)

  const handleNewCustomer = () => navigate('/customers/add')

  const getSortIcon = (key) => {
    // Use lucide icons for sort indicators to avoid passing raw characters to Chakra Icon
    if (sortConfig.key !== key) return ChevronsUpDown
    return sortConfig.direction === 'asc' ? ChevronUp : ChevronDown
  }

  const activeCustomers = customers.filter((c) => !c.deleted_at).length
  const customersWithEmail = customers.filter((c) => c.email).length
  const filteredCount = sortedFilteredCustomers.length

  return (
    <PageContainer>
      <Stack spacing={6}>
        <PageHeader
          title={t('customers.header')}
          subtitle={t('customers.subtitle')}
          icon={Users}
          actions={[
            <PermissionGate permission="customers:create" key="create">
              <Button colorScheme="brand" leftIcon={<Icon as={Plus} boxSize={ICON_BOX_MD} />} onClick={handleNewCustomer}>
                {t('nav.addCustomer')}
              </Button>
            </PermissionGate>,
          ]}
        />

        <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={4}>
          <StandardCard variant="outline" borderColor="brand.500">
            <CardBody>
              <Stat>
                <StatLabel color={statLabelColor}>{t('customers.total')}</StatLabel>
                <StatNumber>{total || 0}</StatNumber>
              </Stat>
            </CardBody>
          </StandardCard>
          <StandardCard variant="outline" borderColor="green.500">
            <CardBody>
              <Stat>
                <StatLabel color={statLabelColor}>{t('customers.active')}</StatLabel>
                <StatNumber>{activeCustomers}</StatNumber>
              </Stat>
            </CardBody>
          </StandardCard>
          <StandardCard variant="outline" borderColor={borderBlue}>
            <CardBody>
              <Stat>
                <StatLabel color={statLabelColor}>{t('customers.withEmail')}</StatLabel>
                <StatNumber>{customersWithEmail}</StatNumber>
              </Stat>
            </CardBody>
          </StandardCard>
          <StandardCard variant="outline" borderColor="red.500">
            <CardBody>
              <Stat>
                <StatLabel color={statLabelColor}>{t('customers.filtered')}</StatLabel>
                <StatNumber>{filteredCount}</StatNumber>
              </Stat>
            </CardBody>
          </StandardCard>
        </SimpleGrid>

        <StandardCard variant="outline">
          <CardBody>
            <Stack direction={{ base: 'column', lg: 'row' }} spacing={4} align={{ base: 'stretch', lg: 'center' }}>
              <Box flex={1} maxW={{ base: 'full', lg: '360px' }}>
                <InputGroup>
                  <InputLeftElement pointerEvents="none">
                    <Icon as={Search} boxSize={ICON_BOX_MD} color={iconGray} />
                  </InputLeftElement>
                  <Input
                    type="search"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value.toLowerCase())}
                    placeholder={t('customers.searchPlaceholder')}
                    aria-label={t('customers.searchAriaLabel', 'Search customers')}
                  />
                </InputGroup>
              </Box>

              <Select
                maxW={{ base: 'full', lg: '200px' }}
                value={itemsPerPage}
                onChange={(event) => setItemsPerPage(Number(event.target.value))}
              >
                {[5, 10, 25, 50].map((option) => (
                  <option key={option} value={option}>
                    {option} {t('customers.perPage', 'per page')}
                  </option>
                ))}
              </Select>

              <Box flex="1" textAlign={{ base: 'left', lg: 'right' }}>
                <Text fontSize="sm" color={textGray500}>
                  {t('customers.showing', 'Showing')} {filteredCount} {t('customers.of', 'of')} {total}{' '}
                  {t('customers.customersLower', 'customers')}
                  {isContractor && contractorGroupName && (
                    <Text as="span" color="brand.500" ml={1}>
                      ({contractorGroupName})
                    </Text>
                  )}
                </Text>
              </Box>
            </Stack>
          </CardBody>
        </StandardCard>

        {loading && (
          <>
            {/* Desktop Skeleton */}
            <Box display={{ base: 'none', lg: 'block' }}>
              <StandardCard variant="outline">
                <CardBody>
                  <TableContainer>
                    <Table variant="simple">
                      <Thead>
                        <Tr>
                          <Th>{t('customers.location', 'Location')}</Th>
                          <Th>{t('customers.name', 'Name')}</Th>
                          <Th>{t('customers.email', 'Email')}</Th>
                          <Th>{t('customers.phone', 'Phone')}</Th>
                          <Th>{t('customers.address', 'Address')}</Th>
                          <Th>{t('customers.proposalsHeader', 'Proposals')}</Th>
                          <Th>{t('customers.ordersHeader', 'Orders')}</Th>
                          <Th textAlign="center">{t('customers.actions', 'Actions')}</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Tr key={i}>
                            <Td><Skeleton height="20px" width="60px" /></Td>
                            <Td><Skeleton height="20px" /></Td>
                            <Td><Skeleton height="20px" /></Td>
                            <Td><Skeleton height="20px" width="80%" /></Td>
                            <Td><Skeleton height="20px" width="90%" /></Td>
                            <Td><Skeleton height="20px" width="40px" /></Td>
                            <Td><Skeleton height="20px" width="40px" /></Td>
                            <Td><Skeleton height="32px" width="80px" mx="auto" /></Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </TableContainer>
                </CardBody>
              </StandardCard>
            </Box>

            {/* Mobile Skeleton */}
            <Stack spacing={4} display={{ base: 'flex', lg: 'none' }}>
              {[1, 2, 3].map((i) => (
                <StandardCard key={i} variant="outline">
                  <CardBody>
                    <VStack align="stretch" spacing={3}>
                      <Skeleton height="24px" width="60%" />
                      <SkeletonText noOfLines={2} spacing={2} />
                      <Skeleton height="20px" width="80%" />
                      <HStack justify="flex-end" pt={2}>
                        <Skeleton height="36px" width="80px" />
                        <Skeleton height="36px" width="80px" />
                      </HStack>
                    </VStack>
                  </CardBody>
                </StandardCard>
              ))}
            </Stack>
          </>
        )}

        {error && !loading && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            <Text fontSize="sm">
              {t('common.error', 'Error')}: {error}
            </Text>
          </Alert>
        )}

        {!loading && !error && (
          <>
            <Box display={{ base: 'none', lg: 'block' }}>
              <StandardCard variant="outline">
                <CardBody>
                  <TableContainer>
                    <Table variant="simple">
                      <Thead>
                        <Tr>
                          <Th>{t('customers.location', 'Location')}</Th>
                          <Th>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSort('name')}
                              rightIcon={<Icon as={getSortIcon('name')} boxSize={ICON_BOX_MD} />}
                            >
                              <HStack spacing={4}>
                                <Icon as={User} boxSize={ICON_BOX_MD} />
                                <Text>{t('customers.name', 'Name')}</Text>
                              </HStack>
                            </Button>
                          </Th>
                          <Th>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSort('email')}
                              rightIcon={<Icon as={getSortIcon('email')} boxSize={ICON_BOX_MD} />}
                            >
                              <HStack spacing={4}>
                                <Icon as={Mail} boxSize={ICON_BOX_MD} />
                                <Text>{t('customers.email', 'Email')}</Text>
                              </HStack>
                            </Button>
                          </Th>
                          <Th>
                            <HStack spacing={4}>
                              <Icon as={Phone} boxSize={ICON_BOX_MD} />
                              <Text>{t('customers.phone', 'Phone')}</Text>
                            </HStack>
                          </Th>
                          <Th>
                            <HStack spacing={4}>
                              <Icon as={MapPin} boxSize={ICON_BOX_MD} />
                              <Text>{t('customers.address', 'Address')}</Text>
                            </HStack>
                          </Th>
                          <Th>{t('customers.proposalsHeader', 'Proposals')}</Th>
                          <Th>{t('customers.ordersHeader', 'Orders')}</Th>
                          <Th textAlign="center">{t('customers.actions', 'Actions')}</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {filteredCount === 0 ? (
                          <Tr>
                            <Td colSpan={8}>
                              <Center py={12} flexDirection="column" gap={4}>
                                <Icon as={Search} boxSize={10} color={iconGray300} />
                                <Text>{t('customers.noResults')}</Text>
                                <Text fontSize="sm" color={textGray500}>
                                  {t('customers.tryAdjusting')}
                                </Text>
                              </Center>
                            </Td>
                          </Tr>
                        ) : (
                          sortedFilteredCustomers.map((cust) => (
                            <Tr key={cust.id}>
                              <Td>
                                <Badge colorScheme="gray" variant="subtle">
                                  {t('customers.main', 'Main')}
                                </Badge>
                              </Td>
                              <Td fontWeight="medium" isTruncated maxW={{ base: "150px", lg: "180px", xl: "220px", "2xl": "280px" }}>{cust.name || 'N/A'}</Td>
                              <Td color={textGray600} isTruncated maxW={{ base: "150px", lg: "180px", xl: "220px", "2xl": "280px" }}>{cust.email || 'N/A'}</Td>
                              <Td color={textGray600} isTruncated maxW={{ base: "120px", lg: "140px", xl: "160px" }}>{cust.mobile || cust.homePhone || t('customers.noPhone', 'No phone')}</Td>
                              <Td color={textGray600} isTruncated maxW={{ base: "180px", lg: "220px", xl: "280px", "2xl": "320px" }}>{formatAddress(cust) || t('customers.noAddress', 'No address')}</Td>
                              <Td>
                                <Badge colorScheme="brand">
                                  {t('customers.proposalsCount', { count: cust.proposalCount || 0 })}
                                </Badge>
                              </Td>
                              <Td>
                                <Badge colorScheme="green">
                                  {t('customers.ordersCount', { count: 0 })}
                                </Badge>
                              </Td>
                              <Td>
                                <HStack spacing={4} justify="center">
                                  <PermissionGate action="update" resource="customer" item={cust}>
                                    <IconButton size="lg" aria-label={t('customers.editTooltip', 'Edit customer')}
                                      icon={<Icon as={Pencil} boxSize={ICON_BOX_MD} />}
                                      variant="outline"
                                      colorScheme="brand"
                                      onClick={() => handleEdit(cust)}
                                    />
                                  </PermissionGate>
                                  <PermissionGate action="delete" resource="customer" item={cust}>
                                    <IconButton size="lg" aria-label={t('customers.deleteTooltip', 'Delete customer')}
                                      icon={<Icon as={Trash} boxSize={ICON_BOX_MD} />}
                                      variant="outline"
                                      colorScheme="red"
                                      onClick={() => handleDelete(cust.id)}
                                    />
                                  </PermissionGate>
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

            <Stack spacing={4} display={{ base: 'flex', lg: 'none' }}>
              {filteredCount === 0 ? (
                <StandardCard variant="outline">
                  <CardBody>
                    <Center flexDirection="column" gap={4}>
                      <Icon as={Search} boxSize={10} color={useColorModeValue("gray.300","gray.600")} />
                      <Text>{t('customers.noResults')}</Text>
                      <Text fontSize="sm" color={textGray500}>
                        {t('customers.tryAdjusting')}
                      </Text>
                    </Center>
                  </CardBody>
                </StandardCard>
              ) : (
                sortedFilteredCustomers.map((cust) => (
                  <StandardCard key={cust.id} variant="outline">
                    <CardBody>
                      <Stack spacing={4}>
                        <HStack justify="space-between" align="flex-start">
                          <Stack spacing={4}>
                            <Text fontWeight="semibold">{cust.name || 'N/A'}</Text>
                            <Badge colorScheme="gray" alignSelf="flex-start">
                              {t('customers.main', 'Main')}
                            </Badge>
                          </Stack>
                        </HStack>
                        <Stack spacing={4} fontSize="sm" color={textGray600}>
                          <HStack spacing={4}>
                            <Icon as={Mail} boxSize={ICON_BOX_MD} />
                            <Text>{cust.email || 'N/A'}</Text>
                          </HStack>
                          <HStack spacing={4}>
                            <Icon as={Phone} boxSize={ICON_BOX_MD} />
                            <Text>{cust.mobile || cust.homePhone || t('customers.noPhone', 'No phone')}</Text>
                          </HStack>
                          <HStack spacing={4}>
                            <Icon as={MapPin} boxSize={ICON_BOX_MD} />
                            <Text>{formatAddress(cust) || t('customers.noAddress', 'No address')}</Text>
                          </HStack>
                        </Stack>
                        <HStack spacing={4}>
                          <Badge colorScheme="brand" flexShrink={0}>
                            {t('customers.proposalsCount', { count: cust.proposalCount || 0 })}
                          </Badge>
                          <Badge colorScheme="green" flexShrink={0}>
                            {t('customers.ordersCount', { count: 0 })}
                          </Badge>
                        </HStack>
                        <HStack spacing={4}>
                          <PermissionGate action="update" resource="customer" item={cust}>
                            <Button
                              size="sm"
                              variant="outline"
                              colorScheme="brand"
                              leftIcon={<Icon as={Pencil} boxSize={ICON_BOX_MD} />}
                              flex="1"
                              onClick={() => handleEdit(cust)}
                            >
                              {t('common.edit')}
                            </Button>
                          </PermissionGate>
                          <PermissionGate action="delete" resource="customer" item={cust}>
                            <Button
                              size="sm"
                              variant="outline"
                              colorScheme="red"
                              leftIcon={<Icon as={Trash} boxSize={ICON_BOX_MD} />}
                              flex="1"
                              onClick={() => handleDelete(cust.id)}
                            >
                              {t('common.delete')}
                            </Button>
                          </PermissionGate>
                        </HStack>
                      </Stack>
                    </CardBody>
                  </StandardCard>
                ))
              )}
            </Stack>

            {totalPages > 1 && (
              <StandardCard variant="outline">
                <CardBody>
                  <PaginationComponent
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    itemsPerPage={itemsPerPage}
                  />
                </CardBody>
              </StandardCard>
            )}
          </>
        )}

        <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={handleCancelDelete} isCentered>
          <AlertDialogOverlay>
            <AlertDialogContent>
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                {t('customers.confirmTitle', 'Are you sure?')}
              </AlertDialogHeader>
              <AlertDialogBody>{t('customers.confirmText', 'This action cannot be undone!')}</AlertDialogBody>
              <AlertDialogFooter>
                <Button ref={cancelRef} onClick={handleCancelDelete}>
                  {t('customers.confirmNo', 'No, cancel!')}
                </Button>
                <Button colorScheme="red" onClick={confirmDelete} ml={3}>
                  {t('customers.confirmYes', 'Yes, delete it!')}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      </Stack>
    </PageContainer>
  )
}

export default withContractorScope(CustomerTable, 'customers')
