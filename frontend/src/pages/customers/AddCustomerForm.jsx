import { useState, useRef } from 'react'
import { FormControl, Input, FormLabel, Select, Flex, Box, Container, Icon, Textarea, InputGroup, InputLeftAddon, Button, FormErrorMessage, useToast } from '@chakra-ui/react'
import StandardCard from '../../components/StandardCard'
import PageHeader from '../../components/PageHeader'
import {
  User,
  Mail,
  ArrowLeft,
  Save,
  UserPlus,
  Building,
  MapPin,
  Phone,
} from 'lucide-react'
import axiosInstance from '../../helpers/axiosInstance'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

// External component definitions to prevent re-rendering
const FormSection = ({ title, icon, children, className = '' }) => (
  <StandardCard className={`border-0 shadow-sm mb-4 ${className}`}>
    <CardBody>
      <div>
        <div
          className="rounded-circle d-flex align-items-center justify-content-center me-3"
          style={{
            width: '40px',
            height: '40px',
            backgroundColor: 'var(--chakra-colors-blue-50)',
            color: "blue.500",
          }}
        >
          <Icon as={icon} boxSize={4} />
        </div>
        <h6 className="mb-0 fw-semibold text-dark">{title}</h6>
      </div>
      {children}
    </CardBody>
  </StandardCard>
)

const CustomFormInput = ({
  label,
  name,
  type = 'text',
  required = false,
  icon = null,
  placeholder = '',
  formData,
  validationErrors,
  handleChange,
  inputRefs,
  ...props
}) => (
  <div>
    <FormLabel htmlFor={name} className="fw-medium text-dark mb-2">
      {label}
      {required && <span className="text-danger ms-1">*</span>}
    </FormLabel>
    <InputGroup>
      {icon && (
        <InputLeftAddon
          style={{
            background: 'linear-gradient(135deg, var(--chakra-colors-gray-50) 0%, var(--chakra-colors-gray-100) 100%)',
            border: '1px solid var(--chakra-colors-gray-200)',
            borderRight: 'none',
          }}
        >
          <Icon as={icon} boxSize={4} color="gray.500" />
        </InputLeftAddon>
      )}
      <Input
        id={name}
        name={name}
        type={type}
        value={formData[name]}
        onChange={handleChange}
        isInvalid={!!validationErrors[name]}
        ref={(el) => (inputRefs.current[name] = el)}
        placeholder={placeholder}
        style={{
          border: `1px solid ${validationErrors[name] ? "red.500" : 'var(--chakra-colors-gray-200)'}`,
          borderRadius: icon ? '0 10px 10px 0' : '10px',
          fontSize="sm",
          padding: '12px 16px',
          transition: 'all 0.3s ease',
          borderLeft: icon ? 'none' : '1px solid var(--chakra-colors-gray-200)',
        }}
        onFocus={(e) => {
          if (!validationErrors[name]) {
            e.target.style.borderColor = 'var(--chakra-colors-blue-500)'
            e.target.style.boxShadow = '0 0 0 0.2rem rgba(66, 153, 225, 0.25)'
          }
        }}
        onBlur={(e) => {
          if (!validationErrors[name]) {
            e.target.style.borderColor = 'var(--chakra-colors-gray-200)'
            e.target.style.boxShadow = 'none'
          }
        }}
        {...props}
      />
    </InputGroup>
    {validationErrors[name] && (
      <FormErrorMessage>{validationErrors[name]}</FormErrorMessage>
    )}
  </div>
)

const CustomFormSelect = ({
  label,
  name,
  required = false,
  icon = null,
  children,
  formData,
  validationErrors,
  handleChange,
  inputRefs,
  ...props
}) => (
  <div>
    <FormLabel htmlFor={name} className="fw-medium text-dark mb-2">
      {label}
      {required && <span className="text-danger ms-1">*</span>}
    </FormLabel>
    <InputGroup>
      {icon && (
        <InputLeftAddon
          style={{
            background: 'linear-gradient(135deg, var(--chakra-colors-gray-50) 0%, var(--chakra-colors-gray-100) 100%)',
            border: '1px solid var(--chakra-colors-gray-200)',
            borderRight: 'none',
          }}
        >
          <Icon as={icon} boxSize={4} color="gray.500" />
        </InputLeftAddon>
      )}
      <Select
        id={name}
        name={name}
        value={formData[name]}
        onChange={handleChange}
        isInvalid={!!validationErrors[name]}
        ref={(el) => (inputRefs.current[name] = el)}
        style={{
          border: `1px solid ${validationErrors[name] ? "red.500" : 'var(--chakra-colors-gray-200)'}`,
          borderRadius: icon ? '0 10px 10px 0' : '10px',
          fontSize="sm",
          padding: '12px 16px',
          transition: 'all 0.3s ease',
          borderLeft: icon ? 'none' : '1px solid var(--chakra-colors-gray-200)',
        }}
        onFocus={(e) => {
          if (!validationErrors[name]) {
            e.target.style.borderColor = 'var(--chakra-colors-blue-500)'
            e.target.style.boxShadow = '0 0 0 0.2rem rgba(66, 153, 225, 0.25)'
          }
        }}
        onBlur={(e) => {
          if (!validationErrors[name]) {
            e.target.style.borderColor = 'var(--chakra-colors-gray-200)'
            e.target.style.boxShadow = 'none'
          }
        }}
        {...props}
      >
        {children}
      </Select>
    </InputGroup>
    {validationErrors[name] && (
      <FormErrorMessage>{validationErrors[name]}</FormErrorMessage>
    )}
  </div>
)

