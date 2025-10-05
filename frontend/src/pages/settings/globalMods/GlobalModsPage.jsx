import React, { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { Trans, useTranslation } from 'react-i18next'
import axiosInstance from '../../../helpers/axiosInstance'
import PageHeader from '../../../components/PageHeader'
import { Badge, Box, Button, CardBody, CardHeader, Checkbox, Flex, FormControl, FormLabel, Heading, Image, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Radio, RadioGroup, Select, SimpleGrid, Stack, Table, TableContainer, Tbody, Td, Text, Textarea, Th, Thead, Tr, useColorModeValue } from '@chakra-ui/react'
import StandardCard from '../../../components/StandardCard'
import { AppIconButton } from '../../../components/common/AppButton'

const GlobalModsPage = () => {
  const { t } = useTranslation()

  // Color mode values
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const tableBorderColor = useColorModeValue('gray.200', 'gray.700')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [gallery, setGallery] = useState([])
  const [manufacturers, setManufacturers] = useState([])
  const [assignments, setAssignments] = useState([])

  // Forms
  const [newCategory, setNewCategory] = useState({ name: '', orderIndex: 0, image: '' })
  const [newTemplate, setNewTemplate] = useState({
    categoryId: '',
    name: '',
    defaultPrice: '',
    isReady: false,
    fieldsConfigText: '',
    sampleImage: '',
  })
  const [guided, setGuided] = useState({
    sliders: {
      height: {
        enabled: false,
        min: 0,
        max: 0,
        step: 1,
        useCustomIncrements: false,
        customIncrements: ['1/8', '1/4', '3/8', '1/2', '5/8', '3/4', '7/8'],
      },
      width: {
        enabled: false,
        min: 0,
        max: 0,
        step: 1,
        useCustomIncrements: false,
        customIncrements: ['1/8', '1/4', '3/8', '1/2', '5/8', '3/4', '7/8'],
      },
      depth: {
        enabled: false,
        min: 0,
        max: 0,
        step: 1,
        useCustomIncrements: false,
        customIncrements: ['1/8', '1/4', '3/8', '1/2', '5/8', '3/4', '7/8'],
      },
    },
    sideSelector: { enabled: false, options: ['L', 'R'] },
    qtyRange: { enabled: false, min: 1, max: 10 },
    notes: { enabled: false, placeholder: '', showInRed: true },
    customerUpload: { enabled: false, required: false, title: '' },
    descriptions: { internal: '', customer: '', installer: '', both: false },
    modSampleImage: { enabled: false },
  })
  const [builderErrors, setBuilderErrors] = useState({})
  const [assignForm, setAssignForm] = useState({
    templateId: '',
    manufacturerId: '',
    scope: 'all',
    targetStyle: '',
    targetType: '',
    catalogDataId: '',
    overridePrice: '',
  })

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
  const [editTemplate, setEditTemplate] = useState({
    id: '',
    name: '',
    defaultPrice: '',
    sampleImage: '',
    fieldsConfig: null,
  })

  // Task 6: Delete category modal states
  const [showDeleteCategoryModal, setShowDeleteCategoryModal] = useState(false)
  const [deleteCategory, setDeleteCategory] = useState({ id: '', name: '', templateCount: 0 })
  const [deleteMode, setDeleteMode] = useState('only') // 'only', 'withMods', 'move'
  const [moveToCategoryId, setMoveToCategoryId] = useState('')

  const flatTemplates = useMemo(() => {
    const list = []
    gallery.forEach((cat) => {
      ;(cat.templates || []).forEach((tpl) => list.push({ ...tpl, categoryName: cat.name }))
    })
    return list.sort((a, b) => a.name.localeCompare(b.name))
  }, [gallery])

  const loadAll = async (manufacturerIdForAssignments) => {
    setLoading(true)
    setError(null)
    try {
      const [gal, mans] = await Promise.all([
        axiosInstance.get('/api/global-mods/gallery'),
        axiosInstance.get('/api/manufacturers'),
      ])
      setGallery(gal?.data?.gallery || [])
      setManufacturers(mans?.data?.manufacturers || [])
      if (manufacturerIdForAssignments) {
        const a = await axiosInstance.get('/api/global-mods/assignments', {
          params: { manufacturerId: manufacturerIdForAssignments },
        })
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

  useEffect(() => {
    loadAll()
  }, [])

  const createCategory = async () => {
    if (!newCategory.name.trim()) return
    await axiosInstance.post('/api/global-mods/categories', {
      name: newCategory.name.trim(),
      orderIndex: Number(newCategory.orderIndex || 0),
      image: newCategory.image || null,
    })
    setNewCategory({ name: '', orderIndex: 0, image: '' })
    await loadAll(assignForm.manufacturerId)
  }

  const handleUploadImage = async (file) => {
    if (!file) return null
    const form = new FormData()
    // reuse existing fieldname from imageUpload middleware
    form.append('logoImage', file)
    const { data } = await axiosInstance.post('/api/global-mods/upload/image', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data?.filename || null
  }

  const openEditCategory = (cat) => {
    setEditCategory({
      id: cat.id,
      name: cat.name || '',
      orderIndex: cat.orderIndex || 0,
      image: cat.image || '',
    })
    setShowEditCategoryModal(true)
  }

  const saveEditCategory = async () => {
    if (!editCategory.id || !editCategory.name.trim()) return
    await axiosInstance.put(`/api/global-mods/categories/${editCategory.id}`, {
      name: editCategory.name.trim(),
      orderIndex: Number(editCategory.orderIndex || 0),
      image: editCategory.image || null,
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
      templateCount,
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

      // Localized success message per mode
      const msg =
        deleteMode === 'only'
          ? t('globalMods.modal.deleteCategory.toast.deleted', { name: deleteCategory.name })
          : deleteMode === 'withMods'
            ? t('globalMods.modal.deleteCategory.toast.deletedWithMods', {
                name: deleteCategory.name,
              })
            : t('globalMods.modal.deleteCategory.toast.deletedMoved', { name: deleteCategory.name })
      alert(msg)
    } catch (error) {
      console.error('Error deleting category:', error)
      alert(
        error.response?.data?.message || t('globalMods.modal.deleteCategory.toast.deleteFailed'),
      )
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
    ;['height', 'width', 'depth'].forEach((k) => {
      const s = copy.sliders[k]
      if (s?.enabled) {
        const min = Number(s.min || 0),
          max = Number(s.max || 0),
          step = Number(s.step || 1)
        if (isNaN(min) || isNaN(max) || isNaN(step) || step <= 0 || max < min) {
          nextErrors[k] = 'Invalid range or step'
        } else {
          const sliderConfig = { min, max, step }
          if (
            s.useCustomIncrements &&
            Array.isArray(s.customIncrements) &&
            s.customIncrements.length > 0
          ) {
            sliderConfig.customIncrements = s.customIncrements
          }
          sliders[k] = sliderConfig
        }
      }
    })
    if (Object.keys(sliders).length) cfg.sliders = sliders

    if (copy.sideSelector?.enabled)
      cfg.sideSelector = {
        options: Array.isArray(copy.sideSelector.options) ? copy.sideSelector.options : ['L', 'R'],
      }
    if (copy.qtyRange?.enabled) {
      const qmin = Number(copy.qtyRange.min || 1),
        qmax = Number(copy.qtyRange.max || 10)
      if (isNaN(qmin) || isNaN(qmax) || qmax < qmin || qmin < 1) {
        nextErrors.qtyRange = 'Invalid quantity range'
      } else {
        cfg.qtyRange = { min: qmin, max: qmax }
      }
    }
    if (copy.notes?.enabled)
      cfg.notes = { placeholder: copy.notes.placeholder || '', showInRed: !!copy.notes.showInRed }
    if (copy.customerUpload?.enabled)
      cfg.customerUpload = {
        required: !!copy.customerUpload.required,
        title: copy.customerUpload.title || '',
      }
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
      alert(t('globalMods.template.nameRequired'))
      return
    }
    if (!newTemplate.defaultPrice || newTemplate.defaultPrice === '') {
      alert(t('globalMods.template.defaultPriceRequired'))
      return
    }

    // Prefer guided; if textarea provided, attempt parse and use as override
    let fieldsConfig = buildFieldsConfigFromGuided()
    if (newTemplate.fieldsConfigText && newTemplate.fieldsConfigText.trim().length) {
      try {
        fieldsConfig = JSON.parse(newTemplate.fieldsConfigText)
      } catch (_) {
        alert(t('globalMods.builder.errors.invalidJson'))
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
      isBlueprint: true,
    })
    resetTemplateForm()
    await loadAll(assignForm.manufacturerId)
  }

  const resetTemplateForm = () => {
    setNewTemplate({
      categoryId: '',
      name: '',
      defaultPrice: '',
      isReady: false,
      fieldsConfigText: '',
      sampleImage: '',
    })
    setGuided({
      sliders: {
        height: {
          enabled: false,
          min: 0,
          max: 0,
          step: 1,
          useCustomIncrements: false,
          customIncrements: ['1/8', '1/4', '3/8', '1/2', '5/8', '3/4', '7/8'],
        },
        width: {
          enabled: false,
          min: 0,
          max: 0,
          step: 1,
          useCustomIncrements: false,
          customIncrements: ['1/8', '1/4', '3/8', '1/2', '5/8', '3/4', '7/8'],
        },
        depth: {
          enabled: false,
          min: 0,
          max: 0,
          step: 1,
          useCustomIncrements: false,
          customIncrements: ['1/8', '1/4', '3/8', '1/2', '5/8', '3/4', '7/8'],
        },
      },
      sideSelector: { enabled: false, options: ['L', 'R'] },
      qtyRange: { enabled: false, min: 1, max: 10 },
      notes: { enabled: false, placeholder: '', showInRed: true },
      customerUpload: { enabled: false, required: false, title: '' },
      descriptions: { internal: '', customer: '', installer: '', both: false },
      modSampleImage: { enabled: false },
    })
  }

  const onManufacturerChange = async (mid) => {
    setAssignForm((prev) => ({ ...prev, manufacturerId: mid }))
    if (mid) {
      const a = await axiosInstance.get('/api/global-mods/assignments', {
        params: { manufacturerId: mid },
      })
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
    <Box>
      <style>{`
        /* Local, scoped mobile/a11y tweaks for Global Mods */
        .global-mods-actions { flex-wrap: wrap; gap: .5rem; }
        .global-mods-actions .btn { min-height: 44px; }
        @media (max-width: 575.98px) {
          .global-mods-actions { width: 100%; }
          .global-mods-actions .btn { flex: 1 1 48%; }
        }
      `}</style>

      <PageHeader
        title={t('globalMods.title', 'Global Modifications')}
        mobileLayout="stack"
        rightContent={
          <Flex gap={3}>
            <Button
              colorScheme="brand"
              onClick={() => setShowCreateModModal(true)}
              aria-label={t('globalMods.ui.buttons.addModification')}
            >
              {t('globalMods.ui.buttons.addModification')}
            </Button>
            <Button
              colorScheme="green"
              onClick={() => setShowGalleryModal(true)}
              aria-label={t('globalMods.ui.buttons.gallery')}
            >
              {t('globalMods.ui.buttons.gallery')}
            </Button>
            <Button
              colorScheme="brand"
              onClick={() => setShowAssignModal(true)}
              aria-label={t('globalMods.ui.buttons.assignModification')}
            >
              {t('globalMods.ui.buttons.assignModification')}
            </Button>
          </Flex>
        }
      />

      <Flex>
        <Box md={6}>
          <StandardCard>
            <CardHeader>{t('globalMods.ui.galleryHeader')}</CardHeader>
            <CardBody>
              {loading && <Box>{t('common.loading')}</Box>}
              {error && <Box>{error}</Box>}
              {/* Category Creation Section */}
              <StandardCard mb={3} borderColor="green.500" borderWidth="1px">
                <CardHeader bg="green.500" color="white">
                  <Heading as="h6" size="sm">{t('globalMods.category.createTitle')}</Heading>
                </CardHeader>
                <CardBody>
                  <Flex>
                    <Box md={6}>
                      <FormLabel>{t('globalMods.category.nameLabel')}</FormLabel>
                      <Input
                        placeholder={t('globalMods.category.namePlaceholder')}
                        value={newCategory.name}
                        onChange={(e) => setNewCategory((c) => ({ ...c, name: e.target.value }))}
                      />
                    </Box>
                    <Box md={3}>
                      <FormLabel>{t('globalMods.category.orderLabel')}</FormLabel>
                      <Input
                        type="number"
                        placeholder={t('globalMods.category.orderLabel')}
                        value={newCategory.orderIndex}
                        onChange={(e) =>
                          setNewCategory((c) => ({ ...c, orderIndex: e.target.value }))
                        }
                      />
                    </Box>
                    <Box md={3}>
                      <FormLabel>{t('globalMods.category.actionLabel')}</FormLabel>
                      <Button
                        colorScheme="brand"

                        onClick={createCategory}
                        isDisabled={!newCategory.name.trim()}
                      >
                        {t('globalMods.category.addButton')}
                      </Button>
                    </Box>
                  </Flex>
                  <Flex>
                    <Box md={6}>
                      <FormLabel>{t('globalMods.category.imageLabel')}</FormLabel>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            const filename = await handleUploadImage(file)
                            if (filename) setNewCategory((c) => ({ ...c, image: filename }))
                          }
                        }}
                      />
                      <Text fontSize="sm" color="gray.500">{t('globalMods.category.imageHint')}</Text>
                    </Box>
                    <Box md={6}>
                      {newCategory.image ? (
                        <Box>
                          <Box
                            as="img"
                            src={`${import.meta.env.VITE_API_URL || ''}/uploads/images/${newCategory.image}`}
                            alt={t('globalMods.category.imageLabel')}
                            w="60px"
                            h="60px"
                            objectFit="cover"
                            borderRadius="md"
                            borderWidth="1px"
                            borderColor={borderColor}
                            onError={(e) => {
                              e.currentTarget.src = '/images/nologo.png'
                            }}
                          />
                          <Box>
                            <Text fontSize="sm">
                              {t('globalMods.category.imageReady')}
                            </Text>
                          </Box>
                        </Box>
                      ) : (
                        <Box
                          bg="gray.50"
                          w={60}
                          h={60}
                        >
                          <Text fontSize="sm">📁</Text>
                        </Box>
                      )}
                    </Box>
                  </Flex>
                </CardBody>
              </StandardCard>

              {gallery.map((cat) => (
                <Box key={cat.id}>
                  <Box as="h6" mb={2} display="flex" alignItems="center" gap={2}>
                    {cat.image && (
                      <Image
                        src={`${import.meta.env.VITE_API_URL || ''}/uploads/images/${cat.image}`}
                        alt={cat.name}
                        w={28}
                        h={28}
                        objectFit="cover"
                        borderRadius={4}
                        borderWidth="1px"
                        borderColor={borderColor}
                        onError={(e) => {
                          e.currentTarget.src = '/images/nologo.png'
                        }}
                      />
                    )}
                    <Text as="span">{cat.name}</Text>
                    <Badge colorScheme="gray">{(cat.templates || []).length}</Badge>
                    <Flex ml="auto" gap={1}>
                      <AppIconButton
                        size="sm"
                        colorScheme="orange"
                        variant="outline"
                        onClick={() => openEditCategory(cat)}
                        title={t('globalMods.category.editTooltip')}
                        aria-label={t('globalMods.category.editTooltip')}
                        icon="✏️"
                        type="button"
                      />
                      {/* Task 6: Add delete category button */}
                      <AppIconButton
                        size="sm"
                        colorScheme="red"
                        variant="outline"
                        onClick={() => openDeleteCategory(cat)}
                        title={t('globalMods.category.deleteTooltip')}
                        aria-label={t('globalMods.category.deleteTooltip')}
                        icon="🗑️"
                        type="button"
                      />
                    </Box>
                  </h6>
                  <Box display="grid" gridTemplateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={3}>
                    {(cat.templates || []).map((tpl) => (
                      <Box key={tpl.id}>
                        <Box
                          gap={10}
                        >
                          {(tpl.sampleImage || tpl.fieldsConfig?.modSampleImage?.enabled) && (
                            <Image
                              src={
                                tpl.sampleImage
                                  ? `${import.meta.env.VITE_API_URL || ''}/uploads/images/${tpl.sampleImage}`
                                  : '/images/nologo.png'
                              }
                              alt={tpl.name}
                              w={72}
                              h={72}
                              objectFit="cover"
                              borderRadius={6}
                              onError={(e) => {
                                e.currentTarget.src = '/images/nologo.png'
                              }}
                            />
                          )}
                          <Box>
                            <Text>{tpl.name}</Text>
                            <Text>
                              {tpl.defaultPrice != null
                                ? `$${Number(tpl.defaultPrice).toFixed(2)}`
                                : t('globalMods.template.blueprint')}
                            </Text>
                          <AppIconButton
                            size="sm"
                            colorScheme="orange"
                            variant="outline"
                            position="absolute"
                            top={0}
                            right={0}
                            m={1}
                            onClick={() => openEditTemplate(tpl)}
                            title={t('globalMods.template.editTooltip')}
                            aria-label={t('globalMods.template.editTooltip')}
                            icon="✏️"
                            type="button"
                          />
                        </Box>
                        {/* close border container and column */}
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
              ))}
            </CardBody>
          </StandardCard>
        </Box>

        <Box md={6}>
          <StandardCard>
            <CardHeader>{t('globalMods.template.createHeader')}</CardHeader>
            <CardBody>
              {/* Required Fields Section */}
              <StandardCard mb={4} borderColor="blue.500" borderWidth="1px">
                <CardHeader bg="blue.500" color="white">
                  <Heading as="h6" size="sm">{t('globalMods.template.requiredFields')}</Heading>
                </CardHeader>
                <CardBody>
                  <Flex>
                    <Box md={12}>
                      <FormLabel>
                        {t('globalMods.template.nameLabel')} <Text as="span">*</Text>
                      </FormLabel>
                      <Input
                        placeholder={t('globalMods.template.namePlaceholder')}
                        value={newTemplate.name}
                        onChange={(e) => setNewTemplate((n) => ({ ...n, name: e.target.value }))}
                        borderColor={!newTemplate.name.trim() ? 'red.500' : undefined}
                        required
                      />
                      {!newTemplate.name.trim() && (
                        <Text fontSize="sm" color="gray.500">
                          {t('globalMods.template.nameRequired')}
                        </Text>
                      )}
                    </Box>
                  </Flex>
                  <Flex>
                    <Box md={12}>
                      <FormLabel>
                        {t('globalMods.template.defaultPriceLabel')}{' '}
                        <Text as="span">*</Text>
                      </FormLabel>
                      <Input
                        type="number"
                        placeholder={t('globalMods.template.defaultPricePlaceholder')}
                        value={newTemplate.defaultPrice}
                        onChange={(e) =>
                          setNewTemplate((n) => ({ ...n, defaultPrice: e.target.value }))
                        }
                        borderColor={!newTemplate.defaultPrice ? 'red.500' : undefined}
                        required
                      />
                      {!newTemplate.defaultPrice && (
                        <Text fontSize="sm" color="gray.500">
                          {t('globalMods.template.defaultPriceRequired')}
                        </Text>
                      )}
                    </Box>
                  </Flex>
                </CardBody>
              </StandardCard>

              {/* Optional Settings */}
              <Flex>
                <Box md={6}>
                  <FormLabel>
                    {t('globalMods.template.categoryOptionalLabel')}
                  </FormLabel>
                  <Select
                    value={newTemplate.categoryId}
                    onChange={(e) => setNewTemplate((n) => ({ ...n, categoryId: e.target.value }))}
                  >
                    <option value="">{t('globalMods.template.noSubmenu')}</option>
                    {gallery.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                </Box>
                <Box md={6}>
                  <FormLabel>{t('globalMods.template.statusLabel')}</FormLabel>
                  <Select
                    value={newTemplate.isReady ? '1' : '0'}
                    onChange={(e) =>
                      setNewTemplate((n) => ({ ...n, isReady: e.target.value === '1' }))
                    }
                  >
                    <option value="0">{t('globalMods.template.status.draft')}</option>
                    <option value="1">{t('globalMods.template.status.ready')}</option>
                  </Select>
                </Box>
              </Flex>

              {/* Guided builder */}
              <Box borderWidth="1px" borderRadius="md" p={3} mb={3}>
                <Heading as="h6" size="sm">{t('globalMods.builder.title')}</Heading>
                <Flex>
                  <Box md={4}>
                    <Checkbox
                      label={t('globalMods.builder.heightSlider')}
                      checked={guided.sliders.height.enabled}
                      onChange={(e) =>
                        setGuided((g) => ({
                          ...g,
                          sliders: {
                            ...g.sliders,
                            height: { ...g.sliders.height, enabled: e.target.checked },
                          },
                        }))
                      }
                    />
                    {guided.sliders.height.enabled && (
                      <Flex gap={2} mt={2}>
                        <Input
                          type="number"
                          placeholder={t('globalMods.builder.min')}
                          value={guided.sliders.height.min}
                          onChange={(e) =>
                            setGuided((g) => ({
                              ...g,
                              sliders: {
                                ...g.sliders,
                                height: { ...g.sliders.height, min: e.target.value },
                              },
                            }))
                          }
                        />
                        <Input
                          type="number"
                          placeholder={t('globalMods.builder.max')}
                          value={guided.sliders.height.max}
                          onChange={(e) =>
                            setGuided((g) => ({
                              ...g,
                              sliders: {
                                ...g.sliders,
                                height: { ...g.sliders.height, max: e.target.value },
                              },
                            }))
                          }
                        />
                        <Select
                          value={
                            guided.sliders.height.useCustomIncrements
                              ? 'custom'
                              : guided.sliders.height.step
                          }
                          onChange={(e) =>
                            setGuided((g) => ({
                              ...g,
                              sliders: {
                                ...g.sliders,
                                height: {
                                  ...g.sliders.height,
                                  step: e.target.value === 'custom' ? 1 : e.target.value,
                                  useCustomIncrements: e.target.value === 'custom',
                                },
                              },
                            }))
                          }
                        >
                          <option value="1">1</option>
                          <option value="0.5">0.5</option>
                          <option value="0.25">0.25</option>
                          <option value="custom">Custom fractions</option>
                        </Select>
                      </Box>
                    )}
                  </Box>
                  <Box md={4}>
                    <Checkbox
                      label={t('globalMods.builder.widthSlider')}
                      checked={guided.sliders.width.enabled}
                      onChange={(e) =>
                        setGuided((g) => ({
                          ...g,
                          sliders: {
                            ...g.sliders,
                            width: { ...g.sliders.width, enabled: e.target.checked },
                          },
                        }))
                      }
                    />
                    {guided.sliders.width.enabled && (
                      <Flex gap={2} mt={2}>
                        <Input
                          type="number"
                          placeholder={t('globalMods.builder.min')}
                          value={guided.sliders.width.min}
                          onChange={(e) =>
                            setGuided((g) => ({
                              ...g,
                              sliders: {
                                ...g.sliders,
                                width: { ...g.sliders.width, min: e.target.value },
                              },
                            }))
                          }
                        />
                        <Input
                          type="number"
                          placeholder={t('globalMods.builder.max')}
                          value={guided.sliders.width.max}
                          onChange={(e) =>
                            setGuided((g) => ({
                              ...g,
                              sliders: {
                                ...g.sliders,
                                width: { ...g.sliders.width, max: e.target.value },
                              },
                            }))
                          }
                        />
                        <Select
                          value={
                            guided.sliders.width.useCustomIncrements
                              ? 'custom'
                              : guided.sliders.width.step
                          }
                          onChange={(e) =>
                            setGuided((g) => ({
                              ...g,
                              sliders: {
                                ...g.sliders,
                                width: {
                                  ...g.sliders.width,
                                  step: e.target.value === 'custom' ? 1 : e.target.value,
                                  useCustomIncrements: e.target.value === 'custom',
                                },
                              },
                            }))
                          }
                        >
                          <option value="1">1</option>
                          <option value="0.5">0.5</option>
                          <option value="0.25">0.25</option>
                          <option value="custom">Custom fractions</option>
                        </Select>
                      </Box>
                    )}
                  </Box>
                  <Box md={4}>
                    <Checkbox
                      label={t('globalMods.builder.depthSlider')}
                      checked={guided.sliders.depth.enabled}
                      onChange={(e) =>
                        setGuided((g) => ({
                          ...g,
                          sliders: {
                            ...g.sliders,
                            depth: { ...g.sliders.depth, enabled: e.target.checked },
                          },
                        }))
                      }
                    />
                    {guided.sliders.depth.enabled && (
                      <Flex gap={2} mt={2}>
                        <Input
                          type="number"
                          placeholder={t('globalMods.builder.min')}
                          value={guided.sliders.depth.min}
                          onChange={(e) =>
                            setGuided((g) => ({
                              ...g,
                              sliders: {
                                ...g.sliders,
                                depth: { ...g.sliders.depth, min: e.target.value },
                              },
                            }))
                          }
                        />
                        <Input
                          type="number"
                          placeholder={t('globalMods.builder.max')}
                          value={guided.sliders.depth.max}
                          onChange={(e) =>
                            setGuided((g) => ({
                              ...g,
                              sliders: {
                                ...g.sliders,
                                depth: { ...g.sliders.depth, max: e.target.value },
                              },
                            }))
                          }
                        />
                        <Select
                          value={
                            guided.sliders.depth.useCustomIncrements
                              ? 'custom'
                              : guided.sliders.depth.step
                          }
                          onChange={(e) =>
                            setGuided((g) => ({
                              ...g,
                              sliders: {
                                ...g.sliders,
                                depth: {
                                  ...g.sliders.depth,
                                  step: e.target.value === 'custom' ? 1 : e.target.value,
                                  useCustomIncrements: e.target.value === 'custom',
                                },
                              },
                            }))
                          }
                        >
                          <option value="1">1</option>
                          <option value="0.5">0.5</option>
                          <option value="0.25">0.25</option>
                          <option value="custom">Custom fractions</option>
                        </Select>
                      </Box>
                    )}
                  </Box>
                </Flex>

                <Flex>
                  <Box md={6}>
                    <Checkbox
                      label={t('globalMods.builder.sideSelector.label')}
                      checked={guided.sideSelector.enabled}
                      onChange={(e) =>
                        setGuided((g) => ({
                          ...g,
                          sideSelector: { ...g.sideSelector, enabled: e.target.checked },
                        }))
                      }
                    />
                    {guided.sideSelector.enabled && (
                      <Input

                        placeholder={t('globalMods.builder.sideSelector.placeholder')}
                        value={guided.sideSelector.options?.join(',')}
                        onChange={(e) =>
                          setGuided((g) => ({
                            ...g,
                            sideSelector: {
                              ...g.sideSelector,
                              options: e.target.value
                                .split(',')
                                .map((s) => s.trim())
                                .filter(Boolean),
                            },
                          }))
                        }
                      />
                    )}
                  </Box>
                  <Box md={6}>
                    <Checkbox
                      label={t('globalMods.builder.quantityLimits.label')}
                      checked={guided.qtyRange.enabled}
                      onChange={(e) =>
                        setGuided((g) => ({
                          ...g,
                          qtyRange: { ...g.qtyRange, enabled: e.target.checked },
                        }))
                      }
                    />
                    {guided.qtyRange.enabled && (
                      <Flex gap={2} mt={2}>
                        <Input
                          type="number"
                          placeholder={t('globalMods.builder.quantityLimits.minQty')}
                          value={guided.qtyRange.min}
                          onChange={(e) =>
                            setGuided((g) => ({
                              ...g,
                              qtyRange: { ...g.qtyRange, min: e.target.value },
                            }))
                          }
                        />
                        <Input
                          type="number"
                          placeholder={t('globalMods.builder.quantityLimits.maxQty')}
                          value={guided.qtyRange.max}
                          onChange={(e) =>
                            setGuided((g) => ({
                              ...g,
                              qtyRange: { ...g.qtyRange, max: e.target.value },
                            }))
                          }
                        />
                        {builderErrors.qtyRange && (
                          <Box>
                            {builderErrors.qtyRange}
                          </Box>
                        )}
                      </Box>
                    )}
                  </Box>
                </Flex>

                <Flex>
                  <Box md={4}>
                    <Checkbox
                      label={t('globalMods.builder.customerNotes.label')}
                      checked={guided.notes.enabled}
                      onChange={(e) =>
                        setGuided((g) => ({
                          ...g,
                          notes: { ...g.notes, enabled: e.target.checked },
                        }))
                      }
                    />
                    {guided.notes.enabled && (
                      <Box>
                        <Input
                          placeholder={t('globalMods.builder.customerNotes.placeholder')}
                          value={guided.notes.placeholder}
                          onChange={(e) =>
                            setGuided((g) => ({
                              ...g,
                              notes: { ...g.notes, placeholder: e.target.value },
                            }))
                          }
                        />
                        <Checkbox

                          label={t('globalMods.builder.customerNotes.showInRed')}
                          checked={guided.notes.showInRed}
                          onChange={(e) =>
                            setGuided((g) => ({
                              ...g,
                              notes: { ...g.notes, showInRed: e.target.checked },
                            }))
                          }
                        />
                      </Box>
                    )}
                  </Box>
                  <Box md={4}>
                    <Checkbox
                      label={t('globalMods.builder.customerUpload.label')}
                      checked={guided.customerUpload.enabled}
                      onChange={(e) =>
                        setGuided((g) => ({
                          ...g,
                          customerUpload: { ...g.customerUpload, enabled: e.target.checked },
                        }))
                      }
                    />
                    {guided.customerUpload.enabled && (
                      <Box>
                        <Input
                          placeholder={t('globalMods.builder.customerUpload.titlePlaceholder')}
                          value={guided.customerUpload.title}
                          onChange={(e) =>
                            setGuided((g) => ({
                              ...g,
                              customerUpload: { ...g.customerUpload, title: e.target.value },
                            }))
                          }
                        />
                        <Checkbox

                          label={t('globalMods.builder.customerUpload.required')}
                          checked={guided.customerUpload.required}
                          onChange={(e) =>
                            setGuided((g) => ({
                              ...g,
                              customerUpload: { ...g.customerUpload, required: e.target.checked },
                            }))
                          }
                        />
                      </Box>
                    )}
                  </Box>
                  <Box md={4}>
                    <Checkbox
                      label={t('globalMods.builder.modSampleImage.label')}
                      checked={guided.modSampleImage.enabled}
                      onChange={(e) =>
                        setGuided((g) => ({
                          ...g,
                          modSampleImage: { ...g.modSampleImage, enabled: e.target.checked },
                        }))
                      }
                    />
                  </Box>
                </Flex>

                <Flex>
                  <Box md={4}>
                    <Input
                      placeholder={t('globalMods.builder.descriptions.internal')}
                      value={guided.descriptions.internal}
                      onChange={(e) =>
                        setGuided((g) => ({
                          ...g,
                          descriptions: { ...g.descriptions, internal: e.target.value },
                        }))
                      }
                    />
                  </Box>
                  <Box md={4}>
                    <Input
                      placeholder={t('globalMods.builder.descriptions.customer')}
                      value={guided.descriptions.customer}
                      onChange={(e) =>
                        setGuided((g) => ({
                          ...g,
                          descriptions: { ...g.descriptions, customer: e.target.value },
                        }))
                      }
                    />
                  </Box>
                  <Box md={4}>
                    <Input
                      placeholder={t('globalMods.builder.descriptions.installer')}
                      value={guided.descriptions.installer}
                      onChange={(e) =>
                        setGuided((g) => ({
                          ...g,
                          descriptions: { ...g.descriptions, installer: e.target.value },
                        }))
                      }
                    />
                  </Box>
                </Flex>
              </Box>

              {/* Sample Image Upload Section */}
              <StandardCard mb={3} borderColor="cyan.500" borderWidth="1px">
                <CardHeader bg="cyan.500" color="white">
                  <Heading as="h6" size="sm">{t('globalMods.builder.sampleUpload.title')}</Heading>
                </CardHeader>
                <CardBody>
                  <Flex>
                    <Box md={6}>
                      <Box as="label" mb={2}>
                        {t('globalMods.builder.sampleUpload.uploadLabel')}
                      </label>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            const filename = await handleUploadImage(file)
                            if (filename) setNewTemplate((n) => ({ ...n, sampleImage: filename }))
                          }
                        }}

                      />
                      <Text fontSize="sm" color="gray.500">
                        {t('globalMods.builder.sampleUpload.hint')}
                      </Text>
                    </Box>
                    <Box md={6}>
                      {newTemplate.sampleImage ? (
                        <Box>
                          <Image
                            src={`${import.meta.env.VITE_API_URL || ''}/uploads/images/${newTemplate.sampleImage}`}
                            alt={t('globalMods.builder.sampleUpload.previewAlt')}
                            w="100%"
                            maxH={120}
                            objectFit="cover"
                            borderRadius={8}
                            onError={(e) => {
                              e.currentTarget.src = '/images/nologo.png'
                            }}
                          />
                          <Box>
                            <Text fontSize="sm">
                              {t('globalMods.builder.sampleUpload.uploaded', {
                                name: newTemplate.sampleImage,
                              })}
                            </Text>
                          </Box>
                        </Box>
                      ) : (
                        <Box
                          bg="gray.50"
                        >
                          <Box>📷</Box>
                          <Text fontSize="sm">{t('globalMods.builder.sampleUpload.none')}</Text>
                        </Box>
                      )}
                    </Box>
                  </Flex>
                </CardBody>
              </StandardCard>

              <Textarea
                rows={6}
                placeholder={t('globalMods.builder.fieldsConfig.placeholder')}
                value={newTemplate.fieldsConfigText}
                onChange={(e) =>
                  setNewTemplate((n) => ({ ...n, fieldsConfigText: e.target.value }))
                }
              />
              <Box>
                <Button
                  colorScheme="green"
                  onClick={createTemplate}
                  isDisabled={
                    Object.keys(builderErrors).length > 0 ||
                    !newTemplate.name.trim() ||
                    !newTemplate.defaultPrice
                  }
                >
                  {t('globalMods.template.saveButton')}
                </Button>
              </Box>
            </CardBody>
          </StandardCard>

          <StandardCard>
            <CardHeader>{t('globalMods.assign.header')}</CardHeader>
            <CardBody>
              <Flex>
                <Box md={6}>
                  <Select
                    value={assignForm.templateId}
                    onChange={(e) => setAssignForm((a) => ({ ...a, templateId: e.target.value }))}
                  >
                    <option value="">{t('globalMods.assign.selectTemplate')}</option>
                    {flatTemplates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.categoryName ? `[${t.categoryName}] ` : ''}
                        {t.name}
                      </option>
                    ))}
                  </Select>
                </Box>
                <Box md={6}>
                  <Select
                    value={assignForm.manufacturerId}
                    onChange={(e) => onManufacturerChange(e.target.value)}
                  >
                    <option value="">{t('globalMods.assign.selectManufacturer')}</option>
                    {manufacturers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </Select>
                </Box>
              </Flex>
              <Flex>
                <Box md={4}>
                  <Select
                    value={assignForm.scope}
                    onChange={(e) => setAssignForm((a) => ({ ...a, scope: e.target.value }))}
                  >
                    <option value="all">{t('globalMods.assign.scope.all')}</option>
                    <option value="style">{t('globalMods.assign.scope.style')}</option>
                    <option value="type">{t('globalMods.assign.scope.type')}</option>
                    <option value="item">{t('globalMods.assign.scope.item')}</option>
                  </Select>
                </Box>
                <Box md={4}>
                  {assignForm.scope === 'style' && (
                    <Input
                      placeholder={t('globalMods.assign.target.styleName')}
                      value={assignForm.targetStyle}
                      onChange={(e) =>
                        setAssignForm((a) => ({ ...a, targetStyle: e.target.value }))
                      }
                    />
                  )}
                  {assignForm.scope === 'type' && (
                    <Input
                      placeholder={t('globalMods.assign.target.typeName')}
                      value={assignForm.targetType}
                      onChange={(e) => setAssignForm((a) => ({ ...a, targetType: e.target.value }))}
                    />
                  )}
                  {assignForm.scope === 'item' && (
                    <Input
                      type="number"
                      placeholder={t('globalMods.assign.target.catalogItemId')}
                      value={assignForm.catalogDataId}
                      onChange={(e) =>
                        setAssignForm((a) => ({ ...a, catalogDataId: e.target.value }))
                      }
                    />
                  )}
                </Box>
                <Box md={4}>
                  <Input
                    type="number"
                    placeholder={t('globalMods.assign.override')}
                    value={assignForm.overridePrice}
                    onChange={(e) =>
                      setAssignForm((a) => ({ ...a, overridePrice: e.target.value }))
                    }
                  />
                </Box>
              </Flex>
              <Button
                colorScheme="brand"
                onClick={assignTemplate}
                isDisabled={!assignForm.templateId || !assignForm.manufacturerId}
              >
                {t('globalMods.assign.assignButton')}
              </Button>

              <Box>
                <Heading as="h6" size="sm">{t('common.currentAssignments', 'Current Assignments')}</Heading>
                <TableContainer borderWidth="1px" borderColor={tableBorderColor} borderRadius="md" mt={2}>
                  <Table size="sm" variant="simple">
                  <Thead>
                    <Tr>
                      <Th>{t('globalMods.assign.table.template')}</Th>
                      <Th>{t('globalMods.assign.table.scope')}</Th>
                      <Th>{t('globalMods.assign.table.target')}</Th>
                      <Th>{t('globalMods.assign.table.price')}</Th>
                      <Th></Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {assignments.map((a) => (
                      <Tr key={a.id}>
                        <Td>{a.template?.name}</Td>
                        <Td>{a.scope}</Td>
                        <Td>
                          {a.scope === 'style'
                            ? a.targetStyle
                            : a.scope === 'type'
                              ? a.targetType
                              : a.scope === 'item'
                                ? t('globalMods.assign.target.itemWithId', { id: a.catalogDataId })
                                : t('globalMods.assign.target.all')}
                        </Td>
                        <Td>
                          {a.overridePrice != null
                            ? `$${Number(a.overridePrice).toFixed(2)}`
                            : a.template?.defaultPrice != null
                              ? `$${Number(a.template.defaultPrice).toFixed(2)}`
                              : '—'}
                        </Td>
                        <Td>
                          <Button colorScheme="red" size="sm" minH="44px" onClick={() => deleteAssignment(a.id)}>
                            {t('globalMods.assign.table.remove')}
                          </Button>
                        </Td>
                      </Tr>
                    ))}
                    {!assignments.length && (
                      <Tr>
                        <Td colSpan={5}>
                          {t('globalMods.assign.none')}
                        </Td>
                      </Tr>
                    )}
                  </Tbody>
                </Table>
                </TableContainer>
              </Box>
            </CardBody>
          </StandardCard>
        </Box>
      </Flex>

      {/* Add Modification Modal */}
      <Modal isOpen={showCreateModModal} onClose={() => setShowCreateModModal(false)} size={{ base: 'full', md: 'md', lg: 'lg' }} scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent>
            <ModalHeader>
              {t('globalMods.modal.add.title')}
            </ModalHeader>
        <ModalBody>
          {createStep === 1 && (
            <Box>
              <Heading as="h6" size="sm">{t('globalMods.modal.add.step1Title')}</Heading>
              <Select
                value={selectedSubmenu}
                onChange={(e) => setSelectedSubmenu(e.target.value)}
              >
                <option value="">{t('globalMods.modal.add.selectExisting')}</option>
                {gallery.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
                <option value="new">{t('globalMods.modal.add.createNew')}</option>
              </Select>

              {selectedSubmenu === 'new' && (
                <Box>
                  <Input
                    placeholder={t('globalMods.modal.add.newSubmenuName')}
                    value={newCategory.name}
                    onChange={(e) => setNewCategory((n) => ({ ...n, name: e.target.value }))}
                  />
                  <Input
                    type="number"
                    placeholder={t('globalMods.modal.add.orderIndex')}
                    value={newCategory.orderIndex}
                    onChange={(e) => setNewCategory((n) => ({ ...n, orderIndex: e.target.value }))}

                  />
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      const filename = await handleUploadImage(file)
                      if (filename) setNewCategory((n) => ({ ...n, image: filename }))
                    }}

                  />
                </Box>
              )}

              <Flex mt={3} gap={2}>
                <Button colorScheme="gray" onClick={() => setShowCreateModModal(false)}>
                  {t('common.cancel')}
                </Button>
                <Button
                  colorScheme="brand"
                  onClick={() => setCreateStep(2)}
                  isDisabled={!selectedSubmenu || (selectedSubmenu === 'new' && !newCategory.name)}
                >
                  {t('globalMods.modal.add.nextBuilder')}
                </Button>
              </Box>
            </Box>
          )}

          {createStep === 2 && (
            <Box>
              <Heading as="h6" size="sm">{t('globalMods.modal.add.step2Title')}</Heading>

              {/* Required Fields Section */}
              <StandardCard mb={4} borderColor="blue.500" borderWidth="1px">
                <CardHeader bg="blue.500" color="white">
                  <Heading as="h6" size="sm">Required Fields</Heading>
                </CardHeader>
                <CardBody>
                  <Flex>
                    <Box md={6}>
                      <FormLabel>
                        {t('globalMods.template.nameLabel')} <Text as="span">*</Text>
                      </FormLabel>
                      <Input
                        placeholder={t('globalMods.template.namePlaceholder')}
                        value={newTemplate.name}
                        onChange={(e) => setNewTemplate((n) => ({ ...n, name: e.target.value }))}
                        borderColor={!newTemplate.name.trim() ? 'red.500' : undefined}
                        required
                      />
                      {!newTemplate.name.trim() && (
                        <Text fontSize="sm" color="gray.500">
                          {t('globalMods.template.nameRequired')}
                        </Text>
                      )}
                    </Box>
                    <Box md={6}>
                      <FormLabel>
                        {t('globalMods.template.defaultPriceLabel')}{' '}
                        <Text as="span">*</Text>
                      </FormLabel>
                      <Input
                        type="number"
                        placeholder={t('globalMods.template.defaultPricePlaceholder')}
                        value={newTemplate.defaultPrice}
                        onChange={(e) =>
                          setNewTemplate((n) => ({ ...n, defaultPrice: e.target.value }))
                        }
                        borderColor={!newTemplate.defaultPrice ? 'red.500' : undefined}
                        required
                      />
                      {!newTemplate.defaultPrice && (
                        <Text fontSize="sm" color="gray.500">
                          {t('globalMods.template.defaultPriceRequired')}
                        </Text>
                      )}
                    </Box>
                  </Flex>
                </CardBody>
              </StandardCard>

              {/* Guided builder - same as main form */}
              <Box borderWidth="1px" borderRadius="md" p={3} mb={3}>
                <Heading as="h6" size="sm">{t('globalMods.builder.title')}</Heading>
                <Flex>
                  <Box md={4}>
                    <Checkbox
                      label={t('globalMods.builder.heightSlider')}
                      checked={guided.sliders.height.enabled}
                      onChange={(e) =>
                        setGuided((g) => ({
                          ...g,
                          sliders: {
                            ...g.sliders,
                            height: { ...g.sliders.height, enabled: e.target.checked },
                          },
                        }))
                      }
                    />
                    {guided.sliders.height.enabled && (
                      <Flex gap={2} mt={2}>
                        <Input
                          type="number"
                          placeholder={t('globalMods.builder.min')}
                          value={guided.sliders.height.min}
                          onChange={(e) =>
                            setGuided((g) => ({
                              ...g,
                              sliders: {
                                ...g.sliders,
                                height: { ...g.sliders.height, min: e.target.value },
                              },
                            }))
                          }
                        />
                        <Input
                          type="number"
                          placeholder={t('globalMods.builder.max')}
                          value={guided.sliders.height.max}
                          onChange={(e) =>
                            setGuided((g) => ({
                              ...g,
                              sliders: {
                                ...g.sliders,
                                height: { ...g.sliders.height, max: e.target.value },
                              },
                            }))
                          }
                        />
                        <Select
                          value={
                            guided.sliders.height.useCustomIncrements
                              ? 'custom'
                              : guided.sliders.height.step
                          }
                          onChange={(e) =>
                            setGuided((g) => ({
                              ...g,
                              sliders: {
                                ...g.sliders,
                                height: {
                                  ...g.sliders.height,
                                  step: e.target.value === 'custom' ? 1 : e.target.value,
                                  useCustomIncrements: e.target.value === 'custom',
                                },
                              },
                            }))
                          }
                        >
                          <option value="1">1</option>
                          <option value="0.5">0.5</option>
                          <option value="0.25">0.25</option>
                          <option value="custom">Custom fractions</option>
                        </Select>
                      </Box>
                    )}
                  </Box>
                  <Box md={4}>
                    <Checkbox
                      label={t('globalMods.builder.widthSlider')}
                      checked={guided.sliders.width.enabled}
                      onChange={(e) =>
                        setGuided((g) => ({
                          ...g,
                          sliders: {
                            ...g.sliders,
                            width: { ...g.sliders.width, enabled: e.target.checked },
                          },
                        }))
                      }
                    />
                    {guided.sliders.width.enabled && (
                      <Flex gap={2} mt={2}>
                        <Input
                          type="number"
                          placeholder={t('globalMods.builder.min')}
                          value={guided.sliders.width.min}
                          onChange={(e) =>
                            setGuided((g) => ({
                              ...g,
                              sliders: {
                                ...g.sliders,
                                width: { ...g.sliders.width, min: e.target.value },
                              },
                            }))
                          }
                        />
                        <Input
                          type="number"
                          placeholder={t('globalMods.builder.max')}
                          value={guided.sliders.width.max}
                          onChange={(e) =>
                            setGuided((g) => ({
                              ...g,
                              sliders: {
                                ...g.sliders,
                                width: { ...g.sliders.width, max: e.target.value },
                              },
                            }))
                          }
                        />
                        <Select
                          value={
                            guided.sliders.width.useCustomIncrements
                              ? 'custom'
                              : guided.sliders.width.step
                          }
                          onChange={(e) =>
                            setGuided((g) => ({
                              ...g,
                              sliders: {
                                ...g.sliders,
                                width: {
                                  ...g.sliders.width,
                                  step: e.target.value === 'custom' ? 1 : e.target.value,
                                  useCustomIncrements: e.target.value === 'custom',
                                },
                              },
                            }))
                          }
                        >
                          <option value="1">1</option>
                          <option value="0.5">0.5</option>
                          <option value="0.25">0.25</option>
                          <option value="custom">Custom fractions</option>
                        </Select>
                      </Box>
                    )}
                  </Box>
                  <Box md={4}>
                    <Checkbox
                      label={t('globalMods.builder.depthSlider')}
                      checked={guided.sliders.depth.enabled}
                      onChange={(e) =>
                        setGuided((g) => ({
                          ...g,
                          sliders: {
                            ...g.sliders,
                            depth: { ...g.sliders.depth, enabled: e.target.checked },
                          },
                        }))
                      }
                    />
                    {guided.sliders.depth.enabled && (
                      <Flex gap={2} mt={2}>
                        <Input
                          type="number"
                          placeholder={t('globalMods.builder.min')}
                          value={guided.sliders.depth.min}
                          onChange={(e) =>
                            setGuided((g) => ({
                              ...g,
                              sliders: {
                                ...g.sliders,
                                depth: { ...g.sliders.depth, min: e.target.value },
                              },
                            }))
                          }
                        />
                        <Input
                          type="number"
                          placeholder={t('globalMods.builder.max')}
                          value={guided.sliders.depth.max}
                          onChange={(e) =>
                            setGuided((g) => ({
                              ...g,
                              sliders: {
                                ...g.sliders,
                                depth: { ...g.sliders.depth, max: e.target.value },
                              },
                            }))
                          }
                        />
                        <Select
                          value={
                            guided.sliders.depth.useCustomIncrements
                              ? 'custom'
                              : guided.sliders.depth.step
                          }
                          onChange={(e) =>
                            setGuided((g) => ({
                              ...g,
                              sliders: {
                                ...g.sliders,
                                depth: {
                                  ...g.sliders.depth,
                                  step: e.target.value === 'custom' ? 1 : e.target.value,
                                  useCustomIncrements: e.target.value === 'custom',
                                },
                              },
                            }))
                          }
                        >
                          <option value="1">1</option>
                          <option value="0.5">0.5</option>
                          <option value="0.25">0.25</option>
                          <option value="custom">Custom fractions</option>
                        </Select>
                      </Box>
                    )}
                  </Box>
                </Flex>

                <Flex>
                  <Box md={6}>
                    <Checkbox
                      label={t('globalMods.builder.sideSelector.label')}
                      checked={guided.sideSelector.enabled}
                      onChange={(e) =>
                        setGuided((g) => ({
                          ...g,
                          sideSelector: { ...g.sideSelector, enabled: e.target.checked },
                        }))
                      }
                    />
                    {guided.sideSelector.enabled && (
                      <Input

                        placeholder={t('globalMods.builder.sideSelector.placeholder')}
                        value={guided.sideSelector.options?.join(',')}
                        onChange={(e) =>
                          setGuided((g) => ({
                            ...g,
                            sideSelector: {
                              ...g.sideSelector,
                              options: e.target.value
                                .split(',')
                                .map((s) => s.trim())
                                .filter(Boolean),
                            },
                          }))
                        }
                      />
                    )}
                  </Box>
                  <Box md={6}>
                    <Checkbox
                      label={t('globalMods.builder.quantityLimits.label')}
                      checked={guided.qtyRange.enabled}
                      onChange={(e) =>
                        setGuided((g) => ({
                          ...g,
                          qtyRange: { ...g.qtyRange, enabled: e.target.checked },
                        }))
                      }
                    />
                    {guided.qtyRange.enabled && (
                      <Flex gap={2} mt={2}>
                        <Input
                          type="number"
                          placeholder={t('globalMods.builder.quantityLimits.minQty')}
                          value={guided.qtyRange.min}
                          onChange={(e) =>
                            setGuided((g) => ({
                              ...g,
                              qtyRange: { ...g.qtyRange, min: e.target.value },
                            }))
                          }
                        />
                        <Input
                          type="number"
                          placeholder={t('globalMods.builder.quantityLimits.maxQty')}
                          value={guided.qtyRange.max}
                          onChange={(e) =>
                            setGuided((g) => ({
                              ...g,
                              qtyRange: { ...g.qtyRange, max: e.target.value },
                            }))
                          }
                        />
                        {builderErrors.qtyRange && (
                          <Box>
                            {builderErrors.qtyRange}
                          </Box>
                        )}
                      </Box>
                    )}
                  </Box>
                </Flex>

                <Flex>
                  <Box md={4}>
                    <Checkbox
                      label={t('globalMods.builder.customerNotes.label')}
                      checked={guided.notes.enabled}
                      onChange={(e) =>
                        setGuided((g) => ({
                          ...g,
                          notes: { ...g.notes, enabled: e.target.checked },
                        }))
                      }
                    />
                    {guided.notes.enabled && (
                      <Box>
                        <Input
                          placeholder={t('globalMods.builder.customerNotes.placeholder')}
                          value={guided.notes.placeholder}
                          onChange={(e) =>
                            setGuided((g) => ({
                              ...g,
                              notes: { ...g.notes, placeholder: e.target.value },
                            }))
                          }
                        />
                        <Checkbox

                          label={t('globalMods.builder.customerNotes.showInRed')}
                          checked={guided.notes.showInRed}
                          onChange={(e) =>
                            setGuided((g) => ({
                              ...g,
                              notes: { ...g.notes, showInRed: e.target.checked },
                            }))
                          }
                        />
                      </Box>
                    )}
                  </Box>
                  <Box md={4}>
                    <Checkbox
                      label={t('globalMods.builder.customerUpload.label')}
                      checked={guided.customerUpload.enabled}
                      onChange={(e) =>
                        setGuided((g) => ({
                          ...g,
                          customerUpload: { ...g.customerUpload, enabled: e.target.checked },
                        }))
                      }
                    />
                    {guided.customerUpload.enabled && (
                      <Box>
                        <Input
                          placeholder={t('globalMods.builder.customerUpload.titlePlaceholder')}
                          value={guided.customerUpload.title}
                          onChange={(e) =>
                            setGuided((g) => ({
                              ...g,
                              customerUpload: { ...g.customerUpload, title: e.target.value },
                            }))
                          }
                        />
                        <Checkbox

                          label={t('globalMods.builder.customerUpload.required')}
                          checked={guided.customerUpload.required}
                          onChange={(e) =>
                            setGuided((g) => ({
                              ...g,
                              customerUpload: { ...g.customerUpload, required: e.target.checked },
                            }))
                          }
                        />
                      </Box>
                    )}
                  </Box>
                  <Box md={4}>
                    <Checkbox
                      label={t('globalMods.builder.modSampleImage.label')}
                      checked={guided.modSampleImage.enabled}
                      onChange={(e) =>
                        setGuided((g) => ({
                          ...g,
                          modSampleImage: { ...g.modSampleImage, enabled: e.target.checked },
                        }))
                      }
                    />
                  </Box>
                </Flex>

                <Flex>
                  <Box md={4}>
                    <Input
                      placeholder={t('globalMods.builder.descriptions.internal')}
                      value={guided.descriptions.internal}
                      onChange={(e) =>
                        setGuided((g) => ({
                          ...g,
                          descriptions: { ...g.descriptions, internal: e.target.value },
                        }))
                      }
                    />
                  </Box>
                  <Box md={4}>
                    <Input
                      placeholder={t('globalMods.builder.descriptions.customer')}
                      value={guided.descriptions.customer}
                      onChange={(e) =>
                        setGuided((g) => ({
                          ...g,
                          descriptions: { ...g.descriptions, customer: e.target.value },
                        }))
                      }
                    />
                  </Box>
                  <Box md={4}>
                    <Input
                      placeholder={t('globalMods.builder.descriptions.installer')}
                      value={guided.descriptions.installer}
                      onChange={(e) =>
                        setGuided((g) => ({
                          ...g,
                          descriptions: { ...g.descriptions, installer: e.target.value },
                        }))
                      }
                    />
                  </Box>
                </Flex>
              </Box>

              {/* Sample Image Upload Section */}
              <StandardCard mb={3} borderColor="cyan.500" borderWidth="1px">
                <CardHeader bg="cyan.500" color="white">
                  <Heading as="h6" size="sm">{t('globalMods.builder.sampleUpload.title')}</Heading>
                </CardHeader>
                <CardBody>
                  <Flex>
                    <Box md={6}>
                      <Box as="label" mb={2}>
                        {t('globalMods.builder.sampleUpload.uploadLabel')}
                      </label>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            const filename = await handleUploadImage(file)
                            if (filename) setNewTemplate((n) => ({ ...n, sampleImage: filename }))
                          }
                        }}

                      />
                      <Text fontSize="sm" color="gray.500">
                        {t('globalMods.builder.sampleUpload.hint')}
                      </Text>
                    </Box>
                    <Box md={6}>
                      {newTemplate.sampleImage ? (
                        <Box>
                          <Image
                            src={`${import.meta.env.VITE_API_URL || ''}/uploads/images/${newTemplate.sampleImage}`}
                            alt={t('globalMods.builder.sampleUpload.previewAlt')}
                            w="100%"
                            maxH={120}
                            objectFit="cover"
                            borderRadius={8}
                            onError={(e) => {
                              e.currentTarget.src = '/images/nologo.png'
                            }}
                          />
                          <Box>
                            <Text fontSize="sm">
                              {t('globalMods.builder.sampleUpload.uploaded', {
                                name: newTemplate.sampleImage,
                              })}
                            </Text>
                          </Box>
                        </Box>
                      ) : (
                        <Box
                          bg="gray.50"
                        >
                          <Box>📷</Box>
                          <Text fontSize="sm">{t('globalMods.builder.sampleUpload.none')}</Text>
                        </Box>
                      )}
                    </Box>
                  </Flex>
                </CardBody>
              </StandardCard>

              <Flex mt={4} justifyContent="space-between" gap={2}>
                <Button colorScheme="gray" variant="outline" onClick={() => setCreateStep(1)}>
                  {t('common.back')}
                </Button>
                <Button
                  colorScheme="brand"
                  onClick={async () => {
                    await createTemplate()
                    setShowCreateModModal(false)
                    setCreateStep(1)
                  }}
                  isDisabled={
                    Object.keys(builderErrors).length > 0 ||
                    !newTemplate.name.trim() ||
                    !newTemplate.defaultPrice
                  }
                >
                  {t('globalMods.modal.add.createTemplate')}
                </Button>
              </Box>
            </Box>
          )}
        </ModalBody>
        </ModalContent>
      </Modal>

      {/* Edit Category Modal */}
      <Modal
        isOpen={showEditCategoryModal}
        onClose={() => setShowEditCategoryModal(false)}
        size={{ base: 'full', md: 'md' }}
        scrollBehavior="inside"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{t('globalMods.modal.editCategory.title')}</ModalHeader>
          <ModalBody>
            <Flex>
              <Box md={8}>
                <Input
                  placeholder={t('globalMods.modal.editCategory.namePlaceholder')}
                  value={editCategory.name}
                  onChange={(e) => setEditCategory((c) => ({ ...c, name: e.target.value }))}
                />
              </Box>
              <Box md={4}>
                <Input
                  type="number"
                  placeholder={t('globalMods.modal.editCategory.orderPlaceholder')}
                  value={editCategory.orderIndex}
                  onChange={(e) => setEditCategory((c) => ({ ...c, orderIndex: e.target.value }))}
                />
              </Box>
            </Flex>
            <Flex>
              <Box md={12}>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    const filename = await handleUploadImage(file)
                    if (filename) {
                      setEditCategory((c) => ({ ...c, image: filename }))
                    }
                  }}
                />
                {editCategory.image && (
                  <Box>
                    <Image
                      src={`${import.meta.env.VITE_API_URL || ''}/uploads/images/${editCategory.image}`}
                      alt="Category"
                      w="100%"
                      maxH={140}
                      objectFit="cover"
                      borderRadius={8}
                      borderWidth="1px"
                      borderColor="gray.200"
                      onError={(e) => {
                        e.currentTarget.src = '/images/nologo.png'
                      }}
                    />
                  </Box>
                )}
              </Box>
            </Flex>
          </ModalBody>
          <ModalFooter display="flex" gap={2} justifyContent="flex-end">
            <Button
              colorScheme="gray"
              variant="outline"
              onClick={() => setShowEditCategoryModal(false)}
            >
              {t('globalMods.modal.editCategory.cancel')}
            </Button>
            <Button
              colorScheme="brand"
              onClick={saveEditCategory}
              isDisabled={!editCategory.name.trim()}
            >
              {t('globalMods.modal.editCategory.save')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Template Modal */}
      <Modal
        isOpen={showEditTemplateModal}
        onClose={() => setShowEditTemplateModal(false)}
        size={{ base: 'full', md: 'md', lg: 'lg' }}
        scrollBehavior="inside"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{t('globalMods.modal.editTemplate.title')}</ModalHeader>
          <ModalBody>
            <Flex>
              <Box md={6}>
                <FormLabel>{t('globalMods.modal.editTemplate.nameLabel')}</FormLabel>
                <Input
                  placeholder={t('globalMods.modal.editTemplate.nameLabel')}
                  value={editTemplate.name}
                  onChange={(e) => setEditTemplate((t) => ({ ...t, name: e.target.value }))}
                />
              </Box>
              <Box md={6}>
                <FormLabel>{t('globalMods.modal.editTemplate.priceLabel')}</FormLabel>
                <Input
                  type="number"
                  step="0.01"
                  placeholder={t('globalMods.modal.editTemplate.priceLabel')}
                  value={editTemplate.defaultPrice}
                  onChange={(e) => setEditTemplate((t) => ({ ...t, defaultPrice: e.target.value }))}
                />
              </Box>
            </Flex>
            <Flex>
              <Box md={12}>
                <FormLabel>{t('globalMods.modal.editTemplate.sampleUploadLabel')}</FormLabel>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    const filename = await handleUploadImage(file)
                    if (filename) setEditTemplate((t) => ({ ...t, sampleImage: filename }))
                  }}
                />
                {editTemplate.sampleImage && (
                  <Box>
                    <Image
                      src={`${import.meta.env.VITE_API_URL || ''}/uploads/images/${editTemplate.sampleImage}`}
                      alt={t('globalMods.modal.editTemplate.sampleAlt')}
                      w="100%"
                      maxH={140}
                      objectFit="cover"
                      borderRadius={8}
                      borderWidth="1px"
                      borderColor="gray.200"
                      onError={(e) => {
                        e.currentTarget.src = '/images/nologo.png'
                      }}
                    />
                  </Box>
                )}
              </Box>
            </Flex>
            {/* Task 7: Add "Mark as Ready" toggle */}
            <Flex>
              <Box md={12}>
                <Box borderTopWidth="1px" pt={3}>
                  <Checkbox
                    label={t('globalMods.modal.editTemplate.ready.label')}
                    checked={editTemplate.isReady}
                    onChange={(e) =>
                      setEditTemplate((t) => ({ ...t, isReady: e.target.checked }))
                    }
                  />
                  <Text fontSize="sm" color="gray.500" display="block" mt={1}>
                    {t('globalMods.modal.editTemplate.ready.hint')}
                  </Text>
                </Box>
              </Box>
            </Flex>
          </ModalBody>
          <ModalFooter display="flex" gap={2} justifyContent="flex-end">
            <Button colorScheme="gray" onClick={() => setShowEditTemplateModal(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              colorScheme="brand"
              onClick={saveEditTemplate}
              disabled={!editTemplate.name.trim()}
            >
              {t('globalMods.modal.editTemplate.saveChanges')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modification Gallery Modal */}
      <Modal
        isOpen={showGalleryModal}
        onClose={() => setShowGalleryModal(false)}
        size={{ base: 'full', md: 'lg', lg: 'xl' }}
        scrollBehavior="inside"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{t('globalMods.modal.gallery.title')}</ModalHeader>
          <ModalBody>
          <Box>
            {gallery.map((category) => (
              <Box key={category.id} flex="1" minW="50%" mb={4}>
                <Box>
                  <Box>
                    <Heading as="h6" size="sm">
                      {category.image && (
                        <>
                          <Image
                            src={`${import.meta.env.VITE_API_URL || ''}/uploads/images/${category.image}`}
                            alt={category.name}
                            w={20}
                            h={20}
                            objectFit="cover"
                            borderRadius={4}
                            borderWidth="1px"
                            borderColor="gray.200"
                            onError={(e) => {
                              e.currentTarget.src = '/images/nologo.png'
                            }}
                          />
                          <Badge
                            colorScheme="brand"
                            title={t('globalMods.modal.gallery.categoryImageUploaded')}
                          >
                            Img
                          </Badge>
                        </>
                      )}
                      {category.name}
                    </Heading>
                  </Box>
                  <Box>
                    {category.templates?.length ? (
                      category.templates.map((template) => (
                        <Box
                          key={template.id}

                        >
                          <Box>
                            <strong>{template.name}</strong>
                            {template.defaultPrice && (
                              <Text as="span">
                                {' '}
                                - ${Number(template.defaultPrice).toFixed(2)}
                              </Text>
                            )}
                            <Badge
                              color={template.isReady ? 'success' : 'warning'}

                            >
                              {template.isReady
                                ? t('globalMods.template.status.ready')
                                : t('globalMods.template.status.draft')}
                            </Badge>
                          </Box>
                          <Button
                            size="sm"
                            colorScheme="brand"
                            onClick={async () => {
                              // Immediately create a new template cloned from this one (independent of existing assignments)
                              try {
                                await axiosInstance.post('/api/global-mods/templates', {
                                  categoryId: template.categoryId || null,
                                  name: `${template.name} (Copy)`,
                                  defaultPrice:
                                    template.defaultPrice != null
                                      ? Number(template.defaultPrice)
                                      : 0,
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
                            {t('globalMods.modal.gallery.useAsBlueprint')}
                          </Button>
                        </Box>
                      ))
                    ) : (
                      <Text>{t('globalMods.modal.gallery.emptyCategory')}</Text>
                    )}
                  </Box>
                  {/* close column wrapper */}
                </Box>
              </Box>
            ))}
          </Box>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Assign Modification Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        size={{ base: 'full', md: 'md', lg: 'lg' }}
        scrollBehavior="inside"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{t('globalMods.modal.assign.title')}</ModalHeader>
          <ModalBody>
          <Flex>
            <Box md={6}>
              <Select
                value={selectedManufacturer}
                onChange={(e) => setSelectedManufacturer(e.target.value)}
              >
                <option value="">{t('globalMods.modal.assign.selectManufacturer')}</option>
                {manufacturers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </Select>
            </Box>
            <Box md={6}>
              <Select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
              >
                <option value="">{t('globalMods.modal.assign.selectTemplate')}</option>
                {flatTemplates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.categoryName ? `${t.categoryName} > ${t.name}` : t.name}
                  </option>
                ))}
              </Select>
            </Box>
          </Flex>

          <Flex>
            <Box md={4}>
              <Select
                value={assignForm.scope}
                onChange={(e) =>
                  setAssignForm((a) => ({
                    ...a,
                    scope: e.target.value,
                    targetStyle: '',
                    targetType: '',
                    catalogDataId: '',
                  }))
                }
              >
                <option value="all">{t('globalMods.modal.assign.scope.all')}</option>
                <option value="style">{t('globalMods.modal.assign.scope.style')}</option>
                <option value="type">{t('globalMods.modal.assign.scope.type')}</option>
                <option value="item">{t('globalMods.modal.assign.scope.item')}</option>
              </Select>
            </Box>
            <Box md={4}>
              {assignForm.scope === 'style' && (
                <Input
                  placeholder={t('globalMods.modal.assign.styleName')}
                  value={assignForm.targetStyle}
                  onChange={(e) => setAssignForm((a) => ({ ...a, targetStyle: e.target.value }))}
                />
              )}
              {assignForm.scope === 'type' && (
                <Input
                  placeholder={t('globalMods.modal.assign.typeName')}
                  value={assignForm.targetType}
                  onChange={(e) => setAssignForm((a) => ({ ...a, targetType: e.target.value }))}
                />
              )}
              {assignForm.scope === 'item' && (
                <Input
                  placeholder={t('globalMods.modal.assign.catalogItemId')}
                  value={assignForm.catalogDataId}
                  onChange={(e) => setAssignForm((a) => ({ ...a, catalogDataId: e.target.value }))}
                />
              )}
            </Box>
            <Box md={4}>
              <Input
                type="number"
                placeholder={t('globalMods.modal.assign.override')}
                value={assignForm.overridePrice}
                onChange={(e) => setAssignForm((a) => ({ ...a, overridePrice: e.target.value }))}
              />
            </Box>
          </Flex>

          </ModalBody>
          <ModalFooter display="flex" gap={2} justifyContent="flex-end">
            <Button colorScheme="gray" onClick={() => setShowAssignModal(false)}>
              {t('globalMods.modal.assign.cancel')}
            </Button>
            <Button
              colorScheme="brand"
              onClick={async () => {
                setAssignForm((prev) => ({ ...prev, manufacturerId: selectedManufacturer }))
                await assignTemplate()
                setShowAssignModal(false)
              }}
              disabled={!assignForm.templateId || !selectedManufacturer}
            >
              {t('globalMods.modal.assign.assign')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Task 6: Delete Category Modal */}
      <Modal
        isOpen={showDeleteCategoryModal}
        onClose={() => setShowDeleteCategoryModal(false)}
        size={{ base: 'full', md: 'md', lg: 'lg' }}
        scrollBehavior="inside"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {t('globalMods.modal.deleteCategory.title', { name: deleteCategory.name })}
          </ModalHeader>
          <ModalBody>
            <Box>
              <Box bg="orange.100" p={3} borderRadius="md">
                <strong>
                  <Trans i18nKey="globalMods.modal.deleteCategory.warning">⚠️ Warning:</Trans>
                </strong>{' '}
                <Trans
                  i18nKey="globalMods.modal.deleteCategory.aboutToDelete"
                  values={{ name: deleteCategory.name }}
                />
              </Box>

              {deleteCategory.templateCount > 0 ? (
                <Box>
                  <Text>
                    <Trans
                      i18nKey="globalMods.modal.deleteCategory.contains"
                      values={{ count: deleteCategory.templateCount }}
                      components={{ strong: <strong /> }}
                    />
                  </Text>

                  <RadioGroup value={deleteMode} onChange={setDeleteMode}>
                    <Stack spacing={3}>
                      <Radio value="move">
                        <Text>
                          <strong>{t('globalMods.modal.deleteCategory.move.label')}</strong>{' '}
                          {t('globalMods.modal.deleteCategory.move.recommended')}
                        </Text>
                      </Radio>

                      {deleteMode === 'move' && (
                        <Box mt={2} ml={6}>
                          <Select
                            value={moveToCategoryId}
                            onChange={(e) => setMoveToCategoryId(e.target.value)}
                          >
                            <option value="">
                              {t('globalMods.modal.deleteCategory.move.selectTarget')}
                            </option>
                            {gallery
                              .filter((cat) => cat.id !== deleteCategory.id)
                              .map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                  {t('globalMods.modal.deleteCategory.move.optionWithCount', {
                                    name: cat.name,
                                    count: (cat.templates || []).length,
                                  })}
                                </option>
                              ))}
                          </Select>
                          {!moveToCategoryId && (
                            <Text fontSize="sm" color="gray.500" mt={1}>
                              {t('globalMods.modal.deleteCategory.move.mustSelect')}
                            </Text>
                          )}
                        </Box>
                      )}

                      <Radio value="withMods">
                        <Text>
                          <strong>
                            {t('globalMods.modal.deleteCategory.withMods.label')}
                          </strong>{' '}
                          {t('globalMods.modal.deleteCategory.withMods.permanent')}
                        </Text>
                      </Radio>
                    </Stack>
                  </RadioGroup>

                    {deleteMode === 'withMods' && (
                      <Box bg="red.100" p={3} borderRadius="md" mt={2} ml={4}>
                        <Text fontSize="sm">
                          <Trans
                            i18nKey="globalMods.modal.deleteCategory.withMods.danger"
                            values={{ count: deleteCategory.templateCount }}
                          />
                        </Text>
                      </Box>
                    )}
                  </Box>
                </Box>
              ) : (
                <Text>{t('globalMods.modal.deleteCategory.emptySafe')}</Text>
              )}
            </Box>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="gray" onClick={() => setShowDeleteCategoryModal(false)}>
              {t('globalMods.modal.deleteCategory.cancel')}
            </Button>
            <Button
              colorScheme="red"
              onClick={confirmDeleteCategory}
              disabled={deleteMode === 'move' && !moveToCategoryId}
            >
              {deleteMode === 'only'
                ? t('globalMods.modal.deleteCategory.deleteOnly')
                : deleteMode === 'withMods'
                  ? t('globalMods.modal.deleteCategory.deleteWithMods')
                  : t('globalMods.modal.deleteCategory.deleteMoveMods')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  )
}

export default GlobalModsPage
