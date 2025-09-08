import React, { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import PageHeader from '../../components/PageHeader'
import { useTranslation } from 'react-i18next'
import { FaShoppingCart } from 'react-icons/fa'
import CIcon from '@coreui/icons-react'
import { cilArrowLeft } from '@coreui/icons'
import {
  CBadge,
  CCard,
  CCardBody,
  CCardHeader,
  CCardImage,
  CCol,
  CContainer,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CSpinner,
  CAlert,
  CModal,
  CModalBody,
  CModalHeader,
  CModalTitle,
  CCloseButton,
} from '@coreui/react'
import { fetchOrderById, clearCurrentOrder } from '../../store/slices/ordersSlice'
import { fetchManufacturers } from '../../store/slices/manufacturersSlice'

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
const keyToLabel = (key) => String(key || '')
  .replace(/_/g, ' ')
  .replace(/([a-z])([A-Z])/g, '$1 $2')
  .replace(/\s+/g, ' ')
  .trim()
const mapSide = (s) => (s === 'L' ? 'Left' : s === 'R' ? 'Right' : s === 'B' ? 'Both' : s)
const buildSelectedOptionsText = (selectedOptions) => {
  if (!selectedOptions || typeof selectedOptions !== 'object') return ''
  const parts = []
  const numericEntries = Object.entries(selectedOptions).filter(([k, v]) => typeof v === 'number' && isFinite(v))
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

const currency = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(n || 0))

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
      : manufacturers.flatMap((m) => Array.isArray(m.items) ? m.items : [])
    const summary = root?.summary || manufacturers.reduce((agg, m) => {
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
  const [previewImg, setPreviewImg] = useState(null)

  // Get styling from PageHeader component logic
  const getContrastColor = (backgroundColor) => {
    if (!backgroundColor) return '#ffffff';

    const hex = backgroundColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#2d3748' : '#ffffff';
  };

  const resolveBackground = (value) => {
    try {
      if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed || '#ffffff';
      }
      if (value && typeof value === 'object') {
        if (typeof value.hex === 'string' && value.hex.trim()) return value.hex.trim();
        if (typeof value.value === 'string' && value.value.trim()) return value.value.trim();
      }
    } catch (_) { /* ignore and fallback */ }
    return '#ffffff';
  };

  const backgroundColor = resolveBackground(customization?.headerBg);
  const textColor = getContrastColor(backgroundColor);

  // Determine where to go back based on current route
  const backBasePath = useMemo(() => (location?.pathname?.startsWith('/my-orders') ? '/my-orders' : '/orders'), [location?.pathname])
  const handleBack = () => {
    // Always take back to list page for clarity
    navigate(backBasePath)
  }

  useEffect(() => {
    if (id) dispatch(fetchOrderById(id))
    // Fetch manufacturers for name resolution
    dispatch(fetchManufacturers())
    return () => { dispatch(clearCurrentOrder()) }
  }, [dispatch, id])

  // Parse snapshot from the fetched order
  const parsed = useMemo(() => parseFromSnapshot(order), [order])

  // Helper to compute display fields for an item (used by table and mobile views)
  const computeItemView = (it) => {
    // Enhanced manufacturer name resolution
    const resolveManuName = () => {
      // Try direct manufacturer association from API
      if (order?.manufacturer?.name) return order.manufacturer.name;

      // Try snapshot manufacturer ID resolution
      if (parsed?.manufacturers?.[0]?.manufacturer) {
        const manuId = parsed.manufacturers[0].manufacturer;
        const fromMap = manuById?.[manuId] || manuById?.[String(manuId)];
        if (fromMap?.name) return fromMap.name;

        const fromList = manuList?.find?.((m) => Number(m?.id) === Number(manuId));
        if (fromList?.name) return fromList.name;
      }

      // Fallback to existing logic
      return it.manufacturerName || order?.manufacturer_name || parsed.manufacturers?.[0]?.manufacturerName || parsed.manufacturers?.[0]?.name || '-';
    };

    const manuName = resolveManuName();
    const qty = Number(it.qty || it.quantity || 1)
    const unit = Number(it.snapshotUnitPrice ?? it.finalUnitPrice ?? it.calculatedUnitPrice ?? it.unitPrice ?? it.price ?? 0)
    const total = Number(it.snapshotTotal ?? it.finalTotal ?? it.total ?? (unit * qty))
    const modsTotal = Array.isArray(it.modifications)
      ? it.modifications.reduce((s, m) => s + (Number(m.price || 0) * Number(m.qty || 1)), 0)
      : Number(it.modificationsTotal || 0)

    // Enhanced style name resolution - avoid showing manufacturer name as style
    const resolveItemStyleName = () => {
      const potentialStyleName = it.styleName || parsed.manufacturers?.[0]?.styleName || parsed.manufacturers?.[0]?.style;

      // If the styleName matches the manufacturer name, it's wrong data
      if (potentialStyleName && potentialStyleName === manuName) {
        // Try to get style name from order.style_name instead
        if (order?.style_name && order.style_name !== manuName) {
          return order.style_name;
        }
        // If still wrong, return a generic placeholder
        return '-';
      }

      // Use the styleName if it's different from manufacturer name
      return potentialStyleName || order?.style_name || '-';
    };

    const styleName = resolveItemStyleName();
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
      <CContainer className="py-5 text-center">
        <CSpinner />
      </CContainer>
    )
  }

  if (error) {
    return (
      <CContainer className="py-4">
        <CAlert color="danger">{error}</CAlert>
      </CContainer>
    )
  }

  return (
    <CContainer fluid>
      <style>
        {`
          .modal-header-custom {
            background: ${backgroundColor} !important;
            background-color: ${backgroundColor} !important;
            background-image: none !important;
            color: ${textColor} !important;
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
        title={t('orders.details.title', 'Order Details')}
  subtitle={order?.customer?.name ? `${t('orders.details.customerLabel', 'Customer')}: ${order.customer.name}` : t('orders.details.subtitle', 'Accepted order overview')}
        icon={FaShoppingCart}
        rightContent={
          <button type="button" className="btn btn-light btn-sm" onClick={handleBack}>
            <CIcon icon={cilArrowLeft} className="me-2" />{t('common.back', 'Back')}
          </button>
        }
      />
      {/* Manufacturer Details (primary) */}
  {parsed.manufacturers?.length > 0 && (
        <CRow className="mb-3">
          <CCol md={12}>
            <CCard>
              <CCardHeader>{t('orders.details.manufacturerDetails', 'Manufacturer Details')}</CCardHeader>
              <CCardBody className="d-flex align-items-center" style={{ gap: 16, flexWrap: 'wrap' }}>
                {(() => {
      const m = parsed.manufacturers[0]

      // Enhanced manufacturer name resolution
      const resolveManuName = () => {
        // Try direct manufacturer association from API
        if (order?.manufacturer?.name) return order.manufacturer.name;

        // Try snapshot manufacturer ID resolution
        if (m?.manufacturer) {
          const manuId = m.manufacturer;
          const fromMap = manuById?.[manuId] || manuById?.[String(manuId)];
          if (fromMap?.name) return fromMap.name;

          const fromList = manuList?.find?.((mn) => Number(mn?.id) === Number(manuId));
          if (fromList?.name) return fromList.name;
        }

        // Fallback to existing logic
        return m.manufacturerName || m.name || order?.manufacturer_name || t('orders.common.manufacturer', 'Manufacturer');
      };

      const manuName = resolveManuName();

      // Enhanced style name resolution - avoid showing manufacturer name as style
      const resolveStyleName = () => {
        // Check if styleName is actually the manufacturer name (wrong data)
        const potentialStyleName = m?.styleName || m?.style;

        // If the styleName matches the manufacturer name, it's wrong data
        if (potentialStyleName && potentialStyleName === manuName) {
          // Try to get style name from order.style_name instead
          if (order?.style_name && order.style_name !== manuName) {
            return order.style_name;
          }
          // If still wrong, return a generic placeholder
          return t('common.na');
        }

        // Use the styleName if it's different from manufacturer name
        return potentialStyleName || order?.style_name || t('common.na');
      };

      const styleName = resolveStyleName();
      const imgUrl = m.styleImage
                  return (
                    <>
                      {imgUrl && (
        <img src={imgUrl} alt={styleName || t('common.style', 'Style')} style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, cursor: 'pointer' }} onClick={() => setPreviewImg(imgUrl)} />
                      )}
                      <div>
        <div className="mb-1"><strong>{t('orders.common.manufacturer', 'Manufacturer')}:</strong> {manuName}</div>
        <div className="mb-0"><strong>{t('orders.details.styleColor', 'Style (Color)')}:</strong> {styleName}</div>
                      </div>
                    </>
                  )
                })()}
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      )}

      {/* Order Summary */}
      <CRow className="mb-3">
        <CCol md={4}>
          <CCard>
            <CCardHeader>{t('orders.details.order', 'Order')}</CCardHeader>
            <CCardBody>
              <div className="mb-2"><strong>{t('orders.details.id', 'ID')}:</strong> {order?.id}</div>
              <div className="mb-2"><strong>{t('orders.details.date', 'Date')}:</strong> {new Date(order?.accepted_at || order?.date || order?.createdAt).toLocaleDateString()}</div>
              <div className="mb-2"><strong>{t('orders.details.status', 'Status')}:</strong> <CBadge color="success">{order?.status || 'accepted'}</CBadge></div>
              <div className="mb-2"><strong>{t('orders.details.acceptedAt', 'Accepted at')}:</strong> {order?.accepted_at ? new Date(order.accepted_at).toLocaleString() : t('common.na')}</div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol md={4}>
          <CCard>
            <CCardHeader>{t('orders.details.customer', 'Customer')}</CCardHeader>
            <CCardBody>
              <div className="mb-2"><strong>{t('orders.details.name', 'Name')}:</strong> {order?.customer?.name || order?.customer_name || t('common.na')}</div>
              <div className="mb-2"><strong>{t('orders.details.email', 'Email')}:</strong> {order?.customer?.email || order?.customer_email || t('common.na')}</div>
              <div className="mb-2"><strong>{t('orders.details.phone', 'Phone')}:</strong> {order?.customer?.mobile || order?.customer?.phone || order?.customer_phone || t('common.na')}</div>
              <div className="mb-2"><strong>{t('orders.details.address', 'Address')}:</strong> {order?.customer?.address || order?.customer_address || t('common.na')}</div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol md={4}>
          <CCard>
            <CCardHeader>{t('orders.details.totals', 'Totals')}</CCardHeader>
            <CCardBody>
              <div className="mb-2"><strong>{t('orders.details.subtotalStyles', 'Subtotal (Styles)')}:</strong> {currency(displaySummary.styleTotal)}</div>
              <div className="mb-2"><strong>{t('orders.details.assemblyFee', 'Assembly Fee')}:</strong> {currency(displaySummary.assemblyFee)}</div>
              <div className="mb-2"><strong>{t('orders.details.modifications', 'Modifications')}:</strong> {currency(displaySummary.modificationsCost)}</div>
              <div className="mb-2"><strong>{t('orders.details.deliveryFee', 'Delivery Fee')}:</strong> {currency(displaySummary.deliveryFee)}</div>
              <div className="mb-2"><strong>{t('orders.details.discount', 'Discount')}:</strong> {currency(displaySummary.discountAmount)}</div>
              <div className="mb-2"><strong>{t('orders.details.tax', 'Tax')}:</strong> {currency(displaySummary.taxAmount)}</div>
              <div className="mb-2"><strong>{t('orders.details.grandTotal', 'Grand Total')}:</strong> {currency(displaySummary.grandTotal)}</div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

  {/* Items Table */}
  <CCard className="mb-4">
        <CCardHeader>{t('orders.details.items', 'Items')}</CCardHeader>
        <CCardBody>
          {/* Desktop/tablet view */}
      <div className="d-none d-md-block">
    <div className="table-wrap">
    <CTable hover className="table-modern" role="table">
              <CTableHead>
                <CTableRow>
      <CTableHeaderCell scope="col">{t('orders.details.item', 'Item')}</CTableHeaderCell>
      <CTableHeaderCell scope="col">{t('orders.details.specs', 'Specs')}</CTableHeaderCell>
      <CTableHeaderCell scope="col" className="text-center">{t('orders.details.hingeSide', 'Hinge Side')}</CTableHeaderCell>
      <CTableHeaderCell scope="col" className="text-center">{t('orders.details.exposedSide', 'Exposed Side')}</CTableHeaderCell>
      <CTableHeaderCell scope="col" className="text-end">{t('orders.details.qty', 'Qty')}</CTableHeaderCell>
      <CTableHeaderCell scope="col" className="text-end">{t('orders.details.unitPrice', 'Unit Price')}</CTableHeaderCell>
      <CTableHeaderCell scope="col" className="text-end">{t('orders.details.modifications', 'Modifications')}</CTableHeaderCell>
      <CTableHeaderCell scope="col" className="text-end">{t('orders.details.total', 'Total')}</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {parsed.items.length === 0 ? (
                  <CTableRow>
                    <CTableDataCell colSpan={8} className="text-center text-muted py-4">{t('orders.details.noItems', 'No items')}</CTableDataCell>
                  </CTableRow>
                ) : (
                  parsed.items.map((it, idx) => {
                    const { manuName, qty, unit, total, modsTotal, styleName, thumb, thumbTitle } = computeItemView(it)
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
                                  <div key={`mod-${idx}-${i}`}>• {label}{details ? ` — ${details}` : ''}</div>
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
                                  }
                                })
                              }
                            } catch (_) {}
                            if (!imgs.length) return null
                            return (
                              <div className="mt-2 d-flex flex-wrap gap-2">
                                {imgs.map((url, ii) => (
                                  <img
                                    key={`att-${idx}-${ii}`}
                                    src={url}
                                    alt={`Attachment ${ii + 1}`}
                                    style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 6, border: '1px solid #e9ecef', cursor: 'pointer' }}
                                    onClick={(e) => { e.stopPropagation(); setPreviewImg(url) }}
                                  />
                                ))}
                              </div>
                            )
                          })()}
                        </CTableDataCell>
                        <CTableDataCell>
                          {thumb ? (
                            <img
                              src={thumb}
                              alt={styleName || manuName}
                              title={thumbTitle}
                              style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6, cursor: 'pointer' }}
                              onClick={(e) => { e.stopPropagation(); setPreviewImg(thumb) }}
                            />
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </CTableDataCell>
                        <CTableDataCell className="text-center">
                          <span className={`badge ${it.hingeSide ? 'bg-primary' : 'bg-secondary'}`}>
                            {it.hingeSide || '-'}
                          </span>
                        </CTableDataCell>
                        <CTableDataCell className="text-center">
                          <span className={`badge ${it.exposedSide ? 'bg-primary' : 'bg-secondary'}`}>
                            {it.exposedSide || '-'}
                          </span>
                        </CTableDataCell>
                        <CTableDataCell className="text-end">{qty}</CTableDataCell>
                        <CTableDataCell className="text-end">{currency(unit)}</CTableDataCell>
                        <CTableDataCell className="text-end">{currency(modsTotal)}</CTableDataCell>
                        <CTableDataCell className="text-end">{currency(total)}</CTableDataCell>
                      </CTableRow>
                    )
                  })
                )}
              </CTableBody>
            </CTable>
            </div>
          </div>
          {/* Mobile view */}
          <div className="d-block d-md-none">
            {parsed.items.length === 0 ? (
              <div className="text-center text-muted py-4">{t('orders.details.noItems', 'No items')}</div>
            ) : (
              <div className="d-flex flex-column gap-2">
                {parsed.items.map((it, idx) => {
                  const { manuName, qty, unit, total, modsTotal, styleName, thumb, thumbTitle } = computeItemView(it)
                  const title = it.name || it.description || it.item || '-'
                  return (
                    <div key={idx} className="d-flex p-2 border rounded align-items-center" style={{ gap: 12 }}>
                      <div>
                        {thumb ? (
                          <img
                            src={thumb}
                            alt={styleName || manuName}
                            title={thumbTitle}
                            style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6 }}
                            onClick={() => setPreviewImg(thumb)}
                          />
                        ) : (
                          <div className="bg-light d-flex align-items-center justify-content-center" style={{ width: 48, height: 48, borderRadius: 6 }}>–</div>
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
                                <div key={`mod-m-${idx}-${i}`}>• {label}{details ? ` — ${details}` : ''}</div>
                              )
                            })}
                          </div>
                        )}
                        <div className="text-muted" style={{ fontSize: 12 }}>
                          {t('orders.details.modifications', 'Modifications')}: {currency(modsTotal)}
                        </div>
                        {(it.hingeSide || it.exposedSide) && (
                          <div className="text-muted" style={{ fontSize: 12 }}>
                            {it.hingeSide && (
                              <span className="badge bg-primary me-2">{t('orders.details.hingeSide', 'Hinge Side')}: {it.hingeSide}</span>
                            )}
                            {it.exposedSide && (
                              <span className="badge bg-primary">{t('orders.details.exposedSide', 'Exposed Side')}: {it.exposedSide}</span>
                            )}
                          </div>
                        )}
                        <div className="d-flex justify-content-between mt-1" style={{ fontSize: 14 }}>
                          <div>
                            {t('orders.details.qty', 'Qty')}: <strong>{qty}</strong>
                          </div>
                          <div>
                            {t('orders.details.unitPrice', 'Unit Price')}: <strong>{currency(unit)}</strong>
                          </div>
                          <div>
                            {t('orders.details.total', 'Total')}: <strong>{currency(total)}</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </CCardBody>
      </CCard>

      {/* Manufacturers Breakdown */}
      <CCard>
    <CCardHeader>{t('orders.details.manufacturers', 'Manufacturers')}</CCardHeader>
        <CCardBody>
          {parsed.manufacturers.length === 0 ? (
      <div className="text-muted">{t('orders.details.noManufacturers', 'No manufacturers found')}</div>
          ) : (
            <CRow className="g-3">
              {parsed.manufacturers.map((m, i) => (
                <CCol md={6} key={i}>
                  <CCard>
                    <CCardHeader>
            {m.manufacturerName || m.name || `${t('orders.common.manufacturer', 'Manufacturer')} ${i + 1}`}
                    </CCardHeader>
                    <CCardBody>
                      {/* Style (name + picture) from snapshot */}
                      {m?.styleName || m?.style || m?.styleImage ? (
                        <div className="d-flex align-items-center mb-3" style={{ gap: 12 }}>
                          {m.styleImage && (
                            <CCardImage src={m.styleImage} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 6, cursor: 'pointer' }} onClick={() => setPreviewImg(m.styleImage)} />
                          )}
                          <div>
                            <div className="text-muted" style={{ fontSize: 12 }}>{t('orders.details.selectedStyle', 'Selected Style')}</div>
                            <div><strong>{m.styleName || m.style}</strong></div>
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
              <div className="mb-2"><strong>{t('orders.details.styleTotal', 'Style Total')}:</strong> {currency(itemsSubtotal)}</div>
              <div className="mb-2"><strong>{t('orders.details.assemblyFee', 'Assembly Fee')}:</strong> {currency(assembly)}</div>
              <div className="mb-2"><strong>{t('orders.details.modifications', 'Modifications')}:</strong> {currency(modifications)}</div>
              <div className="mb-2"><strong>{t('orders.details.deliveryFee', 'Delivery Fee')}:</strong> {currency(deliveryFee)}</div>
              <div className="mb-2"><strong>{t('orders.details.discount', 'Discount')}:</strong> {currency(discountAmount)}</div>
              <div className="mb-2"><strong>{t('orders.details.tax', 'Tax')}:</strong> {currency(taxAmount)}</div>
              <div className="mb-2"><strong>{t('orders.details.grandTotal', 'Grand Total')}:</strong> {currency(grandTotal)}</div>
                          </>
                        )
                      })()}
                    </CCardBody>
                  </CCard>
                </CCol>
              ))}
            </CRow>
          )}
        </CCardBody>
      </CCard>

      {/* Preview Modal */}
      <CModal
        visible={!!previewImg}
        onClose={() => setPreviewImg(null)}
        alignment="center"
        backdrop={true}
        keyboard={true}
        size="lg"
      >
        <CModalHeader
          className="modal-header-custom"
          style={{
            backgroundColor: `${backgroundColor} !important`,
            color: `${textColor} !important`,
            borderBottom: `1px solid ${textColor === '#ffffff' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(45, 55, 72, 0.2)'}`,
            background: `${backgroundColor} !important`
          }}
        >
          <CModalTitle
            style={{
              color: `${textColor} !important`,
              fontWeight: 'bold'
            }}
          >
            {t('orders.details.preview', 'Preview')}
          </CModalTitle>
        </CModalHeader>
        <CModalBody className="p-0 text-center">
          {previewImg && (
            <img
              src={previewImg}
              alt={t('orders.details.preview', 'Preview')}
              style={{ width: '100%', height: 'auto', maxHeight: '80vh', objectFit: 'contain' }}
              onClick={() => setPreviewImg(null)}
              role="button"
            />
          )}
        </CModalBody>
      </CModal>
    </CContainer>
  )
}

export default OrderDetails
