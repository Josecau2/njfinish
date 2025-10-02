import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Container, Stack, HStack, Box, SimpleGrid, Input, Select, CardBody, CardHeader, Badge, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter, Button, Icon, ButtonGroup, InputGroup, InputLeftElement, Table, Thead, Tbody, Tr, Th, Td, TableContainer, Text, Spinner, Center, Alert, AlertIcon } from '@chakra-ui/react'
import StandardCard from '../../components/StandardCard'
import { Search, Calendar, Briefcase, FileText, Trash2 } from 'lucide-react'
import { getContracts } from '../../queries/proposalQueries'
import { useSelector } from 'react-redux'
import axiosInstance from '../../helpers/axiosInstance'
import PaginationComponent from '../../components/common/PaginationComponent'
import PageHeader from '../../components/PageHeader'
import { ICON_SIZE_MD, ICON_BOX_MD } from '../../constants/iconSizes'

const Contracts = () => {
  const { t } = useTranslation()
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
    if (!backgroundColor) return "white"
    // Convert hex to RGB
    const hex = backgroundColor.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    // Return dark color for light backgrounds, light color for dark backgrounds
    return luminance > 0.5 ? "gray.700" : "white"
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
  const generateHTMLTemplate = (formData) => {
    const headerColor = 'var(--chakra-colors-white)'
    const headerTxtColor = 'var(--chakra-colors-black)'
    const items = formData?.manufacturersData?.[0]?.items || []
    // Localized labels for the PDF/HTML template
    const pdf = {
      title: t('nav.contracts'),
      sectionHeader: t('contracts.pdf.sectionHeader'),
      columns: {
        no: t('contracts.pdf.columns.no'),
        qty: t('contracts.pdf.columns.qty'),
        item: t('contracts.pdf.columns.item'),
        assembled: t('contracts.pdf.columns.assembled'),
        hingeSide: t('contracts.pdf.columns.hingeSide'),
        exposedSide: t('contracts.pdf.columns.exposedSide'),
        price: t('contracts.pdf.columns.price'),
        assemblyFee: t('contracts.pdf.columns.assemblyFee'),
        total: t('contracts.pdf.columns.total'),
      },
      categories: {
        items: t('contracts.pdf.categories.items'),
      },
      summary: {
        cabinets: t('contracts.pdf.summary.cabinetsParts'),
        assemblyFee: t('contracts.pdf.summary.assemblyFee'),
        modifications: t('contracts.pdf.summary.modifications'),
        styleTotal: t('contracts.pdf.summary.styleTotal'),
        total: t('contracts.pdf.summary.total'),
        tax: t('contracts.pdf.summary.tax'),
        grandTotal: t('contracts.pdf.summary.grandTotal'),
      },
      yes: t('common.yes'),
      no: t('common.no'),
      na: t('common.na'),
    }
    const proposalItems = items.map((item) => ({
      qty: item.qty || 0,
      code: item.code || '',
      assembled: !!item.isRowAssembled,
      hingeSide: item.hingeSide || null,
      exposedSide: item.exposedSide || null,
      price: parseFloat(item.price) || 0,
      assemblyCost: item.includeAssemblyFee ? parseFloat(item.assemblyFee) || 0 : 0,
      total: item.includeAssemblyFee ? parseFloat(item.total) || 0 : parseFloat(item.price) || 0,
      modifications: item.modifications || {},
    }))
    const summary = formData?.manufacturersData?.[0]?.summary || {}
    const priceSummary = formData?.manufacturersData?.[0]?.items?.length
      ? {
          cabinets: summary.cabinets || 0,
          assemblyFee: summary.assemblyFee || 0,
          modifications: summary.modificationsCost || 0,
          styleTotal: summary.styleTotal || 0,
          total: summary.total || 0,
          tax: summary.taxAmount || 0,
          grandTotal: summary.grandTotal || 0,
        }
      : {
          cabinets: 0,
          assemblyFee: 0,
          modifications: 0,
          styleTotal: 0,
          total: 0,
          tax: 0,
          grandTotal: 0,
        }
    return `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="utf-8">
      <title>${pdf.title}</title>
          <style>
              @page { margin: 20mm; size: A4; }
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: 'Arial', sans-serif; font-size: 12px; line-height: 1.4; color: var(--chakra-colors-gray-700); }
              .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; padding: 20px; border-bottom: 2px solid ${headerColor}; background-color: ${headerColor}; }
              .logo { max-width: 120px; max-height: 80px; }
              .company-name { font-size: 24px; font-weight: bold; color: white; }
              .company-info { text-align: right; line-height: 1.6; color: ${headerTxtColor}; }
              .section-header { font-size: 16px; font-weight: bold; margin: 25px 0 15px 0; text-transform: uppercase; letter-spacing: 0.5px; }
              .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
              .items-table th { background-color: var(--chakra-colors-gray-50); padding: 10px 8px; border: 1px solid var(--chakra-colors-gray-200); font-weight: bold; text-align: left; font-size: 11px; }
              .items-table td { padding: 8px; border: 1px solid var(--chakra-colors-gray-200); font-size: 10px; }
              .items-table tr:nth-child(even) { background-color: var(--chakra-colors-gray-50); }
              .category-row { background-color: var(--chakra-colors-gray-200) !important; font-weight: bold; }
              .text-right { text-align: right; }
              .text-left { text-align: left; }
              .price-summary { background-color: var(--chakra-colors-gray-50); border: 1px solid var(--chakra-colors-gray-200); border-radius: 0.5rem; padding: 1rem; margin-top: 1rem; font-family: 'Arial', sans-serif; font-size: 0.95rem; }
              .price-summary table { width: 100%; border-collapse: collapse; }
              .price-summary td { padding: 0.25rem 0; }
              .price-summary .text-left { text-align: left; color: var(--chakra-colors-gray-800); font-weight: 500; }
              .price-summary .text-right { text-align: right; color: var(--chakra-colors-gray-800); font-weight: 500; }
              .price-summary .total-row { font-weight: bold; border-bottom: 1px solid var(--chakra-colors-gray-300); padding-top: 0.25rem; }
              .price-summary .grand-total { font-weight: bold; font-size: 1.05rem; color: var(--chakra-colors-gray-900); padding-top: 0.75rem; }
          </style>
      </head>
      <body>
          ${
            proposalItems && proposalItems.length > 0
              ? `
      <div class="section-header">${pdf.sectionHeader}</div>
          <table class="items-table">
              <thead>
                  <tr style="background-color: #f0f0f0;">
            <th style="border: 1px solid #ccc; padding: 5px;">${pdf.columns.no}</th>
            <th style="border: 1px solid #ccc; padding: 5px;">${pdf.columns.qty}</th>
            <th style="border: 1px solid #ccc; padding: 5px;">${pdf.columns.item}</th>
            <th style="border: 1px solid #ccc; padding: 5px;">${pdf.columns.assembled}</th>
            <th style="border: 1px solid #ccc; padding: 5px;">${pdf.columns.hingeSide}</th>
            <th style="border: 1px solid #ccc; padding: 5px;">${pdf.columns.exposedSide}</th>
            <th style="border: 1px solid #ccc; padding: 5px;">${pdf.columns.price}</th>
            <th style="border: 1px solid #ccc; padding: 5px;">${pdf.columns.assemblyFee}</th>
            <th style="border: 1px solid #ccc; padding: 5px;">${pdf.columns.total}</th>
                  </tr>
              </thead>
              <tbody>
                  <tr class="category-row">
            <td colspan="9" style="padding: 6px;"><strong>${pdf.categories.items}</strong></td>
                  </tr>
                  ${proposalItems
                    .map(
                      (item, index) => `
                      <tr>
                          <td style="border: 1px solid #ccc; padding: 5px;">${index + 1}</td>
                          <td style="border: 1px solid #ccc; padding: 5px;">${item.qty}</td>
                          <td style="border: 1px solid #ccc; padding: 5px;">${item.code || ''}</td>
              <td style="border: 1px solid #ccc; padding: 5px;">${item.assembled ? pdf.yes : pdf.no}</td>
              <td style="border: 1px solid #ccc; padding: 5px;">${item.hingeSide || pdf.na}</td>
              <td style="border: 1px solid #ccc; padding: 5px;">${item.exposedSide || pdf.na}</td>
                          <td style="border: 1px solid #ccc; padding: 5px;">$${parseFloat(item.price).toFixed(2)}</td>
              <td style="border: 1px solid #ccc; padding: 5px;">$${item.includeAssemblyFee ? parseFloat(item.assemblyFee).toFixed(2) : '0.00'}</td>
                          <td style="border: 1px solid #ccc; padding: 5px;">$${parseFloat(item.total).toFixed(2)}</td>
                      </tr>
                  `,
                    )
                    .join('')}
              </tbody>
          </table>
          <div class="price-summary">
              <table>
                  <tr>
            <td class="text-left">${pdf.summary.cabinets}</td>
                      <td class="text-right">$${priceSummary.cabinets.toFixed(2)}</td>
                  </tr>
                  <tr>
            <td class="text-left">${pdf.summary.assemblyFee}</td>
                      <td class="text-right">$${priceSummary.assemblyFee.toFixed(2)}</td>
                  </tr>
                  <tr class="total-row">
            <td class="text-left">${pdf.summary.modifications}</td>
                      <td class="text-right">$${priceSummary.modifications.toFixed(2)}</td>
                  </tr>
                  <tr>
            <td class="text-left">${pdf.summary.styleTotal}</td>
                      <td class="text-right">$${priceSummary.styleTotal.toFixed(2)}</td>
                  </tr>
                  <tr>
            <td class="text-left">${pdf.summary.total}</td>
                      <td class="text-right">$${priceSummary.total.toFixed(2)}</td>
                  </tr>
                  <tr class="total-row">
            <td class="text-left">${pdf.summary.tax}</td>
                      <td class="text-right">$${priceSummary.tax.toFixed(2)}</td>
                  </tr>
                  <tr class="grand-total">
            <td class="text-left">${pdf.summary.grandTotal}</td>
                      <td class="text-right">$${priceSummary.grandTotal.toFixed(2)}</td>
                  </tr>
              </table>
          </div>
          `
              : ''
          }
      </body>
      </html>
    `
  }
  const htmlContent = generateHTMLTemplate(formData)

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
  const headerBg = customization?.headerBg || "purple.500"
  const headerTextColor = getContrastColor(headerBg)
  return (
    <Container maxW="7xl" py={6}>
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
              <InputGroup maxW={{ base: 'full', lg: '360px' }}>
                <InputLeftElement pointerEvents="none">
                  <Icon as={Search} color="gray.400" boxSize={ICON_BOX_MD} />
                </InputLeftElement>
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder={t('contracts.searchPlaceholder')}
                  aria-label={t('contracts.searchPlaceholder')}
                />
              </InputGroup>
              <Stack
                direction={{ base: 'column', md: 'row' }}
                spacing={4}
                align={{ base: 'stretch', md: 'center' }}
                justify="flex-end"
                flex="1"
              >
                <HStack spacing={4} justify="flex-end">
                  <Text fontSize="sm" color="gray.500">
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
                    variant={viewMode === 'card' ? 'solid' : 'outline'}
                    onClick={() => setViewMode('card')}
                  >
                    {t('contracts.view.cards')}
                  </Button>
                  <Button
                    colorScheme="brand"
                    variant={viewMode === 'table' ? 'solid' : 'outline'}
                    onClick={() => setViewMode('table')}
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
                <Text fontSize="sm" color="gray.500">
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
                    <Icon as={Search} boxSize={10} color="gray.300" />
                    <Text fontWeight="medium">{t('contracts.empty.title')}</Text>
                    <Text fontSize="sm" color="gray.500">
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
                            <Icon as={Calendar} boxSize={ICON_BOX_MD} color="gray.400" />
                            <Text fontSize="sm" color="gray.500">
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
                          <Text fontSize="sm" color="gray.600" noOfLines={2}>
                            {item.description || t('contracts.noDescription')}
                          </Text>
                          <HStack spacing={4} align="center">
                            <Box
                              display="inline-flex"
                              alignItems="center"
                              justifyContent="center"
                              rounded="sm"
                              bg="green.50"
                              color="green.600"
                              p={1}
                            >
                              <Icon as={Briefcase} boxSize={ICON_BOX_MD} />
                            </Box>
                            <Text fontSize="sm" color="gray.600">
                              {item.designerData?.name || t('contracts.noDesigner')}
                            </Text>
                          </HStack>
                          <HStack justify="space-between" align="center">
                            <Badge colorScheme={getStatusColor(item.status)} borderRadius="full" px={3} py={1}>
                              {getStatusLabel(item.status)}
                            </Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              colorScheme="brand"
                              onClick={() => handleNavigate(item.id)}
                              leftIcon={<Icon as={FileText} boxSize={ICON_BOX_MD} />}
                            >
                              {t('contracts.viewDetails')}
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
          <StandardCard variant="outline">
            <CardBody p={0}>
              <TableContainer>
                <Table variant="simple">
                  <Thead bg="gray.50">
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
                            <Icon as={Search} boxSize={10} color="gray.300" />
                            <Text>{t('contracts.empty.title')}</Text>
                            <Text fontSize="sm" color="gray.500">
                              {t('contracts.empty.subtitle')}
                            </Text>
                          </Center>
                        </Td>
                      </Tr>
                    ) : (
                      paginatedItems.map((item) => (
                        <Tr key={item.id}>
                          <Td>
                            <Text fontSize="sm" fontWeight="medium" color="gray.700">
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
                            <Text fontSize="sm" color="gray.600">
                              {item.description || t('common.na')}
                            </Text>
                          </Td>
                          <Td>
                            <Text fontSize="sm" color="gray.700">
                              {item.designerData?.name || t('common.na')}
                            </Text>
                          </Td>
                          <Td>
                            <Badge colorScheme={getStatusColor(item.status)} borderRadius="full" px={3} py={1}>
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
                              >
                                {t('contracts.viewDetails')}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                colorScheme="red"
                                onClick={() => handleDelete(item.id)}
                                leftIcon={<Icon as={Trash2} boxSize={ICON_BOX_MD} />}
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
              </TableContainer>
            </CardBody>
          </StandardCard>
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
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} size={{ base: 'full', md: 'xl', lg: '5xl' }} scrollBehavior="inside">
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
                <Text fontSize="sm" color="gray.500">
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
                bg="white"
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
                <Text fontSize="sm" color="gray.500">
                  {t('contracts.noData')}
                </Text>
              </Center>
            )}
          </ModalBody>
          <ModalFooter bg="gray.50" borderBottomRadius="md">
            <Button variant="outline" onClick={() => setShowModal(false)}>
              {t('common.close')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  )
}
export default Contracts





