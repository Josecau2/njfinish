import StandardCard from '../../../../components/StandardCard'
import React, { useState, useEffect, useCallback } from 'react'
import { Alert, Badge, Box, Button, CardBody, CardHeader, Flex, FormLabel, HStack, Image, Input, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Spinner, Text, useColorModeValue } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { Upload, Pencil, Trash, Plus } from '@/icons-lucide'
import axiosInstance from '../../../../helpers/axiosInstance'
import { ICON_SIZE_MD, ICON_BOX_MD } from '../../../../constants/iconSizes'
import { getContrastColor } from '../../../../utils/colorUtils'

const StylePicturesTab = ({ manufacturer }) => {
  const { t } = useTranslation()
  const customization = useSelector((state) => state.customization) || {}
  const headerBgFallback = useColorModeValue('brand.500', 'brand.400')
  const resolvedHeaderBg = customization.headerBg && customization.headerBg.trim() ? customization.headerBg : headerBgFallback
  const headerTextColor = customization.headerFontColor || getContrastColor(resolvedHeaderBg)
  const api_url = import.meta.env.VITE_API_URL

  // Color mode values - ALL hooks must be declared at the top level
  const iconGray500 = useColorModeValue('gray.500', 'gray.400')
  const bgGray50 = useColorModeValue('gray.50', 'gray.800')
  const borderGray600 = useColorModeValue('gray.600', 'gray.400')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const cardHoverBorder = useColorModeValue('blue.300', 'blue.500')
  const inputBg = useColorModeValue('white', 'gray.700')
  const inputBorderColor = useColorModeValue('gray.300', 'gray.600')
  const inputPlaceholder = useColorModeValue('gray.500', 'gray.400')
  const textColor = useColorModeValue('gray.800', 'gray.100')
  const deleteTextColor = useColorModeValue('red.600', 'red.400')
  const modalBorderColor = useColorModeValue('gray.200', 'gray.600')

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
      <StandardCard>
        <CardBody textAlign="center" py={10}>
          <Spinner color="brand.500" />
          <Text mt={3}>{t('styles.loading', 'Loading style pictures...')}</Text>
        </CardBody>
      </StandardCard>
    )
  }

  if (error) {
    return (
      <StandardCard>
        <CardBody>
          <Alert status="error">{error}</Alert>
        </CardBody>
      </StandardCard>
    )
  }

  if (!manufacturer?.id) {
    return (
      <StandardCard>
        <CardBody>
          <Alert status="info">
            {t(
              'styles.selectManufacturerInfo',
              'Please select a manufacturer to view style pictures.',
            )}
          </Alert>
        </CardBody>
      </StandardCard>
    )
  }

  if (!stylesMeta || stylesMeta.length === 0) {
    return (
      <StandardCard>
        <CardBody>
          <Alert status="info">
            {t(
              'styles.noStylesInfo',
              'No styles with pictures found for this manufacturer. Upload style images in the catalog mapping section to see them here.',
            )}
          </Alert>
        </CardBody>
      </StandardCard>
    )
  }

  return (
    <Box>
      <StandardCard mb={4}>
        <CardHeader bg={resolvedHeaderBg} color={headerTextColor} borderTopRadius="lg">
          <Flex
            direction={{ base: 'column', md: 'row' }}
            gap={4}
            align={{ base: 'stretch', md: 'center' }}
            justify="space-between"
          >
            <Box flex="1">
              <HStack spacing={3} mb={2} flexWrap="wrap">
                <Text as="h5" fontWeight="semibold" fontSize="lg">
                  {t('styles.header', 'Style Pictures for {{name}}', { name: manufacturer.name })}
                </Text>
                <Badge colorScheme="whiteAlpha" variant="solid" fontSize="sm" px={3} py={1}>
                  {t('styles.count', '{{count}} Styles', { count: filteredStyles.length })}
                </Badge>
                {searchTerm && (
                  <Badge colorScheme="whiteAlpha" variant="outline" fontSize="xs" px={2} py={1}>
                    {t('styles.filtered', '(filtered from {{total}})', { total: stylesMeta.length })}
                  </Badge>
                )}
              </HStack>
              <Text fontSize="sm" opacity={0.9}>
                {t(
                  'styles.helperText',
                  'View all styles with their associated pictures. Images are used in quote creation to help customers visualize their selections.',
                )}
              </Text>
            </Box>
            <HStack spacing={3} align="center" flexWrap="wrap" w={{ base: 'full', md: 'auto' }}>
              <Input
                placeholder={t('styles.searchPlaceholder', 'Search styles...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                bg={inputBg}
                borderColor={inputBorderColor}
                _placeholder={{ color: inputPlaceholder }}
                maxW={{ base: '100%', md: '280px' }}
                size="md"
              />
              <Button
                leftIcon={<Plus size={ICON_SIZE_MD} />}
                colorScheme="brand"
                onClick={() => setCreateModal(true)}
                flexShrink={0}
                size="md"
                minH="44px"
              >
                {t('styles.create', 'Add Style')}
              </Button>
            </HStack>
          </Flex>
        </CardHeader>
      </StandardCard>

      <StandardCard>
        <CardBody p={{ base: 4, md: 6 }}>
          <Box
            as="div"
            display="grid !important"
            gridTemplateColumns={{
              base: 'repeat(2, 1fr)',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
              lg: 'repeat(4, 1fr)',
              xl: 'repeat(5, 1fr)',
            }}
            gap={{ base: 3, md: 4, lg: 5 }}
            w="100%"
            sx={{
              '& > *': {
                minWidth: 0,
              }
            }}
          >
            {filteredStyles.map((style, index) => (
              <Box
                key={style.id || index}
                display="flex"
                flexDirection="column"
                alignItems="center"
                w="full"
                minW={0}
              >
                {/* Image Container */}
                <Box
                  position="relative"
                  onMouseEnter={() => setHoveredId(style.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  cursor="pointer"
                  w="full"
                  mb={3}
                >
                  <Box
                    borderWidth="1px"
                    borderRadius="lg"
                    borderColor={borderColor}
                    bg={bgGray50}
                    p={4}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    aspectRatio="4/5"
                    overflow="hidden"
                    transition="all 0.2s ease"
                    _hover={{
                      borderColor: cardHoverBorder,
                      shadow: 'md',
                    }}
                  >
                    <Image
                      src={
                        style.styleVariants?.[0]?.image
                          ? `${api_url}/uploads/images/${style.styleVariants[0].image}`
                          : '/images/nologo.png'
                      }
                      alt={style.styleVariants?.[0]?.shortName || style.style}
                      maxW="100%"
                      maxH="100%"
                      h="auto"
                      w="auto"
                      objectFit="contain"
                      fallbackSrc="/images/nologo.png"
                      loading="lazy"
                      onError={(e) => handleImageError(e, style)}
                    />
                  </Box>

                  {/* Desktop: Overlay actions on hover */}
                  <Flex
                    display={{ base: 'none', md: 'flex' }}
                    position="absolute"
                    inset={0}
                    align="center"
                    justify="center"
                    bg="blackAlpha.700"
                    backdropFilter="blur(4px)"
                    color="white"
                    opacity={hoveredId === style.id ? 1 : 0}
                    transition="opacity 0.25s ease-in-out"
                    borderRadius="lg"
                    gap={2}
                    px={3}
                    py={2}
                    flexDirection="column"
                    zIndex={10}
                  >
                    <Button
                      variant="solid"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEditImage(style)
                      }}
                      leftIcon={<Pencil size={16} />}
                      colorScheme="blue"
                      w="full"
                      minH="40px"
                      fontSize="sm"
                      fontWeight="600"
                      boxShadow="lg"
                      _hover={{
                        transform: 'translateY(-1px)',
                        boxShadow: 'xl',
                      }}
                    >
                      {t('types.ui.uploadImage', 'Upload')}
                    </Button>
                    <Button
                      colorScheme="red"
                      variant="solid"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteAsk({ open: true, styleName: style.style })
                        setReassignTo('')
                      }}
                      leftIcon={<Trash size={16} />}
                      w="full"
                      minH="40px"
                      fontSize="sm"
                      fontWeight="600"
                      boxShadow="lg"
                      _hover={{
                        transform: 'translateY(-1px)',
                        boxShadow: 'xl',
                      }}
                    >
                      {t('common.delete', 'Delete')}
                    </Button>
                  </Flex>
                </Box>

                {/* Mobile: Action buttons below image */}
                <Flex
                  display={{ base: 'flex', md: 'none' }}
                  direction="column"
                  gap={2}
                  w="full"
                  mb={3}
                >
                  <Button
                    variant="solid"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEditImage(style)
                    }}
                    leftIcon={<Pencil size={16} />}
                    colorScheme="blue"
                    w="full"
                    minH="44px"
                    fontSize="sm"
                    fontWeight="600"
                  >
                    {t('types.ui.uploadImage', 'Upload')}
                  </Button>
                  <Button
                    colorScheme="red"
                    variant="solid"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeleteAsk({ open: true, styleName: style.style })
                      setReassignTo('')
                    }}
                    leftIcon={<Trash size={16} />}
                    w="full"
                    minH="44px"
                    fontSize="sm"
                    fontWeight="600"
                  >
                    {t('common.delete', 'Delete')}
                  </Button>
                </Flex>

                {/* Caption */}
                <Box textAlign="center" w="full">
                  <Text
                    fontSize="sm"
                    fontWeight="600"
                    noOfLines={2}
                    lineHeight="1.3"
                    mb={1}
                    title={style.styleVariants?.[0]?.shortName || style.style}
                    color={textColor}
                  >
                    {style.styleVariants?.[0]?.shortName || style.style}
                  </Text>
                  {style.styleVariants?.length > 0 && (
                    <Badge colorScheme="gray" fontSize="xs" variant="subtle">
                      {style.styleVariants.length} {t('styles.variants', 'variant', { count: style.styleVariants.length })}
                    </Badge>
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        </CardBody>
      </StandardCard>

      {/* Create Style Modal */}
      <Modal
        isOpen={createModal}
        onClose={() => setCreateModal(false)}
        size={{ base: 'full', md: 'lg' }}
        scrollBehavior="inside"
        isCentered
      >
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
        <ModalContent borderRadius={{ base: '0', md: '2xl' }} maxH={{ base: '100vh', md: '90vh' }}>
          <ModalHeader
            bg={resolvedHeaderBg}
            color={headerTextColor}
            borderTopRadius={{ base: '0', md: '2xl' }}
            py={4}
            px={6}
          >
            <Text fontSize="lg" fontWeight="semibold">
              {t('styles.createHeader', 'Add Style')}
            </Text>
          </ModalHeader>
          <ModalCloseButton
            aria-label={t('common.ariaLabels.closeModal', 'Close modal')}
            color={headerTextColor}
            top={4}
            right={4}
            minW="44px"
            minH="44px"
          />
          <ModalBody px={6} py={5}>
            <Flex direction="column" gap={4}>
              <Box>
                <FormLabel mb={2} fontWeight="600">
                  {t('styles.name', 'Style Name')}
                </FormLabel>
                <Input
                  value={createForm.name}
                  onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
                  size="lg"
                />
              </Box>
              <Box>
                <FormLabel mb={2} fontWeight="600">
                  {t('styles.short', 'Short Name')}
                </FormLabel>
                <Input
                  value={createForm.shortName}
                  onChange={(e) => setCreateForm((p) => ({ ...p, shortName: e.target.value }))}
                  size="lg"
                />
              </Box>
              <Box>
                <FormLabel mb={2} fontWeight="600">
                  {t('common.description', 'Description')}
                </FormLabel>
                <Input
                  value={createForm.description}
                  onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))}
                  size="lg"
                />
              </Box>
              <Box>
                <FormLabel mb={2} fontWeight="600">
                  {t('common.code', 'Code')}
                </FormLabel>
                <Input
                  value={createForm.code}
                  onChange={(e) => setCreateForm((p) => ({ ...p, code: e.target.value }))}
                  size="lg"
                />
              </Box>
              <Box>
                <FormLabel mb={2} fontWeight="600">
                  {t('common.image', 'Image')}
                </FormLabel>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setCreateForm((p) => ({ ...p, imageFile: e.target.files?.[0] || null }))
                  }
                  size="lg"
                  pt={2}
                />
              </Box>
            </Flex>
          </ModalBody>
          <ModalFooter
            gap={3}
            flexWrap="wrap"
            px={6}
            py={4}
            borderTop="1px"
            borderColor={modalBorderColor}
          >
            <Button
              variant="ghost"
              onClick={() => setCreateModal(false)}
              disabled={createBusy}
              flex={{ base: '1', md: '0 1 auto' }}
              minH="44px"
            >
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              colorScheme="brand"
              onClick={handleCreateStyle}
              isLoading={createBusy}
              flex={{ base: '1', md: '0 1 auto' }}
              minH="44px"
            >
              {t('common.save', 'Save')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        isOpen={deleteAsk.open}
        onClose={() => setDeleteAsk({ open: false, styleName: '' })}
        size={{ base: 'full', md: 'lg' }}
        scrollBehavior="inside"
        isCentered
      >
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
        <ModalContent borderRadius={{ base: '0', md: '2xl' }} maxH={{ base: '100vh', md: '90vh' }}>
          <ModalHeader
            bg={resolvedHeaderBg}
            color={headerTextColor}
            borderTopRadius={{ base: '0', md: '2xl' }}
            py={4}
            px={6}
          >
            <Text fontSize="lg" fontWeight="semibold">
              {t('styles.deleteHeader', 'Delete Style')}
            </Text>
          </ModalHeader>
          <ModalCloseButton
            aria-label={t('common.ariaLabels.closeModal', 'Close modal')}
            color={headerTextColor}
            top={4}
            right={4}
            minW="44px"
            minH="44px"
          />
          <ModalBody px={6} py={5}>
            <Text fontSize="md" mb={4}>
              {t('styles.deleteConfirm', 'Delete style')}{' '}
              <Text as="span" fontWeight="semibold" color={deleteTextColor}>
                {deleteAsk.styleName}
              </Text>?
            </Text>
            <Box>
              <FormLabel mb={2} fontWeight="600">
                {t('styles.reassign', 'Reassign items to (leave empty to clear)')}
              </FormLabel>
              <Input
                value={reassignTo}
                onChange={(e) => setReassignTo(e.target.value)}
                placeholder={t('styles.reassignPh', 'New style name or blank')}
                size="lg"
              />
            </Box>
          </ModalBody>
          <ModalFooter
            gap={3}
            flexWrap="wrap"
            px={6}
            py={4}
            borderTop="1px"
            borderColor={modalBorderColor}
          >
            <Button
              variant="ghost"
              onClick={() => setDeleteAsk({ open: false, styleName: '' })}
              flex={{ base: '1', md: '0 1 auto' }}
              minH="44px"
            >
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              colorScheme="red"
              onClick={handleDeleteStyle}
              flex={{ base: '1', md: '0 1 auto' }}
              minH="44px"
            >
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
        size={{ base: 'full', md: 'xl' }}
        scrollBehavior="inside"
        isCentered
      >
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
        <ModalContent borderRadius={{ base: '0', md: '2xl' }} maxH={{ base: '100vh', md: '90vh' }}>
          <ModalHeader
            bg={resolvedHeaderBg}
            color={headerTextColor}
            borderTopRadius={{ base: '0', md: '2xl' }}
            py={4}
            px={6}
          >
            <Text fontSize="lg" fontWeight="semibold">
              {t('styles.editImage', 'Edit Style Image')}
            </Text>
          </ModalHeader>
          <ModalCloseButton
            aria-label={t('common.ariaLabels.closeModal', 'Close modal')}
            color={headerTextColor}
            top={4}
            right={4}
            minW="44px"
            minH="44px"
          />
          <ModalBody px={6} py={5}>
            {selectedStyle && (
              <Flex direction="column" gap={5}>
                <Box>
                  <Text fontSize="md">
                    <Text as="span" fontWeight="semibold">{t('common.style', 'Style')}:</Text>{' '}
                    {selectedStyle.style}
                  </Text>
                </Box>

                <Box>
                  <Text fontWeight="semibold" mb={3} fontSize="md">
                    {t('types.ui.currentImage', 'Current Image')}
                  </Text>
                  <Box
                    borderWidth="1px"
                    borderRadius="lg"
                    borderColor={borderColor}
                    p={6}
                    bg={bgGray50}
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    minH="240px"
                  >
                    <Image
                      src={
                        selectedStyle.styleVariants?.[0]?.image
                          ? `${api_url}/uploads/images/${selectedStyle.styleVariants[0].image}`
                          : '/default-image.png'
                      }
                      alt={selectedStyle.style}
                      maxW="100%"
                      maxH="240px"
                      objectFit="contain"
                      fallbackSrc="/default-image.png"
                      loading="lazy"
                      onError={(e) => handleImageError(e, selectedStyle)}
                    />
                  </Box>
                </Box>

                <Box>
                  <FormLabel mb={2} fontWeight="600">
                    {t('styles.uploadNewImage', 'Upload New Image')}
                  </FormLabel>
                  <Input
                    id="imageUpload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    size="lg"
                    pt={2}
                  />
                  <Text mt={2} color={borderGray600} fontSize="sm">
                    {selectedFile
                      ? `${t('styles.selected', 'Selected')}: ${selectedFile.name}`
                      : selectedStyle.styleVariants?.[0]?.image
                        ? `${t('types.ui.current', 'Current')}: ${selectedStyle.styleVariants[0].image}`
                        : t('types.ui.noImage', 'No image uploaded')}
                  </Text>
                </Box>

                {selectedFile && (
                  <Box>
                    <Text fontWeight="semibold" mb={3} fontSize="md">
                      {t('styles.previewNewImage', 'New Image Preview')}
                    </Text>
                    <Box
                      borderWidth="1px"
                      borderRadius="lg"
                      borderColor={borderColor}
                      p={6}
                      bg={bgGray50}
                      display="flex"
                      justifyContent="center"
                      alignItems="center"
                      minH="240px"
                    >
                      <Image
                        src={URL.createObjectURL(selectedFile)}
                        alt="Preview"
                        maxW="100%"
                        maxH="240px"
                        objectFit="contain"
                        fallbackSrc="/default-image.png"
                        loading="lazy"
                      />
                    </Box>
                  </Box>
                )}
              </Flex>
            )}
          </ModalBody>
          <ModalFooter
            gap={3}
            flexWrap="wrap"
            px={6}
            py={4}
            borderTop="1px"
            borderColor={modalBorderColor}
          >
            <Button
              variant="ghost"
              onClick={() => {
                setEditModalVisible(false)
                setSelectedStyle(null)
                setSelectedFile(null)
              }}
              flex={{ base: '1', md: '0 1 auto' }}
              minH="44px"
            >
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              colorScheme="brand"
              onClick={handleImageUpload}
              isDisabled={!selectedFile || uploadingImage}
              leftIcon={<Upload size={ICON_SIZE_MD} />}
              isLoading={uploadingImage}
              flex={{ base: '1', md: '0 1 auto' }}
              minH="44px"
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
