import React, { useState, useMemo, useEffect } from 'react';
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
import Swal from 'sweetalert2';
import axios from 'axios';
import CIcon from '@coreui/icons-react';
import { cilSearch, cilPencil, cilTrash, cilPlus, cilUser, cilEnvelopeClosed } from '@coreui/icons';
import PaginationComponent from '../../components/common/PaginationComponent';
import withContractorScope from '../../components/withContractorScope';
import PermissionGate from '../../components/PermissionGate';

const CustomerTable = ({ isContractor, contractorGroupId, contractorModules, contractorGroupName }) => {
  const dispatch = useDispatch();
  const customers = useSelector((state) => state.customers.list);
  const loading = useSelector((state) => state.customers.loading);
  const error = useSelector((state) => state.customers.error);
  const totalPages = useSelector((state) => state.customers.totalPages);
  const total = useSelector((state) => state.customers.total);
  const customization = useSelector((state) => state.customization);
  const navigate = useNavigate();

  // Function to get optimal text color for contrast
  const getContrastColor = (backgroundColor) => {
    if (!backgroundColor) return '#ffffff';
    // Convert hex to RGB
    const hex = backgroundColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Return dark color for light backgrounds, light color for dark backgrounds
    return luminance > 0.5 ? '#2d3748' : '#ffffff';
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const groupId = isContractor ? contractorGroupId : null;
    dispatch(fetchCustomers({ page: currentPage, limit: itemsPerPage, groupId }));
  }, [dispatch, currentPage, itemsPerPage, isContractor, contractorGroupId]);

  const handleSort = (key) => {
    setSortConfig((prev) => {
      const direction = prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc';
      return { key, direction };
    });
  };

  const handleEdit = (customer) => {
    navigate(`/customers/edit/${customer.id}`);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'This action cannot be undone!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'No, cancel!',
      reverseButtons: true,
    });

    if (result.isConfirmed) {
      try {
        await dispatch(deleteCustomer(id)).unwrap();
        await Swal.fire('Deleted!', 'The customer has been deleted.', 'success');
        const groupId = isContractor ? contractorGroupId : null;
        dispatch(fetchCustomers({ page: currentPage, limit: itemsPerPage, groupId }));
      } catch (err) {
        console.error('Delete error:', err);
        Swal.fire('Error!', err.message || 'Failed to delete customer. Please try again.', 'error');
      }
    } else {
      Swal.fire('Cancelled', 'The customer was not deleted.', 'info');
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
    navigate('/customers/new');
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return '↕️';
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  return (
    <CContainer fluid className="p-2 m-2 customer-listing" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header Section */}
      <CCard className="border-0 shadow-sm  mb-2" style={{ background: customization.headerBg || '#667eea', color: getContrastColor(customization.headerBg || '#667eea') }}>
        <CCardBody className="py-4">
          <CRow className="align-items-center">
            <CCol>
              <h3 className="text-white mb-1 fw-bold">Customers</h3>
              <p className="text-white-50 mb-0">Manage your customer database</p>
            </CCol>
            <CCol xs="auto">
              <PermissionGate permission="customers:create">
                <CButton 
                  color="light" 
                  className="shadow-sm px-4 fw-semibold"
                  onClick={handleNewCustomer}
                  style={{ 
                    borderRadius: '5px',
                    border: 'none',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <CIcon icon={cilPlus} className="me-2" />
                  Add Customer
                </CButton>
              </PermissionGate>
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      {/* Stats Cards */}
      <CRow className="mb-3 g-2">
        <CCol sm={6} md={3}>
          <CCard className="border-0 shadow-sm text-center h-100" style={{ borderLeft: '4px solid #667eea' }}>
            <CCardBody className="py-3">
              <div className="fs-4 fw-bold text-primary">{total || 0}</div>
              <div className="text-muted small">Total Customers</div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol sm={6} md={3}>
          <CCard className="border-0 shadow-sm text-center h-100" style={{ borderLeft: '4px solid #28a745' }}>
            <CCardBody className="py-3">
              <div className="fs-4 fw-bold text-success">{customers.filter(c => !c.deleted_at).length}</div>
              <div className="text-muted small">Active</div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol sm={6} md={3}>
          <CCard className="border-0 shadow-sm text-center h-100" style={{ borderLeft: '4px solid #ffc107' }}>
            <CCardBody className="py-3">
              <div className="fs-4 fw-bold text-warning">{customers.filter(c => c.email).length}</div>
              <div className="text-muted small">With Email</div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol sm={6} md={3}>
          <CCard className="border-0 shadow-sm text-center h-100" style={{ borderLeft: '4px solid #dc3545' }}>
            <CCardBody className="py-3">
              <div className="fs-4 fw-bold text-danger">{sortedFilteredCustomers.length}</div>
              <div className="text-muted small">Filtered Results</div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Search and Filters */}
      <CCard className="border-0 shadow-sm mb-3">
        <CCardBody className="py-3">
          <CRow className="align-items-center g-2">
            <CCol md={6}>
              <CInputGroup>
                <CInputGroupText>
                  <CIcon icon={cilSearch} />
                </CInputGroupText>
                <CFormInput
                  placeholder="Search customers by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
                  style={{ 
                    border: 'none',
                    boxShadow: 'none',
                    backgroundColor: '#f8f9fa'
                  }}
                />
              </CInputGroup>
            </CCol>
            <CCol md={3}>
              <CFormSelect
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                style={{ 
                  border: 'none',
                  boxShadow: 'none',
                  backgroundColor: '#f8f9fa'
                }}
              >
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
              </CFormSelect>
            </CCol>
            <CCol md={3}>
              <div className="text-muted small text-end">
                Showing {sortedFilteredCustomers.length} of {total} customers
                {isContractor && (
                  <div className="text-primary">({contractorGroupName})</div>
                )}
              </div>
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      {/* Loading State */}
      {loading && (
        <CCard className="border-0 shadow-sm">
          <CCardBody className="text-center py-5">
            <CSpinner color="primary" className="mb-3" />
            <p className="text-muted mb-0">Loading customers...</p>
          </CCardBody>
        </CCard>
      )}

      {/* Error State */}
      {error && (
        <CCard className="border-0 shadow-sm">
          <CCardBody>
            <div className="alert alert-danger mb-0">
              <strong>Error:</strong> {error}
            </div>
          </CCardBody>
        </CCard>
      )}

      {/* Desktop Table */}
      {!loading && !error && (
        <CCard className="border-0 shadow-sm d-none d-md-block">
          <CCardBody className="p-0">
            <div style={{ overflowX: 'auto' }}>
              <CTable hover responsive className="mb-0">
                <CTableHead style={{ backgroundColor: '#f8f9fa' }}>
                  <CTableRow>
                    <CTableHeaderCell className="border-0 fw-semibold text-muted py-3">
                      Location
                    </CTableHeaderCell>
                    <CTableHeaderCell 
                      className="border-0 fw-semibold text-muted py-3"
                      onClick={() => handleSort('name')}
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                    >
                      <div className="d-flex align-items-center gap-2">
                        <CIcon icon={cilUser} size="sm" />
                        Name
                        <span style={{ fontSize: '12px', opacity: 0.7 }}>
                          {getSortIcon('name')}
                        </span>
                      </div>
                    </CTableHeaderCell>
                    <CTableHeaderCell 
                      className="border-0 fw-semibold text-muted py-3"
                      onClick={() => handleSort('email')}
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                    >
                      <div className="d-flex align-items-center gap-2">
                        <CIcon icon={cilEnvelopeClosed} size="sm" />
                        Email
                        <span style={{ fontSize: '12px', opacity: 0.7 }}>
                          {getSortIcon('email')}
                        </span>
                      </div>
                    </CTableHeaderCell>
                    <CTableHeaderCell className="border-0 fw-semibold text-muted py-3">
                      Proposals
                    </CTableHeaderCell>
                    <CTableHeaderCell className="border-0 fw-semibold text-muted py-3">
                      Orders
                    </CTableHeaderCell>
                    <CTableHeaderCell className="border-0 fw-semibold text-muted py-3 text-center">
                      Actions
                    </CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {sortedFilteredCustomers?.length === 0 ? (
                    <CTableRow>
                      <CTableDataCell colSpan="6" className="text-center py-5">
                        <div className="text-muted">
                          <CIcon icon={cilSearch} size="xl" className="mb-3 opacity-25" />
                          <p className="mb-0">No customers found</p>
                          <small>Try adjusting your search criteria</small>
                        </div>
                      </CTableDataCell>
                    </CTableRow>
                  ) : (
                    sortedFilteredCustomers?.map((cust) => (
                      <CTableRow key={cust.id} style={{ transition: 'all 0.2s ease' }}>
                        <CTableDataCell className="py-3 border-0 border-bottom border-light">
                          <CBadge 
                            color="secondary" 
                            className="px-3 py-2"
                            style={{ 
                              borderRadius: '15px',
                              fontSize: '11px',
                              fontWeight: '500'
                            }}
                          >
                            Main
                          </CBadge>
                        </CTableDataCell>
                        <CTableDataCell className="py-3 border-0 border-bottom border-light">
                          <div className="fw-medium text-dark">
                            {cust.name || 'N/A'}
                          </div>
                        </CTableDataCell>
                        <CTableDataCell className="py-3 border-0 border-bottom border-light">
                          <span className="text-muted">
                            {cust.email || 'N/A'}
                          </span>
                        </CTableDataCell>
                        <CTableDataCell className="py-3 border-0 border-bottom border-light">
                          <CBadge 
                            color="info" 
                            className="px-3 py-2"
                            style={{ 
                              borderRadius: '20px',
                              fontSize: '12px',
                              fontWeight: '500',
                            }}
                          >
                            {cust.proposalCount || 0} Proposals
                          </CBadge>
                        </CTableDataCell>
                        <CTableDataCell className="py-3 border-0 border-bottom border-light">
                          <CBadge 
                            color="success" 
                            className="px-3 py-2"
                            style={{ 
                              borderRadius: '20px',
                              fontSize: '12px',
                              fontWeight: '500',
                            }}
                          >
                            0 Orders
                          </CBadge>
                        </CTableDataCell>
                        <CTableDataCell className="py-3 border-0 border-bottom border-light text-center">
                          <div className="d-flex justify-content-center gap-2">
                            <PermissionGate action="update" resource="customer" item={cust}>
                              <CButton
                                color="light"
                                size="sm"
                                onClick={() => handleEdit(cust)}
                                title="Edit customer"
                                className="rounded-pill d-flex align-items-center px-3"
                                style={{
                                  border: '1px solid #e0e0e0',
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                <CIcon icon={cilPencil} size="sm" className="me-1" />
                                Edit
                              </CButton>
                            </PermissionGate>
                            <PermissionGate action="delete" resource="customer" item={cust}>
                              <CButton
                                color="light"
                                size="sm"
                                onClick={() => handleDelete(cust.id)}
                                title="Delete customer"
                                className="rounded-pill d-flex align-items-center px-3"
                                style={{
                                  border: '1px solid #e0e0e0',
                                  color: '#dc3545',
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                <CIcon icon={cilTrash} size="sm" className="me-1" />
                                Delete
                              </CButton>
                            </PermissionGate>
                          </div>
                        </CTableDataCell>
                      </CTableRow>
                    ))
                  )}
                </CTableBody>
              </CTable>
            </div>
          </CCardBody>
        </CCard>
      )}

      {/* Mobile Card Layout */}
      {!loading && !error && (
        <div className="d-md-none">
          {sortedFilteredCustomers?.length === 0 ? (
            <CCard className="border-0 shadow-sm">
              <CCardBody className="text-center py-5">
                <div className="text-muted">
                  <CIcon icon={cilSearch} size="xl" className="mb-3 opacity-25" />
                  <p className="mb-0">No customers found</p>
                  <small>Try adjusting your search criteria</small>
                </div>
              </CCardBody>
            </CCard>
          ) : (
            <div className="mobile-customer-cards">
              {sortedFilteredCustomers?.map((cust) => (
                <CCard key={cust.id} className="mb-3 customer-mobile-card border-0 shadow-sm">
                  <CCardBody className="p-3">
                    {/* Header */}
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div className="d-flex align-items-center flex-grow-1 min-width-0">
                        <CIcon icon={cilUser} className="me-2 text-muted" size="lg" />
                        <div className="flex-grow-1 min-width-0">
                          <div className="fw-medium text-dark text-truncate" title={cust.name || 'N/A'}>
                            {cust.name || 'N/A'}
                          </div>
                          <CBadge 
                            color="secondary" 
                            className="px-2 py-1 mt-1"
                            style={{ 
                              borderRadius: '10px',
                              fontSize: '10px',
                              fontWeight: '500'
                            }}
                          >
                            Main
                          </CBadge>
                        </div>
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div className="mb-3">
                      <div className="small text-muted">Email</div>
                      <div className="d-flex align-items-center">
                        <CIcon icon={cilEnvelopeClosed} className="me-1 text-muted" size="sm" />
                        <span className="text-truncate-mobile text-muted" title={cust.email || 'N/A'}>
                          {cust.email || 'N/A'}
                        </span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="row g-2 mb-3">
                      <div className="col-6">
                        <CBadge 
                          color="info" 
                          className="w-100 px-2 py-2 d-flex align-items-center justify-content-center"
                          style={{ 
                            borderRadius: '15px',
                            fontSize: '11px',
                            fontWeight: '500',
                          }}
                        >
                          {cust.proposalCount || 0} Proposals
                        </CBadge>
                      </div>
                      <div className="col-6">
                        <CBadge 
                          color="success" 
                          className="w-100 px-2 py-2 d-flex align-items-center justify-content-center"
                          style={{ 
                            borderRadius: '15px',
                            fontSize: '11px',
                            fontWeight: '500',
                          }}
                        >
                          0 Orders
                        </CBadge>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="d-flex justify-content-center gap-2 customer-card-actions">
                      <PermissionGate action="update" resource="customer" item={cust}>
                        <CButton
                          color="light"
                          size="sm"
                          onClick={() => handleEdit(cust)}
                          title="Edit customer"
                          className="flex-grow-1 d-flex align-items-center justify-content-center"
                          style={{
                            border: '1px solid #e0e0e0',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <CIcon icon={cilPencil} size="sm" className="me-1" />
                          Edit
                        </CButton>
                      </PermissionGate>
                      <PermissionGate action="delete" resource="customer" item={cust}>
                        <CButton
                          color="light"
                          size="sm"
                          onClick={() => handleDelete(cust.id)}
                          title="Delete customer"
                          className="flex-grow-1 d-flex align-items-center justify-content-center"
                          style={{
                            border: '1px solid #e0e0e0',
                            color: '#dc3545',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <CIcon icon={cilTrash} size="sm" className="me-1" />
                          Delete
                        </CButton>
                      </PermissionGate>
                    </div>
                  </CCardBody>
                </CCard>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && totalPages > 1 && (
        <div className="p-3 border-top border-light">
          <PaginationComponent
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            itemsPerPage={itemsPerPage}
          />
        </div>
      )}
    </CContainer>
  );
};

export default withContractorScope(CustomerTable, 'customers');
