import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import {
  CBadge,
  CButton,
  CContainer,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilSearch, cilCreditCard, cilCloudDownload } from '@coreui/icons'
import PageHeader from '../../components/PageHeader'
import { FaShoppingCart } from 'react-icons/fa'
import PaginationComponent from '../../components/common/PaginationComponent'
import PrintPaymentReceiptModal from '../../components/model/PrintPaymentReceiptModal'
import { fetchOrders } from '../../store/slices/ordersSlice'
import { fetchManufacturers, fetchManufacturerById } from '../../store/slices/manufacturersSlice'
import { fetchPayments } from '../../store/slices/paymentsSlice'
import { useNavigate } from 'react-router-dom'

const OrdersList = ({ title, subtitle, groupId = null, isContractor = false, mineOnly = false }) => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { items: orders, loading } = useSelector((s) => s.orders)
  const { list: manuList, byId: manuById } = useSelector((s) => s.manufacturers)
  const { payments } = useSelector((s) => s.payments)
  const authUser = useSelector((s) => s.auth?.user)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const perPage = 10
  const navigate = useNavigate()

  // Receipt modal state
  const [receiptModalVisible, setReceiptModalVisible] = useState(false)
  const [selectedOrderForReceipt, setSelectedOrderForReceipt] = useState(null)
  const [selectedPaymentForReceipt, setSelectedPaymentForReceipt] = useState(null)

  // Resolve manufacturer name from order snapshot first; fall back to legacy manufacturersData if present
  const resolveManuName = (item) => {
    try {
      // NEW: First try the manufacturer association from enhanced API
      if (item?.manufacturer?.name) {
        return item.manufacturer.name;
      }

      // Second, try to resolve manufacturer ID from snapshot to actual manufacturer name
      const snap = item?.snapshot;
      if (snap) {
        // Parse snapshot if it's a string
        const parsedSnap = typeof snap === 'string' ? JSON.parse(snap) : snap;

        if (parsedSnap?.manufacturers?.[0]?.manufacturer) {
          const manuId = parsedSnap.manufacturers[0].manufacturer;
          // Try to find manufacturer name from Redux store by ID
          const fromMap = manuById?.[manuId] || manuById?.[String(manuId)];
          if (fromMap?.name) return fromMap.name;

          const fromList = manuList?.find?.((m) => Number(m?.id) === Number(manuId));
          if (fromList?.name) return fromList.name;
        }

        // Fallback to manufacturerName in snapshot (but this might be incorrect as shown in the data)
        if (parsedSnap?.manufacturers?.[0]?.manufacturerName) {
          return parsedSnap.manufacturers[0].manufacturerName;
        }
      }

      // Prefer snapshot-based fields (order shape) - keeping existing logic as fallback
      if (snap) {
        const mArr = Array.isArray(snap.manufacturers) ? snap.manufacturers : (Array.isArray(snap) ? snap : [])
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
    const term = (search || '').toLowerCase()
    const base = list.filter((p) => {
      if (!term) return true

      // Enhanced customer name search with multiple fallbacks
      const customerName = (
        p.customer?.name ||
        p.proposal?.customerName ||
        p.customer_name ||
        ''
      ).toLowerCase()
      if (customerName.includes(term)) return true

      if (!isContractor) {
        const contractor = (p?.Owner?.name || p?.ownerGroup?.name || p?.Owner?.group?.name || '').toLowerCase()
        if (contractor.includes(term)) return true
      }
      return false
    })
    return base
  }, [orders, search])

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

  // Get payment status for an order
  const getOrderPayment = (orderId) => {
    return payments?.find(payment => payment.orderId === orderId)
  }

  // Get payment status badge info
  const getPaymentStatus = (orderId) => {
    const payment = getOrderPayment(orderId)

    if (!payment) {
      return {
        status: 'payment_required',
        label: t('payments.status.paymentRequired', 'Payment Required'),
        color: 'warning',
        showButton: true
      }
    }

    switch (payment.status) {
      case 'completed':
        return {
          status: 'paid',
          label: t('payments.status.paid', 'Paid'),
          color: 'success',
          showButton: false,
          paidAt: payment.paidAt
        }
      case 'pending':
        return {
          status: 'payment_required',
          label: t('payments.status.paymentRequired', 'Payment Required'),
          color: 'warning',
          showButton: true
        }
      case 'processing':
        return {
          status: 'processing',
          label: t('payments.status.processing', 'Processing'),
          color: 'info',
          showButton: false
        }
      case 'failed':
        return {
          status: 'payment_required',
          label: t('payments.status.paymentRequired', 'Payment Required'),
          color: 'danger',
          showButton: true
        }
      default:
        return {
          status: 'payment_required',
          label: t('payments.status.paymentRequired', 'Payment Required'),
          color: 'warning',
          showButton: true
        }
    }
  }

  const handleMakePayment = (orderId) => {
    const payment = getOrderPayment(orderId)
    if (payment) {
      navigate(`/payments/${payment.id}/pay`)
    } else {
      // If no payment exists, go to payments page to potentially create one
      navigate('/payments')
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

  const renderCustomerCell = (item) => {
    // Enhanced customer name resolution with multiple fallbacks
    const getCustomerName = () => {
      // Try direct customer association first
      if (item?.customer?.name) return item.customer.name;

      // Try proposal customerName
      if (item?.proposal?.customerName) return item.proposal.customerName;

      // Try customer_name field (legacy)
      if (item?.customer_name) return item.customer_name;

      return t('common.na');
    };

    // For admins: show contractor (group or owner) on top, end-customer below
    if (!isContractor) {
      const contractor = item?.Owner?.name || item?.ownerGroup?.name || item?.Owner?.group?.name || t('common.na')
      const endUser = getCustomerName();
      return (
        <div>
          <div className="fw-semibold">{contractor}</div>
          <div className="text-muted" style={{ fontSize: 12 }}>{endUser}</div>
        </div>
      )
    }
    // Contractors just see their end-customer
    return getCustomerName();
  }

  return (
    <CContainer fluid>
      <PageHeader title={title} subtitle={subtitle} icon={FaShoppingCart} />

      {/* Toolbar: search + count */}
      <div className="toolbar" role="search">
        <div className="toolbar__start" style={{ flex: 1 }}>
          <div className="search" style={{ maxWidth: 520 }}>
            <CIcon icon={cilSearch} className="search__icon" />
            <input
              type="search"
              className="search__input"
              placeholder={t('orders.searchPlaceholder', 'Search by customer')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label={t('orders.searchAria', 'Search orders by customer name')}
            />
          </div>
        </div>
        <div className="toolbar__end">
          <small className="text-muted">
            {t('orders.showingCount', { count: filtered.length, total: Array.isArray(orders) ? orders.length : 0 })}
          </small>
        </div>
      </div>

      {/* Desktop / tablet table */}
      <div className="u-desktop">
        <div className="table-scroll">
          <CTable hover className="table-modern">
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell className="sticky-col">{t('orders.headers.date', 'Date')}</CTableHeaderCell>
                <CTableHeaderCell>{t('orders.headers.customer', 'Customer')}</CTableHeaderCell>
                <CTableHeaderCell>{t('orders.headers.description', 'Description')}</CTableHeaderCell>
                <CTableHeaderCell>{t('orders.headers.manufacturer', 'Manufacturer')}</CTableHeaderCell>
                <CTableHeaderCell>{t('orders.headers.status', 'Status')}</CTableHeaderCell>
                <CTableHeaderCell>{t('orders.headers.payment', 'Payment')}</CTableHeaderCell>
                <CTableHeaderCell>{t('orders.headers.actions', 'Actions')}</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {paged.length === 0 ? (
                <CTableRow>
                  <CTableDataCell colSpan={7} className="text-center py-5">
                    <CIcon icon={cilSearch} size="3xl" className="text-muted mb-3" />
                    <p className="mb-0">{t('orders.empty.title', 'No orders found')}</p>
                    <small className="text-muted">{t('orders.empty.subtitle', 'Accepted & locked quotes will appear here')}</small>
                  </CTableDataCell>
                </CTableRow>
              ) : (
                paged.map((item) => {
                  const paymentInfo = getPaymentStatus(item.id)
                  return (
                    <CTableRow key={item.id} onClick={() => openDetails(item.id)} style={{ cursor: 'pointer' }}>
                      <CTableDataCell className="sticky-col">
                        {new Date(item.accepted_at || item.date || item.createdAt).toLocaleDateString()}
                      </CTableDataCell>
                      <CTableDataCell>{renderCustomerCell(item)}</CTableDataCell>
                      <CTableDataCell className="text-muted">
                        {(item.description || item?.proposal?.description || '').trim() || t('common.na')}
                      </CTableDataCell>
                      <CTableDataCell>{resolveManuName(item)}</CTableDataCell>
                      <CTableDataCell>
                        <CBadge color={statusColor(item.status || 'accepted')} shape="rounded-pill">
                          {item.status || 'accepted'}
                        </CBadge>
                      </CTableDataCell>
                      <CTableDataCell>
                        <div className="d-flex flex-column">
                          <CBadge color={paymentInfo.color} shape="rounded-pill" className="align-self-start">
                            {paymentInfo.label}
                          </CBadge>
                          {paymentInfo.status === 'paid' && paymentInfo.paidAt && (
                            <small className="text-muted" style={{ fontSize: 11 }}>
                              {t('payments.appliedOn','Applied on')} {new Date(paymentInfo.paidAt).toLocaleDateString()}
                            </small>
                          )}
                        </div>
                      </CTableDataCell>
                      <CTableDataCell>
                        <div className="d-flex gap-2">
                          {paymentInfo.showButton && (
                            <CButton
                              color="primary"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleMakePayment(item.id)
                              }}
                            >
                              <CIcon icon={cilCreditCard} className="me-1" size="sm" />
                              {t('orders.actions.makePayment', 'Make Payment')}
                            </CButton>
                          )}
                          {paymentInfo.status === 'paid' && (
                            <CButton
                              color="success"
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation()
                                const payment = getOrderPayment(item.id)
                                handleDownloadReceipt(item, payment)
                              }}
                            >
                              <CIcon icon={cilCloudDownload} className="me-1" size="sm" />
                              {t('orders.actions.downloadInvoice', 'Download Invoice')}
                            </CButton>
                          )}
                        </div>
                      </CTableDataCell>
                    </CTableRow>
                  )
                })
              )}
            </CTableBody>
          </CTable>
        </div>
      </div>

      {/* Mobile card list */}
      <div className="u-mobile">
        {paged.length === 0 ? (
          <div className="text-center py-5">
            <CIcon icon={cilSearch} size="3xl" className="text-muted mb-3" />
            <p className="mb-0">{t('orders.empty.title', 'No orders found')}</p>
            <small className="text-muted">{t('orders.empty.subtitle', 'Accepted & locked quotes will appear here')}</small>
          </div>
        ) : (
          <div className="stack gap-2">
            {paged.map((item) => {
              const paymentInfo = getPaymentStatus(item.id)
              return (
                <article
                  key={item.id}
                  className="card card--compact"
                  role="button"
                  onClick={() => openDetails(item.id)}
                  aria-label={t('orders.openDetails', 'Open order details')}
                >
                  <div className="card__head">
                    <div className="card__title">
                      {isContractor ? (
                        <span className="fw-semibold">{item.customer?.name || t('common.na')}</span>
                      ) : (
                        <div className="d-flex flex-column">
                          <span className="fw-semibold">{item?.Owner?.group?.name || item?.ownerGroup?.name || item?.Owner?.name || t('common.na')}</span>
                          <small className="text-muted">{item?.customer?.name || t('common.na')}</small>
                        </div>
                      )}
                    </div>
                    <div className="d-flex flex-column gap-1">
                      <CBadge color={statusColor(item.status || 'accepted')} shape="rounded-pill">
                        {item.status || 'accepted'}
                      </CBadge>
                      <div className="d-flex flex-column">
                        <CBadge color={paymentInfo.color} shape="rounded-pill" size="sm" className="align-self-start">
                          {paymentInfo.label}
                        </CBadge>
                        {paymentInfo.status === 'paid' && paymentInfo.paidAt && (
                          <small className="text-muted" style={{ fontSize: 10 }}>
                            {t('payments.appliedOn','Applied on')} {new Date(paymentInfo.paidAt).toLocaleDateString()}
                          </small>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="card__meta">
                    <span>
                      {new Date(item.accepted_at || item.date || item.createdAt).toLocaleDateString()}
                    </span>
                    <span>
                      {t('orders.headers.manufacturer', 'Manufacturer')}: {resolveManuName(item)}
                    </span>
                  </div>
                  <div className="card__content text-muted">
                    {(item.description || item?.proposal?.description || '').trim() || t('common.na')}
                  </div>
                  {(paymentInfo.showButton || paymentInfo.status === 'paid') && (
                    <div className="card__actions d-flex gap-2 flex-wrap">
                      {paymentInfo.showButton && (
                        <CButton
                          color="primary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleMakePayment(item.id)
                          }}
                        >
                          <CIcon icon={cilCreditCard} className="me-1" size="sm" />
                          {t('orders.actions.makePayment', 'Make Payment')}
                        </CButton>
                      )}
                      {paymentInfo.status === 'paid' && (
                        <CButton
                          color="success"
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            const payment = getOrderPayment(item.id)
                            handleDownloadReceipt(item, payment)
                          }}
                        >
                          <CIcon icon={cilCloudDownload} className="me-1" size="sm" />
                          {t('orders.actions.downloadInvoice', 'Download Invoice')}
                        </CButton>
                      )}
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </div>

      <div className="mt-4">
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
    </CContainer>
  )
}

export default OrdersList
