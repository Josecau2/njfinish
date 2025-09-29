import { useEffect, useRef, useState } from 'react'
import { FormControl, Input, FormLabel, Card, CardBody, Container, Flex, Box, Icon, Button, HStack, Text, Select, Switch, FormErrorMessage, InputGroup, InputLeftElement } from '@chakra-ui/react'
import { User, Settings, ArrowLeft, Save, UserPlus, Users } from '@/icons-lucide'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import { decodeParam } from '../../../utils/obfuscate'
import { updateUser, fetchSingleUser } from '../../../store/slices/userGroupSlice'
import Swal from 'sweetalert2'
import axiosInstance from '../../../helpers/axiosInstance'
import { useTranslation } from 'react-i18next'
import PageHeader from '../../../components/PageHeader'
import { getContrastColor } from '../../../utils/colorUtils'

// External components to avoid re-creation on each render
const FormSection = ({ title, icon, children, className = '', customization = {} }) => (
  <Card className={`border-0 shadow-sm mb-2 mb-md-4 ${className}`}>
    <CardBody className="p-3 p-md-4">
      <div className="d-flex align-items-center mb-3">
        <div
          className="rounded-circle d-flex align-items-center justify-content-center me-2 me-md-3"
          style={{
            width: '32px',
            height: '32px',
            backgroundColor: `${customization.headerBg || '#667eea'}20`,
            color: customization.headerBg || '#667eea',
          }}
        >
          <Icon as={icon} boxSize={4} />
        </div>
        <h6 className="mb-0 fw-semibold text-dark small">{title}</h6>
      </div>
      {children}
    </CardBody>
  </Card>
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
  <div className="mb-3">
    <FormLabel htmlFor={name} className="fw-medium text-dark mb-2 small">
      {label}
      {required && <span className="text-danger ms-1">*</span>}
    </FormLabel>
    <InputGroup>
      {icon && (
        <InputLeftElement>
          <Icon as={icon} boxSize={4} color="gray.500" />
        </InputLeftElement>
      )}
      <Input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        isInvalid={isInvalid}
        placeholder={placeholder}
        borderColor={isInvalid ? 'red.500' : 'gray.300'}
        borderRadius="8px"
        fontSize="14px"
        minH="44px"
        {...props}
      />
    </InputGroup>
    {feedback && <FormErrorMessage>{feedback}</FormErrorMessage>}
  </div>
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

const EditUserGroupForm = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
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
  }, [id, navigate])

  const validate = () => {
    const newErrors = {}
    if (!formData.name.trim())
      newErrors.name = t('settings.userGroups.form.validation.nameRequired')
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const response = await axiosInstance.put(`/api/usersgroups/${id}`, formData)
      if (response.data.status === 200) {
        Swal.fire(
          t('common.success') + '!',
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

  const isFormDirty = () => {
    return JSON.stringify(formData) !== JSON.stringify(initialFormRef.current)
  }

  if (loadingData) {
    return (
      <Container
        fluid
        className="p-1 p-md-2 m-0 m-md-2"
        style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}
      >
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ minHeight: '400px' }}
        >
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">{t('common.loading')}</span>
            </div>
            <p className="mt-3 text-muted">{t('settings.userGroups.edit.loadingOne')}</p>
          </div>
      </Container>
    )
    </div>
  
  )
  }

  return (
    <Container
      fluid
      className="p-1 p-md-2 m-0 m-md-2 user-group-edit"
      style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}
    >
      {/* UI-TASK: Scoped responsive/touch styles */}
      <style>{`
                            .user-group-edit .form-select, .user-group-edit .form-control { min-height: 44px; }
                            .user-group-edit .btn { min-height: 44px; }
                            @media (max-width: 576px) {
                                .user-group-edit .form-check.form-switch { padding: .25rem 0; }
    </div>
    </div>
  
  )
                            }
                        `}</style>
      {/* Header Section */}
      <PageHeader
        title={t('settings.userGroups.edit.title')}
        subtitle={t('settings.userGroups.edit.subtitle')}
        icon={cilUserFollow}
        rightContent={
          <Button
            status="light"
            className="shadow-sm px-3 px-md-4 fw-semibold w-100 w-md-auto"
            size="sm"
            onClick={() => navigate('/settings/users')}
            style={{
              borderRadius: '25px',
              border: 'none',
              transition: 'all 0.3s ease',
            }}
          >
            <Icon as={ArrowLeft} className="me-2" />
            {t('common.back')}
          </Button>
        }
      />

      <FormControl onSubmit={handleSubmit}>
        {/* Group Information Section */}
        <FormSection
          title={t('settings.userGroups.form.titles.groupInfo')}
          icon={cilGroup}
          customization={customization}
        >
          <Flex>
            <Box xs={12} md={8} lg={6}>
              <CustomFormInput
                label={t('settings.userGroups.form.labels.name')}
                name="name"
                required
                icon={cilGroup}
                placeholder={t('settings.userGroups.form.placeholders.name')}
                value={formData.name}
                onChange={handleChange}
                isInvalid={!!errors.name}
                feedback={errors.name}
              />
            </Box>
            <Box xs={12} md={4} lg={6}>
              <div className="mb-3">
                <FormLabel className="fw-medium text-dark mb-2 small">
                  {t('settings.userGroups.form.labels.type')}
                  <span className="text-danger ms-1">*</span>
                </FormLabel>
                <select
                  name="group_type"
                  value={formData.group_type}
                  onChange={handleChange}
                  className="form-select"
                  style={{
                    border: '1px solid #e3e6f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    padding: '12px 16px',
                  }}
                >
                  <option value="standard">{t('settings.userGroups.types.standard')}</option>
                  <option value="contractor">{t('settings.userGroups.types.contractor')}</option>
                </select>
              </div>
            </Box>
          </Flex>
        </FormSection>

        {/* Module Permissions Section - Only for Contractor Groups */}
        {formData.group_type === 'contractor' && (
          <FormSection
            title={t('settings.userGroups.form.titles.modulePermissions')}
            icon={cilSettings}
            customization={customization}
          >
            <div className="mb-4">
              <div
                className="d-flex align-items-start p-3 rounded-3"
                style={{ backgroundColor: '#e7f3ff', border: '1px solid #b3d7ff' }}
              >
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center me-3 flex-shrink-0"
                  style={{
                    width: '32px',
                    height: '32px',
                    backgroundColor: customization.headerBg || '#667eea',
                    color: getContrastColor(customization.headerBg || '#667eea'),
                  }}
                >
                  <Icon as={Settings} size="sm" />
                </div>
                <div>
                  <div className="fw-semibold text-dark small mb-1">
                    {t('settings.userGroups.moduleAccess.title')}
                  </div>
                  <div className="text-muted" style={{ fontSize: '12px', lineHeight: '1.4' }}>
                    {t('settings.userGroups.moduleAccess.description')}
                  </div>
              </div>

            <Flex>
              {Object.entries(formData.modules).map(([module, enabled]) => (
                <Box xs={12} sm={6} md={3} key={module} className="mb-3">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id={`module-${module}`}
                      name={`modules.${module}`}
                      checked={enabled}
                      onChange={(e) => {
                        setFormData((prev) => ({
                          ...prev,
                          modules: {
                            ...prev.modules,
                            [module]: e.target.checked,
                          },
                        }))
                      }}
                      style={{
                        width: '3rem',
                        height: '1.5rem',
                      }}
                    />
                    <label className="form-check-label fw-medium" htmlFor={`module-${module}`}>
                      {module.charAt(0).toUpperCase() + module.slice(1)}
                    </label>
                  </div>
                  <small className="text-muted d-block mt-1">
                    {module === 'dashboard' &&
                      t('settings.userGroups.moduleDescriptions.dashboard')}
                    {module === 'proposals' &&
                      t('settings.userGroups.moduleDescriptions.proposals')}
                    {module === 'customers' &&
                      t('settings.userGroups.moduleDescriptions.customers')}
                    {module === 'resources' &&
                      t('settings.userGroups.moduleDescriptions.resources')}
                  </small>
                </Box>
              ))}
            </Flex>
          </FormSection>
        )}

        {/* Action Buttons */}
        <Card className="border-0 shadow-sm">
          <CardBody className="p-3 p-md-4">
            <div className="d-flex flex-column flex-md-row gap-2 gap-md-3 justify-content-end">
              <Button
                type="button"
                status="light"
                size="md"
                className="px-3 px-md-4 fw-semibold order-2 order-md-1"
                onClick={() => {
                  if (isFormDirty()) {
                    Swal.fire({
                      title: t('common.confirm'),
                      text: t('settings.userGroups.alerts.leaveWarning'),
                      icon: 'warning',
                      showCancelButton: true,
                      confirmButtonText: t('settings.userGroups.alerts.leaveAnyway'),
                      cancelButtonText: t('settings.userGroups.alerts.stayOnPage'),
                      confirmButtonColor: '#d33',
                      cancelButtonColor: '#6c757d',
                    }).then((result) => {
                      if (result.isConfirmed) {
                        navigate('/settings/users')
                      }
                    })
                  } else {
                    navigate('/settings/users')
                  }
                }}
                style={{
                  borderRadius: '25px',
                  border: '1px solid #e3e6f0',
                  transition: 'all 0.3s ease',
                }}
              >
                <Icon as={ArrowLeft} className="me-2" />
                {t('common.cancel')}
              </Button>
              <Button
                type="submit"
                colorScheme="blue"
                size="md"
                isLoading={loading}
                className="px-4 px-md-5 fw-semibold order-1 order-md-2"
                style={{
                  borderRadius: '25px',
                  border: 'none',
                  background: customization.headerBg || '#667eea',
                  color: getContrastColor(customization.headerBg || '#667eea'),
                  transition: 'all 0.3s ease',
                }}
              >
                <Icon as={Save} className="me-2" />
                {loading
                  ? t('settings.userGroups.edit.updating')
                  : t('settings.userGroups.edit.update')}
              </Button>
            </div>
          </CardBody>
        </Card>
      </FormControl>
    </Container>
  )
}

export default EditUserGroupForm
