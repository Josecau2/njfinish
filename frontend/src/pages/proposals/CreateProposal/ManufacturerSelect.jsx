
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import CreatableSelect from 'react-select/creatable'
import { useDispatch, useSelector } from 'react-redux'
import { Box, Button, CardBody, Flex, FormControl, FormErrorMessage, FormLabel, Heading, Icon, Input, SimpleGrid, Spinner, Stack, Text, useBreakpointValue, useColorModeValue } from '@chakra-ui/react'
import StandardCard from '../../../components/StandardCard'
import { motion } from 'framer-motion'
import { useForm, Controller } from 'react-hook-form'
import { fetchManufacturers } from '../../../store/slices/manufacturersSlice'
import { isAdmin } from '../../../helpers/permissions'

const MotionBox = motion(Box)
const MotionButton = motion(Button)

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
    zIndex: 30,
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

const ManufacturerStep = ({ formData, updateFormData, nextStep, prevStep, hideBack }) => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { list: allManufacturers, loading } = useSelector((state) => state.manufacturers)
  const authUser = useSelector((state) => state.auth?.user)
  const isUserAdmin = isAdmin(authUser)
  const apiUrl = import.meta.env.VITE_API_URL

  const [cardImageState, setCardImageState] = useState({})

  useEffect(() => {
    dispatch(fetchManufacturers())
  }, [dispatch])

  const enabledManufacturers = useMemo(
    () =>
      allManufacturers.filter(
        (manufacturer) => manufacturer.status !== false && manufacturer.enabled !== false,
      ),
    [allManufacturers],
  )

  const defaultValues = useMemo(
    () => ({
      manufacturer: formData.manufacturer ? String(formData.manufacturer) : '',
      versionName: formData.versionName || '',
    }),
    [formData.manufacturer, formData.versionName],
  )

  const {
    control,
    register,
    handleSubmit,
    setValue,
    getValues,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    mode: 'onBlur',
    defaultValues,
    shouldUnregister: false,
  })

  useEffect(() => {
    reset(defaultValues)
  }, [defaultValues, reset])

  const selectedManufacturerId = watch('manufacturer')

  const selectedManufacturer = useMemo(
    () =>
      enabledManufacturers.find(
        (manufacturer) => String(manufacturer.id) === String(selectedManufacturerId),
      ) || null,
    [enabledManufacturers, selectedManufacturerId],
  )

  const cardBg = useColorModeValue('white', 'gray.800')
  const cardHoverBorder = useColorModeValue('brand.400', 'brand.300')

  const handleManufacturerSelect = useCallback(
    (manufacturer) => {
      const manufacturerId = String(manufacturer.id)
      setValue('manufacturer', manufacturerId, { shouldValidate: true })

      const versionName =
        getValues('versionName')?.trim() || manufacturer.name || ''

      if (isUserAdmin) {
        setValue('versionName', versionName, { shouldValidate: true })
      }

      updateFormData({
        ...formData,
        manufacturer: manufacturer.id,
        manufacturerId: manufacturer.id,
        versionName,
        manufacturersData: [
          {
            manufacturer: manufacturer.id,
            versionName,
          },
        ],
      })
    },
    [formData, isUserAdmin, getValues, setValue, updateFormData],
  )

  const handleImageState = useCallback((manufacturerId, status) => {
    setCardImageState((prev) => ({ ...prev, [manufacturerId]: status }))
  }, [])

  const getImageSrc = useCallback(
    (manufacturer) => {
      const status = cardImageState[manufacturer.id]
      if (!manufacturer.image || status === 'error') {
        return '/images/nologo.png'
      }
      return `${apiUrl}/uploads/images/${manufacturer.image}`
    },
    [apiUrl, cardImageState],
  )

  const onSubmit = (values) => {
    const manufacturerIdNumber = Number(values.manufacturer)
    const manufacturerId = Number.isNaN(manufacturerIdNumber)
      ? values.manufacturer
      : manufacturerIdNumber

    updateFormData({
      ...formData,
      manufacturer: manufacturerId,
      manufacturerId,
      versionName: values.versionName || '',
      manufacturersData: [
        {
          manufacturer: manufacturerId,
          versionName: values.versionName || '',
        },
      ],
    })

    nextStep()
  }

  const manufacturerValidation = {
    required: t('proposals.create.manufacturer.validation.manufacturerRequired'),
  }

  const versionValidation = isUserAdmin
    ? {
        required: t('proposals.create.manufacturer.validation.versionNameRequired'),
      }
    : {}

  const gridColumns = useBreakpointValue({ base: 1, sm: 2, md: 3, lg: 4 })

  return (
    <Box w="full" my={4}>
      <StandardCard shadow="md" borderRadius="xl">
        <CardBody p={{ base: 4, md: 6 }}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Stack spacing={6}>
              <Flex justify="space-between" align={{ base: 'stretch', md: 'center' }} flexDir={{ base: 'column', md: 'row' }} gap={4}>
                <Heading size="md" color="gray.800">
                  {t('proposals.create.manufacturer.title')}
                </Heading>
                <Stack direction="row" spacing={4} align="center">
                  {!hideBack && (
                    <MotionButton
                      variant="outline"
                      colorScheme="gray"
                      onClick={prevStep}
                      whileTap={{ scale: 0.98 }}
                    >
                      {t('common.back')}
                    </MotionButton>
                  )}
                  <MotionButton
                    type="submit"
                    colorScheme="brand"
                    isDisabled={!selectedManufacturer}
                    isLoading={isSubmitting}
                    whileTap={{ scale: 0.98 }}
                    minW="120px"
                  >
                    {t('common.next')}
                  </MotionButton>
                </Stack>
              </Flex>

              <Controller
                name="manufacturer"
                control={control}
                rules={manufacturerValidation}
                render={({ field }) => (
                  <FormControl isInvalid={!!errors.manufacturer}>
                    <Stack spacing={4}>
                      {loading ? (
                        <Spinner alignSelf="center" size="lg" color="brand.500" />
                      ) : enabledManufacturers.length === 0 ? (
                        <Text color="gray.500" fontStyle="italic" textAlign="center">
                          {t('proposals.create.manufacturer.empty', 'No manufacturers available.')}
                        </Text>
                      ) : (
                        <SimpleGrid columns={gridColumns} spacing={6}>
                          {enabledManufacturers.map((manufacturer) => {
                            const isSelected = String(manufacturer.id) === field.value
                            const imageStatus = cardImageState[manufacturer.id]
                            return (
                              <MotionBox
                                key={manufacturer.id}
                                role="button"
                                tabIndex={0}
                                layout
                                borderWidth="1px"
                                borderRadius="lg"
                                overflow="hidden"
                                bg={cardBg}
                                cursor="pointer"
                                onClick={() => {
                                  field.onChange(String(manufacturer.id))
                                  handleManufacturerSelect(manufacturer)
                                }}
                                onKeyDown={(event) => {
                                  if (event.key === 'Enter' || event.key === ' ') {
                                    event.preventDefault()
                                    field.onChange(String(manufacturer.id))
                                    handleManufacturerSelect(manufacturer)
                                  }
                                }}
                                outline="none"
                                _focus={{ boxShadow: '0 0 0 3px', borderColor: 'blue.500', outlineColor: 'blue.300' }}
                                borderColor={isSelected ? cardHoverBorder : 'gray.200'}
                                boxShadow={isSelected ? '0 0 0 2px' : 'sm'}
                                sx={{
                                  '&:focus': {
                                    boxShadow: '0 0 0 3px var(--chakra-colors-blue-300)'
                                  },
                                  '&[data-selected="true"]': {
                                    boxShadow: '0 0 0 2px var(--chakra-colors-brand-400)'
                                  }
                                }}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.98 }}
                                transition="all 0.2s ease"
                              >
                                <Box position="relative" bg="gray.50" overflow="hidden" height="180px">
                                  {!imageStatus && (
                                    <Box
                                      position="absolute"
                                      inset={0}
                                      display="flex"
                                      alignItems="center"
                                      justifyContent="center"
                                      bg="gray.100"
                                    >
                                      <Spinner size="md" color="brand.500" />
                                    </Box>
                                  )}
                                  <img
                                    src={getImageSrc(manufacturer)}
                                    alt={manufacturer.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    onLoad={() => handleImageState(manufacturer.id, 'loaded')}
                                    onError={() => handleImageState(manufacturer.id, 'error')}
                                  />
                                  {isSelected && (
                                    <Box
                                      position="absolute"
                                      top={3}
                                      right={3}
                                      px={3}
                                      py={1}
                                      borderRadius="full"
                                      bg="brand.500"
                                      color="white"
                                      fontSize="xs"
                                      fontWeight="semibold"
                                      textTransform="uppercase"
                                      letterSpacing="0.05em"
                                    >
                                      {t('common.selected')}
                                    </Box>
                                  )}
                                </Box>
                                <Stack spacing={4} p={4} align="center">
                                  <Heading as="h3" size="sm" textAlign="center" color="gray.800">
                                    {manufacturer.name}
                                  </Heading>
                                  <Text fontSize="sm" color="gray.500" textAlign="center">
                                    {manufacturer.city || manufacturer.country || t('common.na')}
                                  </Text>
                                </Stack>
                              </MotionBox>
                            )
                          })}
                        </SimpleGrid>
                      )}
                    </Stack>
                    <FormErrorMessage>
                      {errors.manufacturer && errors.manufacturer.message}
                    </FormErrorMessage>
                  </FormControl>
                )}
              />

              {isUserAdmin && (
                <FormControl isInvalid={!!errors.versionName}>
                  <FormLabel htmlFor="versionName">
                    {t('proposals.create.manufacturer.labels.versionName')}
                  </FormLabel>
                  <Input
                    id="versionName"
                    type="text"
                    placeholder={t('proposals.create.manufacturer.placeholders.enterVersionName')}
                    {...register('versionName', {
                      ...versionValidation,
                      onChange: (event) => updateFormData({ versionName: event.target.value }),
                    })}
                  />
                  <FormErrorMessage>{errors.versionName && errors.versionName.message}</FormErrorMessage>
                </FormControl>
              )}

              {isUserAdmin && (
                <Box
                  mt={2}
                  p={5}
                  borderWidth="1px"
                  borderRadius="lg"
                  bg={useColorModeValue('blue.50', 'blue.900')}
                  borderColor={useColorModeValue('blue.200', 'blue.600')}
                  textAlign="center"
                >
                  <Heading as="h4" size="sm" mb={3} letterSpacing="0.05em" color={useColorModeValue('blue.700', 'blue.200')}>
                    {t('proposals.create.manufacturer.cta.needAnother')}
                  </Heading>
                  <Button variant="outline" colorScheme="brand" size="sm" minH="44px">
                    {t('proposals.create.manufacturer.cta.addManufacturer')}
                  </Button>
                </Box>
              )}
            </Stack>
          </form>
        </CardBody>
      </StandardCard>
    </Box>
  )
}
export default ManufacturerStep
