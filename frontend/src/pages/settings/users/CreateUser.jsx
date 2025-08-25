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
  CContainer,
  CRow,
  CCol,
  CFormFeedback,
  CInputGroup,
  CInputGroupText,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import {
  cilUser,
  cilEnvelopeClosed,
  cilLockLocked,
  cilLocationPin,
  cilArrowLeft,
  cilSave,
  cilUserPlus,
  cilEyedropper,
  cilSettings
} from '@coreui/icons';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { addUser } from '../../../store/slices/userSlice';
import { fetchLocations } from '../../../store/slices/locationSlice';
import Swal from 'sweetalert2';
import { fetchUsers } from '../../../store/slices/userGroupSlice';
import { useTranslation } from 'react-i18next';

// Move component definitions outside to prevent re-creation on every render
const FormSection = ({ title, icon, children, className = "" }) => (
  <CCard className={`settings-section-card ${className}`}>
    <CCardBody className="p-3 p-md-4">
      <div className="settings-section-header">
        <div className="settings-section-icon">
          <CIcon icon={icon} size="sm" />
        </div>
        <h6 className="settings-section-title">{title}</h6>
      </div>
      {children}
    </CCardBody>
  </CCard>
);

const CustomFormInput = ({ 
  label, 
  name, 
  type = "text", 
  required = false, 
  icon = null,
  placeholder = "",
  value,
  onChange,
  isInvalid,
  feedback,
  ...props 
}) => (
  <div className="mb-3">
    <CFormLabel htmlFor={name} className="settings-form-label">
      {label}
      {required && <span className="text-danger ms-1">*</span>}
    </CFormLabel>
    <CInputGroup>
      {icon && (
        <CInputGroupText className="settings-form-input-group-text">
          <CIcon icon={icon} size="sm" className="text-muted" />
        </CInputGroupText>
      )}
      <CFormInput
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        invalid={isInvalid}
        className={`settings-form-input ${icon ? "border-start-0" : ""}`}
        {...props}
      />
      {feedback && <CFormFeedback>{feedback}</CFormFeedback>}
    </CInputGroup>
  </div>
);

const CustomFormSelect = ({ 
  label, 
  name, 
  required = false, 
  icon = null,
  children,
  value,
  onChange,
  isInvalid,
  feedback,
  ...props 
}) => (
  <div className="mb-3">
    <CFormLabel htmlFor={name} className="settings-form-label">
      {label}
      {required && <span className="text-danger ms-1">*</span>}
    </CFormLabel>
    <CInputGroup>
      {icon && (
        <CInputGroupText className="settings-form-input-group-text">
          <CIcon icon={icon} size="sm" className="text-muted" />
        </CInputGroupText>
      )}
      <CFormSelect
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        invalid={isInvalid}
        className={`settings-form-input ${icon ? "border-start-0" : ""}`}
        {...props}
      >
        {children}
      </CFormSelect>
      {feedback && <CFormFeedback>{feedback}</CFormFeedback>}
    </CInputGroup>
  </div>
);

const initialForm = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  userGroup: '',
  location: '',
  isSalesRep: false,
};

