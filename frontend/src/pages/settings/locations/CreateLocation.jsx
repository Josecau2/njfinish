import { useEffect, useState, useRef } from 'react';
import {
  CForm,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CContainer,
  CRow,
  CCol,
  CFormFeedback,
  CInputGroup,
  CInputGroupText,
} from '@coreui/react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import ct from 'countries-and-timezones';
import moment from 'moment-timezone';
import { addLocation } from '../../../store/slices/locationSlice';
import { useDispatch } from 'react-redux';
import CIcon from '@coreui/icons-react';
import { 
  cilLocationPin, 
  cilEnvelopeClosed, 
  cilPhone,
  cilHome,
  cilClock,
  cilArrowLeft,
  cilCheckCircle
} from '@coreui/icons';

const initialForm = {
  locationName: '',
  address: '',
  website: '',
  email: '',
  phone: '',
  country: '',
  timezone: '',
};

const LocationForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialForm);
  const initialFormRef = useRef(initialForm);
  const [errors, setErrors] = useState({});
  const [currentTime, setCurrentTime] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const countries = Object.values(ct.getAllCountries());
  const timezonesForCountry = formData.country
    ? ct.getCountry(formData.country)?.timezones || []
    : [];

  useEffect(() => {
    if (formData.timezone) {
      const interval = setInterval(() => {
        setCurrentTime(moment().tz(formData.timezone).format('YYYY-MM-DD HH:mm:ss'));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [formData.timezone]);

  const validate = () => {
    const newErrors = {};
    if (!formData.locationName.trim()) newErrors.locationName = 'Location name is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.website.trim()) newErrors.website = 'Website is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email';
    }
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.country) newErrors.country = 'Country is required';
    if (!formData.timezone) newErrors.timezone = 'Timezone is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'country') {
      const selectedTimezones = ct.getCountry(value)?.timezones || [];
      const firstTimezone = selectedTimezones[0] || '';
      setFormData((prev) => ({
        ...prev,
        country: value,
        timezone: firstTimezone,
      }));
      setCurrentTime(firstTimezone ? moment().tz(firstTimezone).format('YYYY-MM-DD HH:mm:ss') : '');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const response = await dispatch(addLocation(formData));
      if (response.payload.status == 200) {
        Swal.fire({
          title: 'Success!',
          text: 'Location saved successfully!',
          icon: 'success',
          confirmButtonColor: '#28a745',
          showClass: {
            popup: 'animate__animated animate__fadeInDown'
          },
          hideClass: {
            popup: 'animate__animated animate__fadeOutUp'
          }
        });
        navigate('/settings/locations');
      }
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: error.message || 'Something went wrong',
        icon: 'error',
        confirmButtonColor: '#dc3545'
      });
    } finally {
      setLoading(false);
    }
  };

  const isFormDirty = () => {
    return JSON.stringify(formData) !== JSON.stringify(initialFormRef.current);
  };

  const handleCancel = () => {
    if (isFormDirty()) {
      Swal.fire({
        title: 'Unsaved Changes',
        text: 'Changes you made will be lost if you leave now.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Leave Anyway',
        cancelButtonText: 'Stay on Page',
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        showClass: {
          popup: 'animate__animated animate__fadeInDown'
        },
        hideClass: {
          popup: 'animate__animated animate__fadeOutUp'
        }
      }).then((result) => {
        if (result.isConfirmed) {
          navigate('/settings/locations');
        }
      });
    } else {
      navigate('/settings/locations');
    }
  };

  return (
    <CContainer fluid className="p-2 m-2" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header Section */}
      <CCard className="border-0 shadow-sm mb-4" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <CCardBody className="py-4">
          <CRow className="align-items-center">
            <CCol>
              <div className="d-flex align-items-center gap-3">
                <CButton
                  color="light"
                  variant="ghost"
                  className="p-2"
                  onClick={() => navigate('/settings/locations')}
                  style={{
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    color: 'white'
                  }}
                >
                  <CIcon icon={cilArrowLeft} />
                </CButton>
                <div>
                  <h3 className="text-white mb-1 fw-bold">Add New Location</h3>
                  <p className="text-white-50 mb-0">Create a new business location with timezone settings</p>
                </div>
              </div>
            </CCol>
            <CCol xs="auto">
              <div className="d-flex align-items-center gap-2 text-white-50">
                <CIcon icon={cilLocationPin} />
                <span className="small">Location Management</span>
              </div>
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      {/* Form Section */}
      <CCard className="border-0 shadow-sm">
        <CCardBody className="p-4">
          <CForm onSubmit={handleSubmit}>
            {/* Basic Information Section */}
            <div className="mb-4">
              <h5 className="mb-3 text-dark fw-semibold d-flex align-items-center gap-2">
                <div 
                  className="d-flex align-items-center justify-content-center"
                  style={{
                    width: '32px',
                    height: '32px',
                    backgroundColor: '#e7f3ff',
                    borderRadius: '8px',
                    color: '#0d6efd'
                  }}
                >
                  <CIcon icon={cilHome} size="sm" />
                </div>
                Basic Information
              </h5>
              
              <CRow className="mb-3">
                <CCol md={6}>
                  <CFormLabel className="fw-semibold text-dark">
                    Location Name
                    <span style={{ color: '#dc3545', marginLeft: '4px' }}>*</span>
                  </CFormLabel>
                  <CInputGroup>
                    <CInputGroupText style={{ backgroundColor: '#f8f9fa', border: '1px solid #e3e6f0' }}>
                      <CIcon icon={cilLocationPin} className="text-primary" />
                    </CInputGroupText>
                    <CFormInput
                      name="locationName"
                      value={formData.locationName}
                      onChange={handleChange}
                      invalid={!!errors.locationName}
                      placeholder="Enter location name"
                      style={{
                        border: '1px solid #e3e6f0',
                        borderLeft: 'none',
                        fontSize: '14px',
                        padding: '12px 16px'
                      }}
                    />
                  </CInputGroup>
                  {errors.locationName && (
                    <CFormFeedback invalid style={{ display: 'block' }}>
                      {errors.locationName}
                    </CFormFeedback>
                  )}
                </CCol>
                <CCol md={6}>
                  <CFormLabel className="fw-semibold text-dark">
                    Address
                    <span style={{ color: '#dc3545', marginLeft: '4px' }}>*</span>
                  </CFormLabel>
                  <CInputGroup>
                    <CInputGroupText style={{ backgroundColor: '#f8f9fa', border: '1px solid #e3e6f0' }}>
                      <CIcon icon={cilHome} className="text-success" />
                    </CInputGroupText>
                    <CFormInput
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      invalid={!!errors.address}
                      placeholder="Enter full address"
                      style={{
                        border: '1px solid #e3e6f0',
                        borderLeft: 'none',
                        fontSize: '14px',
                        padding: '12px 16px'
                      }}
                    />
                  </CInputGroup>
                  {errors.address && (
                    <CFormFeedback invalid style={{ display: 'block' }}>
                      {errors.address}
                    </CFormFeedback>
                  )}
                </CCol>
              </CRow>
            </div>

            {/* Contact Information Section */}
            <div className="mb-4">
              <h5 className="mb-3 text-dark fw-semibold d-flex align-items-center gap-2">
                <div 
                  className="d-flex align-items-center justify-content-center"
                  style={{
                    width: '32px',
                    height: '32px',
                    backgroundColor: '#e6f7e6',
                    borderRadius: '8px',
                    color: '#28a745'
                  }}
                >
                  <CIcon icon={cilEnvelopeClosed} size="sm" />
                </div>
                Contact Information
              </h5>
              
              <CRow className="mb-3">
                <CCol md={6}>
                  <CFormLabel className="fw-semibold text-dark">
                    Website
                    <span style={{ color: '#dc3545', marginLeft: '4px' }}>*</span>
                  </CFormLabel>
                  <CInputGroup>
                    <CInputGroupText style={{ backgroundColor: '#f8f9fa', border: '1px solid #e3e6f0' }}>
                      <CIcon icon={cilEnvelopeClosed} className="text-info" />
                    </CInputGroupText>
                    <CFormInput
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      invalid={!!errors.website}
                      placeholder="https://www.example.com"
                      style={{
                        border: '1px solid #e3e6f0',
                        borderLeft: 'none',
                        fontSize: '14px',
                        padding: '12px 16px'
                      }}
                    />
                  </CInputGroup>
                  {errors.website && (
                    <CFormFeedback invalid style={{ display: 'block' }}>
                      {errors.website}
                    </CFormFeedback>
                  )}
                </CCol>
                <CCol md={6}>
                  <CFormLabel className="fw-semibold text-dark">
                    Email
                    <span style={{ color: '#dc3545', marginLeft: '4px' }}>*</span>
                  </CFormLabel>
                  <CInputGroup>
                    <CInputGroupText style={{ backgroundColor: '#f8f9fa', border: '1px solid #e3e6f0' }}>
                      <CIcon icon={cilEnvelopeClosed} className="text-warning" />
                    </CInputGroupText>
                    <CFormInput
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      invalid={!!errors.email}
                      placeholder="contact@example.com"
                      style={{
                        border: '1px solid #e3e6f0',
                        borderLeft: 'none',
                        fontSize: '14px',
                        padding: '12px 16px'
                      }}
                    />
                  </CInputGroup>
                  {errors.email && (
                    <CFormFeedback invalid style={{ display: 'block' }}>
                      {errors.email}
                    </CFormFeedback>
                  )}
                </CCol>
              </CRow>
              
              <CRow className="mb-3">
                <CCol md={6}>
                  <CFormLabel className="fw-semibold text-dark">
                    Phone
                    <span style={{ color: '#dc3545', marginLeft: '4px' }}>*</span>
                  </CFormLabel>
                  <CInputGroup>
                    <CInputGroupText style={{ backgroundColor: '#f8f9fa', border: '1px solid #e3e6f0' }}>
                      <CIcon icon={cilPhone} className="text-success" />
                    </CInputGroupText>
                    <CFormInput
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      invalid={!!errors.phone}
                      placeholder="+1 (555) 123-4567"
                      style={{
                        border: '1px solid #e3e6f0',
                        borderLeft: 'none',
                        fontSize: '14px',
                        padding: '12px 16px'
                      }}
                    />
                  </CInputGroup>
                  {errors.phone && (
                    <CFormFeedback invalid style={{ display: 'block' }}>
                      {errors.phone}
                    </CFormFeedback>
                  )}
                </CCol>
              </CRow>
            </div>

            {/* Location & Time Settings Section */}
            <div className="mb-4">
              <h5 className="mb-3 text-dark fw-semibold d-flex align-items-center gap-2">
                <div 
                  className="d-flex align-items-center justify-content-center"
                  style={{
                    width: '32px',
                    height: '32px',
                    backgroundColor: '#fff3cd',
                    borderRadius: '8px',
                    color: '#856404'
                  }}
                >
                  <CIcon icon={cilClock} size="sm" />
                </div>
                Location & Time Settings
              </h5>
              
              <CRow className="mb-3">
                <CCol md={6}>
                  <CFormLabel className="fw-semibold text-dark">
                    Country
                    <span style={{ color: '#dc3545', marginLeft: '4px' }}>*</span>
                  </CFormLabel>
                  <CFormSelect
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    invalid={!!errors.country}
                    style={{
                      border: '1px solid #e3e6f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      padding: '12px 16px'
                    }}
                  >
                    <option value="">-- Select Country --</option>
                    {countries.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </CFormSelect>
                  {errors.country && (
                    <CFormFeedback invalid style={{ display: 'block' }}>
                      {errors.country}
                    </CFormFeedback>
                  )}
                </CCol>
                <CCol md={6}>
                  <CFormLabel className="fw-semibold text-dark">
                    Timezone
                    <span style={{ color: '#dc3545', marginLeft: '4px' }}>*</span>
                  </CFormLabel>
                  <CFormSelect
                    name="timezone"
                    value={formData.timezone}
                    onChange={handleChange}
                    invalid={!!errors.timezone}
                    disabled={!formData.country}
                    style={{
                      border: '1px solid #e3e6f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      padding: '12px 16px',
                      backgroundColor: !formData.country ? '#f8f9fa' : 'white'
                    }}
                  >
                    <option value="">-- Select Timezone --</option>
                    {timezonesForCountry.map((tz) => (
                      <option key={tz} value={tz}>{tz}</option>
                    ))}
                  </CFormSelect>
                  {errors.timezone && (
                    <CFormFeedback invalid style={{ display: 'block' }}>
                      {errors.timezone}
                    </CFormFeedback>
                  )}
                </CCol>
              </CRow>
              
              {currentTime && (
                <CRow className="mb-3">
                  <CCol md={6}>
                    <CFormLabel className="fw-semibold text-dark">Current Time</CFormLabel>
                    <CInputGroup>
                      <CInputGroupText style={{ backgroundColor: '#e7f3ff', border: '1px solid #b6d7ff' }}>
                        <CIcon icon={cilClock} className="text-primary" />
                      </CInputGroupText>
                      <CFormInput
                        value={currentTime}
                        readOnly
                        tabIndex={-1}
                        style={{
                          backgroundColor: '#f8f9fa',
                          border: '1px solid #e3e6f0',
                          borderLeft: 'none',
                          cursor: 'not-allowed',
                          fontSize: '14px',
                          fontWeight: '500',
                          color: '#495057'
                        }}
                      />
                    </CInputGroup>
                    <small className="text-muted">Live time in selected timezone</small>
                  </CCol>
                </CRow>
              )}
            </div>

            {/* Divider */}
            <hr className="my-4" style={{ border: '1px solid #e3e6f0' }} />

            {/* Action Buttons */}
            <div className="d-flex gap-3 justify-content-end">
              <CButton
                type="button"
                color="light"
                onClick={handleCancel}
                className="px-4 py-2 fw-semibold"
                style={{
                  border: '1px solid #e3e6f0',
                  borderRadius: '8px',
                  color: '#6c757d'
                }}
              >
                <CIcon icon={cilArrowLeft} className="me-2" />
                Cancel
              </CButton>
              <CButton
                type="submit"
                color="success"
                disabled={loading}
                className="px-4 py-2 fw-semibold"
                style={{
                  border: 'none',
                  borderRadius: '8px',
                  background: loading ? '#6c757d' : 'linear-gradient(45deg, #28a745, #20c997)',
                  boxShadow: '0 2px 4px rgba(40, 167, 69, 0.2)'
                }}
              >
                {loading ? (
                  <>
                    <div className="spinner-border spinner-border-sm me-2" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    Saving...
                  </>
                ) : (
                  <>
                    <CIcon icon={cilCheckCircle} className="me-2" />
                    Save Location
                  </>
                )}
              </CButton>
            </div>
          </CForm>
        </CCardBody>
      </CCard>
    </CContainer>
  );
};

export default LocationForm;