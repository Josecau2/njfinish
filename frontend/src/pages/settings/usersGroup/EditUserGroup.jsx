
import { useEffect, useRef, useState } from 'react'
import { Box, Button, Container, Flex, FormControl, FormErrorMessage, FormLabel, HStack, Icon, Input, InputGroup, InputLeftElement, Select, SimpleGrid, Spinner, Stack, Switch, Text } from '@chakra-ui/react'
import StandardCard from '../../../components/StandardCard'
import { User, Settings, ArrowLeft, Save, Users } from '@/icons-lucide'
import { useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import { decodeParam } from '../../../utils/obfuscate'
import Swal from 'sweetalert2'
import axiosInstance from '../../../helpers/axiosInstance'
import { useTranslation } from 'react-i18next'
import PageHeader from '../../../components/PageHeader'
import { getContrastColor } from '../../../utils/colorUtils'

const FormSection = ({ title, icon, customization, children }) => (
  <StandardCard variant="outline" borderRadius="xl" shadow="sm">
    <CardBody>
      <HStack spacing={4} align="center" mb={4}>
        <Flex
          align="center"
          justify="center"
          w="32px"
          h="32px"
          borderRadius="full"
          bg={`${(customization.headerBg || "purple.500")}20`}
          color={customization.headerBg || "purple.500"}
        >
          <Icon as={icon} boxSize={4} />
        </Flex>
        <Text fontWeight="semibold" color="gray.800">
          {title}
        </Text>
      </HStack>
      <Stack spacing={4}>{children}</Stack>
    </CardBody>
  </StandardCard>
)

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
}) => (
  <FormControl isRequired={required} isInvalid={isInvalid} mb={4}>
    <FormLabel htmlFor={name} fontSize="sm" fontWeight="medium" color="gray.700">
      {label}
    </FormLabel>
    <InputGroup>
      {icon && (
        <InputLeftElement pointerEvents="none">
          <Icon as={icon} boxSize={4} color="gray.500" />
        </InputLeftElement>
      )}
      <Input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        borderRadius="md"
        fontSize="sm"
        minH="44px"
        {...props}
      />
    </InputGroup>
    {feedback && <FormErrorMessage>{feedback}</FormErrorMessage>}
  </FormControl>
)

const initialForm = {
  name: '',
  group_type: 'standard',
  modules: {
    dashboard: false,
    proposals: false,
    customers: false,
    resources: false,
  },
}

const moduleDescriptionKeys = {
  dashboard: 'settings.userGroups.moduleDescriptions.dashboard',
  proposals: 'settings.userGroups.moduleDescriptions.proposals',
  customers: 'settings.userGroups.moduleDescriptions.customers',
  resources: 'settings.userGroups.moduleDescriptions.resources',
}

