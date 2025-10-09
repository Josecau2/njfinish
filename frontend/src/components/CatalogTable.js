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
import useVirtualizedList from '../hooks/useVirtualizedList'

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
const DESKTOP_VIRTUALIZATION_THRESHOLD = 80
const DESKTOP_ROW_ESTIMATE = 340
const MOBILE_VIRTUALIZATION_THRESHOLD = 60
const MOBILE_CARD_ESTIMATE = 420



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

  const desktopVirtual = useVirtualizedList({
    itemCount: displayItems.length,
    estimateSize: DESKTOP_ROW_ESTIMATE,
    overscan: 6,
    enabled: displayItems.length > DESKTOP_VIRTUALIZATION_THRESHOLD,
  })
  const mobileVirtual = useVirtualizedList({
    itemCount: displayItems.length,
    estimateSize: MOBILE_CARD_ESTIMATE,
    overscan: 6,
    enabled: displayItems.length > MOBILE_VIRTUALIZATION_THRESHOLD,
  })

  const desktopStartIndex = desktopVirtual.enabled ? desktopVirtual.startIndex : 0
  const desktopEndIndex = desktopVirtual.enabled ? desktopVirtual.endIndex : displayItems.length
  const desktopItems = useMemo(
    () => displayItems.slice(desktopStartIndex, desktopEndIndex),
    [displayItems, desktopStartIndex, desktopEndIndex],
  )

  const mobileStartIndex = mobileVirtual.enabled ? mobileVirtual.startIndex : 0
  const mobileEndIndex = mobileVirtual.enabled ? mobileVirtual.endIndex : displayItems.length
  const mobileItems = useMemo(
    () => displayItems.slice(mobileStartIndex, mobileEndIndex),
    [displayItems, mobileStartIndex, mobileEndIndex],
  )

  const tableColumnCount = useMemo(
    () =>
      8 +
      (subTypeRequirements.requiresHinge ? 1 : 0) +
      (subTypeRequirements.requiresExposed ? 1 : 0),
    [subTypeRequirements.requiresHinge, subTypeRequirements.requiresExposed],
  )
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
              zIndex={1000}
              bg={dropdownBg}
              borderRadius="md"
              boxShadow="lg"
              mt={1}
              w="full"
              maxH="260px"
              overflowY="auto"
            >
              {filteredOptions.map((item) => (
                <Flex
                  key={item.id}
                  justify="space-between"
                  align="center"
                  p={1}
                  _hover={{ bg: dropdownHoverBg }}
                  cursor="pointer"
                >
                  <Button
                    variant="ghost"
                    textAlign="start"
                    flex="1"
                    whiteSpace="normal"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pickItem(item)}
                    px={3}
                    py={1}
                    fontWeight="normal"
                  >
                    <Text as="span" fontWeight="bold">{item.code}</Text> - {item.description}
                  </Button>
                  {hasTypeMetadata(item.type) && (
                    <Button
                      size="xs"
                      variant="outline"
                      colorScheme="blue"
                      ml={2}
                      fontSize="xs"
                      px={2}
                      py={0.5}
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
        size={{ base: 'full', md: 'lg', lg: 'xl' }}
        scrollBehavior="inside"
        isCentered
      >
        <ModalOverlay />
        <ModalContent borderRadius="12px">
          <ModalHeader bg={resolvedHeaderBg} color={headerTextColor}>
            <Text fontSize="lg" fontWeight="semibold">
              {selectedTypeInfo?.type || 'Type Specifications'}
            </Text>
          </ModalHeader>
          <ModalCloseButton aria-label={t('common.ariaLabels.closeModal', 'Close modal')} color={headerTextColor} />
          <ModalBody p={{ base: 3, md: 4 }}>
          {selectedTypeInfo ? (
            <Flex flexDir={{ base: "column", md: "row" }} gap={4}>
              <Box
                textAlign={{ base: "center", md: "start" }}
                border="1px solid"
                borderColor={modalBorderColor}
                borderRadius="md"
                p={3}
                bg={modalBg}
                w="full"
                maxW="520px"
                mx="auto"
              >
                <Image
                  src={
                    selectedTypeInfo.image
                      ? `${api_url}/uploads/types/${selectedTypeInfo.image}`
                      : '/images/nologo.png'
                  }
                  alt={selectedTypeInfo.type}
                  maxW="100%"
                  h="auto"
                  maxH="455px"
                  objectFit="contain"
                  bg="white"
                  borderRadius="6px"
                  border="1px solid"
                  borderColor={modalBorderColor}
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
              <Box flex="1" border="1px solid" borderColor={modalBorderColor} borderRadius="md" p={3} bg={modalBg} minW={0}>
                <Flex mb={3} align="center" gap={2}>
                  <Badge colorScheme="gray">{t('Type')}</Badge>
                  <Text as="strong" fontSize="lg">{selectedTypeInfo.type}</Text>
                </Flex>
                {selectedTypeInfo.code && (
                  <Box mb={2} borderBottom="1px solid" borderColor={borderColor} pb={2}>
                    <Text as="span" color={labelColor} fontWeight="medium">{t('catalog.labels.code', 'Code')}:</Text>{' '}
                    <Text as="span" fontWeight="bold">{selectedTypeInfo.code}</Text>
                  </Box>
                )}
                {selectedTypeInfo.name && (
                  <Box mb={2} borderBottom="1px solid" borderColor={borderColor} pb={2}>
                    <Text as="span" color={labelColor} fontWeight="medium">{t('catalog.labels.name', 'Name')}:</Text>{' '}
                    <Text as="span" fontWeight="bold">{selectedTypeInfo.name}</Text>
                  </Box>
                )}
                {selectedTypeInfo.shortName && (
                  <Box mb={3} borderBottom="1px solid" borderColor={borderColor} pb={2}>
                    <Text as="span" color={labelColor} fontWeight="medium">{t('catalog.labels.short', 'Short')}:</Text>{' '}
                    <Text as="span" fontWeight="bold">{selectedTypeInfo.shortName}</Text>
                  </Box>
                )}
                <Box mt={3}>
                  <Text as="strong" color={labelColor} display="block" mb={2}>{t('catalog.labels.description', 'Description')}:</Text>
                  <Text whiteSpace="pre-wrap" lineHeight="1.6" fontSize="md">
                    {selectedTypeInfo.longDescription ||
                      selectedTypeInfo.description ||
                      t('No description available for this type.')}
                  </Text>
                </Box>
              </Box>
              {/* close outer flex wrapper */}
            </Flex>
          ) : (
            <Box color={labelColor} textAlign="center" p={4} border="1px solid" borderColor={modalBorderColor} borderRadius="md" bg={modalBg}>
              {t('No type information available.')}
            </Box>
          )}
          </ModalBody>
          <ModalFooter>
            <Box display={{ base: "block", md: "none" }} mt={2} textAlign="center" w="full">
              <Button
                colorScheme="gray"
                size="lg"
                w="full"
                onClick={() => setShowTypeModal(false)}
                minW="140px"
                borderRadius="8px"
                fontWeight="500"
                boxShadow="sm"
              >
                Close
              </Button>
            </Box>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Desktop Table View */}
      <Box display={{ base: 'none', lg: 'block' }}>
        <TableCard
          containerProps={{
            ref: desktopVirtual.containerRef,
            maxH: desktopVirtual.enabled ? { base: "unset", lg: "70vh" } : undefined,
            overflowY: desktopVirtual.enabled ? "auto" : "visible",
          }}
        >
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
            {desktopVirtual.enabled && desktopVirtual.paddingTop > 0 && (
              <Tr>
                <Td colSpan={tableColumnCount} p={0} style={{ height: `${desktopVirtual.paddingTop}px` }} />
              </Tr>
            )}
            {desktopItems.map((item, virtualIdx) => {
              const rowIndex = desktopStartIndex + virtualIdx
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
                <React.Fragment key={`desktop-${rowIndex}`}>
                  <Tr
                    bg={rowIndex % 2 === 0 ? rowBgEven : rowBgOdd}
                    borderBottom="2px solid"
                    borderBottomColor={rowBorder}
                    borderTop={rowIndex === 0 ? "2px solid" : "none"}
                    borderTopColor={rowIndex === 0 ? rowBorder : "transparent"}
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
                        title={`Row ${rowIndex + 1}`}
                      >
                        {rowIndex + 1}
                      </Flex>
                    </Td>
                    <Td>
                      <Input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(e) => updateQty(rowIndex, parseInt(e.target.value))}
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
                            <Text as="span" color={descriptionColor} ml={1}>- {item.description}</Text>
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
                            variant="outline"
                            colorScheme="blue"
                            fontSize="xs"
                            px={2}
                            py={0.5}
                            onClick={() => openTypeModal(item.type)}
                            title={`View ${item.type} specifications`}
                          >
                            Specs
                          </Button>
                        )}
                      </Flex>
                    </Td>

                    {subTypeRequirements.requiresHinge && (
                      <Td
                        bg={
                          subTypeRequirements.itemRequirements[rowIndex]?.requiresHinge &&
                          (!item.hingeSide || item.hingeSide === '-')
                            ? bgValidationWarning
                            : 'transparent'
                        }
                        px={2}
                        py={2}
                      >
                        {assembled ? (
                          <VStack align="stretch" spacing={1}>
                            {subTypeRequirements.itemRequirements[rowIndex]?.requiresHinge &&
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
                                  onClick={() => updateHingeSide(rowIndex, opt)}
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
                          subTypeRequirements.itemRequirements[rowIndex]?.requiresExposed &&
                          (!item.exposedSide || item.exposedSide === '-')
                            ? bgValidationWarning
                            : 'transparent'
                        }
                      >
                        {assembled ? (
                          <VStack align="stretch" spacing={1}>
                            {subTypeRequirements.itemRequirements[rowIndex]?.requiresExposed &&
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
                                  onClick={() => updateExposedSide(rowIndex, opt)}
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
                      <Flex align="center">
                        <Icon as={Settings}
                          cursor="pointer"
                          color="black"
                          mr={4}
                          onClick={() => handleOpenModificationModal(rowIndex, item.id)}
                        />
                        <Icon as={Trash}
                          cursor="pointer"
                          color={textRed500}
                          onClick={() => handleDelete(rowIndex)}
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
                            <React.Fragment key={`modgrp-${rowIndex}-${gkey}`}>
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
                                  <React.Fragment key={`mod-${rowIndex}-${gkey}-${modIdx}`}>
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
                                        <Icon as={Trash}
                                          cursor="pointer"
                                          color={textRed500}
                                          fontSize="14px"
                                          onClick={() => handleDeleteModification(rowIndex, modIdx)}
                                          title="Remove modification"
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
            {desktopVirtual.enabled && desktopVirtual.paddingBottom > 0 && (
              <Tr>
                <Td colSpan={tableColumnCount} p={0} style={{ height: `${desktopVirtual.paddingBottom}px` }} />
              </Tr>
            )}

          </Tbody>
        </Table>
        </TableCard>
      </Box>

      {/* Mobile Card View */}
      <Box display={{ base: 'block', lg: 'none' }}>
        <Box
          ref={mobileVirtual.containerRef}
          maxH={mobileVirtual.enabled ? '70vh' : 'auto'}
          overflowY={mobileVirtual.enabled ? 'auto' : 'visible'}
        >
          {mobileVirtual.enabled && mobileVirtual.paddingTop > 0 && (
            <Box height={`${mobileVirtual.paddingTop}px`} />
          )}

          <VStack spacing={3} align="stretch">
            {mobileItems.map((item, virtualIdx) => {
              const rowIndex = mobileStartIndex + virtualIdx
              const assembled = !!isAssembled
              const qty = Number(item.qty || 1)
              const isUnavailable = !!item.unavailable
              const unitAssembly = assembled ? Number(item.assemblyFee || 0) : 0
              const assemblyFee = isUnavailable ? 0 : unitAssembly * qty
              const modsTotal = Array.isArray(item.modifications)
                ? item.modifications.reduce((sum, mod) => sum + Number(mod.price || 0) * Number(mod.qty || 1), 0)
                : 0
              const total = (isUnavailable ? 0 : Number(item.price || 0) * qty) + assemblyFee + modsTotal

              return (
                <React.Fragment key={`mobile-${rowIndex}`}>
                  <Box
                    border="2px solid"
                    borderColor={rowBorder}
                    borderRadius="md"
                    bg={rowIndex % 2 === 0 ? rowBgEven : rowBgOdd}
                    mb={3}
                    p={4}
                  >
                    <Flex justify="space-between" align="center" mb={3}>
                      <Flex
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
                        boxShadow="sm"
                      >
                        {rowIndex + 1}
                      </Flex>
                      <HStack spacing={3}>
                        <Icon
                          as={Settings}
                          cursor="pointer"
                          color={settingsIconColor}
                          boxSize={4.5}
                          onClick={() => handleOpenModificationModal(rowIndex, item.id)}
                        />
                        <Icon
                          as={Trash}
                          cursor="pointer"
                          color={textDanger}
                          boxSize={4.5}
                          onClick={() => handleDelete(rowIndex)}
                        />
                      </HStack>
                    </Flex>

                    <Flex justify="space-between" align="center" mb={2}>
                      <Text fontWeight="600" color={labelColor} fontSize="sm">
                        {t('proposalColumns.item')}
                      </Text>
                      <Flex align="center" gap={2} minW={0} flex="1" justify="flex-end">
                        <Text
                          color={isUnavailable ? textUnavailable : undefined}
                          textDecoration={isUnavailable ? 'line-through' : undefined}
                          whiteSpace="nowrap"
                          overflow="hidden"
                          textOverflow="ellipsis"
                          fontSize="sm"
                        >
                          <Text as="strong">{item.code}</Text>
                          {item.description ? (
                            <Text as="span" color={descriptionColor} ml={1}>
                              - {item.description}
                            </Text>
                          ) : null}
                        </Text>
                        {hasTypeMetadata(item.type) && (
                          <Button
                            size="xs"
                            variant="outline"
                            colorScheme="blue"
                            fontSize="xs"
                            px={2}
                            py={0.5}
                            onClick={() => openTypeModal(item.type)}
                            title={`View ${item.type} specifications`}
                          >
                            Specs
                          </Button>
                        )}
                      </Flex>
                    </Flex>

                    <Flex justify="space-between" align="center" mb={2}>
                      <Text fontWeight="600" color={labelColor} fontSize="sm">
                        {t('proposalColumns.qty')}
                      </Text>
                      <Input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(event) => updateQty(rowIndex, parseInt(event.target.value))}
                        w="80px"
                        size="sm"
                      />
                    </Flex>

                    <Flex justify="space-between" align="center" mb={2}>
                      <Text fontWeight="600" color={labelColor} fontSize="sm">
                        {t('proposalColumns.price')}
                      </Text>
                      <Text
                        color={isUnavailable ? textUnavailable : undefined}
                        textDecoration={isUnavailable ? 'line-through' : undefined}
                        fontSize="sm"
                      >
                        {isUnavailable ? formatPrice(0) : formatPrice(item.price)}
                      </Text>
                    </Flex>

                    {assembled && (
                      <>
                        {subTypeRequirements.requiresHinge && (
                          <Box
                            bg={
                              subTypeRequirements.itemRequirements[rowIndex]?.requiresHinge &&
                              (!item.hingeSide || item.hingeSide === '-')
                                ? bgValidationWarning
                                : 'transparent'
                            }
                            p={2}
                            borderRadius="md"
                            mb={2}
                          >
                            <Text fontWeight="600" color={labelColor} fontSize="sm" mb={2}>
                              {t('proposalColumns.hingeSide')}
                            </Text>
                            {subTypeRequirements.itemRequirements[rowIndex]?.requiresHinge &&
                              (!item.hingeSide || item.hingeSide === '-') && (
                                <Text color={textRed500} mb={2} fontSize="xs" fontWeight="bold">
                                  {t('validation.selectHingeSide', {
                                    defaultValue: 'Select hinge side',
                                  })}
                                </Text>
                              )}
                            <Flex gap={2}>
                              {hingeOptions.map((opt) => (
                                <Button
                                  key={opt}
                                  size="sm"
                                  variant={item.hingeSide === opt ? 'solid' : 'outline'}
                                  colorScheme={item.hingeSide === opt ? undefined : 'gray'}
                                  bg={item.hingeSide === opt ? headerBg : undefined}
                                  color={item.hingeSide === opt ? textColor : undefined}
                                  borderColor={item.hingeSide === opt ? headerBg : undefined}
                                  onClick={() => updateHingeSide(rowIndex, opt)}
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
                              subTypeRequirements.itemRequirements[rowIndex]?.requiresExposed &&
                              (!item.exposedSide || item.exposedSide === '-')
                                ? bgValidationWarning
                                : 'transparent'
                            }
                            p={2}
                            borderRadius="md"
                            mb={2}
                          >
                            <Text fontWeight="600" color={labelColor} fontSize="sm" mb={2}>
                              {t('proposalColumns.exposedSide')}
                            </Text>
                            {subTypeRequirements.itemRequirements[rowIndex]?.requiresExposed &&
                              (!item.exposedSide || item.exposedSide === '-') && (
                                <Text color={textRed500} mb={2} fontSize="xs" fontWeight="bold">
                                  {t('validation.selectExposedSide', {
                                    defaultValue: 'Select exposed side',
                                  })}
                                </Text>
                              )}
                            <Flex gap={2}>
                              {exposedOptions.map((opt) => (
                                <Button
                                  key={opt}
                                  size="sm"
                                  variant={item.exposedSide === opt ? 'solid' : 'outline'}
                                  colorScheme={item.exposedSide === opt ? undefined : 'gray'}
                                  bg={item.exposedSide === opt ? headerBg : undefined}
                                  color={item.exposedSide === opt ? textColor : undefined}
                                  borderColor={item.exposedSide === opt ? headerBg : undefined}
                                  onClick={() => updateExposedSide(rowIndex, opt)}
                                >
                                  {codeToLabel(opt)}
                                </Button>
                              ))}
                            </Flex>
                          </Box>
                        )}

                        <Flex justify="space-between" align="center" mb={2}>
                          <Text fontWeight="600" color={labelColor} fontSize="sm">
                            {t('proposalColumns.assemblyCost')}
                          </Text>
                          <Text
                            color={isUnavailable ? textUnavailable : undefined}
                            textDecoration={isUnavailable ? 'line-through' : undefined}
                            fontSize="sm"
                          >
                            {formatPrice(assemblyFee)}
                          </Text>
                        </Flex>
                      </>
                    )}

                    <Flex justify="space-between" align="center" mb={2}>
                      <Text fontWeight="600" color={labelColor} fontSize="sm">
                        {t('proposalColumns.modifications', { defaultValue: 'Modifications' })}
                      </Text>
                      <Text fontSize="sm">{formatPrice(modsTotal)}
                      </Text>
                    </Flex>

                    <Box
                      mt={3}
                      pt={3}
                      borderTop="2px solid"
                      borderTopColor={borderColor}
                      color={isUnavailable ? textUnavailable : undefined}
                      textDecoration={isUnavailable ? 'line-through' : undefined}
                    >
                      <Text fontWeight="bold" fontSize="md">
                        {t('proposalColumns.total')}: {formatPrice(total)}
                      </Text>
                    </Box>
                  </Box>

                  {Array.isArray(item.modifications) &&
                    item.modifications.length > 0 &&
                    item.modifications.map((mod, modIdx) => (
                      <Box
                        key={`mobile-mod-${rowIndex}-${modIdx}`}
                        bg={headerBg}
                        color={textColor}
                        border="1px solid"
                        borderColor={headerBg}
                        borderRadius="6px"
                        p={3}
                        mt={3}
                        mb={6}
                        mx="auto"
                        maxW="90%"
                        position="relative"
                        boxShadow="sm"
                      >
                        <Flex
                          position="absolute"
                          top="-8px"
                          left="12px"
                          bg={textColor}
                          color={headerBg}
                          borderRadius="full"
                          w="24px"
                          h="24px"
                          align="center"
                          justify="center"
                          fontSize="12px"
                          fontWeight="bold"
                          border="2px solid"
                          borderColor={headerBg}
                        >
                          {rowIndex + 1}
                        </Flex>
                        <Flex justify="space-between" align="center" mb={2}>
                          <Text
                            fontSize="12px"
                            fontWeight="600"
                            color={textColor}
                            textTransform="uppercase"
                            letterSpacing="0.5px"
                          >
                            {t('proposalDoc.modifications')}
                          </Text>
                          <Icon
                            as={Trash}
                            cursor="pointer"
                            color={textDanger}
                            onClick={() => handleDeleteModification(rowIndex, modIdx)}
                          />
                        </Flex>
                        <Flex justify="space-between" fontSize="14px" mb={1}>
                          <Text>{mod.name || t('proposalUI.mod.unnamed')}</Text>
                          {(() => {
                            const details = buildSelectedOptionsText(mod?.selectedOptions)
                            return details ? <Text opacity={0.7}> - {details}</Text> : null
                          })()}
                          <Text>{t('common.qty', 'Qty')}: {mod.qty}</Text>
                        </Flex>
                        <Flex justify="space-between" fontSize="14px">
                          <Text>
                            {t('proposalColumns.price')}: {formatPrice(mod.price || 0)}
                          </Text>
                          <Text fontWeight="bold">
                            {t('proposalColumns.total')}:{' '}
                            {formatPrice((mod.price || 0) * (mod.qty || 1))}
                          </Text>
                        </Flex>
                      </Box>
                    ))}
                </React.Fragment>
              )
            })}
          </VStack>

          {mobileVirtual.enabled && mobileVirtual.paddingBottom > 0 && (
            <Box height={`${mobileVirtual.paddingBottom}px`} />
          )}
        </Box>
      </Box>

    </Box>
  )
}

export default CatalogTable


