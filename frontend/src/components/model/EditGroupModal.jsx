import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
    CModal,
    CModalHeader,
    CModalTitle,
    CModalBody,
    CModalFooter,
    CButton,
    CForm,
    CFormInput,
    CFormLabel,
    CAlert,
    CContainer,
    CRow,
    CCol,
} from '@coreui/react'

const EditGroupModal = ({ show, onClose, manufacturer, onSave }) => {
    const { t } = useTranslation()
    const [formData, setFormData] = useState({
        name: '',
        multiplier: '',
        enabled: false,
    })

    const [error, setError] = useState(null)

    useEffect(() => {
        if (manufacturer) {
            setFormData({
                name: manufacturer.user_group.name || '',
                multiplier: manufacturer.multiplier || '',
                enabled: manufacturer.enabled || false,
            })
        }
    }, [manufacturer])

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }))
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        setError(null)
        onSave(formData)
    }

    const inputStyle = {
        backgroundColor: '#f8f9fa',
        border: '1px solid #dcdcdc',
        borderRadius: '8px',
        padding: '10px 14px',
        fontSize: '15px',
    }

    const readOnlyStyle = {
        ...inputStyle,
        backgroundColor: '#f1f3f5',
        color: '#6c757d',
        cursor: 'not-allowed',
    }

    return (
        <CModal visible={show} onClose={onClose} size="lg" backdrop="static" alignment="center" scrollable>
            <CForm onSubmit={handleSubmit}>
                <CModalHeader>
                    <CModalTitle>{t('settings.userGroups.multipliers.modal.title')}</CModalTitle>
                </CModalHeader>
                <CModalBody>
                    {error && <CAlert color="danger">{error}</CAlert>}

                    <CContainer fluid>
                        <CRow className="mb-3">
                            <CCol xs={6} md={6}>
                                <CFormLabel htmlFor="name">{t('settings.userGroups.multipliers.modal.labels.name')}</CFormLabel>
                                <CFormInput
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    readOnly
                                    placeholder={t('settings.userGroups.multipliers.modal.placeholders.name')}
                                    style={readOnlyStyle}
                                />
                            </CCol>
                            <CCol xs={6} md={6}>
                                <CFormLabel htmlFor="multiplier">{t('settings.userGroups.multipliers.modal.labels.multiplier')}</CFormLabel>
                                <CFormInput
                                    type="number"
                                    step="0.01"
                                    id="multiplier"
                                    name="multiplier"
                                    value={formData.multiplier}
                                    onChange={(e) => {
                                        const value = e.target.value
                                        const regex = /^(?:\d{0,4})(?:\.\d{0,2})?$/
                                        if (value === '' || regex.test(value)) {
                                            setFormData((prev) => ({
                                                ...prev,
                                                multiplier: value,
                                            }))
                                        }
                                    }}
                                    placeholder={t('settings.userGroups.multipliers.modal.placeholders.multiplier')}
                                    style={inputStyle}
                                />
                            </CCol>
                        </CRow>

                        <CRow>

                            <CCol xs={6} md={6}>
                                <div
                                    className="form-check form-switch mt-5"
                                    style={{ transform: 'scale(1.0)', display: 'flex', alignItems: 'center' }}
                                >
                                    <input
                                        type="checkbox"
                                        className="form-check-input"
                                        id="enabled"
                                        name="enabled"
                                        checked={formData.enabled}
                                        onChange={handleChange}
                                    />
                                    <label
                                        className="form-check-label ms-2"
                                        htmlFor="enabled"
                                        style={{ fontSize: '1.1rem' }}
                                    >
                                        {t('settings.userGroups.multipliers.modal.labels.enabled')}
                                    </label>
                                </div>
                            </CCol>
                        </CRow>
                    </CContainer>
                </CModalBody>
                <CModalFooter>
                    <CButton color="secondary" variant="outline" onClick={onClose}>
                        {t('common.cancel')}
                    </CButton>
                    <CButton color="primary" type="submit">
                        {t('common.save')}
                    </CButton>
                </CModalFooter>
            </CForm>
        </CModal>
    )
}

export default EditGroupModal
