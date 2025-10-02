import StandardCard from '../../../components/StandardCard'
import { useEffect, useState, useRef } from 'react'
import { Input, Spinner, Container, Flex, Box, Badge, Button, useToast, AlertDialog, AlertDialogBody, AlertDialogFooter, AlertDialogHeader, AlertDialogContent, AlertDialogOverlay, useDisclosure, Table, Thead, Tbody, Tr, Th, Td, TableContainer, InputGroup, InputLeftElement, Select } from '@chakra-ui/react'
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
      <Flex>
        <Box md={4}>
          <StandardCard className="settings-stats-card">
            <CardBody>
              <Flex align="center" justify="center" mb={2}>
                <div className="settings-stat-icon primary">
                  <Users size={ICON_SIZE_MD} aria-hidden="true" />
                </div>
                <div>
                  <h4 className="mb-0 fw-bold text-primary">{filteredUsers.length}</h4>
                  <small>{t('settings.users.stats.totalUsers')}</small>
                </div>
              </Flex>
            </CardBody>
          </StandardCard>
        </Box>
        <Box md={4}>
          <StandardCard className="settings-stats-card">
            <CardBody>
              <Flex align="center" justify="center" mb={2}>
                <div className="settings-stat-icon success">
                  <Gear size={ICON_SIZE_MD} aria-hidden="true" />
                </div>
                <div>
                  <h4 className="mb-0 fw-bold text-success">{adminCount}</h4>
                  <small>{t('settings.users.stats.administrators')}</small>
                </div>
              </Flex>
            </CardBody>
          </StandardCard>
        </Box>
        <Box md={4}>
          <StandardCard className="settings-stats-card">
            <CardBody>
              <Flex align="center" justify="center" mb={2}>
                <div className="settings-stat-icon warning">
                  <UserIcon size={ICON_SIZE_MD} aria-hidden="true" />
                </div>
                <div>
                  <h4 className="mb-0 fw-bold text-warning">{regularCount}</h4>
                  <small>{t('settings.users.stats.regularUsers')}</small>
                </div>
              </Flex>
            </CardBody>
          </StandardCard>
        </Box>
      </Flex>

      {/* Search Section */}
      <StandardCard className="settings-search-card">
        <CardBody>
          <Flex>
            <Box md={6} lg={4}>
              <InputGroup>
                <InputLeftElement>
                  <Search size={ICON_SIZE_MD} aria-hidden="true" />
                </InputLeftElement>
                <Input
                  type="text"
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
            <Box md={6} lg={8} className="text-md-end mt-3 mt-md-0">
              <span>
                {t('settings.users.showing', {
                  count: filteredUsers?.length || 0,
                  total: users?.length || 0,
                })}
              </span>
            </Box>
          </Flex>
        </CardBody>
      </StandardCard>

      {/* Error State */}
      {error && (
        <StandardCard className="settings-search-card">
          <CardBody>
            <div className="alert alert-danger mb-0">
              <strong>{t('common.error')}:</strong> {t('settings.users.loadFailed')}:{' '}
              {error.message || error.toString() || t('common.error')}
            </div>
          </CardBody>
        </StandardCard>
      )}

      {/* Loading State */}
      {loading && (
        <StandardCard className="settings-table-card">
          <CardBody className="settings-empty-state">
            <Spinner colorScheme="blue" size="lg" />
            <p className="text-muted mt-3 mb-0">{t('settings.users.loading')}</p>
          </CardBody>
        </StandardCard>
      )}

      {/* Table */}
      {!loading && (
        <StandardCard className="settings-table-card">
          <CardBody>
            {/* Desktop Table View */}
            <Box display={{ base: 'none', lg: 'block' }}>
              <TableContainer overflowX="auto" data-scroll-region>
                <Table variant="simple" className="mb-0 table-modern">
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
                            className="px-2 py-1"
                            style={{
                              borderRadius: '15px',
                              fontSize: "xs",
                              fontWeight: '500',
                              color: "gray.500",
                            }}
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
                        <span className="settings-mobile-value fw-medium">{user.name}</span>
                      </div>
                      <div className="settings-mobile-field">
                        <span className="settings-mobile-label">
                          {t('settings.users.table.email')}
                        </span>
                        <span className="settings-mobile-value text-muted">{user.email}</span>
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
