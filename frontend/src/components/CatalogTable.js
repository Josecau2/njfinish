import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { getContrastColor } from '../utils/colorUtils'
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
      <CModal visible={showTypeModal} onClose={() => setShowTypeModal(false)} size="lg">
        <PageHeader 
          title={selectedTypeInfo?.type || 'Type Specifications'}
          onClose={() => setShowTypeModal(false)}
        />
        <CModalBody className="p-3 p-md-4">
          {selectedTypeInfo ? (
            <div className="d-flex flex-column flex-md-row gap-4">
              <div className="text-center text-md-start border rounded p-3 bg-light" style={{ width: '100%', maxWidth: '220px', margin: '0 auto' }}>
                <img
                  src={selectedTypeInfo.image ? `${api_url}/uploads/types/${selectedTypeInfo.image}` : '/images/nologo.png'}
                  alt={selectedTypeInfo.type}
                  className="img-fluid"
                  style={{ 
                    maxWidth: '100%', 
                    height: 'auto', 
                    maxHeight: '200px', 
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
      <div className="table-responsive table-responsive-md">
        <CTable>
          <CTableHead>
            <CTableRow>
              <CTableHeaderCell>{t('proposalColumns.no')}</CTableHeaderCell>
              <CTableHeaderCell>{t('proposalColumns.qty')}</CTableHeaderCell>
              <CTableHeaderCell>{t('proposalColumns.item')}</CTableHeaderCell>
              <CTableHeaderCell>{t('proposalColumns.hingeSide')}</CTableHeaderCell>
              <CTableHeaderCell>{t('proposalColumns.exposedSide')}</CTableHeaderCell>
              <CTableHeaderCell>{t('proposalColumns.price')}</CTableHeaderCell>
              <CTableHeaderCell>{t('proposalColumns.assemblyCost')}</CTableHeaderCell>
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
              const total = (isUnavailable ? 0 : Number(item.price || 0) * qty) + assemblyFee

              return (
                <React.Fragment key={idx}>
                  <CTableRow>
                    <CTableDataCell>{idx + 1}</CTableDataCell>
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
                      <div className="d-flex align-items-center gap-2">
                        <span>{item.code}</span>
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

                    <CTableDataCell>
                      {assembled ? (
                        <div className="d-flex gap-1">
              {hingeOptions.map((opt) => (
                            <button
                              key={opt}
                              className={`btn btn-sm ${item.hingeSide === opt ? 'btn-light' : 'btn-light'}`}
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
                      ) : (
                        t('common.na')
                      )}
                    </CTableDataCell>

                    <CTableDataCell>
                      {assembled ? (
                        <div className="d-flex gap-1">
              {exposedOptions.map((opt) => (
                            <button
                              key={opt}
                              className={`btn btn-sm ${item.exposedSide === opt ? 'btn-light' : 'btn-light'}`}
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
                      ) : (
                        t('common.na')
                      )}
                    </CTableDataCell>

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
                  {Array.isArray(item.modifications) && item.modifications.length > 0 && (
                    <CTableRow className="table-light">
                      <CTableDataCell colSpan={9} className="fw-bold text-muted">
                        {t('proposalDoc.modifications')}
                      </CTableDataCell>
                    </CTableRow>
                  )}

                  {Array.isArray(item.modifications) && item.modifications.length > 0 && (
                    item.modifications.map((mod, modIdx) => (

                      <CTableRow key={`mod-${idx}-${modIdx}`} className="table-secondary">
                        <CTableDataCell>-</CTableDataCell>
                        <CTableDataCell>{mod.qty}</CTableDataCell>

                        <CTableDataCell colSpan={3}>
                          {mod.name || t('proposalUI.mod.unnamed')}
                        </CTableDataCell>
                        <CTableDataCell>
                          {formatPrice(mod.price || 0)}
                        </CTableDataCell>
                        <CTableDataCell>
                          -
                        </CTableDataCell>
                        <CTableDataCell>
                          {formatPrice((mod.price || 0) * (mod.qty || 1))}
                        </CTableDataCell>
                        <CTableDataCell>
                          <CIcon
                            icon={cilTrash}
                            style={{ cursor: 'pointer', color: 'red' }}
                            onClick={() => handleDeleteModification(idx, modIdx)}
                          />
                        </CTableDataCell>
                      </CTableRow>
                    ))
                  )}
                </React.Fragment>
              )
            })}
          </CTableBody>
        </CTable>
      </div>

      {/* Mobile Card View */}
      <div className="mobile-card-view d-none">
        {displayItems.map((item, idx) => {
          const assembled = !!isAssembled
          const qty = Number(item.qty || 1)
          const isUnavailable = !!item.unavailable
          const unitAssembly = assembled ? Number(item.assemblyFee || 0) : 0
          const assemblyFee = isUnavailable ? 0 : unitAssembly * qty
          const total = (isUnavailable ? 0 : Number(item.price || 0) * qty) + assemblyFee

          return (
            <React.Fragment key={`mobile-${idx}`}>
              <div className="item-card-mobile">
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
                  <div className="d-flex align-items-center gap-2">
                    <span className={`item-value item-code ${isUnavailable ? 'text-danger text-decoration-line-through' : ''}`}>{item.code}</span>
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
                    <div className="item-detail-row">
                      <span className="item-label">{t('proposalColumns.hingeSide')}</span>
                      <div className="btn-group-mobile">
                        {hingeOptions.map((opt) => (
                          <button
                            key={opt}
                            className={`btn ${item.hingeSide === opt ? 'btn-outline-secondary' : 'btn-outline-secondary'}`}
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

                    <div className="item-detail-row">
                      <span className="item-label">{t('proposalColumns.exposedSide')}</span>
                      <div className="btn-group-mobile">
                        {exposedOptions.map((opt) => (
                          <button
                            key={opt}
                            className={`btn ${item.exposedSide === opt ? 'btn-outline-secondary' : 'btn-outline-secondary'}`}
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

                    <div className="item-detail-row">
                      <span className="item-label">{t('proposalColumns.assemblyCost')}</span>
                      <span className={`item-value ${isUnavailable ? 'text-danger text-decoration-line-through' : ''}`}>{formatPrice(assemblyFee)}</span>
                    </div>
                  </>
                )}

                <div className={`total-highlight ${isUnavailable ? 'text-danger text-decoration-line-through' : ''}`}>
                  <strong>{t('proposalColumns.total')}: {formatPrice(total)}</strong>
                </div>
              </div>

              {/* Mobile Modification Cards */}
              {Array.isArray(item.modifications) && item.modifications.length > 0 && (
                item.modifications.map((mod, modIdx) => (
                  <div key={`mobile-mod-${idx}-${modIdx}`} className="modification-card-mobile">
                    <div className="mod-header">
                      <span className="mod-label">{t('proposalDoc.modifications')}</span>
                      <CIcon
                        icon={cilTrash}
                        style={{ cursor: 'pointer', color: 'var(--cui-danger)' }}
                        onClick={() => handleDeleteModification(idx, modIdx)}
                      />
                    </div>
                    <div className="mod-detail">
                      <span>{mod.name || t('proposalUI.mod.unnamed')}</span>
                      <span>Qty: {mod.qty}</span>
                    </div>
                    <div className="mod-detail">
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
