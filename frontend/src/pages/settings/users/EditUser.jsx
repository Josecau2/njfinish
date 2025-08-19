import { useEffect, useRef, useState } from 'react';
import {
  CForm,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CFormSwitch,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CContainer,
  CRow,
  CCol,
  CFormFeedback,
} from '@coreui/react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchUserById, updateUser } from '../../../store/slices/userSlice';
import Swal from 'sweetalert2';
import { fetchLocations } from '../../../store/slices/locationSlice';

const initialForm = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  userGroup: '',
  location: '',
  isSalesRep: false,
};

const EditUserForm = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialForm);
  const initialFormRef = useRef(initialForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { selected } = useSelector(state => state.users);
  const { list: locations } = useSelector((state) => state.locations);

  useEffect(() => {
    if (id) {
      dispatch(fetchUserById(id));
    }
    dispatch(fetchLocations());
  }, [dispatch, id]);

  useEffect(() => {
    if (selected && id) {
      setFormData({
        name: selected.name || '',
        email: selected.email || '',
        password: '',
        confirmPassword: '',
        userGroup: selected.role || '',
        location: selected.location || '',
        isSalesRep: selected.isSalesRep || false
      });
      initialFormRef.current = {
        ...initialFormRef.current,
        name: selected.name || '',
        email: selected.email || '',
        userGroup: selected.role || '',
        location: selected.location || '',
        isSalesRep: selected.isSalesRep || false
      };
    }
  }, [selected, id]);

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!formData.userGroup) newErrors.userGroup = 'User group is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const response = await dispatch(updateUser({ id, data: formData }));
      if (response?.payload?.status == 200) {
        Swal.fire('Success!', response.payload.message, 'success');
        navigate('/settings/users');
      }
    } catch (error) {
      Swal.fire('Error', error.message || 'Something went wrong', 'error');
    } finally {
      setLoading(false);
    }
  };

  const isFormDirty = () => {
    return JSON.stringify(formData) !== JSON.stringify(initialFormRef.current);
  };

  return (
    <>
      <CCard>
        <CCardHeader className="d-flex justify-content-between align-items-center bg-white border-bottom">
          <h5 className="mb-0">Edit User</h5>
          <CButton color="light" onClick={() => navigate('/settings/users')}>Back</CButton>
        </CCardHeader>
        <CCardBody>
          <CForm onSubmit={handleSubmit}>
            <CRow className="mb-3">
              <CCol md={6}>
                <CFormLabel htmlFor="name">Name</CFormLabel>
                <CFormInput
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  invalid={!!errors.name}
                />
                <CFormFeedback invalid>{errors.name}</CFormFeedback>
              </CCol>
              <CCol md={6}>
                <CFormLabel htmlFor="email">Email</CFormLabel>
                <div>
                  <CFormInput
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    disabled
                    style={{
                      paddingRight: '2.5rem',
                      cursor: 'not-allowed',
                      backgroundColor: '#e9ecef',
                    }}
                  />
                </div>
              </CCol>
            </CRow>

            <CRow className="mb-3">
              <CCol md={6} style={{ position: 'relative' }}>
                <CFormLabel htmlFor="password">Password</CFormLabel>
                <CFormInput
                  id="password"
                  name="password"
                  type='password'
                  value={formData.password}
                  onChange={handleChange}
                  invalid={!!errors.password}
                />
                <CFormFeedback invalid>{errors.password}</CFormFeedback>
              </CCol>

              <CCol md={6} style={{ position: 'relative' }}>
                <CFormLabel htmlFor="confirmPassword">Confirm Password</CFormLabel>
                <CFormInput
                  id="confirmPassword"
                  name="confirmPassword"
                  type='password'
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  invalid={!!errors.confirmPassword}
                />
                <CFormFeedback invalid>{errors.confirmPassword}</CFormFeedback>
              </CCol>
            </CRow>

            <CRow className="mb-3">
              <CCol md={6}>
                <CFormLabel htmlFor="userGroup">User Group</CFormLabel>
                <CFormSelect
                  id="userGroup"
                  name="userGroup"
                  value={formData.userGroup}
                  onChange={handleChange}
                  invalid={!!errors.userGroup}
                >
                  <option value="">-- Select Group --</option>
                  <option value="User">User</option>
                  <option value="Admin">Admin</option>
                  <option value="Manufacturers">Manufacturers</option>
                </CFormSelect>
                <CFormFeedback invalid>{errors.userGroup}</CFormFeedback>
              </CCol>

              <CCol md={6}>
                <CFormLabel htmlFor="userGroup">Location</CFormLabel>
                <CFormSelect
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  invalid={!!errors.location}
                >
                  <option value="">-- Select Location --</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>
                      {loc.address}
                    </option>
                  ))}
                </CFormSelect>
                <CFormFeedback invalid>{errors.location}</CFormFeedback>
              </CCol>

            </CRow>

            <div className="mb-3 mt-3">
              <CFormSwitch
                label={
                  <span style={{ fontSize: '1rem', fontWeight: 600, color: '#adb5bd' }}>
                    Sales Representative
                  </span>
                }
                id="isSalesRep"
                name="isSalesRep"
                checked={formData.isSalesRep}
                onChange={handleChange}
                style={{
                  transform: 'scale(1.1)',
                }}
              />
            </div>
            <hr className="my-4" />

            <div className="d-flex gap-2 mt-4">
              <CButton type="submit" color="success" disabled={loading}>
                {loading ? 'Updating...' : 'Update'}
              </CButton>
              <CButton
                type="button"
                color="secondary"
                onClick={() => {
                  if (isFormDirty()) {
                    Swal.fire({
                      title: 'Are you sure?',
                      text: 'Changes you made will be lost if you leave now.',
                      icon: 'warning',
                      showCancelButton: true,
                      confirmButtonText: 'Leave Anyway',
                      cancelButtonText: 'Stay on Page',
                      confirmButtonColor: '#d33',
                      cancelButtonColor: '#6c757d',
                    }).then((result) => {
                      if (result.isConfirmed) {
                        navigate('/settings/users');
                      }
                    });
                  } else {
                    navigate('/settings/users');
                  }
                }}
              >
                Cancel
              </CButton>
            </div>
          </CForm>
        </CCardBody>
      </CCard>
    </>
  );
};

export default EditUserForm;
