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
} from '@coreui/react'

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
        transition: 'border-color 0.3s ease',
    }

    const readOnlyStyle = {
        ...inputStyle,
        backgroundColor: '#f1f3f5',
        color: '#6c757d',
        cursor: 'not-allowed',
        pointerEvents: 'none',
    }

    return (
        <CModal visible={show} onClose={onClose} size="lg" backdrop="static">
            <CModalHeader className="border-bottom-0 pb-0">
                <CModalTitle className="fw-semibold fs-4">Edit Manufacturer</CModalTitle>
            </CModalHeader>

            <CForm onSubmit={handleSubmit}>
                <CModalBody style={{ paddingTop: 0 }}>
                    {error && <CAlert color="danger">{error}</CAlert>}

                    <div className="mb-4">
                        <CFormLabel htmlFor="name" className="fw-medium">Name</CFormLabel>
                        <CFormInput
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            placeholder="Manufacturer name"
                            readOnly
                            style={readOnlyStyle}
                        />
                    </div>

                    <div className="mb-4">
                        <CFormLabel htmlFor="email" className="fw-medium">Email</CFormLabel>
                        <CFormInput
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            placeholder="Manufacturer email"
                            readOnly
                            style={readOnlyStyle}
                        />
                    </div>

                    <div className="mb-4">
                        <CFormLabel htmlFor="multiplier" className="fw-medium">Multiplier</CFormLabel>
                        <CFormInput
                            type="number"
                            step="0.01"
                            id="multiplier"
                            name="multiplier"
                            value={formData.multiplier}
                            onChange={(e) => {
                                const value = e.target.value
                                // Allow only digits and max one decimal point, up to 4 digits before decimal
                                const regex = /^(?:\d{0,4})(?:\.\d{0,2})?$/ // optional 2 decimal places
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
                    </div>

                    <div className="form-check form-switch mb-4">
                        <input
                            type="checkbox"
                            className="form-check-input"
                            id="enabled"
                            name="enabled"
                            checked={formData.enabled}
                            onChange={handleChange}
                        />
                        <label className="form-check-label ms-2" htmlFor="enabled">
                            Enabled
                        </label>
                    </div>
                </CModalBody>

                <CModalFooter className="border-top pt-3">
                    <CButton color="secondary" variant="outline" onClick={onClose}>
                        Cancel
                    </CButton>
                    <CButton color="primary" type="submit">
                        Save Changes
                    </CButton>
                </CModalFooter>
            </CForm>
        </CModal>
    )
}

export default EditManufacturerModal

