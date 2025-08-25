import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import axiosInstance from '../../helpers/axiosInstance';

const ProfilePage = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const loggedInUser = JSON.parse(localStorage.getItem('user'));
  const loggedInUserId = loggedInUser?.userId;
  const isContractor = loggedInUser?.group?.group_type === 'contractor';
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
    const load = async () => {
      if (isContractor) {
        try {
          const res = await axiosInstance.get('/api/me');
          const me = res.data;
          const data = {
            name: me.name || '',
            email: me.email || '',
            password: '',
            confirmPassword: '',
            location: ''
          };
          setFormData(data);
          initialFormRef.current = data;
        } catch (e) {
          // If /api/me isn't available yet (404), fall back to legacy fetch by ID
          if (loggedInUserId) {
            await dispatch(fetchUserById(loggedInUserId));
          }
        }
      } else {
        if (loggedInUserId) {
          dispatch(fetchUserById(loggedInUserId));
        }
        dispatch(fetchLocations());
      }
    };
    load();
  }, [dispatch, loggedInUserId, isContractor]);

  useEffect(() => {
    if (!isContractor && selected) {
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
  }, [selected, isContractor]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = t('profile.validation.nameRequired');
    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = t('profile.validation.passwordMismatch');
    if (!isContractor && !formData.location.trim()) newErrors.location = t('profile.validation.locationRequired');

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      if (isContractor) {
        const body = { name: formData.name };
        if (formData.password && formData.password.trim() !== '') body.password = formData.password;
        const res = await axiosInstance.put('/api/me', body);
        if (res?.data?.status === 200 || res?.status === 200) {
      Swal.fire(t('common.success'), t('profile.updateSuccess'), 'success');
        } else {
      throw new Error(res?.data?.message || t('profile.updateFailed'));
        }
      } else {
        const payload = { ...formData };
        delete payload.confirmPassword;
        const response = await dispatch(updateUser({ id: loggedInUserId, data: payload }));
        if (response?.payload?.status === 200) {
      Swal.fire(t('common.success'), t('profile.updateSuccess'), 'success');
        } else {
      throw new Error(response?.payload?.message || t('profile.updateFailed'));
        }
      }
    } catch (error) {
    Swal.fire(t('common.error'), error.message || t('profile.errorGeneric'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Show loader while initial data is loading
  if (isLoading) {
    return (
      <div className="profile-container">
        <CCard className="profile-card">
          <CCardBody className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
            <CSpinner color="primary" size="lg" />
          </CCardBody>
        </CCard>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <CCard className="profile-card">
        <CCardHeader>
          <h4 className="mb-0">{t('profile.header')}</h4>
        </CCardHeader>
        <CCardBody>
          <CForm onSubmit={handleSubmit} className="profile-form">
            <CRow className="gy-4">
              <CCol xs={12} md={6}>
                <CFormLabel htmlFor="name">
                  {t('profile.fullName')}
                  <span style={{ color: 'red', marginLeft: '4px' }}>*</span>
                </CFormLabel>
                <CFormInput
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  invalid={!!errors.name}
                  placeholder={t('profile.enterName')}
                />
                <CFormFeedback invalid>{errors.name}</CFormFeedback>
              </CCol>

              <CCol xs={12} md={6}>
                <CFormLabel htmlFor="email">{t('auth.email')}</CFormLabel>
                <CFormInput
                  id="email"
                  name="email"
                  value={formData.email}
                  disabled
                  style={{ backgroundColor: '#e9ecef', cursor: 'not-allowed' }}
                />
              </CCol>

              <CCol xs={12} md={6}>
                <CFormLabel htmlFor="password">{t('profile.newPassword')}</CFormLabel>
                <CFormInput
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={t('profile.leaveBlank')}
                />
              </CCol>

              <CCol xs={12} md={6}>
                <CFormLabel htmlFor="confirmPassword">{t('profile.confirmPassword')}</CFormLabel>
                <CFormInput
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  invalid={!!errors.confirmPassword}
                  placeholder={t('profile.reenterPassword')}
                />
                <CFormFeedback invalid>{errors.confirmPassword}</CFormFeedback>
              </CCol>

              {!isContractor && (
                <CCol xs={12} md={6}>
                  <CFormLabel htmlFor="location">
                    {t('profile.location')}
                    <span style={{ color: 'red', marginLeft: '4px' }}>*</span>
                  </CFormLabel>
                  <CFormSelect
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    invalid={!!errors.location}
                  >
                    <option value="">-- {t('profile.selectLocation')} --</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.locationName}
                      </option>
                    ))}
                  </CFormSelect>
                  <CFormFeedback invalid>{errors.location}</CFormFeedback>
                </CCol>
              )}
            </CRow>

            <div className="d-flex justify-content-center justify-content-md-end mt-4">
              <CButton type="submit" color="primary" className="px-4" disabled={submitting}>
                {submitting ? (
                  <>
                    <CSpinner size="sm" className="me-2" /> {t('profile.saving')}
                  </>
                ) : (
                  t('profile.updateProfile')
                )}
              </CButton>
            </div>
          </CForm>
        </CCardBody>
      </CCard>
    </div>
  );
};

export default ProfilePage;