import React, { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import PageHeader from '../../components/PageHeader'
import { useTranslation } from 'react-i18next'
import { FaShoppingCart } from 'react-icons/fa'
import { Icon, Badge, Card, CardBody, CardHeader, Box, Container, Flex, Spinner, Alert, Modal, ModalBody, ModalHeader } from '@chakra-ui/react'
import { ArrowLeft } from 'lucide-react'
import { fetchOrderById, clearCurrentOrder } from '../../store/slices/ordersSlice'
import { fetchManufacturers } from '../../store/slices/manufacturersSlice'
import axiosInstance from '../../helpers/axiosInstance'
import { isAdmin } from '../../helpers/permissions'
import Swal from 'sweetalert2'

// Helpers for modification measurements (inches with mixed fractions)
const _gcd = (a, b) => (b ? _gcd(b, a % b) : a)
const formatMixedFraction = (value, precision = 16) => {
  if (value == null || isNaN(value)) return ''
  const sign = value < 0 ? '-' : ''
  let v = Math.abs(Number(value))
  let whole = Math.floor(v)
  let frac = v - whole
  let num = Math.round(frac * precision)
  if (num === precision) {
    whole += 1
    num = 0
  }
  if (num === 0) return `${sign}${whole}`
  const g = _gcd(num, precision)
  const n = num / g
  const d = precision / g
  return `${sign}${whole ? whole + ' ' : ''}${n}/${d}`
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
    ([k, v]) => typeof v === 'number' && isFinite(v),
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
    // Snapshot may be either { manufacturers: [...], summary, items? } or just an array of manufacturers
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
  const [showPdf, setShowPdf] = useState(false)
  const [pdfUrl, setPdfUrl] = useState(null)
  const [resending, setResending] = useState(false)
  const [notice, setNotice] = useState({
    visible: false,
    title: '',
    message: '',
    variant: 'success',
  })
  const [previewImg, setPreviewImg] = useState(null)
  const [downloading, setDownloading] = useState(false)

  const openNotice = (title, message, variant = 'success') =>
    setNotice({ visible: true, title, message, variant })
  const closeNotice = () => setNotice((n) => ({ ...n, visible: false }))

  // Get styling from PageHeader component logic
  const getContrastColor = (backgroundColor) => {
    if (!backgroundColor) return '#ffffff'

    const hex = backgroundColor.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)

    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return luminance > 0.5 ? '#2d3748' : '#ffffff'
  }

  const resolveBackground = (value) => {
    try {
      if (typeof value === 'string') {
        const trimmed = value.trim()
        return trimmed || '#ffffff'
      }
      if (value && typeof value === 'object') {
        if (typeof value.hex === 'string' && value.hex.trim()) return value.hex.trim()
        if (typeof value.value === 'string' && value.value.trim()) return value.value.trim()
      }
    } catch (_) {
      /* ignore and fallback */
    }
    return '#ffffff'
  }

  const backgroundColor = resolveBackground(customization?.headerBg)
  const textColor = getContrastColor(backgroundColor)

  // Determine where to go back based on current route
  const backBasePath = useMemo(
    () => (location?.pathname?.startsWith('/my-orders') ? '/my-orders' : '/orders'),
    [location?.pathname],
  )
  const handleBack = () => {
    // Always take back to list page for clarity
    navigate(backBasePath)
  }

  useEffect(() => {
    if (id) dispatch(fetchOrderById(id))
    // Fetch manufacturers for name resolution
    dispatch(fetchManufacturers())
    return () => {
      dispatch(clearCurrentOrder())
    }
  }, [dispatch, id])

  // Parse snapshot from the fetched order
  const parsed = useMemo(() => parseFromSnapshot(order), [order])

  // Prefer model field, then snapshot info, then fallback to ID
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

  // Helper to compute display fields for an item (used by table and mobile views)
  const computeItemView = (it) => {
    // Enhanced manufacturer name resolution
    const resolveManuName = () => {
      // Try direct manufacturer association from API
      if (order?.manufacturer?.name) return order.manufacturer.name

      // Try snapshot manufacturer ID resolution
      if (parsed?.manufacturers?.[0]?.manufacturer) {
        const manuId = parsed.manufacturers[0].manufacturer
        const fromMap = manuById?.[manuId] || manuById?.[String(manuId)]
        if (fromMap?.name) return fromMap.name

        const fromList = manuList?.find?.((m) => Number(m?.id) === Number(manuId))
        if (fromList?.name) return fromList.name
      }

      // Fallback to existing logic
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

    // Enhanced style name resolution - avoid showing manufacturer name as style
    const resolveItemStyleName = () => {
      const potentialStyleName =
        it.styleName || parsed.manufacturers?.[0]?.styleName || parsed.manufacturers?.[0]?.style

      // If the styleName matches the manufacturer name, it's wrong data
      if (potentialStyleName && potentialStyleName === manuName) {
        // Try to get style name from order.style_name instead
        if (order?.style_name && order.style_name !== manuName) {
          return order.style_name
        }
        // If still wrong, return a generic placeholder
        return '-'
      }

      // Use the styleName if it's different from manufacturer name
      return potentialStyleName || order?.style_name || '-'
    }

    const styleName = resolveItemStyleName()
    const thumb = it.image || it.thumb || parsed.manufacturers?.[0]?.styleImage || null
    const thumbTitle = [styleName, manuName].filter(Boolean).join(' — ')
    return { manuName, qty, unit, total, modsTotal, styleName, thumb, thumbTitle }
  }

  // Compute display totals applying manufacturer cost multiplier and user group multiplier
  // Use saved snapshot totals as-is
  const displaySummary = parsed.summary || { grandTotal: 0 }

  // No external meta fetching; snapshot is the source of truth

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner />
      </Container>
  
  )
  }

  if (error) {
    return (
      <Container className="py-4">
        <Alert status="error">{error}</Alert>
      </Container>
  
  )
  }

  const handleViewPdf = async () => {
    try {
      // Open inline PDF using a blob URL to preserve auth
      const resp = await axiosInstance.get(`/api/orders/${id}/manufacturer-pdf`, {
        responseType: 'blob',
      })
      const blob = new Blob([resp.data], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      setPdfUrl(url)
      setShowPdf(true)
    } catch (e) {
      openNotice(
        'Failed to load PDF',
        e?.response?.data?.message || e.message || 'Please try again.',
        'danger',
      )
    }
  }

  const handleResendEmail = async () => {
    try {
      setResending(true)
      const { data } = await axiosInstance.post(`/api/orders/${id}/resend-manufacturer-email`)
      const ok = !!data?.success || !!data?.result?.sent
      // Ensure only one modal visible at a time — close PDF viewer if open
      if (showPdf) {
        setShowPdf(false)
        if (pdfUrl) {
          URL.revokeObjectURL(pdfUrl)
          setPdfUrl(null)
        }
      }
      if (ok) {
        openNotice('Email Sent', 'Manufacturer email resent successfully.', 'success')
      } else {
        openNotice(
          'Resend Attempted',
          data?.result?.reason || 'The email was not confirmed as sent.',
          'warning',
        )
      }
    } catch (e) {
      openNotice(
        'Resend Failed',
        e?.response?.data?.message || e.message || 'Please try again.',
        'danger',
      )
    } finally {
      setResending(false)
    }
  }

  const handleDownloadPdf = async () => {
    try {
      setDownloading(true)
      // Use dedicated download endpoint to avoid any proxy/query quirks
      const resp = await axiosInstance.get(`/api/orders/${id}/manufacturer-pdf/download`, {
        responseType: 'blob',
      })
      // Determine filename from Content-Disposition header if available
      const disp =
        resp.headers?.['content-disposition'] || resp.headers?.get?.('content-disposition')
      let filename = `Order-${id}-Manufacturer.pdf`
      if (disp && /filename\s*=\s*"?([^";]+)"?/i.test(disp)) {
        const m = disp.match(/filename\s*=\s*"?([^";]+)"?/i)
        if (m && m[1]) filename = m[1]
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
        'Download Failed',
        e?.response?.data?.message || e.message || 'Please try again.',
        'danger',
      )
    } finally {
      setDownloading(false)
    }
  }

  const handleDeleteOrder = async () => {
    try {
      const result = await Swal.fire({
        title: t('orders.confirm.deleteTitle', 'Delete Order?'),
        text: t(
          'orders.confirm.deleteText',
          'This will permanently delete this order and its payments.',
        ),
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: t('orders.confirm.deleteConfirm', 'Delete'),
      })
      if (!result.isConfirmed) return

      await axiosInstance.delete(`/api/orders/${id}`)
      await Swal.fire(
        t('common.deleted', 'Deleted'),
        t('orders.toast.deleted', 'Order deleted successfully.'),
        'success',
      )
      navigate(backBasePath)
    } catch (e) {
      const msg = e?.response?.data?.message || e.message || 'Failed to delete order.'
      await Swal.fire(t('common.error', 'Error'), msg, 'error')
    }
  }

  return (
    <Container fluid>
      <style>
        {`
          .modal-header-custom {
            background: ${backgroundColor} !important;
            background-color: ${backgroundColor} !important;
            background-image: none !important;
            color: ${textColor} !important;
    </div>
    </div>
  
  )
          }
          .modal-header-custom .modal-title {
            color: ${textColor} !important;
          }
          .modal-header-custom .btn-close {
            filter: ${textColor === '#ffffff' ? 'invert(1)' : 'invert(0)'};
          }
        `}
      </style>
      <PageHeader
        title={`${t('orders.details.title', 'Order Details')} — ${displayOrderNumber}`}
        subtitle={
          order?.customer?.name
            ? `${t('orders.details.customerLabel', 'Customer')}: ${order.customer.name}`
            : t('orders.details.subtitle', 'Accepted order overview')
        }
        icon={FaShoppingCart}
        rightContent={
          <div className="d-flex align-items-center gap-2">
            {isAdmin(authUser) && (
              <>
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm"
                  onClick={handleViewPdf}
                  title="View Manufacturer PDF"
                >
                  View PDF
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={handleDownloadPdf}
                  disabled={downloading}
                  title="Download Manufacturer PDF"
                >
                  {downloading ? 'Downloading…' : 'Download PDF'}
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleResendEmail}
                  disabled={resending}
                  title="Resend Manufacturer Email"
                >
                  {resending ? 'Resending…' : 'Resend Email'}
                </button>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={handleDeleteOrder}
                  title="Delete Order"
                >
                  Delete Order
                </button>
              </>
            )}
            <button type="button" className="btn btn-light btn-sm" onClick={handleBack}>
              <Icon as={ArrowLeft} className="me-2" />
              {t('common.back', 'Back')}
            </button>
          </div>
        }
      />
      {/* Manufacturer Details (primary) */}
      {parsed.manufacturers?.length > 0 && (
        <Flex className="mb-3">
          <Box md={12}>
            <Card>
              <CardHeader>
                {t('orders.details.manufacturerDetails', 'Manufacturer Details')}
              </CardHeader>
              <CardBody
                className="d-flex align-items-center"
                style={{ gap: 16, flexWrap: 'wrap' }}
              >
                {(() => {
                  const m = parsed.manufacturers[0]

                  // Enhanced manufacturer name resolution
                  const resolveManuName = () => {
                    // Try direct manufacturer association from API
                    if (order?.manufacturer?.name) return order.manufacturer.name

                    // Try snapshot manufacturer ID resolution
                    if (m?.manufacturer) {
                      const manuId = m.manufacturer
                      const fromMap = manuById?.[manuId] || manuById?.[String(manuId)]
                      if (fromMap?.name) return fromMap.name

                      const fromList = manuList?.find?.((mn) => Number(mn?.id) === Number(manuId))
                      if (fromList?.name) return fromList.name
                    }

                    // Fallback to existing logic
                    return (
                      m.manufacturerName ||
                      m.name ||
                      order?.manufacturer_name ||
                      t('orders.common.manufacturer', 'Manufacturer'
  )
                  }

                  const manuName = resolveManuName()

                  // Enhanced style name resolution - avoid showing manufacturer name as style
                  const resolveStyleName = () => {
                    // Check if styleName is actually the manufacturer name (wrong data)
                    const potentialStyleName = m?.styleName || m?.style

                    // If the styleName matches the manufacturer name, it's wrong data
                    if (potentialStyleName && potentialStyleName === manuName) {
                      // Try to get style name from order.style_name instead
                      if (order?.style_name && order.style_name !== manuName) {
                        return order.style_name
                      }
                      // If still wrong, return a generic placeholder
                      return t('common.na')
                    }

                    // Use the styleName if it's different from manufacturer name
                    return potentialStyleName || order?.style_name || t('common.na')
                  }

                  const styleName = resolveStyleName()
                  const imgUrl = m.styleImage
                  return (
                    <>
                      {imgUrl && (
                        <button
                          type="button"
                          aria-label={t('orders.details.previewStyleImage', 'Preview style image')}
                          onClick={() => setPreviewImg(imgUrl)}
                          className="p-0 border-0 bg-transparent"
                          style={{
                            background: 'none',
                            lineHeight: 0,
                            display: 'inline-block',
                            borderRadius: 8,
                          }}
                        >
                          <img
                            src={imgUrl}
                            alt={styleName || t('common.style', 'Style')}
                            style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8 }}
                          />
                        </button>
                      )}
                      <div>
                        <div className="mb-1">
                          <strong>{t('orders.common.manufacturer', 'Manufacturer')}:</strong>{' '}
                          {manuName}
                        </div>
                        <div className="mb-0">
                          <strong>{t('orders.details.styleColor', 'Style (Color)')}:</strong>{' '}
                          {styleName}
                        </div>
                    </>
                  )
                })()}
              </CardBody>
            </Card>
          </Box>
        </Flex>
      )}

      {/* Order Summary */}
      <Flex className="mb-3">
        <Box md={4}>
          <Card>
            <CardHeader>{t('orders.details.order', 'Order')}</CardHeader>
            <CardBody>
              <div className="mb-2">
                <strong>{t('orders.headers.orderNumber', 'Order #')}:</strong> {displayOrderNumber}
              </div>
              <div className="mb-2">
                <strong>{t('orders.details.id', 'ID')}:</strong> {order?.id}
              </div>
              <div className="mb-2">
                <strong>{t('orders.details.date', 'Date')}:</strong>{' '}
                {new Date(
                  order?.accepted_at || order?.date || order?.createdAt,
                ).toLocaleDateString()}
              </div>
              <div className="mb-2">
                <strong>{t('orders.details.status', 'Status')}:</strong>{' '}
                <Badge status="success">{order?.status || 'accepted'}</Badge>
              </div>
              <div className="mb-2">
                <strong>{t('orders.details.acceptedAt', 'Accepted at')}:</strong>{' '}
                {order?.accepted_at ? new Date(order.accepted_at).toLocaleString() : t('common.na')}
              </div>
            </CardBody>
          </Card>
        </Box>
        <Box md={4}>
          <Card>
            <CardHeader>{t('orders.details.customer', 'Customer')}</CardHeader>
            <CardBody>
              <div className="mb-2">
                <strong>{t('orders.details.name', 'Name')}:</strong>{' '}
                {order?.customer?.name || order?.customer_name || t('common.na')}
              </div>
              <div className="mb-2">
                <strong>{t('orders.details.email', 'Email')}:</strong>{' '}
                {order?.customer?.email || order?.customer_email || t('common.na')}
              </div>
              <div className="mb-2">
                <strong>{t('orders.details.phone', 'Phone')}:</strong>{' '}
                {order?.customer?.mobile ||
                  order?.customer?.phone ||
                  order?.customer_phone ||
                  t('common.na')}
              </div>
              <div className="mb-2">
                <strong>{t('orders.details.address', 'Address')}:</strong>{' '}
                {order?.customer?.address || order?.customer_address || t('common.na')}
              </div>
            </CardBody>
          </Card>
        </Box>
        <Box md={4}>
          <Card>
            <CardHeader>{t('orders.details.totals', 'Totals')}</CardHeader>
            <CardBody>
              <div className="mb-2">
                <strong>{t('orders.details.subtotalStyles', 'Subtotal (Styles)')}:</strong>{' '}
                {currency(displaySummary.styleTotal)}
              </div>
              <div className="mb-2">
                <strong>{t('orders.details.assemblyFee', 'Assembly Fee')}:</strong>{' '}
                {currency(displaySummary.assemblyFee)}
              </div>
              <div className="mb-2">
                <strong>{t('orders.details.modifications', 'Modifications')}:</strong>{' '}
                {currency(displaySummary.modificationsCost)}
              </div>
              <div className="mb-2">
                <strong>{t('orders.details.deliveryFee', 'Delivery Fee')}:</strong>{' '}
                {currency(displaySummary.deliveryFee)}
              </div>
              <div className="mb-2">
                <strong>{t('orders.details.discount', 'Discount')}:</strong>{' '}
                {currency(displaySummary.discountAmount)}
              </div>
              <div className="mb-2">
                <strong>{t('orders.details.tax', 'Tax')}:</strong>{' '}
                {currency(displaySummary.taxAmount)}
              </div>
              <div className="mb-2">
                <strong>{t('orders.details.grandTotal', 'Grand Total')}:</strong>{' '}
                {currency(displaySummary.grandTotal)}
              </div>
            </CardBody>
          </Card>
        </Box>
      </Flex>

      {/* Items Table */}
      <Card className="mb-4">
        <CardHeader>{t('orders.details.items', 'Items')}</CardHeader>
        <CardBody>
          {/* Desktop/tablet view */}
          <div className="d-none d-md-block">
            <div className="table-wrap">
              <CTable hover className="table-modern" role="table">
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell scope="col">
                      {t('orders.details.item', 'Item')}
                    </CTableHeaderCell>
                    <CTableHeaderCell scope="col">
                      {t('orders.details.specs', 'Specs')}
                    </CTableHeaderCell>
                    <CTableHeaderCell scope="col" className="text-center">
                      {t('orders.details.hingeSide', 'Hinge Side')}
                    </CTableHeaderCell>
                    <CTableHeaderCell scope="col" className="text-center">
                      {t('orders.details.exposedSide', 'Exposed Side')}
                    </CTableHeaderCell>
                    <CTableHeaderCell scope="col" className="text-end">
                      {t('orders.details.qty', 'Qty')}
                    </CTableHeaderCell>
                    <CTableHeaderCell scope="col" className="text-end">
                      {t('orders.details.unitPrice', 'Unit Price')}
                    </CTableHeaderCell>
                    <CTableHeaderCell scope="col" className="text-end">
                      {t('orders.details.modifications', 'Modifications')}
                    </CTableHeaderCell>
                    <CTableHeaderCell scope="col" className="text-end">
                      {t('orders.details.total', 'Total')}
                    </CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {parsed.items.length === 0 ? (
                    <CTableRow>
                      <CTableDataCell colSpan={8} className="text-center text-muted py-4">
                        {t('orders.details.noItems', 'No items')}
                      </CTableDataCell>
                    </CTableRow>
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
                      return (
                        <CTableRow key={idx}>
                          <CTableDataCell>
                            <div>{it.name || it.description || it.item || '-'}</div>
                            {Array.isArray(it.modifications) && it.modifications.length > 0 && (
                              <div className="text-muted small mt-1">
                                {it.modifications.map((m, i) => {
                                  const details = buildSelectedOptionsText(m?.selectedOptions)
                                  const label = m?.name || m?.templateName || 'Modification'
                                  return (
                                    <div key={`mod-${idx}-${i}`}>
                                      • {label}
                                      {details ? ` — ${details}` : ''}
                                    </div>
                                  )
                                })}
                              </div>
                            )}

                            {/* Attachments gallery under the item for printing/manufacturing clarity */}
                            {(() => {
                              const imgs = []
                              try {
                                if (Array.isArray(it.modifications)) {
                                  it.modifications.forEach((m) => {
                                    if (Array.isArray(m.attachments)) {
                                      m.attachments.forEach((att) => {
                                        const mt = String(att.mimeType || '')
                                        if (mt.startsWith('image/')) imgs.push(att.url)
                                      })
    </div>
    </div>
  )
}
                                  })
                                }
                              } catch (_) {}
                              if (!imgs.length) return null
                              return (
                                <div className="mt-2 d-flex flex-wrap gap-2">
                                  {imgs.map((url, ii) => (
                                    <button
                                      key={`att-${idx}-${ii}`}
                                      type="button"
                                      aria-label={t(
                                        'orders.details.previewAttachment',
                                        'Preview attachment {{num}}',
                                        { num: ii + 1 },
                                      )}
                                      className="p-0 border-0 bg-transparent"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setPreviewImg(url)
                                      }}
                                      style={{
                                        background: 'none',
                                        lineHeight: 0,
                                        display: 'inline-block',
                                        borderRadius: 6,
                                      }}
                                    >
                                      <img
                                        src={url}
                                        alt={`Attachment ${ii + 1}`}
                                        style={{
                                          width: 120,
                                          height: 120,
                                          objectFit: 'cover',
                                          borderRadius: 6,
                                          border: '1px solid #e9ecef',
                                        }}
                                      />
                                    </button>
                                  ))}
                                </div>
                              )
                            })()}
                          </CTableDataCell>
                          <CTableDataCell>
                            {thumb ? (
                              <button
                                type="button"
                                aria-label={t(
                                  'orders.details.previewThumbnail',
                                  'Preview thumbnail',
                                )}
                                className="p-0 border-0 bg-transparent"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setPreviewImg(thumb)
                                }}
                                style={{
                                  background: 'none',
                                  lineHeight: 0,
                                  display: 'inline-block',
                                  borderRadius: 6,
                                }}
                              >
                                <img
                                  src={thumb}
                                  alt={styleName || manuName}
                                  title={thumbTitle}
                                  style={{
                                    width: 40,
                                    height: 40,
                                    objectFit: 'cover',
                                    borderRadius: 6,
                                  }}
                                />
                              </button>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </CTableDataCell>
                          <CTableDataCell className="text-center">
                            <span
                              className={`badge ${it.hingeSide ? 'bg-primary' : 'bg-secondary'}`}
                            >
                              {it.hingeSide || '-'}
                            </span>
                          </CTableDataCell>
                          <CTableDataCell className="text-center">
                            <span
                              className={`badge ${it.exposedSide ? 'bg-primary' : 'bg-secondary'}`}
                            >
                              {it.exposedSide || '-'}
                            </span>
                          </CTableDataCell>
                          <CTableDataCell className="text-end">{qty}</CTableDataCell>
                          <CTableDataCell className="text-end">{currency(unit)}</CTableDataCell>
                          <CTableDataCell className="text-end">
                            {currency(modsTotal)}
                          </CTableDataCell>
                          <CTableDataCell className="text-end">{currency(total)}</CTableDataCell>
                        </CTableRow>
                      )
                    })
                  )}
                </CTableBody>
              </CTable>
            </div>
          {/* Mobile view */}
          <div className="d-block d-md-none">
            {parsed.items.length === 0 ? (
              <div className="text-center text-muted py-4">
                {t('orders.details.noItems', 'No items')}
              </div>
            ) : (
              <div className="d-flex flex-column gap-2">
                {parsed.items.map((it, idx) => {
                  const { manuName, qty, unit, total, modsTotal, styleName, thumb, thumbTitle } =
                    computeItemView(it)
                  const title = it.name || it.description || it.item || '-'
                  return (
                    <div
                      key={idx}
                      className="d-flex p-2 border rounded align-items-center"
                      style={{ gap: 12 }}
                    >
                      <div>
                        {thumb ? (
                          <button
                            type="button"
                            aria-label={t('orders.details.previewThumbnail', 'Preview thumbnail')}
                            className="p-0 border-0 bg-transparent"
                            onClick={() => setPreviewImg(thumb)}
                            style={{
                              background: 'none',
                              lineHeight: 0,
                              display: 'inline-block',
                              borderRadius: 6,
                            }}
                          >
                            <img
                              src={thumb}
                              alt={styleName || manuName}
                              title={thumbTitle}
                              style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6 }}
                            />
                          </button>
                        ) : (
                          <div
                            className="bg-light d-flex align-items-center justify-content-center"
                            style={{ width: 48, height: 48, borderRadius: 6 }}
                          >
                            –
                          </div>
                        )}
                      </div>
                      <div className="flex-grow-1">
                        <div style={{ fontWeight: 600 }}>{title}</div>
                        {Array.isArray(it.modifications) && it.modifications.length > 0 && (
                          <div className="text-muted" style={{ fontSize: 12 }}>
                            {it.modifications.map((m, i) => {
                              const details = buildSelectedOptionsText(m?.selectedOptions)
                              const label = m?.name || m?.templateName || 'Modification'
                              return (
                                <div key={`mod-m-${idx}-${i}`}>
                                  • {label}
                                  {details ? ` — ${details}` : ''}
                                </div>
                              )
                            })}
                          </div>
                        )}
                        <div className="text-muted" style={{ fontSize: 12 }}>
                          {t('orders.details.modifications', 'Modifications')}:{' '}
                          {currency(modsTotal)}
                        </div>
                        {(it.hingeSide || it.exposedSide) && (
                          <div className="text-muted" style={{ fontSize: 12 }}>
                            {it.hingeSide && (
                              <span className="badge bg-primary me-2">
                                {t('orders.details.hingeSide', 'Hinge Side')}: {it.hingeSide}
                              </span>
                            )}
                            {it.exposedSide && (
                              <span className="badge bg-primary">
                                {t('orders.details.exposedSide', 'Exposed Side')}: {it.exposedSide}
                              </span>
                            )}
                          </div>
                        )}
                        <div
                          className="d-flex justify-content-between mt-1"
                          style={{ fontSize: 14 }}
                        >
                          <div>
                            {t('orders.details.qty', 'Qty')}: <strong>{qty}</strong>
                          </div>
                          <div>
                            {t('orders.details.unitPrice', 'Unit Price')}:{' '}
                            <strong>{currency(unit)}</strong>
                          </div>
                          <div>
                            {t('orders.details.total', 'Total')}: <strong>{currency(total)}</strong>
                          </div>
                      </div>
                  )
                })}
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Manufacturers Breakdown */}
      <Card>
        <CardHeader>{t('orders.details.manufacturers', 'Manufacturers')}</CardHeader>
        <CardBody>
          {parsed.manufacturers.length === 0 ? (
            <div className="text-muted">
              {t('orders.details.noManufacturers', 'No manufacturers found')}
            </div>
          ) : (
            <Flex className="g-3">
              {parsed.manufacturers.map((m, i) => (
                <Box md={6} key={i}>
                  <Card>
                    <CardHeader>
                      {m.manufacturerName ||
                        m.name ||
                        `${t('orders.common.manufacturer', 'Manufacturer')} ${i + 1}`}
                    </CardHeader>
                    <CardBody>
                      {/* Style (name + picture) from snapshot */}
                      {m?.styleName || m?.style || m?.styleImage ? (
                        <div className="d-flex align-items-center mb-3" style={{ gap: 12 }}>
                          {m.styleImage && (
                            <CCardImage
                              src={m.styleImage}
                              style={{
                                width: 64,
                                height: 64,
                                objectFit: 'cover',
                                borderRadius: 6,
                                cursor: 'pointer',
                              }}
                              onClick={() => setPreviewImg(m.styleImage)}
                            />
                          )}
                          <div>
                            <div className="text-muted" style={{ fontSize: 12 }}>
                              {t('orders.details.selectedStyle', 'Selected Style')}
                            </div>
                            <div>
                              <strong>{m.styleName || m.style}</strong>
                            </div>
                        </div>
                      ) : null}
                      {(() => {
                        // Per-manufacturer totals from snapshot
                        const s = m?.summary || {}
                        const itemsSubtotal = Number(s.styleTotal || 0)
                        const assembly = Number(s.assemblyFee || 0)
                        const modifications = Number(s.modificationsCost || 0)
                        const deliveryFee = Number(s.deliveryFee || 0)
                        const discountAmount = Number(s.discountAmount || 0)
                        const taxAmount = Number(s.taxAmount || 0)
                        const grandTotal = Number(s.grandTotal || 0)
                        return (
                          <>
                            <div className="mb-2">
                              <strong>{t('orders.details.styleTotal', 'Style Total')}:</strong>{' '}
                              {currency(itemsSubtotal)}
                            </div>
                            <div className="mb-2">
                              <strong>{t('orders.details.assemblyFee', 'Assembly Fee')}:</strong>{' '}
                              {currency(assembly)}
                            </div>
                            <div className="mb-2">
                              <strong>{t('orders.details.modifications', 'Modifications')}:</strong>{' '}
                              {currency(modifications)}
                            </div>
                            <div className="mb-2">
                              <strong>{t('orders.details.deliveryFee', 'Delivery Fee')}:</strong>{' '}
                              {currency(deliveryFee)}
                            </div>
                            <div className="mb-2">
                              <strong>{t('orders.details.discount', 'Discount')}:</strong>{' '}
                              {currency(discountAmount)}
                            </div>
                            <div className="mb-2">
                              <strong>{t('orders.details.tax', 'Tax')}:</strong>{' '}
                              {currency(taxAmount)}
                            </div>
                            <div className="mb-2">
                              <strong>{t('orders.details.grandTotal', 'Grand Total')}:</strong>{' '}
                              {currency(grandTotal)}
                            </div>
                          </>
                        )
                      })()}
                    </CardBody>
                  </Card>
                </Box>
              ))}
            </Flex>
          )}
        </CardBody>
      </Card>

      {/* PDF Modal */}
      <Modal
        size="xl"
        isOpen={showPdf}
        onClose={() =>
{
          setShowPdf(false)
          if (pdfUrl) {
            URL.revokeObjectURL(pdfUrl)
            setPdfUrl(null
  
  )
          }
        }}
      >
          <ModalHeader className="modal-header-custom">
            Manufacturer PDF
          </ModalHeader>
          <ModalBody style={{ height: '80vh' }}>
            {pdfUrl ? (
              <object data={pdfUrl} type="application/pdf" width="100%" height="100%">
                <iframe title="Manufacturer PDF" src={pdfUrl} style={{ width: '100%', height: '100%', border: 'none' }} />
              </object>
            ) : (
              <div className="text-center text-muted py-5">Loading...</div>
            )}
          </ModalBody>
        </ModalContent>
        
      </Modal>

      {/* Image Preview Modal */}
      <Modal size="xl" isOpen={!!previewImg} onClose={() =>
setPreviewImg(null)}>
        <ModalHeader className="modal-header-custom">
          <ModalHeader>{t('common.preview', 'Preview')}</ModalHeader>
          <CCloseButton className="text-reset" onClick={() => setPreviewImg(null)} />
        </ModalHeader>
        <ModalBody className="text-center">
          {previewImg ? (
            <img src={previewImg} alt="Preview" style={{ maxWidth: '100%', maxHeight: '75vh' }} />
          ) : null}
        </ModalBody>
        </ModalContent>
      </Modal>

      {/* Notice Modal */}
      <Modal isOpen={notice.visible} onClose={closeNotice}>
        <ModalOverlay><ModalHeader className="modal-header-custom">
          <ModalHeader>{notice.title || 'Notice'}</ModalHeader>
          <CCloseButton className="text-reset" onClick={closeNotice} />
        </ModalHeader>
        <ModalBody>
          <Alert color={notice.variant}>{notice.message}</Alert>
          <div className="text-end">
            <button
              type="button"
              className={`btn btn-${notice.variant === 'danger' ? 'danger' : notice.variant === 'warning' ? 'warning' : 'primary'}`}
              onClick={closeNotice}
            >
              OK
            </button>
          </div>
        </ModalBody>
        </ModalContent>
      </Modal>
    </Container>
  )
}

                        </div>
                      </div>
    </Container>
</Container>
    </style>
        </div>
export default OrderDetails
