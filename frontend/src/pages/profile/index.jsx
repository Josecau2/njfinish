import { useEffect, useRef, useState } from 'react';
import {
  CForm,
  CFormInput,
  CFormLabel,
  CFormFeedback,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CContainer,
  CRow,
  CCol,
  CFormSelect,
  CSpinner,
} from '@coreui/react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserById, updateUser } from '../../store/slices/userSlice';
import Swal from 'sweetalert2';
import { fetchLocations } from '../../store/slices/locationSlice';

const ProfilePage = () => {
  const dispatch = useDispatch();
  const loggedInUser = JSON.parse(localStorage.getItem('user'));
  const loggedInUserId = loggedInUser?.userId;
  const { selected, loading: userLoading } = useSelector((state) => state.users);
  const { list: locations, loading: locationsLoading } = useSelector((state) => state.locations);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    location: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const initialFormRef = useRef(formData);

  // Combined loading state for initial data fetch
  const isLoading = userLoading || locationsLoading;

  useEffect(() => {
    if (loggedInUserId) {
      dispatch(fetchUserById(loggedInUserId));
    }
    dispatch(fetchLocations());
  }, [dispatch, loggedInUserId]);

  useEffect(() => {
    if (selected) {
      const data = {
        name: selected.name || '',
        email: selected.email || '',
        password: '',
        confirmPassword: '',
        location: selected.location || '',
      };
      setFormData(data);
      initialFormRef.current = data;
    }
  }, [selected]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = 'Passwords do not match';
    if (!formData.location.trim()) newErrors.location = 'Location is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = { ...formData };
      delete payload.confirmPassword;

      const response = await dispatch(updateUser({ id: loggedInUserId, data: payload }));
      if (response?.payload?.status === 200) {
        Swal.fire('Success!', 'Profile updated successfully', 'success');
      } else {
        throw new Error(response?.payload?.message || 'Failed to update');
      }
    } catch (error) {
      Swal.fire('Error', error.message || 'Something went wrong', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Show loader while initial data is loading
  if (isLoading) {
    return (
      <CContainer className="mt-5 mb-5 d-flex justify-content-center">
        <div style={{ width: '100%', maxWidth: '900px' }}>
          <CCard className="shadow-sm border-0 rounded-4">
            <CCardBody className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
              <CSpinner color="primary" size="lg" />
            </CCardBody>
          </CCard>
        </div>
      </CContainer>
    );
  }

  return (
    <CContainer className="mt-5 mb-5 d-flex justify-content-center">
      <div style={{ width: '100%', maxWidth: '900px' }}>
        <CCard className="shadow-sm border-0 rounded-4">
          <CCardHeader className="bg-primary text-white rounded-top-4 py-3 px-4">
            <h4 className="mb-0 text-center text-md-start">My Profile</h4>
          </CCardHeader>
          <CCardBody className="px-4 px-md-5 py-4">
            <CForm onSubmit={handleSubmit}>
              <CRow className="gy-4">
                <CCol xs={12} md={6}>
                  <CFormLabel htmlFor="name">
                    Full Name
                    <span style={{ color: 'red', marginLeft: '4px' }}>*</span>
                  </CFormLabel>
                  <CFormInput
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    invalid={!!errors.name}
                    placeholder="Enter your name"
                  />
                  <CFormFeedback invalid>{errors.name}</CFormFeedback>
                </CCol>

                <CCol xs={12} md={6}>
                  <CFormLabel htmlFor="email">Email</CFormLabel>
                  <CFormInput
                    id="email"
                    name="email"
                    value={formData.email}
                    disabled
                    style={{ backgroundColor: '#e9ecef', cursor: 'not-allowed' }}
                  />
                </CCol>

                <CCol xs={12} md={6}>
                  <CFormLabel htmlFor="password">New Password</CFormLabel>
                  <CFormInput
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Leave blank to keep current"
                  />
                </CCol>

                <CCol xs={12} md={6}>
                  <CFormLabel htmlFor="confirmPassword">Confirm Password</CFormLabel>
                  <CFormInput
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    invalid={!!errors.confirmPassword}
                    placeholder="Re-enter new password"
                  />
                  <CFormFeedback invalid>{errors.confirmPassword}</CFormFeedback>
                </CCol>

                <CCol xs={12} md={6}>
                  <CFormLabel htmlFor="location">
                    Location
                    <span style={{ color: 'red', marginLeft: '4px' }}>*</span>
                  </CFormLabel>
                  <CFormSelect
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    invalid={!!errors.location}
                  >
                    <option value="">-- Select Location --</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.locationName}
                      </option>
                    ))}
                  </CFormSelect>
                  <CFormFeedback invalid>{errors.location}</CFormFeedback>
                </CCol>
              </CRow>

              <div className="d-flex justify-content-center justify-content-md-end mt-4">
                <CButton type="submit" color="primary" className="px-4" disabled={submitting}>
                  {submitting ? (
                    <>
                      <CSpinner size="sm" className="me-2" /> Saving...
                    </>
                  ) : (
                    'Update Profile'
                  )}
                </CButton>
              </div>
            </CForm>
          </CCardBody>
        </CCard>
      </div>
    </CContainer>
  );
};

export default ProfilePage;