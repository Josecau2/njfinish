import { useEffect, useState } from 'react'
import { Badge, Box, CardBody, Center, Container, Flex, HStack, Icon, IconButton, Input, InputGroup, InputLeftElement, SimpleGrid, Stack, Switch, Table, TableContainer, Tbody, Td, Text, Th, Thead, Tr, useColorModeValue } from '@chakra-ui/react'
import PageContainer from '../../../components/PageContainer'
import StandardCard from '../../../components/StandardCard'
import { useDispatch, useSelector } from 'react-redux'
import { Search, Settings, Users, User, Pencil } from 'lucide-react'
import { useToast } from '@chakra-ui/react'
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
  const toast = useToast()
  const { list: usersGroup = [], allGroups = [] } = useSelector((state) => state.usersGroup || {})
  const { list: multiManufacturers = [] } = useSelector((state) => state.multiManufacturer || {})
  const customization = useSelector((state) => state.customization)

  // Dark mode colors
  const bgGreen50 = useColorModeValue('green.50', 'green.900')
  const textGreen500 = useColorModeValue('green.500', 'green.300')
  const textGreen600 = useColorModeValue('green.600', 'green.300')
  const bgRed50 = useColorModeValue('red.50', 'red.900')
  const textRed500 = useColorModeValue('red.500', 'red.300')
  const textGray300 = useColorModeValue('gray.300', 'gray.600')
  const iconGray = useColorModeValue('gray.400', 'gray.500')
  const textGray500 = useColorModeValue('gray.500', 'gray.400')
  const textGray800 = useColorModeValue('gray.800', 'gray.200')
  const borderGray = useColorModeValue('gray.200', 'gray.600')

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
          toast({
            title: t('settings.userGroups.multipliers.toast.updateSuccess'),
            status: 'success',
            duration: 1500,
            isClosable: true,
            position: 'top',
          })
        })
        .catch((err) => {
          console.error('Toggle failed:', err)
          toast({
            title: t('settings.userGroups.multipliers.toast.updateFailed'),
            status: 'error',
            duration: 1500,
            isClosable: true,
            position: 'top',
          })
        })
    } else {
      dispatch(updateMultiManufacturer({ id: group.id, data: updatedData }))
        .unwrap()
        .then(() => {
          dispatch(fetchMultiManufacturers())
          dispatch(fetchUserMultipliers())
          toast({
            title: t('settings.userGroups.multipliers.toast.updateSuccess'),
            status: 'success',
            duration: 1500,
            isClosable: true,
            position: 'top',
          })
        })
        .catch((err) => {
          console.error('Toggle failed:', err)
          toast({
            title: t('settings.userGroups.multipliers.toast.updateFailed'),
            status: 'error',
            duration: 1500,
            isClosable: true,
            position: 'top',
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
          toast({
            title: t('common.success'),
            description: res.message || t('settings.userGroups.multipliers.toast.updateSuccess'),
            status: 'success',
            duration: 3000,
            isClosable: true,
          })
          dispatch(fetchMultiManufacturers())
          dispatch(fetchUserMultipliers())
        })
        .catch((err) => {
          console.error('Create failed', err)
          toast({
            title: t('common.error'),
            description: err.message || t('settings.userGroups.multipliers.toast.updateFailed'),
            status: 'error',
            duration: 5000,
            isClosable: true,
          })
        })
    } else {
      dispatch(updateMultiManufacturer({ id: selectedGroup.id, data: updatedData }))
        .unwrap()
        .then((res) => {
          setShowModal(false)
          setSelectedGroup(null)
          toast({
            title: t('common.success'),
            description: res.message || t('settings.userGroups.multipliers.toast.updateSuccess'),
            status: 'success',
            duration: 3000,
            isClosable: true,
          })
          dispatch(fetchMultiManufacturers())
          dispatch(fetchUserMultipliers())
        })
        .catch((err) => {
          console.error('Update failed', err)
          toast({
            title: t('common.error'),
            description: err.message || t('settings.userGroups.multipliers.toast.updateFailed'),
            status: 'error',
            duration: 5000,
            isClosable: true,
          })
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
                <Flex align="center" justify="center" w={12} h={12} borderRadius="lg" bg={bgGreen50} color={textGreen500}>
                  <Icon as={Settings} boxSize={6} aria-hidden="true" />
                </Flex>
                <Box>
                  <Text fontSize="lg" fontWeight="semibold" color={textGreen600}>
                    {enabledCount}
                  </Text>
                  <Text fontSize="sm" color={textGray500}>
                    {t('settings.userGroups.multipliers.stats.activeGroups')}
                  </Text>
                </Box>
              </HStack>
            </CardBody>
          </StandardCard>

          <StandardCard variant="outline" borderColor="red.100">
            <CardBody>
              <HStack spacing={4} align="center">
                <Flex align="center" justify="center" w={12} h={12} borderRadius="lg" bg={bgRed50} color={textRed500}>
                  <Icon as={Settings} boxSize={6} aria-hidden="true" />
                </Flex>
                <Box>
                  <Text fontSize="lg" fontWeight="semibold" color={textRed500}>
                    {disabledCount}
                  </Text>
                  <Text fontSize="sm" color={textGray500}>
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
                  <Text fontSize="sm" color={textGray500}>
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
                  <Icon as={Search} color={iconGray} boxSize={ICON_BOX_MD} />
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
                <Text fontSize="sm" color={textGray500}>
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
            <TableContainer>
              <Table variant="simple">
                <Thead>
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
                          <Icon as={Search} boxSize={10} color={textGray300} />
                          <Text>{t('settings.userGroups.multipliers.empty.title')}</Text>
                          <Text fontSize="sm" color={textGray500}>
                            {t('settings.userGroups.multipliers.empty.subtitle')}
                          </Text>
                        </Center>
                      </Td>
                    </Tr>
                  ) : (
                    paginatedGroups.map((group) => (
                      <Tr key={group.id || `group-${group.user_group.id}`}>
                        <Td py={4}>
                          <Text fontWeight="medium" color={textGray800}>
                            {group.user_group?.name || t('common.na')}
                          </Text>
                        </Td>
                        <Td py={4}>
                          <Badge colorScheme="brand" variant="subtle" borderRadius="full" px={3} py={1} fontWeight="semibold">
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
                            borderColor={borderGray}
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
            </TableContainer>
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
