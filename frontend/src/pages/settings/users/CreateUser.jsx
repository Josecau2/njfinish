import StandardCard from '../../../components/StandardCard'
import { useEffect, useRef, useState } from 'react'
import { CardBody, FormControl, Input, FormLabel, Select, Switch, Container, Flex, Box, Icon, Button, FormErrorMessage, InputGroup, InputLeftElement, Text, VStack, HStack, Alert, AlertIcon, Divider, useToast, useColorModeValue } from '@chakra-ui/react'
import PageContainer from '../../../components/PageContainer'
import { User, Mail, ArrowLeft, Save, Eye, Settings, Home, Building, UserPlus, Lock } from '@/icons-lucide'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { addUser } from '../../../store/slices/userSlice'
import { fetchLocations } from '../../../store/slices/locationSlice'
import { AlertDialog, AlertDialogBody, AlertDialogFooter, AlertDialogHeader, AlertDialogContent, AlertDialogOverlay, useDisclosure } from '@chakra-ui/react'
import { fetchUsers } from '../../../store/slices/userGroupSlice'
import { useTranslation } from 'react-i18next'
import PageHeader from '../../../components/PageHeader'
import { ICON_SIZE_MD, ICON_BOX_MD } from '../../../constants/iconSizes'

// Move component definitions outside to prevent re-creation on every render
const FormSection = ({ title, icon, children }) => {
  const iconBg = useColorModeValue("brand.50", "brand.900")
  const iconColor = useColorModeValue("brand.600", "brand.400")
  const titleColor = useColorModeValue("gray.800", "gray.200")

  return (
    <StandardCard mb={6} shadow="sm" borderRadius="lg">
      <CardBody p={6}>
        <HStack spacing={4} mb={4}>
          <Box p={2} borderRadius="md" bg={iconBg}>
            <Icon as={icon} boxSize={ICON_BOX_MD} color={iconColor} />
          </Box>
          <Text fontSize="lg" fontWeight="semibold" color={titleColor}>
            {title}
          </Text>
        </HStack>
        <Divider mb={4} />
        {children}
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
  ...props
}) => {
  const labelColor = useColorModeValue("gray.700", "gray.300")
  const requiredColor = useColorModeValue("red.500", "red.300")
  const iconColor = useColorModeValue("gray.400", "gray.500")
  const borderNormal = useColorModeValue("gray.300", "gray.600")
  const borderError = useColorModeValue("red.300", "red.400")
  const hoverNormal = useColorModeValue("gray.400", "gray.500")
  const hoverError = useColorModeValue("red.400", "red.500")
  const focusBorderNormal = useColorModeValue("brand.500", "brand.400")
  const focusBorderError = useColorModeValue("red.500", "red.400")

  return (
    <FormControl isInvalid={isInvalid} mb={4}>
      <FormLabel htmlFor={name} fontWeight="medium" color={labelColor}>
        {label}
        {required && (
          <Text as="span" color={requiredColor} ml={1}>
            *
          </Text>
        )}
      </FormLabel>
      <InputGroup>
        {icon && (
          <InputLeftElement pointerEvents="none">
            <Icon as={icon} boxSize={ICON_BOX_MD} color={iconColor} />
          </InputLeftElement>
        )}
        <Input
          type={type}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          borderColor={isInvalid ? borderError : borderNormal}
          _hover={{ borderColor: isInvalid ? hoverError : hoverNormal }}
          _focusVisible={{
            borderColor: isInvalid ? focusBorderError : focusBorderNormal,
            boxShadow: `0 0 0 1px ${isInvalid ? focusBorderError : focusBorderNormal}`,
          }}
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
  children,
  value,
  onChange,
  isInvalid,
  feedback,
  ...props
}) => {
  const labelColor = useColorModeValue("gray.700", "gray.300")
  const requiredColor = useColorModeValue("red.500", "red.300")
  const iconColor = useColorModeValue("gray.400", "gray.500")
  const borderNormal = useColorModeValue("gray.300", "gray.600")
  const borderError = useColorModeValue("red.300", "red.400")
  const hoverNormal = useColorModeValue("gray.400", "gray.500")
  const hoverError = useColorModeValue("red.400", "red.500")
  const focusBorderNormal = useColorModeValue("brand.500", "brand.400")
  const focusBorderError = useColorModeValue("red.500", "red.400")

  return (
    <FormControl isInvalid={isInvalid} mb={4}>
      <FormLabel htmlFor={name} fontWeight="medium" color={labelColor}>
        {label}
        {required && (
          <Text as="span" color={requiredColor} ml={1}>
            *
          </Text>
        )}
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
          borderColor={isInvalid ? borderError : borderNormal}
          _hover={{ borderColor: isInvalid ? hoverError : hoverNormal }}
          _focus={{
            borderColor: isInvalid ? focusBorderError : focusBorderNormal,
            boxShadow: `0 0 0 1px ${isInvalid ? focusBorderError : focusBorderNormal}`,
          }}
          {...props}
        >
          {children}
        </Select>
      </InputGroup>
      {feedback && <FormErrorMessage>{feedback}</FormErrorMessage>}
    </FormControl>
  )
}

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

