import StandardCard from '../../../components/StandardCard'
import { TableCard } from '../../../components/TableCard'
import { useEffect, useState, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Alert,
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  Container,
  Flex,
  HStack,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  Link,
  Select,
  Spinner,
  Stack,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack,
  useColorModeValue,
  useDisclosure,
  useToast,
} from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { Edit, Trash, Plus, Search, Mail, MapPin, Globe, ExternalLink } from 'lucide-react'

import PaginationControls from '../../../components/PaginationControls'
import PageHeader from '../../../components/PageHeader'
import PageContainer from '../../../components/PageContainer'
import { MobileListCard } from '../../../components/StandardCard'
import { buildEncodedPath, genNoise } from '../../../utils/obfuscate'
import { deleteLocation, fetchLocations } from '../../../store/slices/locationSlice'
import { ICON_SIZE_MD, ICON_BOX_MD } from '../../../constants/iconSizes'

const LocationPage = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  // Color mode values
  const iconGray500 = useColorModeValue('gray.500', 'gray.400')
  const borderGray600 = useColorModeValue('gray.600', 'gray.400')
  const iconGray400 = useColorModeValue('gray.400', 'gray.500')
  const bgGray100 = useColorModeValue('gray.100', 'gray.700')

  const [filterText, setFilterText] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const { list: locations, loading, error } = useSelector((state) => state.locations)

  useEffect(() => {
    dispatch(fetchLocations())
  }, [dispatch])

  const filteredData = locations.filter((location) => {
    const email = (location.email || '').toLowerCase()
    const name = (location.locationName || '').toLowerCase()
    const search = filterText.toLowerCase()

    return email.includes(search) || name.includes(search)
  })

  const totalPages = Math.ceil((filteredData.length || 0) / itemsPerPage)
  const paginatedLocation = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  )

  const startIdx = filteredData.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1
  const endIdx = Math.min(currentPage * itemsPerPage, filteredData.length)

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return
    setCurrentPage(page)
  }

  const handleItemsPerPageChange = (event) => {
    setItemsPerPage(Number(event.target.value))
    setCurrentPage(1)
  }

  const handleCreateLocation = () => {
    navigate('/settings/locations/create')
  }

  const handleUpdateLocation = (id) => {
    const noisy =
      `/${genNoise(6)}/${genNoise(8)}` + buildEncodedPath('/settings/locations/edit/:id', { id })
    navigate(noisy)
  }

  // Color mode values - MUST be before useState
  const rowHoverBg = useColorModeValue('gray.50', 'gray.700')
  const stickyBorder = useColorModeValue('gray.200', 'gray.700')
  const borderGray = useColorModeValue('gray.200', 'gray.700')

  const { isOpen, onOpen, onClose } = useDisclosure()
  const [deleteLocationId, setDeleteLocationId] = useState(null)
  const cancelRef = useRef()
  const toast = useToast()

  const handleDelete = (id) => {
    setDeleteLocationId(id)
    onOpen()
  }

  const confirmDelete = async () => {
    if (!deleteLocationId) return

    try {
      await dispatch(deleteLocation(deleteLocationId)).unwrap()
      toast({
        title: t('settings.locations.confirm.deletedTitle'),
        description: t('settings.locations.confirm.deletedText'),
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (err) {
      toast({
        title: t('settings.locations.confirm.errorTitle'),
        description: t('settings.locations.confirm.errorText'),
        status: 'error',
        duration: 4000,
        isClosable: true,
      })
    } finally {
      setDeleteLocationId(null)
      onClose()
    }
  }

  if (loading) {
    return (
      <PageContainer>
        <Card variant="outline">
          <CardBody textAlign="center" py={10}>
            <Spinner size="lg" color="brand.500" />
            <Text mt={4} color={iconGray500}>
              {t('settings.locations.loading')}
            </Text>
          </CardBody>
        </Card>
      </PageContainer>
    )
  }

  if (error) {
    return (
      <PageContainer>
        <Alert status="error" borderRadius="md">
          <Text fontWeight="semibold" mr={2}>
            {t('common.error')}:
          </Text>
          <Text>{t('settings.locations.errorLoad')}: {error}</Text>
        </Alert>
      </PageContainer>
    )
  }

  const headerActions = [
    <Button
      key="create"
      leftIcon={<Icon as={Plus} boxSize={ICON_BOX_MD} aria-hidden="true" />}
      colorScheme="brand"
      onClick={handleCreateLocation}
      as={motion.button}
      whileTap={{ scale: 0.98 }}
      minH="44px"
    >
      {t('settings.locations.add')}
    </Button>,
  ]

  return (
    <PageContainer>
      <PageHeader
        title={t('settings.locations.header')}
        subtitle={t('settings.locations.subtitle')}
        icon={MapPin}
        actions={headerActions}
      />

      <Card mb={6}>
        <CardBody>
          <Flex
            justify="space-between"
            align={{ base: 'stretch', md: 'center' }}
            direction={{ base: 'column', md: 'row' }}
            gap={4}
          >
            <Box flex={1} maxW={{ base: 'full', lg: '360px' }}>
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <Icon as={Search} boxSize={ICON_BOX_MD} color={iconGray500} />
                </InputLeftElement>
                <Input
                  type="search"
                  placeholder={t('settings.locations.searchPlaceholder')}
                  value={filterText}
                  onChange={(event) => {
                    setFilterText(event.target.value)
                    setCurrentPage(1)
                  }}
                  aria-label={t('settings.locations.searchPlaceholder')}
                  borderRadius="md"
                />
              </InputGroup>
            </Box>

            <HStack spacing={4} justify="flex-end">
              <Badge colorScheme="brand" variant="subtle" px={3} py={1} borderRadius="full">
                {t('settings.locations.stats.total', { count: locations?.length || 0 })}
              </Badge>
              <Text fontSize="sm" color={iconGray500}>
                {t('settings.locations.stats.showingResults', {
                  count: filteredData?.length || 0,
                })}
              </Text>
            </HStack>
          </Flex>
        </CardBody>
      </Card>

      {/* Desktop Table View */}
      <Box display={{ base: 'none', lg: 'block' }}>
        <Card>
          <CardBody p={0}>
            <TableCard>
              <Table variant="simple">
              <Thead>
                <Tr>
                  <Th textAlign="center">#</Th>
                  <Th>
                    <HStack spacing={4}>
                      <Icon as={MapPin} boxSize={ICON_BOX_MD} aria-hidden="true" />
                      <Text>{t('settings.locations.table.locationName')}</Text>
                    </HStack>
                  </Th>
                  <Th>{t('settings.locations.table.address')}</Th>
                  <Th>
                    <HStack spacing={4}>
                      <Icon as={Mail} boxSize={ICON_BOX_MD} aria-hidden="true" />
                      <Text>{t('settings.locations.table.email')}</Text>
                    </HStack>
                  </Th>
                  <Th>
                    <HStack spacing={4}>
                      <Icon as={Globe} boxSize={ICON_BOX_MD} aria-hidden="true" />
                      <Text>{t('settings.locations.table.website')}</Text>
                    </HStack>
                  </Th>
                  <Th textAlign="center">{t('settings.locations.table.actions')}</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredData.length === 0 ? (
                  <Tr>
                    <Td colSpan={6} textAlign="center" py={8}>
                      <VStack spacing={4} color={iconGray500}>
                        <Icon as={MapPin} boxSize={8} opacity={0.3} aria-hidden="true" />
                        <Text>{t('settings.locations.empty.title')}</Text>
                        <Text fontSize="sm">{t('settings.locations.empty.subtitle')}</Text>
                      </VStack>
                    </Td>
                  </Tr>
                ) : (
                  paginatedLocation.map((location, index) => (
                    <Tr key={location.id} _hover={{ bg: rowHoverBg }}>
                      <Td textAlign="center">
                        <Badge variant="subtle" colorScheme="gray" borderRadius="full" fontSize="xs">
                          {startIdx + index}
                        </Badge>
                      </Td>
                      <Td>
                        <Text fontWeight="semibold">
                          {location.locationName || t('common.na')}
                        </Text>
                      </Td>
                      <Td>
                        <Text color={borderGray600} fontSize="sm">
                          {location.address || t('common.na')}
                        </Text>
                      </Td>
                      <Td>
                        {location.email ? (
                          <Link
                            minH="44px"
                            py={2}
                            href={`mailto:${location.email}`}
                            color="brand.500"
                            _hover={{ textDecoration: 'underline' }}
                            fontSize="sm"
                          >
                            {location.email}
                          </Link>
                        ) : (
                          <Text color={iconGray400} fontSize="sm">
                            {t('common.na')}
                          </Text>
                        )}
                      </Td>
                      <Td>
                        {location.website ? (
                          <Link
                            minH="44px"
                            py={2}
                            href={
                              location.website?.startsWith('http')
                                ? location.website
                                : `https://${location.website}`
                            }
                            isExternal
                            color="brand.500"
                            _hover={{ textDecoration: 'underline' }}
                            fontSize="sm"
                          >
                            <HStack spacing={4}>
                              <Text>{location.website}</Text>
                              <Icon as={ExternalLink} boxSize={3} aria-hidden="true" />
                            </HStack>
                          </Link>
                        ) : (
                          <Text color={iconGray400} fontSize="sm">
                            {t('common.na')}
                          </Text>
                        )}
                      </Td>
                      <Td textAlign="center">
                        <HStack spacing={4} justify="center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateLocation(location.id)}
                            aria-label={t('settings.locations.actions.edit')}
                            as={motion.button}
                            whileTap={{ scale: 0.98 }}
                            minW="44px"
                            h="44px"
                          >
                            <Icon as={Edit} boxSize={ICON_BOX_MD} aria-hidden="true" />
                          </Button>
                          <Button
                            variant="outline"
                            colorScheme="red"
                            size="sm"
                            onClick={() => handleDelete(location.id)}
                            aria-label={t('settings.locations.actions.delete')}
                            as={motion.button}
                            whileTap={{ scale: 0.98 }}
                            minW="44px"
                            h="44px"
                          >
                            <Icon as={Trash} boxSize={ICON_BOX_MD} aria-hidden="true" />
                          </Button>
                        </HStack>
                      </Td>
                    </Tr>
                  ))
                )}
              </Tbody>
            </Table>
            </TableCard>

          {totalPages > 1 && (
            <Box borderTopWidth="1px" borderColor={stickyBorder} p={4}>
              <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
                <Text fontSize="sm" color={iconGray500}>
                  {t('settings.locations.showingRange', {
                    start: filteredData.length === 0 ? 0 : startIdx,
                    end: endIdx,
                    total: filteredData.length,
                  })}
                </Text>

                <Flex justify="center" flex={1}>
                  <PaginationControls
                    page={currentPage}
                    totalPages={totalPages}
                    goPrev={() => handlePageChange(currentPage - 1)}
                    goNext={() => handlePageChange(currentPage + 1)}
                  />
                </Flex>

                <Box minW="150px">
                  <Select
                    size="sm"
                    value={itemsPerPage}
                    onChange={handleItemsPerPageChange}
                    borderRadius="md"
                  >
                    {[5, 10, 15, 20, 25].map((val) => (
                      <option key={val} value={val}>
                        {t('settings.locations.showItems', { count: val })}
                      </option>
                    ))}
                  </Select>
                </Box>
              </Flex>
            </Box>
          )}
        </CardBody>
      </Card>
      </Box>

      {/* Mobile Card View */}
      <Stack spacing={4} display={{ base: 'flex', lg: 'none' }}>
        {filteredData.length === 0 ? (
          <Card variant="outline">
            <CardBody>
              <VStack spacing={4} color={iconGray500} py={8}>
                <Icon as={MapPin} boxSize={8} opacity={0.3} aria-hidden="true" />
                <Text>{t('settings.locations.empty.title')}</Text>
                <Text fontSize="sm">{t('settings.locations.empty.subtitle')}</Text>
              </VStack>
            </CardBody>
          </Card>
        ) : (
          paginatedLocation.map((location, index) => (
            <MobileListCard key={location.id} minH="200px">
              <VStack align="stretch" spacing={4} h="full" justify="space-between">
                <VStack align="stretch" spacing={3}>
                  <Flex justify="space-between" align="center">
                    <HStack spacing={2}>
                      <Badge variant="subtle" colorScheme="gray" borderRadius="full" fontSize="xs">
                        #{startIdx + index}
                      </Badge>
                      <Text fontWeight="semibold" fontSize="md">{location.locationName || t('common.na')}</Text>
                    </HStack>
                  </Flex>

                  {location.address && (
                    <HStack spacing={2} align="flex-start">
                      <Icon as={MapPin} boxSize={ICON_BOX_MD} color={iconGray500} mt={0.5} flexShrink={0} />
                      <Text fontSize="sm" color={borderGray600}>{location.address}</Text>
                    </HStack>
                  )}

                  {location.email && (
                    <HStack spacing={2}>
                      <Icon as={Mail} boxSize={ICON_BOX_MD} color={iconGray500} flexShrink={0} />
                      <Link
                        minH="44px"
                        py={2}
                        href={`mailto:${location.email}`}
                        color="brand.500"
                        _hover={{ textDecoration: 'underline' }}
                        fontSize="sm"
                      >
                        {location.email}
                      </Link>
                    </HStack>
                  )}

                  {location.website && (
                    <HStack spacing={2}>
                      <Icon as={Globe} boxSize={ICON_BOX_MD} color={iconGray500} flexShrink={0} />
                      <Link
                        minH="44px"
                        py={2}
                        href={location.website?.startsWith('http') ? location.website : `https://${location.website}`}
                        isExternal
                        color="brand.500"
                        _hover={{ textDecoration: 'underline' }}
                        fontSize="sm"
                      >
                        <HStack spacing={1}>
                          <Text>{location.website}</Text>
                          <Icon as={ExternalLink} boxSize={3} />
                        </HStack>
                      </Link>
                    </HStack>
                  )}
                </VStack>

                <HStack spacing={3} justify="flex-end" pt={2} borderTopWidth="1px" borderColor={bgGray100}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUpdateLocation(location.id)}
                    aria-label={t('settings.locations.actions.edit')}
                    leftIcon={<Icon as={Edit} boxSize={ICON_BOX_MD} />}
                    minH="44px"
                  >
                    {t('common.edit')}
                  </Button>
                  <Button
                    variant="outline"
                    colorScheme="red"
                    size="sm"
                    onClick={() => handleDelete(location.id)}
                    aria-label={t('settings.locations.actions.delete')}
                    leftIcon={<Icon as={Trash} boxSize={ICON_BOX_MD} />}
                    minH="44px"
                  >
                    {t('common.delete')}
                  </Button>
                </HStack>
              </VStack>
            </MobileListCard>
          ))
        )}

        {/* Mobile Pagination */}
        {totalPages > 1 && (
          <Card>
            <CardBody>
              <VStack spacing={4}>
                <Text fontSize="sm" color={iconGray500}>
                  {t('settings.locations.showingRange', {
                    start: filteredData.length === 0 ? 0 : startIdx,
                    end: endIdx,
                    total: filteredData.length,
                  })}
                </Text>
                <PaginationControls
                  page={currentPage}
                  totalPages={totalPages}
                  goPrev={() => handlePageChange(currentPage - 1)}
                  goNext={() => handlePageChange(currentPage + 1)}
                />
                <Select
                  value={itemsPerPage}
                  onChange={(event) => {
                    setItemsPerPage(Number(event.target.value))
                    setCurrentPage(1)
                  }}
                  size="sm"
                  maxW="150px"
                >
                  {[5, 10, 15, 20, 25].map((val) => (
                    <option key={val} value={val}>
                      {t('settings.locations.showItems', { count: val })}
                    </option>
                  ))}
                </Select>
              </VStack>
            </CardBody>
          </Card>
        )}
      </Stack>

      <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose} isCentered>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              {t('common.confirm')}
            </AlertDialogHeader>
            <AlertDialogBody>{t('settings.locations.confirm.text')}</AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose} minH="44px">
                {t('common.cancel')}
              </Button>
              <Button
                colorScheme="red"
                onClick={confirmDelete}
                ml={3}
                as={motion.button}
                whileTap={{ scale: 0.98 }}
               minH="44px">
                {t('settings.locations.confirm.confirmYes')}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </PageContainer>
  )
}

export default LocationPage
