import StandardCard from '../../components/StandardCard'
import PageContainer from '../../components/PageContainer'
import { useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Badge,
  Button,
  Box,
  Container,
  Flex,
  Text,
  VStack,
  HStack,
  Alert,
  Input,
  InputGroup,
  InputLeftElement,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  FormErrorMessage,
  RadioGroup,
  Radio,
  Stack,
  useDisclosure,
  useToast,
  useColorModeValue,
  Icon,
} from '@chakra-ui/react'
import { Search, CreditCard as CreditCardIcon, Plus } from 'lucide-react'
import { useForm, Controller } from 'react-hook-form'
import { MobileListCard } from '../../components/StandardCard'
import PageHeader from '../../components/PageHeader'
import PaginationComponent from '../../components/common/PaginationComponent'
import withContractorScope from '../../components/withContractorScope'
import { usePayments, useCreatePayment, useApplyPayment } from '../../queries/paymentsQueries'
import { ICON_SIZE_MD, ICON_BOX_MD } from '../../constants/iconSizes'

const STATUS_OPTIONS = ['all', 'pending', 'processing', 'completed', 'failed', 'cancelled']

const formatCurrency = (amountCents = 0, currency = 'USD') => {
  const value = (amountCents || 0) / 100
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(value)
}

const PaymentsList = ({ isContractor }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)

  const { isOpen: isCreateModalOpen, onOpen: onCreateModalOpen, onClose: onCreateModalClose } = useDisclosure()
  const { isOpen: isGatewayModalOpen, onOpen: onGatewayModalOpen, onClose: onGatewayModalClose } = useDisclosure()
  const { isOpen: isApplyModalOpen, onOpen: onApplyModalOpen, onClose: onApplyModalClose } = useDisclosure()
  const toast = useToast()

  const { publicPaymentConfig } = useSelector((state) => state.payments)
  const { user } = useSelector((state) => state.auth)

  const { data: paymentsData, isLoading: loading, error } = usePayments({
    page,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  })

  const createPaymentMutation = useCreatePayment()
  const applyPaymentMutation = useApplyPayment()

  const createPaymentForm = useForm({ mode: 'onBlur', defaultValues: { orderId: '' } })
  const gatewayForm = useForm({ mode: 'onBlur', defaultValues: { gateway: 'stripe' } })
  const applyPaymentForm = useForm({
    mode: 'onBlur',
    defaultValues: { method: 'cash', checkNumber: '' }
  })
  const [pendingOrderId, setPendingOrderId] = useState(null)
  const [pendingPaymentId, setPendingPaymentId] = useState(null)

  const payments = paymentsData?.pages?.flatMap((p) => p.data) || []
  const pagination = paymentsData?.pages?.[paymentsData.pages.length - 1]?.pagination

  const cardPaymentsEnabled = Boolean(publicPaymentConfig?.cardPaymentsEnabled)

  const computeAmountCents = (payment) => payment?.amount_cents ?? Math.round((payment?.amount || 0) * 100)
  const formatPaymentAmount = (payment) => formatCurrency(computeAmountCents(payment), payment?.currency)

  const renderGatewayBadge = (gateway) => {
    const normalized = (gateway || 'manual').toLowerCase()
    const isStripe = normalized === 'stripe'
    const label = isStripe ? t('payments.gateway.stripe', 'Stripe') : t('payments.gateway.manual', 'Manual')
    return (
      <Badge colorScheme={isStripe ? 'blue' : 'gray'} borderRadius="full" title={label}>
        {label}
      </Badge>
    )
  }

  const filtered = useMemo(() => {
    if (!search) return payments
    const term = search.toLowerCase()
    return payments.filter((payment) => {
      const customerName = payment.order?.customer?.name || payment.order?.proposal?.customerName || ''
      const contractorName = payment.order?.group?.name || payment.order?.creator?.name || ''
      return (
        customerName.toLowerCase().includes(term) ||
        contractorName.toLowerCase().includes(term) ||
        payment.transactionId?.toLowerCase().includes(term)
      )
    })
  }, [payments, search])

  const getStatusColorScheme = (status) => {
    switch (status) {
      case 'completed':
        return 'green'
      case 'processing':
        return 'blue'
      case 'pending':
        return 'orange'
      case 'failed':
        return 'red'
      case 'cancelled':
        return 'gray'
      default:
        return 'gray'
    }
  }

  const getStatusLabel = (status) => {
    if (status === 'all') return t('payments.status.all', 'All')
    switch (status) {
      case 'completed':
        return t('payments.status.completed', 'Paid')
      case 'processing':
        return t('payments.status.processing', 'Processing')
      case 'pending':
        return t('payments.status.pending', 'Payment Required')
      case 'failed':
        return t('payments.status.failed', 'Failed')
      case 'cancelled':
        return t('payments.status.cancelled', 'Cancelled')
      default:
        return status
    }
  }

  const getDisplayOrderNumber = (payment) => {
    const order = payment?.order
    if (order?.order_number) return order.order_number
    try {
      const snap = typeof order?.snapshot === 'string' ? JSON.parse(order.snapshot) : order?.snapshot
      const num = snap?.info?.orderNumber
      if (num) return num
    } catch {}
    return `#${payment?.orderId ?? payment?.order?.id ?? ''}`
  }

  const handleCreatePayment = () => onCreateModalOpen()

  const onCreatePaymentSubmit = async (data) => {
    const orderId = parseInt(data.orderId, 10)
    setPendingOrderId(orderId)
    onCreateModalClose()
    if (cardPaymentsEnabled) onGatewayModalOpen()
    else await processPaymentCreation(orderId, 'manual')
  }

  const onGatewaySubmit = async (data) => {
    onGatewayModalClose()
    await processPaymentCreation(pendingOrderId, data.gateway)
  }

  const processPaymentCreation = async (orderId, gateway) => {
    try {
      await createPaymentMutation.mutateAsync({ orderId, gateway })
      toast({
        title: t('common.success', 'Success'),
        description:
          gateway === 'stripe'
            ? t('payments.create.successStripe', 'Stripe payment created successfully. Customers can now complete payment online.')
            : t('payments.create.success', 'Payment created successfully'),
        status: 'success',
        duration: 4000,
        isClosable: true,
      })
    } catch (err) {
      toast({
        title: t('common.error', 'Error'),
        description: err?.message || t('payments.create.error', 'Failed to create payment'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  const handleApplyPayment = (paymentId) => {
    setPendingPaymentId(paymentId)
    applyPaymentForm.reset({ method: 'cash', checkNumber: '' })
    onApplyModalOpen()
  }

  const onApplyPaymentSubmit = async (data) => {
    try {
      let finalMethod = data.method
      if (data.method === 'check' && data.checkNumber) {
        finalMethod = `check #${data.checkNumber}`
      }

      await applyPaymentMutation.mutateAsync({
        paymentId: pendingPaymentId,
        data: { method: finalMethod }
      })

      toast({
        title: t('common.success', 'Success'),
        description: t('payments.apply.success', 'Payment applied'),
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      onApplyModalClose()
    } catch (err) {
      toast({
        title: t('common.error', 'Error'),
        description: err?.message || t('payments.apply.error', 'Failed to apply'),
        status: 'error',
        duration: 4000,
        isClosable: true,
      })
    }
  }

  const handlePaymentClick = (payment) => {
    if (payment?.gateway === 'stripe' && payment?.status === 'pending') navigate(`/payments/${payment?.id}/pay`)
    else navigate(`/payments/${payment?.id}`)
  }

  const renderCustomerCell = (payment) => {
    if (!payment) return t('common.na')
    const customerName = payment.order?.customer?.name || payment.order?.proposal?.customerName || t('common.na')
    if (!isContractor) {
      const contractorName = payment.order?.group?.name || payment.order?.creator?.name || t('common.na')
      return (
        <div>
          <div>{contractorName}</div>
          <div style={{ fontSize: "12px" }}>{customerName}</div>
        </div>
      )
    }
    return customerName
  }

  const title = isContractor ? t('payments.title.contractor', 'My Payments') : t('payments.title.admin', 'All Payments')
  const subtitle = isContractor
    ? t('payments.subtitle.contractor', 'View your payment history and make payments')
    : t('payments.subtitle.admin', 'Manage all payments and payment configurations')

  const userRole = (user?.role || '').toLowerCase()
  // Compute color values once (hooks cannot be used inside loops/maps)
  const stickyBg = useColorModeValue('white', 'gray.800')
  const rowHoverBg = useColorModeValue('gray.50', 'gray.700')

  return (
    <PageContainer>
      <PageHeader title={title} subtitle={subtitle} icon={CreditCardIcon} />

      {error ? (
        <Alert status="error" mb={3} role="alert">{String(error)}</Alert>
      ) : null}

      <HStack spacing={4} wrap="wrap" mb={4}>
        {STATUS_OPTIONS.map((status) => (
          <Button
            key={status}
            variant={statusFilter === status ? 'solid' : 'outline'}
            colorScheme={statusFilter === status ? 'brand' : 'gray'}
            size="sm"
            minH="44px"
            onClick={() => setStatusFilter(status)}
          >
            {getStatusLabel(status)}
          </Button>
        ))}
      </HStack>

      <Flex justify="space-between" align="center" mb={4} role="search">
        <Box flex={1} maxW={{ base: 'full', lg: '360px' }}>
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <Icon as={Search} boxSize={ICON_BOX_MD} color="gray.500" />
            </InputLeftElement>
            <Input
              type="search"
              placeholder={t('payments.searchPlaceholder', 'Search by customer, contractor, or transaction ID')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label={t('payments.searchAria', 'Search payments')}
            />
          </InputGroup>
        </Box>
        <HStack spacing={4}>
          {!isContractor && (
            <Button colorScheme="brand" minH="44px" onClick={handleCreatePayment} leftIcon={<Plus size={ICON_SIZE_MD} />} aria-label={t('payments.create.button', 'Create payment')}>
              <Text display={{ base: 'none', lg: 'inline' }}>{t('payments.create.button', 'Create Payment')}</Text>
            </Button>
          )}
          <Text fontSize="sm" color="gray.500" aria-live="polite" aria-atomic="true">
            {t('payments.showingCount', { count: filtered.length, total: payments.length })}
          </Text>
        </HStack>
      </Flex>

      <Box display={{ base: 'none', lg: 'block' }}>
        <TableContainer>
          <Table size="sm" variant="simple">
          <Thead>
            <Tr>
              <Th position="sticky" left={0} bg={stickyBg} zIndex={1}>{t('payments.headers.date', 'Date')}</Th>
              <Th>{t('payments.headers.customer', 'Customer')}</Th>
              <Th>{t('payments.headers.orderNumber', 'Order #')}</Th>
              <Th>{t('payments.headers.amount', 'Amount')}</Th>
              <Th>{t('payments.headers.status', 'Status')}</Th>
              <Th>{t('payments.headers.transaction', 'Transaction ID')}</Th>
              <Th>{t('payments.headers.actions', 'Actions')}</Th>
            </Tr>
          </Thead>
          <Tbody>
            {loading ? (
              <Tr><Td colSpan={7} textAlign="center" py={4}>{t('common.loading', 'Loading...')}</Td></Tr>
            ) : filtered.length === 0 ? (
              <Tr>
                <Td colSpan={7} textAlign="center" py={5}>
                  <VStack spacing={4}>
                    <CreditCardIcon size={48} />
                    <Text fontSize="md">{t('payments.empty.title', 'No payments found')}</Text>
                    <Text fontSize="sm" color="gray.500">{t('payments.empty.subtitle', 'Payments will appear here when created')}</Text>
                  </VStack>
                </Td>
              </Tr>
            ) : (
              filtered.map((payment) => {
                const manualApplyEnabled = userRole === 'admin' && payment?.gateway === 'manual' && payment?.status !== 'completed'
                const canPayOnline = payment?.gateway === 'stripe' && payment?.status === 'pending'
                return (
                  <Tr key={payment?.id || Math.random()} cursor="pointer" _hover={{ bg: rowHoverBg }} onClick={() => handlePaymentClick(payment)}>
                    <Td position="sticky" left={0} bg={stickyBg} zIndex={1}>{payment?.createdAt ? new Date(payment.createdAt).toLocaleDateString() : 'N/A'}</Td>
                    <Td isTruncated maxW="200px">{renderCustomerCell(payment)}</Td>
                    <Td>{getDisplayOrderNumber(payment)}</Td>
                    <Td>
                      <HStack spacing={4}>
                        <Text>{formatPaymentAmount(payment)}</Text>
                        {renderGatewayBadge(payment?.gateway)}
                      </HStack>
                    </Td>
                    <Td>
                      <VStack align="start" spacing={4}>
                        <Badge colorScheme={getStatusColorScheme(payment?.status)} borderRadius="full">{getStatusLabel(payment?.status)}</Badge>
                        {payment?.status === 'completed' && payment?.paidAt ? (
                          <Text fontSize="xs" color="gray.500">{t('payments.appliedOn', 'Applied on')} {new Date(payment?.paidAt).toLocaleDateString()}</Text>
                        ) : null}
                      </VStack>
                    </Td>
                    <Td color="gray.500">{payment?.transactionId || t('common.na')}</Td>
                    <Td>
                      <HStack spacing={4}>
                        {canPayOnline ? (
                          <Button colorScheme="brand" size="sm" minH="44px" onClick={(e) => { e.stopPropagation(); navigate(`/payments/${payment?.id}/pay`) }}>
                            {t('payments.actions.makePayment', 'Make Payment')}
                          </Button>
                        ) : null}
                        {manualApplyEnabled ? (
                          <Button
                            colorScheme="green"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleApplyPayment(payment?.id)
                            }}
                          >
                            {t('payments.apply.button', 'Apply')}
                          </Button>
                        ) : null}
                      </HStack>
                    </Td>
                  </Tr>
                )
              })
            )}
          </Tbody>
        </Table>
        </TableContainer>
      </Box>

      <VStack display={{ base: 'flex', lg: 'none' }} spacing={4}>
        {loading ? (
          <Text textAlign="center" py={4}>{t('common.loading', 'Loading...')}</Text>
        ) : filtered.length === 0 ? (
          <VStack spacing={4} textAlign="center" py={5}>
            <CreditCardIcon size={48} />
            <Text fontSize="md">{t('payments.empty.title', 'No payments found')}</Text>
            <Text fontSize="sm" color="gray.500">{t('payments.empty.subtitle', 'Payments will appear here when created')}</Text>
          </VStack>
        ) : (
          filtered.map((payment) => {
            const canPayOnline = payment?.gateway === 'stripe' && payment?.status === 'pending'
            return (
              <MobileListCard key={payment?.id || Math.random()} minH="280px">
                  <VStack align="stretch" spacing={4} h="full" justify="space-between">
                    <Flex justify="space-between" align="center">
                      <Text fontWeight="medium">{renderCustomerCell(payment)}</Text>
                      <Badge colorScheme={getStatusColorScheme(payment?.status)} borderRadius="full">{getStatusLabel(payment?.status)}</Badge>
                    </Flex>
                    <VStack align="stretch" spacing={4}>
                      <Text fontSize="sm" color="gray.600">{payment?.createdAt ? new Date(payment.createdAt).toLocaleDateString() : 'N/A'}</Text>
                      <Flex justify="space-between" align="center">
                        <Text fontSize="sm">{formatPaymentAmount(payment)} {renderGatewayBadge(payment?.gateway)}</Text>
                        <Text fontSize="sm" color="gray.600">{t('payments.mobile.orderNumber', 'Order #{{id}}', { id: getDisplayOrderNumber(payment) })}</Text>
                      </Flex>
                      {payment?.transactionId ? (
                        <Text fontSize="sm" color="gray.500">{t('payments.headers.transaction', 'Transaction ID')}: {payment?.transactionId}</Text>
                      ) : null}
                    </VStack>
                    {canPayOnline ? (
                      <Button colorScheme="brand" size="sm" minH="44px" onClick={(e) => { e.stopPropagation(); navigate(`/payments/${payment?.id}/pay`) }}>
                        {t('payments.actions.makePayment', 'Make Payment')}
                      </Button>
                    ) : null}
                  </VStack>
              </MobileListCard>
            )
          })
        )}
      </VStack>

      {!loading && filtered.length > 0 ? (
        <div>
          <PaginationComponent
            currentPage={pagination?.currentPage || page}
            totalPages={pagination?.totalPages || 1}
            onPageChange={setPage}
            itemsPerPage={pagination?.itemsPerPage || 20}
          />
        </div>
      ) : null}

      {/* Create Payment Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={onCreateModalClose} size={{ base: 'full', md: 'md' }} scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent as="form" onSubmit={createPaymentForm.handleSubmit(onCreatePaymentSubmit)}>
          <ModalHeader>{t('payments.create.title', 'Create Payment')}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl isInvalid={!!createPaymentForm.formState.errors.orderId}>
              <FormLabel>{t('payments.create.orderIdLabel', 'Order ID')}</FormLabel>
              <Controller
                name="orderId"
                control={createPaymentForm.control}
                rules={{
                  required: t('payments.create.orderIdRequired', 'Order ID is required'),
                  min: { value: 1, message: t('payments.create.invalidOrderId', 'Please enter a valid order ID') },
                }}
                render={({ field }) => (
                  <Input {...field} type="number" placeholder={t('payments.create.orderIdPlaceholder', 'Enter order ID')} min={1} />
                )}
              />
              <FormErrorMessage>{createPaymentForm.formState.errors.orderId?.message}</FormErrorMessage>
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" minH="44px" mr={3} onClick={onCreateModalClose}>{t('common.cancel', 'Cancel')}</Button>
            <Button type="submit" variant="solid" minH="44px" colorScheme="brand" isLoading={createPaymentForm.formState.isSubmitting}>
              {t('common.create', 'Create')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Gateway Selection Modal */}
      <Modal isOpen={isGatewayModalOpen} onClose={onGatewayModalClose} size={{ base: 'full', md: 'md' }} scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent as="form" onSubmit={gatewayForm.handleSubmit(onGatewaySubmit)}>
          <ModalHeader>{t('payments.create.gatewayTitle', 'Select payment type')}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl isInvalid={!!gatewayForm.formState.errors.gateway}>
              <Controller
                name="gateway"
                control={gatewayForm.control}
                rules={{ required: t('payments.create.gatewayRequired', 'Select a payment type') }}
                render={({ field }) => (
                  <RadioGroup {...field}>
                    <Stack>
                      <Radio value="stripe">{t('payments.gateway.stripe', 'Stripe')}</Radio>
                      <Radio value="manual">{t('payments.gateway.manual', 'Manual')}</Radio>
                    </Stack>
                  </RadioGroup>
                )}
              />
              <FormErrorMessage>{gatewayForm.formState.errors.gateway?.message}</FormErrorMessage>
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" minH="44px" mr={3} onClick={onGatewayModalClose}>{t('common.cancel', 'Cancel')}</Button>
            <Button type="submit" variant="solid" minH="44px" colorScheme="brand" isLoading={gatewayForm.formState.isSubmitting}>
              {t('common.continue', 'Continue')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Apply Payment Modal */}
      <Modal isOpen={isApplyModalOpen} onClose={onApplyModalClose} size={{ base: 'full', md: 'md' }} scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent as="form" onSubmit={applyPaymentForm.handleSubmit(onApplyPaymentSubmit)}>
          <ModalHeader>{t('payments.apply.title', 'Apply Payment')}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack spacing={4}>
              <FormControl isInvalid={!!applyPaymentForm.formState.errors.method}>
                <FormLabel>{t('payments.apply.methodLabel', 'Payment Method')}</FormLabel>
                <Controller
                  name="method"
                  control={applyPaymentForm.control}
                  rules={{ required: t('payments.apply.methodRequired', 'Payment method is required') }}
                  render={({ field }) => (
                    <RadioGroup {...field}>
                      <Stack>
                        <Radio value="cash">{t('payments.apply.methods.cash', 'Cash')}</Radio>
                        <Radio value="credit_card">{t('payments.apply.methods.creditCard', 'Credit Card')}</Radio>
                        <Radio value="debit_card">{t('payments.apply.methods.debitCard', 'Debit Card')}</Radio>
                        <Radio value="check">{t('payments.apply.methods.check', 'Check')}</Radio>
                        <Radio value="other">{t('payments.apply.methods.other', 'Other')}</Radio>
                      </Stack>
                    </RadioGroup>
                  )}
                />
                <FormErrorMessage>{applyPaymentForm.formState.errors.method?.message}</FormErrorMessage>
              </FormControl>

              {applyPaymentForm.watch('method') === 'check' && (
                <FormControl isInvalid={!!applyPaymentForm.formState.errors.checkNumber}>
                  <FormLabel>{t('payments.apply.checkNumberLabel', 'Check Number')}</FormLabel>
                  <Controller
                    name="checkNumber"
                    control={applyPaymentForm.control}
                    rules={{
                      required: applyPaymentForm.watch('method') === 'check'
                        ? t('payments.apply.checkNumberRequired', 'Check number is required')
                        : false
                    }}
                    render={({ field }) => (
                      <Input {...field} placeholder={t('payments.apply.checkNumberPlaceholder', 'Enter check number')} />
                    )}
                  />
                  <FormErrorMessage>{applyPaymentForm.formState.errors.checkNumber?.message}</FormErrorMessage>
                </FormControl>
              )}
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" minH="44px" mr={3} onClick={onApplyModalClose}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              type="submit"
              colorScheme="green"
              minH="44px"
              isLoading={applyPaymentForm.formState.isSubmitting}
            >
              {t('payments.apply.button', 'Apply Payment')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </PageContainer>
  )
}

export default withContractorScope(PaymentsList)