const AddUserForm = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const toast = useToast()
  const { isOpen: isRestoreOpen, onOpen: onRestoreOpen, onClose: onRestoreClose } = useDisclosure()
  const { isOpen: isCancelOpen, onOpen: onCancelOpen, onClose: onCancelClose } = useDisclosure()
  const restoreRef = useRef()
  const cancelRef = useRef()

  // Color mode values - MUST be before useState
  const salesRepBgActive = useColorModeValue("green.100", "green.900")
  const salesRepColorActive = useColorModeValue("green.600", "green.300")
  const salesRepBgInactive = useColorModeValue("yellow.100", "yellow.900")
  const salesRepColorInactive = useColorModeValue("yellow.600", "yellow.300")

  const { error } = useSelector((state) => state.users)
  const { list: usersGroup = [] } = useSelector((state) => state.usersGroup || {})
  const { list: locations = [] } = useSelector((state) => state.locations || {})
  const navigate = useNavigate()
  const [formData, setFormData] = useState(initialForm)
  const initialFormRef = useRef(initialForm)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [pendingSubmit, setPendingSubmit] = useState(null)

  useEffect(() => {
    dispatch(fetchUsers())
    dispatch(fetchLocations())
  }, [dispatch])

  const validate = () => {
    const newErrors = {}
    if (!formData.name.trim()) newErrors.name = t('settings.users.form.validation.nameRequired')
    if (!formData.email.trim()) {
      newErrors.email = t('settings.users.form.validation.emailRequired')
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = t('settings.users.form.validation.invalidEmail')
    }
    if (!formData.password)
      newErrors.password = t('settings.users.form.validation.passwordRequired')
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t('settings.users.form.validation.confirmPasswordRequired')
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('settings.users.form.validation.passwordMismatch')
    }
    if (!formData.userGroup)
      newErrors.userGroup = t('settings.users.form.validation.userGroupRequired')
    // Location is optional, no validation required

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const handleSubmit = async (e, force = false) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const response = await dispatch(addUser({ ...formData, force }))

      if (response?.payload?.email_exists_but_deleted) {
        setPendingSubmit(e)
        onRestoreOpen()
        setLoading(false)
        return
      }

      if (response?.payload?.status == 200) {
        toast({
          title: t('common.success'),
          description: response.payload.message,
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
        navigate('/settings/users')
      }
    } catch (error) {
      toast({
        title: t('common.error'),
        description: error.message || t('settings.users.alerts.genericError'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  const confirmRestore = () => {
    onRestoreClose()
    if (pendingSubmit) {
      handleSubmit(pendingSubmit, true)
      setPendingSubmit(null)
    }
  }

  const isFormDirty = () => {
    return JSON.stringify(formData) !== JSON.stringify(initialFormRef.current)
  }
  return (
    <PageContainer>
      {/* Header Section */}
      <PageHeader
        title={t('settings.users.create.title')}
        subtitle={t('settings.users.create.subtitle')}
        icon={UserPlus}
        showBackButton={true}
        onBackClick={() => navigate('/settings/users')}
      />

      {/* Error Alert */}
      {error && (
        <Alert status="error" mb={6} borderRadius="lg">
          <AlertIcon />
          <Box>
            <Text fontWeight="bold">{t('common.error')}:</Text>
            <Text>
              {typeof error === 'string'
                ? error
                : error.message || t('settings.users.alerts.genericError')}
            </Text>
          </Box>
        </Alert>
      )}

      <Box as="form" onSubmit={handleSubmit}>
        {/* Basic Information Section */}
        <FormSection title={t('settings.users.form.titles.basicInfo')} icon={User}>
          <Flex gap={6} wrap="wrap">
            <Box flex="1" minW="300px">
              <CustomFormInput
                label={t('settings.users.form.labels.fullName')}
                name="name"
                required
                icon={User}
                placeholder={t('settings.users.form.placeholders.fullName')}
                value={formData.name}
                onChange={handleChange}
                isInvalid={!!errors.name}
                feedback={errors.name}
              />
            </Box>
            <Box flex="1" minW="300px">
              <CustomFormInput
                label={t('settings.users.form.labels.email')}
                name="email"
                type="email"
                required
                icon={Mail}
                placeholder={t('settings.users.form.placeholders.email')}
                value={formData.email}
                onChange={handleChange}
                isInvalid={!!errors.email}
                feedback={errors.email}
              />
            </Box>
          </Flex>
        </FormSection>

        {/* Security Information Section */}
        <FormSection title={t('settings.users.form.titles.security')} icon={Lock}>
          <Flex gap={6} wrap="wrap">
            <Box flex="1" minW="300px">
              <CustomFormInput
                label={t('settings.users.form.labels.password')}
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                icon={Lock}
                placeholder={t('settings.users.form.placeholders.password')}
                value={formData.password}
                onChange={handleChange}
                isInvalid={!!errors.password}
                feedback={errors.password}
              />
            </Box>
            <Box flex="1" minW="300px">
              <CustomFormInput
                label={t('settings.users.form.labels.confirmPassword')}
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                icon={Lock}
                placeholder={t('settings.users.form.placeholders.confirmPassword')}
                value={formData.confirmPassword}
                onChange={handleChange}
                isInvalid={!!errors.confirmPassword}
                feedback={errors.confirmPassword}
              />
            </Box>
          </Flex>
        </FormSection>

        {/* Role & Access Section */}
        <FormSection title={t('settings.users.form.titles.roleAccess')} icon={Settings}>
          <Flex gap={6} wrap="wrap">
            <Box flex="1" minW="300px">
              <CustomFormSelect
                label={t('settings.users.form.labels.userGroup')}
                name="userGroup"
                required
                icon={User}
                value={formData.userGroup}
                onChange={handleChange}
                isInvalid={!!errors.userGroup}
                feedback={errors.userGroup}
              >
                <option value="">{t('settings.users.form.select.group')}</option>
                {(usersGroup || []).map((group) => {
                  const name = group?.user_group?.name ?? group?.name ?? `Group #${group?.id ?? ''}`
                  const id = group?.user_group?.id ?? group?.id
                  return (
                    <option key={id ?? name} value={id}>
                      {name}
                    </option>
                  )
                })}
              </CustomFormSelect>
            </Box>
            <Box flex="1" minW="300px">
              <CustomFormSelect
                label={t('settings.users.form.labels.location')}
                name="location"
                icon={Home}
                value={formData.location}
                onChange={handleChange}
                isInvalid={!!errors.location}
                feedback={errors.location}
              >
                <option value="">{t('settings.users.form.select.location')}</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.locationName}
                  </option>
                ))}
              </CustomFormSelect>
            </Box>
          </Flex>

          {/* Sales Representative Toggle */}
          <Box
            p={4}
            borderRadius="lg"
            bg={useColorModeValue("gray.50", "gray.800")}
            border="1px"
            borderColor={useColorModeValue("gray.200", "gray.600")}
            mb={4}
          >
            <Flex align="center" justify="space-between">
              <HStack spacing={4}>
                <Box
                  w={8}
                  h={8}
                  borderRadius="full"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  bg={formData.isSalesRep ? salesRepBgActive : salesRepBgInactive}
                  color={formData.isSalesRep ? salesRepColorActive : salesRepColorInactive}
                >
                  <Icon as={User} boxSize={ICON_BOX_MD} />
                </Box>
                <VStack align="start" spacing={0}>
                  <Text fontWeight="semibold" fontSize="sm" color={useColorModeValue("gray.800", "gray.200")}>
                    {t('settings.users.form.labels.salesRep')}
                  </Text>
                  <Text fontSize="xs" color={useColorModeValue("gray.600", "gray.400")}>
                    {t('settings.users.form.hints.salesRep')}
                  </Text>
                </VStack>
              </HStack>
              <Switch
                id="isSalesRep"
                name="isSalesRep"
                isChecked={formData.isSalesRep}
                onChange={handleChange}
                size="lg"
                colorScheme="green"
              />
            </Flex>
          </Box>
        </FormSection>

        {/* Personal Address Section */}
        <FormSection
          title={t('settings.users.form.titles.personalAddress', 'Personal Address')}
          icon={Home}
        >
          <VStack spacing={4} align="stretch">
            <CustomFormInput
              label={t('settings.users.form.labels.streetAddress', 'Street Address')}
              name="street_address"
              icon={Home}
              placeholder={t(
                'settings.users.form.placeholders.streetAddress',
                'Enter street address',
              )}
              value={formData.street_address}
              onChange={handleChange}
              isInvalid={!!errors.street_address}
              feedback={errors.street_address}
            />
            <Flex gap={4} wrap="wrap">
              <Box flex="2" minW="200px">
                <CustomFormInput
                  label={t('settings.users.form.labels.city', 'City')}
                  name="city"
                  placeholder={t('settings.users.form.placeholders.city', 'Enter city')}
                  value={formData.city}
                  onChange={handleChange}
                  isInvalid={!!errors.city}
                  feedback={errors.city}
                />
              </Box>
              <Box flex="1" minW="150px">
                <CustomFormInput
                  label={t('settings.users.form.labels.state', 'State/Province')}
                  name="state"
                  placeholder={t('settings.users.form.placeholders.state', 'State')}
                  value={formData.state}
                  onChange={handleChange}
                  isInvalid={!!errors.state}
                  feedback={errors.state}
                />
              </Box>
              <Box flex="1" minW="150px">
                <CustomFormInput
                  label={t('settings.users.form.labels.zipCode', 'ZIP/Postal Code')}
                  name="zip_code"
                  placeholder={t('settings.users.form.placeholders.zipCode', 'ZIP Code')}
                  value={formData.zip_code}
                  onChange={handleChange}
                  isInvalid={!!errors.zip_code}
                  feedback={errors.zip_code}
                />
              </Box>
            </Flex>
            <Box maxW="50%">
              <CustomFormInput
                label={t('settings.users.form.labels.country', 'Country')}
                name="country"
                placeholder={t('settings.users.form.placeholders.country', 'Enter country')}
                value={formData.country}
                onChange={handleChange}
                isInvalid={!!errors.country}
                feedback={errors.country}
              />
            </Box>
          </VStack>
        </FormSection>

        {/* Company Information Section */}
        <FormSection
          title={t('settings.users.form.titles.companyInfo', 'Company Information')}
          icon={Building}
        >
          <VStack spacing={4} align="stretch">
            <Box maxW="50%">
              <CustomFormInput
                label={t('settings.users.form.labels.companyName', 'Company Name')}
                name="company_name"
                icon={Building}
                placeholder={t(
                  'settings.users.form.placeholders.companyName',
                  'Enter company name',
                )}
                value={formData.company_name}
                onChange={handleChange}
                isInvalid={!!errors.company_name}
                feedback={errors.company_name}
              />
            </Box>
            <CustomFormInput
              label={t('settings.users.form.labels.companyStreetAddress', 'Company Address')}
              name="company_street_address"
              icon={Home}
              placeholder={t(
                'settings.users.form.placeholders.companyStreetAddress',
                'Enter company street address',
              )}
              value={formData.company_street_address}
              onChange={handleChange}
              isInvalid={!!errors.company_street_address}
              feedback={errors.company_street_address}
            />
            <Flex gap={4} wrap="wrap">
              <Box flex="2" minW="200px">
                <CustomFormInput
                  label={t('settings.users.form.labels.companyCity', 'Company City')}
                  name="company_city"
                  placeholder={t(
                    'settings.users.form.placeholders.companyCity',
                    'Enter company city',
                  )}
                  value={formData.company_city}
                  onChange={handleChange}
                  isInvalid={!!errors.company_city}
                  feedback={errors.company_city}
                />
              </Box>
              <Box flex="1" minW="150px">
                <CustomFormInput
                  label={t('settings.users.form.labels.companyState', 'Company State/Province')}
                  name="company_state"
                  placeholder={t('settings.users.form.placeholders.companyState', 'State')}
                  value={formData.company_state}
                  onChange={handleChange}
                  isInvalid={!!errors.company_state}
                  feedback={errors.company_state}
                />
              </Box>
              <Box flex="1" minW="150px">
                <CustomFormInput
                  label={t('settings.users.form.labels.companyZipCode', 'Company ZIP/Postal Code')}
                  name="company_zip_code"
                  placeholder={t('settings.users.form.placeholders.companyZipCode', 'ZIP Code')}
                  value={formData.company_zip_code}
                  onChange={handleChange}
                  isInvalid={!!errors.company_zip_code}
                  feedback={errors.company_zip_code}
                />
              </Box>
            </Flex>
            <Box maxW="50%">
              <CustomFormInput
                label={t('settings.users.form.labels.companyCountry', 'Company Country')}
                name="company_country"
                placeholder={t(
                  'settings.users.form.placeholders.companyCountry',
                  'Enter company country',
                )}
                value={formData.company_country}
                onChange={handleChange}
                isInvalid={!!errors.company_country}
                feedback={errors.company_country}
              />
            </Box>
          </VStack>
        </FormSection>

        {/* Action Buttons */}
        <StandardCard shadow="sm" borderRadius="lg">
          <CardBody p={6}>
            <Flex
              direction={{ base: 'column-reverse', md: 'row' }}
              gap={4}
              justify="flex-end"
              align="center"
            >
              <Button
                type="button"
                variant="outline"
                size="lg"
                leftIcon={<Icon as={ArrowLeft} />}
                onClick={() => {
                  if (isFormDirty()) {
                    onCancelOpen()
                  } else {
                    navigate('/settings/users')
                  }
                }}
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="submit"
                colorScheme="green"
                size="lg"
                isLoading={loading}
                loadingText={t('settings.users.create.submitting')}
                leftIcon={!loading ? <Icon as={Save} /> : undefined}
              >
                {t('settings.users.create.submit')}
              </Button>
            </Flex>
          </CardBody>
        </StandardCard>
      </Box>

      {/* Restore Deleted User Dialog */}
      <AlertDialog
        isOpen={isRestoreOpen}
        leastDestructiveRef={restoreRef}
        onClose={onRestoreClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent borderRadius={{ base: '0', md: '12px' }}>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              {t('settings.users.alerts.emailDeletedTitle')}
            </AlertDialogHeader>

            <AlertDialogBody>
              {t('settings.users.alerts.emailDeletedText')}
            </AlertDialogBody>

            <AlertDialogFooter pt={4} pb={{ base: 8, md: 4 }}>
              <Button ref={restoreRef} onClick={onRestoreClose} minH="44px">
                {t('common.no')}
              </Button>
              <Button colorScheme="blue" onClick={confirmRestore} ml={3} minH="44px">
                {t('settings.users.alerts.restoreYes')}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog
        isOpen={isCancelOpen}
        leastDestructiveRef={cancelRef}
        onClose={onCancelClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent borderRadius={{ base: '0', md: '12px' }}>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              {t('common.confirm')}
            </AlertDialogHeader>

            <AlertDialogBody>
              {t('settings.users.form.alerts.leaveWarning')}
            </AlertDialogBody>

            <AlertDialogFooter pt={4} pb={{ base: 8, md: 4 }}>
              <Button ref={cancelRef} onClick={onCancelClose} minH="44px">
                {t('settings.users.form.alerts.stayOnPage')}
              </Button>
              <Button colorScheme="red" onClick={() => { onCancelClose(); navigate('/settings/users'); }} ml={3} minH="44px">
                {t('settings.users.form.alerts.leaveAnyway')}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </PageContainer>
  )
}

export default AddUserForm
