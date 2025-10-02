import StandardCard from '../../components/StandardCard'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Button, CardBody, CardHeader, Flex, FormControl, FormErrorMessage, FormLabel, Input, Select, SimpleGrid, Spinner } from '@chakra-ui/react'
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

  const accentColor = customization?.headerBg || "blue.600"
  const accentTextColor = getContrastColor(accentColor)

  // Show loader while initial data is loading
  if (isLoading) {
    return (
      <Box className="profile-container" role="status" aria-live="polite">
        <StandardCard className="profile-card">
          <CardBody minH="400px"
          >
            <Spinner color={accentColor} size="lg" />
          </CardBody>
        </StandardCard>
      </Box>
    )
  }

  return (
    <Box className="profile-container">
      <style>{`
        .profile-form input, .profile-form select, .profile-form button { min-height:44px; }
        @media (max-width: 576px) {
          .profile-card { margin: 0 .5rem; }
        }
      `}</style>
      <StandardCard className="profile-card">
        <CardHeader>
          <h4>{t('profile.header')}</h4>
        </CardHeader>
        <CardBody>
          <Box as="form" onSubmit={handleSubmit} className="profile-form">
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
              <FormControl isRequired isInvalid={!!errors.name}>
                <FormLabel htmlFor="name" fontSize="sm" fontWeight="medium" color="gray.700">
                  {t('profile.fullName')}
                  <Text as="span" color="red.500" ml={1}>*</Text>
                </FormLabel>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  aria-required="true"
                  aria-invalid={!!errors.name}
                  placeholder={t('profile.enterName')}
                />
                <FormErrorMessage>{errors.name}</FormErrorMessage>
              </FormControl>

              <FormControl>
                <FormLabel htmlFor="email">{t('auth.email')}</FormLabel>
                <Input
                  id="email"
                  name="email"
                  value={formData.email}
                  isReadOnly
                  bg="gray.100"
                  cursor="not-allowed"
                  aria-readonly="true"
                />
              </FormControl>

              <FormControl>
                <FormLabel htmlFor="password">{t('profile.newPassword')}</FormLabel>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={t('profile.leaveBlank')}
                />
              </FormControl>

              <FormControl isInvalid={!!errors.confirmPassword}>
                <FormLabel htmlFor="confirmPassword">{t('profile.confirmPassword')}</FormLabel>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  aria-invalid={!!errors.confirmPassword}
                  placeholder={t('profile.reenterPassword')}
                />
                <FormErrorMessage>{errors.confirmPassword}</FormErrorMessage>
              </FormControl>

              {!isContractor && (
                <FormControl isRequired isInvalid={!!errors.location}>
                  <FormLabel htmlFor="location" fontSize="sm" fontWeight="medium" color="gray.700">
                    {t('profile.location')}
                    <Text as="span" color="red.500" ml={1}>*</Text>
                  </FormLabel>
                  <Select
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    aria-required="true"
                    placeholder={`-- ${t('profile.selectLocation')} --`}
                  >
                    {(locations || []).map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.locationName}
                      </option>
                    ))}
                  </Select>
                  <FormErrorMessage>{errors.location}</FormErrorMessage>
                </FormControl>
              )}
            </SimpleGrid>

            <Flex justify={{ base: 'center', md: 'flex-end' }} mt={6}>
              <Button
                type="submit"
                px={4}
                isDisabled={submitting}
                bg={accentColor}
                color={accentTextColor}
                border="none"
                _hover={{ bg: accentColor }}
              >
                {submitting ? (
                  <>
                    <Spinner size="sm" mr={2} color={accentTextColor} /> {t('profile.saving')}
                  </>
                ) : (
                  t('profile.updateProfile')
                )}
              </Button>
            </Flex>
          </Box>
        </CardBody>
      </StandardCard>
    </Box>
  )
}

export default ProfilePage
