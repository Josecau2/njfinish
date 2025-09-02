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
import CIcon from '@coreui/icons-react';
import {
  cilUser,
  cilLockLocked,
  cilArrowLeft,
  cilSave,
  cilSettings,
  cilHome,
  cilBuilding
} from '@coreui/icons';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { decodeParam } from '../../../utils/obfuscate';
import { fetchUserById, updateUser } from '../../../store/slices/userSlice';
import { fetchUsers as fetchUserGroups } from '../../../store/slices/userGroupSlice';
import Swal from 'sweetalert2';
import { fetchLocations } from '../../../store/slices/locationSlice';
import { useTranslation } from 'react-i18next';
import PageHeader from '../../../components/PageHeader';
import { getContrastColor } from '../../../utils/colorUtils';

const initialForm = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  userGroup: '',
  location: '',
  isSalesRep: false,
  // Personal address fields
  street_address: '',
  city: '',
  state: '',
  zip_code: '',
  country: '',
  // Company information
  company_name: '',
  company_street_address: '',
  company_city: '',
  company_state: '',
  company_zip_code: '',
  company_country: '',
};

const EditUserForm = () => {
  const { t } = useTranslation();
  const { id: rawId } = useParams();
  const id = decodeParam(rawId);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialForm);
  const initialFormRef = useRef(initialForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { selected } = useSelector(state => state.users);
  const { list: locations } = useSelector((state) => state.locations);
  const { list: userGroups = [] } = useSelector((state) => state.usersGroup || {});
  const customization = useSelector((state) => state.customization);

  useEffect(() => {
    if (id) {
      dispatch(fetchUserById(id));
    }
    dispatch(fetchLocations());
    dispatch(fetchUserGroups());
  }, [dispatch, id]);

  useEffect(() => {
    if (selected && id) {
      setFormData({
        name: selected.name || '',
        email: selected.email || '',
        password: '',
        confirmPassword: '',
        userGroup: selected.group_id || '',
        location: selected.location || '',
        isSalesRep: selected.isSalesRep || false,
        // Personal address fields
        street_address: selected.street_address || '',
        city: selected.city || '',
        state: selected.state || '',
        zip_code: selected.zip_code || '',
        country: selected.country || '',
        // Company information
        company_name: selected.company_name || '',
        company_street_address: selected.company_street_address || '',
        company_city: selected.company_city || '',
        company_state: selected.company_state || '',
        company_zip_code: selected.company_zip_code || '',
        company_country: selected.company_country || '',
      });
      initialFormRef.current = {
        ...initialFormRef.current,
        name: selected.name || '',
        email: selected.email || '',
        userGroup: selected.group_id || '',
        location: selected.location || '',
        isSalesRep: selected.isSalesRep || false,
        // Personal address fields
        street_address: selected.street_address || '',
        city: selected.city || '',
        state: selected.state || '',
        zip_code: selected.zip_code || '',
        country: selected.country || '',
        // Company information
        company_name: selected.company_name || '',
        company_street_address: selected.company_street_address || '',
        company_city: selected.company_city || '',
        company_state: selected.company_state || '',
        company_zip_code: selected.company_zip_code || '',
        company_country: selected.company_country || ''
      };
    }
  }, [selected, id]);

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = t('settings.users.form.validation.nameRequired');
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('settings.users.form.validation.passwordMismatch');
    }
    if (!formData.userGroup) newErrors.userGroup = t('settings.users.form.validation.userGroupRequired');
    if (!formData.location.trim()) newErrors.location = t('settings.users.form.validation.locationRequired');

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
        Swal.fire(t('common.success') + '!', response.payload.message, 'success');
        navigate('/settings/users');
      }
    } catch (error) {
      console.error('Update user error:', error);
      Swal.fire(t('common.error'), error.message || t('settings.users.alerts.genericError'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const isFormDirty = () => {
    return JSON.stringify(formData) !== JSON.stringify(initialFormRef.current);
  };

  return (
    <CContainer fluid className="settings-form-container">
      {/* Header Section */}
      <PageHeader
        title={t('settings.users.edit.title')}
        subtitle={t('settings.users.edit.subtitle')}
        icon={cilUser}
        showBackButton={true}
        onBackClick={() => navigate('/settings/users')}
      />

      <CForm onSubmit={handleSubmit}>
        {/* Basic Information Section */}
        <CCard className="settings-section-card">
          <CCardBody className="p-3 p-md-4">
            <div className="settings-section-header">
              <div className="settings-section-icon">
                <CIcon icon={cilUser} size="sm" />
              </div>
              <h6 className="settings-section-title">{t('settings.users.form.titles.basicInfo')}</h6>
            </div>
            <CRow>
              <CCol md={6}>
                <div className="mb-3">
                  <CFormLabel htmlFor="name" className="settings-form-label">
                    {t('settings.users.form.labels.fullName')}
                    <span className="text-danger ms-1">*</span>
                  </CFormLabel>
                  <CFormInput
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    invalid={!!errors.name}
                    className="settings-form-input"
                  />
                  <CFormFeedback invalid>{errors.name}</CFormFeedback>
                </div>
              </CCol>
              <CCol md={6}>
                <div className="mb-3">
                  <CFormLabel htmlFor="email" className="settings-form-label">
                    {t('settings.users.form.labels.email')}
                  </CFormLabel>
                  <CFormInput
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    disabled
                    className="settings-form-input"
                    style={{
                      cursor: 'not-allowed',
                      backgroundColor: '#e9ecef',
                    }}
                  />
                </div>
              </CCol>
            </CRow>
          </CCardBody>
        </CCard>

        {/* Security Section */}
        <CCard className="settings-section-card">
          <CCardBody className="p-3 p-md-4">
            <div className="settings-section-header">
              <div className="settings-section-icon">
                <CIcon icon={cilLockLocked} size="sm" />
              </div>
              <h6 className="settings-section-title">{t('settings.users.form.titles.security')}</h6>
            </div>
            <CRow>
              <CCol md={6}>
                <div className="mb-3">
                  <CFormLabel htmlFor="password" className="settings-form-label">
                    {t('settings.users.form.labels.password')}
                  </CFormLabel>
                  <CFormInput
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    invalid={!!errors.password}
                    className="settings-form-input"
                    placeholder={t('settings.users.form.placeholders.password')}
                  />
                  <CFormFeedback invalid>{errors.password}</CFormFeedback>
                </div>
              </CCol>
              <CCol md={6}>
                <div className="mb-3">
                  <CFormLabel htmlFor="confirmPassword" className="settings-form-label">
                    {t('settings.users.form.labels.confirmPassword')}
                  </CFormLabel>
                  <CFormInput
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    invalid={!!errors.confirmPassword}
                    className="settings-form-input"
                    placeholder={t('settings.users.form.placeholders.confirmPassword')}
                  />
                  <CFormFeedback invalid>{errors.confirmPassword}</CFormFeedback>
                </div>
              </CCol>
            </CRow>
          </CCardBody>
        </CCard>

        {/* User Details Section */}
        <CCard className="settings-section-card">
          <CCardBody className="p-3 p-md-4">
            <div className="settings-section-header">
              <div className="settings-section-icon">
                <CIcon icon={cilSettings} size="sm" />
              </div>
              <h6 className="settings-section-title">{t('settings.users.form.titles.details')}</h6>
            </div>
            <CRow>
              <CCol md={6}>
                <div className="mb-3">
                  <CFormLabel htmlFor="userGroup" className="settings-form-label">
                    {t('settings.users.form.labels.userGroup')}
                    <span className="text-danger ms-1">*</span>
                  </CFormLabel>
                  <CFormSelect
                    id="userGroup"
                    name="userGroup"
                    value={formData.userGroup}
                    onChange={handleChange}
                    invalid={!!errors.userGroup}
                    className="settings-form-input"
                  >
                    <option value="">{t('settings.users.form.select.group')}</option>
                    {userGroups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </CFormSelect>
                  <CFormFeedback invalid>{errors.userGroup}</CFormFeedback>
                </div>
              </CCol>
              <CCol md={6}>
                <div className="mb-3">
                  <CFormLabel htmlFor="location" className="settings-form-label">
                    {t('settings.users.form.labels.location')}
                    <span className="text-danger ms-1">*</span>
                  </CFormLabel>
                  <CFormSelect
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    invalid={!!errors.location}
                    className="settings-form-input"
                  >
                    <option value="">{t('settings.users.form.select.location')}</option>
                    {locations.map(loc => (
                      <option key={loc.id} value={loc.id}>
                        {loc.address}
                      </option>
                    ))}
                  </CFormSelect>
                  <CFormFeedback invalid>{errors.location}</CFormFeedback>
                </div>
              </CCol>
            </CRow>

            <div className="mb-3">
              <CFormSwitch
                label={
                  <span className="settings-form-label">
                    {t('settings.users.form.labels.salesRep')}
                  </span>
                }
                id="isSalesRep"
                name="isSalesRep"
                checked={formData.isSalesRep}
                onChange={handleChange}
                size="lg"
                style={{
                  transform: 'scale(1.1)',
                }}
              />
            </div>
          </CCardBody>
        </CCard>

        {/* Personal Address Section */}
        <CCard className="settings-section-card">
          <CCardBody className="p-3 p-md-4">
            <div className="settings-section-header">
              <div className="settings-section-icon">
                <CIcon icon={cilHome} size="sm" />
              </div>
              <h6 className="settings-section-title">{t('settings.users.form.titles.personalAddress', 'Personal Address')}</h6>
            </div>
            <CRow>
              <CCol xs={12}>
                <div className="mb-3">
                  <CFormLabel htmlFor="street_address" className="settings-form-label">
                    {t('settings.users.form.labels.streetAddress', 'Street Address')}
                  </CFormLabel>
                  <CFormInput
                    type="text"
                    id="street_address"
                    name="street_address"
                    value={formData.street_address}
                    onChange={handleChange}
                    placeholder={t('settings.users.form.placeholders.streetAddress', 'Enter street address')}
                    className="settings-form-input"
                  />
                </div>
              </CCol>
            </CRow>
            <CRow>
              <CCol xs={12} md={6}>
                <div className="mb-3">
                  <CFormLabel htmlFor="city" className="settings-form-label">
                    {t('settings.users.form.labels.city', 'City')}
                  </CFormLabel>
                  <CFormInput
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder={t('settings.users.form.placeholders.city', 'Enter city')}
                    className="settings-form-input"
                  />
                </div>
              </CCol>
              <CCol xs={12} md={3}>
                <div className="mb-3">
                  <CFormLabel htmlFor="state" className="settings-form-label">
                    {t('settings.users.form.labels.state', 'State/Province')}
                  </CFormLabel>
                  <CFormInput
                    type="text"
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder={t('settings.users.form.placeholders.state', 'State')}
                    className="settings-form-input"
                  />
                </div>
              </CCol>
              <CCol xs={12} md={3}>
                <div className="mb-3">
                  <CFormLabel htmlFor="zip_code" className="settings-form-label">
                    {t('settings.users.form.labels.zipCode', 'ZIP/Postal Code')}
                  </CFormLabel>
                  <CFormInput
                    type="text"
                    id="zip_code"
                    name="zip_code"
                    value={formData.zip_code}
                    onChange={handleChange}
                    placeholder={t('settings.users.form.placeholders.zipCode', 'ZIP Code')}
                    className="settings-form-input"
                  />
                </div>
              </CCol>
            </CRow>
            <CRow>
              <CCol xs={12} md={6}>
                <div className="mb-3">
                  <CFormLabel htmlFor="country" className="settings-form-label">
                    {t('settings.users.form.labels.country', 'Country')}
                  </CFormLabel>
                  <CFormInput
                    type="text"
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    placeholder={t('settings.users.form.placeholders.country', 'Enter country')}
                    className="settings-form-input"
                  />
                </div>
              </CCol>
            </CRow>
          </CCardBody>
        </CCard>

        {/* Company Information Section */}
        <CCard className="settings-section-card">
          <CCardBody className="p-3 p-md-4">
            <div className="settings-section-header">
              <div className="settings-section-icon">
                <CIcon icon={cilBuilding} size="sm" />
              </div>
              <h6 className="settings-section-title">{t('settings.users.form.titles.companyInfo', 'Company Information')}</h6>
            </div>
            <CRow>
              <CCol xs={12} md={6}>
                <div className="mb-3">
                  <CFormLabel htmlFor="company_name" className="settings-form-label">
                    {t('settings.users.form.labels.companyName', 'Company Name')}
                  </CFormLabel>
                  <CFormInput
                    type="text"
                    id="company_name"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleChange}
                    placeholder={t('settings.users.form.placeholders.companyName', 'Enter company name')}
                    className="settings-form-input"
                  />
                </div>
              </CCol>
            </CRow>
            <CRow>
              <CCol xs={12}>
                <div className="mb-3">
                  <CFormLabel htmlFor="company_street_address" className="settings-form-label">
                    {t('settings.users.form.labels.companyStreetAddress', 'Company Address')}
                  </CFormLabel>
                  <CFormInput
                    type="text"
                    id="company_street_address"
                    name="company_street_address"
                    value={formData.company_street_address}
                    onChange={handleChange}
                    placeholder={t('settings.users.form.placeholders.companyStreetAddress', 'Enter company street address')}
                    className="settings-form-input"
                  />
                </div>
              </CCol>
            </CRow>
            <CRow>
              <CCol xs={12} md={6}>
                <div className="mb-3">
                  <CFormLabel htmlFor="company_city" className="settings-form-label">
                    {t('settings.users.form.labels.companyCity', 'Company City')}
                  </CFormLabel>
                  <CFormInput
                    type="text"
                    id="company_city"
                    name="company_city"
                    value={formData.company_city}
                    onChange={handleChange}
                    placeholder={t('settings.users.form.placeholders.companyCity', 'Enter company city')}
                    className="settings-form-input"
                  />
                </div>
              </CCol>
              <CCol xs={12} md={3}>
                <div className="mb-3">
                  <CFormLabel htmlFor="company_state" className="settings-form-label">
                    {t('settings.users.form.labels.companyState', 'Company State/Province')}
                  </CFormLabel>
                  <CFormInput
                    type="text"
                    id="company_state"
                    name="company_state"
                    value={formData.company_state}
                    onChange={handleChange}
                    placeholder={t('settings.users.form.placeholders.companyState', 'State')}
                    className="settings-form-input"
                  />
                </div>
              </CCol>
              <CCol xs={12} md={3}>
                <div className="mb-3">
                  <CFormLabel htmlFor="company_zip_code" className="settings-form-label">
                    {t('settings.users.form.labels.companyZipCode', 'Company ZIP/Postal Code')}
                  </CFormLabel>
                  <CFormInput
                    type="text"
                    id="company_zip_code"
                    name="company_zip_code"
                    value={formData.company_zip_code}
                    onChange={handleChange}
                    placeholder={t('settings.users.form.placeholders.companyZipCode', 'ZIP Code')}
                    className="settings-form-input"
                  />
                </div>
              </CCol>
            </CRow>
            <CRow>
              <CCol xs={12} md={6}>
                <div className="mb-3">
                  <CFormLabel htmlFor="company_country" className="settings-form-label">
                    {t('settings.users.form.labels.companyCountry', 'Company Country')}
                  </CFormLabel>
                  <CFormInput
                    type="text"
                    id="company_country"
                    name="company_country"
                    value={formData.company_country}
                    onChange={handleChange}
                    placeholder={t('settings.users.form.placeholders.companyCountry', 'Enter company country')}
                    className="settings-form-input"
                  />
                </div>
              </CCol>
            </CRow>
          </CCardBody>
        </CCard>

        {/* Action Buttons */}
        <CCard className="settings-form-actions">
          <CCardBody className="p-3 p-md-4">
            <div className="d-flex flex-column flex-md-row gap-2 gap-md-3 justify-content-end">
              <CButton
                type="button"
                color="light"
                className="settings-form-cancel-btn order-2 order-md-1"
                onClick={() => {
                  if (isFormDirty()) {
                    Swal.fire({
                      title: t('common.confirm') || 'Are you sure?',
                      text: t('settings.users.form.alerts.leaveWarning'),
                      icon: 'warning',
                      showCancelButton: true,
                      confirmButtonText: t('settings.users.form.alerts.leaveAnyway'),
                      cancelButtonText: t('settings.users.form.alerts.stayOnPage'),
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
                <CIcon icon={cilArrowLeft} className="me-2" />
                {t('common.cancel')}
              </CButton>
              <CButton
                type="submit"
                disabled={loading}
                className="settings-form-submit-btn order-1 order-md-2"
                style={{
                  backgroundColor: customization?.headerBg || '#28a745',
                  borderColor: customization?.headerBg || '#28a745',
                  color: getContrastColor(customization?.headerBg || '#28a745'),
                  border: 'none'
                }}
              >
                {loading ? (
                  <>
                    <div
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      style={{ width: '14px', height: '14px' }}
                    >
                      <span className="visually-hidden">{t('common.loading')}</span>
                    </div>
                    {t('settings.users.edit.updating')}
                  </>
                ) : (
                  <>
                    <CIcon icon={cilSave} className="me-2" />
                    {t('settings.users.edit.update')}
                  </>
                )}
              </CButton>
            </div>
          </CCardBody>
        </CCard>
      </CForm>
    </CContainer>
  );
};

export default EditUserForm;
