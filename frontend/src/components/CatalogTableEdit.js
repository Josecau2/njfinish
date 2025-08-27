import React, { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { getContrastColor } from '../utils/colorUtils'
import {
  CFormCheck,
  CInputGroup,
  CFormInput,
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

const hingeOptions = ['L', 'R', '-']
const exposedOptions = ['L', 'R', 'B', '-']

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
  readOnly = false,
}) => {
  const { t } = useTranslation();
  const customization = useSelector((state) => state.customization);
  
  const headerBg = customization.headerBg || '#667eea';
  const textColor = getContrastColor(headerBg);
  
  const [partQuery, setPartQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

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
      ? catalogData.filter((item) =>
          Array.isArray(item.styleVariants) &&
          item.styleVariants.length > 0 &&
          item.style === selectedStyleData?.style
        )
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

  const pickItem = (item) => {
    if (!item) return;
    handleCatalogSelect({ target: { value: `${item.code} -- ${item.description}` } });
    setPartQuery('');
    setShowSuggestions(false);
  };

  // console.log('catalogData in Edit: ',catalogData);
  // console.log('selectedStyleData in Edit: ',selectedStyleData);
  return (
    <div className="mt-5 mb-5">
      {/* Controls - align with create (adds catalog-controls-mobile for responsive) */}
      <div className="d-flex flex-wrap gap-3 align-items-center justify-content-between mb-4 catalog-controls-mobile">
        {!readOnly && (
          <div className="position-relative flex-grow-1" style={{ minWidth: '200px', maxWidth: '600px' }}>
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
                  <button
                    type="button"
                    key={item.id}
                    className="dropdown-item text-wrap"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pickItem(item)}
                  >
                    <strong>{item.code}</strong> — {item.description}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="d-flex flex-wrap align-items-center gap-3 flex-shrink-0">
          {!readOnly && (
            <>
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
            </>
          )}
        </div>

        {!readOnly && (
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
        )}
      </div>

  {/* Desktop table view */}
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
            {selectVersion?.items?.map((item, idx) => {
              // Use global assembled toggle only; assembly applies automatically when on
              const assembled = !!isAssembled
              const qty = Number(item.qty || 1)
              const unitAssembly = assembled ? Number(item.assemblyFee || 0) : 0
              const assemblyFee = unitAssembly * qty
              const total = Number(item.price || 0) * qty + assemblyFee

              const rowStyle = item.unavailable ? { color: '#b00020', textDecoration: 'line-through' } : undefined;
              return (
                <React.Fragment key={idx}>
                  <CTableRow className={item.unavailable ? 'table-danger' : ''}>
                    <CTableDataCell>{idx + 1}</CTableDataCell>
                    <CTableDataCell>
                      <CFormInput
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(e) => updateQty(idx, parseInt(e.target.value))}
                        style={{ width: '70px', textAlign: 'center' }}
                        disabled={readOnly}
                      />
                    </CTableDataCell>

                    <CTableDataCell style={rowStyle}>{item.code}</CTableDataCell>

                    <CTableDataCell>
                      {assembled ? (
                        <div className="d-flex gap-1">
              {hingeOptions.map((opt) => (
                            <span
                              key={opt}
                              className={`btn btn-sm ${item.hingeSide === opt ? 'btn-light' : 'btn-light'}`}
                              style={{
                                ...(item.hingeSide === opt ? {
                                  background: headerBg,
                                  color: textColor,
                                  border: `1px solid ${headerBg}`
                                } : {}),
                                ...(readOnly ? { pointerEvents: 'none', opacity: 0.6 } : {})
                              }}
                              onClick={() => !readOnly && updateHingeSide(idx, opt)}
                            >
                              {codeToLabel(opt)}
                            </span>
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
                            <span
                              key={opt}
                              className={`btn btn-sm ${item.exposedSide === opt ? 'btn-light' : 'btn-light'}`}
                              style={{
                                ...(item.exposedSide === opt ? {
                                  background: headerBg,
                                  color: textColor,
                                  border: `1px solid ${headerBg}`
                                } : {}),
                                ...(readOnly ? { pointerEvents: 'none', opacity: 0.6 } : {})
                              }}
                              onClick={() => !readOnly && updateExposedSide(idx, opt)}
                            >
                              {codeToLabel(opt)}
                            </span>
                          ))}
                        </div>
                      ) : (
                        t('common.na')
                      )}
                    </CTableDataCell>

                    <CTableDataCell style={rowStyle}>{formatPrice(item.unavailable ? 0 : item.price)}</CTableDataCell>

                    <CTableDataCell>
                      {assembled ? (
                        <span style={rowStyle}>{formatPrice(item.unavailable ? 0 : assemblyFee)}</span>
                      ) : (
                        <span className="text-muted">{formatPrice(0)}</span>
                      )}
                    </CTableDataCell>

                    <CTableDataCell style={rowStyle}>{formatPrice(item.unavailable ? 0 : total)}</CTableDataCell>

                    <CTableDataCell>
                      <div className="d-flex align-items-center">
                        {!readOnly && (
                          <>
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
                          </>
                        )}
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
                          {!readOnly && (
                            <CIcon
                              icon={cilTrash}
                              style={{ cursor: 'pointer', color: 'red' }}
                              onClick={() => handleDeleteModification(idx, modIdx)}
                            />
                          )}
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

      {/* Mobile card view to match create */}
      <div className="mobile-card-view d-none">
        {selectVersion?.items?.map((item, idx) => {
          const assembled = !!isAssembled;
          const qty = Number(item.qty || 1);
          const unitAssembly = assembled ? Number(item.assemblyFee || 0) : 0;
          const assemblyFee = unitAssembly * qty;
          const total = Number(item.price || 0) * qty + assemblyFee;
          const rowStyle = item.unavailable ? { color: '#b00020', textDecoration: 'line-through' } : undefined;

          return (
            <React.Fragment key={`mobile-${idx}`}>
              <div className="item-card-mobile">
                <div className="item-header">
                  <div className="item-number">{idx + 1}</div>
                  {!readOnly && (
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
                  )}
                </div>

                <div className="item-detail-row">
                  <span className="item-label">{t('proposalColumns.item')}</span>
                  <span className="item-value item-code" style={rowStyle}>{item.code}</span>
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
                  <span className="item-value" style={rowStyle}>{formatPrice(item.unavailable ? 0 : item.price)}</span>
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
                            onClick={() => !readOnly && updateHingeSide(idx, opt)}
                            disabled={readOnly}
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
                            onClick={() => !readOnly && updateExposedSide(idx, opt)}
                            disabled={readOnly}
                          >
                            {codeToLabel(opt)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="item-detail-row">
                      <span className="item-label">{t('proposalColumns.assemblyCost')}</span>
                      <span className="item-value" style={rowStyle}>{formatPrice(item.unavailable ? 0 : assemblyFee)}</span>
                    </div>
                  </>
                )}

                <div className="total-highlight">
                  <strong style={rowStyle}>{t('proposalColumns.total')}: {formatPrice(item.unavailable ? 0 : total)}</strong>
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  )
}

export default CatalogTableEdit
