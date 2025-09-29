import { useEffect, useState, useRef } from 'react'
import { Edit, Trash, Plus, Search, Mail, MapPin, Globe, ExternalLink } from 'lucide-react'
import PaginationControls from '../../../components/PaginationControls'
import { useNavigate } from 'react-router-dom'
import { buildEncodedPath, genNoise } from '../../../utils/obfuscate'
import { useDispatch, useSelector } from 'react-redux'
import { deleteLocation, fetchLocations } from '../../../store/slices/locationSlice'
import { useTranslation } from 'react-i18next'
import PageHeader from '../../../components/PageHeader'
import { motion } from 'framer-motion'
import {
  Input,
  Select,
  Spinner,
  Container,
  Flex,
  Box,
  Card,
  CardBody,
  Badge,
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
  InputGroup,
  InputLeftElement,
  Link,
  Alert,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
  useToast,
  useColorModeValue
} from '@chakra-ui/react'

const LocationPage = () => {
  const { t } = useTranslation()
  const [filterText, setFilterText] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { list: locations, loading, error } = useSelector((state) => state.locations)

  useEffect(() => {
    dispatch(fetchLocations())
  }, [dispatch])

  const filteredData = locations.filter((u) => {
    const email = (u.email || '').toLowerCase()
    const name = (u.locationName || '').toLowerCase()
    const search = filterText.toLowerCase()

    return email.includes(search) || name.includes(search)
  })

  const totalPages = Math.ceil((filteredData.length || 0) / itemsPerPage)
  const paginatedLocation = filteredData.slice(
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

  const startIdx = filteredData.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1
  const endIdx = Math.min(currentPage * itemsPerPage, filteredData.length)

  const handleCreateUser = () => {
    navigate('/settings/locations/create')
  }

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
    } catch (error) {
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

  const handleUpdateLocation = (id) => {
    const noisy =
      `/${genNoise(6)}/${genNoise(8)}` + buildEncodedPath('/settings/locations/edit/:id', { id })
    navigate(noisy)
  }

  const tableBg = useColorModeValue('white', 'gray.800')
  const headerBg = useColorModeValue('gray.50', 'gray.700')

  if (loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <VStack spacing={4} justify="center" minH="200px">
          <Spinner size="lg" color="brand.500" />
          <Text color="gray.500">{t('settings.locations.loading')}</Text>
        </VStack>
      </Container>
  
  )
  }

  if (error) {
    return (
      <Container maxW="container.xl" py={8}>
        <Alert status="error" borderRadius="md">
          <Text fontWeight="semibold">{t('common.error')}:</Text>
          <Text ml={2}>{t('settings.locations.errorLoad')}: {error}</Text>
        </Alert>
      </Container>
  
  )
  }

  return (
    <Container maxW="container.xl" py={8}>
      <PageHeader
        title={t('settings.locations.header')}
        subtitle={t('settings.locations.subtitle')}
        icon={MapPin}
        actions={
          <Button
            leftIcon={<Plus size={16} />}
            colorScheme="brand"
            onClick={handleCreateUser}
            as={motion.button}
            whileTap={{ scale: 0.98 }}
          >
            {t('settings.locations.add')}
          </Button>
  
  )
        }
      />

      {/* Search and Stats */}
      <Card mb={6}>
        <CardBody>
          <Flex justify="space-between" align={{ base: 'stretch', md: 'center' }} direction={{ base: 'column', md: 'row' }} gap={4}>
            <Box flex={1} maxW={{ base: 'full', md: '400px' }}>
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <Search size={16} color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder={t('settings.locations.searchPlaceholder')}
                  value={filterText}
                  onChange={(e) => {
                    setFilterText(e.target.value)
                    setCurrentPage(1)
                  }}
                  borderRadius="md"
                />
              </InputGroup>
            </Box>
            <HStack spacing={4} justify="flex-end">
              <Badge
                colorScheme="blue"
                variant="subtle"
                px={3}
                py={1}
                borderRadius="full"
              >
                {t('settings.locations.stats.total', { count: locations?.length || 0 })}
              </Badge>
              <Text fontSize="sm" color="gray.500">
                {t('settings.locations.stats.showingResults', {
                  count: filteredData?.length || 0,
                })}
              </Text>
            </HStack>
          </Flex>
        </CardBody>
      </Card>

      {/* Table */}
      <Card>
        <CardBody p={0}>
          <Box overflowX="auto">
            <Table variant="simple" bg={tableBg}>
              <Thead bg={headerBg}>
                <Tr>
                  <Th scope="col" textAlign="center">#</Th>
                  <Th scope="col">
                    <HStack spacing={2}>
                      <MapPin size={14} />
                      <Text>{t('settings.locations.table.locationName')}</Text>
                    </HStack>
                  </Th>
                  <Th scope="col">{t('settings.locations.table.address')}</Th>
                  <Th scope="col">
                    <HStack spacing={2}>
                      <Mail size={14} />
                      <Text>{t('settings.locations.table.email')}</Text>
                    </HStack>
                  </Th>
                  <Th scope="col">
                    <HStack spacing={2}>
                      <Globe size={14} />
                      <Text>{t('settings.locations.table.website')}</Text>
                    </HStack>
                  </Th>
                  <Th scope="col" textAlign="center">{t('settings.locations.table.actions')}</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredData?.length === 0 ? (
                  <Tr>
                    <Td colSpan={6} textAlign="center" py={8}>
                      <VStack spacing={3} color="gray.500">
                        <MapPin size={32} opacity={0.3} />
                        <Text>{t('settings.locations.empty.title')}</Text>
                        <Text fontSize="sm">{t('settings.locations.empty.subtitle')}</Text>
                      </VStack>
                    </Td>
                  </Tr>
                ) : (
                  paginatedLocation?.map((location, index) => (
                    <Tr key={location.id} _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}>
                      <Td textAlign="center">
                        <Badge
                          variant="subtle"
                          colorScheme="gray"
                          borderRadius="full"
                          fontSize="xs"
                        >
                          {startIdx + index}
                        </Badge>
                      </Td>
                      <Td>
                        <Text fontWeight="semibold">
                          {location.locationName || t('common.na')}
                        </Text>
                      </Td>
                      <Td>
                        <Text color="gray.600" fontSize="sm">
                          {location.address || t('common.na')}
                        </Text>
                      </Td>
                      <Td>
                        {location.email ? (
                          <Link
                            href={`mailto:${location.email}`}
                            color="brand.500"
                            _hover={{ textDecoration: 'underline' }}
                            fontSize="sm"
                          >
                            {location.email}
                          </Link>
                        ) : (
                          <Text color="gray.400" fontSize="sm">{t('common.na')}</Text>
                        )}
                      </Td>
                      <Td>
                        {location.website ? (
                          <Link
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
                            <HStack spacing={1}>
                              <Text>{location.website}</Text>
                              <ExternalLink size={12} />
                            </HStack>
                          </Link>
                        ) : (
                          <Text color="gray.400" fontSize="sm">{t('common.na')}</Text>
                        )}
                      </Td>
                      <Td textAlign="center">
                        <HStack spacing={2} justify="center">
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
                            <Edit size={16} />
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
                            <Trash size={16} />
                          </Button>
                        </HStack>
                      </Td>
                    </Tr>
                  ))
                )}
              </Tbody>
            </Table>
          </Box>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box borderTop={1} borderColor="gray.200" p={4}>
              <Flex justify="space-between" align="center" wrap="wrap" gap={3}>
                <Text fontSize="sm" color="gray.500">
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

                <Box minW="120px">
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
              {t('common.confirm')}
            </AlertDialogHeader>
            <AlertDialogBody>
              {t('settings.locations.confirm.text')}
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
                {t('settings.locations.confirm.confirmYes')}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Container>
  )
}

</Container>
export default LocationPage