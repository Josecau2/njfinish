import { useEffect, useState } from 'react';
import {
  CFormInput, CFormSelect,
  CTable, CTableBody, CTableHead, CTableRow, CTableHeaderCell, CTableDataCell,
  CSpinner, CContainer, CRow, CCol, CCard, CCardBody, CBadge,
  CInputGroup, CInputGroupText, CButton
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilPencil, cilTrash, cilPlus, cilSearch, cilLocationPin, cilEnvelopeClosed, cilGlobeAlt } from '@coreui/icons';
import PaginationControls from '../../../components/PaginationControls';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { deleteLocation, fetchLocations } from '../../../store/slices/locationSlice';
import Swal from 'sweetalert2';
import { FaMapMarkerAlt } from "react-icons/fa";

const LocationPage = () => {
  const [filterText, setFilterText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { list: locations, loading, error } = useSelector((state) => state.locations);

  useEffect(() => {
    dispatch(fetchLocations());
  }, [dispatch]);

  const filteredData = locations.filter((u) => {
    const email = (u.email || '').toLowerCase();
    const name = (u.locationName || '').toLowerCase();
    const search = filterText.toLowerCase();

    return email.includes(search) || name.includes(search);
  });

  const totalPages = Math.ceil((filteredData.length || 0) / itemsPerPage);
  const paginatedLocation = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const startIdx = filteredData.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endIdx = Math.min(currentPage * itemsPerPage, filteredData.length);

  const handleCreateUser = () => {
    navigate("/settings/locations/create");
  }

  const handleDelete = (id) => {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you really want to delete this location?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await dispatch(deleteLocation(id)).unwrap();
          Swal.fire('Deleted!', 'The Location has been deleted.', 'success');
        } catch (error) {
          Swal.fire('Error!', 'Failed to delete the Location.', 'error');
        }
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        Swal.fire('Cancelled', 'The Location is safe.', 'info');
      }
    });
  };

  const handleUpdateLocation = (id) => {
    navigate(`/settings/locations/edit/${id}`);
  }

  return (
    <CContainer fluid className="p-2 m-2" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header Section */}
      <CCard className="border-0 shadow-sm mb-2" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <CCardBody className="py-4">
          <CRow className="align-items-center">
            <CCol>
              <div className="d-flex align-items-center gap-3">
                <div 
                  className="d-flex align-items-center justify-content-center"
                  style={{
                    width: '48px',
                    height: '48px',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '12px'
                  }}
                >
                  <FaMapMarkerAlt className="text-white" style={{ fontSize: '24px' }} />
                </div>
                <div>
                  <h3 className="text-white mb-1 fw-bold">Locations</h3>
                  <p className="text-white-50 mb-0">Manage your business locations</p>
                </div>
              </div>
            </CCol>
            <CCol xs="auto">
              <CButton 
                color="light" 
                className="shadow-sm px-4 fw-semibold"
                onClick={handleCreateUser}
                style={{ 
                  borderRadius: '5px',
                  border: 'none',
                  transition: 'all 0.3s ease'
                }}
              >
                <CIcon icon={cilPlus} className="me-2" />
                Add Location
              </CButton>
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      {/* Search and Stats */}
      <CCard className="border-0 shadow-sm mb-1">
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
                  value={filterText}
                  onChange={(e) => {
                    setFilterText(e.target.value);
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
                  Total: {locations?.length || 0} locations
                </CBadge>
                <span className="text-muted small">
                  Showing {filteredData?.length || 0} results
                </span>
              </div>
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      {/* Error State */}
      {error && (
        <CCard className="border-0 shadow-sm">
          <CCardBody>
            <div className="alert alert-danger mb-0">
              <strong>Error:</strong> Failed to load locations: {error}
            </div>
          </CCardBody>
        </CCard>
      )}

      {/* Loading State */}
      {loading && (
        <CCard className="border-0 shadow-sm">
          <CCardBody className="text-center py-5">
            <CSpinner color="primary" size="lg" />
            <p className="text-muted mt-3 mb-0">Loading locations...</p>
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
                      #
                    </CTableHeaderCell>
                    <CTableHeaderCell className="border-0 fw-semibold text-muted py-3">
                      <div className="d-flex align-items-center gap-2">
                        <CIcon icon={cilLocationPin} size="sm" />
                        Location Name
                      </div>
                    </CTableHeaderCell>
                    <CTableHeaderCell className="border-0 fw-semibold text-muted py-3">
                      Address
                    </CTableHeaderCell>
                    <CTableHeaderCell className="border-0 fw-semibold text-muted py-3">
                      <div className="d-flex align-items-center gap-2">
                        <CIcon icon={cilEnvelopeClosed} size="sm" />
                        Email
                      </div>
                    </CTableHeaderCell>
                    <CTableHeaderCell className="border-0 fw-semibold text-muted py-3">
                      <div className="d-flex align-items-center gap-2">
                        <CIcon icon={cilGlobeAlt} size="sm" />
                        Website
                      </div>
                    </CTableHeaderCell>
                    <CTableHeaderCell className="border-0 fw-semibold text-muted py-3 text-center">
                      Actions
                    </CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {filteredData?.length === 0 ? (
                    <CTableRow>
                      <CTableDataCell colSpan="6" className="text-center py-5">
                        <div className="text-muted">
                          <CIcon icon={cilLocationPin} size="xl" className="mb-3 opacity-25" />
                          <p className="mb-0">No locations found</p>
                          <small>Try adjusting your search criteria or add a new location</small>
                        </div>
                      </CTableDataCell>
                    </CTableRow>
                  ) : (
                    paginatedLocation?.map((location, index) => (
                      <CTableRow key={location.id} style={{ transition: 'all 0.2s ease' }}>
                        <CTableDataCell className="py-3 border-0 border-bottom border-light">
                          <CBadge 
                            color="secondary" 
                            className="px-2 py-1"
                            style={{ 
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: '500'
                            }}
                          >
                            {startIdx + index}
                          </CBadge>
                        </CTableDataCell>
                        <CTableDataCell className="py-3 border-0 border-bottom border-light">
                          <div className="fw-medium text-dark">
                            {location.locationName || 'N/A'}
                          </div>
                        </CTableDataCell>
                        <CTableDataCell className="py-3 border-0 border-bottom border-light">
                          <span className="text-muted small">
                            {location.address || 'N/A'}
                          </span>
                        </CTableDataCell>
                        <CTableDataCell className="py-3 border-0 border-bottom border-light">
                          {location.email ? (
                            <a
                              href={`mailto:${location.email}`}
                              className="text-decoration-none"
                              style={{ color: '#0d6efd' }}
                              onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                              onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                            >
                              {location.email}
                            </a>
                          ) : (
                            <span className="text-muted">N/A</span>
                          )}
                        </CTableDataCell>
                        <CTableDataCell className="py-3 border-0 border-bottom border-light">
                          {location.website ? (
                            <a
                              href={location.website?.startsWith('http') ? location.website : `https://${location.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-decoration-none"
                              style={{ color: '#0d6efd' }}
                              onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                              onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                            >
                              {location.website}
                            </a>
                          ) : (
                            <span className="text-muted">N/A</span>
                          )}
                        </CTableDataCell>
                        <CTableDataCell className="py-3 border-0 border-bottom border-light text-center">
                          <div className="d-flex justify-content-center gap-2">
                            <CButton
                              color="light"
                              size="sm"
                              className="p-2"
                              onClick={() => handleUpdateLocation(location.id)}
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
                              onClick={() => handleDelete(location.id)}
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
            {totalPages > 1 && (
              <div className="p-3 border-top border-light">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                  {/* Left: Showing info */}
                  <div className="text-muted small">
                    Showing {filteredData.length === 0 ? 0 : startIdx}–{endIdx} of {filteredData.length} locations
                  </div>

                  {/* Center: Pagination arrows */}
                  <div className="d-flex justify-content-center flex-grow-1">
                    <PaginationControls
                      page={currentPage}
                      totalPages={totalPages}
                      goPrev={() => handlePageChange(currentPage - 1)}
                      goNext={() => handlePageChange(currentPage + 1)}
                    />
                  </div>

                  {/* Right: Items per page selector */}
                  <div style={{ width: '120px' }}>
                    <CFormSelect
                      size="sm"
                      value={itemsPerPage}
                      onChange={handleItemsPerPageChange}
                      style={{ 
                        borderRadius: '6px',
                        fontSize: '12px'
                      }}
                    >
                      {[5, 10, 15, 20, 25].map((val) => (
                        <option key={val} value={val}>
                          Show {val}
                        </option>
                      ))}
                    </CFormSelect>
                  </div>
                </div>
              </div>
            )}
          </CCardBody>
        </CCard>
      )}
    </CContainer>
  );
};

export default LocationPage;