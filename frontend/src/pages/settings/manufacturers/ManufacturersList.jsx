import StandardCard from '../../../components/StandardCard'
import { useEffect, useMemo, useState } from 'react'
import { Box, Button, CardBody, Container, Flex, Grid, GridItem, HStack, Icon, Image, Input, InputGroup, InputLeftElement, Select, Spinner, Stack, Switch, Tag, TagLabel, Text, Tooltip, useColorModeValue } from '@chakra-ui/react'
import PageContainer from '../../../components/PageContainer'
import {
  Building2,
  Mail,
  FileText,
  Search,
  Plus,
  Edit3,
  Filter,
  SortAsc,
  SortDesc,
  Factory,
} from '@/icons-lucide'
import { useNavigate } from 'react-router-dom'
import { buildEncodedPath, genNoise } from '../../../utils/obfuscate'
import { buildUploadUrl } from '../../../utils/uploads'
import { useDispatch, useSelector } from 'react-redux'
import { fetchManufacturers, updateManufacturerStatus } from '../../../store/slices/manufacturersSlice'
import { useToast } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import PageHeader from '../../../components/PageHeader'
import { ICON_SIZE_MD, ICON_BOX_MD } from '../../../constants/iconSizes'

const getContrastColor = (hexColor) => {
  if (!hexColor) return "white"
  const hex = hexColor.replace('#', '')
  if (hex.length !== 6) return "white"
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? "gray.700" : "white"
}

const sortOptions = [
  { value: 'id', label: 'ID' },
  { value: 'name', label: 'Name' },
  { value: 'email', label: 'Email' },
]

