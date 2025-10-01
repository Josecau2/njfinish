import React from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Box, Card, CardBody, CardHeader, Badge, Alert, List, ListItem } from '@chakra-ui/react'
import { Settings, Shield, Users, CheckCircle, XCircle, Info } from 'lucide-react'

const SettingsTab = ({ contractor }) => {
  const { t } = useTranslation()
  const contractorSettings = contractor.contractor_settings || {}

  // Parse modules if they're stored as JSON string
  let modules = contractor.modules || {}
  if (typeof modules === 'string') {
    try {
      modules = JSON.parse(modules)
    } catch (e) {
      console.error('Error parsing modules:', e)
      modules = {}
    }
  }

  // Parse contractor_settings if they're stored as JSON string
  let parsedContractorSettings = contractorSettings
  if (typeof contractorSettings === 'string') {
    try {
      parsedContractorSettings = JSON.parse(contractorSettings)
    } catch (e) {
      console.error('Error parsing contractor_settings:', e)
      parsedContractorSettings = {}
    }
  }

  const formatBoolean = (value) => {
    return value ? (
      <Badge status="success">
        <CheckCircle size={14} aria-hidden="true" />
        {t('contractorsAdmin.detail.enabled')}
      </Badge>
    ) : (
      <Badge status="error">
        <XCircle size={14} aria-hidden="true" />
        {t('contractorsAdmin.detail.disabled')}
      </Badge>
    )
  }

  const moduleLabels = {
    dashboard: t('contractorsAdmin.modules.dashboard'),
    proposals: t('contractorsAdmin.modules.proposals'),
    customers: t('contractorsAdmin.modules.customers'),
    resources: t('contractorsAdmin.modules.resources'),
  }

  const settingsLabels = {
    allow_subcontractors: t('contractorsAdmin.detail.settings.labels.allowSubcontractors'),
    max_users: t('contractorsAdmin.detail.settings.labels.maxUsers'),
    billing_enabled: t('contractorsAdmin.detail.settings.labels.billingEnabled'),
    custom_branding: t('contractorsAdmin.detail.settings.labels.customBranding'),
    api_access: t('contractorsAdmin.detail.settings.labels.apiAccess'),
    notification_preferences: t('contractorsAdmin.detail.settings.labels.notificationPreferences'),
    data_retention_days: t('contractorsAdmin.detail.settings.labels.dataRetentionDays'),
    timezone: t('contractorsAdmin.detail.settings.labels.timezone'),
    locale: t('contractorsAdmin.detail.settings.labels.locale'),
  }

  return (
    <Flex>
      {/* Module Settings */}
      <Box md={6}>
        <Card>
          <CardHeader>
            <strong>
              <Shield size={16} aria-hidden="true" />
              {t('contractorsAdmin.detail.moduleAccess.title')}
            </strong>
          </CardHeader>
          <CardBody>
            {Object.keys(modules).length === 0 ? (
              <Alert status="info">
                <Info size={16} aria-hidden="true" />
                {t('contractorsAdmin.detail.settings.noModuleSettings')}
              </Alert>
            ) : (
              <List>
                {Object.entries(modules).map(([key, value]) => (
                  <ListItem
                    key={key}
                   
                  >
                    <span>
                      <strong>{moduleLabels[key] || key}</strong>
                      <br />
                      <small>
                        {key === 'dashboard' &&
                          t('contractorsAdmin.detail.settings.moduleDescriptions.dashboard')}
                        {key === 'proposals' &&
                          t('contractorsAdmin.detail.settings.moduleDescriptions.proposals')}
                        {key === 'customers' &&
                          t('contractorsAdmin.detail.settings.moduleDescriptions.customers')}
                        {key === 'resources' &&
                          t('contractorsAdmin.detail.settings.moduleDescriptions.resources')}
                      </small>
                    </span>
                    {formatBoolean(value)}
                  </ListItem>
                ))}
              </List>
            )}
          </CardBody>
        </Card>
      </Box>

      {/* Contractor Settings */}
      <Box md={6}>
        <Card>
          <CardHeader>
            <strong>
              <Settings size={16} aria-hidden="true" />
              {t('contractorsAdmin.detail.settings.title')}
            </strong>
          </CardHeader>
          <CardBody>
            {Object.keys(parsedContractorSettings).length === 0 ? (
              <Alert status="info">
                <Info size={16} aria-hidden="true" />
                {t('contractorsAdmin.detail.settings.noneConfigured')}
              </Alert>
            ) : (
              <List>
                {Object.entries(parsedContractorSettings).map(([key, value]) => (
                  <ListItem
                    key={key}
                   
                  >
                    <span>
                      <strong>{settingsLabels[key] || key.replace(/_/g, ' ')}</strong>
                      <br />
                      <small>
                        {key === 'allow_subcontractors' &&
                          t('contractorsAdmin.detail.settings.descriptions.allowSubcontractors')}
                        {key === 'max_users' &&
                          t('contractorsAdmin.detail.settings.descriptions.maxUsers')}
                        {key === 'billing_enabled' &&
                          t('contractorsAdmin.detail.settings.descriptions.billingEnabled')}
                        {key === 'custom_branding' &&
                          t('contractorsAdmin.detail.settings.descriptions.customBranding')}
                        {key === 'api_access' &&
                          t('contractorsAdmin.detail.settings.descriptions.apiAccess')}
                        {key === 'data_retention_days' &&
                          t('contractorsAdmin.detail.settings.descriptions.dataRetentionDays')}
                      </small>
                    </span>
                    <span>
                      {typeof value === 'boolean' ? (
                        formatBoolean(value)
                      ) : typeof value === 'object' ? (
                        <Badge status="info">
                          {t('contractorsAdmin.detail.settings.objectLabel')}
                        </Badge>
                      ) : (
                        <strong>{value}</strong>
                      )}
                    </span>
                  </ListItem>
                ))}
              </List>
            )}
          </CardBody>
        </Card>
      </Box>

      {/* Raw JSON Display */}
      <Box xs={12}>
        <Card>
          <CardHeader>
            <strong>
              <Info size={16} aria-hidden="true" />
              {t('contractorsAdmin.detail.settings.raw.title')}
            </strong>
          </CardHeader>
          <CardBody>
            <Flex>
              <Box md={6}>
                <h6>{t('contractorsAdmin.detail.settings.raw.modules')}</h6>
                <pre className="bg-light p-3 rounded small">
                  <code>{JSON.stringify(modules, null, 2)}</code>
                </pre>
              </Box>
              <Box md={6}>
                <h6>{t('contractorsAdmin.detail.settings.raw.contractorSettings')}</h6>
                <pre className="bg-light p-3 rounded small">
                  <code>{JSON.stringify(contractorSettings, null, 2)}</code>
                </pre>
              </Box>
            </Flex>
          </CardBody>
        </Card>
      </Box>

      {/* Summary Information */}
      <Box xs={12}>
        <Card>
          <CardHeader>
            <strong>{t('contractorsAdmin.detail.settings.summary.title')}</strong>
          </CardHeader>
          <CardBody>
            <Flex>
              <Box md={4}>
                <h4>{Object.values(modules).filter(Boolean).length}</h4>
                <p>
                  {t('contractorsAdmin.detail.settings.summary.enabledModules')}
                </p>
                <small>
                  {t('contractorsAdmin.detail.settings.summary.ofTotal', {
                    total: Object.keys(modules).length,
                  })}
                </small>
              </Box>
              <Box md={4}>
                <h4>{Object.keys(contractorSettings).length}</h4>
                <p>
                  {t('contractorsAdmin.detail.settings.summary.settingsConfigured')}
                </p>
                <small>
                  {t('contractorsAdmin.detail.settings.summary.customOptions')}
                </small>
              </Box>
              <Box md={4}>
                <h4>
                  {contractorSettings.max_users ||
                    t('contractorsAdmin.detail.settings.summary.unlimited')}
                </h4>
                <p>
                  {t('contractorsAdmin.detail.settings.summary.maxUsers')}
                </p>
                <small>
                  {t('contractorsAdmin.detail.settings.summary.userLimitHint')}
                </small>
              </Box>
            </Flex>
          </CardBody>
        </Card>
      </Box>
    </Flex>
  )
}
export default SettingsTab
