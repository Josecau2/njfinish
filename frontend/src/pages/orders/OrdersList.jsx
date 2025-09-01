import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import {
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCol,
  CContainer,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilSearch } from '@coreui/icons'
import PageHeader from '../../components/PageHeader'
import { FaShoppingCart } from 'react-icons/fa'
import PaginationComponent from '../../components/common/PaginationComponent'
import { getOrders } from '../../store/slices/proposalSlice'
import { fetchManufacturers, fetchManufacturerById } from '../../store/slices/manufacturersSlice'
import { useNavigate } from 'react-router-dom'

const OrdersList = ({ title, subtitle, groupId = null, isContractor = false, mineOnly = false }) => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { data, loading } = useSelector((s) => s.proposal)
  const { list: manuList, byId: manuById } = useSelector((s) => s.manufacturers)
  const authUser = useSelector((s) => s.auth?.user)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const perPage = 10
  const navigate = useNavigate()

  // Resolve manufacturer name from manufacturersData; tolerate type mismatches and various shapes
  const resolveManuName = (item) => {
    try {
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
        const manuIdRaw = parsed.manufacturer ?? parsed.manufacturerId ?? parsed.manufacturer_id ?? parsed.id
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
      if (embeddedWithName) return embeddedWithName.manufacturerData?.name || embeddedWithName.manufacturer?.name

      // 2) Determine manufacturer id from first block (support multiple keys)
      const first = arr[0]
      const manuIdRaw = first?.manufacturer ?? first?.manufacturerId ?? first?.manufacturer_id ?? first?.id
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
    dispatch(getOrders({ groupId, mineOnly }))
  }, [dispatch, groupId, mineOnly])

  // Warm up manufacturers cache for name resolution
  useEffect(() => {
    if (!manuList || manuList.length === 0) {
      dispatch(fetchManufacturers())
    }
  }, [dispatch, manuList?.length])

  // Proactively fetch missing manufacturer records by ID (covers contractors who don't receive disabled manufacturers in list)
  useEffect(() => {
    try {
      const list = Array.isArray(data) ? data : []
      const missing = new Set()
      for (const p of list) {
        const raw = p?.manufacturersData
        if (!raw) continue
        let parsed = raw
        if (typeof raw === 'string') {
          try { parsed = JSON.parse(raw) } catch { parsed = [] }
        }
        // Handle object-shaped data (single manufacturer)
        if (parsed && !Array.isArray(parsed) && typeof parsed === 'object') {
          const idRaw = parsed.manufacturer ?? parsed.manufacturerId ?? parsed.manufacturer_id ?? parsed.id
          const idNum = idRaw != null && idRaw !== '' ? Number(idRaw) : null
          if (idNum != null && !Number.isNaN(idNum)) {
            if (!manuById?.[idNum] && !manuList?.some?.((m) => Number(m?.id) === idNum)) {
              missing.add(idNum)
            }
          }
          continue
        }
        const arr = Array.isArray(parsed) ? parsed : []
        for (const b of arr) {
          const idRaw = b?.manufacturer ?? b?.manufacturerId ?? b?.manufacturer_id ?? b?.id
          const idNum = idRaw != null && idRaw !== '' ? Number(idRaw) : null
          if (idNum != null && !Number.isNaN(idNum)) {
            if (!manuById?.[idNum] && !manuList?.some?.((m) => Number(m?.id) === idNum)) {
              missing.add(idNum)
            }
          }
        }
      }
      // Fetch each missing manufacturer with a lightweight request
      for (const id of missing) {
        dispatch(fetchManufacturerById({ id, includeCatalog: false }))
      }
    } catch (_) {
      // noop
    }
    // We intentionally omit manuList length to avoid refetch loops; byId will update when fetches resolve
  }, [data, manuById, dispatch])

  const filtered = useMemo(() => {
    const list = Array.isArray(data) ? data : []
    const isAcceptedStatus = (s) => {
      if (!s) return false
      const lower = String(s).toLowerCase()
      return lower === 'accepted' || s === 'Proposal accepted'
    }
    const term = (search || '').toLowerCase()
    const base = list
      .filter((p) => isAcceptedStatus(p.status))
      .filter((p) => {
        if (!term) return true
        const customerName = (p.customer?.name || '').toLowerCase()
        if (customerName.includes(term)) return true
        if (!isContractor) {
          const contractor = (p?.ownerGroup?.name || p?.Owner?.group?.name || p?.Owner?.name || '').toLowerCase()
          if (contractor.includes(term)) return true
        }
        return false
      })
    if (mineOnly) {
      const currentUserId = authUser?.userId ?? authUser?.id
      return base.filter((p) => String(p.created_by_user_id) === String(currentUserId))
    }
    return base
  }, [data, search])

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

  const openDetails = (orderId) => {
    const base = isContractor ? '/my-orders' : '/orders'
    navigate(`${base}/${orderId}`)
  }

  const renderCustomerCell = (item) => {
    // For admins: show contractor (group or owner) on top, end-customer below
    if (!isContractor) {
      const contractor = item?.Owner?.name || item?.ownerGroup?.name || item?.Owner?.group?.name || t('common.na')
      const endUser = item?.customer?.name || t('common.na')
      return (
        <div>
          <div className="fw-semibold">{contractor}</div>
          <div className="text-muted" style={{ fontSize: 12 }}>{endUser}</div>
        </div>
      )
    }
    // Contractors just see their end-customer
    return item?.customer?.name || t('common.na')
  }

  return (
    <CContainer fluid>
      <PageHeader title={title} subtitle={subtitle} icon={FaShoppingCart} />

      <CCard className="filter-card">
        <CCardBody>
          <CRow className="align-items-center g-3">
            <CCol md={8}>
              <CInputGroup>
                <CInputGroupText>
                  <CIcon icon={cilSearch} />
                </CInputGroupText>
                <CFormInput
                  placeholder={t('orders.searchPlaceholder', 'Search by customer')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </CInputGroup>
            </CCol>
            <CCol md={4} className="text-md-end">
              <small className="text-muted">
                {t('orders.showingCount', { count: filtered.length, total: Array.isArray(data) ? data.length : 0 })}
              </small>
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      <CCard className="data-table-card">
        {/* Desktop / tablet table */}
        <div className="d-none d-md-block">
          <CTable hover>
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>{t('orders.headers.date', 'Date')}</CTableHeaderCell>
                <CTableHeaderCell>{t('orders.headers.customer', 'Customer')}</CTableHeaderCell>
                <CTableHeaderCell>{t('orders.headers.description', 'Description')}</CTableHeaderCell>
                <CTableHeaderCell>{t('orders.headers.manufacturer', 'Manufacturer')}</CTableHeaderCell>
                <CTableHeaderCell>{t('orders.headers.status', 'Status')}</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {paged.length === 0 ? (
                <CTableRow>
                  <CTableDataCell colSpan={5} className="text-center py-5">
                    <CIcon icon={cilSearch} size="3xl" className="text-muted mb-3" />
                    <p className="mb-0">{t('orders.empty.title', 'No orders found')}</p>
                    <small className="text-muted">{t('orders.empty.subtitle', 'Accepted & locked quotes will appear here')}</small>
                  </CTableDataCell>
                </CTableRow>
              ) : (
                paged.map((item) => (
                  <CTableRow key={item.id} onClick={() => openDetails(item.id)} style={{ cursor: 'pointer' }}>
                    <CTableDataCell>{new Date(item.date || item.createdAt).toLocaleDateString()}</CTableDataCell>
                    <CTableDataCell>{renderCustomerCell(item)}</CTableDataCell>
                    <CTableDataCell className="text-muted">{item.description || t('common.na')}</CTableDataCell>
                    <CTableDataCell>{resolveManuName(item)}</CTableDataCell>
                    <CTableDataCell>
                      <CBadge color={statusColor(item.status || 'accepted')} shape="rounded-pill">
                        {item.status || 'accepted'}
                      </CBadge>
                    </CTableDataCell>
                  </CTableRow>
                ))
              )}
            </CTableBody>
          </CTable>
        </div>

        {/* Mobile card list */}
        <div className="d-block d-md-none">
          {paged.length === 0 ? (
            <div className="text-center py-5">
              <CIcon icon={cilSearch} size="3xl" className="text-muted mb-3" />
              <p className="mb-0">{t('orders.empty.title', 'No orders found')}</p>
              <small className="text-muted">{t('orders.empty.subtitle', 'Accepted & locked quotes will appear here')}</small>
            </div>
          ) : (
            <div className="d-flex flex-column gap-2">
              {paged.map((item) => (
                <div
                  key={item.id}
                  className="border rounded p-2 d-flex align-items-start"
                  style={{ gap: 12, cursor: 'pointer' }}
                  onClick={() => openDetails(item.id)}
                >
                  <div className="flex-grow-1">
                    <div className="d-flex justify-content-between align-items-start">
                      <div style={{ fontSize: 16 }}>
                        {isContractor ? (
                          <span className="fw-semibold">{item.customer?.name || t('common.na')}</span>
                        ) : (
                          <div className="d-flex flex-column">
                            <span className="fw-semibold">{item?.Owner?.group?.name || item?.ownerGroup?.name || item?.Owner?.name || t('common.na')}</span>
                            <small className="text-muted" style={{ fontSize: 12 }}>{item?.customer?.name || t('common.na')}</small>
                          </div>
                        )}
                      </div>
                      <CBadge color={statusColor(item.status || 'accepted')} shape="rounded-pill">
                        {item.status || 'accepted'}
                      </CBadge>
                    </div>
                    <div className="text-muted" style={{ fontSize: 12 }}>
                      {new Date(item.date || item.createdAt).toLocaleDateString()} • {t('orders.headers.manufacturer', 'Manufacturer')}: {resolveManuName(item)}
                    </div>
                    <div className="text-truncate-2 mt-1" style={{ fontSize: 14, color: '#444' }}>
                      {item.description || t('common.na')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CCard>

      <CCard className="data-table-card mt-4">
        <CCardBody>
          <PaginationComponent
            currentPage={page}
            totalPages={Math.ceil(filtered.length / perPage) || 1}
            onPageChange={setPage}
            itemsPerPage={perPage}
          />
        </CCardBody>
      </CCard>
    </CContainer>
  )
}

export default OrdersList
