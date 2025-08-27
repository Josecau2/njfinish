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
import { useTranslation } from 'react-i18next';
import PageHeader from '../../../components/PageHeader';


const UsersPage = () => {
  const [filterText, setFilterText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { list: users, loading, error } = useSelector((state) => state.users);
  const { t } = useTranslation();
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
      title: t('settings.users.confirm.title'),
      text: t('settings.users.confirm.text'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: t('settings.users.confirm.confirmYes'),
      cancelButtonText: t('common.cancel'),
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await dispatch(deleteUser(id)).unwrap();
          Swal.fire(t('common.deleted') + '!', t('settings.users.confirm.deletedText'), 'success');
        } catch (error) {
          Swal.fire(t('common.error') + '!', t('settings.users.confirm.errorText'), 'error');
        }
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        Swal.fire(t('settings.users.confirm.cancelledTitle'), t('settings.users.confirm.cancelledText'), 'info');
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
    <CContainer fluid className="settings-container">
      <PageHeader 
        title={t('settings.users.header')}
        subtitle={t('settings.users.subtitle')}
        rightContent={
          <div className="d-flex gap-2">
            <CButton
              color="light"
              className="settings-action-button"
              onClick={handleCreateUser}
            >
              <CIcon icon={cilUserPlus} className="me-2" />
              {t('settings.users.addUser')}
            </CButton>
            <CButton
              color="success"
              className="settings-action-button success"
              onClick={handleCreateUserGroup}
            >
              <CIcon icon={cilSettings} className="me-2" />
              {t('settings.users.addGroup')}
            </CButton>
          </div>
        }
      />

      {/* Stats Cards */}
      <CRow className="mb-2">
        <CCol md={4}>
          <CCard className="settings-stats-card">
            <CCardBody>
              <div className="d-flex align-items-center justify-content-center mb-2">
                <div className="settings-stat-icon primary">
                  <CIcon icon={cilUser} size="lg" />
                </div>
                <div>
                  <h4 className="mb-0 fw-bold text-primary">{filteredUsers.length}</h4>
                  <small className="text-muted">{t('settings.users.stats.totalUsers')}</small>
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol md={4}>
          <CCard className="settings-stats-card">
            <CCardBody>
              <div className="d-flex align-items-center justify-content-center mb-2">
                <div className="settings-stat-icon success">
                  <CIcon icon={cilSettings} size="lg" />
                </div>
                <div>
                  <h4 className="mb-0 fw-bold text-success">{adminCount}</h4>
                  <small className="text-muted">{t('settings.users.stats.administrators')}</small>
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol md={4}>
          <CCard className="settings-stats-card">
            <CCardBody>
              <div className="d-flex align-items-center justify-content-center mb-2">
                <div className="settings-stat-icon warning">
                  <CIcon icon={cilUser} size="lg" />
                </div>
                <div>
                  <h4 className="mb-0 fw-bold text-warning">{regularCount}</h4>
                  <small className="text-muted">{t('settings.users.stats.regularUsers')}</small>
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Search Section */}
      <CCard className="settings-search-card">
        <CCardBody>
          <CRow className="align-items-center">
            <CCol md={6} lg={4}>
              <CInputGroup>
                <CInputGroupText style={{ background: 'none', border: 'none' }}>
                  <CIcon icon={cilSearch} />
                </CInputGroupText>
                <CFormInput
                  type="text"
                  placeholder={t('settings.users.searchPlaceholder')}
                  value={filterText}
                  onChange={(e) => {
                    setFilterText(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="settings-search-input"
                />
              </CInputGroup>
            </CCol>
            <CCol md={6} lg={8} className="text-md-end mt-3 mt-md-0">
              <span className="text-muted small">
                {t('settings.users.showing', { count: filteredUsers?.length || 0, total: users?.length || 0 })}
              </span>
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      {/* Error State */}
      {error && (
        <CCard className="settings-search-card">
          <CCardBody>
            <div className="alert alert-danger mb-0">
              <strong>{t('common.error')}:</strong> {t('settings.users.loadFailed')}: {error.message || error.toString() || t('common.error')}
            </div>
          </CCardBody>
        </CCard>
      )}

      {/* Loading State */}
      {loading && (
        <CCard className="settings-table-card">
          <CCardBody className="settings-empty-state">
            <CSpinner color="primary" size="lg" />
            <p className="text-muted mt-3 mb-0">{t('settings.users.loading')}</p>
          </CCardBody>
        </CCard>
      )}

      {/* Table */}
      {!loading && (
        <CCard className="settings-table-card">
          <CCardBody className="p-0">
            {/* Desktop Table View */}
            <div className="settings-table-responsive" style={{ overflowX: 'auto' }}>
              <CTable hover responsive className="mb-0">
                <CTableHead className="settings-table-header">
                  <CTableRow>
                    <CTableHeaderCell className="text-center">
                      #
                    </CTableHeaderCell>
                    <CTableHeaderCell>
                      <div className="d-flex align-items-center gap-2">
                        <CIcon icon={cilUser} size="sm" />
                        {t('settings.users.table.name')}
                      </div>
                    </CTableHeaderCell>
                    <CTableHeaderCell>
                      {t('settings.users.table.email')}
                    </CTableHeaderCell>
                    <CTableHeaderCell className="text-center">
                      {t('settings.users.table.group')}
                    </CTableHeaderCell>
                    <CTableHeaderCell className="text-center">
                      {t('settings.users.table.actions')}
                    </CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {paginatedUsers?.length === 0 ? (
                    <CTableRow>
                      <CTableDataCell colSpan="5" className="settings-empty-state">
                        <div className="text-muted">
                          <CIcon icon={cilSearch} size="xl" className="settings-empty-icon" />
                          <p className="mb-0">{t('settings.users.empty.title')}</p>
                          <small>{t('settings.users.empty.subtitle')}</small>
                        </div>
                      </CTableDataCell>
                    </CTableRow>
                  ) : (
                    paginatedUsers.map((user, index) => (
                      <CTableRow key={user.id} className="settings-table-row">
                        <CTableDataCell className="text-center">
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
                        <CTableDataCell>
                          <div className="fw-medium text-dark">
                            {user.name}
                          </div>
                        </CTableDataCell>
                        <CTableDataCell>
                          <span className="text-muted">
                            {user.email}
                          </span>
                        </CTableDataCell>
                        <CTableDataCell className="text-center">
                          {user.group ? (
                            <CBadge
                              color={getRoleColor(user.group.name)}
                              className="settings-badge"
                            >
                              {user.group.name}
                            </CBadge>
                          ) : (
                            <CBadge
                              color="secondary"
                              className="settings-badge"
                            >
                              {t('settings.users.noGroup')}
                            </CBadge>
                          )}
                        </CTableDataCell>
                        <CTableDataCell className="text-center">
                          <div className="d-flex justify-content-center gap-2">
                            <CButton
                              color="light"
                              size="sm"
                              className="settings-action-btn edit"
                              onClick={() => handleUpdateUser(user.id)}
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
                              className="settings-action-btn delete"
                              onClick={() => handleDelete(user.id)}
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

            {/* Mobile Card View */}
            <div className="settings-mobile-cards">
              {paginatedUsers?.length === 0 ? (
                <div className="settings-empty-state">
                  <div className="text-muted">
                    <CIcon icon={cilSearch} size="xl" className="settings-empty-icon" />
                    <p className="mb-0">{t('settings.users.empty.title')}</p>
                    <small>{t('settings.users.empty.subtitle')}</small>
                  </div>
                </div>
              ) : (
                paginatedUsers.map((user, index) => (
                  <div key={user.id} className="settings-mobile-card">
                    <div className="settings-mobile-card-header">
                      <div className="d-flex justify-content-between align-items-center">
                        <span>#{startIdx + index}</span>
                        <CBadge
                          color={user.group ? getRoleColor(user.group.name) : 'secondary'}
                          className="settings-badge"
                        >
                          {user.group ? user.group.name : t('settings.users.noGroup')}
                        </CBadge>
                      </div>
                    </div>
                    <div className="settings-mobile-card-body">
                      <div className="settings-mobile-field">
                        <span className="settings-mobile-label">{t('settings.users.table.name')}</span>
                        <span className="settings-mobile-value fw-medium">{user.name}</span>
                      </div>
                      <div className="settings-mobile-field">
                        <span className="settings-mobile-label">{t('settings.users.table.email')}</span>
                        <span className="settings-mobile-value text-muted">{user.email}</span>
                      </div>
                    </div>
                    <div className="settings-mobile-actions">
                      <CButton
                        color="light"
                        size="sm"
                        className="settings-action-btn edit"
                        onClick={() => handleUpdateUser(user.id)}
                      >
                        <CIcon icon={cilPencil} size="sm" style={{ color: '#0d6efd' }} />
                      </CButton>
                      <CButton
                        color="light"
                        size="sm"
                        className="settings-action-btn delete"
                        onClick={() => handleDelete(user.id)}
                      >
                        <CIcon icon={cilTrash} size="sm" style={{ color: '#dc3545' }} />
                      </CButton>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination */}
            <div className="settings-pagination">
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