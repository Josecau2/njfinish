import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Alert, Button, CardBody, CardHeader, Flex, Heading, Icon, SimpleGrid, Spinner, Stack, Text, Wrap, useColorModeValue } from '@chakra-ui/react'
import StandardCard from '../../components/StandardCard'
import { FileText, User } from 'lucide-react'
import axiosInstance from '../../helpers/axiosInstance'
import PageContainer from '../../components/PageContainer'

const ContractorDashboard = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [stats, setStats] = useState({
    proposals: 0,
    customers: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Stabilize user object to prevent re-renders
  const user = useMemo(() => {
    return JSON.parse(localStorage.getItem('user') || '{}')
  }, [])

  const groupName = user.group?.name || 'Unknown Group'

  // Stabilize groupId to prevent re-renders
  const groupId = useMemo(() => {
    return user.group?.id ?? user.group_id ?? user.groupId ?? user.group?.group_id ?? null
  }, [user.group?.id, user.group_id, user.groupId, user.group?.group_id])

  const modulesList = useMemo(() => {
    const raw = user.group?.modules
    try {
      if (Array.isArray(raw)) return raw
      if (typeof raw === 'string' && raw.trim()) {
        const parsed = JSON.parse(raw)
        // Re-run normalization on parsed value
        if (Array.isArray(parsed)) return parsed
        if (parsed && typeof parsed === 'object') {
          return Object.entries(parsed)
            .filter(([, v]) => !!v)
            .map(([k]) => k)
        }
        return []
      }
      if (raw && typeof raw === 'object') {
        return Object.entries(raw)
          .filter(([, v]) => !!v)
          .map(([k]) => k)
      }
      return []
    } catch (e) {
      console.warn('Failed to parse modules JSON; defaulting to []', e)
      return []
    }
  }, [JSON.stringify(user.group?.modules)])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)

        // Fetch real stats from APIs
        // axiosInstance includes base URL and auth by default

        let proposalsCount = 0
        let customersCount = 0
        // Removed users/team members count for contractor dashboard

        // Fetch proposals count if module is enabled
        if (modulesList.includes('proposals')) {
          try {
            const proposalsResponse = await axiosInstance.get('/api/quotes')
            const proposalsData = proposalsResponse.data
            const allProposals = Array.isArray(proposalsData)
              ? proposalsData
              : proposalsData?.proposals || proposalsData?.data || proposalsData?.items || []

            // Filter to contractor's own group if groupId present
            const ownProposals = groupId
              ? allProposals.filter((p) => {
                  const og = p?.owner_group_id ?? p?.ownerGroupId ?? p?.group_id ?? p?.groupId
                  return og === groupId
                })
              : allProposals

            proposalsCount = ownProposals.length
          } catch (err) {
            console.warn('Failed to fetch proposals count:', err)
          }
        }

        // Fetch customers count if module is enabled
        if (modulesList.includes('customers')) {
          try {
            const customersResponse = await axiosInstance.get('/api/customers')
            const customersData = customersResponse.data
            const allCustomers = Array.isArray(customersData)
              ? customersData
              : customersData?.customers || customersData?.data || customersData?.items || []

            const ownCustomers = groupId
              ? allCustomers.filter((c) => {
                  const cg = c?.owner_group_id ?? c?.ownerGroupId ?? c?.group_id ?? c?.groupId
                  return cg === groupId
                })
              : allCustomers

            customersCount = ownCustomers.length
          } catch (err) {
            console.warn('Failed to fetch customers count:', err)
          }
        }

        setStats({
          proposals: proposalsCount,
          customers: customersCount,
        })
      } catch (err) {
        setError(t('dashboard.loadError'))
        console.error('Dashboard error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [groupId]) // Simplified dependencies - removed modulesList since it's used inside the effect

  const showProposals = modulesList.includes('proposals')
  const showCustomers = modulesList.includes('customers')
  const hasStatsCards = showProposals || showCustomers

  if (loading) {
    return (
      <Flex align="center" justify="center" minH="200px">
        <Spinner size="lg" />
      </Flex>
    )
  }

  return (
    <PageContainer>
      <StandardCard>
        <CardHeader borderBottomWidth="1px">
          <Stack spacing={4}>
            <Heading size="md">{t('dashboard.welcome', { group: groupName })}</Heading>
            <Text color={useColorModeValue("gray.500", "gray.400")}>{t('dashboard.portal')}</Text>
          </Stack>
        </CardHeader>
        <CardBody>
          <Stack spacing={6}>
            {error && (
              <Alert status="error" variant="left-accent">
                {error}
              </Alert>
            )}

            {hasStatsCards && (
              <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap={4}>
                {showProposals && (
                  <StandardCard bg="brand.600" color="white" shadow="lg">
                    <CardBody display="flex" alignItems="flex-start" justifyContent="space-between" gap={4}>
                      <Stack spacing={4}>
                        <Text fontSize="3xl" fontWeight="semibold" lineHeight="shorter">
                          {stats.proposals}
                        </Text>
                        <Text fontSize="sm" color="whiteAlpha.800">
                          {t('nav.proposals')}
                        </Text>
                      </Stack>
                      <Flex align="center" justify="center" bg="whiteAlpha.300" borderRadius="lg" p={2}>
                        <Icon as={FileText} boxSize={6} />
                      </Flex>
                    </CardBody>
                  </StandardCard>
                )}

                {showCustomers && (
                  <StandardCard bg="green.600" color="white" shadow="lg">
                    <CardBody display="flex" alignItems="flex-start" justifyContent="space-between" gap={4}>
                      <Stack spacing={4}>
                        <Text fontSize="3xl" fontWeight="semibold" lineHeight="shorter">
                          {stats.customers}
                        </Text>
                        <Text fontSize="sm" color="whiteAlpha.800">
                          {t('nav.customers')}
                        </Text>
                      </Stack>
                      <Flex align="center" justify="center" bg="whiteAlpha.300" borderRadius="lg" p={2}>
                        <Icon as={User} boxSize={6} />
                      </Flex>
                    </CardBody>
                  </StandardCard>
                )}
              </SimpleGrid>
            )}

            <Stack spacing={4}>
              <Heading size="sm">{t('dashboard.quickActions')}</Heading>
              <Wrap spacing={4} shouldWrapChildren>
                {showProposals && (
                  <Button
                    minH="44px"
                    variant="outline"
                    colorScheme="brand"
                    aria-label={t('dashboard.createProposal')}
                    onClick={() => navigate('/quotes/create')}
                  >
                    {t('dashboard.createProposal')}
                  </Button>
                )}
                {showCustomers && (
                  <Button
                    minH="44px"
                    variant="outline"
                    colorScheme="green"
                    aria-label={t('nav.addCustomer')}
                    onClick={() => navigate('/customers/add')}
                  >
                    {t('nav.addCustomer')}
                  </Button>
                )}
                <Button
                  minH="44px"
                  variant="outline"
                  colorScheme="brand"
                  aria-label={t('dashboard.viewProfile')}
                  onClick={() => navigate('/profile')}
                >
                  {t('dashboard.viewProfile')}
                </Button>
              </Wrap>
            </Stack>
          </Stack>
        </CardBody>
      </StandardCard>
    </PageContainer>
  )
}

export default ContractorDashboard
