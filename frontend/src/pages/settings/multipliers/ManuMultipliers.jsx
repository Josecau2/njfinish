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
import { getContrastColor } from '../../../utils/colorUtils';
import CIcon from '@coreui/icons-react';
import { cilPencil, cilSearch, cilSettings, cilUser } from '@coreui/icons';
import EditGroupModal from '../../../components/model/EditGroupModal';
import {
  fetchMultiManufacturers,
  updateMultiManufacturer,
  createMultiManufacturer,
} from '../../../store/slices/manufacturersMultiplierSlice';
import Swal from 'sweetalert2';
import PaginationComponent from '../../../components/common/PaginationComponent';
import PageHeader from '../../../components/PageHeader';

import { fetchUserMultipliers, fetchUsers } from '../../../store/slices/userGroupSlice';
import { useTranslation } from 'react-i18next';

const ManuMultipliers = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { list: usersGroup = [], allGroups = [] } = useSelector((state) => state.usersGroup || {});
  const { list: multiManufacturers = [] } = useSelector((state) => state.multiManufacturer || {});
  const customization = useSelector((state) => state.customization);

  const [filterText, setFilterText] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortDirection, setSortDirection] = useState('desc');
  const [showModal, setShowModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    dispatch(fetchUsers()); // Fetch all user groups
    dispatch(fetchUserMultipliers()); // Fetch existing multipliers
    dispatch(fetchMultiManufacturers());
  }, [dispatch]);

  // Merge all user groups with their multiplier data
  const mergedGroups = allGroups.map(group => {
    // Find if this group has a multiplier entry
    const multiplierEntry = usersGroup.find(mg => mg.user_group?.id === group.id);
    
    return {
      id: multiplierEntry?.id || null, // ID from UserGroupMultiplier table (null if no entry exists)
      user_group: group, // Full group data
      multiplier: multiplierEntry?.multiplier || null,
      enabled: multiplierEntry?.enabled || 0, // Default to disabled if no entry
    };
  }).filter(group => group.user_group.id !== 2); // Exclude Admin group (ID 2)

  const toggleEnabled = (group, currentEnabled) => {
    const updatedData = { enabled: !currentEnabled };
    
    // If group doesn't have an ID (no multiplier entry exists), we need to create one
    if (!group.id) {
      updatedData.user_group_id = group.user_group.id;
      updatedData.multiplier = 1.0; // Default multiplier
      
      // Create new multiplier entry
      dispatch(createMultiManufacturer(updatedData))
        .unwrap()
        .then(() => {
          dispatch(fetchMultiManufacturers());
          dispatch(fetchUserMultipliers());
          Swal.fire({
            toast: true,
            position: 'top',
            icon: 'success',
            title: t('settings.userGroups.multipliers.toast.updateSuccess'),
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
            title: t('settings.userGroups.multipliers.toast.updateFailed'),
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
    } else {
      // Update existing multiplier entry
      dispatch(updateMultiManufacturer({ id: group.id, data: updatedData }))
        .unwrap()
        .then(() => {
          dispatch(fetchMultiManufacturers());
          dispatch(fetchUserMultipliers());
          Swal.fire({
            toast: true,
            position: 'top',
            icon: 'success',
            title: t('settings.userGroups.multipliers.toast.updateSuccess'),
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
            title: t('settings.userGroups.multipliers.toast.updateFailed'),
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
    }
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
    if (!selectedGroup) return;
    
    // If no ID exists, create new entry
    if (!selectedGroup.id) {
      updatedData.user_group_id = selectedGroup.user_group.id;
      dispatch(createMultiManufacturer(updatedData))
        .unwrap()
        .then((res) => {
          setShowModal(false);
          setSelectedGroup(null);
          Swal.fire(t('common.success') + '!', res.message || t('settings.userGroups.multipliers.toast.updateSuccess'), 'success');
          dispatch(fetchMultiManufacturers());
          dispatch(fetchUserMultipliers());
        })
        .catch((err) => {
          console.error('Create failed', err);
          Swal.fire(t('common.error'), err.message || t('settings.userGroups.multipliers.toast.updateFailed'), 'error');
        });
    } else {
      // Update existing entry
      dispatch(updateMultiManufacturer({ id: selectedGroup.id, data: updatedData }))
        .unwrap()
        .then((res) => {
          setShowModal(false);
          setSelectedGroup(null);
          Swal.fire(t('common.success') + '!', res.message || t('settings.userGroups.multipliers.toast.updateSuccess'), 'success');
          dispatch(fetchMultiManufacturers());
          dispatch(fetchUserMultipliers());
        })
        .catch((err) => {
          console.error('Update failed', err);
          Swal.fire(t('common.error'), err.message || t('settings.userGroups.multipliers.toast.updateFailed'), 'error');
        });
    }
  };

  // Filter groups based on search term
  const filteredGroups = mergedGroups.filter((group) => {
    const groupName = group.user_group?.name || '';
    return groupName.toLowerCase().includes(filterText.toLowerCase());
  });

  const startIdx = (currentPage - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const paginatedGroups = filteredGroups.slice(startIdx, endIdx);
  const totalPages = Math.ceil(filteredGroups.length / itemsPerPage);

  const enabledCount = mergedGroups.filter(group => group.enabled === 1).length;
  const disabledCount = mergedGroups.length - enabledCount;

  return (
    <CContainer fluid className="p-2 m-2" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header Section */}
      <PageHeader
        title={
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
              <CIcon icon={cilUser} style={{ fontSize: '24px', color: 'white' }} />
            </div>
            {t('settings.userGroups.multipliers.header')}
          </div>
        }
        subtitle={t('settings.userGroups.multipliers.subtitle')}
        rightContent={
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
            {mergedGroups.length} {t('settings.userGroups.multipliers.groups')}
          </CBadge>
        }
      />

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
                  <small className="text-muted">{t('settings.userGroups.multipliers.stats.activeGroups')}</small>
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
                  <small className="text-muted">{t('settings.userGroups.multipliers.stats.inactiveGroups')}</small>
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
                    backgroundColor: `${customization.headerBg || '#667eea'}20`,
                    color: customization.headerBg || '#667eea'
                  }}
                >
                  <CIcon icon={cilUser} size="lg" />
                </div>
                <div>
                  <h4 className="mb-0 fw-bold text-primary">{usersGroup.length}</h4>
                  <small className="text-muted">{t('settings.userGroups.multipliers.stats.totalGroups')}</small>
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
                  placeholder={t('settings.userGroups.multipliers.searchPlaceholder')}
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
                {t('settings.userGroups.multipliers.showing', { count: filteredGroups?.length || 0, total: mergedGroups?.length || 0 })}
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
                      {t('settings.userGroups.multipliers.table.groupName')}
                    </div>
                  </CTableHeaderCell>
                  <CTableHeaderCell className="border-0 fw-semibold text-muted py-3">
                    {t('settings.userGroups.multipliers.table.multiplier')}
                  </CTableHeaderCell>
                  <CTableHeaderCell className="border-0 fw-semibold text-muted py-3">
                    {t('settings.userGroups.multipliers.table.status')}
                  </CTableHeaderCell>
                  <CTableHeaderCell className="border-0 fw-semibold text-muted py-3 text-center">
                    {t('settings.userGroups.multipliers.table.actions')}
                  </CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {paginatedGroups?.length === 0 ? (
                  <CTableRow>
                    <CTableDataCell colSpan="4" className="text-center py-5">
                      <div className="text-muted">
                        <CIcon icon={cilSearch} size="xl" className="mb-3 opacity-25" />
                        <p className="mb-0">{t('settings.userGroups.multipliers.empty.title')}</p>
                        <small>{t('settings.userGroups.multipliers.empty.subtitle')}</small>
                      </div>
                    </CTableDataCell>
                  </CTableRow>
                ) : (
                  paginatedGroups.map((group) => (
                    <CTableRow key={group.id || `group-${group.user_group.id}`} style={{ transition: 'all 0.2s ease' }}>
                      <CTableDataCell className="py-3 border-0 border-bottom border-light">
                        <div className="fw-medium text-dark">
                          {group.user_group?.name || t('common.na')}
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
                          {group.multiplier ? `${group.multiplier}` : t('common.na')}
                        </CBadge>
                      </CTableDataCell>
                      <CTableDataCell className="py-3 border-0 border-bottom border-light">
                        <div className="d-flex align-items-center gap-2">
                          <CFormSwitch
                            checked={group.enabled === 1}
                            onChange={() => toggleEnabled(group, group.enabled)}
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
                            {group.enabled === 1 ? t('settings.userGroups.multipliers.status.active') : t('settings.userGroups.multipliers.status.inactive')}
                          </CBadge>
                        </div>
                      </CTableDataCell>
                      <CTableDataCell className="py-3 border-0 border-bottom border-light text-center">
                        <CButton
                          color="light"
                          size="sm"
                          className="p-2"
                          onClick={() => handleEdit(group)}
                          title={t('settings.userGroups.multipliers.actions.edit')}
                          aria-label={t('settings.userGroups.multipliers.actions.edit')}
                          style={{
                            borderRadius: '8px',
                            border: '1px solid #e3e6f0',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = `${customization.headerBg || '#667eea'}20`;
                            e.currentTarget.style.borderColor = customization.headerBg || '#667eea';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '';
                            e.currentTarget.style.borderColor = '#e3e6f0';
                          }}
                        >
                          <CIcon
                            icon={cilPencil}
                            size="sm"
                            style={{ color: customization.headerBg || '#667eea' }}
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
                itemsPerPage={itemsPerPage}
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