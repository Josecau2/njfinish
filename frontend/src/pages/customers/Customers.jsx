import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CTable,
  CTableHead,
  CTableBody,
  CTableRow,
  CTableHeaderCell,
  CTableDataCell,
  CFormInput,
  CButton,
  CSpinner,
  CFormSelect,
  CContainer,
  CRow,
  CCol,
  CCard,
  CCardBody,
  CBadge,
  CInputGroup,
  CInputGroupText,
} from '@coreui/react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchCustomers, deleteCustomer } from '../../store/slices/customerSlice';
import { useNavigate } from 'react-router-dom';
import { buildEncodedPath, genNoise } from '../../utils/obfuscate';
import Swal from 'sweetalert2';
import axios from 'axios';
import CIcon from '@coreui/icons-react';
import { cilSearch, cilPencil, cilTrash, cilPlus, cilUser, cilEnvelopeClosed, cilPhone, cilLocationPin } from '@coreui/icons';
import PaginationComponent from '../../components/common/PaginationComponent';
import withContractorScope from '../../components/withContractorScope';
import PermissionGate from '../../components/PermissionGate';
import PageHeader from '../../components/PageHeader';
import { FaUsers } from 'react-icons/fa';

const CustomerTable = ({ isContractor, contractorGroupId, contractorModules, contractorGroupName }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const customers = useSelector((state) => state.customers.list);
  const loading = useSelector((state) => state.customers.loading);
  const error = useSelector((state) => state.customers.error);
  const totalPages = useSelector((state) => state.customers.totalPages);
  const total = useSelector((state) => state.customers.total);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const groupId = isContractor ? contractorGroupId : null;
    dispatch(fetchCustomers({ page: currentPage, limit: itemsPerPage, groupId }));
  }, [dispatch, currentPage, itemsPerPage, isContractor, contractorGroupId]);

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

  const handleSort = (key) => {
    setSortConfig((prev) => {
      const direction = prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc';
      return { key, direction };
    });
  };

  const handleEdit = (customer) => {
  const noisy = `/${genNoise(6)}/${genNoise(8)}` + buildEncodedPath('/customers/edit/:id', { id: customer.id });
  navigate(noisy);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
  title: t('customers.confirmTitle', 'Are you sure?'),
  text: t('customers.confirmText', 'This action cannot be undone!'),
      icon: 'warning',
      showCancelButton: true,
  confirmButtonText: t('customers.confirmYes', 'Yes, delete it!'),
  cancelButtonText: t('customers.confirmNo', 'No, cancel!'),
      reverseButtons: true,
    });

    if (result.isConfirmed) {
      try {
        await dispatch(deleteCustomer(id)).unwrap();
  await Swal.fire(t('customers.deleted', 'Deleted!'), t('customers.deletedMsg', 'The customer has been deleted.'), 'success');
        const groupId = isContractor ? contractorGroupId : null;
        dispatch(fetchCustomers({ page: currentPage, limit: itemsPerPage, groupId }));
      } catch (err) {
        console.error('Delete error:', err);
  Swal.fire(t('common.error', 'Error!'), err.message || t('customers.deleteFailed', 'Failed to delete customer. Please try again.'), 'error');
      }
    } else {
  Swal.fire(t('customers.cancelled', 'Cancelled'), t('customers.notDeleted', 'The customer was not deleted.'), 'info');
    }
  };

  const sortedFilteredCustomers = useMemo(() => {
    let filtered = customers.filter(
      (cust) =>
        cust.name?.toLowerCase().includes(searchTerm) || cust.email?.toLowerCase().includes(searchTerm),
    );

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aVal = a[sortConfig.key]?.toLowerCase?.() ?? '';
        const bVal = b[sortConfig.key]?.toLowerCase?.() ?? '';
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [customers, searchTerm, sortConfig]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleNewCustomer = () => {
    navigate('/customers/add');
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return '↕️';
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  return (
    <CContainer fluid className="dashboard-container">
      {/* Header Section */}
      <PageHeader
        title={t('customers.header')}
        subtitle={t('customers.subtitle')}
        icon={FaUsers}
      >
        <PermissionGate permission="customers:create">
          <CButton
            color="light"
            onClick={handleNewCustomer}
          >
            <CIcon icon={cilPlus} className="me-2" />
            {t('nav.addCustomer')}
          </CButton>
        </PermissionGate>
      </PageHeader>

      {/* Stats Cards */}
      <CRow className="mb-4 g-3">
        <CCol sm={6} md={3}>
          <CCard className="stat-card-sm" style={{ borderColor: 'var(--cui-primary)' }}>
            <CCardBody>
              <div className="stat-number text-primary">{total || 0}</div>
              <div className="stat-label">{t('customers.total')}</div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol sm={6} md={3}>
          <CCard className="stat-card-sm" style={{ borderColor: 'var(--cui-success)' }}>
            <CCardBody>
              <div className="stat-number text-success">{customers.filter(c => !c.deleted_at).length}</div>
              <div className="stat-label">{t('customers.active')}</div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol sm={6} md={3}>
          <CCard className="stat-card-sm" style={{ borderColor: 'var(--cui-warning)' }}>
            <CCardBody>
              <div className="stat-number text-warning">{customers.filter(c => c.email).length}</div>
              <div className="stat-label">{t('customers.withEmail')}</div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol sm={6} md={3}>
          <CCard className="stat-card-sm" style={{ borderColor: 'var(--cui-danger)' }}>
            <CCardBody>
              <div className="stat-number text-danger">{sortedFilteredCustomers.length}</div>
              <div className="stat-label">{t('customers.filtered')}</div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Search and Filters */}
      <CCard className="filter-card">
        <CCardBody>
          <CRow className="align-items-center g-3">
            <CCol md={6}>
              <CInputGroup>
                <CInputGroupText>
                  <CIcon icon={cilSearch} />
                </CInputGroupText>
                <CFormInput
                  placeholder={t('customers.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
                />
              </CInputGroup>
            </CCol>
            <CCol md={3}>
              <CFormSelect
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
              >
                <option value={5}>5 {t('customers.perPage', 'per page')}</option>
                <option value={10}>10 {t('customers.perPage', 'per page')}</option>
                <option value={25}>25 {t('customers.perPage', 'per page')}</option>
                <option value={50}>50 {t('customers.perPage', 'per page')}</option>
              </CFormSelect>
            </CCol>
            <CCol md={3} className="text-end">
              <small className="text-muted">
                {t('customers.showing', 'Showing')} {sortedFilteredCustomers.length} {t('customers.of', 'of')} {total} {t('customers.customersLower', 'customers')}
                {isContractor && (
                  <div className="text-primary small">({contractorGroupName})</div>
                )}
              </small>
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-5">
          <CSpinner color="primary" />
          <p className="mt-3 text-muted">{t('customers.loading', 'Loading customers...')}</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="alert alert-danger">
          <strong>{t('common.error', 'Error')}:</strong> {error}
        </div>
      )}

      {/* Desktop Table */}
      {!loading && !error && (
        <div className="table-responsive-md">
          <CCard className="data-table-card">
            <CTable hover>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>{t('customers.location', 'Location')}</CTableHeaderCell>
                  <CTableHeaderCell onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
                    <CIcon icon={cilUser} className="me-2" />
                    {t('customers.name', 'Name')} {getSortIcon('name')}
                  </CTableHeaderCell>
                  <CTableHeaderCell onClick={() => handleSort('email')} style={{ cursor: 'pointer' }}>
                    <CIcon icon={cilEnvelopeClosed} className="me-2" />
                    {t('customers.email', 'Email')} {getSortIcon('email')}
                  </CTableHeaderCell>
                  <CTableHeaderCell>{t('customers.phone', 'Phone')}</CTableHeaderCell>
                  <CTableHeaderCell>{t('customers.address', 'Address')}</CTableHeaderCell>
                  <CTableHeaderCell>{t('customers.proposalsHeader', 'Proposals')}</CTableHeaderCell>
                  <CTableHeaderCell>{t('customers.ordersHeader', 'Orders')}</CTableHeaderCell>
                  <CTableHeaderCell className="text-center">{t('customers.actions', 'Actions')}</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {sortedFilteredCustomers?.length === 0 ? (
                  <CTableRow>
                    <CTableDataCell colSpan="8" className="text-center py-5">
                      <CIcon icon={cilSearch} size="3xl" className="text-muted mb-3" />
                      <p className="mb-0">{t('customers.noResults')}</p>
                      <small className="text-muted">{t('customers.tryAdjusting')}</small>
                    </CTableDataCell>
                  </CTableRow>
                ) : (
                  sortedFilteredCustomers?.map((cust) => (
                    <CTableRow key={cust.id}>
                      <CTableDataCell>
                        <CBadge color="secondary" shape="rounded-pill">
                          {t('customers.main', 'Main')}
                        </CBadge>
                      </CTableDataCell>
                      <CTableDataCell className="fw-medium">{cust.name || 'N/A'}</CTableDataCell>
                      <CTableDataCell className="text-muted">{cust.email || 'N/A'}</CTableDataCell>
                      <CTableDataCell className="text-muted">{cust.mobile || cust.homePhone || 'No phone'}</CTableDataCell>
                      <CTableDataCell className="text-muted">{formatAddress(cust) || 'No address'}</CTableDataCell>
                      <CTableDataCell>
                        <CBadge color="info" shape="rounded-pill">
                          {t('customers.proposalsCount', { count: cust.proposalCount || 0 })}
                        </CBadge>
                      </CTableDataCell>
                      <CTableDataCell>
                        <CBadge color="success" shape="rounded-pill">
                          {t('customers.ordersCount', { count: 0 })}
                        </CBadge>
                      </CTableDataCell>
                      <CTableDataCell className="text-center">
                        <div className="d-flex justify-content-center gap-2">
                          <PermissionGate action="update" resource="customer" item={cust}>
                            <CButton
                              color="primary"
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(cust)}
                              title={t('customers.editTooltip', 'Edit customer')}
                            >
                              <CIcon icon={cilPencil} />
                            </CButton>
                          </PermissionGate>
                          <PermissionGate action="delete" resource="customer" item={cust}>
                            <CButton
                              color="danger"
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(cust.id)}
                              title={t('customers.deleteTooltip', 'Delete customer')}
                            >
                              <CIcon icon={cilTrash} />
                            </CButton>
                          </PermissionGate>
                        </div>
                      </CTableDataCell>
                    </CTableRow>
                  ))
                )}
              </CTableBody>
            </CTable>
          </CCard>
        </div>
      )}

      {/* Mobile Card Layout */}
      {!loading && !error && (
        <div className="mobile-card-view">
          {sortedFilteredCustomers?.length === 0 ? (
            <CCard>
              <CCardBody className="text-center py-5">
                <CIcon icon={cilSearch} size="3xl" className="text-muted mb-3" />
                <p className="mb-0">{t('customers.noResults')}</p>
                <small className="text-muted">{t('customers.tryAdjusting')}</small>
              </CCardBody>
            </CCard>
          ) : (
            sortedFilteredCustomers?.map((cust) => (
              <CCard key={cust.id}>
                <CCardBody>
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <div className="customer-name">{cust.name || 'N/A'}</div>
                      <CBadge color="secondary" shape="rounded-pill" className="mt-1">
                        {t('customers.main', 'Main')}
                      </CBadge>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="contact-info">
                      <CIcon icon={cilEnvelopeClosed} />
                      <span>{cust.email || 'N/A'}</span>
                    </div>
                    <div className="contact-info">
                      <CIcon icon={cilPhone} />
                      <span>{cust.mobile || cust.homePhone || 'No phone'}</span>
                    </div>
                    <div className="contact-info">
                      <CIcon icon={cilLocationPin} />
                      <span>{formatAddress(cust) || 'No address'}</span>
                    </div>
                  </div>
                  <div className="stats-pills">
                    <CBadge color="info" shape="rounded-pill">
                      {t('customers.proposalsCount', { count: cust.proposalCount || 0 })}
                    </CBadge>
                    <CBadge color="success" shape="rounded-pill">
                      {t('customers.ordersCount', { count: 0 })}
                    </CBadge>
                  </div>
                  <div className="actions">
                    <PermissionGate action="update" resource="customer" item={cust}>
                      <CButton
                        color="primary"
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(cust)}
                        className="flex-grow-1"
                      >
                        <CIcon icon={cilPencil} className="me-1" />
                        {t('common.edit')}
                      </CButton>
                    </PermissionGate>
                    <PermissionGate action="delete" resource="customer" item={cust}>
                      <CButton
                        color="danger"
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(cust.id)}
                        className="flex-grow-1"
                      >
                        <CIcon icon={cilTrash} className="me-1" />
                        {t('common.delete')}
                      </CButton>
                    </PermissionGate>
                  </div>
                </CCardBody>
              </CCard>
            ))
          )}
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && totalPages > 1 && (
        <CCard className="data-table-card mt-4">
          <CCardBody>
            <PaginationComponent
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              itemsPerPage={itemsPerPage}
            />
          </CCardBody>
        </CCard>
      )}
    </CContainer>
  );
};

export default withContractorScope(CustomerTable, 'customers');