const AddCustomerForm = () => {
  const { t } = useTranslation()
  const customization = useSelector((state) => state.customization)
  const headerBg = customization?.headerBg || "blue.600"
  const textColor = customization?.headerTextColor || "white"

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    aptOrSuite: '',
    city: '',
    state: '',
    zipCode: '',
    homePhone: '',
    mobile: '',
    leadSource: '',
    customerType: 'Home Owner',
    defaultDiscount: 0,
    companyName: '',
    note: '',
  })

  const [validationErrors, setValidationErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const inputRefs = useRef({})
  const api_url = import.meta.env.VITE_API_URL
  const navigate = useNavigate()
  const toast = useToast()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setValidationErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleNoteChange = (data) => {
    setFormData((prev) => ({ ...prev, note: data }))
  }

  const validateForm = () => {
    const errors = {}
    const required = [
      'name',
      'email',
      'address',
      'city',
      'state',
      'zipCode',
      'mobile',
      'leadSource',
    ]
    required.forEach((f) => {
      if (!formData[f]?.toString().trim()) {
        errors[f] = t('form.validation.required')
      }
    })
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = t('form.validation.invalidEmail')
    }
    if (formData.zipCode && !/^\d{5}$/.test(formData.zipCode)) {
      errors.zipCode = t('form.validation.zip5')
    }
    if (formData.mobile && !/^\d{10}$/.test(formData.mobile)) {
      errors.mobile = t('form.validation.mobile10')
    }
    return errors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validateForm()
    setValidationErrors(errs)
    if (Object.keys(errs).length) {
      const first = Object.keys(errs)[0]
      inputRefs.current[first]?.focus()
      return
    }

    setIsSubmitting(true)
    try {
      await axiosInstance.post(`/api/customers/add`, formData)
      toast({
        title: t('form.alerts.createdTitle'),
        description: t('form.alerts.createdText'),
        status: 'success',
        duration: 4000,
        isClosable: true,
      })
      setFormData({
        name: '',
        email: '',
        address: '',
        aptOrSuite: '',
        city: '',
        state: '',
        zipCode: '',
        homePhone: '',
        mobile: '',
        leadSource: '',
        customerType: 'Home Owner',
        defaultDiscount: 0,
        companyName: '',
        note: '',
      })
      setValidationErrors({})
    } catch (err) {
      console.error(err)
      toast({
        title: t('common.error'),
        description: t('form.alerts.createFailed'),
        status: 'error',
        duration: 4000,
        isClosable: true,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Container fluid className="p-2 m-2 add-new-customer bg-body" minH="100vh">
      <style>{`
        .add-new-customer .btn { min-height: 44px; }
      `}</style>
      {/* Header Section */}
      <PageHeader
        title={
          <div className="d-flex align-items-center gap-3">
            <div
              className="d-flex align-items-center justify-content-center"
              style={{
                width: '48px',
                height: '48px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
              }}
            >
              <Icon as={UserPlus} boxSize={6} color="white" />
            </div>
            {t('customers.form.titles.add')}
          </div>
        }
        subtitle="Create a new customer profile with detailed information"
        rightContent={
          <Button
            variant="outline" colorScheme="gray"
            className="shadow-sm px-4 fw-semibold"
            onClick={() => navigate('/customers')}
            aria-label={t('form.actions.backToCustomers')}
            style={{
              borderRadius: '5px',
              border: 'none',
              transition: 'all 0.3s ease',
            }}
          >
            <Icon as={ArrowLeft} />
            {t('form.actions.backToCustomers')}
          </Button>
        }
      />

      <form onSubmit={handleSubmit}>
        {/* Basic Information Section */}
        <FormSection title={t('customers.form.titles.basicInfo')} icon={User}>
          <Flex>
            <Box md={6}>
              <CustomFormInput
                label={t('customers.form.labels.fullName')}
                name="name"
                required
                icon={User}
                placeholder={t('customers.form.placeholders.fullName')}
                formData={formData}
                validationErrors={validationErrors}
                handleChange={handleChange}
                inputRefs={inputRefs}
              />
            </Box>
            <Box md={6}>
              <CustomFormInput
                label={t('customers.form.labels.email')}
                name="email"
                type="email"
                required
                icon={Mail}
                placeholder={t('customers.form.placeholders.email')}
                formData={formData}
                validationErrors={validationErrors}
                handleChange={handleChange}
                inputRefs={inputRefs}
              />
            </Box>
          </Flex>

          <Flex>
            <Box md={6}>
              <CustomFormSelect
                label={t('customers.form.labels.customerType')}
                name="customerType"
                icon={User}
                formData={formData}
                validationErrors={validationErrors}
                handleChange={handleChange}
                inputRefs={inputRefs}
              >
                <option value="Home Owner">{t('form.types.homeOwner')}</option>
                <option value="Landlord">{t('form.types.landlord')}</option>
                <option value="Tenant">{t('form.types.tenant')}</option>
                <option value="Other">{t('form.types.other')}</option>
              </CustomFormSelect>
            </Box>
            <Box md={6}>
              <CustomFormInput
                label={t('customers.form.labels.companyName')}
                name="companyName"
                icon={Building}
                placeholder={t('customers.form.placeholders.companyName')}
                formData={formData}
                validationErrors={validationErrors}
                handleChange={handleChange}
                inputRefs={inputRefs}
              />
            </Box>
          </Flex>
        </FormSection>

        {/* Address Information Section */}
        <FormSection title={t('customers.form.titles.addressInfo')} icon={MapPin}>
          <Flex>
            <Box md={8}>
              <CustomFormInput
                label={t('customers.form.labels.address')}
                name="address"
                required
                icon={MapPin}
                placeholder={t('customers.form.placeholders.street')}
                formData={formData}
                validationErrors={validationErrors}
                handleChange={handleChange}
                inputRefs={inputRefs}
              />
            </Box>
            <Box md={4}>
              <CustomFormInput
                label={t('customers.form.labels.aptSuite')}
                name="aptOrSuite"
                placeholder={t('customers.form.placeholders.aptSuite')}
                formData={formData}
                validationErrors={validationErrors}
                handleChange={handleChange}
                inputRefs={inputRefs}
              />
            </Box>
          </Flex>

          <Flex>
            <Box md={4}>
              <CustomFormInput
                label={t('customers.form.labels.city')}
                name="city"
                required
                placeholder={t('customers.form.placeholders.city')}
                formData={formData}
                validationErrors={validationErrors}
                handleChange={handleChange}
                inputRefs={inputRefs}
              />
            </Box>
            <Box md={4}>
              <CustomFormSelect
                label={t('customers.form.labels.state')}
                name="state"
                required
                formData={formData}
                validationErrors={validationErrors}
                handleChange={handleChange}
                inputRefs={inputRefs}
              >
                <option value="">{t('customers.form.select.selectState')}</option>
                <option value="AL">Alabama</option>
                <option value="AK">Alaska</option>
                <option value="AZ">Arizona</option>
                <option value="AR">Arkansas</option>
                <option value="CA">California</option>
                <option value="CO">Colorado</option>
                <option value="CT">Connecticut</option>
                <option value="DE">Delaware</option>
                <option value="FL">Florida</option>
                <option value="GA">Georgia</option>
                <option value="HI">Hawaii</option>
                <option value="ID">Idaho</option>
                <option value="IL">Illinois</option>
                <option value="IN">Indiana</option>
                <option value="IA">Iowa</option>
                <option value="KS">Kansas</option>
                <option value="KY">Kentucky</option>
                <option value="LA">Louisiana</option>
                <option value="ME">Maine</option>
                <option value="MD">Maryland</option>
                <option value="MA">Massachusetts</option>
                <option value="MI">Michigan</option>
                <option value="MN">Minnesota</option>
                <option value="MS">Mississippi</option>
                <option value="MO">Missouri</option>
                <option value="MT">Montana</option>
                <option value="NE">Nebraska</option>
                <option value="NV">Nevada</option>
                <option value="NH">New Hampshire</option>
                <option value="NJ">New Jersey</option>
                <option value="NM">New Mexico</option>
                <option value="NY">New York</option>
                <option value="NC">North Carolina</option>
                <option value="ND">North Dakota</option>
                <option value="OH">Ohio</option>
                <option value="OK">Oklahoma</option>
                <option value="OR">Oregon</option>
                <option value="PA">Pennsylvania</option>
                <option value="RI">Rhode Island</option>
                <option value="SC">South Carolina</option>
                <option value="SD">South Dakota</option>
                <option value="TN">Tennessee</option>
                <option value="TX">Texas</option>
                <option value="UT">Utah</option>
                <option value="VT">Vermont</option>
                <option value="VA">Virginia</option>
                <option value="WA">Washington</option>
                <option value="WV">West Virginia</option>
                <option value="WI">Wisconsin</option>
                <option value="WY">Wyoming</option>
              </CustomFormSelect>
            </Box>
            <Box md={4}>
              <CustomFormInput
                label={t('customers.form.labels.zipCode')}
                name="zipCode"
                required
                placeholder={t('customers.form.placeholders.zip')}
                formData={formData}
                validationErrors={validationErrors}
                handleChange={handleChange}
                inputRefs={inputRefs}
              />
            </Box>
          </Flex>
        </FormSection>

        {/* Contact Information Section */}
        <FormSection title={t('customers.form.titles.contactInfo')} icon={Phone}>
          <Flex>
            <Box md={6}>
              <CustomFormInput
                label={t('form.labels.mobile')}
                name="mobile"
                required
                icon={Phone}
                placeholder={t('form.placeholders.mobile')}
                formData={formData}
                validationErrors={validationErrors}
                handleChange={handleChange}
                inputRefs={inputRefs}
              />
            </Box>
            <Box md={6}>
              <CustomFormInput
                label={t('form.labels.homePhone')}
                name="homePhone"
                icon={Phone}
                placeholder={t('form.placeholders.homePhone')}
                formData={formData}
                validationErrors={validationErrors}
                handleChange={handleChange}
                inputRefs={inputRefs}
              />
            </Box>
          </Flex>
        </FormSection>

        {/* Business Information Section */}
        <FormSection title={t('form.titles.businessInfo')} icon={Building}>
          <Flex>
            <Box md={6}>
              <CustomFormSelect
                label={t('form.labels.leadSource')}
                name="leadSource"
                required
                formData={formData}
                validationErrors={validationErrors}
                handleChange={handleChange}
                inputRefs={inputRefs}
              >
                <option value="">{t('form.select.selectSource')}</option>
                <option value="Advertising">{t('form.sources.advertising')}</option>
                <option value="Google">{t('form.sources.google')}</option>
                <option value="Referral">{t('form.sources.referral')}</option>
                <option value="Social Media">{t('form.sources.social')}</option>
                <option value="Website">{t('form.sources.website')}</option>
              </CustomFormSelect>
            </Box>
            <Box md={6}>
              <CustomFormInput
                label={t('form.labels.defaultDiscount')}
                name="defaultDiscount"
                type="number"
                min={0}
                max={100}
                placeholder={t('form.placeholders.defaultDiscount')}
                formData={formData}
                validationErrors={validationErrors}
                handleChange={handleChange}
                inputRefs={inputRefs}
              />
            </Box>
          </Flex>

          <div>
            <FormLabel className="fw-medium text-dark mb-2">{t('form.labels.notes')}</FormLabel>
            <Textarea
              id="note"
              name="note"
              rows={6}
              value={formData.note}
              onChange={(e) => handleNoteChange(e.target.value)}
              placeholder={t('form.placeholders.notes')}
            />
          </div>
        </FormSection>

        {/* Action Buttons */}
        <StandardCard>
          <CardBody>
            <div className="d-flex gap-3 justify-content-end form-buttons">
              <Button
                variant="outline" colorScheme="gray"
                size="lg"
                onClick={() => navigate('/customers')}
                className="px-4 fw-semibold"
                style={{
                  borderRadius: '5px',
                  border: '1px solid var(--chakra-colors-gray-200)',
                  transition: 'all 0.3s ease',
                }}
              >
                <Icon as={ArrowLeft} />
                {t('form.actions.cancel')}
              </Button>
              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="px-5 fw-semibold"
                style={{
                  borderRadius: '5px',
                  border: 'none',
                  backgroundColor: headerBg,
                  color: textColor,
                  transition: 'all 0.3s ease',
                }}
              >
                {isSubmitting ? (
                  <>
                    <div

                      role="status"
                      style={{ width: '16px', height: '16px' }}
                    >
                      <span className="visually-hidden">{t('common.loading')}</span>
                    </div>
                    {t('form.actions.saving')}
                  </>
                ) : (
                  <>
                    <Icon as={Save} />
                    {t('form.actions.saveCustomer')}
                  </>
                )}
              </Button>
            </div>
          </CardBody>
        </StandardCard>
      </form>
    </Container>
  )
}

export default AddCustomerForm
