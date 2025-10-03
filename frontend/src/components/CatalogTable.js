import StandardCard from './StandardCard'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { getContrastColor } from '../utils/colorUtils'
import { checkSubTypeRequirements } from '../helpers/subTypeValidation'
import { Checkbox, Input, InputGroup, Modal, ModalBody, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalFooter, Icon, Table, Thead, Tbody, Tr, Th, Td, Text, Button, Flex, Box, VStack, HStack, useColorModeValue } from '@chakra-ui/react'
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

  // Dark mode colors
  const descriptionColor = useColorModeValue("gray.600", "gray.400")
  const textRed500 = useColorModeValue("red.500", "red.300")
  const textGreen500 = useColorModeValue("green.500", "green.300")
  const borderGray400 = useColorModeValue("gray.400", "gray.600")

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
      <Flex flexWrap="wrap" gap={3} align="center" justify="space-between" mb={4} className="catalog-controls-mobile">
        <Box
          position="relative"
          flex="1"
          minW="200px"
          maxW="600px"
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
              className="dropdown-menu show"
              w="full"
              maxH="260px"
              overflowY="auto"
            >
              {filteredOptions.map((item) => (
                <Flex
                  key={item.id}
                  className="dropdown-item-wrapper"
                  justify="space-between"
                  align="center"
                  p={1}
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
                    <strong>{item.code}</strong> — {item.description}
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
          minW="200px"
          maxW="240px"
          w="full"
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
        <ModalContent>
          <ModalHeader p={0}>
            <PageHeader
              title={selectedTypeInfo?.type || 'Type Specifications'}
              onClose={() => setShowTypeModal(false)}
            />
          </ModalHeader>
          <ModalCloseButton aria-label="Close modal" />
          <ModalBody p={{ base: 3, md: 4 }}>
          {selectedTypeInfo ? (
            <Flex flexDir={{ base: "column", md: "row" }} gap={4}>
              <Box
                textAlign={{ base: "center", md: "start" }}
                border="1px solid"
                borderColor={useColorModeValue("gray.300", "gray.600")}
                borderRadius="md"
                p={3}
                bg={useColorModeValue("gray.50", "gray.800")}
                w="full"
                maxW="520px"
                mx="auto"
              >
                <img
                  src={
                    selectedTypeInfo.image
                      ? `${api_url}/uploads/types/${selectedTypeInfo.image}`
                      : '/images/nologo.png'
                  }
                  alt={selectedTypeInfo.type}
                  className="img-fluid"
                  style={{
                    maxWidth: '100%',
                    height: 'auto',
                    maxHeight: '455px',
                    objectFit: 'contain',
                    background: 'white',
                    borderRadius: '6px',
                    border: '1px solid',
                    borderColor: 'var(--chakra-colors-gray-300)',
                  }}
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
              <Box flex="1" border="1px solid" borderColor={useColorModeValue("gray.300", "gray.600")} borderRadius="md" p={3} bg={useColorModeValue("gray.50", "gray.800")} minW={0}>
                <Flex mb={3} align="center" gap={2}>
                  <Badge colorScheme="gray">{t('Type')}</Badge>
                  <Text as="strong" fontSize="lg">{selectedTypeInfo.type}</Text>
                </Flex>
                {selectedTypeInfo.code && (
                  <Box mb={2} borderBottom="1px solid" borderColor={useColorModeValue("gray.200", "gray.600")} pb={2}>
                    <Text as="span" color={useColorModeValue("gray.600", "gray.400")} fontWeight="medium">Code:</Text>{' '}
                    <strong>{selectedTypeInfo.code}</strong>
                  </Box>
                )}
                {selectedTypeInfo.name && (
                  <Box mb={2} borderBottom="1px solid" borderColor={useColorModeValue("gray.200", "gray.600")} pb={2}>
                    <Text as="span" color={useColorModeValue("gray.600", "gray.400")} fontWeight="medium">Name:</Text>{' '}
                    <strong>{selectedTypeInfo.name}</strong>
                  </Box>
                )}
                {selectedTypeInfo.shortName && (
                  <Box mb={3} borderBottom="1px solid" borderColor={useColorModeValue("gray.200", "gray.600")} pb={2}>
                    <Text as="span" color={useColorModeValue("gray.600", "gray.400")} fontWeight="medium">Short:</Text>{' '}
                    <strong>{selectedTypeInfo.shortName}</strong>
                  </Box>
                )}
                <Box mt={3}>
                  <Text as="strong" color={useColorModeValue("gray.600", "gray.400")} display="block" mb={2}>Description:</Text>
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
            <Box color={useColorModeValue("gray.600", "gray.400")} textAlign="center" p={4} border="1px solid" borderColor={useColorModeValue("gray.300", "gray.600")} borderRadius="md" bg={useColorModeValue("gray.50", "gray.800")}>
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
      <div className="table-responsive table-responsive-md desktop-only">
        <Table>
          <Thead>
            <Tr>
              <Th>{t('proposalColumns.no')}</Th>
              <Th>{t('proposalColumns.qty')}</Th>
              <Th>{t('proposalColumns.item')}</Th>
              {subTypeRequirements.requiresHinge && (
                <Th
                  style={{ backgroundcolor: "red.50", color: "red.600", fontWeight: 'bold' }}
                >
                  {t('proposalColumns.hingeSide')}
                </Th>
              )}
              {subTypeRequirements.requiresExposed && (
                <Th
                  style={{ backgroundcolor: "red.50", color: "red.600", fontWeight: 'bold' }}
                >
                  {t('proposalColumns.exposedSide')}
                </Th>
              )}
              <Th>{t('proposalColumns.price')}</Th>
              <Th>{t('proposalColumns.assemblyCost')}</Th>
              <Th>
                {t('proposalColumns.modifications', { defaultValue: 'Modifications' })}
              </Th>
              <Th>{t('proposalColumns.total')}</Th>
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
                    style={{
                      backgroundColor: idx % 2 === 0 ? 'var(--chakra-colors-gray-50)' : 'white',
                      borderBottom: '2px solid',
                      borderBottomColor: 'var(--chakra-colors-gray-200)',
                      ...(idx === 0 ? { borderTop: '2px solid', borderTopColor: 'var(--chakra-colors-gray-200)' } : {}),
                    }}
                  >
                    <Td style={{ width: '56px' }}>
                      <span
                        className="shadow-sm"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minWidth: '36px',
                          height: '28px',
                          padding: '0 10px',
                          borderRadius: '9999px',
                          backgroundColor: headerBg,
                          color: textColor,
                          fontWeight: 700,
                          fontSize: "16px",
                          letterSpacing: '0.2px',
                        }}
                        title={`Row ${idx + 1}`}
                      >
                        {idx + 1}
                      </span>
                    </Td>
                    <Td>
                      <Input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(e) => updateQty(idx, parseInt(e.target.value))}
                        style={{ width: '70px', textAlign: 'center' }}
                      />
                    </Td>

                    <Td
                      className={isUnavailable ? 'text-danger text-decoration-line-through' : ''}
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
                          <strong>{item.code}</strong>
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
                        style={{
                          backgroundColor:
                            subTypeRequirements.itemRequirements[idx]?.requiresHinge &&
                            (!item.hingeSide || item.hingeSide === '-')
                              ? 'var(--chakra-colors-red-50)'
                              : 'transparent',
                        }}
                      >
                        {assembled ? (
                          <Box>
                            {subTypeRequirements.itemRequirements[idx]?.requiresHinge &&
                              (!item.hingeSide || item.hingeSide === '-') && (
                                <Text
                                  color={textRed500}
                                  mb={1}
                                  fontSize="xs"
                                  fontWeight="bold"
                                >
                                  {t('validation.selectHingeSide', {
                                    defaultValue: 'Select hinge side',
                                  })}
                                </Text>
                              )}
                            <Flex gap={1}>
                              {hingeOptions.map((opt) => (
                                <Button
                                  key={opt}
                                  size="sm"
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
                          {/* close assembled wrapper */}
                          </Box>
                        ) : (
                          t('common.na')
                        )}
                      </Td>
                    )}

                    {subTypeRequirements.requiresExposed && (
                      <Td
                        style={{
                          backgroundColor:
                            subTypeRequirements.itemRequirements[idx]?.requiresExposed &&
                            (!item.exposedSide || item.exposedSide === '-')
                              ? 'var(--chakra-colors-red-50)'
                              : 'transparent',
                        }}
                      >
                        {assembled ? (
                          <Box>
                            {subTypeRequirements.itemRequirements[idx]?.requiresExposed &&
                              (!item.exposedSide || item.exposedSide === '-') && (
                                <Text
                                  color={textRed500}
                                  mb={1}
                                  fontSize="xs"
                                  fontWeight="bold"
                                >
                                  {t('validation.selectExposedSide', {
                                    defaultValue: 'Select exposed finished side',
                                  })}
                                </Text>
                              )}
                            <Flex gap={1}>
                              {exposedOptions.map((opt) => (
                                <Button
                                  key={opt}
                                  size="sm"
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
                          {/* close assembled wrapper */}
                          </Box>
                        ) : (
                          t('common.na')
                        )}
                      </Td>
                    )}

                    <Td
                      className={isUnavailable ? 'text-danger text-decoration-line-through' : ''}
                    >
                      {isUnavailable ? formatPrice(0) : formatPrice(item.price)}
                    </Td>

                    <Td>
                      {assembled ? (
                        <span>{formatPrice(assemblyFee)}</span>
                      ) : (
                        <span className="text-muted">{formatPrice(0)}</span>
                      )}
                    </Td>

                    <Td>{formatPrice(modsTotal)}</Td>

                    <Td
                      className={isUnavailable ? 'text-danger text-decoration-line-through' : ''}
                    >
                      {formatPrice(total)}
                    </Td>

                    <Td>
                      <Flex align="center">
                        <Icon as={Settings}
                          cursor="pointer"
                          color="black"
                          mr={4}
                          onClick={() => handleOpenModificationModal(idx, item.id)}
                        />
                        <Icon as={Trash}
                          cursor="pointer"
                          color={textRed500}
                          onClick={() => handleDelete(idx)}
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
                          <Tr className="modification-header">
                            <Td
                              colSpan={10}
                              fontSize="sm"
                              style={{
                                backgroundColor: headerBg,
                                color: textColor,
                                padding: '8px 16px',
                                paddingLeft: '56px',
                                borderTop: `2px solid ${headerBg}`,
                                borderLeft: `6px solid ${headerBg}`,
                                borderTopLeftRadius: '6px',
                                borderTopRightRadius: '6px',
                                boxShadow: 'inset 0 0 0 1px var(--chakra-colors-blackAlpha-50)',
                              }}
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
                                className="modification-category"
                                style={{ backgroundColor: 'var(--chakra-colors-gray-100)' }}
                              >
                                <Td
                                  colSpan={10}
                                  fontWeight="semibold"
                                  color={useColorModeValue("gray.600", "gray.400")}
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
                                      className="modification-item"
                                      style={{
                                        backgroundColor: 'var(--chakra-colors-gray-50)',
                                        borderLeft: `6px solid ${headerBg}`,
                                        fontSize: "14px",
                                        borderBottom: isLastRow
                                          ? `2px solid ${headerBg}`
                                          : '1px solid var(--chakra-colors-gray-200)',
                                      }}
                                    >
                                      <Td
                                        style={{ paddingLeft: '88px', color: "gray.500" }}
                                      >
                                        ↳
                                      </Td>
                                      <Td style={{ fontWeight: '500' }}>
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
                                            bg={useColorModeValue("gray.100", "gray.700")}
                                            border={`1px solid ${headerBg}`}
                                            color={useColorModeValue("gray.800", "gray.200")}
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
                                                color={useColorModeValue("gray.600", "gray.400")}
                                                fontSize="14px"
                                                px={2}
                                                py={0.5}
                                                borderRadius="md"
                                                bg={useColorModeValue("gray.50", "gray.800")}
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
                                                    <img
                                                      src={att.url}
                                                      alt={att.name || 'img'}
                                                      style={{
                                                        width: 18,
                                                        height: 18,
                                                        objectFit: 'cover',
                                                        borderRadius: 2,
                                                      }}
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
                                      <Td fontWeight="medium" color={textGreen500}>
                                        {formatPrice(mod.price || 0)}
                                      </Td>
                                      <Td color={useColorModeValue("gray.500", "gray.400")}>
                                        -
                                      </Td>
                                      <Td>
                                        {/* Modifications column (per-item summary) not applicable on sub-rows */}
                                      </Td>
                                      <Td fontWeight="semibold" color={textGreen500}>
                                        {formatPrice((mod.price || 0) * (mod.qty || 1))}
                                      </Td>
                                      <Td textAlign="center">
                                        <Icon as={Trash}
                                          cursor="pointer"
                                          color={textRed500}
                                          fontSize="14px"
                                          onClick={() => handleDeleteModification(idx, modIdx)}
                                          title="Remove modification"
                                        />
                                      </Td>
                                    </Tr>
                                    {isLastRow && (
                                      <Tr>
                                        <Td colSpan={10} style={{ padding: 0 }}>
                                          <div
                                            style={{
                                              height: '10px',
                                              borderBottom: '1px dashed',
                                              borderBottomColor: 'var(--chakra-colors-gray-400)',
                                            }}
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
      </div>

      {/* Mobile Card View */}
      <div className="mobile-card-view mobile-only">
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
              <div
                className="item-card-mobile"
                style={{
                  border: '2px solid',
                  borderColor: 'var(--chakra-colors-gray-200)',
                  borderRadius: '8px',
                  backgroundColor: idx % 2 === 0 ? 'var(--chakra-colors-gray-50)' : 'white',
                  marginBottom: '12px',
                }}
              >
                <div className="item-header">
                  <div className="item-number">{idx + 1}</div>
                  <div className="item-actions">
                    <Icon as={Settings}
                      cursor="pointer"
                      color="var(--cui-primary)"
                      boxSize={4.5}
                      onClick={() => handleOpenModificationModal(idx, item.id)}
                    />
                    <Icon as={Trash}
                      cursor="pointer"
                      color="var(--cui-danger)"
                      boxSize={4.5}
                      onClick={() => handleDelete(idx)}
                    />
                  </div>

                {/* close item-header */}
                </div>

                <div className="item-detail-row">
                  <span className="item-label">{t('proposalColumns.item')}</span>
                  <Flex align="center" gap={2} minW={0}>
                    <Text
                      className={`item-value item-code ${isUnavailable ? 'text-danger text-decoration-line-through' : ''}`}
                      whiteSpace="nowrap"
                      overflow="hidden"
                      textOverflow="ellipsis"
                    >
                      <strong>{item.code}</strong>
                      {item.description ? (
                        <Text as="span" color={useColorModeValue("gray.600", "gray.400")} ml={1}>— {item.description}</Text>
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
                </div>

                <div className="item-detail-row">
                  <span className="item-label">{t('proposalColumns.qty')}</span>
                  <input
                    type="number"
                    min="1"
                    value={item.qty}
                    onChange={(e) => updateQty(idx, parseInt(e.target.value))}
                    className="qty-input-mobile"
                  />
                </div>

                <div className="item-detail-row">
                  <span className="item-label">{t('proposalColumns.price')}</span>
                  <span
                    className={`item-value ${isUnavailable ? 'text-danger text-decoration-line-through' : ''}`}
                  >
                    {isUnavailable ? formatPrice(0) : formatPrice(item.price)}
                  </span>
                </div>

                {assembled && (
                  <>
                    {subTypeRequirements.requiresHinge && (
                      <div
                        className="item-detail-row"
                        style={{
                          backgroundColor:
                            subTypeRequirements.itemRequirements[idx]?.requiresHinge &&
                            (!item.hingeSide || item.hingeSide === '-')
                              ? 'var(--chakra-colors-red-50)'
                              : 'transparent',
                          padding: '0.5rem',
                          borderRadius: '4px',
                        }}
                      >
                        <span className="item-label">{t('proposalColumns.hingeSide')}</span>
                        {subTypeRequirements.itemRequirements[idx]?.requiresHinge &&
                          (!item.hingeSide || item.hingeSide === '-') && (
                            <Text
                              color={textRed500}
                              mb={2}
                              fontSize="xs"
                              fontWeight="bold"
                            >
                              {t('validation.selectHingeSide', {
                                defaultValue: 'Select hinge side',
                              })}
                            </Text>
                          )}
                        <Flex className="btn-group-mobile" gap={2}>
                          {hingeOptions.map((opt) => (
                            <Button
                              key={opt}
                              size="sm"
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
                      </div>
                    )}

                    {subTypeRequirements.requiresExposed && (
                      <div
                        className="item-detail-row"
                        style={{
                          backgroundColor:
                            subTypeRequirements.itemRequirements[idx]?.requiresExposed &&
                            (!item.exposedSide || item.exposedSide === '-')
                              ? 'var(--chakra-colors-red-50)'
                              : 'transparent',
                          padding: '0.5rem',
                          borderRadius: '4px',
                        }}
                      >
                        <span className="item-label">{t('proposalColumns.exposedSide')}</span>
                        {subTypeRequirements.itemRequirements[idx]?.requiresExposed &&
                          (!item.exposedSide || item.exposedSide === '-') && (
                            <Text
                              color={textRed500}
                              mb={2}
                              fontSize="xs"
                              fontWeight="bold"
                            >
                              {t('validation.selectExposedSide', {
                                defaultValue: 'Select exposed finished side',
                              })}
                            </Text>
                          )}
                        <Flex className="btn-group-mobile" gap={2}>
                          {exposedOptions.map((opt) => (
                            <Button
                              key={opt}
                              size="sm"
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
                      </div>
                    )}

                    <div className="item-detail-row">
                      <span className="item-label">{t('proposalColumns.assemblyCost')}</span>
                      <span
                        className={`item-value ${isUnavailable ? 'text-danger text-decoration-line-through' : ''}`}
                      >
                        {formatPrice(assemblyFee)}
                      </span>
                    </div>
                  </>
                )}

                {/* Modifications summary on mobile */}
                <div className="item-detail-row">
                  <span className="item-label">
                    {t('proposalColumns.modifications', { defaultValue: 'Modifications' })}
                  </span>
                  <span className="item-value">{formatPrice(modsTotal)}</span>
                </div>

                <div
                  className={`total-highlight ${isUnavailable ? 'text-danger text-decoration-line-through' : ''}`}
                >
                  <strong>
                    {t('proposalColumns.total')}: {formatPrice(total)}
                  </strong>
                </div>

              </div>

              {/* Mobile Modification Cards */}
              {Array.isArray(item.modifications) &&
                item.modifications.length > 0 &&
                item.modifications.map((mod, modIdx) => (
                  <div
                    key={`mobile-mod-${idx}-${modIdx}`}
                    style={{
                      background: headerBg,
                      color: textColor,
                      border: `1px solid ${headerBg}`,
                      borderRadius: '6px',
                      padding: '0.75rem',
                      marginTop: '0.75rem',
                      marginBottom: '1.5rem',
                      marginLeft: 'auto',
                      marginRight: 'auto',
                      maxWidth: '90%',
                      position: 'relative',
                      boxShadow: 'sm',
                    }}
                  >
                    {/* Item indicator badge */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '-8px',
                        left: '12px',
                        background: textColor,
                        color: headerBg,
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: "12px",
                        fontWeight: 'bold',
                        border: `2px solid ${headerBg}`,
                      }}
                    >
                      {idx + 1}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.5rem',
                      }}
                    >
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: '600',
                          color: textColor,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}
                      >
                        {t('proposalDoc.modifications')}
                      </span>
                      <Icon as={Trash}
                        style={{ cursor: 'pointer', color: 'var(--cui-danger)' }}
                        onClick={() => handleDeleteModification(idx, modIdx)}
                      />
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: "14px",
                        marginBottom: '0.25rem',
                      }}
                    >
                      <span>{mod.name || t('proposalUI.mod.unnamed')}</span>
                      {(() => {
                        const details = buildSelectedOptionsText(mod?.selectedOptions)
                        return details ? <span style={{ opacity: 0.7 }}> — {details}</span> : null
                      })()}
                      <span>Qty: {mod.qty}</span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: "14px",
                        marginBottom: '0',
                      }}
                    >
                      <span>
                        {t('proposalColumns.price')}: {formatPrice(mod.price || 0)}
                      </span>
                      <span>
                        <strong>
                          {t('proposalColumns.total')}:{' '}
                          {formatPrice((mod.price || 0) * (mod.qty || 1))}
                        </strong>
                      </span>
                    </div>
                  </div>
                ))}
            </React.Fragment>
          )
        })}
      </div>
    </Box>
  )
}

export default CatalogTable
