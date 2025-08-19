import { useEffect, useState } from 'react';
import {
  CCard, 
  CCardBody, 
  CCardHeader, 
  CTableDataCell,
  CTable, 
  CTableBody, 
  CTableHead, 
  CTableRow, 
  CTableHeaderCell,
  CFormSwitch,
  CContainer,
  CRow,
  CCol,
  CBadge,
  CButton,
  CFormInput,
  CInputGroup,
  CInputGroupText,
} from '@coreui/react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchManufacturers } from '../../../store/slices/manufacturersSlice';
import CIcon from '@coreui/icons-react';
import { cilPencil, cilSearch, cilSettings, cilUser } from '@coreui/icons';
import EditGroupModal from '../../../components/model/EditGroupModal';
import {
  fetchMultiManufacturers,
  updateMultiManufacturer,
} from '../../../store/slices/manufacturersMultiplierSlice';
import Swal from 'sweetalert2';
import PaginationComponent from '../../../components/common/PaginationComponent';

import { fetchUsers } from '../../../store/slices/userGroupSlice';

const ManuMultipliers = () => {
  const dispatch = useDispatch();
  const { list: usersGroup = [] } = useSelector((state) => state.usersGroup || {});
  const { list: multiManufacturers = [] } = useSelector((state) => state.multiManufacturer || {});

  const [filterText, setFilterText] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortDirection, setSortDirection] = useState('desc');
  const [showModal, setShowModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    dispatch(fetchUsers());
    dispatch(fetchMultiManufacturers());
  }, [dispatch]);

  const toggleEnabled = (id, currentEnabled) => {
    const updatedData = { enabled: !currentEnabled };
    dispatch(updateMultiManufacturer({ id, data: updatedData }))
      .unwrap()
      .then(() => {
        dispatch(fetchMultiManufacturers());
        dispatch(fetchUsers());
        Swal.fire({
          toast: true,
          position: 'top',
          icon: 'success',
          title: 'Manufacturer updated successfully',
          showConfirmButton: false,
          timer: 1500,
          width: '360px',
          didOpen: (toast) => {
            toast.style.padding = '8px 12px';
            toast.style.fontSize = '14px';
            toast.style.minHeight = 'auto';
          },
        });
      })
      .catch((err) => {
        console.error('Toggle failed:', err);
        Swal.fire({
          toast: true,
          position: 'top',
          icon: 'error',
          title: 'Failed to update manufacturer',
          showConfirmButton: false,
          timer: 1500,
          width: '330px',
          didOpen: (toast) => {
            toast.style.padding = '8px 12px';
            toast.style.fontSize = '14px';
            toast.style.minHeight = 'auto';
          },
        });
      });
  };

  const handleEdit = (group) => {
    setSelectedGroup(group);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedGroup(null);
  };

  const handleSave = (updatedData) => {
    if (!selectedGroup?.id) return;
    dispatch(updateMultiManufacturer({ id: selectedGroup.id, data: updatedData }))
      .unwrap()
      .then((res) => {
        setShowModal(false);
        setSelectedGroup(null);
        Swal.fire('Success!', res.message || 'Manufacturer updated successfully', 'success');
        dispatch(fetchMultiManufacturers());
        dispatch(fetchUsers());
      })
      .catch((err) => {
        console.error('Update failed', err);
        Swal.fire('Error', err.message || 'Failed to update manufacturer', 'error');
      });
  };

  // Filter groups based on search term
  const filteredGroups = usersGroup.filter((group) => {
    const groupName = group.user_group?.name || '';
    return groupName.toLowerCase().includes(filterText.toLowerCase());
  });

  const startIdx = (currentPage - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const paginatedGroups = filteredGroups.slice(startIdx, endIdx);
  const totalPages = Math.ceil(filteredGroups.length / itemsPerPage);

  const enabledCount = usersGroup.filter(group => group.enabled === 1).length;
  const disabledCount = usersGroup.length - enabledCount;

  return (
    <CContainer fluid className="p-2 m-2" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header Section */}
      <CCard className="border-0 shadow-sm mb-2" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <CCardBody className="py-4">
          <CRow className="align-items-center">
            <CCol>
              <h3 className="text-white mb-1 fw-bold">User Group Multipliers</h3>
              <p className="text-white-50 mb-0">Manage pricing multipliers for different user groups</p>
            </CCol>
            <CCol xs="auto">
              <div className="d-flex gap-2 align-items-center">
                <CBadge 
                  color="light" 
                  className="px-3 py-2"
                  style={{ 
                    borderRadius: '5px',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#6c757d'
                  }}
                >
                  <CIcon icon={cilUser} className="me-1" size="sm" />
                  {usersGroup.length} Groups
                </CBadge>
              </div>
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      {/* Stats Cards */}
      <CRow className="mb-2">
        <CCol md={4}>
          <CCard className="border-0 shadow-sm h-100">
            <CCardBody className="text-center py-4">
              <div className="d-flex align-items-center justify-content-center mb-2">
                <div 
                  className="rounded-circle d-flex align-items-center justify-content-center me-3"
                  style={{ 
                    width: '50px', 
                    height: '50px', 
                    backgroundColor: '#e6ffed',
                    color: '#28a745'
                  }}
                >
                  <CIcon icon={cilSettings} size="lg" />
                </div>
                <div>
                  <h4 className="mb-0 fw-bold text-success">{enabledCount}</h4>
                  <small className="text-muted">Active Groups</small>
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol md={4}>
          <CCard className="border-0 shadow-sm h-100">
            <CCardBody className="text-center py-4">
              <div className="d-flex align-items-center justify-content-center mb-2">
                <div 
                  className="rounded-circle d-flex align-items-center justify-content-center me-3"
                  style={{ 
                    width: '50px', 
                    height: '50px', 
                    backgroundColor: '#ffe6e6',
                    color: '#dc3545'
                  }}
                >
                  <CIcon icon={cilSettings} size="lg" />
                </div>
                <div>
                  <h4 className="mb-0 fw-bold text-danger">{disabledCount}</h4>
                  <small className="text-muted">Inactive Groups</small>
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol md={4}>
          <CCard className="border-0 shadow-sm h-100">
            <CCardBody className="text-center py-4">
              <div className="d-flex align-items-center justify-content-center mb-2">
                <div 
                  className="rounded-circle d-flex align-items-center justify-content-center me-3"
                  style={{ 
                    width: '50px', 
                    height: '50px', 
                    backgroundColor: '#e7f3ff',
                    color: '#0d6efd'
                  }}
                >
                  <CIcon icon={cilUser} size="lg" />
                </div>
                <div>
                  <h4 className="mb-0 fw-bold text-primary">{usersGroup.length}</h4>
                  <small className="text-muted">Total Groups</small>
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Search Section */}
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
                  placeholder="Search by group name..."
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
              <span className="text-muted small">
                Showing {filteredGroups?.length || 0} of {usersGroup?.length || 0} groups
              </span>
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      {/* Table */}
      <CCard className="border-0 shadow-sm">
        <CCardBody className="p-0">
          <div style={{ overflowX: 'auto' }}>
            <CTable hover responsive className="mb-0">
              <CTableHead style={{ backgroundColor: '#f8f9fa' }}>
                <CTableRow>
                  <CTableHeaderCell className="border-0 fw-semibold text-muted py-3">
                    <div className="d-flex align-items-center gap-2">
                      <CIcon icon={cilUser} size="sm" />
                      Group Name
                    </div>
                  </CTableHeaderCell>
                  <CTableHeaderCell className="border-0 fw-semibold text-muted py-3">
                    Multiplier
                  </CTableHeaderCell>
                  <CTableHeaderCell className="border-0 fw-semibold text-muted py-3">
                    Status
                  </CTableHeaderCell>
                  <CTableHeaderCell className="border-0 fw-semibold text-muted py-3 text-center">
                    Actions
                  </CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {paginatedGroups?.length === 0 ? (
                  <CTableRow>
                    <CTableDataCell colSpan="4" className="text-center py-5">
                      <div className="text-muted">
                        <CIcon icon={cilSearch} size="xl" className="mb-3 opacity-25" />
                        <p className="mb-0">No groups found</p>
                        <small>Try adjusting your search criteria</small>
                      </div>
                    </CTableDataCell>
                  </CTableRow>
                ) : (
                  paginatedGroups.map((group) => (
                    <CTableRow key={group.id} style={{ transition: 'all 0.2s ease' }}>
                      <CTableDataCell className="py-3 border-0 border-bottom border-light">
                        <div className="fw-medium text-dark">
                          {group.user_group?.name || 'N/A'}
                        </div>
                      </CTableDataCell>
                      <CTableDataCell className="py-3 border-0 border-bottom border-light">
                        <CBadge 
                          color="primary" 
                          className="px-3 py-2"
                          style={{ 
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '600',
                            // backgroundColor: '#e7f3ff',
                            // color: '#0d6efd'
                          }}
                        >
                          {group.multiplier ? `${group.multiplier}` : 'N/A'}
                        </CBadge>
                      </CTableDataCell>
                      <CTableDataCell className="py-3 border-0 border-bottom border-light">
                        <div className="d-flex align-items-center gap-2">
                          <CFormSwitch
                            checked={group.enabled === 1}
                            onChange={() => toggleEnabled(group.id, group.enabled)}
                            style={{ 
                              transform: 'scale(1.1)',
                            }}
                          />
                          <CBadge 
                            color={group.enabled === 1 ? 'success' : 'secondary'} 
                            className="px-2 py-1"
                            style={{ 
                              borderRadius: '15px',
                              fontSize: '10px',
                              fontWeight: '500'
                            }}
                          >
                            {group.enabled === 1 ? 'Active' : 'Inactive'}
                          </CBadge>
                        </div>
                      </CTableDataCell>
                      <CTableDataCell className="py-3 border-0 border-bottom border-light text-center">
                        <CButton
                          color="light"
                          size="sm"
                          className="p-2"
                          onClick={() => handleEdit(group)}
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
                      </CTableDataCell>
                    </CTableRow>
                  ))
                )}
              </CTableBody>
            </CTable>
          </div>
          
          {/* Pagination */}
              <PaginationComponent
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
        </CCardBody>
      </CCard>

      <EditGroupModal
        show={showModal}
        onClose={handleCloseModal}
        manufacturer={selectedGroup}
        onSave={handleSave}
      />
    </CContainer>
  );
};

export default ManuMultipliers;