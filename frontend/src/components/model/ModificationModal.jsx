// ModificationModal.jsx
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { isAdmin } from '../../helpers/permissions'
import { getContrastColor } from '../../utils/colorUtils'
import PageHeader from '../PageHeader'
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

const ModificationModal = ({
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
    const { t } = useTranslation();
    const authUser = useSelector((state) => state.auth?.user);
    const isUserAdmin = isAdmin(authUser);
    const customization = useSelector((state) => state.customization);
    const headerBg = customization?.headerBg || '#007bff';
    const textColor = getContrastColor(headerBg);

    return (
        <CModal
            visible={visible}
            onClose={onClose}
            alignment="center"
            size="lg"
        >
            <PageHeader title={t('modificationModal.title')} />

            <CModalBody style={{ padding: '2rem', borderRadius: '0 0 8px 8px' }}>
        <div className="mb-4 d-flex gap-4 align-items-center" role="radiogroup" aria-label={t('modificationModal.type.ariaLabel')}>
                    <CFormCheck
                        type="radio"
            label={<span style={{ fontSize: '1.1rem' }}>{t('modificationModal.type.existing')}</span>}
                        name="modType"
                        value="existing"
                        checked={modificationType === 'existing'}
                        onChange={() => setModificationType('existing')}
                        style={{ transform: 'scale(1.3)' }}
                    />
                    <CFormCheck
                        type="radio"
            label={<span style={{ fontSize: '1.1rem' }}>{t('modificationModal.type.custom')}</span>}
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
                                aria-label={t('modificationModal.existing.selectLabel')}
                                value={selectedExistingMod || ''}
                                onChange={e => setSelectedExistingMod(e.target.value)}
                                required
                                invalid={validationAttempted && !selectedExistingMod}
                                feedbackInvalid={t('modificationModal.existing.validation.codeRequired')}
                            >
                                <option value="" disabled>{t('modificationModal.existing.selectPlaceholder')}</option>
                                {Array.isArray(catalogData) && catalogData.length > 0 ? (
                                    catalogData.map(mod => (
                                        <option key={mod.id} value={mod.id}>
                                            {mod.modificationName}
                                        </option>
                                    ))
                                ) : (
                                    <option disabled>{t('modificationModal.existing.noneAvailable')}</option>
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
                            placeholder={t('modificationModal.existing.qtyPlaceholder')}
                            className="mb-3"
                            min={1}
                            required
                        aria-label="Existing modification quantity"
                        />

                        <CFormInput
                            type="text"
                            value={existingModNote}
                            onChange={(e) => setExistingModNote(e.target.value)}
                            placeholder={t('modificationModal.existing.notePlaceholder')}
                        aria-label="Existing modification note"
                        />
                        <div className="text-muted mb-1 p-1">{t('modificationModal.existing.instructionsHelper')}</div>
                    </>
                )}

                {modificationType === 'custom' && (
                    <>
                        <div className="mb-3">
                            <CFormInput
                                type="text"
                                value={customModName}
                                onChange={(e) => setCustomModName(e.target.value)}
                                placeholder={t('modificationModal.custom.namePlaceholder')}
                                required
                                invalid={validationAttempted && !customModName}
                                feedbackInvalid={t('modificationModal.existing.validation.codeRequired')}
                                aria-label={t('modificationModal.custom.namePlaceholder')}
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
                                placeholder={t('modificationModal.custom.qtyPlaceholder')}
                                min={1}
                                style={{ width: '100px' }}
                                aria-label="Quantity"
                            />

                            <CFormInput
                                type="number"
                                value={customModPrice}
                                onChange={(e) => setCustomModPrice(Number(e.target.value))}
                                placeholder={t('modificationModal.custom.pricePlaceholder')}
                                min={0}
                                className="flex-grow-1"
                                style={{ width: '100px' }}
                                aria-label="Price"
                            />



                            <div className="form-check mt-2 d-flex align-items-center" style={{ gap: '0.5rem' }}>
                                <CFormCheck
                                    checked={customModTaxable}
                                    onChange={(e) => { if (isUserAdmin) setCustomModTaxable(e.target.checked); }}
                                    disabled={!isUserAdmin}
                                    style={{ transform: 'scale(1.4)' }}
                                    label={<span style={{ fontSize: '1.1rem', marginLeft: '0.5rem' }}>{t('modificationModal.custom.taxable')}</span>}
                                    aria-label={t('modificationModal.custom.taxable')}
                                />
                            </div>
                        </div>

                        <CFormInput
                            type="text"
                            value={customModNote}
                            onChange={(e) => setCustomModNote(e.target.value)}
                            placeholder={t('modificationModal.custom.notePlaceholder')}
                        aria-label="Custom modification note"
                        />
                        <div className="text-muted mb-5 p-1">{t('modificationModal.custom.instructionsHelper')}</div>
                        {/* <div className="text-primary">
                            Price of custom modifications is unknown and will be provided by manufacturer upon receiving the order.
                        </div> */}
                    </>
                )}
            </CModalBody>

            <CModalFooter>
                <CButton color="secondary" onClick={onClose} style={{ minHeight: '44px' }}>{t('modificationModal.actions.cancel')}</CButton>
                <CButton style={{ backgroundColor: headerBg, color: textColor, borderColor: headerBg, minHeight: '44px' }} onClick={onSave}>{t('modificationModal.actions.save')}</CButton>
            </CModalFooter>
        </CModal>
    )
}

export default ModificationModal
