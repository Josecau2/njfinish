import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  CRow,
  CCol,
  CCard,
  CCardBody,
  CCardHeader,
  CListGroup,
  CListGroupItem,
  CBadge,
  CAlert
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import {
  cilSettings,
  cilShieldAlt,
  cilPeople,
  cilCheckCircle,
  cilXCircle,
  cilInfo
} from '@coreui/icons';

const SettingsTab = ({ contractor }) => {
  const { t } = useTranslation();
  const contractorSettings = contractor.contractor_settings || {};
  
  // Parse modules if they're stored as JSON string
  let modules = contractor.modules || {};
  if (typeof modules === 'string') {
    try {
      modules = JSON.parse(modules);
    } catch (e) {
      console.error('Error parsing modules:', e);
      modules = {};
    }
  }

  // Parse contractor_settings if they're stored as JSON string
  let parsedContractorSettings = contractorSettings;
  if (typeof contractorSettings === 'string') {
    try {
      parsedContractorSettings = JSON.parse(contractorSettings);
    } catch (e) {
      console.error('Error parsing contractor_settings:', e);
      parsedContractorSettings = {};
    }
  }

  const formatBoolean = (value) => {
    return value ? (
      <CBadge color="success">
        <CIcon icon={cilCheckCircle} className="me-1" size="sm" />
    {t('contractorsAdmin.detail.enabled')}
      </CBadge>
    ) : (
      <CBadge color="danger">
        <CIcon icon={cilXCircle} className="me-1" size="sm" />
    {t('contractorsAdmin.detail.disabled')}
      </CBadge>
    );
  };

  const moduleLabels = {
  dashboard: t('contractorsAdmin.modules.dashboard'),
  proposals: t('contractorsAdmin.modules.proposals'),
  customers: t('contractorsAdmin.modules.customers'),
  resources: t('contractorsAdmin.modules.resources')
  };

  const settingsLabels = {
  allow_subcontractors: t('contractorsAdmin.detail.settings.labels.allowSubcontractors'),
  max_users: t('contractorsAdmin.detail.settings.labels.maxUsers'),
  billing_enabled: t('contractorsAdmin.detail.settings.labels.billingEnabled'),
  custom_branding: t('contractorsAdmin.detail.settings.labels.customBranding'),
  api_access: t('contractorsAdmin.detail.settings.labels.apiAccess'),
  notification_preferences: t('contractorsAdmin.detail.settings.labels.notificationPreferences'),
  data_retention_days: t('contractorsAdmin.detail.settings.labels.dataRetentionDays'),
  timezone: t('contractorsAdmin.detail.settings.labels.timezone'),
  locale: t('contractorsAdmin.detail.settings.labels.locale')
  };

  return (
    <CRow>
      {/* Module Settings */}
      <CCol md={6} className="mb-4">
        <CCard>
          <CCardHeader>
            <strong>
              <CIcon icon={cilShieldAlt} className="me-2" />
              {t('contractorsAdmin.detail.moduleAccess.title')}
            </strong>
          </CCardHeader>
          <CCardBody>
            {Object.keys(modules).length === 0 ? (
              <CAlert color="info">
                <CIcon icon={cilInfo} className="me-2" />
                {t('contractorsAdmin.detail.settings.noModuleSettings')}
              </CAlert>
            ) : (
              <CListGroup flush>
                {Object.entries(modules).map(([key, value]) => (
                  <CListGroupItem 
                    key={key}
                    className="d-flex justify-content-between align-items-center"
                  >
                    <span>
                      <strong>{moduleLabels[key] || key}</strong>
                      <br />
                      <small className="text-muted">
                        {key === 'dashboard' && t('contractorsAdmin.detail.settings.moduleDescriptions.dashboard')}
                        {key === 'proposals' && t('contractorsAdmin.detail.settings.moduleDescriptions.proposals')}
                        {key === 'customers' && t('contractorsAdmin.detail.settings.moduleDescriptions.customers')}
                        {key === 'resources' && t('contractorsAdmin.detail.settings.moduleDescriptions.resources')}
                      </small>
                    </span>
                    {formatBoolean(value)}
                  </CListGroupItem>
                ))}
              </CListGroup>
            )}
          </CCardBody>
        </CCard>
      </CCol>

      {/* Contractor Settings */}
      <CCol md={6} className="mb-4">
        <CCard>
          <CCardHeader>
            <strong>
              <CIcon icon={cilSettings} className="me-2" />
              {t('contractorsAdmin.detail.settings.title')}
            </strong>
          </CCardHeader>
          <CCardBody>
            {Object.keys(parsedContractorSettings).length === 0 ? (
              <CAlert color="info">
                <CIcon icon={cilInfo} className="me-2" />
                {t('contractorsAdmin.detail.settings.noneConfigured')}
              </CAlert>
            ) : (
              <CListGroup flush>
                {Object.entries(parsedContractorSettings).map(([key, value]) => (
                  <CListGroupItem 
                    key={key}
                    className="d-flex justify-content-between align-items-center"
                  >
                    <span>
                      <strong>{settingsLabels[key] || key.replace(/_/g, ' ')}</strong>
                      <br />
                      <small className="text-muted">
                        {key === 'allow_subcontractors' && t('contractorsAdmin.detail.settings.descriptions.allowSubcontractors')}
                        {key === 'max_users' && t('contractorsAdmin.detail.settings.descriptions.maxUsers')}
                        {key === 'billing_enabled' && t('contractorsAdmin.detail.settings.descriptions.billingEnabled')}
                        {key === 'custom_branding' && t('contractorsAdmin.detail.settings.descriptions.customBranding')}
                        {key === 'api_access' && t('contractorsAdmin.detail.settings.descriptions.apiAccess')}
                        {key === 'data_retention_days' && t('contractorsAdmin.detail.settings.descriptions.dataRetentionDays')}
                      </small>
                    </span>
                    <span>
                      {typeof value === 'boolean' 
                        ? formatBoolean(value)
                        : typeof value === 'object'
                        ? <CBadge color="info">{t('contractorsAdmin.detail.settings.objectLabel')}</CBadge>
                        : <strong>{value}</strong>
                      }
                    </span>
                  </CListGroupItem>
                ))}
              </CListGroup>
            )}
          </CCardBody>
        </CCard>
      </CCol>

      {/* Raw JSON Display */}
      <CCol xs={12}>
        <CCard>
          <CCardHeader>
            <strong>
              <CIcon icon={cilInfo} className="me-2" />
              {t('contractorsAdmin.detail.settings.raw.title')}
            </strong>
          </CCardHeader>
          <CCardBody>
            <CRow>
              <CCol md={6}>
                <h6>{t('contractorsAdmin.detail.settings.raw.modules')}</h6>
                <pre className="bg-light p-3 rounded small">
                  <code>{JSON.stringify(modules, null, 2)}</code>
                </pre>
              </CCol>
              <CCol md={6}>
                <h6>{t('contractorsAdmin.detail.settings.raw.contractorSettings')}</h6>
                <pre className="bg-light p-3 rounded small">
                  <code>{JSON.stringify(contractorSettings, null, 2)}</code>
                </pre>
              </CCol>
            </CRow>
          </CCardBody>
        </CCard>
      </CCol>

      {/* Summary Information */}
      <CCol xs={12}>
        <CCard>
          <CCardHeader>
            <strong>{t('contractorsAdmin.detail.settings.summary.title')}</strong>
          </CCardHeader>
          <CCardBody>
            <CRow>
              <CCol md={4} className="text-center border-end">
                <h4 className="text-primary">
                  {Object.values(modules).filter(Boolean).length}
                </h4>
                <p className="text-muted mb-0">{t('contractorsAdmin.detail.settings.summary.enabledModules')}</p>
                <small className="text-muted">
                  {t('contractorsAdmin.detail.settings.summary.ofTotal', { total: Object.keys(modules).length })}
                </small>
              </CCol>
              <CCol md={4} className="text-center border-end">
                <h4 className="text-info">
                  {Object.keys(contractorSettings).length}
                </h4>
                <p className="text-muted mb-0">{t('contractorsAdmin.detail.settings.summary.settingsConfigured')}</p>
                <small className="text-muted">
                  {t('contractorsAdmin.detail.settings.summary.customOptions')}
                </small>
              </CCol>
              <CCol md={4} className="text-center">
                <h4 className="text-success">
                  {contractorSettings.max_users || t('contractorsAdmin.detail.settings.summary.unlimited')}
                </h4>
                <p className="text-muted mb-0">{t('contractorsAdmin.detail.settings.summary.maxUsers')}</p>
                <small className="text-muted">
                  {t('contractorsAdmin.detail.settings.summary.userLimitHint')}
                </small>
              </CCol>
            </CRow>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  );
};

export default SettingsTab;
