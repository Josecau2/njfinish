import React from 'react'
import { useTranslation } from 'react-i18next'
import { formatDate } from '../../../helpers/dateUtils'
import { Flex, Box, CardBody, CardHeader, Badge, List, ListItem, Progress } from '@chakra-ui/react'
import StandardCard from '../../../components/StandardCard'
import {
  User,
  Users,
  BriefcaseBusiness,
  Calendar,
  CheckCircle,
  XCircle,
  LayoutGrid,
} from 'lucide-react'
import { ICON_SIZE_MD, ICON_BOX_MD } from '../../../constants/iconSizes'

const OverviewTab = ({ contractor }) => {
  const { t } = useTranslation()

  const getModuleBadges = (modules) => {
    if (!modules || typeof modules !== 'object') return []

    const moduleLabels = {
      dashboard: { label: t('contractorsAdmin.modules.dashboard'), color: 'primary' },
      proposals: { label: t('contractorsAdmin.modules.proposals'), color: 'success' },
      customers: { label: t('contractorsAdmin.modules.customers'), color: 'warning' },
      resources: { label: t('contractorsAdmin.modules.resources'), color: 'info' },
    }

    // Parse modules if it's a string
    let parsedModules = modules
    if (typeof modules === 'string') {
      try {
        parsedModules = JSON.parse(modules)
      } catch (e) {
        console.error('Error parsing modules:', e)
        return []
      }
    }

    // Return all possible modules with their enabled status from the object
    return ['dashboard', 'proposals', 'customers', 'resources'].map((key) => ({
      key,
      label: moduleLabels[key]?.label || key,
      color: moduleLabels[key]?.color || 'secondary',
      enabled: parsedModules[key] === true,
    }))
  }

  const moduleData = getModuleBadges(contractor.modules)
  const enabledModules = moduleData.filter((m) => m.enabled).length
  const totalModules = moduleData.length
  const modulePercentage = totalModules > 0 ? (enabledModules / totalModules) * 100 : 0

  return (
    <Flex>
      {/* Stats Cards */}
      <Box sm={6} lg={3}>
        <StandardCard>
          <CardBody>
            <User size={32} className="text-primary mb-3" aria-hidden="true" />
            <h3>{contractor.stats?.user_count || 0}</h3>
            <p>{t('contractorsAdmin.table.users')}</p>
          </CardBody>
        </StandardCard>
      </Box>

      <Box sm={6} lg={3}>
        <StandardCard>
          <CardBody>
            <Users size={32} className="text-warning mb-3" aria-hidden="true" />
            <h3>{contractor.stats?.customer_count || 0}</h3>
            <p>{t('contractorsAdmin.table.customers')}</p>
          </CardBody>
        </StandardCard>
      </Box>

      <Box sm={6} lg={3}>
        <StandardCard>
          <CardBody>
            <BriefcaseBusiness size={32} className="text-success mb-3" aria-hidden="true" />
            <h3>{contractor.stats?.proposal_count || 0}</h3>
            <p>{t('contractorsAdmin.table.proposals')}</p>
          </CardBody>
        </StandardCard>
      </Box>

      <Box sm={6} lg={3}>
        <StandardCard>
          <CardBody>
            <LayoutGrid size={32} className="text-info mb-3" aria-hidden="true" />
            <h3>
              {enabledModules}/{totalModules}
            </h3>
            <p>{t('contractorsAdmin.table.modules')}</p>
          </CardBody>
        </StandardCard>
      </Box>

      {/* Basic Information */}
      <Box md={6}>
        <StandardCard>
          <CardHeader>
            <strong>{t('contractorsAdmin.detail.basicInfo.title')}</strong>
          </CardHeader>
          <CardBody>
            <List flush>
              <ListItem>
                <span>
                  <Users size={ICON_SIZE_MD} aria-hidden="true" />
                  {t('contractorsAdmin.detail.basicInfo.contractorName')}
                </span>
                <strong>{contractor.name}</strong>
              </ListItem>
              <ListItem>
                <span>
                  <Calendar size={ICON_SIZE_MD} aria-hidden="true" />
                  {t('contractorsAdmin.detail.basicInfo.createdDate')}
                </span>
                <span>{formatDate(contractor.created_at)}</span>
              </ListItem>
              <ListItem>
                <span>{t('contractorsAdmin.detail.basicInfo.groupType')}</span>
                <Badge status="info">{contractor.group_type || 'contractor'}</Badge>
              </ListItem>
              {contractor.contractor_settings?.max_users && (
                <ListItem>
                  <span>{t('contractorsAdmin.detail.basicInfo.maxUsers')}</span>
                  <span>{contractor.contractor_settings.max_users}</span>
                </ListItem>
              )}
            </List>
          </CardBody>
        </StandardCard>
      </Box>

      {/* Module Access */}
      <Box md={6}>
        <StandardCard>
          <CardHeader>
            <strong>{t('contractorsAdmin.detail.moduleAccess.title')}</strong>
            <div>
              <small>
                {t('contractorsAdmin.detail.moduleAccess.enabledOfTotal', {
                  enabled: enabledModules,
                  total: totalModules,
                })}
              </small>
            </div>
          </CardHeader>
          <CardBody>
            <div>
              <Progress
                value={modulePercentage}
                colorScheme={
                  modulePercentage > 75 ? 'green' : modulePercentage > 50 ? 'yellow' : 'red'
                }
               
              />
              <small>
                {t('contractorsAdmin.detail.moduleAccess.percentEnabled', {
                  percent: Math.round(modulePercentage),
                })}
              </small>
            </div>

            <List flush>
              {moduleData.map((module) => (
                <ListItem
                  key={module.key}
                 
                >
                  <span>
                    {module.enabled ? (
                      <Icon as={CheckCircle} boxSize={ICON_BOX_MD} color="green.500" mr={2} aria-hidden="true" />
                    ) : (
                      <Icon as={XCircle} boxSize={ICON_BOX_MD} color="red.500" mr={2} aria-hidden="true" />
                    )}
                    {module.label}
                  </span>
                  <Badge colorScheme={module.enabled ? (module.colorScheme || 'green') : 'gray'}>
                    {module.enabled
                      ? t('contractorsAdmin.detail.enabled')
                      : t('contractorsAdmin.detail.disabled')}
                  </Badge>
                </ListItem>
              ))}
            </List>
          </CardBody>
        </StandardCard>
      </Box>

      {/* Activity Summary */}
      <Box xs={12}>
        <StandardCard>
          <CardHeader>
            <strong>{t('contractorsAdmin.detail.activity.title')}</strong>
          </CardHeader>
          <CardBody>
            <Flex>
              <Box md={4}>
                <div>
                  <h4>{contractor.stats?.user_count || 0}</h4>
                  <p>
                    {t('contractorsAdmin.detail.activity.totalUsers')}
                  </p>
                  <small>
                    {t('contractorsAdmin.detail.activity.totalUsersHint')}
                  </small>
                </div>
              </Box>
              <Box md={4}>
                <div>
                  <h4>{contractor.stats?.customer_count || 0}</h4>
                  <p>
                    {t('contractorsAdmin.detail.activity.totalCustomers')}
                  </p>
                  <small>
                    {t('contractorsAdmin.detail.activity.totalCustomersHint')}
                  </small>
                </div>
              </Box>
              <Box md={4}>
                <div>
                  <h4>{contractor.stats?.proposal_count || 0}</h4>
                  <p>
                    {t('contractorsAdmin.detail.activity.totalProposals')}
                  </p>
                  <small>
                    {t('contractorsAdmin.detail.activity.totalProposalsHint')}
                  </small>
                </div>
              </Box>
            </Flex>
          </CardBody>
        </StandardCard>
      </Box>
    </Flex>
  )
}

export default OverviewTab
