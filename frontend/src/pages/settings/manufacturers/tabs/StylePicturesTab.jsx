import React, { useState, useEffect, useCallback } from 'react'
import {
  Card,
  CardBody,
  CardHeader,
  Spinner,
  Alert,
  Badge,
  Input,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  FormLabel,
  Button,
  HStack,
  Flex,
  Box,
  Text,
} from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { LazyLoadImage } from 'react-lazy-load-image-component'
import { Upload, Pencil, Trash, Plus } from '@/icons-lucide'
import axiosInstance from '../../../../helpers/axiosInstance'

const StylePicturesTab = ({ manufacturer }) => {
  const { t } = useTranslation()
  const api_url = import.meta.env.VITE_API_URL

  const [stylesMeta, setStylesMeta] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [hoveredId, setHoveredId] = useState(null)

  // Edit image modal
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [selectedStyle, setSelectedStyle] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  // Create style modal
  const [createModal, setCreateModal] = useState(false)
  const [createBusy, setCreateBusy] = useState(false)
  const [createForm, setCreateForm] = useState({
    name: '',
    shortName: '',
    description: '',
    code: '',
    imageFile: null,
  })

  // Delete style modal
  const [deleteAsk, setDeleteAsk] = useState({ open: false, styleName: '' })
  const [reassignTo, setReassignTo] = useState('')

  // Image error handler with fallbacks
  const handleImageError = useCallback(
    (e, style) => {
      const fname = style?.styleVariants?.[0]?.image
      if (fname && !e.target.dataset.fallbackTried) {
        e.target.dataset.fallbackTried = '1'
        e.target.src = `${api_url}/uploads/manufacturer_catalogs/${fname}`
      } else if (!e.target.src.includes('/images/nologo.png')) {
        e.target.src = '/images/nologo.png'
      }
    },
    [api_url],
  )

  // Fetch styles with images
  useEffect(() => {
    if (manufacturer?.id) {
      fetchStylesMeta()
    }
  }, [manufacturer?.id])

  const fetchStylesMeta = async () => {
    if (!manufacturer?.id) return
    setLoading(true)
    setError(null)
    try {
      const response = await axiosInstance.get(
        `/api/manufacturers/${manufacturer.id}/styles-meta`,
      )
      if (response.data && response.data.styles && Array.isArray(response.data.styles)) {
        setStylesMeta(response.data.styles)
      } else if (Array.isArray(response.data)) {
        setStylesMeta(response.data)
      } else {
        setStylesMeta([])
      }
    } catch (err) {
      console.error('Error fetching styles meta:', err)
      setError(t('styles.loadFailed', 'Failed to load style pictures. Please try again.'))
      setStylesMeta([])
    } finally {
      setLoading(false)
    }
  }

  const filteredStyles = stylesMeta.filter((styleMeta) => {
    const name = styleMeta.style?.toLowerCase() || ''
    const short = styleMeta.styleVariants?.[0]?.shortName?.toLowerCase() || ''
    const q = searchTerm.toLowerCase()
    return name.includes(q) || short.includes(q)
  })

  // Edit image modal open
  const handleEditImage = (style) => {
    setSelectedStyle(style)
    setSelectedFile(null)
    setEditModalVisible(true)
  }

  // File selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    setSelectedFile(file || null)
  }

  // Upload image for style
  const handleImageUpload = async () => {
    if (!selectedStyle || !selectedFile || !manufacturer?.id) return
    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append('styleImage', selectedFile)
      formData.append('name', selectedStyle.style)
      formData.append('shortName', selectedStyle.styleVariants?.[0]?.shortName || '')
      formData.append('description', selectedStyle.styleVariants?.[0]?.description || '')
      formData.append('manufacturerId', manufacturer.id)
      formData.append('catalogId', selectedStyle.id)
      formData.append('code', selectedStyle.styleVariants?.[0]?.code || '')

      const response = await axiosInstance.post('/api/manufacturers/style/create', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      if (response.data?.success) {
        await fetchStylesMeta()
        setEditModalVisible(false)
        setSelectedStyle(null)
        setSelectedFile(null)
      }
    } catch (err) {
      console.error('Error uploading image:', err)
    } finally {
      setUploadingImage(false)
    }
  }

  // Create style submit
  const handleCreateStyle = async () => {
    if (!manufacturer?.id || !createForm.name.trim()) return
    setCreateBusy(true)
    try {
      const fd = new FormData()
      if (createForm.imageFile) fd.append('styleImage', createForm.imageFile)
      fd.append('manufacturerId', manufacturer.id)
      fd.append('name', createForm.name.trim())
      fd.append('shortName', createForm.shortName || '')
      fd.append('description', createForm.description || '')
      fd.append('code', createForm.code || '')

      await axiosInstance.post(
        `/api/manufacturers/${manufacturer.id}/styles`,
        fd,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      )
      await fetchStylesMeta()
      setCreateModal(false)
      setCreateForm({ name: '', shortName: '', description: '', code: '', imageFile: null })
    } catch (e) {
      console.error(e)
    } finally {
      setCreateBusy(false)
    }
  }

  // Delete style submit
  const handleDeleteStyle = async () => {
    if (!manufacturer?.id || !deleteAsk.styleName) return
    try {
      await axiosInstance.delete(
        `/api/manufacturers/${manufacturer.id}/styles/${encodeURIComponent(deleteAsk.styleName)}`,
        { data: { reassignTo } },
      )
      await fetchStylesMeta()
    } catch (e) {
      console.error(e)
    } finally {
      setDeleteAsk({ open: false, styleName: '' })
      setReassignTo('')
    }
  }

  if (loading) {
    return (
      <Card>
        <CardBody textAlign="center" py={10}>
          <Spinner color="brand.500" />
          <Text mt={3}>{t('styles.loading', 'Loading style pictures...')}</Text>
        </CardBody>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardBody>
          <Alert status="error">{error}</Alert>
        </CardBody>
      </Card>
    )
  }

  if (!manufacturer?.id) {
    return (
      <Card>
        <CardBody>
          <Alert status="info">
            {t(
              'styles.selectManufacturerInfo',
              'Please select a manufacturer to view style pictures.',
            )}
          </Alert>
        </CardBody>
      </Card>
    )
  }

  if (!stylesMeta || stylesMeta.length === 0) {
    return (
      <Card>
        <CardBody>
          <Alert status="info">
            {t(
              'styles.noStylesInfo',
              'No styles with pictures found for this manufacturer. Upload style images in the catalog mapping section to see them here.',
            )}
          </Alert>
        </CardBody>
      </Card>
    )
  }

  return (
    <Box>
      <Card mb={4}>
        <CardHeader>
          <Flex direction={{ base: 'column', md: 'row' }} gap={4} align={{ base: 'stretch', md: 'center' }} justify="space-between">
            <Box>
              <HStack spacing={4} align="center">
                <Text as="h5" fontWeight="semibold">
                  {t('styles.header', 'Style Pictures for {{name}}', { name: manufacturer.name })}
                </Text>
                <Badge colorScheme="blue">
                  {t('styles.count', '{{count}} Styles', { count: filteredStyles.length })}
                </Badge>
                {searchTerm && (
                  <Badge colorScheme="gray" variant="subtle">
                    {t('styles.filtered', '(filtered from {{total}})', { total: stylesMeta.length })}
                  </Badge>
                )}
              </HStack>
              <Text mt={1} fontSize="sm" color="gray.500">
                {t(
                  'styles.helperText',
                  'View all styles with their associated pictures. Images are used in quote creation to help customers visualize their selections.',
                )}
              </Text>
            </Box>
            <HStack spacing={4} align="center">
              <Input
                placeholder={t('styles.searchPlaceholder', 'Search styles...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                maxW={{ base: '100%', md: '260px' }}
              />
              <Button leftIcon={<Plus size={16} />} colorScheme="brand" onClick={() => setCreateModal(true)}>
                {t('styles.create', 'Add Style')}
              </Button>
            </HStack>
          </Flex>
        </CardHeader>
      </Card>

      <Card>
        <CardBody>
          <Flex wrap="wrap" gap={4}>
            {filteredStyles.map((style, index) => (
              <Box
                key={style.id || index}
                textAlign="center"
                minW="90px"
                maxW="130px"
              >
                <Box
                  position="relative"
                  onMouseEnter={() => setHoveredId(style.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  cursor="pointer"
                >
                  <Box
                    borderWidth="1px"
                    borderRadius="md"
                    overflow="hidden"
                    bg="gray.50"
                  >
                    <LazyLoadImage
                      src={
                        style.styleVariants?.[0]?.image
                          ? `${api_url}/uploads/images/${style.styleVariants[0].image}`
                          : '/images/nologo.png'
                      }
                      alt={style.styleVariants?.[0]?.shortName || style.style}
                      style={{
                        maxWidth: '120px',
                        maxHeight: '150px',
                        height: 'auto',
                        width: 'auto',
                        display: 'block',
                      }}
                      placeholderSrc="/images/nologo.png"
                      effect="blur"
                      onError={(e) => handleImageError(e, style)}
                    />
                  </Box>

                  {/* Overlay actions */}
                  <Flex
                    position="absolute"
                    inset={0}
                    align="center"
                    justify="center"
                    bg="rgba(0,0,0,0.6)"
                    color="white"
                    opacity={hoveredId === style.id ? 1 : 0}
                    transition="opacity 0.2s ease-in-out"
                    borderRadius="md"
                  >
                    <HStack spacing={4}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditImage(style)
                        }}
                        leftIcon={<Pencil size={14} />}
                      >
                        {t('types.ui.uploadImage', 'Upload Image')}
                      </Button>
                      <Button
                        colorScheme="red"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteAsk({ open: true, styleName: style.style })
                          setReassignTo('')
                        }}
                        leftIcon={<Trash size={14} />}
                      >
                        {t('common.delete', 'Delete')}
                      </Button>
                    </HStack>
                  </Flex>
                </Box>

                {/* Caption */}
                <Box mt={2} maxW="120px" mx="auto">
                  <Text fontSize="sm" noOfLines={1} title={style.styleVariants?.[0]?.shortName || style.style}>
                    {style.styleVariants?.[0]?.shortName || style.style}
                  </Text>
                  {style.styleVariants?.length > 0 && (
                    <Box textAlign="center" mt={1}>
                      <Badge colorScheme="gray" fontSize="xs">
                        {style.styleVariants.length} {t('styles.variants', 'variants')}
                      </Badge>
                    </Box>
                  )}
                </Box>
              </Box>
            ))}
          </Flex>
        </CardBody>
      </Card>

      {/* Create Style Modal */}
      <Modal isOpen={createModal} onClose={() => setCreateModal(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{t('styles.createHeader', 'Add Style')}</ModalHeader>
          <ModalBody>
            <Flex direction="column" gap={4}>
              <Box>
                <FormLabel>{t('styles.name', 'Style Name')}</FormLabel>
                <Input
                  value={createForm.name}
                  onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
                />
              </Box>
              <Box>
                <FormLabel>{t('styles.short', 'Short Name')}</FormLabel>
                <Input
                  value={createForm.shortName}
                  onChange={(e) => setCreateForm((p) => ({ ...p, shortName: e.target.value }))}
                />
              </Box>
              <Box>
                <FormLabel>{t('common.description', 'Description')}</FormLabel>
                <Input
                  value={createForm.description}
                  onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))}
                />
              </Box>
              <Box>
                <FormLabel>{t('common.code', 'Code')}</FormLabel>
                <Input
                  value={createForm.code}
                  onChange={(e) => setCreateForm((p) => ({ ...p, code: e.target.value }))}
                />
              </Box>
              <Box>
                <FormLabel>{t('common.image', 'Image')}</FormLabel>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setCreateForm((p) => ({ ...p, imageFile: e.target.files?.[0] || null }))
                  }
                />
              </Box>
            </Flex>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => setCreateModal(false)} disabled={createBusy}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button colorScheme="brand" onClick={handleCreateStyle} isLoading={createBusy}>
              {t('common.save', 'Save')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal isOpen={deleteAsk.open} onClose={() => setDeleteAsk({ open: false, styleName: '' })}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{t('styles.deleteHeader', 'Delete Style')}</ModalHeader>
          <ModalBody>
            <Text>
              {t('styles.deleteConfirm', 'Delete style')}{' '}
              <strong>{deleteAsk.styleName}</strong>?
            </Text>
            <Box mt={4}>
              <FormLabel>
                {t('styles.reassign', 'Reassign items to (leave empty to clear)')}
              </FormLabel>
              <Input
                value={reassignTo}
                onChange={(e) => setReassignTo(e.target.value)}
                placeholder={t('styles.reassignPh', 'New style name or blank')}
              />
            </Box>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => setDeleteAsk({ open: false, styleName: '' })}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button colorScheme="red" onClick={handleDeleteStyle}>
              {t('common.delete', 'Delete')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Image Modal */}
      <Modal
        isOpen={editModalVisible}
        onClose={() => {
          setEditModalVisible(false)
          setSelectedStyle(null)
          setSelectedFile(null)
        }}
        size="lg"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{t('styles.editImage', 'Edit Style Image')}</ModalHeader>
          <ModalBody>
            {selectedStyle && (
              <>
                <Box mb={3}>
                  <Text>
                    <strong>{t('common.style', 'Style')}:</strong> {selectedStyle.style}
                  </Text>
                </Box>
                <Box mb={4} borderWidth="1px" borderRadius="md" p={3} bg="gray.50">
                  <Text fontWeight="semibold" mb={2}>
                    {t('types.ui.currentImage', 'Current Image:')}
                  </Text>
                  <Flex justify="center">
                    <LazyLoadImage
                      src={
                        selectedStyle.styleVariants?.[0]?.image
                          ? `${api_url}/uploads/images/${selectedStyle.styleVariants[0].image}`
                          : '/default-image.png'
                      }
                      alt={selectedStyle.style}
                      style={{
                        maxWidth: '200px',
                        maxHeight: '200px',
                        objectFit: 'contain',
                        border: '1px solid #dee2e6',
                        borderRadius: '4px',
                      }}
                      placeholderSrc="/default-image.png"
                      effect="blur"
                      onError={(e) => handleImageError(e, selectedStyle)}
                    />
                  </Flex>
                </Box>

                <Box mb={3}>
                  <FormLabel htmlFor="imageUpload">
                    {t('styles.uploadNewImage', 'Upload New Image:')}
                  </FormLabel>
                  <Input
                    id="imageUpload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  <Text mt={2} color="gray.600" fontSize="sm">
                    {selectedFile
                      ? `${t('styles.selected', 'Selected')}: ${selectedFile.name}`
                      : selectedStyle.styleVariants?.[0]?.image
                        ? `${t('types.ui.current', 'Current')}: ${selectedStyle.styleVariants[0].image}`
                        : t('types.ui.noImage', 'No image uploaded')}
                  </Text>
                </Box>

                {selectedFile && (
                  <Box>
                    <Text fontWeight="semibold" mb={2}>
                      {t('styles.previewNewImage', 'New Image Preview:')}
                    </Text>
                    <Flex justify="center" borderWidth="1px" borderRadius="md" p={3} bg="gray.50">
                      <LazyLoadImage
                        src={URL.createObjectURL(selectedFile)}
                        alt="Preview"
                        style={{
                          maxWidth: '200px',
                          maxHeight: '200px',
                          objectFit: 'contain',
                          border: '1px solid #dee2e6',
                          borderRadius: '4px',
                        }}
                        placeholderSrc="/default-image.png"
                        effect="blur"
                      />
                    </Flex>
                  </Box>
                )}
              </>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              mr={3}
              onClick={() => {
                setEditModalVisible(false)
                setSelectedStyle(null)
                setSelectedFile(null)
              }}
            >
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              colorScheme="brand"
              onClick={handleImageUpload}
              isDisabled={!selectedFile || uploadingImage}
              leftIcon={<Upload size={16} />}
              isLoading={uploadingImage}
            >
              {t('types.ui.uploadImage', 'Upload Image')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  )
}

export default StylePicturesTab
