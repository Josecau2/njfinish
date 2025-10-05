import StandardCard from '../../../../components/StandardCard'
import { TableCard } from '../../../../components/TableCard'
import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Button, CardBody, Checkbox, Flex, FormControl, FormLabel, Heading, Icon, Input, InputGroup, InputLeftElement, Menu, MenuButton, MenuDivider, MenuItem, MenuList, Select, Spinner, Stack, Table, TableContainer, Tbody, Td, Text, Th, Thead, Tr, useColorModeValue } from '@chakra-ui/react'
import { ChevronDown, Search } from 'lucide-react'
import PaginationControls from '../../../../components/PaginationControls'
import axiosInstance from '../../../../helpers/axiosInstance'
import { ICON_SIZE_MD, ICON_BOX_MD } from '../../../../constants/iconSizes'

const SettingsTab = ({ manufacturer }) => {
  const { t } = useTranslation()
  const [styleCollection, setStyleCollection] = useState([])
  const [catalogData, setCatalogData] = useState([])
  const [loading, setLoading] = useState(false)

  // Dark mode colors
  const textGray500 = useColorModeValue('gray.500', 'gray.400')
  const textGray600 = useColorModeValue('gray.600', 'gray.300')
  const textGray700 = useColorModeValue('gray.700', 'gray.200')
  const textRed500 = useColorModeValue('red.500', 'red.300')
  const iconGray = useColorModeValue('gray.400', 'gray.500')
  const bgBlue50 = useColorModeValue('blue.50', 'blue.900')
  const bgGreen50 = useColorModeValue('green.50', 'green.900')
  const borderBrand = useColorModeValue('brand.500', 'brand.600')
  const borderGreen = useColorModeValue('green.500', 'green.600')

  const [searchCode1, setSearchCode1] = useState('')
  const [page1, setPage1] = useState(1)
  const [itemsPerPage1, setItemsPerPage1] = useState(5)
  const [multiplier1, setMultiplier1] = useState('')
  const [selectedFields1, setSelectedFields1] = useState([])
  const [multiplier1Error, setMultiplier1Error] = useState('')

  const [searchCode2, setSearchCode2] = useState('')
  const [page2, setPage2] = useState(1)
  const [itemsPerPage2, setItemsPerPage2] = useState(5)
  const [multiplier2, setMultiplier2] = useState('')
  const [selectedFields2, setSelectedFields2] = useState([])
  const [multiplier2Error, setMultiplier2Error] = useState('')

  const allFields = useMemo(() => {
    const baseColumns = ['code']
    const dynamicColumns = Array.isArray(styleCollection)
      ? styleCollection
          .slice(0, 5)
          .map((style) => style?.style)
          .filter((value) => typeof value === 'string' && value.trim() !== '')
      : []

    return [...baseColumns, ...dynamicColumns]
  }, [styleCollection])

  useEffect(() => {
    if (allFields.length > 0) {
      const defaultFields = allFields.slice(0, 5)
      setSelectedFields1(defaultFields)
      setSelectedFields2(defaultFields)
    }
  }, [allFields, catalogData])

  useEffect(() => {
    const fetchCatalogData = async () => {
      if (!manufacturer?.id) {
        setCatalogData([])
        return
      }

      setLoading(true)

      try {
        const response = await axiosInstance.get(`/api/manufacturers/${manufacturer.id}/catalog`, {
          params: {
            page: 1,
            limit: 1000,
            sortBy: 'code',
            sortOrder: 'ASC',
          },
        })

        if (Array.isArray(response.data?.catalogData)) {
          setCatalogData(response.data.catalogData)
        } else {
          setCatalogData([])
        }
      } catch (error) {
        console.error('Error fetching catalog data:', error)
        setCatalogData([])
      } finally {
        setLoading(false)
      }
    }

    fetchCatalogData()
  }, [manufacturer?.id])

  useEffect(() => {
    const fetchStyles = async () => {
      if (!manufacturer?.id) return

      try {
        const response = await axiosInstance.get(`/api/manufacturers/${manufacturer.id}/styles`)
        setStyleCollection(response.data)
      } catch (error) {
        console.error('Error fetching styles:', error)
      }
    }

    fetchStyles()
  }, [manufacturer?.id])

  useEffect(() => {
    if (manufacturer?.costMultiplier) {
      setMultiplier1(manufacturer.costMultiplier)
      setMultiplier2(manufacturer.costMultiplier)
    }
  }, [manufacturer])

  const toggleField = (field, selectedFieldsSetter, selectedFields) => {
    if (typeof field !== 'string' || field.trim() === '') return

    selectedFieldsSetter((prev) => {
      let updated

      if (prev.includes(field)) {
        updated = prev.filter((value) => value !== field)
      } else {
        if (prev.length >= 6) {
          const baseColumns = ['code', 'description']
          const nonBaseColumns = prev.filter((value) => !baseColumns.includes(value))

          if (nonBaseColumns.length > 0) {
            updated = [...baseColumns, ...nonBaseColumns.slice(0, -1), field]
          } else {
            updated = prev
          }
        } else {
          updated = [...prev, field]
        }
      }

      const final = ['code', ...updated.filter((value) => value !== 'code' && value !== 'description')]
      return final
    })
  }

  const filterData = (searchCode) => {
    const filtered =
      catalogData?.filter(
        (item) =>
          typeof item.code === 'string' &&
          item.code.toLowerCase().includes(searchCode.toLowerCase()),
      ) || []

    const groupedByCode = filtered.reduce((acc, item) => {
      if (!acc[item.code]) {
        acc[item.code] = item
      }
      return acc
    }, {})

    return Object.values(groupedByCode)
  }

  const filteredData1 = filterData(searchCode1)
  const totalPages1 = Math.ceil(filteredData1.length / itemsPerPage1) || 1
  const paginatedData1 = filteredData1.slice((page1 - 1) * itemsPerPage1, page1 * itemsPerPage1)

  const filteredData2 = filterData(searchCode2)
  const totalPages2 = Math.ceil(filteredData2.length / itemsPerPage2) || 1
  const paginatedData2 = filteredData2.slice((page2 - 1) * itemsPerPage2, page2 * itemsPerPage2)

  useEffect(() => {
    setPage1(1)
  }, [searchCode1, itemsPerPage1, selectedFields1])

  useEffect(() => {
    setPage2(1)
  }, [searchCode2, itemsPerPage2, selectedFields2])

  const formatFieldLabel = (field) => {
    if (field === 'code') return 'CODE'
    return typeof field === 'string' && field ? `${field.toUpperCase()} PRICE` : t('common.na', 'N/A')
  }

  const renderDropdown = (selectedFields, toggleHandler, prefix) => {
    const summary = selectedFields.length
      ? selectedFields
          .slice(0, 3)
          .map((field) => (typeof field === 'string' && field ? field.toUpperCase() : t('common.na', 'N/A')))
          .join(', ')
      : t('common.displayedColumns', 'Displayed Columns')

    return (
      <Menu closeOnSelect={false} placement="bottom-end">
        <MenuButton
          as={Button}
          size="sm"
          variant="outline"
          rightIcon={<Icon as={ChevronDown} boxSize={ICON_BOX_MD} />}
          minW="220px"
        >
          <Text noOfLines={1} fontWeight="medium">
            {summary}
            {selectedFields.length > 3 ? '...' : ''}
          </Text>
        </MenuButton>
        <MenuList maxH="300px" overflowY="auto">
          <Box px={3} py={2} fontSize="xs" color={textGray500}>
            {t(
              'settings.manufacturers.settings.dropdownHelp',
              'CODE is always shown. Select styles to see multiplied prices. Max 6 columns total.',
            )}
          </Box>
          <MenuDivider />
          {allFields.map((field) => {
            const isBaseColumn = field === 'code'

            return (
              <MenuItem key={field} py={2}>
                <Checkbox
                  id={`checkbox-${prefix}-${field}`}
                  isChecked={selectedFields.includes(field)}
                  onChange={() => toggleHandler(field)}
                  isDisabled={isBaseColumn}
                  size="sm"
                >
                  <Text color={isBaseColumn ? 'gray.500' : 'gray.800'} fontWeight="medium">
                    {typeof field === 'string' && field ? field.toUpperCase() : t('common.na', 'N/A')}{' '}
                    {isBaseColumn ? t('settings.manufacturers.settings.alwaysShown', '(always shown)') : ''}
                  </Text>
                </Checkbox>
              </MenuItem>
            )
          })}
        </MenuList>
      </Menu>
    )
  }

  const resolvePrice = (code, styleKey) => {
    return catalogData.find(
      (entry) =>
        entry.code === code &&
        typeof entry.style === 'string' &&
        typeof styleKey === 'string' &&
        entry.style.toLowerCase() === styleKey.toLowerCase(),
    )?.price
  }

  const renderTable = (data, selectedFields, multiplierCalc) => (
    <Stack spacing={4} mt={4}>
      <Text fontSize="sm" color={textGray600}>
        {t(
          'settings.manufacturers.settings.sampleItems',
          'Showing {{count}} sample items with code and multiplied prices for selected styles',
          { count: Math.min(data.length, 5) },
        )}
      </Text>
      <Box display={{ base: 'none', lg: 'block' }}>
        <TableCard>
          <Table size="sm" variant="striped">
            <Thead>
              <Tr>
                {selectedFields.map((field, index) => (
                  <Th key={`header-${index}`} textTransform="none" fontSize="xs" color={textGray600}>
                    {field === 'code'
                      ? 'CODE'
                      : typeof field === 'string' && field
                        ? `${field.toUpperCase()} PRICE`
                        : t('common.na', 'N/A')}
                  </Th>
                ))}
              </Tr>
            </Thead>
            <Tbody>
              {loading ? (
                <Tr>
                  <Td colSpan={selectedFields.length}>
                    <Flex align="center" justify="center" py={8} color={textGray500}>
                      <Spinner size="sm" />
                    </Flex>
                  </Td>
                </Tr>
              ) : data.length > 0 ? (
                data.map((item) => (
                  <Tr key={item.id ?? item.code}>
                    {selectedFields.map((field, index) => {
                      if (field === 'code') {
                        return <Td key={`${item.id ?? item.code}-${index}`}>{item.code ?? '--'}</Td>
                      }

                      const price = resolvePrice(item.code, field)

                      return (
                        <Td key={`${item.id ?? item.code}-${index}`}>
                          {price ? `$${multiplierCalc(price)}` : '--'}
                        </Td>
                      )
                    })}
                  </Tr>
                ))
              ) : (
                <Tr>
                  <Td colSpan={selectedFields.length}>
                    <Text textAlign="center" py={6} color={textGray500}>
                      {t('common.noData', 'No data found.')}
                    </Text>
                  </Td>
                </Tr>
              )}
            </Tbody>
          </Table>
        </TableCard>
      </Box>
    </Stack>
  )

  return (
    <Stack spacing={8}>
      <StandardCard>
        <CardBody>
          <Stack spacing={4}>
            <Heading size="sm">
              {t('settings.manufacturers.settings.costMultiplierTitle', 'Your cost multiplier')}
            </Heading>
            <Box
              id="costMultiplierHelp"
              borderWidth="1px"
              borderColor={borderBrand}
              bg={bgBlue50}
              borderRadius="md"
              px={3}
              py={2}
              fontSize="sm"
              color={textGray700}
            >
              {t(
                'settings.manufacturers.settings.costMultiplierHelp',
                'Cost multiplier controls the price you pay to manufacturer. You can see your cost in Quote when you turn off Customer multiplier.',
              )}
            </Box>
            <FormControl maxW="140px">
              <Input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.001"
                value={multiplier1}
                onChange={(event) => {
                  const value = event.target.value
                  setMultiplier1(value)
                  setMultiplier1Error(
                    value.trim() === '' ? t('settings.users.form.validation.required') : '',
                  )
                }}
                placeholder={t('settings.manufacturers.placeholders.costMultiplier', '1.000')}
                aria-describedby="costMultiplierHelp"
                aria-label={t(
                  'settings.manufacturers.settings.costMultiplierTitle',
                  'Your cost multiplier',
                )}
              />
            </FormControl>
            {multiplier1Error && (
              <Text color={textRed500} fontSize="sm">
                {multiplier1Error}
              </Text>
            )}
            <Stack direction={{ base: 'column', md: 'row' }} spacing={4} align={{ md: 'center' }}>
              <InputGroup maxW={{ base: '100%', md: '320px' }}>
                <InputLeftElement pointerEvents="none">
                  <Icon as={Search} boxSize={ICON_BOX_MD} color={iconGray} />
                </InputLeftElement>
                <Input
                  value={searchCode1}
                  onChange={(event) => setSearchCode1(event.target.value)}
                  placeholder={`${t('common.search')}...`}
                  aria-label={t('common.search', 'Search')}
                />
              </InputGroup>
              {renderDropdown(
                selectedFields1,
                (field) => toggleField(field, setSelectedFields1, selectedFields1),
                '1',
              )}
            </Stack>
            {renderTable(
              paginatedData1,
              selectedFields1,
              (value) => (parseFloat(value) * parseFloat(multiplier1 || 1)).toFixed(2),
            )}
            <Flex
              direction={{ base: 'column', md: 'row' }}
              justify="space-between"
              align={{ base: 'flex-start', md: 'center' }}
              gap={4}
            >
              <Text fontSize="sm" color={textGray600}>
                {t('common.pageOf', {
                  page: page1,
                  total: totalPages1,
                  defaultValue: 'Page {{page}} of {{total}}',
                })}
              </Text>
              <Flex align="center" gap={4}>
                <FormLabel htmlFor="itemsPerPage1" mb={0} fontSize="sm" color={textGray600}>
                  {t('common.itemsPerPage', 'Items per page:')}
                </FormLabel>
                <Select
                  id="itemsPerPage1"
                  size="sm"
                  width="auto"
                  value={itemsPerPage1}
                  onChange={(event) => setItemsPerPage1(Number(event.target.value))}
                  aria-label={t('common.itemsPerPage', 'Items per page:')}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                </Select>
              </Flex>
              <PaginationControls
                page={page1}
                totalPages={totalPages1}
                goPrev={() => setPage1((current) => Math.max(1, current - 1))}
                goNext={() => setPage1((current) => Math.min(totalPages1, current + 1))}
              />
            </Flex>
          </Stack>
        </CardBody>
      </StandardCard>

      <StandardCard>
        <CardBody>
          <Stack spacing={4}>
            <Heading size="sm">
              {t(
                'settings.manufacturers.settings.customerMultiplierTitle',
                'Customer price multiplier',
              )}
            </Heading>
            <Box
              id="customerMultiplierHelp"
              borderWidth="1px"
              borderColor={borderGreen}
              bg={bgGreen50}
              borderRadius="md"
              px={3}
              py={2}
              fontSize="sm"
              color={textGray700}
            >
              {t(
                'settings.manufacturers.settings.customerMultiplierHelp',
                'Customer price multiplier controls the price at which you sell to your customers. This is what determines your profit.',
              )}
            </Box>
            <FormControl maxW="140px">
              <Input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.001"
                value={multiplier2}
                onChange={(event) => {
                  const value = event.target.value
                  setMultiplier2(value)
                  setMultiplier2Error(
                    value.trim() === '' ? t('settings.users.form.validation.required') : '',
                  )
                }}
                placeholder={t('settings.manufacturers.placeholders.costMultiplier', '1.000')}
                aria-describedby="customerMultiplierHelp"
                aria-label={t(
                  'settings.manufacturers.settings.customerMultiplierTitle',
                  'Customer price multiplier',
                )}
              />
            </FormControl>
            {multiplier2Error && (
              <Text color={textRed500} fontSize="sm">
                {multiplier2Error}
              </Text>
            )}
            <Stack direction={{ base: 'column', md: 'row' }} spacing={4} align={{ md: 'center' }}>
              <InputGroup maxW={{ base: '100%', md: '320px' }}>
                <InputLeftElement pointerEvents="none">
                  <Icon as={Search} boxSize={ICON_BOX_MD} color={iconGray} />
                </InputLeftElement>
                <Input
                  value={searchCode2}
                  onChange={(event) => setSearchCode2(event.target.value)}
                  placeholder={`${t('common.search')}...`}
                  aria-label={t('common.search', 'Search')}
                />
              </InputGroup>
              {renderDropdown(
                selectedFields2,
                (field) => toggleField(field, setSelectedFields2, selectedFields2),
                '2',
              )}
            </Stack>
            {renderTable(
              paginatedData2,
              selectedFields2,
              (value) =>
                (
                  parseFloat(value) *
                  parseFloat(multiplier1 || 1) *
                  parseFloat(multiplier2 || 1)
                ).toFixed(2),
            )}
            <Flex
              direction={{ base: 'column', md: 'row' }}
              justify="space-between"
              align={{ base: 'flex-start', md: 'center' }}
              gap={4}
            >
              <Text fontSize="sm" color={textGray600}>
                {t('common.pageOf', {
                  page: page2,
                  total: totalPages2,
                  defaultValue: 'Page {{page}} of {{total}}',
                })}
              </Text>
              <Flex align="center" gap={4}>
                <FormLabel htmlFor="itemsPerPage2" mb={0} fontSize="sm" color={textGray600}>
                  {t('common.itemsPerPage', 'Items per page:')}
                </FormLabel>
                <Select
                  id="itemsPerPage2"
                  size="sm"
                  width="auto"
                  value={itemsPerPage2}
                  onChange={(event) => setItemsPerPage2(Number(event.target.value))}
                  aria-label={t('common.itemsPerPage', 'Items per page:')}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                </Select>
              </Flex>
              <PaginationControls
                page={page2}
                totalPages={totalPages2}
                goPrev={() => setPage2((current) => Math.max(1, current - 1))}
                goNext={() => setPage2((current) => Math.min(totalPages2, current + 1))}
              />
            </Flex>
          </Stack>
        </CardBody>
      </StandardCard>
    </Stack>
  )
}

export default SettingsTab



