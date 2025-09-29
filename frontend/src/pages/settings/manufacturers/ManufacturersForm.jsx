import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { addManufacturer } from '../../../store/slices/manufacturersSlice'
import { getContrastColor } from '../../../utils/colorUtils'
import {
  FormControl,
  Input,
  FormLabel,
  Textarea,
  Checkbox,
  Card,
  CardBody,
  Alert,
  Flex,
  Box,
  Container,
  FormHelperText,
  Spinner,
  Button,
  Icon,
} from '@chakra-ui/react'
import { Mail, Image, FileText, ArrowLeft, Save, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import PageHeader from '../../../components/PageHeader'

// Move component definitions outside to prevent re-creation on every render
const FormSection = ({ title, icon, children, className = '', customization }) => {
  const headerBg = customization?.headerBg || '#667eea'
  const textColor = getContrastColor(headerBg)

  return (
    <Card className={`border-0 shadow-sm mb-4 ${className}`}>
      <CardBody className="p-4">
        <div className="d-flex align-items-center mb-4">
          <div
            className="rounded-circle d-flex align-items-center justify-content-center me-3"
            style={{
              width: '40px',
              height: '40px',
              backgroundColor: headerBg,
              color: textColor,
            }}
          >
            <CIcon icon={icon} size="sm" />
          </div>
          <h6 className="mb-0 fw-semibold text-dark">{title}</h6>
        </div>
        {children}
      </CardBody>
    </Card>

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
}) => (
  <div className="mb-3">
    <FormLabel htmlFor={name} className="fw-medium text-dark mb-2">
      {label}
      {required && <span className="text-danger ms-1">*</span>}
    </FormLabel>
    <CInputGroup>
      {icon && (
        <CInputGroupText className="bg-light border-end-0">
          <CIcon icon={icon} size="sm" className="text-muted" />
        </CInputGroupText>
      )}
      <Input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        invalid={isInvalid}
        className={icon ? 'border-start-0' : ''}
        {...props}
      />
      {feedback && <CFormFeedback>{feedback}</CFormFeedback>}
    </CInputGroup>
  </div>
)

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
}) => (
  <div className="mb-3">
    <FormLabel htmlFor={name} className="fw-medium text-dark mb-2">
      {label}
      {required && <span className="text-danger ms-1">*</span>}
    </FormLabel>
    <CInputGroup>
      {icon && (
        <CInputGroupText className="bg-light border-end-0">
          <CIcon icon={icon} size="sm" className="text-muted" />
        </CInputGroupText>
      )}
      <Textarea
        id={name}
        name={name}
        rows={rows}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        invalid={isInvalid}
        className={icon ? 'border-start-0' : ''}
        {...props}
      />
      {feedback && <CFormFeedback>{feedback}</CFormFeedback>}
    </CInputGroup>
  </div>
)

const FileUploadCard = ({
  title,
  icon,
  accept,
  multiple = false,
  onChange,
  selectedFiles,
  helpText,
}) => (
  <div className="mb-3">
    <FormLabel className="fw-medium text-dark mb-2">{title}</FormLabel>
    <div className="border-2 border-dashed rounded-3 p-4 text-center position-relative bg-light">
      <CIcon icon={icon} size="xl" className="text-muted mb-2" />
      <p className="text-muted mb-2">{t('common.clickToBrowse')}</p>
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
      {helpText && <FormHelperText className="text-muted d-block">{helpText}</FormHelperText>}
      {selectedFiles && (
        <div className="mt-3">
          {Array.isArray(selectedFiles) ? (
            selectedFiles.length === 0 ? (
              <span className="text-danger small">{t('common.noFilesSelected')}</span>
            ) : (
              <div className="text-success small">
                <CIcon icon={cilCloudUpload} className="me-1" />
                {selectedFiles.length} file(s) selected
              </div>
            )
          ) : (
            <div className="text-success small">
              <Icon as={Image} className="me-1" />
              Image selected: {selectedFiles.name}
            </div>
          )}
        </div>
      )}
    </div>
  </div>
)

