import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import { decodeParam } from '../../utils/obfuscate'
import {
  Card,
  CardBody,
  CardHeader,
  Box,
  Flex,
  FormControl,
  Input,
  FormLabel,
  Textarea,
  Select,
  Spinner,
  Alert,
  Container,
  Button,
  InputGroup,
  InputLeftAddon,
  SimpleGrid,
  VStack,
  HStack,
  Text,
  FormErrorMessage,
} from '@chakra-ui/react'
import { User, Mail, Save, ArrowLeft, Phone, MapPin } from 'lucide-react'
import { createCustomer, updateCustomer, fetchCustomers } from '../../store/slices/customerSlice'
import withContractorScope from '../../components/withContractorScope'
import Swal from 'sweetalert2'
import { useTranslation } from 'react-i18next'
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
        Swal.fire(t('common.error'), t('customers.form.alerts.notFound'), 'error')
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

        Swal.fire(t('common.success'), t('customers.form.alerts.updatedText'), 'success')
      } else {
        await dispatch(createCustomer(formData)).unwrap()
        Swal.fire(t('common.success'), t('customers.form.alerts.createdText'), 'success')
      }

      navigate('/customers')
    } catch (error) {
      console.error('Form submission error:', error)
      Swal.fire(t('common.error'), error.message || t('customers.form.alerts.saveFailed'), 'error')
    }
  }

  const handleCancel = () => {
    navigate('/customers')
  }

  return (
    <Container maxW="7xl" py={6}>
      <Card variant="outline" borderRadius="xl" shadow="sm">
        <CardHeader>
          <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
            <VStack align="start" spacing={4}>
              <Text fontSize="xl" fontWeight="bold" color="gray.800">
                {isEditing ? t('customers.form.titles.edit') : t('customers.form.titles.add')}
              </Text>
              {isContractor && (
                <Text fontSize="sm" color="gray.600">
                  {contractorGroupName}
                </Text>
              )}
            </VStack>
            <Button
              variant="outline"
              leftIcon={<ArrowLeft size={18} />}
              onClick={handleCancel}
              colorScheme="gray"
              minH="44px"
            >
              {t('customers.form.actions.backToCustomers')}
            </Button>
          </Flex>
        </CardHeader>
            <CardBody>
              {error && (
                <Alert status="error">
                  {error}
                </Alert>
              )}

              <form onSubmit={handleSubmit}>
                <Flex>
                  <Box md={6}>
                    <div style={{ marginBottom: 'var(--sp-3)' }}>
                      <FormLabel htmlFor="name">
                        {t('customers.form.labels.fullName')} *
                      </FormLabel>
                      <InputGroup>
                        <InputLeftAddon>
                          <User size={18} />
                        </InputLeftAddon>
                        <Input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          isInvalid={!!formErrors.name}
                          required minH="44px"
                        />
                      </InputGroup>
                      {formErrors.name && (
                        <div className="invalid-feedback d-block">{formErrors.name}</div>
                      )}
                    </div>
                  </Box>

                  <Box md={6}>
                    <div style={{ marginBottom: 'var(--sp-3)' }}>
                      <FormLabel htmlFor="email">{t('customers.form.labels.email')}</FormLabel>
                      <InputGroup>
                        <InputLeftAddon>
                          <Mail size={18} />
                        </InputLeftAddon>
                        <Input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          isInvalid={!!formErrors.email}
                        />
                      </InputGroup>
                      {formErrors.email && (
                        <div className="invalid-feedback d-block">{formErrors.email}</div>
                      )}
                    </div>
                  </Box>
                </Flex>

                <Flex>
                  <Box md={6}>
                    <div>
                      <FormLabel htmlFor="mobile">{t('customers.form.labels.mobile')}</FormLabel>
                      <InputGroup>
                        <InputLeftAddon>
                          <Phone size={18} />
                        </InputLeftAddon>
                        <Input
                          type="tel"
                          id="mobile"
                          name="mobile"
                          value={formData.mobile}
                          onChange={handleInputChange}
                          isInvalid={!!formErrors.phone}
                        />
                      </InputGroup>
                    </div>
                  </Box>

                  <Box md={6}>
                    <div>
                      <FormLabel htmlFor="homePhone">
                        {t('customers.form.labels.homePhone')}
                      </FormLabel>
                      <InputGroup>
                        <InputLeftAddon>
                          <Phone size={18} />
                        </InputLeftAddon>
                        <Input
                          type="tel"
                          id="homePhone"
                          name="homePhone"
                          value={formData.homePhone}
                          onChange={handleInputChange}
                          isInvalid={!!formErrors.phone}
                        />
                      </InputGroup>
                      {formErrors.phone && (
                        <div className="invalid-feedback d-block">{formErrors.phone}</div>
                      )}
                    </div>
                  </Box>
                </Flex>

                <Flex>
                  <Box md={12}>
                    <div>
                      <FormLabel htmlFor="address">
                        {t('customers.form.labels.address')}
                      </FormLabel>
                      <InputGroup>
                        <InputLeftAddon>
                          <MapPin size={18} />
                        </InputLeftAddon>
                        <Input
                          type="text"
                          id="address"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                        />
                      </InputGroup>
                    </div>
                  </Box>
                </Flex>

                <Flex>
                  <Box md={3}>
                    <div>
                      <FormLabel htmlFor="aptOrSuite">
                        {t('customers.form.labels.aptSuite')}
                      </FormLabel>
                      <Input
                        type="text"
                        id="aptOrSuite"
                        name="aptOrSuite"
                        value={formData.aptOrSuite}
                        onChange={handleInputChange}
                      />
                    </div>
                  </Box>

                  <Box md={3}>
                    <div>
                      <FormLabel htmlFor="city">{t('customers.form.labels.city')}</FormLabel>
                      <Input
                        type="text"
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                      />
                    </div>
                  </Box>

                  <Box md={3}>
                    <div>
                      <FormLabel htmlFor="state">{t('customers.form.labels.state')}</FormLabel>
                      <Input
                        type="text"
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                      />
                    </div>
                  </Box>

                  <Box md={3}>
                    <div>
                      <FormLabel htmlFor="zipCode">
                        {t('customers.form.labels.zipCode')}
                      </FormLabel>
                      <Input
                        type="text"
                        id="zipCode"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleInputChange}
                      />
                    </div>
                  </Box>
                </Flex>

                <Flex>
                  <Box md={6}>
                    <div>
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
                    </div>
                  </Box>

                  <Box md={6}>
                    <div>
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
                    </div>
                  </Box>
                </Flex>

                <Flex>
                  <Box md={6}>
                    <div>
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
                    </div>
                  </Box>

                  <Box md={6}>
                    <div>
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
                    </div>
                  </Box>
                </Flex>

                <Flex>
                  <Box md={12}>
                    <div>
                      <FormLabel htmlFor="note">{t('customers.form.labels.notes')}</FormLabel>
                      <Textarea
                        id="note"
                        name="note"
                        rows="3"
                        value={formData.note}
                        onChange={handleInputChange}
                        placeholder={t('customers.form.placeholders.notes')}
                      />
                    </div>
                  </Box>
                </Flex>

                <div className="d-flex justify-content-end gap-2">
                  <Button type="button" variant="outline" colorScheme="gray" onClick={handleCancel} disabled={loading}>
                    {t('customers.form.actions.cancel')}
                  </Button>
                  <Button
                    type="submit"
                    colorScheme="blue"
                    disabled={loading}
                   
                  >
                    {loading ? <Spinner size="sm" /> : <Save size={18} />}
                    {isEditing
                      ? t('customers.form.actions.update')
                      : t('customers.form.actions.create')}
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
    </Container>
  )
}
export default withContractorScope(CustomerForm, 'customers')
