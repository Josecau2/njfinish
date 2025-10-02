import StandardCard from '../../../components/StandardCard'
import { useEffect, useMemo, useState } from 'react'
import { Box, Button, Container, Flex, Grid, GridItem, HStack, Icon, Input, InputGroup, InputLeftElement, Select, Spinner, Stack, Switch, Tag, TagLabel, Text, Tooltip } from '@chakra-ui/react'
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
import { useDispatch, useSelector } from 'react-redux'
import { fetchManufacturers, updateManufacturerStatus } from '../../../store/slices/manufacturersSlice'
import Swal from 'sweetalert2'
import { useTranslation } from 'react-i18next'
import PageHeader from '../../../components/PageHeader'

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
  const apiUrl = import.meta.env.VITE_API_URL

  const { list: allManufacturers, loading, error } = useSelector((state) => state.manufacturers)
  const customization = useSelector((state) => state.customization)

  const [filterText, setFilterText] = useState('')
  const [sortBy, setSortBy] = useState('id')
  const [sortDirection, setSortDirection] = useState('desc')

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
        Swal.fire({
          toast: true,
          position: 'top',
          icon: 'success',
          title: t('settings.manufacturers.toast.updateSuccess'),
          showConfirmButton: false,
          timer: 1500,
          width: 360,
        })
      })
      .catch((err) => {
        console.error('Toggle manufacturer failed:', err)
        Swal.fire({
          toast: true,
          position: 'top',
          icon: 'error',
          title: t('settings.manufacturers.toast.updateFailed'),
          showConfirmButton: false,
          timer: 1500,
          width: 330,
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
      colorScheme="blue"
      leftIcon={<Icon as={Plus} boxSize={4} />}
      onClick={handleCreateManufacturer}
    >
      {t('settings.manufacturers.create')}
    </Button>,
  ]

  const brandBg = customization?.headerBg || 'blue.600'
  const brandText = getContrastColor(brandBg)

  return (
    <Container maxW="7xl" py={6}>
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
                    <Icon as={Search} boxSize={4} color="gray.400" />
                  </InputLeftElement>
                  <Input
                    placeholder={t('settings.manufacturers.searchPlaceholder', 'Search manufacturers')}
                    value={filterText}
                    onChange={handleFilterChange}
                  />
                </InputGroup>
              </GridItem>

              <GridItem>
                <Select value={sortBy} onChange={handleSortByChange}>
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {t(`settings.manufacturers.sort.${option.value}`, option.label)}
                    </option>
                  ))}
                </Select>
              </GridItem>

              <GridItem>
                <Select value={sortDirection} onChange={handleSortDirectionChange}>
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
            <Spinner size="lg" color="blue.500" />
          </Flex>
        )}

        {error && !loading && (
          <StandardCard borderColor="red.200" borderWidth="1px">
            <CardBody>
              <Text color="red.500" fontWeight="semibold">
                {t('common.error')}:
              </Text>
              <Text color="red.400">{error}</Text>
            </CardBody>
          </StandardCard>
        )}

        {!loading && filteredManufacturers.length === 0 && (
          <StandardCard>
            <CardBody textAlign="center" py={16}>
              <Icon as={Filter} boxSize={10} color="gray.300" mb={4} />
              <Text fontSize="lg" color="gray.600">
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
                    bg="gray.50"
                    borderRadius="md"
                    borderWidth="1px"
                    borderColor="gray.100"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    overflow="hidden"
                    flexShrink={0}
                  >
                    <img
                      src={
                        manufacturer.image
                          ? `${apiUrl}/uploads/images/${manufacturer.image}`
                          : '/images/nologo.png'
                      }
                      alt={manufacturer.name}
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                    />
                  </Box>

                  <Flex flex="1" direction="column" gap={4} minW="0">
                    <Flex justify="space-between" align={{ base: 'flex-start', md: 'center' }} gap={4}>
                      <Box minW="0">
                        <HStack spacing={4} align="center">
                          <Icon as={Building2} boxSize={5} color="blue.500" />
                          <Text fontSize="lg" fontWeight="semibold" noOfLines={1}>
                            {manufacturer.name}
                          </Text>
                        </HStack>
                        <Text fontSize="sm" color="gray.500">
                          ID: {manufacturer.id}
                        </Text>
                      </Box>

                      <Tooltip label={t('actions.editManufacturer', { name: manufacturer.name })}>
                        <Button
                          size="sm"
                          variant="outline"
                          colorScheme="blue"
                          leftIcon={<Icon as={Edit3} boxSize={4} />}
                          onClick={() => handleEdit(manufacturer.id)}
                        >
                          {t('common.edit')}
                        </Button>
                      </Tooltip>
                    </Flex>

                    <HStack spacing={4} align="flex-start" flexWrap="wrap">
                      <HStack spacing={4} minW="0">
                        <Icon as={Mail} boxSize={4} color="gray.400" />
                        <Text fontSize="sm" color="gray.600" noOfLines={1}>
                          {manufacturer.email || t('settings.manufacturers.noEmail', 'No email provided')}
                        </Text>
                      </HStack>

                      <HStack spacing={4}>
                        <Icon as={FileText} boxSize={4} color="gray.400" />
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
                          colorScheme="blue"
                          isChecked={Boolean(manufacturer.status)}
                          onChange={() => toggleEnabled(manufacturer.id, manufacturer.status)}
                        />
                        <Text fontSize="sm" color="gray.600">
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
    </Container>
  )
}

export default ManufacturersList
