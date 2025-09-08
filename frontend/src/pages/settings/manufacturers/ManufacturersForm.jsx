import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addManufacturer } from '../../../store/slices/manufacturersSlice';
import { getContrastColor } from '../../../utils/colorUtils';
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
import { useTranslation } from 'react-i18next';
import PageHeader from '../../../components/PageHeader';

// Move component definitions outside to prevent re-creation on every render
const FormSection = ({ title, icon, children, className = "", customization }) => {
  const headerBg = customization?.headerBg || '#667eea';
  const textColor = getContrastColor(headerBg);

  return (
    <CCard className={`border-0 shadow-sm mb-4 ${className}`}>
      <CCardBody className="p-4">
        <div className="d-flex align-items-center mb-4">
          <div
            className="rounded-circle d-flex align-items-center justify-content-center me-3"
            style={{
              width: '40px',
              height: '40px',
              backgroundColor: headerBg,
              color: textColor
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
};const CustomFormInput = ({
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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const customization = useSelector((state) => state.customization);

  const headerBg = customization.headerBg || '#667eea';
  const textColor = getContrastColor(headerBg);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    isPriceMSRP: true,
    costMultiplier: '',
    instructions: '',
    assembledEtaDays: '',
    unassembledEtaDays: '',
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
        errors[field] = t('settings.users.form.validation.required');
      }
    });

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = t('customers.form.validation.invalidEmail');
    }

    if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
      errors.website = 'Please enter a valid URL starting with http:// or https://';
    }

    if (formData.costMultiplier && (parseFloat(formData.costMultiplier) <= 0)) {
      errors.costMultiplier = t('settings.manufacturers.edit.costMultiplier') + ' ' + t('customers.form.validation.required');
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      setMessage({
  text: t('settings.manufacturers.create.messages.validationFix'),
        type: 'danger',
      });
      return;
    }

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
      formDataToSend.append('assembledEtaDays', formData.assembledEtaDays || '');
      formDataToSend.append('unassembledEtaDays', formData.unassembledEtaDays || '');

      // Append logo image if selected
      if (logoImage) {
        formDataToSend.append('manufacturerImage', logoImage);
      }

      // Append catalog files if selected
      files.forEach((file) => {
        formDataToSend.append('catalogFiles', file);
      });

      // Dispatch Redux action
      const result = await dispatch(addManufacturer(formDataToSend)).unwrap();

      setMessage({
  text: t('settings.manufacturers.create.messages.created'),
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
  text: error.message || t('settings.manufacturers.create.messages.createFailed'),
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
      <PageHeader
        title={t('settings.manufacturers.create.title')}
        subtitle={t('settings.manufacturers.create.subtitle')}
        icon={cilBuilding}
        rightContent={
          <CButton
            color="light"
            className="shadow-sm px-4 fw-semibold d-none d-md-block"
            onClick={() => window.history.back()}
            style={{
              borderRadius: '5px',
              border: 'none',
              transition: 'all 0.3s ease'
            }}
          >
            <CIcon icon={cilArrowLeft} className="me-2" />
            {t('settings.manufacturers.create.back')}
          </CButton>
        }
      />

      {/* Alert Messages */}
      {message.text && (
        <CAlert
          color={message.type}
          dismissible
          onClose={() => setMessage({ text: '', type: '' })}
          className="border-0 shadow-sm mb-4"
          style={{ borderRadius: '12px' }}
          role={message.type === 'danger' ? 'alert' : 'status'}
          aria-live={message.type === 'danger' ? 'assertive' : 'polite'}
        >
          {message.text}
        </CAlert>
      )}

      <CForm onSubmit={handleSubmit}>
        {/* Information Notice */}
        <CCard className="border-0 shadow-sm mb-4" style={{ borderLeft: `4px solid ${headerBg}` }}>
          <CCardBody className="py-3 px-4" style={{ backgroundColor: '#f0f7ff' }}>
            <div className="d-flex align-items-start">
              <CIcon icon={cilInfo} className="text-primary me-2 mt-1" />
              <p className="mb-0 text-primary">
                <strong>{t('settings.manufacturers.create.infoTitle')}</strong> {t('settings.manufacturers.create.infoText')}
              </p>
            </div>
          </CCardBody>
        </CCard>

        {/* Basic Information */}
        <FormSection title={t('settings.manufacturers.sections.basicInfo')} icon={cilBuilding} customization={customization}>
          <CRow>
            <CCol md={6}>
              <CustomFormInput
                label={t('settings.manufacturers.fields.manufacturerName')}
                name="name"
                required
                icon={cilBuilding}
                placeholder={t('settings.manufacturers.placeholders.manufacturerName')}
                value={formData.name}
                onChange={handleChange}
                isInvalid={!!validationErrors.name}
                feedback={validationErrors.name}
              />
            </CCol>
            <CCol md={6}>
              <CustomFormInput
                label={t('settings.manufacturers.fields.orderEmail')}
                name="email"
                type="email"
                required
                icon={cilEnvelopeClosed}
                placeholder={t('settings.manufacturers.placeholders.orderEmail')}
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
                label={t('settings.manufacturers.fields.phone')}
                name="phone"
                type="tel"
                required
                icon={cilPhone}
                placeholder={t('settings.manufacturers.placeholders.phone')}
                value={formData.phone}
                onChange={handleChange}
                isInvalid={!!validationErrors.phone}
                feedback={validationErrors.phone}
              />
            </CCol>
            <CCol md={6}>
              <CustomFormInput
                label={t('settings.manufacturers.fields.website')}
                name="website"
                type="url"
                required
                icon={cilLocationPin}
                placeholder={t('settings.manufacturers.placeholders.website')}
                value={formData.website}
                onChange={handleChange}
                isInvalid={!!validationErrors.website}
                feedback={validationErrors.website}
              />
            </CCol>
          </CRow>

          <CustomFormInput
            label={t('settings.manufacturers.fields.address')}
            name="address"
            required
            icon={cilLocationPin}
            placeholder={t('settings.manufacturers.placeholders.address')}
            value={formData.address}
            onChange={handleChange}
            isInvalid={!!validationErrors.address}
            feedback={validationErrors.address}
          />

          {/* ETA Information */}
          <CRow>
            <CCol md={6}>
              <CustomFormInput
                label={t('settings.manufacturers.fields.assembledEtaDays', 'Assembled Items ETA')}
                name="assembledEtaDays"
                type="text"
                icon={cilBuilding}
                placeholder="e.g., 7-14 days"
                value={formData.assembledEtaDays}
                onChange={handleChange}
              />
              <CFormText className="text-muted ms-3">
                {t('settings.manufacturers.help.assembledEta', 'Estimated delivery time for assembled cabinets')}
              </CFormText>
            </CCol>
            <CCol md={6}>
              <CustomFormInput
                label={t('settings.manufacturers.fields.unassembledEtaDays', 'Unassembled Items ETA')}
                name="unassembledEtaDays"
                type="text"
                icon={cilDescription}
                placeholder="e.g., 3-7 days"
                value={formData.unassembledEtaDays}
                onChange={handleChange}
              />
              <CFormText className="text-muted ms-3">
                {t('settings.manufacturers.help.unassembledEta', 'Estimated delivery time for unassembled cabinets')}
              </CFormText>
            </CCol>
          </CRow>
        </FormSection>

        {/* Logo Upload */}
        <FormSection title={t('settings.manufacturers.sections.logo')} icon={cilImage} customization={customization}>
          <FileUploadCard
            title={t('settings.manufacturers.fields.uploadLogo')}
            icon={cilImage}
            accept="image/*"
            onChange={handleLogoChange}
            selectedFiles={logoImage}
            helpText={t('settings.manufacturers.help.logo')}
          />
        </FormSection>

        {/* Pricing Information */}
        <FormSection title={t('settings.manufacturers.sections.pricing')} icon={cilDollar} customization={customization}>
          <div className="mb-4">
            <CFormLabel className="fw-medium text-dark mb-3">{t('settings.manufacturers.fields.priceInfoType')}</CFormLabel>
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
                  {t('settings.manufacturers.fields.msrpOption')}
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
                  {t('settings.manufacturers.fields.costOption')}
                </label>
              </div>
            </div>
          </div>

          <CRow>
            <CCol md={6}>
              <CustomFormInput
                label={t('settings.manufacturers.fields.costMultiplier')}
                name="costMultiplier"
                type="number"
                step="0.1"
                required
                icon={cilCalculator}
                placeholder={t('settings.manufacturers.placeholders.costMultiplier')}
                value={formData.costMultiplier}
                onChange={handleChange}
                isInvalid={!!validationErrors.costMultiplier}
                feedback={validationErrors.costMultiplier}
              />
              {formData.costMultiplier && (
                <CFormText className="text-info mt-2">
                  <CIcon icon={cilInfo} className="me-1" size="sm" />
                  {t('settings.manufacturers.example.multiplier', {
                    msrp: (200.0).toFixed(2),
                    cost: (100.0).toFixed(2),
                    multiplier: parseFloat(formData.costMultiplier).toFixed(1)
                  })}
                </CFormText>
              )}
            </CCol>
          </CRow>
        </FormSection>

        {/* Instructions */}
        <FormSection title={t('settings.manufacturers.sections.instructions')} icon={cilDescription} customization={customization}>
          <CustomFormTextarea
            label={t('settings.manufacturers.fields.instructions')}
            name="instructions"
            icon={cilDescription}
            placeholder={t('settings.manufacturers.placeholders.instructions')}
            rows={4}
            value={formData.instructions}
            onChange={handleChange}
            isInvalid={!!validationErrors.instructions}
            feedback={validationErrors.instructions}
          />
        </FormSection>

        {/* Catalog Files */}
        <FormSection title={t('settings.manufacturers.sections.catalog')} icon={cilCloudUpload} customization={customization}>
          <FileUploadCard
            title={t('settings.manufacturers.fields.chooseCatalogFiles')}
            icon={cilCloudUpload}
            accept=".pdf,.xlsx,.xls,.csv"
            multiple={true}
            onChange={handleFileChange}
            selectedFiles={files}
            helpText={t('settings.manufacturers.help.catalog')}
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
          transition: 'all 0.3s ease',
          minHeight: '44px'
                }}
              >
        <CIcon icon={cilArrowLeft} className="me-2" />
        {t('common.cancel')}
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
          transition: 'all 0.3s ease',
          minHeight: '44px'
                }}
              >
                {loading ? (
                  <>
                    <CSpinner size="sm" className="me-2" />
          {t('settings.manufacturers.create.submitting')}
                  </>
                ) : (
                  <>
                    <CIcon icon={cilSave} className="me-2" />
          {t('settings.manufacturers.create.submit')}
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