const EditUserGroupForm = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id: rawId } = useParams()
  const id = decodeParam(rawId)
  const [formData, setFormData] = useState(initialForm)
  const initialFormRef = useRef(initialForm)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const customization = useSelector((state) => state.customization)

  useEffect(() => {
    const fetchUserGroup = async () => {
      try {
        const response = await axiosInstance.get(`/api/usersgroups/${id}`)
        if (response.data.user) {
          const userData = {
            name: response.data.user.name || '',
            group_type: response.data.user.group_type || 'standard',
            modules: response.data.user.modules || initialForm.modules,
          }
          setFormData(userData)
          initialFormRef.current = userData
        }
      } catch (error) {
        console.error('Error fetching user group:', error)
        Swal.fire(t('common.error'), t('settings.userGroups.edit.loadFailedOne'), 'error')
        navigate('/settings/users')
      } finally {
        setLoadingData(false)
      }
    }

    if (id) {
      fetchUserGroup()
    }
  }, [id, navigate, t])

  const validate = () => {
    const newErrors = {}
    if (!formData.name.trim()) {
      newErrors.name = t('settings.userGroups.form.validation.nameRequired')
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const response = await axiosInstance.put(`/api/usersgroups/${id}`, formData)
      if (response.data.status === 200) {
        Swal.fire(
          `${t('common.success')}!`,
          response.data.message || t('settings.userGroups.alerts.updated'),
          'success',
        )
        navigate('/settings/users')
      }
    } catch (error) {
      Swal.fire(
        t('common.error'),
        error.message || t('settings.userGroups.alerts.genericError'),
        'error',
      )
    } finally {
      setLoading(false)
    }
  }

  const isFormDirty = () => JSON.stringify(formData) !== JSON.stringify(initialFormRef.current)

  const handleCancel = () => {
    if (isFormDirty()) {
      Swal.fire({
        title: t('common.confirm'),
        text: t('settings.userGroups.alerts.leaveWarning'),
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: t('settings.userGroups.alerts.leaveAnyway'),
        cancelButtonText: t('settings.userGroups.alerts.stayOnPage'),
        confirmButtonColor: 'var(--chakra-colors-red-500)',
        cancelButtoncolor: "gray.500",
      }).then((result) => {
        if (result.isConfirmed) {
          navigate('/settings/users')
        }
      })
    } else {
      navigate('/settings/users')
    }
  }

  if (loadingData) {
    return (
      <Container maxW="4xl" py={12}>
        <Flex direction="column" align="center" justify="center" minH="300px" gap={4}>
          <Spinner size="lg" color={customization.headerBg ? undefined : 'blue.500'} thickness="4px" speed="0.7s" />
          <Text color="gray.500">{t('settings.userGroups.edit.loadingOne')}</Text>
        </Flex>
      </Container>
    )
  }

  return (
    <Container maxW="4xl" py={6}>
      <PageHeader
        title={t('settings.userGroups.edit.title')}
        subtitle={t('settings.userGroups.edit.subtitle')}
        icon={Users}
        actions={[
          <Button
            key="back"
            variant="outline"
            colorScheme="gray"
            leftIcon={<Icon as={ArrowLeft} boxSize={4} aria-hidden="true" />}
            onClick={handleCancel}
            minH="44px"
          >
            {t('common.back')}
          </Button>,
        ]}
      />

      <Box as="form" onSubmit={handleSubmit} className="user-group-edit">
        <Stack spacing={6}>
          <FormSection title={t('settings.userGroups.form.titles.groupInfo')} icon={Users} customization={customization}>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <CustomFormInput
                label={t('settings.userGroups.form.labels.name')}
                name="name"
                required
                icon={User}
                placeholder={t('settings.userGroups.form.placeholders.name')}
                value={formData.name}
                onChange={handleChange}
                isInvalid={!!errors.name}
                feedback={errors.name}
              />

              <FormControl isRequired mb={4}>
                <FormLabel fontSize="sm" fontWeight="medium" color="gray.700">
                  {t('settings.userGroups.form.labels.type')}
                </FormLabel>
                <Select
                  name="group_type"
                  value={formData.group_type}
                  onChange={handleChange}
                  borderRadius="md"
                  minH="44px"
                  fontSize="sm"
                >
                  <option value="standard">{t('settings.userGroups.types.standard')}</option>
                  <option value="contractor">{t('settings.userGroups.types.contractor')}</option>
                </Select>
              </FormControl>
            </SimpleGrid>
          </FormSection>

          {formData.group_type === 'contractor' && (
            <FormSection
              title={t('settings.userGroups.form.titles.modulePermissions')}
              icon={Settings}
              customization={customization}
            >
              <Box borderRadius="lg" bg="blue.50" borderWidth="1px" borderColor="blue.100" p={4}>
                <HStack align="flex-start" spacing={4}>
                  <Flex
                    align="center"
                    justify="center"
                    w="32px"
                    h="32px"
                    borderRadius="full"
                    bg={customization.headerBg || "purple.500"}
                    color={getContrastColor(customization.headerBg || "purple.500")}
                  >
                    <Icon as={Settings} boxSize={4} />
                  </Flex>
                  <Box>
                    <Text fontWeight="semibold" fontSize="sm" color="gray.800">
                      {t('settings.userGroups.moduleAccess.title')}
                    </Text>
                    <Text fontSize="xs" color="gray.600">
                      {t('settings.userGroups.moduleAccess.description')}
                    </Text>
                  </Box>
                </HStack>
              </Box>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} pt={2}>
                {Object.entries(formData.modules).map(([module, enabled]) => (
                  <FormControl key={module} display="flex" alignItems="flex-start" gap={4}>
                    <Switch
                      id={`module-${module}`}
                      name={`modules.${module}`}
                      isChecked={enabled}
                      onChange={(event) => {
                        const { checked } = event.target
                        setFormData((prev) => ({
                          ...prev,
                          modules: {
                            ...prev.modules,
                            [module]: checked,
                          },
                        }))
                      }}
                      colorScheme="blue"
                      size="lg"
                    />
                    <Box>
                      <FormLabel htmlFor={`module-${module}`} mb={1} fontSize="sm" fontWeight="semibold">
                        {module.charAt(0).toUpperCase() + module.slice(1)}
                      </FormLabel>
                      <Text fontSize="xs" color="gray.600">
                        {t(moduleDescriptionKeys[module])}
                      </Text>
                    </Box>
                  </FormControl>
                ))}
              </SimpleGrid>
            </FormSection>
          )}

          <StandardCard variant="outline" borderRadius="xl" shadow="sm">
            <CardBody>
              <Stack direction={{ base: 'column', md: 'row' }} spacing={4} justify="flex-end">
                <Button
                  variant="outline"
                  colorScheme="gray"
                  leftIcon={<Icon as={ArrowLeft} boxSize={4} aria-hidden="true" />}
                  onClick={handleCancel}
                  minH="44px"
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  type="submit"
                  colorScheme="blue"
                  minH="44px"
                  isLoading={loading}
                  leftIcon={<Icon as={Save} boxSize={4} aria-hidden="true" />}
                  bg={customization.headerBg || undefined}
                  _hover={customization.headerBg ? { opacity: 0.9 } : undefined}
                  color={customization.headerBg ? getContrastColor(customization.headerBg) : undefined}
                >
                  {loading
                    ? t('settings.userGroups.edit.updating')
                    : t('settings.userGroups.edit.update')}
                </Button>
              </Stack>
            </CardBody>
          </StandardCard>
        </Stack>
      </Box>
    </Container>
  )
}

export default EditUserGroupForm
