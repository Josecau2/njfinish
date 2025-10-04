import React, { useEffect, useMemo, useState, useRef } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import PageHeader from '../../components/PageHeader'
import StandardCard from '../../components/StandardCard'
import { useTranslation } from 'react-i18next'
import {
  Container,
  Stack,
  Box,
  SimpleGrid,
  HStack,
  VStack,
  Text,
  Button,
  Icon,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Image,
  useToast,
  useDisclosure,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  useColorModeValue,
} from '@chakra-ui/react'
import { ShoppingCart, ArrowLeft, FileText, Download, Mail, Trash } from 'lucide-react'
import { fetchOrderById, clearCurrentOrder } from '../../store/slices/ordersSlice'
import { fetchManufacturers } from '../../store/slices/manufacturersSlice'
import axiosInstance from '../../helpers/axiosInstance'
import { isAdmin } from '../../helpers/permissions'

// Helpers for modification measurements (inches with mixed fractions)
const _gcd = (a, b) => (b ? _gcd(b, a % b) : a)
const formatMixedFraction = (value, precision = 16) => {
  if (value == null || isNaN(value)) return ''
  const sign = value < 0 ? '-' : ''
  let v = Math.abs(Number(value))
  let whole = Math.floor(v)
  const frac = v - whole
  let num = Math.round(frac * precision)
  if (num === precision) {
    whole += 1
    num = 0
  }
  if (num === 0) return `${sign}${whole}`
  const g = _gcd(num, precision)
  const n = num / g
  const d = precision / g
  return `${sign}${whole ? `${whole} ` : ''}${n}/${d}`
}
const keyToLabel = (key) =>
  String(key || '')
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
const mapSide = (s) => (s === 'L' ? 'Left' : s === 'R' ? 'Right' : s === 'B' ? 'Both' : s)
const buildSelectedOptionsText = (selectedOptions) => {
  if (!selectedOptions || typeof selectedOptions !== 'object') return ''
  const parts = []
  const numericEntries = Object.entries(selectedOptions).filter(
    ([, v]) => typeof v === 'number' && isFinite(v),
  )
  if (numericEntries.length === 1) {
    const [, v] = numericEntries[0]
    const m = formatMixedFraction(v)
    if (m) parts.push(`${m}\"`)
  } else if (numericEntries.length > 1) {
    numericEntries.forEach(([k, v]) => {
      const m = formatMixedFraction(v)
      if (m) parts.push(`${keyToLabel(k)} ${m}\"`)
    })
  }
  if (typeof selectedOptions.sideSelector === 'string' && selectedOptions.sideSelector) {
    parts.push(`Side: ${mapSide(selectedOptions.sideSelector)}`)
  }
  return parts.join(' • ')
}

const currency = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(n || 0))

