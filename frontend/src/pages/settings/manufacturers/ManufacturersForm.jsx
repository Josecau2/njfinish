import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { addManufacturer } from '../../../store/slices/manufacturersSlice';
import {
  CForm,
  CFormInput,
  CFormLabel,
  CFormTextarea,
  CFormCheck,
  CButton,
  CCard,
  CCardBody,
  CAlert,
  CRow,
  CCol,
  CContainer,
  CFormText,
  CInputGroup,
  CInputGroupText,
  CFormFeedback,
  CSpinner
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import {
  cilBuilding,
  cilEnvelopeClosed,
  cilPhone,
  cilLocationPin,
  cilImage,
  cilCalculator,
  cilDescription,
  cilCloudUpload,
  cilArrowLeft,
  cilSave,
  cilUser,
  cilDollar,
  cilInfo
} from '@coreui/icons';

// Move component definitions outside to prevent re-creation on every render
const FormSection = ({ title, icon, children, className = "" }) => (
  <CCard className={`border-0 shadow-sm mb-4 ${className}`}>
    <CCardBody className="p-4">
      <div className="d-flex align-items-center mb-4">
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

const CustomFormTextarea = ({ 
  label, 
  name, 
  required = false, 
  icon = null,
  placeholder = "",
  rows = 4,
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
      <CFormTextarea
        id={name}
        name={name}
        rows={rows}
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

const FileUploadCard = ({ title, icon, accept, multiple = false, onChange, selectedFiles, helpText }) => (
  <div className="mb-3">
    <CFormLabel className="fw-medium text-dark mb-2">{title}</CFormLabel>
    <div className="border-2 border-dashed rounded-3 p-4 text-center position-relative bg-light">
      <CIcon icon={icon} size="xl" className="text-muted mb-2" />
      <p className="text-muted mb-2">Click to browse or drag and drop files here</p>
      <CFormInput
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={onChange}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          opacity: 0,
          cursor: 'pointer'
        }}
      />
      {helpText && <CFormText className="text-muted d-block">{helpText}</CFormText>}
      {selectedFiles && (
        <div className="mt-3">
          {Array.isArray(selectedFiles) ? (
            selectedFiles.length === 0 ? (
              <span className="text-danger small">No files selected</span>
            ) : (
              <div className="text-success small">
                <CIcon icon={cilCloudUpload} className="me-1" />
                {selectedFiles.length} file(s) selected
              </div>
            )
          ) : (
            <div className="text-success small">
              <CIcon icon={cilImage} className="me-1" />
              Image selected: {selectedFiles.name}
            </div>
          )}
        </div>
      )}
    </div>
  </div>
);

const ManufacturerForm = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    isPriceMSRP: true,
    costMultiplier: '',
    instructions: '',
  });

  const [files, setFiles] = useState([]);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);
  const [logoImage, setLogoImage] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e) => {
    setFiles([...e.target.files]);
  };

  const handleLogoChange = (e) => {
    setLogoImage(e.target.files[0]);
  };

  const handlePriceTypeChange = (isPriceMSRP) => {
    setFormData((prevState) => ({
      ...prevState,
      isPriceMSRP,
    }));
  };

  const validateForm = () => {
    const errors = {};
    const required = ['name', 'email', 'phone', 'website', 'address', 'costMultiplier'];
    
    required.forEach((field) => {
      if (!formData[field]?.toString().trim()) {
        errors[field] = 'This field is required';
      }
    });

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }

    if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
      errors.website = 'Please enter a valid URL starting with http:// or https://';
    }

    if (formData.costMultiplier && (parseFloat(formData.costMultiplier) <= 0)) {
      errors.costMultiplier = 'Cost multiplier must be greater than 0';
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('Form submitted');
    console.log('Form data:', formData);
    
    const errors = validateForm();
    setValidationErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      console.log('Validation errors:', errors);
      setMessage({
        text: 'Please fix the validation errors before submitting.',
        type: 'danger',
      });
      return;
    }

    console.log('Validation passed, proceeding with submission');
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      // Create FormData for file upload
      const formDataToSend = new FormData();
      
      // Append form fields
      formDataToSend.append('name', formData.name);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('address', formData.address);
      formDataToSend.append('website', formData.website);
      formDataToSend.append('isPriceMSRP', formData.isPriceMSRP);
      formDataToSend.append('costMultiplier', formData.costMultiplier);
      formDataToSend.append('instructions', formData.instructions);
      
      // Append logo image if selected
      if (logoImage) {
        formDataToSend.append('manufacturerImage', logoImage);
        console.log('Logo image added:', logoImage.name);
      }
      
      // Append catalog files if selected
      files.forEach((file) => {
        formDataToSend.append('catalogFiles', file);
        console.log('Catalog file added:', file.name);
      });

      console.log('Dispatching addManufacturer action');
      // Dispatch Redux action
      const result = await dispatch(addManufacturer(formDataToSend)).unwrap();

      console.log('Manufacturer creation successful:', result);
      setMessage({
        text: 'Manufacturer created successfully!',
        type: 'success',
      });
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        website: '',
        isPriceMSRP: true,
        costMultiplier: '',
        instructions: '',
      });
      setFiles([]);
      setLogoImage(null);
      setValidationErrors({});
      
      // Redirect to manufacturers list after 2 seconds
      setTimeout(() => {
        navigate('/settings/manufacturers');
      }, 2000);
    } catch (error) {
      console.error('Error creating manufacturer:', error);
      setMessage({
        text: error.message || 'Failed to create manufacturer',
        type: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateMultiplierExample = () => {
    if (!formData.costMultiplier) return null;

    const msrp = 200.0;
    const cost = 100.0;
    const multiplier = parseFloat(formData.costMultiplier);

    return (
      <CFormText className="text-info mt-2">
        <CIcon icon={cilInfo} className="me-1" size="sm" />
        Example: If cabinet's MSRP is ${msrp.toFixed(2)} and you pay ${cost.toFixed(2)} to manufacturer,
        your multiplier would be {multiplier.toFixed(1)}
      </CFormText>
    );
  };

  return (
    <CContainer fluid className="p-2 m-2 manufacturer-form" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <style>
        {`
          @media (max-width: 768px) {
            .manufacturer-form .p-4 {
              padding: 1.5rem !important;
            }
            
            .manufacturer-form .mb-4 {
              margin-bottom: 1.5rem !important;
            }
          }
          
          @media (max-width: 576px) {
            .manufacturer-form .p-4 {
              padding: 1rem !important;
            }
            
            .manufacturer-form h3 {
              font-size: 1.5rem !important;
            }
            
            .manufacturer-form .btn {
              width: 100%;
              margin-bottom: 0.5rem;
            }
            
            .manufacturer-form .btn:last-child {
              margin-bottom: 0;
            }
          }
        `}
      </style>

      {/* Header Section */}
      <CCard className="border-0 shadow-sm mb-4" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <CCardBody className="py-4">
          <CRow className="align-items-center">
            <CCol>
              <div className="d-flex align-items-center">
                <div 
                  className="rounded-circle d-flex align-items-center justify-content-center me-3"
                  style={{
                    width: '60px',
                    height: '60px',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <CIcon icon={cilBuilding} size="xl" className="text-white" />
                </div>
                <div>
                  <h3 className="text-white mb-1 fw-bold">Add New Manufacturer</h3>
                  <p className="text-white-50 mb-0">Create a comprehensive manufacturer profile</p>
                </div>
              </div>
            </CCol>
            <CCol xs="auto" className="d-none d-md-block">
              <CButton
                color="light"
                className="shadow-sm px-4 fw-semibold"
                onClick={() => window.history.back()}
                style={{
                  borderRadius: '5px',
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

      {/* Alert Messages */}
      {message.text && (
        <CAlert 
          color={message.type} 
          dismissible 
          onClose={() => setMessage({ text: '', type: '' })}
          className="border-0 shadow-sm mb-4"
          style={{ borderRadius: '12px' }}
        >
          {message.text}
        </CAlert>
      )}

      <CForm onSubmit={handleSubmit}>
        {/* Information Notice */}
        <CCard className="border-0 shadow-sm mb-4" style={{ borderLeft: '4px solid #0d6efd' }}>
          <CCardBody className="py-3 px-4" style={{ backgroundColor: '#f0f7ff' }}>
            <div className="d-flex align-items-start">
              <CIcon icon={cilInfo} className="text-primary me-2 mt-1" />
              <p className="mb-0 text-primary">
                <strong>Important:</strong> Please enter information for the new manufacturer. We need your help to add the catalog into our system as manufacturers do not share the pricing spec sheets with us.
              </p>
            </div>
          </CCardBody>
        </CCard>

        {/* Basic Information */}
        <FormSection title="Basic Information" icon={cilBuilding}>
          <CRow>
            <CCol md={6}>
              <CustomFormInput
                label="Manufacturer Name"
                name="name"
                required
                icon={cilBuilding}
                placeholder="Enter manufacturer name"
                value={formData.name}
                onChange={handleChange}
                isInvalid={!!validationErrors.name}
                feedback={validationErrors.name}
              />
            </CCol>
            <CCol md={6}>
              <CustomFormInput
                label="Order Email"
                name="email"
                type="email"
                required
                icon={cilEnvelopeClosed}
                placeholder="orders@manufacturer.com"
                value={formData.email}
                onChange={handleChange}
                isInvalid={!!validationErrors.email}
                feedback={validationErrors.email}
              />
            </CCol>
          </CRow>

          <CRow>
            <CCol md={6}>
              <CustomFormInput
                label="Phone"
                name="phone"
                type="tel"
                required
                icon={cilPhone}
                placeholder="+1 (555) 123-4567"
                value={formData.phone}
                onChange={handleChange}
                isInvalid={!!validationErrors.phone}
                feedback={validationErrors.phone}
              />
            </CCol>
            <CCol md={6}>
              <CustomFormInput
                label="Website"
                name="website"
                type="url"
                required
                icon={cilLocationPin}
                placeholder="https://www.manufacturer.com"
                value={formData.website}
                onChange={handleChange}
                isInvalid={!!validationErrors.website}
                feedback={validationErrors.website}
              />
            </CCol>
          </CRow>

          <CustomFormInput
            label="Address"
            name="address"
            required
            icon={cilLocationPin}
            placeholder="Enter complete address"
            value={formData.address}
            onChange={handleChange}
            isInvalid={!!validationErrors.address}
            feedback={validationErrors.address}
          />
        </FormSection>

        {/* Logo Upload */}
        <FormSection title="Manufacturer Logo" icon={cilImage}>
          <FileUploadCard
            title="Upload Logo"
            icon={cilImage}
            accept="image/*"
            onChange={handleLogoChange}
            selectedFiles={logoImage}
            helpText="Upload a logo or image representing the manufacturer (JPG, PNG, GIF)"
          />
        </FormSection>

        {/* Pricing Information */}
        <FormSection title="Pricing Information" icon={cilDollar}>
          <div className="mb-4">
            <CFormLabel className="fw-medium text-dark mb-3">Price Information Type</CFormLabel>
            <div className="d-flex flex-column gap-2">
              <div 
                className={`border rounded-3 p-3 cursor-pointer transition-all ${formData.isPriceMSRP ? 'border-primary bg-light' : 'border-light'}`}
                style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
                onClick={() => handlePriceTypeChange(true)}
              >
                <CFormCheck
                  type="radio"
                  id="msrpPrices"
                  checked={formData.isPriceMSRP}
                  onChange={() => handlePriceTypeChange(true)}
                  className="mb-0"
                />
                <label htmlFor="msrpPrices" className="ms-2 fw-medium" style={{ cursor: 'pointer' }}>
                  Prices in the attached files are MSRP
                </label>
              </div>
              <div 
                className={`border rounded-3 p-3 cursor-pointer transition-all ${!formData.isPriceMSRP ? 'border-primary bg-light' : 'border-light'}`}
                style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
                onClick={() => handlePriceTypeChange(false)}
              >
                <CFormCheck
                  type="radio"
                  id="costPrices"
                  checked={!formData.isPriceMSRP}
                  onChange={() => handlePriceTypeChange(false)}
                  className="mb-0"
                />
                <label htmlFor="costPrices" className="ms-2 fw-medium" style={{ cursor: 'pointer' }}>
                  Prices in the attached files are my cost when ordering from manufacturer
                </label>
              </div>
            </div>
          </div>

          <CRow>
            <CCol md={6}>
              <CustomFormInput
                label="Cost Multiplier"
                name="costMultiplier"
                type="number"
                step="0.1"
                required
                icon={cilCalculator}
                placeholder="2.0"
                value={formData.costMultiplier}
                onChange={handleChange}
                isInvalid={!!validationErrors.costMultiplier}
                feedback={validationErrors.costMultiplier}
              />
              {calculateMultiplierExample()}
            </CCol>
          </CRow>
        </FormSection>

        {/* Instructions */}
        <FormSection title="Special Instructions" icon={cilDescription}>
          <CustomFormTextarea
            label="Instructions"
            name="instructions"
            icon={cilDescription}
            placeholder="Enter any special instructions or notes for this manufacturer..."
            rows={4}
            value={formData.instructions}
            onChange={handleChange}
            isInvalid={!!validationErrors.instructions}
            feedback={validationErrors.instructions}
          />
        </FormSection>

        {/* Catalog Files */}
        <FormSection title="Catalog Files" icon={cilCloudUpload}>
          <FileUploadCard
            title="Choose Catalog Files"
            icon={cilCloudUpload}
            accept=".pdf,.xlsx,.xls,.csv"
            multiple={true}
            onChange={handleFileChange}
            selectedFiles={files}
            helpText="Supported file types: PDF, Excel files (.xlsx, .xls) and CSV files"
          />
        </FormSection>

        {/* Action Buttons */}
        <CCard className="border-0 shadow-sm">
          <CCardBody className="p-4">
            <div className="d-flex gap-3 justify-content-end flex-wrap">
              <CButton
                color="light"
                size="lg"
                onClick={() => window.history.back()}
                className="px-4 fw-semibold d-md-inline-block"
                style={{
                  borderRadius: '12px',
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
                size="lg"
                disabled={loading}
                className="px-5 fw-semibold"
                style={{
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  transition: 'all 0.3s ease'
                }}
              >
                {loading ? (
                  <>
                    <CSpinner size="sm" className="me-2" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CIcon icon={cilSave} className="me-2" />
                    Create Manufacturer
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

export default ManufacturerForm;