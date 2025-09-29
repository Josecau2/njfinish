import { useEffect, useRef, useState } from 'react'
import { FormControl, Input, FormLabel, Card, CardBody, Container, Flex, Box, Icon, Button, Switch, Text, HStack, Select } from '@chakra-ui/react'
import PageHeader from '../../../components/PageHeader'
import { Settings, ArrowLeft, UserPlus } from '@/icons-lucide'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { addUser } from '../../../store/slices/userGroupSlice'
import Swal from 'sweetalert2'
import { useTranslation } from 'react-i18next'

const FormSection = ({ title, icon, children, className = '', customization = {} }) => (
  <Card className={`border-0 shadow-sm mb-2 mb-md-4 ${className}`}>
    <CardBody className="p-3 p-md-4">
      <HStack mb={3} align="center" spacing={3}>
        <Box
          borderRadius="full"
          w="32px"
          h="32px"
          display="flex"
          alignItems="center"
          justifyContent="center"
          bg={`${customization.headerBg || '#667eea'}20`}
          color={customization.headerBg || '#667eea'}
        >
          <Icon as={icon || Settings} size={14} />
        </Box>
        <Text fontWeight="semibold" fontSize="sm">{title}</Text>
      </HStack>
      {children}
    </CardBody>
  </Card>
)

