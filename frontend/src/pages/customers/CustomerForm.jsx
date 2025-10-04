import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import { decodeParam } from '../../utils/obfuscate'
import {
  Alert,
  Box,
  Button,
  CardBody,
  CardHeader,
  Container,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Input,
  InputGroup,
  InputLeftAddon,
  Select,
  SimpleGrid,
  Spinner,
  Text,
  Textarea,
  VStack,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react'
import PageContainer from '../../components/PageContainer'
import StandardCard from '../../components/StandardCard'
import { User, Mail, Save, ArrowLeft, Phone, MapPin } from 'lucide-react'
import { createCustomer, updateCustomer, fetchCustomers } from '../../store/slices/customerSlice'
import withContractorScope from '../../components/withContractorScope'
import { useTranslation } from 'react-i18next'
import { ICON_SIZE_MD, ICON_BOX_MD } from '../../constants/iconSizes'
const CustomerForm = ({
  isContractor,
  contractorGroupId,
  contractorModules,
  contractorGroupName,
}) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { id: rawId } = useParams()
  const id = decodeParam(rawId)
  const isEditing = Boolean(id)
  const { t } = useTranslation()
  const toast = useToast()

  // Color mode values - MUST be before useState
  const textColor = useColorModeValue('gray.800', 'gray.200')
  const subtextColor = useColorModeValue('gray.600', 'gray.400')
  const errorColor = useColorModeValue('red.500', 'red.300')

  const { loading, error } = useSelector((state) => state.customers)
  const customers = useSelector((state) => state.customers.list)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    homePhone: '',
    mobile: '',
    address: '',
    aptOrSuite: '',
    city: '',
    state: '',
    zipCode: '',
    companyName: '',
    customerType: '',
    leadSource: '',
    defaultDiscount: 0,
    note: '',
  })

  const [formErrors, setFormErrors] = useState({})

  // Load customer data for editing
  useEffect(() => {
    if (isEditing && customers.length > 0) {
      const customer = customers.find((c) => c.id === parseInt(id))
      if (customer) {
        setFormData({
          name: customer.name || '',
          email: customer.email || '',
          homePhone: customer.homePhone || '',
          mobile: customer.mobile || '',
          address: customer.address || '',
          aptOrSuite: customer.aptOrSuite || '',
          city: customer.city || '',
          state: customer.state || '',
          zipCode: customer.zipCode || '',
          companyName: customer.companyName || '',
          customerType: customer.customerType || '',
          leadSource: customer.leadSource || '',
          defaultDiscount: customer.defaultDiscount || 0,
          note: customer.note || '',
        })
      } else if (customers.length > 0) {
        // Customer not found, redirect back
        toast({
          title: t('common.error'),
          description: t('customers.form.alerts.notFound'),
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
        navigate('/customers')
      }
    }
  }, [isEditing, id, customers, navigate])

  // Load customers if editing and not loaded
  useEffect(() => {
    if (isEditing && customers.length === 0) {
      const groupId = isContractor ? contractorGroupId : null
      dispatch(fetchCustomers({ page: 1, limit: 1000, groupId }))
    }
  }, [isEditing, customers.length, dispatch, isContractor, contractorGroupId])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: '',
      }))
    }
  }

  const validateForm = () => {
    const errors = {}

    if (!formData.name.trim()) {
      errors.name = t('customers.form.validation.nameRequired')
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = t('customers.form.validation.invalidEmail')
    }

    if (!formData.mobile.trim() && !formData.homePhone.trim()) {
      errors.phone = t('customers.form.validation.phoneAtLeastOne')
    }

    return errors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const errors = validateForm()
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    try {
      if (isEditing) {
        await dispatch(
          updateCustomer({
            id: parseInt(id),
            customerData: formData,
          }),
        ).unwrap()

        toast({
          title: t('common.success'),
          description: t('customers.form.alerts.updatedText'),
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
      } else {
        await dispatch(createCustomer(formData)).unwrap()
        toast({
          title: t('common.success'),
          description: t('customers.form.alerts.createdText'),
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
      }

      navigate('/customers')
    } catch (error) {
      console.error('Form submission error:', error)
      toast({
        title: t('common.error'),
        description: error.message || t('customers.form.alerts.saveFailed'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  const handleCancel = () => {
    navigate('/customers')
  }

  return (
    <PageContainer>
      <StandardCard variant="outline" borderRadius="xl" shadow="sm">
        <CardHeader>
          <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
            <VStack align="start" spacing={4}>
              <Text fontSize="xl" fontWeight="bold" color={textColor}>
                {isEditing ? t('customers.form.titles.edit') : t('customers.form.titles.add')}
              </Text>
              {isContractor && (
                <Text fontSize="sm" color={subtextColor}>
                  {contractorGroupName}
                </Text>
              )}
            </VStack>
            <Button
              variant="outline"
              leftIcon={<ArrowLeft size={ICON_SIZE_MD} />}
              onClick={handleCancel}
              colorScheme="gray"
              minH="44px"
              maxW={{ base: '220px', md: 'none' }}
              fontSize={{ base: 'sm', md: 'md' }}
            >
              {t('customers.form.actions.backToCustomers')}
            </Button>
          </Flex>
        </CardHeader>
        <CardBody>
          {error && <Alert status="error">{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <FormControl isInvalid={!!formErrors.name} mb={3}>
                <FormLabel htmlFor="name">{t('customers.form.labels.fullName')} *</FormLabel>
                <InputGroup>
                  <InputLeftAddon>
                    <User size={ICON_SIZE_MD} />
                  </InputLeftAddon>
                  <Input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    minH="44px"
                  />
                </InputGroup>
                <FormErrorMessage color={errorColor}>{formErrors.name}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!formErrors.email} mb={3}>
                <FormLabel htmlFor="email">{t('customers.form.labels.email')}</FormLabel>
                <InputGroup>
                  <InputLeftAddon>
                    <Mail size={ICON_SIZE_MD} />
                  </InputLeftAddon>
                  <Input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </InputGroup>
                <FormErrorMessage color={errorColor}>{formErrors.email}</FormErrorMessage>
              </FormControl>
            </SimpleGrid>

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <FormControl isInvalid={!!formErrors.phone}>
                <FormLabel htmlFor="mobile">{t('customers.form.labels.mobile')}</FormLabel>
                <InputGroup>
                  <InputLeftAddon>
                    <Phone size={ICON_SIZE_MD} />
                  </InputLeftAddon>
                  <Input
                    type="tel"
                    id="mobile"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleInputChange}
                  />
                </InputGroup>
              </FormControl>

              <FormControl isInvalid={!!formErrors.phone}>
                <FormLabel htmlFor="homePhone">{t('customers.form.labels.homePhone')}</FormLabel>
                <InputGroup>
                  <InputLeftAddon>
                    <Phone size={ICON_SIZE_MD} />
                  </InputLeftAddon>
                  <Input
                    type="tel"
                    id="homePhone"
                    name="homePhone"
                    value={formData.homePhone}
                    onChange={handleInputChange}
                  />
                </InputGroup>
                <FormErrorMessage color={errorColor}>{formErrors.phone}</FormErrorMessage>
              </FormControl>
            </SimpleGrid>

            <SimpleGrid columns={{ base: 1 }} spacing={4}>
              <FormControl>
                <FormLabel htmlFor="address">{t('customers.form.labels.address')}</FormLabel>
                <InputGroup>
                  <InputLeftAddon>
                    <MapPin size={ICON_SIZE_MD} />
                  </InputLeftAddon>
                  <Input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                  />
                </InputGroup>
              </FormControl>
            </SimpleGrid>

            <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
              <FormControl>
                <FormLabel htmlFor="aptOrSuite">{t('customers.form.labels.aptSuite')}</FormLabel>
                <Input
                  type="text"
                  id="aptOrSuite"
                  name="aptOrSuite"
                  value={formData.aptOrSuite}
                  onChange={handleInputChange}
                />
              </FormControl>

              <FormControl>
                <FormLabel htmlFor="city">{t('customers.form.labels.city')}</FormLabel>
                <Input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                />
              </FormControl>

              <FormControl>
                <FormLabel htmlFor="state">{t('customers.form.labels.state')}</FormLabel>
                <Input
                  type="text"
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                />
              </FormControl>

              <FormControl>
                <FormLabel htmlFor="zipCode">{t('customers.form.labels.zipCode')}</FormLabel>
                <Input
                  type="text"
                  id="zipCode"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleInputChange}
                />
              </FormControl>
            </SimpleGrid>

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <FormControl>
                <FormLabel htmlFor="companyName">
                  {t('customers.form.labels.companyName')}
                </FormLabel>
                <Input
                  type="text"
                  id="companyName"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                />
              </FormControl>

              <FormControl>
                <FormLabel htmlFor="customerType">
                  {t('customers.form.labels.customerType')}
                </FormLabel>
                <Select
                  id="customerType"
                  name="customerType"
                  value={formData.customerType}
                  onChange={handleInputChange}
                >
                  <option value="">{t('customers.form.select.selectType')}</option>
                  <option value="Residential">{t('customers.form.types.residential')}</option>
                  <option value="Commercial">{t('customers.form.types.commercial')}</option>
                  <option value="Contractor">{t('customers.form.types.contractor')}</option>
                  <option value="Sub Contractor">
                    {t('customers.form.types.subContractor')}
                  </option>
                </Select>
              </FormControl>
            </SimpleGrid>

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <FormControl>
                <FormLabel htmlFor="leadSource">
                  {t('customers.form.labels.leadSource')}
                </FormLabel>
                <Select
                  id="leadSource"
                  name="leadSource"
                  value={formData.leadSource}
                  onChange={handleInputChange}
                >
                  <option value="">{t('customers.form.select.selectSource')}</option>
                  <option value="Website">{t('customers.form.sources.website')}</option>
                  <option value="Referral">{t('customers.form.sources.referral')}</option>
                  <option value="Google">{t('customers.form.sources.google')}</option>
                  <option value="Facebook">{t('customers.form.sources.facebook')}</option>
                  <option value="Phone Call">{t('customers.form.sources.phoneCall')}</option>
                  <option value="Walk-in">{t('customers.form.sources.walkIn')}</option>
                  <option value="Other">{t('customers.form.sources.other')}</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel htmlFor="defaultDiscount">
                  {t('customers.form.labels.defaultDiscount')}
                </FormLabel>
                <Input
                  type="number"
                  id="defaultDiscount"
                  name="defaultDiscount"
                  value={formData.defaultDiscount}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                />
              </FormControl>
            </SimpleGrid>

            <SimpleGrid columns={{ base: 1 }} spacing={4}>
              <FormControl>
                <FormLabel htmlFor="note">{t('customers.form.labels.notes')}</FormLabel>
                <Textarea
                  id="note"
                  name="note"
                  rows="3"
                  value={formData.note}
                  onChange={handleInputChange}
                  placeholder={t('customers.form.placeholders.notes')}
                />
              </FormControl>
            </SimpleGrid>

            <Flex justify="flex-end" gap={2}>
              <Button
                type="button"
                variant="outline"
                colorScheme="gray"
                onClick={handleCancel}
                isDisabled={loading}
                minH="44px"
                maxW={{ base: '140px', md: 'none' }}
                fontSize={{ base: 'sm', md: 'md' }}
              >
                {t('customers.form.actions.cancel')}
              </Button>
              <Button
                type="submit"
                colorScheme="brand"
                isDisabled={loading}
                minH="44px"
                maxW={{ base: '140px', md: 'none' }}
                fontSize={{ base: 'sm', md: 'md' }}
              >
                {loading ? <Spinner size="sm" /> : <Save size={ICON_SIZE_MD} />}
                {isEditing
                  ? t('customers.form.actions.update')
                  : t('customers.form.actions.create')}
              </Button>
            </Flex>
          </form>
        </CardBody>
      </StandardCard>
    </PageContainer>
  )
}
export default withContractorScope(CustomerForm, 'customers')
