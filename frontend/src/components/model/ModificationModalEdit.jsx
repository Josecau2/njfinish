// ModificationModal.jsx
import React from 'react'
import { useSelector } from 'react-redux'
import { isAdmin } from '../../helpers/permissions'
import {
    CModal,
    CModalHeader,
    CModalTitle,
    CModalBody,
    CModalFooter,
    CButton,
    CFormCheck,
    CFormInput,
    CFormSelect,
    CCloseButton
} from '@coreui/react'

const ModificationModalEdit = ({
    visible,
    onClose,
    onSave,
    modificationType,
    setModificationType,
    existingModifications,
    selectedExistingMod,
    setSelectedExistingMod,
    existingModQty,
    setExistingModQty,
    existingModNote,
    setExistingModNote,
    customModName,
    setCustomModName,
    customModQty,
    setCustomModQty,
    customModPrice,
    setCustomModPrice,
    customModTaxable,
    setCustomModTaxable,
    customModNote,
    setCustomModNote,
    validationAttempted,
    catalogData,
    itemModificationID
}) => {
    // console.log('catalogData modification: ', catalogData);
    // console.log('catalogData itemModificationID: ', itemModificationID);
    const authUser = useSelector((state) => state.auth?.user);
    const isUserAdmin = isAdmin(authUser);

    return (
        <CModal
            visible={visible}
            onClose={onClose}
            alignment="center"
            size="lg"
        >
            <CModalHeader className="bg-primary text-white">
                <CModalTitle>Modification</CModalTitle>
            </CModalHeader>

            <CModalBody style={{ padding: '2rem', borderRadius: '0 0 8px 8px' }}>
                <div className="mb-4 d-flex gap-4 align-items-center">
                    <CFormCheck
                        type="radio"
                        label={<span style={{ fontSize: '1.1rem' }}>Select existing modification</span>}
                        name="modType"
                        value="existing"
                        checked={modificationType === 'existing'}
                        onChange={() => setModificationType('existing')}
                        style={{ transform: 'scale(1.3)' }}
                    />
                    <CFormCheck
                        type="radio"
                        label={<span style={{ fontSize: '1.1rem' }}>Add custom modification</span>}
                        name="modType"
                        value="custom"
                        checked={modificationType === 'custom'}
                        onChange={() => setModificationType('custom')}
                        style={{ transform: 'scale(1.3)' }}
                    />
                </div>

                {modificationType === 'existing' && (
                    <>
                        <div className="mb-3">
                            <CFormSelect
                                aria-label="Select existing modification"
                                value={selectedExistingMod || ''}
                                onChange={e => setSelectedExistingMod(e.target.value)}
                                required
                                invalid={validationAttempted && !selectedExistingMod}
                                feedbackInvalid="Modification code is required"
                            >
                                <option value="" disabled>Select modification</option>
                                {Array.isArray(catalogData) && catalogData.length > 0 ? (
                                    catalogData.map(mod => (
                                        <option key={mod.id} value={mod.id}>
                                            {mod.modificationName}
                                        </option>
                                    ))
                                ) : (
                                    <option disabled>No modifications available</option>
                                )}

                            </CFormSelect>
                        </div>

                        <CFormInput
                            type="number"
                            value={existingModQty}
                            onChange={(e) => {
                                const val = Math.max(1, Number(e.target.value))
                                setExistingModQty(val)
                            }}
                            placeholder="Modification Qty"
                            className="mb-3"
                            min={1}
                            required
                        />

                        <CFormInput
                            type="text"
                            value={existingModNote}
                            onChange={(e) => setExistingModNote(e.target.value)}
                            placeholder="Note (Optional)"
                        />
                        <div className="text-muted mb-1 p-1">If needed, provide custom instructions for applying the modification</div>
                    </>
                )}

                {modificationType === 'custom' && (
                    <>
                        <div className="mb-3">
                            <CFormInput
                                type="text"
                                value={customModName}
                                onChange={(e) => setCustomModName(e.target.value)}
                                placeholder="Enter Custom Modification"
                                required
                                invalid={validationAttempted && !customModName}
                                feedbackInvalid="Modification code is required"
                            />
                        </div>

                        <div className="d-flex align-items-center gap-3 mb-3">
                            <CFormInput
                                type="number"
                                value={customModQty}
                                onChange={(e) => {
                                    const val = Math.max(1, Number(e.target.value))
                                    setCustomModQty(val)
                                }}
                                placeholder="Qty"
                                min={1}
                                style={{ width: '100px' }}
                            />

                            <CFormInput
                                type="number"
                                value={customModPrice}
                                onChange={(e) => setCustomModPrice(Number(e.target.value))}
                                placeholder="Price"
                                min={0}
                                className="flex-grow-1"
                                style={{ width: '100px' }}
                            />



                            <div className="form-check mt-2 d-flex align-items-center" style={{ gap: '0.5rem' }}>
                                <CFormCheck
                                    checked={customModTaxable}
                                    onChange={(e) => { if (isUserAdmin) setCustomModTaxable(e.target.checked); }}
                                    disabled={!isUserAdmin}
                                    style={{ transform: 'scale(1.4)' }}
                                    label={<span style={{ fontSize: '1.1rem', marginLeft: '0.5rem' }}>Taxable</span>}
                                />
                            </div>
                        </div>

                        <CFormInput
                            type="text"
                            value={customModNote}
                            onChange={(e) => setCustomModNote(e.target.value)}
                            placeholder="Note (Optional)"
                        />
                        <div className="text-muted mb-5 p-1">If needed, provide custom instructions for applying the modification</div>
                        {/* <div className="text-primary">
                            Price of custom modifications is unknown and will be provided by manufacturer upon receiving the order.
                        </div> */}
                    </>
                )}
            </CModalBody>

            <CModalFooter>
                <CButton color="secondary" onClick={onClose}>Cancel</CButton>
                <CButton color="primary" onClick={onSave}>Save</CButton>
            </CModalFooter>
        </CModal>
    )
}

export default ModificationModalEdit
