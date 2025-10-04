import StandardCard from '../../components/StandardCard'

import React, { useState, useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import { getContrastColor } from '../../utils/colorUtils'
import {
  Box,
  Button,
  CardBody,
  Container,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
  Textarea,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react'
import PageContainer from '../../components/PageContainer'
import PageHeader from '../../components/PageHeader'
import { User, Mail, ArrowLeft, Save, Edit, Phone, Building2, MapPin } from 'lucide-react'
import axiosInstance from '../../helpers/axiosInstance'
import { useParams, useNavigate } from 'react-router-dom'
import { decodeParam } from '../../utils/obfuscate'
import { useTranslation } from 'react-i18next'
import { ICON_SIZE_MD, ICON_BOX_MD } from '../../constants/iconSizes'

const FormSection = ({ title, icon, children }) => {
  const iconBg = useColorModeValue('blue.50', 'blue.900')
  const iconColor = useColorModeValue('blue.600', 'blue.300')
  const titleColor = useColorModeValue('gray.800', 'gray.200')

  return (
    <StandardCard variant="outline" borderRadius="xl" shadow="sm">
      <CardBody>
        <Stack spacing={4}>
          <Stack direction="row" align="center" spacing={4}>
            <Box
              w="40px"
              h="40px"
              borderRadius="full"
              bg={iconBg}
              color={iconColor}
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Icon as={icon} boxSize={ICON_BOX_MD} aria-hidden="true" />
            </Box>
            <Text fontWeight="semibold" color={titleColor}>
              {title}
            </Text>
          </Stack>
          {children}
        </Stack>
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
  inputRef,
  ...props
}) => {
  const labelColor = useColorModeValue('gray.700', 'gray.300')
  const iconColor = useColorModeValue('gray.500', 'gray.400')

  return (
    <FormControl isRequired={required} isInvalid={isInvalid} mb={4}>
      <FormLabel
        htmlFor={name}
        fontSize="sm"
        fontWeight="medium"
        color={labelColor}
      >
        {label}
      </FormLabel>
      <InputGroup>
        {icon && (
          <InputLeftElement pointerEvents="none">
            <Icon as={icon} boxSize={ICON_BOX_MD} color={iconColor} />
          </InputLeftElement>
        )}
        <Input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          ref={inputRef}
          placeholder={placeholder}
          borderRadius="md"
          fontSize="sm"
          minH="44px"
          {...props}
        />
      </InputGroup>
      {feedback && <FormErrorMessage>{feedback}</FormErrorMessage>}
    </FormControl>
  )
}

const CustomFormSelect = ({
  label,
  name,
  required = false,
  icon = null,
  value,
  onChange,
  isInvalid,
  feedback,
  inputRef,
  children,
  ...props
}) => {
  const labelColor = useColorModeValue('gray.700', 'gray.300')
  const iconColor = useColorModeValue('gray.500', 'gray.400')

  return (
    <FormControl isRequired={required} isInvalid={isInvalid} mb={4}>
      <FormLabel
        htmlFor={name}
        fontSize="sm"
        fontWeight="medium"
        color={labelColor}
      >
        {label}
      </FormLabel>
      <InputGroup>
        {icon && (
          <InputLeftElement pointerEvents="none">
            <Icon as={icon} boxSize={ICON_BOX_MD} color={iconColor} />
          </InputLeftElement>
        )}
        <Select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          ref={inputRef}
          borderRadius="md"
          fontSize="sm"
          minH="44px"
          pl={icon ? 10 : 4}
          {...props}
        >
          {children}
        </Select>
      </InputGroup>
      {feedback && <FormErrorMessage>{feedback}</FormErrorMessage>}
    </FormControl>
  )
}

const EditCustomerPage = () => {
  const { t } = useTranslation()
  const customization = useSelector((state) => state.customization)
  const toast = useToast()

  const headerBg = customization.headerBg || 'purple.500'
  const textColor = getContrastColor(headerBg)

  // Color mode values
  const spinnerColor = useColorModeValue('blue.500', 'blue.300')
  const loadingTextColor = useColorModeValue('gray.500', 'gray.400')
  const noteLabColor = useColorModeValue('gray.700', 'gray.300')

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
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const inputRefs = useRef({})
  const { customerId: rawCustomerId } = useParams()
  const customerId = decodeParam(rawCustomerId)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        setIsLoading(true)
        const res = await axiosInstance.get(`/api/customers/${customerId}`)
        setFormData({
          name: res.data?.name || '',
          email: res.data?.email || '',
          address: res.data?.address || '',
          aptOrSuite: res.data?.aptOrSuite || '',
          city: res.data?.city || '',
          state: res.data?.state || '',
          zipCode: res.data?.zipCode || '',
          homePhone: res.data?.homePhone || '',
          mobile: res.data?.mobile || '',
          leadSource: res.data?.leadSource || '',
          customerType: res.data?.customerType || 'Home Owner',
          defaultDiscount: res.data?.defaultDiscount ?? 0,
          companyName: res.data?.companyName || '',
          note: res.data?.note || '',
        })
      } catch (err) {
        console.error(err)
        toast({
          title: t('common.error'),
          description: t('customers.form.alerts.notFound'),
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
        navigate('/customers')
      } finally {
        setIsLoading(false)
      }
    }

    if (customerId) {
      fetchCustomer()
    }
  }, [customerId, navigate, t])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setValidationErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleNoteChange = (value) => {
    setFormData((prev) => ({ ...prev, note: value }))
  }

  const validateForm = () => {
    const errors = {}
    const requiredFields = [
      'name',
      'email',
      'address',
      'city',
      'state',
      'zipCode',
      'mobile',
      'leadSource',
    ]
    requiredFields.forEach((field) => {
      if (!formData[field]?.toString().trim()) {
        errors[field] = t('customers.form.validation.required')
      }
    })
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = t('customers.form.validation.invalidEmail')
    }
    if (formData.zipCode && !/^\d{5}$/.test(formData.zipCode)) {
      errors.zipCode = t('customers.form.validation.zip5')
    }
    if (formData.mobile && !/^\d{10}$/.test(formData.mobile)) {
      errors.mobile = t('customers.form.validation.mobile10')
    }
    return errors
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const errs = validateForm()
    setValidationErrors(errs)
    if (Object.keys(errs).length) {
      const first = Object.keys(errs)[0]
      inputRefs.current[first]?.focus()
      return
    }

    setIsSubmitting(true)
    try {
      await axiosInstance.put(`/api/customers/update/${customerId}`, formData)
      toast({
        title: t('customers.form.alerts.updatedTitle'),
        description: t('customers.form.alerts.updatedText'),
        status: 'success',
        duration: 2000,
        isClosable: true,
      })
      navigate('/customers')
    } catch (err) {
      console.error(err)
      toast({
        title: t('common.error'),
        description: t('customers.form.alerts.updateFailed'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <PageContainer>
        <StandardCard variant="outline" borderRadius="xl" shadow="sm">
          <CardBody textAlign="center" py={10}>
            <Spinner
              size="lg"
              color={spinnerColor}
              thickness="4px"
              speed="0.7s"
            />
            <Text mt={4} color={loadingTextColor}>
              {t('customers.loading')}
            </Text>
          </CardBody>
        </StandardCard>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <PageHeader
        title={t('customers.form.titles.edit')}
        subtitle={t(
          'customers.form.descriptions.edit',
          'Update customer profile with detailed information',
        )}
        icon={Edit}
        actions={[
          <Button
            key="back"
            variant="outline"
            colorScheme="gray"
            leftIcon={<Icon as={ArrowLeft} boxSize={ICON_BOX_MD} aria-hidden="true" />}
            onClick={() => navigate(-1)}
            minH="44px"
            maxW={{ base: '140px', md: 'none' }}
            fontSize={{ base: 'sm', md: 'md' }}
          >
            {t('common.back')}
          </Button>,
        ]}
      />

      <Box as="form" onSubmit={handleSubmit}>
        <Stack spacing={6}>
          <FormSection title={t('customers.form.titles.basicInfo')} icon={User}>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <CustomFormInput
                label={t('customers.form.labels.fullName')}
                name="name"
                required
                icon={User}
                placeholder={t('customers.form.placeholders.fullName')}
                value={formData.name}
                onChange={handleChange}
                isInvalid={!!validationErrors.name}
                feedback={validationErrors.name}
                inputRef={(el) => (inputRefs.current.name = el)}
              />
              <CustomFormInput
                label={t('customers.form.labels.email')}
                name="email"
                type="email"
                required
                icon={Mail}
                placeholder={t('customers.form.placeholders.email')}
                value={formData.email}
                onChange={handleChange}
                isInvalid={!!validationErrors.email}
                feedback={validationErrors.email}
                inputRef={(el) => (inputRefs.current.email = el)}
              />
              <CustomFormSelect
                label={t('customers.form.labels.customerType')}
                name="customerType"
                icon={User}
                value={formData.customerType}
                onChange={handleChange}
                isInvalid={!!validationErrors.customerType}
                feedback={validationErrors.customerType}
                inputRef={(el) => (inputRefs.current.customerType = el)}
              >
                <option value="Home Owner">{t('customers.form.types.homeOwner')}</option>
                <option value="Contractor">{t('customers.form.types.contractor')}</option>
                <option value="Company">{t('customers.form.types.company')}</option>
                <option value="Sub Contractor">{t('customers.form.types.subContractor')}</option>
              </CustomFormSelect>
              <CustomFormInput
                label={t('customers.form.labels.companyName')}
                name="companyName"
                icon={Building2}
                placeholder={t('customers.form.placeholders.companyName')}
                value={formData.companyName}
                onChange={handleChange}
                isInvalid={!!validationErrors.companyName}
                feedback={validationErrors.companyName}
                inputRef={(el) => (inputRefs.current.companyName = el)}
              />
            </SimpleGrid>
          </FormSection>

          <FormSection title={t('customers.form.titles.contactInfo')} icon={Phone}>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <CustomFormInput
                label={t('customers.form.labels.mobile')}
                name="mobile"
                required
                icon={Phone}
                placeholder={t('customers.form.placeholders.mobile')}
                value={formData.mobile}
                onChange={handleChange}
                isInvalid={!!validationErrors.mobile}
                feedback={validationErrors.mobile}
                inputRef={(el) => (inputRefs.current.mobile = el)}
              />
              <CustomFormInput
                label={t('customers.form.labels.homePhone')}
                name="homePhone"
                icon={Phone}
                placeholder={t('customers.form.placeholders.homePhone')}
                value={formData.homePhone}
                onChange={handleChange}
                isInvalid={!!validationErrors.homePhone}
                feedback={validationErrors.homePhone}
                inputRef={(el) => (inputRefs.current.homePhone = el)}
              />
            </SimpleGrid>
          </FormSection>

          <FormSection title={t('customers.form.titles.addressInfo')} icon={MapPin}>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <CustomFormInput
                label={t('customers.form.labels.address')}
                name="address"
                required
                placeholder={t('customers.form.placeholders.address')}
                value={formData.address}
                onChange={handleChange}
                isInvalid={!!validationErrors.address}
                feedback={validationErrors.address}
                inputRef={(el) => (inputRefs.current.address = el)}
              />
              <CustomFormInput
                label={t('customers.form.labels.aptOrSuite')}
                name="aptOrSuite"
                placeholder={t('customers.form.placeholders.aptOrSuite')}
                value={formData.aptOrSuite}
                onChange={handleChange}
                isInvalid={!!validationErrors.aptOrSuite}
                feedback={validationErrors.aptOrSuite}
                inputRef={(el) => (inputRefs.current.aptOrSuite = el)}
              />
              <CustomFormInput
                label={t('customers.form.labels.city')}
                name="city"
                required
                placeholder={t('customers.form.placeholders.city')}
                value={formData.city}
                onChange={handleChange}
                isInvalid={!!validationErrors.city}
                feedback={validationErrors.city}
                inputRef={(el) => (inputRefs.current.city = el)}
              />
              <CustomFormInput
                label={t('customers.form.labels.state')}
                name="state"
                required
                placeholder={t('customers.form.placeholders.state')}
                value={formData.state}
                onChange={handleChange}
                isInvalid={!!validationErrors.state}
                feedback={validationErrors.state}
                inputRef={(el) => (inputRefs.current.state = el)}
              />
              <CustomFormInput
                label={t('customers.form.labels.zipCode')}
                name="zipCode"
                required
                placeholder={t('customers.form.placeholders.zipCode')}
                value={formData.zipCode}
                onChange={handleChange}
                isInvalid={!!validationErrors.zipCode}
                feedback={validationErrors.zipCode}
                inputRef={(el) => (inputRefs.current.zipCode = el)}
              />
            </SimpleGrid>
          </FormSection>

          <FormSection title={t('customers.form.titles.businessInfo')} icon={Building2}>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <CustomFormInput
                label={t('customers.form.labels.leadSource')}
                name="leadSource"
                required
                placeholder={t('customers.form.placeholders.leadSource')}
                value={formData.leadSource}
                onChange={handleChange}
                isInvalid={!!validationErrors.leadSource}
                feedback={validationErrors.leadSource}
                inputRef={(el) => (inputRefs.current.leadSource = el)}
              />
              <CustomFormInput
                label={t('customers.form.labels.defaultDiscount')}
                name="defaultDiscount"
                type="number"
                min={0}
                max={100}
                placeholder={t('customers.form.placeholders.defaultDiscount')}
                value={formData.defaultDiscount}
                onChange={handleChange}
                isInvalid={!!validationErrors.defaultDiscount}
                feedback={validationErrors.defaultDiscount}
                inputRef={(el) => (inputRefs.current.defaultDiscount = el)}
              />
            </SimpleGrid>
            <FormControl mb={4}>
              <FormLabel
                fontSize="sm"
                fontWeight="medium"
                color={noteLabColor}
              >
                {t('customers.form.labels.notes')}
              </FormLabel>
              <Textarea
                id="note"
                name="note"
                rows={6}
                value={formData.note || ''}
                onChange={(event) => handleNoteChange(event.target.value)}
                placeholder={t('customers.form.placeholders.notes')}
                borderRadius="md"
                fontSize="sm"
              />
            </FormControl>
          </FormSection>

          <StandardCard variant="outline" borderRadius="xl" shadow="sm">
            <CardBody>
              <Stack direction={{ base: 'column', md: 'row' }} spacing={4} justify="flex-end">
                <Button
                  variant="outline"
                  colorScheme="gray"
                  onClick={() => navigate('/customers')}
                  minH="44px"
                  maxW={{ base: '140px', md: 'none' }}
                  leftIcon={<Icon as={ArrowLeft} boxSize={ICON_BOX_MD} aria-hidden="true" />}
                  fontSize={{ base: 'sm', md: 'md' }}
                >
                  {t('customers.form.actions.cancel')}
                </Button>
                <Button
                  type="submit"
                  colorScheme="brand"
                  minH="44px"
                  maxW={{ base: '140px', md: 'none' }}
                  isLoading={isSubmitting}
                  leftIcon={
                    !isSubmitting ? (
                      <Icon as={Save} boxSize={ICON_BOX_MD} aria-hidden="true" />
                    ) : undefined
                  }
                  bg={headerBg}
                  _hover={{ opacity: 0.9 }}
                  color={textColor}
                  fontSize={{ base: 'sm', md: 'md' }}
                >
                  {isSubmitting
                    ? t('customers.form.actions.updating')
                    : t('customers.form.actions.update')}
                </Button>
              </Stack>
            </CardBody>
          </StandardCard>
        </Stack>
      </Box>
    </PageContainer>
  )
}

export default EditCustomerPage
