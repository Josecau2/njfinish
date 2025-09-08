import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import {
  CRow,
  CCol,
  CCard,
  CCardBody,
  CCardHeader,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CBadge,
  CButton,
  CInputGroup,
  CInputGroupText,
  CFormInput,
  CSpinner,
  CAlert
} from '@coreui/react';
import { Search, Users, User, Phone, Mail, MapPin, Calendar, ChevronUp, ChevronDown } from '@/icons-lucide';
import { fetchContractorCustomers } from '../../../store/slices/contractorSlice';
import PaginationComponent from '../../../components/common/PaginationComponent';
import EmptyState from '../../../components/common/EmptyState';
import { notifyError } from '../../../helpers/notify';

const CustomersTab = ({ contractor, groupId }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const contractorsState = useSelector((state) => state.contractors) || {};
  const cc = contractorsState.contractorCustomers || {};
  const customers = cc.data || [];
  const pagination = cc.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 };
  const loading = !!cc.loading;
  const error = cc.error || null;

  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (groupId) {
        dispatch(fetchContractorCustomers({
          groupId,
          page: currentPage,
          limit: itemsPerPage,
          search: searchTerm
        }));
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [dispatch, groupId, currentPage, itemsPerPage, searchTerm]);

  // notify on load error
  useEffect(() => {
    if (error) {
      notifyError('Failed to load customers', typeof error === 'string' ? error : '')
    }
  }, [error])

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleSort = (key) => {
    setSortConfig((prev) => {
      const direction = prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc';
      return { key, direction };
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';

    try {
      const date = new Date(dateString);
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return 'N/A';
      }
      return date.toLocaleDateString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
  };

  const formatPhone = (phone) => {
    if (!phone) return 'N/A';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  const formatAddress = (customer) => {
    const parts = [];

    // Add street address
    if (customer.address) {
      parts.push(customer.address);
    }

    // Add apt/suite if present
    if (customer.aptOrSuite) {
      parts.push(customer.aptOrSuite);
    }

    // Create city, state zip line
    const cityStateZip = [];
    if (customer.city) {
      cityStateZip.push(customer.city);
    }
    if (customer.state) {
      cityStateZip.push(customer.state);
    }
    if (customer.zipCode) {
      cityStateZip.push(customer.zipCode);
    }

    if (cityStateZip.length > 0) {
      parts.push(cityStateZip.join(', '));
    }

    return parts.length > 0 ? parts.join(', ') : null;
  };

  const filteredAndSortedCustomers = useMemo(() => {
    const base = Array.isArray(customers) ? customers : [];
    let filtered = base.filter(customer => {
      const matchesSearch = customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           customer.phone?.includes(searchTerm);
      return matchesSearch;
    });

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = bVal.toLowerCase();
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [customers, searchTerm, sortConfig]);

  const paginatedCustomers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedCustomers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedCustomers, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredAndSortedCustomers.length / itemsPerPage);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
        <CSpinner color="primary" />
      </div>
    );
  }

  return (
    <CRow>
      <CCol xs={12}>
        <CCard>
          <CCardHeader>
            <strong>
              <Users size={16} className="me-2" aria-hidden="true" />
              {t('contractorsAdmin.detail.customers.header', { count: filteredAndSortedCustomers.length })}
            </strong>
          </CCardHeader>
          <CCardBody>
            {error && (
              <CAlert color="danger" className="mb-3">
                {typeof error === 'string' ? error : 'Something went wrong'}
              </CAlert>
            )}

            {/* Search */}
            <CRow className="mb-4">
              <CCol md={6}>
                <CInputGroup>
                  <CInputGroupText aria-hidden="true">
                    <Search size={16} />
                  </CInputGroupText>
                  <CFormInput
                    type="text"
                    placeholder={t('contractorsAdmin.detail.customers.searchPlaceholder')}
                    aria-label={t('contractorsAdmin.detail.customers.searchAria', 'Search contractor customers')}
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                  />
                </CInputGroup>
              </CCol>
              <CCol md={6} className="d-flex justify-content-end align-items-center">
                <div className="text-muted">
                  <small>
                    {t('contractorsAdmin.detail.customers.showing', { count: paginatedCustomers.length, total: filteredAndSortedCustomers.length })}
                  </small>
                </div>
              </CCol>
            </CRow>

            {/* Stats Row */}
            <CRow className="mb-4">
              <CCol sm={6} lg={3}>
                <div className="border-start border-start-4 border-start-info py-1 px-3">
                  <div className="text-muted small">{t('contractorsAdmin.detail.customers.stats.total')}</div>
                  <div className="fs-5 fw-semibold">{customers.length}</div>
                </div>
              </CCol>
              <CCol sm={6} lg={3}>
                <div className="border-start border-start-4 border-start-success py-1 px-3">
                  <div className="text-muted small">{t('contractorsAdmin.detail.customers.stats.active')}</div>
                  <div className="fs-5 fw-semibold">
                    {customers.filter(c => !c.deleted_at).length}
                  </div>
                </div>
              </CCol>
              <CCol sm={6} lg={3}>
                <div className="border-start border-start-4 border-start-warning py-1 px-3">
                  <div className="text-muted small">{t('contractorsAdmin.detail.customers.stats.withEmail')}</div>
                  <div className="fs-5 fw-semibold">
                    {customers.filter(c => c.email).length}
                  </div>
                </div>
              </CCol>
              <CCol sm={6} lg={3}>
                <div className="border-start border-start-4 border-start-primary py-1 px-3">
                  <div className="text-muted small">{t('contractorsAdmin.detail.customers.stats.withPhone')}</div>
                  <div className="fs-5 fw-semibold">
                    {customers.filter(c => c.phone).length}
                  </div>
                </div>
              </CCol>
            </CRow>

            {/* Desktop Table */}
            <div className="table-wrap d-none d-md-block">
              <CTable hover striped className="table-modern">
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell
                      scope="col"
                      className="cursor-pointer"
                      onClick={() => handleSort('name')}
                    >
                      {t('customers.name')}
                      {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? (
                        <ChevronUp size={14} className="ms-1" aria-hidden="true" />
                      ) : (
                        <ChevronDown size={14} className="ms-1" aria-hidden="true" />
                      ))}
                    </CTableHeaderCell>
                    <CTableHeaderCell
                      scope="col"
                      className="cursor-pointer"
                      onClick={() => handleSort('email')}
                    >
                      {t('customers.email')}
                      {sortConfig.key === 'email' && (sortConfig.direction === 'asc' ? (
                        <ChevronUp size={14} className="ms-1" aria-hidden="true" />
                      ) : (
                        <ChevronDown size={14} className="ms-1" aria-hidden="true" />
                      ))}
                    </CTableHeaderCell>
                    <CTableHeaderCell scope="col">
                      {t('contractorsAdmin.detail.customers.table.phone')}
                    </CTableHeaderCell>
                    <CTableHeaderCell scope="col">
                      {t('contractorsAdmin.detail.customers.table.address')}
                    </CTableHeaderCell>
                    <CTableHeaderCell
                      scope="col"
                      className="cursor-pointer"
                      onClick={() => handleSort('created_at')}
                    >
                      {t('contractorsAdmin.detail.customers.table.created')}
                      {sortConfig.key === 'created_at' && (sortConfig.direction === 'asc' ? (
                        <ChevronUp size={14} className="ms-1" aria-hidden="true" />
                      ) : (
                        <ChevronDown size={14} className="ms-1" aria-hidden="true" />
                      ))}
                    </CTableHeaderCell>
                    <CTableHeaderCell scope="col">
                      {t('contractorsAdmin.detail.customers.table.status')}
                    </CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {paginatedCustomers.length === 0 ? (
                    <CTableRow>
                      <CTableDataCell colSpan="6">
                        <EmptyState title={t('contractorsAdmin.detail.customers.empty.title')} subtitle={t('contractorsAdmin.detail.customers.empty.subtitle')} />
                      </CTableDataCell>
                    </CTableRow>
                  ) : (
                    paginatedCustomers.map((customer) => (
                      <CTableRow key={customer.id} className="align-middle">
                        <CTableDataCell>
                          <div className="d-flex align-items-center">
                            <User size={16} className="me-2 text-muted" aria-hidden="true" />
                            <div>
                              <div className="fw-semibold">{customer.name}</div>
                              <small className="text-muted">ID: {customer.id}</small>
                            </div>
                          </div>
                        </CTableDataCell>
                        <CTableDataCell>
                          {customer.email ? (
                            <div className="d-flex align-items-center">
                              <Mail size={14} className="me-1 text-muted" aria-hidden="true" />
                              <span>{customer.email}</span>
                            </div>
                          ) : (
                            <small className="text-muted">{t('contractorsAdmin.detail.customers.noEmail')}</small>
                          )}
                        </CTableDataCell>
                        <CTableDataCell>
                          {customer.phone ? (
                            <div className="d-flex align-items-center">
                              <Phone size={14} className="me-1 text-muted" aria-hidden="true" />
                              <span>{formatPhone(customer.phone)}</span>
                            </div>
                          ) : (
                            <small className="text-muted">{t('contractorsAdmin.detail.customers.noPhone')}</small>
                          )}
                        </CTableDataCell>
                        <CTableDataCell>
                          {formatAddress(customer) ? (
                            <div className="d-flex align-items-center">
                              <MapPin size={14} className="me-1 text-muted" aria-hidden="true" />
                              <small>{formatAddress(customer)}</small>
                            </div>
                          ) : (
                            <small className="text-muted">{t('contractorsAdmin.detail.customers.noAddress')}</small>
                          )}
                        </CTableDataCell>
                        <CTableDataCell>
                          <small className="text-muted">
                            <Calendar size={14} className="me-1" aria-hidden="true" />
                            {formatDate(customer.created_at)}
                          </small>
                        </CTableDataCell>
                        <CTableDataCell>
                          <CBadge color={customer.deleted_at ? 'danger' : 'success'}>
                            {customer.deleted_at ? t('contractorsAdmin.detail.customers.inactive') : t('contractorsAdmin.detail.customers.active')}
                          </CBadge>
                        </CTableDataCell>
                      </CTableRow>
                    ))
                  )}
                </CTableBody>
              </CTable>
            </div>

            {/* Mobile Card Layout */}
            <div className="d-md-none">
              {paginatedCustomers.length === 0 ? (
                <EmptyState title={t('contractorsAdmin.detail.customers.empty.title')} subtitle={t('contractorsAdmin.detail.customers.empty.subtitle')} />
              ) : (
                <div className="mobile-customer-cards">
                  {paginatedCustomers.map((customer) => (
                    <CCard key={customer.id} className="mb-3 customer-mobile-card">
                      <CCardBody className="p-3">
                        {/* Header */}
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <div className="d-flex align-items-center flex-grow-1 min-width-0">
                            <User size={20} className="me-2 text-muted" aria-hidden="true" />
                            <div className="flex-grow-1 min-width-0">
                              <div className="fw-semibold text-truncate" title={customer.name}>
                                {customer.name}
                              </div>
                              <small className="text-muted">ID: {customer.id}</small>
                            </div>
                          </div>
                          <CBadge color={customer.deleted_at ? 'danger' : 'success'}>
                            {customer.deleted_at ? t('contractorsAdmin.detail.customers.inactive') : t('contractorsAdmin.detail.customers.active')}
                          </CBadge>
                        </div>

                        {/* Contact Info */}
                        <div className="row g-2 mb-3">
                          <div className="col-12">
                            <div className="small text-muted">{t('customers.email')}</div>
                            {customer.email ? (
                              <div className="d-flex align-items-center">
                                <Mail size={14} className="me-1 text-muted" aria-hidden="true" />
                                <span className="text-truncate-mobile" title={customer.email}>
                                  {customer.email}
                                </span>
                              </div>
                            ) : (
                              <small className="text-muted">{t('contractorsAdmin.detail.customers.noEmail')}</small>
                            )}
                          </div>
                          <div className="col-6">
                            <div className="small text-muted">{t('contractorsAdmin.detail.customers.table.phone')}</div>
                            {customer.phone ? (
                              <div className="d-flex align-items-center">
                                <Phone size={14} className="me-1 text-muted" aria-hidden="true" />
                                <span>{formatPhone(customer.phone)}</span>
                              </div>
                            ) : (
                              <small className="text-muted">No phone</small>
                            )}
                          </div>
                          <div className="col-6">
                            <div className="small text-muted">{t('contractorsAdmin.detail.customers.table.created')}</div>
                            <small>
                              <Calendar size={14} className="me-1" aria-hidden="true" />
                              {formatDate(customer.created_at)}
                            </small>
                          </div>
                        </div>

                        {/* Address */}
                        {formatAddress(customer) && (
                          <div className="mb-2">
                            <div className="small text-muted">{t('contractorsAdmin.detail.customers.table.address')}</div>
                            <div className="d-flex align-items-start">
                              <MapPin size={14} className="me-1 text-muted mt-1" aria-hidden="true" />
                              <small className="flex-grow-1">{formatAddress(customer)}</small>
                            </div>
                          </div>
                        )}
                      </CCardBody>
                    </CCard>
                  ))}
                </div>
              )}
            </div>

            {/* Pagination */}
            {pagination?.totalPages > 1 && (
              <div className="pt-3 border-top border-light">
                <PaginationComponent
                  currentPage={currentPage}
                  totalPages={pagination?.totalPages || 1}
                  onPageChange={handlePageChange}
                  itemsPerPage={itemsPerPage}
                />
              </div>
            )}
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  );
};

export default CustomersTab;
