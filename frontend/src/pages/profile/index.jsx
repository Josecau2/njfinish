import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FormControl, Input, FormLabel, Card, CardBody, CardHeader, Container, Flex, Box, Select, Spinner, Button, FormErrorMessage } from '@chakra-ui/react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchUserById, updateUser } from '../../store/slices/userSlice'
import Swal from 'sweetalert2'
import { fetchLocations } from '../../store/slices/locationSlice'
import axiosInstance from '../../helpers/axiosInstance'
import { getContrastColor } from '../../utils/colorUtils'

const ProfilePage = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const loggedInUser = JSON.parse(localStorage.getItem('user'))
  const loggedInUserId = loggedInUser?.userId
  const isContractor = loggedInUser?.group?.group_type === 'contractor'
  const { selected, loading: userLoading } = useSelector((state) => state.users)
  const { list: locations, loading: locationsLoading } = useSelector((state) => state.locations)
  const customization = useSelector((state) => state.customization)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    location: '',
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const initialFormRef = useRef(formData)

  // Combined loading state for initial data fetch
  const isLoading = userLoading || locationsLoading

  useEffect(() => {
    const load = async () => {
      if (isContractor) {
        try {
          const res = await axiosInstance.get('/api/me')
          const me = res.data
          const data = {
            name: me.name || '',
            email: me.email || '',
            password: '',
            confirmPassword: '',
            location: '',
          }
          setFormData(data)
          initialFormRef.current = data
        } catch (e) {
          // If /api/me isn't available yet (404), fall back to legacy fetch by ID
          if (loggedInUserId) {
            await dispatch(fetchUserById(loggedInUserId))
          }
        }
      } else {
        if (loggedInUserId) {
          dispatch(fetchUserById(loggedInUserId))
        }
        dispatch(fetchLocations())
      }
    }
    load()
  }, [dispatch, loggedInUserId, isContractor])

  useEffect(() => {
    if (!isContractor && selected) {
      const data = {
        name: selected.name || '',
        email: selected.email || '',
        password: '',
        confirmPassword: '',
        location: selected.location || '',
      }
      setFormData(data)
      initialFormRef.current = data
    }
  }, [selected, isContractor])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.name.trim()) newErrors.name = t('profile.validation.nameRequired')
    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = t('profile.validation.passwordMismatch')
    if (!isContractor && !formData.location.trim())
      newErrors.location = t('profile.validation.locationRequired')

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    try {
      if (isContractor) {
        const body = { name: formData.name }
        if (formData.password && formData.password.trim() !== '') body.password = formData.password
        const res = await axiosInstance.put('/api/me', body)
        if (res?.data?.status === 200 || res?.status === 200) {
          Swal.fire(t('common.success'), t('profile.updateSuccess'), 'success')
        } else {
          throw new Error(res?.data?.message || t('profile.updateFailed'))
        }
      } else {
        const payload = { ...formData }
        delete payload.confirmPassword
        const response = await dispatch(updateUser({ id: loggedInUserId, data: payload }))
        if (response?.payload?.status === 200) {
          Swal.fire(t('common.success'), t('profile.updateSuccess'), 'success')
        } else {
          throw new Error(response?.payload?.message || t('profile.updateFailed'))
        }
      }
    } catch (error) {
      Swal.fire(t('common.error'), error.message || t('profile.errorGeneric'), 'error')
    } finally {
      setSubmitting(false)
    }
  }

  // Show loader while initial data is loading
  if (isLoading) {
    return (
      <div className="profile-container" role="status" aria-live="polite">
        <Card className="profile-card">
          <CardBody
            className="d-flex justify-content-center align-items-center"
            style={{ minHeight: '400px' }}
          >
            <Spinner colorScheme="blue" size="lg" />
          </CardBody>
        </Card>
      </div>
  
  )
  }

  return (
    <div className="profile-container">
      <style>{`
        .profile-form input, .profile-form select, .profile-form button { min-height:44px; }
        @media (max-width: 576px) {
          .profile-card { margin: 0 .5rem; }
        }
      `}</style>
      <Card className="profile-card">
        <CardHeader>
          <h4 className="mb-0">{t('profile.header')}</h4>
        </CardHeader>
        <CardBody>
          <FormControl onSubmit={handleSubmit} className="profile-form">
            <Flex className="gy-4">
              <Box xs={12} md={6}>
                <FormLabel htmlFor="name">
                  {t('profile.fullName')}
                  <span style={{ color: 'red', marginLeft: '4px' }}>*</span>
                </FormLabel>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  invalid={!!errors.name}
                  aria-required="true"
                  aria-invalid={!!errors.name}
                  placeholder={t('profile.enterName')}
                />
                {errors.name && <FormErrorMessage>{errors.name}</FormErrorMessage>}
              </Box>

              <Box xs={12} md={6}>
                <FormLabel htmlFor="email">{t('auth.email')}</FormLabel>
                <Input
                  id="email"
                  name="email"
                  value={formData.email}
                  disabled
                  style={{ backgroundColor: '#e9ecef', cursor: 'not-allowed' }}
                  aria-readonly="true"
                />
              </Box>

              <Box xs={12} md={6}>
                <FormLabel htmlFor="password">{t('profile.newPassword')}</FormLabel>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={t('profile.leaveBlank')}
                />
              </Box>

              <Box xs={12} md={6}>
                <FormLabel htmlFor="confirmPassword">{t('profile.confirmPassword')}</FormLabel>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  invalid={!!errors.confirmPassword}
                  aria-invalid={!!errors.confirmPassword}
                  placeholder={t('profile.reenterPassword')}
                />
                {errors.confirmPassword && <FormErrorMessage>{errors.confirmPassword}</FormErrorMessage>}
              </Box>

              {!isContractor && (
                <Box xs={12} md={6}>
                  <FormLabel htmlFor="location">
                    {t('profile.location')}
                    <span style={{ color: 'red', marginLeft: '4px' }}>*</span>
                  </FormLabel>
                  <Select
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    invalid={!!errors.location}
                    aria-required="true"
                  >
                    <option value="">-- {t('profile.selectLocation')} --</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.locationName}
                      </option>
                    ))}
                  </Select>
                  {errors.location && <FormErrorMessage>{errors.location}</FormErrorMessage>}
                </Box>
              )}
            </Flex>

            <div className="d-flex justify-content-center justify-content-md-end mt-4">
              <Button
                type="submit"
                className="px-4"
                disabled={submitting}
                style={{
                  backgroundColor: customization?.headerBg || '#321fdb',
                  borderColor: customization?.headerBg || '#321fdb',
                  color: getContrastColor(customization?.headerBg || '#321fdb'),
                  border: 'none',
                }}
              >
                {submitting ? (
                  <>
                    <Spinner size="sm" className="me-2" /> {t('profile.saving')}
                  </>
                ) : (
                  t('profile.updateProfile')
                )}
              </Button>
            </div>
          </FormControl>
        </CardBody>
      </Card>
    </div>
  )
}

export default ProfilePage
