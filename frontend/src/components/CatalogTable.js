import React from 'react'
import {
  CFormSelect,
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
}) => {
  return (
    <div className="mt-5 mb-5">
      <div className="d-flex flex-wrap gap-3 align-items-center justify-content-between mb-4">
        <CFormSelect
          onChange={handleCatalogSelect}
          value=""
          className="flex-grow-1"
          style={{ minWidth: '200px', maxWidth: '600px' }}
        >
          <option disabled value="">
            Enter Part code
          </option>
          {catalogData
            .filter(
              (item) =>
                Array.isArray(item.styleVariants) &&
                item.styleVariants.length > 0 &&
                item.style === selectedStyleData?.style
            )
            .map((item) => (
              <option key={item.id}>
                {item.code} -- {item.description}
              </option>
            ))}
        </CFormSelect>

        <div className="d-flex flex-wrap align-items-center gap-3 flex-shrink-0">
          <CFormCheck
            label={<span style={{ fontSize: '1rem' }}>Add items on top</span>}
            checked={addOnTop}
            onChange={(e) => setAddOnTop(e.target.checked)}
            style={{ transform: 'scale(1.1)' }}
          />

          <div className="d-flex align-items-center gap-2">
            <CIcon icon={cilCopy} style={{ cursor: 'pointer' }} onClick={handleCopy} />
            <span style={{ fontWeight: 'bold', fontSize: '1rem' }}>Copy</span>
          </div>

          <CFormCheck
            label={<span style={{ fontSize: '1rem' }}>Group</span>}
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
              placeholder="Find in cart"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </CInputGroup>
        </div>
      </div>

      <div className="table-responsive">
        <CTable>
          <CTableHead>
            <CTableRow>
              <CTableHeaderCell>#</CTableHeaderCell>
              <CTableHeaderCell>Qty</CTableHeaderCell>
              <CTableHeaderCell>Item</CTableHeaderCell>
              <CTableHeaderCell>Hinge side</CTableHeaderCell>
              <CTableHeaderCell>Exposed side</CTableHeaderCell>
              <CTableHeaderCell>Price</CTableHeaderCell>
              <CTableHeaderCell>
                <BsTools />
              </CTableHeaderCell>
              <CTableHeaderCell>Total</CTableHeaderCell>
              <CTableHeaderCell>Action</CTableHeaderCell>
            </CTableRow>
          </CTableHead>

          <CTableBody>
            {selectVersion?.items?.map((item, idx) => {
              const assembled = isAssembled || item.isRowAssembled
              const assemblyFee = assembled && item.includeAssemblyFee ? Number(item.assemblyFee || 0) : 0
              const total = Number(item.price || 0) * Number(item.qty || 1) + assemblyFee

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

                    <CTableDataCell>{item.code}</CTableDataCell>

                    <CTableDataCell>
                      {assembled ? (
                        <div className="d-flex gap-1">
                          {hingeOptions.map((opt) => (
                            <button
                              key={opt}
                              className={`btn btn-sm ${item.hingeSide === opt ? 'btn-primary' : 'btn-light'}`}
                              onClick={() => updateHingeSide(idx, opt)}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      ) : (
                        'N/A'
                      )}
                    </CTableDataCell>

                    <CTableDataCell>
                      {assembled ? (
                        <div className="d-flex gap-1">
                          {exposedOptions.map((opt) => (
                            <button
                              key={opt}
                              className={`btn btn-sm ${item.exposedSide === opt ? 'btn-primary' : 'btn-light'}`}
                              onClick={() => updateExposedSide(idx, opt)}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      ) : (
                        'N/A'
                      )}
                    </CTableDataCell>

                    <CTableDataCell>{formatPrice(item.price)}</CTableDataCell>

                    <CTableDataCell>
                      <CFormCheck
                        checked={item.includeAssemblyFee || false}
                        onChange={(e) => toggleRowAssembly(idx, e.target.checked)}
                        disabled={!isAssembled}
                        label={formatPrice(item.includeAssemblyFee ? item.assemblyFee : 0)}
                      />
                    </CTableDataCell>

                    <CTableDataCell>{formatPrice(total)}</CTableDataCell>

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
                        Modifications:
                      </CTableDataCell>
                    </CTableRow>
                  )}

                  {Array.isArray(item.modifications) && item.modifications.length > 0 && (
                    item.modifications.map((mod, modIdx) => (

                      <CTableRow key={`mod-${idx}-${modIdx}`} className="table-secondary">
                        <CTableDataCell>-</CTableDataCell>
                        <CTableDataCell>{mod.qty}</CTableDataCell>

                        <CTableDataCell colSpan={3}>
                          {mod.name || 'Unnamed Modification'}
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
    </div>
  )
}

export default CatalogTable
