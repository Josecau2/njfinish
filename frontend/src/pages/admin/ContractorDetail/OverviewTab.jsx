import React from 'react'
import { useTranslation } from 'react-i18next'
import { formatDate } from '../../../helpers/dateUtils'
import { Flex, Box, CardBody, CardHeader, Badge, List, ListItem, Progress, useColorModeValue, Icon, Text, Heading, SimpleGrid, VStack, HStack, Stat, StatLabel, StatNumber } from '@chakra-ui/react'
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

  // Color mode values
  const iconGreenColor = useColorModeValue("green.500", "green.300")
  const iconRedColor = useColorModeValue("red.500", "red.300")
  const iconPrimaryColor = useColorModeValue("blue.500", "blue.300")
  const iconWarningColor = useColorModeValue("orange.500", "orange.300")
  const iconSuccessColor = useColorModeValue("green.500", "green.300")
  const iconInfoColor = useColorModeValue("cyan.500", "cyan.300")
  const textSecondary = useColorModeValue("gray.600", "gray.400")

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
    <VStack spacing={6} align="stretch">
      {/* Stats Cards */}
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={4}>
        <StandardCard>
          <CardBody p={6}>
            <Icon as={User} boxSize="32px" color={iconPrimaryColor} mb={3} aria-hidden="true" />
            <Stat>
              <StatNumber fontSize="2xl">{contractor.stats?.user_count || 0}</StatNumber>
              <StatLabel color={textSecondary}>{t('contractorsAdmin.table.users')}</StatLabel>
            </Stat>
          </CardBody>
        </StandardCard>

        <StandardCard>
          <CardBody p={6}>
            <Icon as={Users} boxSize="32px" color={iconWarningColor} mb={3} aria-hidden="true" />
            <Stat>
              <StatNumber fontSize="2xl">{contractor.stats?.customer_count || 0}</StatNumber>
              <StatLabel color={textSecondary}>{t('contractorsAdmin.table.customers')}</StatLabel>
            </Stat>
          </CardBody>
        </StandardCard>

        <StandardCard>
          <CardBody p={6}>
            <Icon as={BriefcaseBusiness} boxSize="32px" color={iconSuccessColor} mb={3} aria-hidden="true" />
            <Stat>
              <StatNumber fontSize="2xl">{contractor.stats?.proposal_count || 0}</StatNumber>
              <StatLabel color={textSecondary}>{t('contractorsAdmin.table.proposals')}</StatLabel>
            </Stat>
          </CardBody>
        </StandardCard>

        <StandardCard>
          <CardBody p={6}>
            <Icon as={LayoutGrid} boxSize="32px" color={iconInfoColor} mb={3} aria-hidden="true" />
            <Stat>
              <StatNumber fontSize="2xl">
                {enabledModules}/{totalModules}
              </StatNumber>
              <StatLabel color={textSecondary}>{t('contractorsAdmin.table.modules')}</StatLabel>
            </Stat>
          </CardBody>
        </StandardCard>
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
        {/* Basic Information */}
        <StandardCard>
          <CardHeader pb={3}>
            <Heading size="md">{t('contractorsAdmin.detail.basicInfo.title')}</Heading>
          </CardHeader>
          <CardBody>
            <List spacing={3}>
              <ListItem>
                <Flex justify="space-between" align="center">
                  <HStack spacing={2}>
                    <Icon as={Users} boxSize={ICON_BOX_MD} aria-hidden="true" />
                    <Text>{t('contractorsAdmin.detail.basicInfo.contractorName')}</Text>
                  </HStack>
                  <Text fontWeight="bold">{contractor.name}</Text>
                </Flex>
              </ListItem>
              <ListItem>
                <Flex justify="space-between" align="center">
                  <HStack spacing={2}>
                    <Icon as={Calendar} boxSize={ICON_BOX_MD} aria-hidden="true" />
                    <Text>{t('contractorsAdmin.detail.basicInfo.createdDate')}</Text>
                  </HStack>
                  <Text>{formatDate(contractor.created_at)}</Text>
                </Flex>
              </ListItem>
              <ListItem>
                <Flex justify="space-between" align="center">
                  <Text>{t('contractorsAdmin.detail.basicInfo.groupType')}</Text>
                  <Badge colorScheme="blue">{contractor.group_type || 'contractor'}</Badge>
                </Flex>
              </ListItem>
              {contractor.contractor_settings?.max_users && (
                <ListItem>
                  <Flex justify="space-between" align="center">
                    <Text>{t('contractorsAdmin.detail.basicInfo.maxUsers')}</Text>
                    <Text>{contractor.contractor_settings.max_users}</Text>
                  </Flex>
                </ListItem>
              )}
            </List>
          </CardBody>
        </StandardCard>

        {/* Module Access */}
        <StandardCard>
          <CardHeader pb={3}>
            <Flex justify="space-between" align="center">
              <Heading size="md">{t('contractorsAdmin.detail.moduleAccess.title')}</Heading>
              <Text fontSize="sm" color={textSecondary}>
                {t('contractorsAdmin.detail.moduleAccess.enabledOfTotal', {
                  enabled: enabledModules,
                  total: totalModules,
                })}
              </Text>
            </Flex>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Box>
                <Progress
                  value={modulePercentage}
                  colorScheme={
                    modulePercentage > 75 ? 'green' : modulePercentage > 50 ? 'yellow' : 'red'
                  }
                  borderRadius="md"
                  mb={2}
                />
                <Text fontSize="sm" color={textSecondary}>
                  {t('contractorsAdmin.detail.moduleAccess.percentEnabled', {
                    percent: Math.round(modulePercentage),
                  })}
                </Text>
              </Box>

              <List spacing={3}>
                {moduleData.map((module) => (
                  <ListItem key={module.key}>
                    <Flex justify="space-between" align="center">
                      <HStack spacing={2}>
                        {module.enabled ? (
                          <Icon as={CheckCircle} boxSize={ICON_BOX_MD} color={iconGreenColor} aria-hidden="true" />
                        ) : (
                          <Icon as={XCircle} boxSize={ICON_BOX_MD} color={iconRedColor} aria-hidden="true" />
                        )}
                        <Text>{module.label}</Text>
                      </HStack>
                      <Badge colorScheme={module.enabled ? (module.colorScheme || 'green') : 'gray'}>
                        {module.enabled
                          ? t('contractorsAdmin.detail.enabled')
                          : t('contractorsAdmin.detail.disabled')}
                      </Badge>
                    </Flex>
                  </ListItem>
                ))}
              </List>
            </VStack>
          </CardBody>
        </StandardCard>
      </SimpleGrid>

      {/* Activity Summary */}
      <StandardCard>
        <CardHeader pb={3}>
          <Heading size="md">{t('contractorsAdmin.detail.activity.title')}</Heading>
        </CardHeader>
        <CardBody>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
            <Box>
              <Stat>
                <StatNumber fontSize="2xl">{contractor.stats?.user_count || 0}</StatNumber>
                <StatLabel mb={2}>{t('contractorsAdmin.detail.activity.totalUsers')}</StatLabel>
                <Text fontSize="sm" color={textSecondary}>
                  {t('contractorsAdmin.detail.activity.totalUsersHint')}
                </Text>
              </Stat>
            </Box>
            <Box>
              <Stat>
                <StatNumber fontSize="2xl">{contractor.stats?.customer_count || 0}</StatNumber>
                <StatLabel mb={2}>{t('contractorsAdmin.detail.activity.totalCustomers')}</StatLabel>
                <Text fontSize="sm" color={textSecondary}>
                  {t('contractorsAdmin.detail.activity.totalCustomersHint')}
                </Text>
              </Stat>
            </Box>
            <Box>
              <Stat>
                <StatNumber fontSize="2xl">{contractor.stats?.proposal_count || 0}</StatNumber>
                <StatLabel mb={2}>{t('contractorsAdmin.detail.activity.totalProposals')}</StatLabel>
                <Text fontSize="sm" color={textSecondary}>
                  {t('contractorsAdmin.detail.activity.totalProposalsHint')}
                </Text>
              </Stat>
            </Box>
          </SimpleGrid>
        </CardBody>
      </StandardCard>
    </VStack>
  )
}

export default OverviewTab
