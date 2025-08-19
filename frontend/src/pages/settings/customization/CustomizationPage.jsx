import React, { useEffect, useState } from 'react'
import {
    CCard, CCardBody, CForm, CFormLabel,
    CFormInput, CButton, CRow, CCol, CAlert, CSpinner,
    CContainer, CBadge, CInputGroup, CInputGroupText
} from '@coreui/react'
import { useDispatch, useSelector } from 'react-redux'
import { setCustomization } from '../../../store/slices/customizationSlice'
import axiosInstance from '../../../helpers/axiosInstance'
import CIcon from '@coreui/icons-react'
import { cilSettings, cilImage, cilColorPalette, cilSave, cilTrash } from '@coreui/icons'

const CustomizationPage = () => {
    const dispatch = useDispatch()
    const customization = useSelector((state) => state.customization)
    const api_url = import.meta.env.VITE_API_URL

    const [formData, setFormData] = useState(customization)
    const [previewLogo, setPreviewLogo] = useState(null)
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState({ type: '', text: '' })

    useEffect(() => {
        setFormData(customization)
        const fullLogoUrl = customization.logoImage
            ? `${api_url}${customization.logoImage}`
            : null
        setPreviewLogo(fullLogoUrl || null)
    }, [customization, api_url])

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    const handleLogoUpload = (e) => {
        const file = e.target.files[0]
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setMessage({ type: 'danger', text: 'File size must be less than 5MB' })
                return
            }
            
            if (!file.type.startsWith('image/')) {
                setMessage({ type: 'danger', text: 'Please select a valid image file' })
                return
            }

            setFormData((prev) => ({ ...prev, logoImage: file }))
            setPreviewLogo(URL.createObjectURL(file))
            setMessage({ type: '', text: '' })
        }
    }

    const handleRemoveLogo = async () => {
        try {
            setLoading(true)
            if (customization.logoImage) {
                await axiosInstance.delete('/api/settings/customization/logo')
            }

            setFormData((prev) => ({ ...prev, logoImage: '' }))
            setPreviewLogo(null)
            dispatch(setCustomization({ ...customization, logoImage: '' }))
            setMessage({ type: 'success', text: 'Logo removed successfully' })
        } catch (error) {
            console.error("Failed to remove logo:", error)
            setMessage({ type: 'danger', text: 'Failed to remove logo. Please try again.' })
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        try {
            setLoading(true)
            setMessage({ type: '', text: '' })

            const form = new FormData()
            Object.entries(formData).forEach(([key, value]) => {
                form.append(key, value)
            })

            await axiosInstance.post('/api/settings/customization', form, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })

            const { data } = await axiosInstance.get('/api/settings/customization')
            dispatch(setCustomization(data))
            setMessage({ type: 'success', text: 'Customization saved successfully!' })
        } catch (err) {
            console.error('Failed to save customization:', err)
            setMessage({ type: 'danger', text: 'Failed to save customization. Please try again.' })
        } finally {
            setLoading(false)
        }
    }

    const clearMessage = () => {
        setMessage({ type: '', text: '' })
    }

    return (
        <CContainer fluid className="p-2 m-2" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
            {/* Header Section */}
            <CCard className="border-0 shadow-sm mb-2" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <CCardBody className="py-4">
                    <CRow className="align-items-center">
                        <CCol>
                            <div className="d-flex align-items-center gap-3">
                                <div 
                                    className="d-flex align-items-center justify-content-center setting-icon-div"
                                    
                                >
                                    <CIcon icon={cilSettings} style={{ color: 'white', fontSize: '20px' }} />
                                </div>
                                <div>
                                    <h3 className="text-white mb-1 fw-bold">UI Customization</h3>
                                    <p className="text-white-50 mb-0">Customize your application's appearance and branding</p>
                                </div>
                            </div>
                        </CCol>
                        <CCol xs="auto">
                            <CButton 
                                color="light" 
                                className="shadow-sm px-4 fw-semibold d-flex align-items-center"
                                onClick={handleSave}
                                disabled={loading}
                                style={{ 
                                    borderRadius: '8px',
                                    border: 'none',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                {loading ? (
                                    <>
                                        <CSpinner size="sm" className="me-2" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <CIcon icon={cilSave} className="me-2" />
                                        Save Changes
                                    </>
                                )}
                            </CButton>
                        </CCol>
                    </CRow>
                </CCardBody>
            </CCard>

            {/* Alert Messages */}
            {message.text && (
                <CCard className="border-0 shadow-sm mb-2">
                    <CCardBody className="py-2">
                        <CAlert 
                            color={message.type} 
                            dismissible 
                            onClose={clearMessage}
                            className="mb-0"
                            style={{ 
                                border: 'none',
                                borderRadius: '8px'
                            }}
                        >
                            {message.text}
                        </CAlert>
                    </CCardBody>
                </CCard>
            )}

            {/* Main Content */}
            <CRow className="g-3">
                {/* Brand Logo Section */}
                <CCol lg={6}>
                    <CCard className="border-0 shadow-sm h-100">
                        <div 
                            className="px-4 py-3 border-bottom"
                            style={{ backgroundColor: '#f8f9fa' }}
                        >
                            <div className="d-flex align-items-center gap-3">
                                <div 
                                    className="d-flex align-items-center justify-content-center brand-logo"
                                   
                                >
                                    <CIcon icon={cilImage} style={{ color: 'white', fontSize: '14px' }} />
                                </div>
                                <div>
                                    <h5 className="mb-0 fw-semibold text-dark">Brand Logo</h5>
                                    <small className="text-muted">Configure your application's logo and branding</small>
                                </div>
                            </div>
                        </div>
                        
                        <CCardBody className="p-4">
                            <div className="mb-3">
                                <CFormLabel className="fw-medium text-dark mb-2">Logo Text</CFormLabel>
                                <CFormInput
                                    name="logoText"
                                    value={formData.logoText}
                                    onChange={handleChange}
                                    placeholder="Enter your brand name"
                                    style={{ 
                                        border: '1px solid #e3e6f0',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        padding: '12px 16px'
                                    }}
                                />
                            </div>

                            <div className="mb-3">
                                <CFormLabel className="fw-medium text-dark mb-2">Upload Logo</CFormLabel>
                                <div className="position-relative">
                                    <CFormInput 
                                        type="file" 
                                        accept="image/*" 
                                        onChange={handleLogoUpload}
                                        className="position-absolute opacity-0 w-100 h-100"
                                        style={{ zIndex: 2, cursor: 'pointer' }}
                                        id="logo-upload"
                                    />
                                    <div 
                                        className="d-flex align-items-center justify-content-center p-4 text-center"
                                        style={{
                                            border: '2px dashed #e3e6f0',
                                            borderRadius: '8px',
                                            backgroundColor: '#f8f9fa',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        <div>
                                            <CIcon icon={cilImage} className="mb-2" style={{ fontSize: '24px', color: '#6c757d' }} />
                                            <p className="mb-0 text-muted">Choose Image</p>
                                            <small className="text-muted">JPG, PNG, SVG up to 5MB</small>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {previewLogo && (
                                <div className="mb-0">
                                    <CFormLabel className="fw-medium text-dark mb-2">Preview</CFormLabel>
                                    <div 
                                        className="d-flex align-items-center gap-3 p-3"
                                        style={{
                                            backgroundColor: '#f8f9fa',
                                            borderRadius: '8px',
                                            border: '1px solid #e9ecef'
                                        }}
                                    >
                                        <img 
                                            src={previewLogo} 
                                            alt="Logo Preview" 
                                            style={{
                                                height: '40px',
                                                width: 'auto',
                                                borderRadius: '4px',
                                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                            }}
                                        />
                                        <CButton 
                                            color="light"
                                            size="sm"
                                            onClick={handleRemoveLogo}
                                            disabled={loading}
                                            className="p-2"
                                            style={{
                                                borderRadius: '6px',
                                                border: '1px solid #e3e6f0',
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            {loading ? <CSpinner size="sm" /> : <CIcon icon={cilTrash} style={{ color: '#dc3545' }} />}
                                        </CButton>
                                    </div>
                                </div>
                            )}
                        </CCardBody>
                    </CCard>
                </CCol>

                {/* Color Palette Section */}
                <CCol lg={6}>
                    <CCard className="border-0 shadow-sm h-100">
                        <div 
                            className="px-4 py-3 border-bottom"
                            style={{ backgroundColor: '#f8f9fa' }}
                        >
                            <div className="d-flex align-items-center gap-3">
                                <div 
                                    className="d-flex align-items-center justify-content-center brand-logo"
                                    // style={{
                                    //     width: '32px',
                                    //     height: '32px',
                                    //     backgroundColor: '#667eea',
                                    //     borderRadius: '8px'
                                    // }}
                                >
                                    <CIcon icon={cilColorPalette} style={{ color: 'white', fontSize: '14px' }} />
                                </div>
                                <div>
                                    <h5 className="mb-0 fw-semibold text-dark">Color Palette</h5>
                                    <small className="text-muted">Customize colors for different UI elements</small>
                                </div>
                            </div>
                        </div>
                        
                        <CCardBody className="p-4">
                            {/* Header & Navigation Colors */}
                            <div className="mb-4">
                                <h6 className="fw-semibold text-dark mb-3 d-flex align-items-center gap-2">
                                    <CBadge 
                                        color="info" 
                                        className="px-2 py-1"
                                        style={{ borderRadius: '4px', fontSize: '10px' }}
                                    >
                                        HEADER
                                    </CBadge>
                                    Header & Navigation
                                </h6>
                                
                                <CRow className="g-3 mb-3">
                                    <CCol sm={6}>
                                        <CFormLabel className="fw-medium text-muted mb-2" style={{ fontSize: '13px' }}>Logo Background</CFormLabel>
                                        <div className="d-flex align-items-center gap-2">
                                            <input
                                                type="color"
                                                name="logoBg"
                                                value={formData.logoBg || '#0dcaf0'}
                                                onChange={handleChange}
                                                style={{
                                                    width: '36px',
                                                    height: '36px',
                                                    border: '1px solid #dee2e6',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    padding: '0'
                                                }}
                                            />
                                            <CBadge 
                                                color="light" 
                                                className="px-3 py-2"
                                                style={{ 
                                                    fontFamily: 'monospace',
                                                    fontSize: '12px',
                                                    backgroundColor: '#f8f9fa',
                                                    color: '#6c757d',
                                                    border: '1px solid #e9ecef'
                                                }}
                                            >
                                                {formData.logoBg || '#0dcaf0'}
                                            </CBadge>
                                        </div>
                                    </CCol>
                                    <CCol sm={6}>
                                        <CFormLabel className="fw-medium text-muted mb-2" style={{ fontSize: '13px' }}>Header Background</CFormLabel>
                                        <div className="d-flex align-items-center gap-2">
                                            <input
                                                type="color"
                                                name="headerBg"
                                                value={formData.headerBg}
                                                onChange={handleChange}
                                                style={{
                                                    width: '36px',
                                                    height: '36px',
                                                    border: '1px solid #dee2e6',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    padding: '0'
                                                }}
                                            />
                                            <CBadge 
                                                color="light" 
                                                className="px-3 py-2"
                                                style={{ 
                                                    fontFamily: 'monospace',
                                                    fontSize: '12px',
                                                    backgroundColor: '#f8f9fa',
                                                    color: '#6c757d',
                                                    border: '1px solid #e9ecef'
                                                }}
                                            >
                                                {formData.headerBg}
                                            </CBadge>
                                        </div>
                                    </CCol>
                                </CRow>
                                
                                <CRow className="g-3">
                                    <CCol sm={6}>
                                        <CFormLabel className="fw-medium text-muted mb-2" style={{ fontSize: '13px' }}>Header Text</CFormLabel>
                                        <div className="d-flex align-items-center gap-2">
                                            <input
                                                type="color"
                                                name="headerFontColor"
                                                value={formData.headerFontColor}
                                                onChange={handleChange}
                                                style={{
                                                    width: '36px',
                                                    height: '36px',
                                                    border: '1px solid #dee2e6',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    padding: '0'
                                                }}
                                            />
                                            <CBadge 
                                                color="light" 
                                                className="px-3 py-2"
                                                style={{ 
                                                    fontFamily: 'monospace',
                                                    fontSize: '12px',
                                                    backgroundColor: '#f8f9fa',
                                                    color: '#6c757d',
                                                    border: '1px solid #e9ecef'
                                                }}
                                            >
                                                {formData.headerFontColor}
                                            </CBadge>
                                        </div>
                                    </CCol>
                                </CRow>
                            </div>

                            {/* Sidebar Colors */}
                            <div className="mb-0">
                                <h6 className="fw-semibold text-dark mb-3 d-flex align-items-center gap-2">
                                    <CBadge 
                                        color="secondary" 
                                        className="px-2 py-1"
                                        style={{ borderRadius: '4px', fontSize: '10px' }}
                                    >
                                        SIDEBAR
                                    </CBadge>
                                    Sidebar
                                </h6>
                                
                                <CRow className="g-3">
                                    <CCol sm={6}>
                                        <CFormLabel className="fw-medium text-muted mb-2" style={{ fontSize: '13px' }}>Background</CFormLabel>
                                        <div className="d-flex align-items-center gap-2">
                                            <input
                                                type="color"
                                                name="sidebarBg"
                                                value={formData.sidebarBg}
                                                onChange={handleChange}
                                                style={{
                                                    width: '36px',
                                                    height: '36px',
                                                    border: '1px solid #dee2e6',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    padding: '0'
                                                }}
                                            />
                                            <CBadge 
                                                color="light" 
                                                className="px-3 py-2"
                                                style={{ 
                                                    fontFamily: 'monospace',
                                                    fontSize: '12px',
                                                    backgroundColor: '#f8f9fa',
                                                    color: '#6c757d',
                                                    border: '1px solid #e9ecef'
                                                }}
                                            >
                                                {formData.sidebarBg}
                                            </CBadge>
                                        </div>
                                    </CCol>
                                    <CCol sm={6}>
                                        <CFormLabel className="fw-medium text-muted mb-2" style={{ fontSize: '13px' }}>Text Color</CFormLabel>
                                        <div className="d-flex align-items-center gap-2">
                                            <input
                                                type="color"
                                                name="sidebarFontColor"
                                                value={formData.sidebarFontColor}
                                                onChange={handleChange}
                                                style={{
                                                    width: '36px',
                                                    height: '36px',
                                                    border: '1px solid #dee2e6',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    padding: '0'
                                                }}
                                            />
                                            <CBadge 
                                                color="light" 
                                                className="px-3 py-2"
                                                style={{ 
                                                    fontFamily: 'monospace',
                                                    fontSize: '12px',
                                                    backgroundColor: '#f8f9fa',
                                                    color: '#6c757d',
                                                    border: '1px solid #e9ecef'
                                                }}
                                            >
                                                {formData.sidebarFontColor}
                                            </CBadge>
                                        </div>
                                    </CCol>
                                </CRow>
                            </div>
                        </CCardBody>
                    </CCard>
                </CCol>
            </CRow>
        </CContainer>
    )
}

export default CustomizationPage