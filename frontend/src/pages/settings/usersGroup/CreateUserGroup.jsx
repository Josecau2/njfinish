import { useEffect, useRef, useState } from 'react'
import { FormControl, Input, FormLabel, CardBody, Container, Flex, Box, Icon, Button, Switch, Text, HStack, Select, useColorModeValue } from '@chakra-ui/react'
import PageContainer from '../../../components/PageContainer'
import StandardCard from '../../../components/StandardCard'
import PageHeader from '../../../components/PageHeader'
import { Settings, ArrowLeft, UserPlus } from '@/icons-lucide'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { addUser } from '../../../store/slices/userGroupSlice'
import { useToast, AlertDialog, AlertDialogBody, AlertDialogFooter, AlertDialogHeader, AlertDialogContent, AlertDialogOverlay, useDisclosure } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'

const FormSection = ({ title, icon, children, customization = {} }) => (
  <StandardCard mb={{ base: 2, md: 4 }} borderWidth="0" boxShadow="sm">
    <CardBody p={{ base: 3, md: 4 }}>
      <HStack mb={3} align="center" spacing={4}>
        <Box
          borderRadius="full"
          w="32px"
          h="32px"
          display="flex"
          alignItems="center"
          justifyContent="center"
          bg={`${customization.headerBg || "purple.500"}20`}
          color={customization.headerBg || "purple.500"}
        >
          <Icon as={icon || Settings} size={14} />
        </Box>
        <Text fontWeight="semibold" fontSize="sm">{title}</Text>
      </HStack>
      {children}
    </CardBody>
  </StandardCard>
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
}) => {
  const labelColor = useColorModeValue('gray.800', 'gray.200')
  const textRed500 = useColorModeValue('red.500', 'red.300')

  return (
    <Box mb={3}>
      <FormLabel htmlFor={name} fontWeight="medium" color={labelColor} mb={2} fontSize="sm">
        {label}
        {required && <Text as="span" color={textRed500} ml={1}>*</Text>}
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
        <Text color={textRed500} fontSize="sm" mt={1}>
          {feedback}
        </Text>
      )}
    </Box>
  )
}

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
  const toast = useToast()
  const { isOpen: isCancelOpen, onOpen: onCancelOpen, onClose: onCancelClose } = useDisclosure()
  const cancelRef = useRef()
  const [formData, setFormData] = useState(initialForm)
  const initialFormRef = useRef(initialForm)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const customization = useSelector((state) => state.customization)

  // Dark mode colors
  const borderGray = useColorModeValue('gray.200', 'gray.600')
  const bgGreen50 = useColorModeValue('green.50', 'green.900')
  const textGreen500 = useColorModeValue('green.500', 'green.300')
  const bgGray50 = useColorModeValue('gray.50', 'gray.800')
  const textGray500 = useColorModeValue('gray.500', 'gray.400')
  const textGray600 = useColorModeValue('gray.600', 'gray.300')
  const bgBlue50 = useColorModeValue('blue.50', 'blue.900')
  const borderBlue = useColorModeValue('blue.200', 'blue.700')
  const labelColor = useColorModeValue('gray.800', 'gray.200')
  const textRed500 = useColorModeValue('red.500', 'red.300')

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
        toast({
          title: t('common.success'),
          description: payload.message || t('settings.userGroups.alerts.created'),
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
        navigate('/settings/users/groups')
        return
      }
      const serverMsg = payload?.message || action?.error?.message || t('settings.userGroups.alerts.createFailed')
      toast({
        title: t('common.error'),
        description: serverMsg,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } catch (err) {
      toast({
        title: t('common.error'),
        description: err?.message || t('settings.userGroups.alerts.genericError'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  const isFormDirty = () => JSON.stringify(formData) !== JSON.stringify(initialFormRef.current)

  return (
    <PageContainer>
      <style>{`.settings-form-container .btn, .notification-mobile-dropdown .btn, .btn { min-height: 44px; }`}</style>
      <PageHeader
        title={
          <HStack spacing={4} align="center">
            <Box
              w="48px"
              h="48px"
              bg="rgba(255,255,255,0.2)"
              borderRadius="12px"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Icon as={UserPlus} fontSize="md" color="white" />
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

      <Box as="form" onSubmit={handleSubmit}>
        <FormControl>
          <FormSection title={t('settings.userGroups.form.titles.groupInfo')} customization={customization}>
            <Flex gap={4} wrap="wrap">
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
                  <FormLabel fontWeight="medium" color={labelColor} mb={2} fontSize="sm">
                    {t('settings.userGroups.form.labels.type')}
                    <Text as="span" color={textRed500} ml={1}>*</Text>
                  </FormLabel>
                  <Select
                    name="group_type"
                    value={formData.group_type}
                    onChange={handleChange}
                    borderColor={borderGray}
                    borderRadius="8px"
                    fontSize="sm"
                    minH="44px"
                  >
                    <option value="standard">{t('settings.userGroups.types.standard')}</option>
                    <option value="contractor">{t('settings.userGroups.types.contractor')}</option>
                  </Select>
                </Box>
              </Box>
            </Flex>

            <Box mt={4}>
              <HStack mb={2} align="center" spacing={4}>
                <Box w="24px" h="24px" bg={bgGreen50} color={textGreen500} borderRadius="full" display="flex" alignItems="center" justifyContent="center">
                  ✓
                </Box>
                <Text fontWeight="semibold" fontSize="sm">
                  {t('settings.userGroups.create.afterCreateTitle')}
                </Text>
              </HStack>
              <Flex gap={4} wrap="wrap">
                <Flex align="center" p={2} borderRadius="md" bg={bgGray50}>
                  <Text fontSize="sm" color={textGray600}>{t('settings.userGroups.create.afterCreate.assignUsers')}</Text>
                </Flex>
                <Flex align="center" p={2} borderRadius="md" bg={bgGray50}>
                  <Text fontSize="sm" color={textGray600}>{t('settings.userGroups.create.afterCreate.setPermissions')}</Text>
                </Flex>
                <Flex align="center" p={2} borderRadius="md" bg={bgGray50}>
                  <Text fontSize="sm" color={textGray600}>{t('settings.userGroups.create.afterCreate.manageAccess')}</Text>
                </Flex>
                <Flex align="center" p={2} borderRadius="md" bg={bgGray50}>
                  <Text fontSize="sm" color={textGray600}>{t('settings.userGroups.create.afterCreate.bulkManagement')}</Text>
                </Flex>
              </Flex>
            </Box>
          </FormSection>

          {formData.group_type === 'contractor' && (
            <FormSection title={t('settings.userGroups.form.titles.modulePermissions')} customization={customization}>
              <Box mb={4} p={3} borderRadius="md" bg={bgBlue50} border="1px solid" borderColor={borderBlue}>
                <HStack spacing={4} align="start">
                  <Box w="32px" h="32px" bg={customization.headerBg || "purple.500"} color="white" borderRadius="full" display="flex" alignItems="center" justifyContent="center">
                    <Icon as={Settings} size={14} />
                  </Box>
                  <Box>
                    <Text fontWeight="semibold" fontSize="sm">{t('settings.userGroups.moduleAccess.title')}</Text>
                    <Text color={textGray600} fontSize="sm">{t('settings.userGroups.moduleAccess.description')}</Text>
                  </Box>
                </HStack>
              </Box>

              <Flex gap={4} wrap="wrap">
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
                    <Text color={textGray500} fontSize="sm" mt={1}>
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

          <StandardCard>
            <CardBody>
              <HStack justify="flex-end" spacing={4}>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    if (isFormDirty()) {
                      onCancelOpen()
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
          </StandardCard>
        </FormControl>
      </Box>

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
              {t('settings.userGroups.alerts.leaveWarning')}
            </AlertDialogBody>

            <AlertDialogFooter pt={4} pb={{ base: 8, md: 4 }}>
              <Button ref={cancelRef} onClick={onCancelClose} minH="44px">
                {t('settings.userGroups.alerts.stayOnPage')}
              </Button>
              <Button colorScheme="red" onClick={() => { onCancelClose(); navigate('/settings/users/groups'); }} ml={3} minH="44px">
                {t('settings.userGroups.alerts.leaveAnyway')}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </PageContainer>
  )
}

export default AddUserGroupForm