const ManufacturerForm = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const customization = useSelector((state) => state.customization)

  const headerBg = customization.headerBg || '#667eea'
  const textColor = getContrastColor(headerBg)

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
      <FormHelperText className="text-info mt-2">
        <CIcon icon={cilInfo} className="me-1" size="sm" />
        Example: If cabinet's MSRP is ${msrp.toFixed(2)} and you pay ${cost.toFixed(2)} to
        manufacturer, your multiplier would be {multiplier.toFixed(1)}
      </FormHelperText>

  )
  }

  return (
    <Container
      fluid
      className="p-2 m-2 manufacturer-form"
      style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}
    >
      <style>{`
          @media (max-width: 768px) {
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
        icon={cilBuilding}
        rightContent={
          <Button
            variant="outline"
            colorScheme="gray"
            size="md"
            onClick={() => window.history.back()}
            leftIcon={<Icon as={ArrowLeft} />}
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
          color={message.type}
          dismissible
          onClose={() => setMessage({ text: '', type: '' })}
          className="border-0 shadow-sm mb-4"
          style={{ borderRadius: '12px' }}
          role={message.type === 'danger' ? 'alert' : 'status'}
          aria-live={message.type === 'danger' ? 'assertive' : 'polite'}
        >
          {message.text}
        </Alert>
      )}

      <FormControl onSubmit={handleSubmit}>
        {/* Information Notice */}
        <Card className="border-0 shadow-sm mb-4" style={{ borderLeft: `4px solid ${headerBg}` }}>
          <CardBody className="py-3 px-4" style={{ backgroundColor: '#f0f7ff' }}>
            <div className="d-flex align-items-start">
              <CIcon icon={cilInfo} className="text-primary me-2 mt-1" />
              <p className="mb-0 text-primary">
                <strong>{t('settings.manufacturers.create.infoTitle')}</strong>{' '}
                {t('settings.manufacturers.create.infoText')}
              </p>
            </div>
          </CardBody>
        </Card>

        {/* Basic Information */}
        <FormSection
          title={t('settings.manufacturers.sections.basicInfo')}
          icon={cilBuilding}
          customization={customization}
        >
          <Flex>
            <Box md={6}>
              <CustomFormInput
                label={t('settings.manufacturers.fields.manufacturerName')}
                name="name"
                required
                icon={cilBuilding}
                placeholder={t('settings.manufacturers.placeholders.manufacturerName')}
                value={formData.name}
                onChange={handleChange}
                isInvalid={!!validationErrors.name}
                feedback={validationErrors.name}
              />
            </Box>
            <Box md={6}>
              <CustomFormInput
                label={t('settings.manufacturers.fields.orderEmail')}
                name="email"
                type="email"
                required
                icon={cilEnvelopeClosed}
                placeholder={t('settings.manufacturers.placeholders.orderEmail')}
                value={formData.email}
                onChange={handleChange}
                isInvalid={!!validationErrors.email}
                feedback={validationErrors.email}
              />
            </Box>
          </Flex>

          <Flex>
            <Box md={6}>
              <CustomFormInput
                label={t('settings.manufacturers.fields.phone')}
                name="phone"
                type="tel"
                required
                icon={cilPhone}
                placeholder={t('settings.manufacturers.placeholders.phone')}
                value={formData.phone}
                onChange={handleChange}
                isInvalid={!!validationErrors.phone}
                feedback={validationErrors.phone}
              />
            </Box>
            <Box md={6}>
              <CustomFormInput
                label={t('settings.manufacturers.fields.website')}
                name="website"
                type="url"
                required
                icon={cilLocationPin}
                placeholder={t('settings.manufacturers.placeholders.website')}
                value={formData.website}
                onChange={handleChange}
                isInvalid={!!validationErrors.website}
                feedback={validationErrors.website}
              />
            </Box>
          </Flex>

          <CustomFormInput
            label={t('settings.manufacturers.fields.address')}
            name="address"
            required
            icon={cilLocationPin}
            placeholder={t('settings.manufacturers.placeholders.address')}
            value={formData.address}
            onChange={handleChange}
            isInvalid={!!validationErrors.address}
            feedback={validationErrors.address}
          />

          {/* ETA Information */}
          <Flex>
            <Box md={6}>
              <CustomFormInput
                label={t('settings.manufacturers.fields.assembledEtaDays', 'Assembled Items ETA')}
                name="assembledEtaDays"
                type="text"
                icon={cilBuilding}
                placeholder="e.g., 7-14 days"
                value={formData.assembledEtaDays}
                onChange={handleChange}
              />
              <FormHelperText className="text-muted ms-3">
                {t(
                  'settings.manufacturers.help.assembledEta',
                  'Estimated delivery time for assembled cabinets',
                )}
              </FormHelperText>
            </Box>
            <Box md={6}>
              <CustomFormInput
                label={t(
                  'settings.manufacturers.fields.unassembledEtaDays',
                  'Unassembled Items ETA',
                )}
                name="unassembledEtaDays"
                type="text"
                icon={cilDescription}
                placeholder="e.g., 3-7 days"
                value={formData.unassembledEtaDays}
                onChange={handleChange}
              />
              <FormHelperText className="text-muted ms-3">
                {t(
                  'settings.manufacturers.help.unassembledEta',
                  'Estimated delivery time for unassembled cabinets',
                )}
              </FormHelperText>
            </Box>
          </Flex>
        </FormSection>

        {/* Logo Upload */}
        <FormSection
          title={t('settings.manufacturers.sections.logo')}
          icon={cilImage}
          customization={customization}
        >
          <FileUploadCard
            title={t('settings.manufacturers.fields.uploadLogo')}
            icon={cilImage}
            accept="image/*"
            onChange={handleLogoChange}
            selectedFiles={logoImage}
            helpText={t('settings.manufacturers.help.logo')}
          />
        </FormSection>

        {/* Pricing Information */}
        <FormSection
          title={t('settings.manufacturers.sections.pricing')}
          icon={cilDollar}
          customization={customization}
        >
          <div className="mb-4">
            <FormLabel className="fw-medium text-dark mb-3">
              {t('settings.manufacturers.fields.priceInfoType')}
            </FormLabel>
            <div
              className="d-flex flex-column gap-2"
              role="radiogroup"
              aria-label={t('settings.manufacturers.fields.priceInfoType')}
            >
              <div
                className={`border rounded-3 p-3 cursor-pointer transition-all ${formData.isPriceMSRP ? 'border-primary bg-light' : 'border-light'}`}
                style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
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
                  className="mb-0"
                />
                <label
                  htmlFor="msrpPrices"
                  className="ms-2 fw-medium"
                  style={{ cursor: 'pointer' }}
                >
                  {t('settings.manufacturers.fields.msrpOption')}
                </label>
              </div>
              <div
                className={`border rounded-3 p-3 cursor-pointer transition-all ${!formData.isPriceMSRP ? 'border-primary bg-light' : 'border-light'}`}
                style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
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
                  className="mb-0"
                />
                <label
                  htmlFor="costPrices"
                  className="ms-2 fw-medium"
                  style={{ cursor: 'pointer' }}
                >
                  {t('settings.manufacturers.fields.costOption')}
                </label>
              </div>
            </div>
          </div>

          <Flex>
            <Box md={6}>
              <CustomFormInput
                label={t('settings.manufacturers.fields.costMultiplier')}
                name="costMultiplier"
                type="number"
                step="0.1"
                required
                icon={cilCalculator}
                placeholder={t('settings.manufacturers.placeholders.costMultiplier')}
                value={formData.costMultiplier}
                onChange={handleChange}
                isInvalid={!!validationErrors.costMultiplier}
                feedback={validationErrors.costMultiplier}
              />
              {formData.costMultiplier && (
                <FormHelperText className="text-info mt-2">
                  <CIcon icon={cilInfo} className="me-1" size="sm" />
                  {t('settings.manufacturers.example.multiplier', {
                    msrp: (200.0).toFixed(2),
                    cost: (100.0).toFixed(2),
                    multiplier: parseFloat(formData.costMultiplier).toFixed(1),
                  })}
                </FormHelperText>
              )}
            </Box>
          </Flex>
        </FormSection>

        {/* Instructions */}
        <FormSection
          title={t('settings.manufacturers.sections.instructions')}
          icon={cilDescription}
          customization={customization}
        >
          <CustomFormTextarea
            label={t('settings.manufacturers.fields.instructions')}
            name="instructions"
            icon={cilDescription}
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
          icon={cilCloudUpload}
          customization={customization}
        >
          <FileUploadCard
            title={t('settings.manufacturers.fields.chooseCatalogFiles')}
            icon={cilCloudUpload}
            accept=".pdf,.xlsx,.xls,.csv"
            multiple={true}
            onChange={handleFileChange}
            selectedFiles={files}
            helpText={t('settings.manufacturers.help.catalog')}
          />
        </FormSection>

        {/* Action Buttons */}
        <Card className="border-0 shadow-sm">
          <CardBody className="p-4">
            <div className="d-flex gap-3 justify-content-end flex-wrap">
              <Button
                variant="outline"
                colorScheme="gray"
                size="lg"
                onClick={() => window.history.back()}
                leftIcon={<Icon as={ArrowLeft} />}
                borderRadius="12px"
                px={4}
                fontWeight="semibold"
                display={{ base: 'none', md: 'inline-flex' }}
                minH="44px"
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="submit"
                colorScheme="green"
                size="lg"
                isDisabled={loading}
                leftIcon={<Icon as={Save} />}
                borderRadius="12px"
                px={5}
                fontWeight="semibold"
                minH="44px"
                bgGradient="linear(135deg, #10b981 0%, #059669 100%)"
                _hover={{ bgGradient: "linear(135deg, #059669 0%, #047857 100%)" }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    {t('settings.manufacturers.create.submitting')}
                  </>
                ) : (
                  <>
                    {t('settings.manufacturers.create.submit')}
                  </>
                )}
              </Button>
            </div>
          </CardBody>
        </Card>
      </FormControl>
    </Container>
  )
}
export default ManufacturerForm
