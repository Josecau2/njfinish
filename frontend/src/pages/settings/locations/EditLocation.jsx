import { useEffect, useState, useMemo, useRef } from 'react'
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Container,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Input,
  Select,
  SimpleGrid,
  Stack,
  Text,
} from '@chakra-ui/react'
import { useNavigate, useParams } from 'react-router-dom'
import { decodeParam } from '../../../utils/obfuscate'
import Swal from 'sweetalert2'
import ct from 'countries-and-timezones'
import { formatDateTime, getCurrentDate } from '../../../utils/dateHelpers'
import { fetchLocationById, updateLocation } from '../../../store/slices/locationSlice'
import { useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'

const INITIAL_FORM = {
  locationName: '',
  address: '',
  website: '',
  email: '',
  phone: '',
  country: '',
  timezone: '',
}

const EditLocation = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id: rawId } = useParams()
  const locationId = useMemo(() => decodeParam(rawId), [rawId])
  const dispatch = useDispatch()

  const [formData, setFormData] = useState(INITIAL_FORM)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [currentTime, setCurrentTime] = useState('')
  const initialFormRef = useRef(INITIAL_FORM)

  const countries = useMemo(() => Object.values(ct.getAllCountries()), [])
  const timezonesForCountry = useMemo(() => {
    if (!formData.country) return []
    return ct.getCountry(formData.country)?.timezones || []
  }, [formData.country])

  useEffect(() => {
    const loadLocation = async () => {
      if (!locationId) return
      try {
        const data = await dispatch(fetchLocationById(locationId)).unwrap()
        if (data) {
          setFormData({
            locationName: data.locationName || '',
            address: data.address || '',
            website: data.website || '',
            email: data.email || '',
            phone: data.phone || '',
            country: data.country || '',
            timezone: data.timezone || '',
          })
          initialFormRef.current = {
            locationName: data.locationName || '',
            address: data.address || '',
            website: data.website || '',
            email: data.email || '',
            phone: data.phone || '',
            country: data.country || '',
            timezone: data.timezone || '',
          }
        }
      } catch (error) {
        Swal.fire(t('common.error'), t('settings.locations.edit.loadFailedOne'), 'error')
      }
    }

    loadLocation()
  }, [dispatch, locationId, t])

  useEffect(() => {
    if (!formData.timezone) return undefined

    const updateClock = () => {
      setCurrentTime(formatDateTime(getCurrentDate(), formData.timezone))
    }

    updateClock()
    const timer = setInterval(updateClock, 1000)

    return () => clearInterval(timer)
  }, [formData.timezone])

  const validate = () => {
    const validationErrors = {}

    if (!formData.locationName.trim()) {
      validationErrors.locationName = t('settings.locations.form.validation.locationNameRequired')
    }
    if (!formData.address.trim()) {
      validationErrors.address = t('settings.locations.form.validation.addressRequired')
    }
    if (!formData.website.trim()) {
      validationErrors.website = t('settings.locations.form.validation.websiteRequired')
    }
    if (!formData.email.trim()) {
      validationErrors.email = t('settings.locations.form.validation.emailRequired')
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      validationErrors.email = t('settings.locations.form.validation.invalidEmail')
    }
    if (!formData.phone.trim()) {
      validationErrors.phone = t('settings.locations.form.validation.phoneRequired')
    }
    if (!formData.country) {
      validationErrors.country = t('settings.locations.form.validation.countryRequired')
    }
    if (!formData.timezone) {
      validationErrors.timezone = t('settings.locations.form.validation.timezoneRequired')
    }

    setErrors(validationErrors)
    return Object.keys(validationErrors).length === 0
  }

  const handleChange = (event) => {
    const { name, value } = event.target

    if (name === 'country') {
      const availableTimezones = ct.getCountry(value)?.timezones || []
      const nextTimezone = availableTimezones[0] || ''

      setFormData((prev) => ({ ...prev, country: value, timezone: nextTimezone }))
      setCurrentTime(nextTimezone ? formatDateTime(getCurrentDate(), nextTimezone) : '')
      return
    }

    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const isFormDirty = () => JSON.stringify(formData) !== JSON.stringify(initialFormRef.current)

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!validate()) return

    setLoading(true)

    try {
      const response = await dispatch(updateLocation({ id: locationId, data: formData })).unwrap()
      if (response?.status === 200 || response?.success) {
        Swal.fire(
          t('settings.locations.alerts.updatedTitle'),
          t('settings.locations.alerts.updatedText'),
          'success',
        )
        navigate('/settings/locations')
      }
    } catch (error) {
      Swal.fire(
        t('common.error'),
        error?.message || t('settings.locations.alerts.genericError'),
        'error',
      )
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    if (!isFormDirty()) {
      navigate('/settings/locations')
      return
    }

    Swal.fire({
      title: t('common.confirm'),
      text: t('settings.locations.alerts.leaveWarning'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: t('settings.locations.alerts.leaveAnyway'),
      cancelButtonText: t('settings.locations.alerts.stayOnPage'),
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
    }).then((result) => {
      if (result.isConfirmed) {
        navigate('/settings/locations')
      }
    })
  }

  return (
    <Container maxW="4xl" py={8}>
      <form onSubmit={handleSubmit} noValidate>
        <Card>
          <CardHeader>
            <Heading size="md">{t('settings.locations.edit.title', 'Edit Location')}</Heading>
            <Text mt={2} color="gray.600">
              {t('settings.locations.edit.subtitle', 'Update your location details below.')}
            </Text>
          </CardHeader>
          <CardBody>
            <Stack spacing={6}>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                <FormControl isRequired isInvalid={!!errors.locationName}>
                  <FormLabel>{t('settings.locations.form.labels.locationName')}</FormLabel>
                  <Input name="locationName" value={formData.locationName} onChange={handleChange} />
                  <FormErrorMessage>{errors.locationName}</FormErrorMessage>
                </FormControl>

                <FormControl isRequired isInvalid={!!errors.address}>
                  <FormLabel>{t('settings.locations.form.labels.address')}</FormLabel>
                  <Input name="address" value={formData.address} onChange={handleChange} />
                  <FormErrorMessage>{errors.address}</FormErrorMessage>
                </FormControl>
              </SimpleGrid>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                <FormControl isRequired isInvalid={!!errors.website}>
                  <FormLabel>{t('settings.locations.form.labels.website')}</FormLabel>
                  <Input name="website" value={formData.website} onChange={handleChange} />
                  <FormErrorMessage>{errors.website}</FormErrorMessage>
                </FormControl>

                <FormControl isRequired isInvalid={!!errors.email}>
                  <FormLabel>{t('settings.locations.form.labels.email')}</FormLabel>
                  <Input type="email" name="email" value={formData.email} onChange={handleChange} />
                  <FormErrorMessage>{errors.email}</FormErrorMessage>
                </FormControl>
              </SimpleGrid>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                <FormControl isRequired isInvalid={!!errors.phone}>
                  <FormLabel>{t('settings.locations.form.labels.phone')}</FormLabel>
                  <Input name="phone" value={formData.phone} onChange={handleChange} />
                  <FormErrorMessage>{errors.phone}</FormErrorMessage>
                </FormControl>

                <FormControl isRequired isInvalid={!!errors.country}>
                  <FormLabel>{t('settings.locations.form.labels.country')}</FormLabel>
                  <Select name="country" value={formData.country} onChange={handleChange}>
                    <option value="">{t('settings.locations.form.select.country')}</option>
                    {countries.map((country) => (
                      <option key={country.id} value={country.id}>
                        {country.name}
                      </option>
                    ))}
                  </Select>
                  <FormErrorMessage>{errors.country}</FormErrorMessage>
                </FormControl>
              </SimpleGrid>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                <FormControl isRequired isInvalid={!!errors.timezone}>
                  <FormLabel>{t('settings.locations.form.labels.timezone')}</FormLabel>
                  <Select name="timezone" value={formData.timezone} onChange={handleChange}>
                    <option value="">{t('settings.locations.form.select.timezone')}</option>
                    {timezonesForCountry.map((tz) => (
                      <option key={tz} value={tz}>
                        {tz}
                      </option>
                    ))}
                  </Select>
                  <FormErrorMessage>{errors.timezone}</FormErrorMessage>
                </FormControl>

                <FormControl>
                  <FormLabel>{t('settings.locations.form.labels.currentTime')}</FormLabel>
                  <Input value={currentTime} isReadOnly tabIndex={-1} bg="gray.100" cursor="not-allowed" />
                </FormControl>
              </SimpleGrid>

              <Box pt={2}>
                <Text fontSize="sm" color="gray.500">
                  {t('settings.locations.edit.timezoneHelp', 'Current time updates automatically based on the selected timezone.')}
                </Text>
              </Box>
            </Stack>

            <Stack direction={{ base: 'column', sm: 'row' }} spacing={3} mt={8} justify="flex-end">
              <Button variant="outline" colorScheme="gray" onClick={handleCancel}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" colorScheme="blue" isLoading={loading} loadingText={t('settings.locations.edit.updating')}>
                {t('settings.locations.edit.update')}
              </Button>
            </Stack>
          </CardBody>
        </Card>
      </form>
    </Container>
  )
}

export default EditLocation