// Snapshot-first parser: orders store the final snapshot under order.snapshot
const parseFromSnapshot = (order) => {
  const snap = order?.snapshot
  if (!snap) return { manufacturers: [], items: [], summary: { grandTotal: 0 } }
  try {
    const root = typeof snap === 'string' ? JSON.parse(snap) : snap
    const manufacturers = Array.isArray(root?.manufacturers)
      ? root.manufacturers
      : Array.isArray(root)
        ? root
        : []
    const items = Array.isArray(root?.items)
      ? root.items
      : manufacturers.flatMap((m) => (Array.isArray(m.items) ? m.items : []))
    const summary =
      root?.summary ||
      manufacturers.reduce((agg, m) => {
        const s = m?.summary || {}
        return {
          styleTotal: (agg.styleTotal || 0) + Number(s.styleTotal || 0),
          assemblyFee: (agg.assemblyFee || 0) + Number(s.assemblyFee || 0),
          modificationsCost: (agg.modificationsCost || 0) + Number(s.modificationsCost || 0),
          deliveryFee: (agg.deliveryFee || 0) + Number(s.deliveryFee || 0),
          discountAmount: (agg.discountAmount || 0) + Number(s.discountAmount || 0),
          taxAmount: (agg.taxAmount || 0) + Number(s.taxAmount || 0),
          grandTotal: (agg.grandTotal || 0) + Number(s.grandTotal || 0),
        }
      }, {})
    return { manufacturers, items, summary: summary || { grandTotal: 0 } }
  } catch (e) {
    console.error('Snapshot parse error', e)
    return { manufacturers: [], items: [], summary: { grandTotal: 0 } }
  }
}
const OrderDetails = () => {
  const { t } = useTranslation()
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const customization = useSelector((state) => state.customization)
  const { current: order, loading, error } = useSelector((state) => state.orders)
  const { list: manuList, byId: manuById } = useSelector((state) => state.manufacturers)
  const dispatch = useDispatch()
  const authUser = useSelector((state) => state.auth?.user)
  const toast = useToast()
  const deleteDisclosure = useDisclosure()

  // Color mode values
  const iconGray500 = useColorModeValue('gray.500', 'gray.400')
  const borderGray700 = useColorModeValue('gray.700', 'gray.300')
  const bgGray50 = useColorModeValue('gray.50', 'gray.800')
  const borderGray600 = useColorModeValue('gray.600', 'gray.400')
  const borderGray200 = useColorModeValue('gray.200', 'gray.600')
  const iconGray400 = useColorModeValue('gray.400', 'gray.500')
  const bgGray100 = useColorModeValue('gray.100', 'gray.700')
  const [showPdf, setShowPdf] = useState(false)
  const [pdfUrl, setPdfUrl] = useState(null)
  const [resending, setResending] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [notice, setNotice] = useState({
    visible: false,
    title: '',
    message: '',
    variant: 'success',
  })
  const [previewImg, setPreviewImg] = useState(null)
  const cancelRef = useRef()

  const openNotice = (title, message, variant = 'success') =>
    setNotice({ visible: true, title, message, variant })
  const closeNotice = () => setNotice((n) => ({ ...n, visible: false }))

  const getContrastColor = (backgroundColor) => {
    if (!backgroundColor) return 'white'
    const hex = backgroundColor.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return luminance > 0.5 ? 'gray.700' : 'white'
  }

  const resolveBackground = (value) => {
    try {
      if (typeof value === 'string') {
        const trimmed = value.trim()
        return trimmed || 'white'
      }
      if (value && typeof value === 'object') {
        if (typeof value.hex === 'string' && value.hex.trim()) return value.hex.trim()
        if (typeof value.value === 'string' && value.value.trim()) return value.value.trim()
      }
    } catch (_) {}
    return 'white'
  }

  const backgroundColor = resolveBackground(customization?.headerBg)
  const textColor = getContrastColor(backgroundColor)

  const backBasePath = useMemo(
    () => (location?.pathname?.startsWith('/my-orders') ? '/my-orders' : '/orders'),
    [location?.pathname],
  )

  const handleBack = () => navigate(backBasePath)

  useEffect(() => {
    if (id) dispatch(fetchOrderById(id))
    dispatch(fetchManufacturers())
    return () => {
      dispatch(clearCurrentOrder())
    }
  }, [dispatch, id])

  const parsed = useMemo(() => parseFromSnapshot(order), [order])

  const displayOrderNumber = useMemo(() => {
    const fromModel = order?.order_number
    const fromSnap = (() => {
      try {
        return (typeof order?.snapshot === 'string' ? JSON.parse(order.snapshot) : order?.snapshot)
          ?.info?.orderNumber
      } catch {
        return null
      }
    })()
    return fromModel || fromSnap || `#${order?.id || id}`
  }, [order, id])

  const computeItemView = (it) => {
    const resolveManuName = () => {
      if (order?.manufacturer?.name) return order.manufacturer.name
      if (parsed?.manufacturers?.[0]?.manufacturer) {
        const manuId = parsed.manufacturers[0].manufacturer
        const fromMap = manuById?.[manuId] || manuById?.[String(manuId)]
        if (fromMap?.name) return fromMap.name
        const fromList = manuList?.find?.((m) => Number(m?.id) === Number(manuId))
        if (fromList?.name) return fromList.name
      }
      return (
        it.manufacturerName ||
        order?.manufacturer_name ||
        parsed.manufacturers?.[0]?.manufacturerName ||
        parsed.manufacturers?.[0]?.name ||
        '-'
      )
    }

    const manuName = resolveManuName()
    const qty = Number(it.qty || it.quantity || 1)
    const unit = Number(
      it.snapshotUnitPrice ??
        it.finalUnitPrice ??
        it.calculatedUnitPrice ??
        it.unitPrice ??
        it.price ??
        0,
    )
    const total = Number(it.snapshotTotal ?? it.finalTotal ?? it.total ?? unit * qty)
    const modsTotal = Array.isArray(it.modifications)
      ? it.modifications.reduce((s, m) => s + Number(m.price || 0) * Number(m.qty || 1), 0)
      : Number(it.modificationsTotal || 0)

    const resolveItemStyleName = () => {
      const potentialStyleName =
        it.styleName || parsed.manufacturers?.[0]?.styleName || parsed.manufacturers?.[0]?.style
      if (potentialStyleName && potentialStyleName === manuName) {
        if (order?.style_name && order.style_name !== manuName) {
          return order.style_name
        }
        return '-'
      }
      return potentialStyleName || order?.style_name || '-'
    }

    const styleName = resolveItemStyleName()
    const thumb = it.image || it.thumb || parsed.manufacturers?.[0]?.styleImage || null
    const thumbTitle = [styleName, manuName].filter(Boolean).join(' - ')
    return { manuName, qty, unit, total, modsTotal, styleName, thumb, thumbTitle }
  }

  const displaySummary = parsed.summary || { grandTotal: 0 }

  const closePdfModal = () => {
    setShowPdf(false)
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl)
      setPdfUrl(null)
    }
  }

  if (loading) {
    return (
      <Center py={16} flexDirection="column" gap={4}>
        <Spinner size="lg" color="brand.500" />
        <Text color={iconGray500}>{t('common.loading', 'Loading...')}</Text>
      </Center>
    )
  }

  if (error) {
    return (
      <Container maxW="lg" py={10}>
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          <Text>{error}</Text>
        </Alert>
      </Container>
    )
  }
  const handleViewPdf = async () => {
    try {
      const resp = await axiosInstance.get(`/api/orders/${id}/manufacturer-pdf`, {
        responseType: 'blob',
      })
      const blob = new Blob([resp.data], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      setPdfUrl(url)
      setShowPdf(true)
    } catch (e) {
      openNotice(
        t('orders.pdf.failedTitle', 'Failed to load PDF'),
        e?.response?.data?.message ||
          e.message ||
          t('orders.pdf.failedMessage', 'Please try again.'),
        'danger',
      )
    }
  }

  const handleResendEmail = async () => {
    try {
      setResending(true)
      const { data } = await axiosInstance.post(`/api/orders/${id}/resend-manufacturer-email`)
      const ok = !!data?.success || !!data?.result?.sent
      if (showPdf) {
        closePdfModal()
      }
      if (ok) {
        openNotice(
          t('orders.email.resendSuccessTitle', 'Email Sent'),
          t('orders.email.resendSuccessMessage', 'Manufacturer email resent successfully.'),
          'success',
        )
      } else {
        openNotice(
          t('orders.email.resendAttemptedTitle', 'Resend Attempted'),
          data?.result?.reason ||
            t('orders.email.resendAttemptedMessage', 'The email was not confirmed as sent.'),
          'warning',
        )
      }
    } catch (e) {
      openNotice(
        t('orders.email.resendFailedTitle', 'Resend Failed'),
        e?.response?.data?.message ||
          e.message ||
          t('orders.email.resendFailedMessage', 'Please try again.'),
        'danger',
      )
    } finally {
      setResending(false)
    }
  }

  const handleDownloadPdf = async () => {
    try {
      setDownloading(true)
      const resp = await axiosInstance.get(`/api/orders/${id}/manufacturer-pdf/download`, {
        responseType: 'blob',
      })
      const disp =
        resp.headers?.['content-disposition'] || resp.headers?.get?.('content-disposition')
      let filename = `Order-${id}-Manufacturer.pdf`
      if (disp && /filename\s*=\s*"?([^";]+)"?/i.test(disp)) {
        const match = disp.match(/filename\s*=\s*"?([^";]+)"?/i)
        if (match && match[1]) filename = match[1]
      }
      const blob = new Blob([resp.data], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      openNotice(
        t('orders.pdf.downloadFailedTitle', 'Download Failed'),
        e?.response?.data?.message ||
          e.message ||
          t('orders.pdf.downloadFailedMessage', 'Please try again.'),
        'danger',
      )
    } finally {
      setDownloading(false)
    }
  }

  const handleDeleteOrder = () => {
    deleteDisclosure.onOpen()
  }

  const confirmDeleteOrder = async () => {
    try {
      await axiosInstance.delete(`/api/orders/${id}`)
      toast({
        title: t('common.deleted', 'Deleted'),
        description: t('orders.toast.deleted', 'Order deleted successfully.'),
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      navigate(backBasePath)
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e.message ||
        t('orders.toast.deleteFailed', 'Failed to delete order.')
      toast({
        title: t('common.error', 'Error'),
        description: msg,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      deleteDisclosure.onClose()
    }
  }

  const manufacturerActions = []
  if (isAdmin(authUser)) {
    manufacturerActions.push(
      <Button
        key="view"
        size="sm"
        variant="outline"
        colorScheme="brand"
        leftIcon={<Icon as={FileText} boxSize={4} />}
        onClick={handleViewPdf}
        minH="44px"
        maxW={{ base: '140px', md: 'none' }}
        fontSize={{ base: 'xs', md: 'sm' }}
      >
        {t('orders.actions.viewPdf', 'View PDF')}
      </Button>,
    )
    manufacturerActions.push(
      <Button
        key="download"
        size="sm"
        variant="outline"
        colorScheme="gray"
        leftIcon={<Icon as={Download} boxSize={4} />}
        onClick={handleDownloadPdf}
        isLoading={downloading}
        minH="44px"
        maxW={{ base: '180px', md: 'none' }}
        fontSize={{ base: 'xs', md: 'sm' }}
      >
        {downloading
          ? t('orders.actions.downloading', 'Downloading…')
          : t('orders.actions.downloadPdf', 'Download PDF')}
      </Button>,
    )
    manufacturerActions.push(
      <Button
        key="resend"
        size="sm"
        colorScheme="brand"
        variant="solid"
        leftIcon={<Icon as={Mail} boxSize={4} />}
        onClick={handleResendEmail}
        isLoading={resending}
        minH="44px"
        maxW={{ base: '180px', md: 'none' }}
        fontSize={{ base: 'xs', md: 'sm' }}
      >
        {resending
          ? t('orders.actions.resending', 'Resending…')
          : t('orders.actions.resendEmail', 'Resend Email')}
      </Button>,
    )
    manufacturerActions.push(
      <Button
        key="delete"
        size="sm"
        colorScheme="red"
        variant="outline"
        leftIcon={<Icon as={Trash} boxSize={4} />}
        onClick={handleDeleteOrder}
        minH="44px"
        maxW={{ base: '180px', md: 'none' }}
        fontSize={{ base: 'xs', md: 'sm' }}
      >
        {t('orders.actions.deleteOrder', 'Delete Order')}
      </Button>,
    )
  }

  manufacturerActions.push(
    <Button
      key="back"
      size="sm"
      variant="outline"
      colorScheme="gray"
      leftIcon={<Icon as={ArrowLeft} boxSize={4} />}
      onClick={handleBack}
      minH="44px"
      maxW={{ base: '140px', md: 'none' }}
      fontSize={{ base: 'xs', md: 'sm' }}
    >
      {t('common.back', 'Back')}
    </Button>,
  )

  const primaryManufacturer = parsed.manufacturers?.[0]
  const resolvedPrimaryManufacturer = (() => {
    if (!primaryManufacturer) return null
    const resolveManuName = () => {
      if (order?.manufacturer?.name) return order.manufacturer.name
      if (primaryManufacturer?.manufacturer) {
        const manuId = primaryManufacturer.manufacturer
        const fromMap = manuById?.[manuId] || manuById?.[String(manuId)]
        if (fromMap?.name) return fromMap.name
        const fromList = manuList?.find?.((m) => Number(m?.id) === Number(manuId))
        if (fromList?.name) return fromList.name
      }
      return (
        primaryManufacturer.manufacturerName ||
        primaryManufacturer.name ||
        order?.manufacturer_name ||
        t('orders.common.manufacturer', 'Manufacturer')
      )
    }

    const manuName = resolveManuName()
    const potentialStyleName = primaryManufacturer?.styleName || primaryManufacturer?.style
    const styleName =
      potentialStyleName && potentialStyleName === manuName
        ? order?.style_name || t('common.na')
        : potentialStyleName || order?.style_name || t('common.na')
    const imgUrl = primaryManufacturer?.styleImage || null
    return { manuName, styleName, imgUrl }
  })()

  const mapAlertVariant = (variant) => {
    if (variant === 'danger') return 'error'
    if (variant === 'warning') return 'warning'
    if (variant === 'success') return 'success'
    return 'info'
  }

  const mapButtonScheme = (variant) => {
    if (variant === 'danger') return 'red'
    if (variant === 'warning') return 'yellow'
    if (variant === 'success') return 'brand'
    return 'brand'
  }
  return (
    <Container maxW="7xl" py={6}>
      <Stack spacing={6}>
        <PageHeader
          title={`${t('orders.details.title', 'Order Details')} - ${displayOrderNumber}`}
          subtitle={
            order?.customer?.name
              ? `${t('orders.details.customerLabel', 'Customer')}: ${order.customer.name}`
              : t('orders.details.subtitle', 'Accepted order overview')
          }
          icon={ShoppingCart}
          actions={manufacturerActions}
        />

        {resolvedPrimaryManufacturer && (
          <StandardCard variant="outline">
            <CardHeader fontWeight="semibold">
              {t('orders.details.manufacturerDetails', 'Manufacturer Details')}
            </CardHeader>
            <CardBody>
              <HStack spacing={4} align="center" flexWrap="wrap">
                {resolvedPrimaryManufacturer.imgUrl && (
                  <Image
                    src={resolvedPrimaryManufacturer.imgUrl}
                    alt={resolvedPrimaryManufacturer.styleName || t('common.style', 'Style')}
                    boxSize={18}
                    objectFit="cover"
                    borderRadius="md"
                    cursor="pointer"
                    onClick={() => setPreviewImg(resolvedPrimaryManufacturer.imgUrl)}
                  />
                )}
                <Stack spacing={4} minW={0}>
                  <Text>
                    <Text as="span" fontWeight="semibold">
                      {t('orders.common.manufacturer', 'Manufacturer')}:
                    </Text>{' '}
                    {resolvedPrimaryManufacturer.manuName}
                  </Text>
                  <Text>
                    <Text as="span" fontWeight="semibold">
                      {t('orders.details.styleColor', 'Style (Color)')}:
                    </Text>{' '}
                    {resolvedPrimaryManufacturer.styleName}
                  </Text>
                </Stack>
              </HStack>
            </CardBody>
          </StandardCard>
        )}

        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
          <StandardCard variant="outline">
            <CardHeader fontWeight="semibold">{t('orders.details.order', 'Order')}</CardHeader>
            <CardBody as={Stack} spacing={4} fontSize="sm" color={borderGray700}>
              <Text>
                <Text as="span" fontWeight="semibold">
                  {t('orders.headers.orderNumber', 'Order #')}:
                </Text>{' '}
                {displayOrderNumber}
              </Text>
              <Text>
                <Text as="span" fontWeight="semibold">
                  {t('orders.details.id', 'ID')}:
                </Text>{' '}
                {order?.id}
              </Text>
              <Text>
                <Text as="span" fontWeight="semibold">
                  {t('orders.details.date', 'Date')}:
                </Text>{' '}
                {order?.accepted_at || order?.date || order?.createdAt
                  ? new Date(
                      order.accepted_at || order.date || order.createdAt,
                    ).toLocaleDateString()
                  : t('common.na')}
              </Text>
              <Text display="flex" alignItems="center" gap={4}>
                <Text as="span" fontWeight="semibold">
                  {t('orders.details.status', 'Status')}:
                </Text>{' '}
                <Badge colorScheme="green" borderRadius="full" px={3} py={1} fontSize="xs">
                  {order?.status || 'accepted'}
                </Badge>
              </Text>
              <Text>
                <Text as="span" fontWeight="semibold">
                  {t('orders.details.acceptedAt', 'Accepted at')}:
                </Text>{' '}
                {order?.accepted_at ? new Date(order.accepted_at).toLocaleString() : t('common.na')}
              </Text>
            </CardBody>
          </StandardCard>

          <StandardCard variant="outline">
            <CardHeader fontWeight="semibold">
              {t('orders.details.customer', 'Customer')}
            </CardHeader>
            <CardBody as={Stack} spacing={4} fontSize="sm" color={borderGray700}>
              <Text>
                <Text as="span" fontWeight="semibold">
                  {t('orders.details.name', 'Name')}:
                </Text>{' '}
                {order?.customer?.name || order?.customer_name || t('common.na')}
              </Text>
              <Text>
                <Text as="span" fontWeight="semibold">
                  {t('orders.details.email', 'Email')}:
                </Text>{' '}
                {order?.customer?.email || order?.customer_email || t('common.na')}
              </Text>
              <Text>
                <Text as="span" fontWeight="semibold">
                  {t('orders.details.phone', 'Phone')}:
                </Text>{' '}
                {order?.customer?.mobile ||
                  order?.customer?.phone ||
                  order?.customer_phone ||
                  t('common.na')}
              </Text>
              <Text>
                <Text as="span" fontWeight="semibold">
                  {t('orders.details.address', 'Address')}:
                </Text>{' '}
                {order?.customer?.address || order?.customer_address || t('common.na')}
              </Text>
            </CardBody>
          </StandardCard>

          <StandardCard variant="outline">
            <CardHeader fontWeight="semibold">{t('orders.details.totals', 'Totals')}</CardHeader>
            <CardBody as={Stack} spacing={4} fontSize="sm" color={borderGray700}>
              <Text>
                <Text as="span" fontWeight="semibold">
                  {t('orders.details.subtotalStyles', 'Subtotal (Styles)')}:
                </Text>{' '}
                {currency(displaySummary.styleTotal)}
              </Text>
              <Text>
                <Text as="span" fontWeight="semibold">
                  {t('orders.details.assemblyFee', 'Assembly Fee')}:
                </Text>{' '}
                {currency(displaySummary.assemblyFee)}
              </Text>
              <Text>
                <Text as="span" fontWeight="semibold">
                  {t('orders.details.modifications', 'Modifications')}:
                </Text>{' '}
                {currency(displaySummary.modificationsCost)}
              </Text>
              <Text>
                <Text as="span" fontWeight="semibold">
                  {t('orders.details.deliveryFee', 'Delivery Fee')}:
                </Text>{' '}
                {currency(displaySummary.deliveryFee)}
              </Text>
              <Text>
                <Text as="span" fontWeight="semibold">
                  {t('orders.details.discount', 'Discount')}:
                </Text>{' '}
                {currency(displaySummary.discountAmount)}
              </Text>
              <Text>
                <Text as="span" fontWeight="semibold">
                  {t('orders.details.tax', 'Tax')}:
                </Text>{' '}
                {currency(displaySummary.taxAmount)}
              </Text>
              <Text>
                <Text as="span" fontWeight="semibold">
                  {t('orders.details.grandTotal', 'Grand Total')}:
                </Text>{' '}
                {currency(displaySummary.grandTotal)}
              </Text>
            </CardBody>
          </StandardCard>
        </SimpleGrid>

        <StandardCard variant="outline">
          <CardHeader fontWeight="semibold">{t('orders.details.items', 'Items')}</CardHeader>
          <CardBody>
            <Box display={{ base: 'none', md: 'block' }}>
              <TableContainer>
                <Table variant="simple" size="sm">
                  <Thead bg={bgGray50}>
                    <Tr>
                      <Th>{t('orders.details.item', 'Item')}</Th>
                      <Th>{t('orders.details.specs', 'Specs')}</Th>
                      <Th textAlign="center">{t('orders.details.hingeSide', 'Hinge Side')}</Th>
                      <Th textAlign="center">{t('orders.details.exposedSide', 'Exposed Side')}</Th>
                      <Th textAlign="right">{t('orders.details.qty', 'Qty')}</Th>
                      <Th textAlign="right">{t('orders.details.unitPrice', 'Unit Price')}</Th>
                      <Th textAlign="right">
                        {t('orders.details.modifications', 'Modifications')}
                      </Th>
                      <Th textAlign="right">{t('orders.details.total', 'Total')}</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {parsed.items.length === 0 ? (
                      <Tr>
                        <Td colSpan={8}>
                          <Center py={8} color={iconGray500}>
                            {t('orders.details.noItems', 'No items')}
                          </Center>
                        </Td>
                      </Tr>
                    ) : (
                      parsed.items.map((it, idx) => {
                        const {
                          manuName,
                          qty,
                          unit,
                          total,
                          modsTotal,
                          styleName,
                          thumb,
                          thumbTitle,
                        } = computeItemView(it)
                        const attachments = []
                        try {
                          if (Array.isArray(it.modifications)) {
                            it.modifications.forEach((m) => {
                              if (Array.isArray(m.attachments)) {
                                m.attachments.forEach((att) => {
                                  const mt = String(att.mimeType || '')
                                  if (mt.startsWith('image/')) attachments.push(att.url)
                                })
                              }
                            })
                          }
                        } catch (_) {}
                        return (
                          <Tr key={idx} verticalAlign="top">
                            <Td maxW="320px">
                              <Text fontWeight="medium">
                                {it.name || it.description || it.item || '-'}
                              </Text>
                              {Array.isArray(it.modifications) && it.modifications.length > 0 && (
                                <Stack spacing={4} mt={2} fontSize="xs" color={borderGray600}>
                                  {it.modifications.map((m, i) => {
                                    const details = buildSelectedOptionsText(m?.selectedOptions)
                                    const label =
                                      m?.name ||
                                      m?.templateName ||
                                      t('orders.details.modification', 'Modification')
                                    return (
                                      <Text key={`mod-${idx}-${i}`}>
                                        • {label}
                                        {details ? ` — ${details}` : ''}
                                      </Text>
                                    )
                                  })}
                                </Stack>
                              )}
                              {attachments.length > 0 && (
                                <HStack spacing={4} mt={3} wrap="wrap">
                                  {attachments.map((url, ii) => (
                                    <Image
                                      key={`att-${idx}-${ii}`}
                                      src={url}
                                      alt={`Attachment ${ii + 1}`}
                                      boxSize={24}
                                      objectFit="cover"
                                      borderRadius="md"
                                      borderWidth="1px"
                                      borderColor={borderGray200}
                                      cursor="pointer"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setPreviewImg(url)
                                      }}
                                    />
                                  ))}
                                </HStack>
                              )}
                            </Td>
                            <Td>
                              {thumb ? (
                                <Image
                                  src={thumb}
                                  alt={styleName || manuName}
                                  title={thumbTitle}
                                  boxSize={14}
                                  objectFit="cover"
                                  borderRadius="md"
                                  cursor="pointer"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setPreviewImg(thumb)
                                  }}
                                />
                              ) : (
                                <Text color={iconGray400}>-</Text>
                              )}
                            </Td>
                            <Td textAlign="center">
                              <Badge
                                colorScheme={it.hingeSide ? 'brand' : 'gray'}
                                borderRadius="full"
                                px={3}
                                py={1}
                              >
                                {it.hingeSide || '-'}
                              </Badge>
                            </Td>
                            <Td textAlign="center">
                              <Badge
                                colorScheme={it.exposedSide ? 'brand' : 'gray'}
                                borderRadius="full"
                                px={3}
                                py={1}
                              >
                                {it.exposedSide || '-'}
                              </Badge>
                            </Td>
                            <Td textAlign="right">{qty}</Td>
                            <Td textAlign="right">{currency(unit)}</Td>
                            <Td textAlign="right">{currency(modsTotal)}</Td>
                            <Td textAlign="right">{currency(total)}</Td>
                          </Tr>
                        )
                      })
                    )}
                  </Tbody>
                </Table>
              </TableContainer>
            </Box>

            <Box display={{ base: 'block', md: 'none' }}>
              {parsed.items.length === 0 ? (
                <Center py={8} color={iconGray500}>
                  {t('orders.details.noItems', 'No items')}
                </Center>
              ) : (
                <Stack spacing={4}>
                  {parsed.items.map((it, idx) => {
                    const { manuName, qty, unit, total, modsTotal, styleName, thumb, thumbTitle } =
                      computeItemView(it)
                    const title = it.name || it.description || it.item || '-'
                    const attachments = []
                    try {
                      if (Array.isArray(it.modifications)) {
                        it.modifications.forEach((m) => {
                          if (Array.isArray(m.attachments)) {
                            m.attachments.forEach((att) => {
                              const mt = String(att.mimeType || '')
                              if (mt.startsWith('image/')) attachments.push(att.url)
                            })
                          }
                        })
                      }
                    } catch (_) {}
                    return (
                      <Card key={`mobile-item-${idx}`} variant="outline">
                        <CardBody as={Stack} spacing={4}>
                          <HStack align="flex-start" spacing={4}>
                            {thumb ? (
                              <Image
                                src={thumb}
                                alt={styleName || manuName}
                                title={thumbTitle}
                                boxSize={16}
                                objectFit="cover"
                                borderRadius="md"
                                cursor="pointer"
                                onClick={() => setPreviewImg(thumb)}
                              />
                            ) : (
                              <Box
                                boxSize={16}
                                borderRadius="md"
                                bg={bgGray100}
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                                color={iconGray400}
                                fontWeight="bold"
                              >
                                —
                              </Box>
                            )}
                            <Stack spacing={4} flex="1">
                              <Text fontWeight="semibold">{title}</Text>
                              {Array.isArray(it.modifications) && it.modifications.length > 0 && (
                                <Stack spacing={4} fontSize="xs" color={borderGray600}>
                                  {it.modifications.map((m, i) => {
                                    const details = buildSelectedOptionsText(m?.selectedOptions)
                                    const label =
                                      m?.name ||
                                      m?.templateName ||
                                      t('orders.details.modification', 'Modification')
                                    return (
                                      <Text key={`mod-mobile-${idx}-${i}`}>
                                        • {label}
                                        {details ? ` — ${details}` : ''}
                                      </Text>
                                    )
                                  })}
                                </Stack>
                              )}
                              <Text fontSize="xs" color={borderGray600}>
                                {t('orders.details.modifications', 'Modifications')}:{' '}
                                {currency(modsTotal)}
                              </Text>
                              {(it.hingeSide || it.exposedSide) && (
                                <HStack spacing={4} fontSize="xs" color={borderGray600}>
                                  {it.hingeSide && (
                                    <Badge colorScheme="brand" borderRadius="full" px={2}>
                                      {t('orders.details.hingeSide', 'Hinge Side')}: {it.hingeSide}
                                    </Badge>
                                  )}
                                  {it.exposedSide && (
                                    <Badge colorScheme="brand" borderRadius="full" px={2}>
                                      {t('orders.details.exposedSide', 'Exposed Side')}:{' '}
                                      {it.exposedSide}
                                    </Badge>
                                  )}
                                </HStack>
                              )}
                              {attachments.length > 0 && (
                                <HStack spacing={4} wrap="wrap">
                                  {attachments.map((url, ii) => (
                                    <Image
                                      key={`att-mobile-${idx}-${ii}`}
                                      src={url}
                                      alt={`Attachment ${ii + 1}`}
                                      boxSize={20}
                                      objectFit="cover"
                                      borderRadius="md"
                                      cursor="pointer"
                                      onClick={() => setPreviewImg(url)}
                                    />
                                  ))}
                                </HStack>
                              )}
                              <HStack justify="space-between" fontSize="sm" pt={1}>
                                <Text>
                                  {t('orders.details.qty', 'Qty')}:{' '}
                                  <Text as="span" fontWeight="semibold">
                                    {qty}
                                  </Text>
                                </Text>
                                <Text>
                                  {t('orders.details.unitPrice', 'Unit Price')}:{' '}
                                  <Text as="span" fontWeight="semibold">
                                    {currency(unit)}
                                  </Text>
                                </Text>
                                <Text>
                                  {t('orders.details.total', 'Total')}:{' '}
                                  <Text as="span" fontWeight="semibold">
                                    {currency(total)}
                                  </Text>
                                </Text>
                              </HStack>
                            </Stack>
                          </HStack>
                        </CardBody>
                      </Card>
                    )
                  })}
                </Stack>
              )}
            </Box>
          </CardBody>
        </StandardCard>

        <StandardCard variant="outline">
          <CardHeader fontWeight="semibold">
            {t('orders.details.manufacturers', 'Manufacturers')}
          </CardHeader>
          <CardBody>
            {parsed.manufacturers.length === 0 ? (
              <Text color={iconGray500}>
                {t('orders.details.noManufacturers', 'No manufacturers found')}
              </Text>
            ) : (
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                {parsed.manufacturers.map((m, i) => {
                  const headerLabel =
                    m.manufacturerName ||
                    m.name ||
                    `${t('orders.common.manufacturer', 'Manufacturer')} ${i + 1}`
                  const totals = m?.summary || {}
                  return (
                    <StandardCard key={`manufacturer-${i}`} variant="outline">
                      <CardHeader fontWeight="semibold">{headerLabel}</CardHeader>
                      <CardBody as={Stack} spacing={4} fontSize="sm" color={borderGray700}>
                        {(m?.styleName || m?.style || m?.styleImage) && (
                          <HStack spacing={4} align="center">
                            {m.styleImage && (
                              <Image
                                src={m.styleImage}
                                alt={m.styleName || m.style || t('common.style', 'Style')}
                                boxSize={16}
                                objectFit="cover"
                                borderRadius="md"
                                cursor="pointer"
                                onClick={() => setPreviewImg(m.styleImage)}
                              />
                            )}
                            <Stack spacing={4}>
                              <Text fontSize="xs" color={iconGray500}>
                                {t('orders.details.selectedStyle', 'Selected Style')}
                              </Text>
                              <Text fontWeight="semibold">
                                {m.styleName || m.style || t('common.na')}
                              </Text>
                            </Stack>
                          </HStack>
                        )}
                        <VStack align="stretch" spacing={4}>
                          <Text>
                            <Text as="span" fontWeight="semibold">
                              {t('orders.details.styleTotal', 'Style Total')}:
                            </Text>{' '}
                            {currency(Number(totals.styleTotal || 0))}
                          </Text>
                          <Text>
                            <Text as="span" fontWeight="semibold">
                              {t('orders.details.assemblyFee', 'Assembly Fee')}:
                            </Text>{' '}
                            {currency(Number(totals.assemblyFee || 0))}
                          </Text>
                          <Text>
                            <Text as="span" fontWeight="semibold">
                              {t('orders.details.modifications', 'Modifications')}:
                            </Text>{' '}
                            {currency(Number(totals.modificationsCost || 0))}
                          </Text>
                          <Text>
                            <Text as="span" fontWeight="semibold">
                              {t('orders.details.deliveryFee', 'Delivery Fee')}:
                            </Text>{' '}
                            {currency(Number(totals.deliveryFee || 0))}
                          </Text>
                          <Text>
                            <Text as="span" fontWeight="semibold">
                              {t('orders.details.discount', 'Discount')}:
                            </Text>{' '}
                            {currency(Number(totals.discountAmount || 0))}
                          </Text>
                          <Text>
                            <Text as="span" fontWeight="semibold">
                              {t('orders.details.tax', 'Tax')}:
                            </Text>{' '}
                            {currency(Number(totals.taxAmount || 0))}
                          </Text>
                          <Text>
                            <Text as="span" fontWeight="semibold">
                              {t('orders.details.grandTotal', 'Grand Total')}:
                            </Text>{' '}
                            {currency(Number(totals.grandTotal || 0))}
                          </Text>
                        </VStack>
                      </CardBody>
                    </StandardCard>
                  )
                })}
              </SimpleGrid>
            )}
          </CardBody>
        </StandardCard>
      </Stack>
      <Modal size={{ base: 'full', lg: '5xl' }} isOpen={showPdf} onClose={closePdfModal}>
        <ModalOverlay />
        <ModalContent maxH="90vh">
          <ModalHeader bg={backgroundColor} color={textColor} borderTopRadius="md">
            {t('orders.pdf.title', 'Manufacturer PDF')}
          </ModalHeader>
          <ModalCloseButton color={textColor} />
          <ModalBody p={0} height="80vh">
            {pdfUrl ? (
              <Box as="object" data={pdfUrl} type="application/pdf" width="100%" height="100%">
                <Box
                  as="iframe"
                  title={t('orders.pdf.iframeTitle', 'Manufacturer PDF')}
                  src={pdfUrl}
                  width="100%"
                  height="100%"
                  border="0"
                />
              </Box>
            ) : (
              <Center py={10} color={iconGray500}>
                {t('orders.pdf.loading', 'Loading...')}
              </Center>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={closePdfModal}>{t('common.close', 'Close')}</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal
        size={{ base: 'full', lg: 'xl' }}
        isOpen={!!previewImg}
        onClose={() => setPreviewImg(null)}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader bg={backgroundColor} color={textColor} borderTopRadius="md">
            {t('common.preview', 'Preview')}
          </ModalHeader>
          <ModalCloseButton color={textColor} />
          <ModalBody display="flex" justifyContent="center" alignItems="center" maxH="80vh">
            {previewImg && (
              <Image
                src={previewImg}
                alt={t('common.preview', 'Preview')}
                maxH="70vh"
                borderRadius="md"
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      <Modal isOpen={notice.visible} onClose={closeNotice}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader bg={backgroundColor} color={textColor} borderTopRadius="md">
            {notice.title || t('common.notice', 'Notice')}
          </ModalHeader>
          <ModalCloseButton color={textColor} />
          <ModalBody>
            <Alert
              status={mapAlertVariant(notice.variant)}
              borderRadius="md"
              alignItems="flex-start"
            >
              <AlertIcon />
              <Box>
                <Text>{notice.message}</Text>
              </Box>
            </Alert>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme={mapButtonScheme(notice.variant)} onClick={closeNotice}>
              {t('common.ok', 'OK')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <AlertDialog
        isOpen={deleteDisclosure.isOpen}
        leastDestructiveRef={cancelRef}
        onClose={deleteDisclosure.onClose}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              {t('orders.deleteConfirmTitle', 'Delete Order?')}
            </AlertDialogHeader>
            <AlertDialogBody>
              {t(
                'orders.deleteConfirmMessage',
                'This action cannot be undone. Are you sure you want to delete this order?',
              )}
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={deleteDisclosure.onClose}>
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button colorScheme="red" onClick={confirmDeleteOrder} ml={3}>
                {t('common.delete', 'Delete')}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Container>
  )
}

export default OrderDetails
