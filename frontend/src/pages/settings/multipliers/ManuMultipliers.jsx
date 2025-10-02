import { useEffect, useState } from 'react'
import { Badge, Box, CardBody, Center, Container, Flex, HStack, Icon, IconButton, Input, InputGroup, InputLeftElement, SimpleGrid, Stack, Switch, Table, TableContainer, Tbody, Td, Text, Th, Thead, Tr, useColorModeValue } from '@chakra-ui/react'
import PageContainer from '../../../components/PageContainer'
import StandardCard from '../../../components/StandardCard'
import { useDispatch, useSelector } from 'react-redux'
import { Search, Settings, Users, User, Pencil } from 'lucide-react'
import Swal from 'sweetalert2'
import { useTranslation } from 'react-i18next'

import EditGroupModal from '../../../components/model/EditGroupModal'
import {
  fetchMultiManufacturers,
  updateMultiManufacturer,
  createMultiManufacturer,
} from '../../../store/slices/manufacturersMultiplierSlice'
import PaginationComponent from '../../../components/common/PaginationComponent'
import PageHeader from '../../../components/PageHeader'
import { fetchUserMultipliers, fetchUsers } from '../../../store/slices/userGroupSlice'
import { ICON_SIZE_MD, ICON_BOX_MD } from '../../../constants/iconSizes'

