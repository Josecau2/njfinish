import StandardCard from '../../components/StandardCard'
import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from 'react-router-dom'
import { decodeParam } from '../../utils/obfuscate'
import { useDispatch, useSelector } from 'react-redux'
import { Alert, AlertDescription, AlertIcon, AlertTitle, Badge, Box, Button, CardBody, CardHeader, Container, Flex, Icon, Spinner, Stack, Tab, TabList, TabPanel, TabPanels, Tabs, Text, useColorModeValue } from '@chakra-ui/react'
import PageContainer from '../../components/PageContainer'
import { ArrowLeft, Users, BarChart3, BriefcaseBusiness, Users as UsersGroup, Settings } from 'lucide-react'
import { fetchContractor } from '../../store/slices/contractorSlice'
import OverviewTab from './ContractorDetail/OverviewTab'
import ProposalsTab from './ContractorDetail/ProposalsTab'
import CustomersTab from './ContractorDetail/CustomersTab'
import SettingsTab from './ContractorDetail/SettingsTab'
import { ICON_SIZE_MD, ICON_BOX_MD } from '../../constants/iconSizes'

const tabConfig = [
  { key: 'overview', labelKey: 'contractorsAdmin.detail.tabs.overview', icon: BarChart3, component: OverviewTab },
  { key: 'proposals', labelKey: 'contractorsAdmin.detail.tabs.proposals', icon: BriefcaseBusiness, component: ProposalsTab },
  { key: 'customers', labelKey: 'contractorsAdmin.detail.tabs.customers', icon: UsersGroup, component: CustomersTab },
  { key: 'settings', labelKey: 'contractorsAdmin.detail.tabs.settings', icon: Settings, component: SettingsTab },
]

const ContractorDetail = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { groupId: rawGroupId } = useParams()
  const groupId = useMemo(() => decodeParam(rawGroupId), [rawGroupId])
  const dispatch = useDispatch()

  const { selectedContractor: contractor, loading, error } = useSelector((state) => state.contractors)

  // Color mode values - MUST be before useState
  const spinnerColor = useColorModeValue("blue.500", "blue.300")
  const iconBlue = useColorModeValue("blue.500", "blue.300")
  const textGray500 = useColorModeValue("gray.500", "gray.400")
  const borderGray = useColorModeValue("gray.100", "gray.700")

  const [activeTabIndex, setActiveTabIndex] = useState(0)

  useEffect(() => {
    if (groupId) {
      dispatch(fetchContractor(groupId))
    }
  }, [dispatch, groupId])

  const handleBack = () => {
    navigate('/admin/contractors')
  }

  if (loading) {
    return (
      <PageContainer>
        <Flex align="center" justify="center" minH="300px">
          <Spinner size="lg" color={iconBlue} />
        </Flex>
      </PageContainer>
    )
  }

  if (error) {
    return (
      <PageContainer>
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          <Box>
            <AlertTitle>{t('contractorsAdmin.detail.errorTitle')}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
            <Button mt={4} leftIcon={<ArrowLeft size={ICON_SIZE_MD} />} onClick={handleBack} colorScheme="brand" minH="44px" maxW={{ base: "220px", md: "none" }} fontSize={{ base: "sm", md: "md" }}>
              {t('contractorsAdmin.detail.backToList')}
            </Button>
          </Box>
        </Alert>
      </PageContainer>
    )
  }

  if (!contractor) {
    return (
      <PageContainer>
        <Alert status="warning" borderRadius="md">
          <AlertIcon />
          <Box>
            <AlertTitle>{t('contractorsAdmin.detail.notFoundTitle')}</AlertTitle>
            <AlertDescription>{t('contractorsAdmin.detail.notFoundText')}</AlertDescription>
            <Button mt={4} leftIcon={<ArrowLeft size={ICON_SIZE_MD} />} onClick={handleBack} colorScheme="brand" minH="44px" maxW={{ base: "220px", md: "none" }} fontSize={{ base: "sm", md: "md" }}>
              {t('contractorsAdmin.detail.backToList')}
            </Button>
          </Box>
        </Alert>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <Stack spacing={6}>
        <Flex align={{ base: 'flex-start', md: 'center' }} direction={{ base: 'column', md: 'row' }} gap={4}>
          <Button onClick={handleBack} leftIcon={<ArrowLeft size={ICON_SIZE_MD} />} variant="outline" colorScheme="gray" minH="44px" maxW={{ base: "140px", md: "none" }} fontSize={{ base: "sm", md: "md" }}>
            {t('common.back')}
          </Button>

          <Flex align="center" gap={4} flex="1" flexWrap="wrap">
            <Flex align="center" gap={4} minW="0">
              <Icon as={Users} boxSize={6} color={iconBlue} />
              <Box minW="0">
                <Text fontSize="xl" fontWeight="semibold" noOfLines={1}>
                  {contractor.name}
                </Text>
                <Text fontSize="sm" color={textGray500}>
                  {t('contractorsAdmin.detail.contractorId')}: {contractor.id}
                </Text>
              </Box>
            </Flex>
            <Badge colorScheme="brand" borderRadius="md" px={3} py={1} fontSize="sm">
              {contractor.group_type || t('contractorsAdmin.detail.contractor')}
            </Badge>
          </Flex>
        </Flex>

        <StandardCard>
          <Tabs
            index={activeTabIndex}
            onChange={setActiveTabIndex}
            variant="soft-rounded"
            colorScheme="brand"
            isLazy
          >
            <CardHeader borderBottomWidth="1px" borderColor={borderGray}>
              <TabList flexWrap="wrap" gap={4}>
                {tabConfig.map((tab) => (
                  <Tab key={tab.key} px={4} py={2} display="flex" alignItems="center" gap={4}>
                    <Icon as={tab.icon} boxSize={ICON_BOX_MD} />
                    {t(tab.labelKey)}
                  </Tab>
                ))}
              </TabList>
            </CardHeader>
            <CardBody>
              <TabPanels>
                {tabConfig.map((tab) => {
                  const TabComponent = tab.component
                  return (
                    <TabPanel key={tab.key} px={0}>
                      <TabComponent contractor={contractor} groupId={groupId} />
                    </TabPanel>
                  )
                })}
              </TabPanels>
            </CardBody>
          </Tabs>
        </StandardCard>
      </Stack>
    </PageContainer>
  )
}

export default ContractorDetail
