import { useState, useEffect, useMemo } from 'react'
import { Box, Flex, FormControl, FormLabel, FormErrorMessage, Input, Checkbox, SimpleGrid, Button, useToast, HStack, Text, Collapse, Textarea, Stack, Icon, Divider, Heading } from '@chakra-ui/react'
import StandardCard from '../../../components/StandardCard'
import { useForm, Controller } from 'react-hook-form'
import CreatableSelect from 'react-select/creatable'
import { motion, useReducedMotion } from 'framer-motion'
import axiosInstance from '../../../helpers/axiosInstance'
import { hasPermission } from '../../../helpers/permissions'
import { useSelector, useDispatch } from 'react-redux'
import { fetchUsers } from '../../../store/slices/userSlice'
import { fetchLocations } from '../../../store/slices/locationSlice'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ICON_SIZE_MD, ICON_BOX_MD } from '../../../constants/iconSizes'

const MotionButton = motion(Button)
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const buildSelectStyles = (hasError) => ({
  control: (provided, state) => ({
    ...provided,
    minHeight: '44px',
    borderColor: hasError ? 'red.500' : state.isFocused ? 'blue.500' : provided.borderColor,
    boxShadow: 'none',
    '&:hover': {
      bordercolor: "blue.500",
    },
  }),
  menu: (provided) => ({
    ...provided,
    zIndex: 20,
  }),
  option: (provided, state) => ({
    ...provided,
    fontSize: "md",
    backgroundColor: state.isFocused ? 'blue.50' : provided.backgroundColor,
    color: state.isFocused ? 'gray.800' : provided.color,
  }),
  valueContainer: (provided) => ({
    ...provided,
    padding: '0.25rem 0.75rem',
  }),
  indicatorsContainer: (provided) => ({
    ...provided,
    paddingRight: '0.5rem',
  }),
})

