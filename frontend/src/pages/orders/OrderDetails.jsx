import React, { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import axiosInstance from '../../helpers/axiosInstance'
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

const parseManufacturersData = (raw) => {
  if (!raw) return { manufacturers: [], items: [], summary: { grandTotal: 0 } }
  try {
    const arr = typeof raw === 'string' ? JSON.parse(raw) : raw
    const items = []
    const summary = { grandTotal: 0, taxAmount: 0, discountAmount: 0, assemblyFee: 0, cabinets: 0, modificationsCost: 0, styleTotal: 0 }
    for (const m of arr) {
      if (Array.isArray(m.items)) items.push(...m.items)
      if (m.summary) {
        summary.grandTotal += m.summary.grandTotal || 0
        summary.taxAmount += m.summary.taxAmount || 0
        summary.discountAmount += m.summary.discountAmount || 0
        summary.assemblyFee += m.summary.assemblyFee || 0
        summary.cabinets += m.summary.cabinets || 0
        summary.modificationsCost += m.summary.modificationsCost || 0
        summary.styleTotal += m.summary.styleTotal || 0
      }
    }
    return { manufacturers: arr, items, summary }
  } catch (e) {
    console.error('Failed to parse manufacturersData', e)
    return { manufacturers: [], items: [], summary: { grandTotal: 0 } }
  }
}

const OrderDetails = () => {
  const { t } = useTranslation()
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const customization = useSelector((state) => state.customization)
  const { list: manuList, byId: manuById } = useSelector((state) => state.manufacturers)
  const dispatch = useDispatch()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [proposal, setProposal] = useState(null)
  const [manufacturerNames, setManufacturerNames] = useState({})
  const [stylesByManu, setStylesByManu] = useState({})
  const [typesByManu, setTypesByManu] = useState({})
  const [manufacturerCosts, setManufacturerCosts] = useState({})
  const [userMultiplier, setUserMultiplier] = useState(1)
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
    const run = async () => {
      try {
        setLoading(true)
        const { data } = await axiosInstance.get(`/api/quotes/proposalByID/${id}`)
        setProposal(data)
        setError(null)
      } catch (e) {
        setError(e.response?.data?.message || e.message)
      } finally {
        setLoading(false)
      }
    }
    if (id) run()
  }, [id])

  // Fetch current user's group multiplier (used for display when totals aren't saved)
  useEffect(() => {
    let cancelled = false
    const fetchMultiplier = async () => {
      try {
        const { data } = await axiosInstance.get('/api/user/multiplier')
        if (!cancelled && typeof data?.multiplier === 'number') {
          setUserMultiplier(Number(data.multiplier) || 1)
        }
      } catch (_) {
        // default 1
      }
    }
    fetchMultiplier()
    return () => { cancelled = true }
  }, [])

  const parsed = useMemo(() => parseManufacturersData(proposal?.manufacturersData), [proposal])

  // Helper to compute display fields for an item (used by table and mobile views)
  const computeItemView = (it) => {
    const manuId = it.manufacturer || it.manufacturerId || parsed.manufacturers?.[0]?.manufacturer
    // Prefer fetched names; then inline manufacturerName; then avoid generic placeholders
    let manuName = manufacturerNames[manuId] || it.manufacturerName || null
    if (!manuName && (manuById?.[manuId]?.name || manuList?.find?.((m) => m.id === manuId)?.name)) {
      manuName = manuById?.[manuId]?.name || manuList.find((m) => m.id === manuId)?.name
    }
    if (!manuName) {
      const inline = parsed.manufacturers?.find?.((m) => m.manufacturer === manuId)?.name
      if (inline && !/^manufacturer\s*\d+$/i.test(String(inline).trim())) manuName = inline
    }
    if (!manuName) manuName = '-'
    const qty = Number(it.qty || it.quantity || 1)

    // Derive unit/total using multipliers for display
    const manuIdNum = Number(manuId)
    const manuM = Number(manufacturerCosts[manuIdNum] || manufacturerCosts[manuId] || 1)
    const groupM = Number(userMultiplier || 1)
    const base = Number(it.basePrice ?? it.price ?? it.unitPrice ?? 0)
    const unit = base * manuM * groupM
    const total = unit * qty

    // Per-item modifications total (not multiplied by manufacturer/user multipliers)
    const modsTotal = Array.isArray(it.modifications)
      ? it.modifications.reduce((s, m) => s + (Number(m.price || 0) * Number(m.qty || 1)), 0)
      : 0

    // Derive style name/image
    let styleName = '-'
    let styleImg = null
    try {
      const block = (parsed.manufacturers || []).find((m) => m.manufacturer === manuId)
      const selectedStyleIdOrName = block?.selectedStyle
      const styles = stylesByManu[manuId]
      if (Array.isArray(styles)) {
        let sf = typeof selectedStyleIdOrName === 'number'
          ? styles.find((s) => s.id === selectedStyleIdOrName)
          : null
        if (!sf && selectedStyleIdOrName && typeof selectedStyleIdOrName === 'string') {
          sf = styles.find((s) => String(s.style).toLowerCase() === selectedStyleIdOrName.toLowerCase()) || null
        }
        if (!sf) {
          const nm = block?.styleName || block?.style || block?.selectedStyleName
          if (nm) sf = styles.find((s) => String(s.style).toLowerCase() === String(nm).toLowerCase()) || null
        }
        if (sf?.style) styleName = sf.style
        // Resolve image similarly as top card
        let resolved = null
        if (sf) {
          if (sf.image) {
            resolved = sf.image
          } else if (Array.isArray(sf.styleVariants) && sf.styleVariants.length) {
            const selectedColor = block?.styleColor || block?.selectedStyleColor || block?.styleVariant || block?.colorName || block?.color
            const vm = selectedColor
              ? sf.styleVariants.find(v => (v.shortName || '').toLowerCase() === String(selectedColor).toLowerCase())
              : null
            resolved = (vm?.image) || sf.styleVariants[0]?.image || null
          }
        }
        if (resolved) {
          styleImg = String(resolved).startsWith('/')
            ? `${import.meta.env.VITE_API_URL || ''}${resolved}`
            : `${import.meta.env.VITE_API_URL || ''}/uploads/images/${resolved}`
        }
      }
    } catch (_) {}

    // Try to find type image (with details) and fall back to style image
    let thumb = null
    let thumbTitle = ''
    try {
      const types = typesByManu[manuId]
      const candidates = [it.type, it.typeName, it.itemType, it.code].filter(Boolean).map(String)
      if (Array.isArray(types) && types.length) {
        let match = null
        if (candidates.length) {
          const lcSet = new Set(candidates.map((s) => s.toLowerCase()))
          match = types.find((t) => [t.type, t.name, t.shortName, t.code].filter(Boolean).some(v => lcSet.has(String(v).toLowerCase()))) || null
        }
        if (!match) {
          const text = `${it.name || ''} ${it.description || ''}`.toLowerCase()
          match = types.find((t) => {
            const keys = [t.type, t.name, t.shortName, t.code].filter(Boolean).map((x) => String(x).toLowerCase())
            return keys.some((k) => k && text.includes(k))
          }) || null
        }
        const img = match?.image
        if (img) {
          thumb = String(img).startsWith('/')
            ? `${import.meta.env.VITE_API_URL || ''}${img}`
            : `${import.meta.env.VITE_API_URL || ''}/uploads/types/${img}`
          const tname = match?.type || match?.name || ''
          const sname = match?.shortName ? ` (${match.shortName})` : ''
          const desc = match?.longDescription || match?.description || ''
          thumbTitle = [`${tname}${sname}`.trim(), desc ? `— ${desc}` : ''].join(' ').trim()
        }
      }
    } catch (_) {}
    if (!thumb) {
      thumb = styleImg
      thumbTitle = (styleName && manuName) ? `${styleName} — ${manuName}` : (styleName || manuName || '')
    }

  return { manuName, qty, unit, total, modsTotal, styleName, styleImg, thumb, thumbTitle }
  }

  // Compute display totals applying manufacturer cost multiplier and user group multiplier
  const displaySummary = useMemo(() => {
    try {
      const manufacturers = Array.isArray(parsed.manufacturers) ? parsed.manufacturers : []
      let agg = {
        styleTotal: 0,
        assemblyFee: 0,
        modificationsCost: 0,
        deliveryFee: 0,
        discountAmount: 0,
        taxAmount: 0,
        grandTotal: 0,
      }
      for (const m of manufacturers) {
        const manuId = m.manufacturer
        const manuM = Number(manufacturerCosts[manuId] || 1)
        const groupM = Number(userMultiplier || 1)
        const items = Array.isArray(m.items) ? m.items : []
        const itemsSubtotal = items.reduce((sum, it) => {
          const qty = Number(it.qty || it.quantity || 1)
          const base = Number(it.basePrice ?? it.price ?? it.unitPrice ?? 0)
          const unit = base * manuM * groupM
          return sum + unit * qty
        }, 0)
        const assembly = Number(m?.summary?.assemblyFee || 0)
        const modifications = Number(m?.summary?.modificationsCost || 0)
        const deliveryFee = Number(m?.summary?.deliveryFee || 0)
        const preDiscount = itemsSubtotal + assembly + modifications + deliveryFee
        const discountPercent = Number(m?.summary?.discountPercent || 0)
        const discountAmount = (preDiscount * discountPercent) / 100
        const afterDiscount = preDiscount - discountAmount
        const taxRate = Number(m?.summary?.taxRate || 0)
        const taxAmount = (afterDiscount * taxRate) / 100
        const grandTotal = afterDiscount + taxAmount

  // Style total reflects items subtotal only (no assembly/mods)
  agg.styleTotal += itemsSubtotal
        agg.assemblyFee += assembly
        agg.modificationsCost += modifications
        agg.deliveryFee += deliveryFee
        agg.discountAmount += discountAmount
        agg.taxAmount += taxAmount
        agg.grandTotal += grandTotal
      }
      return agg
    } catch (_) {
      return parsed.summary || { grandTotal: 0 }
    }
  }, [parsed.manufacturers, manufacturerCosts, userMultiplier])

  // Fetch manufacturer names, styles meta, and types meta for the manufacturers present in this proposal
  useEffect(() => {
    const loadMeta = async () => {
      try {
        const uniqManuIds = Array.from(
          new Set(
            (parsed.manufacturers || [])
              .map((m) => m.manufacturer)
              .filter((id) => typeof id === 'number' || typeof id === 'string')
          )
        )
        if (!uniqManuIds.length) return

  const nameMap = { ...manufacturerNames }
        const stylesMap = { ...stylesByManu }
        const typesMap = { ...typesByManu }
        const costsMap = { ...manufacturerCosts }
        for (const id of uniqManuIds) {
          // Fetch manufacturer basic info (name)
      if (!nameMap[id]) {
            try {
              const { data } = await axiosInstance.get(`/api/manufacturers/${id}`)
              const name = data?.manufacturer?.name || data?.name
        if (name && !/^manufacturer\s*\d+$/i.test(String(name).trim())) nameMap[id] = name
              const cost = data?.manufacturer?.costMultiplier ?? data?.costMultiplier
              if (cost && !costsMap[id]) costsMap[id] = Number(cost) || 1
            } catch (_) {
              // ignore
            }
          }
          // Fetch styles meta (to get style names and images)
          if (!stylesMap[id]) {
            try {
              const { data } = await axiosInstance.get(`/api/manufacturers/${id}/styles-meta`)
              if (data && Array.isArray(data.styles)) stylesMap[id] = data.styles
              if (data && data.manufacturerCostMultiplier && !costsMap[id]) {
                costsMap[id] = Number(data.manufacturerCostMultiplier) || 1
              }
            } catch (_) {
              // ignore
            }
          }
          // Fetch types meta (to get type thumbnails)
          if (!typesMap[id]) {
            try {
              const { data } = await axiosInstance.get(`/api/manufacturers/${id}/types-meta`)
              if (data && Array.isArray(data)) typesMap[id] = data
              // Some APIs may return { types: [...] }
              else if (data && Array.isArray(data.types)) typesMap[id] = data.types
            } catch (_) {
              // ignore
            }
          }
        }
        setManufacturerNames(nameMap)
        setStylesByManu(stylesMap)
        setTypesByManu(typesMap)
  setManufacturerCosts(costsMap)
      } catch (_) {
        // no-op
      }
    }
    if (parsed?.manufacturers?.length) {
      loadMeta()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsed?.manufacturers?.length])

  // Ensure manufacturer list is loaded for fallbacks
  useEffect(() => {
    // lazy import to avoid circular
    import('../../store/slices/manufacturersSlice').then(({ fetchManufacturers }) => {
      if (!manuList || manuList.length === 0) {
        dispatch(fetchManufacturers())
      }
    })
  }, [dispatch])

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
        subtitle={proposal?.customer?.name ? `${t('orders.details.customerLabel', 'Customer')}: ${proposal.customer.name}` : t('orders.details.subtitle', 'Accepted order overview')}
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
                  const manuName = manufacturerNames[m.manufacturer] || m.name || t('orders.common.manufacturer', 'Manufacturer')
                  const styles = stylesByManu[m.manufacturer]
                  let found = Array.isArray(styles) ? styles.find((s) => s.id === m.selectedStyle) : null
                  if (!found && Array.isArray(styles)) {
                    const styleNameFromProposal = m?.styleName || m?.style || m?.selectedStyleName || (typeof m?.selectedStyle === 'string' ? m.selectedStyle : null)
                    if (styleNameFromProposal) {
                      found = styles.find((s) => String(s.style).toLowerCase() === String(styleNameFromProposal).toLowerCase()) || null
                    }
                  }
                  // Try multiple ways to resolve the style image:
                  // 1) Direct image on the style payload
                  // 2) Match a style variant image by selected color/variant name
                  // 3) Fallback to the first available variant image
                  let resolvedImg = null
                  if (found) {
                    if (found.image) {
                      resolvedImg = found.image
                    } else if (Array.isArray(found.styleVariants) && found.styleVariants.length) {
                      const selectedColor = m?.styleColor || m?.selectedStyleColor || m?.styleVariant || m?.colorName || m?.color
                      const match = selectedColor
                        ? found.styleVariants.find(v => (v.shortName || '').toLowerCase() === String(selectedColor).toLowerCase())
                        : null
                      resolvedImg = (match?.image) || found.styleVariants[0]?.image || null
                    }
                  }
                  const imgUrl = resolvedImg
                    ? (String(resolvedImg).startsWith('/')
                        ? `${import.meta.env.VITE_API_URL || ''}${resolvedImg}`
                        : `${import.meta.env.VITE_API_URL || ''}/uploads/images/${resolvedImg}`)
                    : null
                  return (
                    <>
                      {imgUrl && (
                        <img src={imgUrl} alt={found?.style || t('common.style', 'Style')} style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, cursor: 'pointer' }} onClick={() => setPreviewImg(imgUrl)} />
                      )}
                      <div>
                        <div className="mb-1"><strong>{t('orders.common.manufacturer', 'Manufacturer')}:</strong> {manuName}</div>
                        <div className="mb-0"><strong>{t('orders.details.styleColor', 'Style (Color)')}:</strong> {found?.style || t('common.na')}</div>
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
              <div className="mb-2"><strong>{t('orders.details.id', 'ID')}:</strong> {proposal?.id}</div>
              <div className="mb-2"><strong>{t('orders.details.date', 'Date')}:</strong> {new Date(proposal?.date || proposal?.createdAt).toLocaleDateString()}</div>
              <div className="mb-2"><strong>{t('orders.details.status', 'Status')}:</strong> <CBadge color="success">{proposal?.status || 'accepted'}</CBadge></div>
              <div className="mb-2"><strong>{t('orders.details.acceptedAt', 'Accepted at')}:</strong> {proposal?.accepted_at ? new Date(proposal.accepted_at).toLocaleString() : t('common.na')}</div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol md={4}>
          <CCard>
            <CCardHeader>{t('orders.details.customer', 'Customer')}</CCardHeader>
            <CCardBody>
              <div className="mb-2"><strong>{t('orders.details.name', 'Name')}:</strong> {proposal?.customer?.name || t('common.na')}</div>
              <div className="mb-2"><strong>{t('orders.details.email', 'Email')}:</strong> {proposal?.customer?.email || t('common.na')}</div>
              <div className="mb-2"><strong>{t('orders.details.phone', 'Phone')}:</strong> {proposal?.customer?.mobile || proposal?.customer?.phone || t('common.na')}</div>
              <div className="mb-2"><strong>{t('orders.details.address', 'Address')}:</strong> {proposal?.customer?.address || t('common.na')}</div>
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
            <CTable hover>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>{t('orders.details.specs', 'Specs')}</CTableHeaderCell>
                  <CTableHeaderCell>{t('orders.common.manufacturer', 'Manufacturer')}</CTableHeaderCell>
                  <CTableHeaderCell>{t('common.style', 'Style')}</CTableHeaderCell>
                  <CTableHeaderCell>{t('orders.details.item', 'Item')}</CTableHeaderCell>
                  <CTableHeaderCell className="text-end">{t('orders.details.qty', 'Qty')}</CTableHeaderCell>
                  <CTableHeaderCell className="text-end">{t('orders.details.unitPrice', 'Unit Price')}</CTableHeaderCell>
                  <CTableHeaderCell className="text-end">{t('orders.details.modifications', 'Modifications')}</CTableHeaderCell>
                  <CTableHeaderCell className="text-end">{t('orders.details.total', 'Total')}</CTableHeaderCell>
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
                        <CTableDataCell>{manuName}</CTableDataCell>
                        <CTableDataCell>{styleName}</CTableDataCell>
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
                        <CTableDataCell className="text-end">{qty}</CTableDataCell>
                        <CTableDataCell className="text-end">{currency(unit)}</CTableDataCell>
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
                          {t('orders.common.manufacturer', 'Manufacturer')}: {manuName}
                          {styleName ? ` • ${t('common.style', 'Style')}: ${styleName}` : ''}
                        </div>
                        <div className="text-muted" style={{ fontSize: 12 }}>
                          {t('orders.details.modifications', 'Modifications')}: {currency(modsTotal)}
                        </div>
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
            {manufacturerNames[m.manufacturer] || m.name || `${t('orders.common.manufacturer', 'Manufacturer')} ${i + 1}`}
                    </CCardHeader>
                    <CCardBody>
                      {/* Style meta (name + picture) */}
                      {(() => {
                        try {
                          const styles = stylesByManu[m.manufacturer]
                          let found = Array.isArray(styles)
                            ? styles.find((s) => s.id === m.selectedStyle)
                            : null
                          if (!found && Array.isArray(styles)) {
                            const styleNameFromProposal = m?.styleName || m?.style || m?.selectedStyleName || (typeof m?.selectedStyle === 'string' ? m.selectedStyle : null)
                            if (styleNameFromProposal) {
                              found = styles.find((s) => String(s.style).toLowerCase() === String(styleNameFromProposal).toLowerCase()) || null
                            }
                          }
                          if (!found) return null
                          // Resolve image from style or its variants
                          let resolved = null
                          if (found.image) {
                            resolved = found.image
                          } else if (Array.isArray(found.styleVariants) && found.styleVariants.length) {
                            const selectedColor = m?.styleColor || m?.selectedStyleColor || m?.styleVariant || m?.colorName || m?.color
                            const vm = selectedColor
                              ? found.styleVariants.find(v => (v.shortName || '').toLowerCase() === String(selectedColor).toLowerCase())
                              : null
                            resolved = (vm?.image) || found.styleVariants[0]?.image || null
                          }
                          const imgUrl = resolved
                            ? (String(resolved).startsWith('/')
                                ? `${import.meta.env.VITE_API_URL || ''}${resolved}`
                                : `${import.meta.env.VITE_API_URL || ''}/uploads/images/${resolved}`)
                            : null
                          return (
                            <div className="d-flex align-items-center mb-3" style={{ gap: 12 }}>
                              {imgUrl && (
                                <CCardImage src={imgUrl} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 6, cursor: 'pointer' }} onClick={() => setPreviewImg(imgUrl)} />
                              )}
                              <div>
                <div className="text-muted" style={{ fontSize: 12 }}>{t('orders.details.selectedStyle', 'Selected Style')}</div>
                                <div><strong>{found.style}</strong></div>
                              </div>
                            </div>
                          )
                        } catch (_) {
                          return null
                        }
                      })()}
                      {(() => {
                        // Per-manufacturer computed totals
                        const manuId = m.manufacturer
                        const manuM = Number(manufacturerCosts[manuId] || 1)
                        const groupM = Number(userMultiplier || 1)
                        const items = Array.isArray(m.items) ? m.items : []
                        const itemsSubtotal = items.reduce((sum, it) => {
                          const qty = Number(it.qty || it.quantity || 1)
                          const base = Number(it.basePrice ?? it.price ?? it.unitPrice ?? 0)
                          const unit = base * manuM * groupM
                          return sum + unit * qty
                        }, 0)
                        const assembly = Number(m?.summary?.assemblyFee || 0)
                        const modifications = Number(m?.summary?.modificationsCost || 0)
                        const deliveryFee = Number(m?.summary?.deliveryFee || 0)
                        const preDiscount = itemsSubtotal + assembly + modifications + deliveryFee
                        const discountPercent = Number(m?.summary?.discountPercent || 0)
                        const discountAmount = (preDiscount * discountPercent) / 100
                        const afterDiscount = preDiscount - discountAmount
                        const taxRate = Number(m?.summary?.taxRate || 0)
                        const taxAmount = (afterDiscount * taxRate) / 100
                        const grandTotal = afterDiscount + taxAmount
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
