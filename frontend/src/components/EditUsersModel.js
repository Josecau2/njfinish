import { Modal, ModalHeader, ModalBody, ModalFooter, Input, Select, Switch } from '@chakra-ui/react'
import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Swal from 'sweetalert2'
import { fetchLocations } from '../store/slices/locationSlice'
// import { Save, X } from '@/icons';

const EditUserModal = ({ visible, onClose, user }) => {
  const dispatch = useDispatch()
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
      return Swal.fire('Error!', 'Passwords do not match.', 'error')
    }

    // Dispatch updateUser here (you’ll need to implement that)
    onClose()
  }

  return (
    <Modal isOpen={visible} onClose={onClose}>
      {/* UI-TASK: Scoped responsive/touch styles */}
      <style>{`
                            .edit-user-modal .form-control, .edit-user-modal .form-select { min-height: 44px; }
                            .edit-user-modal .btn { min-height: 44px; }
                            @media (max-width: 576px) {
                                .edit-user-modal .modal-footer { flex-wrap: wrap; }
                                .edit-user-modal .modal-footer .btn { width: 100%; }
                            }
                        `}</style>
      <ModalHeader>Edit User</ModalHeader>
      <ModalBody className="edit-user-modal">
        <Input
          label="Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="mb-2"
        />
        <Input
          label="Email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="mb-2"
        />
        <Select
          label="User Group"
          name="userGroup"
          value={formData.userGroup}
          onChange={handleChange}
          className="mb-2"
        >
          <option value="">-- Select Group --</option>
          <option value="User">User</option>
          <option value="Admin">Admin</option>
          <option value="Contractor">Contractor</option>
        </Select>
        <Select
          label="Location"
          name="locationId"
          value={formData.locationId}
          onChange={handleChange}
          className="mb-2"
        >
          <option value="">Select location</option>
          {locations.map((location) => (
            <option key={location.id} value={location.id}>
              {location.locationName}
            </option>
          ))}
        </Select>
        <Input
          label="Password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          className="mb-2"
        />
        <Input
          label="Confirm Password"
          name="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={handleChange}
          className="mb-2"
        />
        <Switch
          label="Sales Representative"
          name="isSalesRep"
          checked={formData.isSalesRep}
          onChange={handleChange}
        />
      </ModalBody>
            </ModalContent>
    <ModalFooter>
        <CButton colorScheme="gray" onClick={onClose} aria-label="Cancel editing user">
          Cancel
        </CButton>
        <CButton colorScheme="blue" onClick={handleSubmit} aria-label="Save user changes">
          Save Changes
        </CButton>
      </ModalFooter>
    </Modal>
  )
}

export default EditUserModal
