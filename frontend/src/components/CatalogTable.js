import StandardCard from './StandardCard'
import { TableCard } from './TableCard'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { getContrastColor } from '../utils/colorUtils'
import { checkSubTypeRequirements } from '../helpers/subTypeValidation'
import { Badge, Checkbox, Image, Input, InputGroup, Modal, ModalBody, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalFooter, Icon, Table, TableContainer, Thead, Tbody, Tr, Th, Td, Text, Button, Flex, Box, VStack, HStack, useColorModeValue } from '@chakra-ui/react'
import { Copy, Settings, Trash, Wrench } from 'lucide-react'
import axiosInstance from '../helpers/axiosInstance'
import PageHeader from './PageHeader'

const hingeOptions = ['L', 'R', '-']
const exposedOptions = ['L', 'R', 'B', '-']

// Helpers to render selected modification options (e.g., measurements) neatly
const _gcd = (a, b) => (b ? _gcd(b, a % b) : a)
const formatMixedFraction = (value, precision = 16) => {
  if (value == null || isNaN(value)) return ''
  const sign = value < 0 ? '-' : ''
  let v = Math.abs(Number(value))
  let whole = Math.floor(v)
  let frac = v - whole
  let num = Math.round(frac * precision)
  if (num === precision) {
    whole += 1
    num = 0
  }
  if (num === 0) return `${sign}${whole}`
  const g = _gcd(num, precision)
  const n = num / g
  const d = precision / g
  return `${sign}${whole ? whole + ' ' : ''}${n}/${d}`
}

const keyToLabel = (key) => {
  if (!key) return ''
  return String(key)
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
}

const mapSide = (s) => {
  switch (s) {
    case 'L':
      return 'Left'
    case 'R':
      return 'Right'
    case 'B':
      return 'Both'
    default:
      return s
  }
}

const buildSelectedOptionsText = (selectedOptions) => {
  if (!selectedOptions || typeof selectedOptions !== 'object') return ''
  const parts = []
  const numericEntries = Object.entries(selectedOptions).filter(
    ([k, v]) => typeof v === 'number' && isFinite(v),
  )
  if (numericEntries.length === 1) {
    const [, v] = numericEntries[0]
    const m = formatMixedFraction(v)
    if (m) parts.push(`${m}\"`)
  } else if (numericEntries.length > 1) {
    numericEntries.forEach(([k, v]) => {
      const m = formatMixedFraction(v)
      if (m) parts.push(`${keyToLabel(k)} ${m}\"`)
    })
  }
  if (typeof selectedOptions.sideSelector === 'string' && selectedOptions.sideSelector) {
    parts.push(`Side: ${mapSide(selectedOptions.sideSelector)}`)
  }
  return parts.join(' • ')
}

