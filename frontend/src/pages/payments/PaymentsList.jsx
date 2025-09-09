import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
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
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilSearch, cilCreditCard, cilPlus } from '../../icons';
import PageHeader from '../../components/PageHeader';
import PaginationComponent from '../../components/common/PaginationComponent';
import { fetchPayments, createPayment, applyPayment } from '../../store/slices/paymentsSlice';

// Mobile-friendly payment tabs styles
const paymentTabsStyles = `
  .payment-tabs {
    padding: 0.5rem;
    background: var(--surface);
    border-radius: var(--radius);
    margin-bottom: 1rem;
    box-shadow: var(--elev-1);
  }

  .payment-tabs__container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
    gap: 0.375rem;
  }

  .payment-tab {
    position: relative;
    display: grid;
    place-items: center;
    min-height: 44px;
    padding: 0.5rem 0.75rem;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    background: #fff;
    transition: all 0.12s ease;
    cursor: pointer;
    text-align: center;
  }

  .payment-tab__input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }

  .payment-tab__text {
    font-size: 0.875rem;
    font-weight: 500;
    text-transform: capitalize;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .payment-tab--active {
    background: color-mix(in oklch, var(--brand) 12%, white);
    border-color: color-mix(in oklch, var(--brand) 40%, #e5e7eb);
    box-shadow: 0 0 0 2px color-mix(in oklch, var(--brand) 30%, transparent);
  }

  .payment-tab--active .payment-tab__text {
    font-weight: 600;
    color: var(--brand);
  }

  @media (max-width: 576px) {
    .payment-tabs__container {
      grid-template-columns: repeat(3, 1fr);
      gap: 0.25rem;
    }

    .payment-tab {
      min-height: 40px;
      padding: 0.375rem 0.5rem;
    }

    .payment-tab__text {
      font-size: 0.8125rem;
    }
  }

  @media (max-width: 480px) {
    .payment-tabs__container {
      grid-template-columns: repeat(2, 1fr);
    }
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = paymentTabsStyles;
  if (!document.head.querySelector('[data-payment-tabs-styles]')) {
    styleElement.setAttribute('data-payment-tabs-styles', 'true');
    document.head.appendChild(styleElement);
  }
}
import { FaCreditCard } from 'react-icons/fa';
import Swal from 'sweetalert2';
import withContractorScope from '../../components/withContractorScope';

const PaymentsList = ({ isContractor, contractorGroupId, contractorGroupName }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { payments, pagination, loading, error } = useSelector((state) => state.payments);
  const user = useSelector((s) => s.auth.user);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  useEffect(() => {
    dispatch(fetchPayments({ page, status: statusFilter !== 'all' ? statusFilter : undefined }));
  }, [dispatch, page, statusFilter]);

  const filtered = useMemo(() => {
    if (!search) return payments;
    const term = search.toLowerCase();
    return payments.filter((payment) => {
      const customerName = payment.order?.customer?.name || payment.order?.proposal?.customerName || '';
      const contractorName = payment.order?.group?.name || payment.order?.creator?.name || '';
      return (
        customerName.toLowerCase().includes(term) ||
        contractorName.toLowerCase().includes(term) ||
        payment.transactionId?.toLowerCase().includes(term)
      );
    });
  }, [payments, search]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'processing':
        return 'info';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'danger';
      case 'cancelled':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'completed':
        return t('payments.status.completed', 'Paid');
      case 'processing':
        return t('payments.status.processing', 'Processing');
      case 'pending':
        return t('payments.status.pending', 'Payment Required');
      case 'failed':
        return t('payments.status.failed', 'Failed');
      case 'cancelled':
        return t('payments.status.cancelled', 'Cancelled');
      default:
        return status;
    }
  };

  const handleCreatePayment = async () => {
    const { value: orderId } = await Swal.fire({
      title: t('payments.create.title', 'Create Payment'),
      input: 'number',
      inputLabel: t('payments.create.orderIdLabel', 'Order ID'),
      inputPlaceholder: t('payments.create.orderIdPlaceholder', 'Enter order ID'),
      showCancelButton: true,
      confirmButtonText: t('common.create', 'Create'),
      cancelButtonText: t('common.cancel', 'Cancel'),
      inputValidator: (value) => {
        if (!value || value <= 0) {
          return t('payments.create.invalidOrderId', 'Please enter a valid order ID');
        }
      }
    });

    if (orderId) {
      const { value: amount } = await Swal.fire({
        title: t('payments.create.amountTitle', 'Payment Amount'),
        input: 'number',
        inputLabel: t('payments.create.amountLabel', 'Amount'),
        inputPlaceholder: t('payments.create.amountPlaceholder', 'Enter amount'),
        inputAttributes: {
          step: '0.01',
          min: '0.01'
        },
        showCancelButton: true,
        confirmButtonText: t('common.create', 'Create'),
        cancelButtonText: t('common.cancel', 'Cancel'),
        inputValidator: (value) => {
          if (!value || value <= 0) {
            return t('payments.create.invalidAmount', 'Please enter a valid amount');
          }
        }
      });

      if (amount) {
        try {
          await dispatch(createPayment({
            orderId: parseInt(orderId),
            amount: parseFloat(amount),
            currency: 'USD'
          })).unwrap();

          Swal.fire(
            t('common.success', 'Success'),
            t('payments.create.success', 'Payment created successfully'),
            'success'
          );

          dispatch(fetchPayments({ page, status: statusFilter !== 'all' ? statusFilter : undefined }));
        } catch (error) {
          Swal.fire(
            t('common.error', 'Error'),
            error.message || t('payments.create.error', 'Failed to create payment'),
            'error'
          );
        }
      }
    }
  };

  const handlePaymentClick = (payment) => {
    if (payment.status === 'pending') {
      navigate(`/payments/${payment.id}/pay`);
    } else {
      navigate(`/payments/${payment.id}`);
    }
  };

  const renderCustomerCell = (payment) => {
    const customerName = payment.order?.customer?.name || payment.order?.proposal?.customerName || t('common.na');

    if (!isContractor) {
      const contractorName = payment.order?.group?.name || payment.order?.creator?.name || t('common.na');
      return (
        <div>
          <div className="fw-semibold">{contractorName}</div>
          <div className="text-muted" style={{ fontSize: 12 }}>{customerName}</div>
        </div>
      );
    }

    return customerName;
  };

  const title = isContractor
    ? t('payments.title.contractor', 'My Payments')
    : t('payments.title.admin', 'All Payments');

  const subtitle = isContractor
    ? t('payments.subtitle.contractor', 'View your payment history and make payments')
    : t('payments.subtitle.admin', 'Manage all payments and payment configurations');

  return (
    <CContainer fluid>
      <PageHeader title={title} subtitle={subtitle} icon={FaCreditCard} />

      {/* Status filter tabs */}
      <div className="payment-tabs" role="tablist">
        <div className="payment-tabs__container">
          {['all', 'pending', 'processing', 'completed', 'failed'].map((status) => (
            <label key={status} className={`payment-tab ${statusFilter === status ? 'payment-tab--active' : ''}`}>
              <input
                type="radio"
                name="paymentStatus"
                value={status}
                checked={statusFilter === status}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label={t(`payments.status.${status}`, status)}
                className="payment-tab__input"
              />
              <span className="payment-tab__text">
                {t(`payments.status.${status}`, status === 'all' ? 'All' : status)}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Toolbar: search + actions */}
      <div className="toolbar" role="search">
        <div className="toolbar__start" style={{ flex: 1 }}>
          <div className="search" style={{ maxWidth: 520 }}>
            <CIcon icon={cilSearch} className="search__icon" />
            <input
              type="search"
              className="search__input"
              placeholder={t('payments.searchPlaceholder', 'Search by customer, contractor, or transaction ID')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label={t('payments.searchAria', 'Search payments')}
            />
          </div>
        </div>
        <div className="toolbar__end">
          {!isContractor && (
            <CButton
              color="primary"
              onClick={handleCreatePayment}
              className="icon-btn"
              aria-label={t('payments.create.button', 'Create payment')}
            >
              <CIcon icon={cilPlus} />
              <span className="u-desktop">{t('payments.create.button', 'Create Payment')}</span>
            </CButton>
          )}
          <small className="text-muted ms-3">
            {t('payments.showingCount', { count: filtered.length, total: payments.length })}
          </small>
        </div>
      </div>

      {/* Desktop table */}
      <div className="u-desktop">
        <div className="table-scroll">
          <CTable hover className="table-modern">
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell className="sticky-col">{t('payments.headers.date', 'Date')}</CTableHeaderCell>
                <CTableHeaderCell>{t('payments.headers.customer', 'Customer')}</CTableHeaderCell>
                <CTableHeaderCell>{t('payments.headers.order', 'Order')}</CTableHeaderCell>
                <CTableHeaderCell>{t('payments.headers.amount', 'Amount')}</CTableHeaderCell>
                <CTableHeaderCell>{t('payments.headers.status', 'Status')}</CTableHeaderCell>
                <CTableHeaderCell>{t('payments.headers.transaction', 'Transaction ID')}</CTableHeaderCell>
                <CTableHeaderCell>{t('payments.headers.actions', 'Actions')}</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {loading ? (
                <CTableRow>
                  <CTableDataCell colSpan={7} className="text-center py-4">
                    {t('common.loading', 'Loading...')}
                  </CTableDataCell>
                </CTableRow>
              ) : filtered.length === 0 ? (
                <CTableRow>
                  <CTableDataCell colSpan={7} className="text-center py-5">
                    <CIcon icon={cilCreditCard} size="3xl" className="text-muted mb-3" />
                    <p className="mb-0">{t('payments.empty.title', 'No payments found')}</p>
                    <small className="text-muted">{t('payments.empty.subtitle', 'Payments will appear here when created')}</small>
                  </CTableDataCell>
                </CTableRow>
              ) : (
                filtered.map((payment) => (
                  <CTableRow key={payment.id} style={{ cursor: 'pointer' }} onClick={() => handlePaymentClick(payment)}>
                    <CTableDataCell className="sticky-col">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </CTableDataCell>
                    <CTableDataCell>{renderCustomerCell(payment)}</CTableDataCell>
                    <CTableDataCell>#{payment.orderId}</CTableDataCell>
                    <CTableDataCell>
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: payment.currency || 'USD'
                      }).format(payment.amount)}
                    </CTableDataCell>
                    <CTableDataCell>
                      <div className="d-flex flex-column gap-1">
                        <CBadge color={getStatusColor(payment.status)} shape="rounded-pill" className="align-self-start">
                          {getStatusLabel(payment.status)}
                        </CBadge>
                        {payment.status === 'completed' && payment.paidAt && (
                          <small className="text-muted" style={{ fontSize: 11 }}>
                            {t('payments.appliedOn','Applied on')} {new Date(payment.paidAt).toLocaleDateString()}
                          </small>
                        )}
                      </div>
                    </CTableDataCell>
                    <CTableDataCell className="text-muted">
                      {payment.transactionId || t('common.na')}
                    </CTableDataCell>
                    <CTableDataCell>
                      {payment.status === 'pending' && (
                        <CButton
                          color="primary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/payments/${payment.id}/pay`);
                          }}
                        >
                          {t('payments.actions.makePayment', 'Make Payment')}
                        </CButton>
                      )}
                      {user?.role?.toLowerCase() === 'admin' && payment.status !== 'completed' && (
                        <CButton
                          color="success"
                          size="sm"
                          className="ms-2"
                          onClick={async (e) => {
                            e.stopPropagation();
                            
                            // Show payment method selection dialog
                            const { value: paymentMethod } = await Swal.fire({
                              title: t('payments.apply.confirmTitle','Apply Payment?'),
                              html: `
                                <p>${t('payments.apply.confirmText','This will mark the payment as completed.')}</p>
                                <div class="mt-3">
                                  <label for="paymentMethod" class="form-label">${t('payments.apply.methodLabel','Payment Method')}:</label>
                                  <select id="paymentMethod" class="form-select">
                                    <option value="">Select payment method</option>
                                    <option value="cash">Cash</option>
                                    <option value="debit_card">Debit Card</option>
                                    <option value="credit_card">Credit Card</option>
                                    <option value="check">Check</option>
                                    <option value="other">Other</option>
                                  </select>
                                </div>
                                <div class="mt-2" id="checkNumberDiv" style="display: none;">
                                  <label for="checkNumber" class="form-label">Check Number:</label>
                                  <input type="text" id="checkNumber" class="form-control" placeholder="Enter check number">
                                </div>
                              `,
                              icon: 'question',
                              showCancelButton: true,
                              confirmButtonText: t('payments.apply.confirmYes','Yes, apply it'),
                              cancelButtonText: t('common.cancel','Cancel'),
                              preConfirm: () => {
                                const method = document.getElementById('paymentMethod').value;
                                const checkNumber = document.getElementById('checkNumber').value;
                                
                                if (!method) {
                                  Swal.showValidationMessage('Please select a payment method');
                                  return false;
                                }
                                
                                if (method === 'check' && !checkNumber.trim()) {
                                  Swal.showValidationMessage('Please enter a check number');
                                  return false;
                                }
                                
                                return method === 'check' ? `check #${checkNumber}` : method;
                              },
                              didOpen: () => {
                                const select = document.getElementById('paymentMethod');
                                const checkDiv = document.getElementById('checkNumberDiv');
                                
                                select.addEventListener('change', () => {
                                  if (select.value === 'check') {
                                    checkDiv.style.display = 'block';
                                  } else {
                                    checkDiv.style.display = 'none';
                                  }
                                });
                              }
                            });
                            
                            if (paymentMethod) {
                              try {
                                await dispatch(applyPayment({ 
                                  id: payment.id, 
                                  paymentMethod: paymentMethod 
                                })).unwrap();
                                Swal.fire(t('common.success','Success'), t('payments.apply.success','Payment applied'), 'success');
                              } catch (err) {
                                Swal.fire(t('common.error','Error'), err.message || t('payments.apply.error','Failed to apply'), 'error');
                              }
                            }
                          }}
                        >
                          {t('payments.apply.button','Apply')}
                        </CButton>
                      )}
                    </CTableDataCell>
                  </CTableRow>
                ))
              )}
            </CTableBody>
          </CTable>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="u-mobile">
        {loading ? (
          <div className="text-center py-4">
            {t('common.loading', 'Loading...')}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-5">
            <CIcon icon={cilCreditCard} size="3xl" className="text-muted mb-3" />
            <p className="mb-0">{t('payments.empty.title', 'No payments found')}</p>
            <small className="text-muted">{t('payments.empty.subtitle', 'Payments will appear here when created')}</small>
          </div>
        ) : (
          <div className="stack gap-2">
            {filtered.map((payment) => (
              <article
                key={payment.id}
                className="card card--compact"
                role="button"
                onClick={() => handlePaymentClick(payment)}
                aria-label={t('payments.openDetails', 'Open payment details')}
              >
                <div className="card__head">
                  <div className="card__title">
                    {renderCustomerCell(payment)}
                  </div>
                  <CBadge color={getStatusColor(payment.status)} shape="rounded-pill">
                    {getStatusLabel(payment.status)}
                  </CBadge>
                </div>
                <div className="card__meta">
                  <span>{new Date(payment.createdAt).toLocaleDateString()}</span>
                  <span>
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: payment.currency || 'USD'
                    }).format(payment.amount)}
                  </span>
                  <span>Order #{payment.orderId}</span>
                </div>
                {payment.transactionId && (
                  <div className="card__content text-muted">
                    {t('payments.headers.transaction', 'Transaction ID')}: {payment.transactionId}
                  </div>
                )}
                {payment.status === 'pending' && (
                  <div className="card__actions">
                    <CButton
                      color="primary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/payments/${payment.id}/pay`);
                      }}
                    >
                      {t('payments.actions.makePayment', 'Make Payment')}
                    </CButton>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && filtered.length > 0 && (
        <div className="mt-4">
          <PaginationComponent
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={setPage}
            itemsPerPage={pagination.itemsPerPage}
          />
        </div>
      )}
    </CContainer>
  );
};

export default withContractorScope(PaymentsList);
