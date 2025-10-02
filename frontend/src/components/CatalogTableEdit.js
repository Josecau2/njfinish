import StandardCard from './StandardCard'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { getContrastColor } from '../utils/colorUtils'
import { Checkbox, Input, InputGroup, Modal, ModalBody, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalFooter, Icon, Table, Thead, Tbody, Tr, Th, Td } from '@chakra-ui/react'
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

  const headerBg = customization.headerBg || '#667eea'
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
    <div className="mt-5 mb-5">
      {/* Detailed type info modal */}
      <Modal
        isOpen={showTypeModal}
        onClose={() => setShowTypeModal(false)}
        size="xl"
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
          <ModalCloseButton />
          <ModalBody className="p-3 p-md-4">
          {selectedTypeInfo ? (
            <div className="d-flex flex-column flex-md-row gap-4">
              <div
                className="text-center text-md-start border rounded p-3 bg-light"
                style={{ width: '100%', maxWidth: '520px', margin: '0 auto' }}
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
                    background: '#ffffff',
                    borderRadius: '6px',
                    border: '1px solid #dee2e6',
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
              </div>
              <div className="flex-grow-1 border rounded p-3 bg-light" style={{ minWidth: 0 }}>
                <div className="mb-3">
                  <span className="badge text-bg-secondary me-2">{t('Type')}</span>
                  <strong style={{ fontSize: "lg" }}>{selectedTypeInfo.type}</strong>
                </div>
                {selectedTypeInfo.code && (
                  <div className="mb-2 border-bottom pb-2">
                    <span className="text-muted fw-medium">Code:</span>{' '}
                    <strong>{selectedTypeInfo.code}</strong>
                  </div>
                )}
                {selectedTypeInfo.name && (
                  <div className="mb-2 border-bottom pb-2">
                    <span className="text-muted fw-medium">Name:</span>{' '}
                    <strong>{selectedTypeInfo.name}</strong>
                  </div>
                )}
                {selectedTypeInfo.shortName && (
                  <div className="mb-3 border-bottom pb-2">
                    <span className="text-muted fw-medium">Short:</span>{' '}
                    <strong>{selectedTypeInfo.shortName}</strong>
                  </div>
                )}
                <div
                  className="mt-3"
                  style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: "md" }}
                >
                  <strong className="text-muted d-block mb-2">Description:</strong>
                  {selectedTypeInfo.longDescription ||
                    selectedTypeInfo.description ||
                    t('No description available for this type.')}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-muted text-center p-4 border rounded bg-light">
              {t('No type information available.')}
            </div>
          )}

          </ModalBody>
          <ModalFooter>
            <div className="d-block d-md-none mt-2 text-center w-100">
              <button
                type="button"
                className="btn btn-dark btn-lg shadow-sm w-100"
                onClick={() => setShowTypeModal(false)}
                style={{
                  minWidth: '140px',
                  borderRadius: '8px',
                  fontWeight: '500',
                }}
              >
                Close
              </button>
            </div>
          </ModalFooter>
        </ModalContent>
      </Modal>
      {/* Controls - align with create (adds catalog-controls-mobile for responsive) */}
      <div className="d-flex flex-wrap gap-3 align-items-center justify-content-between mb-4 catalog-controls-mobile">
        {!readOnly && (
          <div
            className="position-relative flex-grow-1"
            style={{ minWidth: '200px', maxWidth: '600px' }}
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
              <div
                className="dropdown-menu show w-100"
                style={{ maxHeight: '260px', overflowY: 'auto' }}
              >
                {filteredOptions.map((item) => (
                  <div
                    key={item.id}
                    className="dropdown-item-wrapper d-flex justify-content-between align-items-center"
                    style={{ padding: '0.25rem' }}
                  >
                    <button
                      type="button"
                      className="dropdown-item text-wrap flex-grow-1 border-0 bg-transparent text-start"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => pickItem(item)}
                      style={{ padding: '0.25rem 0.75rem' }}
                    >
                      <strong>{item.code}</strong> — {item.description}
                    </button>
                    {hasTypeMetadata(getItemType(item)) && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-info ms-2"
                        style={{ fontSize: "xs", padding: '0.1rem 0.3rem', flexShrink: 0 }}
                        onClick={(e) => {
                          e.stopPropagation()
                          openTypeModal(getItemType(item))
                        }}
                        title={`View ${getItemType(item)} specifications`}
                      >
                        Specs
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="d-flex flex-wrap align-items-center gap-3 flex-shrink-0">
          {!readOnly && (
            <>
              <Checkbox
                label={<span style={{ fontSize: "md" }}>{t('proposalUI.addOnTop')}</span>}
                checked={addOnTop}
                onChange={(e) => setAddOnTop(e.target.checked)}
                style={{ transform: 'scale(1.1)' }}
              />
              <div className="d-flex align-items-center gap-2">
                <Icon as={Copy} style={{ cursor: 'pointer' }} onClick={handleCopy} />
                <span style={{ fontWeight: 'bold', fontSize: "md" }}>{t('proposalUI.copy')}</span>
              </div>
              <Checkbox
                label={<span style={{ fontSize: "md" }}>{t('proposalUI.group')}</span>}
                checked={groupEnabled}
                onChange={(e) => setGroupEnabled(e.target.checked)}
                style={{ transform: 'scale(1.1)' }}
              />
            </>
          )}
        </div>

        {!readOnly && (
          <div
            className="flex-shrink-0"
            style={{ minWidth: '200px', maxWidth: '240px', width: '100%' }}
          >
            <InputGroup>
              <Input
                placeholder={t('proposalUI.findInCart')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>
          </div>
        )}
      </div>

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
                ? { color: '#b00020', textDecoration: 'line-through' }
                : undefined
              return (
                <React.Fragment key={idx}>
                  <Tr
                    className={item.unavailable ? 'table-danger' : ''}
                    style={{
                      backgroundColor: item.unavailable
                        ? undefined
                        : idx % 2 === 0
                          ? '#fbfdff'
                          : '#ffffff',
                      borderBottom: '2px solid #e6ebf1',
                      ...(idx === 0 ? { borderTop: '2px solid #e6ebf1' } : {}),
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
                          fontSize: "md",
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
                        disabled={readOnly}
                      />
                    </Td>

                    <Td style={rowStyle}>
                      <div className="d-flex align-items-center gap-2" style={{ minWidth: 0 }}>
                        <div
                          className="d-flex align-items-baseline gap-2 flex-wrap"
                          style={{ minWidth: 0 }}
                        >
                          <strong>{item.code}</strong>
                          {item?.description ? (
                            <span
                              className="text-muted text-truncate"
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
                            </span>
                          ) : null}
                        </div>
                        {hasTypeMetadata(getItemType(item)) && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-info"
                            style={{ fontSize: "xs", padding: '0.15rem 0.4rem' }}
                            onClick={() => openTypeModal(getItemType(item))}
                            title={`View ${getItemType(item)} specifications`}
                          >
                            Specs
                          </button>
                        )}
                      </div>
                    </Td>

                    {subTypeRequirements.requiresHinge && (
                      <Td
                        style={{
                          backgroundColor:
                            subTypeRequirements.itemRequirements[idx]?.requiresHinge &&
                            (!item.hingeSide || item.hingeSide === '-')
                              ? '#ffebee'
                              : 'transparent',
                        }}
                      >
                        {assembled ? (
                          <div>
                            {subTypeRequirements.itemRequirements[idx]?.requiresHinge &&
                              (!item.hingeSide || item.hingeSide === '-') && (
                                <div
                                  className="text-danger mb-1"
                                  style={{ fontSize: "xs", fontWeight: 'bold' }}
                                >
                                  {t('validation.selectHingeSide', {
                                    defaultValue: 'Select hinge side',
                                  })}
                                </div>
                              )}
                            <div className="d-flex gap-1">
                              {hingeOptions.map((opt) => (
                                <button
                                  key={opt}
                                  type="button"
                                  className={`btn btn-sm ${item.hingeSide === opt ? 'btn-primary' : 'btn-outline-secondary'}`}
                                  style={{
                                    ...(item.hingeSide === opt
                                      ? {
                                          background: headerBg,
                                          color: textColor,
                                          border: `1px solid ${headerBg}`,
                                        }
                                      : {}),
                                    ...(readOnly ? { pointerEvents: 'none', opacity: 0.6 } : {}),
                                  }}
                                  onClick={() => !readOnly && updateHingeSide(idx, opt)}
                                  disabled={readOnly}
                                >
                                  {codeToLabel(opt)}
                                </button>
                              ))}
                            </div>
                          </div>
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
                              ? '#ffebee'
                              : 'transparent',
                        }}
                      >
                        {assembled ? (
                          <div>
                            {subTypeRequirements.itemRequirements[idx]?.requiresExposed &&
                              (!item.exposedSide || item.exposedSide === '-') && (
                                <div
                                  className="text-danger mb-1"
                                  style={{ fontSize: "xs", fontWeight: 'bold' }}
                                >
                                  {t('validation.selectExposedSide', {
                                    defaultValue: 'Select exposed finished side',
                                  })}
                                </div>
                              )}
                            <div className="d-flex gap-1">
                              {exposedOptions.map((opt) => (
                                <button
                                  key={opt}
                                  type="button"
                                  className={`btn btn-sm ${item.exposedSide === opt ? 'btn-primary' : 'btn-outline-secondary'}`}
                                  style={{
                                    ...(item.exposedSide === opt
                                      ? {
                                          background: headerBg,
                                          color: textColor,
                                          border: `1px solid ${headerBg}`,
                                        }
                                      : {}),
                                    ...(readOnly ? { pointerEvents: 'none', opacity: 0.6 } : {}),
                                  }}
                                  onClick={() => !readOnly && updateExposedSide(idx, opt)}
                                  disabled={readOnly}
                                >
                                  {codeToLabel(opt)}
                                </button>
                              ))}
                            </div>
                          </div>
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
                        <span className="text-muted">{formatPrice(0)}</span>
                      )}
                    </Td>

                    <Td>{formatPrice(modsTotal)}</Td>
                    <Td style={rowStyle}>
                      {formatPrice(item.unavailable ? 0 : total)}
                    </Td>

                    <Td>
                      <div className="d-flex align-items-center">
                        {!readOnly && (
                          <>
                            <Icon as={Settings}
                              style={{ cursor: 'pointer', color: 'black', marginRight: '16px' }}
                              onClick={() => handleOpenModificationModal(idx, item.id)}
                            />
                            <Icon as={Trash}
                              style={{ cursor: 'pointer', color: 'red' }}
                              onClick={() => handleDelete(idx)}
                            />
                          </>
                        )}
                      </div>
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
                                fontSize: "sm",
                                borderTop: `2px solid ${headerBg}`,
                                borderLeft: `6px solid ${headerBg}`,
                                borderTopLeftRadius: '6px',
                                borderTopRightRadius: '6px',
                                boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)',
                              }}
                            >
                              <Icon
                                as={Wrench}
                                className="me-2"
                                style={{ fontSize: "sm", color: textColor }}
                              />
                              <span className="fw-bold">{t('proposalDoc.modifications')}</span>
                            </Td>
                          </Tr>
                          {groupKeys.map((gkey, gi) => (
                            <React.Fragment key={`modgrp-${idx}-${gkey}`}>
                              <Tr
                                className="modification-category"
                                style={{ backgroundColor: '#f1f3f5' }}
                              >
                                <Td
                                  colSpan={10}
                                  className="fw-semibold text-secondary"
                                  style={{
                                    paddingLeft: '72px',
                                    fontSize: "sm",
                                    borderLeft: `6px solid ${headerBg}`,
                                    borderBottom: '1px solid #dee2e6',
                                  }}
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
                                        backgroundColor: '#fcfcfd',
                                        borderLeft: `6px solid ${headerBg}`,
                                        fontSize: "sm",
                                        borderBottom: isLastRow
                                          ? `2px solid ${headerBg}`
                                          : '1px solid #e9ecef',
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
                                      <Td colSpan={3} style={{ paddingLeft: '8px' }}>
                                        <div className="d-flex align-items-center flex-wrap gap-2">
                                          <span
                                            className="shadow-sm"
                                            style={{
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              padding: '2px 10px',
                                              borderRadius: '9999px',
                                              backgroundColor: '#f3f5f7',
                                              border: `1px solid ${headerBg}`,
                                              color: '#212529',
                                              fontWeight: 600,
                                              lineHeight: 1.2,
                                            }}
                                          >
                                            {mod.name || t('proposalUI.mod.unnamed')}
                                          </span>
                                          {(() => {
                                            const details = buildSelectedOptionsText(
                                              mod?.selectedOptions,
                                            )
                                            return details ? (
                                              <span
                                                className="text-muted"
                                                style={{
                                                  fontSize: "sm",
                                                  padding: '2px 8px',
                                                  borderRadius: '6px',
                                                  background: '#f8f9fa',
                                                  border: '1px dashed #ced4da',
                                                }}
                                              >
                                                {details}
                                              </span>
                                            ) : null
                                          })()}
                                        </div>
                                      </Td>
                                      <Td className="fw-medium text-success">
                                        {formatPrice(mod.price || 0)}
                                      </Td>
                                      <Td style={{ color: "gray.500" }}>
                                        -
                                      </Td>
                                      <Td>
                                        {/* Modifications column (per-item summary) not applicable on sub-rows */}
                                      </Td>
                                      <Td className="fw-semibold text-success">
                                        {formatPrice((mod.price || 0) * (mod.qty || 1))}
                                      </Td>
                                      <Td style={{ textAlign: 'center' }}>
                                        {!readOnly && (
                                          <Icon as={Trash}
                                            style={{
                                              cursor: 'pointer',
                                              color: "red.500",
                                              fontSize: "sm",
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
                                              borderBottom: '1px dashed #cfd4da',
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
            ? { color: '#b00020', textDecoration: 'line-through' }
            : undefined

          return (
            <React.Fragment key={`mobile-${idx}`}>
              <div
                className="item-card-mobile"
                style={{
                  border: '2px solid #e6ebf1',
                  borderRadius: '8px',
                  backgroundColor: idx % 2 === 0 ? '#fbfdff' : '#ffffff',
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
                          fontSize: "lg",
                        }}
                        onClick={() => handleOpenModificationModal(idx, item.id)}
                      />
                      <Icon as={Trash}
                        style={{
                          cursor: 'pointer',
                          color: 'var(--cui-danger)',
                          fontSize: "lg",
                        }}
                        onClick={() => handleDelete(idx)}
                      />
                    </div>
                  )}
                </div>

                <div className="item-detail-row">
                  <span className="item-label">{t('proposalColumns.item')}</span>
                  <div
                    className="d-flex align-items-center gap-2 flex-wrap"
                    style={{ minWidth: 0 }}
                  >
                    <span className="item-value item-code" style={rowStyle}>
                      <strong>{item.code}</strong>
                    </span>
                    {item?.description ? (
                      <span
                        className="text-muted text-truncate"
                        style={{
                          maxWidth: '220px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={item.description}
                      >
                        — {item.description}
                      </span>
                    ) : null}
                    {hasTypeMetadata(getItemType(item)) && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-info"
                        style={{ fontSize: "xs", padding: '0.15rem 0.4rem' }}
                        onClick={() => openTypeModal(getItemType(item))}
                        title={`View ${getItemType(item)} specifications`}
                      >
                        Specs
                      </button>
                    )}
                  </div>
                </div>

                <div className="item-detail-row">
                  <span className="item-label">{t('proposalColumns.qty')}</span>
                  <input
                    type="number"
                    min="1"
                    value={item.qty}
                    onChange={(e) => updateQty(idx, parseInt(e.target.value))}
                    className="qty-input-mobile"
                    disabled={readOnly}
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
                              ? '#ffebee'
                              : 'transparent',
                          padding: '0.5rem',
                          borderRadius: '4px',
                        }}
                      >
                        <span className="item-label">{t('proposalColumns.hingeSide')}</span>
                        {subTypeRequirements.itemRequirements[idx]?.requiresHinge &&
                          (!item.hingeSide || item.hingeSide === '-') && (
                            <div
                              className="text-danger mb-2"
                              style={{ fontSize: "xs", fontWeight: 'bold' }}
                            >
                              {t('validation.selectHingeSide', {
                                defaultValue: 'Select hinge side',
                              })}
                            </div>
                          )}
                        <div className="btn-group-mobile">
                          {hingeOptions.map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              className={`btn ${item.hingeSide === opt ? 'btn-primary' : 'btn-outline-secondary'}`}
                              style={
                                item.hingeSide === opt
                                  ? {
                                      background: headerBg,
                                      color: textColor,
                                      border: `1px solid ${headerBg}`,
                                    }
                                  : {}
                              }
                              onClick={() => !readOnly && updateHingeSide(idx, opt)}
                              disabled={readOnly}
                            >
                              {codeToLabel(opt)}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {subTypeRequirements.requiresExposed && (
                      <div
                        className="item-detail-row"
                        style={{
                          backgroundColor:
                            subTypeRequirements.itemRequirements[idx]?.requiresExposed &&
                            (!item.exposedSide || item.exposedSide === '-')
                              ? '#ffebee'
                              : 'transparent',
                          padding: '0.5rem',
                          borderRadius: '4px',
                        }}
                      >
                        <span className="item-label">{t('proposalColumns.exposedSide')}</span>
                        {subTypeRequirements.itemRequirements[idx]?.requiresExposed &&
                          (!item.exposedSide || item.exposedSide === '-') && (
                            <div
                              className="text-danger mb-2"
                              style={{ fontSize: "xs", fontWeight: 'bold' }}
                            >
                              {t('validation.selectExposedSide', {
                                defaultValue: 'Select exposed finished side',
                              })}
                            </div>
                          )}
                        <div className="btn-group-mobile">
                          {exposedOptions.map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              className={`btn ${item.exposedSide === opt ? 'btn-primary' : 'btn-outline-secondary'}`}
                              style={
                                item.exposedSide === opt
                                  ? {
                                      background: headerBg,
                                      color: textColor,
                                      border: `1px solid ${headerBg}`,
                                    }
                                  : {}
                              }
                              onClick={() => !readOnly && updateExposedSide(idx, opt)}
                              disabled={readOnly}
                            >
                              {codeToLabel(opt)}
                            </button>
                          ))}
                        </div>
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
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
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
                        fontSize: "xs",
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
                          fontSize: "xs",
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
                        fontSize: "sm",
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
                        fontSize: "sm",
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
    </div>
  )
}

export default CatalogTableEdit
