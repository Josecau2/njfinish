import React, { useState, useEffect, useRef } from "react";
import { useSelector } from 'react-redux';
import { getContrastColor } from '../../utils/colorUtils';
import {
  CForm,
  CFormInput,
  CFormSelect,
  CFormLabel,
  CButton,
  CRow,
  CCol,
  CContainer,
  CCard,
  CCardBody,
  CSpinner,
  CInputGroup,
  CInputGroupText,
  CFormFeedback,
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
  cilPencil
} from '@coreui/icons';
import axiosInstance from '../../helpers/axiosInstance';
import Swal from "sweetalert2";
import { useParams, useNavigate } from "react-router-dom";
import { decodeParam } from '../../utils/obfuscate';
import { useTranslation } from 'react-i18next';

// External components to avoid re-creation on each render
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
  value,
  onChange,
  isInvalid,
  feedback,
  inputRef,
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
        value={value}
        onChange={onChange}
        invalid={isInvalid}
        ref={inputRef}
        placeholder={placeholder}
        style={{
          border: `1px solid ${isInvalid ? '#dc3545' : '#e3e6f0'}`,
          borderRadius: icon ? '0 10px 10px 0' : '10px',
          fontSize: '14px',
          padding: '12px 16px',
          transition: 'all 0.3s ease',
          borderLeft: icon ? 'none' : '1px solid #e3e6f0'
        }}
        onFocus={(e) => {
          if (!isInvalid) {
            e.target.style.borderColor = '#0d6efd';
            e.target.style.boxShadow = '0 0 0 0.2rem rgba(13, 110, 253, 0.25)';
          }
        }}
        onBlur={(e) => {
          if (!isInvalid) {
            e.target.style.borderColor = '#e3e6f0';
            e.target.style.boxShadow = 'none';
          }
        }}
        {...props}
      />
    </CInputGroup>
    {feedback && <CFormFeedback invalid>{feedback}</CFormFeedback>}
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
  inputRef,
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
        value={value}
        onChange={onChange}
        invalid={isInvalid}
        ref={inputRef}
        style={{
          border: `1px solid ${isInvalid ? '#dc3545' : '#e3e6f0'}`,
          borderRadius: icon ? '0 10px 10px 0' : '10px',
          fontSize: '14px',
          padding: '12px 16px',
          transition: 'all 0.3s ease',
          borderLeft: icon ? 'none' : '1px solid #e3e6f0'
        }}
        onFocus={(e) => {
          if (!isInvalid) {
            e.target.style.borderColor = '#0d6efd';
            e.target.style.boxShadow = '0 0 0 0.2rem rgba(13, 110, 253, 0.25)';
          }
        }}
        onBlur={(e) => {
          if (!isInvalid) {
            e.target.style.borderColor = '#e3e6f0';
            e.target.style.boxShadow = 'none';
          }
        }}
        {...props}
      >
        {children}
      </CFormSelect>
    </CInputGroup>
    {feedback && <CFormFeedback invalid>{feedback}</CFormFeedback>}
  </div>
);

