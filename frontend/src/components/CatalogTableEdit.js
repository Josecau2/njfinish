import StandardCard from './StandardCard'
import { TableCard } from './TableCard'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { getContrastColor } from '../utils/colorUtils'
import { Button, Box, Flex, Text, Badge, Checkbox, Image, Input, InputGroup, Modal, ModalBody, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalFooter, Icon, Table, TableContainer, Thead, Tbody, Tr, Th, Td, useColorModeValue } from '@chakra-ui/react'
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

  // Dark mode colors - ALL at component top level
  const textRed500 = useColorModeValue("red.500", "red.300")
  const textRed600 = useColorModeValue("red.600", "red.400")
  const textGreen500 = useColorModeValue("green.500", "green.300")
  const borderGray400 = useColorModeValue("gray.400", "gray.600")
  const bgUnavailableRow = useColorModeValue("red.50", "red.900")
  const textUnavailable = useColorModeValue("red.600", "red.400")
  const bgValidationWarning = useColorModeValue("orange.50", "orange.900")
  const buildUnavailableTextProps = (item) => (item?.unavailable ? { color: textUnavailable, textDecoration: 'line-through' } : {})
  const rowBgEven = useColorModeValue("gray.50", "gray.700")
  const rowBgOdd = useColorModeValue("white", "gray.800")
  const rowBorder = useColorModeValue("gray.200", "gray.600")
  const bgGray50 = useColorModeValue("gray.50", "gray.800")
  const bgGray100 = useColorModeValue("gray.100", "gray.700")
  const bgGray300 = useColorModeValue("gray.300", "gray.600")
  const borderGray200 = useColorModeValue("gray.200", "gray.600")
  const borderGray300 = useColorModeValue("gray.300", "gray.600")
  const textGray600 = useColorModeValue("gray.600", "gray.400")
  const textGray800 = useColorModeValue("gray.800", "gray.200")
  const textGray500 = useColorModeValue("gray.500", "gray.400")
  const borderGray100 = useColorModeValue("gray.100", "gray.700")
  const bgGray800 = useColorModeValue("gray.50", "gray.800")
  const bgGreen50 = useColorModeValue("green.50", "green.900")

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
        <ModalContent borderRadius="12px" overflow="hidden">
          <ModalHeader p={0}>
            <PageHeader
              title={selectedTypeInfo?.type || 'Type Specifications'}
              onClose={() => setShowTypeModal(false)}
            />
          </ModalHeader>
          <ModalCloseButton aria-label={t('common.ariaLabels.closeModal', 'Close modal')} />
          <ModalBody p={{ base: 3, md: 4 }}>
          {selectedTypeInfo ? (
            <Flex flexDir={{ base: "column", md: "row" }} gap={4}>
              <Box
                textAlign={{ base: "center", md: "start" }}
                border="1px solid"
                borderColor={borderGray300}
                borderRadius="md"
                p={3}
                bg={bgGray800}
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
                  borderColor={borderGray300}
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
              <Box flex="1" border="1px solid" borderColor={borderGray300} borderRadius="md" p={3} bg={bgGray800} minW={0}>
                <Flex mb={3} align="center" gap={2}>
                  <Badge colorScheme="gray">{t('Type')}</Badge>
                  <Text as="strong" fontSize="lg">{selectedTypeInfo.type}</Text>
                </Flex>
                {selectedTypeInfo.code && (
                  <Box mb={2} borderBottom="1px solid" borderColor={borderGray200} pb={2}>
                    <Text as="span" color={textGray600} fontWeight="medium">{t('catalog.labels.code', 'Code')}:</Text>{' '}
                    <Text as="strong">{selectedTypeInfo.code}</Text>
                  </Box>
                )}
                {selectedTypeInfo.name && (
                  <Box mb={2} borderBottom="1px solid" borderColor={borderGray200} pb={2}>
                    <Text as="span" color={textGray600} fontWeight="medium">{t('catalog.labels.name', 'Name')}:</Text>{' '}
                    <Text as="strong">{selectedTypeInfo.name}</Text>
                  </Box>
                )}
                {selectedTypeInfo.shortName && (
                  <Box mb={3} borderBottom="1px solid" borderColor={borderGray200} pb={2}>
                    <Text as="span" color={textGray600} fontWeight="medium">{t('catalog.labels.short', 'Short')}:</Text>{' '}
                    <Text as="strong">{selectedTypeInfo.shortName}</Text>
                  </Box>
                )}
                <Box mt={3}>
                  <Text as="strong" color={textGray600} display="block" mb={2}>{t('catalog.labels.description', 'Description')}:</Text>
                  <Text whiteSpace="pre-wrap" lineHeight="1.6" fontSize="md">
                    {selectedTypeInfo.longDescription ||
                      selectedTypeInfo.description ||
                      t('No description available for this type.')}
                  </Text>
                </Box>
              </Box>
            </Flex>
          ) : (
            <Box color={textGray600} textAlign="center" p={4} border="1px solid" borderColor={borderGray200} borderRadius="md" bg={bgGray800}>
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
      {/* Controls - align with create (responsive layout) */}
      <Flex flexWrap="wrap" gap={3} align="center" justify="space-between" mb={4}>
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
                position="absolute"
                top="100%"
                left={0}
                right={0}
                mt={1}
                bg={bgGray800}
                border="1px solid"
                borderColor={borderGray200}
                borderRadius="md"
                boxShadow="lg"
                zIndex={1000}
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
                      <Text as="span" fontWeight="bold">{item.code}</Text> — {item.description}
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
      <Box display={{ base: 'none', lg: 'block' }}>
        <TableCard>
          <Table variant="simple">
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

              const rowTextProps = buildUnavailableTextProps(item)
              return (
                <React.Fragment key={idx}>
                  <Tr
                    bg={item.unavailable ? bgUnavailableRow : (idx % 2 === 0 ? rowBgEven : rowBgOdd)}
                    borderBottom="2px solid"
                    borderBottomColor={rowBorder}
                    borderTop={idx === 0 ? "2px solid" : undefined}
                    borderTopColor={idx === 0 ? rowBorder : undefined}
                  >
                    <Td w="56px">
                      <Box
                        as="span"
                        display="inline-flex"
                        alignItems="center"
                        justifyContent="center"
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
                      </Box>
                    </Td>
                    <Td>
                      <Input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(e) => updateQty(idx, parseInt(e.target.value))}
                        w="70px"
                        textAlign="center"
                        isDisabled={readOnly}
                      />
                    </Td>

                    <Td {...rowTextProps}>
                      <Flex align="center" gap={2} minW={0}>
                        <Flex
                          align="baseline"
                          gap={2}
                          wrap="wrap"
                          minW={0}
                        >
                          <Text as="strong">{item.code}</Text>
                          {item?.description ? (
                            <Text
                              as="span"
                              color={textGray600}
                              noOfLines={1}
                              maxW="420px"
                              overflow="hidden"
                              textOverflow="ellipsis"
                              whiteSpace="nowrap"
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
                        bg={
                          subTypeRequirements.itemRequirements[idx]?.requiresHinge &&
                          (!item.hingeSide || item.hingeSide === '-')
                            ? bgValidationWarning
                            : 'transparent'
                        }
                      >
                        {assembled ? (
                          <Box>
                            {subTypeRequirements.itemRequirements[idx]?.requiresHinge &&
                              (!item.hingeSide || item.hingeSide === '-') && (
                                <Box
                                  color={textRed500}
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
                        bg={
                          subTypeRequirements.itemRequirements[idx]?.requiresExposed &&
                          (!item.exposedSide || item.exposedSide === '-')
                            ? bgValidationWarning
                            : 'transparent'
                        }
                      >
                        {assembled ? (
                          <Box>
                            {subTypeRequirements.itemRequirements[idx]?.requiresExposed &&
                              (!item.exposedSide || item.exposedSide === '-') && (
                                <Box
                                  color={textRed500}
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

                    <Td {...rowTextProps}>
                      {formatPrice(item.unavailable ? 0 : item.price)}
                    </Td>

                    <Td>
                      {assembled ? (
                        <Text as="span" {...rowTextProps}>
                          {formatPrice(item.unavailable ? 0 : assemblyFee)}
                        </Text>
                      ) : (
                        <Text as="span" color={useColorModeValue("gray.600", "gray.400")}>{formatPrice(0)}</Text>
                      )}
                    </Td>

                    <Td>{formatPrice(modsTotal)}</Td>
                    <Td {...rowTextProps}>
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
                              color={textRed500}
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
                          <Tr>
                            <Td
                              colSpan={10}
                              bg={headerBg}
                              color={textColor}
                              p="8px 16px"
                              pl="56px"
                              fontSize="14px"
                              borderTop={`2px solid ${headerBg}`}
                              borderLeft={`6px solid ${headerBg}`}
                              borderTopLeftRadius="6px"
                              borderTopRightRadius="6px"
                              boxShadow="inset 0 0 0 1px var(--chakra-colors-blackAlpha-50)"
                            >
                              <Icon
                                as={Wrench}
                                mr={2}
                                fontSize="14px"
                                color={textColor}
                              />
                              <Text as="span" fontWeight="bold">{t('proposalDoc.modifications')}</Text>
                            </Td>
                          </Tr>
                          {groupKeys.map((gkey, gi) => (
                            <React.Fragment key={`modgrp-${idx}-${gkey}`}>
                              <Tr
                                bg={bgGray100}
                              >
                                <Td
                                  colSpan={10}
                                  fontWeight="semibold"
                                  color={textGray600}
                                  pl="72px"
                                  fontSize="14px"
                                  borderLeft={`6px solid ${headerBg}`}
                                  borderBottom="1px solid"
                                  borderBottomColor={borderGray300}
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
                                      bg={rowBgEven}
                                      borderLeft={`6px solid ${headerBg}`}
                                      fontSize="14px"
                                      borderBottom={isLastRow ? `2px solid ${headerBg}` : '1px solid'}
                                      borderBottomColor={isLastRow ? undefined : rowBorder}
                                    >
                                      <Td
                                        pl="88px"
                                        color={textGray500}
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
                                            bg={bgGray100}
                                            border={`1px solid ${headerBg}`}
                                            color={textGray800}
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
                                                color={textGray600}
                                                fontSize="14px"
                                                padding="2px 8px"
                                                borderRadius="6px"
                                                bg={bgGray50}
                                                border="1px dashed"
                                                borderColor={borderGray400}
                                              >
                                                {details}
                                              </Text>
                                            ) : null
                                          })()}
                                        </Flex>
                                      </Td>
                                      <Td color={textGreen500} fontWeight="medium">
                                        {formatPrice(mod.price || 0)}
                                      </Td>
                                      <Td color={textGray500}>
                                        -
                                      </Td>
                                      <Td>
                                        {/* Modifications column (per-item summary) not applicable on sub-rows */}
                                      </Td>
                                      <Td color={textGreen500} fontWeight="semibold">
                                        {formatPrice((mod.price || 0) * (mod.qty || 1))}
                                      </Td>
                                      <Td textAlign="center">
                                        {!readOnly && (
                                          <Icon as={Trash}
                                            cursor="pointer"
                                            fontSize="14px"
                                            color={textRed500}
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

      {/* Mobile card view to match create */}
      <Box display={{ base: 'block', lg: 'none' }}>
      <Box>
        {selectVersion?.items?.map((item, idx) => {
          const assembled = !!isAssembled
          const qty = Number(item.qty || 1)
          const unitAssembly = assembled ? Number(item.assemblyFee || 0) : 0
          const assemblyFee = unitAssembly * qty
          const modsTotal = Array.isArray(item.modifications)
            ? item.modifications.reduce((s, m) => s + Number(m.price || 0) * Number(m.qty || 1), 0)
            : 0
          const total = Number(item.price || 0) * qty + assemblyFee + modsTotal
          const mobileTextProps = buildUnavailableTextProps(item)

          return (
            <React.Fragment key={`mobile-${idx}`}>
              <Box
                border="2px solid"
                borderColor={rowBorder}
                borderRadius="md"
                bg={idx % 2 === 0 ? rowBgEven : rowBgOdd}
                mb={3}
                p={4}
              >
                <Flex justify="space-between" align="center" mb={3}>
                  <Box
                    display="inline-flex"
                    alignItems="center"
                    justifyContent="center"
                    minW="36px"
                    h="28px"
                    px="10px"
                    borderRadius="full"
                    bg={headerBg}
                    color={textColor}
                    fontWeight={700}
                    fontSize="16px"
                  >
                    {idx + 1}
                  </Box>
                  {!readOnly && (
                    <Flex gap={3}>
                      <Icon as={Settings}
                        cursor="pointer"
                        color="blue.500"
                        fontSize="18px"
                        onClick={() => handleOpenModificationModal(idx, item.id)}
                      />
                      <Icon as={Trash}
                        cursor="pointer"
                        color={textRed500}
                        fontSize="18px"
                        onClick={() => handleDelete(idx)}
                      />
                    </Flex>
                  )}
                </Flex>

                <Flex mb={2} justify="space-between" align="center">
                  <Text fontWeight="medium" color={textGray600}>{t('proposalColumns.item')}</Text>
                  <Flex
                    align="center"
                    gap={2}
                    wrap="wrap"
                    minW={0}
                  >
                    <Text fontWeight="bold" {...mobileTextProps}>
                      {item.code}
                    </Text>
                    {item?.description ? (
                      <Text
                        as="span"
                        color={textGray600}
                        noOfLines={1}
                        maxW="220px"
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
                </Flex>

                <Flex mb={2} justify="space-between" align="center">
                  <Text fontWeight="medium" color={textGray600}>{t('proposalColumns.qty')}</Text>
                  <Input
                    type="number"
                    min="1"
                    value={item.qty}
                    onChange={(e) => updateQty(idx, parseInt(e.target.value))}
                    w="80px"
                    textAlign="center"
                    isDisabled={readOnly}
                  />
                </Flex>

                <Flex mb={2} justify="space-between" align="center">
                  <Text fontWeight="medium" color={textGray600}>{t('proposalColumns.price')}</Text>
                  <Text {...mobileTextProps}>
                    {formatPrice(item.unavailable ? 0 : item.price)}
                  </Text>
                </Flex>

                {assembled && (
                  <>
                    {subTypeRequirements.requiresHinge && (
                      <Box
                        mb={2}
                        bg={
                          subTypeRequirements.itemRequirements[idx]?.requiresHinge &&
                          (!item.hingeSide || item.hingeSide === '-')
                            ? bgValidationWarning
                            : 'transparent'
                        }
                        p="0.5rem"
                        borderRadius="4px"
                      >
                        <Text fontWeight="medium" color={textGray600} mb={2}>{t('proposalColumns.hingeSide')}</Text>
                        {subTypeRequirements.itemRequirements[idx]?.requiresHinge &&
                          (!item.hingeSide || item.hingeSide === '-') && (
                            <Box
                              color={textRed500}
                              mb={2}
                              fontSize="12px"
                              fontWeight="bold"
                            >
                              {t('validation.selectHingeSide', {
                                defaultValue: 'Select hinge side',
                              })}
                            </Box>
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
                              onClick={() => !readOnly && updateHingeSide(idx, opt)}
                              isDisabled={readOnly}
                            >
                              {codeToLabel(opt)}
                            </Button>
                          ))}
                        </Flex>
                      </Box>
                    )}

                    {subTypeRequirements.requiresExposed && (
                      <Box
                        mb={2}
                        bg={
                          subTypeRequirements.itemRequirements[idx]?.requiresExposed &&
                          (!item.exposedSide || item.exposedSide === '-')
                            ? bgValidationWarning
                            : 'transparent'
                        }
                        p="0.5rem"
                        borderRadius="4px"
                      >
                        <Text fontWeight="medium" color={textGray600} mb={2}>{t('proposalColumns.exposedSide')}</Text>
                        {subTypeRequirements.itemRequirements[idx]?.requiresExposed &&
                          (!item.exposedSide || item.exposedSide === '-') && (
                            <Box
                              color={textRed500}
                              mb={2}
                              fontSize="12px"
                              fontWeight="bold"
                            >
                              {t('validation.selectExposedSide', {
                                defaultValue: 'Select exposed finished side',
                              })}
                            </Box>
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
                              onClick={() => !readOnly && updateExposedSide(idx, opt)}
                              isDisabled={readOnly}
                            >
                              {codeToLabel(opt)}
                            </Button>
                          ))}
                        </Flex>
                      </Box>
                    )}

                    <Flex mb={2} justify="space-between" align="center">
                      <Text fontWeight="medium" color={textGray600}>{t('proposalColumns.assemblyCost')}</Text>
                      <Text {...mobileTextProps}>
                        {formatPrice(item.unavailable ? 0 : assemblyFee)}
                      </Text>
                    </Flex>
                  </>
                )}

                {/* Modifications summary on mobile */}
                <Flex mb={2} justify="space-between" align="center">
                  <Text fontWeight="medium" color={textGray600}>
                    {t('proposalColumns.modifications', { defaultValue: 'Modifications' })}
                  </Text>
                  <Text>{formatPrice(modsTotal)}</Text>
                </Flex>

                <Box
                  mt={3}
                  p={2}
                  bg={bgGreen50}
                  borderRadius="md"
                  textAlign="center"
                >
                  <Text fontWeight="bold" {...mobileTextProps}>
                    {t('proposalColumns.total')}: {formatPrice(item.unavailable ? 0 : total)}
                  </Text>
                </Box>

              </Box>

              {/* Mobile Modification Cards */}
              {Array.isArray(item.modifications) &&
                item.modifications.length > 0 &&
                item.modifications.map((mod, modIdx) => (
                  <Box
                    key={`mobile-mod-${idx}-${modIdx}`}
                    bg={headerBg}
                    color={textColor}
                    border={`1px solid ${headerBg}`}
                    borderRadius="6px"
                    p="0.75rem"
                    mt="0.75rem"
                    mb="1.5rem"
                    ml="auto"
                    mr="auto"
                    maxW="90%"
                    position="relative"
                    boxShadow="sm"
                  >
                    {/* Item indicator badge */}
                    <Box
                      position="absolute"
                      top="-8px"
                      left="12px"
                      bg={textColor}
                      color={headerBg}
                      borderRadius="50%"
                      w="24px"
                      h="24px"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      fontSize="12px"
                      fontWeight="bold"
                      border={`2px solid ${headerBg}`}
                    >
                      {idx + 1}
                    </Box>
                    <Flex
                      justify="space-between"
                      align="center"
                      mb="0.5rem"
                    >
                      <Text
                        fontSize="12px"
                        fontWeight="600"
                        color={textColor}
                        textTransform="uppercase"
                        letterSpacing="0.5px"
                      >
                        {t('proposalDoc.modifications')}
                      </Text>
                      {!readOnly && (
                        <Icon as={Trash}
                          cursor="pointer"
                          color="red.400"
                          onClick={() => handleDeleteModification(idx, modIdx)}
                        />
                      )}
                    </Flex>
                    <Flex
                      justify="space-between"
                      fontSize="14px"
                      mb="0.25rem"
                    >
                      <Text>{mod.name || t('proposalUI.mod.unnamed')}</Text>
                      {(() => {
                        const details = buildSelectedOptionsText(mod?.selectedOptions)
                        return details ? <Text opacity={0.7}> — {details}</Text> : null
                      })()}
                      <Text>{t('common.qty', 'Qty')}: {mod.qty}</Text>
                    </Flex>
                    <Flex
                      justify="space-between"
                      fontSize="14px"
                      mb={0}
                    >
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
      </Box>
      </Box>
    </Box>
  )
}

export default CatalogTableEdit
