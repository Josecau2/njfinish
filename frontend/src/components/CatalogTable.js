import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { getContrastColor } from '../utils/colorUtils'
import { checkSubTypeRequirements } from '../helpers/subTypeValidation'
import {
  CFormCheck,
  CInputGroup,
  CFormInput,
  CModal,
  CModalBody,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCopy, cilSettings, cilTrash } from '@coreui/icons'
import { BsTools } from 'react-icons/bs'
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
    case 'L': return 'Left'
    case 'R': return 'Right'
    case 'B': return 'Both'
    default: return s
  }
}

const buildSelectedOptionsText = (selectedOptions) => {
  if (!selectedOptions || typeof selectedOptions !== 'object') return ''
  const parts = []
  const numericEntries = Object.entries(selectedOptions).filter(([k, v]) => typeof v === 'number' && isFinite(v))
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
  const displayItems = Array.isArray(items) ? items : (Array.isArray(selectVersion?.items) ? selectVersion.items : []);
  const { t } = useTranslation();
  const customization = useSelector((state) => state.customization);

  const headerBg = customization.headerBg || '#667eea';
  const textColor = getContrastColor(headerBg);

  const [partQuery, setPartQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [typesMeta, setTypesMeta] = useState([]);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [selectedTypeInfo, setSelectedTypeInfo] = useState(null);
  const [subTypeRequirements, setSubTypeRequirements] = useState({
    requiresHinge: false,
    requiresExposed: false,
    itemRequirements: {}
  });
  const hoverTimerRef = useRef(null);
  const searchContainerRef = useRef(null);
  const api_url = import.meta.env.VITE_API_URL;

  // Auth headers are handled by axiosInstance interceptors

  // When the selected style changes, clear the search box and suggestions
  useEffect(() => {
    setPartQuery('');
    setShowSuggestions(false);
  }, [selectedStyleData && selectedStyleData.id]);

  // Handle click outside to close search suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    if (showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showSuggestions]);

  // Fetch types metadata once per manufacturer
  useEffect(() => {
    const manufacturerId = selectVersion?.manufacturerData?.id;
    if (!manufacturerId) { setTypesMeta([]); return; }
    let cancelled = false;
    (async () => {
      try {
        const res = await axiosInstance.get(`/api/manufacturers/${manufacturerId}/types-meta`);
        const data = Array.isArray(res?.data) ? res.data : [];
        if (!cancelled) setTypesMeta(data);
      } catch (err) {
        console.error('Failed to fetch types metadata:', err);
        if (!cancelled) setTypesMeta([]);
      }
    })();
    return () => { cancelled = true; };
  }, [selectVersion?.manufacturerData?.id]);

  // Check sub-type requirements for conditional column display
  useEffect(() => {
    const manufacturerId = selectVersion?.manufacturerData?.id;
    if (!manufacturerId || !displayItems?.length) {
      setSubTypeRequirements({
        requiresHinge: false,
        requiresExposed: false,
        itemRequirements: {}
      });
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const requirements = await checkSubTypeRequirements(displayItems, manufacturerId);
        if (!cancelled) {
          setSubTypeRequirements(requirements);
        }
      } catch (err) {
        console.error('Failed to check sub-type requirements:', err);
        if (!cancelled) {
          setSubTypeRequirements({
            requiresHinge: false,
            requiresExposed: false,
            itemRequirements: {}
          });
        }
      }
    })();
    return () => { cancelled = true; };
  }, [selectVersion?.manufacturerData?.id, displayItems]);

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
      : [];
    const q = (partQuery || '').toLowerCase().trim();
    if (!q) return [];
    return byStyle
      .filter((item) =>
        (item.code && String(item.code).toLowerCase().includes(q)) ||
        (item.description && String(item.description).toLowerCase().includes(q))
      )
      .slice(0, 20);
  }, [catalogData, selectedStyleData?.style, partQuery]);

  // Build quick map for type metadata
  const typeMap = useMemo(() => {
    const m = new Map();
    (typesMeta || []).forEach(t => { if (t?.type) m.set(String(t.type), t); });
    return m;
  }, [typesMeta]);

  // Helper to check if a type has meaningful metadata (image or description)
  const hasTypeMetadata = (type) => {
    if (!type) return false;
    const meta = typeMap.get(String(type));
    return meta && (meta.image || (meta.longDescription || meta.description || '').trim());
  };

  // Helper to open type modal for a specific type
  const openTypeModal = (type) => {
    const meta = typeMap.get(String(type));
    if (meta) {
      setSelectedTypeInfo(meta);
      setShowTypeModal(true);
    }
  };  const pickItem = (item) => {
    if (!item) return;
    // Reuse existing handler contract
    handleCatalogSelect({ target: { value: `${item.code} -- ${item.description}` } });
    setPartQuery('');
    setShowSuggestions(false);
  };
  return (
    <div className="mt-5 mb-5">
      <div className="d-flex flex-wrap gap-3 align-items-center justify-content-between mb-4 catalog-controls-mobile">
        <div className="position-relative flex-grow-1" style={{ minWidth: '200px', maxWidth: '600px' }} ref={searchContainerRef}>
          <CInputGroup>
            <CFormInput
              placeholder={t('proposalUI.enterPartCode')}
              value={partQuery}
              onChange={(e) => { setPartQuery(e.target.value); setShowSuggestions(true); }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={(e) => { if (e.key === 'Enter' && filteredOptions[0]) { e.preventDefault(); pickItem(filteredOptions[0]); } }}
            />
          </CInputGroup>
          {showSuggestions && filteredOptions.length > 0 && (
            <div className="dropdown-menu show w-100" style={{ maxHeight: '260px', overflowY: 'auto' }}>
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
                  {hasTypeMetadata(item.type) && (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-info ms-2"
                      style={{ fontSize: '0.65rem', padding: '0.1rem 0.3rem', flexShrink: 0 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        openTypeModal(item.type);
                      }}
                      title={`View ${item.type} specifications`}
                    >
                      Specs
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="d-flex flex-wrap align-items-center gap-3 flex-shrink-0">
          <CFormCheck
            label={<span style={{ fontSize: '1rem' }}>{t('proposalUI.addOnTop')}</span>}
            checked={addOnTop}
            onChange={(e) => setAddOnTop(e.target.checked)}
            style={{ transform: 'scale(1.1)' }}
          />

          <div className="d-flex align-items-center gap-2">
            <CIcon icon={cilCopy} style={{ cursor: 'pointer' }} onClick={handleCopy} />
            <span style={{ fontWeight: 'bold', fontSize: '1rem' }}>{t('proposalUI.copy')}</span>
          </div>

          <CFormCheck
            label={<span style={{ fontSize: '1rem' }}>{t('proposalUI.group')}</span>}
            checked={groupEnabled}
            onChange={(e) => setGroupEnabled(e.target.checked)}
            style={{ transform: 'scale(1.1)' }}
          />
        </div>

        <div
          className="flex-shrink-0"
          style={{ minWidth: '200px', maxWidth: '240px', width: '100%' }}
        >
          <CInputGroup>
            <CFormInput
              placeholder={t('proposalUI.findInCart')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </CInputGroup>
        </div>
      </div>

      {/* Detailed type info modal */}
      <CModal
        visible={showTypeModal}
        onClose={() => setShowTypeModal(false)}
        size="xl"
        className="specs-modal"
        alignment="center"
        style={{ '--bs-modal-width': '960px', '--cui-modal-width': '960px' }}
        backdrop={true}
        keyboard={true}
      >
        <PageHeader
          title={selectedTypeInfo?.type || 'Type Specifications'}
          onClose={() => setShowTypeModal(false)}
        />
        <CModalBody className="p-3 p-md-4">
          {selectedTypeInfo ? (
            <div className="d-flex flex-column flex-md-row gap-4">
              <div className="text-center text-md-start border rounded p-3 bg-light" style={{ width: '100%', maxWidth: '520px', margin: '0 auto' }}>
                <img
                  src={selectedTypeInfo.image ? `${api_url}/uploads/types/${selectedTypeInfo.image}` : '/images/nologo.png'}
                  alt={selectedTypeInfo.type}
                  className="img-fluid"
                  style={{
                    maxWidth: '100%',
                    height: 'auto',
                    maxHeight: '455px',
                    objectFit: 'contain',
                    background: '#ffffff',
                    borderRadius: '6px',
                    border: '1px solid #dee2e6'
                  }}
                  onError={(e) => {
                    if (selectedTypeInfo.image && !e.target.dataset.fallbackTried) {
                      e.target.dataset.fallbackTried = '1';
                      e.target.src = `${api_url}/uploads/manufacturer_catalogs/${selectedTypeInfo.image}`;
                    } else {
                      e.target.src = '/images/nologo.png';
                    }
                  }}
                />
              </div>
              <div className="flex-grow-1 border rounded p-3 bg-light" style={{ minWidth: 0 }}>
                <div className="mb-3">
                  <span className="badge text-bg-secondary me-2">{t('Type')}</span>
                  <strong style={{ fontSize: '1.1rem' }}>{selectedTypeInfo.type}</strong>
                </div>
                {selectedTypeInfo.code && (
                  <div className="mb-2 border-bottom pb-2"><span className="text-muted fw-medium">Code:</span> <strong>{selectedTypeInfo.code}</strong></div>
                )}
                {selectedTypeInfo.name && (
                  <div className="mb-2 border-bottom pb-2"><span className="text-muted fw-medium">Name:</span> <strong>{selectedTypeInfo.name}</strong></div>
                )}
                {selectedTypeInfo.shortName && (
                  <div className="mb-3 border-bottom pb-2"><span className="text-muted fw-medium">Short:</span> <strong>{selectedTypeInfo.shortName}</strong></div>
                )}
                <div className="mt-3" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: '0.95rem' }}>
                  <strong className="text-muted d-block mb-2">Description:</strong>
                  {selectedTypeInfo.longDescription || selectedTypeInfo.description || t('No description available for this type.')}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-muted text-center p-4 border rounded bg-light">{t('No type information available.')}</div>
          )}

          {/* Mobile Close Button */}
          <div className="d-block d-md-none mt-4 text-center">
            <button
              type="button"
              className="btn btn-dark btn-lg shadow-sm"
              onClick={() => setShowTypeModal(false)}
              style={{
                minWidth: '140px',
                borderRadius: '8px',
                fontWeight: '500'
              }}
            >
              Close
            </button>
          </div>
        </CModalBody>
      </CModal>

      {/* Desktop Table View */}
  <div className="table-responsive table-responsive-md desktop-only">
        <CTable>
          <CTableHead>
            <CTableRow>
              <CTableHeaderCell>{t('proposalColumns.no')}</CTableHeaderCell>
              <CTableHeaderCell>{t('proposalColumns.qty')}</CTableHeaderCell>
              <CTableHeaderCell>{t('proposalColumns.item')}</CTableHeaderCell>
              {subTypeRequirements.requiresHinge && (
                <CTableHeaderCell style={{ backgroundColor: '#ffebee', color: '#c62828', fontWeight: 'bold' }}>
                  {t('proposalColumns.hingeSide')}
                </CTableHeaderCell>
              )}
              {subTypeRequirements.requiresExposed && (
                <CTableHeaderCell style={{ backgroundColor: '#ffebee', color: '#c62828', fontWeight: 'bold' }}>
                  {t('proposalColumns.exposedSide')}
                </CTableHeaderCell>
              )}
              <CTableHeaderCell>{t('proposalColumns.price')}</CTableHeaderCell>
              <CTableHeaderCell>{t('proposalColumns.assemblyCost')}</CTableHeaderCell>
              <CTableHeaderCell>{t('proposalColumns.modifications', { defaultValue: 'Modifications' })}</CTableHeaderCell>
              <CTableHeaderCell>{t('proposalColumns.total')}</CTableHeaderCell>
              <CTableHeaderCell>{t('proposals.headers.actions')}</CTableHeaderCell>
            </CTableRow>
          </CTableHead>

          <CTableBody>
            {displayItems.map((item, idx) => {
              // Use global assembled toggle only; assembly fee applies automatically when on
              const assembled = !!isAssembled
              const qty = Number(item.qty || 1)
              const isUnavailable = !!item.unavailable
              const unitAssembly = assembled ? Number(item.assemblyFee || 0) : 0
              const assemblyFee = isUnavailable ? 0 : unitAssembly * qty
              const modsTotal = Array.isArray(item.modifications)
                ? item.modifications.reduce((s, m) => s + (Number(m.price || 0) * Number(m.qty || 1)), 0)
                : 0
              const total = (isUnavailable ? 0 : Number(item.price || 0) * qty) + assemblyFee + modsTotal

              return (
                <React.Fragment key={idx}>
                  <CTableRow
                    style={{
                      backgroundColor: idx % 2 === 0 ? '#fbfdff' : '#ffffff',
                      borderBottom: '2px solid #e6ebf1',
                      ...(idx === 0 ? { borderTop: '2px solid #e6ebf1' } : {}),
                    }}
                  >
                    <CTableDataCell style={{ width: '56px' }}>
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
                          fontSize: '0.95rem',
                          letterSpacing: '0.2px'
                        }}
                        title={`Row ${idx + 1}`}
                      >
                        {idx + 1}
                      </span>
                    </CTableDataCell>
                    <CTableDataCell>
                      <CFormInput
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(e) => updateQty(idx, parseInt(e.target.value))}
                        style={{ width: '70px', textAlign: 'center' }}
                      />
                    </CTableDataCell>

                    <CTableDataCell className={isUnavailable ? 'text-danger text-decoration-line-through' : ''}>
                      <div className="d-flex align-items-center gap-2 flex-wrap" style={{ minWidth: 0 }}>
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '320px' }}>
                          <strong>{item.code}</strong>
                          {item.description ? (
                            <span className="text-muted ms-1">— {item.description}</span>
                          ) : null}
                        </span>
                        {(() => {
                          try {
                            const attachmentsCount = Array.isArray(item.modifications)
                              ? item.modifications.reduce((n, m) => n + (Array.isArray(m.attachments) ? m.attachments.length : 0), 0)
                              : 0
                            return attachmentsCount > 0 ? (
                              <span className="badge text-bg-info" title={`${attachmentsCount} attachment${attachmentsCount>1?'s':''}`}>{attachmentsCount}</span>
                            ) : null
                          } catch (_) { return null }
                        })()}
                        {hasTypeMetadata(item.type) && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-info"
                            style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem' }}
                            onClick={() => openTypeModal(item.type)}
                            title={`View ${item.type} specifications`}
                          >
                            Specs
                          </button>
                        )}
                      </div>
                    </CTableDataCell>

                    {subTypeRequirements.requiresHinge && (
                      <CTableDataCell
                        style={{
                          backgroundColor: subTypeRequirements.itemRequirements[idx]?.requiresHinge && (!item.hingeSide || item.hingeSide === '-')
                            ? '#ffebee'
                            : 'transparent'
                        }}
                      >
                        {assembled ? (
                          <div>
                            {subTypeRequirements.itemRequirements[idx]?.requiresHinge && (!item.hingeSide || item.hingeSide === '-') && (
                              <div className="text-danger mb-1" style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>
                                {t('validation.selectHingeSide', { defaultValue: 'Select hinge side' })}
                              </div>
                            )}
                            <div className="d-flex gap-1">
                              {hingeOptions.map((opt) => (
                                <button
                                  key={opt}
                                  type="button"
                                  className={`btn btn-sm ${item.hingeSide === opt ? 'btn-primary' : 'btn-outline-secondary'}`}
                                  style={item.hingeSide === opt ? {
                                    background: headerBg,
                                    color: textColor,
                                    border: `1px solid ${headerBg}`
                                  } : {}}
                                  onClick={() => updateHingeSide(idx, opt)}
                                >
                                  {codeToLabel(opt)}
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : (
                          t('common.na')
                        )}
                      </CTableDataCell>
                    )}

                    {subTypeRequirements.requiresExposed && (
                      <CTableDataCell
                        style={{
                          backgroundColor: subTypeRequirements.itemRequirements[idx]?.requiresExposed && (!item.exposedSide || item.exposedSide === '-')
                            ? '#ffebee'
                            : 'transparent'
                        }}
                      >
                        {assembled ? (
                          <div>
                            {subTypeRequirements.itemRequirements[idx]?.requiresExposed && (!item.exposedSide || item.exposedSide === '-') && (
                              <div className="text-danger mb-1" style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>
                                {t('validation.selectExposedSide', { defaultValue: 'Select exposed finished side' })}
                              </div>
                            )}
                            <div className="d-flex gap-1">
                              {exposedOptions.map((opt) => (
                                <button
                                  key={opt}
                                  type="button"
                                  className={`btn btn-sm ${item.exposedSide === opt ? 'btn-primary' : 'btn-outline-secondary'}`}
                                  style={item.exposedSide === opt ? {
                                    background: headerBg,
                                    color: textColor,
                                    border: `1px solid ${headerBg}`
                                  } : {}}
                                  onClick={() => updateExposedSide(idx, opt)}
                                >
                                  {codeToLabel(opt)}
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : (
                          t('common.na')
                        )}
                      </CTableDataCell>
                    )}

                    <CTableDataCell className={isUnavailable ? 'text-danger text-decoration-line-through' : ''}>
                      {isUnavailable ? formatPrice(0) : formatPrice(item.price)}
                    </CTableDataCell>

                    <CTableDataCell>
                      {assembled ? (
                        <span>{formatPrice(assemblyFee)}</span>
                      ) : (
                        <span className="text-muted">{formatPrice(0)}</span>
                      )}
                    </CTableDataCell>

                    <CTableDataCell>{formatPrice(modsTotal)}</CTableDataCell>

                    <CTableDataCell className={isUnavailable ? 'text-danger text-decoration-line-through' : ''}>{formatPrice(total)}</CTableDataCell>

                    <CTableDataCell>
                      <div className="d-flex align-items-center">
                        <CIcon
                          icon={cilSettings}
                          style={{ cursor: 'pointer', color: 'black', marginRight: '16px' }}
                          onClick={() => handleOpenModificationModal(idx, item.id)}
                        />
                        <CIcon
                          icon={cilTrash}
                          style={{ cursor: 'pointer', color: 'red' }}
                          onClick={() => handleDelete(idx)}
                        />
                      </div>
                    </CTableDataCell>
                  </CTableRow>
                  {Array.isArray(item.modifications) && item.modifications.length > 0 && (() => {
                    const groups = item.modifications.reduce((acc, m) => {
                      const key = m.categoryName || 'Other';
                      acc[key] = acc[key] || [];
                      acc[key].push(m);
                      return acc;
                    }, {});
                    const groupKeys = Object.keys(groups);
                    return (
                      <>
                        <CTableRow className="modification-header">
                          <CTableDataCell
                            colSpan={10}
                            style={{
                              backgroundColor: headerBg,
                              color: textColor,
                              padding: '8px 16px',
                              paddingLeft: '56px',
                              fontSize: '0.9rem',
                              borderTop: `2px solid ${headerBg}`,
                              borderLeft: `6px solid ${headerBg}`,
                              borderTopLeftRadius: '6px',
                              borderTopRightRadius: '6px',
                              boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)'
                            }}
                          >
                            <BsTools className="me-2" style={{ fontSize: '14px', color: textColor }} />
                            <span className="fw-bold">{t('proposalDoc.modifications')}</span>
                          </CTableDataCell>
                        </CTableRow>
                        {groupKeys.map((gkey, gi) => (
                          <React.Fragment key={`modgrp-${idx}-${gkey}`}>
                            <CTableRow className="modification-category" style={{ backgroundColor: '#f1f3f5' }}>
                              <CTableDataCell colSpan={10} className="fw-semibold text-secondary" style={{ paddingLeft: '72px', fontSize: '0.85rem', borderLeft: `6px solid ${headerBg}`, borderBottom: '1px solid #dee2e6' }}>
                                📂 {gkey}
                              </CTableDataCell>
                            </CTableRow>
                            {groups[gkey].map((mod, modIdx) => {
                              const isLastRow = gi === groupKeys.length - 1 && modIdx === groups[gkey].length - 1;
                              return (
                                <React.Fragment key={`mod-${idx}-${gkey}-${modIdx}`}>
                                  <CTableRow className="modification-item" style={{
                                    backgroundColor: '#fcfcfd',
                                    borderLeft: `6px solid ${headerBg}`,
                                    fontSize: '0.9rem',
                                    borderBottom: isLastRow ? `2px solid ${headerBg}` : '1px solid #e9ecef'
                                  }}>
                                    <CTableDataCell style={{ paddingLeft: '88px', color: '#6c757d' }}>↳</CTableDataCell>
                                    <CTableDataCell style={{ fontWeight: '500' }}>{mod.qty}</CTableDataCell>
                                    <CTableDataCell colSpan={3} style={{ paddingLeft: '8px' }}>
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
                                            lineHeight: 1.2
                                          }}
                                        >
                                          {mod.name || t('proposalUI.mod.unnamed')}
                                        </span>
                                        {(() => {
                                          const details = buildSelectedOptionsText(mod?.selectedOptions)
                                          return details ? (
                                            <span
                                              className="text-muted"
                                              style={{
                                                fontSize: '0.8rem',
                                                padding: '2px 8px',
                                                borderRadius: '6px',
                                                background: '#f8f9fa',
                                                border: '1px dashed #ced4da'
                                              }}
                                            >
                                              {details}
                                            </span>
                                          ) : null
                                        })()}
                                      </div>
                                      {Array.isArray(mod.attachments) && mod.attachments.length > 0 && (
                                        <div className="mt-1 d-flex flex-wrap gap-1">
                                          {mod.attachments.slice(0, 3).map((att, ai) => (
                                            <a key={ai} href={att.url} target="_blank" rel="noreferrer" className="badge text-bg-info text-decoration-none" title={att.name || 'Attachment'} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                              {String(att.mimeType || '').startsWith('image/') ? (
                                                <img src={att.url} alt={att.name || 'img'} style={{ width: 18, height: 18, objectFit: 'cover', borderRadius: 2 }} />
                                              ) : null}
                                              <span style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{att.name || 'File'}</span>
                                            </a>
                                          ))}
                                          {mod.attachments.length > 3 && (
                                            <span className="badge text-bg-secondary">+{mod.attachments.length - 3}</span>
                                          )}
                                        </div>
                                      )}
                                    </CTableDataCell>
                                    <CTableDataCell className="fw-medium text-success">{formatPrice(mod.price || 0)}</CTableDataCell>
                                    <CTableDataCell style={{ color: '#6c757d' }}>-</CTableDataCell>
                                    <CTableDataCell>{/* Modifications column (per-item summary) not applicable on sub-rows */}</CTableDataCell>
                                    <CTableDataCell className="fw-semibold text-success">{formatPrice((mod.price || 0) * (mod.qty || 1))}</CTableDataCell>
                                    <CTableDataCell style={{ textAlign: 'center' }}>
                                      <CIcon icon={cilTrash} style={{ cursor: 'pointer', color: '#dc3545', fontSize: '14px' }} onClick={() => handleDeleteModification(idx, modIdx)} title="Remove modification" />
                                    </CTableDataCell>
                                  </CTableRow>
                                  {isLastRow && (
                                    <CTableRow>
                                      <CTableDataCell colSpan={10} style={{ padding: 0 }}>
                                        <div style={{ height: '10px', borderBottom: '1px dashed #cfd4da' }} />
                                      </CTableDataCell>
                                    </CTableRow>
                                  )}
                                </React.Fragment>
                              )
                            })}
                          </React.Fragment>
                        ))}
                      </>
                    );
                  })()}
                </React.Fragment>
              )
            })}
          </CTableBody>
        </CTable>
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
            ? item.modifications.reduce((s, m) => s + (Number(m.price || 0) * Number(m.qty || 1)), 0)
            : 0
          const total = (isUnavailable ? 0 : Number(item.price || 0) * qty) + assemblyFee + modsTotal

          return (
            <React.Fragment key={`mobile-${idx}`}>
              <div
                className="item-card-mobile"
                style={{
                  border: '2px solid #e6ebf1',
                  borderRadius: '8px',
                  backgroundColor: idx % 2 === 0 ? '#fbfdff' : '#ffffff',
                  marginBottom: '12px'
                }}
              >
                <div className="item-header">
                  <div className="item-number">{idx + 1}</div>
                  <div className="item-actions">
                    <CIcon
                      icon={cilSettings}
                      style={{ cursor: 'pointer', color: 'var(--cui-primary)', fontSize: '1.2rem' }}
                      onClick={() => handleOpenModificationModal(idx, item.id)}
                    />
                    <CIcon
                      icon={cilTrash}
                      style={{ cursor: 'pointer', color: 'var(--cui-danger)', fontSize: '1.2rem' }}
                      onClick={() => handleDelete(idx)}
                    />
                  </div>
                </div>

                <div className="item-detail-row">
                  <span className="item-label">{t('proposalColumns.item')}</span>
                  <div className="d-flex align-items-center gap-2" style={{ minWidth: 0 }}>
                    <span className={`item-value item-code ${isUnavailable ? 'text-danger text-decoration-line-through' : ''}`} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <strong>{item.code}</strong>
                      {item.description ? (
                        <span className="text-muted ms-1">— {item.description}</span>
                      ) : null}
                    </span>
                    {hasTypeMetadata(item.type) && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-info"
                        style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem' }}
                        onClick={() => openTypeModal(item.type)}
                        title={`View ${item.type} specifications`}
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
                  />
                </div>

                <div className="item-detail-row">
                  <span className="item-label">{t('proposalColumns.price')}</span>
                  <span className={`item-value ${isUnavailable ? 'text-danger text-decoration-line-through' : ''}`}>{isUnavailable ? formatPrice(0) : formatPrice(item.price)}</span>
                </div>

                {assembled && (
                  <>
                    {subTypeRequirements.requiresHinge && (
                      <div className="item-detail-row" style={{
                        backgroundColor: subTypeRequirements.itemRequirements[idx]?.requiresHinge && (!item.hingeSide || item.hingeSide === '-')
                          ? '#ffebee'
                          : 'transparent',
                        padding: '0.5rem',
                        borderRadius: '4px'
                      }}>
                        <span className="item-label">{t('proposalColumns.hingeSide')}</span>
                        {subTypeRequirements.itemRequirements[idx]?.requiresHinge && (!item.hingeSide || item.hingeSide === '-') && (
                          <div className="text-danger mb-2" style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>
                            {t('validation.selectHingeSide', { defaultValue: 'Select hinge side' })}
                          </div>
                        )}
                        <div className="btn-group-mobile">
                          {hingeOptions.map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              className={`btn ${item.hingeSide === opt ? 'btn-primary' : 'btn-outline-secondary'}`}
                              style={item.hingeSide === opt ? {
                                background: headerBg,
                                color: textColor,
                                border: `1px solid ${headerBg}`
                              } : {}}
                              onClick={() => updateHingeSide(idx, opt)}
                            >
                              {codeToLabel(opt)}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {subTypeRequirements.requiresExposed && (
                      <div className="item-detail-row" style={{
                        backgroundColor: subTypeRequirements.itemRequirements[idx]?.requiresExposed && (!item.exposedSide || item.exposedSide === '-')
                          ? '#ffebee'
                          : 'transparent',
                        padding: '0.5rem',
                        borderRadius: '4px'
                      }}>
                        <span className="item-label">{t('proposalColumns.exposedSide')}</span>
                        {subTypeRequirements.itemRequirements[idx]?.requiresExposed && (!item.exposedSide || item.exposedSide === '-') && (
                          <div className="text-danger mb-2" style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>
                            {t('validation.selectExposedSide', { defaultValue: 'Select exposed finished side' })}
                          </div>
                        )}
                        <div className="btn-group-mobile">
                          {exposedOptions.map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              className={`btn ${item.exposedSide === opt ? 'btn-primary' : 'btn-outline-secondary'}`}
                              style={item.exposedSide === opt ? {
                                background: headerBg,
                                color: textColor,
                                border: `1px solid ${headerBg}`
                              } : {}}
                              onClick={() => updateExposedSide(idx, opt)}
                            >
                              {codeToLabel(opt)}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="item-detail-row">
                      <span className="item-label">{t('proposalColumns.assemblyCost')}</span>
                      <span className={`item-value ${isUnavailable ? 'text-danger text-decoration-line-through' : ''}`}>{formatPrice(assemblyFee)}</span>
                    </div>
                  </>
                )}

                {/* Modifications summary on mobile */}
                <div className="item-detail-row">
                  <span className="item-label">{t('proposalColumns.modifications', { defaultValue: 'Modifications' })}</span>
                  <span className="item-value">{formatPrice(modsTotal)}</span>
                </div>

                <div className={`total-highlight ${isUnavailable ? 'text-danger text-decoration-line-through' : ''}`}>
                  <strong>{t('proposalColumns.total')}: {formatPrice(total)}</strong>
                </div>
              </div>

              {/* Mobile Modification Cards */}
              {Array.isArray(item.modifications) && item.modifications.length > 0 && (
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
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  >
                    {/* Item indicator badge */}
                    <div style={{
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
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      border: `2px solid ${headerBg}`
                    }}>
                      {idx + 1}
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.5rem'
                    }}>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: textColor,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>{t('proposalDoc.modifications')}</span>
                      <CIcon
                        icon={cilTrash}
                        style={{ cursor: 'pointer', color: 'var(--cui-danger)' }}
                        onClick={() => handleDeleteModification(idx, modIdx)}
                      />
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.875rem',
                      marginBottom: '0.25rem'
                    }}>
                      <span>{mod.name || t('proposalUI.mod.unnamed')}</span>
                      {(() => {
                        const details = buildSelectedOptionsText(mod?.selectedOptions)
                        return details ? (
                          <span style={{ opacity: 0.7 }}> — {details}</span>
                        ) : null
                      })()}
                      <span>Qty: {mod.qty}</span>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.875rem',
                      marginBottom: '0'
                    }}>
                      <span>{t('proposalColumns.price')}: {formatPrice(mod.price || 0)}</span>
                      <span><strong>{t('proposalColumns.total')}: {formatPrice((mod.price || 0) * (mod.qty || 1))}</strong></span>
                    </div>
                  </div>
                ))
              )}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}

export default CatalogTable