const CustomFormInput = ({
  label,
  name,
  type = 'text',
  required = false,
  placeholder = '',
  value,
  onChange,
  isInvalid,
  feedback,
  ...props
}) => (
  <Box mb={3}>
    <FormLabel htmlFor={name} className="fw-medium text-dark mb-2 small">
      {label}
      {required && <span className="text-danger ms-1">*</span>}
    </FormLabel>
    <Input
      id={name}
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      isInvalid={isInvalid}
      placeholder={placeholder}
      {...props}
    />
    {feedback && (
      <Text color="red.500" fontSize="sm" mt={1}>
        {feedback}
      </Text>
    )}
  </Box>
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

const AddUserGroupForm = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [formData, setFormData] = useState(initialForm)
  const initialFormRef = useRef(initialForm)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const customization = useSelector((state) => state.customization)

  const validate = () => {
    const newErrors = {}
    if (!formData.name.trim()) newErrors.name = t('settings.userGroups.form.validation.nameRequired')
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    if (name.startsWith('modules.')) {
      const key = name.split('.')[1]
      setFormData((prev) => ({
        ...prev,
        modules: { ...prev.modules, [key]: checked },
      }))
      return
    }
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleBackClick = () => {
    navigate('/settings/users/groups')
  }

  const handleSubmit = async (e, force = false) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const action = await dispatch(addUser({ ...formData, force }))
      const payload = action?.payload
      if (payload?.status === 200) {
        await Swal.fire(
          t('common.success') + '!',
          payload.message || t('settings.userGroups.alerts.created'),
          'success',
        )
        navigate('/settings/users/groups')
        return
      }
      const serverMsg = payload?.message || action?.error?.message || t('settings.userGroups.alerts.createFailed')
      await Swal.fire(t('common.error'), serverMsg, 'error')
    } catch (err) {
      await Swal.fire(t('common.error'), err?.message || t('settings.userGroups.alerts.genericError'), 'error')
    } finally {
      setLoading(false)
    }
  }

  const isFormDirty = () => JSON.stringify(formData) !== JSON.stringify(initialFormRef.current)

  return (
    <Container maxW="1200px" py={4}>
      <style>{`.settings-form-container .btn, .notification-mobile-dropdown .btn, .btn { min-height: 44px; }`}</style>
      <PageHeader
        title={
          <HStack spacing={3} align="center">
            <Box
              w="48px"
              h="48px"
              bg="rgba(255,255,255,0.2)"
              borderRadius="12px"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Icon as={UserPlus} fontSize="16px" color="white" />
            </Box>
            {t('settings.userGroups.create.title')}
          </HStack>
        }
        subtitle={t('settings.userGroups.create.subtitle')}
        actions={[
          <Button key="back" variant="outline" onClick={handleBackClick} aria-label={t('common.back')}>
            <Icon as={ArrowLeft} mr={2} />
            {t('common.back')}
          </Button>,
        ]}
      />

      <form onSubmit={handleSubmit}>
        <FormControl>
          <FormSection title={t('settings.userGroups.form.titles.groupInfo')} customization={customization}>
            <Flex gap={3} wrap="wrap">
              <Box flex="1 1 300px">
                <CustomFormInput
                  label={t('settings.userGroups.form.labels.name')}
                  name="name"
                  required
                  placeholder={t('settings.userGroups.form.placeholders.name')}
                  value={formData.name}
                  onChange={handleChange}
                  isInvalid={!!errors.name}
                  feedback={errors.name}
                />
              </Box>
              <Box flex="1 1 200px">
                <Box mb={3}>
                  <FormLabel className="fw-medium text-dark mb-2 small">
                    {t('settings.userGroups.form.labels.type')}
                    <span className="text-danger ms-1">*</span>
                  </FormLabel>
                  <Select
                    name="group_type"
                    value={formData.group_type}
                    onChange={handleChange}
                    borderColor="#e3e6f0"
                    borderRadius="8px"
                    fontSize="14px"
                    minH="44px"
                  >
                    <option value="standard">{t('settings.userGroups.types.standard')}</option>
                    <option value="contractor">{t('settings.userGroups.types.contractor')}</option>
                  </Select>
                </Box>
              </Box>
            </Flex>

            <Box mt={4}>
              <HStack mb={2} align="center" spacing={3}>
                <Box w="24px" h="24px" bg="#e6ffed" color="#28a745" borderRadius="full" display="flex" alignItems="center" justifyContent="center">
                  ✓
                </Box>
                <Text fontWeight="semibold" fontSize="sm">
                  {t('settings.userGroups.create.afterCreateTitle')}
                </Text>
              </HStack>
              <Flex gap={2} wrap="wrap">
                <Box className="d-flex align-items-center p-2 rounded-2" bg="#f8f9fa">
                  <Text fontSize="sm" color="gray.600">{t('settings.userGroups.create.afterCreate.assignUsers')}</Text>
                </Box>
                <Box className="d-flex align-items-center p-2 rounded-2" bg="#f8f9fa">
                  <Text fontSize="sm" color="gray.600">{t('settings.userGroups.create.afterCreate.setPermissions')}</Text>
                </Box>
                <Box className="d-flex align-items-center p-2 rounded-2" bg="#f8f9fa">
                  <Text fontSize="sm" color="gray.600">{t('settings.userGroups.create.afterCreate.manageAccess')}</Text>
                </Box>
                <Box className="d-flex align-items-center p-2 rounded-2" bg="#f8f9fa">
                  <Text fontSize="sm" color="gray.600">{t('settings.userGroups.create.afterCreate.bulkManagement')}</Text>
                </Box>
              </Flex>
            </Box>
          </FormSection>

          {formData.group_type === 'contractor' && (
            <FormSection title={t('settings.userGroups.form.titles.modulePermissions')} customization={customization}>
              <Box mb={4} p={3} borderRadius="md" bg="#e7f3ff" border="1px solid #b3d7ff">
                <HStack spacing={3} align="start">
                  <Box w="32px" h="32px" bg={customization.headerBg || '#667eea'} color="white" borderRadius="full" display="flex" alignItems="center" justifyContent="center">
                    <Icon as={Settings} size={14} />
                  </Box>
                  <Box>
                    <Text fontWeight="semibold" fontSize="sm">{t('settings.userGroups.moduleAccess.title')}</Text>
                    <Text color="gray.600" fontSize="sm">{t('settings.userGroups.moduleAccess.description')}</Text>
                  </Box>
                </HStack>
              </Box>

              <Flex gap={3} wrap="wrap">
                {Object.entries(formData.modules).map(([module, enabled]) => (
                  <Box key={module} flex="1 1 180px">
                    <HStack justify="space-between">
                      <Text fontWeight="medium">{module.charAt(0).toUpperCase() + module.slice(1)}</Text>
                      <Switch
                        id={`module-${module}`}
                        isChecked={enabled}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            modules: { ...prev.modules, [module]: e.target.checked },
                          }))
                        }
                        size="lg"
                      />
                    </HStack>
                    <Text color="gray.500" fontSize="sm" mt={1}>
                      {module === 'dashboard' && t('settings.userGroups.moduleDescriptions.dashboard')}
                      {module === 'proposals' && t('settings.userGroups.moduleDescriptions.proposals')}
                      {module === 'customers' && t('settings.userGroups.moduleDescriptions.customers')}
                      {module === 'resources' && t('settings.userGroups.moduleDescriptions.resources')}
                    </Text>
                  </Box>
                ))}
              </Flex>
            </FormSection>
          )}

          <Card>
            <CardBody>
              <HStack justify="flex-end" spacing={3}>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    if (isFormDirty()) {
                      Swal.fire({
                        title: t('common.confirm'),
                        text: t('settings.userGroups.alerts.leaveWarning'),
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonText: t('settings.userGroups.alerts.leaveAnyway'),
                        cancelButtonText: t('settings.userGroups.alerts.stayOnPage'),
                      }).then((result) => {
                        if (result.isConfirmed) navigate('/settings/users/groups')
                      })
                    } else {
                      navigate('/settings/users/groups')
                    }
                  }}
                >
                  {t('common.cancel')}
                </Button>
                <Button type="submit" colorScheme="brand" isLoading={loading}>
                  {t('common.save')}
                </Button>
              </HStack>
            </CardBody>
          </Card>
        </FormControl>
      </form>
    </Container>
  )
}

export default AddUserGroupForm
