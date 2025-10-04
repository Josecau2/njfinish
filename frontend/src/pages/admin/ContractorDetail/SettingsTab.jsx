import React from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Box, CardBody, CardHeader, Badge, Alert, List, ListItem, SimpleGrid, Text, Heading, Code, Icon, VStack, HStack, useColorModeValue } from '@chakra-ui/react'
import StandardCard from '../../../components/StandardCard'
import { Settings, Shield, Users, CheckCircle, XCircle, Info } from 'lucide-react'
import { ICON_SIZE_MD, ICON_BOX_MD } from '../../../constants/iconSizes'

const SettingsTab = ({ contractor }) => {
  const { t } = useTranslation()

  // Color mode values
  const bgLight = useColorModeValue('gray.50', 'gray.800')
  const textSecondary = useColorModeValue('gray.600', 'gray.400')

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
    <VStack spacing={6} align="stretch">
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
        {/* Module Settings */}
        <StandardCard>
          <CardHeader>
            <HStack spacing={2}>
              <Icon as={Shield} boxSize={ICON_BOX_MD} aria-hidden="true" />
              <Text fontWeight="bold">{t('contractorsAdmin.detail.moduleAccess.title')}</Text>
            </HStack>
          </CardHeader>
          <CardBody>
            {Object.keys(modules).length === 0 ? (
              <Alert status="info">
                <Info size={ICON_SIZE_MD} aria-hidden="true" />
                {t('contractorsAdmin.detail.settings.noModuleSettings')}
              </Alert>
            ) : (
              <List spacing={3}>
                {Object.entries(modules).map(([key, value]) => (
                  <ListItem key={key}>
                    <Flex justify="space-between" align="start" gap={3}>
                      <Box flex="1">
                        <Text fontWeight="bold">{moduleLabels[key] || key}</Text>
                        <Text fontSize="sm" color={textSecondary} mt={1}>
                          {key === 'dashboard' &&
                            t('contractorsAdmin.detail.settings.moduleDescriptions.dashboard')}
                          {key === 'proposals' &&
                            t('contractorsAdmin.detail.settings.moduleDescriptions.proposals')}
                          {key === 'customers' &&
                            t('contractorsAdmin.detail.settings.moduleDescriptions.customers')}
                          {key === 'resources' &&
                            t('contractorsAdmin.detail.settings.moduleDescriptions.resources')}
                        </Text>
                      </Box>
                      <Box>{formatBoolean(value)}</Box>
                    </Flex>
                  </ListItem>
                ))}
              </List>
            )}
          </CardBody>
        </StandardCard>

        {/* Contractor Settings */}
        <StandardCard>
          <CardHeader>
            <HStack spacing={2}>
              <Icon as={Settings} boxSize={ICON_BOX_MD} aria-hidden="true" />
              <Text fontWeight="bold">{t('contractorsAdmin.detail.settings.title')}</Text>
            </HStack>
          </CardHeader>
          <CardBody>
            {Object.keys(parsedContractorSettings).length === 0 ? (
              <Alert status="info">
                <Info size={ICON_SIZE_MD} aria-hidden="true" />
                {t('contractorsAdmin.detail.settings.noneConfigured')}
              </Alert>
            ) : (
              <List spacing={3}>
                {Object.entries(parsedContractorSettings).map(([key, value]) => (
                  <ListItem key={key}>
                    <Flex justify="space-between" align="start" gap={3}>
                      <Box flex="1">
                        <Text fontWeight="bold">{settingsLabels[key] || key.replace(/_/g, ' ')}</Text>
                        <Text fontSize="sm" color={textSecondary} mt={1}>
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
                        </Text>
                      </Box>
                      <Box>
                        {typeof value === 'boolean' ? (
                          formatBoolean(value)
                        ) : typeof value === 'object' ? (
                          <Badge status="info">
                            {t('contractorsAdmin.detail.settings.objectLabel')}
                          </Badge>
                        ) : (
                          <Text fontWeight="bold">{value}</Text>
                        )}
                      </Box>
                    </Flex>
                  </ListItem>
                ))}
              </List>
            )}
          </CardBody>
        </StandardCard>
      </SimpleGrid>

      {/* Raw JSON Display */}
      <StandardCard>
        <CardHeader>
          <HStack spacing={2}>
            <Icon as={Info} boxSize={ICON_BOX_MD} aria-hidden="true" />
            <Text fontWeight="bold">{t('contractorsAdmin.detail.settings.raw.title')}</Text>
          </HStack>
        </CardHeader>
        <CardBody>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
            <Box>
              <Heading size="sm" mb={3}>{t('contractorsAdmin.detail.settings.raw.modules')}</Heading>
              <Box bg={bgLight} p={3} borderRadius="md" fontSize="sm" overflowX="auto">
                <Code display="block" whiteSpace="pre" bg="transparent">
                  {JSON.stringify(modules, null, 2)}
                </Code>
              </Box>
            </Box>
            <Box>
              <Heading size="sm" mb={3}>{t('contractorsAdmin.detail.settings.raw.contractorSettings')}</Heading>
              <Box bg={bgLight} p={3} borderRadius="md" fontSize="sm" overflowX="auto">
                <Code display="block" whiteSpace="pre" bg="transparent">
                  {JSON.stringify(contractorSettings, null, 2)}
                </Code>
              </Box>
            </Box>
          </SimpleGrid>
        </CardBody>
      </StandardCard>

      {/* Summary Information */}
      <StandardCard>
        <CardHeader>
          <Text fontWeight="bold">{t('contractorsAdmin.detail.settings.summary.title')}</Text>
        </CardHeader>
        <CardBody>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
            <Box>
              <Heading size="lg">{Object.values(modules).filter(Boolean).length}</Heading>
              <Text mt={2}>
                {t('contractorsAdmin.detail.settings.summary.enabledModules')}
              </Text>
              <Text fontSize="sm" color={textSecondary} mt={1}>
                {t('contractorsAdmin.detail.settings.summary.ofTotal', {
                  total: Object.keys(modules).length,
                })}
              </Text>
            </Box>
            <Box>
              <Heading size="lg">{Object.keys(contractorSettings).length}</Heading>
              <Text mt={2}>
                {t('contractorsAdmin.detail.settings.summary.settingsConfigured')}
              </Text>
              <Text fontSize="sm" color={textSecondary} mt={1}>
                {t('contractorsAdmin.detail.settings.summary.customOptions')}
              </Text>
            </Box>
            <Box>
              <Heading size="lg">
                {contractorSettings.max_users ||
                  t('contractorsAdmin.detail.settings.summary.unlimited')}
              </Heading>
              <Text mt={2}>
                {t('contractorsAdmin.detail.settings.summary.maxUsers')}
              </Text>
              <Text fontSize="sm" color={textSecondary} mt={1}>
                {t('contractorsAdmin.detail.settings.summary.userLimitHint')}
              </Text>
            </Box>
          </SimpleGrid>
        </CardBody>
      </StandardCard>
    </VStack>
  )
}
export default SettingsTab
