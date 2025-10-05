import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Container,
  Stack,
  HStack,
  Box,
  SimpleGrid,
  Input,
  Select,
  CardBody,
  CardHeader,
  Badge,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  Icon,
  ButtonGroup,
  InputGroup,
  InputLeftElement,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Text,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  useColorModeValue,
} from '@chakra-ui/react'
import { generateContractHtml } from '../../helpers/generateContractHtml'
import PageContainer from '../../components/PageContainer'
import StandardCard from '../../components/StandardCard'
import { TableCard } from '../../components/TableCard'
import { Search, Calendar, Briefcase, FileText, Trash2 } from 'lucide-react'
import { getContracts } from '../../queries/proposalQueries'
import { useSelector } from 'react-redux'
import axiosInstance from '../../helpers/axiosInstance'
import PaginationComponent from '../../components/common/PaginationComponent'
import PageHeader from '../../components/PageHeader'
import { ICON_SIZE_MD, ICON_BOX_MD } from '../../constants/iconSizes'

const Contracts = () => {
  const { t } = useTranslation()

  // Color mode values
  const iconGray400 = useColorModeValue('gray.400', 'gray.500')
  const iconGray500 = useColorModeValue('gray.500', 'gray.400')
  const iconGray300 = useColorModeValue('gray.300', 'gray.600')
  const borderGray600 = useColorModeValue('gray.600', 'gray.400')
  const bgGreen50 = useColorModeValue('green.50', 'green.900')
  const textGreen600 = useColorModeValue('green.600', 'green.300')
  const borderGray700 = useColorModeValue('gray.700', 'gray.300')
  const color8 = useColorModeValue('white', 'gray.800')
  const bgGray50 = useColorModeValue('gray.50', 'gray.800')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [viewMode, setViewMode] = useState('card')
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [showModal, setShowModal] = useState(false)
  const [contracts, setContracts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const customization = useSelector((state) => state.customization)

  // Function to get optimal text color for contrast
  const getContrastColor = (backgroundColor) => {
    if (!backgroundColor) return 'white'
    // Convert hex to RGB
    const hex = backgroundColor.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    // Return dark color for light backgrounds, light color for dark backgrounds
    return luminance > 0.5 ? 'gray.700' : 'white'
  }
  const contractsdata = Array.isArray(contracts) ? contracts : []

  const defaultFormData = {
    manufacturersData: [],
    designer: '',
    description: '',
    date: null,
    designDate: null,
    measurementDate: null,
    // followUp1Date: null,
    // followUp2Date: null,
    // followUp3Date: null,
    status: 'Draft',
    files: [],
    customerName: '',
  }
  const [loadings, setLoadings] = useState(true)

  const [formData, setFormData] = useState(defaultFormData)

  useEffect(() => {
    const fetchContracts = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await getContracts()
        setContracts(response.data || [])
      } catch (err) {
        setError(err.message || 'Failed to fetch contracts')
      } finally {
        setLoading(false)
      }
    }

    fetchContracts()
  }, [])
  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1)
    localStorage.setItem('contractsItemsPerPage', newItemsPerPage.toString())
  }
  const getStatusColor = (status) => {
    const colors = {
      draft: 'gray',
      'measurement scheduled': 'purple',
      'measurement done': 'blue',
      'design done': 'green',
      'follow up 1': 'orange',
      'follow up 2': 'orange',
      'follow up 3': 'red',
      'proposal accepted': 'green',
    }
    return colors[(status || 'Draft').toLowerCase()] || 'gray'
  }
  const filteredProposals = contractsdata?.filter((item) => {
    const matchSearch = item.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchSearch
  })
  const paginatedItems =
    filteredProposals?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage) || []
  const totalPages = Math.ceil((filteredProposals?.length || 0) / itemsPerPage)

  const handlePageChange = (number) => {
    setCurrentPage(number)
  }
  const handleNavigate = (id) => {
    axiosInstance
      .get(`/api/quotes/proposalByID/${id}`)
      .then((res) => {
        setFormData(res.data || defaultFormData)
        setLoadings(false)
      })
      .catch((err) => {
        console.error('Error fetching proposal:', err)
        setLoadings(false)
      })
    setShowModal(true)
  }
  const handleEdit = (id) => {
    // TODO: Implement edit functionality
  }
  const handleDelete = (id) => {
    // TODO: Implement delete functionality
  }
  const htmlContent = generateContractHtml(formData, { t })

  const statusTranslationMap = {
    draft: 'draft',
    'measurement scheduled': 'measurementScheduled',
    'measurement done': 'measurementDone',
    'design done': 'designDone',
    'follow up 1': 'followUp1',
    'follow up 2': 'followUp2',
    'follow up 3': 'followUp3',
    'proposal accepted': 'proposalAccepted',
  }
  const getStatusLabel = (status) => {
    const key = statusTranslationMap[(status || 'Draft').toLowerCase()] || null
    return key ? t(`contracts.status.${key}`) : status || t('contracts.status.draft')
  }
  const filteredCount = filteredProposals?.length || 0
  const headerBg = customization?.headerBg || 'purple.500'
  const headerTextColor = getContrastColor(headerBg)
  return (
    <PageContainer>
      <Stack spacing={6}>
        <PageHeader
          title={t('nav.contracts')}
          subtitle={t('contracts.subtitle')}
          icon={Briefcase}
        />
        <StandardCard variant="outline">
          <CardBody>
            <Stack
              direction={{ base: 'column', lg: 'row' }}
              spacing={4}
              align={{ base: 'stretch', lg: 'center' }}
              justify="space-between"
            >
              <Box flex={1} maxW={{ base: 'full', lg: '360px' }}>
                <InputGroup>
                  <InputLeftElement pointerEvents="none">
                    <Icon as={Search} boxSize={ICON_BOX_MD} color={iconGray400} />
                  </InputLeftElement>
                  <Input
                    type="search"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder={t('contracts.searchPlaceholder')}
                    aria-label={t('contracts.searchPlaceholder')}
                  />
                </InputGroup>
              </Box>
              <Stack
                direction={{ base: 'column', md: 'row' }}
                spacing={4}
                align={{ base: 'stretch', md: 'center' }}
                justify="flex-end"
                flex="1"
              >
                <HStack spacing={4} justify="flex-end">
                  <Text fontSize="sm" color={iconGray500}>
                    {t('common.itemsPerPage')}
                  </Text>
                  <Select
                    size="sm"
                    maxW="90px"
                    value={itemsPerPage}
                    onChange={(event) => handleItemsPerPageChange(Number(event.target.value))}
                  >
                    {[10, 20, 30].map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </Select>
                </HStack>
                <ButtonGroup size="sm" isAttached alignSelf={{ base: 'flex-start', md: 'auto' }}>
                  <Button
                    colorScheme="brand"
                    minH="44px"
                    maxW={{ base: '140px', md: 'none' }}
                    variant={viewMode === 'card' ? 'solid' : 'outline'}
                    onClick={() => setViewMode('card')}
                    fontSize={{ base: 'sm', md: 'md' }}
                  >
                    {t('contracts.view.cards')}
                  </Button>
                  <Button
                    colorScheme="brand"
                    minH="44px"
                    maxW={{ base: '140px', md: 'none' }}
                    variant={viewMode === 'table' ? 'solid' : 'outline'}
                    onClick={() => setViewMode('table')}
                    fontSize={{ base: 'sm', md: 'md' }}
                  >
                    {t('contracts.view.table')}
                  </Button>
                </ButtonGroup>
              </Stack>
            </Stack>
          </CardBody>
        </StandardCard>
        {error && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            <Text fontSize="sm">
              {t('common.error', 'Error')}: {error}
            </Text>
          </Alert>
        )}
        {loading ? (
          <StandardCard variant="outline">
            <CardBody>
              <Center py={12} flexDirection="column" gap={4}>
                <Spinner size="lg" color="brand.500" />
                <Text fontSize="sm" color={iconGray500}>
                  {t('common.loading', 'Loading...')}
                </Text>
              </Center>
            </CardBody>
          </StandardCard>
        ) : viewMode === 'card' ? (
          <Stack spacing={4}>
            {filteredCount === 0 ? (
              <StandardCard variant="outline">
                <CardBody>
                  <Center flexDirection="column" gap={4}>
                    <Icon as={Search} boxSize={10} color={iconGray300} />
                    <Text fontWeight="medium">{t('contracts.empty.title')}</Text>
                    <Text fontSize="sm" color={iconGray500}>
                      {t('contracts.empty.subtitle')}
                    </Text>
                  </Center>
                </CardBody>
              </StandardCard>
            ) : (
              <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} spacing={4}>
                {paginatedItems.map((item) => {
                  const customerName = item.customer?.name || t('common.na')
                  const initial = customerName.charAt(0).toUpperCase()
                  return (
                    <StandardCard key={item.id} variant="outline" height="100%">
                      <CardHeader pb={2}>
                        <HStack justify="space-between" align="center">
                          <HStack spacing={4} align="center">
                            <Icon as={Calendar} boxSize={ICON_BOX_MD} color={iconGray400} />
                            <Text fontSize="sm" color={iconGray500}>
                              {new Date(item.date || item.createdAt).toLocaleDateString()}
                            </Text>
                          </HStack>
                        </HStack>
                      </CardHeader>
                      <CardBody pt={0}>
                        <Stack spacing={4}>
                          <HStack spacing={4} align="center">
                            <Box
                              w={10}
                              h={10}
                              borderRadius="md"
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                              fontWeight="semibold"
                              bg={headerBg}
                              color={headerTextColor}
                            >
                              {initial}
                            </Box>
                            <Text
                              fontWeight="semibold"
                              color="brand.600"
                              cursor="pointer"
                              onClick={() => handleNavigate(item.id)}
                            >
                              {customerName}
                            </Text>
                          </HStack>
                          <Text fontSize="sm" color={borderGray600} noOfLines={2}>
                            {item.description || t('contracts.noDescription')}
                          </Text>
                          <HStack spacing={4} align="center">
                            <Box
                              display="inline-flex"
                              alignItems="center"
                              justifyContent="center"
                              rounded="sm"
                              bg={bgGreen50}
                              color={textGreen600}
                              p={1}
                            >
                              <Icon as={Briefcase} boxSize={ICON_BOX_MD} />
                            </Box>
                            <Text fontSize="sm" color={borderGray600}>
                              {item.designerData?.name || t('contracts.noDesigner')}
                            </Text>
                          </HStack>
                          <HStack justify="space-between" align="center">
                            <Badge
                              colorScheme={getStatusColor(item.status)}
                              borderRadius="full"
                              px={3}
                              py={1}
                            >
                              {getStatusLabel(item.status)}
                            </Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              colorScheme="brand"
                              onClick={() => handleNavigate(item.id)}
                              leftIcon={<Icon as={FileText} boxSize={ICON_BOX_MD} />}
                              minH="44px"
                              maxW={{ base: '180px', md: 'none' }}
                            >
                              <Text noOfLines={1}>{t('contracts.viewDetails')}</Text>
                            </Button>
                          </HStack>
                        </Stack>
                      </CardBody>
                    </StandardCard>
                  )
                })}
              </SimpleGrid>
            )}
          </Stack>
        ) : (
          <Box display={{ base: 'none', lg: 'block' }}>
          <TableCard>
            <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>{t('contracts.table.date')}</Th>
                      <Th>{t('contracts.table.customer')}</Th>
                      <Th>{t('contracts.table.description')}</Th>
                      <Th>{t('contracts.table.designer')}</Th>
                      <Th>{t('contracts.table.status')}</Th>
                      <Th textAlign="center">{t('contracts.table.actions')}</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {filteredCount === 0 ? (
                      <Tr>
                        <Td colSpan={6}>
                          <Center py={12} flexDirection="column" gap={4}>
                            <Icon as={Search} boxSize={10} color={iconGray300} />
                            <Text>{t('contracts.empty.title')}</Text>
                            <Text fontSize="sm" color={iconGray500}>
                              {t('contracts.empty.subtitle')}
                            </Text>
                          </Center>
                        </Td>
                      </Tr>
                    ) : (
                      paginatedItems.map((item) => (
                        <Tr key={item.id}>
                          <Td>
                            <Text fontSize="sm" fontWeight="medium" color={borderGray700}>
                              {new Date(item.date || item.createdAt).toLocaleDateString()}
                            </Text>
                          </Td>
                          <Td>
                            <Text
                              fontSize="sm"
                              fontWeight="semibold"
                              color="brand.600"
                              cursor="pointer"
                              onClick={() => handleNavigate(item.id)}
                            >
                              {item.customer?.name || t('common.na')}
                            </Text>
                          </Td>
                          <Td>
                            <Text fontSize="sm" color={borderGray600}>
                              {item.description || t('common.na')}
                            </Text>
                          </Td>
                          <Td>
                            <Text fontSize="sm" color={borderGray700}>
                              {item.designerData?.name || t('common.na')}
                            </Text>
                          </Td>
                          <Td>
                            <Badge
                              colorScheme={getStatusColor(item.status)}
                              borderRadius="full"
                              px={3}
                              py={1}
                            >
                              {getStatusLabel(item.status)}
                            </Badge>
                          </Td>
                          <Td>
                            <HStack justify="center" spacing={4}>
                              <Button
                                size="sm"
                                variant="outline"
                                colorScheme="brand"
                                onClick={() => handleNavigate(item.id)}
                                leftIcon={<Icon as={FileText} boxSize={ICON_BOX_MD} />}
                                minH="44px"
                                maxW={{ base: '180px', md: 'none' }}
                                fontSize={{ base: 'xs', md: 'sm' }}
                              >
                                {t('contracts.viewDetails')}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                colorScheme="red"
                                onClick={() => handleDelete(item.id)}
                                leftIcon={<Icon as={Trash2} boxSize={ICON_BOX_MD} />}
                                minH="44px"
                                maxW={{ base: '140px', md: 'none' }}
                                fontSize={{ base: 'xs', md: 'sm' }}
                              >
                                {t('common.delete')}
                              </Button>
                            </HStack>
                          </Td>
                        </Tr>
                      ))
                    )}
                  </Tbody>
                </Table>
          </TableCard>
          </Box>
        )}
        {totalPages > 1 && (
          <StandardCard variant="outline">
            <CardBody>
              <PaginationComponent
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                itemsPerPage={itemsPerPage}
              />
            </CardBody>
          </StandardCard>
        )}
      </Stack>
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        size={{ base: 'full', md: 'xl', lg: '5xl' }}
        scrollBehavior="inside"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader bg={headerBg} color={headerTextColor} borderTopRadius="md">
            {t('contracts.modal.title')}
            <ModalCloseButton color={headerTextColor} />
          </ModalHeader>
          <ModalBody p={6}>
            {loadings ? (
              <Center py={10} flexDirection="column" gap={4}>
                <Spinner size="lg" color="brand.500" />
                <Text fontSize="sm" color={iconGray500}>
                  {t('contracts.loadingDetails')}
                </Text>
              </Center>
            ) : htmlContent ? (
              <Box
                maxH="70vh"
                overflowY="auto"
                borderWidth="1px"
                borderRadius="md"
                p={5}
                bg={color8}
                sx={{
                  '&::-webkit-scrollbar': { width: '8px' },
                  '&::-webkit-scrollbar-track': { bg: 'gray.100', borderRadius: 'full' },
                  '&::-webkit-scrollbar-thumb': { bg: 'gray.300', borderRadius: 'full' },
                  '&::-webkit-scrollbar-thumb:hover': { bg: 'gray.400' },
                }}
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />
            ) : (
              <Center py={10}>
                <Text fontSize="sm" color={iconGray500}>
                  {t('contracts.noData')}
                </Text>
              </Center>
            )}
          </ModalBody>
          <ModalFooter bg={bgGray50} borderBottomRadius="md">
            <Button
              variant="outline"
              onClick={() => setShowModal(false)}
              minH="44px"
              maxW={{ base: '140px', md: 'none' }}
              fontSize={{ base: 'sm', md: 'md' }}
            >
              {t('common.close')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </PageContainer>
  )
}
export default Contracts
