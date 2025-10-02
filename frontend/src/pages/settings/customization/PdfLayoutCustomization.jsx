import StandardCard from '../../../components/StandardCard'
import React, { useState, useEffect, useRef } from 'react'
import { Container, Stack, Box, SimpleGrid, HStack, VStack, Text, Button, Icon, Badge, Table, Thead, Tbody, Tr, Th, Td, TableContainer, Spinner, Center, Alert, AlertIcon, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton, Textarea, Input, Image, FormControl, FormLabel } from '@chakra-ui/react'
import axiosInstance from '../../../helpers/axiosInstance'
import { FileText, Settings, Image as ImageIcon, Save, Trash, Globe, Building } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import PageHeader from '../../../components/PageHeader'

const PdfLayoutCustomization = () => {
  const api_url = import.meta.env.VITE_API_URL
  const { t } = useTranslation()
  const customization = useSelector((state) => state.customization)
  const fileInputRef = useRef(null)

  const getContrastColor = (backgroundColor) => {
    if (!backgroundColor) return "white"
    const hex = backgroundColor.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000
    return brightness > 128 ? "black" : "white"
  }

  const headerBgColor = customization?.headerBg || "purple.500"
  const textColor = getContrastColor(headerBgColor)

  const [formData, setFormData] = useState({
    pdfHeader: '',
    pdfFooter: '',
    headerBgColor: "black",
    logo: null,
    logoPreview: null,
    previousBlobUrl: null,
    companyName: '',
    companyPhone: '',
    companyEmail: '',
    companyWebsite: '',
    companyAddress: '',
    headerTxtColor: "white",
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [previewOpen, setPreviewOpen] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  useEffect(() => {
    fetchCustomization()
  }, [])

  useEffect(() => {
    return () => {
      if (formData.previousBlobUrl) {
        URL.revokeObjectURL(formData.previousBlobUrl)
      }
    }
  }, [formData.previousBlobUrl])

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
        headerTxtColor,
      } = res.data || {}

      setFormData((prev) => ({
        ...prev,
        pdfHeader: pdfHeader || '',
        pdfFooter: pdfFooter || '',
        headerBgColor: headerBgColor || "black",
        logoPreview: headerLogo || null,
        companyName: companyName || '',
        companyPhone: companyPhone || '',
        companyEmail: companyEmail || '',
        companyWebsite: companyWebsite || '',
        companyAddress: companyAddress || '',
        headerTxtColor: headerTxtColor || "white",
        logo: null,
      }))
    } catch (err) {
      console.error('Failed to load customization:', err)
      setMessage({ type: 'danger', text: t('settings.customization.pdf.alerts.loadFailed') })
    }
  }

  const clearMessage = () => setMessage({ type: '', text: '' })

  const handleChange = (e) => {
    const { name, value } = e.target
    clearMessage()
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const getLogoUrl = (logoPreview) => {
    if (!logoPreview) return null
    if (logoPreview.startsWith('blob:')) {
      return logoPreview
    }
    const baseUrl = api_url || (typeof window !== 'undefined' ? window.location.origin : '')
    const cleanPath = logoPreview.startsWith('/') ? logoPreview : `/${logoPreview}`
    return `${baseUrl}${cleanPath}`
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
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
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'warning', text: t('settings.customization.pdf.alerts.imageType') })
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'warning', text: t('settings.customization.pdf.alerts.fileTooLarge') })
      return
    }

    clearMessage()

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
    const file = e.target.files?.[0]
    if (file) {
      handleFileValidation(file)
    }
  }

  const removeLogo = () => {
    if (formData.previousBlobUrl) {
      URL.revokeObjectURL(formData.previousBlobUrl)
    }
    setFormData((prev) => ({
      ...prev,
      logo: null,
      logoPreview: null,
      previousBlobUrl: null,
    }))
  }

  const triggerLogoUpload = () => {
    fileInputRef.current?.click()
  }

  const handleLogoKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      triggerLogoUpload()
    }
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      clearMessage()

      if (!formData.companyName.trim()) {
        setMessage({
          type: 'warning',
          text: t('settings.customization.pdf.validation.companyNameRequired'),
        })
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
          setMessage({ type: 'danger', text: t('settings.customization.pdf.alerts.fileTooLarge') })
          return
        }
        formPayload.append('logo', formData.logo)
      }

      await axiosInstance.post('/api/settings/customization/pdf', formPayload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      setMessage({ type: 'success', text: t('settings.customization.pdf.alerts.saveSuccess') })
      await fetchCustomization()
    } catch (err) {
      console.error('Failed to save:', err)
      if (err.response?.status === 413) {
        setMessage({ type: 'danger', text: t('settings.customization.pdf.alerts.fileTooLarge') })
      } else if (err.response?.status === 400) {
        setMessage({
          type: 'danger',
          text: err.response.data?.message || t('settings.customization.pdf.alerts.invalidData'),
        })
      } else if (err.response?.status === 500) {
        setMessage({ type: 'danger', text: t('settings.customization.pdf.alerts.serverError') })
      } else {
        setMessage({
          type: 'danger',
          text: t('settings.customization.pdf.alerts.saveFailedGeneric'),
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const alertStatusMap = {
    danger: 'error',
    warning: 'warning',
    success: 'success',
    info: 'info',
  }

  const previewActions = [
    <Button
      key="preview"
      variant="outline"
      colorScheme="brand"
      leftIcon={<Icon as={Globe} boxSize={4} />}
      onClick={() => setPreviewOpen(true)}
      isDisabled={loading}
    >
      {t('settings.customization.pdf.buttons.preview')}
    </Button>,
    <Button
      key="save"
      colorScheme="brand"
      leftIcon={<Icon as={Save} boxSize={4} />}
      onClick={handleSave}
      isLoading={loading}
    >
      {loading
        ? t('settings.customization.pdf.buttons.saving')
        : t('settings.customization.pdf.buttons.saveChanges')}
    </Button>,
  ]

  const PreviewContent = () => (
    <Box
      bg="white"
      borderRadius="2xl"
      overflow="hidden"
      boxShadow="0 10px 40px rgba(0,0,0,0.1)"
      fontFamily="'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    >
      <Box
        bg={formData.headerBgColor}
        color={formData.headerTxtColor}
        p={8}
        display="flex"
        justifyContent="space-between"
        alignItems="flex-start"
        minH="120px"
      >
        <Box>
          {formData.logoPreview ? (
            <Image
              src={getLogoUrl(formData.logoPreview)}
              alt="Company Logo"
              maxH="80px"
              maxW="200px"
              objectFit="contain"
              bg="rgba(255,255,255,0.1)"
              p={2}
              borderRadius="md"
            />
          ) : (
            <Text fontSize="2xl" fontWeight="bold">
              {formData.pdfHeader || t('common.appName')}
            </Text>
          )}
        </Box>
        <Box textAlign="right" fontSize="sm">
          {formData.companyName && <Text>{formData.companyName}</Text>}
          {formData.companyPhone && <Text>{formData.companyPhone}</Text>}
          {formData.companyEmail && <Text>{formData.companyEmail}</Text>}
          {formData.companyWebsite && <Text>{formData.companyWebsite}</Text>}
          {formData.companyAddress && (
            <Text whiteSpace="pre-line" fontStyle="italic">
              {formData.companyAddress}
            </Text>
          )}
        </Box>
      </Box>

      <Box px={8} py={6}>
        {formData.pdfHeader && (
          <Text fontSize="xl" fontWeight="semibold" mb={4} color="gray.700">
            {formData.pdfHeader}
          </Text>
        )}

        <Box overflowX="auto" borderWidth="1px" borderColor="gray.200" borderRadius="lg" mb={6}>
          <Table variant="simple" size="sm">
            <Thead bg="gray.50">
              <Tr>
                <Th>#</Th>
                <Th>{t('common.qty')}</Th>
                <Th>{t('common.item')}</Th>
                <Th>{t('proposalDoc.itemColumns.assembled')}</Th>
                <Th>{t('proposalDoc.itemColumns.hingeSide')}</Th>
                <Th>{t('proposalDoc.itemColumns.exposedSide')}</Th>
                <Th isNumeric>{t('proposalDoc.itemColumns.price')}</Th>
                <Th isNumeric>{t('proposalDoc.itemColumns.assemblyFee')}</Th>
                <Th isNumeric>{t('common.total')}</Th>
              </Tr>
            </Thead>
            <Tbody>
              <Tr>
                <Td>1.</Td>
                <Td>2</Td>
                <Td>B3021 Base Cabinet</Td>
                <Td>{t('common.yes')}</Td>
                <Td>L</Td>
                <Td>R</Td>
                <Td isNumeric>$95.20</Td>
                <Td isNumeric>$12.00</Td>
                <Td isNumeric>$214.40</Td>
              </Tr>
              <Tr>
                <Td>2.</Td>
                <Td>1</Td>
                <Td>W3012</Td>
                <Td>{t('common.yes')}</Td>
                <Td>-</Td>
                <Td>-</Td>
                <Td isNumeric>$88.20</Td>
                <Td isNumeric>$0.00</Td>
                <Td isNumeric>$88.20</Td>
              </Tr>
              <Tr>
                <Td>3.</Td>
                <Td>3</Td>
                <Td>W2436</Td>
                <Td>{t('common.yes')}</Td>
                <Td>-</Td>
                <Td>-</Td>
                <Td isNumeric>$144.90</Td>
                <Td isNumeric>$0.00</Td>
                <Td isNumeric>$434.70</Td>
              </Tr>
              <Tr>
                <Td colSpan={9} fontStyle="italic">
                  {t('proposalDoc.modifications')}
                </Td>
              </Tr>
              <Tr>
                <Td>-</Td>
                <Td>1</Td>
                <Td>SPEC BOOK</Td>
                <Td></Td>
                <Td></Td>
                <Td></Td>
                <Td isNumeric>$31.00</Td>
                <Td></Td>
                <Td isNumeric>$31.00</Td>
              </Tr>
            </Tbody>
          </Table>
        </Box>

        <Box
          bg="gray.50"
          borderRadius="lg"
          borderWidth="1px"
          borderColor="gray.200"
          p={6}
          mb={6}
        >
          {[
            { label: t('proposalDoc.priceSummary.cabinets'), value: '$2,151.00' },
            { label: t('proposalDoc.priceSummary.assembly'), value: '$58.10' },
            { label: t('proposalDoc.priceSummary.modifications'), value: '$279.00' },
            { label: t('proposalDoc.priceSummary.styleTotal'), value: '$2,488.10', isEmphasis: true },
            { label: t('proposalDoc.priceSummary.total'), value: '$2,669.00' },
            { label: t('proposalDoc.priceSummary.tax'), value: '$26.69' },
            { label: t('proposalDoc.priceSummary.grandTotal'), value: '$2,695.69', isTotal: true },
          ].map(({ label, value, isEmphasis, isTotal }) => (
            <HStack
              key={label}
              justify="space-between"
              fontWeight={isTotal ? 'bold' : 'normal'}
              fontSize={isTotal ? 'lg' : 'md'}
              borderTopWidth={isEmphasis || isTotal ? '1px' : '0'}
              borderColor="gray.200"
              pt={isEmphasis || isTotal ? 3 : 0}
              pb={2}
            >
              <Text fontWeight={isEmphasis || isTotal ? 'semibold' : 'normal'}>{label}</Text>
              <Text>{value}</Text>
            </HStack>
          ))}
        </Box>

        {formData.pdfFooter && (
          <Box
            bg="gray.50"
            borderRadius="lg"
            borderWidth="1px"
            borderColor="gray.200"
            p={6}
            color="gray.600"
            fontSize="sm"
            whiteSpace="pre-line"
          >
            {formData.pdfFooter}
          </Box>
        )}
      </Box>
    </Box>
  )

  return (
    <Container maxW="7xl" py={6}>
      <Stack spacing={6}>
        <PageHeader
          title={t('settings.customization.pdf.headerTitle')}
          subtitle={t('settings.customization.pdf.headerSubtitle')}
          icon={FileText}
          actions={previewActions}
        />

        {message.text && (
          <Alert status={alertStatusMap[message.type] ?? 'info'} borderRadius="md">
            <AlertIcon />
            {message.text}
          </Alert>
        )}

        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
          <StandardCard variant="outline">
            <CardHeader bg="gray.50" borderBottomWidth="1px">
              <HStack spacing={4} align="center">
                <Box
                  bg="brand.500"
                  color="white"
                  boxSize={9}
                  borderRadius="md"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Icon as={FileText} boxSize={4} />
                </Box>
                <VStack align="flex-start" spacing={0}>
                  <Text fontWeight="semibold" color="gray.800">
                    {t('settings.customization.pdf.sections.headerFooter.title')}
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    {t('settings.customization.pdf.sections.headerFooter.subtitle')}
                  </Text>
                </VStack>
              </HStack>
            </CardHeader>
            <CardBody>
              <Stack spacing={4}>
                <FormControl>
                  <FormLabel>
                    {t('settings.customization.pdf.labels.headerText')}
                  </FormLabel>
                  <Input
                    name="pdfHeader"
                    value={formData.pdfHeader}
                    onChange={handleChange}
                    placeholder={t('settings.customization.pdf.placeholders.headerText')}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>
                    {t('settings.customization.pdf.labels.footerTerms')}
                  </FormLabel>
                  <Textarea
                    name="pdfFooter"
                    value={formData.pdfFooter}
                    onChange={handleChange}
                    rows={4}
                    placeholder={t('settings.customization.pdf.placeholders.footerTerms')}
                  />
                </FormControl>

                <Box>
                  <HStack spacing={4} mb={3}>
                    <Badge colorScheme="blue" textTransform="uppercase" fontSize="xs" borderRadius="sm">
                      {t('settings.customization.pdf.badges.colors')}
                    </Badge>
                    <Text fontWeight="semibold" color="gray.700">
                      {t('settings.customization.pdf.labels.headerColors')}
                    </Text>
                  </HStack>
                  <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
                    <FormControl>
                      <FormLabel fontSize="sm" color="gray.600">
                        {t('settings.customization.pdf.labels.backgroundColor')}
                      </FormLabel>
                      <HStack spacing={4}>
                        <Input
                          type="color"
                          name="headerBgColor"
                          value={formData.headerBgColor}
                          onChange={handleChange}
                          w={12}
                          h={12}
                          p={0}
                        />
                        <Badge fontFamily="mono" px={3} py={2} borderRadius="md" bg="gray.50" borderWidth="1px">
                          {formData.headerBgColor}
                        </Badge>
                      </HStack>
                    </FormControl>
                    <FormControl>
                      <FormLabel fontSize="sm" color="gray.600">
                        {t('settings.customization.pdf.labels.textColor')}
                      </FormLabel>
                      <HStack spacing={4}>
                        <Input
                          type="color"
                          name="headerTxtColor"
                          value={formData.headerTxtColor}
                          onChange={handleChange}
                          w={12}
                          h={12}
                          p={0}
                        />
                        <Badge fontFamily="mono" px={3} py={2} borderRadius="md" bg="gray.50" borderWidth="1px">
                          {formData.headerTxtColor}
                        </Badge>
                      </HStack>
                    </FormControl>
                  </SimpleGrid>
                </Box>
              </Stack>
            </CardBody>
          </StandardCard>

          <StandardCard variant="outline">
            <CardHeader bg="gray.50" borderBottomWidth="1px">
              <HStack spacing={4} align="center">
                <Box
                  bg="brand.500"
                  color="white"
                  boxSize={9}
                  borderRadius="md"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Icon as={Building} boxSize={4} />
                </Box>
                <VStack align="flex-start" spacing={0}>
                  <Text fontWeight="semibold" color="gray.800">
                    {t('settings.customization.pdf.sections.companyInfo.title')}
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    {t('settings.customization.pdf.sections.companyInfo.subtitle')}
                  </Text>
                </VStack>
              </HStack>
            </CardHeader>
            <CardBody>
              <Stack spacing={4}>
                <Box>
                  <FormLabel>
                    {t('settings.customization.pdf.labels.companyLogo')}
                  </FormLabel>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    style={{ display: 'none' }}
                  />
                  <Box
                    borderWidth="2px"
                    borderStyle="dashed"
                    borderColor={dragActive ? 'brand.500' : 'gray.200'}
                    borderRadius="md"
                    bg={dragActive ? 'brand.50' : 'gray.50'}
                    p={6}
                    textAlign="center"
                    transition="all 0.2s ease"
                    cursor="pointer"
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={triggerLogoUpload}
                    onKeyDown={handleLogoKeyDown}
                    role="button"
                    tabIndex={0}
                  >
                    <VStack spacing={4} color="gray.600">
                      <Icon as={ImageIcon} boxSize={6} />
                      <Text>
                        {dragActive
                          ? t('settings.customization.pdf.dropHere')
                          : t('settings.customization.pdf.chooseLogo')}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        {t('settings.customization.pdf.supportedTypes')}
                      </Text>
                    </VStack>
                  </Box>
                </Box>

                {formData.logoPreview && (
                  <Box>
                    <FormLabel>
                      {t('settings.customization.pdf.labels.logoPreview')}
                    </FormLabel>
                    <HStack
                      spacing={4}
                      bg="gray.50"
                      borderRadius="md"
                      borderWidth="1px"
                      borderColor="gray.200"
                      p={3}
                      align="center"
                    >
                      <Image
                        src={getLogoUrl(formData.logoPreview)}
                        alt={t('settings.customization.pdf.labels.logoPreview')}
                        h={10}
                        objectFit="contain"
                        borderRadius="md"
                        boxShadow="sm"
                        bg="white"
                        p={1}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        colorScheme="red"
                        onClick={removeLogo}
                        isDisabled={loading}
                      >
                        {loading ? <Spinner size="sm" /> : <Icon as={Trash} boxSize={4} />}
                      </Button>
                    </HStack>
                  </Box>
                )}

                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>
                      {t('settings.customization.pdf.labels.companyName')}
                    </FormLabel>
                    <Input
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      placeholder={t('settings.customization.pdf.placeholders.companyName')}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>
                      {t('settings.customization.pdf.labels.phoneNumber')}
                    </FormLabel>
                    <Input
                      name="companyPhone"
                      value={formData.companyPhone}
                      onChange={handleChange}
                      placeholder={t('settings.customization.pdf.placeholders.phoneNumber')}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>
                      {t('settings.customization.pdf.labels.email')}
                    </FormLabel>
                    <Input
                      name="companyEmail"
                      type="email"
                      value={formData.companyEmail}
                      onChange={handleChange}
                      placeholder={t('settings.customization.pdf.placeholders.email')}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>
                      {t('settings.customization.pdf.labels.website')}
                    </FormLabel>
                    <Input
                      name="companyWebsite"
                      value={formData.companyWebsite}
                      onChange={handleChange}
                      placeholder={t('settings.customization.pdf.placeholders.website')}
                    />
                  </FormControl>
                </SimpleGrid>

                <FormControl>
                  <FormLabel>
                    {t('settings.customization.pdf.labels.address')}
                  </FormLabel>
                  <Textarea
                    name="companyAddress"
                    value={formData.companyAddress}
                    onChange={handleChange}
                    rows={3}
                    placeholder={t('settings.customization.pdf.placeholders.address')}
                  />
                </FormControl>
              </Stack>
            </CardBody>
          </StandardCard>
        </SimpleGrid>
      </Stack>

      <Modal isOpen={previewOpen} onClose={() => setPreviewOpen(false)} size="6xl">
        <ModalOverlay />
        <ModalContent maxH="90vh" overflow="hidden">
          <ModalHeader bg={formData.headerBgColor} color={getContrastColor(formData.headerBgColor)}>
            <HStack spacing={4} align="center">
              <Icon as={Settings} />
              <Text>{t('settings.customization.pdf.preview.title')}</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton color={getContrastColor(formData.headerBgColor)} />
          <ModalBody bg="gray.50" p={8}>
            <PreviewContent />
          </ModalBody>
          <ModalFooter>
            <Button onClick={() => setPreviewOpen(false)}>{t('common.close', 'Close')}</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  )
}

export default PdfLayoutCustomization