const ManuMultipliers = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { list: usersGroup = [], allGroups = [] } = useSelector((state) => state.usersGroup || {})
  const { list: multiManufacturers = [] } = useSelector((state) => state.multiManufacturer || {})
  const customization = useSelector((state) => state.customization)

  const [filterText, setFilterText] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [sortDirection, setSortDirection] = useState('desc')
  const [showModal, setShowModal] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  useEffect(() => {
    dispatch(fetchUsers())
    dispatch(fetchUserMultipliers())
    dispatch(fetchMultiManufacturers())
  }, [dispatch])

  const mergedGroups = allGroups
    .map((group) => {
      const multiplierEntry = usersGroup.find((mg) => mg.user_group?.id === group.id)

      return {
        id: multiplierEntry?.id || null,
        user_group: group,
        multiplier: multiplierEntry?.multiplier || null,
        enabled: multiplierEntry?.enabled || 0,
      }
    })
    .filter((group) => group.user_group.id !== 2)

  const toggleEnabled = (group, currentEnabled) => {
    const updatedData = { enabled: !currentEnabled }

    if (!group.id) {
      updatedData.user_group_id = group.user_group.id
      updatedData.multiplier = 1.0

      dispatch(createMultiManufacturer(updatedData))
        .unwrap()
        .then(() => {
          dispatch(fetchMultiManufacturers())
          dispatch(fetchUserMultipliers())
          Swal.fire({
            toast: true,
            position: 'top',
            icon: 'success',
            title: t('settings.userGroups.multipliers.toast.updateSuccess'),
            showConfirmButton: false,
            timer: 1500,
            width: '360px',
            didOpen: (toast) => {
              toast.style.padding = '8px 12px'
              toast.style.fontSize = '14px'
              toast.style.minHeight = 'auto'
            },
          })
        })
        .catch((err) => {
          console.error('Toggle failed:', err)
          Swal.fire({
            toast: true,
            position: 'top',
            icon: 'error',
            title: t('settings.userGroups.multipliers.toast.updateFailed'),
            showConfirmButton: false,
            timer: 1500,
            width: '330px',
            didOpen: (toast) => {
              toast.style.padding = '8px 12px'
              toast.style.fontSize = '14px'
              toast.style.minHeight = 'auto'
            },
          })
        })
    } else {
      dispatch(updateMultiManufacturer({ id: group.id, data: updatedData }))
        .unwrap()
        .then(() => {
          dispatch(fetchMultiManufacturers())
          dispatch(fetchUserMultipliers())
          Swal.fire({
            toast: true,
            position: 'top',
            icon: 'success',
            title: t('settings.userGroups.multipliers.toast.updateSuccess'),
            showConfirmButton: false,
            timer: 1500,
            width: '360px',
            didOpen: (toast) => {
              toast.style.padding = '8px 12px'
              toast.style.fontSize = '14px'
              toast.style.minHeight = 'auto'
            },
          })
        })
        .catch((err) => {
          console.error('Toggle failed:', err)
          Swal.fire({
            toast: true,
            position: 'top',
            icon: 'error',
            title: t('settings.userGroups.multipliers.toast.updateFailed'),
            showConfirmButton: false,
            timer: 1500,
            width: '330px',
            didOpen: (toast) => {
              toast.style.padding = '8px 12px'
              toast.style.fontSize = '14px'
              toast.style.minHeight = 'auto'
            },
          })
        })
    }
  }

  const handleEdit = (group) => {
    setSelectedGroup(group)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setSelectedGroup(null)
  }

  const handleSave = (updatedData) => {
    if (!selectedGroup) return

    if (!selectedGroup.id) {
      updatedData.user_group_id = selectedGroup.user_group.id
      dispatch(createMultiManufacturer(updatedData))
        .unwrap()
        .then((res) => {
          setShowModal(false)
          setSelectedGroup(null)
          Swal.fire(t('common.success') + '!', res.message || t('settings.userGroups.multipliers.toast.updateSuccess'), 'success')
          dispatch(fetchMultiManufacturers())
          dispatch(fetchUserMultipliers())
        })
        .catch((err) => {
          console.error('Create failed', err)
          Swal.fire(t('common.error'), err.message || t('settings.userGroups.multipliers.toast.updateFailed'), 'error')
        })
    } else {
      dispatch(updateMultiManufacturer({ id: selectedGroup.id, data: updatedData }))
        .unwrap()
        .then((res) => {
          setShowModal(false)
          setSelectedGroup(null)
          Swal.fire(t('common.success') + '!', res.message || t('settings.userGroups.multipliers.toast.updateSuccess'), 'success')
          dispatch(fetchMultiManufacturers())
          dispatch(fetchUserMultipliers())
        })
        .catch((err) => {
          console.error('Update failed', err)
          Swal.fire(t('common.error'), err.message || t('settings.userGroups.multipliers.toast.updateFailed'), 'error')
        })
    }
  }

  const filteredGroups = mergedGroups.filter((group) => {
    const groupName = group.user_group?.name || ''
    return groupName.toLowerCase().includes(filterText.toLowerCase())
  })

  const startIdx = (currentPage - 1) * itemsPerPage
  const endIdx = startIdx + itemsPerPage
  const paginatedGroups = filteredGroups.slice(startIdx, endIdx)
  const totalPages = Math.ceil(filteredGroups.length / itemsPerPage)

  const enabledCount = mergedGroups.filter((group) => group.enabled === 1).length
  const disabledCount = mergedGroups.length - enabledCount
  const accentColor = customization?.headerBg || "purple.500"
  const tableHeaderBg = useColorModeValue('gray.50', 'gray.900')

  return (
    <PageContainer>
      <Stack spacing={6}>
        <PageHeader
          title={t('settings.userGroups.multipliers.header')}
          subtitle={t('settings.userGroups.multipliers.subtitle')}
          icon={Users}
          actions={[
            <Badge key="group-count" variant="subtle" colorScheme="gray" px={3} py={1} borderRadius="md">
              <HStack spacing={4}>
                <Icon as={Users} boxSize={ICON_BOX_MD} aria-hidden="true" />
                <Text fontSize="sm">{mergedGroups.length} {t('settings.userGroups.multipliers.groups')}</Text>
              </HStack>
            </Badge>,
          ]}
        />

        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
          <StandardCard variant="outline" borderColor="green.100">
            <CardBody>
              <HStack spacing={4} align="center">
                <Flex align="center" justify="center" w={12} h={12} borderRadius="lg" bg="green.50" color="green.500">
                  <Icon as={Settings} boxSize={6} aria-hidden="true" />
                </Flex>
                <Box>
                  <Text fontSize="lg" fontWeight="semibold" color="green.600">
                    {enabledCount}
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    {t('settings.userGroups.multipliers.stats.activeGroups')}
                  </Text>
                </Box>
              </HStack>
            </CardBody>
          </StandardCard>

          <StandardCard variant="outline" borderColor="red.100">
            <CardBody>
              <HStack spacing={4} align="center">
                <Flex align="center" justify="center" w={12} h={12} borderRadius="lg" bg="red.50" color="red.500">
                  <Icon as={Settings} boxSize={6} aria-hidden="true" />
                </Flex>
                <Box>
                  <Text fontSize="lg" fontWeight="semibold" color="red.500">
                    {disabledCount}
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    {t('settings.userGroups.multipliers.stats.inactiveGroups')}
                  </Text>
                </Box>
              </HStack>
            </CardBody>
          </StandardCard>

          <StandardCard variant="outline" borderColor={`${accentColor}40`}>
            <CardBody>
              <HStack spacing={4} align="center">
                <Flex
                  align="center"
                  justify="center"
                  w={12}
                  h={12}
                  borderRadius="lg"
                  bg={`${accentColor}20`}
                  color={accentColor}
                >
                  <Icon as={User} boxSize={6} aria-hidden="true" />
                </Flex>
                <Box>
                  <Text fontSize="lg" fontWeight="semibold" color={accentColor}>
                    {usersGroup.length}
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    {t('settings.userGroups.multipliers.stats.totalGroups')}
                  </Text>
                </Box>
              </HStack>
            </CardBody>
          </StandardCard>
        </SimpleGrid>

        <StandardCard variant="outline">
          <CardBody>
            <Flex direction={{ base: 'column', md: 'row' }} gap={4} align={{ base: 'stretch', md: 'center' }}>
              <InputGroup maxW={{ base: 'full', md: '360px' }}>
                <InputLeftElement pointerEvents="none">
                  <Icon as={Search} color="gray.400" boxSize={ICON_BOX_MD} />
                </InputLeftElement>
                <Input
                  value={filterText}
                  onChange={(event) => {
                    setFilterText(event.target.value)
                    setCurrentPage(1)
                  }}
                  placeholder={t('settings.userGroups.multipliers.searchPlaceholder')}
                  aria-label={t('settings.userGroups.multipliers.searchPlaceholder')}
                />
              </InputGroup>

              <Box flex="1" textAlign={{ base: 'left', md: 'right' }}>
                <Text fontSize="sm" color="gray.500">
                  {t('settings.userGroups.multipliers.showing', {
                    count: filteredGroups.length,
                    total: mergedGroups.length,
                  })}
                </Text>
              </Box>
            </Flex>
          </CardBody>
        </StandardCard>

        <StandardCard variant="outline">
          <CardBody p={0}>
            <Box overflowX="auto" data-scroll-region>
              <Table variant="simple">
                <Thead bg={tableHeaderBg}>
                  <Tr>
                    <Th>
                      <HStack spacing={4}>
                        <Icon as={Users} boxSize={ICON_BOX_MD} aria-hidden="true" />
                        <Text>{t('settings.userGroups.multipliers.table.groupName')}</Text>
                      </HStack>
                    </Th>
                    <Th>{t('settings.userGroups.multipliers.table.multiplier')}</Th>
                    <Th>{t('settings.userGroups.multipliers.table.status')}</Th>
                    <Th textAlign="center">{t('settings.userGroups.multipliers.table.actions')}</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {paginatedGroups.length === 0 ? (
                    <Tr>
                      <Td colSpan={4}>
                        <Center py={12} flexDirection="column" gap={4}>
                          <Icon as={Search} boxSize={10} color="gray.300" />
                          <Text>{t('settings.userGroups.multipliers.empty.title')}</Text>
                          <Text fontSize="sm" color="gray.500">
                            {t('settings.userGroups.multipliers.empty.subtitle')}
                          </Text>
                        </Center>
                      </Td>
                    </Tr>
                  ) : (
                    paginatedGroups.map((group) => (
                      <Tr key={group.id || `group-${group.user_group.id}`}>
                        <Td py={4}>
                          <Text fontWeight="medium" color="gray.800">
                            {group.user_group?.name || t('common.na')}
                          </Text>
                        </Td>
                        <Td py={4}>
                          <Badge colorScheme="blue" variant="subtle" borderRadius="full" px={3} py={1} fontWeight="semibold">
                            {group.multiplier ? `${group.multiplier}` : t('common.na')}
                          </Badge>
                        </Td>
                        <Td py={4}>
                          <HStack spacing={4}>
                            <Switch
                              size="md"
                              colorScheme="brand"
                              isChecked={group.enabled === 1}
                              onChange={() => toggleEnabled(group, group.enabled)}
                              aria-label={
                                group.enabled === 1
                                  ? t('settings.userGroups.multipliers.status.setInactive')
                                  : t('settings.userGroups.multipliers.status.setActive')
                              }
                            />
                            <Badge
                              colorScheme={group.enabled === 1 ? 'green' : 'gray'}
                              variant="subtle"
                              borderRadius="full"
                              px={3}
                              py={1}
                              fontSize="xs"
                              fontWeight="medium"
                              textTransform="none"
                            >
                              {group.enabled === 1
                                ? t('settings.userGroups.multipliers.status.active')
                                : t('settings.userGroups.multipliers.status.inactive')}
                            </Badge>
                          </HStack>
                        </Td>
                        <Td py={4} textAlign="center">
                          <IconButton size="lg" aria-label={t('settings.userGroups.multipliers.actions.edit')}
                            icon={<Icon as={Pencil} boxSize={ICON_BOX_MD} />}
                            variant="outline"
                            color={accentColor}
                            borderColor="gray.200"
                            _hover={{
                              bg: `${accentColor}20`,
                              borderColor: accentColor,
                            }}
                            onClick={() => handleEdit(group)}
                          />
                        </Td>
                      </Tr>
                    ))
                  )}
                </Tbody>
              </Table>
            </Box>
            {totalPages > 1 && (
              <Box px={4} py={3}>
                <PaginationComponent
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  itemsPerPage={itemsPerPage}
                />
              </Box>
            )}
          </CardBody>
        </StandardCard>

        <EditGroupModal
          show={showModal}
          onClose={handleCloseModal}
          manufacturer={selectedGroup}
          onSave={handleSave}
        />
      </Stack>
    </PageContainer>
  )
}

export default ManuMultipliers
