import StandardCard from '../../../components/StandardCard'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { addManufacturer } from '../../../store/slices/manufacturersSlice'
import { getContrastColor } from '../../../utils/colorUtils'
import { Alert, AlertIcon, Box, Button, CardBody, Checkbox, CloseButton, Container, Flex, FormControl, FormErrorMessage, FormHelperText, FormLabel, HStack, Icon, Input, InputGroup, InputLeftAddon, SimpleGrid, Spinner, Text, Textarea, useColorModeValue, VStack } from '@chakra-ui/react'
import {
  Mail,
  Image,
  FileText,
  ArrowLeft,
  Save,
  User,
  Building,
  Phone,
  MapPin,
  Calculator,
  CloudUpload,
  Info,
  DollarSign,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import PageHeader from '../../../components/PageHeader'
import { ICON_SIZE_MD, ICON_BOX_MD } from '../../../constants/iconSizes'
import { motion } from 'framer-motion'

const MotionButton = motion.create(Button)

// Move component definitions outside to prevent re-creation on every render
const FormSection = ({ title, icon, children, customization }) => {
  const headerBg = customization?.headerBg || "purple.500"
  const textColor = getContrastColor(headerBg)
  const titleColor = useColorModeValue('gray.800', 'gray.200')

  return (
    <StandardCard border="none" boxShadow="sm" mb={4}>
      <CardBody>
        <Flex align="center" mb={4}>
          <Flex
            borderRadius="full"
            align="center"
            justify="center"
            mr={3}
            w="40px"
            h="40px"
            bg={headerBg}
            color={textColor}
          >
            <Icon as={icon} boxSize={ICON_BOX_MD} />
          </Flex>
          <Text as="h6" mb={0} fontWeight="semibold" color={titleColor}>{title}</Text>
        </Flex>
        {children}
      </CardBody>
    </StandardCard>

  )
}
const CustomFormInput = ({
  label,
  name,
  type = 'text',
  required = false,
  icon = null,
  placeholder = '',
  value,
  onChange,
  isInvalid,
  feedback,
  ...props
}) => {
  const labelColor = useColorModeValue('gray.800', 'gray.200')
  const textRed500 = useColorModeValue('red.500', 'red.300')
  const bgGray50 = useColorModeValue('gray.50', 'gray.800')
  const iconGray = useColorModeValue('gray.500', 'gray.400')

  return (
    <FormControl mb={3} isRequired={required} isInvalid={isInvalid}>
      <FormLabel htmlFor={name} fontWeight="medium" color={labelColor} mb={2}>
        {label}
        {required && <Text as="span" color={textRed500} ml={1}>*</Text>}
      </FormLabel>
      <InputGroup>
        {icon && (
          <InputLeftAddon bg={bgGray50}>
            <Icon as={icon} boxSize={ICON_BOX_MD} color={iconGray} />
          </InputLeftAddon>
        )}
        <Input
          type={type}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          isInvalid={isInvalid}
          borderLeftWidth={icon ? 0 : undefined}
          {...props}
        />
        {feedback && <FormErrorMessage>{feedback}</FormErrorMessage>}
      </InputGroup>
    </FormControl>
  )
}

const CustomFormTextarea = ({
  label,
  name,
  required = false,
  icon = null,
  placeholder = '',
  rows = 4,
  value,
  onChange,
  isInvalid,
  feedback,
  ...props
}) => {
  const labelColor = useColorModeValue('gray.800', 'gray.200')
  const textRed500 = useColorModeValue('red.500', 'red.300')
  const bgGray50 = useColorModeValue('gray.50', 'gray.800')
  const iconGray = useColorModeValue('gray.500', 'gray.400')

  return (
    <FormControl mb={3} isRequired={required} isInvalid={isInvalid}>
      <FormLabel htmlFor={name} fontWeight="medium" color={labelColor} mb={2}>
        {label}
        {required && <Text as="span" color={textRed500} ml={1}>*</Text>}
      </FormLabel>
      <InputGroup>
        {icon && (
          <InputLeftAddon bg={bgGray50}>
            <Icon as={icon} boxSize={ICON_BOX_MD} color={iconGray} />
          </InputLeftAddon>
        )}
        <Textarea
          id={name}
          name={name}
          rows={rows}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          isInvalid={isInvalid}
          borderLeftWidth={icon ? 0 : undefined}
          {...props}
        />
        {feedback && <FormErrorMessage>{feedback}</FormErrorMessage>}
      </InputGroup>
    </FormControl>
  )
}

const FileUploadCard = ({
  title,
  icon,
  accept,
  multiple = false,
  onChange,
  selectedFiles,
  helpText,
}) => {
  const { t } = useTranslation()
  const labelColor = useColorModeValue('gray.800', 'gray.200')
  const borderGray = useColorModeValue('gray.300', 'gray.600')
  const bgGray50 = useColorModeValue('gray.50', 'gray.800')
  const iconGray = useColorModeValue('gray.400', 'gray.500')
  const textGray500 = useColorModeValue('gray.500', 'gray.400')
  const textGray600 = useColorModeValue('gray.600', 'gray.300')
  const textRed500 = useColorModeValue('red.500', 'red.300')
  const textGreen600 = useColorModeValue('green.600', 'green.300')

  return (
    <Box>
      <FormLabel fontWeight="medium" color={labelColor} mb={2}>{title}</FormLabel>
      <Box border="2px dashed" borderColor={borderGray} borderRadius="lg" p={4} textAlign="center" position="relative" bg={bgGray50}>
        <Icon as={icon} boxSize={12} color={iconGray} mb={2} />
        <Text color={textGray500} mb={2}>{t('common.clickToBrowse')}</Text>
      <Input
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={onChange}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          opacity: 0,
          cursor: 'pointer',
        }}
      />
      {helpText && <Text fontSize="sm" color={textGray600} display="block">{helpText}</Text>}
      {selectedFiles && (
        <Box>
          {Array.isArray(selectedFiles) ? (
            selectedFiles.length === 0 ? (
              <Text as="span" color={textRed500} fontSize="sm">{t('common.noFilesSelected')}</Text>
            ) : (
              <Flex color={textGreen600} fontSize="sm" align="center" justify="center">
                <CloudUpload size={ICON_SIZE_MD} style={{ marginRight: '0.25rem' }} />
                {selectedFiles.length} file(s) selected
              </Flex>
            )
          ) : (
            <Flex color={textGreen600} fontSize="sm" align="center" justify="center">
              <Image size={ICON_SIZE_MD} />
              Image selected: {selectedFiles.name}
            </Flex>
          )}
        </Box>
      )}
    </Box>
  </Box>
  )
}

