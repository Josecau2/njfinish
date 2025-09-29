import React, { useState, useMemo, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertIcon,
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  Container,
  HStack,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  SimpleGrid,
  Spinner,
  Stack,
  Stat,
  StatLabel,
  StatNumber,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Text,
  Select,
  useDisclosure,
  useToast,
  Center,
} from '@chakra-ui/react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Search, Pencil, Trash, Plus, User, Mail, Phone, MapPin, Users, ChevronsUpDown, ChevronUp, ChevronDown } from 'lucide-react'

import { fetchCustomers, deleteCustomer } from '../../store/slices/customerSlice'
import { buildEncodedPath, genNoise } from '../../utils/obfuscate'
import PaginationComponent from '../../components/common/PaginationComponent'
import withContractorScope from '../../components/withContractorScope'
import PermissionGate from '../../components/PermissionGate'
import PageHeader from '../../components/PageHeader'

const CustomerTable = ({
  isContractor,
  contractorGroupId,
  contractorModules,
  contractorGroupName,
}) => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const navigate = useNavigate()
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
    <Container maxW="7xl" py={6}>
      <Stack spacing={6}>
        <PageHeader
          title={t('customers.header')}
          subtitle={t('customers.subtitle')}
          icon={Users}
          actions={[
            <PermissionGate permission="customers:create" key="create">
              <Button colorScheme="brand" leftIcon={<Icon as={Plus} boxSize={4} />} onClick={handleNewCustomer}>
                {t('nav.addCustomer')}
              </Button>
            </PermissionGate>,
          ]}
        />

        <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} spacing={4}>
          <Card variant="outline" borderColor="brand.500">
            <CardBody>
              <Stat>
                <StatLabel color="gray.500">{t('customers.total')}</StatLabel>
                <StatNumber>{total || 0}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
          <Card variant="outline" borderColor="green.500">
            <CardBody>
              <Stat>
                <StatLabel color="gray.500">{t('customers.active')}</StatLabel>
                <StatNumber>{activeCustomers}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
          <Card variant="outline" borderColor="blue.500">
            <CardBody>
              <Stat>
                <StatLabel color="gray.500">{t('customers.withEmail')}</StatLabel>
                <StatNumber>{customersWithEmail}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
          <Card variant="outline" borderColor="red.500">
            <CardBody>
              <Stat>
                <StatLabel color="gray.500">{t('customers.filtered')}</StatLabel>
                <StatNumber>{filteredCount}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        <Card variant="outline">
          <CardBody>
            <Stack direction={{ base: 'column', md: 'row' }} spacing={4} align={{ base: 'stretch', md: 'center' }}>
              <InputGroup maxW={{ base: 'full', md: '360px' }}>
                <InputLeftElement pointerEvents="none">
                  <Icon as={Search} color="gray.400" boxSize={4} />
                </InputLeftElement>
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value.toLowerCase())}
                  placeholder={t('customers.searchPlaceholder')}
                  aria-label={t('customers.searchAriaLabel', 'Search customers')}
                />
              </InputGroup>

              <Select
                maxW={{ base: 'full', md: '200px' }}
                value={itemsPerPage}
                onChange={(event) => setItemsPerPage(Number(event.target.value))}
              >
                {[5, 10, 25, 50].map((option) => (
                  <option key={option} value={option}>
                    {option} {t('customers.perPage', 'per page')}
                  </option>
                ))}
              </Select>

              <Box flex="1" textAlign={{ base: 'left', md: 'right' }}>
                <Text fontSize="sm" color="gray.500">
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
        </Card>

        {loading && (
          <Center py={16} flexDirection="column" gap={3}>
            <Spinner size="lg" color="brand.500" />
            <Text color="gray.500">{t('customers.loading', 'Loading customers...')}</Text>
          </Center>
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
            <Box display={{ base: 'none', md: 'block' }}>
              <Card variant="outline">
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
                              rightIcon={<Icon as={getSortIcon('name')} boxSize={4} />}
                            >
                              <HStack spacing={2}>
                                <Icon as={User} boxSize={4} />
                                <Text>{t('customers.name', 'Name')}</Text>
                              </HStack>
                            </Button>
                          </Th>
                          <Th>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSort('email')}
                              rightIcon={<Icon as={getSortIcon('email')} boxSize={4} />}
                            >
                              <HStack spacing={2}>
                                <Icon as={Mail} boxSize={4} />
                                <Text>{t('customers.email', 'Email')}</Text>
                              </HStack>
                            </Button>
                          </Th>
                          <Th>
                            <HStack spacing={2}>
                              <Icon as={Phone} boxSize={4} />
                              <Text>{t('customers.phone', 'Phone')}</Text>
                            </HStack>
                          </Th>
                          <Th>
                            <HStack spacing={2}>
                              <Icon as={MapPin} boxSize={4} />
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
                              <Center py={12} flexDirection="column" gap={3}>
                                <Icon as={Search} boxSize={10} color="gray.300" />
                                <Text>{t('customers.noResults')}</Text>
                                <Text fontSize="sm" color="gray.500">
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
                              <Td fontWeight="medium">{cust.name || 'N/A'}</Td>
                              <Td color="gray.600">{cust.email || 'N/A'}</Td>
                              <Td color="gray.600">{cust.mobile || cust.homePhone || t('customers.noPhone', 'No phone')}</Td>
                              <Td color="gray.600">{formatAddress(cust) || t('customers.noAddress', 'No address')}</Td>
                              <Td>
                                <Badge colorScheme="blue">
                                  {t('customers.proposalsCount', { count: cust.proposalCount || 0 })}
                                </Badge>
                              </Td>
                              <Td>
                                <Badge colorScheme="green">
                                  {t('customers.ordersCount', { count: 0 })}
                                </Badge>
                              </Td>
                              <Td>
                                <HStack spacing={2} justify="center">
                                  <PermissionGate action="update" resource="customer" item={cust}>
                                    <IconButton
                                      aria-label={t('customers.editTooltip', 'Edit customer')}
                                      icon={<Icon as={Pencil} boxSize={4} />}
                                      variant="outline"
                                      colorScheme="blue"
                                      size="sm"
                                      onClick={() => handleEdit(cust)}
                                    />
                                  </PermissionGate>
                                  <PermissionGate action="delete" resource="customer" item={cust}>
                                    <IconButton
                                      aria-label={t('customers.deleteTooltip', 'Delete customer')}
                                      icon={<Icon as={Trash} boxSize={4} />}
                                      variant="outline"
                                      colorScheme="red"
                                      size="sm"
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
              </Card>
            </Box>

            <Stack spacing={4} display={{ base: 'flex', md: 'none' }}>
              {filteredCount === 0 ? (
                <Card variant="outline">
                  <CardBody>
                    <Center flexDirection="column" gap={3}>
                      <Icon as={Search} boxSize={10} color="gray.300" />
                      <Text>{t('customers.noResults')}</Text>
                      <Text fontSize="sm" color="gray.500">
                        {t('customers.tryAdjusting')}
                      </Text>
                    </Center>
                  </CardBody>
                </Card>
              ) : (
                sortedFilteredCustomers.map((cust) => (
                  <Card key={cust.id} variant="outline">
                    <CardBody>
                      <Stack spacing={4}>
                        <HStack justify="space-between" align="flex-start">
                          <Stack spacing={1}>
                            <Text fontWeight="semibold">{cust.name || 'N/A'}</Text>
                            <Badge colorScheme="gray" alignSelf="flex-start">
                              {t('customers.main', 'Main')}
                            </Badge>
                          </Stack>
                        </HStack>
                        <Stack spacing={2} fontSize="sm" color="gray.600">
                          <HStack spacing={2}>
                            <Icon as={Mail} boxSize={4} />
                            <Text>{cust.email || 'N/A'}</Text>
                          </HStack>
                          <HStack spacing={2}>
                            <Icon as={Phone} boxSize={4} />
                            <Text>{cust.mobile || cust.homePhone || t('customers.noPhone', 'No phone')}</Text>
                          </HStack>
                          <HStack spacing={2}>
                            <Icon as={MapPin} boxSize={4} />
                            <Text>{formatAddress(cust) || t('customers.noAddress', 'No address')}</Text>
                          </HStack>
                        </Stack>
                        <HStack spacing={3}>
                          <Badge colorScheme="blue" flexShrink={0}>
                            {t('customers.proposalsCount', { count: cust.proposalCount || 0 })}
                          </Badge>
                          <Badge colorScheme="green" flexShrink={0}>
                            {t('customers.ordersCount', { count: 0 })}
                          </Badge>
                        </HStack>
                        <HStack spacing={3}>
                          <PermissionGate action="update" resource="customer" item={cust}>
                            <Button
                              size="sm"
                              variant="outline"
                              colorScheme="blue"
                              leftIcon={<Icon as={Pencil} boxSize={4} />}
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
                              leftIcon={<Icon as={Trash} boxSize={4} />}
                              flex="1"
                              onClick={() => handleDelete(cust.id)}
                            >
                              {t('common.delete')}
                            </Button>
                          </PermissionGate>
                        </HStack>
                      </Stack>
                    </CardBody>
                  </Card>
                ))
              )}
            </Stack>

            {totalPages > 1 && (
              <Card variant="outline">
                <CardBody>
                  <PaginationComponent
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    itemsPerPage={itemsPerPage}
                  />
                </CardBody>
              </Card>
            )}
          </>
        )}

        <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose} isCentered>
          <AlertDialogOverlay>
            <AlertDialogContent>
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                {t('customers.confirmTitle', 'Are you sure?')}
              </AlertDialogHeader>
              <AlertDialogBody>{t('customers.confirmText', 'This action cannot be undone!')}</AlertDialogBody>
              <AlertDialogFooter>
                <Button ref={cancelRef} onClick={onClose}>
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
    </Container>
  )
}

export default withContractorScope(CustomerTable, 'customers')