const CustomerInfoStep = ({
  formData,
  updateFormData,
  nextStep,
  prevStep,
  hideBack,
  isContractor,
  contractorGroupId,
}) => {
  const [showMoreOptions, setShowMoreOptions] = useState(false)
  const [isCreatingDesigner, setIsCreatingDesigner] = useState(false)
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false)
  const { t } = useTranslation()
  const toast = useToast()
  const prefersReducedMotion = useReducedMotion()
  const [customerOptions, setCustomerOptions] = useState([])
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
      designer: formData.designer || '',
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
    [formData],
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

    axiosInstance
      .get(url)
      .then((res) => {
        const options = (res?.data?.data || []).map((data) => ({
          label: data.name,
          value: data.name,
          data,
        }))
        setCustomerOptions(options)
      })
      .catch((error) => {
        console.error('Error fetching customers:', error)
      })
  }, [isContractor, contractorGroupId])

  useEffect(() => {
    if (!locations.length || formData.location) return
    const mainLocation = locations.find((loc) => loc.locationName.trim().toLowerCase() === 'main')
    if (mainLocation) {
      updateFormData({ location: mainLocation.id.toString() })
      setValue('location', mainLocation.id.toString())
    }
  }, [locations, formData.location, setValue, updateFormData])

  useEffect(() => {
    if (!canAssignDesigner || !users.length || !loggedInUserId) return
    const currentUser = users.find((user) => user.id === loggedInUserId)
    const availableDesigners = users.filter((user) => user.role === 'Manufacturers')
    const isCurrentDesignerValid = availableDesigners.some((designer) => designer.id === formData.designer)

    if (!formData.designer || !isCurrentDesignerValid) {
      if (currentUser && currentUser.role === 'Manufacturers') {
        setValue('designer', currentUser.id)
        updateFormData({ designer: currentUser.id })
      } else if (availableDesigners.length > 0) {
        const firstDesigner = availableDesigners[0]
        setValue('designer', firstDesigner.id)
        updateFormData({ designer: firstDesigner.id })
      }
    }
  }, [canAssignDesigner, users, formData.designer, loggedInUserId, setValue, updateFormData])

  const designerOptions = useMemo(
    () =>
      users
        .filter((user) => user.role === 'Manufacturers')
        .map((user) => ({ value: user.id, label: user.name })),
    [users],
  )

  const locationOptions = useMemo(
    () =>
      locations.map((loc) => ({
        label: loc.locationName,
        value: loc.id.toString(),
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

  const measurementDone = watch('measurementDone')
  const designDone = watch('designDone')

  const getCustomerOption = (value) =>
    customerOptions.find((opt) => opt.value === value) || (value ? { label: value, value } : null)

  const getSimpleOption = (value, options) => options.find((opt) => opt.value === value) || null

  const handleCreateCustomer = async (inputValue) => {
    const name = String(inputValue || '').trim()
    if (!name) return

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
      const newOption = {
        label: created?.name || name,
        value: created?.name || name,
        data: created,
      }

      setCustomerOptions((prev) => [newOption, ...prev.filter((opt) => opt.value !== newOption.value)])

      const customerEmail = created?.email || values.customerEmail || ''
      const customerId = created?.id || ''

      setValue('customerName', newOption.value, { shouldValidate: true })
      setValue('customerEmail', customerEmail, { shouldValidate: true })
      setValue('customerId', customerId)
      updateFormData({
        customerName: newOption.value,
        customerEmail,
        customerId,
      })

      toast({
        status: 'success',
        title: t('proposals.create.customerInfo.customerCreated', 'Customer created'),
        description: `"${newOption.value}" ${t('proposals.create.customerInfo.customerCreatedMsg', 'was added.')}`,
      })
    } catch (error) {
      const message =
        error?.response?.data?.message || error?.message || t('common.errorGeneric', 'Something went wrong')
      toast({
        status: 'error',
        title: t('proposals.create.customerInfo.customerCreateError', 'Unable to create customer'),
        description: message,
      })
    } finally {
      setIsCreatingCustomer(false)
    }
  }

  const createNewDesigner = async (designerName) => {
    const trimmed = String(designerName || '').trim()
    if (!trimmed) return null

    try {
      setIsCreatingDesigner(true)
      const tempEmail = `${trimmed.toLowerCase().replace(/\s+/g, '.') }@designer.local`

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
        await dispatch(fetchUsers())
        const newDesigner = response.data.user
        toast({
          status: 'success',
          title: t('proposals.create.customerInfo.designerCreated', 'Designer created'),
          description: `"${trimmed}" ${t('proposals.create.customerInfo.designerCreatedMsg', 'is now available.')}`,
        })
        return newDesigner
      }

      return null
    } catch (error) {
      const message =
        error?.response?.data?.message || error?.message || t('common.errorGeneric', 'Something went wrong')
      toast({
        status: 'error',
        title: t('proposals.create.customerInfo.designerCreateError', 'Unable to create designer'),
        description: message,
      })
      return null
    } finally {
      setIsCreatingDesigner(false)
    }
  }

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
                <Heading size="md" color="gray.800">
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
                <FormControl isInvalid={!!errors.customerName} isRequired>
                  <FormLabel htmlFor="customerName">
                    {t('proposals.create.customerInfo.customerName')}
                  </FormLabel>
                  <Controller
                    name="customerName"
                    control={control}
                    rules={{ required: t('form.validation.required', 'This field is required') }}
                    render={({ field }) => (
                      <CreatableSelect
                        inputId="customerName"
                        styles={buildSelectStyles(!!errors.customerName)}
                        isClearable
                        isLoading={usersLoading || isCreatingCustomer}
                        isDisabled={isCreatingCustomer}
                        options={customerOptions}
                        value={getCustomerOption(field.value)}
                        onChange={(option) => {
                          const name = option?.value || ''
                          const email = option?.data?.email || getValues('customerEmail') || ''
                          const customerId = option?.data?.id || ''
                          field.onChange(name)
                          setValue('customerEmail', email, { shouldValidate: true })
                          setValue('customerId', customerId)
                          updateFormData({
                            customerName: name,
                            customerEmail: email,
                            customerId,
                          })
                        }}
                        onCreateOption={handleCreateCustomer}
                        onBlur={field.onBlur}
                        placeholder={t('proposals.create.customerInfo.customerNamePlaceholder')}
                      />
                    )}
                  />
                  <FormErrorMessage>{errors.customerName && errors.customerName.message}</FormErrorMessage>
                </FormControl>

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
                  <FormControl isInvalid={!!errors.designer} isRequired>
                    <FormLabel htmlFor="designer">
                      {t('proposals.create.customerInfo.designer')}
                    </FormLabel>
                    <Controller
                      name="designer"
                      control={control}
                      rules={{ required: t('form.validation.required', 'This field is required') }}
                      render={({ field }) => (
                        <CreatableSelect
                          inputId="designer"
                          styles={buildSelectStyles(!!errors.designer)}
                          isClearable
                          isDisabled={isCreatingDesigner}
                          isLoading={isCreatingDesigner}
                          options={designerOptions}
                          value={getSimpleOption(field.value, designerOptions)}
                          onChange={(option) => {
                            const id = option?.value || ''
                            field.onChange(id)
                            updateFormData({ designer: id })
                          }}
                          onCreateOption={async (inputValue) => {
                            const newDesigner = await createNewDesigner(inputValue)
                            if (newDesigner) {
                              setValue('designer', newDesigner.id, { shouldValidate: true })
                              updateFormData({ designer: newDesigner.id })
                            }
                          }}
                          onBlur={field.onBlur}
                          placeholder={
                            isCreatingDesigner
                              ? t('proposals.create.customerInfo.creatingDesigner', 'Creating designer...')
                              : t('proposals.create.customerInfo.designerPlaceholder', 'Select or create a designer')
                          }
                        />
                      )}
                    />
                    <FormErrorMessage>{errors.designer && errors.designer.message}</FormErrorMessage>
                  </FormControl>
                )}

                <FormControl isInvalid={!!errors.description} isRequired>
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
                              setValue('measurementDate', '', { shouldValidate: true })
                              updateFormData({ measurementDate: '' })
                            }
                          }}
                        >
                          {t('proposals.create.customerInfo.measurementDone')}
                        </Checkbox>
                      )}
                    />
                    {measurementDone && (
                      <Controller
                        name="measurementDate"
                        control={control}
                        rules={{
                          required: t('form.validation.required', 'This field is required'),
                        }}
                        render={({ field }) => (
                          <FormControl isInvalid={!!errors.measurementDate}>
                            <FormLabel htmlFor="measurementDate">
                              {t('proposals.create.customerInfo.measurementDoneDate')}
                            </FormLabel>
                            <Input
                              id="measurementDate"
                              type="date"
                              value={field.value ? field.value.substring(0, 10) : ''}
                              onChange={(event) => {
                                const value = event.target.value
                                field.onChange(value)
                                updateFormData({ measurementDate: value })
                              }}
                            />
                            <FormErrorMessage>
                              {errors.measurementDate && errors.measurementDate.message}
                            </FormErrorMessage>
                          </FormControl>
                        )}
                      />
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
                              setValue('designDate', '', { shouldValidate: true })
                              updateFormData({ designDate: '' })
                            }
                          }}
                        >
                          {t('proposals.create.customerInfo.designDone')}
                        </Checkbox>
                      )}
                    />
                    {designDone && (
                      <Controller
                        name="designDate"
                        control={control}
                        rules={{
                          required: t('form.validation.required', 'This field is required'),
                        }}
                        render={({ field }) => (
                          <FormControl isInvalid={!!errors.designDate}>
                            <FormLabel htmlFor="designDate">
                              {t('proposals.create.customerInfo.designDoneDate')}
                            </FormLabel>
                            <Input
                              id="designDate"
                              type="date"
                              value={field.value ? field.value.substring(0, 10) : ''}
                              onChange={(event) => {
                                const value = event.target.value
                                field.onChange(value)
                                updateFormData({ designDate: value })
                              }}
                            />
                            <FormErrorMessage>
                              {errors.designDate && errors.designDate.message}
                            </FormErrorMessage>
                          </FormControl>
                        )}
                      />
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
                    <Text fontSize="lg" fontWeight="semibold" color="gray.700">
                      {t('proposals.create.customerInfo.additionalInfo')}
                    </Text>

                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                      <FormControl isInvalid={!!errors.location} isRequired>
                        <FormLabel htmlFor="location">{t('profile.location')}</FormLabel>
                        <Controller
                          name="location"
                          control={control}
                          rules={{ required: t('form.validation.required', 'This field is required') }}
                          render={({ field }) => (
                            <CreatableSelect
                              inputId="location"
                              styles={buildSelectStyles(!!errors.location)}
                              isClearable
                              options={locationOptions}
                              value={getSimpleOption(field.value, locationOptions)}
                              onChange={(option) => {
                                const value = option?.value || ''
                                field.onChange(value)
                                updateFormData({ location: value })
                              }}
                              onBlur={field.onBlur}
                              placeholder={t('proposals.create.customerInfo.locationPlaceholder', 'Select a location')}
                            />
                          )}
                        />
                        <FormErrorMessage>{errors.location && errors.location.message}</FormErrorMessage>
                      </FormControl>

                      <FormControl isInvalid={!!errors.salesRep}>
                        <FormLabel htmlFor="salesRep">
                          {t('proposals.create.customerInfo.salesRep')}
                        </FormLabel>
                        <Controller
                          name="salesRep"
                          control={control}
                          render={({ field }) => (
                            <CreatableSelect
                              inputId="salesRep"
                              styles={buildSelectStyles(false)}
                              isClearable
                              options={designerOptions}
                              value={getSimpleOption(field.value, designerOptions)}
                              onChange={(option) => {
                                const value = option?.value || ''
                                field.onChange(value)
                                updateFormData({ salesRep: value })
                              }}
                              onBlur={field.onBlur}
                              placeholder={t('proposals.create.customerInfo.salesRepPlaceholder', 'Select a sales representative')}
                            />
                          )}
                        />
                        <FormErrorMessage>{errors.salesRep && errors.salesRep.message}</FormErrorMessage>
                      </FormControl>
                    </SimpleGrid>

                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                      <FormControl>
                        <FormLabel htmlFor="leadSource">{t('form.labels.leadSource')}</FormLabel>
                        <Controller
                          name="leadSource"
                          control={control}
                          render={({ field }) => (
                            <CreatableSelect
                              inputId="leadSource"
                              styles={buildSelectStyles(false)}
                              isClearable
                              options={leadSourceOptions}
                              value={getSimpleOption(field.value, leadSourceOptions)}
                              onChange={(option) => {
                                const value = option?.value || ''
                                field.onChange(value)
                                updateFormData({ leadSource: value })
                              }}
                              onBlur={field.onBlur}
                            />
                          )}
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel htmlFor="type">{t('proposals.create.customerInfo.type')}</FormLabel>
                        <Controller
                          name="type"
                          control={control}
                          render={({ field }) => (
                            <CreatableSelect
                              inputId="type"
                              styles={buildSelectStyles(false)}
                              isClearable
                              options={typeOptions}
                              value={getSimpleOption(field.value, typeOptions)}
                              onChange={(option) => {
                                const value = option?.value || ''
                                field.onChange(value)
                                updateFormData({ type: value })
                              }}
                              onBlur={field.onBlur}
                            />
                          )}
                        />
                      </FormControl>
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
