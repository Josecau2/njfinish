import StandardCard from '../../../components/StandardCard'
import { TableCard } from '../../../components/TableCard'
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

  // Color mode values - MUST be before useState
  const borderGray600 = useColorModeValue('gray.600', 'gray.400')
  const iconGreen500 = useColorModeValue('green.500', 'green.300')
  const iconGray500 = useColorModeValue('gray.500', 'gray.400')
  const iconBrand = useColorModeValue('brand.500', 'brand.400')
  const iconOrange = useColorModeValue('orange.500', 'orange.400')

  // Table colors
  const theadBg = useColorModeValue('gray.50', 'gray.800')
  const rowHoverBg = useColorModeValue('gray.50', 'gray.700')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const textPrimary = useColorModeValue('gray.900', 'gray.100')
  const textSecondary = useColorModeValue('gray.600', 'gray.400')

  // Mobile card colors
  const cardBg = useColorModeValue('white', 'gray.800')
  const cardHeaderBg = useColorModeValue('gray.50', 'gray.900')

  const [filterText, setFilterText] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { list: users, loading, error } = useSelector((state) => state.users)
  const { t } = useTranslation()
  const loggedInUser = JSON.parse(localStorage.getItem('user') || '{}')
  const loggedInUserId = loggedInUser?.userId

  // Extract specific loading states
  const isFetching = loading.fetch
  const isDeleting = loading.delete

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
    <Container maxW="full" px={{ base: 4, md: 6 }} py={6}>
      <PageHeader
        title={t('settings.users.header')}
        subtitle={t('settings.users.subtitle')}
        rightContent={
          <Flex gap={3} flexWrap="wrap">
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
          </Flex>
        }
      />

      {/* Stats Cards */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={6}>
        <StandardCard shadow="sm" borderRadius="lg">
          <CardBody p={6}>
            <Stat>
              <StatLabel fontSize="sm" color={borderGray600} mb={2}>
                <Flex align="center" gap={2}>
                  <Icon as={Users} boxSize={ICON_BOX_MD} color={iconBrand} aria-hidden="true" />
                  {t('settings.users.stats.totalUsers')}
                </Flex>
              </StatLabel>
              <StatNumber fontSize="2xl" fontWeight="bold" color={iconBrand}>
                {filteredUsers.length}
              </StatNumber>
            </Stat>
          </CardBody>
        </StandardCard>
        <StandardCard shadow="sm" borderRadius="lg">
          <CardBody p={6}>
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
        <StandardCard shadow="sm" borderRadius="lg">
          <CardBody p={6}>
            <Stat>
              <StatLabel fontSize="sm" color={borderGray600} mb={2}>
                <Flex align="center" gap={2}>
                  <Icon as={UserIcon} boxSize={ICON_BOX_MD} color={iconOrange} aria-hidden="true" />
                  {t('settings.users.stats.regularUsers')}
                </Flex>
              </StatLabel>
              <StatNumber fontSize="2xl" fontWeight="bold" color={iconOrange}>
                {regularCount}
              </StatNumber>
            </Stat>
          </CardBody>
        </StandardCard>
      </SimpleGrid>

      {/* Search Section */}
      <StandardCard shadow="sm" borderRadius="lg" mb={6}>
        <CardBody p={6}>
          <Flex
            direction={{ base: 'column', md: 'row' }}
            justify="space-between"
            align={{ base: 'stretch', md: 'center' }}
            gap={4}
          >
            <Box flex={1} maxW={{ base: 'full', lg: '360px' }}>
              <InputGroup>
                <InputLeftElement pointerEvents="none" h="full">
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
                  size="md"
                  aria-label={t('settings.users.searchPlaceholder')}
                />
              </InputGroup>
            </Box>
            <Box textAlign={{ base: 'left', md: 'right' }}>
              <Text color={borderGray600} fontSize="sm">
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
        <StandardCard shadow="sm" borderRadius="lg" mb={6}>
          <CardBody p={6}>
            <Alert status="error" borderRadius="md">
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
      {isFetching && (
        <StandardCard shadow="sm" borderRadius="lg" mb={6}>
          <CardBody p={16}>
            <Flex direction="column" align="center" justify="center" gap={4}>
              <Spinner colorScheme="brand" size="lg" thickness="4px" />
              <Text color={iconGray500} fontSize="md">{t('settings.users.loading')}</Text>
            </Flex>
          </CardBody>
        </StandardCard>
      )}

      {/* Table */}
      {!isFetching && (
        <StandardCard
          shadow="sm"
          borderRadius="lg"
          overflow="hidden"
        >
          <CardBody p={0}>
            {/* Desktop Table View */}
            <Box display={{ base: 'none', lg: 'block' }}>
              <TableCard cardProps={{ mb: 0 }}>
                <Table variant="simple" size="md">
                <Thead bg={theadBg}>
                  <Tr>
                    <Th width="60px" textAlign="center" py={4}>#</Th>
                    <Th py={4}>
                      <Flex align="center" gap={2}>
                        <UserIcon size={14} aria-hidden="true" />
                        {t('settings.users.table.name')}
                      </Flex>
                    </Th>
                    <Th py={4}>{t('settings.users.table.email')}</Th>
                    <Th py={4}>{t('settings.users.table.group')}</Th>
                    <Th width="140px" textAlign="center" py={4}>{t('settings.users.table.actions')}</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {paginatedUsers?.length === 0 ? (
                    <Tr>
                      <Td colSpan={5} textAlign="center" py={8}>
                        <Flex direction="column" align="center" gap={3}>
                          <Icon as={Users} boxSize="48px" color={iconGray500} aria-hidden="true" />
                          <Text fontWeight="medium">{t('settings.users.empty.title')}</Text>
                          <Text fontSize="sm" color={iconGray500}>{t('settings.users.empty.subtitle')}</Text>
                        </Flex>
                      </Td>
                    </Tr>
                  ) : (
                    paginatedUsers.map((user, index) => (
                      <Tr
                        key={user.id}
                        _hover={{ bg: rowHoverBg }}
                        transition="background 0.2s"
                      >
                        <Td
                          textAlign="center"
                          py={4}
                          borderBottomWidth="1px"
                          borderColor={borderColor}
                        >
                          <Badge
                            variant="subtle"
                            borderRadius="full"
                            fontSize="xs"
                            fontWeight="500"
                            colorScheme="gray"
                            px={3}
                            py={1}
                          >
                            {startIdx + index}
                          </Badge>
                        </Td>
                        <Td
                          py={4}
                          borderBottomWidth="1px"
                          borderColor={borderColor}
                        >
                          <Text fontWeight="medium" color={textPrimary}>
                            {user.name}
                          </Text>
                        </Td>
                        <Td
                          py={4}
                          borderBottomWidth="1px"
                          borderColor={borderColor}
                        >
                          <Text color={textSecondary}>
                            {user.email}
                          </Text>
                        </Td>
                        <Td
                          py={4}
                          borderBottomWidth="1px"
                          borderColor={borderColor}
                        >
                          {user.group ? (
                            <Badge
                              colorScheme={getRoleColor(user.group.name)}
                              borderRadius="md"
                              px={3}
                              py={1}
                              fontSize="xs"
                            >
                              {user.group.name}
                            </Badge>
                          ) : (
                            <Badge
                              colorScheme="gray"
                              borderRadius="md"
                              px={3}
                              py={1}
                              fontSize="xs"
                            >
                              {t('settings.users.noGroup')}
                            </Badge>
                          )}
                        </Td>
                        <Td
                          textAlign="center"
                          py={4}
                          borderBottomWidth="1px"
                          borderColor={borderColor}
                        >
                          <Flex gap={2} justify="center" align="center">
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
                          </Flex>
                        </Td>
                      </Tr>
                    ))
                  )}
                </Tbody>
              </Table>
              </TableCard>
            </Box>

            {/* Mobile Card View */}
            <Box display={{ base: 'block', lg: 'none' }} p={4}>
              {paginatedUsers?.length === 0 ? (
                <Flex direction="column" align="center" gap={3} py={8}>
                  <Icon as={Users} boxSize="48px" color={iconGray500} aria-hidden="true" />
                  <Text fontWeight="medium">{t('settings.users.empty.title')}</Text>
                  <Text fontSize="sm" color={iconGray500}>{t('settings.users.empty.subtitle')}</Text>
                </Flex>
              ) : (
                <Flex direction="column" gap={4}>
                  {paginatedUsers.map((user, index) => (
                    <Box
                      key={user.id}
                      bg={cardBg}
                      borderWidth="1px"
                      borderColor={borderColor}
                      borderRadius="lg"
                      overflow="hidden"
                      shadow="sm"
                    >
                      <Flex
                        bg={cardHeaderBg}
                        px={4}
                        py={3}
                        justify="space-between"
                        align="center"
                        borderBottomWidth="1px"
                        borderColor={borderColor}
                      >
                        <Text fontSize="sm" fontWeight="medium" color={textSecondary}>
                          #{startIdx + index}
                        </Text>
                        <Badge
                          colorScheme={user.group ? getRoleColor(user.group.name) : 'gray'}
                          borderRadius="md"
                          px={3}
                          py={1}
                          fontSize="xs"
                        >
                          {user.group ? user.group.name : t('settings.users.noGroup')}
                        </Badge>
                      </Flex>
                      <Box p={4}>
                        <Flex direction="column" gap={3} mb={4}>
                          <Box>
                            <Text fontSize="xs" color={textSecondary} mb={1}>
                              {t('settings.users.table.name')}
                            </Text>
                            <Text fontWeight="medium" color={textPrimary}>
                              {user.name}
                            </Text>
                          </Box>
                          <Box>
                            <Text fontSize="xs" color={textSecondary} mb={1}>
                              {t('settings.users.table.email')}
                            </Text>
                            <Text color={textSecondary}>
                              {user.email}
                            </Text>
                          </Box>
                        </Flex>
                        <Flex gap={2} justify="flex-end">
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
                            leftIcon={<Pencil size={ICON_SIZE_MD} />}
                          >
                            <Text display={{ base: 'none', sm: 'inline' }}>{t('common.edit')}</Text>
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
                            leftIcon={<Trash size={ICON_SIZE_MD} />}
                          >
                            <Text display={{ base: 'none', sm: 'inline' }}>{t('common.delete')}</Text>
                          </Button>
                        </Flex>
                      </Box>
                    </Box>
                  ))}
                </Flex>
              )}
            </Box>

            {/* Pagination */}
            <Box
              px={4}
              py={4}
              borderTopWidth="1px"
              borderColor={borderColor}
            >
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
          <AlertDialogContent borderRadius={{ base: '0', md: '12px' }}>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              {t('settings.users.confirm.title')}
            </AlertDialogHeader>
            <AlertDialogBody>
              {t('settings.users.confirm.text')}
            </AlertDialogBody>
            <AlertDialogFooter pt={4} pb={{ base: 8, md: 4 }}>
              <Button ref={cancelRef} onClick={onClose} minH="44px">
                {t('common.cancel')}
              </Button>
              <Button
                colorScheme="red"
                onClick={confirmDelete}
                ml={3}
                as={motion.button}
                whileTap={{ scale: 0.98 }}
                minH="44px"
                isLoading={isDeleting}
                loadingText={t('common.deleting', 'Deleting...')}
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
