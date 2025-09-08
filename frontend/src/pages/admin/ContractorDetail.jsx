import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { decodeParam } from '../../utils/obfuscate';
import { useDispatch, useSelector } from 'react-redux';
import {
  CContainer,
  CCard,
  CCardBody,
  CCardHeader,
  CRow,
  CCol,
  CNav,
  CNavItem,
  CNavLink,
  CTabContent,
  CTabPane,
  CBadge,
  CSpinner,
  CAlert,
  CButton,
  CButtonGroup
} from '@coreui/react';
import { ArrowLeft, Users, BarChart3, BriefcaseBusiness, Users as UsersGroup, Settings } from '@/icons-lucide';
import { fetchContractor } from '../../store/slices/contractorSlice';
import OverviewTab from './ContractorDetail/OverviewTab';
import ProposalsTab from './ContractorDetail/ProposalsTab';
import CustomersTab from './ContractorDetail/CustomersTab';
import SettingsTab from './ContractorDetail/SettingsTab';

const ContractorDetail = () => {
  const { t } = useTranslation();
  const { groupId: rawGroupId } = useParams();
  const groupId = decodeParam(rawGroupId);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { selectedContractor: contractor, loading, error } = useSelector(state => state.contractors);

  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (groupId) {
      dispatch(fetchContractor(groupId));
    }
  }, [dispatch, groupId]);

  const handleBack = () => {
    navigate('/admin/contractors');
  };

  const tabs = [
    {
      key: 'overview',
      label: t('contractorsAdmin.detail.tabs.overview'),
  icon: 'chart',
      component: OverviewTab
    },
    {
      key: 'proposals',
      label: t('contractorsAdmin.detail.tabs.proposals'),
  icon: 'briefcase',
      component: ProposalsTab
    },
    {
      key: 'customers',
      label: t('contractorsAdmin.detail.tabs.customers'),
  icon: 'group',
      component: CustomersTab
    },
    {
      key: 'settings',
      label: t('contractorsAdmin.detail.tabs.settings'),
  icon: 'settings',
      component: SettingsTab
    }
  ];

  if (loading) {
    return (
      <CContainer>
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
          <CSpinner color="primary" />
        </div>
      </CContainer>
    );
  }

  if (error) {
    return (
      <CContainer>
        <CAlert color="danger">
          <h4>{t('contractorsAdmin.detail.errorTitle')}</h4>
          <p>{error}</p>
          <CButton color="primary" onClick={handleBack} aria-label={t('common.back')} className="d-inline-flex align-items-center">
            <ArrowLeft size={16} className="me-2" aria-hidden="true" />
            {t('contractorsAdmin.detail.backToList')}
          </CButton>
        </CAlert>
      </CContainer>
    );
  }

  if (!contractor) {
    return (
      <CContainer>
        <CAlert color="warning">
          <h4>{t('contractorsAdmin.detail.notFoundTitle')}</h4>
          <p>{t('contractorsAdmin.detail.notFoundText')}</p>
          <CButton color="primary" onClick={handleBack} aria-label={t('common.back')} className="d-inline-flex align-items-center">
            <ArrowLeft size={16} className="me-2" aria-hidden="true" />
            {t('contractorsAdmin.detail.backToList')}
          </CButton>
        </CAlert>
      </CContainer>
    );
  }

  return (
    <CContainer className="px-4">
      <CRow>
        <CCol xs={12}>
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4 contractor-detail-header">
            <div className="d-flex align-items-center">
              <CButton
                color="outline-secondary"
                size="sm"
                onClick={handleBack}
                className="me-3 d-flex align-items-center"
                style={{ minWidth: '44px', minHeight: '44px' }}
              >
                <ArrowLeft size={16} aria-hidden="true" />
                <span className="d-none d-sm-inline ms-1">{t('common.back')}</span>
              </CButton>
              <div>
                <h2 className="mb-0 d-flex align-items-center">
                  <Users size={20} className="me-2" aria-hidden="true" />
                  <span className="text-truncate" style={{ maxWidth: '200px' }}>
                    {contractor.name}
                  </span>
                </h2>
                <small className="text-muted">{t('contractorsAdmin.detail.contractorId')}: {contractor.id}</small>
              </div>
            </div>
            <CBadge color="info" size="lg">
              {contractor.group_type || t('contractorsAdmin.detail.contractor')}
            </CBadge>
          </div>

          {/* Tabs Card */}
          <CCard>
            <CCardHeader className="pb-0">
              <CNav variant="tabs" role="tablist">
        {tabs.map(tab => (
                  <CNavItem key={tab.key}>
                    <CNavLink
                      active={activeTab === tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className="cursor-pointer"
          aria-current={activeTab === tab.key ? 'page' : undefined}
          role="tab"
                    >
                      {tab.icon === 'chart' && <BarChart3 size={16} className="me-2" aria-hidden="true" />}
          {tab.icon === 'briefcase' && <BriefcaseBusiness size={16} className="me-2" aria-hidden="true" />}
          {tab.icon === 'group' && <UsersGroup size={16} className="me-2" aria-hidden="true" />}
          {tab.icon === 'settings' && <Settings size={16} className="me-2" aria-hidden="true" />}
          {tab.label}
                    </CNavLink>
                  </CNavItem>
                ))}
              </CNav>
            </CCardHeader>

            <CCardBody>
              <CTabContent>
                {tabs.map(tab => {
                  const TabComponent = tab.component;
                  return (
                    <CTabPane
                      key={tab.key}
                      role="tabpanel"
                      aria-labelledby={`${tab.key}-tab`}
                      visible={activeTab === tab.key}
                    >
                      <TabComponent contractor={contractor} groupId={groupId} />
                    </CTabPane>
                  );
                })}
              </CTabContent>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </CContainer>
  );
};

export default ContractorDetail;