const AddUserForm = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { error } = useSelector(state => state.users);
  const { list: usersGroup = [] } = useSelector((state) => state.usersGroup || {});
  const { list: locations = [] } = useSelector((state) => state.locations || {});
  const navigate = useNavigate();
  
  // Debug log for locations
  console.log('Locations from Redux:', locations);
  const [formData, setFormData] = useState(initialForm);
  const initialFormRef = useRef(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchUsers());
    dispatch(fetchLocations()).then((result) => {
      console.log('Locations fetch result:', result);
    });
  }, [dispatch]);

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = t('settings.users.form.validation.nameRequired');
    if (!formData.email.trim()) {
      newErrors.email = t('settings.users.form.validation.emailRequired');
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = t('settings.users.form.validation.invalidEmail');
    }
    if (!formData.password) newErrors.password = t('settings.users.form.validation.passwordRequired');
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t('settings.users.form.validation.confirmPasswordRequired');
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('settings.users.form.validation.passwordMismatch');
    }
    if (!formData.userGroup) newErrors.userGroup = t('settings.users.form.validation.userGroupRequired');
    // Location is optional, no validation required

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e, force = false) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const response = await dispatch(addUser({ ...formData, force }));

      if (response?.payload?.email_exists_but_deleted) {
        const result = await Swal.fire({
          title: t('settings.users.alerts.emailDeletedTitle'),
          text: t('settings.users.alerts.emailDeletedText'),
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: t('settings.users.alerts.restoreYes'),
          cancelButtonText: t('common.no')
        });

        if (result.isConfirmed) {
          return handleSubmit(e, true);
        } else {
          return;
        }
      }

      if (response?.payload?.status == 200) {
        Swal.fire(t('common.success') + '!', response.payload.message, 'success');
        navigate('/settings/users');
      }
    } catch (error) {
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
      <CCard className="settings-form-header">
        <CCardBody className="py-3 py-md-4 px-3 px-md-4">
          <CRow className="align-items-center">
            <CCol>
              <div className="d-flex align-items-center flex-column flex-md-row text-center text-md-start">
                <div className="settings-form-icon">
                  <CIcon icon={cilUserPlus} size="sm" className="text-white" />
                </div>
                <div>
                  <h5 className="settings-form-title">{t('settings.users.create.title')}</h5>
                  <p className="settings-form-subtitle d-none d-md-block">{t('settings.users.create.subtitle')}</p>
                </div>
              </div>
            </CCol>
            <CCol xs="12" className="mt-3 mt-md-0" md="auto">
              <CButton
                color="light"
                className="settings-back-button w-100 w-md-auto"
                size="sm"
                onClick={() => navigate('/settings/users')}
              >
                <CIcon icon={cilArrowLeft} className="me-2" />
                {t('common.back')}
              </CButton>
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      {/* Error Alert */}
      {error && (
        <CCard className="settings-section-card">
          <CCardBody className="p-3">
            <div className="alert alert-danger mb-0">
              <strong>{t('common.error')}:</strong> {typeof error === 'string' ? error : error.message || t('settings.users.alerts.genericError')}
            </div>
          </CCardBody>
        </CCard>
      )}

      <CForm onSubmit={handleSubmit}>
        {/* Basic Information Section */}
  <FormSection title={t('settings.users.form.titles.basicInfo')} icon={cilUser}>
          <CRow>
            <CCol xs={12} md={6}>
              <CustomFormInput
    label={t('settings.users.form.labels.fullName')}
                name="name"
                required
                icon={cilUser}
    placeholder={t('settings.users.form.placeholders.fullName')}
                value={formData.name}
                onChange={handleChange}
                isInvalid={!!errors.name}
                feedback={errors.name}
              />
            </CCol>
            <CCol xs={12} md={6}>
              <CustomFormInput
    label={t('settings.users.form.labels.email')}
                name="email"
                type="email"
                required
                icon={cilEnvelopeClosed}
    placeholder={t('settings.users.form.placeholders.email')}
                value={formData.email}
                onChange={handleChange}
                isInvalid={!!errors.email}
                feedback={errors.email}
              />
            </CCol>
          </CRow>
        </FormSection>

        {/* Security Information Section */}
  <FormSection title={t('settings.users.form.titles.security')} icon={cilSettings}>
          <CRow>
            <CCol xs={12} md={6}>
              <CustomFormInput
    label={t('settings.users.form.labels.password')}
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                icon={cilLockLocked}
    placeholder={t('settings.users.form.placeholders.password')}
                value={formData.password}
                onChange={handleChange}
                isInvalid={!!errors.password}
                feedback={errors.password}
              />
            </CCol>
            <CCol xs={12} md={6}>
              <CustomFormInput
    label={t('settings.users.form.labels.confirmPassword')}
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                icon={cilLockLocked}
    placeholder={t('settings.users.form.placeholders.confirmPassword')}
                value={formData.confirmPassword}
                onChange={handleChange}
                isInvalid={!!errors.confirmPassword}
                feedback={errors.confirmPassword}
              />
            </CCol>
          </CRow>
        </FormSection>

        {/* Role & Access Section */}
  <FormSection title={t('settings.users.form.titles.roleAccess')} icon={cilSettings}>
          <CRow>
            <CCol xs={12} md={6}>
              <CustomFormSelect
    label={t('settings.users.form.labels.userGroup')}
                name="userGroup"
                required
                icon={cilUser}
                value={formData.userGroup}
                onChange={handleChange}
                isInvalid={!!errors.userGroup}
                feedback={errors.userGroup}
              >
    <option value="">{t('settings.users.form.select.group')}</option>
                {(usersGroup || []).map((group) => {
                  const name = group?.user_group?.name ?? group?.name ?? `Group #${group?.id ?? ''}`;
                  return (
                    <option key={group?.id ?? name} value={name}>
                      {name}
                    </option>
                  );
                })}
              </CustomFormSelect>
            </CCol>
            <CCol xs={12} md={6}>
              <CustomFormSelect
    label={t('settings.users.form.labels.location')}
                name="location"
                icon={cilLocationPin}
                value={formData.location}
                onChange={handleChange}
                isInvalid={!!errors.location}
                feedback={errors.location}
              >
    <option value="">{t('settings.users.form.select.location')}</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.locationName}
                  </option>
                ))}
              </CustomFormSelect>
            </CCol>
          </CRow>

          {/* Sales Representative Toggle */}
          <div className="mb-3">
            <div className="d-flex align-items-center justify-content-between p-3 rounded-3" 
                 style={{ backgroundColor: '#f8f9fa', border: '1px solid #e3e6f0' }}>
              <div className="d-flex align-items-center">
                <div 
                  className="rounded-circle d-flex align-items-center justify-content-center me-3"
                  style={{
                    width: '32px',
                    height: '32px',
                    backgroundColor: formData.isSalesRep ? '#e6ffed' : '#fff3cd',
                    color: formData.isSalesRep ? '#28a745' : '#856404'
                  }}
                >
                  <CIcon icon={cilUser} size="sm" />
                </div>
                <div>
                  <div className="fw-semibold text-dark small">{t('settings.users.form.labels.salesRep')}</div>
                  <div className="text-muted" style={{ fontSize: '12px' }}>
                    {t('settings.users.form.hints.salesRep')}
                  </div>
                </div>
              </div>
              <CFormSwitch
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
          </div>
        </FormSection>

        {/* Action Buttons */}
        <CCard className="settings-form-actions">
          <CCardBody className="p-3 p-md-4">
            <div className="d-flex flex-column flex-md-row gap-2 gap-md-3 justify-content-end">
              <CButton
                type="button"
                color="light"
                size="md"
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
                color="success"
                size="md"
                disabled={loading}
                className="settings-form-submit-btn order-1 order-md-2"
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
                    {t('settings.users.create.submitting')}
                  </>
                ) : (
                  <>
                    <CIcon icon={cilSave} className="me-2" />
                    {t('settings.users.create.submit')}
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

export default AddUserForm;