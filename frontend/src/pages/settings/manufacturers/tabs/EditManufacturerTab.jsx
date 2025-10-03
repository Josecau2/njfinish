import StandardCard from '../../../../components/StandardCard'
import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { getContrastColor } from '../../../../utils/colorUtils'
import { Alert, AlertIcon, Box, Button, CardBody, CardHeader, Checkbox, Container, FormControl, FormHelperText, FormLabel, HStack, Input, Radio, RadioGroup, SimpleGrid, Stack, Switch, Text, Textarea, VStack, useColorModeValue } from '@chakra-ui/react'
import PageContainer from '../../../../components/PageContainer'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import axiosInstance from '../../../../helpers/axiosInstance'
import { fetchManufacturerById } from '../../../../store/slices/manufacturersSlice'

const alertStatusMap = {
  success: 'success',
  danger: 'error',
  warning: 'warning',
  info: 'info',
}

const EditManufacturerTab = ({ manufacturer, id }) => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const customization = useSelector((state) => state.customization)

  const headerBg = customization.headerBg || "purple.500"
  const textColor = getContrastColor(headerBg)

  // Dark mode colors
  const helperTextColor = useColorModeValue("gray.500", "gray.400")
  const cardHeaderBg = useColorModeValue("gray.50", "gray.800")

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    isPriceMSRP: true,
    costMultiplier: '',
    instructions: '',
    assembledEtaDays: '',
    unassembledEtaDays: '',
    deliveryFee: '',
    orderEmailSubject: '',
    orderEmailTemplate: '',
    orderEmailMode: 'pdf',
    autoEmailOnAccept: true,
  })
  const [files, setFiles] = useState([])
  const [logoImage, setLogoImage] = useState(null)
  const [message, setMessage] = useState({ text: '', type: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (manufacturer) {
      setFormData({
        name: manufacturer.name || '',
        email: manufacturer.email || '',
        phone: manufacturer.phone || '',
        address: manufacturer.address || '',
        website: manufacturer.website || '',
        isPriceMSRP: manufacturer.isPriceMSRP ?? true,
        costMultiplier: manufacturer.costMultiplier || '',
        instructions: manufacturer.instructions || '',
        assembledEtaDays: manufacturer.assembledEtaDays || '',
        unassembledEtaDays: manufacturer.unassembledEtaDays || '',
        deliveryFee: manufacturer.deliveryFee || '',
        orderEmailSubject: manufacturer.orderEmailSubject || '',
        orderEmailTemplate: manufacturer.orderEmailTemplate || '',
        orderEmailMode: manufacturer.orderEmailMode || 'pdf',
        autoEmailOnAccept: manufacturer.autoEmailOnAccept ?? true,
      })
    }
  }, [manufacturer])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleFileChange = (e) => setFiles(Array.from(e.target.files ?? []))

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0] || null
    setLogoImage(file)
  }

  const handlePriceTypeChange = useCallback(
    (value) => {
      setFormData((prev) => ({ ...prev, isPriceMSRP: value === 'msrp' }))
    },
    [],
  )

  const calculateMultiplierExample = () => {
    if (!formData.costMultiplier) return null
    const msrp = 200.0
    const cost = 100.0
    const multiplier = parseFloat(formData.costMultiplier)
    if (Number.isNaN(multiplier)) return null
    return (
      <FormHelperText color={helperTextColor}>
        {t('settings.manufacturers.example.multiplier', {
          msrp: msrp.toFixed(2),
          cost: cost.toFixed(2),
          multiplier: multiplier.toFixed(1),
        })}
      </FormHelperText>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const formDataToSend = new FormData()
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value ?? '')
      })

      if (logoImage) formDataToSend.append('manufacturerImage', logoImage)
      files.forEach((file) => formDataToSend.append('catalogFiles', file))

      const response = await axiosInstance.put(`/api/manufacturers/${id}/update`, formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      window.scrollTo({ top: 0, behavior: 'smooth' })

      if (response.data.status === 200) {
        setMessage({ text: t('settings.manufacturers.edit.updated'), type: 'success' })
        dispatch(fetchManufacturerById({ id, includeCatalog: false }))
        setTimeout(() => navigate('/settings/manufacturers'), 2000)
      } else {
        setMessage({
          text: response.data.message || t('settings.manufacturers.edit.updateFailed'),
          type: 'danger',
        })
      }
    } catch (error) {
      setMessage({
        text: `Error: ${error.response?.data?.message || t('settings.manufacturers.edit.updateFailed')}`,
        type: 'danger',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageContainer>
      <Stack spacing={6}>
        {message.text && (
          <Alert status={alertStatusMap[message.type] ?? 'info'} borderRadius="md">
            <AlertIcon />
            <Text>{message.text}</Text>
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Stack spacing={6}>
            <StandardCard variant="outline">
              <CardHeader fontWeight="semibold" bg={cardHeaderBg} borderBottomWidth="1px">
                {t('settings.manufacturers.edit.basicInfo', 'Basic Information')}
              </CardHeader>
              <CardBody>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <FormControl isRequired>
                    <FormLabel htmlFor="name">{t('settings.manufacturers.fields.name')}</FormLabel>
                    <Input id="name" name="name" value={formData.name} onChange={handleChange} />
                  </FormControl>
                  <FormControl>
                    <FormLabel htmlFor="email">{t('settings.manufacturers.fields.email')}</FormLabel>
                    <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} />
                  </FormControl>
                  <FormControl>
                    <FormLabel htmlFor="phone">{t('settings.manufacturers.fields.phone')}</FormLabel>
                    <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} />
                  </FormControl>
                  <FormControl>
                    <FormLabel htmlFor="website">{t('settings.manufacturers.fields.website')}</FormLabel>
                    <Input id="website" name="website" value={formData.website} onChange={handleChange} />
                  </FormControl>
                </SimpleGrid>
                <FormControl mt={4}>
                  <FormLabel htmlFor="address">{t('settings.manufacturers.fields.address')}</FormLabel>
                  <Textarea id="address" name="address" rows={3} value={formData.address} onChange={handleChange} />
                </FormControl>
              </CardBody>
            </StandardCard>

            <StandardCard variant="outline">
              <CardHeader fontWeight="semibold" bg={cardHeaderBg} borderBottomWidth="1px">
                {t('settings.manufacturers.edit.emailSettings', 'Manufacturer Email Settings')}
              </CardHeader>
              <CardBody>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={4}>
                  <FormControl>
                    <FormLabel htmlFor="orderEmailSubject">
                      {t('settings.manufacturers.edit.emailSubject', 'Email subject')}
                    </FormLabel>
                    <Input
                      id="orderEmailSubject"
                      name="orderEmailSubject"
                      value={formData.orderEmailSubject}
                      onChange={handleChange}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>{t('settings.manufacturers.edit.sendMode', 'Send mode')}</FormLabel>
                    <RadioGroup
                      value={formData.orderEmailMode}
                      onChange={(value) => setFormData((prev) => ({ ...prev, orderEmailMode: value }))}
                    >
                      <HStack spacing={4} align="flex-start">
                        <Radio value="pdf">{t('settings.manufacturers.edit.mode.pdf', 'PDF only')}</Radio>
                        <Radio value="plain">{t('settings.manufacturers.edit.mode.plain', 'Plain text')}</Radio>
                        <Radio value="both">{t('settings.manufacturers.edit.mode.both', 'Both')}</Radio>
                      </HStack>
                    </RadioGroup>
                  </FormControl>
                </SimpleGrid>

                <FormControl mb={4}>
                  <FormLabel htmlFor="orderEmailTemplate">
                    {t('settings.manufacturers.edit.emailTemplate', 'Manufacturer email template (no prices)')}
                  </FormLabel>
                  <Textarea
                    id="orderEmailTemplate"
                    name="orderEmailTemplate"
                    rows={6}
                    value={formData.orderEmailTemplate}
                    onChange={handleChange}
                    placeholder="Dear Manufacturer, Please find the attached order PDF..."
                  />
                  <FormHelperText>
                    {t('settings.manufacturers.edit.emailTemplateHelp', 'Simple HTML is allowed. Prices are not included.')}
                  </FormHelperText>
                </FormControl>

                <FormControl display="flex" alignItems="center" gap={4}>
                  <Switch
                    id="autoEmailOnAccept"
                    name="autoEmailOnAccept"
                    isChecked={!!formData.autoEmailOnAccept}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, autoEmailOnAccept: e.target.checked }))
                    }
                  />
                  <FormLabel htmlFor="autoEmailOnAccept" mb={0}>
                    {t('settings.manufacturers.edit.autoEmail', 'Automatically email manufacturer on acceptance')}
                  </FormLabel>
                </FormControl>
              </CardBody>
            </StandardCard>

            <StandardCard variant="outline">
              <CardHeader fontWeight="semibold" bg={cardHeaderBg} borderBottomWidth="1px">
                {t('settings.manufacturers.edit.pricing', 'Pricing & Delivery')}
              </CardHeader>
              <CardBody>
                <FormControl as="fieldset" mb={4}>
                  <FormLabel as="legend">
                    {t('settings.manufacturers.edit.priceInfo', 'Price information')}
                  </FormLabel>
                  <RadioGroup
                    value={formData.isPriceMSRP ? 'msrp' : 'cost'}
                    onChange={handlePriceTypeChange}
                  >
                    <Stack direction={{ base: 'column', md: 'row' }} spacing={4} align="flex-start">
                      <Radio value="msrp">
                        {t('settings.manufacturers.fields.msrpOption', 'Use MSRP pricing')}
                      </Radio>
                      <Radio value="cost">
                        {t('settings.manufacturers.fields.costOption', 'Use cost pricing')}
                      </Radio>
                    </Stack>
                  </RadioGroup>
                </FormControl>

                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <FormControl isRequired>
                    <FormLabel htmlFor="costMultiplier">
                      {t('settings.manufacturers.edit.costMultiplier')}
                    </FormLabel>
                    <Input
                      id="costMultiplier"
                      name="costMultiplier"
                      type="number"
                      step="0.1"
                      inputMode="decimal"
                      value={formData.costMultiplier}
                      onChange={handleChange}
                    />
                    {calculateMultiplierExample()}
                  </FormControl>
                  <FormControl>
                    <FormLabel htmlFor="deliveryFee">
                      {t('settings.manufacturers.edit.deliveryFee')}
                    </FormLabel>
                    <Input
                      id="deliveryFee"
                      name="deliveryFee"
                      type="number"
                      step="0.01"
                      min="0"
                      inputMode="decimal"
                      value={formData.deliveryFee}
                      onChange={handleChange}
                    />
                    <FormHelperText>
                      {t('settings.manufacturers.edit.deliveryFeeHelp', 'Optional delivery fee charged to customers.')}
                    </FormHelperText>
                  </FormControl>
                </SimpleGrid>

                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mt={4}>
                  <FormControl>
                    <FormLabel htmlFor="assembledEtaDays">
                      {t('settings.manufacturers.edit.assembledEta', 'Assembled ETA (days)')}
                    </FormLabel>
                    <Input
                      id="assembledEtaDays"
                      name="assembledEtaDays"
                      type="number"
                      value={formData.assembledEtaDays}
                      onChange={handleChange}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel htmlFor="unassembledEtaDays">
                      {t('settings.manufacturers.edit.unassembledEta', 'Unassembled ETA (days)')}
                    </FormLabel>
                    <Input
                      id="unassembledEtaDays"
                      name="unassembledEtaDays"
                      type="number"
                      value={formData.unassembledEtaDays}
                      onChange={handleChange}
                    />
                  </FormControl>
                </SimpleGrid>
              </CardBody>
            </StandardCard>

            <StandardCard variant="outline">
              <CardHeader fontWeight="semibold" bg={cardHeaderBg} borderBottomWidth="1px">
                {t('settings.manufacturers.fields.instructions')}
              </CardHeader>
              <CardBody>
                <FormControl>
                  <Textarea
                    id="instructions"
                    name="instructions"
                    rows={4}
                    value={formData.instructions}
                    onChange={handleChange}
                  />
                </FormControl>
              </CardBody>
            </StandardCard>

            <StandardCard variant="outline">
              <CardHeader fontWeight="semibold" bg={cardHeaderBg} borderBottomWidth="1px">
                {t('settings.manufacturers.edit.assets', 'Assets & Uploads')}
              </CardHeader>
              <CardBody>
                <Stack spacing={4}>
                  <FormControl>
                    <FormLabel htmlFor="manufacturerImage">
                      {t('settings.manufacturers.edit.updateImage', 'Update manufacturer image')}
                    </FormLabel>
                    <Input
                      id="manufacturerImage"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                    />
                    <FormHelperText>
                      {t('settings.manufacturers.edit.imageHelp', 'PNG or JPG recommended. Max ~5MB.')}
                    </FormHelperText>
                  </FormControl>

                  <FormControl>
                    <FormLabel htmlFor="catalogFiles">
                      {t('settings.manufacturers.edit.uploadNewCatalog', 'Upload updated catalog files')}
                    </FormLabel>
                    <Input
                      id="catalogFiles"
                      type="file"
                      multiple
                      onChange={handleFileChange}
                    />
                    <FormHelperText>
                      {t('settings.manufacturers.edit.supported', 'PDF, CSV, XLSX, DOCX files are supported.')}
                    </FormHelperText>
                  </FormControl>
                </Stack>
              </CardBody>
            </StandardCard>

            <Box textAlign="right">
              <Button
                type="submit"
                isLoading={loading}
                bg={headerBg}
                color={textColor}
                _hover={{ opacity: 0.9 }}
              >
                {loading
                  ? t('settings.manufacturers.edit.saving', 'Saving...')
                  : t('settings.manufacturers.edit.saveChanges', 'Save changes')}
              </Button>
            </Box>
          </Stack>
        </form>
      </Stack>
    </PageContainer>
  )
}

export default EditManufacturerTab
