import StandardCard from './StandardCard'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { getContrastColor } from '../utils/colorUtils'
import { Button, Box, Flex, Text, Badge, Checkbox, Input, InputGroup, Modal, ModalBody, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalFooter, Icon, Table, Thead, Tbody, Tr, Th, Td, useColorModeValue } from '@chakra-ui/react'
import { Copy, Settings, Trash, Wrench } from 'lucide-react'
import axiosInstance from '../helpers/axiosInstance'
import PageHeader from './PageHeader'
import { checkSubTypeRequirements } from '../helpers/subTypeValidation'

const hingeOptions = ['L', 'R', '-']
const exposedOptions = ['L', 'R', 'B', '-']

// Helpers to render selected modification options neatly (shared logic)
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

const CatalogTableEdit = ({
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
  readOnly = false,
}) => {
  const { t } = useTranslation()
  const customization = useSelector((state) => state.customization)

  const headerBg = customization.headerBg || 'brand.500'
  const textColor = getContrastColor(headerBg)

  const [partQuery, setPartQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchContainerRef = useRef(null)
  const [typesMeta, setTypesMeta] = useState([])
  const [showTypeModal, setShowTypeModal] = useState(false)
  const [selectedTypeInfo, setSelectedTypeInfo] = useState(null)
  const [subTypeRequirements, setSubTypeRequirements] = useState({
    requiresHinge: false,
    requiresExposed: false,
    itemRequirements: {},
  })
  const api_url = import.meta.env.VITE_API_URL

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
    const byStyle = Array.isArray(catalogData)
      ? catalogData.filter(
          (item) =>
            Array.isArray(item.styleVariants) &&
            item.styleVariants.length > 0 &&
            item.style === selectedStyleData?.style,
        )
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

  // Fetch types metadata once per manufacturer (for Specs)
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
    const checkRequirements = async () => {
      const manufacturerId = selectVersion?.manufacturerData?.id
      const items = selectVersion?.items || []
      if (!manufacturerId || !Array.isArray(items) || items.length === 0) {
        setSubTypeRequirements({
          requiresHinge: false,
          requiresExposed: false,
          itemRequirements: {},
        })
        return
      }

      try {
        const requirements = await checkSubTypeRequirements(items, manufacturerId)
        setSubTypeRequirements(requirements)
      } catch (error) {
        console.error('Failed to check sub-type requirements:', error)
        setSubTypeRequirements({
          requiresHinge: false,
          requiresExposed: false,
          itemRequirements: {},
        })
      }
    }

    checkRequirements()
  }, [selectVersion?.manufacturerData?.id, selectVersion?.items])

  // Build quick map for type metadata
  const typeMap = useMemo(() => {
    const m = new Map()
    ;(typesMeta || []).forEach((t) => {
      if (t?.type) m.set(String(t.type), t)
    })
    return m
  }, [typesMeta])

  // Also map code -> type (many catalogs in edit don't carry `type` on items)
  const typeByCodeMap = useMemo(() => {
    const m = new Map()
    ;(typesMeta || []).forEach((t) => {
      if (t?.code && t?.type) m.set(String(t.code), String(t.type))
    })
    return m
  }, [typesMeta])

  const getItemType = (item) => {
    if (!item) return undefined
    return item.type || typeByCodeMap.get(String(item.code || ''))
  }

  const hasTypeMetadata = (type) => {
    if (!type) return false
    const meta = typeMap.get(String(type))
    return meta && (meta.image || (meta.longDescription || meta.description || '').trim())
  }

  const openTypeModal = (type) => {
    const meta = typeMap.get(String(type))
    if (meta) {
      setSelectedTypeInfo(meta)
      setShowTypeModal(true)
    }
  }

  const pickItem = (item) => {
    if (!item) return
    handleCatalogSelect({ target: { value: `${item.code} -- ${item.description}` } })
    setPartQuery('')
    setShowSuggestions(false)
  }

  // console.log('catalogData in Edit: ',catalogData);
  // console.log('selectedStyleData in Edit: ',selectedStyleData);
  // Close suggestions on outside click to avoid overlay blocking other controls
  useEffect(() => {
    const handleDocMouseDown = (e) => {
      const node = searchContainerRef.current
      if (!node) return
      if (!node.contains(e.target)) setShowSuggestions(false)
    }
    if (showSuggestions) {
      document.addEventListener('mousedown', handleDocMouseDown)
      return () => document.removeEventListener('mousedown', handleDocMouseDown)
    }
  }, [showSuggestions])
  return (
    <Box mt={5} mb={5}>
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
            </Flex>
          ) : (
            <Box color={useColorModeValue("gray.600", "gray.400")} textAlign="center" p={4} border="1px solid" borderColor={useColorModeValue("gray.200", "gray.600")} borderRadius="md" bg={useColorModeValue("gray.50", "gray.800")}>
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
      {/* Controls - align with create (adds catalog-controls-mobile for responsive) */}
      <Flex flexWrap="wrap" gap={3} align="center" justify="space-between" mb={4} className="catalog-controls-mobile">
        {!readOnly && (
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
                  if (e.key === 'Escape') {
                    setShowSuggestions(false)
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
                    {hasTypeMetadata(getItemType(item)) && (
                      <Button
                        size="xs"
                        variant="outline"
                        colorScheme="blue"
                        ml={2}
                        fontSize="xs"
                        px={1}
                        py={0.5}
                        flexShrink={0}
                        onClick={(e) => {
                          e.stopPropagation()
                          openTypeModal(getItemType(item))
                        }}
                        title={`View ${getItemType(item)} specifications`}
                      >
                        Specs
                      </Button>
                    )}
                  </Flex>
                ))}
              </Box>
            )}
          </Box>
        )}

        <Flex flexWrap="wrap" align="center" gap={3} flexShrink={0}>
          {!readOnly && (
            <>
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
            </>
          )}
        </Flex>

        {!readOnly && (
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
        )}
      </Flex>

      {/* Desktop table view */}
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
            {selectVersion?.items?.map((item, idx) => {
              // Use global assembled toggle only; assembly applies automatically when on
              const assembled = !!isAssembled
              const qty = Number(item.qty || 1)
              const unitAssembly = assembled ? Number(item.assemblyFee || 0) : 0
              const assemblyFee = unitAssembly * qty
              const modsTotal = Array.isArray(item.modifications)
                ? item.modifications.reduce(
                    (s, m) => s + Number(m.price || 0) * Number(m.qty || 1),
                    0,
                  )
                : 0
              const total = Number(item.price || 0) * qty + assemblyFee + modsTotal

              const rowStyle = item.unavailable
                ? { color: 'var(--chakra-colors-red-600)', textDecoration: 'line-through' }
                : undefined
              return (
                <React.Fragment key={idx}>
                  <Tr
                    className={item.unavailable ? 'table-danger' : ''}
                    style={{
                      backgroundColor: item.unavailable
                        ? undefined
                        : idx % 2 === 0
                          ? 'var(--chakra-colors-gray-50)'
                          : 'white',
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
                        isDisabled={readOnly}
                      />
                    </Td>

                    <Td style={rowStyle}>
                      <Flex align="center" gap={2} style={{ minWidth: 0 }}>
                        <Flex
                          align="baseline"
                          gap={2}
                          wrap="wrap"
                          style={{ minWidth: 0 }}
                        >
                          <strong>{item.code}</strong>
                          {item?.description ? (
                            <Text
                              as="span"
                              color={useColorModeValue("gray.600", "gray.400")}
                              noOfLines={1}
                              style={{
                                maxWidth: '420px',
                                display: 'inline-block',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                              title={item.description}
                            >
                              — {item.description}
                            </Text>
                          ) : null}
                        </Flex>
                        {hasTypeMetadata(getItemType(item)) && (
                          <Button
                            size="xs"
                            variant="outline"
                            colorScheme="blue"
                            fontSize="xs"
                            px={2}
                            py={0.5}
                            onClick={() => openTypeModal(getItemType(item))}
                            title={`View ${getItemType(item)} specifications`}
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
                                <Box
                                  color="red.500"
                                  mb={1}
                                  fontSize="12px"
                                  fontWeight="bold"
                                >
                                  {t('validation.selectHingeSide', {
                                    defaultValue: 'Select hinge side',
                                  })}
                                </Box>
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
                                  onClick={() => !readOnly && updateHingeSide(idx, opt)}
                                  isDisabled={readOnly}
                                  opacity={readOnly ? 0.6 : 1}
                                  pointerEvents={readOnly ? 'none' : 'auto'}
                                >
                                  {codeToLabel(opt)}
                                </Button>
                              ))}
                            </Flex>
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
                                <Box
                                  color="red.500"
                                  mb={1}
                                  fontSize="12px"
                                  fontWeight="bold"
                                >
                                  {t('validation.selectExposedSide', {
                                    defaultValue: 'Select exposed finished side',
                                  })}
                                </Box>
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
                                  onClick={() => !readOnly && updateExposedSide(idx, opt)}
                                  isDisabled={readOnly}
                                  opacity={readOnly ? 0.6 : 1}
                                  pointerEvents={readOnly ? 'none' : 'auto'}
                                >
                                  {codeToLabel(opt)}
                                </Button>
                              ))}
                            </Flex>
                          </Box>
                        ) : (
                          t('common.na')
                        )}
                      </Td>
                    )}

                    <Td style={rowStyle}>
                      {formatPrice(item.unavailable ? 0 : item.price)}
                    </Td>

                    <Td>
                      {assembled ? (
                        <span style={rowStyle}>
                          {formatPrice(item.unavailable ? 0 : assemblyFee)}
                        </span>
                      ) : (
                        <Text as="span" color={useColorModeValue("gray.600", "gray.400")}>{formatPrice(0)}</Text>
                      )}
                    </Td>

                    <Td>{formatPrice(modsTotal)}</Td>
                    <Td style={rowStyle}>
                      {formatPrice(item.unavailable ? 0 : total)}
                    </Td>

                    <Td>
                      <Flex align="center">
                        {!readOnly && (
                          <>
                            <Icon as={Settings}
                              cursor="pointer"
                              color="black"
                              mr={4}
                              onClick={() => handleOpenModificationModal(idx, item.id)}
                            />
                            <Icon as={Trash}
                              cursor="pointer"
                              color="red.500"
                              onClick={() => handleDelete(idx)}
                            />
                          </>
                        )}
                      </Flex>
                    </Td>
                  </Tr>
                  {Array.isArray(item.modifications) &&
                    item.modifications.length > 0 &&
                    (() => {
                      // Group by submenu/category when available on mod.categoryName
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
                              style={{
                                backgroundColor: headerBg,
                                color: textColor,
                                padding: '8px 16px',
                                paddingLeft: '56px',
                                fontSize: "14px",
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
                                style={{ fontSize: "14px", color: textColor }}
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
                                                padding="2px 8px"
                                                borderRadius="6px"
                                                bg={useColorModeValue("gray.50", "gray.800")}
                                                border="1px dashed"
                                                borderColor="gray.400"
                                              >
                                                {details}
                                              </Text>
                                            ) : null
                                          })()}
                                        </Flex>
                                      </Td>
                                      <Td color="green.500" fontWeight="medium">
                                        {formatPrice(mod.price || 0)}
                                      </Td>
                                      <Td style={{ color: "gray.500" }}>
                                        -
                                      </Td>
                                      <Td>
                                        {/* Modifications column (per-item summary) not applicable on sub-rows */}
                                      </Td>
                                      <Td color="green.500" fontWeight="semibold">
                                        {formatPrice((mod.price || 0) * (mod.qty || 1))}
                                      </Td>
                                      <Td style={{ textAlign: 'center' }}>
                                        {!readOnly && (
                                          <Icon as={Trash}
                                            style={{
                                              cursor: 'pointer',
                                              color: "red.500",
                                              fontSize: "14px",
                                            }}
                                            onClick={() =>
                                              handleDeleteModification(
                                                idx,
                                                item.modifications.findIndex((m) => m === mod),
                                              )
                                            }
                                            title="Remove modification"
                                          />
                                        )}
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

      {/* Mobile card view to match create */}
      <div className="mobile-card-view mobile-only">
        {selectVersion?.items?.map((item, idx) => {
          const assembled = !!isAssembled
          const qty = Number(item.qty || 1)
          const unitAssembly = assembled ? Number(item.assemblyFee || 0) : 0
          const assemblyFee = unitAssembly * qty
          const modsTotal = Array.isArray(item.modifications)
            ? item.modifications.reduce((s, m) => s + Number(m.price || 0) * Number(m.qty || 1), 0)
            : 0
          const total = Number(item.price || 0) * qty + assemblyFee + modsTotal
          const rowStyle = item.unavailable
            ? { color: 'var(--chakra-colors-red-600)', textDecoration: 'line-through' }
            : undefined

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
                  {!readOnly && (
                    <div className="item-actions">
                      <Icon as={Settings}
                        style={{
                          cursor: 'pointer',
                          color: 'var(--cui-primary)',
                          fontSize: "18px",
                        }}
                        onClick={() => handleOpenModificationModal(idx, item.id)}
                      />
                      <Icon as={Trash}
                        style={{
                          cursor: 'pointer',
                          color: 'var(--cui-danger)',
                          fontSize: "18px",
                        }}
                        onClick={() => handleDelete(idx)}
                      />
                    </div>
                  )}
                </div>

                <div className="item-detail-row">
                  <span className="item-label">{t('proposalColumns.item')}</span>
                  <Flex
                    align="center"
                    gap={2}
                    wrap="wrap"
                    style={{ minWidth: 0 }}
                  >
                    <span className="item-value item-code" style={rowStyle}>
                      <strong>{item.code}</strong>
                    </span>
                    {item?.description ? (
                      <Text
                        as="span"
                        color={useColorModeValue("gray.600", "gray.400")}
                        noOfLines={1}
                        maxWidth="220px"
                        overflow="hidden"
                        textOverflow="ellipsis"
                        whiteSpace="nowrap"
                        title={item.description}
                      >
                        — {item.description}
                      </Text>
                    ) : null}
                    {hasTypeMetadata(getItemType(item)) && (
                      <Button
                        size="xs"
                        variant="outline"
                        colorScheme="blue"
                        fontSize="xs"
                        px={2}
                        py={0.5}
                        onClick={() => openTypeModal(getItemType(item))}
                        title={`View ${getItemType(item)} specifications`}
                      >
                        Specs
                      </Button>
                    )}
                  </Flex>
                </div>

                <div className="item-detail-row">
                  <span className="item-label">{t('proposalColumns.qty')}</span>
                  <Input
                    type="number"
                    min="1"
                    value={item.qty}
                    onChange={(e) => updateQty(idx, parseInt(e.target.value))}
                    className="qty-input-mobile"
                    isDisabled={readOnly}
                  />
                </div>

                <div className="item-detail-row">
                  <span className="item-label">{t('proposalColumns.price')}</span>
                  <span className="item-value" style={rowStyle}>
                    {formatPrice(item.unavailable ? 0 : item.price)}
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
                            <Box
                              color="red.500"
                              mb={2}
                              fontSize="12px"
                              fontWeight="bold"
                            >
                              {t('validation.selectHingeSide', {
                                defaultValue: 'Select hinge side',
                              })}
                            </Box>
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
                              onClick={() => !readOnly && updateHingeSide(idx, opt)}
                              isDisabled={readOnly}
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
                            <Box
                              color="red.500"
                              mb={2}
                              fontSize="12px"
                              fontWeight="bold"
                            >
                              {t('validation.selectExposedSide', {
                                defaultValue: 'Select exposed finished side',
                              })}
                            </Box>
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
                              onClick={() => !readOnly && updateExposedSide(idx, opt)}
                              isDisabled={readOnly}
                            >
                              {codeToLabel(opt)}
                            </Button>
                          ))}
                        </Flex>
                      </div>
                    )}

                    <div className="item-detail-row">
                      <span className="item-label">{t('proposalColumns.assemblyCost')}</span>
                      <span className="item-value" style={rowStyle}>
                        {formatPrice(item.unavailable ? 0 : assemblyFee)}
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

                <div className="total-highlight">
                  <strong style={rowStyle}>
                    {t('proposalColumns.total')}: {formatPrice(item.unavailable ? 0 : total)}
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
                      {!readOnly && (
                        <Icon as={Trash}
                          style={{ cursor: 'pointer', color: 'var(--cui-danger)' }}
                          onClick={() => handleDeleteModification(idx, modIdx)}
                        />
                      )}
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

export default CatalogTableEdit