const EditCustomerPage = () => {
  const { t } = useTranslation();
  const customization = useSelector((state) => state.customization);

  const headerBg = customization.headerBg || '#667eea';
  const textColor = getContrastColor(headerBg);

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
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRefs = useRef({});
  const { customerId: rawCustomerId } = useParams();
  const customerId = decodeParam(rawCustomerId);
  const navigate = useNavigate();
  const api_url = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        setIsLoading(true);
        const res = await axiosInstance.get(`/api/customers/${customerId}`);
        setFormData(res.data);
      } catch (err) {
        console.error(err);
  Swal.fire(t('common.error'), t('customers.form.alerts.notFound'), 'error');
      } finally {
        setIsLoading(false);
      }
    };
    if (customerId) fetchCustomer();
  }, [customerId, api_url]);

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
    const required = ["name", "email", "address", "city", "state", "zipCode", "mobile", "leadSource"];
    required.forEach((f) => {
      if (!formData[f]?.toString().trim()) errors[f] = t('customers.form.validation.required');
    });
    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) errors.email = t('customers.form.validation.invalidEmail');
    if (formData.zipCode && !/^\d{5}$/.test(formData.zipCode)) errors.zipCode = t('customers.form.validation.zip5');
    if (formData.mobile && !/^\d{10}$/.test(formData.mobile)) errors.mobile = t('customers.form.validation.mobile10');
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
      await axiosInstance.put(`/api/customers/update/${customerId}`, formData);
      Swal.fire({
        icon: "success",
        title: t('customers.form.alerts.updatedTitle'),
        text: t('customers.form.alerts.updatedText'),
        timer: 2000,
        showConfirmButton: false,
      });
      navigate("/customers");
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: "error", title: t('common.error'), text: t('customers.form.alerts.updateFailed') });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <CContainer fluid className="p-2 m-2 bg-body" style={{ minHeight: '100vh' }}>
        <CCard className="border-0 shadow-sm">
          <CCardBody className="text-center py-5">
            <CSpinner color="primary" size="lg" />
            <p className="text-muted mt-3 mb-0">{t('customers.loading')}</p>
          </CCardBody>
        </CCard>
      </CContainer>
    );
  }

  return (
    <CContainer fluid className="p-2 m-2 edit-customer-page bg-body" style={{ minHeight: '100vh' }}>
      {/* UI-TASK: Scoped mobile/touch styles for this page */}
      <style>{`
        .edit-customer-page .form-buttons .btn { min-height: 44px; }
        .edit-customer-page .form-buttons { flex-wrap: wrap; }
        .edit-customer-page .form-control { min-height: 44px; }
        .edit-customer-page .ck.ck-editor__editable { min-height: 160px; }
        @media (max-width: 576px) {
          .edit-customer-page .form-buttons { flex-direction: column; align-items: stretch; }
          .edit-customer-page .form-buttons .btn { width: 100%; }
        }
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
              <CIcon icon={cilPencil} style={{ fontSize: '24px', color: 'white' }} />
            </div>
            {t('customers.form.titles.edit')}
          </div>
        }
        subtitle="Update customer profile with detailed information"
        rightContent={
          <CButton
            color="light"
            variant="outline"
            className="me-2"
            onClick={() => window.history.back()}
            aria-label={t('common.back')}
            style={{
              borderColor: 'rgba(255, 255, 255, 0.3)',
              color: 'rgba(255, 255, 255, 0.9)',
              minHeight: '44px'
            }}
          >
            <CIcon icon={cilArrowLeft} className="me-1" size="sm" />
            {t('common.back')}
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
                value={formData.name}
                onChange={handleChange}
                isInvalid={!!validationErrors.name}
                feedback={validationErrors.name}
                inputRef={(el) => (inputRefs.current.name = el)}
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
                value={formData.email}
                onChange={handleChange}
                isInvalid={!!validationErrors.email}
                feedback={validationErrors.email}
                inputRef={(el) => (inputRefs.current.email = el)}
              />
            </CCol>
          </CRow>

          <CRow>
            <CCol md={6}>
              <CustomFormSelect
    label={t('customers.form.labels.customerType')}
                name="customerType"
                icon={cilUser}
                value={formData.customerType}
                onChange={handleChange}
                isInvalid={!!validationErrors.customerType}
                feedback={validationErrors.customerType}
                inputRef={(el) => (inputRefs.current.customerType = el)}
              >
    <option value="Home Owner">{t('customers.form.types.homeOwner')}</option>
    <option value="Contractor">{t('customers.form.types.contractor')}</option>
    <option value="Company">{t('customers.form.types.company')}</option>
    <option value="Sub Contractor">{t('customers.form.types.subContractor')}</option>
              </CustomFormSelect>
            </CCol>
            <CCol md={6}>
              <CustomFormInput
    label={t('customers.form.labels.companyName')}
                name="companyName"
                icon={cilBuilding}
    placeholder={t('customers.form.placeholders.companyName')}
                value={formData.companyName}
                onChange={handleChange}
                isInvalid={!!validationErrors.companyName}
                feedback={validationErrors.companyName}
                inputRef={(el) => (inputRefs.current.companyName = el)}
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
                value={formData.address}
                onChange={handleChange}
                isInvalid={!!validationErrors.address}
                feedback={validationErrors.address}
                inputRef={(el) => (inputRefs.current.address = el)}
              />
            </CCol>
            <CCol md={4}>
              <CustomFormInput
    label={t('customers.form.labels.aptSuite')}
                name="aptOrSuite"
    placeholder={t('customers.form.placeholders.aptSuite')}
                value={formData.aptOrSuite}
                onChange={handleChange}
                isInvalid={!!validationErrors.aptOrSuite}
                feedback={validationErrors.aptOrSuite}
                inputRef={(el) => (inputRefs.current.aptOrSuite = el)}
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
                value={formData.city}
                onChange={handleChange}
                isInvalid={!!validationErrors.city}
                feedback={validationErrors.city}
                inputRef={(el) => (inputRefs.current.city = el)}
              />
            </CCol>
            <CCol md={4}>
              <CustomFormSelect
    label={t('customers.form.labels.state')}
                name="state"
                required
                value={formData.state}
                onChange={handleChange}
                isInvalid={!!validationErrors.state}
                feedback={validationErrors.state}
                inputRef={(el) => (inputRefs.current.state = el)}
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
                value={formData.zipCode}
                onChange={handleChange}
                isInvalid={!!validationErrors.zipCode}
                feedback={validationErrors.zipCode}
                inputRef={(el) => (inputRefs.current.zipCode = el)}
              />
            </CCol>
          </CRow>
        </FormSection>

        {/* Contact Information Section */}
  <FormSection title={t('customers.form.titles.contactInfo')} icon={cilPhone}>
          <CRow>
            <CCol md={6}>
              <CustomFormInput
    label={t('customers.form.labels.mobile')}
                name="mobile"
                required
                icon={cilPhone}
    placeholder={t('customers.form.placeholders.mobile')}
                value={formData.mobile}
                onChange={handleChange}
                isInvalid={!!validationErrors.mobile}
                feedback={validationErrors.mobile}
                inputRef={(el) => (inputRefs.current.mobile = el)}
              />
            </CCol>
            <CCol md={6}>
              <CustomFormInput
    label={t('customers.form.labels.homePhone')}
                name="homePhone"
                icon={cilPhone}
    placeholder={t('customers.form.placeholders.homePhone')}
                value={formData.homePhone}
                onChange={handleChange}
                isInvalid={!!validationErrors.homePhone}
                feedback={validationErrors.homePhone}
                inputRef={(el) => (inputRefs.current.homePhone = el)}
              />
            </CCol>
          </CRow>
        </FormSection>

        {/* Business Information Section */}
  <FormSection title={t('customers.form.titles.businessInfo')} icon={cilBuilding}>
          <CRow>
            <CCol md={6}>
              <CustomFormInput
    label={t('customers.form.labels.leadSource')}
                name="leadSource"
                required
    placeholder={t('customers.form.placeholders.leadSource')}
                value={formData.leadSource}
                onChange={handleChange}
                isInvalid={!!validationErrors.leadSource}
                feedback={validationErrors.leadSource}
                inputRef={(el) => (inputRefs.current.leadSource = el)}
              />
            </CCol>
            <CCol md={6}>
              <CustomFormInput
    label={t('customers.form.labels.defaultDiscount')}
                name="defaultDiscount"
                type="number"
                min={0}
                max={100}
                placeholder={t('customers.form.placeholders.defaultDiscount')}
                value={formData.defaultDiscount}
                onChange={handleChange}
                isInvalid={!!validationErrors.defaultDiscount}
                feedback={validationErrors.defaultDiscount}
                inputRef={(el) => (inputRefs.current.defaultDiscount = el)}
              />
            </CCol>
          </CRow>
          <div className="mb-3">
            <CFormLabel className="fw-medium text-dark mb-2">{t('customers.form.labels.notes')}</CFormLabel>
            <CFormTextarea
              id="note"
              name="note"
              rows={6}
              value={formData.note || ''}
              onChange={(e) => handleNoteChange(e.target.value)}
              placeholder={t('customers.form.placeholders.notes')}
            />
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
                {t('customers.form.actions.cancel')}
              </CButton>
              <CButton
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="px-5 fw-semibold"
                style={{
                  borderRadius: '5px',
                  border: 'none',
                  background: headerBg,
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
                    {t('customers.form.actions.updating')}
                  </>
                ) : (
                  <>
                    <CIcon icon={cilSave} className="me-2" />
                    {t('customers.form.actions.update')}
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

export default EditCustomerPage;