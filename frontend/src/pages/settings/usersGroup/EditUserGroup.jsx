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
import { useNavigate, useParams } from 'react-router-dom';
import { updateUser, fetchSingleUser } from '../../../store/slices/userGroupSlice';
import Swal from 'sweetalert2';
import axiosInstance from '../../../helpers/axiosInstance';
import { useTranslation } from 'react-i18next';
import PageHeader from '../../../components/PageHeader';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

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
                        backgroundColor: `${customization.headerBg || '#667eea'}20`,
                        color: customization.headerBg || '#667eea'
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
    group_type: 'standard',
    modules: {
        dashboard: false,
        proposals: false,
        customers: false,
        resources: false
    }
};

const EditUserGroupForm = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { id } = useParams();
    const [formData, setFormData] = useState(initialForm);
    const initialFormRef = useRef(initialForm);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const customization = useSelector((state) => state.customization);

    // Function to get optimal text color for contrast
    const getContrastColor = (backgroundColor) => {
        if (!backgroundColor) return '#ffffff';
        // Convert hex to RGB
        const hex = backgroundColor.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        // Calculate luminance
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        
        // Return dark color for light backgrounds, light color for dark backgrounds
        return luminance > 0.5 ? '#2d3748' : '#ffffff';
    };

    useEffect(() => {
        const fetchUserGroup = async () => {
            try {
                const response = await axiosInstance.get(`/api/usersgroups/${id}`, {
                    headers: getAuthHeaders()
                });
                if (response.data.user) {
                    const userData = {
                        name: response.data.user.name || '',
                        group_type: response.data.user.group_type || 'standard',
                        modules: response.data.user.modules || initialForm.modules
                    };
                    setFormData(userData);
                    initialFormRef.current = userData;
                }
            } catch (error) {
                console.error('Error fetching user group:', error);
                Swal.fire(t('common.error'), t('settings.userGroups.edit.loadFailedOne'), 'error');
                navigate('/settings/users');
            } finally {
                setLoadingData(false);
            }
        };

        if (id) {
            fetchUserGroup();
        }
    }, [id, navigate]);

    const validate = () => {
        const newErrors = {};
    if (!formData.name.trim()) newErrors.name = t('settings.userGroups.form.validation.nameRequired');
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        
        setLoading(true);
        try {
            const response = await axiosInstance.put(`/api/usersgroups/${id}`, formData);
            if (response.data.status === 200) {
                Swal.fire(t('common.success') + '!', response.data.message || t('settings.userGroups.alerts.updated'), 'success');
                navigate('/settings/users');
            }
        } catch (error) {
            Swal.fire(t('common.error'), error.message || t('settings.userGroups.alerts.genericError'), 'error');
        } finally {
            setLoading(false);
        }
    };

    const isFormDirty = () => {
        return JSON.stringify(formData) !== JSON.stringify(initialFormRef.current);
    };

    if (loadingData) {
        return (
            <CContainer fluid className="p-1 p-md-2 m-0 m-md-2" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
                <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                    <div className="text-center">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">{t('common.loading')}</span>
                        </div>
                        <p className="mt-3 text-muted">{t('settings.userGroups.edit.loadingOne')}</p>
                    </div>
                </div>
            </CContainer>
        );
    }

    return (
        <CContainer fluid className="p-1 p-md-2 m-0 m-md-2" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
            {/* Header Section */}
            <PageHeader
                title={t('settings.userGroups.edit.title')}
                subtitle={t('settings.userGroups.edit.subtitle')}
                icon={cilUserFollow}
                rightContent={
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
                        {t('common.back')}
                    </CButton>
                }
            />

            <CForm onSubmit={handleSubmit}>
                {/* Group Information Section */}
                <FormSection title={t('settings.userGroups.form.titles.groupInfo')} icon={cilGroup}>
                    <CRow>
                        <CCol xs={12} md={8} lg={6}>
                            <CustomFormInput
                                label={t('settings.userGroups.form.labels.name')}
                                name="name"
                                required
                                icon={cilGroup}
                                placeholder={t('settings.userGroups.form.placeholders.name')}
                                value={formData.name}
                                onChange={handleChange}
                                isInvalid={!!errors.name}
                                feedback={errors.name}
                            />
                        </CCol>
                        <CCol xs={12} md={4} lg={6}>
                            <div className="mb-3">
                                <CFormLabel className="fw-medium text-dark mb-2 small">
                                    {t('settings.userGroups.form.labels.type')}
                                    <span className="text-danger ms-1">*</span>
                                </CFormLabel>
                                <select
                                    name="group_type"
                                    value={formData.group_type}
                                    onChange={handleChange}
                                    className="form-select"
                                    style={{
                                        border: '1px solid #e3e6f0',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        padding: '12px 16px'
                                    }}
                                >
                                    <option value="standard">{t('settings.userGroups.types.standard')}</option>
                                    <option value="contractor">{t('settings.userGroups.types.contractor')}</option>
                                </select>
                            </div>
                        </CCol>
                    </CRow>
                </FormSection>

                {/* Module Permissions Section - Only for Contractor Groups */}
                {formData.group_type === 'contractor' && (
                    <FormSection title={t('settings.userGroups.form.titles.modulePermissions')} icon={cilSettings}>
                        <div className="mb-4">
                            <div className="d-flex align-items-start p-3 rounded-3" 
                                 style={{ backgroundColor: '#e7f3ff', border: '1px solid #b3d7ff' }}>
                                <div 
                                    className="rounded-circle d-flex align-items-center justify-content-center me-3 flex-shrink-0"
                                    style={{
                                        width: '32px',
                                        height: '32px',
                                        backgroundColor: customization.headerBg || '#667eea',
                                        color: getContrastColor(customization.headerBg || '#667eea')
                                    }}
                                >
                                    <CIcon icon={cilSettings} size="sm" />
                                </div>
                                <div>
                                    <div className="fw-semibold text-dark small mb-1">{t('settings.userGroups.moduleAccess.title')}</div>
                                    <div className="text-muted" style={{ fontSize: '12px', lineHeight: '1.4' }}>
                                        {t('settings.userGroups.moduleAccess.description')}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <CRow>
                            {Object.entries(formData.modules).map(([module, enabled]) => (
                                <CCol xs={12} sm={6} md={3} key={module} className="mb-3">
                                    <div className="form-check form-switch">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            id={`module-${module}`}
                                            name={`modules.${module}`}
                                            checked={enabled}
                                            onChange={(e) => {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    modules: {
                                                        ...prev.modules,
                                                        [module]: e.target.checked
                                                    }
                                                }));
                                            }}
                                            style={{
                                                width: '3rem',
                                                height: '1.5rem'
                                            }}
                                        />
                                        <label className="form-check-label fw-medium" htmlFor={`module-${module}`}>
                                            {module.charAt(0).toUpperCase() + module.slice(1)}
                                        </label>
                                    </div>
                                    <small className="text-muted d-block mt-1">
                                        {module === 'dashboard' && t('settings.userGroups.moduleDescriptions.dashboard')}
                                        {module === 'proposals' && t('settings.userGroups.moduleDescriptions.proposals')}
                                        {module === 'customers' && t('settings.userGroups.moduleDescriptions.customers')}
                                        {module === 'resources' && t('settings.userGroups.moduleDescriptions.resources')}
                                    </small>
                                </CCol>
                            ))}
                        </CRow>
                    </FormSection>
                )}

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
                                            title: t('common.confirm'),
                                            text: t('settings.userGroups.alerts.leaveWarning'),
                                            icon: 'warning',
                                            showCancelButton: true,
                                            confirmButtonText: t('settings.userGroups.alerts.leaveAnyway'),
                                            cancelButtonText: t('settings.userGroups.alerts.stayOnPage'),
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
                                {t('common.cancel')}
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
                                    background: customization.headerBg || '#667eea',
                                    color: getContrastColor(customization.headerBg || '#667eea'),
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                <CIcon icon={cilSave} className="me-2" />
                                {loading ? t('settings.userGroups.edit.updating') : t('settings.userGroups.edit.update')}
                            </CButton>
                        </div>
                    </CCardBody>
                </CCard>
            </CForm>
        </CContainer>
    );
};

export default EditUserGroupForm;
