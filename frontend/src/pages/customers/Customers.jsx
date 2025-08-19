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
import { fetchCustomers } from '../../store/slices/customerSlice';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import axios from 'axios';
import CIcon from '@coreui/icons-react';
import { cilSearch, cilPencil, cilTrash, cilPlus, cilUser, cilEnvelopeClosed } from '@coreui/icons';
import PaginationComponent from '../../components/common/PaginationComponent';

const CustomerTable = () => {
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
    dispatch(fetchCustomers({ page: currentPage, limit: itemsPerPage }));
  }, [dispatch, currentPage, itemsPerPage]);

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
        const api_url = import.meta.env.VITE_API_URL;
        await axios.delete(`${api_url}/api/customers/delete/${id}`);

        await Swal.fire('Deleted!', 'The customer has been deleted.', 'success');
        dispatch(fetchCustomers({ page: currentPage, limit: itemsPerPage }));
      } catch (err) {
        Swal.fire('Error!', 'Failed to delete customer. Please try again.', 'error');
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

  const handleNewCustomer = () => {
    navigate('/customers/add');
  };

  const startIdx = total === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endIdx = Math.min(startIdx + itemsPerPage - 1, total);

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return '↕️';
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  return (
    <CContainer fluid className="p-2 m-2 customer-listing" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header Section */}
      <CCard className="border-0 shadow-sm  mb-2" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <CCardBody className="py-4">
          <CRow className="align-items-center">
            <CCol>
              <h3 className="text-white mb-1 fw-bold">Customers</h3>
              <p className="text-white-50 mb-0">Manage your customer database</p>
            </CCol>
            <CCol xs="auto">
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
                New Customer
              </CButton>
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      {/* Search and Stats */}
      <CCard className="border-0 shadow-sm  mb-1 ">
        <CCardBody>
          <CRow className="align-items-center">
            <CCol md={6} lg={4}>
              <CInputGroup>
                <CInputGroupText style={{ background: 'none', border: 'none' }}>
                  <CIcon icon={cilSearch} />
                </CInputGroupText>
                <CFormInput
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value.toLowerCase());
                    setCurrentPage(1);
                  }}
                  style={{ 
                    border: '1px solid #e3e6f0',
                    borderRadius: '10px',
                    fontSize: '14px',
                    padding: '12px 16px'
                  }}
                />
              </CInputGroup>
            </CCol>
            <CCol md={6} lg={8} className="text-md-end mt-3 mt-md-0">
              <div className="d-flex justify-content-md-end align-items-center gap-3">
                <CBadge 
                  color="info" 
                  className="px-3 py-2"
                  style={{ 
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}
                >
                  Total: {total || 0} customers
                </CBadge>
                <span className="text-muted small">
                  Showing {sortedFilteredCustomers?.length || 0} results
                </span>
              </div>
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      {/* Loading State */}
      {loading && (
        <CCard className="border-0 shadow-sm">
          <CCardBody className="text-center py-5">
            <CSpinner color="primary" size="lg" />
            <p className="text-muted mt-3 mb-0">Loading customers...</p>
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

      {/* Table */}
      {!loading && !error && (
        <CCard className="border-0 shadow-sm">
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
                              // backgroundColor: '#e7f3ff',
                              // color: '#0d6efd'
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
                              // backgroundColor: '#e6ffed',
                              // color: '#28a745'
                            }}
                          >
                            0 Orders
                          </CBadge>
                        </CTableDataCell>
                        <CTableDataCell className="py-3 border-0 border-bottom border-light text-center">
                          <div className="d-flex justify-content-center gap-2">
                            <CButton
                              color="light"
                              size="sm"
                              className="p-2"
                              onClick={() => handleEdit(cust)}
                              style={{
                                borderRadius: '8px',
                                border: '1px solid #e3e6f0',
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#e7f3ff';
                                e.currentTarget.style.borderColor = '#0d6efd';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '';
                                e.currentTarget.style.borderColor = '#e3e6f0';
                              }}
                            >
                              <CIcon
                                icon={cilPencil}
                                size="sm"
                                style={{ color: '#0d6efd' }}
                              />
                            </CButton>

                            <CButton
                              color="light"
                              size="sm"
                              className="p-2"
                              onClick={() => handleDelete(cust.id)}
                              style={{
                                borderRadius: '8px',
                                border: '1px solid #e3e6f0',
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#ffe6e6';
                                e.currentTarget.style.borderColor = '#dc3545';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '';
                                e.currentTarget.style.borderColor = '#e3e6f0';
                              }}
                            >
                              <CIcon
                                icon={cilTrash}
                                size="sm"
                                style={{ color: '#dc3545' }}
                              />
                            </CButton>
                          </div>
                        </CTableDataCell>
                      </CTableRow>
                    ))
                  )}
                </CTableBody>
              </CTable>
            </div>
            
            {/* Pagination */}
            
              <div className="p-3 border-top border-light">
                <PaginationComponent
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  itemsPerPage={itemsPerPage}
                />
              </div>
            
          </CCardBody>
        </CCard>
      )}
    </CContainer>
  );
};

export default CustomerTable;