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
import Swal from 'sweetalert2';
import { fetchUsers } from '../../../store/slices/userGroupSlice';

// Move component definitions outside to prevent re-creation on every render
const FormSection = ({ title, icon, children, className = "" }) => (
  <CCard className={`border-0 shadow-sm mb-2 mb-md-4 ${className}`}>
    <CCardBody className="p-3 p-md-4">
      <div className="d-flex align-items-center mb-3">
        <div 
          className="rounded-circle d-flex align-items-center justify-content-center me-2 me-md-3"
          style={{
            width: '32px',
            height: '32px',
            backgroundColor: '#e7f3ff',
            color: '#0d6efd'
          }}
        >
          <CIcon icon={icon} size="sm" />
        </div>
        <h6 className="mb-0 fw-semibold text-dark small">{title}</h6>
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
    <CFormLabel htmlFor={name} className="fw-medium text-dark mb-2">
      {label}
      {required && <span className="text-danger ms-1">*</span>}
    </CFormLabel>
    <CInputGroup>
      {icon && (
        <CInputGroupText className="bg-light border-end-0">
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
        className={icon ? "border-start-0" : ""}
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
    <CFormLabel htmlFor={name} className="fw-medium text-dark mb-2">
      {label}
      {required && <span className="text-danger ms-1">*</span>}
    </CFormLabel>
    <CInputGroup>
      {icon && (
        <CInputGroupText className="bg-light border-end-0">
          <CIcon icon={icon} size="sm" className="text-muted" />
        </CInputGroupText>
      )}
      <CFormSelect
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        invalid={isInvalid}
        className={icon ? "border-start-0" : ""}
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
  const dispatch = useDispatch();
  const { error } = useSelector(state => state.users);
  const { list: usersGroup } = useSelector((state) => state.usersGroup);
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialForm);
  const initialFormRef = useRef(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.password) newErrors.password = 'Password is required';
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirm password is required';
    } else if (formData.password !== formData.confirmPassword) {
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
          title: 'Email Previously Deleted',
          text: 'A user with this email already exists but is currently Deleted. Do you want to restore the account?',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Yes, restore',
          cancelButtonText: 'No'
        });

        if (result.isConfirmed) {
          return handleSubmit(e, true);
        } else {
          return;
        }
      }

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
    <CContainer fluid className="p-1 p-md-2 m-0 m-md-2" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header Section */}
      <CCard className="border-0 shadow-sm mb-2 mb-md-4" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <CCardBody className="py-3 py-md-4 px-3 px-md-4">
          <CRow className="align-items-center">
            <CCol>
              <div className="d-flex align-items-center flex-column flex-md-row text-center text-md-start">
                <div 
                  className="rounded-circle d-flex align-items-center justify-content-center me-md-3 mb-2 mb-md-0"
                  style={{
                    width: '40px',
                    height: '40px',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <CIcon icon={cilUserPlus} size="sm" className="text-white" />
                </div>
                <div>
                  <h5 className="text-white mb-1 fw-bold">Add New User</h5>
                  <p className="text-white-50 mb-0 small d-none d-md-block">Create a new user account with role-based access</p>
                </div>
              </div>
            </CCol>
            <CCol xs="12" className="mt-3 mt-md-0" md="auto">
              <CButton
                color="light"
                className="shadow-sm px-3 px-md-4 fw-semibold w-100 w-md-auto"
                size="sm"
                onClick={() => navigate('/settings/users')}
                style={{
                  borderRadius: '25px',
                  border: 'none',
                  transition: 'all 0.3s ease'
                }}
              >
                <CIcon icon={cilArrowLeft} className="me-2" />
                Back
              </CButton>
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      {/* Error Alert */}
      {error && (
        <CCard className="border-0 shadow-sm mb-2 mb-md-4">
          <CCardBody className="p-3">
            <div className="alert alert-danger mb-0">
              <strong>Error:</strong> {typeof error === 'string' ? error : error.message || 'An error occurred'}
            </div>
          </CCardBody>
        </CCard>
      )}

      <CForm onSubmit={handleSubmit}>
        {/* Basic Information Section */}
        <FormSection title="Basic Information" icon={cilUser}>
          <CRow>
            <CCol xs={12} md={6}>
              <CustomFormInput
                label="Full Name"
                name="name"
                required
                icon={cilUser}
                placeholder="Enter user's full name"
                value={formData.name}
                onChange={handleChange}
                isInvalid={!!errors.name}
                feedback={errors.name}
              />
            </CCol>
            <CCol xs={12} md={6}>
              <CustomFormInput
                label="Email Address"
                name="email"
                type="email"
                required
                icon={cilEnvelopeClosed}
                placeholder="user@example.com"
                value={formData.email}
                onChange={handleChange}
                isInvalid={!!errors.email}
                feedback={errors.email}
              />
            </CCol>
          </CRow>
        </FormSection>

        {/* Security Information Section */}
        <FormSection title="Security Settings" icon={cilSettings}>
          <CRow>
            <CCol xs={12} md={6}>
              <CustomFormInput
                label="Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                icon={cilLockLocked}
                placeholder="Enter secure password"
                value={formData.password}
                onChange={handleChange}
                isInvalid={!!errors.password}
                feedback={errors.password}
              />
            </CCol>
            <CCol xs={12} md={6}>
              <CustomFormInput
                label="Confirm Password"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                icon={cilLockLocked}
                placeholder="Confirm password"
                value={formData.confirmPassword}
                onChange={handleChange}
                isInvalid={!!errors.confirmPassword}
                feedback={errors.confirmPassword}
              />
            </CCol>
          </CRow>
        </FormSection>

        {/* Role & Access Section */}
        <FormSection title="Role & Access" icon={cilSettings}>
          <CRow>
            <CCol xs={12} md={6}>
              <CustomFormSelect
                label="User Group"
                name="userGroup"
                required
                icon={cilUser}
                value={formData.userGroup}
                onChange={handleChange}
                isInvalid={!!errors.userGroup}
                feedback={errors.userGroup}
              >
                <option value="">-- Select Group --</option>
                {usersGroup.map(group => (
                  <option key={group.id} value={group.user_group.name}>
                    {group.user_group.name}
                  </option>
                ))}
              </CustomFormSelect>
            </CCol>
            <CCol xs={12} md={6}>
              <CustomFormSelect
                label="Location"
                name="location"
                required
                icon={cilLocationPin}
                value={formData.location}
                onChange={handleChange}
                isInvalid={!!errors.location}
                feedback={errors.location}
              >
                <option value="">-- Select Location --</option>
                <option value="1">Main 1</option>
                <option value="2">Main 2</option>
                <option value="3">Main 3</option>
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
                  <div className="fw-semibold text-dark small">Sales Representative</div>
                  <div className="text-muted" style={{ fontSize: '12px' }}>
                    Grant sales-specific permissions and access
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
        <CCard className="border-0 shadow-sm">
          <CCardBody className="p-3 p-md-4">
            <div className="d-flex flex-column flex-md-row gap-2 gap-md-3 justify-content-end">
              <CButton
                type="button"
                color="light"
                size="md"
                className="px-3 px-md-4 fw-semibold order-2 order-md-1"
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
                style={{
                  borderRadius: '25px',
                  border: '1px solid #e3e6f0',
                  transition: 'all 0.3s ease'
                }}
              >
                <CIcon icon={cilArrowLeft} className="me-2" />
                Cancel
              </CButton>
              <CButton
                type="submit"
                color="success"
                size="md"
                disabled={loading}
                className="px-4 px-md-5 fw-semibold order-1 order-md-2"
                style={{
                  borderRadius: '25px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                  transition: 'all 0.3s ease'
                }}
              >
                {loading ? (
                  <>
                    <div 
                      className="spinner-border spinner-border-sm me-2" 
                      role="status"
                      style={{ width: '14px', height: '14px' }}
                    >
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <CIcon icon={cilSave} className="me-2" />
                    Create User
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