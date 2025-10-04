import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Box,
  Button,
  CardBody,
  Checkbox,
  Collapse,
  Divider,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Heading,
  Icon,
  Input,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  useToast,
  useColorModeValue,
} from '@chakra-ui/react'
import StandardCard from '../../../components/StandardCard'
import CreatableCombobox from '../../../components/form/CreatableCombobox'
import { useForm, Controller } from 'react-hook-form'
import { motion, useReducedMotion } from 'framer-motion'
import axiosInstance from '../../../helpers/axiosInstance'
import { hasPermission } from '../../../helpers/permissions'
import { useSelector, useDispatch } from 'react-redux'
import { fetchUsers } from '../../../store/slices/userSlice'
import { fetchLocations } from '../../../store/slices/locationSlice'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ICON_BOX_MD } from '../../../constants/iconSizes'

const MotionButton = motion.create(Button)
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const mapCustomerToOption = (customer) => ({
  label: customer?.name ?? '',
  value: customer?.id ?? customer?.name ?? '',
  data: customer,
})

const mapUserToOption = (user) => ({ value: String(user.id), label: user.name })
const toStringValue = (value) => (value == null ? '' : String(value))

const CustomerInfoStep = ({
  formData,
  updateFormData,
  nextStep,
  prevStep,
  hideBack,
  isContractor,
  contractorGroupId,
}) => {
  const { t } = useTranslation()
  const toast = useToast()
  const prefersReducedMotion = useReducedMotion()

  const headingColor = useColorModeValue('gray.800', 'gray.200')
  const subheadingColor = useColorModeValue('gray.700', 'gray.200')

  const [showMoreOptions, setShowMoreOptions] = useState(false)
  const [isCreatingDesigner, setIsCreatingDesigner] = useState(false)
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false)
  const [customersLoading, setCustomersLoading] = useState(false)
  const [customerOptions, setCustomerOptions] = useState([])
  const [designerChoices, setDesignerChoices] = useState([])
  const [locationChoices, setLocationChoices] = useState([])
  const [leadSourceChoices, setLeadSourceChoices] = useState([])
  const [typeChoices, setTypeChoices] = useState([])
  const [salesRepChoices, setSalesRepChoices] = useState([])

  const dispatch = useDispatch()
  const { list: users, loading: usersLoading } = useSelector((state) => state.users)
  const { list: locations } = useSelector((state) => state.locations)
  const loggedInUser = JSON.parse(localStorage.getItem('user'))
  const loggedInUserId = loggedInUser?.userId

  const canAssignDesigner = hasPermission(loggedInUser, 'admin:users')

  const defaultValues = useMemo(
    () => ({
      customerId: formData.customerId || '',
      customerName: formData.customerName || '',
      customerEmail: formData.customerEmail || '',
      designer: canAssignDesigner ? toStringValue(formData.designer) : '',
      description: formData.description || '',
      measurementDone: !!formData.measurementDone,
      designDone: !!formData.designDone,
      measurementDate: formData.measurementDate || '',
      designDate: formData.designDate || '',
      location: formData.location || '',
      salesRep: formData.salesRep || '',
      leadSource: formData.leadSource || '',
      type: formData.type || '',
    }),
    [formData, canAssignDesigner],
  )

  const {
    control,
    register,
    handleSubmit,
    setValue,
    reset,
    getValues,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: 'onBlur',
    defaultValues,
    shouldUnregister: false,
  })

  const watchedCustomerId = watch('customerId')
  const watchedCustomerEmail = watch('customerEmail')
  const measurementDone = watch('measurementDone')
  const designDone = watch('designDone')

  useEffect(() => {
    reset(defaultValues)
  }, [defaultValues, reset])

  useEffect(() => {
    if (canAssignDesigner) {
      dispatch(fetchUsers())
    }
    dispatch(fetchLocations())
  }, [dispatch, canAssignDesigner])

  useEffect(() => {
    let url = '/api/customers'
    if (isContractor && contractorGroupId) {
      url += `?group_id=${contractorGroupId}`
    }

    setCustomersLoading(true)
    axiosInstance
      .get(url)
      .then((res) => {
        const options = (res?.data?.data || []).map(mapCustomerToOption)
        setCustomerOptions(options)
      })
      .catch((error) => {
        console.error('Error fetching customers:', error)
      })
      .finally(() => setCustomersLoading(false))
  }, [isContractor, contractorGroupId])

  const designerOptions = useMemo(
    () => users.filter((user) => user.role === 'Manufacturers').map(mapUserToOption),
    [users],
  )

  const locationOptions = useMemo(
    () =>
      locations.map((loc) => ({
        label: loc.locationName,
        value: loc.id != null ? String(loc.id) : loc.locationName,
      })),
    [locations],
  )

  const leadSourceOptions = useMemo(
    () => [
      { label: t('proposals.create.customerInfo.sources.existing'), value: 'Existing customer' },
      { label: t('proposals.create.customerInfo.sources.online'), value: 'Online' },
      { label: t('form.sources.walkIn'), value: 'Walk-in' },
      { label: t('form.sources.referral'), value: 'Referral' },
      { label: t('proposals.create.customerInfo.sources.call'), value: 'Call' },
      { label: t('proposals.create.customerInfo.sources.email'), value: 'Email' },
    ],
    [t],
  )

  const typeOptions = useMemo(
    () => [
      { label: t('form.types.homeOwner'), value: 'Home Owner' },
      { label: t('form.types.contractor'), value: 'Contractor' },
      { label: t('proposals.create.customerInfo.types.builder'), value: 'Builder' },
      { label: t('proposals.create.customerInfo.types.architect'), value: 'Architect' },
      { label: t('proposals.create.customerInfo.types.interiorDesigner'), value: 'Interior Designer' },
    ],
    [t],
  )

  useEffect(() => setDesignerChoices(designerOptions), [designerOptions])
  useEffect(() => setLocationChoices(locationOptions), [locationOptions])
  useEffect(() => setLeadSourceChoices(leadSourceOptions), [leadSourceOptions])
  useEffect(() => setTypeChoices(typeOptions), [typeOptions])
  useEffect(() => setSalesRepChoices(designerOptions), [designerOptions])

  useEffect(() => {
    if (!locations.length || formData.location) return
    const mainLocation = locations.find((loc) => loc.locationName.trim().toLowerCase() === 'main')
    if (mainLocation) {
      const nextValue = String(mainLocation.id)
      updateFormData({ location: nextValue })
      setValue('location', nextValue)
    }
  }, [locations, formData.location, setValue, updateFormData])

  useEffect(() => {
    if (!canAssignDesigner || !users.length || !loggedInUserId) return
    const currentUser = users.find((user) => user.id === loggedInUserId)
    const availableDesigners = users.filter((user) => user.role === 'Manufacturers')
    const isCurrentDesignerValid = availableDesigners.some(
      (designer) => toStringValue(designer.id) === toStringValue(formData.designer),
    )

    if (!formData.designer || !isCurrentDesignerValid) {
      if (currentUser && currentUser.role === 'Manufacturers') {
        const nextValue = toStringValue(currentUser.id)
        setValue('designer', nextValue)
        updateFormData({ designer: nextValue })
      } else if (availableDesigners.length > 0) {
        const firstDesigner = availableDesigners[0]
        const nextValue = toStringValue(firstDesigner.id)
        setValue('designer', nextValue)
        updateFormData({ designer: nextValue })
      }
    }
  }, [canAssignDesigner, users, formData.designer, loggedInUserId, setValue, updateFormData])

  const getCustomerOption = useCallback(
    (name, id, email) => {
      if (!name && !id) return null
      if (id) {
        const byId = customerOptions.find((option) => String(option.data?.id) === String(id))
        if (byId) return byId
      }
      if (name) {
        const byName = customerOptions.find((option) => option.label === name)
        if (byName) return byName
      }
      if (!name) return null
      return {
        label: name,
        value: name,
        data: { id: id || null, email: email || '' },
      }
    },
    [customerOptions],
  )

  const handleCustomerSelection = useCallback(
    (option) => {
      const name = option?.label ?? ''
      const email = option?.data?.email ?? ''
      const selectedId = option?.data?.id ? String(option.data.id) : ''

      setValue('customerName', name)
      setValue('customerEmail', email)
      setValue('customerId', selectedId)

      updateFormData({
        customerName: name,
        customerEmail: email,
        customerId: selectedId,
      })
    },
    [setValue, updateFormData],
  )

  const handleCustomerCreate = useCallback(
    async (inputValue) => {
      const name = String(inputValue || '').trim()
      if (!name) return null
      try {
        setIsCreatingCustomer(true)
        const values = getValues()
        const payload = {
          name,
          email: values.customerEmail || '',
          ...(isContractor && contractorGroupId ? { group_id: contractorGroupId } : {}),
        }
        const res = await axiosInstance.post('/api/customers/add', payload)
        const created = res?.data?.customer || res?.data
        if (!created) throw new Error('Invalid response when creating customer')

        const option = mapCustomerToOption(created)
        setCustomerOptions((prev) => [option, ...prev.filter((o) => o.value !== option.value)])
        toast({
          status: 'success',
          title: t('proposals.create.customerInfo.customerCreated', 'Customer created'),
          description: t('proposals.create.customerInfo.customerCreatedMsg', 'Customer was added.'),
        })
        return option
      } catch (error) {
        console.error('Error creating customer:', error)
        toast({
          status: 'error',
          title: t('proposals.create.customerInfo.customerCreateError', 'Unable to create customer'),
          description:
            error?.response?.data?.message ||
            error?.message ||
            t('common.errorGeneric', 'Something went wrong'),
        })
        return null
      } finally {
        setIsCreatingCustomer(false)
      }
    },
    [contractorGroupId, getValues, isContractor, t, toast],
  )

  const createNewDesigner = useCallback(
    async (designerName) => {
      const trimmed = String(designerName || '').trim()
      if (!trimmed) return null
      try {
        setIsCreatingDesigner(true)
        const tempEmail = `${trimmed.toLowerCase().replace(/\s+/g, '.')}@designer.local`
        const response = await axiosInstance.post('/api/users', {
          name: trimmed,
          email: tempEmail,
          password: 'temppassword123',
          role: 'Manufacturers',
          isSalesRep: false,
          location: null,
          userGroup: null,
        })
        if (response.status === 200 || response.status === 201) {
          const newDesigner = response.data.user
          const option = mapUserToOption(newDesigner)
          setDesignerChoices((prev) => [option, ...prev.filter((opt) => opt.value !== option.value)])
          setSalesRepChoices((prev) => [option, ...prev.filter((opt) => opt.value !== option.value)])
          dispatch(fetchUsers())
          toast({
            status: 'success',
            title: t('proposals.create.customerInfo.designerCreated', 'Designer created'),
            description: t('proposals.create.customerInfo.designerCreatedMsg', 'Designer is now available.'),
          })
          return option
        }
        return null
      } catch (error) {
        console.error('Error creating designer:', error)
        toast({
          status: 'error',
          title: t('proposals.create.customerInfo.designerCreateError', 'Unable to create designer'),
          description:
            error?.response?.data?.message ||
            error?.message ||
            t('common.errorGeneric', 'Something went wrong'),
        })
        return null
      } finally {
        setIsCreatingDesigner(false)
      }
    },
    [dispatch, t, toast],
  )

  const handleSecondarySelect = useCallback(
    ({ fieldName, value }) => {
      const resolved = value == null ? '' : value
      setValue(fieldName, resolved)
      updateFormData({ [fieldName]: resolved })
    },
    [setValue, updateFormData],
  )

  const createSimpleOption = useCallback((label) => {
    const value = label.trim()
    if (!value) return null
    return { label: value, value }
  }, [])

  const onSubmit = (values) => {
    updateFormData(values)
    nextStep()
  }

  const toggleMoreOptions = () => setShowMoreOptions((prev) => !prev)

  return (
    <Box w="full" my={4}>
      <StandardCard shadow="md" borderRadius="xl">
        <CardBody p={{ base: 4, md: 6 }}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Stack spacing={6}>
              <Flex justify="space-between" align={{ base: 'stretch', md: 'center' }} flexDir={{ base: 'column', md: 'row' }} gap={4}>
                <Heading size="md" color={headingColor}>
                  {t('proposals.create.customerInfo.title')}
                </Heading>
                {!hideBack && (
                  <MotionButton
                    variant="outline"
                    colorScheme="gray"
                    onClick={prevStep}
                    whileTap={{ scale: 0.98 }}
                    alignSelf={{ base: 'flex-start', md: 'center' }}
                  >
                    {t('common.back')}
                  </MotionButton>
                )}
              </Flex>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                <Controller
                  control={control}
                  name="customerName"
                  rules={{ required: t('form.validation.required', 'This field is required') }}
                  render={({ field, fieldState }) => {
                    const selectedOption = getCustomerOption(field.value, watchedCustomerId, watchedCustomerEmail)
                    return (
                      <FormControl isInvalid={!!fieldState.error} isRequired>
                        <FormLabel htmlFor="customerName">
                          {t('proposals.create.customerInfo.customerName')}
                        </FormLabel>
                        <CreatableCombobox
                          id="customerName"
                          value={selectedOption}
                          options={customerOptions}
                          placeholder={t('proposals.create.customerInfo.customerNamePlaceholder')}
                          onChange={(option) => {
                            field.onChange(option?.label ?? '')
                            handleCustomerSelection(option)
                          }}
                          onCreateOption={handleCustomerCreate}
                          isLoading={customersLoading}
                          isCreating={isCreatingCustomer}
                          createOptionLabel={(name) =>
                            t('proposals.create.customerInfo.createCustomer', {
                              name,
                            })
                          }
                          renderOption={(option) => (
                            <Stack spacing={0} align="flex-start">
                              <Text fontWeight="medium">{option.label}</Text>
                              {option.data?.email && (
                                <Text fontSize="sm" color="gray.500">
                                  {option.data.email}
                                </Text>
                              )}
                            </Stack>
                          )}
                          noOptionsMessage={t('proposals.create.customerInfo.noCustomers', 'No customers found')}
                        />
                        <FormErrorMessage>{fieldState.error?.message}</FormErrorMessage>
                      </FormControl>
                    )
                  }}
                />

                <FormControl isInvalid={!!errors.customerEmail}>
                  <FormLabel htmlFor="customerEmail">
                    {t('proposals.create.customerInfo.customerEmail')}
                  </FormLabel>
                  <Input
                    id="customerEmail"
                    type="email"
                    placeholder={t('proposals.create.customerInfo.customerEmailPlaceholder')}
                    {...register('customerEmail', {
                      pattern: {
                        value: emailPattern,
                        message: t('form.validation.email', 'Enter a valid email address'),
                      },
                      onChange: (event) => {
                        updateFormData({ customerEmail: event.target.value })
                      },
                    })}
                  />
                  <FormErrorMessage>{errors.customerEmail && errors.customerEmail.message}</FormErrorMessage>
                </FormControl>
              </SimpleGrid>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                {canAssignDesigner && (
                  <Controller
                    control={control}
                    name="designer"
                    rules={{ required: t('proposals.create.customerInfo.validation.designer') }}
                    render={({ field, fieldState }) => (
                      <FormControl isRequired isInvalid={!!fieldState.error}>
                        <FormLabel htmlFor="designer">
                          {t('proposals.create.customerInfo.designer')}
                        </FormLabel>
                        <CreatableCombobox
                          id="designer"
                          value={designerChoices.find((option) => option.value === field.value) || null}
                          options={designerChoices}
                          placeholder={t('proposals.create.customerInfo.designerPlaceholder', 'Select a designer')}
                          onChange={(option) => {
                            const nextValue = option ? option.value : ''
                            field.onChange(nextValue)
                            handleSecondarySelect({ fieldName: 'designer', value: nextValue })
                          }}
                          onCreateOption={createNewDesigner}
                          isLoading={usersLoading}
                          isCreating={isCreatingDesigner}
                          createOptionLabel={(name) =>
                            t('proposals.create.customerInfo.createDesigner', { name })
                          }
                        />
                        <FormErrorMessage>{fieldState.error?.message}</FormErrorMessage>
                      </FormControl>
                    )}
                  />
                )}

                <FormControl isRequired isInvalid={!!errors.description}>
                  <FormLabel htmlFor="description">
                    {t('proposals.create.customerInfo.description')}
                  </FormLabel>
                  <Textarea
                    id="description"
                    rows={4}
                    placeholder={t('proposals.create.customerInfo.descriptionPlaceholder')}
                    {...register('description', {
                      required: t('form.validation.required', 'This field is required'),
                      onChange: (event) => updateFormData({ description: event.target.value }),
                    })}
                  />
                  <FormErrorMessage>{errors.description && errors.description.message}</FormErrorMessage>
                </FormControl>
              </SimpleGrid>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                <FormControl>
                  <Stack spacing={4}>
                    <Controller
                      name="measurementDone"
                      control={control}
                      render={({ field }) => (
                        <Checkbox
                          isChecked={field.value}
                          onChange={(event) => {
                            const checked = event.target.checked
                            field.onChange(checked)
                            updateFormData({ measurementDone: checked })
                            if (!checked) {
                              setValue('measurementDate', '')
                              updateFormData({ measurementDate: '' })
                            }
                          }}
                        >
                          {t('proposals.create.customerInfo.measurementDone')}
                        </Checkbox>
                      )}
                    />
                    {measurementDone && (
                      <FormControl isInvalid={!!errors.measurementDate}>
                        <FormLabel htmlFor="measurementDate">
                          {t('proposals.create.customerInfo.measurementDoneDate')}
                        </FormLabel>
                        <Input
                          id="measurementDate"
                          type="date"
                          value={getValues('measurementDate')?.slice(0, 10) || ''}
                          onChange={(event) => {
                            const value = event.target.value
                            setValue('measurementDate', value)
                            updateFormData({ measurementDate: value })
                          }}
                        />
                        <FormErrorMessage>{errors.measurementDate?.message}</FormErrorMessage>
                      </FormControl>
                    )}
                  </Stack>
                </FormControl>

                <FormControl>
                  <Stack spacing={4}>
                    <Controller
                      name="designDone"
                      control={control}
                      render={({ field }) => (
                        <Checkbox
                          isChecked={field.value}
                          onChange={(event) => {
                            const checked = event.target.checked
                            field.onChange(checked)
                            updateFormData({ designDone: checked })
                            if (!checked) {
                              setValue('designDate', '')
                              updateFormData({ designDate: '' })
                            }
                          }}
                        >
                          {t('proposals.create.customerInfo.designDone')}
                        </Checkbox>
                      )}
                    />
                    {designDone && (
                      <FormControl isInvalid={!!errors.designDate}>
                        <FormLabel htmlFor="designDate">
                          {t('proposals.create.customerInfo.designDoneDate')}
                        </FormLabel>
                        <Input
                          id="designDate"
                          type="date"
                          value={getValues('designDate')?.slice(0, 10) || ''}
                          onChange={(event) => {
                            const value = event.target.value
                            setValue('designDate', value)
                            updateFormData({ designDate: value })
                          }}
                        />
                        <FormErrorMessage>{errors.designDate?.message}</FormErrorMessage>
                      </FormControl>
                    )}
                  </Stack>
                </FormControl>
              </SimpleGrid>

              <Box>
                <MotionButton
                  variant="link"
                  colorScheme="brand"
                  onClick={toggleMoreOptions}
                  rightIcon={<Icon as={showMoreOptions ? ChevronUp : ChevronDown} boxSize={ICON_BOX_MD} />}
                  whileTap={{ scale: 0.98 }}
                  aria-expanded={showMoreOptions}
                  aria-controls="customer-more-options"
                >
                  {showMoreOptions
                    ? t('proposals.create.customerInfo.hideOptions')
                    : t('proposals.create.customerInfo.moreOptions')}
                </MotionButton>

                <Collapse in={showMoreOptions} animateOpacity={!prefersReducedMotion} id="customer-more-options">
                  <Stack spacing={6} mt={4}>
                    <Divider />
                    <Text fontSize="lg" fontWeight="semibold" color={subheadingColor}>
                      {t('proposals.create.customerInfo.additionalInfo')}
                    </Text>

                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                      <Controller
                        control={control}
                        name="location"
                        render={({ field }) => (
                          <FormControl isInvalid={!!errors.location}>
                            <FormLabel htmlFor="location">{t('profile.location')}</FormLabel>
                            <CreatableCombobox
                              id="location"
                              value={locationChoices.find((option) => option.value === field.value) || null}
                              options={locationChoices}
                              placeholder={t('proposals.create.customerInfo.locationPlaceholder', 'Select a location')}
                              onChange={(option) => {
                                const nextValue = option ? option.value : ''
                                field.onChange(nextValue)
                                handleSecondarySelect({ fieldName: 'location', value: nextValue })
                              }}
                              onCreateOption={(label) => {
                                const option = createSimpleOption(label)
                                if (option) {
                                  setLocationChoices((prev) => [option, ...prev])
                                }
                                return option
                              }}
                            />
                            <FormErrorMessage>{errors.location && errors.location.message}</FormErrorMessage>
                          </FormControl>
                        )}
                      />

                      <Controller
                        control={control}
                        name="salesRep"
                        render={({ field }) => (
                          <FormControl isInvalid={!!errors.salesRep}>
                            <FormLabel htmlFor="salesRep">
                              {t('proposals.create.customerInfo.salesRep')}
                            </FormLabel>
                            <CreatableCombobox
                              id="salesRep"
                              value={salesRepChoices.find((option) => option.value === field.value) || null}
                              options={salesRepChoices}
                              placeholder={t('proposals.create.customerInfo.salesRepPlaceholder', 'Select a sales representative')}
                              onChange={(option) => {
                                const nextValue = option ? option.value : ''
                                field.onChange(nextValue)
                                handleSecondarySelect({ fieldName: 'salesRep', value: nextValue })
                              }}
                              onCreateOption={(label) => {
                                const option = createSimpleOption(label)
                                if (option) {
                                  setSalesRepChoices((prev) => [option, ...prev])
                                }
                                return option
                              }}
                            />
                            <FormErrorMessage>{errors.salesRep && errors.salesRep.message}</FormErrorMessage>
                          </FormControl>
                        )}
                      />
                    </SimpleGrid>

                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                      <Controller
                        control={control}
                        name="leadSource"
                        render={({ field }) => (
                          <FormControl>
                            <FormLabel htmlFor="leadSource">{t('form.labels.leadSource')}</FormLabel>
                            <CreatableCombobox
                              id="leadSource"
                              value={leadSourceChoices.find((option) => option.value === field.value) || null}
                              options={leadSourceChoices}
                              placeholder={t('form.labels.leadSourcePlaceholder', 'Select lead source')}
                              onChange={(option) => {
                                const nextValue = option ? option.value : ''
                                field.onChange(nextValue)
                                handleSecondarySelect({ fieldName: 'leadSource', value: nextValue })
                              }}
                              onCreateOption={(label) => {
                                const option = createSimpleOption(label)
                                if (option) {
                                  setLeadSourceChoices((prev) => [option, ...prev])
                                }
                                return option
                              }}
                            />
                          </FormControl>
                        )}
                      />

                      <Controller
                        control={control}
                        name="type"
                        render={({ field }) => (
                          <FormControl>
                            <FormLabel htmlFor="type">{t('proposals.create.customerInfo.type')}</FormLabel>
                            <CreatableCombobox
                              id="type"
                              value={typeChoices.find((option) => option.value === field.value) || null}
                              options={typeChoices}
                              placeholder={t('proposals.create.customerInfo.typePlaceholder', 'Select type')}
                              onChange={(option) => {
                                const nextValue = option ? option.value : ''
                                field.onChange(nextValue)
                                handleSecondarySelect({ fieldName: 'type', value: nextValue })
                              }}
                              onCreateOption={(label) => {
                                const option = createSimpleOption(label)
                                if (option) {
                                  setTypeChoices((prev) => [option, ...prev])
                                }
                                return option
                              }}
                            />
                          </FormControl>
                        )}
                      />
                    </SimpleGrid>
                  </Stack>
                </Collapse>
              </Box>

              <HStack justify="flex-end">
                <MotionButton
                  type="submit"
                  colorScheme="brand"
                  size="lg"
                  minW="120px"
                  isLoading={isSubmitting}
                  whileTap={{ scale: 0.98 }}
                >
                  {t('common.next', 'Next')}
                </MotionButton>
              </HStack>
            </Stack>
          </form>
        </CardBody>
      </StandardCard>
    </Box>
  )
}

export default CustomerInfoStep