const ManufacturersList = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const toast = useToast()
  const apiUrl = import.meta.env.VITE_API_URL

  const { list: allManufacturers, loading, error } = useSelector((state) => state.manufacturers)
  const customization = useSelector((state) => state.customization)

  const [filterText, setFilterText] = useState('')
  const [sortBy, setSortBy] = useState('id')
  const [sortDirection, setSortDirection] = useState('desc')

  // Dark mode colors
  const searchIconColor = useColorModeValue("gray.400", "gray.500")
  const spinnerColor = useColorModeValue("blue.500", "blue.300")
  const errorTitleColor = useColorModeValue("red.500", "red.300")
  const errorMessageColor = useColorModeValue("red.400", "red.300")
  const emptyIconColor = useColorModeValue("gray.300", "gray.600")
  const emptyTextColor = useColorModeValue("gray.600", "gray.400")
  const cardBg = useColorModeValue("gray.50", "gray.800")
  const cardBorderColor = useColorModeValue("gray.100", "gray.700")
  const buildingIconColor = useColorModeValue("blue.500", "blue.300")
  const locationTextColor = useColorModeValue("gray.500", "gray.400")
  const mailIconColor = useColorModeValue("gray.400", "gray.500")
  const emailTextColor = useColorModeValue("gray.600", "gray.400")
  const fileIconColor = useColorModeValue("gray.400", "gray.500")
  const catalogTextColor = useColorModeValue("gray.600", "gray.400")

  useEffect(() => {
    dispatch(fetchManufacturers())
  }, [dispatch])

  const filteredManufacturers = useMemo(() => {
    const prepared = [...allManufacturers]
    const normalizedFilter = filterText.trim().toLowerCase()

    const filtered = normalizedFilter
      ? prepared.filter((manufacturer) => {
          const nameMatch = manufacturer.name?.toLowerCase().includes(normalizedFilter)
          const emailMatch = manufacturer.email?.toLowerCase().includes(normalizedFilter)
          return nameMatch || emailMatch
        })
      : prepared

    filtered.sort((a, b) => {
      const aValue = a[sortBy] ?? ''
      const bValue = b[sortBy] ?? ''

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [allManufacturers, filterText, sortBy, sortDirection])

  const handleFilterChange = (event) => {
    setFilterText(event.target.value)
  }

  const handleSortByChange = (event) => {
    setSortBy(event.target.value)
  }

  const handleSortDirectionChange = (event) => {
    setSortDirection(event.target.value)
  }

  const toggleEnabled = (id, currentStatus) => {
    dispatch(updateManufacturerStatus({ id, enabled: !currentStatus }))
      .unwrap()
      .then(() => {
        dispatch(fetchManufacturers())
        toast({
          title: t('settings.manufacturers.toast.updateSuccess'),
          status: 'success',
          duration: 1500,
          isClosable: true,
          position: 'top',
        })
      })
      .catch((err) => {
        console.error('Toggle manufacturer failed:', err)
        toast({
          title: t('settings.manufacturers.toast.updateFailed'),
          status: 'error',
          duration: 1500,
          isClosable: true,
          position: 'top',
        })
      })
  }

  const handleCreateManufacturer = () => {
    navigate('/settings/manufacturers/create')
  }

  const handleEdit = (manufacturerId) => {
    const noisyPath = `/${genNoise(6)}/${genNoise(8)}` +
      buildEncodedPath('/settings/manufacturers/edit/:id', { id: manufacturerId })
    navigate(noisyPath)
  }

  const headerActions = [
    <Button
      key="create"
      colorScheme="brand"
      leftIcon={<Icon as={Plus} boxSize={ICON_BOX_MD} />}
      onClick={handleCreateManufacturer}
    >
      {t('settings.manufacturers.create.title')}
    </Button>,
  ]

  const brandBg = customization?.headerBg || 'blue.600'
  const brandText = getContrastColor(brandBg)

  return (
    <PageContainer>
      <Stack spacing={6}>
        <PageHeader
          title={t('settings.manufacturers.title')}
          subtitle={t('settings.manufacturers.subtitle')}
          icon={Factory}
          actions={headerActions}
        />

        <StandardCard>
          <CardBody>
            <Grid templateColumns={{ base: '1fr', md: '2fr 1fr 1fr' }} gap={4} alignItems="center">
              <GridItem>
                <InputGroup>
                  <InputLeftElement pointerEvents="none">
                    <Icon as={Search} boxSize={ICON_BOX_MD} color={searchIconColor} />
                  </InputLeftElement>
                  <Input
                    placeholder={t('settings.manufacturers.searchPlaceholder', 'Search manufacturers')}
                    value={filterText}
                    onChange={handleFilterChange}
                    name="manufacturers-search"
                    id="manufacturers-search"
                  />
                </InputGroup>
              </GridItem>

              <GridItem>
                <Select value={sortBy} onChange={handleSortByChange} name="sort-by" id="manufacturers-sort-by">
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {t(`settings.manufacturers.sort.${option.value}`, option.label)}
                    </option>
                  ))}
                </Select>
              </GridItem>

              <GridItem>
                <Select value={sortDirection} onChange={handleSortDirectionChange} name="sort-direction" id="manufacturers-sort-direction">
                  <option value="asc">
                    {t('settings.manufacturers.sort.asc', 'Ascending')}
                  </option>
                  <option value="desc">
                    {t('settings.manufacturers.sort.desc', 'Descending')}
                  </option>
                </Select>
              </GridItem>
            </Grid>
          </CardBody>
        </StandardCard>

        {loading && (
          <Flex align="center" justify="center" py={16}>
            <Spinner size="lg" color={spinnerColor} />
          </Flex>
        )}

        {error && !loading && (
          <StandardCard borderColor="red.200" borderWidth="1px">
            <CardBody>
              <Text color={errorTitleColor} fontWeight="semibold">
                {t('common.error')}:
              </Text>
              <Text color={errorMessageColor}>{error}</Text>
            </CardBody>
          </StandardCard>
        )}

        {!loading && filteredManufacturers.length === 0 && (
          <StandardCard>
            <CardBody textAlign="center" py={16}>
              <Icon as={Filter} boxSize={10} color={emptyIconColor} mb={4} />
              <Text fontSize="lg" color={emptyTextColor}>
                {t('settings.manufacturers.emptyState', 'No manufacturers match the current filters.')}
              </Text>
            </CardBody>
          </StandardCard>
        )}

        <Stack spacing={4}>
          {filteredManufacturers.map((manufacturer) => (
            <StandardCard
              key={manufacturer.id}
              borderRadius="xl"
              boxShadow="md"
              _hover={{ boxShadow: 'lg', transform: 'translateY(-2px)' }}
              transition="all 0.2s"
            >
              <CardBody>
                <Flex direction={{ base: 'column', md: 'row' }} gap={6} align="stretch">
                  <Box
                    w={{ base: '100%', md: '140px' }}
                    h={{ base: '120px', md: '140px' }}
                    bg={cardBg}
                    borderRadius="md"
                    borderWidth="1px"
                    borderColor={cardBorderColor}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    overflow="hidden"
                    flexShrink={0}
                  >
                    <Image
                      src={
                        manufacturer.image
                          ? buildUploadUrl(
                              `/uploads/images/${String(manufacturer.image).trim()}`,
                            )
                          : '/images/nologo.png'
                      }
                      alt={manufacturer.name}
                      maxW="100%"
                      maxH="100%"
                      objectFit="contain"
                    />
                  </Box>

                  <Flex flex="1" direction="column" gap={4} minW="0">
                    <Flex justify="space-between" align={{ base: 'flex-start', md: 'center' }} gap={4}>
                      <Box minW="0">
                        <HStack spacing={4} align="center">
                          <Icon as={Building2} boxSize={ICON_BOX_MD} color={buildingIconColor} />
                          <Text fontSize="lg" fontWeight="semibold" noOfLines={1}>
                            {manufacturer.name}
                          </Text>
                        </HStack>
                        <Text fontSize="sm" color={locationTextColor}>
                          ID: {manufacturer.id}
                        </Text>
                      </Box>

                      <Tooltip label={t('actions.editManufacturer', { name: manufacturer.name })}>
                        <Button
                          size="sm"
                          variant="outline"
                          colorScheme="brand"
                          leftIcon={<Icon as={Edit3} boxSize={ICON_BOX_MD} />}
                          onClick={() => handleEdit(manufacturer.id)}
                        >
                          {t('common.edit')}
                        </Button>
                      </Tooltip>
                    </Flex>

                    <HStack spacing={4} align="flex-start" flexWrap="wrap">
                      <HStack spacing={4} minW="0">
                        <Icon as={Mail} boxSize={ICON_BOX_MD} color={mailIconColor} />
                        <Text fontSize="sm" color={emailTextColor} noOfLines={1}>
                          {manufacturer.email || t('settings.manufacturers.noEmail', 'No email provided')}
                        </Text>
                      </HStack>

                      <HStack spacing={4}>
                        <Icon as={FileText} boxSize={ICON_BOX_MD} color={fileIconColor} />
                        <Tag size="sm" variant="subtle" colorScheme="gray">
                          <TagLabel>
                            {t('settings.manufacturers.labels.capacity', {
                              capacity: manufacturer.capacity ?? t('common.notAvailable'),
                            })}
                          </TagLabel>
                        </Tag>
                      </HStack>
                    </HStack>

                    <Flex align="center" justify="space-between" flexWrap="wrap" gap={4}>
                      <HStack spacing={4}>
                        <Switch
                          colorScheme="brand"
                          isChecked={Boolean(manufacturer.status)}
                          onChange={() => toggleEnabled(manufacturer.id, manufacturer.status)}
                        />
                        <Text fontSize="sm" color={catalogTextColor}>
                          {manufacturer.status
                            ? t('settings.manufacturers.labels.active')
                            : t('settings.manufacturers.labels.inactive')}
                        </Text>
                      </HStack>

                      <Tag
                        size="lg"
                        borderRadius="full"
                        bg={manufacturer.status ? brandBg : 'gray.200'}
                        color={manufacturer.status ? brandText : 'gray.600'}
                      >
                        <TagLabel>
                          {manufacturer.status
                            ? t('settings.manufacturers.labels.enabled')
                            : t('settings.manufacturers.labels.disabled')}
                        </TagLabel>
                      </Tag>
                    </Flex>
                  </Flex>
                </Flex>
              </CardBody>
            </StandardCard>
          ))}
        </Stack>
      </Stack>
    </PageContainer>
  )
}

export default ManufacturersList
