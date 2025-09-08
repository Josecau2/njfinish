import React, { useEffect, useState } from 'react'
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
import { Pencil, Save, X } from '@/icons'

const EditManufacturerModal = ({ show, onClose, manufacturer, onSave }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        multiplier: '',
        enabled: false,
    })

    const [error, setError] = useState(null)

    useEffect(() => {
        if (manufacturer) {
            setFormData({
                name: manufacturer.name || '',
                email: manufacturer.email || '',
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
                <CModal visible={show} onClose={onClose} size="lg" backdrop="static" alignment="center"  scrollable>
                        {/* UI-TASK: Scoped responsive/touch styles */}
                        <style>{`
                            .edit-manufacturer-modal .form-control, .edit-manufacturer-modal .form-select { min-height: 44px; }
                            .edit-manufacturer-modal .btn { min-height: 44px; }
                            @media (max-width: 576px) {
                                .edit-manufacturer-modal .modal-footer { flex-wrap: wrap; }
                                .edit-manufacturer-modal .modal-footer .btn { width: 100%; }
                            }
                        `}</style>
                        <CForm onSubmit={handleSubmit} className="edit-manufacturer-modal">
                                <CModalHeader>
                                        <CModalTitle>Edit Manufacturer</CModalTitle>
                                </CModalHeader>
                <CModalBody>
                    {error && <CAlert color="danger">{error}</CAlert>}

                    <CContainer fluid>
                        <CRow className="mb-3">
                            <CCol xs={6} md={6}>
                                <CFormLabel htmlFor="name">Name</CFormLabel>
                                <CFormInput
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    readOnly
                                    placeholder="Manufacturer name"
                                    style={readOnlyStyle}
                                />
                            </CCol>
                            <CCol xs={6} md={6}>
                                <CFormLabel htmlFor="email">Email</CFormLabel>
                                <CFormInput
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    readOnly
                                    placeholder="Manufacturer email"
                                    style={readOnlyStyle}
                                />
                            </CCol>
                        </CRow>

                        <CRow>
                            <CCol xs={6} md={6}>
                                <CFormLabel htmlFor="multiplier">Multiplier</CFormLabel>
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
                                    placeholder="Enter multiplier"
                                    style={inputStyle}
                                />
                            </CCol>
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
                                        Enabled
                                    </label>
                                </div>
                            </CCol>
                        </CRow>
                    </CContainer>
                </CModalBody>
                <CModalFooter>
                    <CButton color="secondary" variant="outline" onClick={onClose} aria-label="Cancel editing manufacturer">
                        {/* <X size={16} className="me-2" /> */}
                        Cancel
                    </CButton>
                    <CButton color="primary" type="submit" aria-label="Save manufacturer changes">
                        {/* <Save size={16} className="me-2" /> */}
                        Save Changes
                    </CButton>
                </CModalFooter>
            </CForm>
        </CModal>
    )
}

export default EditManufacturerModal
