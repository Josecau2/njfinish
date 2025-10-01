import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
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
  useColorModeValue,
} from '@chakra-ui/react'
import { MobileListCard } from '../../components/StandardCard'
import { Search, CreditCard, Download, ShoppingCart } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import PaginationComponent from '../../components/common/PaginationComponent'
import PrintPaymentReceiptModal from '../../components/model/PrintPaymentReceiptModal'
import { fetchOrders } from '../../store/slices/ordersSlice'
import { fetchManufacturers, fetchManufacturerById } from '../../store/slices/manufacturersSlice'
import { fetchPayments } from '../../store/slices/paymentsSlice'
import { useNavigate } from 'react-router-dom'
import axiosInstance from '../../helpers/axiosInstance'
import Swal from 'sweetalert2'

const OrdersList = ({
  title,
  subtitle,
  groupId = null,
  isContractor = false,
  mineOnly = false,
}) => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { items: orders, loading } = useSelector((s) => s.orders)
  const { list: manuList, byId: manuById } = useSelector((s) => s.manufacturers)
  const { payments } = useSelector((s) => s.payments)
  const authUser = useSelector((s) => s.auth?.user)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [page, setPage] = useState(1)
  const perPage = 10
  const navigate = useNavigate()

  // Status filter options
  const STATUS_OPTIONS = ['All', 'New', 'Processing', 'Paid', 'Cancelled']

  // Receipt modal state
  const [receiptModalVisible, setReceiptModalVisible] = useState(false)
  const [selectedOrderForReceipt, setSelectedOrderForReceipt] = useState(null)
  const [selectedPaymentForReceipt, setSelectedPaymentForReceipt] = useState(null)

  // Color mode values for consistent theming
  const hoverBg = useColorModeValue('gray.50', 'gray.700')
  const stickyBg = useColorModeValue('white', 'gray.800')

  // Resolve manufacturer name from order snapshot first; fall back to legacy manufacturersData if present
  const resolveManuName = (item) => {
    try {
      // NEW: First try the manufacturer association from enhanced API
      if (item?.manufacturer?.name) {
        return item.manufacturer.name
      }

      // Second, try to resolve manufacturer ID from snapshot to actual manufacturer name
      const snap = item?.snapshot
      if (snap) {
        // Parse snapshot if it's a string
        const parsedSnap = typeof snap === 'string' ? JSON.parse(snap) : snap

        if (parsedSnap?.manufacturers?.[0]?.manufacturer) {
          const manuId = parsedSnap.manufacturers[0].manufacturer
          // Try to find manufacturer name from Redux store by ID
          const fromMap = manuById?.[manuId] || manuById?.[String(manuId)]
          if (fromMap?.name) return fromMap.name

          const fromList = manuList?.find?.((m) => Number(m?.id) === Number(manuId))
          if (fromList?.name) return fromList.name
        }

        // Fallback to manufacturerName in snapshot (but this might be incorrect as shown in the data)
        if (parsedSnap?.manufacturers?.[0]?.manufacturerName) {
          return parsedSnap.manufacturers[0].manufacturerName
        }
      }

      // Prefer snapshot-based fields (order shape) - keeping existing logic as fallback
      if (snap) {
        const mArr = Array.isArray(snap.manufacturers)
          ? snap.manufacturers
          : Array.isArray(snap)
            ? snap
            : []
        if (mArr.length) {
          const m0 = mArr[0]
          const name = m0.manufacturerName || m0.name
          if (name && String(name).trim()) return String(name).trim()
          const embedded = m0.manufacturerData?.name || m0.manufacturer?.name
          if (embedded) return embedded
        }
        const direct = snap.manufacturerName || snap.manufacturer_name
        if (direct) return direct
      }

      // Legacy: proposals-based manufacturersData
      const raw = item?.manufacturersData
      if (!raw) return '-'
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw

      // Support object-shaped manufacturersData (legacy/simplified)
      if (parsed && !Array.isArray(parsed) && typeof parsed === 'object') {
        // 1) Explicit name fields
        const explicit = String(parsed.manufacturerName || '').trim()
        if (explicit) return explicit
        const embedded = parsed.manufacturerData?.name || parsed.manufacturer?.name
        if (embedded) return embedded
        // 2) Derive id and try caches
        const manuIdRaw =
          parsed.manufacturer ?? parsed.manufacturerId ?? parsed.manufacturer_id ?? parsed.id
        const manuIdNum = manuIdRaw != null && manuIdRaw !== '' ? Number(manuIdRaw) : null
        if (manuIdNum != null && !Number.isNaN(manuIdNum)) {
          const fromMap = manuById?.[manuIdNum] || manuById?.[String(manuIdNum)]
          if (fromMap?.name) return fromMap.name
          const fromList = manuList?.find?.((m) => Number(m?.id) === manuIdNum)
          if (fromList?.name) return fromList.name
        }
        // 3) Fallback non-generic name
        const nm = String(parsed.name || '').trim()
        if (nm && !/^manufacturer\s*\d+$/i.test(nm)) return nm
        return '-'
      }

      const arr = parsed
      if (!Array.isArray(arr) || arr.length === 0) return '-'

      // 1) If any block has an explicit manufacturerName, use the first
      const explicit = arr.find((b) => b && String(b.manufacturerName || '').trim())
      if (explicit) return String(explicit.manufacturerName).trim()

      // 1b) If block embeds manufacturer object/name, use it
      const embeddedWithName = arr.find((b) => b?.manufacturerData?.name || b?.manufacturer?.name)
      if (embeddedWithName)
        return embeddedWithName.manufacturerData?.name || embeddedWithName.manufacturer?.name

      // 2) Determine manufacturer id from first block (support multiple keys)
      const first = arr[0]
      const manuIdRaw =
        first?.manufacturer ?? first?.manufacturerId ?? first?.manufacturer_id ?? first?.id
      const manuIdNum = manuIdRaw != null && manuIdRaw !== '' ? Number(manuIdRaw) : null

      // 3) Try store cache by id (coerce id when comparing)
      if (manuIdNum != null && !Number.isNaN(manuIdNum)) {
        const fromMap = manuById?.[manuIdNum] || manuById?.[String(manuIdNum)]
        if (fromMap?.name) return fromMap.name
        const fromList = manuList?.find?.((m) => Number(m?.id) === manuIdNum)
        if (fromList?.name) return fromList.name
      }

      // 4) Fallback: any inline name that isn't a generic placeholder
      const named = arr.find((b) => b && String(b.name || '').trim())
      if (named) {
        const nm = String(named.name).trim()
        if (nm && !/^manufacturer\s*\d+$/i.test(nm)) return nm
      }

      return '-'
    } catch (_) {
      return '-'
    }
  }

  useEffect(() => {
    // Server will scope by mineOnly; groupId currently unused here
    dispatch(fetchOrders({ mineOnly }))
    // Fetch payments to check payment status for orders
    dispatch(fetchPayments())
  }, [dispatch, mineOnly])

  // Warm up manufacturers cache for name resolution (single effect)
  useEffect(() => {
    if (!manuList || manuList.length === 0) {
      dispatch(fetchManufacturers())
    }
  }, [dispatch, manuList?.length])

  const filtered = useMemo(() => {
    const list = Array.isArray(orders) ? orders : []

    // Apply status filter first
    let statusFiltered = list
    if (statusFilter !== 'All') {
      statusFiltered = list.filter((p) => {
        const paymentStatus = p.payment_status || p.paymentStatus || ''
        return paymentStatus.toLowerCase() === statusFilter.toLowerCase()
      })
    }

    // Then apply search filter
    const term = (search || '').toLowerCase()
    const base = statusFiltered.filter((p) => {
      if (!term) return true

      // Enhanced search: customer name, order number, description
      const customerName = (
        p.customer?.name ||
        p.proposal?.customerName ||
        p.customer_name ||
        ''
      ).toLowerCase()
      if (customerName.includes(term)) return true

      // Search by order number
      const orderNumber = (p.orderNumber || p.order_number || '').toString().toLowerCase()
      if (orderNumber.includes(term)) return true

      // Search by description
      const description = (p.description || '').toLowerCase()
      if (description.includes(term)) return true

      if (!isContractor) {
        const contractor = (
          p?.Owner?.name ||
          p?.ownerGroup?.name ||
          p?.Owner?.group?.name ||
          ''
        ).toLowerCase()
        if (contractor.includes(term)) return true
      }
      return false
    })
    return base
  }, [orders, search, statusFilter, isContractor])

  const paged = useMemo(() => {
    const start = (page - 1) * perPage
    return filtered.slice(start, start + perPage)
  }, [filtered, page])

  const statusColor = (status) => {
    const map = {
      accepted: 'success',
      'Proposal accepted': 'success',
      sent: 'info',
      draft: 'secondary',
    }
    return map[status] || 'success'
  }

  const getStatusColorScheme = (status) => {
    const map = {
      accepted: 'green',
      'Proposal accepted': 'green',
      sent: 'blue',
      draft: 'gray',
    }
    return map[status] || 'green'
  }

  const getPaymentColorScheme = (status) => {
    switch (status) {
      case 'paid':
        return 'green'
      case 'pending':
        return 'orange'
      case 'overdue':
        return 'red'
      default:
        return 'gray'
    }
  }

  // Get payment status for an order
  const getOrderPayment = (orderId) => {
    return payments?.find((payment) => payment.orderId === orderId)
  }

  // Get payment status badge info
  const getPaymentStatus = (orderId) => {
    const payment = getOrderPayment(orderId)

    if (!payment) {
      return {
        status: 'payment_required',
        label: t('payments.status.paymentRequired', 'Payment Required'),
        color: 'warning',
        showButton: true,
      }
    }

    switch (payment.status) {
      case 'completed':
        return {
          status: 'paid',
          label: t('payments.status.paid', 'Paid'),
          color: 'success',
          showButton: false,
          paidAt: payment.paidAt,
        }
      case 'pending':
        return {
          status: 'payment_required',
          label: t('payments.status.paymentRequired', 'Payment Required'),
          color: 'warning',
          showButton: true,
        }
      case 'processing':
        return {
          status: 'processing',
          label: t('payments.status.processing', 'Processing'),
          color: 'info',
          showButton: false,
        }
      case 'failed':
        return {
          status: 'payment_required',
          label: t('payments.status.paymentRequired', 'Payment Required'),
          color: 'danger',
          showButton: true,
        }
      default:
        return {
          status: 'payment_required',
          label: t('payments.status.paymentRequired', 'Payment Required'),
          color: 'warning',
          showButton: true,
        }
    }
  }

  const handleMakePayment = async (orderId) => {
    const payment = getOrderPayment(orderId)
    if (payment) {
      navigate(`/payments/${payment.id}/pay`)
    } else {
      // If no payment exists, create one automatically for this order
      try {
        const order = orders.find((o) => o.id === orderId)
        if (!order) {
          console.error('Order not found for payment creation:', orderId)
          navigate('/payments')
          return
        }

        // Calculate payment amount from order total
        const amount = order.grand_total_cents ? order.grand_total_cents / 100 : 0
        if (amount <= 0) {
          Swal.fire('Error', 'Cannot create payment: Order total is invalid', 'error')
          return
        }

        // Create payment via API
        const response = await axiosInstance.post('/api/payments', {
          orderId: orderId,
          amount: amount,
          currency: 'USD',
        })

        if (response.data && response.data.id) {
          // Navigate to the newly created payment
          navigate(`/payments/${response.data.id}/pay`)
          // Refresh payments list in the background
          dispatch(fetchPayments({ page: 1 }))
        } else {
          throw new Error('Invalid payment creation response')
        }
      } catch (error) {
        console.error('Failed to create payment for order:', error)
        Swal.fire('Error', 'Failed to create payment. Please try again.', 'error')
        // Fallback to payments list
        navigate('/payments')
      }
    }
  }

  const handleDownloadReceipt = (order, payment) => {
    setSelectedOrderForReceipt(order)
    setSelectedPaymentForReceipt(payment)
    setReceiptModalVisible(true)
  }

  const closeReceiptModal = () => {
    setReceiptModalVisible(false)
    setSelectedOrderForReceipt(null)
    setSelectedPaymentForReceipt(null)
  }

  const openDetails = (orderId) => {
    const base = isContractor ? '/my-orders' : '/orders'
    navigate(`${base}/${orderId}`)
  }

  // Derive a displayable order number with safe fallbacks
  const getDisplayOrderNumber = (order) => {
    if (!order) return null
    // Prefer persisted normalized field
    if (order.order_number) return order.order_number
    // Try snapshot.info.orderNumber
    try {
      const snap = typeof order.snapshot === 'string' ? JSON.parse(order.snapshot) : order.snapshot
      const num = snap?.info?.orderNumber
      if (num) return num
    } catch (_) {
      // ignore JSON errors
    }
    // Final fallback to raw id
    return `#${order.id}`
  }

  const renderCustomerCell = (item) => {
    // Enhanced customer name resolution with multiple fallbacks
    const getCustomerName = () => {
      // Try direct customer association first
      if (item?.customer?.name) return item.customer.name

      // Try proposal customerName
      if (item?.proposal?.customerName) return item.proposal.customerName

      // Try customer_name field (legacy)
      if (item?.customer_name) return item.customer_name

      return t('common.na')
    }

    // For admins: show contractor (group or owner) on top, end-customer below
    if (!isContractor) {
      const contractor =
        item?.Owner?.name || item?.ownerGroup?.name || item?.Owner?.group?.name || t('common.na')
      const endUser = getCustomerName()
      return (
        <div>
          <div>{contractor}</div>
          <div style={{ fontSize: 12 }}>
            {endUser}
          </div>
        </div>
      )
    }
    // Contractors just see their end-customer
    return getCustomerName()
  }

  return (
    <Container maxW="7xl" py={6}>
      <PageHeader title={title} subtitle={subtitle} icon={ShoppingCart} />

      {/* Status Filter Buttons */}
      <HStack spacing={4} wrap="wrap" mb={4}>
        {STATUS_OPTIONS.map((status) => (
          <Button
            key={status}
            variant={statusFilter === status ? 'solid' : 'outline'}
            colorScheme={statusFilter === status ? 'blue' : 'gray'}
            size="sm"
            onClick={() => {
              setStatusFilter(status)
              setPage(1)
            }}
          >
            {status}
          </Button>
        ))}
      </HStack>

      {/* Toolbar: search + count */}
      <Flex justify="space-between" align="center" mb={4} role="search">
        <Box flex={1} maxW="520px">
          <InputGroup>
            <InputLeftElement>
              <Search size={16} />
            </InputLeftElement>
            <Input
            type="search"
            placeholder="Search by customer, order number, or description"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label={t('orders.searchAria', 'Search orders by customer name')}
          />
        </InputGroup>
        </Box>
        <Text fontSize="sm" color="gray.500">
          {t('orders.showingCount', {
            count: filtered.length,
            total: Array.isArray(orders) ? orders.length : 0,
          })}
        </Text>
      </Flex>

      {/* Desktop / tablet table */}
      <Box display={{ base: 'none', lg: 'block' }} overflowX="auto">
        <Table size="sm" variant="simple">
          <Thead>
            <Tr>
              <Th position="sticky" left={0} bg={stickyBg} zIndex={1}>
                {t('orders.headers.date', 'Date')}
              </Th>
              <Th>{t('orders.headers.orderNumber', 'Order #')}</Th>
              <Th>{t('orders.headers.customer', 'Customer')}</Th>
              <Th>{t('orders.headers.description', 'Description')}</Th>
              <Th>{t('orders.headers.manufacturer', 'Manufacturer')}</Th>
              <Th>{t('orders.headers.status', 'Status')}</Th>
              <Th>{t('orders.headers.payment', 'Payment')}</Th>
              <Th>{t('orders.headers.actions', 'Actions')}</Th>
            </Tr>
          </Thead>
          <Tbody>
            {paged.length === 0 ? (
              <Tr>
                <Td colSpan={8} textAlign="center" py={5}>
                  <VStack spacing={4}>
                    <ShoppingCart size={48} color="gray" />
                    <Text fontSize="md">{t('orders.empty.title', 'No orders found')}</Text>
                    <Text fontSize="sm" color="gray.500">
                      {t('orders.empty.subtitle', 'Accepted & locked quotes will appear here')}
                    </Text>
                  </VStack>
                </Td>
              </Tr>
            ) : (
                paged.map((item) => {
                  const paymentInfo = getPaymentStatus(item.id)
                  return (
                    <Tr
                      key={item.id}
                      cursor="pointer"
                      _hover={{ bg: hoverBg }}
                      onClick={() => openDetails(item.id)}
                    >
                    <Td position="sticky" left={0} bg={stickyBg} zIndex={1}>
                      {new Date(
                        item.accepted_at || item.date || item.createdAt,
                      ).toLocaleDateString()}
                    </Td>
                    <Td>{getDisplayOrderNumber(item)}</Td>
                    <Td>{renderCustomerCell(item)}</Td>
                    <Td color="gray.500">
                      {(item.description || item?.proposal?.description || '').trim() ||
                        t('common.na')}
                    </Td>
                    <Td>{resolveManuName(item)}</Td>
                    <Td>
                      <Badge colorScheme={getStatusColorScheme(item.status || 'accepted')} borderRadius="full">
                        {item.status || 'accepted'}
                      </Badge>
                    </Td>
                    <Td>
                      <VStack align="start" spacing={4}>
                        <Badge colorScheme={getPaymentColorScheme(paymentInfo.status)} borderRadius="full">
                          {paymentInfo.label}
                        </Badge>
                        {paymentInfo.status === 'paid' && paymentInfo.paidAt && (
                          <Text fontSize="xs" color="gray.500">
                            {t('payments.appliedOn', 'Applied on')}{' '}
                            {new Date(paymentInfo.paidAt).toLocaleDateString()}
                          </Text>
                        )}
                      </VStack>
                    </Td>
                    <Td>
                      <HStack spacing={4}>
                        {paymentInfo.showButton && (
                          <Button
                            colorScheme="blue"
                            size="sm"
                            leftIcon={<CreditCard size={16} />}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleMakePayment(item.id)
                            }}
                          >
                            {t('orders.actions.makePayment', 'Make Payment')}
                          </Button>
                        )}
                        {paymentInfo.status === 'paid' && (
                          <Button
                            colorScheme="green"
                            size="sm"
                            variant="outline"
                            leftIcon={<Download size={16} />}
                            onClick={(e) => {
                              e.stopPropagation()
                              const payment = getOrderPayment(item.id)
                              handleDownloadReceipt(item, payment)
                            }}
                          >
                            {t('orders.actions.downloadInvoice', 'Download Invoice')}
                          </Button>
                        )}
                      </HStack>
                    </Td>
                    </Tr>
                  )
                })
              )}
          </Tbody>
        </Table>
      </Box>

      {/* Mobile card list */}
      <VStack display={{ base: 'flex', lg: 'none' }} spacing={4}>
        {paged.length === 0 ? (
          <VStack spacing={4} textAlign="center" py={5}>
            <ShoppingCart size={48} color="gray" />
            <Text fontSize="md">{t('orders.empty.title', 'No orders found')}</Text>
            <Text fontSize="sm" color="gray.500">
              {t('orders.empty.subtitle', 'Accepted & locked quotes will appear here')}
            </Text>
          </VStack>
        ) : (
          paged.map((item) => {
            const paymentInfo = getPaymentStatus(item.id)
            return (
              <MobileListCard key={item.id} minH="280px">
                  <VStack align="stretch" spacing={4} h="full" justify="space-between">
                    <Flex justify="space-between" align="center">
                      <VStack align="start" spacing={4}>
                        {isContractor ? (
                          <Text fontWeight="semibold">{item.customer?.name || t('common.na')}</Text>
                        ) : (
                          <VStack align="start" spacing={0}>
                            <Text fontWeight="semibold">
                              {item?.Owner?.group?.name ||
                                item?.ownerGroup?.name ||
                                item?.Owner?.name ||
                                t('common.na')}
                            </Text>
                            <Text fontSize="sm" color="gray.500">
                              {item?.customer?.name || t('common.na')}
                            </Text>
                          </VStack>
                        )}
                      </VStack>
                      <VStack align="end" spacing={4}>
                        <Badge colorScheme={getStatusColorScheme(item.status || 'accepted')} borderRadius="full">
                          {item.status || 'accepted'}
                        </Badge>
                        <VStack align="end" spacing={0}>
                          <Badge colorScheme={getPaymentColorScheme(paymentInfo.status)} borderRadius="full" size="sm">
                            {paymentInfo.label}
                          </Badge>
                          {paymentInfo.status === 'paid' && paymentInfo.paidAt && (
                            <Text fontSize="xs" color="gray.500">
                              {t('payments.appliedOn', 'Applied on')}{' '}
                              {new Date(paymentInfo.paidAt).toLocaleDateString()}
                            </Text>
                          )}
                        </VStack>
                      </VStack>
                    </Flex>
                    <VStack align="stretch" spacing={4}>
                      <Text fontSize="sm" color="gray.600">
                        {new Date(
                          item.accepted_at || item.date || item.createdAt,
                        ).toLocaleDateString()}
                      </Text>
                      <Text fontSize="sm" color="gray.600">
                        {t('orders.headers.manufacturer', 'Manufacturer')}: {resolveManuName(item)}
                      </Text>
                      <Text fontSize="sm" color="gray.600">
                        {t('orders.headers.orderNumber', 'Order #')}: {getDisplayOrderNumber(item)}
                      </Text>
                    </VStack>
                    <Text fontSize="sm" color="gray.500">
                      {(item.description || item?.proposal?.description || '').trim() ||
                        t('common.na')}
                    </Text>
                    {(paymentInfo.showButton || paymentInfo.status === 'paid') && (
                      <HStack spacing={4} flexWrap="wrap">
                        {paymentInfo.showButton && (
                          <Button
                            colorScheme="blue"
                            size="sm"
                            leftIcon={<CreditCard size={16} />}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleMakePayment(item.id)
                            }}
                          >
                            {t('orders.actions.makePayment', 'Make Payment')}
                          </Button>
                        )}
                        {paymentInfo.status === 'paid' && (
                          <Button
                            colorScheme="green"
                            size="sm"
                            variant="outline"
                            leftIcon={<Download size={16} />}
                            onClick={(e) => {
                              e.stopPropagation()
                              const payment = getOrderPayment(item.id)
                              handleDownloadReceipt(item, payment)
                            }}
                          >
                            {t('orders.actions.downloadInvoice', 'Download Invoice')}
                          </Button>
                        )}
                      </HStack>
                    )}
                  </VStack>
              </MobileListCard>
            )
          })
        )}
      </VStack>

      <div>
        <PaginationComponent
          currentPage={page}
          totalPages={Math.ceil(filtered.length / perPage) || 1}
          onPageChange={setPage}
          itemsPerPage={perPage}
        />
      </div>

      {/* Payment Receipt Modal */}
      <PrintPaymentReceiptModal
        show={receiptModalVisible}
        onClose={closeReceiptModal}
        payment={selectedPaymentForReceipt}
        order={selectedOrderForReceipt}
      />
    </Container>
  )
}

export default OrdersList
