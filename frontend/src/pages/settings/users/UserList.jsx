import StandardCard from '../../../components/StandardCard'
import { useEffect, useState, useRef } from 'react'
import { Alert, AlertDialog, AlertDialogBody, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogOverlay, AlertIcon, Badge, Box, Button, CardBody, Container, Flex, Heading, Icon, Input, InputGroup, InputLeftElement, Select, SimpleGrid, Spinner, Stat, StatLabel, StatNumber, Table, TableContainer, Tbody, Td, Text, Th, Thead, Tr, useDisclosure, useToast, useColorModeValue } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import {
  Plus,
  Settings as Gear,
  Search,
  Pencil,
  Trash,
  Users,
  User as UserIcon,
} from '@/icons-lucide'
import { useNavigate } from 'react-router-dom'
import { buildEncodedPath, genNoise } from '../../../utils/obfuscate'
import { useDispatch, useSelector } from 'react-redux'
import { deleteUser, fetchUsers } from '../../../store/slices/userSlice'
import PaginationComponent from '../../../components/common/PaginationComponent'
import { useTranslation } from 'react-i18next'
import PageHeader from '../../../components/PageHeader'
import { ICON_SIZE_MD, ICON_BOX_MD } from '../../../constants/iconSizes'

const UsersPage = () => {

  // Color mode values
  const borderGray600 = borderGray600
  const iconGreen500 = iconGreen500
  const iconGray500 = iconGray500
  const [filterText, setFilterText] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { list: users, loading, error } = useSelector((state) => state.users)
  const { t } = useTranslation()
  const loggedInUser = JSON.parse(localStorage.getItem('user'))
  let loggedInUserId = loggedInUser.userId

  // Delete confirmation dialog
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [deleteUserId, setDeleteUserId] = useState(null)
  const cancelRef = useRef()
  const toast = useToast()

  useEffect(() => {
    dispatch(fetchUsers())
  }, [dispatch])

  const filteredUsers = users
    .filter((u) => u && u.name && u.email)
    .filter((u) => u.id !== loggedInUserId)
    .filter(
      (u) =>
        u.name.toLowerCase().includes(filterText.toLowerCase()) ||
        u.email.toLowerCase().includes(filterText.toLowerCase()),
    )

  const totalPages = Math.ceil((filteredUsers.length || 0) / itemsPerPage)
  const paginatedUsers = filteredUsers?.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  )

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value))
    setCurrentPage(1)
  }

  const startIdx = (currentPage - 1) * itemsPerPage + 1
  const endIdx = Math.min(currentPage * itemsPerPage, filteredUsers.length)

  const handleCreateUser = () => {
    navigate('/settings/users/create')
  }

  const handleCreateUserGroup = () => {
    navigate('/settings/users/group/create')
  }

  const handleUpdateUser = (id) => {
    const noisy =
      `/${genNoise(6)}/${genNoise(8)}` + buildEncodedPath('/settings/users/edit/:id', { id })
    navigate(noisy)
  }

  const handleDelete = (id) => {
    setDeleteUserId(id)
    onOpen()
  }

  const confirmDelete = async () => {
    if (!deleteUserId) return

    try {
      await dispatch(deleteUser(deleteUserId)).unwrap()
      toast({
        title: t('common.deleted') + '!',
        description: t('settings.users.confirm.deletedText'),
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      toast({
        title: t('common.error') + '!',
        description: t('settings.users.confirm.errorText'),
        status: 'error',
        duration: 4000,
        isClosable: true,
      })
    } finally {
      setDeleteUserId(null)
      onClose()
    }
  }

  const getRoleColor = (role) => {
    const roleColors = {
      Admin: 'primary',
      Manager: 'success',
      User: 'secondary',
      Editor: 'warning',
    }
    return roleColors[role] || 'secondary'
  }

  const adminCount = filteredUsers.filter((user) => user.role === 'Admin').length
  const regularCount = filteredUsers.filter((user) => user.role !== 'Admin').length

  return (
    <Container maxW="full" className="settings-container">
      <PageHeader
        title={t('settings.users.header')}
        subtitle={t('settings.users.subtitle')}
        rightContent={
          <div>
            <Button
              as={motion.button}
              variant="outline"
              colorScheme="gray"
              onClick={handleCreateUser}
              aria-label={t('settings.users.addUser')}
              whileTap={{ scale: 0.98 }}
              height="44px"
              leftIcon={<Plus size={ICON_SIZE_MD} />}
            >
              {t('settings.users.addUser')}
            </Button>
            <Button
              as={motion.button}
              variant="solid"
              colorScheme="brand"
              onClick={handleCreateUserGroup}
              aria-label={t('settings.users.addGroup')}
              whileTap={{ scale: 0.98 }}
              height="44px"
              leftIcon={<Gear size={ICON_SIZE_MD} />}
            >
              {t('settings.users.addGroup')}
            </Button>
          </div>
        }
      />

      {/* Stats Cards */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
        <StandardCard className="settings-stats-card">
          <CardBody>
            <Stat>
              <StatLabel fontSize="sm" color={borderGray600} mb={2}>
                <Flex align="center" gap={2}>
                  <Icon as={Users} boxSize={ICON_BOX_MD} color="brand.500" aria-hidden="true" />
                  {t('settings.users.stats.totalUsers')}
                </Flex>
              </StatLabel>
              <StatNumber fontSize="2xl" fontWeight="bold" color="brand.500">
                {filteredUsers.length}
              </StatNumber>
            </Stat>
          </CardBody>
        </StandardCard>
        <StandardCard className="settings-stats-card">
          <CardBody>
            <Stat>
              <StatLabel fontSize="sm" color={borderGray600} mb={2}>
                <Flex align="center" gap={2}>
                  <Icon as={Gear} boxSize={ICON_BOX_MD} color={iconGreen500} aria-hidden="true" />
                  {t('settings.users.stats.administrators')}
                </Flex>
              </StatLabel>
              <StatNumber fontSize="2xl" fontWeight="bold" color={iconGreen500}>
                {adminCount}
              </StatNumber>
            </Stat>
          </CardBody>
        </StandardCard>
        <StandardCard className="settings-stats-card">
          <CardBody>
            <Stat>
              <StatLabel fontSize="sm" color={borderGray600} mb={2}>
                <Flex align="center" gap={2}>
                  <Icon as={UserIcon} boxSize={ICON_BOX_MD} color="orange.500" aria-hidden="true" />
                  {t('settings.users.stats.regularUsers')}
                </Flex>
              </StatLabel>
              <StatNumber fontSize="2xl" fontWeight="bold" color="orange.500">
                {regularCount}
              </StatNumber>
            </Stat>
          </CardBody>
        </StandardCard>
      </SimpleGrid>

      {/* Search Section */}
      <StandardCard className="settings-search-card">
        <CardBody>
          <Flex
            direction={{ base: 'column', md: 'row' }}
            justify="space-between"
            align={{ base: 'stretch', md: 'center' }}
            gap={4}
          >
            <Box flex={1} maxW={{ base: 'full', lg: '360px' }}>
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <Icon as={Search} boxSize={ICON_BOX_MD} color={iconGray500} />
                </InputLeftElement>
                <Input
                  type="search"
                  placeholder={t('settings.users.searchPlaceholder')}
                  value={filterText}
                  onChange={(e) => {
                    setFilterText(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="settings-search-input"
                  aria-label={t('settings.users.searchPlaceholder')}
                />
              </InputGroup>
            </Box>
            <Box textAlign={{ base: 'left', md: 'right' }}>
              <Text color={borderGray600}>
                {t('settings.users.showing', {
                  count: filteredUsers?.length || 0,
                  total: users?.length || 0,
                })}
              </Text>
            </Box>
          </Flex>
        </CardBody>
      </StandardCard>

      {/* Error State */}
      {error && (
        <StandardCard className="settings-search-card">
          <CardBody>
            <Alert status="error" mb={0}>
              <AlertIcon />
              <Box>
                <Text fontWeight="bold" display="inline">{t('common.error')}:</Text> {t('settings.users.loadFailed')}:{' '}
                {error.message || error.toString() || t('common.error')}
              </Box>
            </Alert>
          </CardBody>
        </StandardCard>
      )}

      {/* Loading State */}
      {loading && (
        <StandardCard className="settings-table-card">
          <CardBody className="settings-empty-state">
            <Spinner colorScheme="brand" size="lg" />
            <Text color={iconGray500} mt={3} mb={0}>{t('settings.users.loading')}</Text>
          </CardBody>
        </StandardCard>
      )}

      {/* Table */}
      {!loading && (
        <StandardCard className="settings-table-card" mx={{ base: -4, md: -6 }}>
          <CardBody p={0}>
            {/* Desktop Table View */}
            <Box display={{ base: 'none', lg: 'block' }}>
              <TableContainer>
                <Table variant="simple">
                <Thead className="settings-table-header">
                  <Tr>
                    <Th>#</Th>
                    <Th>
                      <div>
                        <UserIcon size={14} aria-hidden="true" />
                        {t('settings.users.table.name')}
                      </div>
                    </Th>
                    <Th>{t('settings.users.table.email')}</Th>
                    <Th>{t('settings.users.table.group')}</Th>
                    <Th>{t('settings.users.table.actions')}</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {paginatedUsers?.length === 0 ? (
                    <Tr>
                      <Td colSpan={5} className="settings-empty-state">
                        <div className="settings-mobile-actions">
                          <Users size={48} className="settings-empty-icon" aria-hidden="true" />
                          <p>{t('settings.users.empty.title')}</p>
                          <small>{t('settings.users.empty.subtitle')}</small>
                        </div>
                      </Td>
                    </Tr>
                  ) : (
                    paginatedUsers.map((user, index) => (
                      <Tr key={user.id} className="settings-table-row">
                        <Td>
                          <Badge
                            variant="subtle"
                            borderRadius="full"
                            fontSize="xs"
                            fontWeight="500"
                            colorScheme="gray"
                            px={2}
                            py={1}
                          >
                            {startIdx + index}
                          </Badge>
                        </Td>
                        <Td>
                          <div>{user.name}</div>
                        </Td>
                        <Td>
                          <span>{user.email}</span>
                        </Td>
                        <Td>
                          {user.group ? (
                            <Badge
                              colorScheme={getRoleColor(user.group.name)}
                              className="settings-badge"
                            >
                              {user.group.name}
                            </Badge>
                          ) : (
                            <Badge colorScheme="gray" className="settings-badge">
                              {t('settings.users.noGroup')}
                            </Badge>
                          )}
                        </Td>
                        <Td>
                          <div>
                            <Button
                              as={motion.button}
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUpdateUser(user.id)}
                              title={t('common.edit')}
                              aria-label={t('common.edit')}
                              whileTap={{ scale: 0.98 }}
                              minW="44px"
                              h="44px"
                            >
                              <Pencil size={ICON_SIZE_MD} />
                            </Button>

                            <Button
                              as={motion.button}
                              variant="ghost"
                              colorScheme="red"
                              size="sm"
                              onClick={() => handleDelete(user.id)}
                              title={t('common.delete')}
                              aria-label={t('common.delete')}
                              whileTap={{ scale: 0.98 }}
                              minW="44px"
                              h="44px"
                            >
                              <Trash size={ICON_SIZE_MD} />
                            </Button>
                          </div>
                        </Td>
                      </Tr>
                    ))
                  )}
                </Tbody>
              </Table>
              </TableContainer>
            </Box>

            {/* Mobile Card View */}
            <Box display={{ base: 'block', lg: 'none' }} className="settings-mobile-cards">
              {paginatedUsers?.length === 0 ? (
                <div className="settings-empty-state">
                  <div>
                    <Users size={48} className="settings-empty-icon" aria-hidden="true" />
                    <p>{t('settings.users.empty.title')}</p>
                    <small>{t('settings.users.empty.subtitle')}</small>
                  </div>
                </div>
              ) : (
                paginatedUsers.map((user, index) => (
                  <div key={user.id} className="settings-mobile-card">
                    <div className="settings-mobile-card-header">
                      <div>
                        <span>#{startIdx + index}</span>
                        <Badge
                          colorScheme={user.group ? getRoleColor(user.group.name) : 'secondary'}
                          className="settings-badge"
                        >
                          {user.group ? user.group.name : t('settings.users.noGroup')}
                        </Badge>
                      </div>
                    </div>
                    <div className="settings-mobile-card-body">
                      <div className="settings-mobile-field">
                        <span className="settings-mobile-label">
                          {t('settings.users.table.name')}
                        </span>
                        <Text className="settings-mobile-value" fontWeight="medium">{user.name}</Text>
                      </div>
                      <div className="settings-mobile-field">
                        <span className="settings-mobile-label">
                          {t('settings.users.table.email')}
                        </span>
                        <Text className="settings-mobile-value" color={iconGray500}>{user.email}</Text>
                      </div>
                      <div className="settings-mobile-actions">
                      <Button
                        as={motion.button}
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUpdateUser(user.id)}
                        title={t('common.edit')}
                        aria-label={t('common.edit')}
                        whileTap={{ scale: 0.98 }}
                        minW="44px"
                        h="44px"
                      >
                        <Pencil size={ICON_SIZE_MD} />
                      </Button>
                      <Button
                        as={motion.button}
                        variant="ghost"
                        colorScheme="red"
                        size="sm"
                        onClick={() => handleDelete(user.id)}
                        title={t('common.delete')}
                        aria-label={t('common.delete')}
                        whileTap={{ scale: 0.98 }}
                        minW="44px"
                        h="44px"
                      >
                        <Trash size={ICON_SIZE_MD} />
                      </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </Box>

            {/* Pagination */}
            <Box className="settings-pagination">
              <PaginationComponent
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                itemsPerPage={itemsPerPage}
              />
            </Box>
          </CardBody>
        </StandardCard>
      )}
      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              {t('settings.users.confirm.title')}
            </AlertDialogHeader>
            <AlertDialogBody>
              {t('settings.users.confirm.text')}
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                {t('common.cancel')}
              </Button>
              <Button
                colorScheme="red"
                onClick={confirmDelete}
                ml={3}
                as={motion.button}
                whileTap={{ scale: 0.98 }}
              >
                {t('settings.users.confirm.confirmYes')}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Container>
  )
}

export default UsersPage
