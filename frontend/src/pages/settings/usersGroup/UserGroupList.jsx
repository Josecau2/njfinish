import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CButton,
  CBadge,
  CFormSwitch,
  CSpinner,
  CAlert,
  CContainer
} from '@coreui/react';
import { Plus, Pencil, Users } from '@/icons-lucide';
import { fetchUsers, updateUser } from '../../../store/slices/userGroupSlice';
import { useNavigate } from 'react-router-dom';
import { buildEncodedPath, genNoise } from '../../../utils/obfuscate';
import { useTranslation } from 'react-i18next';

const UserGroupList = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  // Use the normalized array from the slice (allGroups). Keep a safe fallback.
  const { allGroups = [], loading, error } = useSelector((state) => state.usersGroup || {});
  const userGroups = allGroups;
  const [updatingModule, setUpdatingModule] = useState(null);

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);



  const handleModuleToggle = async (groupId, module, currentModules) => {
    setUpdatingModule(`${groupId}-${module}`);

    try {
      // Handle modules as object, not array - with defensive defaults
      // Parse currentModules if it comes as a string
      let modulesObj;
      if (typeof currentModules === 'string') {
        try {
          modulesObj = JSON.parse(currentModules);
        } catch (e) {
          modulesObj = {
            dashboard: false,
            proposals: false,
            customers: false,
            resources: false
          };
        }
      } else {
        modulesObj = currentModules || {
          dashboard: false,
          proposals: false,
          customers: false,
          resources: false
        };
      }

      const newModules = {
        ...modulesObj,
        [module]: !modulesObj[module] // Toggle the boolean value
      };

      await dispatch(updateUser({
        id: groupId,
        data: { modules: newModules }
      })).unwrap();

      // No need to refresh - Redux will update both list and allGroups automatically
    } catch (error) {
      // Error updating module
    } finally {
      setUpdatingModule(null);
    }
  };

  const handleCreateGroup = () => {
    navigate('/settings/users/group/create');
  };

  const handleEditGroup = (groupId) => {
  const noisy = `/${genNoise(6)}/${genNoise(8)}` + buildEncodedPath('/settings/users/group/edit/:id', { id: groupId });
  navigate(noisy);
  };

  const getModuleToggle = (group, module) => {
    // Handle modules as object with boolean values, with defensive defaults
    // Parse modules if it comes as a string
    let modules;
    if (typeof group.modules === 'string') {
      try {
        modules = JSON.parse(group.modules);
      } catch (e) {
        modules = {
          dashboard: false,
          proposals: false,
          customers: false,
          resources: false
        };
      }
    } else {
      modules = group.modules || {
        dashboard: false,
        proposals: false,
        customers: false,
        resources: false
      };
    }

    const isEnabled = modules[module] === true;
    const isUpdating = updatingModule === `${group.id}-${module}`;

    return (
      <CFormSwitch
        id={`${group.id}-${module}`}
        checked={isEnabled}
        disabled={group.group_type !== 'contractor' || isUpdating}
        onChange={() => handleModuleToggle(group.id, module, modules)}
        label={isUpdating ? <CSpinner size="sm" /> : ''}
        size="sm"
      />
    );
  };

  if (loading) {
    return (
      <CContainer className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
        <div className="text-center">
          <CSpinner />
          <p className="mt-2 text-muted">{t('common.loadingUserGroups')}</p>
        </div>
      </CContainer>
    );
  }

  if (error) {
    return (
      <CContainer>
        <CAlert color="danger">
          <strong>Error loading user groups:</strong> {error.message || error.toString() || 'Unknown error'}
        </CAlert>
      </CContainer>
    );
  }

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong className="d-flex align-items-center gap-2">
              <Users size={18} aria-hidden="true" />
              {t('settings.userGroups.header')}
            </strong>
            <CButton
              color="primary"
              onClick={handleCreateGroup}
              className="d-flex align-items-center gap-2"
            >
              <Plus size={16} aria-hidden="true" />
              {t('settings.userGroups.actions.create')}
            </CButton>
          </CCardHeader>
          <CCardBody>
            {error && (
              <CAlert color="danger" className="mb-3">
                {t('settings.userGroups.loadFailed')}: {error.message || error.toString() || t('common.error')}
              </CAlert>
            )}
            {/* Desktop table (hidden on small screens) */}
            <div className="d-none d-md-block table-wrap">
            <CTable hover responsive className="table-modern">
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>{t('settings.userGroups.table.name')}</CTableHeaderCell>
                  <CTableHeaderCell>{t('settings.userGroups.table.type')}</CTableHeaderCell>
                  <CTableHeaderCell>{t('contractorsAdmin.modules.dashboard')}</CTableHeaderCell>
                  <CTableHeaderCell>{t('contractorsAdmin.modules.proposals')}</CTableHeaderCell>
                  <CTableHeaderCell>{t('contractorsAdmin.modules.customers')}</CTableHeaderCell>
                  <CTableHeaderCell>{t('contractorsAdmin.modules.resources')}</CTableHeaderCell>
                  <CTableHeaderCell>{t('settings.userGroups.table.actions')}</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {userGroups.length === 0 ? (
                  <CTableRow key="empty-state">
                    <CTableDataCell colSpan="7" className="text-center py-4">
                      {t('settings.userGroups.empty')}
                    </CTableDataCell>
                  </CTableRow>
                ) : (
                  userGroups.map((group) => (
                    <CTableRow key={group.id}>
                      <CTableDataCell>
                        <strong>{group.name || 'Unnamed Group'}</strong>
                        {!group.name && <small className="text-muted d-block">ID: {group.id}</small>}
                      </CTableDataCell>
                      <CTableDataCell>
                        <CBadge color={group.group_type === 'contractor' ? 'info' : 'secondary'} shape="rounded-pill">
                          {group.group_type === 'contractor' ? t('settings.userGroups.types.contractor') : t('settings.userGroups.types.standard')}
                        </CBadge>
                      </CTableDataCell>
                      <CTableDataCell>
                        {getModuleToggle(group, 'dashboard')}
                      </CTableDataCell>
                      <CTableDataCell>
                        {getModuleToggle(group, 'proposals')}
                      </CTableDataCell>
                      <CTableDataCell>
                        {getModuleToggle(group, 'customers')}
                      </CTableDataCell>
                      <CTableDataCell>
                        {getModuleToggle(group, 'resources')}
                      </CTableDataCell>
                      <CTableDataCell>
                        <CButton
                          color="light"
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditGroup(group.id)}
                          className="icon-btn"
                          title={t('settings.userGroups.actions.edit')}
                          aria-label={t('settings.userGroups.actions.edit')}
                          style={{ border: '1px solid #e3e6f0', borderRadius: '8px' }}
                        >
                          <Pencil size={16} aria-hidden="true" />
                        </CButton>
                      </CTableDataCell>
                    </CTableRow>
                  ))
                )}
              </CTableBody>
            </CTable>
            </div>

            {/* Mobile card list (visible on small screens only) */}
            <div className="d-md-none user-groups-mobile">
              {userGroups.length === 0 ? (
                <div className="text-center text-muted py-4">
                  {t('settings.userGroups.empty')}
                </div>
              ) : (
                userGroups.map((group) => (
                  <div className="mobile-card mb-3" key={`m-${group.id}`}>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <div className="fw-semibold">{group.name || 'Unnamed Group'}</div>
                        {!group.name && <small className="text-muted">ID: {group.id}</small>}
                      </div>
                      <CBadge color={group.group_type === 'contractor' ? 'info' : 'secondary'} shape="rounded-pill">
                        {group.group_type === 'contractor' ? t('settings.userGroups.types.contractor') : t('settings.userGroups.types.standard')}
                      </CBadge>
                    </div>

                    <div className="row g-2 small">
                      <div className="col-6 d-flex align-items-center justify-content-between">
                        <span className="text-muted me-2">{t('contractorsAdmin.modules.dashboard')}</span>
                        {getModuleToggle(group, 'dashboard')}
                      </div>
                      <div className="col-6 d-flex align-items-center justify-content-between">
                        <span className="text-muted me-2">{t('contractorsAdmin.modules.proposals')}</span>
                        {getModuleToggle(group, 'proposals')}
                      </div>
                      <div className="col-6 d-flex align-items-center justify-content-between">
                        <span className="text-muted me-2">{t('contractorsAdmin.modules.customers')}</span>
                        {getModuleToggle(group, 'customers')}
                      </div>
                      <div className="col-6 d-flex align-items-center justify-content-between">
                        <span className="text-muted me-2">{t('contractorsAdmin.modules.resources')}</span>
                        {getModuleToggle(group, 'resources')}
                      </div>
                    </div>

                    <div className="d-flex justify-content-end mt-2">
                      <CButton
                        color="light"
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditGroup(group.id)}
                        title={t('settings.userGroups.actions.edit')}
                        aria-label={t('settings.userGroups.actions.edit')}
                        className="icon-btn"
                        style={{ border: '1px solid #e3e6f0', borderRadius: '8px' }}
                      >
                        <Pencil size={16} className="me-1" aria-hidden="true" />
                        {t('common.edit') || 'Edit'}
                      </CButton>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  );
};

export default UserGroupList;
