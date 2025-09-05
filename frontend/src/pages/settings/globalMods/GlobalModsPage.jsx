import React, { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import axiosInstance from '../../../helpers/axiosInstance'
import PageHeader from '../../../components/PageHeader'
import {
  CCard, CCardBody, CCardHeader,
  CRow, CCol,
  CForm, CFormInput, CFormSelect, CFormTextarea, CFormCheck,
  CButton, CBadge, CTable, CTableHead, CTableRow, CTableHeaderCell, CTableBody, CTableDataCell,
  CModal, CModalHeader, CModalTitle, CModalBody
} from '@coreui/react'

const GlobalModsPage = () => {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [gallery, setGallery] = useState([])
  const [manufacturers, setManufacturers] = useState([])
  const [assignments, setAssignments] = useState([])

  // Forms
  const [newCategory, setNewCategory] = useState({ name: '', orderIndex: 0, image: '' })
  const [newTemplate, setNewTemplate] = useState({ categoryId: '', name: '', defaultPrice: '', isReady: false, fieldsConfigText: '', sampleImage: '' })
  const [guided, setGuided] = useState({
    sliders: {
      height: { enabled: false, min: 0, max: 0, step: 1, useCustomIncrements: false, customIncrements: ['1/8', '1/4', '3/8', '1/2', '5/8', '3/4', '7/8'] },
      width: { enabled: false, min: 0, max: 0, step: 1, useCustomIncrements: false, customIncrements: ['1/8', '1/4', '3/8', '1/2', '5/8', '3/4', '7/8'] },
      depth: { enabled: false, min: 0, max: 0, step: 1, useCustomIncrements: false, customIncrements: ['1/8', '1/4', '3/8', '1/2', '5/8', '3/4', '7/8'] }
    },
    sideSelector: { enabled: false, options: ['L','R'] },
    qtyRange: { enabled: false, min: 1, max: 10 },
    notes: { enabled: false, placeholder: '', showInRed: true },
    customerUpload: { enabled: false, required: false, title: '' },
    descriptions: { internal: '', customer: '', installer: '', both: false },
    modSampleImage: { enabled: false }
  })
  const [builderErrors, setBuilderErrors] = useState({})
  const [assignForm, setAssignForm] = useState({ templateId: '', manufacturerId: '', scope: 'all', targetStyle: '', targetType: '', catalogDataId: '', overridePrice: '' })

  // New states for enhanced workflow
  const [showCreateModModal, setShowCreateModModal] = useState(false)
  const [showGalleryModal, setShowGalleryModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false)
  const [selectedManufacturer, setSelectedManufacturer] = useState('')
  const [createStep, setCreateStep] = useState(1) // 1: submenu, 2: template builder
  const [selectedSubmenu, setSelectedSubmenu] = useState('')
  const [editCategory, setEditCategory] = useState({ id: '', name: '', orderIndex: 0, image: '' })
  const [showEditTemplateModal, setShowEditTemplateModal] = useState(false)
  const [editTemplate, setEditTemplate] = useState({ id: '', name: '', defaultPrice: '', sampleImage: '', fieldsConfig: null })

  // Task 6: Delete category modal states
  const [showDeleteCategoryModal, setShowDeleteCategoryModal] = useState(false)
  const [deleteCategory, setDeleteCategory] = useState({ id: '', name: '', templateCount: 0 })
  const [deleteMode, setDeleteMode] = useState('only') // 'only', 'withMods', 'move'
  const [moveToCategoryId, setMoveToCategoryId] = useState('')

  const flatTemplates = useMemo(() => {
    const list = []
    gallery.forEach(cat => {
      (cat.templates || []).forEach(tpl => list.push({ ...tpl, categoryName: cat.name }))
    })
    return list.sort((a,b) => a.name.localeCompare(b.name))
  }, [gallery])

  const loadAll = async (manufacturerIdForAssignments) => {
    setLoading(true)
    setError(null)
    try {
      const [gal, mans] = await Promise.all([
        axiosInstance.get('/api/global-mods/gallery'),
        axiosInstance.get('/api/manufacturers')
      ])
      setGallery(gal?.data?.gallery || [])
      setManufacturers(mans?.data?.manufacturers || [])
      if (manufacturerIdForAssignments) {
        const a = await axiosInstance.get('/api/global-mods/assignments', { params: { manufacturerId: manufacturerIdForAssignments } })
        setAssignments(a?.data?.assignments || [])
      } else {
        setAssignments([])
      }
    } catch (e) {
      setError(e?.response?.data?.message || e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAll() }, [])

  const createCategory = async () => {
    if (!newCategory.name.trim()) return
    await axiosInstance.post('/api/global-mods/categories', { name: newCategory.name.trim(), orderIndex: Number(newCategory.orderIndex || 0), image: newCategory.image || null })
    setNewCategory({ name: '', orderIndex: 0, image: '' })
    await loadAll(assignForm.manufacturerId)
  }

  const handleUploadImage = async (file) => {
    if (!file) return null
    const form = new FormData()
    // reuse existing fieldname from imageUpload middleware
    form.append('logoImage', file)
    const { data } = await axiosInstance.post('/api/global-mods/upload/image', form, { headers: { 'Content-Type': 'multipart/form-data' } })
    return data?.filename || null
  }

  const openEditCategory = (cat) => {
    setEditCategory({ id: cat.id, name: cat.name || '', orderIndex: cat.orderIndex || 0, image: cat.image || '' })
    setShowEditCategoryModal(true)
  }

  const saveEditCategory = async () => {
    if (!editCategory.id || !editCategory.name.trim()) return
    await axiosInstance.put(`/api/global-mods/categories/${editCategory.id}`, {
      name: editCategory.name.trim(),
      orderIndex: Number(editCategory.orderIndex || 0),
      image: editCategory.image || null
    })
    setShowEditCategoryModal(false)
    await loadAll(assignForm.manufacturerId)
  }

  // Task 6: Delete category functions
  const openDeleteCategory = (cat) => {
    const templateCount = (cat.templates || []).length
    setDeleteCategory({
      id: cat.id,
      name: cat.name || '',
      templateCount
    })
    setDeleteMode(templateCount > 0 ? 'move' : 'only')
    setMoveToCategoryId('')
    setShowDeleteCategoryModal(true)
  }

  const confirmDeleteCategory = async () => {
    try {
      if (!deleteCategory.id) return

      const params = new URLSearchParams({ mode: deleteMode })
      if (deleteMode === 'move' && moveToCategoryId) {
        params.append('moveToCategoryId', moveToCategoryId)
      }

      await axiosInstance.delete(`/api/global-mods/categories/${deleteCategory.id}?${params}`)

      setShowDeleteCategoryModal(false)
      await loadAll(assignForm.manufacturerId)

      const modeText = deleteMode === 'only'
        ? 'deleted'
        : deleteMode === 'withMods'
          ? 'deleted with all modifications'
          : 'deleted and modifications moved'

      alert(`Category "${deleteCategory.name}" ${modeText} successfully`)
    } catch (error) {
      console.error('Error deleting category:', error)
      alert(error.response?.data?.message || 'Failed to delete category')
    }
  }

  const openEditTemplate = (tpl) => {
    // Preserve additional fields so a partial save (like image upload) doesn't wipe them
    setEditTemplate({
      id: tpl.id,
      categoryId: tpl.categoryId || '',
      name: tpl.name || '',
      defaultPrice: tpl.defaultPrice || '',
      sampleImage: tpl.sampleImage || '',
      fieldsConfig: tpl.fieldsConfig || null,
      isReady: !!tpl.isReady,
    })
    setShowEditTemplateModal(true)
  }

  const saveEditTemplate = async () => {
    if (!editTemplate.id || !editTemplate.name.trim()) return
    // Send full context to avoid backend resetting unspecified fields
    await axiosInstance.put(`/api/global-mods/templates/${editTemplate.id}`, {
      categoryId: editTemplate.categoryId ? Number(editTemplate.categoryId) : null,
      name: editTemplate.name.trim(),
      defaultPrice: editTemplate.defaultPrice ? Number(editTemplate.defaultPrice) : null,
      fieldsConfig: editTemplate.fieldsConfig || null,
      sampleImage: editTemplate.sampleImage || null,
      isReady: !!editTemplate.isReady,
    })
    setShowEditTemplateModal(false)
    await loadAll(assignForm.manufacturerId)
  }

  const buildFieldsConfigFromGuided = () => {
    const cfg = {}
    const copy = guided
    // simple validation guards
    const nextErrors = {}

    // sliders with custom increments support
    const sliders = {}
    ;(['height','width','depth']).forEach(k => {
      const s = copy.sliders[k]
      if (s?.enabled) {
        const min = Number(s.min||0), max = Number(s.max||0), step = Number(s.step||1)
        if (isNaN(min) || isNaN(max) || isNaN(step) || step <= 0 || max < min) {
          nextErrors[k] = 'Invalid range or step'
        } else {
          const sliderConfig = { min, max, step }
          if (s.useCustomIncrements && Array.isArray(s.customIncrements) && s.customIncrements.length > 0) {
            sliderConfig.customIncrements = s.customIncrements
          }
          sliders[k] = sliderConfig
        }
      }
    })
    if (Object.keys(sliders).length) cfg.sliders = sliders

    if (copy.sideSelector?.enabled) cfg.sideSelector = { options: Array.isArray(copy.sideSelector.options) ? copy.sideSelector.options : ['L','R'] }
    if (copy.qtyRange?.enabled) {
      const qmin = Number(copy.qtyRange.min||1), qmax = Number(copy.qtyRange.max||10)
      if (isNaN(qmin) || isNaN(qmax) || qmax < qmin || qmin < 1) {
        nextErrors.qtyRange = 'Invalid quantity range'
      } else {
        cfg.qtyRange = { min: qmin, max: qmax }
      }
    }
    if (copy.notes?.enabled) cfg.notes = { placeholder: copy.notes.placeholder || '', showInRed: !!copy.notes.showInRed }
    if (copy.customerUpload?.enabled) cfg.customerUpload = { required: !!copy.customerUpload.required, title: copy.customerUpload.title || '' }
    if (copy.descriptions) {
      const desc = { ...copy.descriptions }
      delete desc.both // remove UI helper
      cfg.descriptions = desc
    }
    if (copy.modSampleImage?.enabled) cfg.modSampleImage = { enabled: true }

    setBuilderErrors(nextErrors)
    return cfg
  }

  const createTemplate = async () => {
    // Validate required fields
    if (!newTemplate.name.trim()) {
      alert('Template name is required')
      return
    }
    if (!newTemplate.defaultPrice || newTemplate.defaultPrice === '') {
      alert('Default price is required')
      return
    }

    // Prefer guided; if textarea provided, attempt parse and use as override
    let fieldsConfig = buildFieldsConfigFromGuided()
    if (newTemplate.fieldsConfigText && newTemplate.fieldsConfigText.trim().length) {
      try {
        fieldsConfig = JSON.parse(newTemplate.fieldsConfigText)
      } catch (_) {
        alert('fieldsConfig must be valid JSON')
        return
      }
    }
    await axiosInstance.post('/api/global-mods/templates', {
      categoryId: newTemplate.categoryId || null,
      name: newTemplate.name.trim(),
      defaultPrice: newTemplate.defaultPrice === '' ? null : Number(newTemplate.defaultPrice),
      isReady: !!newTemplate.isReady,
      fieldsConfig,
      sampleImage: newTemplate.sampleImage || null,
      // Task 5: GlobalModsPage creates blueprints (no manufacturerId)
      isBlueprint: true
    })
    resetTemplateForm()
    await loadAll(assignForm.manufacturerId)
  }

  const resetTemplateForm = () => {
    setNewTemplate({ categoryId: '', name: '', defaultPrice: '', isReady: false, fieldsConfigText: '', sampleImage: '' })
    setGuided({
      sliders: {
        height: { enabled: false, min: 0, max: 0, step: 1, useCustomIncrements: false, customIncrements: ['1/8', '1/4', '3/8', '1/2', '5/8', '3/4', '7/8'] },
        width: { enabled: false, min: 0, max: 0, step: 1, useCustomIncrements: false, customIncrements: ['1/8', '1/4', '3/8', '1/2', '5/8', '3/4', '7/8'] },
        depth: { enabled: false, min: 0, max: 0, step: 1, useCustomIncrements: false, customIncrements: ['1/8', '1/4', '3/8', '1/2', '5/8', '3/4', '7/8'] }
      },
      sideSelector: { enabled: false, options: ['L','R'] },
      qtyRange: { enabled: false, min: 1, max: 10 },
      notes: { enabled: false, placeholder: '', showInRed: true },
      customerUpload: { enabled: false, required: false, title: '' },
      descriptions: { internal: '', customer: '', installer: '', both: false },
      modSampleImage: { enabled: false }
    })
  }

  const onManufacturerChange = async (mid) => {
    setAssignForm(prev => ({ ...prev, manufacturerId: mid }))
    if (mid) {
      const a = await axiosInstance.get('/api/global-mods/assignments', { params: { manufacturerId: mid } })
      setAssignments(a?.data?.assignments || [])
    } else {
      setAssignments([])
    }
  }

  const assignTemplate = async () => {
    const payload = { ...assignForm }
    if (!payload.templateId || !payload.manufacturerId || !payload.scope) return
    // Coerce empty strings to null and numbers where appropriate
    payload.overridePrice = payload.overridePrice === '' ? null : Number(payload.overridePrice)
    payload.catalogDataId = payload.catalogDataId === '' ? null : Number(payload.catalogDataId)
    payload.targetStyle = payload.scope === 'style' ? payload.targetStyle || null : null
    payload.targetType = payload.scope === 'type' ? payload.targetType || null : null
    await axiosInstance.post('/api/global-mods/assignments', payload)
    // refresh
    await onManufacturerChange(assignForm.manufacturerId)
  }

  const deleteAssignment = async (id) => {
    await axiosInstance.delete(`/api/global-mods/assignments/${id}`)
    await onManufacturerChange(assignForm.manufacturerId)
  }

  return (
    <div className="container-fluid">
      {/* Main Action Buttons */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex gap-3 flex-wrap">
            <CButton color="primary" onClick={() => setShowCreateModModal(true)}>
              Add Modification
            </CButton>
            <CButton color="success" onClick={() => setShowGalleryModal(true)}>
              Modification Gallery
            </CButton>
            <CButton color="info" onClick={() => setShowAssignModal(true)}>
              Assign Modification
            </CButton>
          </div>
        </div>
      </div>

      <CRow>
        <CCol md={6}>
          <CCard className="mb-4">
            <CCardHeader>Global Modifications Gallery</CCardHeader>
            <CCardBody>
              {loading && <div>Loading…</div>}
              {error && <div className="text-danger">{error}</div>}
              {/* Category Creation Section */}
              <CCard className="mb-3 border-success">
                <CCardHeader className="bg-success text-white">
                  <h6 className="mb-0">Create New Category</h6>
                </CCardHeader>
                <CCardBody>
                  <CRow className="mb-3">
                    <CCol md={6}>
                      <label className="form-label">Category Name</label>
                      <CFormInput
                        placeholder="Enter category name (e.g., 'Product Dimensions')"
                        value={newCategory.name}
                        onChange={e => setNewCategory(c => ({ ...c, name: e.target.value }))}
                      />
                    </CCol>
                    <CCol md={3}>
                      <label className="form-label">Order</label>
                      <CFormInput
                        type="number"
                        placeholder="Order"
                        value={newCategory.orderIndex}
                        onChange={e => setNewCategory(c => ({ ...c, orderIndex: e.target.value }))}
                      />
                    </CCol>
                    <CCol md={3}>
                      <label className="form-label">Action</label>
                      <CButton color="primary" className="w-100" onClick={createCategory} disabled={!newCategory.name.trim()}>
                        Add Category
                      </CButton>
                    </CCol>
                  </CRow>
                  <CRow>
                    <CCol md={6}>
                      <label className="form-label">Category Image</label>
                      <CFormInput
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            const filename = await handleUploadImage(file)
                            if (filename) setNewCategory(c => ({ ...c, image: filename }))
                          }
                        }}
                      />
                      <small className="text-muted">Upload an icon to represent this category</small>
                    </CCol>
                    <CCol md={6}>
                      {newCategory.image ? (
                        <div className="mt-2">
                          <img
                            src={`${import.meta.env.VITE_API_URL || ''}/uploads/images/${newCategory.image}`}
                            alt="Category preview"
                            style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, border: '1px solid #dee2e6' }}
                            onError={(e) => { e.currentTarget.src = '/images/nologo.png' }}
                          />
                          <div className="mt-1">
                            <small className="text-success">✓ Image ready</small>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-muted p-3 border rounded mt-2" style={{ backgroundColor: '#f8f9fa', width: 60, height: 60 }}>
                          <small>📁</small>
                        </div>
                      )}
                    </CCol>
                  </CRow>
                </CCardBody>
              </CCard>

      {gallery.map(cat => (
                <div key={cat.id} className="mb-4">
                  <h6 className="mb-2 d-flex align-items-center gap-2">
                    {cat.image && (
                      <img src={`${import.meta.env.VITE_API_URL || ''}/uploads/images/${cat.image}`} alt={cat.name} width={28} height={28} style={{objectFit:'cover',borderRadius:4,border:'1px solid #e9ecef'}} onError={(e)=>{e.currentTarget.src='/images/nologo.png'}} />
                    )}
                    <span>{cat.name}</span>
                    <CBadge color="secondary">{(cat.templates || []).length}</CBadge>
                    <div className="ms-auto d-flex gap-1">
                      <CButton
                        size="sm"
                        color="warning"
                        variant="outline"
                        onClick={() => openEditCategory(cat)}
                        title="Edit category and upload image"
                      >
                        ✏️
                      </CButton>
                      {/* Task 6: Add delete category button */}
                      <CButton
                        size="sm"
                        color="danger"
                        variant="outline"
                        onClick={() => openDeleteCategory(cat)}
                        title="Delete category (with options for templates)"
                      >
                        🗑️
                      </CButton>
                    </div>
                  </h6>
                  <div className="row g-3">
                    {(cat.templates || []).map(tpl => (
                      <div key={tpl.id} className="col-12 col-md-6">
                        <div className="border rounded p-2 d-flex align-items-start position-relative" style={{ gap: 10 }}>
                          {(tpl.sampleImage || tpl.fieldsConfig?.modSampleImage?.enabled) && (
                            <img
                              src={tpl.sampleImage ? `${import.meta.env.VITE_API_URL || ''}/uploads/images/${tpl.sampleImage}` : '/images/nologo.png'}
                              alt={tpl.name}
                              style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 6, border: '1px solid #e9ecef' }}
                              onError={(e) => { e.currentTarget.src = '/images/nologo.png' }}
                            />
                          )}
                          <div className="flex-grow-1">
                            <div className="fw-semibold">{tpl.name}</div>
                            <div className="text-muted small">{tpl.defaultPrice != null ? `$${Number(tpl.defaultPrice).toFixed(2)}` : 'Blueprint'}</div>
                          </div>
                          <CButton
                            size="sm"
                            color="warning"
                            variant="outline"
                            className="position-absolute top-0 end-0 m-1"
                            onClick={() => openEditTemplate(tpl)}
                            title="Edit template and upload sample image"
                          >
                            ✏️
                          </CButton>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CCardBody>
          </CCard>
        </CCol>

        <CCol md={6}>
          <CCard className="mb-4">
            <CCardHeader>Create Template</CCardHeader>
            <CCardBody>
              {/* Required Fields Section */}
              <CCard className="mb-4 border-primary">
                <CCardHeader className="bg-primary text-white">
                  <h6 className="mb-0">Required Fields</h6>
                </CCardHeader>
                <CCardBody>
                  <CRow className="mb-3">
                    <CCol md={12}>
                      <label className="form-label">
                        Modification Name <span className="text-danger">*</span>
                      </label>
                      <CFormInput
                        placeholder="Enter modification name"
                        value={newTemplate.name}
                        onChange={e => setNewTemplate(n => ({ ...n, name: e.target.value }))}
                        className={!newTemplate.name.trim() ? 'border-danger' : ''}
                        required
                      />
                      {!newTemplate.name.trim() && (
                        <small className="text-danger">Modification name is required</small>
                      )}
                    </CCol>
                  </CRow>
                  <CRow className="mb-3">
                    <CCol md={12}>
                      <label className="form-label">
                        Default Price <span className="text-danger">*</span>
                      </label>
                      <CFormInput
                        type="number"
                        placeholder="Enter default price"
                        value={newTemplate.defaultPrice}
                        onChange={e => setNewTemplate(n => ({ ...n, defaultPrice: e.target.value }))}
                        className={!newTemplate.defaultPrice ? 'border-danger' : ''}
                        required
                      />
                      {!newTemplate.defaultPrice && (
                        <small className="text-danger">Default price is required</small>
                      )}
                    </CCol>
                  </CRow>
                </CCardBody>
              </CCard>

              {/* Optional Settings */}
              <CRow className="mb-3">
                <CCol md={6}>
                  <label className="form-label">Category (Optional)</label>
                  <CFormSelect value={newTemplate.categoryId} onChange={e => setNewTemplate(n => ({ ...n, categoryId: e.target.value }))}>
                    <option value="">No submenu</option>
                    {gallery.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
                  </CFormSelect>
                </CCol>
                <CCol md={6}>
                  <label className="form-label">Status</label>
                  <CFormSelect value={newTemplate.isReady ? '1' : '0'} onChange={e => setNewTemplate(n => ({ ...n, isReady: e.target.value === '1' }))}>
                    <option value="0">Draft</option>
                    <option value="1">Ready</option>
                  </CFormSelect>
                </CCol>
              </CRow>

              {/* Guided builder */}
              <div className="border rounded p-3 mb-3">
                <h6>Guided fields</h6>
                <CRow className="mb-2">
                  <CCol md={4}>
                    <CFormCheck label="Height slider" checked={guided.sliders.height.enabled} onChange={e=>setGuided(g=>({...g, sliders:{...g.sliders, height:{...g.sliders.height, enabled:e.target.checked}}}))} />
                    {guided.sliders.height.enabled && (
                      <div className="d-flex gap-2 mt-2">
                        <CFormInput type="number" placeholder="min" value={guided.sliders.height.min} onChange={e=>setGuided(g=>({...g, sliders:{...g.sliders, height:{...g.sliders.height, min:e.target.value}}}))} />
                        <CFormInput type="number" placeholder="max" value={guided.sliders.height.max} onChange={e=>setGuided(g=>({...g, sliders:{...g.sliders, height:{...g.sliders.height, max:e.target.value}}}))} />
                        <CFormInput type="number" placeholder="step" value={guided.sliders.height.step} onChange={e=>setGuided(g=>({...g, sliders:{...g.sliders, height:{...g.sliders.height, step:e.target.value}}}))} />
                        {builderErrors.height && <div className="text-danger small align-self-center">{builderErrors.height}</div>}
                      </div>
                    )}
                  </CCol>
                  <CCol md={4}>
                    <CFormCheck label="Width slider" checked={guided.sliders.width.enabled} onChange={e=>setGuided(g=>({...g, sliders:{...g.sliders, width:{...g.sliders.width, enabled:e.target.checked}}}))} />
                    {guided.sliders.width.enabled && (
                      <div className="d-flex gap-2 mt-2">
                        <CFormInput type="number" placeholder="min" value={guided.sliders.width.min} onChange={e=>setGuided(g=>({...g, sliders:{...g.sliders, width:{...g.sliders.width, min:e.target.value}}}))} />
                        <CFormInput type="number" placeholder="max" value={guided.sliders.width.max} onChange={e=>setGuided(g=>({...g, sliders:{...g.sliders, width:{...g.sliders.width, max:e.target.value}}}))} />
                        <CFormInput type="number" placeholder="step" value={guided.sliders.width.step} onChange={e=>setGuided(g=>({...g, sliders:{...g.sliders, width:{...g.sliders.width, step:e.target.value}}}))} />
                        {builderErrors.width && <div className="text-danger small align-self-center">{builderErrors.width}</div>}
                      </div>
                    )}
                  </CCol>
                  <CCol md={4}>
                    <CFormCheck label="Depth slider" checked={guided.sliders.depth.enabled} onChange={e=>setGuided(g=>({...g, sliders:{...g.sliders, depth:{...g.sliders.depth, enabled:e.target.checked}}}))} />
                    {guided.sliders.depth.enabled && (
                      <div className="d-flex gap-2 mt-2">
                        <CFormInput type="number" placeholder="min" value={guided.sliders.depth.min} onChange={e=>setGuided(g=>({...g, sliders:{...g.sliders, depth:{...g.sliders.depth, min:e.target.value}}}))} />
                        <CFormInput type="number" placeholder="max" value={guided.sliders.depth.max} onChange={e=>setGuided(g=>({...g, sliders:{...g.sliders, depth:{...g.sliders.depth, max:e.target.value}}}))} />
                        <CFormInput type="number" placeholder="step" value={guided.sliders.depth.step} onChange={e=>setGuided(g=>({...g, sliders:{...g.sliders, depth:{...g.sliders.depth, step:e.target.value}}}))} />
                        {builderErrors.depth && <div className="text-danger small align-self-center">{builderErrors.depth}</div>}
                      </div>
                    )}
                  </CCol>
                </CRow>

                <CRow className="mb-2">
                  <CCol md={6}>
                    <CFormCheck label="Side selector" checked={guided.sideSelector.enabled} onChange={e=>setGuided(g=>({...g, sideSelector:{...g.sideSelector, enabled:e.target.checked}}))} />
                    {guided.sideSelector.enabled && (
                      <CFormInput className="mt-2" placeholder="Options comma separated e.g. L,R" value={guided.sideSelector.options?.join(',')}
                        onChange={e=>setGuided(g=>({...g, sideSelector:{...g.sideSelector, options:e.target.value.split(',').map(s=>s.trim()).filter(Boolean)}}))} />
                    )}
                  </CCol>
                  <CCol md={6}>
                    <CFormCheck label="Quantity limits" checked={guided.qtyRange.enabled} onChange={e=>setGuided(g=>({...g, qtyRange:{...g.qtyRange, enabled:e.target.checked}}))} />
        {guided.qtyRange.enabled && (
                      <div className="d-flex gap-2 mt-2">
                        <CFormInput type="number" placeholder="min qty" value={guided.qtyRange.min} onChange={e=>setGuided(g=>({...g, qtyRange:{...g.qtyRange, min:e.target.value}}))} />
                        <CFormInput type="number" placeholder="max qty" value={guided.qtyRange.max} onChange={e=>setGuided(g=>({...g, qtyRange:{...g.qtyRange, max:e.target.value}}))} />
          {builderErrors.qtyRange && <div className="text-danger small align-self-center">{builderErrors.qtyRange}</div>}
                      </div>
                    )}
                  </CCol>
                </CRow>

                <CRow className="mb-2">
                  <CCol md={4}>
                    <CFormCheck label="Customer notes" checked={guided.notes.enabled} onChange={e=>setGuided(g=>({...g, notes:{...g.notes, enabled:e.target.checked}}))} />
                    {guided.notes.enabled && (
                      <div className="mt-2">
                        <CFormInput placeholder="Notes placeholder" value={guided.notes.placeholder} onChange={e=>setGuided(g=>({...g, notes:{...g.notes, placeholder:e.target.value}}))} />
                        <CFormCheck className="mt-1" label="Show in red for customer" checked={guided.notes.showInRed} onChange={e=>setGuided(g=>({...g, notes:{...g.notes, showInRed:e.target.checked}}))} />
                      </div>
                    )}
                  </CCol>
                  <CCol md={4}>
                    <CFormCheck label="Customer file upload" checked={guided.customerUpload.enabled} onChange={e=>setGuided(g=>({...g, customerUpload:{...g.customerUpload, enabled:e.target.checked}}))} />
                    {guided.customerUpload.enabled && (
                      <div className="mt-2">
                        <CFormInput placeholder="Upload title/reason" value={guided.customerUpload.title} onChange={e=>setGuided(g=>({...g, customerUpload:{...g.customerUpload, title:e.target.value}}))} />
                        <CFormCheck className="mt-1" label="Required" checked={guided.customerUpload.required} onChange={e=>setGuided(g=>({...g, customerUpload:{...g.customerUpload, required:e.target.checked}}))} />
                      </div>
                    )}
                  </CCol>
                  <CCol md={4}>
                    <CFormCheck label="Modification sample image" checked={guided.modSampleImage.enabled} onChange={e=>setGuided(g=>({...g, modSampleImage:{...g.modSampleImage, enabled:e.target.checked}}))} />
                  </CCol>
                </CRow>

                <CRow>
                  <CCol md={4}><CFormInput placeholder="Internal description" value={guided.descriptions.internal} onChange={e=>setGuided(g=>({...g, descriptions:{...g.descriptions, internal:e.target.value}}))} /></CCol>
                  <CCol md={4}><CFormInput placeholder="Customer description" value={guided.descriptions.customer} onChange={e=>setGuided(g=>({...g, descriptions:{...g.descriptions, customer:e.target.value}}))} /></CCol>
                  <CCol md={4}><CFormInput placeholder="Installer description" value={guided.descriptions.installer} onChange={e=>setGuided(g=>({...g, descriptions:{...g.descriptions, installer:e.target.value}}))} /></CCol>
                </CRow>
              </div>

              {/* Sample Image Upload Section */}
              <CCard className="mb-3 border-info">
                <CCardHeader className="bg-info text-white">
                  <h6 className="mb-0">Sample Image Upload</h6>
                </CCardHeader>
                <CCardBody>
                  <CRow className="align-items-center">
                    <CCol md={6}>
                      <label className="form-label mb-2">Upload Sample Image</label>
                      <CFormInput
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            const filename = await handleUploadImage(file)
                            if (filename) setNewTemplate(n => ({ ...n, sampleImage: filename }))
                          }
                        }}
                        className="mb-2"
                      />
                      <small className="text-muted">Upload an image to show customers what this modification looks like</small>
                    </CCol>
                    <CCol md={6}>
                      {newTemplate.sampleImage ? (
                        <div>
                          <img
                            src={`${import.meta.env.VITE_API_URL || ''}/uploads/images/${newTemplate.sampleImage}`}
                            alt="Sample preview"
                            style={{ width: '100%', maxHeight: 120, objectFit: 'cover', borderRadius: 8, border: '1px solid #dee2e6' }}
                            onError={(e) => { e.currentTarget.src = '/images/nologo.png' }}
                          />
                          <div className="mt-2">
                            <small className="text-success">✓ Image uploaded: {newTemplate.sampleImage}</small>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-muted p-4 border rounded" style={{ backgroundColor: '#f8f9fa' }}>
                          <div>📷</div>
                          <small>No sample image uploaded</small>
                        </div>
                      )}
                    </CCol>
                  </CRow>
                </CCardBody>
              </CCard>

              <CFormTextarea rows={6} placeholder='Optional fields config (JSON): {"sliders": {"width": {"min": 1, "max": 60, "step": 1}}}' value={newTemplate.fieldsConfigText} onChange={e => setNewTemplate(n => ({ ...n, fieldsConfigText: e.target.value }))} />
              <div className="mt-3"><CButton color="success" onClick={createTemplate} disabled={Object.keys(builderErrors).length > 0 || !newTemplate.name.trim() || !newTemplate.defaultPrice}>Save Template</CButton></div>
            </CCardBody>
          </CCard>

          <CCard>
            <CCardHeader>Assign Template</CCardHeader>
            <CCardBody>
              <CRow className="mb-3">
                <CCol md={6}>
                  <CFormSelect value={assignForm.templateId} onChange={e => setAssignForm(a => ({ ...a, templateId: e.target.value }))}>
                    <option value="">Select template</option>
                    {flatTemplates.map(t => (
                      <option key={t.id} value={t.id}>{t.categoryName ? `[${t.categoryName}] ` : ''}{t.name}</option>
                    ))}
                  </CFormSelect>
                </CCol>
                <CCol md={6}>
                  <CFormSelect value={assignForm.manufacturerId} onChange={e => onManufacturerChange(e.target.value)}>
                    <option value="">Select manufacturer</option>
                    {manufacturers.map(m => (<option key={m.id} value={m.id}>{m.name}</option>))}
                  </CFormSelect>
                </CCol>
              </CRow>
              <CRow className="mb-3">
                <CCol md={4}>
                  <CFormSelect value={assignForm.scope} onChange={e => setAssignForm(a => ({ ...a, scope: e.target.value }))}>
                    <option value="all">All items</option>
                    <option value="style">Style</option>
                    <option value="type">Type</option>
                    <option value="item">Single item</option>
                  </CFormSelect>
                </CCol>
                <CCol md={4}>
                  {assignForm.scope === 'style' && (
                    <CFormInput placeholder="Target style (name)" value={assignForm.targetStyle} onChange={e => setAssignForm(a => ({ ...a, targetStyle: e.target.value }))} />
                  )}
                  {assignForm.scope === 'type' && (
                    <CFormInput placeholder="Target type (name)" value={assignForm.targetType} onChange={e => setAssignForm(a => ({ ...a, targetType: e.target.value }))} />
                  )}
                  {assignForm.scope === 'item' && (
                    <CFormInput type="number" placeholder="Catalog Item ID" value={assignForm.catalogDataId} onChange={e => setAssignForm(a => ({ ...a, catalogDataId: e.target.value }))} />
                  )}
                </CCol>
                <CCol md={4}>
                  <CFormInput type="number" placeholder="Override price (optional)" value={assignForm.overridePrice} onChange={e => setAssignForm(a => ({ ...a, overridePrice: e.target.value }))} />
                </CCol>
              </CRow>
              <CButton color="primary" onClick={assignTemplate} disabled={!assignForm.templateId || !assignForm.manufacturerId}>Assign</CButton>

              <div className="mt-4">
                <h6>Current Assignments</h6>
                <CTable small hover responsive>
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell>Template</CTableHeaderCell>
                      <CTableHeaderCell>Scope</CTableHeaderCell>
                      <CTableHeaderCell>Target</CTableHeaderCell>
                      <CTableHeaderCell>Price</CTableHeaderCell>
                      <CTableHeaderCell></CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {assignments.map(a => (
                      <CTableRow key={a.id}>
                        <CTableDataCell>{a.template?.name}</CTableDataCell>
                        <CTableDataCell>{a.scope}</CTableDataCell>
                        <CTableDataCell>{a.scope === 'style' ? a.targetStyle : a.scope === 'type' ? a.targetType : a.scope === 'item' ? `Item ${a.catalogDataId}` : 'All'}</CTableDataCell>
                        <CTableDataCell>{a.overridePrice != null ? `$${Number(a.overridePrice).toFixed(2)}` : (a.template?.defaultPrice != null ? `$${Number(a.template.defaultPrice).toFixed(2)}` : '—')}</CTableDataCell>
                        <CTableDataCell>
                          <CButton color="danger" size="sm" onClick={() => deleteAssignment(a.id)}>Remove</CButton>
                        </CTableDataCell>
                      </CTableRow>
                    ))}
                    {!assignments.length && (
                      <CTableRow><CTableDataCell colSpan={5} className="text-muted">No assignments</CTableDataCell></CTableRow>
                    )}
                  </CTableBody>
                </CTable>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Add Modification Modal */}
      <CModal visible={showCreateModModal} onClose={() => setShowCreateModModal(false)} size="lg">
        <PageHeader title="Add Modification" />
        <CModalBody>
              {createStep === 1 && (
            <div>
              <h6>Step 1: Select or Create Submenu</h6>
              <CFormSelect value={selectedSubmenu} onChange={e => setSelectedSubmenu(e.target.value)}>
                <option value="">Select existing submenu...</option>
                {gallery.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
                <option value="new">Create new submenu</option>
              </CFormSelect>

              {selectedSubmenu === 'new' && (
                <div className="mt-3">
                  <CFormInput
                    placeholder="New submenu name"
                    value={newCategory.name}
                    onChange={e => setNewCategory(n => ({ ...n, name: e.target.value }))}
                  />
                  <CFormInput
                    type="number"
                    placeholder="Order index"
                    value={newCategory.orderIndex}
                    onChange={e => setNewCategory(n => ({ ...n, orderIndex: e.target.value }))}
                    className="mt-2"
                  />
                      <CFormInput
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          const filename = await handleUploadImage(file)
                          if (filename) setNewCategory(n => ({ ...n, image: filename }))
                        }}
                        className="mt-2"
                      />
                </div>
              )}

              <div className="mt-3 d-flex gap-2">
                <CButton color="secondary" onClick={() => setShowCreateModModal(false)}>Cancel</CButton>
                <CButton
                  color="primary"
                  onClick={() => setCreateStep(2)}
                  disabled={!selectedSubmenu || (selectedSubmenu === 'new' && !newCategory.name)}
                >
                  Next: Template Builder
                </CButton>
              </div>
            </div>
          )}

          {createStep === 2 && (
            <div>
              <h6>Step 2: Template Builder</h6>

              {/* Required Fields Section */}
              <CCard className="mb-4 border-primary">
                <CCardHeader className="bg-primary text-white">
                  <h6 className="mb-0">Required Fields</h6>
                </CCardHeader>
                <CCardBody>
                  <CRow className="mb-3">
                    <CCol md={6}>
                      <label className="form-label">
                        Modification Name <span className="text-danger">*</span>
                      </label>
                      <CFormInput
                        placeholder="Enter modification name"
                        value={newTemplate.name}
                        onChange={e => setNewTemplate(n => ({ ...n, name: e.target.value }))}
                        className={!newTemplate.name.trim() ? 'border-danger' : ''}
                        required
                      />
                      {!newTemplate.name.trim() && (
                        <small className="text-danger">Modification name is required</small>
                      )}
                    </CCol>
                    <CCol md={6}>
                      <label className="form-label">
                        Default Price <span className="text-danger">*</span>
                      </label>
                      <CFormInput
                        type="number"
                        placeholder="Enter default price"
                        value={newTemplate.defaultPrice}
                        onChange={e => setNewTemplate(n => ({ ...n, defaultPrice: e.target.value }))}
                        className={!newTemplate.defaultPrice ? 'border-danger' : ''}
                        required
                      />
                      {!newTemplate.defaultPrice && (
                        <small className="text-danger">Default price is required</small>
                      )}
                    </CCol>
                  </CRow>
                </CCardBody>
              </CCard>

              {/* Guided builder - same as main form */}
              <div className="border rounded p-3 mb-3">
                <h6>Field Configuration</h6>
                <CRow className="mb-2">
                  <CCol md={4}>
                    <CFormCheck label="Height slider" checked={guided.sliders.height.enabled} onChange={e=>setGuided(g=>({...g, sliders:{...g.sliders, height:{...g.sliders.height, enabled:e.target.checked}}}))} />
                    {guided.sliders.height.enabled && (
                      <div className="d-flex gap-2 mt-2">
                        <CFormInput type="number" placeholder="min" value={guided.sliders.height.min} onChange={e=>setGuided(g=>({...g, sliders:{...g.sliders, height:{...g.sliders.height, min:e.target.value}}}))} />
                        <CFormInput type="number" placeholder="max" value={guided.sliders.height.max} onChange={e=>setGuided(g=>({...g, sliders:{...g.sliders, height:{...g.sliders.height, max:e.target.value}}}))} />
                        <CFormSelect value={guided.sliders.height.useCustomIncrements ? 'custom' : guided.sliders.height.step} onChange={e=>setGuided(g=>({...g, sliders:{...g.sliders, height:{...g.sliders.height, step:e.target.value==='custom'?1:e.target.value, useCustomIncrements:e.target.value==='custom'}}}))}>
                          <option value="1">1</option>
                          <option value="0.5">0.5</option>
                          <option value="0.25">0.25</option>
                          <option value="custom">Custom fractions</option>
                        </CFormSelect>
                      </div>
                    )}
                  </CCol>
                  <CCol md={4}>
                    <CFormCheck label="Width slider" checked={guided.sliders.width.enabled} onChange={e=>setGuided(g=>({...g, sliders:{...g.sliders, width:{...g.sliders.width, enabled:e.target.checked}}}))} />
                    {guided.sliders.width.enabled && (
                      <div className="d-flex gap-2 mt-2">
                        <CFormInput type="number" placeholder="min" value={guided.sliders.width.min} onChange={e=>setGuided(g=>({...g, sliders:{...g.sliders, width:{...g.sliders.width, min:e.target.value}}}))} />
                        <CFormInput type="number" placeholder="max" value={guided.sliders.width.max} onChange={e=>setGuided(g=>({...g, sliders:{...g.sliders, width:{...g.sliders.width, max:e.target.value}}}))} />
                        <CFormSelect value={guided.sliders.width.useCustomIncrements ? 'custom' : guided.sliders.width.step} onChange={e=>setGuided(g=>({...g, sliders:{...g.sliders, width:{...g.sliders.width, step:e.target.value==='custom'?1:e.target.value, useCustomIncrements:e.target.value==='custom'}}}))}>
                          <option value="1">1</option>
                          <option value="0.5">0.5</option>
                          <option value="0.25">0.25</option>
                          <option value="custom">Custom fractions</option>
                        </CFormSelect>
                      </div>
                    )}
                  </CCol>
                  <CCol md={4}>
                    <CFormCheck label="Depth slider" checked={guided.sliders.depth.enabled} onChange={e=>setGuided(g=>({...g, sliders:{...g.sliders, depth:{...g.sliders.depth, enabled:e.target.checked}}}))} />
                    {guided.sliders.depth.enabled && (
                      <div className="d-flex gap-2 mt-2">
                        <CFormInput type="number" placeholder="min" value={guided.sliders.depth.min} onChange={e=>setGuided(g=>({...g, sliders:{...g.sliders, depth:{...g.sliders.depth, min:e.target.value}}}))} />
                        <CFormInput type="number" placeholder="max" value={guided.sliders.depth.max} onChange={e=>setGuided(g=>({...g, sliders:{...g.sliders, depth:{...g.sliders.depth, max:e.target.value}}}))} />
                        <CFormSelect value={guided.sliders.depth.useCustomIncrements ? 'custom' : guided.sliders.depth.step} onChange={e=>setGuided(g=>({...g, sliders:{...g.sliders, depth:{...g.sliders.depth, step:e.target.value==='custom'?1:e.target.value, useCustomIncrements:e.target.value==='custom'}}}))}>
                          <option value="1">1</option>
                          <option value="0.5">0.5</option>
                          <option value="0.25">0.25</option>
                          <option value="custom">Custom fractions</option>
                        </CFormSelect>
                      </div>
                    )}
                  </CCol>
                </CRow>

                <CRow className="mb-2">
                  <CCol md={6}>
                    <CFormCheck label="Side selector" checked={guided.sideSelector.enabled} onChange={e=>setGuided(g=>({...g, sideSelector:{...g.sideSelector, enabled:e.target.checked}}))} />
                    {guided.sideSelector.enabled && (
                      <CFormInput className="mt-2" placeholder="Options comma separated e.g. L,R" value={guided.sideSelector.options?.join(',')}
                        onChange={e=>setGuided(g=>({...g, sideSelector:{...g.sideSelector, options:e.target.value.split(',').map(s=>s.trim()).filter(Boolean)}}))} />
                    )}
                  </CCol>
                  <CCol md={6}>
                    <CFormCheck label="Quantity limits" checked={guided.qtyRange.enabled} onChange={e=>setGuided(g=>({...g, qtyRange:{...g.qtyRange, enabled:e.target.checked}}))} />
                    {guided.qtyRange.enabled && (
                      <div className="d-flex gap-2 mt-2">
                        <CFormInput type="number" placeholder="min qty" value={guided.qtyRange.min} onChange={e=>setGuided(g=>({...g, qtyRange:{...g.qtyRange, min:e.target.value}}))} />
                        <CFormInput type="number" placeholder="max qty" value={guided.qtyRange.max} onChange={e=>setGuided(g=>({...g, qtyRange:{...g.qtyRange, max:e.target.value}}))} />
                      </div>
                    )}
                  </CCol>
                </CRow>

                <CRow className="mb-2">
                  <CCol md={4}>
                    <CFormCheck label="Customer notes" checked={guided.notes.enabled} onChange={e=>setGuided(g=>({...g, notes:{...g.notes, enabled:e.target.checked}}))} />
                    {guided.notes.enabled && (
                      <div className="mt-2">
                        <CFormInput placeholder="Notes placeholder" value={guided.notes.placeholder} onChange={e=>setGuided(g=>({...g, notes:{...g.notes, placeholder:e.target.value}}))} />
                        <CFormCheck className="mt-1" label="Show in red for customer" checked={guided.notes.showInRed} onChange={e=>setGuided(g=>({...g, notes:{...g.notes, showInRed:e.target.checked}}))} />
                      </div>
                    )}
                  </CCol>
                  <CCol md={4}>
                    <CFormCheck label="Customer file upload" checked={guided.customerUpload.enabled} onChange={e=>setGuided(g=>({...g, customerUpload:{...g.customerUpload, enabled:e.target.checked}}))} />
                    {guided.customerUpload.enabled && (
                      <div className="mt-2">
                        <CFormInput placeholder="Upload title/reason" value={guided.customerUpload.title} onChange={e=>setGuided(g=>({...g, customerUpload:{...g.customerUpload, title:e.target.value}}))} />
                        <CFormCheck className="mt-1" label="Required" checked={guided.customerUpload.required} onChange={e=>setGuided(g=>({...g, customerUpload:{...g.customerUpload, required:e.target.checked}}))} />
                      </div>
                    )}
                  </CCol>
                  <CCol md={4}>
                    <CFormCheck label="Modification sample image" checked={guided.modSampleImage.enabled} onChange={e=>setGuided(g=>({...g, modSampleImage:{...g.modSampleImage, enabled:e.target.checked}}))} />
                  </CCol>
                </CRow>

                <CRow>
                  <CCol md={4}><CFormInput placeholder="Internal description" value={guided.descriptions.internal} onChange={e=>setGuided(g=>({...g, descriptions:{...g.descriptions, internal:e.target.value}}))} /></CCol>
                  <CCol md={4}><CFormInput placeholder="Customer description" value={guided.descriptions.customer} onChange={e=>setGuided(g=>({...g, descriptions:{...g.descriptions, customer:e.target.value}}))} /></CCol>
                  <CCol md={4}><CFormInput placeholder="Installer description" value={guided.descriptions.installer} onChange={e=>setGuided(g=>({...g, descriptions:{...g.descriptions, installer:e.target.value}}))} /></CCol>
                </CRow>
              </div>

              {/* Sample Image Upload Section */}
              <CCard className="mb-3 border-info">
                <CCardHeader className="bg-info text-white">
                  <h6 className="mb-0">Sample Image Upload</h6>
                </CCardHeader>
                <CCardBody>
                  <CRow className="align-items-center">
                    <CCol md={6}>
                      <label className="form-label mb-2">Upload Sample Image</label>
                      <CFormInput
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            const filename = await handleUploadImage(file)
                            if (filename) setNewTemplate(n => ({ ...n, sampleImage: filename }))
                          }
                        }}
                        className="mb-2"
                      />
                      <small className="text-muted">Upload an image to show customers what this modification looks like</small>
                    </CCol>
                    <CCol md={6}>
                      {newTemplate.sampleImage ? (
                        <div>
                          <img
                            src={`${import.meta.env.VITE_API_URL || ''}/uploads/images/${newTemplate.sampleImage}`}
                            alt="Sample preview"
                            style={{ width: '100%', maxHeight: 120, objectFit: 'cover', borderRadius: 8, border: '1px solid #dee2e6' }}
                            onError={(e) => { e.currentTarget.src = '/images/nologo.png' }}
                          />
                          <div className="mt-2">
                            <small className="text-success">✓ Image uploaded: {newTemplate.sampleImage}</small>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-muted p-4 border rounded" style={{ backgroundColor: '#f8f9fa' }}>
                          <div>📷</div>
                          <small>No sample image uploaded</small>
                        </div>
                      )}
                    </CCol>
                  </CRow>
                </CCardBody>
              </CCard>

              <div className="d-flex gap-2">
                <CButton color="secondary" onClick={() => setCreateStep(1)}>Back</CButton>
                <CButton color="secondary" onClick={() => setShowCreateModModal(false)}>Cancel</CButton>
                <CButton
                  color="primary"
                  onClick={async () => {
                    if (selectedSubmenu === 'new') {
                      await createCategory()
                    }
                    setNewTemplate(prev => ({...prev, categoryId: selectedSubmenu === 'new' ? gallery[gallery.length-1]?.id : selectedSubmenu}))
                    await createTemplate()
                    setShowCreateModModal(false)
                    setCreateStep(1)
                  }}
                  disabled={!newTemplate.name.trim() || !newTemplate.defaultPrice}
                >
                  Create Template
                </CButton>
              </div>
            </div>
          )}
        </CModalBody>
      </CModal>

      {/* Edit Category Modal */}
      <CModal visible={showEditCategoryModal} onClose={() => setShowEditCategoryModal(false)} size="md">
        <PageHeader title="Edit Category" />
        <CModalBody>
          <CRow className="mb-3">
            <CCol md={8}>
              <CFormInput placeholder="Category name" value={editCategory.name} onChange={e=>setEditCategory(c=>({...c, name:e.target.value}))} />
            </CCol>
            <CCol md={4}>
              <CFormInput type="number" placeholder="Order" value={editCategory.orderIndex} onChange={e=>setEditCategory(c=>({...c, orderIndex:e.target.value}))} />
            </CCol>
          </CRow>
          <CRow className="mb-3">
            <CCol md={12}>
              <CFormInput type="file" accept="image/*" onChange={async (e) => {
                const file = e.target.files?.[0]
                const filename = await handleUploadImage(file)
                if (filename) setEditCategory(c => ({ ...c, image: filename }))
              }} />
              {editCategory.image && (
                <div className="mt-2">
                  <img src={`${import.meta.env.VITE_API_URL || ''}/uploads/images/${editCategory.image}`} alt="Category" style={{width: '100%', maxHeight: 140, objectFit: 'cover', borderRadius: 8, border: '1px solid #e9ecef'}} onError={(e)=>{e.currentTarget.src='/images/nologo.png'}} />
                </div>
              )}
            </CCol>
          </CRow>
          <div className="d-flex gap-2 justify-content-end">
            <CButton color="secondary" onClick={() => setShowEditCategoryModal(false)}>Cancel</CButton>
            <CButton color="primary" onClick={saveEditCategory} disabled={!editCategory.name.trim()}>Save</CButton>
          </div>
        </CModalBody>
      </CModal>

      {/* Edit Template Modal */}
      <CModal visible={showEditTemplateModal} onClose={() => setShowEditTemplateModal(false)} size="lg">
        <CModalHeader>Edit Template</CModalHeader>
        <CModalBody>
          <CRow className="mb-3">
            <CCol md={6}>
              <label className="form-label">Template Name</label>
              <CFormInput placeholder="Template name" value={editTemplate.name} onChange={e=>setEditTemplate(t=>({...t, name:e.target.value}))} />
            </CCol>
            <CCol md={6}>
              <label className="form-label">Default Price</label>
              <CFormInput type="number" step="0.01" placeholder="Price" value={editTemplate.defaultPrice} onChange={e=>setEditTemplate(t=>({...t, defaultPrice:e.target.value}))} />
            </CCol>
          </CRow>
          <CRow className="mb-3">
            <CCol md={12}>
              <label className="form-label">Sample Image Upload</label>
              <CFormInput type="file" accept="image/*" onChange={async (e) => {
                const file = e.target.files?.[0]
                const filename = await handleUploadImage(file)
                if (filename) setEditTemplate(t => ({ ...t, sampleImage: filename }))
              }} />
              {editTemplate.sampleImage && (
                <div className="mt-2">
                  <img src={`${import.meta.env.VITE_API_URL || ''}/uploads/images/${editTemplate.sampleImage}`} alt="Sample" style={{width: '100%', maxHeight: 140, objectFit: 'cover', borderRadius: 8, border: '1px solid #e9ecef'}} onError={(e)=>{e.currentTarget.src='/images/nologo.png'}} />
                </div>
              )}
            </CCol>
          </CRow>
          {/* Task 7: Add "Mark as Ready" toggle */}
          <CRow className="mb-3">
            <CCol md={12}>
              <div className="border-top pt-3">
                <CFormCheck
                  label="Mark as Ready (enables assignment options)"
                  checked={editTemplate.isReady}
                  onChange={e => setEditTemplate(t => ({ ...t, isReady: e.target.checked }))}
                />
                <small className="text-muted d-block mt-1">
                  Ready modifications can be assigned to manufacturers and used in proposals.
                </small>
              </div>
            </CCol>
          </CRow>
          <div className="d-flex gap-2 justify-content-end">
            <CButton color="secondary" onClick={() => setShowEditTemplateModal(false)}>Cancel</CButton>
            <CButton color="primary" onClick={saveEditTemplate} disabled={!editTemplate.name.trim()}>Save Changes</CButton>
          </div>
        </CModalBody>
      </CModal>

      {/* Modification Gallery Modal */}
      <CModal visible={showGalleryModal} onClose={() => setShowGalleryModal(false)} size="xl">
        <PageHeader title="Modification Gallery" />
        <CModalBody>
          <div className="row">
            {gallery.map(category => (
              <div key={category.id} className="col-md-6 mb-4">
                <div className="card">
                  <div className="card-header">
                    <h6 className="mb-0 d-flex align-items-center gap-2">
                      {category.image && (
                        <>
                          <img
                            src={`${import.meta.env.VITE_API_URL || ''}/uploads/images/${category.image}`}
                            alt={category.name}
                            width={20}
                            height={20}
                            style={{ objectFit: 'cover', borderRadius: 4, border: '1px solid #e9ecef' }}
                            onError={(e)=>{ e.currentTarget.src='/images/nologo.png' }}
                          />
                          <CBadge color="info" title="Category image uploaded">Img</CBadge>
                        </>
                      )}
                      {category.name}
                    </h6>
                  </div>
                  <div className="card-body">
                    {category.templates?.length ? (
                      category.templates.map(template => (
                        <div key={template.id} className="d-flex justify-content-between align-items-center mb-2 p-2 border rounded">
                          <div>
                            <strong>{template.name}</strong>
                            {template.defaultPrice && <span className="text-muted"> - ${Number(template.defaultPrice).toFixed(2)}</span>}
                            <CBadge color={template.isReady ? 'success' : 'warning'} className="ms-2">
                              {template.isReady ? 'Ready' : 'Draft'}
                            </CBadge>
                          </div>
                          <CButton
                            size="sm"
                            color="primary"
                            onClick={async () => {
                              // Immediately create a new template cloned from this one (independent of existing assignments)
                              try {
                                await axiosInstance.post('/api/global-mods/templates', {
                                  categoryId: template.categoryId || null,
                                  name: `${template.name} (Copy)`,
                                  defaultPrice: template.defaultPrice != null ? Number(template.defaultPrice) : 0,
                                  isReady: false,
                                  fieldsConfig: template.fieldsConfig || {},
                                  sampleImage: template.sampleImage || null,
                                })
                                // Refresh gallery and close modal
                                await loadAll(assignForm.manufacturerId)
                                setShowGalleryModal(false)
                              } catch (e) {
                                alert(e?.response?.data?.message || e.message)
                              }
                            }}
                          >
                            Use as Blueprint
                          </CButton>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted">No templates in this category</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CModalBody>
      </CModal>

      {/* Assign Modification Modal */}
      <CModal visible={showAssignModal} onClose={() => setShowAssignModal(false)} size="lg">
        <PageHeader title="Assign Modification" />
        <CModalBody>
          <CRow className="mb-3">
            <CCol md={6}>
              <CFormSelect value={selectedManufacturer} onChange={e => setSelectedManufacturer(e.target.value)}>
                <option value="">Select manufacturer...</option>
                {manufacturers.map(m => (<option key={m.id} value={m.id}>{m.name}</option>))}
              </CFormSelect>
            </CCol>
            <CCol md={6}>
              <CFormSelect value={assignForm.templateId} onChange={e => setAssignForm(a => ({ ...a, templateId: e.target.value }))}>
                <option value="">Select template...</option>
                {flatTemplates.map(t => (
                  <option key={t.id} value={t.id}>{t.categoryName ? `${t.categoryName} > ${t.name}` : t.name}</option>
                ))}
              </CFormSelect>
            </CCol>
          </CRow>

          <CRow className="mb-3">
            <CCol md={4}>
              <CFormSelect value={assignForm.scope} onChange={e => setAssignForm(a => ({ ...a, scope: e.target.value, targetStyle: '', targetType: '', catalogDataId: '' }))}>
                <option value="all">All items</option>
                <option value="style">Specific style</option>
                <option value="type">Specific type</option>
                <option value="item">Specific item</option>
              </CFormSelect>
            </CCol>
            <CCol md={4}>
              {assignForm.scope === 'style' && (
                <CFormInput placeholder="Style name" value={assignForm.targetStyle} onChange={e => setAssignForm(a => ({ ...a, targetStyle: e.target.value }))} />
              )}
              {assignForm.scope === 'type' && (
                <CFormInput placeholder="Type name" value={assignForm.targetType} onChange={e => setAssignForm(a => ({ ...a, targetType: e.target.value }))} />
              )}
              {assignForm.scope === 'item' && (
                <CFormInput placeholder="Catalog item ID" value={assignForm.catalogDataId} onChange={e => setAssignForm(a => ({ ...a, catalogDataId: e.target.value }))} />
              )}
            </CCol>
            <CCol md={4}>
              <CFormInput type="number" placeholder="Override price (optional)" value={assignForm.overridePrice} onChange={e => setAssignForm(a => ({ ...a, overridePrice: e.target.value }))} />
            </CCol>
          </CRow>

          <div className="d-flex gap-2">
            <CButton color="secondary" onClick={() => setShowAssignModal(false)}>Cancel</CButton>
            <CButton
              color="primary"
              onClick={async () => {
                setAssignForm(prev => ({...prev, manufacturerId: selectedManufacturer}))
                await assignTemplate()
                setShowAssignModal(false)
              }}
              disabled={!assignForm.templateId || !selectedManufacturer}
            >
              Assign
            </CButton>
          </div>
        </CModalBody>
      </CModal>

      {/* Task 6: Delete Category Modal */}
      <CModal visible={showDeleteCategoryModal} onClose={() => setShowDeleteCategoryModal(false)} size="lg">
        <CModalHeader>
          <CModalTitle>Delete Category: {deleteCategory.name}</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <div className="alert alert-warning">
            <strong>⚠️ Warning:</strong> You are about to delete the category "{deleteCategory.name}".
          </div>

          {deleteCategory.templateCount > 0 ? (
            <div>
              <p>This category contains <strong>{deleteCategory.templateCount} modification{deleteCategory.templateCount !== 1 ? 's' : ''}</strong>. What would you like to do with them?</p>

              <div className="mb-3">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="deleteMode"
                    id="moveMode"
                    checked={deleteMode === 'move'}
                    onChange={() => setDeleteMode('move')}
                  />
                  <label className="form-check-label" htmlFor="moveMode">
                    <strong>Move modifications to another category</strong> (Recommended)
                  </label>
                </div>

                {deleteMode === 'move' && (
                  <div className="mt-2 ms-4">
                    <CFormSelect
                      value={moveToCategoryId}
                      onChange={e => setMoveToCategoryId(e.target.value)}
                      className="w-50"
                    >
                      <option value="">Select target category...</option>
                      {gallery
                        .filter(cat => cat.id !== deleteCategory.id)
                        .map(cat => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name} ({(cat.templates || []).length} existing)
                          </option>
                        ))
                      }
                    </CFormSelect>
                    {!moveToCategoryId && (
                      <small className="text-muted d-block mt-1">
                        You must select a target category to move the modifications.
                      </small>
                    )}
                  </div>
                )}

                <div className="form-check mt-2">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="deleteMode"
                    id="withModsMode"
                    checked={deleteMode === 'withMods'}
                    onChange={() => setDeleteMode('withMods')}
                  />
                  <label className="form-check-label" htmlFor="withModsMode">
                    <strong className="text-danger">Delete category AND all modifications</strong> (Permanent)
                  </label>
                </div>

                {deleteMode === 'withMods' && (
                  <div className="alert alert-danger mt-2 ms-4">
                    <small>
                      ⚠️ This will permanently delete all {deleteCategory.templateCount} modification{deleteCategory.templateCount !== 1 ? 's' : ''} in this category.
                      This action cannot be undone.
                    </small>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p>This category is empty and can be safely deleted.</p>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowDeleteCategoryModal(false)}>
            Cancel
          </CButton>
          <CButton
            color="danger"
            onClick={confirmDeleteCategory}
            disabled={deleteMode === 'move' && !moveToCategoryId}
          >
            {deleteMode === 'only' ? 'Delete Category' :
             deleteMode === 'withMods' ? 'Delete Category & Modifications' :
             'Delete Category & Move Modifications'}
          </CButton>
        </CModalFooter>
      </CModal>
    </div>
  )
}

export default GlobalModsPage
