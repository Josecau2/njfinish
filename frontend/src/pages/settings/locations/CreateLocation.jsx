import { useEffect, useState, useRef } from 'react'
import { FormControl, Input, FormLabel, Select, Card, CardBody, CardHeader, Container, Flex, Box, Icon, Button, InputGroup, InputLeftElement, FormErrorMessage } from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'
import ct from 'countries-and-timezones'
import { formatDate, formatDateTime, getCurrentDate } from '../../../utils/dateHelpers'
import { addLocation } from '../../../store/slices/locationSlice'
import { useDispatch } from 'react-redux'
import PageHeader from '../../../components/PageHeader'
import { Mail, Clock, ArrowLeft, CheckCircle, MapPin, Home, Phone } from 'lucide-react'
import { useTranslation } from 'react-i18next'

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
          confirmButtonColor: '#28a745',
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
        confirmButtonColor: '#dc3545',
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
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
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
    <Container
      fluid
      className="p-2 m-2"
      style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}
    >
      {/* Header Section */}
      <PageHeader
        title={
          <div className="d-flex align-items-center gap-3">
            <div
              className="d-flex align-items-center justify-content-center"
              style={{
                width: '48px',
                height: '48px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
              }}
            >
              <Icon as={MapPin} style={{ fontSize: '24px', color: 'white' }} />
            </div>
            {t('settings.locations.create.title')}
          </div>
        }
        subtitle={t('settings.locations.create.subtitle')}
        rightContent={
          <Button
            variant="ghost"
            className="p-2"
            onClick={() => navigate('/settings/locations')}
            style={{
              borderRadius: '8px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: 'white',
            }}
          >
            <Icon as={ArrowLeft} />
          </Button>
        }
      />

      {/* Form Section */}
      <Card className="border-0 shadow-sm">
        <CardBody className="p-4">
          <form onSubmit={handleSubmit}>
            {/* Basic Information Section */}
            <div className="mb-4">
              <h5 className="mb-3 text-dark fw-semibold d-flex align-items-center gap-2">
                <div
                  className="d-flex align-items-center justify-content-center"
                  style={{
                    width: '32px',
                    height: '32px',
                    backgroundColor: '#e7f3ff',
                    borderRadius: '8px',
                    color: '#0d6efd',
                  }}
                >
                  <Icon as={Home} size="sm" />
                </div>
                {t('settings.locations.form.titles.basicInfo')}
              </h5>

              <Flex className="mb-3">
                <Box md={6}>
                  <FormLabel className="fw-semibold text-dark">
                    {t('settings.locations.form.labels.locationName')}
                    <span style={{ color: '#dc3545', marginLeft: '4px' }}>*</span>
                  </FormLabel>
                  <InputGroup>
                    <InputLeftElement
                      pointerEvents="none"
                      style={{ backgroundColor: '#f8f9fa', border: '1px solid #e3e6f0' }}
                    >
                      <Icon as={MapPin} className="text-primary" />
                    </InputLeftElement>
                    <Input
                      name="locationName"
                      value={formData.locationName}
                      onChange={handleChange}
                      isInvalid={!!errors.locationName}
                      placeholder={t('settings.locations.form.placeholders.locationName')}
                      style={{
                        border: '1px solid #e3e6f0',
                        fontSize: '14px',
                        padding: '12px 16px',
                      }}
                    />
                  </InputGroup>
                  {errors.locationName && (
                    <FormErrorMessage>
                      {errors.locationName}
                    </FormErrorMessage>
                  )}
                </Box>
                <Box md={6}>
                  <FormLabel className="fw-semibold text-dark">
                    {t('settings.locations.form.labels.address')}
                    <span style={{ color: '#dc3545', marginLeft: '4px' }}>*</span>
                  </FormLabel>
                  <InputGroup>
                    <InputLeftElement
                      pointerEvents="none"
                      style={{ backgroundColor: '#f8f9fa', border: '1px solid #e3e6f0' }}
                    >
                      <Icon as={Home} className="text-success" />
                    </InputLeftElement>
                    <Input
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      isInvalid={!!errors.address}
                      placeholder={t('settings.locations.form.placeholders.address')}
                      style={{
                        border: '1px solid #e3e6f0',
                        fontSize: '14px',
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
            </div>

            {/* Contact Information Section */}
            <div className="mb-4">
              <h5 className="mb-3 text-dark fw-semibold d-flex align-items-center gap-2">
                <div
                  className="d-flex align-items-center justify-content-center"
                  style={{
                    width: '32px',
                    height: '32px',
                    backgroundColor: '#e6f7e6',
                    borderRadius: '8px',
                    color: '#28a745',
                  }}
                >
                  <Icon as={Mail} size="sm" />
                </div>
                {t('settings.locations.form.titles.contactInfo')}
              </h5>

              <Flex className="mb-3">
                <Box md={6}>
                  <FormLabel className="fw-semibold text-dark">
                    {t('settings.locations.form.labels.website')}
                    <span style={{ color: '#dc3545', marginLeft: '4px' }}>*</span>
                  </FormLabel>
                  <InputGroup>
                    <InputLeftElement
                      pointerEvents="none"
                      style={{ backgroundColor: '#f8f9fa', border: '1px solid #e3e6f0' }}
                    >
                      <Icon as={Mail} className="text-info" />
                    </InputLeftElement>
                    <Input
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      isInvalid={!!errors.website}
                      placeholder={t('settings.locations.form.placeholders.website')}
                      style={{
                        border: '1px solid #e3e6f0',
                        fontSize: '14px',
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
                  <FormLabel className="fw-semibold text-dark">
                    {t('settings.locations.form.labels.email')}
                    <span style={{ color: '#dc3545', marginLeft: '4px' }}>*</span>
                  </FormLabel>
                  <InputGroup>
                    <InputLeftElement
                      pointerEvents="none"
                      style={{ backgroundColor: '#f8f9fa', border: '1px solid #e3e6f0' }}
                    >
                      <Icon as={Mail} className="text-warning" />
                    </InputLeftElement>
                    <Input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      isInvalid={!!errors.email}
                      placeholder={t('settings.locations.form.placeholders.email')}
                      style={{
                        border: '1px solid #e3e6f0',
                        fontSize: '14px',
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

              <Flex className="mb-3">
                <Box md={6}>
                  <FormLabel className="fw-semibold text-dark">
                    {t('settings.locations.form.labels.phone')}
                    <span style={{ color: '#dc3545', marginLeft: '4px' }}>*</span>
                  </FormLabel>
                  <InputGroup>
                    <InputLeftElement
                      pointerEvents="none"
                      style={{ backgroundColor: '#f8f9fa', border: '1px solid #e3e6f0' }}
                    >
                      <Icon as={Phone} className="text-success" />
                    </InputLeftElement>
                    <Input
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      isInvalid={!!errors.phone}
                      placeholder={t('settings.locations.form.placeholders.phone')}
                      style={{
                        border: '1px solid #e3e6f0',
                        fontSize: '14px',
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
            </div>

            {/* Location & Time Settings Section */}
            <div className="mb-4">
              <h5 className="mb-3 text-dark fw-semibold d-flex align-items-center gap-2">
                <div
                  className="d-flex align-items-center justify-content-center"
                  style={{
                    width: '32px',
                    height: '32px',
                    backgroundColor: '#fff3cd',
                    borderRadius: '8px',
                    color: '#856404',
                  }}
                >
                  <Icon as={Clock} size="sm" />
                </div>
                {t('settings.locations.form.titles.locationTime')}
              </h5>

              <Flex className="mb-3">
                <Box md={6}>
                  <FormLabel className="fw-semibold text-dark">
                    {t('settings.locations.form.labels.country')}
                    <span style={{ color: '#dc3545', marginLeft: '4px' }}>*</span>
                  </FormLabel>
                  <Select
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    isInvalid={!!errors.country}
                    style={{
                      border: '1px solid #e3e6f0',
                      borderRadius: '8px',
                      fontSize: '14px',
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
                  <FormLabel className="fw-semibold text-dark">
                    {t('settings.locations.form.labels.timezone')}
                    <span style={{ color: '#dc3545', marginLeft: '4px' }}>*</span>
                  </FormLabel>
                  <Select
                    name="timezone"
                    value={formData.timezone}
                    onChange={handleChange}
                    isInvalid={!!errors.timezone}
                    disabled={!formData.country}
                    style={{
                      border: '1px solid #e3e6f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      padding: '12px 16px',
                      backgroundColor: !formData.country ? '#f8f9fa' : 'white',
                    }}
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
                <Flex className="mb-3">
                  <Box md={6}>
                    <FormLabel className="fw-semibold text-dark">
                      {t('settings.locations.form.labels.currentTime')}
                    </FormLabel>
                    <InputGroup>
                      <InputLeftElement
                        pointerEvents="none"
                        style={{ backgroundColor: '#e7f3ff', border: '1px solid #b6d7ff' }}
                      >
                        <Icon as={Clock} className="text-primary" />
                      </InputLeftElement>
                      <Input
                        value={currentTime}
                        readOnly
                        tabIndex={-1}
                        style={{
                          backgroundColor: '#f8f9fa',
                          border: '1px solid #e3e6f0',
                          cursor: 'not-allowed',
                          fontSize: '14px',
                          fontWeight: '500',
                          color: '#495057',
                        }}
                      />
                    </InputGroup>
                    <small className="text-muted">
                      {t('settings.locations.form.hints.liveTime')}
                    </small>
                  </Box>
                </Flex>
              )}
            </div>

            {/* Divider */}
            <hr className="my-4" style={{ border: '1px solid #e3e6f0' }} />

            {/* Action Buttons */}
            <div className="d-flex gap-3 justify-content-end">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                className="px-4 py-2 fw-semibold"
                style={{
                  border: '1px solid #e3e6f0',
                  borderRadius: '8px',
                  color: '#6c757d',
                  minHeight: '44px',
                }}
                aria-label={t('common.cancel')}
              >
                <Icon as={ArrowLeft} className="me-2" />
                {t('common.cancel')}
              </Button>
              <Button
                type="submit"
                colorScheme="green"
                disabled={loading}
                className="px-4 py-2 fw-semibold"
                style={{
                  border: 'none',
                  borderRadius: '8px',
                  background: loading ? '#6c757d' : 'linear-gradient(45deg, #28a745, #20c997)',
                  boxShadow: '0 2px 4px rgba(40, 167, 69, 0.2)',
                  minHeight: '44px',
                }}
              >
                {loading ? (
                  <>
                    <div className="spinner-border spinner-border-sm me-2" role="status">
                      <span className="visually-hidden">{t('common.loading')}</span>
                    </div>
                    {t('settings.locations.create.saving')}
                  </>
                ) : (
                  <>
                    <Icon as={CheckCircle} className="me-2" />
                    {t('settings.locations.create.submit')}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </Container>
  )
}

export default LocationForm
