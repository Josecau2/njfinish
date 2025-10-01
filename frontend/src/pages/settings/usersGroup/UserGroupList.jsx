import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Card,
  CardBody,
  Badge,
  Switch,
  Spinner,
  Alert,
  Container,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  VStack,
  HStack,
  Grid,
  GridItem,
  Box,
  useColorModeValue,
} from '@chakra-ui/react'
import { Plus, Pencil, Users } from '@/icons-lucide'
import { fetchUsers, updateUser } from '../../../store/slices/userGroupSlice'
import { useNavigate } from 'react-router-dom'
import { buildEncodedPath, genNoise } from '../../../utils/obfuscate'
import { useTranslation } from 'react-i18next'
import PageHeader from '../../../components/PageHeader'
import { motion } from 'framer-motion'

const UserGroupList = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const hoverBg = useColorModeValue('gray.50', 'gray.700')
  // Use the normalized array from the slice (allGroups). Keep a safe fallback.
  const { allGroups = [], loading, error } = useSelector((state) => state.usersGroup || {})
  const userGroups = allGroups
  const [updatingModule, setUpdatingModule] = useState(null)

  useEffect(() => {
    dispatch(fetchUsers())
  }, [dispatch])

  const handleModuleToggle = async (groupId, module, currentModules) => {
    setUpdatingModule(`${groupId}-${module}`)

    try {
      let modulesObj
      if (typeof currentModules === 'string') {
        try {
          modulesObj = JSON.parse(currentModules)
        } catch (e) {
          modulesObj = {
            dashboard: false,
            proposals: false,
            customers: false,
            resources: false,
          }
        }
      } else {
        modulesObj = currentModules || {
          dashboard: false,
          proposals: false,
          customers: false,
          resources: false,
        }
      }

      const newModules = {
        ...modulesObj,
        [module]: !modulesObj[module],
      }

      await dispatch(
        updateUser({
          id: groupId,
          data: { modules: newModules },
        }),
      ).unwrap()
    } catch (error) {
      // noop: could toast
    } finally {
      setUpdatingModule(null)
    }
  }

  const handleCreateGroup = () => {
    navigate('/settings/users/group/create')
  }

  const handleEditGroup = (groupId) => {
    const noisy =
      `/${genNoise(6)}/${genNoise(8)}` +
      buildEncodedPath('/settings/users/group/edit/:id', { id: groupId })
    navigate(noisy)
  }

  const getModuleToggle = (group, module) => {
    let modules
    if (typeof group.modules === 'string') {
      try {
        modules = JSON.parse(group.modules)
      } catch (e) {
        modules = {
          dashboard: false,
          proposals: false,
          customers: false,
          resources: false,
        }
      }
    } else {
      modules = group.modules || {
        dashboard: false,
        proposals: false,
        customers: false,
        resources: false,
      }
    }

    const isEnabled = modules[module] === true
    const isUpdating = updatingModule === `${group.id}-${module}`

    return (
      <HStack spacing={4}>
        <Switch
          id={`${group.id}-${module}`}
          isChecked={isEnabled}
          isDisabled={group.group_type !== 'contractor' || isUpdating}
          onChange={() => handleModuleToggle(group.id, module, modules)}
          size="sm"
          colorScheme="brand"
        />
        {isUpdating && <Spinner size="xs" />}
      </HStack>
    )
  }

  if (loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <VStack spacing={4} justify="center" minH="200px">
          <Spinner size="lg" color="brand.500" />
          <Text color="gray.500">{t('common.loadingUserGroups')}</Text>
        </VStack>
      </Container>
    )
  }

  if (error) {
    return (
      <Container maxW="container.xl" py={8}>
        <Alert status="error" borderRadius="md">
          <Text fontWeight="semibold">{t('settings.userGroups.errorLoading')}</Text>
          <Text ml={2}>{error.message || error.toString() || 'Unknown error'}</Text>
        </Alert>
      </Container>
    )
  }

  return (
    <Container maxW="container.xl" py={8}>
      <PageHeader
        title={t('settings.userGroups.header')}
        icon={Users}
        actions={[
          <Button
            key="create"
            leftIcon={<Plus size={16} />}
            colorScheme="brand"
            onClick={handleCreateGroup}
            as={motion.button}
            whileTap={{ scale: 0.98 }}
          >
            {t('settings.userGroups.actions.create')}
          </Button>,
        ]}
      />

      <Card>
        <CardBody>
          {error && (
            <Alert status="error" mb={6} borderRadius="md">
              <Text>
                {t('settings.userGroups.loadFailed')}:{' '}
                {error.message || error.toString() || t('common.error')}
              </Text>
            </Alert>
          )}

          {/* Desktop table */}
          <Box display={{ base: 'none', md: 'block' }}>
            <Table variant="simple" size="sm">
              <Thead>
                <Tr>
                  <Th scope="col">{t('settings.userGroups.table.name')}</Th>
                  <Th scope="col">{t('settings.userGroups.table.type')}</Th>
                  <Th scope="col">{t('contractorsAdmin.modules.dashboard')}</Th>
                  <Th scope="col">{t('contractorsAdmin.modules.proposals')}</Th>
                  <Th scope="col">{t('contractorsAdmin.modules.customers')}</Th>
                  <Th scope="col">{t('contractorsAdmin.modules.resources')}</Th>
                  <Th scope="col">{t('settings.userGroups.table.actions')}</Th>
                </Tr>
              </Thead>
              <Tbody>
                {userGroups.length === 0 ? (
                  <Tr>
                    <Td colSpan={7} textAlign="center" py={8} color="gray.500">
                      {t('settings.userGroups.empty')}
                    </Td>
                  </Tr>
                ) : (
                  userGroups.map((group) => (
                    <Tr key={group.id} _hover={{ bg: hoverBg }}>
                      <Td>
                        <VStack align="start" spacing={0}>
                          <Text fontWeight="semibold">{group.name || 'Unnamed Group'}</Text>
                          {!group.name && (
                            <Text fontSize="sm" color="gray.500">ID: {group.id}</Text>
                          )}
                        </VStack>
                      </Td>
                      <Td>
                        <Badge
                          colorScheme={group.group_type === 'contractor' ? 'blue' : 'gray'}
                          variant="subtle"
                          borderRadius="full"
                        >
                          {group.group_type === 'contractor'
                            ? t('settings.userGroups.types.contractor')
                            : t('settings.userGroups.types.standard')}
                        </Badge>
                      </Td>
                      <Td>{getModuleToggle(group, 'dashboard')}</Td>
                      <Td>{getModuleToggle(group, 'proposals')}</Td>
                      <Td>{getModuleToggle(group, 'customers')}</Td>
                      <Td>{getModuleToggle(group, 'resources')}</Td>
                      <Td>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditGroup(group.id)}
                          aria-label={t('settings.userGroups.actions.edit')}
                          as={motion.button}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Pencil size={16} />
                        </Button>
                      </Td>
                    </Tr>
                  ))
                )}
              </Tbody>
            </Table>
          </Box>

          {/* Mobile card list */}
          <VStack display={{ base: 'flex', md: 'none' }} spacing={4} align="stretch">
            {userGroups.length === 0 ? (
              <Text textAlign="center" color="gray.500" py={8}>
                {t('settings.userGroups.empty')}
              </Text>
            ) : (
              userGroups.map((group) => (
                <Card key={group.id} variant="outline" size="sm">
                  <CardBody>
                    <HStack justify="space-between" align="start" mb={3}>
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="semibold">{group.name || 'Unnamed Group'}</Text>
                        {!group.name && (
                          <Text fontSize="sm" color="gray.500">ID: {group.id}</Text>
                        )}
                      </VStack>
                      <Badge
                        colorScheme={group.group_type === 'contractor' ? 'blue' : 'gray'}
                        variant="subtle"
                        borderRadius="full"
                      >
                        {group.group_type === 'contractor'
                          ? t('settings.userGroups.types.contractor')
                          : t('settings.userGroups.types.standard')}
                      </Badge>
                    </HStack>

                    <Grid templateColumns="1fr 1fr" gap={4} mb={4}>
                      <GridItem>
                        <HStack justify="space-between">
                          <Text fontSize="sm" color="gray.600">
                            {t('contractorsAdmin.modules.dashboard')}
                          </Text>
                          {getModuleToggle(group, 'dashboard')}
                        </HStack>
                      </GridItem>
                      <GridItem>
                        <HStack justify="space-between">
                          <Text fontSize="sm" color="gray.600">
                            {t('contractorsAdmin.modules.proposals')}
                          </Text>
                          {getModuleToggle(group, 'proposals')}
                        </HStack>
                      </GridItem>
                      <GridItem>
                        <HStack justify="space-between">
                          <Text fontSize="sm" color="gray.600">
                            {t('contractorsAdmin.modules.customers')}
                          </Text>
                          {getModuleToggle(group, 'customers')}
                        </HStack>
                      </GridItem>
                      <GridItem>
                        <HStack justify="space-between">
                          <Text fontSize="sm" color="gray.600">
                            {t('contractorsAdmin.modules.resources')}
                          </Text>
                          {getModuleToggle(group, 'resources')}
                        </HStack>
                      </GridItem>
                    </Grid>

                    <Box textAlign="right">
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<Pencil size={16} />}
                        onClick={() => handleEditGroup(group.id)}
                        aria-label={t('settings.userGroups.actions.edit')}
                        as={motion.button}
                        whileTap={{ scale: 0.98 }}
                      >
                        {t('common.edit')}
                      </Button>
                    </Box>
                  </CardBody>
                </Card>
              ))
            )}
          </VStack>
        </CardBody>
      </Card>
    </Container>
  )
}

export default UserGroupList