const CatalogTable = ({
  catalogData,
  handleCatalogSelect,
  addOnTop,
  setAddOnTop,
  handleCopy,
  groupEnabled,
  setGroupEnabled,
  searchTerm,
  setSearchTerm,
  updateQty,
  handleOpenModificationModal,
  handleDelete,
  updateModification,
  setModificationsMap,
  modificationsMap,
  handleDeleteModification,
  formatPrice,
  selectVersion,
  isAssembled,
  selectedStyleData,
  toggleRowAssembly,
  updateHingeSide,
  updateExposedSide,
  // New optional prop: explicitly provided items to render
  items,
}) => {
  const displayItems = Array.isArray(items)
    ? items
    : Array.isArray(selectVersion?.items)
      ? selectVersion.items
      : []
  const { t } = useTranslation()
  const customization = useSelector((state) => state.customization)

  const headerBg = customization.headerBg || 'brand.500'
  const textColor = getContrastColor(headerBg)

  const headerBgFallback = useColorModeValue('brand.500', 'brand.400')
  const resolvedHeaderBg = customization.headerBg && customization.headerBg.trim() ? customization.headerBg : headerBgFallback
  const headerTextColor = customization.headerFontColor || getContrastColor(resolvedHeaderBg)

  // Dark mode colors
  const descriptionColor = useColorModeValue("gray.600", "gray.400")
  const textRed500 = useColorModeValue("red.500", "red.300")
  const textGreen500 = useColorModeValue("green.500", "green.300")
  const borderGray400 = useColorModeValue("gray.400", "gray.600")
  const rowBgEven = useColorModeValue("gray.50", "gray.700")
  const rowBgOdd = useColorModeValue("white", "gray.800")
  const rowBorder = useColorModeValue("gray.200", "gray.600")
  const modalBorderColor = useColorModeValue("gray.300", "gray.600")
  const modalBg = useColorModeValue("gray.50", "gray.800")
  const borderColor = useColorModeValue("gray.200", "gray.600")
  const labelColor = useColorModeValue("gray.600", "gray.400")
  const modBg = useColorModeValue("gray.100", "gray.700")
  const modTextColor = useColorModeValue("gray.800", "gray.200")
  const modLabelColor = useColorModeValue("gray.600", "gray.400")
  const modContainerBg = useColorModeValue("gray.50", "gray.800")
  const cellTextColor = useColorModeValue("gray.500", "gray.400")
  const dropdownBg = useColorModeValue("white", "gray.800")
  const dropdownHoverBg = useColorModeValue("gray.100", "gray.700")
  const textDanger = useColorModeValue("red.600", "red.400")
  const textMuted = useColorModeValue("gray.500", "gray.400")
  const modCategoryBg = useColorModeValue("gray.100", "gray.700")
  const modItemBg = useColorModeValue("gray.50", "gray.800")
  const modBorderColor = useColorModeValue("gray.300", "gray.600")
  const settingsIconColor = useColorModeValue("blue.500", "blue.300")
  const bgUnavailableRow = useColorModeValue("red.50", "red.900")
  const textUnavailable = useColorModeValue("red.600", "red.400")
  const bgValidationWarning = useColorModeValue("orange.50", "orange.900")
  const modalOverlayBg = "blackAlpha.600"
  const modalHeaderBorder = useColorModeValue('gray.200', 'gray.700')
  const modalCloseHoverBg = useColorModeValue('whiteAlpha.300', 'blackAlpha.300')
  const modalImageBg = useColorModeValue('white', 'gray.800')
  const modalSectionBg = useColorModeValue('gray.50', 'gray.700')
  const modalCardBg = useColorModeValue('white', 'gray.800')
  const modalTextColor = useColorModeValue('gray.700', 'gray.300')
  const modalEmptyBorder = useColorModeValue('gray.300', 'gray.600')
  const modalFooterBorder = useColorModeValue('gray.200', 'gray.700')

  const [partQuery, setPartQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [typesMeta, setTypesMeta] = useState([])
  const [showTypeModal, setShowTypeModal] = useState(false)
  const [selectedTypeInfo, setSelectedTypeInfo] = useState(null)
  const [subTypeRequirements, setSubTypeRequirements] = useState({
    requiresHinge: false,
    requiresExposed: false,
    itemRequirements: {},
  })
  const hoverTimerRef = useRef(null)
  const searchContainerRef = useRef(null)
  const api_url = import.meta.env.VITE_API_URL

  // Auth headers are handled by axiosInstance interceptors

  // When the selected style changes, clear the search box and suggestions
  useEffect(() => {
    setPartQuery('')
    setShowSuggestions(false)
  }, [selectedStyleData && selectedStyleData.id])

  // Handle click outside to close search suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSuggestions(false)
      }
    }

    if (showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showSuggestions])

  // Fetch types metadata once per manufacturer
  useEffect(() => {
    const manufacturerId = selectVersion?.manufacturerData?.id
    if (!manufacturerId) {
      setTypesMeta([])
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const res = await axiosInstance.get(`/api/manufacturers/${manufacturerId}/types-meta`)
        const data = Array.isArray(res?.data) ? res.data : []
        if (!cancelled) setTypesMeta(data)
      } catch (err) {
        console.error('Failed to fetch types metadata:', err)
        if (!cancelled) setTypesMeta([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [selectVersion?.manufacturerData?.id])

  // Check sub-type requirements for conditional column display
  useEffect(() => {
    const manufacturerId = selectVersion?.manufacturerData?.id
    if (!manufacturerId || !displayItems?.length) {
      setSubTypeRequirements({
        requiresHinge: false,
        requiresExposed: false,
        itemRequirements: {},
      })
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        const requirements = await checkSubTypeRequirements(displayItems, manufacturerId)
        if (!cancelled) {
          setSubTypeRequirements(requirements)
        }
      } catch (err) {
        console.error('Failed to check sub-type requirements:', err)
        if (!cancelled) {
          setSubTypeRequirements({
            requiresHinge: false,
            requiresExposed: false,
            itemRequirements: {},
          })
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [selectVersion?.manufacturerData?.id, displayItems])

  // Map internal codes to localized short labels
  const codeToLabel = (code) => {
    switch (code) {
      case 'L':
        return t('common.short.left', { defaultValue: 'L' })
      case 'R':
        return t('common.short.right', { defaultValue: 'R' })
      case 'B':
        return t('common.short.both', { defaultValue: 'B' })
      default:
        return code
    }
  }

  const filteredOptions = useMemo(() => {
    // Restrict options strictly to the currently selected style (no debug logging)
    const byStyle = Array.isArray(catalogData)
      ? catalogData.filter((item) => item?.style === selectedStyleData?.style)
      : []
    const q = (partQuery || '').toLowerCase().trim()
    if (!q) return []
    return byStyle
      .filter(
        (item) =>
          (item.code && String(item.code).toLowerCase().includes(q)) ||
          (item.description && String(item.description).toLowerCase().includes(q)),
      )
      .slice(0, 20)
  }, [catalogData, selectedStyleData?.style, partQuery])

  // Build quick map for type metadata
  const typeMap = useMemo(() => {
    const m = new Map()
    ;(typesMeta || []).forEach((t) => {
      if (t?.type) m.set(String(t.type), t)
    })
    return m
  }, [typesMeta])

  // Helper to check if a type has meaningful metadata (image or description)
  const hasTypeMetadata = (type) => {
    if (!type) return false
    const meta = typeMap.get(String(type))
    return meta && (meta.image || (meta.longDescription || meta.description || '').trim())
  }

  // Helper to open type modal for a specific type
  const openTypeModal = (type) => {
    const meta = typeMap.get(String(type))
    if (meta) {
      setSelectedTypeInfo(meta)
      setShowTypeModal(true)
    }
  }
  const pickItem = (item) => {
    if (!item) return
    // Reuse existing handler contract
    handleCatalogSelect({ target: { value: `${item.code} -- ${item.description}` } })
    setPartQuery('')
    setShowSuggestions(false)
  }
  return (
    <Box mt={5} mb={5}>
      <Flex flexWrap="wrap" gap={3} align="center" justify="space-between" mb={4}>
        <Box
          position="relative"
          flex="1"
          minW={{ base: "100%", md: "200px" }}
          maxW={{ base: "100%", md: "600px" }}
          w={{ base: "100%", md: "auto" }}
          ref={searchContainerRef}
        >
          <InputGroup>
            <Input
              placeholder={t('proposalUI.enterPartCode')}
              value={partQuery}
              onChange={(e) => {
                setPartQuery(e.target.value)
                setShowSuggestions(true)
              }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && filteredOptions[0]) {
                  e.preventDefault()
                  pickItem(filteredOptions[0])
                }
              }}
            />
          </InputGroup>
          {showSuggestions && filteredOptions.length > 0 && (
            <Box
              position="absolute"
              top="100%"
              left={0}
              right={0}
              mt={1}
              bg={dropdownBg}
              border="1px solid"
              borderColor={useColorModeValue('gray.200', 'gray.600')}
              borderRadius="md"
              boxShadow="xl"
              zIndex={1500}
              w="full"
              maxH={{ base: "400px", md: "320px" }}
              overflowY="auto"
              css={{
                '&::-webkit-scrollbar': {
                  width: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  background: 'transparent',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: useColorModeValue('#CBD5E0', '#4A5568'),
                  borderRadius: '4px',
                },
              }}
            >
              {filteredOptions.map((item, index) => (
                <Flex
                  key={item.id}
                  direction="column"
                  px={{ base: 3, md: 2 }}
                  py={{ base: 3, md: 2 }}
                  cursor="pointer"
                  _hover={{ bg: useColorModeValue('blue.50', 'gray.700') }}
                  _active={{ bg: useColorModeValue('blue.100', 'gray.600') }}
                  borderBottom={index < filteredOptions.length - 1 ? "1px solid" : "none"}
                  borderColor={useColorModeValue('gray.200', 'gray.600')}
                  onClick={() => pickItem(item)}
                  minH={{ base: "56px", md: "auto" }}
                  justify="center"
                >
                  <Flex align="center" justify="space-between" w="full">
                    <Box flex="1" pr={2}>
                      <Text 
                        fontWeight="bold" 
                        fontSize={{ base: "md", md: "sm" }}
                        color={useColorModeValue('blue.600', 'blue.300')}
                        mb={0.5}
                      >
                        {item.code}
                      </Text>
                      <Text 
                        fontSize={{ base: "sm", md: "xs" }}
                        color={useColorModeValue('gray.700', 'gray.300')}
                        noOfLines={2}
                      >
                        {item.description}
                      </Text>
                    </Box>
                    {hasTypeMetadata(item.type) && (
                      <Button
                        size="xs"
                        variant="outline"
                        colorScheme="blue"
                        fontSize={{ base: "xs", md: "2xs" }}
                        px={{ base: 2, md: 1.5 }}
                        py={{ base: 1, md: 0.5 }}
                        minH={{ base: "32px", md: "24px" }}
                        h="auto"
                        lineHeight="1.2"
                        flexShrink={0}
                        onClick={(e) => {
                          e.stopPropagation()
                          openTypeModal(item.type)
                        }}
                        title={`View ${item.type} specifications`}
                      >
                        Specs
                      </Button>
                    )}
                  </Flex>
                </Flex>
              ))}
            </Box>
          )}
        </Box>

        <Flex flexWrap="wrap" align="center" gap={3} flexShrink={0}>
          <Checkbox
            label={<Text fontSize="md">{t('proposalUI.addOnTop')}</Text>}
            checked={addOnTop}
            onChange={(e) => setAddOnTop(e.target.checked)}
            sx={{ transform: 'scale(1.1)' }}
          />

          <Flex align="center" gap={2}>
            <Icon as={Copy} cursor="pointer" onClick={handleCopy} />
            <Text fontWeight="bold" fontSize="md">{t('proposalUI.copy')}</Text>
          </Flex>

          <Checkbox
            label={<Text fontSize="md">{t('proposalUI.group')}</Text>}
            checked={groupEnabled}
            onChange={(e) => setGroupEnabled(e.target.checked)}
            sx={{ transform: 'scale(1.1)' }}
          />
        </Flex>

        <Box
          flexShrink={0}
          minW={{ base: "100%", md: "200px" }}
          maxW={{ base: "100%", md: "240px" }}
          w={{ base: "100%", md: "full" }}
        >
          <InputGroup>
            <Input
              placeholder={t('proposalUI.findInCart')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </Box>

        {/* Close controls wrapper */}
      </Flex>

      {/* Detailed type info modal */}
      <Modal
        isOpen={showTypeModal}
        onClose={() => setShowTypeModal(false)}
        size={{ base: 'full', md: 'xl', lg: '2xl' }}
        scrollBehavior="inside"
        isCentered
      >
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
        <ModalContent
          borderRadius={{ base: '0', md: '16px' }}
          overflow="hidden"
          boxShadow="2xl"
          maxH={{ base: '100vh', md: '90vh' }}
        >
          <ModalHeader
            bg={resolvedHeaderBg}
            color={headerTextColor}
            py={4}
            px={6}
            borderBottom="1px solid"
            borderBottomColor={modalHeaderBorder}
          >
            <Flex align="center" gap={3}>
              <Badge
                colorScheme="blue"
                fontSize="sm"
                px={3}
                py={1}
                borderRadius="full"
                textTransform="uppercase"
                letterSpacing="wide"
              >
                Type
              </Badge>
              <Text fontSize="xl" fontWeight="bold">
                {selectedTypeInfo?.type || 'Type Specifications'}
              </Text>
            </Flex>
          </ModalHeader>
          <ModalCloseButton
            aria-label={t('common.ariaLabels.closeModal', 'Close modal')}
            color={headerTextColor}
            size="lg"
            top={3}
            right={4}
            _hover={{ bg: modalCloseHoverBg }}
          />
          <ModalBody p={{ base: 4, md: 6 }}>
          {selectedTypeInfo ? (
            <Flex flexDir={{ base: "column", md: "row" }} gap={6}>
              {/* Image Section */}
              <Box
                flex="1"
                minW={{ base: "full", md: "280px" }}
                maxW={{ base: "full", md: "400px" }}
              >
                <Box
                  position="relative"
                  border="2px solid"
                  borderColor={modalBorderColor}
                  borderRadius="xl"
                  p={4}
                  bg={modalImageBg}
                  boxShadow="lg"
                  overflow="hidden"
                >
                  <Image
                    src={
                      selectedTypeInfo.image
                        ? `${api_url}/uploads/types/${selectedTypeInfo.image}`
                        : '/images/nologo.png'
                    }
                    alt={selectedTypeInfo.type}
                    w="100%"
                    h="auto"
                    minH="200px"
                    maxH={{ base: "300px", md: "400px" }}
                    objectFit="contain"
                    bg="white"
                    borderRadius="lg"
                    onError={(e) => {
                      if (selectedTypeInfo.image && !e.target.dataset.fallbackTried) {
                        e.target.dataset.fallbackTried = '1'
                        e.target.src = `${api_url}/uploads/manufacturer_catalogs/${selectedTypeInfo.image}`
                      } else {
                        e.target.src = '/images/nologo.png'
                      }
                    }}
                  />
                </Box>
              </Box>

              {/* Details Section */}
              <Box
                flex="1"
                minW={0}
              >
                <VStack align="stretch" spacing={4}>
                  {/* Type Badge and Title */}
                  <Box
                    p={4}
                    bg={modalSectionBg}
                    borderRadius="lg"
                    border="1px solid"
                    borderColor={modalBorderColor}
                  >
                    <Text fontSize="2xl" fontWeight="bold" color={resolvedHeaderBg}>
                      {selectedTypeInfo.type}
                    </Text>
                  </Box>

                  {/* Metadata Grid */}
                  {(selectedTypeInfo.code || selectedTypeInfo.name || selectedTypeInfo.shortName) && (
                    <Box
                      p={4}
                      bg={modalCardBg}
                      borderRadius="lg"
                      border="1px solid"
                      borderColor={modalBorderColor}
                    >
                      <VStack align="stretch" spacing={3}>
                        {selectedTypeInfo.code && (
                          <Flex justify="space-between" align="center">
                            <Text color={labelColor} fontWeight="600" fontSize="sm">
                              {t('catalog.labels.code', 'Code')}
                            </Text>
                            <Text fontWeight="bold" fontSize="md">
                              {selectedTypeInfo.code}
                            </Text>
                          </Flex>
                        )}
                        {selectedTypeInfo.name && (
                          <Flex justify="space-between" align="center" pt={2} borderTop="1px solid" borderTopColor={borderColor}>
                            <Text color={labelColor} fontWeight="600" fontSize="sm">
                              {t('catalog.labels.name', 'Name')}
                            </Text>
                            <Text fontWeight="bold" fontSize="md">
                              {selectedTypeInfo.name}
                            </Text>
                          </Flex>
                        )}
                        {selectedTypeInfo.shortName && (
                          <Flex justify="space-between" align="center" pt={2} borderTop="1px solid" borderTopColor={borderColor}>
                            <Text color={labelColor} fontWeight="600" fontSize="sm">
                              {t('catalog.labels.short', 'Short')}
                            </Text>
                            <Text fontWeight="bold" fontSize="md">
                              {selectedTypeInfo.shortName}
                            </Text>
                          </Flex>
                        )}
                      </VStack>
                    </Box>
                  )}

                  {/* Description */}
                  <Box
                    p={4}
                    bg={useColorModeValue('white', 'gray.800')}
                    borderRadius="lg"
                    border="1px solid"
                    borderColor={modalBorderColor}
                    flex="1"
                  >
                    <Text
                      color={labelColor}
                      fontWeight="600"
                      fontSize="sm"
                      mb={3}
                      textTransform="uppercase"
                      letterSpacing="wide"
                    >
                      {t('catalog.labels.description', 'Description')}
                    </Text>
                    <Text
                      whiteSpace="pre-wrap"
                      lineHeight="1.7"
                      fontSize="sm"
                      color={modalTextColor}
                    >
                      {selectedTypeInfo.longDescription ||
                        selectedTypeInfo.description ||
                        t('No description available for this type.')}
                    </Text>
                  </Box>
                </VStack>
              </Box>
            </Flex>
          ) : (
            <Box
              color={labelColor}
              textAlign="center"
              p={8}
              border="2px dashed"
              borderColor={modalBorderColor}
              borderRadius="xl"
              bg={modalBg}
            >
              <Text fontSize="lg" fontWeight="medium">
                {t('No type information available.')}
              </Text>
            </Box>
          )}
          </ModalBody>
          <ModalFooter
            borderTop="1px solid"
            borderTopColor={modalFooterBorder}
            px={6}
            py={4}
          >
            <Button
              colorScheme="blue"
              onClick={() => setShowTypeModal(false)}
              size={{ base: "lg", md: "md" }}
              w={{ base: "full", md: "auto" }}
              minW="140px"
              borderRadius="lg"
              fontWeight="600"
            >
              {t('common.close', 'Close')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Desktop Table View */}
      <Box display={{ base: 'none', lg: 'block' }}>
        <TableCard>
          <Table variant="simple" layout="auto" w="full">
          <Thead>
            <Tr>
              <Th>{t('proposalColumns.no')}</Th>
              <Th>{t('proposalColumns.qty')}</Th>
              <Th>{t('proposalColumns.item')}</Th>
              {subTypeRequirements.requiresHinge && (
                <Th
                  bg="red.50"
                  color="red.600"
                  fontWeight="bold"
                >
                  {t('proposalColumns.hingeSide')}
                </Th>
              )}
              {subTypeRequirements.requiresExposed && (
                <Th
                  bg="red.50"
                  color="red.600"
                  fontWeight="bold"
                >
                  {t('proposalColumns.exposedSide')}
                </Th>
              )}
              <Th textAlign="right">{t('proposalColumns.price')}</Th>
              <Th textAlign="right">{t('proposalColumns.assemblyCost')}</Th>
              <Th textAlign="right">
                {t('proposalColumns.modifications', { defaultValue: 'Modifications' })}
              </Th>
              <Th textAlign="right">{t('proposalColumns.total')}</Th>
              <Th>{t('proposals.headers.actions')}</Th>
            </Tr>
          </Thead>

          <Tbody>
            {displayItems.map((item, idx) => {
              // Use global assembled toggle only; assembly fee applies automatically when on
              const assembled = !!isAssembled
              const qty = Number(item.qty || 1)
              const isUnavailable = !!item.unavailable
              const unitAssembly = assembled ? Number(item.assemblyFee || 0) : 0
              const assemblyFee = isUnavailable ? 0 : unitAssembly * qty
              const modsTotal = Array.isArray(item.modifications)
                ? item.modifications.reduce(
                    (s, m) => s + Number(m.price || 0) * Number(m.qty || 1),
                    0,
                  )
                : 0
              const total =
                (isUnavailable ? 0 : Number(item.price || 0) * qty) + assemblyFee + modsTotal

              return (
                <React.Fragment key={idx}>
                  <Tr
                    bg={idx % 2 === 0 ? rowBgEven : rowBgOdd}
                    borderBottom="2px solid"
                    borderBottomColor={rowBorder}
                    borderTop={idx === 0 ? "2px solid" : "none"}
                    borderTopColor={idx === 0 ? rowBorder : "transparent"}
                  >
                    <Td w="56px">
                      <Flex
                        display="inline-flex"
                        align="center"
                        justify="center"
                        minW="36px"
                        h="28px"
                        px="10px"
                        borderRadius="full"
                        bg={headerBg}
                        color={textColor}
                        fontWeight={700}
                        fontSize="16px"
                        letterSpacing="0.2px"
                        boxShadow="sm"
                        title={`Row ${idx + 1}`}
                      >
                        {idx + 1}
                      </Flex>
                    </Td>
                    <Td>
                      <Input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(e) => updateQty(idx, parseInt(e.target.value))}
                        w="70px"
                        textAlign="center"
                      />
                    </Td>

                    <Td
                      color={isUnavailable ? textUnavailable : undefined}
                      textDecoration={isUnavailable ? 'line-through' : undefined}
                    >
                      <Flex
                        align="center"
                        gap={2}
                        flexWrap="wrap"
                        minW={0}
                      >
                        <Text
                          whiteSpace="nowrap"
                          overflow="hidden"
                          textOverflow="ellipsis"
                          maxW="320px"
                        >
                          <Text as="span" fontWeight="bold">{item.code}</Text>
                          {item.description ? (
                            <Text as="span" color={descriptionColor} ml={1}>— {item.description}</Text>
                          ) : null}
                        </Text>
                        {(() => {
                          try {
                            const attachmentsCount = Array.isArray(item.modifications)
                              ? item.modifications.reduce(
                                  (n, m) =>
                                    n + (Array.isArray(m.attachments) ? m.attachments.length : 0),
                                  0,
                                )
                              : 0
                            return attachmentsCount > 0 ? (
                              <Badge
                                colorScheme="blue"
                                title={`${attachmentsCount} attachment${attachmentsCount > 1 ? 's' : ''}`}
                              >
                                {attachmentsCount}
                              </Badge>
                            ) : null
                          } catch (_) {
                            return null
                          }
                        })()}
                        {hasTypeMetadata(item.type) && (
                          <Button
                            size="xs"
                            variant="solid"
                            colorScheme="blue"
                            fontSize="xs"
                            px={3}
                            h="24px"
                            onClick={() => openTypeModal(item.type)}
                            title={`View ${item.type} specifications`}
                            fontWeight="600"
                            borderRadius="md"
                            _hover={{ transform: 'translateY(-1px)', boxShadow: 'md' }}
                            transition="all 0.2s"
                          >
                            Specs
                          </Button>
                        )}
                      </Flex>
                    </Td>

                    {subTypeRequirements.requiresHinge && (
                      <Td
                        bg={
                          subTypeRequirements.itemRequirements[idx]?.requiresHinge &&
                          (!item.hingeSide || item.hingeSide === '-')
                            ? bgValidationWarning
                            : 'transparent'
                        }
                        px={2}
                        py={2}
                      >
                        {assembled ? (
                          <VStack align="stretch" spacing={1}>
                            {subTypeRequirements.itemRequirements[idx]?.requiresHinge &&
                              (!item.hingeSide || item.hingeSide === '-') && (
                                <Text
                                  color={textRed500}
                                  fontSize="2xs"
                                  fontWeight="medium"
                                  lineHeight="1.2"
                                  mb={1}
                                >
                                  {t('validation.selectHingeSide', {
                                    defaultValue: 'Select hinge side',
                                  })}
                                </Text>
                              )}
                            <HStack spacing={1} flexWrap="wrap">
                              {hingeOptions.map((opt) => (
                                <Badge
                                  key={opt}
                                  px={2}
                                  py={1}
                                  borderRadius="md"
                                  fontSize="xs"
                                  cursor="pointer"
                                  variant={item.hingeSide === opt ? 'solid' : 'outline'}
                                  colorScheme={item.hingeSide === opt ? 'brand' : 'gray'}
                                  onClick={() => updateHingeSide(idx, opt)}
                                  _hover={{ opacity: 0.8 }}
                                >
                                  {codeToLabel(opt)}
                                </Badge>
                              ))}
                            </HStack>
                          </VStack>
                        ) : (
                          t('common.na')
                        )}
                      </Td>
                    )}

                    {subTypeRequirements.requiresExposed && (
                      <Td
                        px={2}
                        py={2}
                        bg={
                          subTypeRequirements.itemRequirements[idx]?.requiresExposed &&
                          (!item.exposedSide || item.exposedSide === '-')
                            ? bgValidationWarning
                            : 'transparent'
                        }
                      >
                        {assembled ? (
                          <VStack align="stretch" spacing={1}>
                            {subTypeRequirements.itemRequirements[idx]?.requiresExposed &&
                              (!item.exposedSide || item.exposedSide === '-') && (
                                <Text
                                  color={textRed500}
                                  fontSize="2xs"
                                  fontWeight="medium"
                                  lineHeight="1.2"
                                  mb={1}
                                >
                                  {t('validation.selectExposedSide', {
                                    defaultValue: 'Select exposed side',
                                  })}
                                </Text>
                              )}
                            <HStack spacing={1} flexWrap="wrap">
                              {exposedOptions.map((opt) => (
                                <Badge
                                  key={opt}
                                  px={2}
                                  py={1}
                                  borderRadius="md"
                                  fontSize="xs"
                                  cursor="pointer"
                                  variant={item.exposedSide === opt ? 'solid' : 'outline'}
                                  colorScheme={item.exposedSide === opt ? 'brand' : 'gray'}
                                  onClick={() => updateExposedSide(idx, opt)}
                                  _hover={{ opacity: 0.8 }}
                                >
                                  {codeToLabel(opt)}
                                </Badge>
                              ))}
                            </HStack>
                          </VStack>
                        ) : (
                          t('common.na')
                        )}
                      </Td>
                    )}

                    <Td
                      textAlign="right"
                      color={isUnavailable ? textUnavailable : undefined}
                      textDecoration={isUnavailable ? 'line-through' : undefined}
                    >
                      {isUnavailable ? formatPrice(0) : formatPrice(item.price)}
                    </Td>

                    <Td textAlign="right">
                      {assembled ? (
                        <Text as="span">{formatPrice(assemblyFee)}</Text>
                      ) : (
                        <Text as="span" color={textMuted}>{formatPrice(0)}</Text>
                      )}
                    </Td>

                    <Td textAlign="right">{formatPrice(modsTotal)}</Td>

                    <Td
                      textAlign="right"
                      color={isUnavailable ? textUnavailable : undefined}
                      textDecoration={isUnavailable ? 'line-through' : undefined}
                    >
                      {formatPrice(total)}
                    </Td>

                    <Td>
                      <Flex align="center" gap={{ base: 3, md: 4 }}>
                        <Icon
                          as={Settings}
                          cursor="pointer"
                          color="black"
                          boxSize={{ base: 6, md: 5 }}
                          onClick={() => handleOpenModificationModal(idx, item.id)}
                          _hover={{ transform: 'scale(1.1)' }}
                        />
                        <Icon
                          as={Trash}
                          cursor="pointer"
                          color={textRed500}
                          boxSize={{ base: 6, md: 5 }}
                          onClick={() => handleDelete(idx)}
                          _hover={{ transform: 'scale(1.1)' }}
                        />
                      </Flex>
                    </Td>
                  </Tr>
                  {Array.isArray(item.modifications) &&
                    item.modifications.length > 0 &&
                    (() => {
                      const groups = item.modifications.reduce((acc, m) => {
                        const key = m.categoryName || 'Other'
                        acc[key] = acc[key] || []
                        acc[key].push(m)
                        return acc
                      }, {})
                      const groupKeys = Object.keys(groups)
                      return (
                        <>
                          <Tr>
                            <Td
                              colSpan={10}
                              fontSize="sm"
                              bg={headerBg}
                              color={textColor}
                              p="8px 16px"
                              pl="56px"
                              borderTop={`2px solid ${headerBg}`}
                              borderLeft={`6px solid ${headerBg}`}
                              borderTopLeftRadius="6px"
                              borderTopRightRadius="6px"
                              boxShadow="inset 0 0 0 1px var(--chakra-colors-blackAlpha-50)"
                            >
                              <Icon
                                as={Wrench}
                                mr={2}
                                boxSize={3.5}
                                color={textColor}
                              />
                              <Text as="span" fontWeight="bold">{t('proposalDoc.modifications')}</Text>
                            </Td>
                          </Tr>
                          {groupKeys.map((gkey, gi) => (
                            <React.Fragment key={`modgrp-${idx}-${gkey}`}>
                              <Tr
                                bg={modCategoryBg}
                              >
                                <Td
                                  colSpan={10}
                                  fontWeight="semibold"
                                  color={descriptionColor}
                                  pl="72px"
                                  fontSize="14px"
                                  borderLeft={`6px solid ${headerBg}`}
                                  borderBottom="1px solid"
                                  borderBottomColor="gray.300"
                                >
                                  📂 {gkey}
                                </Td>
                              </Tr>
                              {groups[gkey].map((mod, modIdx) => {
                                const isLastRow =
                                  gi === groupKeys.length - 1 && modIdx === groups[gkey].length - 1
                                return (
                                  <React.Fragment key={`mod-${idx}-${gkey}-${modIdx}`}>
                                    <Tr
                                      bg={modItemBg}
                                      borderLeft={`6px solid ${headerBg}`}
                                      fontSize="14px"
                                      borderBottom={isLastRow ? `2px solid ${headerBg}` : `1px solid`}
                                      borderBottomColor={isLastRow ? undefined : modBorderColor}
                                    >
                                      <Td
                                        pl="88px"
                                        color={cellTextColor}
                                      >
                                        ↳
                                      </Td>
                                      <Td fontWeight="500">
                                        {mod.qty}
                                      </Td>
                                      <Td colSpan={3} pl={2}>
                                        <Flex align="center" flexWrap="wrap" gap={2}>
                                          <Badge
                                            display="inline-flex"
                                            alignItems="center"
                                            px={2.5}
                                            py={0.5}
                                            borderRadius="full"
                                            bg={modBg}
                                            border={`1px solid ${headerBg}`}
                                            color={modTextColor}
                                            fontWeight="600"
                                            lineHeight={1.2}
                                            boxShadow="sm"
                                          >
                                            {mod.name || t('proposalUI.mod.unnamed')}
                                          </Badge>
                                          {(() => {
                                            const details = buildSelectedOptionsText(
                                              mod?.selectedOptions,
                                            )
                                            return details ? (
                                              <Text
                                                as="span"
                                                color={modLabelColor}
                                                fontSize="14px"
                                                px={2}
                                                py={0.5}
                                                borderRadius="md"
                                                bg={modContainerBg}
                                                border="1px dashed"
                                                borderColor={borderGray400}
                                              >
                                                {details}
                                              </Text>
                                            ) : null
                                          })()}
                                        </Flex>
                                        {Array.isArray(mod.attachments) &&
                                          mod.attachments.length > 0 && (
                                            <Flex mt={1} flexWrap="wrap" gap={1}>
                                              {mod.attachments.slice(0, 3).map((att, ai) => (
                                                <Badge
                                                  key={ai}
                                                  as="a"
                                                  href={att.url}
                                                  target="_blank"
                                                  rel="noreferrer"
                                                  colorScheme="blue"
                                                  textDecoration="none"
                                                  title={att.name || 'Attachment'}
                                                  display="inline-flex"
                                                  alignItems="center"
                                                  gap={1.5}
                                                >
                                                  {String(att.mimeType || '').startsWith(
                                                    'image/',
                                                  ) ? (
                                                    <Image
                                                      src={att.url}
                                                      alt={att.name || 'img'}
                                                      w="18px"
                                                      h="18px"
                                                      objectFit="cover"
                                                      borderRadius="2px"
                                                    />
                                                  ) : null}
                                                  <Text
                                                    as="span"
                                                    maxW="120px"
                                                    overflow="hidden"
                                                    textOverflow="ellipsis"
                                                    whiteSpace="nowrap"
                                                  >
                                                    {att.name || 'File'}
                                                  </Text>
                                                </Badge>
                                              ))}
                                              {mod.attachments.length > 3 && (
                                                <Badge colorScheme="gray">
                                                  +{mod.attachments.length - 3}
                                                </Badge>
                                              )}
                                            </Flex>
                                          )}
                                      </Td>
                                      <Td textAlign="right" fontWeight="medium" color={textGreen500}>
                                        {formatPrice(mod.price || 0)}
                                      </Td>
                                      <Td textAlign="right" color={cellTextColor}>
                                        -
                                      </Td>
                                      <Td textAlign="right">
                                        {/* Modifications column (per-item summary) not applicable on sub-rows */}
                                      </Td>
                                      <Td textAlign="right" fontWeight="semibold" color={textGreen500}>
                                        {formatPrice((mod.price || 0) * (mod.qty || 1))}
                                      </Td>
                                      <Td textAlign="center">
                                        <Icon
                                          as={Trash}
                                          cursor="pointer"
                                          color={textRed500}
                                          boxSize={{ base: 5, md: 4 }}
                                          onClick={() => handleDeleteModification(idx, modIdx)}
                                          title="Remove modification"
                                          _hover={{ transform: 'scale(1.1)' }}
                                        />
                                      </Td>
                                    </Tr>
                                    {isLastRow && (
                                      <Tr>
                                        <Td colSpan={10} p={0}>
                                          <Box
                                            h="10px"
                                            borderBottom="1px dashed"
                                            borderBottomColor={borderGray400}
                                          />
                                        </Td>
                                      </Tr>
                                    )}
                                  </React.Fragment>
                                )
                              })}
                            </React.Fragment>
                          ))}
                        </>
                      )
                    })()}
                </React.Fragment>
              )
            })}
          </Tbody>
        </Table>
        </TableCard>
      </Box>

      {/* Mobile Card View */}
      <Box display={{ base: 'block', lg: 'none' }}>
      <VStack spacing={3} align="stretch">
        {displayItems.map((item, idx) => {
          const assembled = !!isAssembled
          const qty = Number(item.qty || 1)
          const isUnavailable = !!item.unavailable
          const unitAssembly = assembled ? Number(item.assemblyFee || 0) : 0
          const assemblyFee = isUnavailable ? 0 : unitAssembly * qty
          const modsTotal = Array.isArray(item.modifications)
            ? item.modifications.reduce((s, m) => s + Number(m.price || 0) * Number(m.qty || 1), 0)
            : 0
          const total =
            (isUnavailable ? 0 : Number(item.price || 0) * qty) + assemblyFee + modsTotal

          return (
            <React.Fragment key={`mobile-${idx}`}>
              <Box
                borderWidth="1px"
                borderColor={rowBorder}
                borderRadius="lg"
                bg={idx % 2 === 0 ? rowBgEven : rowBgOdd}
                mb={2}
                p={3}
                boxShadow="sm"
                _hover={{ boxShadow: "md" }}
                transition="box-shadow 0.2s"
              >
                {/* Header Row: Number + Actions */}
                <Flex justify="space-between" align="center" mb={2}>
                  <Flex
                    align="center"
                    justify="center"
                    w="28px"
                    h="28px"
                    borderRadius="md"
                    bg={headerBg}
                    color={textColor}
                    fontWeight={700}
                    fontSize="14px"
                    boxShadow="sm"
                  >
                    {idx + 1}
                  </Flex>
                  <HStack spacing={2}>
                    <Icon as={Settings}
                      cursor="pointer"
                      color={settingsIconColor}
                      boxSize={{ base: 6, md: 5 }}
                      onClick={() => handleOpenModificationModal(idx, item.id)}
                      _hover={{ transform: 'scale(1.1)' }}
                      transition="transform 0.2s"
                    />
                    <Icon as={Trash}
                      cursor="pointer"
                      color={textDanger}
                      boxSize={{ base: 6, md: 5 }}
                      onClick={() => handleDelete(idx)}
                      _hover={{ transform: 'scale(1.1)' }}
                      transition="transform 0.2s"
                    />
                  </HStack>
                </Flex>

                {/* Item Code + Description */}
                <Box mb={2}>
                  <Flex align="center" gap={2} minW={0}>
                    <Text
                      fontWeight="700"
                      fontSize="md"
                      color={isUnavailable ? textUnavailable : undefined}
                      textDecoration={isUnavailable ? 'line-through' : undefined}
                    >
                      {item.code}
                    </Text>
                    {hasTypeMetadata(item.type) && (
                      <Button
                        size="xs"
                        variant="solid"
                        colorScheme="blue"
                        fontSize="xs"
                        h="20px"
                        px={2}
                        onClick={() => openTypeModal(item.type)}
                        title={`View ${item.type} specifications`}
                        fontWeight="600"
                        borderRadius="md"
                        _hover={{ transform: 'translateY(-1px)', boxShadow: 'sm' }}
                        transition="all 0.2s"
                      >
                        Specs
                      </Button>
                    )}
                  </Flex>
                  {item.description && (
                    <Text
                      color={descriptionColor}
                      fontSize="xs"
                      mt={0.5}
                      noOfLines={2}
                    >
                      {item.description}
                    </Text>
                  )}
                </Box>

                {/* Qty and Price Row - Compact Grid */}
                <Flex gap={3} mb={2}>
                  <Flex align="center" gap={2} flex="1">
                    <Text fontWeight="600" color={labelColor} fontSize="xs">{t('proposalColumns.qty')}</Text>
                    <Input
                      type="number"
                      min="1"
                      value={item.qty}
                      onChange={(e) => updateQty(idx, parseInt(e.target.value))}
                      w="60px"
                      size="xs"
                      h="28px"
                    />
                  </Flex>
                  <Flex align="center" gap={2}>
                    <Text fontWeight="600" color={labelColor} fontSize="xs">{t('proposalColumns.price')}</Text>
                    <Text
                      color={isUnavailable ? textUnavailable : undefined}
                      textDecoration={isUnavailable ? 'line-through' : undefined}
                      fontSize="sm"
                      fontWeight="600"
                    >
                      {isUnavailable ? formatPrice(0) : formatPrice(item.price)}
                    </Text>
                  </Flex>
                </Flex>

                {assembled && (
                  <>
                    {subTypeRequirements.requiresHinge && (
                      <Box
                        bg={
                          subTypeRequirements.itemRequirements[idx]?.requiresHinge &&
                          (!item.hingeSide || item.hingeSide === '-')
                            ? bgValidationWarning
                            : 'transparent'
                        }
                        p={2}
                        borderRadius="md"
                        mb={1.5}
                      >
                        <Text fontWeight="600" color={labelColor} fontSize="xs" mb={1.5}>{t('proposalColumns.hingeSide')}</Text>
                        {subTypeRequirements.itemRequirements[idx]?.requiresHinge &&
                          (!item.hingeSide || item.hingeSide === '-') && (
                            <Text
                              color={textRed500}
                              mb={1.5}
                              fontSize="xs"
                              fontWeight="bold"
                            >
                              {t('validation.selectHingeSide', {
                                defaultValue: 'Select hinge side',
                              })}
                            </Text>
                          )}
                        <Flex gap={1.5}>
                          {hingeOptions.map((opt) => (
                            <Button
                              key={opt}
                              size="xs"
                              h="28px"
                              px={3}
                              variant={item.hingeSide === opt ? 'solid' : 'outline'}
                              colorScheme={item.hingeSide === opt ? undefined : 'gray'}
                              bg={item.hingeSide === opt ? headerBg : undefined}
                              color={item.hingeSide === opt ? textColor : undefined}
                              borderColor={item.hingeSide === opt ? headerBg : undefined}
                              onClick={() => updateHingeSide(idx, opt)}
                            >
                              {codeToLabel(opt)}
                            </Button>
                          ))}
                        </Flex>
                      </Box>
                    )}

                    {subTypeRequirements.requiresExposed && (
                      <Box
                        bg={
                          subTypeRequirements.itemRequirements[idx]?.requiresExposed &&
                          (!item.exposedSide || item.exposedSide === '-')
                            ? bgValidationWarning
                            : 'transparent'
                        }
                        p={2}
                        borderRadius="md"
                        mb={1.5}
                      >
                        <Text fontWeight="600" color={labelColor} fontSize="xs" mb={1.5}>{t('proposalColumns.exposedSide')}</Text>
                        {subTypeRequirements.itemRequirements[idx]?.requiresExposed &&
                          (!item.exposedSide || item.exposedSide === '-') && (
                            <Text
                              color={textRed500}
                              mb={1.5}
                              fontSize="xs"
                              fontWeight="bold"
                            >
                              {t('validation.selectExposedSide', {
                                defaultValue: 'Select exposed finished side',
                              })}
                            </Text>
                          )}
                        <Flex gap={1.5} flexWrap="wrap">
                          {exposedOptions.map((opt) => (
                            <Button
                              key={opt}
                              size="xs"
                              h="28px"
                              px={3}
                              variant={item.exposedSide === opt ? 'solid' : 'outline'}
                              colorScheme={item.exposedSide === opt ? undefined : 'gray'}
                              bg={item.exposedSide === opt ? headerBg : undefined}
                              color={item.exposedSide === opt ? textColor : undefined}
                              borderColor={item.exposedSide === opt ? headerBg : undefined}
                              onClick={() => updateExposedSide(idx, opt)}
                            >
                              {codeToLabel(opt)}
                            </Button>
                          ))}
                        </Flex>
                      </Box>
                    )}

                    <Flex justify="space-between" align="center" mb={1.5}>
                      <Text fontWeight="600" color={labelColor} fontSize="xs">{t('proposalColumns.assemblyCost')}</Text>
                      <Text
                        color={isUnavailable ? textUnavailable : undefined}
                        textDecoration={isUnavailable ? 'line-through' : undefined}
                        fontSize="xs"
                        fontWeight="600"
                      >
                        {formatPrice(assemblyFee)}
                      </Text>
                    </Flex>
                  </>
                )}

                {/* Modifications summary on mobile */}
                <Flex justify="space-between" align="center" mb={2} py={1.5} borderTop="1px solid" borderColor={borderColor}>
                  <Text fontWeight="600" color={labelColor} fontSize="xs">
                    {t('proposalColumns.modifications', { defaultValue: 'Modifications' })}
                  </Text>
                  <Text fontSize="xs" fontWeight="600">{formatPrice(modsTotal)}</Text>
                </Flex>

                {/* Total */}
                <Flex
                  justify="space-between"
                  align="center"
                  pt={2}
                  borderTop="2px solid"
                  borderTopColor={headerBg}
                  color={isUnavailable ? textUnavailable : undefined}
                  textDecoration={isUnavailable ? 'line-through' : undefined}
                >
                  <Text fontWeight="bold" fontSize="sm">
                    {t('proposalColumns.total')}
                  </Text>
                  <Text fontWeight="bold" fontSize="md" color={headerBg}>
                    {formatPrice(total)}
                  </Text>
                </Flex>

              </Box>

              {/* Mobile Modification Cards - Compact */}
              {Array.isArray(item.modifications) &&
                item.modifications.length > 0 &&
                item.modifications.map((mod, modIdx) => (
                  <Box
                    key={`mobile-mod-${idx}-${modIdx}`}
                    bg={modBg}
                    borderWidth="1px"
                    borderColor={modBorderColor}
                    borderRadius="md"
                    p={2}
                    mt={1.5}
                    mb={2}
                    ml={6}
                    position="relative"
                    boxShadow="xs"
                  >
                    {/* Item indicator badge */}
                    <Flex
                      position="absolute"
                      top="8px"
                      left="-20px"
                      bg={headerBg}
                      color={textColor}
                      borderRadius="full"
                      w="20px"
                      h="20px"
                      align="center"
                      justify="center"
                      fontSize="10px"
                      fontWeight="bold"
                      border="2px solid"
                      borderColor={rowBgEven}
                      boxShadow="sm"
                    >
                      {idx + 1}
                    </Flex>

                    {/* Modification Header */}
                    <Flex justify="space-between" align="center" mb={1.5}>
                      <Text
                        fontSize="xs"
                        fontWeight="700"
                        color={modTextColor}
                        textTransform="uppercase"
                        letterSpacing="0.3px"
                      >
                        {t('proposalDoc.modifications')}
                      </Text>
                      <Icon
                        as={Trash}
                        cursor="pointer"
                        color={textDanger}
                        boxSize={4}
                        onClick={() => handleDeleteModification(idx, modIdx)}
                        _hover={{ transform: 'scale(1.1)' }}
                        transition="transform 0.2s"
                      />
                    </Flex>

                    {/* Modification Name + Details */}
                    <Text fontSize="sm" fontWeight="600" color={modTextColor} mb={1}>
                      {mod.name || t('proposalUI.mod.unnamed')}
                    </Text>

                    {(() => {
                      const details = buildSelectedOptionsText(mod?.selectedOptions)
                      return details ? (
                        <Text fontSize="xs" color={modLabelColor} mb={1.5}>
                          {details}
                        </Text>
                      ) : null
                    })()}

                    {/* Qty, Price, Total Row */}
                    <Flex justify="space-between" align="center" fontSize="xs">
                      <Flex gap={3}>
                        <Text color={modLabelColor}>
                          {t('common.qty', 'Qty')}: <Text as="span" fontWeight="600" color={modTextColor}>{mod.qty}</Text>
                        </Text>
                        <Text color={modLabelColor}>
                          {formatPrice(mod.price || 0)}
                        </Text>
                      </Flex>
                      <Text fontWeight="700" color={modTextColor}>
                        {formatPrice((mod.price || 0) * (mod.qty || 1))}
                      </Text>
                    </Flex>
                  </Box>
                ))}
            </React.Fragment>
          )
        })}
      </VStack>
      </Box>
    </Box>
  )
}

export default CatalogTable
