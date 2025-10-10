import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton, Button, IconButton, Input, Spinner, Breadcrumb, BreadcrumbItem, SimpleGrid, Box, Text, Tag, Stack, HStack, VStack, Divider, Image, Slider, SliderTrack, SliderFilledTrack, SliderThumb, NumberInput, NumberInputField, NumberInputStepper, NumberIncrementStepper, NumberDecrementStepper, Alert, AlertIcon, useToast, Textarea, useColorModeValue } from '@chakra-ui/react'
import { ArrowLeft, Search, X } from 'lucide-react'
import { useReducedMotion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import axiosInstance from '../../helpers/axiosInstance'
import PageHeader from '../PageHeader'
import { ICON_SIZE_MD, ICON_BOX_MD } from '../../constants/iconSizes'
import { getContrastColor } from '../../utils/colorUtils'

const FALLBACK_LEAD_TIME_DAYS = 8

const formatInches = (value) => {
  const numeric = Number(value)
  if (Number.isNaN(numeric)) return `${value}"`
  const whole = Math.floor(numeric)
  const fraction = numeric - whole
  const eighth = Math.round(fraction * 8)
  const fractionMap = {
    0: '',
    1: '1/8',
    2: '1/4',
    3: '3/8',
    4: '1/2',
    5: '5/8',
    6: '3/4',
    7: '7/8',
    8: '',
  }

  let wholePart = whole
  let fracLabel = fractionMap[eighth]
  if (eighth === 8) {
    wholePart += 1
    fracLabel = ''
  }
  const pieces = []
  if (wholePart > 0) pieces.push(String(wholePart))
  if (fracLabel) pieces.push(fracLabel)
  return `${pieces.length ? pieces.join(' ') : '0'}"`
}

const ModificationBrowserModal = ({
  visible,
  onClose,
  onApplyModification,
  selectedItemIndex,
  catalogItemId,
}) => {
  const { t } = useTranslation()
  const toast = useToast()
  const prefersReducedMotion = useReducedMotion()

  const customization = useSelector((state) => state.customization) || {}
  const headerBgFallback = useColorModeValue('brand.500', 'brand.400')
  const resolvedHeaderBg = customization.headerBg && customization.headerBg.trim() ? customization.headerBg : headerBgFallback
  const headerTextColor = customization.headerFontColor || getContrastColor(resolvedHeaderBg)

  // Color mode values
  const iconGray500 = useColorModeValue('gray.500', 'gray.400')
  const borderGray200 = useColorModeValue('gray.200', 'gray.600')
  const bgGray50 = useColorModeValue('gray.50', 'gray.800')
  const borderGray600 = useColorModeValue('gray.600', 'gray.400')
  const iconRed500 = useColorModeValue('red.500', 'red.300')
  const color6 = useColorModeValue('white', 'gray.700')
  const bgGray100 = useColorModeValue('gray.100', 'gray.700')
  const iconGray400 = useColorModeValue('gray.400', 'gray.500')
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [gallery, setGallery] = useState([])
  const [currentView, setCurrentView] = useState('categories')
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [modification, setModification] = useState({
    quantity: 1,
    selectedOptions: {},
    uploadedFiles: [],
  })

  const resetState = useCallback(() => {
    setCurrentView('categories')
    setSelectedCategory(null)
    setSelectedTemplate(null)
    setSearchTerm('')
    setModification({
      quantity: 1,
      selectedOptions: {},
      uploadedFiles: [],
    })
  }, [])

  const loadAssignedModifications = useCallback(async () => {
    setLoading(true)
    try {
      if (!catalogItemId) {
        setGallery([])
        return
      }

      const { data } = await axiosInstance.get(`/api/global-mods/item/${catalogItemId}`)
      const assignments = data?.assignments || []
      const categoryMap = new Map()

      assignments.forEach((assignment) => {
        const template = assignment.template
        if (!template) return

        const categoryName = assignment.category?.name || t('modificationBrowser.uncategorized', 'Uncategorized')
        const categoryId = assignment.category?.id || 'uncategorized'

        if (!categoryMap.has(categoryId)) {
          categoryMap.set(categoryId, {
            id: categoryId,
            name: categoryName,
            templates: [],
          })
        }

        categoryMap.get(categoryId).templates.push({
          ...template,
          assignmentId: assignment.id,
          overridePrice: assignment.overridePrice,
          effectivePrice: assignment.overridePrice ?? template.defaultPrice,
          scope: assignment.scope,
        })
      })

      setGallery(Array.from(categoryMap.values()))
    } catch (error) {
      console.error('Error loading assigned modifications:', error)
      toast({
        status: 'error',
        title: t('common.error', 'Error'),
        description: t('modificationBrowser.toast.loadFailed', 'Failed to load modifications.'),
      })
      setGallery([])
    } finally {
      setLoading(false)
    }
  }, [catalogItemId, t, toast])

  useEffect(() => {
    if (visible) {
      loadAssignedModifications()
      resetState()
    }
  }, [visible, loadAssignedModifications, resetState])

  const filteredCategories = useMemo(() => {
    if (!searchTerm) return gallery
    return gallery.filter((category) => {
      const inCategory = category.name.toLowerCase().includes(searchTerm.toLowerCase())
      const inTemplates = (category.templates || []).some((template) =>
        template.name.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      return inCategory || inTemplates
    })
  }, [gallery, searchTerm])

  const filteredTemplates = useMemo(() => {
    if (!selectedCategory) return []
    if (!searchTerm) return selectedCategory.templates || []
    return (selectedCategory.templates || []).filter((template) =>
      template.name.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }, [selectedCategory, searchTerm])

  const handleCategorySelect = (category) => {
    setSelectedCategory(category)
    setCurrentView('templates')
    setSearchTerm('')
  }

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template)
    setCurrentView('details')
    setSearchTerm('')

    const config = template.fieldsConfig || {}
    const initialOptions = {}
    const initialQuantity = config.qtyRange && config.qtyRange.enabled !== false ? config.qtyRange.min : 1

    if (config.sliders) {
      Object.entries(config.sliders).forEach(([key, slider]) => {
        if (slider.enabled === false) return
        initialOptions[key] = slider.min || 0
      })
    }

    if (config.sideSelector && config.sideSelector.enabled !== false) {
      const firstOption = config.sideSelector.options?.[0]
      if (firstOption) {
        initialOptions.sideSelector = firstOption
      }
    }

    setModification((prev) => ({
      ...prev,
      quantity: initialQuantity,
      selectedOptions: initialOptions,
      uploadedFiles: [],
    }))
  }

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

  const handleApplyModification = async () => {
    if (!selectedTemplate) return

    const cfg = selectedTemplate.fieldsConfig || {}
    if (
      cfg.customerUpload &&
      cfg.customerUpload.enabled !== false &&
      cfg.customerUpload.required &&
      (!modification.uploadedFiles || modification.uploadedFiles.length === 0)
    ) {
      toast({
        status: 'warning',
        title: t('common.warning', 'Warning'),
        description: t(
          'proposalUI.custom.validation.missingFile',
          'This modification requires a file upload. Please attach at least one file.',
        ),
      })
      return
    }

    let attachments = []
    try {
      if (Array.isArray(modification.uploadedFiles) && modification.uploadedFiles.length > 0) {
        const uploads = await Promise.all(
          modification.uploadedFiles.map(async (file) => {
            const form = new FormData()
            form.append('file', file)
            const { data } = await axiosInstance.post('/api/resources/files', form, {
              headers: { 'Content-Type': 'multipart/form-data' },
            })
            const payload = data?.data || data
            return payload
              ? {
                  id: payload.id,
                  url: payload.url || `/api/resources/files/download/${payload.id}`,
                  name: payload.original_name || payload.name || file.name,
                  mimeType: payload.mime_type || file.type || '',
                  size: payload.file_size || file.size,
                }
              : null
          }),
        )
        attachments = uploads.filter(Boolean)
      }
    } catch (error) {
      console.error('Upload failed:', error)
      toast({
        status: 'error',
        title: t('common.error', 'Error'),
        description: t(
          'proposalUI.custom.validation.uploadFailed',
          'Could not upload one or more files. Please try again.',
        ),
      })
      return
    }

    const modificationData = {
      templateId: selectedTemplate.id,
      templateName: selectedTemplate.name,
      categoryName: selectedCategory?.name || '',
      quantity: modification.quantity,
      note: selectedTemplate.fieldsConfig?.notes?.placeholder || '',
      selectedOptions: modification.selectedOptions,
      price: selectedTemplate.effectivePrice || selectedTemplate.defaultPrice || 0,
      taxable: true,
      scope: selectedTemplate.scope,
      assignmentId: selectedTemplate.assignmentId,
      attachments,
    }

    try {
      await onApplyModification(selectedItemIndex, modificationData)
      toast({
        status: 'success',
        title: t('common.success', 'Success'),
        description: t('proposalUI.custom.applied', 'Modification applied successfully!'),
      })
      onClose?.()
    } catch (error) {
      console.error('Apply modification failed:', error)
      toast({
        status: 'error',
        title: t('common.error', 'Error'),
        description: t('proposalUI.custom.errorApply', 'Unable to apply modification.'),
      })
    }
  }

  const renderModificationConfig = () => {
    if (!selectedTemplate?.fieldsConfig) {
      return (
        <Alert status="info" variant="subtle" borderRadius="md">
          <AlertIcon />
          <Text fontSize="sm">
            {t('proposalUI.custom.noOptions', 'This modification template has no configurable options.')}
          </Text>
        </Alert>
      )
    }

    const config = selectedTemplate.fieldsConfig

    return (
      <Stack spacing={5} mt={4}>
        {config.sliders &&
          Object.entries(config.sliders).map(([sliderKey, slider]) => {
            if (slider.enabled === false) return null
            const value = modification.selectedOptions[sliderKey] ?? slider.min
            return (
              <Stack key={sliderKey} spacing={4}>
                <HStack justify="space-between">
                  <Text fontWeight="medium" textTransform="capitalize">
                    {t('proposalUI.custom.choose', 'Choose')} {sliderKey}
                  </Text>
                  <Text fontSize="sm" color={iconGray500}>
                    {formatInches(value)}
                  </Text>
                </HStack>
                <Slider
                  min={slider.min}
                  max={slider.max}
                  step={slider.step || 1}
                  value={value}
                  onChange={(next) =>
                    setModification((prev) => ({
                      ...prev,
                      selectedOptions: {
                        ...prev.selectedOptions,
                        [sliderKey]: Number(next),
                      },
                    }))
                  }
                >
                  <SliderTrack>
                    <SliderFilledTrack />
                  </SliderTrack>
                  <SliderThumb />
                </Slider>
                <HStack justify="space-between" fontSize="xs" color={iconGray500}>
                  <Text>{formatInches(slider.min)}</Text>
                  <Text>{formatInches(slider.max)}</Text>
                </HStack>
              </Stack>
            )
          })}

        {config.sideSelector && config.sideSelector.enabled !== false && (
          <Stack spacing={4}>
            <Text fontWeight="medium">{t('modificationBrowser.sideSelector.label', 'Side Selection')}</Text>
            <HStack spacing={4}>
              {(config.sideSelector.options || []).map((option) => {
                const isSelected = modification.selectedOptions.sideSelector === option
                const display = option === 'L'
                  ? t('modificationBrowser.sideSelector.left', 'Left')
                  : option === 'R'
                  ? t('modificationBrowser.sideSelector.right', 'Right')
                  : option
                return (
                  <Button
                    key={option}
                    variant={isSelected ? 'solid' : 'outline'}
                    colorScheme="brand"
                    size="sm"
                    onClick={() =>
                      setModification((prev) => ({
                        ...prev,
                        selectedOptions: {
                          ...prev.selectedOptions,
                          sideSelector: option,
                        },
                      }))
                    }
                  >
                    {display}
                  </Button>
                )
              })}
            </HStack>
          </Stack>
        )}

        {config.qtyRange && config.qtyRange.enabled !== false && (
          <Stack spacing={4}>
            <Text fontWeight="medium">{t('modificationBrowser.qty.label', 'Quantity')}</Text>
            <NumberInput
              min={config.qtyRange.min}
              max={config.qtyRange.max}
              value={modification.quantity}
              onChange={(_, valueNumber) =>
                setModification((prev) => ({
                  ...prev,
                  quantity: valueNumber,
                }))
              }
              maxW="160px"
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </Stack>
        )}

        {config.notes && config.notes.enabled !== false && (
          <Box borderWidth="1px" borderColor={borderGray200} borderRadius="md" p={3} bg={bgGray50}>
            <Text fontSize="sm" color={borderGray600}>
              {config.notes.placeholder || t('proposalUI.custom.notesFallback', 'No additional notes configured for this modification.')}
            </Text>
          </Box>
        )}

        {config.customerUpload && config.customerUpload.enabled !== false && (
          <Stack spacing={4}>
            <HStack spacing={4}>
              <Text fontWeight="medium">
                {config.customerUpload.title || t('modificationBrowser.upload.label', 'File Upload')}
              </Text>
              {config.customerUpload.required && <Text color={iconRed500}>*</Text>}
            </HStack>
            <Input
              type="file"
              multiple
              onChange={(event) =>
                setModification((prev) => ({
                  ...prev,
                  uploadedFiles: Array.from(event.target.files || []),
                }))
              }
            />
            {config.customerUpload.description && (
              <Text fontSize="xs" color={iconGray500}>
                {config.customerUpload.description}
              </Text>
            )}
          </Stack>
        )}
      </Stack>
    )
  }

  const renderCategoryGrid = () => (
    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
      {filteredCategories.map((category) => (
        <Box
          key={category.id}
          borderWidth="1px"
          borderRadius="lg"
          p={5}
          bg={color6}
          shadow="sm"
          _hover={{ shadow: 'md', borderColor: 'brand.500' }}
          cursor="pointer"
          onClick={() => handleCategorySelect(category)}
        >
          <Stack spacing={4}>
            <Text fontWeight="semibold" noOfLines={2}>
              {category.name}
            </Text>
            <Text fontSize="sm" color={iconGray500}>
              {t('modificationBrowser.category.count', {
                defaultValue: '{{count}} templates',
                count: category.templates?.length || 0,
              })}
            </Text>
          </Stack>
        </Box>
      ))}
    </SimpleGrid>
  )

  const renderTemplateGrid = () => (
    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
      {filteredTemplates.map((template) => (
        <Box
          key={template.id}
          borderWidth="1px"
          borderRadius="lg"
          p={4}
          bg={color6}
          shadow="sm"
          _hover={{ shadow: 'md', borderColor: 'brand.500' }}
          cursor="pointer"
          onClick={() => handleTemplateSelect(template)}
        >
          <Stack spacing={4} h="100%">
            {(template.sampleImage || template.fieldsConfig?.modSampleImage?.enabled) && (
              <Box
                bg={bgGray50}
                borderRadius="md"
                borderWidth="1px"
                borderColor={borderGray200}
                h="150px"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Image
                  src={template.sampleImage ? `${import.meta.env.VITE_API_URL || ''}/uploads/images/${template.sampleImage}` : '/images/nologo.png'}
                  alt={template.name}
                  maxH="140px"
                  objectFit="contain"
                  fallbackSrc="/images/nologo.png"
                />
              </Box>
            )}
            <Stack spacing={4} flex="1">
              <HStack justify="space-between" align="flex-start">
                <Text fontWeight="semibold" noOfLines={2}>
                  {template.name}
                </Text>
                <Tag colorScheme={template.isReady ? 'green' : 'yellow'}>
                  {template.isReady
                    ? t('modificationBrowser.template.status.ready', 'Ready')
                    : t('modificationBrowser.template.status.draft', 'Draft')}
                </Tag>
              </HStack>
              {template.descriptions?.customer && (
                <Text fontSize="sm" color={iconGray500} noOfLines={2}>
                  {template.descriptions.customer}
                </Text>
              )}
              {template.effectivePrice && (
                <Text fontSize="sm">
                  <Text as="span" fontWeight="semibold">
                    ${Number(template.effectivePrice).toFixed(2)}
                  </Text>
                  {template.overridePrice && (
                    <Text as="span" fontSize="xs" color={iconGray500} ml={1}>
                      {t('modificationBrowser.template.price.overrideShort', 'Override')}
                    </Text>
                  )}
                </Text>
              )}
            </Stack>
            <Tag alignSelf="flex-start" colorScheme="brand">
              {t('modificationBrowser.template.configure', 'Configure')}
            </Tag>
          </Stack>
        </Box>
      ))}
    </SimpleGrid>
  )

  const renderTemplateDetails = () => {
    if (!selectedTemplate) return null
    return (
      <Stack spacing={5}>
        <Stack spacing={4}>
          <HStack justify="space-between" align="flex-start">
            <Stack spacing={4} flex="1">
              <Text fontSize="lg" fontWeight="semibold">
                {selectedTemplate.name}
              </Text>
              {selectedTemplate.descriptions?.customer && (
                <Text fontSize="sm" color={iconGray500}>
                  {selectedTemplate.descriptions.customer}
                </Text>
              )}
            </Stack>
            <Stack spacing={4} align="flex-end">
              {selectedTemplate.effectivePrice && (
                <Text fontWeight="bold">
                  ${Number(selectedTemplate.effectivePrice).toFixed(2)}
                </Text>
              )}
              {selectedTemplate.overridePrice && (
                <Text fontSize="xs" color={iconGray500}>
                  {t('modificationBrowser.template.price.overrideLabel', 'Override price')}
                </Text>
              )}
              <Tag colorScheme={selectedTemplate.isReady ? 'green' : 'yellow'}>
                {selectedTemplate.isReady
                  ? t('modificationBrowser.template.status.ready', 'Ready')
                  : t('modificationBrowser.template.status.draft', 'Draft')}
              </Tag>
            </Stack>
          </HStack>
        </Stack>

        {(selectedTemplate.sampleImage || selectedTemplate.fieldsConfig?.modSampleImage?.enabled) && (
          <Box
            borderWidth="1px"
            borderRadius="md"
            bg={bgGray50}
            borderColor={borderGray200}
            h="230px"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Image
              src={selectedTemplate.sampleImage ? `${import.meta.env.VITE_API_URL || ''}/uploads/images/${selectedTemplate.sampleImage}` : '/images/nologo.png'}
              alt={selectedTemplate.name}
              maxH="220px"
              objectFit="contain"
              fallbackSrc="/images/nologo.png"
            />
          </Box>
        )}

        <Alert status="warning" variant="subtle" borderRadius="md">
          <AlertIcon />
          <Text fontSize="sm">
            <Text as="span" fontWeight="semibold">
              {t('modificationBrowser.leadTime.noticeTitle', 'Please note:')}
            </Text>{' '}
            {t('modificationBrowser.leadTime.noticeText', {
              defaultValue: 'This item has an extended lead time of {{days}} days.',
              days: FALLBACK_LEAD_TIME_DAYS,
            })}
          </Text>
        </Alert>

        {renderModificationConfig()}

        {(!selectedTemplate.fieldsConfig?.qtyRange || selectedTemplate.fieldsConfig.qtyRange.enabled === false) && (
          <Stack spacing={4}>
            <Text fontWeight="medium">{t('modificationBrowser.qty.label', 'Quantity')}</Text>
            <NumberInput
              min={1}
              value={modification.quantity}
              onChange={(_, valueNumber) =>
                setModification((prev) => ({
                  ...prev,
                  quantity: Math.max(1, valueNumber),
                }))
              }
              maxW="160px"
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </Stack>
        )}
      </Stack>
    )
  }

  const showBackButton = currentView !== 'categories'

  return (
    <Modal isOpen={visible} onClose={onClose} size={{ base: "full", lg: "full" }} scrollBehavior="inside" isCentered>
      <ModalOverlay />
      <ModalContent borderRadius="12px">
        <ModalHeader px={6} py={4} bg={resolvedHeaderBg} color={headerTextColor}>
          <HStack justify="space-between" align="center">
            <HStack spacing={4} align="center">
              {showBackButton && (
                <IconButton
                  minW="44px"
                  minH="44px"
                  icon={<ArrowLeft size={ICON_SIZE_MD} />}
                  variant="ghost"
                  aria-label={t('modificationBrowser.buttons.back', 'Back')}
                  onClick={handleBack}
                  color={headerTextColor}
                  _hover={{ bg: 'whiteAlpha.200' }}
                />
              )}
              <Text fontWeight="semibold" fontSize="lg">
                {t('modificationBrowser.title', 'Browse Modifications')}
              </Text>
            </HStack>
            <IconButton
              minW="44px"
              minH="44px"
              icon={<X size={ICON_SIZE_MD} />}
              variant="ghost"
              aria-label={t('modificationBrowser.buttons.close', 'Close')}
              onClick={onClose}
              color={headerTextColor}
              _hover={{ bg: 'whiteAlpha.200' }}
            />
          </HStack>
        </ModalHeader>

        <ModalBody px={6} py={4} bg={bgGray50}>
          <Stack spacing={6}>
            <PageHeader
              title={t('modificationBrowser.header.title', 'Modification Library')}
              subtitle={t('modificationBrowser.header.subtitle', 'Pick a modification to apply to this item.')}
              breadcrumbs={[
                { label: t('modificationBrowser.breadcrumb.categories', 'Categories'), href: null },
                ...(selectedCategory
                  ? [{ label: selectedCategory.name, href: null }]
                  : []),
                ...(selectedTemplate
                  ? [{ label: selectedTemplate.name, href: null }]
                  : []),
              ]}
            />

            <HStack spacing={4}>
              <Box flex="1" position="relative">
                <Input
                  pl={10}
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder={t('modificationBrowser.search.placeholder', 'Search modifications')}
                />
                <Box position="absolute" left={3} top="50%" transform="translateY(-50%)" color={iconGray400}>
                  <Search size={ICON_SIZE_MD} />
                </Box>
              </Box>
              <Button variant="ghost" onClick={() => setSearchTerm('')} isDisabled={!searchTerm}>
                {t('modificationBrowser.search.clear', 'Clear')}
              </Button>
            </HStack>

            {loading ? (
              <Box py={16} textAlign="center">
                <Spinner size="lg" />
                <Text mt={4} color={iconGray500}>
                  {t('modificationBrowser.loading', 'Loading modifications...')}
                </Text>
              </Box>
            ) : currentView === 'categories' ? (
              filteredCategories.length ? (
                renderCategoryGrid()
              ) : (
                <Alert status="info" variant="subtle" borderRadius="md">
                  <AlertIcon />
                  <Stack spacing={4}>
                    <Text fontWeight="semibold">
                      {t('modificationBrowser.empty.title', 'No categories found')}
                    </Text>
                    <Text fontSize="sm">
                      {t('modificationBrowser.empty.subtitle', 'Try adjusting the search or assign modifications to this item first.')}
                    </Text>
                  </Stack>
                </Alert>
              )
            ) : currentView === 'templates' ? (
              filteredTemplates.length ? (
                renderTemplateGrid()
              ) : (
                <Alert status="info" variant="subtle" borderRadius="md">
                  <AlertIcon />
                  <Text fontSize="sm">
                    {t('modificationBrowser.templates.empty', 'No templates match your search in this category.')}
                  </Text>
                </Alert>
              )
            ) : (
              renderTemplateDetails()
            )}
          </Stack>
        </ModalBody>

        <Divider borderColor={bgGray100} />

        <ModalFooter px={6} py={4} bg={color6}>
          <HStack spacing={4} justify="flex-end" w="full">
            <Button variant="outline" onClick={onClose} minH="44px">
              {t('common.cancel', 'Cancel')}
            </Button>
            {currentView === 'details' && (
              <Button
                colorScheme="brand"
                onClick={handleApplyModification}
                isDisabled={!selectedTemplate}
                minW="160px"
                transition={prefersReducedMotion ? undefined : 'transform 0.1s ease'}
                _active={prefersReducedMotion ? undefined : { transform: 'scale(0.98)' }}
               minH="44px">
                {t('modificationBrowser.actions.addModification', 'Add modification')}
              </Button>
            )}
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default ModificationBrowserModal
