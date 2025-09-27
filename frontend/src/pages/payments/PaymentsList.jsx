import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  CAlert,
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
import { FaCreditCard } from 'react-icons/fa';
import Swal from 'sweetalert2';
import PageHeader from '../../components/PageHeader';
import PaginationComponent from '../../components/common/PaginationComponent';
import withContractorScope from '../../components/withContractorScope';
import {
  fetchPayments,
  fetchPublicPaymentConfig,
  createPayment,
  applyPayment,
} from '../../store/slices/paymentsSlice';

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

const PAYMENT_TABS_STYLE_ID = 'payments-tabs-style';
const STATUS_OPTIONS = ['all', 'pending', 'processing', 'completed', 'failed', 'cancelled'];

const formatCurrency = (amountCents = 0, currency = 'USD') => {
  const value = (amountCents || 0) / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
  }).format(value);
};

const PaymentsList = ({ isContractor, contractorGroupId, contractorGroupName }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    payments,
    pagination,
    loading,
    error,
    publicPaymentConfig,
  } = useSelector((state) => state.payments);
  const user = useSelector((s) => s.auth.user);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return undefined;
    }

    let styleEl = document.getElementById(PAYMENT_TABS_STYLE_ID);
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = PAYMENT_TABS_STYLE_ID;
      styleEl.innerHTML = paymentTabsStyles;
      document.head.appendChild(styleEl);

      return () => {
        if (styleEl?.parentNode) {
          styleEl.parentNode.removeChild(styleEl);
        }
      };
    }

    styleEl.innerHTML = paymentTabsStyles;
    return undefined;
  }, []);

  useEffect(() => {
    dispatch(
      fetchPayments({
        page,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      }),
    );
  }, [dispatch, page, statusFilter]);

  useEffect(() => {
    const loadPublicConfig = async () => {
      try {
        await dispatch(fetchPublicPaymentConfig()).unwrap();
      } catch (err) {
        // Stripe may be disabled; ignore 4xx errors.
      }
    };

    loadPublicConfig();
  }, [dispatch]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const cardPaymentsEnabled = Boolean(publicPaymentConfig?.cardPaymentsEnabled);

  const computeAmountCents = (payment) => (
    payment?.amount_cents ?? Math.round((payment?.amount || 0) * 100)
  );

  const formatPaymentAmount = (payment) => (
    formatCurrency(computeAmountCents(payment), payment?.currency)
  );

  const renderGatewayBadge = (gateway) => {
    const normalized = (gateway || 'manual').toLowerCase();
    const isStripe = normalized === 'stripe';
    const label = isStripe
      ? t('payments.gateway.stripe', 'Stripe')
      : t('payments.gateway.manual', 'Manual');
    return (
      <CBadge color={isStripe ? 'info' : 'secondary'} shape="rounded-pill" title={label}>
        {label}
      </CBadge>
    );
  };

  const filtered = useMemo(() => {
    if (!search) return payments;
    const term = search.toLowerCase();
    return payments.filter((payment) => {
      const customerName = payment.order?.customer?.name
        || payment.order?.proposal?.customerName
        || '';
      const contractorName = payment.order?.group?.name
        || payment.order?.creator?.name
        || '';
      return (
        customerName.toLowerCase().includes(term)
        || contractorName.toLowerCase().includes(term)
        || payment.transactionId?.toLowerCase().includes(term)
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
    if (status === 'all') {
      return t('payments.status.all', 'All');
    }

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

  const getDisplayOrderNumber = (payment) => {
    const order = payment?.order;
    if (order?.order_number) return order.order_number;
    try {
      const snap = typeof order?.snapshot === 'string'
        ? JSON.parse(order.snapshot)
        : order?.snapshot;
      const num = snap?.info?.orderNumber;
      if (num) return num;
    } catch (err) {
      // ignore malformed snapshot
    }
    return `#${payment?.orderId ?? payment?.order?.id ?? ''}`;
  };

  const handleCreatePayment = async () => {
    const { value: orderIdInput } = await Swal.fire({
      title: t('payments.create.title', 'Create Payment'),
      input: 'number',
      inputLabel: t('payments.create.orderIdLabel', 'Order ID'),
      inputPlaceholder: t('payments.create.orderIdPlaceholder', 'Enter order ID'),
      inputAttributes: {
        min: '1',
      },
      showCancelButton: true,
      confirmButtonText: t('common.create', 'Create'),
      cancelButtonText: t('common.cancel', 'Cancel'),
      inputValidator: (value) => {
        if (!value || Number(value) <= 0) {
          return t('payments.create.invalidOrderId', 'Please enter a valid order ID');
        }
        return undefined;
      },
    });

    if (!orderIdInput) {
      return;
    }

    const orderId = parseInt(orderIdInput, 10);

    let gateway = 'manual';
    if (cardPaymentsEnabled) {
      const { value: selectedGateway } = await Swal.fire({
        title: t('payments.create.gatewayTitle', 'Select payment type'),
        input: 'radio',
        inputOptions: {
          stripe: t('payments.gateway.stripe', 'Stripe'),
          manual: t('payments.gateway.manual', 'Manual'),
        },
        inputValue: 'stripe',
        showCancelButton: true,
        confirmButtonText: t('common.continue', 'Continue'),
        cancelButtonText: t('common.cancel', 'Cancel'),
        inputValidator: (value) => {
          if (!value) {
            return t('payments.create.gatewayRequired', 'Select a payment type');
          }
          return undefined;
        },
      });

      if (!selectedGateway) {
        return;
      }

      gateway = selectedGateway;
    }

    try {
      await dispatch(createPayment({ orderId, gateway })).unwrap();

      const successMessage = gateway === 'stripe'
        ? t('payments.create.successStripe', 'Stripe payment created successfully. Customers can now complete payment online.')
        : t('payments.create.success', 'Payment created successfully');

      Swal.fire(t('common.success', 'Success'), successMessage, 'success');
      dispatch(
        fetchPayments({
          page,
          status: statusFilter !== 'all' ? statusFilter : undefined,
        }),
      );
    } catch (err) {
      Swal.fire(
        t('common.error', 'Error'),
        err?.message || t('payments.create.error', 'Failed to create payment'),
        'error',
      );
    }
  };

  const handlePaymentClick = (payment) => {
    if (payment.gateway === 'stripe' && payment.status === 'pending') {
      navigate(`/payments/${payment.id}/pay`);
    } else {
      navigate(`/payments/${payment.id}`);
    }
  };

  const renderCustomerCell = (payment) => {
    const customerName = payment.order?.customer?.name
      || payment.order?.proposal?.customerName
      || t('common.na');

    if (!isContractor) {
      const contractorName = payment.order?.group?.name
        || payment.order?.creator?.name
        || t('common.na');
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

  const userRole = (user?.role || '').toLowerCase();

  return (
    <CContainer fluid>
      <PageHeader title={title} subtitle={subtitle} icon={FaCreditCard} />

      {error ? (
        <CAlert color="danger" className="mb-3" role="alert">
          {error}
        </CAlert>
      ) : null}

      <div className="payment-tabs" role="tablist">
        <div className="payment-tabs__container">
          {STATUS_OPTIONS.map((status) => (
            <label
              key={status}
              className={`payment-tab ${statusFilter === status ? 'payment-tab--active' : ''}`}
            >
              <input
                type="radio"
                name="paymentStatus"
                value={status}
                checked={statusFilter === status}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label={getStatusLabel(status)}
                className="payment-tab__input"
              />
              <span className="payment-tab__text">{getStatusLabel(status)}</span>
            </label>
          ))}
        </div>
      </div>

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

      <div className="u-desktop">
        <div className="table-scroll">
          <CTable hover className="table-modern">
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell className="sticky-col">
                  {t('payments.headers.date', 'Date')}
                </CTableHeaderCell>
                <CTableHeaderCell>{t('payments.headers.customer', 'Customer')}</CTableHeaderCell>
                <CTableHeaderCell>{t('payments.headers.orderNumber', 'Order #')}</CTableHeaderCell>
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
                    <small className="text-muted">
                      {t('payments.empty.subtitle', 'Payments will appear here when created')}
                    </small>
                  </CTableDataCell>
                </CTableRow>
              ) : (
                filtered.map((payment) => {
                  const manualApplyEnabled =
                    userRole === 'admin'
                    && payment.gateway === 'manual'
                    && payment.status !== 'completed';
                  const canPayOnline = payment.gateway === 'stripe' && payment.status === 'pending';

                  return (
                    <CTableRow
                      key={payment.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => handlePaymentClick(payment)}
                    >
                      <CTableDataCell className="sticky-col">
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </CTableDataCell>
                      <CTableDataCell>{renderCustomerCell(payment)}</CTableDataCell>
                      <CTableDataCell>{getDisplayOrderNumber(payment)}</CTableDataCell>
                      <CTableDataCell>
                        <div className="d-flex align-items-center gap-2">
                          <span>{formatPaymentAmount(payment)}</span>
                          {renderGatewayBadge(payment.gateway)}
                        </div>
                      </CTableDataCell>
                      <CTableDataCell>
                        <div className="d-flex flex-column gap-1">
                          <CBadge
                            color={getStatusColor(payment.status)}
                            shape="rounded-pill"
                            className="align-self-start"
                          >
                            {getStatusLabel(payment.status)}
                          </CBadge>
                          {payment.status === 'completed' && payment.paidAt ? (
                            <small className="text-muted" style={{ fontSize: 11 }}>
                              {t('payments.appliedOn', 'Applied on')}{' '}
                              {new Date(payment.paidAt).toLocaleDateString()}
                            </small>
                          ) : null}
                        </div>
                      </CTableDataCell>
                      <CTableDataCell className="text-muted">
                        {payment.transactionId || t('common.na')}
                      </CTableDataCell>
                      <CTableDataCell>
                        {canPayOnline ? (
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
                        ) : null}
                        {manualApplyEnabled ? (
                          <CButton
                            color="success"
                            size="sm"
                            className={canPayOnline ? 'ms-2' : ''}
                            onClick={async (e) => {
                              e.stopPropagation();

                              const html = `
                                <p>${t('payments.apply.confirmText', 'This will mark the payment as completed.')}</p>
                                <div class="mt-3">
                                  <label for="paymentMethod" class="form-label">${t('payments.apply.methodLabel', 'Payment Method')}:</label>
                                  <select id="paymentMethod" class="form-select">
                                    <option value="">${t('payments.apply.selectMethodPlaceholder', 'Select payment method')}</option>
                                    <option value="cash">${t('paymentReceipt.paymentMethod.cash', 'Cash')}</option>
                                    <option value="debit_card">${t('paymentReceipt.paymentMethod.debitCard', 'Debit Card')}</option>
                                    <option value="credit_card">${t('paymentReceipt.paymentMethod.creditCard', 'Credit Card')}</option>
                                    <option value="check">${t('paymentReceipt.paymentMethod.check', 'Check')}</option>
                                    <option value="other">${t('paymentReceipt.paymentMethod.other', 'Other')}</option>
                                  </select>
                                </div>
                                <div class="mt-2" id="checkNumberDiv" style="display: none;">
                                  <label for="checkNumber" class="form-label">${t('payments.apply.checkNumberLabel', 'Check Number')}:</label>
                                  <input type="text" id="checkNumber" class="form-control" placeholder="${t('payments.apply.checkNumberPlaceholder', 'Enter check number')}">
                                </div>`;

                              const { value: paymentMethod } = await Swal.fire({
                                title: t('payments.apply.confirmTitle', 'Apply Payment?'),
                                html,
                                icon: 'question',
                                showCancelButton: true,
                                confirmButtonText: t('payments.apply.confirmYes', 'Yes, apply it'),
                                cancelButtonText: t('common.cancel', 'Cancel'),
                                preConfirm: () => {
                                  const methodSelect = document.getElementById('paymentMethod');
                                  const checkNumberInput = document.getElementById('checkNumber');

                                  const method = methodSelect.value;
                                  const checkNumber = checkNumberInput.value;

                                  if (!method) {
                                    Swal.showValidationMessage(
                                      t('payments.apply.validation.selectMethod', 'Please select a payment method'),
                                    );
                                    return false;
                                  }

                                  if (method === 'check' && !checkNumber.trim()) {
                                    Swal.showValidationMessage(
                                      t('payments.apply.validation.checkNumber', 'Please enter a check number'),
                                    );
                                    return false;
                                  }

                                  return method === 'check' ? `check #${checkNumber}` : method;
                                },
                                didOpen: () => {
                                  const methodSelect = document.getElementById('paymentMethod');
                                  const checkNumberDiv = document.getElementById('checkNumberDiv');
                                  methodSelect.addEventListener('change', () => {
                                    if (methodSelect.value === 'check') {
                                      checkNumberDiv.style.display = 'block';
                                    } else {
                                      checkNumberDiv.style.display = 'none';
                                    }
                                  });
                                },
                              });

                              if (paymentMethod) {
                                try {
                                  await dispatch(
                                    applyPayment({
                                      id: payment.id,
                                      paymentMethod,
                                    }),
                                  ).unwrap();
                                  Swal.fire(
                                    t('common.success', 'Success'),
                                    t('payments.apply.success', 'Payment applied'),
                                    'success',
                                  );
                                } catch (applyErr) {
                                  Swal.fire(
                                    t('common.error', 'Error'),
                                    applyErr?.message || t('payments.apply.error', 'Failed to apply'),
                                    'error',
                                  );
                                }
                              }
                            }}
                          >
                            {t('payments.apply.button', 'Apply')}
                          </CButton>
                        ) : null}
                      </CTableDataCell>
                    </CTableRow>
                  );
                })
              )}
            </CTableBody>
          </CTable>
        </div>
      </div>

      <div className="u-mobile">
        {loading ? (
          <div className="text-center py-4">{t('common.loading', 'Loading...')}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-5">
            <CIcon icon={cilCreditCard} size="3xl" className="text-muted mb-3" />
            <p className="mb-0">{t('payments.empty.title', 'No payments found')}</p>
            <small className="text-muted">
              {t('payments.empty.subtitle', 'Payments will appear here when created')}
            </small>
          </div>
        ) : (
          <div className="stack gap-2">
            {filtered.map((payment) => {
              const canPayOnline = payment.gateway === 'stripe' && payment.status === 'pending';
              return (
                <article
                  key={payment.id}
                  className="card card--compact"
                  role="button"
                  onClick={() => handlePaymentClick(payment)}
                  aria-label={t('payments.openDetails', 'Open payment details')}
                >
                  <div className="card__head">
                    <div className="card__title">{renderCustomerCell(payment)}</div>
                    <CBadge color={getStatusColor(payment.status)} shape="rounded-pill">
                      {getStatusLabel(payment.status)}
                    </CBadge>
                  </div>
                  <div className="card__meta">
                    <span>{new Date(payment.createdAt).toLocaleDateString()}</span>
                    <span className="d-flex align-items-center gap-2">
                      {formatPaymentAmount(payment)}
                      {renderGatewayBadge(payment.gateway)}
                    </span>
                    <span>
                      {t('payments.mobile.orderNumber', 'Order #{{id}}', {
                        id: getDisplayOrderNumber(payment),
                      })}
                    </span>
                  </div>
                  {payment.transactionId ? (
                    <div className="card__content text-muted">
                      {t('payments.headers.transaction', 'Transaction ID')}: {payment.transactionId}
                    </div>
                  ) : null}
                  {canPayOnline ? (
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
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </div>

      {!loading && filtered.length > 0 ? (
        <div className="mt-4">
          <PaginationComponent
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={setPage}
            itemsPerPage={pagination.itemsPerPage}
          />
        </div>
      ) : null}
    </CContainer>
  );
};

export default withContractorScope(PaymentsList);
