import React, { useEffect, useState } from 'react'
import {
    CCard,
    CCardBody,
    CCardHeader,
    CForm,
    CFormInput,
    CFormLabel,
    CButton,
    CSpinner,
    CAlert,
} from '@coreui/react'
import { useParams, useNavigate } from 'react-router-dom'
import { decodeParam } from '../../../utils/obfuscate'
import PageHeader from '../../../components/PageHeader'

// Mock data — replace this with your API call
const mockManufacturers = [
    { id: '1', name: 'Manufacturer One', email: 'one@example.com', multiplier: 1.5, enabled: true },
    { id: '2', name: 'Manufacturer Two', email: 'two@example.com', multiplier: 2.0, enabled: false },
]

const EditManufacturer = () => {
    const { id: rawId } = useParams()
    const id = decodeParam(rawId)
    const navigate = useNavigate()

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        multiplier: '',
        enabled: false,
    })

    useEffect(() => {
        // Simulate fetching manufacturer by id
        const found = mockManufacturers.find((m) => m.id === id)
        if (found) {
            setFormData({
                name: found.name,
                email: found.email,
                multiplier: found.multiplier,
                enabled: found.enabled,
            })
            setLoading(false)
        } else {
            setError('Manufacturer not found')
            setLoading(false)
        }
    }, [id])

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }))
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        // Simple validation
        if (!formData.name || !formData.email) {
            setError('Name and Email are required')
            return
        }
        setError(null)

        // TODO: Call API to update manufacturer here

        // Navigate back to manufacturer list or wherever
        navigate('/settings/manufacturers')
    }

    if (loading) return <CSpinner className="mx-auto d-block" />

    if (error)
        return (
            <CAlert color="danger" className="text-center">
                {error}
            </CAlert>
        )

    return (
        <div className="multiplier-edit">
            {/* Scoped responsive/touch styles */}
            <style>{`
                .multiplier-edit .form-control, .multiplier-edit .btn { min-height: 44px; }
                .multiplier-edit .form-check-input { width: 2.25rem; height: 1.25rem; }
            `}</style>

            <PageHeader
                title="Edit Manufacturer Multiplier"
                showBackButton={true}
                onBackClick={() => navigate('/settings/multipliers')}
            />

            <CCard style={{ maxWidth: '600px', margin: '20px auto' }}>
            <CCardHeader>Edit Manufacturer</CCardHeader>
            <CCardBody>
                <CForm onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <CFormLabel htmlFor="name">Name</CFormLabel>
                        <CFormInput
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            placeholder="Enter manufacturer name"
                        />
                    </div>

                    <div className="mb-3">
                        <CFormLabel htmlFor="email">Email</CFormLabel>
                        <CFormInput
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            placeholder="Enter manufacturer email"
                        />
                    </div>

                    <div className="mb-3">
                        <CFormLabel htmlFor="multiplier">Multiplier</CFormLabel>
                        <CFormInput
                            type="number"
                            step="0.01"
                            id="multiplier"
                            name="multiplier"
                            value={formData.multiplier}
                            onChange={handleChange}
                            placeholder="Enter multiplier"
                        />
                    </div>

                    <div className="form-check mb-3">
                        <input
                            type="checkbox"
                            id="enabled"
                            name="enabled"
                            className="form-check-input"
                            checked={formData.enabled}
                            onChange={handleChange}
                        />
                        <label className="form-check-label" htmlFor="enabled">
                            Enabled
                        </label>
                    </div>

                    {error && <CAlert color="danger">{error}</CAlert>}

                    <div className="d-flex justify-content-end gap-2">
                        <CButton color="secondary" onClick={() => navigate(-1)}>
                            Cancel
                        </CButton>
                        <CButton color="primary" type="submit">
                            Save Changes
                        </CButton>
                    </div>
                </CForm>
            </CCardBody>
            </CCard>
        </div>
    )
}

export default EditManufacturer
