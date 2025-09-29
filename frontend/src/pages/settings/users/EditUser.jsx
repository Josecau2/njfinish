import { useEffect } from 'react'
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Container,
  SimpleGrid,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  Select,
  Switch,
  Button,
  VStack,
  HStack,
  Text,
  Heading,
  useToast,
  Icon,
  Flex,
  Divider,
} from '@chakra-ui/react'
import { useForm, Controller } from 'react-hook-form'
import { motion, useReducedMotion } from 'framer-motion'
import { User, Lock, ArrowLeft, Home, Building } from '@/icons-lucide'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import { decodeParam } from '../../../utils/obfuscate'
import { fetchUserById, updateUser } from '../../../store/slices/userSlice'
import { fetchUsers as fetchUserGroups } from '../../../store/slices/userGroupSlice'
import { fetchLocations } from '../../../store/slices/locationSlice'
import { useTranslation } from 'react-i18next'

const initialForm = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  userGroup: '',
  location: '',
  isSalesRep: false,
  // Personal address fields
  street_address: '',
  city: '',
  state: '',
  zip_code: '',
  country: '',
  // Company information
  company_name: '',
  company_street_address: '',
  company_city: '',
  company_state: '',
  company_zip_code: '',
  company_country: '',
}

const EditUserForm = () => {
  const { t } = useTranslation()
  const { id: rawId } = useParams()
  const id = decodeParam(rawId)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const toast = useToast()
  const prefersReducedMotion = useReducedMotion()
  
  const { selected } = useSelector((state) => state.users)
  const { list: locations } = useSelector((state) => state.locations)
  const { list: userGroups = [] } = useSelector((state) => state.usersGroup || {})
  const customization = useSelector((state) => state.customization)

  // React Hook Form setup
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm({
    mode: 'onBlur',
    defaultValues: initialForm,
  })

  useEffect(() => {
    if (id) {
      dispatch(fetchUserById(id))
    }
    dispatch(fetchLocations())
    dispatch(fetchUserGroups())
  }, [dispatch, id])

  useEffect(() => {
    if (selected && id) {
      reset({
        name: selected.name || '',
        email: selected.email || '',
        password: '',
        confirmPassword: '',
        userGroup: selected.group_id || '',
        location: selected.location || '',
        isSalesRep: selected.isSalesRep || false,
        // Personal address fields
        street_address: selected.street_address || '',
        city: selected.city || '',
        state: selected.state || '',
        zip_code: selected.zip_code || '',
        country: selected.country || '',
        // Company information
        company_name: selected.company_name || '',
        company_street_address: selected.company_street_address || '',
        company_city: selected.company_city || '',
        company_state: selected.company_state || '',
        company_zip_code: selected.company_zip_code || '',
        company_country: selected.company_country || '',
      })
    }
  }, [selected, id, reset])

  const onSubmit = async (data) => {
    try {
      const response = await dispatch(updateUser({ id, data }))
      if (response?.payload?.status == 200) {
        toast({
          title: t('common.success', 'Success'),
          description: response.payload.message,
          status: 'success',
          duration: 4000,
          isClosable: true,
        })
        navigate('/settings/users')
      }
    } catch (error) {
      console.error('Update user error:', error)
      toast({
        title: t('common.error', 'Error'),
        description: error.message || t('settings.users.alerts.genericError'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  // Watch password field for confirmation validation
  const password = watch('password')

  return (
    <Container maxW="1200px" py={6}>
      {/* Header Section */}
      <VStack spacing={6} align="stretch">
        <HStack spacing={4} align="center">
          <Button
            variant="ghost"
            leftIcon={<Icon as={ArrowLeft} boxSize={5} />}
            onClick={() => navigate('/settings/users')}
            as={motion.button}
            whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
          >
            {t('common.back', 'Back')}
          </Button>
          <Box>
            <Heading size="lg">{t('settings.users.edit.title', 'Edit User')}</Heading>
            <Text color="gray.600">{t('settings.users.edit.subtitle', 'Update user information and settings')}</Text>
          </Box>
        </HStack>

          <form onSubmit={handleSubmit(onSubmit)}>
            <VStack spacing={8} align="stretch">
              {/* Basic Information Section */}
              <Card>
                <CardHeader>
                  <HStack spacing={3}>
                    <Box p={2} borderRadius="md" bg="brand.50">
                      <Icon as={User} boxSize={5} color="brand.600" />
                    </Box>
                    <Text fontSize="lg" fontWeight="semibold" color="gray.800">
                      {t('settings.users.form.basicInfo', 'Basic Information')}
                    </Text>
                  </HStack>
                  <Divider mt={3} />
                </CardHeader>
                <CardBody>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                    {/* Name Field */}
                    <FormControl isInvalid={!!errors.name}>
                      <FormLabel>{t('settings.users.form.name', 'Name')}</FormLabel>
                      <Controller
                        name="name"
                        control={control}
                        rules={{
                          required: t('settings.users.form.validation.nameRequired'),
                        }}
                        render={({ field }) => (
                          <Input {...field} minH="44px" />
                        )}
                      />
                      <FormErrorMessage>{errors.name?.message}</FormErrorMessage>
                    </FormControl>

                    {/* Email Field */}
                    <FormControl isInvalid={!!errors.email}>
                      <FormLabel>{t('settings.users.form.email', 'Email')}</FormLabel>
                      <Controller
                        name="email"
                        control={control}
                        rules={{
                          required: t('settings.users.form.validation.emailRequired'),
                          pattern: {
                            value: /^\S+@\S+$/i,
                            message: t('settings.users.form.validation.emailInvalid'),
                          },
                        }}
                        render={({ field }) => (
                          <Input {...field} type="email" minH="44px" />
                        )}
                      />
                      <FormErrorMessage>{errors.email?.message}</FormErrorMessage>
                    </FormControl>

                    {/* User Group Field */}
                    <FormControl isInvalid={!!errors.userGroup}>
                      <FormLabel>{t('settings.users.form.userGroup', 'User Group')}</FormLabel>
                      <Controller
                        name="userGroup"
                        control={control}
                        rules={{
                          required: t('settings.users.form.validation.userGroupRequired'),
                        }}
                        render={({ field }) => (
                          <Select {...field} minH="44px">
                            <option value="">{t('common.selectOption', 'Select option')}</option>
                            {userGroups.map((group) => (
                              <option key={group.id} value={group.id}>
                                {group.name}
                              </option>
                            ))}
                          </Select>
                        )}
                      />
                      <FormErrorMessage>{errors.userGroup?.message}</FormErrorMessage>
                    </FormControl>

                    {/* Location Field */}
                    <FormControl isInvalid={!!errors.location}>
                      <FormLabel>{t('settings.users.form.location', 'Location')}</FormLabel>
                      <Controller
                        name="location"
                        control={control}
                        render={({ field }) => (
                          <Select {...field} minH="44px">
                            <option value="">{t('settings.users.form.select.location', 'Select location')}</option>
                            {locations?.map((location) => (
                              <option key={location.id} value={location.id}>
                                {location.locationName}
                              </option>
                            ))}
                          </Select>
                        )}
                      />
                      <FormErrorMessage>{errors.location?.message}</FormErrorMessage>
                    </FormControl>

                    {/* Sales Rep Switch */}
                    <FormControl>
                      <FormLabel>{t('settings.users.form.isSalesRep', 'Sales Representative')}</FormLabel>
                      <Controller
                        name="isSalesRep"
                        control={control}
                        render={({ field }) => (
                          <Flex align="center" p={3} borderRadius="md" bg="gray.50" border="1px" borderColor="gray.200">
                            <Text flex="1" fontSize="sm">
                              {t('settings.users.form.hints.salesRep', 'Enable if this user is a sales representative')}
                            </Text>
                            <Switch
                              {...field}
                              isChecked={field.value}
                              size="lg"
                              colorScheme="green"
                              onChange={(e) => field.onChange(e.target.checked)}
                            />
                          </Flex>
                        )}
                      />
                    </FormControl>
                  </SimpleGrid>
                </CardBody>
              </Card>

              {/* Personal Address Section */}
              <Card>
                <CardHeader>
                  <HStack spacing={3}>
                    <Box p={2} borderRadius="md" bg="brand.50">
                      <Icon as={Home} boxSize={5} color="brand.600" />
                    </Box>
                    <Text fontSize="lg" fontWeight="semibold" color="gray.800">
                      {t('settings.users.form.titles.personalAddress', 'Personal Address')}
                    </Text>
                  </HStack>
                  <Divider mt={3} />
                </CardHeader>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    {/* Street Address */}
                    <FormControl>
                      <FormLabel>{t('settings.users.form.labels.streetAddress', 'Street Address')}</FormLabel>
                      <Controller
                        name="street_address"
                        control={control}
                        render={({ field }) => (
                          <Input {...field} minH="44px" placeholder={t('settings.users.form.placeholders.streetAddress', 'Enter street address')} />
                        )}
                      />
                    </FormControl>

                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                      {/* City */}
                      <FormControl>
                        <FormLabel>{t('settings.users.form.labels.city', 'City')}</FormLabel>
                        <Controller
                          name="city"
                          control={control}
                          render={({ field }) => (
                            <Input {...field} minH="44px" placeholder={t('settings.users.form.placeholders.city', 'Enter city')} />
                          )}
                        />
                      </FormControl>

                      {/* State */}
                      <FormControl>
                        <FormLabel>{t('settings.users.form.labels.state', 'State/Province')}</FormLabel>
                        <Controller
                          name="state"
                          control={control}
                          render={({ field }) => (
                            <Input {...field} minH="44px" placeholder={t('settings.users.form.placeholders.state', 'State')} />
                          )}
                        />
                      </FormControl>

                      {/* ZIP Code */}
                      <FormControl>
                        <FormLabel>{t('settings.users.form.labels.zipCode', 'ZIP/Postal Code')}</FormLabel>
                        <Controller
                          name="zip_code"
                          control={control}
                          render={({ field }) => (
                            <Input {...field} minH="44px" placeholder={t('settings.users.form.placeholders.zipCode', 'ZIP Code')} />
                          )}
                        />
                      </FormControl>
                    </SimpleGrid>

                    {/* Country */}
                    <Box maxW="50%">
                      <FormControl>
                        <FormLabel>{t('settings.users.form.labels.country', 'Country')}</FormLabel>
                        <Controller
                          name="country"
                          control={control}
                          render={({ field }) => (
                            <Input {...field} minH="44px" placeholder={t('settings.users.form.placeholders.country', 'Enter country')} />
                          )}
                        />
                      </FormControl>
                    </Box>
                  </VStack>
                </CardBody>
              </Card>

              {/* Company Information Section */}
              <Card>
                <CardHeader>
                  <HStack spacing={3}>
                    <Box p={2} borderRadius="md" bg="brand.50">
                      <Icon as={Building} boxSize={5} color="brand.600" />
                    </Box>
                    <Text fontSize="lg" fontWeight="semibold" color="gray.800">
                      {t('settings.users.form.titles.companyInfo', 'Company Information')}
                    </Text>
                  </HStack>
                  <Divider mt={3} />
                </CardHeader>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    {/* Company Name */}
                    <Box maxW="50%">
                      <FormControl>
                        <FormLabel>{t('settings.users.form.labels.companyName', 'Company Name')}</FormLabel>
                        <Controller
                          name="company_name"
                          control={control}
                          render={({ field }) => (
                            <Input {...field} minH="44px" placeholder={t('settings.users.form.placeholders.companyName', 'Enter company name')} />
                          )}
                        />
                      </FormControl>
                    </Box>

                    {/* Company Street Address */}
                    <FormControl>
                      <FormLabel>{t('settings.users.form.labels.companyStreetAddress', 'Company Address')}</FormLabel>
                      <Controller
                        name="company_street_address"
                        control={control}
                        render={({ field }) => (
                          <Input {...field} minH="44px" placeholder={t('settings.users.form.placeholders.companyStreetAddress', 'Enter company street address')} />
                        )}
                      />
                    </FormControl>

                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                      {/* Company City */}
                      <FormControl>
                        <FormLabel>{t('settings.users.form.labels.companyCity', 'Company City')}</FormLabel>
                        <Controller
                          name="company_city"
                          control={control}
                          render={({ field }) => (
                            <Input {...field} minH="44px" placeholder={t('settings.users.form.placeholders.companyCity', 'Enter company city')} />
                          )}
                        />
                      </FormControl>

                      {/* Company State */}
                      <FormControl>
                        <FormLabel>{t('settings.users.form.labels.companyState', 'Company State/Province')}</FormLabel>
                        <Controller
                          name="company_state"
                          control={control}
                          render={({ field }) => (
                            <Input {...field} minH="44px" placeholder={t('settings.users.form.placeholders.companyState', 'State')} />
                          )}
                        />
                      </FormControl>

                      {/* Company ZIP Code */}
                      <FormControl>
                        <FormLabel>{t('settings.users.form.labels.companyZipCode', 'Company ZIP/Postal Code')}</FormLabel>
                        <Controller
                          name="company_zip_code"
                          control={control}
                          render={({ field }) => (
                            <Input {...field} minH="44px" placeholder={t('settings.users.form.placeholders.companyZipCode', 'ZIP Code')} />
                          )}
                        />
                      </FormControl>
                    </SimpleGrid>

                    {/* Company Country */}
                    <Box maxW="50%">
                      <FormControl>
                        <FormLabel>{t('settings.users.form.labels.companyCountry', 'Company Country')}</FormLabel>
                        <Controller
                          name="company_country"
                          control={control}
                          render={({ field }) => (
                            <Input {...field} minH="44px" placeholder={t('settings.users.form.placeholders.companyCountry', 'Enter company country')} />
                          )}
                        />
                      </FormControl>
                    </Box>
                  </VStack>
                </CardBody>
              </Card>

              {/* Password Section */}
              <Card>
                <CardHeader>
                  <HStack spacing={3}>
                    <Box p={2} borderRadius="md" bg="brand.50">
                      <Icon as={Lock} boxSize={5} color="brand.600" />
                    </Box>
                    <Text fontSize="lg" fontWeight="semibold" color="gray.800">
                      {t('settings.users.form.security', 'Security')}
                    </Text>
                  </HStack>
                  <Divider mt={3} />
                </CardHeader>
                <CardBody>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                    {/* Password Field */}
                    <FormControl isInvalid={!!errors.password}>
                      <FormLabel>{t('settings.users.form.password', 'Password')}</FormLabel>
                      <Controller
                        name="password"
                        control={control}
                        render={({ field }) => (
                          <Input {...field} type="password" minH="44px" />
                        )}
                      />
                      <FormErrorMessage>{errors.password?.message}</FormErrorMessage>
                    </FormControl>

                    {/* Confirm Password Field */}
                    <FormControl isInvalid={!!errors.confirmPassword}>
                      <FormLabel>{t('settings.users.form.confirmPassword', 'Confirm Password')}</FormLabel>
                      <Controller
                        name="confirmPassword"
                        control={control}
                        rules={{
                          validate: (value) =>
                            value === password || t('settings.users.form.validation.passwordMismatch'),
                        }}
                        render={({ field }) => (
                          <Input {...field} type="password" minH="44px" />
                        )}
                      />
                      <FormErrorMessage>{errors.confirmPassword?.message}</FormErrorMessage>
                    </FormControl>
                  </SimpleGrid>
                </CardBody>
              </Card>

              {/* Form Actions */}
              <HStack spacing={4} justify="flex-end" pt={4}>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/settings/users')}
                  minH="44px"
                  as={motion.button}
                  whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
                >
                  {t('common.cancel', 'Cancel')}
                </Button>
                <Button
                  type="submit"
                  variant="solid"
                  colorScheme="brand"
                  isLoading={isSubmitting}
                  minH="44px"
                  as={motion.button}
                  whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
                >
                  {t('settings.users.form.updateUser', 'Update User')}
                </Button>
              </HStack>
            </VStack>
          </form>
        </VStack>
      </Container>
  )
}
export default EditUserForm
