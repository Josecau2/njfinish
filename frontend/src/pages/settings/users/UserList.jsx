import { useEffect, useState } from 'react';
import {
  CFormInput,
  CFormSelect,
  CTable,
  CTableBody,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableDataCell,
  CSpinner,
  CContainer,
  CRow,
  CCol,
  CCard,
  CCardBody,
  CBadge,
  CButton,
  CInputGroup,
  CInputGroupText,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilPencil, cilTrash, cilSearch, cilUser, cilUserPlus, cilSettings } from '@coreui/icons';
import PaginationControls from '../../../components/PaginationControls';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { deleteUser, fetchUsers } from '../../../store/slices/userSlice';
import Swal from 'sweetalert2';
import PaginationComponent from '../../../components/common/PaginationComponent';


const UsersPage = () => {
  const [filterText, setFilterText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { list: users, loading, error } = useSelector((state) => state.users);
  const loggedInUser = JSON.parse(localStorage.getItem('user'));
  let loggedInUserId = loggedInUser.userId

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  const filteredUsers = users
    .filter(u => u && u.name && u.email)
    .filter(u => u.id !== loggedInUserId)
    .filter(
      (u) =>
        u.name.toLowerCase().includes(filterText.toLowerCase()) ||
        u.email.toLowerCase().includes(filterText.toLowerCase())
    );

  const totalPages = Math.ceil((filteredUsers.length || 0) / itemsPerPage);
  const paginatedUsers = filteredUsers?.slice(
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

  const startIdx = (currentPage - 1) * itemsPerPage + 1;
  const endIdx = Math.min(currentPage * itemsPerPage, filteredUsers.length);

  const handleCreateUser = () => {
    navigate("/settings/users/create");
  }

  const handleCreateUserGroup = () => {
    navigate("/settings/users/group/create");
  }

  const handleUpdateUser = (id) => {
    navigate(`/settings/users/edit/${id}`);
  }

  const handleDelete = (id) => {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you really want to delete this user?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await dispatch(deleteUser(id)).unwrap();
          Swal.fire('Deleted!', 'The user has been deleted.', 'success');
        } catch (error) {
          Swal.fire('Error!', 'Failed to delete the user.', 'error');
        }
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        Swal.fire('Cancelled', 'The user is safe.', 'info');
      }
    });
  };

  const getRoleColor = (role) => {
    const roleColors = {
      'Admin': 'primary',
      'Manager': 'success',
      'User': 'secondary',
      'Editor': 'warning'
    };
    return roleColors[role] || 'secondary';
  };

  const adminCount = filteredUsers.filter(user => user.role === 'Admin').length;
  const regularCount = filteredUsers.filter(user => user.role !== 'Admin').length;

  return (
    <CContainer fluid className="p-2 m-2" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header Section */}
      <CCard className="border-0 shadow-sm mb-2" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <CCardBody className="py-4">
          <CRow className="align-items-center">
            <CCol>
              <h3 className="text-white mb-1 fw-bold">User Management</h3>
              <p className="text-white-50 mb-0">Manage users and user groups in your system</p>
            </CCol>
            <CCol xs="auto">
              <div className="d-flex gap-2">
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
                  <CIcon icon={cilUserPlus} className="me-2" />
                  Add User
                </CButton>
                <CButton
                  color="success"
                  className="shadow-sm px-4 fw-semibold"
                  onClick={handleCreateUserGroup}
                  style={{
                    borderRadius: '5px',
                    border: 'none',
                    background: 'linear-gradient(45deg, #28a745, #20c997)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <CIcon icon={cilSettings} className="me-2" />
                  Add Group
                </CButton>
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
                    backgroundColor: '#e7f3ff',
                    color: '#0d6efd'
                  }}
                >
                  <CIcon icon={cilUser} size="lg" />
                </div>
                <div>
                  <h4 className="mb-0 fw-bold text-primary">{filteredUsers.length}</h4>
                  <small className="text-muted">Total Users</small>
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
                    backgroundColor: '#e6ffed',
                    color: '#28a745'
                  }}
                >
                  <CIcon icon={cilSettings} size="lg" />
                </div>
                <div>
                  <h4 className="mb-0 fw-bold text-success">{adminCount}</h4>
                  <small className="text-muted">Administrators</small>
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
                    backgroundColor: '#fff3cd',
                    color: '#856404'
                  }}
                >
                  <CIcon icon={cilUser} size="lg" />
                </div>
                <div>
                  <h4 className="mb-0 fw-bold text-warning">{regularCount}</h4>
                  <small className="text-muted">Regular Users</small>
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
              <span className="text-muted small">
                Showing {filteredUsers?.length || 0} of {users?.length || 0} users
              </span>
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      {/* Error State */}
      {error && (
        <CCard className="border-0 shadow-sm mb-4">
          <CCardBody>
            <div className="alert alert-danger mb-0">
              <strong>Error:</strong> Failed to load users: {error}
            </div>
          </CCardBody>
        </CCard>
      )}

      {/* Loading State */}
      {loading && (
        <CCard className="border-0 shadow-sm">
          <CCardBody className="text-center py-5">
            <CSpinner color="primary" size="lg" />
            <p className="text-muted mt-3 mb-0">Loading users...</p>
          </CCardBody>
        </CCard>
      )}

      {/* Table */}
      {!loading && (
        <CCard className="border-0 shadow-sm">
          <CCardBody className="p-0">
            <div style={{ overflowX: 'auto' }}>
              <CTable hover responsive className="mb-0">
                <CTableHead style={{ backgroundColor: '#f8f9fa' }}>
                  <CTableRow>
                    <CTableHeaderCell className="border-0 fw-semibold text-muted py-3 text-center">
                      #
                    </CTableHeaderCell>
                    <CTableHeaderCell className="border-0 fw-semibold text-muted py-3">
                      <div className="d-flex align-items-center gap-2">
                        <CIcon icon={cilUser} size="sm" />
                        Name
                      </div>
                    </CTableHeaderCell>
                    <CTableHeaderCell className="border-0 fw-semibold text-muted py-3">
                      Email
                    </CTableHeaderCell>
                    <CTableHeaderCell className="border-0 fw-semibold text-muted py-3 text-center">
                      User Group
                    </CTableHeaderCell>
                    <CTableHeaderCell className="border-0 fw-semibold text-muted py-3 text-center">
                      Actions
                    </CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {paginatedUsers?.length === 0 ? (
                    <CTableRow>
                      <CTableDataCell colSpan="5" className="text-center py-5">
                        <div className="text-muted">
                          <CIcon icon={cilSearch} size="xl" className="mb-3 opacity-25" />
                          <p className="mb-0">No users found</p>
                          <small>Try adjusting your search criteria</small>
                        </div>
                      </CTableDataCell>
                    </CTableRow>
                  ) : (
                    paginatedUsers.map((user, index) => (
                      <CTableRow key={user.id} style={{ transition: 'all 0.2s ease' }}>
                        <CTableDataCell className="py-3 border-0 border-bottom border-light text-center">
                          <CBadge
                            color="light"
                            className="px-2 py-1"
                            style={{
                              borderRadius: '15px',
                              fontSize: '11px',
                              fontWeight: '500',
                              color: '#6c757d'
                            }}
                          >
                            {startIdx + index}
                          </CBadge>
                        </CTableDataCell>
                        <CTableDataCell className="py-3 border-0 border-bottom border-light">
                          <div className="fw-medium text-dark">
                            {user.name}
                          </div>
                        </CTableDataCell>
                        <CTableDataCell className="py-3 border-0 border-bottom border-light">
                          <span className="text-muted">
                            {user.email}
                          </span>
                        </CTableDataCell>
                        <CTableDataCell className="py-3 border-0 border-bottom border-light text-center">
                          <CBadge
                            color={getRoleColor(user.role)}
                            className="px-3 py-2"
                            style={{
                              borderRadius: '20px',
                              fontSize: '12px',
                              fontWeight: '500'
                            }}
                          >
                            {user.role}
                          </CBadge>
                        </CTableDataCell>
                        <CTableDataCell className="py-3 border-0 border-bottom border-light text-center">
                          <div className="d-flex justify-content-center gap-2">
                            <CButton
                              color="light"
                              size="sm"
                              className="p-2"
                              onClick={() => handleUpdateUser(user.id)}
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
                              onClick={() => handleDelete(user.id)}
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

export default UsersPage;