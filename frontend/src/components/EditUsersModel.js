import { CModal, CModalHeader, CModalBody, CModalFooter, CButton, CFormInput, CFormSelect, CFormSwitch } from '@coreui/react';
import { useState, useEffect } from 'react';
import { useDispatch,useSelector } from 'react-redux';

const EditUserModal = ({ visible, onClose, user }) => {
    const dispatch = useDispatch();
    const { list: locations } = useSelector((state) => state.locations);

    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        password: '',
        confirmPassword: '',
        userGroup: user?.userGroup || '',
        locationId: user?.locationId || '',
        isSalesRep: user?.isSalesRep || false,
    });

    useEffect(() => {
        dispatch(fetchLocations());
    }, [dispatch]);

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
            });
        }
    }, [user]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSubmit = () => {
        if (formData.password && formData.password !== formData.confirmPassword) {
            return Swal.fire('Error!', 'Passwords do not match.', 'error');
        }

        // Dispatch updateUser here (you’ll need to implement that)
        onClose();
    };

    return (
        <CModal visible={visible} onClose={onClose}>
            <CModalHeader>Edit User</CModalHeader>
            <CModalBody>
                <CFormInput
                    label="Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="mb-2"
                />
                <CFormInput
                    label="Email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="mb-2"
                />
                <CFormSelect
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
                </CFormSelect>
                <CFormSelect
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
                </CFormSelect>
                <CFormInput
                    label="Password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="mb-2"
                />
                <CFormInput
                    label="Confirm Password"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="mb-2"
                />
                <CFormSwitch
                    label="Sales Representative"
                    name="isSalesRep"
                    checked={formData.isSalesRep}
                    onChange={handleChange}
                />
            </CModalBody>
            <CModalFooter>
                <CButton color="secondary" onClick={onClose}>Cancel</CButton>
                <CButton color="primary" onClick={handleSubmit}>Save Changes</CButton>
            </CModalFooter>
        </CModal>
    );
};

export default EditUserModal