const ManufacturerForm = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const customization = useSelector((state) => state.customization)

  const headerBg = customization.headerBg || "purple.500"
  const textColor = getContrastColor(headerBg)

  // Dark mode colors
  const textBlue500 = useColorModeValue('blue.500', 'blue.300')
  const textBlue600 = useColorModeValue('blue.600', 'blue.300')
  const textGray600 = useColorModeValue('gray.600', 'gray.300')
  const labelColor = useColorModeValue('gray.800', 'gray.200')
  const bgGray50 = useColorModeValue('gray.50', 'gray.800')

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
  })

  const [files, setFiles] = useState([])
  const [message, setMessage] = useState({ text: '', type: '' })
  const [loading, setLoading] = useState(false)
  const [logoImage, setLogoImage] = useState(null)
  const [validationErrors, setValidationErrors] = useState({})

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prevState) => ({
      ...prevState,
      [name]: type === 'checkbox' ? checked : value,
    }))
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const handleFileChange = (e) => {
    setFiles([...e.target.files])
  }

  const handleLogoChange = (e) => {
    setLogoImage(e.target.files[0])
  }

  const handlePriceTypeChange = (isPriceMSRP) => {
    setFormData((prevState) => ({
      ...prevState,
      isPriceMSRP,
    }))
  }

  const handlePriceTypeKeyDown = (event, isPriceMSRP) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handlePriceTypeChange(isPriceMSRP)
    }
  }

  const validateForm = () => {
    const errors = {}
    const required = ['name', 'email', 'phone', 'website', 'address', 'costMultiplier']

    required.forEach((field) => {
      if (!formData[field]?.toString().trim()) {
        errors[field] = t('settings.users.form.validation.required')
      }
    })

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = t('customers.form.validation.invalidEmail')
    }

    if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
      errors.website = 'Please enter a valid URL starting with http:// or https://'
    }

    if (formData.costMultiplier && parseFloat(formData.costMultiplier) <= 0) {
      errors.costMultiplier =
        t('settings.manufacturers.edit.costMultiplier') +
        ' ' +
        t('customers.form.validation.required')
    }

    return errors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errors = validateForm()
    setValidationErrors(errors)

    if (Object.keys(errors).length > 0) {
      setMessage({
        text: t('settings.manufacturers.create.messages.validationFix'),
        type: 'danger',
      })
      return
    }

    setLoading(true)
    setMessage({ text: '', type: '' })

    try {
      // Create FormData for file upload
      const formDataToSend = new FormData()

      // Append form fields
      formDataToSend.append('name', formData.name)
      formDataToSend.append('email', formData.email)
      formDataToSend.append('phone', formData.phone)
      formDataToSend.append('address', formData.address)
      formDataToSend.append('website', formData.website)
      formDataToSend.append('isPriceMSRP', formData.isPriceMSRP)
      formDataToSend.append('costMultiplier', formData.costMultiplier)
      formDataToSend.append('instructions', formData.instructions)
      formDataToSend.append('assembledEtaDays', formData.assembledEtaDays || '')
      formDataToSend.append('unassembledEtaDays', formData.unassembledEtaDays || '')

      // Append logo image if selected
      if (logoImage) {
        formDataToSend.append('manufacturerImage', logoImage)
      }

      // Append catalog files if selected
      files.forEach((file) => {
        formDataToSend.append('catalogFiles', file)
      })

      // Dispatch Redux action
      const result = await dispatch(addManufacturer(formDataToSend)).unwrap()

      setMessage({
        text: t('settings.manufacturers.create.messages.created'),
        type: 'success',
      })

      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        website: '',
        isPriceMSRP: true,
        costMultiplier: '',
        instructions: '',
      })
      setFiles([])
      setLogoImage(null)
      setValidationErrors({})

      // Redirect to manufacturers list after 2 seconds
      setTimeout(() => {
        navigate('/settings/manufacturers')
      }, 2000)
    } catch (error) {
      console.error('Error creating manufacturer:', error)
      setMessage({
        text: error.message || t('settings.manufacturers.create.messages.createFailed'),
        type: 'danger',
      })
    } finally {
      setLoading(false)
    }
  }

  const calculateMultiplierExample = () => {
    if (!formData.costMultiplier) return null

    const msrp = 200.0
    const cost = 100.0
    const multiplier = parseFloat(formData.costMultiplier)

    return (
      <Text fontSize="sm" color={textBlue500} mt={2} display="flex" alignItems="center">
        <Info size={ICON_SIZE_MD} style={{ marginRight: '0.25rem' }} />
        Example: If cabinet's MSRP is ${msrp.toFixed(2)} and you pay ${cost.toFixed(2)} to
        manufacturer, your multiplier would be {multiplier.toFixed(1)}
      </Text>
  )
  }

  return (
    <Container
      maxW="full"
      p={2}
      m={2}
      bg={bgGray50}
      minH="100vh"
      className="manufacturer-form"
    >
      <style>{`
          @media (max-width: 1023px) {
            .manufacturer-form .p-4 { padding: 1.5rem !important; }
            .manufacturer-form .mb-4 { margin-bottom: 1.5rem !important; }
          }

          @media (max-width: 576px) {
            .manufacturer-form .p-4 { padding: 1rem !important; }
            .manufacturer-form h3 { font-size: 1.5rem !important; }
            .manufacturer-form .btn { width: 100%; margin-bottom: 0.5rem; }
            .manufacturer-form .btn:last-child { margin-bottom: 0; }
          }
        `}
      </style>

      {/* Header Section */}
      <PageHeader
        title={t('settings.manufacturers.create.title')}
        subtitle={t('settings.manufacturers.create.subtitle')}
        icon={Building}
        rightContent={
          <Button
            variant="outline"
            colorScheme="gray"
            size="md"
            onClick={() => window.history.back()}
            leftIcon={<ArrowLeft size={ICON_SIZE_MD} />}
            borderRadius="md"
            px={4}
            fontWeight="semibold"
            display={{ base: 'none', md: 'inline-flex' }}
            minH="44px"
          >
            {t('settings.manufacturers.create.back')}
          </Button>
        }
      />

      {/* Alert Messages */}
      {message.text && (
        <Alert
          status={message.type === 'danger' ? 'error' : message.type === 'success' ? 'success' : 'info'}
          mb={4}
          borderRadius="xl"
          variant="subtle"
        >
          <AlertIcon />
          <Box flex="1">
            {message.text}
          </Box>
          <CloseButton
            position="absolute"
            right="8px"
            top="8px"
            onClick={() => setMessage({ text: '', type: '' })}
          />
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        {/* Information Notice */}
        <StandardCard border="none" boxShadow="sm" mb={4} borderLeft={`4px solid ${headerBg}`}>
          <CardBody py={3} px={4} bg={useColorModeValue("blue.50","blue.900")}>
            <HStack align="flex-start" spacing={4}>
              <Info size={ICON_SIZE_MD} style={{ color: "blue.500", marginTop: '0.25rem' }} />
              <Text mb={0} color={textBlue600}>
                <Text as="strong">{t('settings.manufacturers.create.infoTitle')}</Text>{' '}
                {t('settings.manufacturers.create.infoText')}
              </Text>
            </HStack>
          </CardBody>
        </StandardCard>

        {/* Basic Information */}
        <FormSection
          title={t('settings.manufacturers.sections.basicInfo')}
          icon={Building}
          customization={customization}
        >
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <Box>
              <CustomFormInput
                label={t('settings.manufacturers.fields.manufacturerName')}
                name="name"
                required
                icon={Building}
                placeholder={t('settings.manufacturers.placeholders.manufacturerName')}
                value={formData.name}
                onChange={handleChange}
                isInvalid={!!validationErrors.name}
                feedback={validationErrors.name}
              />
            </Box>
            <Box>
              <CustomFormInput
                label={t('settings.manufacturers.fields.orderEmail')}
                name="email"
                type="email"
                required
                icon={Mail}
                placeholder={t('settings.manufacturers.placeholders.orderEmail')}
                value={formData.email}
                onChange={handleChange}
                isInvalid={!!validationErrors.email}
                feedback={validationErrors.email}
              />
            </Box>
          </SimpleGrid>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <Box>
              <CustomFormInput
                label={t('settings.manufacturers.fields.phone')}
                name="phone"
                type="tel"
                required
                icon={Phone}
                placeholder={t('settings.manufacturers.placeholders.phone')}
                value={formData.phone}
                onChange={handleChange}
                isInvalid={!!validationErrors.phone}
                feedback={validationErrors.phone}
              />
            </Box>
            <Box>
              <CustomFormInput
                label={t('settings.manufacturers.fields.website')}
                name="website"
                type="url"
                required
                icon={MapPin}
                placeholder={t('settings.manufacturers.placeholders.website')}
                value={formData.website}
                onChange={handleChange}
                isInvalid={!!validationErrors.website}
                feedback={validationErrors.website}
              />
            </Box>
          </SimpleGrid>

          <CustomFormInput
            label={t('settings.manufacturers.fields.address')}
            name="address"
            required
            icon={MapPin}
            placeholder={t('settings.manufacturers.placeholders.address')}
            value={formData.address}
            onChange={handleChange}
            isInvalid={!!validationErrors.address}
            feedback={validationErrors.address}
          />

          {/* ETA Information */}
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <Box>
              <CustomFormInput
                label={t('settings.manufacturers.fields.assembledEtaDays', 'Assembled Items ETA')}
                name="assembledEtaDays"
                type="text"
                icon={Building}
                placeholder="e.g., 7-14 days"
                value={formData.assembledEtaDays}
                onChange={handleChange}
              />
              <Text fontSize="sm" color={textGray600} ms={3}>
                {t(
                  'settings.manufacturers.help.assembledEta',
                  'Estimated delivery time for assembled cabinets',
                )}
              </Text>
            </Box>
            <Box>
              <CustomFormInput
                label={t(
                  'settings.manufacturers.fields.unassembledEtaDays',
                  'Unassembled Items ETA',
                )}
                name="unassembledEtaDays"
                type="text"
                icon={FileText}
                placeholder="e.g., 3-7 days"
                value={formData.unassembledEtaDays}
                onChange={handleChange}
              />
              <Text fontSize="sm" color={textGray600} ms={3}>
                {t(
                  'settings.manufacturers.help.unassembledEta',
                  'Estimated delivery time for unassembled cabinets',
                )}
              </Text>
            </Box>
          </SimpleGrid>
        </FormSection>

        {/* Logo Upload */}
        <FormSection
          title={t('settings.manufacturers.sections.logo')}
          icon={Image}
          customization={customization}
        >
          <FileUploadCard
            title={t('settings.manufacturers.fields.uploadLogo')}
            icon={Image}
            accept="image/*"
            onChange={handleLogoChange}
            selectedFiles={logoImage}
            helpText={t('settings.manufacturers.help.logo')}
          />
        </FormSection>

        {/* Pricing Information */}
        <FormSection
          title={t('settings.manufacturers.sections.pricing')}
          icon={DollarSign}
          customization={customization}
        >
          <Box>
            <FormLabel fontWeight="medium" color={labelColor} mb={3}>
              {t('settings.manufacturers.fields.priceInfoType')}
            </FormLabel>
            <VStack
              spacing={2}
              role="radiogroup"
              aria-label={t('settings.manufacturers.fields.priceInfoType')}
            >
              <Box
                border="1px solid"
                borderColor={formData.isPriceMSRP ? 'blue.500' : 'gray.200'}
                borderRadius="lg"
                p={3}
                cursor="pointer"
                transition="all 0.3s ease"
                bg={formData.isPriceMSRP ? 'gray.50' : 'white'}
                w="full"
                role="radio"
                tabIndex={0}
                aria-checked={formData.isPriceMSRP}
                onClick={() => handlePriceTypeChange(true)}
                onKeyDown={(event) => handlePriceTypeKeyDown(event, true)}
              >
                <Checkbox
                  type="radio"
                  id="msrpPrices"
                  checked={formData.isPriceMSRP}
                  onChange={() => handlePriceTypeChange(true)}

                />
                <Text
                  as="label"
                  htmlFor="msrpPrices"
                  ms={2}
                  fontWeight="medium"
                  cursor="pointer"
                >
                  {t('settings.manufacturers.fields.msrpOption')}
                </Text>
              </Box>
              <Box
                border="1px solid"
                borderColor={!formData.isPriceMSRP ? 'blue.500' : 'gray.200'}
                borderRadius="lg"
                p={3}
                cursor="pointer"
                transition="all 0.3s ease"
                bg={!formData.isPriceMSRP ? 'gray.50' : 'white'}
                w="full"
                role="radio"
                tabIndex={0}
                aria-checked={!formData.isPriceMSRP}
                onClick={() => handlePriceTypeChange(false)}
                onKeyDown={(event) => handlePriceTypeKeyDown(event, false)}
              >
                <Checkbox
                  type="radio"
                  id="costPrices"
                  checked={!formData.isPriceMSRP}
                  onChange={() => handlePriceTypeChange(false)}

                />
                <Text
                  as="label"
                  htmlFor="costPrices"
                  ms={2}
                  fontWeight="medium"
                  cursor="pointer"
                >
                  {t('settings.manufacturers.fields.costOption')}
                </Text>
              </Box>
            </VStack>
          </Box>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <Box>
              <CustomFormInput
                label={t('settings.manufacturers.fields.costMultiplier')}
                name="costMultiplier"
                type="number"
                step="0.1"
                required
                icon={Calculator}
                placeholder={t('settings.manufacturers.placeholders.costMultiplier')}
                value={formData.costMultiplier}
                onChange={handleChange}
                isInvalid={!!validationErrors.costMultiplier}
                feedback={validationErrors.costMultiplier}
              />
              {formData.costMultiplier && (
                <Text fontSize="sm" color={textBlue500} mt={2} display="flex" alignItems="center">
                  <Info size={ICON_SIZE_MD} style={{ marginRight: '0.25rem' }} />
                  {t('settings.manufacturers.example.multiplier', {
                    msrp: (200.0).toFixed(2),
                    cost: (100.0).toFixed(2),
                    multiplier: parseFloat(formData.costMultiplier).toFixed(1),
                  })}
                </Text>
              )}
            </Box>
          </SimpleGrid>
        </FormSection>

        {/* Instructions */}
        <FormSection
          title={t('settings.manufacturers.sections.instructions')}
          icon={FileText}
          customization={customization}
        >
          <CustomFormTextarea
            label={t('settings.manufacturers.fields.instructions')}
            name="instructions"
            icon={FileText}
            placeholder={t('settings.manufacturers.placeholders.instructions')}
            rows={4}
            value={formData.instructions}
            onChange={handleChange}
            isInvalid={!!validationErrors.instructions}
            feedback={validationErrors.instructions}
          />
        </FormSection>

        {/* Catalog Files */}
        <FormSection
          title={t('settings.manufacturers.sections.catalog')}
          icon={CloudUpload}
          customization={customization}
        >
          <FileUploadCard
            title={t('settings.manufacturers.fields.chooseCatalogFiles')}
            icon={CloudUpload}
            accept=".pdf,.xlsx,.xls,.csv"
            multiple={true}
            onChange={handleFileChange}
            selectedFiles={files}
            helpText={t('settings.manufacturers.help.catalog')}
          />
        </FormSection>

        {/* Action Buttons */}
        <StandardCard>
          <CardBody>
            <Flex gap={3} justify="flex-end" wrap="wrap">
              <Button
                variant="outline"
                colorScheme="gray"
                size="lg"
                onClick={() => window.history.back()}
                leftIcon={<ArrowLeft size={ICON_SIZE_MD} />}
                borderRadius="12px"
                px={4}
                fontWeight="semibold"
                display={{ base: 'none', md: 'inline-flex' }}
                minH="44px"
              >
                {t('common.cancel')}
              </Button>
              <MotionButton
                type="submit"
                colorScheme="green"
                size="lg"
                isDisabled={loading}
                leftIcon={<Save size={ICON_SIZE_MD} />}
                borderRadius="12px"
                px={5}
                fontWeight="semibold"
                minH="44px"
                bgGradient="linear(135deg, green.500 0%, green.600 100%)"
                _hover={{ bgGradient: "linear(135deg, green.600 0%, green.700 100%)" }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? (
                  <>
                    <Spinner size="sm" />
                    {t('settings.manufacturers.create.submitting')}
                  </>
                ) : (
                  <>
                    {t('settings.manufacturers.create.submit')}
                  </>
                )}
              </MotionButton>
            </Flex>
          </CardBody>
        </StandardCard>
      </form>
    </Container>
  )
}
export default ManufacturerForm
