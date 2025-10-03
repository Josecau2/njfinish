import { useEffect, useState, useRef } from 'react'
import { FormControl, Input, FormLabel, Select, CardBody, CardHeader, Flex, Box, Button, InputGroup, InputLeftElement, FormErrorMessage, Heading, Text, Icon, Divider, Spinner, useColorModeValue } from '@chakra-ui/react'
import StandardCard from '../../../components/StandardCard'
import PageContainer from '../../../components/PageContainer'
import { useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'
import ct from 'countries-and-timezones'
import { formatDate, formatDateTime, getCurrentDate } from '../../../utils/dateHelpers'
import { addLocation } from '../../../store/slices/locationSlice'
import { useDispatch } from 'react-redux'
import PageHeader from '../../../components/PageHeader'
import { Mail, Clock, ArrowLeft, CheckCircle, MapPin, Home, Phone } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ICON_SIZE_MD, ICON_BOX_MD } from '../../../constants/iconSizes'

const initialForm = {
  locationName: '',
  address: '',
  website: '',
  email: '',
  phone: '',
  country: '',
  timezone: '',
}

const LocationForm = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  // Dark mode colors
  const inputIconBg = bgGray50
  const inputIconBorder = borderGray200
  const timezoneIconBg = color3
  const timezoneIconBorder = color4
  const timeIconBg = colorYellow100
  const timeIconColor = colorYellow700
  const readonlyInputBg = bgGray50
  const readonlyInputColor = borderGray600

  // Color mode values
  const bgGray50 = bgGray50
  const borderGray200 = borderGray200
  const color3 = color3
  const color4 = color4
  const colorYellow100 = colorYellow100
  const colorYellow700 = colorYellow700
  const borderGray600 = borderGray600
  const bgGray50_1 = bgGray50_1
  const borderGray700 = borderGray700
  const iconRed500 = iconRed500
  const iconGray400 = iconGray400

  const [formData, setFormData] = useState(initialForm)
  const initialFormRef = useRef(initialForm)
  const [errors, setErrors] = useState({})
  const [currentTime, setCurrentTime] = useState('')
  const [loading, setLoading] = useState(false)
  const dispatch = useDispatch()
  const countries = Object.values(ct.getAllCountries())
  const timezonesForCountry = formData.country
    ? ct.getCountry(formData.country)?.timezones || []
    : []

  useEffect(() => {
    if (formData.timezone) {
      const interval = setInterval(() => {
        setCurrentTime(formatDateTime(getCurrentDate(), formData.timezone))
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [formData.timezone])

  const validate = () => {
    const newErrors = {}
    if (!formData.locationName.trim())
      newErrors.locationName = t('settings.locations.form.validation.locationNameRequired')
    if (!formData.address.trim())
      newErrors.address = t('settings.locations.form.validation.addressRequired')
    if (!formData.website.trim())
      newErrors.website = t('settings.locations.form.validation.websiteRequired')
    if (!formData.email.trim()) {
      newErrors.email = t('settings.locations.form.validation.emailRequired')
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('settings.locations.form.validation.invalidEmail')
    }
    if (!formData.phone.trim())
      newErrors.phone = t('settings.locations.form.validation.phoneRequired')
    if (!formData.country)
      newErrors.country = t('settings.locations.form.validation.countryRequired')
    if (!formData.timezone)
      newErrors.timezone = t('settings.locations.form.validation.timezoneRequired')

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === 'country') {
      const selectedTimezones = ct.getCountry(value)?.timezones || []
      const firstTimezone = selectedTimezones[0] || ''
      setFormData((prev) => ({
        ...prev,
        country: value,
        timezone: firstTimezone,
      }))
      setCurrentTime(firstTimezone ? formatDateTime(getCurrentDate(), firstTimezone) : '')
      return
    }
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const response = await dispatch(addLocation(formData))
      if (response.payload.status == 200) {
        Swal.fire({
          title: t('settings.locations.alerts.savedTitle'),
          text: t('settings.locations.alerts.savedText'),
          icon: 'success',
          confirmButtoncolor: "green.500",
          showClass: {
            popup: 'animate__animated animate__fadeInDown',
          },
          hideClass: {
            popup: 'animate__animated animate__fadeOutUp',
          },
        })
        navigate('/settings/locations')
      }
    } catch (error) {
      Swal.fire({
        title: t('common.error'),
        text: error.message || t('settings.locations.alerts.genericError'),
        icon: 'error',
        confirmButtoncolor: "red.500",
      })
    } finally {
      setLoading(false)
    }
  }

  const isFormDirty = () => {
    return JSON.stringify(formData) !== JSON.stringify(initialFormRef.current)
  }

  const handleCancel = () => {
    if (isFormDirty()) {
      Swal.fire({
        title: t('common.confirm'),
        text: t('settings.locations.alerts.leaveWarning'),
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: t('settings.locations.alerts.leaveAnyway'),
        cancelButtonText: t('settings.locations.alerts.stayOnPage'),
        confirmButtoncolor: "red.500",
        cancelButtoncolor: "gray.500",
        showClass: {
          popup: 'animate__animated animate__fadeInDown',
        },
        hideClass: {
          popup: 'animate__animated animate__fadeOutUp',
        },
      }).then((result) => {
        if (result.isConfirmed) {
          navigate('/settings/locations')
        }
      })
    } else {
      navigate('/settings/locations')
    }
  }

  return (
    <PageContainer
      p={2}
      m={2}
      bg={bgGray50_1}
      minH="100vh"
    >
      {/* Header Section */}
      <PageHeader
        title={
          <Flex align="center" gap={3}>
            <Flex
              align="center"
              justify="center"
              w="48px"
              h="48px"
              bg="whiteAlpha.200"
              borderRadius="12px"
            >
              <MapPin size={24} style={{ color: 'white' }} />
            </Flex>
            {t('settings.locations.create.title')}
          </Flex>
        }
        subtitle={t('settings.locations.create.subtitle')}
        rightContent={
          <Button
            variant="ghost"
           
            onClick={() => navigate('/settings/locations')}
            style={{
              borderRadius: '8px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: 'white',
            }}
          >
            <ArrowLeft size={ICON_SIZE_MD} />
          </Button>
        }
      />

      {/* Form Section */}
      <StandardCard>
        <CardBody>
          <form onSubmit={handleSubmit}>
            {/* Basic Information Section */}
            <Box>
              <Heading as="h5" size="md" mb={3} fontWeight="semibold" color={borderGray700} display="flex" alignItems="center" gap={2}>
                <Flex
                  align="center"
                  justify="center"
                  style={{
                    width: '32px',
                    height: '32px',
                    backgroundColor: 'var(--chakra-colors-blue-50)',
                    borderRadius: '8px',
                    color: "blue.500",
                  }}
                >
                  <Home size={ICON_SIZE_MD} />
                </Flex>
                {t('settings.locations.form.titles.basicInfo')}
              </Heading>

              <Flex>
                <Box md={6}>
                  <FormLabel fontSize="sm" fontWeight="semibold" color={borderGray700}>
                    {t('settings.locations.form.labels.locationName')}
                    <Text as="span" color={iconRed500} ml={1}>*</Text>
                  </FormLabel>
                  <InputGroup>
                    <InputLeftElement pointerEvents="none">
                      <Icon as={MapPin} boxSize={ICON_BOX_MD} color={iconGray400} />
                    </InputLeftElement>
                    <Input
                      name="locationName"
                      value={formData.locationName}
                      onChange={handleChange}
                      isInvalid={!!errors.locationName}
                      placeholder={t('settings.locations.form.placeholders.locationName')}
                      borderColor={borderGray200}
                      fontSize="sm"
                      py={3}
                      px={4}
                    />
                  </InputGroup>
                  {errors.locationName && (
                    <FormErrorMessage>
                      {errors.locationName}
                    </FormErrorMessage>
                  )}
                </Box>
                <Box md={6}>
                  <FormLabel fontSize="sm" fontWeight="semibold" color={borderGray700}>
                    {t('settings.locations.form.labels.address')}
                    <Text as="span" color={iconRed500} ml={1}>*</Text>
                  </FormLabel>
                  <InputGroup>
                    <InputLeftElement
                      pointerEvents="none"
                      bg={inputIconBg}
                      border="1px solid"
                      borderColor={inputIconBorder}
                    >
                      <Icon as={Home} boxSize={ICON_BOX_MD} color={iconGray400} />
                    </InputLeftElement>
                    <Input
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      isInvalid={!!errors.address}
                      placeholder={t('settings.locations.form.placeholders.address')}
                      style={{
                        border: '1px solid var(--chakra-colors-gray-200)',
                        fontSize: "sm",
                        padding: '12px 16px',
                      }}
                    />
                  </InputGroup>
                  {errors.address && (
                    <FormErrorMessage>
                      {errors.address}
                    </FormErrorMessage>
                  )}
                </Box>
              </Flex>
            </Box>

            {/* Contact Information Section */}
            <Box mt={6}>
              <Heading as="h5" size="md" mb={3} fontWeight="semibold" color={borderGray700} display="flex" alignItems="center" gap={2}>
                <Flex
                  align="center"
                  justify="center"
                  style={{
                    width: '32px',
                    height: '32px',
                    backgroundColor: 'var(--chakra-colors-green-50)',
                    borderRadius: '8px',
                    color: "green.500",
                  }}
                >
                  <Mail size={ICON_SIZE_MD} />
                </Flex>
                {t('settings.locations.form.titles.contactInfo')}
              </Heading>

              <Flex>
                <Box md={6}>
                  <FormLabel fontSize="sm" fontWeight="semibold" color={borderGray700}>
                    {t('settings.locations.form.labels.website')}
                    <Text as="span" color={iconRed500} ml={1}>*</Text>
                  </FormLabel>
                  <InputGroup>
                    <InputLeftElement
                      pointerEvents="none"
                      bg={inputIconBg}
                      border="1px solid"
                      borderColor={inputIconBorder}
                    >
                      <Icon as={Mail} boxSize={ICON_BOX_MD} color={iconGray400} />
                    </InputLeftElement>
                    <Input
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      isInvalid={!!errors.website}
                      placeholder={t('settings.locations.form.placeholders.website')}
                      style={{
                        border: '1px solid var(--chakra-colors-gray-200)',
                        fontSize: "sm",
                        padding: '12px 16px',
                      }}
                    />
                  </InputGroup>
                  {errors.website && (
                    <FormErrorMessage>
                      {errors.website}
                    </FormErrorMessage>
                  )}
                </Box>
                <Box md={6}>
                  <FormLabel fontSize="sm" fontWeight="semibold" color={borderGray700}>
                    {t('settings.locations.form.labels.email')}
                    <Text as="span" color={iconRed500} ml={1}>*</Text>
                  </FormLabel>
                  <InputGroup>
                    <InputLeftElement
                      pointerEvents="none"
                      bg={inputIconBg}
                      border="1px solid"
                      borderColor={inputIconBorder}
                    >
                      <Icon as={Mail} boxSize={ICON_BOX_MD} color={iconGray400} />
                    </InputLeftElement>
                    <Input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      isInvalid={!!errors.email}
                      placeholder={t('settings.locations.form.placeholders.email')}
                      style={{
                        border: '1px solid var(--chakra-colors-gray-200)',
                        fontSize: "sm",
                        padding: '12px 16px',
                      }}
                    />
                  </InputGroup>
                  {errors.email && (
                    <FormErrorMessage>
                      {errors.email}
                    </FormErrorMessage>
                  )}
                </Box>
              </Flex>

              <Flex>
                <Box md={6}>
                  <FormLabel fontSize="sm" fontWeight="semibold" color={borderGray700}>
                    {t('settings.locations.form.labels.phone')}
                    <Text as="span" color={iconRed500} ml={1}>*</Text>
                  </FormLabel>
                  <InputGroup>
                    <InputLeftElement
                      pointerEvents="none"
                      bg={inputIconBg}
                      border="1px solid"
                      borderColor={inputIconBorder}
                    >
                      <Icon as={Phone} boxSize={ICON_BOX_MD} color={iconGray400} />
                    </InputLeftElement>
                    <Input
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      isInvalid={!!errors.phone}
                      placeholder={t('settings.locations.form.placeholders.phone')}
                      style={{
                        border: '1px solid var(--chakra-colors-gray-200)',
                        fontSize: "sm",
                        padding: '12px 16px',
                      }}
                    />
                  </InputGroup>
                  {errors.phone && (
                    <FormErrorMessage>
                      {errors.phone}
                    </FormErrorMessage>
                  )}
                </Box>
              </Flex>
            </Box>

            {/* Location & Time Settings Section */}
            <Box mt={6}>
              <Heading as="h5" size="md" mb={3} fontWeight="semibold" color={borderGray700} display="flex" alignItems="center" gap={2}>
                <Flex
                  align="center"
                  justify="center"
                  w="32px"
                  h="32px"
                  bg={timeIconBg}
                  borderRadius="8px"
                  color={timeIconColor}
                >
                  <Clock size={ICON_SIZE_MD} />
                </Flex>
                {t('settings.locations.form.titles.locationTime')}
              </Heading>

              <Flex>
                <Box md={6}>
                  <FormLabel fontSize="sm" fontWeight="semibold" color={borderGray700}>
                    {t('settings.locations.form.labels.country')}
                    <Text as="span" color={iconRed500} ml={1}>*</Text>
                  </FormLabel>
                  <Select
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    isInvalid={!!errors.country}
                    style={{
                      border: '1px solid var(--chakra-colors-gray-200)',
                      borderRadius: '8px',
                      fontSize: "sm",
                      padding: '12px 16px',
                    }}
                  >
                    <option value="">{t('settings.locations.form.select.country')}</option>
                    {countries.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                  {errors.country && (
                    <FormErrorMessage>
                      {errors.country}
                    </FormErrorMessage>
                  )}
                </Box>
                <Box md={6}>
                  <FormLabel fontSize="sm" fontWeight="semibold" color={borderGray700}>
                    {t('settings.locations.form.labels.timezone')}
                    <Text as="span" color={iconRed500} ml={1}>*</Text>
                  </FormLabel>
                  <Select
                    name="timezone"
                    value={formData.timezone}
                    onChange={handleChange}
                    isInvalid={!!errors.timezone}
                    isDisabled={!formData.country}
                    borderColor={borderGray200}
                    borderRadius="md"
                    fontSize="sm"
                    px={4}
                    py={3}
                    bg={!formData.country ? "gray.50" : 'white'}
                  >
                    <option value="">{t('settings.locations.form.select.timezone')}</option>
                    {timezonesForCountry.map((tz) => (
                      <option key={tz} value={tz}>
                        {tz}
                      </option>
                    ))}
                  </Select>
                  {errors.timezone && (
                    <FormErrorMessage>
                      {errors.timezone}
                    </FormErrorMessage>
                  )}
                </Box>
              </Flex>

              {currentTime && (
                <Flex>
                  <Box md={6}>
                    <FormLabel fontSize="sm" fontWeight="semibold" color={borderGray700}>
                      {t('settings.locations.form.labels.currentTime')}
                    </FormLabel>
                    <InputGroup>
                      <InputLeftElement
                        pointerEvents="none"
                        bg={timezoneIconBg}
                        border="1px solid"
                        borderColor={timezoneIconBorder}
                      >
                        <Icon as={Clock} boxSize={ICON_BOX_MD} color={iconGray400} />
                      </InputLeftElement>
                      <Input
                        value={currentTime}
                        readOnly
                        tabIndex={-1}
                        bg={readonlyInputBg}
                        borderColor={inputIconBorder}
                        cursor="not-allowed"
                        fontSize="sm"
                        fontWeight="500"
                        color={readonlyInputColor}
                      />
                    </InputGroup>
                    <Text fontSize="sm" color={borderGray600} mt={1}>
                      {t('settings.locations.form.hints.liveTime')}
                    </Text>
                  </Box>
                </Flex>
              )}
            </Box>

            {/* Divider */}
            <Divider my={4} borderColor={borderGray200} />

            {/* Action Buttons */}
            <Flex gap={3} justify="flex-end">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                px={4}
                py={2}
                fontWeight="semibold"
                style={{
                  border: '1px solid var(--chakra-colors-gray-200)',
                  borderRadius: '8px',
                  color: "gray.500",
                  minHeight: '44px',
                }}
                aria-label={t('common.cancel')}
              >
                <ArrowLeft size={ICON_SIZE_MD} />
                {t('common.cancel')}
              </Button>
              <Button
                type="submit"
                colorScheme="green"
                isDisabled={loading}
                minH="44px"
                px={4}
                py={2}
                fontWeight="semibold"
                borderRadius="md"
                bgGradient={loading ? undefined : "linear(45deg, green.500, teal.400)"}
                bg={loading ? "gray.500" : undefined}
                boxShadow="0 2px 4px rgba(40, 167, 69, 0.2)"
                style={{
                  border: 'none',
                  minHeight: '44px',
                }}
              >
                {loading ? (
                  <>
                    <Spinner size="sm" mr={2} />
                    {t('settings.locations.create.saving')}
                  </>
                ) : (
                  <>
                    <CheckCircle size={ICON_SIZE_MD} />
                    {t('settings.locations.create.submit')}
                  </>
                )}
              </Button>
            </Flex>
          </form>
        </CardBody>
      </StandardCard>
    </PageContainer>
  )
}

export default LocationForm
