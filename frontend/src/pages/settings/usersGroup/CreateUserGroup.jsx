import { useEffect, useRef, useState } from 'react';
import {
    CForm,
    CFormInput,
    CFormLabel,
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
    cilSettings,
    cilArrowLeft,
    cilSave,
    cilUserFollow,
    cilGroup
} from '@coreui/icons';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { addUser } from '../../../store/slices/userGroupSlice';
import Swal from 'sweetalert2';

// External components to avoid re-creation on each render
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
        <CFormLabel htmlFor={name} className="fw-medium text-dark mb-2 small">
            {label}
            {required && <span className="text-danger ms-1">*</span>}
        </CFormLabel>
        <CInputGroup>
            {icon && (
                <CInputGroupText 
                    className="d-none d-md-flex"
                    style={{ 
                        background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                        border: '1px solid #e3e6f0',
                        borderRight: 'none'
                    }}
                >
                    <CIcon icon={icon} size="sm" style={{ color: '#6c757d' }} />
                </CInputGroupText>
            )}
            <CFormInput
                id={name}
                name={name}
                type={type}
                value={value}
                onChange={onChange}
                invalid={isInvalid}
                placeholder={placeholder}
                style={{
                    border: `1px solid ${isInvalid ? '#dc3545' : '#e3e6f0'}`,
                    borderRadius: icon ? '0 8px 8px 0' : '8px',
                    fontSize: '14px',
                    padding: '12px 16px',
                    transition: 'all 0.3s ease',
                    borderLeft: (icon && window.innerWidth >= 768) ? 'none' : '1px solid #e3e6f0'
                }}
                {...props}
            />
        </CInputGroup>
        {feedback && <CFormFeedback invalid>{feedback}</CFormFeedback>}
    </div>
);

const initialForm = {
    name: '',
};

const AddUserGroupForm = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [formData, setFormData] = useState(initialForm);
    const initialFormRef = useRef(initialForm);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const validate = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Group name is required';
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
                                    <CIcon icon={cilUserFollow} size="sm" className="text-white" />
                                </div>
                                <div>
                                    <h5 className="text-white mb-1 fw-bold">Add New User Group</h5>
                                    <p className="text-white-50 mb-0 small d-none d-md-block">Create a new user group to organize permissions and access</p>
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

            <CForm onSubmit={handleSubmit}>
                {/* Group Information Section */}
                <FormSection title="Group Information" icon={cilGroup}>
                    {/* Info Card */}
                    <div className="mb-4">
                        <div className="d-flex align-items-start p-3 rounded-3" 
                             style={{ backgroundColor: '#fff3cd', border: '1px solid #ffecb5' }}>
                            <div 
                                className="rounded-circle d-flex align-items-center justify-content-center me-3 flex-shrink-0"
                                style={{
                                    width: '32px',
                                    height: '32px',
                                    backgroundColor: '#856404',
                                    color: 'white'
                                }}
                            >
                                <CIcon icon={cilSettings} size="sm" />
                            </div>
                            <div>
                                <div className="fw-semibold text-dark small mb-1">About User Groups</div>
                                <div className="text-muted" style={{ fontSize: '12px', lineHeight: '1.4' }}>
                                    User groups help you organize users with similar roles and permissions. 
                                    Once created, you can assign specific permissions and access levels to the entire group.
                                </div>
                            </div>
                        </div>
                    </div>

                    <CRow>
                        <CCol xs={12} md={8} lg={6}>
                            <CustomFormInput
                                label="Group Name"
                                name="name"
                                required
                                icon={cilGroup}
                                placeholder="Enter group name (e.g., Administrators, Sales Team, etc.)"
                                value={formData.name}
                                onChange={handleChange}
                                isInvalid={!!errors.name}
                                feedback={errors.name}
                            />
                        </CCol>
                    </CRow>

                    {/* Features Preview */}
                    <div className="mt-4">
                        <div className="d-flex align-items-center mb-3">
                            <div 
                                className="rounded-circle d-flex align-items-center justify-content-center me-2"
                                style={{
                                    width: '24px',
                                    height: '24px',
                                    backgroundColor: '#e6ffed',
                                    color: '#28a745'
                                }}
                            >
                                <CIcon icon={cilSettings} size="sm" />
                            </div>
                            <h6 className="mb-0 fw-semibold text-dark" style={{ fontSize: '13px' }}>What you can do after creating this group:</h6>
                        </div>
                        
                        <div className="row g-2">
                            <div className="col-md-6">
                                <div className="d-flex align-items-center p-2 rounded-2" style={{ backgroundColor: '#f8f9fa' }}>
                                    <div className="me-2" style={{ color: '#28a745', fontSize: '12px' }}>✓</div>
                                    <span style={{ fontSize: '12px', color: '#6c757d' }}>Assign users to this group</span>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="d-flex align-items-center p-2 rounded-2" style={{ backgroundColor: '#f8f9fa' }}>
                                    <div className="me-2" style={{ color: '#28a745', fontSize: '12px' }}>✓</div>
                                    <span style={{ fontSize: '12px', color: '#6c757d' }}>Set group permissions</span>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="d-flex align-items-center p-2 rounded-2" style={{ backgroundColor: '#f8f9fa' }}>
                                    <div className="me-2" style={{ color: '#28a745', fontSize: '12px' }}>✓</div>
                                    <span style={{ fontSize: '12px', color: '#6c757d' }}>Manage access levels</span>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="d-flex align-items-center p-2 rounded-2" style={{ backgroundColor: '#f8f9fa' }}>
                                    <div className="me-2" style={{ color: '#28a745', fontSize: '12px' }}>✓</div>
                                    <span style={{ fontSize: '12px', color: '#6c757d' }}>Bulk user management</span>
                                </div>
                            </div>
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
                                color="primary"
                                size="md"
                                disabled={loading}
                                className="px-4 px-md-5 fw-semibold order-1 order-md-2"
                                style={{
                                    borderRadius: '25px',
                                    border: 'none',
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <CIcon icon={cilSave} className="me-2" />
                                        Create Group
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

export default AddUserGroupForm;