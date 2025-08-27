import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatDate } from '../../../helpers/dateUtils';
import {
  CRow,
  CCol,
  CCard,
  CCardBody,
  CCardHeader,
  CBadge,
  CProgress,
  CListGroup,
  CListGroupItem
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import {
  cilUser,
  cilGroup,
  cilBriefcase,
  cilCalendar,
  cilCheckCircle,
  cilXCircle,
  cilViewModule
} from '@coreui/icons';

const OverviewTab = ({ contractor }) => {
  const { t } = useTranslation();

  const getModuleBadges = (modules) => {
    if (!modules || typeof modules !== 'object') return [];
    
    const moduleLabels = {
      dashboard: { label: t('contractorsAdmin.modules.dashboard'), color: 'primary' },
      proposals: { label: t('contractorsAdmin.modules.proposals'), color: 'success' },
      customers: { label: t('contractorsAdmin.modules.customers'), color: 'warning' },
      resources: { label: t('contractorsAdmin.modules.resources'), color: 'info' }
    };

    // Parse modules if it's a string
    let parsedModules = modules;
    if (typeof modules === 'string') {
      try {
        parsedModules = JSON.parse(modules);
      } catch (e) {
        console.error('Error parsing modules:', e);
        return [];
      }
    }

    // Return all possible modules with their enabled status from the object
    return ['dashboard', 'proposals', 'customers', 'resources'].map(key => ({
      key,
      label: moduleLabels[key]?.label || key,
      color: moduleLabels[key]?.color || 'secondary',
      enabled: parsedModules[key] === true
    }));
  };

  const moduleData = getModuleBadges(contractor.modules);
  const enabledModules = moduleData.filter(m => m.enabled).length;
  const totalModules = moduleData.length;
  const modulePercentage = totalModules > 0 ? (enabledModules / totalModules) * 100 : 0;

  return (
    <CRow>
      {/* Stats Cards */}
      <CCol sm={6} lg={3} className="mb-4">
        <CCard className="text-center">
          <CCardBody>
            <CIcon icon={cilUser} size="2xl" className="text-primary mb-3" />
            <h3 className="text-primary">{contractor.stats?.user_count || 0}</h3>
            <p className="text-muted mb-0">{t('contractorsAdmin.table.users')}</p>
          </CCardBody>
        </CCard>
      </CCol>
      
      <CCol sm={6} lg={3} className="mb-4">
        <CCard className="text-center">
          <CCardBody>
            <CIcon icon={cilGroup} size="2xl" className="text-warning mb-3" />
            <h3 className="text-warning">{contractor.stats?.customer_count || 0}</h3>
            <p className="text-muted mb-0">{t('contractorsAdmin.table.customers')}</p>
          </CCardBody>
        </CCard>
      </CCol>
      
      <CCol sm={6} lg={3} className="mb-4">
        <CCard className="text-center">
          <CCardBody>
            <CIcon icon={cilBriefcase} size="2xl" className="text-success mb-3" />
            <h3 className="text-success">{contractor.stats?.proposal_count || 0}</h3>
            <p className="text-muted mb-0">{t('contractorsAdmin.table.proposals')}</p>
          </CCardBody>
        </CCard>
      </CCol>
      
      <CCol sm={6} lg={3} className="mb-4">
        <CCard className="text-center">
          <CCardBody>
            <CIcon icon={cilViewModule} size="2xl" className="text-info mb-3" />
            <h3 className="text-info">{enabledModules}/{totalModules}</h3>
            <p className="text-muted mb-0">{t('contractorsAdmin.table.modules')}</p>
          </CCardBody>
        </CCard>
      </CCol>

      {/* Basic Information */}
      <CCol md={6} className="mb-4">
        <CCard>
          <CCardHeader>
            <strong>{t('contractorsAdmin.detail.basicInfo.title')}</strong>
          </CCardHeader>
          <CCardBody>
            <CListGroup flush>
              <CListGroupItem className="d-flex justify-content-between align-items-center">
                <span>
                  <CIcon icon={cilGroup} className="me-2 text-muted" />
                  {t('contractorsAdmin.detail.basicInfo.contractorName')}
                </span>
                <strong>{contractor.name}</strong>
              </CListGroupItem>
              <CListGroupItem className="d-flex justify-content-between align-items-center">
                <span>
                  <CIcon icon={cilCalendar} className="me-2 text-muted" />
                  {t('contractorsAdmin.detail.basicInfo.createdDate')}
                </span>
                <span>{formatDate(contractor.created_at)}</span>
              </CListGroupItem>
              <CListGroupItem className="d-flex justify-content-between align-items-center">
                <span>{t('contractorsAdmin.detail.basicInfo.groupType')}</span>
                <CBadge color="info">{contractor.group_type || 'contractor'}</CBadge>
              </CListGroupItem>
              {contractor.contractor_settings?.max_users && (
                <CListGroupItem className="d-flex justify-content-between align-items-center">
                  <span>{t('contractorsAdmin.detail.basicInfo.maxUsers')}</span>
                  <span>{contractor.contractor_settings.max_users}</span>
                </CListGroupItem>
              )}
            </CListGroup>
          </CCardBody>
        </CCard>
      </CCol>

      {/* Module Access */}
      <CCol md={6} className="mb-4">
        <CCard>
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>{t('contractorsAdmin.detail.moduleAccess.title')}</strong>
            <div>
              <small className="text-muted">{t('contractorsAdmin.detail.moduleAccess.enabledOfTotal', { enabled: enabledModules, total: totalModules })}</small>
            </div>
          </CCardHeader>
          <CCardBody>
            <div className="mb-3">
              <CProgress 
                value={modulePercentage} 
                color={modulePercentage > 75 ? 'success' : modulePercentage > 50 ? 'warning' : 'danger'}
                className="mb-2"
              />
              <small className="text-muted">{t('contractorsAdmin.detail.moduleAccess.percentEnabled', { percent: Math.round(modulePercentage) })}</small>
            </div>
            
            <CListGroup flush>
              {moduleData.map(module => (
                <CListGroupItem 
                  key={module.key}
                  className="d-flex justify-content-between align-items-center"
                >
                  <span>
                    <CIcon 
                      icon={module.enabled ? cilCheckCircle : cilXCircle} 
                      className={`me-2 ${module.enabled ? 'text-success' : 'text-danger'}`} 
                    />
                    {module.label}
                  </span>
                  <CBadge color={module.enabled ? module.color : 'secondary'}>
                    {module.enabled ? t('contractorsAdmin.detail.enabled') : t('contractorsAdmin.detail.disabled')}
                  </CBadge>
                </CListGroupItem>
              ))}
            </CListGroup>
          </CCardBody>
        </CCard>
      </CCol>

      {/* Activity Summary */}
      <CCol xs={12}>
        <CCard>
          <CCardHeader>
            <strong>{t('contractorsAdmin.detail.activity.title')}</strong>
          </CCardHeader>
          <CCardBody>
            <CRow>
              <CCol md={4} className="border-end">
                <div className="text-center">
                  <h4 className="text-primary">{contractor.stats?.user_count || 0}</h4>
                  <p className="text-muted mb-0">{t('contractorsAdmin.detail.activity.totalUsers')}</p>
                  <small className="text-muted">{t('contractorsAdmin.detail.activity.totalUsersHint')}</small>
                </div>
              </CCol>
              <CCol md={4} className="border-end">
                <div className="text-center">
                  <h4 className="text-warning">{contractor.stats?.customer_count || 0}</h4>
                  <p className="text-muted mb-0">{t('contractorsAdmin.detail.activity.totalCustomers')}</p>
                  <small className="text-muted">{t('contractorsAdmin.detail.activity.totalCustomersHint')}</small>
                </div>
              </CCol>
              <CCol md={4}>
                <div className="text-center">
                  <h4 className="text-success">{contractor.stats?.proposal_count || 0}</h4>
                  <p className="text-muted mb-0">{t('contractorsAdmin.detail.activity.totalProposals')}</p>
                  <small className="text-muted">{t('contractorsAdmin.detail.activity.totalProposalsHint')}</small>
                </div>
              </CCol>
            </CRow>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  );
};

export default OverviewTab;
