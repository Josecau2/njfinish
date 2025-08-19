import { useState, useRef } from "react";
import {
  CForm,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CButton,
  CRow,
  CCol,
  CCard, 
  CCardBody, 
  CFormFeedback,
  CContainer,
  CInputGroup,
  CInputGroupText
} from "@coreui/react";
import CIcon from '@coreui/icons-react';
import { 
  cilUser, 
  cilEnvelopeClosed, 
  cilLocationPin, 
  cilPhone, 
  cilBuilding,
  cilArrowLeft,
  cilSave,
  cilUserPlus
} from '@coreui/icons';
import axios from "axios";
import Swal from "sweetalert2";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { useNavigate } from "react-router-dom";

const AddCustomerForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    address: "",
    aptOrSuite: "",
    city: "",
    state: "",
    zipCode: "",
    homePhone: "",
    mobile: "",
    leadSource: "",
    customerType: "Home Owner",
    defaultDiscount: 0,
    companyName: "",
    note: "",
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRefs = useRef({});
  const api_url = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setValidationErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleNoteChange = (data) => {
    setFormData((prev) => ({ ...prev, note: data }));
  };

  const validateForm = () => {
    const errors = {};
    const required = [
      "name",
      "email",
      "address",
      "city",
      "state",
      "zipCode",
      "mobile",
      "leadSource",
    ];
    required.forEach((f) => {
      if (!formData[f]?.toString().trim()) {
        errors[f] = "This field is required";
      }
    });
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Invalid email format";
    }
    if (formData.zipCode && !/^\d{5}$/.test(formData.zipCode)) {
      errors.zipCode = "Zip code must be 5 digits";
    }
    if (formData.mobile && !/^\d{10}$/.test(formData.mobile)) {
      errors.mobile = "Mobile number must be 10 digits";
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validateForm();
    setValidationErrors(errs);
    if (Object.keys(errs).length) {
      const first = Object.keys(errs)[0];
      inputRefs.current[first]?.focus();
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post(`${api_url}/api/customers/add`, formData);
      Swal.fire({
        icon: "success",
        title: "Customer Added!",
        text: "The customer was added successfully.",
        timer: 2000,
        showConfirmButton: false,
      });
      setFormData({
        name: "",
        email: "",
        address: "",
        aptOrSuite: "",
        city: "",
        state: "",
        zipCode: "",
        homePhone: "",
        mobile: "",
        leadSource: "",
        customerType: "Home Owner",
        defaultDiscount: 0,
        companyName: "",
        note: "",
      });
      setValidationErrors({});
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Could not add customer. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const FormSection = ({ title, icon, children, className = "" }) => (
    <CCard className={`border-0 shadow-sm mb-4 ${className}`}>
      <CCardBody className="p-4">
        <div className="d-flex align-items-center mb-3">
          <div 
            className="rounded-circle d-flex align-items-center justify-content-center me-3"
            style={{
              width: '40px',
              height: '40px',
              backgroundColor: '#e7f3ff',
              color: '#0d6efd'
            }}
          >
            <CIcon icon={icon} size="sm" />
          </div>
          <h6 className="mb-0 fw-semibold text-dark">{title}</h6>
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
    ...props 
  }) => (
    <div className="mb-3">
      <CFormLabel htmlFor={name} className="fw-medium text-dark mb-2">
        {label}
        {required && <span className="text-danger ms-1">*</span>}
      </CFormLabel>
      <CInputGroup>
        {icon && (
          <CInputGroupText 
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
          value={formData[name]}
          onChange={handleChange}
          invalid={!!validationErrors[name]}
          ref={(el) => (inputRefs.current[name] = el)}
          placeholder={placeholder}
          style={{
            border: `1px solid ${validationErrors[name] ? '#dc3545' : '#e3e6f0'}`,
            borderRadius: icon ? '0 10px 10px 0' : '10px',
            fontSize: '14px',
            padding: '12px 16px',
            transition: 'all 0.3s ease',
            borderLeft: icon ? 'none' : '1px solid #e3e6f0'
          }}
          onFocus={(e) => {
            if (!validationErrors[name]) {
              e.target.style.borderColor = '#0d6efd';
              e.target.style.boxShadow = '0 0 0 0.2rem rgba(13, 110, 253, 0.25)';
            }
          }}
          onBlur={(e) => {
            if (!validationErrors[name]) {
              e.target.style.borderColor = '#e3e6f0';
              e.target.style.boxShadow = 'none';
            }
          }}
          {...props}
        />
      </CInputGroup>
      <CFormFeedback invalid>{validationErrors[name]}</CFormFeedback>
    </div>
  );

  const CustomFormSelect = ({ 
    label, 
    name, 
    required = false, 
    icon = null,
    children,
    ...props 
  }) => (
    <div className="mb-3">
      <CFormLabel htmlFor={name} className="fw-medium text-dark mb-2">
        {label}
        {required && <span className="text-danger ms-1">*</span>}
      </CFormLabel>
      <CInputGroup>
        {icon && (
          <CInputGroupText 
            style={{ 
              background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
              border: '1px solid #e3e6f0',
              borderRight: 'none'
            }}
          >
            <CIcon icon={icon} size="sm" style={{ color: '#6c757d' }} />
          </CInputGroupText>
        )}
        <CFormSelect
          id={name}
          name={name}
          value={formData[name]}
          onChange={handleChange}
          invalid={!!validationErrors[name]}
          ref={(el) => (inputRefs.current[name] = el)}
          style={{
            border: `1px solid ${validationErrors[name] ? '#dc3545' : '#e3e6f0'}`,
            borderRadius: icon ? '0 10px 10px 0' : '10px',
            fontSize: '14px',
            padding: '12px 16px',
            transition: 'all 0.3s ease',
            borderLeft: icon ? 'none' : '1px solid #e3e6f0'
          }}
          onFocus={(e) => {
            if (!validationErrors[name]) {
              e.target.style.borderColor = '#0d6efd';
              e.target.style.boxShadow = '0 0 0 0.2rem rgba(13, 110, 253, 0.25)';
            }
          }}
          onBlur={(e) => {
            if (!validationErrors[name]) {
              e.target.style.borderColor = '#e3e6f0';
              e.target.style.boxShadow = 'none';
            }
          }}
          {...props}
        >
          {children}
        </CFormSelect>
      </CInputGroup>
      <CFormFeedback invalid>{validationErrors[name]}</CFormFeedback>
    </div>
  );

  return (
    <CContainer fluid className="p-2 m-2 add-new-customer" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header Section */}
      <CCard className="border-0 shadow-sm mb-4" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <CCardBody className="py-4">
          <CRow className="align-items-center">
            <CCol>
              <div className="d-flex align-items-center">
                <div 
                  className="rounded-circle d-flex align-items-center justify-content-center me-3"
                  style={{
                    width: '50px',
                    height: '50px',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <CIcon icon={cilUserPlus} size="lg" className="text-white" />
                </div>
                <div>
                  <h3 className="text-white mb-1 fw-bold">Add New Customer</h3>
                  <p className="text-white-50 mb-0">Create a new customer profile with detailed information</p>
                </div>
              </div>
            </CCol>
            <CCol xs="auto">
              <CButton
                color="light"
                className="shadow-sm px-4 fw-semibold"
                onClick={() => navigate("/customers")}
                style={{
                  borderRadius: '5px',
                  border: 'none',
                  transition: 'all 0.3s ease'
                }}
              >
                <CIcon icon={cilArrowLeft} className="me-2" />
                Back to Customers
              </CButton>
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      <CForm onSubmit={handleSubmit}>
        {/* Basic Information Section */}
        <FormSection title="Basic Information" icon={cilUser}>
          <CRow>
            <CCol md={6}>
              <CustomFormInput
                label="Full Name"
                name="name"
                required
                icon={cilUser}
                placeholder="Enter customer's full name"
              />
            </CCol>
            <CCol md={6}>
              <CustomFormInput
                label="Email Address"
                name="email"
                type="email"
                required
                icon={cilEnvelopeClosed}
                placeholder="customer@example.com"
              />
            </CCol>
          </CRow>
          
          <CRow>
            <CCol md={6}>
              <CustomFormSelect
                label="Customer Type"
                name="customerType"
                icon={cilUser}
              >
                <option value="Home Owner">Home Owner</option>
                <option value="Landlord">Landlord</option>
                <option value="Tenant">Tenant</option>
                <option value="Other">Other</option>
              </CustomFormSelect>
            </CCol>
            <CCol md={6}>
              <CustomFormInput
                label="Company Name"
                name="companyName"
                icon={cilBuilding}
                placeholder="Company name (if applicable)"
              />
            </CCol>
          </CRow>
        </FormSection>

        {/* Address Information Section */}
        <FormSection title="Address Information" icon={cilLocationPin}>
          <CRow>
            <CCol md={8}>
              <CustomFormInput
                label="Street Address"
                name="address"
                required
                icon={cilLocationPin}
                placeholder="Enter street address"
              />
            </CCol>
            <CCol md={4}>
              <CustomFormInput
                label="Apt/Suite #"
                name="aptOrSuite"
                placeholder="Apt, suite, unit"
              />
            </CCol>
          </CRow>

          <CRow>
            <CCol md={4}>
              <CustomFormInput
                label="City"
                name="city"
                required
                placeholder="Enter city"
              />
            </CCol>
            <CCol md={4}>
              <CustomFormSelect
                label="State"
                name="state"
                required
              >
                <option value="">Select State</option>
                <option value="AL">Alabama</option>
                <option value="AK">Alaska</option>
                <option value="AZ">Arizona</option>
                <option value="AR">Arkansas</option>
                <option value="CA">California</option>
                <option value="CO">Colorado</option>
                <option value="CT">Connecticut</option>
                <option value="DE">Delaware</option>
                <option value="FL">Florida</option>
                <option value="GA">Georgia</option>
                <option value="HI">Hawaii</option>
                <option value="ID">Idaho</option>
                <option value="IL">Illinois</option>
                <option value="IN">Indiana</option>
                <option value="IA">Iowa</option>
                <option value="KS">Kansas</option>
                <option value="KY">Kentucky</option>
                <option value="LA">Louisiana</option>
                <option value="ME">Maine</option>
                <option value="MD">Maryland</option>
                <option value="MA">Massachusetts</option>
                <option value="MI">Michigan</option>
                <option value="MN">Minnesota</option>
                <option value="MS">Mississippi</option>
                <option value="MO">Missouri</option>
                <option value="MT">Montana</option>
                <option value="NE">Nebraska</option>
                <option value="NV">Nevada</option>
                <option value="NH">New Hampshire</option>
                <option value="NJ">New Jersey</option>
                <option value="NM">New Mexico</option>
                <option value="NY">New York</option>
                <option value="NC">North Carolina</option>
                <option value="ND">North Dakota</option>
                <option value="OH">Ohio</option>
                <option value="OK">Oklahoma</option>
                <option value="OR">Oregon</option>
                <option value="PA">Pennsylvania</option>
                <option value="RI">Rhode Island</option>
                <option value="SC">South Carolina</option>
                <option value="SD">South Dakota</option>
                <option value="TN">Tennessee</option>
                <option value="TX">Texas</option>
                <option value="UT">Utah</option>
                <option value="VT">Vermont</option>
                <option value="VA">Virginia</option>
                <option value="WA">Washington</option>
                <option value="WV">West Virginia</option>
                <option value="WI">Wisconsin</option>
                <option value="WY">Wyoming</option>
              </CustomFormSelect>
            </CCol>
            <CCol md={4}>
              <CustomFormInput
                label="Zip Code"
                name="zipCode"
                required
                placeholder="12345"
              />
            </CCol>
          </CRow>
        </FormSection>

        {/* Contact Information Section */}
        <FormSection title="Contact Information" icon={cilPhone}>
          <CRow>
            <CCol md={6}>
              <CustomFormInput
                label="Mobile Phone"
                name="mobile"
                required
                icon={cilPhone}
                placeholder="1234567890"
              />
            </CCol>
            <CCol md={6}>
              <CustomFormInput
                label="Home Phone"
                name="homePhone"
                icon={cilPhone}
                placeholder="1234567890"
              />
            </CCol>
          </CRow>
        </FormSection>

        {/* Business Information Section */}
        <FormSection title="Business Information" icon={cilBuilding}>
          <CRow>
            <CCol md={6}>
              <CustomFormSelect
                label="Lead Source"
                name="leadSource"
                required
              >
                <option value="">Select Lead Source</option>
                <option value="Advertising">Advertising</option>
                <option value="Google">Google</option>
                <option value="Referral">Referral</option>
                <option value="Social Media">Social Media</option>
                <option value="Website">Website</option>
              </CustomFormSelect>
            </CCol>
            <CCol md={6}>
              <CustomFormInput
                label="Default Discount (%)"
                name="defaultDiscount"
                type="number"
                min={0}
                max={100}
                placeholder="0"
              />
            </CCol>
          </CRow>

          <div className="mb-3">
            <CFormLabel className="fw-medium text-dark mb-2">Notes</CFormLabel>
            <div style={{ 
              border: '1px solid #e3e6f0', 
              borderRadius: '10px',
              overflow: 'hidden'
            }}>
              <CKEditor
                editor={ClassicEditor}
                data={formData.note}
                onChange={(event, editor) => {
                  const data = editor.getData();
                  handleNoteChange(data);
                }}
                config={{
                  toolbar: ['bold', 'italic', 'link', 'bulletedList', 'numberedList'],
                  placeholder: 'Add any additional notes about the customer...'
                }}
              />
            </div>
          </div>
        </FormSection>

        {/* Action Buttons */}
        <CCard className="border-0 shadow-sm">
          <CCardBody className="p-4">
            <div className="d-flex gap-3 justify-content-end form-buttons">
              <CButton
                color="light"
                size="lg"
                onClick={() => navigate("/customers")}
                className="px-4 fw-semibold"
                style={{
                  borderRadius: '5px',
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
                size="lg"
                disabled={isSubmitting}
                className="px-5 fw-semibold"
                style={{
                  borderRadius: '5px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  transition: 'all 0.3s ease'
                }}
              >
                {isSubmitting ? (
                  <>
                    <div 
                      className="spinner-border spinner-border-sm me-2" 
                      role="status"
                      style={{ width: '16px', height: '16px' }}
                    >
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    Saving...
                  </>
                ) : (
                  <>
                    <CIcon icon={cilSave} className="me-2" />
                    Save Customer
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

export default AddCustomerForm;