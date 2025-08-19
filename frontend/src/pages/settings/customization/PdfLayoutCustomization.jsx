import React, { useState, useEffect } from 'react'
import {
  CFormInput,
  CFormTextarea,
  CAlert,
  CSpinner,
  CButton,
  CModal,
  CModalBody,
  CModalHeader,
  CModalTitle,
  CCard,
  CCardBody,
  CRow,
  CCol,
  CContainer,
  CBadge,
  CFormLabel
} from '@coreui/react'
import axiosInstance from '../../../helpers/axiosInstance'
import CIcon from '@coreui/icons-react'
import { cilDescription, cilSettings, cilImage, cilBuilding, cilSave, cilGlobeAlt, cilTrash, cilColorPalette } from '@coreui/icons'

const PdfLayoutCustomization = () => {
  const api_url = import.meta.env.VITE_API_URL

  const [formData, setFormData] = useState({
    pdfHeader: '',
    pdfFooter: '',
    headerBgColor: '#000000',
    logo: null,
    logoPreview: null,
    previousBlobUrl: null,
    companyName: '',
    companyPhone: '',
    companyEmail: '',
    companyWebsite: '',
    companyAddress: '',
    headerTxtColor:'#FFFFFF'
  })

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [previewVisible, setPreviewVisible] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  useEffect(() => {
    fetchCustomization()
  }, [])

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      if (formData.previousBlobUrl) {
        URL.revokeObjectURL(formData.previousBlobUrl)
      }
    }
  }, [])

  const fetchCustomization = async () => {
    try {
      const res = await axiosInstance.get('/api/settings/customization/pdf')
      const {
        pdfHeader,
        pdfFooter,
        headerBgColor,
        headerLogo,
        companyName,
        companyPhone,
        companyEmail,
        companyWebsite,
        companyAddress,
        headerTxtColor
      } = res.data || {}

      const mockData = {
        pdfHeader: pdfHeader,
        pdfFooter: pdfFooter,
        headerBgColor: headerBgColor,
        headerLogo: headerLogo,
        companyName: companyName,
        companyPhone: companyPhone,
        companyEmail: companyEmail,
        companyWebsite: companyWebsite,
        companyAddress: companyAddress,
        headerTxtColor:headerTxtColor
      }

      setFormData((prev) => ({
        ...prev,
        pdfHeader: mockData.pdfHeader || '',
        pdfFooter: mockData.pdfFooter || '',
        headerBgColor: mockData.headerBgColor || '#000000',
        logoPreview: mockData.headerLogo || null,
        companyName: mockData.companyName || '',
        companyPhone: mockData.companyPhone || '',
        companyEmail: mockData.companyEmail || '',
        companyWebsite: mockData.companyWebsite || '',
        companyAddress: mockData.companyAddress || '',
        headerTxtColor: mockData.headerTxtColor || '#FFFFFF',
      }))
    } catch (err) {
      console.error('Failed to load customization:', err)
      setMessage({ type: 'danger', text: 'Failed to load existing settings.' })
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Helper function to get correct logo URL
  const getLogoUrl = (logoPreview) => {
    if (!logoPreview) return null

    // If it's a blob URL (new upload), use as-is
    if (logoPreview.startsWith('blob:')) {
      return logoPreview
    }

    // If it's a relative path (existing logo), prepend API URL
    return `${api_url}${logoPreview}`
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileValidation(e.dataTransfer.files[0])
    }
  }

  const handleFileValidation = (file) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'warning', text: 'Please select an image file (JPG, PNG, GIF).' })
      return
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'warning', text: 'Logo file size must be less than 5MB.' })
      return
    }

    // Clear any previous messages
    setMessage({ type: '', text: '' })

    // Clean up previous blob URL
    if (formData.previousBlobUrl) {
      URL.revokeObjectURL(formData.previousBlobUrl)
    }

    const blobUrl = URL.createObjectURL(file)
    setFormData((prev) => ({
      ...prev,
      logo: file,
      logoPreview: blobUrl,
      previousBlobUrl: blobUrl,
    }))
  }

  const handleLogoUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      handleFileValidation(file)
    }
  }

  const removeLogo = () => {
    if (formData.previousBlobUrl) {
      URL.revokeObjectURL(formData.previousBlobUrl)
    }
    setFormData(prev => ({
      ...prev,
      logo: null,
      logoPreview: null,
      previousBlobUrl: null
    }))
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      setMessage({ type: '', text: '' })

      // Validate required fields
      if (!formData.companyName.trim()) {
        setMessage({ type: 'warning', text: 'Company name is required.' })
        return
      }

      const formPayload = new FormData()
      formPayload.append('pdfHeader', formData.pdfHeader)
      formPayload.append('pdfFooter', formData.pdfFooter)
      formPayload.append('headerBgColor', formData.headerBgColor)
      formPayload.append('companyName', formData.companyName)
      formPayload.append('companyPhone', formData.companyPhone)
      formPayload.append('companyEmail', formData.companyEmail)
      formPayload.append('companyWebsite', formData.companyWebsite)
      formPayload.append('companyAddress', formData.companyAddress)
      formPayload.append('headerTxtColor', formData.headerTxtColor)

      if (formData.logo) {
        if (formData.logo.size > 5 * 1024 * 1024) {
          setMessage({ type: 'danger', text: 'Logo file size must be less than 5MB.' })
          return
        }
        formPayload.append('logo', formData.logo)
      }

      await axiosInstance.post('/api/settings/customization/pdf', formPayload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      setMessage({ type: 'success', text: 'PDF customization saved successfully!' })

      // Refresh data to get updated logo URL from server
      await fetchCustomization()

    } catch (err) {
      console.error('Failed to save:', err)

      if (err.response?.status === 413) {
        setMessage({ type: 'danger', text: 'File too large. Please choose a smaller logo.' })
      } else if (err.response?.status === 400) {
        setMessage({ type: 'danger', text: err.response.data?.message || 'Invalid data provided.' })
      } else if (err.response?.status === 500) {
        setMessage({ type: 'danger', text: 'Server error. Please try again later.' })
      } else {
        setMessage({ type: 'danger', text: 'Failed to save PDF customization. Please try again.' })
      }
    } finally {
      setLoading(false)
    }
  }

  const clearMessage = () => {
    setMessage({ type: '', text: '' })
  }

  return (
    <CContainer fluid className="p-2 m-2 main-pdf-cutome-div" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header Section */}
      <CCard className="border-0 shadow-sm mb-2" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <CCardBody className="py-4">
          <CRow className="align-items-center">
            <CCol>
              <div className="d-flex align-items-center gap-3">
                <div 
                  className="d-flex align-items-center justify-content-center setting-icon-div"
                  
                >
                  <CIcon icon={cilDescription} style={{ color: 'white', fontSize: '20px' }} />
                </div>
                <div>
                  <h3 className="text-white mb-1 fw-bold">PDF Layout Customization</h3>
                  <p className="text-white-50 mb-0">Configure your PDF documents appearance and company branding</p>
                </div>
              </div>
            </CCol>
            <CCol xs="auto">
              <div className="d-flex gap-2 preview-save-button">
                <CButton 
                  color="light" 
                  variant="outline"
                  className="shadow-sm px-4 fw-semibold d-flex align-items-center"
                  onClick={() => setPreviewVisible(true)}
                  disabled={loading}
                  style={{ 
                    borderRadius: '8px',
                    border: '2px solid white',
                    color: 'white',
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <CIcon icon={cilGlobeAlt} className="me-2" />
                  Preview PDF
                </CButton>
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
              </div>
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
        {/* PDF Header & Footer Section */}
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
                  <CIcon icon={cilDescription} style={{ color: 'white', fontSize: '14px' }} />
                </div>
                <div>
                  <h5 className="mb-0 fw-semibold text-dark">PDF Header & Footer</h5>
                  <small className="text-muted">Configure header text, footer content and colors</small>
                </div>
              </div>
            </div>
            
            <CCardBody className="p-4">
              <div className="mb-3">
                <CFormLabel className="fw-medium text-dark mb-2">Header Text</CFormLabel>
                <CFormInput
                  name="pdfHeader"
                  value={formData.pdfHeader}
                  onChange={handleChange}
                  placeholder="e.g. Invoice #12345"
                  style={{ 
                    border: '1px solid #e3e6f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    padding: '12px 16px'
                  }}
                />
              </div>

              <div className="mb-3">
                <CFormLabel className="fw-medium text-dark mb-2">Footer / Terms</CFormLabel>
                <CFormTextarea
                  name="pdfFooter"
                  value={formData.pdfFooter}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Enter terms, conditions, or signature block"
                  style={{ 
                    border: '1px solid #e3e6f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    padding: '12px 16px'
                  }}
                />
              </div>

              {/* Color Settings */}
              <div className="mb-4">
                <h6 className="fw-semibold text-dark mb-3 d-flex align-items-center gap-2">
                  <CBadge 
                    color="info" 
                    className="px-2 py-1"
                    style={{ borderRadius: '4px', fontSize: '10px' }}
                  >
                    COLORS
                  </CBadge>
                  Header Colors
                </h6>
                
                <CRow className="g-3">
                  <CCol sm={6}>
                    <CFormLabel className="fw-medium text-muted mb-2" style={{ fontSize: '13px' }}>Background Color</CFormLabel>
                    <div className="d-flex align-items-center gap-2">
                      <input
                        type="color"
                        name="headerBgColor"
                        value={formData.headerBgColor}
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
                        {formData.headerBgColor}
                      </CBadge>
                    </div>
                  </CCol>
                  <CCol sm={6}>
                    <CFormLabel className="fw-medium text-muted mb-2" style={{ fontSize: '13px' }}>Text Color</CFormLabel>
                    <div className="d-flex align-items-center gap-2">
                      <input
                        type="color"
                        name="headerTxtColor"
                        value={formData.headerTxtColor}
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
                        {formData.headerTxtColor}
                      </CBadge>
                    </div>
                  </CCol>
                </CRow>
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        {/* Company Information Section */}
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
                  <CIcon icon={cilBuilding} style={{ color: 'white', fontSize: '14px' }} />
                </div>
                <div>
                  <h5 className="mb-0 fw-semibold text-dark">Company Information</h5>
                  <small className="text-muted">Configure company details and logo for PDF documents</small>
                </div>
              </div>
            </div>
            
            <CCardBody className="p-4">
              <div className="mb-3">
                <CFormLabel className="fw-medium text-dark mb-2">Company Logo</CFormLabel>
                <div className="position-relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    style={{ display: 'none' }}
                    id="pdf-logo-upload"
                  />
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('pdf-logo-upload').click()}
                    className="position-absolute opacity-0 w-100 h-100"
                    style={{ zIndex: 2, cursor: 'pointer' }}
                  />
                  <div 
                    className="d-flex align-items-center justify-content-center p-4 text-center"
                    style={{
                      border: `2px dashed ${dragActive ? '#667eea' : '#e3e6f0'}`,
                      borderRadius: '8px',
                      backgroundColor: dragActive ? '#f0f8ff' : '#f8f9fa',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      minHeight: '120px'
                    }}
                  >
                    <div>
                      <CIcon icon={cilImage} className="mb-2" style={{ fontSize: '24px', color: '#6c757d' }} />
                      <p className="mb-0 text-muted">
                        {dragActive ? 'Drop logo here' : 'Choose Company Logo'}
                      </p>
                      <small className="text-muted">JPG, PNG, SVG up to 5MB</small>
                    </div>
                  </div>
                </div>
              </div>

              {formData.logoPreview && (
                <div className="mb-3">
                  <CFormLabel className="fw-medium text-dark mb-2">Logo Preview</CFormLabel>
                  <div 
                    className="d-flex align-items-center gap-3 p-3"
                    style={{
                      backgroundColor: '#f8f9fa',
                      borderRadius: '8px',
                      border: '1px solid #e9ecef'
                    }}
                  >
                    <img 
                      src={getLogoUrl(formData.logoPreview)} 
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
                      onClick={removeLogo}
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

              <CRow className="g-3 mb-3">
                <CCol sm={6}>
                  <CFormLabel className="fw-medium text-dark mb-2">Company Name *</CFormLabel>
                  <CFormInput
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    placeholder="Your Company Name"
                    style={{ 
                      border: '1px solid #e3e6f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      padding: '12px 16px'
                    }}
                    required
                  />
                </CCol>
                <CCol sm={6}>
                  <CFormLabel className="fw-medium text-dark mb-2">Phone Number</CFormLabel>
                  <CFormInput
                    name="companyPhone"
                    value={formData.companyPhone}
                    onChange={handleChange}
                    placeholder="+1 (555) 123-4567"
                    style={{ 
                      border: '1px solid #e3e6f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      padding: '12px 16px'
                    }}
                  />
                </CCol>
              </CRow>

              <CRow className="g-3 mb-3">
                <CCol sm={6}>
                  <CFormLabel className="fw-medium text-dark mb-2">Email Address</CFormLabel>
                  <CFormInput
                    name="companyEmail"
                    type="email"
                    value={formData.companyEmail}
                    onChange={handleChange}
                    placeholder="contact@company.com"
                    style={{ 
                      border: '1px solid #e3e6f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      padding: '12px 16px'
                    }}
                  />
                </CCol>
                <CCol sm={6}>
                  <CFormLabel className="fw-medium text-dark mb-2">Website</CFormLabel>
                  <CFormInput
                    name="companyWebsite"
                    value={formData.companyWebsite}
                    onChange={handleChange}
                    placeholder="www.company.com"
                    style={{ 
                      border: '1px solid #e3e6f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      padding: '12px 16px'
                    }}
                  />
                </CCol>
              </CRow>

              <div className="mb-0">
                <CFormLabel className="fw-medium text-dark mb-2">Business Address</CFormLabel>
                <CFormTextarea
                  name="companyAddress"
                  value={formData.companyAddress}
                  onChange={handleChange}
                  rows={3}
                  placeholder="123 Business St, City, State, ZIP"
                  style={{ 
                    border: '1px solid #e3e6f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    padding: '12px 16px'
                  }}
                />
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Enhanced Preview Modal */}
      <CModal
        visible={previewVisible}
        onClose={() => setPreviewVisible(false)}
        size="xl"
      >
        <CModalHeader style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: '20px 20px 0 0',
          padding: '1.5rem 2rem',
          border: 'none'
        }}>
          <CModalTitle style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>
            📄 PDF Preview (Live Preview)
          </CModalTitle>
        </CModalHeader>
        <CModalBody style={{ padding: '2rem', background: '#f8f9fa' }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
          }}>
            {/* Header with company logo and info */}
            <div style={{
              backgroundColor: formData.headerBgColor,
              color: formData.headerTxtColor,
              padding: '2rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              minHeight: '120px'
            }}>
              <div>
                {formData.logoPreview ? (
                  <img
                    src={getLogoUrl(formData.logoPreview)}
                    alt="Company Logo"
                    style={{
                      maxHeight: '80px',
                      maxWidth: '200px',
                      objectFit: 'contain',
                      background: 'rgba(255,255,255,0.1)',
                      padding: '0.5rem',
                      borderRadius: '8px'
                    }}
                  />
                ) : (
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>
                    {formData.pdfHeader || 'NJ Cabinets'}
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'right', fontSize: '0.95rem' }}>
                {formData.companyName && <div>{formData.companyName}</div>}
                {formData.companyPhone && <div>{formData.companyPhone}</div>}
                {formData.companyEmail && <div>{formData.companyEmail}</div>}
                {formData.companyWebsite && <div>{formData.companyWebsite}</div>}
                {formData.companyAddress && (
                  <div style={{ whiteSpace: 'pre-line', fontStyle: 'italic' }}>
                    {formData.companyAddress}
                  </div>
                )}
              </div>
            </div>

            {/* Project Details Section */}
            <div style={{ padding: '2rem' }}>
              <div style={{ marginBottom: '1.5rem', fontSize: '1rem', lineHeight: '1.6' }}>
                Dear ['User Name'],<br />
                We are glad you are using our services, here is your design and pricing info:
              </div>

              {/* Project Information Table */}
              <table style={{ width: '100%', marginBottom: '2rem', border: '1px solid #dee2e6', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '0.75rem', border: '1px solid #dee2e6', textAlign: 'left', fontWeight: 600 }}>Description</th>
                    <th style={{ padding: '0.75rem', border: '1px solid #dee2e6', textAlign: 'left', fontWeight: 600 }}>Designer</th>
                    <th style={{ padding: '0.75rem', border: '1px solid #dee2e6', textAlign: 'left', fontWeight: 600 }}>Customer</th>
                    <th style={{ padding: '0.75rem', border: '1px solid #dee2e6', textAlign: 'left', fontWeight: 600 }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}>kitchen project</td>
                    <td style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}>['Designer Name']</td>
                    <td style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}>['User Name']</td>
                    <td style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}>06/24/2025</td>
                  </tr>
                </tbody>
              </table>

              {/* Proposal Items Section */}
              <h3 style={{ color: '#2563eb', fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem' }}>
                PROPOSAL ITEMS
              </h3>

              {/* Items Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem', border: '1px solid #dee2e6' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '0.75rem', border: '1px solid #dee2e6', textAlign: 'left', fontWeight: 600 }}>No.</th>
                    <th style={{ padding: '0.75rem', border: '1px solid #dee2e6', textAlign: 'left', fontWeight: 600 }}>Qty</th>
                    <th style={{ padding: '0.75rem', border: '1px solid #dee2e6', textAlign: 'left', fontWeight: 600 }}>Item</th>
                    <th style={{ padding: '0.75rem', border: '1px solid #dee2e6', textAlign: 'left', fontWeight: 600 }}>Assembled</th>
                    <th style={{ padding: '0.75rem', border: '1px solid #dee2e6', textAlign: 'left', fontWeight: 600 }}>Hinge side</th>
                    <th style={{ padding: '0.75rem', border: '1px solid #dee2e6', textAlign: 'left', fontWeight: 600 }}>Exposed side</th>
                    <th style={{ padding: '0.75rem', border: '1px solid #dee2e6', textAlign: 'right', fontWeight: 600 }}>Price</th>
                    <th style={{ padding: '0.75rem', border: '1px solid #dee2e6', textAlign: 'right', fontWeight: 600 }}>Assembly cost</th>
                    <th style={{ padding: '0.75rem', border: '1px solid #dee2e6', textAlign: 'right', fontWeight: 600 }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '0.75rem', border: '1px solid #dee2e6', fontStyle: 'italic' }} colSpan={9}>Other</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}>1.</td>
                    <td style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}>1</td>
                    <td style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}>DD B21FD</td>
                    <td style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}>No</td>
                    <td style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}>N/A</td>
                    <td style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}>N/A</td>
                    <td style={{ padding: '0.75rem', border: '1px solid #dee2e6', textAlign: 'right' }}>$72.90</td>
                    <td style={{ padding: '0.75rem', border: '1px solid #dee2e6', textAlign: 'right' }}>$0.00</td>
                    <td style={{ padding: '0.75rem', border: '1px solid #dee2e6', textAlign: 'right' }}>$72.90</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}>2.</td>
                    <td style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}>12</td>
                    <td style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}>W2730</td>
                    <td style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}>No</td>
                    <td style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}>N/A</td>
                    <td style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}>N/A</td>
                    <td style={{ padding: '0.75rem', border: '1px solid #dee2e6', textAlign: 'right' }}>$129.60</td>
                    <td style={{ padding: '0.75rem', border: '1px solid #dee2e6', textAlign: 'right' }}>$0.00</td>
                    <td style={{ padding: '0.75rem', border: '1px solid #dee2e6', textAlign: 'right' }}>$1,555.20</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '0.75rem', border: '1px solid #dee2e6', fontStyle: 'italic' }} colSpan={9}>Modifications:</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}>-</td>
                    <td style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}>7</td>
                    <td style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}>SPEC BOOK</td>
                    <td style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}></td>
                    <td style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}></td>
                    <td style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}></td>
                    <td style={{ padding: '0.75rem', border: '1px solid #dee2e6', textAlign: 'right' }}>$31.00</td>
                    <td style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}></td>
                    <td style={{ padding: '0.75rem', border: '1px solid #dee2e6', textAlign: 'right' }}>$217.00</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}>3.</td>
                    <td style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}>1</td>
                    <td style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}>W3012</td>
                    <td style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}>Yes</td>
                    <td style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}>-</td>
                    <td style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}>-</td>
                    <td style={{ padding: '0.75rem', border: '1px solid #dee2e6', textAlign: 'right' }}>$88.20</td>
                    <td style={{ padding: '0.75rem', border: '1px solid #dee2e6', textAlign: 'right' }}>$0.00</td>
                    <td style={{ padding: '0.75rem', border: '1px solid #dee2e6', textAlign: 'right' }}>$88.20</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}>4.</td>
                    <td style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}>3</td>
                    <td style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}>W2436</td>
                    <td style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}>Yes</td>
                    <td style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}>-</td>
                    <td style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}>-</td>
                    <td style={{ padding: '0.75rem', border: '1px solid #dee2e6', textAlign: 'right' }}>$144.90</td>
                    <td style={{ padding: '0.75rem', border: '1px solid #dee2e6', textAlign: 'right' }}>$0.00</td>
                    <td style={{ padding: '0.75rem', border: '1px solid #dee2e6', textAlign: 'right' }}>$434.70</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '0.75rem', border: '1px solid #dee2e6', fontStyle: 'italic' }} colSpan={9}>Modifications:</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}>-</td>
                    <td style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}>1</td>
                    <td style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}>SPEC BOOK</td>
                    <td style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}></td>
                    <td style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}></td>
                    <td style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}></td>
                    <td style={{ padding: '0.75rem', border: '1px solid #dee2e6', textAlign: 'right' }}>$31.00</td>
                    <td style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}></td>
                    <td style={{ padding: '0.75rem', border: '1px solid #dee2e6', textAlign: 'right' }}>$31.00</td>
                  </tr>
                </tbody>
              </table>

              {/* Totals Section */}
              <div style={{
                backgroundColor: '#f8f9fa',
                padding: '1.5rem',
                borderRadius: '8px',
                marginBottom: '1.5rem',
                border: '1px solid #dee2e6'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '1rem' }}>
                  <span><strong>Cabinets & Parts:</strong></span>
                  <span><strong>$2,151.00</strong></span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '1rem' }}>
                  <span><strong>Assembly fee:</strong></span>
                  <span><strong>$58.10</strong></span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '1rem' }}>
                  <span><strong>Modifications:</strong></span>
                  <span><strong>$279.00</strong></span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '1rem', paddingTop: '0.5rem', borderTop: '1px solid #dee2e6' }}>
                  <span><strong>Style Total:</strong></span>
                  <span><strong>$2,488.10</strong></span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '1rem' }}>
                  <span><strong>Total:</strong></span>
                  <span><strong>$2,669.00</strong></span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '1rem' }}>
                  <span><strong>Tax:</strong></span>
                  <span><strong>$26.69</strong></span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  paddingTop: '0.5rem',
                  borderTop: '2px solid #495057',
                  marginTop: '0.5rem'
                }}>
                  <span>Grand Total:</span>
                  <span>$2,695.69</span>
                </div>
              </div>

              {/* Footer */}
              {formData.pdfFooter && (
                <div style={{
                  padding: '1.5rem',
                  backgroundColor: '#f8f9fa',
                  color: '#6c757d',
                  fontSize: '0.9rem',
                  lineHeight: '1.6',
                  borderTop: '1px solid #dee2e6',
                  whiteSpace: 'pre-line',
                  borderRadius: '8px',
                  marginTop: '1.5rem'
                }}>
                  {formData.pdfFooter}
                </div>
              )}
            </div>
          </div>
        </CModalBody>
      </CModal>
    </CContainer>
  )
}

export default PdfLayoutCustomization