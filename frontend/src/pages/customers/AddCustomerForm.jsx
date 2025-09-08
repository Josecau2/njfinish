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
import PageHeader from '../../components/PageHeader';
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
import axiosInstance from '../../helpers/axiosInstance';
import Swal from "sweetalert2";
import { useSelector } from 'react-redux';
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';

// External component definitions to prevent re-rendering
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
  formData,
  validationErrors,
  handleChange,
  inputRefs,
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
  formData,
  validationErrors,
  handleChange,
  inputRefs,
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

const AddCustomerForm = () => {
  const { t } = useTranslation();
  const customization = useSelector((state) => state.customization);
  const headerBg = customization?.headerBg || '#321fdb';
  const textColor = customization?.headerTextColor || '#ffffff';

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
        errors[f] = t('form.validation.required');
      }
    });
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = t('form.validation.invalidEmail');
    }
    if (formData.zipCode && !/^\d{5}$/.test(formData.zipCode)) {
      errors.zipCode = t('form.validation.zip5');
    }
    if (formData.mobile && !/^\d{10}$/.test(formData.mobile)) {
      errors.mobile = t('form.validation.mobile10');
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
      await axiosInstance.post(`/api/customers/add`, formData);
      Swal.fire({
        icon: "success",
        title: t('form.alerts.createdTitle'),
        text: t('form.alerts.createdText'),
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
  title: t('common.error'),
  text: t('form.alerts.createFailed'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CContainer fluid className="p-2 m-2 add-new-customer bg-body" style={{ minHeight: '100vh' }}>
      <style>{`
        .add-new-customer .btn { min-height: 44px; }
      `}</style>
      {/* Header Section */}
      <PageHeader
        title={
          <div className="d-flex align-items-center gap-3">
            <div
              className="d-flex align-items-center justify-content-center"
              style={{
                width: '48px',
                height: '48px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '12px'
              }}
            >
              <CIcon icon={cilUserPlus} style={{ fontSize: '24px', color: 'white' }} />
            </div>
            {t('customers.form.titles.add')}
          </div>
        }
        subtitle="Create a new customer profile with detailed information"
        rightContent={
          <CButton
            color="light"
            className="shadow-sm px-4 fw-semibold"
            onClick={() => navigate("/customers")}
            aria-label={t('form.actions.backToCustomers')}
            style={{
              borderRadius: '5px',
              border: 'none',
              transition: 'all 0.3s ease'
            }}
          >
            <CIcon icon={cilArrowLeft} className="me-2" />
            {t('form.actions.backToCustomers')}
          </CButton>
        }
      />

      <CForm onSubmit={handleSubmit}>
        {/* Basic Information Section */}
  <FormSection title={t('customers.form.titles.basicInfo')} icon={cilUser}>
          <CRow>
            <CCol md={6}>
              <CustomFormInput
    label={t('customers.form.labels.fullName')}
                name="name"
                required
                icon={cilUser}
    placeholder={t('customers.form.placeholders.fullName')}
                formData={formData}
                validationErrors={validationErrors}
                handleChange={handleChange}
                inputRefs={inputRefs}
              />
            </CCol>
            <CCol md={6}>
              <CustomFormInput
    label={t('customers.form.labels.email')}
                name="email"
                type="email"
                required
                icon={cilEnvelopeClosed}
    placeholder={t('customers.form.placeholders.email')}
                formData={formData}
                validationErrors={validationErrors}
                handleChange={handleChange}
                inputRefs={inputRefs}
              />
            </CCol>
          </CRow>

          <CRow>
            <CCol md={6}>
              <CustomFormSelect
    label={t('customers.form.labels.customerType')}
                name="customerType"
                icon={cilUser}
                formData={formData}
                validationErrors={validationErrors}
                handleChange={handleChange}
                inputRefs={inputRefs}
              >
    <option value="Home Owner">{t('form.types.homeOwner')}</option>
    <option value="Landlord">{t('form.types.landlord')}</option>
    <option value="Tenant">{t('form.types.tenant')}</option>
    <option value="Other">{t('form.types.other')}</option>
              </CustomFormSelect>
            </CCol>
            <CCol md={6}>
              <CustomFormInput
    label={t('customers.form.labels.companyName')}
                name="companyName"
                icon={cilBuilding}
    placeholder={t('customers.form.placeholders.companyName')}
                formData={formData}
                validationErrors={validationErrors}
                handleChange={handleChange}
                inputRefs={inputRefs}
              />
            </CCol>
          </CRow>
        </FormSection>

        {/* Address Information Section */}
  <FormSection title={t('customers.form.titles.addressInfo')} icon={cilLocationPin}>
          <CRow>
            <CCol md={8}>
              <CustomFormInput
    label={t('customers.form.labels.address')}
                name="address"
                required
                icon={cilLocationPin}
    placeholder={t('customers.form.placeholders.street')}
                formData={formData}
                validationErrors={validationErrors}
                handleChange={handleChange}
                inputRefs={inputRefs}
              />
            </CCol>
            <CCol md={4}>
              <CustomFormInput
    label={t('customers.form.labels.aptSuite')}
                name="aptOrSuite"
    placeholder={t('customers.form.placeholders.aptSuite')}
                formData={formData}
                validationErrors={validationErrors}
                handleChange={handleChange}
                inputRefs={inputRefs}
              />
            </CCol>
          </CRow>

          <CRow>
            <CCol md={4}>
              <CustomFormInput
    label={t('customers.form.labels.city')}
                name="city"
                required
    placeholder={t('customers.form.placeholders.city')}
                formData={formData}
                validationErrors={validationErrors}
                handleChange={handleChange}
                inputRefs={inputRefs}
              />
            </CCol>
            <CCol md={4}>
              <CustomFormSelect
    label={t('customers.form.labels.state')}
                name="state"
                required
                formData={formData}
                validationErrors={validationErrors}
                handleChange={handleChange}
                inputRefs={inputRefs}
              >
    <option value="">{t('customers.form.select.selectState')}</option>
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
    label={t('customers.form.labels.zipCode')}
                name="zipCode"
                required
    placeholder={t('customers.form.placeholders.zip')}
                formData={formData}
                validationErrors={validationErrors}
                handleChange={handleChange}
                inputRefs={inputRefs}
              />
            </CCol>
          </CRow>
        </FormSection>

        {/* Contact Information Section */}
  <FormSection title={t('customers.form.titles.contactInfo')} icon={cilPhone}>
          <CRow>
            <CCol md={6}>
              <CustomFormInput
    label={t('form.labels.mobile')}
                name="mobile"
                required
                icon={cilPhone}
    placeholder={t('form.placeholders.mobile')}
                formData={formData}
                validationErrors={validationErrors}
                handleChange={handleChange}
                inputRefs={inputRefs}
              />
            </CCol>
            <CCol md={6}>
              <CustomFormInput
    label={t('form.labels.homePhone')}
                name="homePhone"
                icon={cilPhone}
    placeholder={t('form.placeholders.homePhone')}
                formData={formData}
                validationErrors={validationErrors}
                handleChange={handleChange}
                inputRefs={inputRefs}
              />
            </CCol>
          </CRow>
        </FormSection>

        {/* Business Information Section */}
  <FormSection title={t('form.titles.businessInfo')} icon={cilBuilding}>
          <CRow>
            <CCol md={6}>
              <CustomFormSelect
    label={t('form.labels.leadSource')}
                name="leadSource"
                required
                formData={formData}
                validationErrors={validationErrors}
                handleChange={handleChange}
                inputRefs={inputRefs}
              >
    <option value="">{t('form.select.selectSource')}</option>
    <option value="Advertising">{t('form.sources.advertising')}</option>
    <option value="Google">{t('form.sources.google')}</option>
    <option value="Referral">{t('form.sources.referral')}</option>
    <option value="Social Media">{t('form.sources.social')}</option>
    <option value="Website">{t('form.sources.website')}</option>
              </CustomFormSelect>
            </CCol>
            <CCol md={6}>
              <CustomFormInput
    label={t('form.labels.defaultDiscount')}
                name="defaultDiscount"
                type="number"
                min={0}
                max={100}
                placeholder={t('form.placeholders.defaultDiscount')}
                formData={formData}
                validationErrors={validationErrors}
                handleChange={handleChange}
                inputRefs={inputRefs}
              />
            </CCol>
          </CRow>

          <div className="mb-3">
      <CFormLabel className="fw-medium text-dark mb-2">{t('form.labels.notes')}</CFormLabel>
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
      placeholder: t('form.placeholders.notes')
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
                {t('form.actions.cancel')}
              </CButton>
              <CButton
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="px-5 fw-semibold"
                style={{
                  borderRadius: '5px',
                  border: 'none',
                  backgroundColor: headerBg,
                  color: textColor,
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
                      <span className="visually-hidden">{t('common.loading')}</span>
                    </div>
                    {t('form.actions.saving')}
                  </>
                ) : (
                  <>
                    <CIcon icon={cilSave} className="me-2" />
                    {t('form.actions.saveCustomer')}
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