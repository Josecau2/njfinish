import { useState, useRef } from 'react'
import { Box, Button, CardBody, Flex, FormControl, FormErrorMessage, FormLabel, HStack, Icon, Input, InputGroup, InputLeftAddon, Select, SimpleGrid, Text, Textarea, useToast, VStack, useColorModeValue } from '@chakra-ui/react'
import StandardCard from '../../components/StandardCard'
import PageContainer from '../../components/PageContainer'
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
import { ICON_SIZE_MD, ICON_BOX_MD } from '../../constants/iconSizes'

// External component definitions to prevent re-rendering
const FormSection = ({ title, icon, children, className = '' }) => (
  <StandardCard className={`border-0 shadow-sm ${className}`} mb={4}>
    <CardBody>
      <HStack>
        <Flex
          align="center"
          justify="center"
          borderRadius="full"
          w="40px"
          h="40px"
          bg={useColorModeValue("blue.50", "blue.900")}
          color={useColorModeValue("blue.500", "blue.300")}
        >
          <Icon as={icon} boxSize={ICON_BOX_MD} />
        </Flex>
        <Text as="h6" mb={0} fontWeight="semibold" color={useColorModeValue("gray.700", "gray.300")}>{title}</Text>
      </HStack>
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
    <FormLabel htmlFor={name} fontWeight="medium" color={useColorModeValue("gray.700", "gray.300")} mb={2}>
      {label}
      {required && <Text as="span" color={useColorModeValue("red.500","red.300")} ml={1}>*</Text>}
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
          <Icon as={icon} boxSize={ICON_BOX_MD} color={useColorModeValue("gray.500", "gray.400")} />
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
          fontSize: 'sm',
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
    <FormLabel htmlFor={name} fontWeight="medium" color={useColorModeValue("gray.700", "gray.300")} mb={2}>
      {label}
      {required && <Text as="span" color={useColorModeValue("red.500","red.300")} ml={1}>*</Text>}
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
          <Icon as={icon} boxSize={ICON_BOX_MD} color={useColorModeValue("gray.500", "gray.400")} />
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
          fontSize: 'sm',
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
    <PageContainer fluid p={2} m={2} className="add-new-customer bg-body" minH="100vh">
      <style>{`
        .add-new-customer .btn { min-height: 44px; }
      `}</style>
      {/* Header Section */}
      <PageHeader
        title={
          <HStack gap={3}>
            <Flex
              align="center"
              justify="center"
              w="48px"
              h="48px"
              bg="rgba(255, 255, 255, 0.2)"
              borderRadius="12px"
            >
              <Icon as={UserPlus} boxSize={6} color="white" />
            </Flex>
            {t('customers.form.titles.add')}
          </HStack>
        }
        subtitle="Create a new customer profile with detailed information"
        rightContent={
          <Button
            variant="outline" colorScheme="gray"
            className="shadow-sm"
            px={4}
            fontWeight="semibold"
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
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <Box>
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
            <Box>
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
          </SimpleGrid>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <Box>
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
            <Box>
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
          </SimpleGrid>
        </FormSection>

        {/* Address Information Section */}
        <FormSection title={t('customers.form.titles.addressInfo')} icon={MapPin}>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
            <Box gridColumn={{ base: '1', md: 'span 2' }}>
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
            <Box>
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
          </SimpleGrid>

          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
            <Box>
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
            <Box>
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
                <option value="AL">{t('states.AL')}</option>
                <option value="AK">{t('states.AK')}</option>
                <option value="AZ">{t('states.AZ')}</option>
                <option value="AR">{t('states.AR')}</option>
                <option value="CA">{t('states.CA')}</option>
                <option value="CO">{t('states.CO')}</option>
                <option value="CT">{t('states.CT')}</option>
                <option value="DE">{t('states.DE')}</option>
                <option value="FL">{t('states.FL')}</option>
                <option value="GA">{t('states.GA')}</option>
                <option value="HI">{t('states.HI')}</option>
                <option value="ID">{t('states.ID')}</option>
                <option value="IL">{t('states.IL')}</option>
                <option value="IN">{t('states.IN')}</option>
                <option value="IA">{t('states.IA')}</option>
                <option value="KS">{t('states.KS')}</option>
                <option value="KY">{t('states.KY')}</option>
                <option value="LA">{t('states.LA')}</option>
                <option value="ME">{t('states.ME')}</option>
                <option value="MD">{t('states.MD')}</option>
                <option value="MA">{t('states.MA')}</option>
                <option value="MI">{t('states.MI')}</option>
                <option value="MN">{t('states.MN')}</option>
                <option value="MS">{t('states.MS')}</option>
                <option value="MO">{t('states.MO')}</option>
                <option value="MT">{t('states.MT')}</option>
                <option value="NE">{t('states.NE')}</option>
                <option value="NV">{t('states.NV')}</option>
                <option value="NH">{t('states.NH')}</option>
                <option value="NJ">{t('states.NJ')}</option>
                <option value="NM">{t('states.NM')}</option>
                <option value="NY">{t('states.NY')}</option>
                <option value="NC">{t('states.NC')}</option>
                <option value="ND">{t('states.ND')}</option>
                <option value="OH">{t('states.OH')}</option>
                <option value="OK">{t('states.OK')}</option>
                <option value="OR">{t('states.OR')}</option>
                <option value="PA">{t('states.PA')}</option>
                <option value="RI">{t('states.RI')}</option>
                <option value="SC">{t('states.SC')}</option>
                <option value="SD">{t('states.SD')}</option>
                <option value="TN">{t('states.TN')}</option>
                <option value="TX">{t('states.TX')}</option>
                <option value="UT">{t('states.UT')}</option>
                <option value="VT">{t('states.VT')}</option>
                <option value="VA">{t('states.VA')}</option>
                <option value="WA">{t('states.WA')}</option>
                <option value="WV">{t('states.WV')}</option>
                <option value="WI">{t('states.WI')}</option>
                <option value="WY">{t('states.WY')}</option>
              </CustomFormSelect>
            </Box>
            <Box>
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
          </SimpleGrid>
        </FormSection>

        {/* Contact Information Section */}
        <FormSection title={t('customers.form.titles.contactInfo')} icon={Phone}>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <Box>
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
            <Box>
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
          </SimpleGrid>
        </FormSection>

        {/* Business Information Section */}
        <FormSection title={t('form.titles.businessInfo')} icon={Building}>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <Box>
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
            <Box>
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
          </SimpleGrid>

          <div>
            <FormLabel fontWeight="medium" color={useColorModeValue("gray.700", "gray.300")} mb={2}>{t('form.labels.notes')}</FormLabel>
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
            <Flex gap={3} justify="flex-end" className="form-buttons">
              <Button
                variant="outline" colorScheme="gray"
                size="lg"
                onClick={() => navigate('/customers')}
                px={4}
                fontWeight="semibold"
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
                isDisabled={isSubmitting}
                px={5}
                fontWeight="semibold"
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
                      <Text as="span" srOnly>{t('common.loading')}</Text>
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
            </Flex>
          </CardBody>
        </StandardCard>
      </form>
    </PageContainer>
  )
}

export default AddCustomerForm


