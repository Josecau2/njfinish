import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Select,
  Switch,
  Button,
  VStack,
  HStack,
  useToast,
} from '@chakra-ui/react'
import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchLocations } from '../store/slices/locationSlice'
import { useTranslation } from 'react-i18next'

const EditUserModal = ({ visible, onClose, user }) => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const toast = useToast()
  const { list: locations } = useSelector((state) => state.locations)

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    confirmPassword: '',
    userGroup: user?.userGroup || '',
    locationId: user?.locationId || '',
    isSalesRep: user?.isSalesRep || false,
  })

  useEffect(() => {
    dispatch(fetchLocations())
  }, [dispatch])

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        password: '',
        confirmPassword: '',
        userGroup: user.role,
        locationId: user.locationId?.toString() || '',
        isSalesRep: user.isSalesRep,
      })
    }
  }, [user])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = () => {
    if (formData.password && formData.password !== formData.confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match.',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top',
      })
      return
    }

    // Dispatch updateUser here (you'll need to implement that)
    onClose()
  }

  return (
    <Modal
      isOpen={visible}
      onClose={onClose}
      size={{ base: 'full', md: 'md' }}
      scrollBehavior="inside"
      isCentered
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{t('users.edit.modalHeader', 'Edit User')}</ModalHeader>
        <ModalCloseButton aria-label={t('common.ariaLabels.closeModal', 'Close modal')} />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <FormControl isRequired>
              <FormLabel>{t('users.fields.name', 'Name')}</FormLabel>
              <Input
                name="name"
                value={formData.name}
                onChange={handleChange}
                minH="44px"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>{t('users.fields.email', 'Email')}</FormLabel>
              <Input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                minH="44px"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>{t('users.fields.userGroup', 'User Group')}</FormLabel>
              <Select
                name="userGroup"
                value={formData.userGroup}
                onChange={handleChange}
                minH="44px"
              >
                <option value="">{t('common.selectPlaceholders.selectGroup', '-- Select Group --')}</option>
                <option value="User">User</option>
                <option value="Admin">Admin</option>
                <option value="Contractor">Contractor</option>
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>{t('users.fields.location', 'Location')}</FormLabel>
              <Select
                name="locationId"
                value={formData.locationId}
                onChange={handleChange}
                minH="44px"
              >
                <option value="">{t('common.selectPlaceholders.selectLocation', 'Select location')}</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.locationName}
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>{t('users.fields.passwordHint', 'Password (leave blank to keep current)')}</FormLabel>
              <Input
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                minH="44px"
              />
            </FormControl>

            <FormControl>
              <FormLabel>{t('users.fields.confirmPassword', 'Confirm Password')}</FormLabel>
              <Input
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                minH="44px"
              />
            </FormControl>

            <FormControl display="flex" alignItems="center">
              <FormLabel mb="0">{t('users.fields.salesRep', 'Sales Representative')}</FormLabel>
              <Switch
                name="isSalesRep"
                isChecked={formData.isSalesRep}
                onChange={handleChange}
              />
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <HStack spacing={3}>
            <Button
              variant="outline"
              colorScheme="gray"
              onClick={onClose}
              minH="44px"
              aria-label={t('users.actions.cancelEdit', 'Cancel editing user')}
            >
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              colorScheme="brand"
              onClick={handleSubmit}
              minH="44px"
              aria-label={t('users.actions.saveChanges', 'Save user changes')}
            >
              {t('users.actions.saveChanges', 'Save Changes')}
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default EditUserModal
