import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import {
  CModal,
  CModalBody,
  CButton,
  CFormInput,
  CSpinner,
  CBreadcrumb,
  CBreadcrumbItem,
  CCard,
  CCardBody,
  CRow,
  CCol,
  CBadge,
  CFormCheck,
  CFormTextarea,
  CFormRange
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilArrowLeft, cilMagnifyingGlass, cilX } from '@coreui/icons'
import axiosInstance from '../../helpers/axiosInstance'
import Swal from 'sweetalert2'
import PageHeader from '../PageHeader'
import { useTranslation } from 'react-i18next'

const ModificationBrowserModal = ({
  visible,
  onClose,
  onApplyModification,
  selectedItemIndex,
  catalogItemId
}) => {
  const [loading, setLoading] = useState(false)
  const { t } = useTranslation()
  const [searchTerm, setSearchTerm] = useState('')
  const [gallery, setGallery] = useState([])
  const [currentView, setCurrentView] = useState('categories') // 'categories', 'templates', 'details'
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [modification, setModification] = useState({
    quantity: 1,
    selectedOptions: {},
    uploadedFiles: []
  })

  // Load assigned modifications for the specific catalog item
  const loadAssignedModifications = async () => {
    setLoading(true)
    try {
      if (!catalogItemId) {
        setGallery([])
        return
      }

      const response = await axiosInstance.get(`/api/global-mods/item/${catalogItemId}`)
      const assignments = response.data?.assignments || []

      // Group assignments by category to create the gallery structure
      const categoryMap = new Map()

      assignments.forEach(assignment => {
        const template = assignment.template
        if (!template) return

        // Prefer assignment.category provided by the API; template only has categoryId
  const categoryName = assignment.category?.name || t('common.none','None')
        const categoryId = assignment.category?.id || 'uncategorized'

        if (!categoryMap.has(categoryId)) {
          categoryMap.set(categoryId, {
            id: categoryId,
            name: categoryName,
            templates: []
          })
        }

        // Add the template with assignment data
        categoryMap.get(categoryId).templates.push({
          ...template,
          assignmentId: assignment.id,
          overridePrice: assignment.overridePrice,
          effectivePrice: assignment.overridePrice ?? template.defaultPrice,
          scope: assignment.scope
        })
      })

      setGallery(Array.from(categoryMap.values()))
    } catch (error) {
      console.error('Error loading assigned modifications:', error)
  Swal.fire(t('common.error','Error'), t('proposals.toast.errorGeneric','An error occurred'), 'error')
      setGallery([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (visible && catalogItemId) {
      loadAssignedModifications()
      // Reset state when modal opens
      setCurrentView('categories')
      setSelectedCategory(null)
      setSelectedTemplate(null)
      setSearchTerm('')
      setModification({
        quantity: 1,
        selectedOptions: {},
        uploadedFiles: []
      })
    }
  }, [visible, catalogItemId])

  // Filter categories based on search
  const filteredCategories = gallery.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.templates || []).some(template =>
      template.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  // Filter templates in selected category
  const filteredTemplates = selectedCategory?.templates?.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  // Handle category selection
  const handleCategorySelect = (category) => {
    setSelectedCategory(category)
    setCurrentView('templates')
    setSearchTerm('')
  }

  // Handle template selection
  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template)
    setCurrentView('details')
    setSearchTerm('')

    // Initialize modification state with default values from the saved configuration
    const config = template.fieldsConfig || {}
    const initialOptions = {}
    const initialQuantity = (config.qtyRange && config.qtyRange.enabled !== false) ? config.qtyRange.min : 1

    // Set default values for sliders based on saved configuration
    if (config.sliders) {
      Object.keys(config.sliders).forEach(sliderKey => {
        const slider = config.sliders[sliderKey]
        // Support both new format (no enabled flag = enabled) and old format (enabled flag)
        const isEnabled = slider.enabled !== false
        if (isEnabled) {
          initialOptions[sliderKey] = slider.min || 0
        }
      })
    }

    // Set default value for side selector if configured and enabled
    if (config.sideSelector && (config.sideSelector.enabled !== false) && config.sideSelector.options && config.sideSelector.options.length > 0) {
      initialOptions.sideSelector = config.sideSelector.options[0]
    }

    setModification(prev => ({
      ...prev,
      quantity: initialQuantity,
      selectedOptions: initialOptions,
      uploadedFiles: []
    }))
  }

  // Handle back navigation
  const handleBack = () => {
    if (currentView === 'details') {
      setCurrentView('templates')
      setSelectedTemplate(null)
    } else if (currentView === 'templates') {
      setCurrentView('categories')
      setSelectedCategory(null)
    }
    setSearchTerm('')
  }

  // Apply modification
  const handleApplyModification = async () => {
    if (!selectedTemplate) return

    // Validate required customer upload
    const cfg = selectedTemplate.fieldsConfig || {}
    if (cfg.customerUpload && cfg.customerUpload.enabled !== false && cfg.customerUpload.required && (!modification.uploadedFiles || modification.uploadedFiles.length === 0)) {
  Swal.fire(t('common.warning','Warning'), t('proposalUI.custom.validation.missingFile','This modification requires a file upload. Please attach at least one file.'), 'warning')
      return
    }

    // If there are files, upload them first via resources API
    let attachments = []
    try {
      if (Array.isArray(modification.uploadedFiles) && modification.uploadedFiles.length > 0) {
        const uploads = await Promise.all(
          modification.uploadedFiles.map(async (file) => {
            const form = new FormData()
            form.append('file', file)
            const { data } = await axiosInstance.post('/api/resources/files', form, { headers: { 'Content-Type': 'multipart/form-data' } })
            const f = data?.data || data
            return f ? {
              id: f.id,
              url: f.url || `/api/resources/files/download/${f.id}`,
              name: f.original_name || f.name || file.name,
              mimeType: f.mime_type || file.type || '',
              size: f.file_size || file.size
            } : null
          })
        )
        attachments = uploads.filter(Boolean)
      }
    } catch (err) {
      console.error('Upload failed:', err)
  Swal.fire(t('common.error','Error'), t('proposalUI.custom.validation.uploadFailed','Could not upload one or more files. Please try again.'), 'error')
      return
    }

    const modificationData = {
      templateId: selectedTemplate.id,
      templateName: selectedTemplate.name,
      categoryName: selectedCategory?.name || '',
      quantity: modification.quantity,
      note: selectedTemplate.fieldsConfig?.notes?.placeholder || '', // Use the pre-configured note
      selectedOptions: modification.selectedOptions,
      price: selectedTemplate.effectivePrice || selectedTemplate.defaultPrice || 0,
      taxable: true, // Default to taxable
      scope: selectedTemplate.scope,
      assignmentId: selectedTemplate.assignmentId,
      attachments
    }

    try {
      await onApplyModification(selectedItemIndex, modificationData)
  Swal.fire(t('common.success','Success'), t('proposalUI.custom.applied','Modification applied successfully!'), 'success')
      onClose()
    } catch (error) {
      console.error('Error applying modification:', error)
  Swal.fire(t('common.error','Error'), t('proposalUI.custom.applyFailed','Failed to apply modification'), 'error')
    }
  }

  // Render modification configuration based on fieldsConfig
  const renderModificationConfig = () => {
    if (!selectedTemplate?.fieldsConfig) {
      return (
        <div className="alert alert-info">
    <small>{t('proposalUI.custom.noOptions','This modification template has no configurable options.')}</small>
        </div>
      )
    }

    const config = selectedTemplate.fieldsConfig
    const { selectedOptions } = modification

    // helper to format inches nicely (e.g., 15 1/4") when decimals exist
    const formatInches = (num) => {
      const value = Number(num)
      if (Number.isNaN(value)) return `${num}\"`
      const whole = Math.floor(value)
      const frac = value - whole
      // map to nearest 1/8 fraction for readability
      const eighth = Math.round(frac * 8)
      const fractionMap = {
        0: '',
        1: '1/8',
        2: '1/4',
        3: '3/8',
        4: '1/2',
        5: '5/8',
        6: '3/4',
        7: '7/8',
        8: '', // roll into next inch if exactly 1
      }
      let parts = []
      let w = whole
      let fracLabel = fractionMap[eighth]
      if (eighth === 8) {
        w = whole + 1
        fracLabel = ''
      }
      if (w > 0) parts.push(String(w))
      if (fracLabel) parts.push(fracLabel)
      const label = parts.length ? parts.join(' ') : '0'
      return `${label}\"`
    }

    return (
      <div className="modification-config mt-4">
        {/* Sliders - only show enabled ones */}
        {config.sliders && Object.keys(config.sliders).map(sliderKey => {
          const slider = config.sliders[sliderKey]

          // Only render if the slider exists (enabled sliders are included in config)
          // Support both new format (no enabled flag = enabled) and old format (enabled flag)
          const isEnabled = slider.enabled !== false // If enabled is undefined, treat as enabled
          if (!isEnabled) return null

      const currentValue = selectedOptions[sliderKey] || slider.min

          return (
            <div key={sliderKey} className="mb-4">
              <label className="form-label text-capitalize">
            {t('proposalUI.custom.choose','Choose')} {sliderKey}: <strong>{formatInches(currentValue)}</strong>
              </label>
              <CFormRange
                min={slider.min}
                max={slider.max}
                step={slider.step || 1}
                value={currentValue}
                onChange={(e) => setModification(prev => ({
                  ...prev,
                  selectedOptions: {
                    ...prev.selectedOptions,
                    [sliderKey]: Number(e.target.value)
                  }
                }))}
                className="mb-2"
              />
              <div className="d-flex justify-content-between text-muted small">
        <span>{formatInches(slider.min)}</span>
        <span>{formatInches(slider.max)}</span>
              </div>
            </div>
          )
        })}

        {/* Side Selector - only show if enabled */}
        {config.sideSelector && (config.sideSelector.enabled !== false) && (
          <div className="mb-4">
            <label className="form-label fw-bold">Side Selection</label>
            <div className="d-flex gap-2">
              {config.sideSelector.options.map(option => {
                const isSelected = selectedOptions.sideSelector === option;
                const displayLabel = option === 'L' ? 'Left' : option === 'R' ? 'Right' : option;

                return (
                  <button
                    key={option}
                    type="button"
                    className={`btn ${isSelected ? 'btn-primary' : 'btn-outline-primary'} px-4 py-2 fw-semibold`}
                    style={{
                      minWidth: '80px',
                      border: isSelected ? '2px solid #0d6efd' : '2px solid #6c757d',
                      backgroundColor: isSelected ? '#0d6efd' : '#ffffff',
                      color: isSelected ? '#ffffff' : '#495057',
                      fontWeight: '600'
                    }}
                    onClick={() => setModification(prev => ({
                      ...prev,
                      selectedOptions: {
                        ...prev.selectedOptions,
                        sideSelector: option
                      }
                    }))}
                  >
                    {displayLabel}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Quantity Range - only show if enabled */}
        {config.qtyRange && (config.qtyRange.enabled !== false) && (
          <div className="mb-4">
            <label className="form-label">Quantity</label>
            <CFormInput
              type="number"
              min={config.qtyRange.min}
              max={config.qtyRange.max}
              value={modification.quantity}
              onChange={(e) => setModification(prev => ({
                ...prev,
                quantity: Math.max(config.qtyRange.min, Math.min(config.qtyRange.max, Number(e.target.value)))
              }))}
            />
          </div>
        )}

        {/* Notes - only show if enabled, read-only display */}
        {config.notes && (config.notes.enabled !== false) && (
          <div className="mb-4">
            <label className="form-label">Notes</label>
            <div className="form-control-plaintext border rounded p-2 bg-light text-danger">
              {config.notes.placeholder || 'No additional notes configured for this modification.'}
            </div>
          </div>
        )}

        {/* Customer Upload - only show if enabled */}
        {config.customerUpload && (config.customerUpload.enabled !== false) && (
          <div className="mb-4">
            <label className="form-label">
              {config.customerUpload.title || 'File Upload'}
              {config.customerUpload.required && <span className="text-danger"> *</span>}
            </label>
            <CFormInput
              type="file"
              multiple
              onChange={(e) => setModification(prev => ({
                ...prev,
                uploadedFiles: Array.from(e.target.files)
              }))}
            />
          </div>
        )}
      </div>
    )
  }

  // Render breadcrumb navigation
  const renderBreadcrumb = () => {
    return (
      <CBreadcrumb className="mb-0 small">
        <CBreadcrumbItem
          active={currentView === 'categories'}
          style={{ cursor: 'pointer', color: currentView === 'categories' ? '#084298' : '#6c757d' }}
          onClick={() => currentView !== 'categories' && setCurrentView('categories')}
        >
          All
        </CBreadcrumbItem>

        {selectedCategory && (
          <CBreadcrumbItem
            active={currentView === 'templates'}
            style={{ cursor: 'pointer', color: currentView === 'templates' ? '#084298' : '#6c757d' }}
            onClick={() => currentView === 'details' && setCurrentView('templates')}
          >
            {selectedCategory.name}
          </CBreadcrumbItem>
        )}

        {selectedTemplate && (
          <CBreadcrumbItem active style={{ color: '#084298' }}>
            {selectedTemplate.name}
          </CBreadcrumbItem>
        )}
      </CBreadcrumb>
    )
  }

  return (
    <CModal
      visible={visible}
      onClose={onClose}
      size="lg"
      scrollable
    >
      {/* Header using PageHeader component */}
      <PageHeader
        title="Modifications"
        mobileLayout="inline"
        rightContent={
          <div className="d-flex align-items-center gap-2">
            {currentView !== 'categories' && (
              <CButton
                color="primary"
                size="sm"
                onClick={handleBack}
                className="me-2"
                aria-label="Back"
                title="Back"
              >
                <CIcon icon={cilArrowLeft} className="me-1" />
                <span>Back</span>
              </CButton>
            )}
            <CButton
              color="light"
              size="sm"
              onClick={onClose}
            >
              <CIcon icon={cilX} />
            </CButton>
          </div>
        }
      />

      <CModalBody className="p-2">
        {/* Breadcrumb Navigation */}
        <div className="mb-2">
          {renderBreadcrumb()}
        </div>

        {/* Search */}
        <div className="position-relative mb-3">
          <CIcon
            icon={cilMagnifyingGlass}
            className="position-absolute"
            style={{
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#6c757d'
            }}
          />
          <CFormInput
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '40px' }}
          />
        </div>

        {loading ? (
          <div className="text-center py-5">
            <CSpinner color="primary" />
            <p className="mt-2 text-muted">Loading modifications...</p>
          </div>
        ) : gallery.length === 0 ? (
          <div className="text-center py-5">
            <div className="text-muted">
              <CIcon icon={cilMagnifyingGlass} size="4xl" className="mb-3" />
              <h5>No Modifications Available</h5>
              <p>No modifications have been assigned to this catalog item.</p>
              <p className="small">Contact your administrator to set up modifications for this item.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Categories View */}
            {currentView === 'categories' && (
              <CRow className="g-3">
                {filteredCategories.map(category => (
                  <CCol sm={6} md={4} lg={3} key={category.id} className="mb-3">
                    <CCard
                      className="h-100 border-0 shadow-sm"
                      style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                      onClick={() => handleCategorySelect(category)}
                    >
                      <CCardBody className="d-flex flex-column p-3">
                        {category.image && (
                          <div className="mb-2 text-center">
                            <img
                              src={`${import.meta.env.VITE_API_URL || ''}/uploads/images/${category.image}`}
                              alt={category.name}
                              style={{ width: '100%', maxHeight: 100, objectFit: 'cover', borderRadius: 6, border: '1px solid #e9ecef' }}
                              onError={(e) => { e.currentTarget.src = '/images/nologo.png' }}
                            />
                          </div>
                        )}
                        <h6 className="card-title mb-1 fs-6">{category.name}</h6>
                        <p className="text-muted small mb-2">
                          {category.templates?.length || 0} modification{(category.templates?.length || 0) !== 1 ? 's' : ''}
                        </p>
                        <div className="mt-auto">
                          <CBadge color="primary" className="px-2 py-1 small">
                            Browse →
                          </CBadge>
                        </div>
                      </CCardBody>
                    </CCard>
                  </CCol>
                ))}
              </CRow>
            )}

            {/* Templates View */}
            {currentView === 'templates' && (
              <CRow className="g-3">
                {filteredTemplates.map(template => (
                  <CCol sm={6} md={4} lg={3} key={template.id} className="mb-3">
                    <CCard
                      className="h-100 border-0 shadow-sm"
                      style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                      onClick={() => handleTemplateSelect(template)}
                    >
                      <CCardBody className="d-flex flex-column p-3">
                        {/* Sample image preview */}
                        {(template.sampleImage || template.fieldsConfig?.modSampleImage?.enabled) && (
                          <div className="mb-2 text-center" style={{ height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8f9fa', borderRadius: 6, border: '1px solid #e9ecef' }}>
                            <img
                              src={template.sampleImage ? `${import.meta.env.VITE_API_URL || ''}/uploads/images/${template.sampleImage}` : '/images/nologo.png'}
                              alt={template.name}
                              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 4 }}
                              onError={(e) => { e.currentTarget.src = '/images/nologo.png' }}
                            />
                          </div>
                        )}
                        <div className="d-flex justify-content-between align-items-start mb-1">
                          <h6 className="card-title mb-0 fs-6">{template.name}</h6>
                          <CBadge color={template.isReady ? 'success' : 'warning'} className="small">
                            {template.isReady ? 'Ready' : 'Draft'}
                          </CBadge>
                        </div>
                        {template.descriptions?.customer && (
                          <p className="text-muted small mb-2 text-truncate">{template.descriptions.customer}</p>
                        )}
                        {template.effectivePrice && (
                          <p className="mb-2 small">
                            <strong>${Number(template.effectivePrice).toFixed(2)}</strong>
                            {template.overridePrice && (
                              <small className="text-muted ms-1">(Override)</small>
                            )}
                          </p>
                        )}
                        <div className="mt-auto">
                          <CBadge color="primary" className="px-2 py-1 small">
                            Configure →
                          </CBadge>
                        </div>
                      </CCardBody>
                    </CCard>
                  </CCol>
                ))}
              </CRow>
            )}

            {/* Details View */}
            {currentView === 'details' && selectedTemplate && (
              <div>
                <CCard className="border-0 shadow-sm">
                  <CCardBody className="p-3">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <h4 className="mb-1">{selectedTemplate.name}</h4>
                        <p className="text-muted mb-2">{selectedTemplate.descriptions?.customer}</p>
                      </div>
                      <div className="text-end">
                        {selectedTemplate.effectivePrice && (
                          <h4 className="mb-0">${Number(selectedTemplate.effectivePrice).toFixed(2)}</h4>
                        )}
                        {selectedTemplate.overridePrice && (
                          <small className="text-muted">Override price</small>
                        )}
                        <CBadge color={selectedTemplate.isReady ? 'success' : 'warning'} className="ms-2">
                          {selectedTemplate.isReady ? 'Ready' : 'Draft'}
                        </CBadge>
                      </div>
                    </div>

                    {/* Sample image large preview */}
                    {(selectedTemplate.sampleImage || selectedTemplate.fieldsConfig?.modSampleImage?.enabled) && (
                      <div className="mb-3" style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8f9fa', borderRadius: 8, border: '1px solid #e9ecef' }}>
                        <img
                          src={selectedTemplate.sampleImage ? `${import.meta.env.VITE_API_URL || ''}/uploads/images/${selectedTemplate.sampleImage}` : '/images/nologo.png'}
                          alt={selectedTemplate.name}
                          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 6 }}
                          onError={(e) => { e.currentTarget.src = '/images/nologo.png' }}
                        />
                      </div>
                    )}

                    {/* Lead time notice */}
                    <div className="alert alert-warning mb-3 py-2" role="alert">
                      <small>
                        <strong>Please Note:</strong> This item has an extended lead time of 8 days.
                      </small>
                    </div>

                    {/* Modification Configuration */}
                    {renderModificationConfig()}

                    {/* Default quantity if not configured or not enabled */}
                    {(!selectedTemplate.fieldsConfig?.qtyRange || selectedTemplate.fieldsConfig.qtyRange.enabled === false) && (
                      <div className="mb-3">
                        <label className="form-label">Qty</label>
                        <CFormInput
                          type="number"
                          min={1}
                          value={modification.quantity}
                          onChange={(e) => setModification(prev => ({
                            ...prev,
                            quantity: Math.max(1, Number(e.target.value))
                          }))}
                          style={{ width: '100px' }}
                        />
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="d-flex justify-content-end gap-2 mt-3">
                      <CButton
                        color="primary"
                        onClick={handleApplyModification}
                        disabled={!selectedTemplate}
                      >
                        Add modification
                      </CButton>
                    </div>
                  </CCardBody>
                </CCard>
              </div>
            )}
          </>
        )}
      </CModalBody>
    </CModal>
  )
}

export default ModificationBrowserModal
