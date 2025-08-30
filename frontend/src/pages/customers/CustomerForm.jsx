import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { decodeParam } from '../../utils/obfuscate';
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CForm,
  CFormInput,
  CFormLabel,
  CFormTextarea,
  CFormSelect,
  CButton,
  CSpinner,
  CAlert,
  CContainer,
  CInputGroup,
  CInputGroupText
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilUser, cilEnvelopeClosed, cilPhone, cilLocationPin, cilSave, cilArrowLeft } from '@coreui/icons';
import { createCustomer, updateCustomer, fetchCustomers } from '../../store/slices/customerSlice';
import withContractorScope from '../../components/withContractorScope';
import Swal from 'sweetalert2';
import { useTranslation } from 'react-i18next';

const CustomerForm = ({ isContractor, contractorGroupId, contractorModules, contractorGroupName }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id: rawId } = useParams();
  const id = decodeParam(rawId);
  const isEditing = Boolean(id);
  const { t } = useTranslation();

  const { loading, error } = useSelector(state => state.customers);
  const customers = useSelector(state => state.customers.list);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    homePhone: '',
    mobile: '',
    address: '',
    aptOrSuite: '',
    city: '',
    state: '',
    zipCode: '',
    companyName: '',
    customerType: '',
    leadSource: '',
    defaultDiscount: 0,
    note: ''
  });

  const [formErrors, setFormErrors] = useState({});

  // Load customer data for editing
  useEffect(() => {
    if (isEditing && customers.length > 0) {
      const customer = customers.find(c => c.id === parseInt(id));
      if (customer) {
        setFormData({
          name: customer.name || '',
          email: customer.email || '',
          homePhone: customer.homePhone || '',
          mobile: customer.mobile || '',
          address: customer.address || '',
          aptOrSuite: customer.aptOrSuite || '',
          city: customer.city || '',
          state: customer.state || '',
          zipCode: customer.zipCode || '',
          companyName: customer.companyName || '',
          customerType: customer.customerType || '',
          leadSource: customer.leadSource || '',
          defaultDiscount: customer.defaultDiscount || 0,
          note: customer.note || ''
        });
      } else if (customers.length > 0) {
        // Customer not found, redirect back
  Swal.fire(t('common.error'), t('customers.form.alerts.notFound'), 'error');
        navigate('/customers');
      }
    }
  }, [isEditing, id, customers, navigate]);

  // Load customers if editing and not loaded
  useEffect(() => {
    if (isEditing && customers.length === 0) {
      const groupId = isContractor ? contractorGroupId : null;
      dispatch(fetchCustomers({ page: 1, limit: 1000, groupId }));
    }
  }, [isEditing, customers.length, dispatch, isContractor, contractorGroupId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
  errors.name = t('customers.form.validation.nameRequired');
    }
    
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
  errors.email = t('customers.form.validation.invalidEmail');
    }
    
    if (!formData.mobile.trim() && !formData.homePhone.trim()) {
  errors.phone = t('customers.form.validation.phoneAtLeastOne');
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      if (isEditing) {
        await dispatch(updateCustomer({ 
          id: parseInt(id), 
          customerData: formData 
        })).unwrap();
        
  Swal.fire(t('common.success'), t('customers.form.alerts.updatedText'), 'success');
      } else {
        await dispatch(createCustomer(formData)).unwrap();
  Swal.fire(t('common.success'), t('customers.form.alerts.createdText'), 'success');
      }
      
      navigate('/customers');
    } catch (error) {
  console.error('Form submission error:', error);
  Swal.fire(t('common.error'), error.message || t('customers.form.alerts.saveFailed'), 'error');
    }
  };

  const handleCancel = () => {
    navigate('/customers');
  };

  return (
    <CContainer fluid>
      <CRow>
        <CCol xs={12}>
          <CCard>
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <div>
                <h4 className="mb-0">
                  {isEditing ? t('customers.form.titles.edit') : t('customers.form.titles.add')}
                </h4>
                {isContractor && (
                  <p className="text-muted mb-0">{contractorGroupName}</p>
                )}
              </div>
              <CButton
                color="light"
                onClick={handleCancel}
                className="d-flex align-items-center gap-2"
              >
                <CIcon icon={cilArrowLeft} size="sm" />
                {t('customers.form.actions.backToCustomers')}
              </CButton>
            </CCardHeader>
            <CCardBody>
              {error && (
                <CAlert color="danger" className="mb-3">
                  {error}
                </CAlert>
              )}

              <CForm onSubmit={handleSubmit}>
                <CRow>
                  <CCol md={6}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="name">{t('customers.form.labels.fullName')} *</CFormLabel>
                      <CInputGroup>
                        <CInputGroupText>
                          <CIcon icon={cilUser} />
                        </CInputGroupText>
                        <CFormInput
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          invalid={!!formErrors.name}
                          required
                        />
                      </CInputGroup>
                      {formErrors.name && (
                        <div className="invalid-feedback d-block">{formErrors.name}</div>
                      )}
                    </div>
                  </CCol>

                  <CCol md={6}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="email">{t('customers.form.labels.email')}</CFormLabel>
                      <CInputGroup>
                        <CInputGroupText>
                          <CIcon icon={cilEnvelopeClosed} />
                        </CInputGroupText>
                        <CFormInput
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          invalid={!!formErrors.email}
                        />
                      </CInputGroup>
                      {formErrors.email && (
                        <div className="invalid-feedback d-block">{formErrors.email}</div>
                      )}
                    </div>
                  </CCol>
                </CRow>

                <CRow>
                  <CCol md={6}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="mobile">{t('customers.form.labels.mobile')}</CFormLabel>
                      <CInputGroup>
                        <CInputGroupText>
                          <CIcon icon={cilPhone} />
                        </CInputGroupText>
                        <CFormInput
                          type="tel"
                          id="mobile"
                          name="mobile"
                          value={formData.mobile}
                          onChange={handleInputChange}
                          invalid={!!formErrors.phone}
                        />
                      </CInputGroup>
                    </div>
                  </CCol>

                  <CCol md={6}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="homePhone">{t('customers.form.labels.homePhone')}</CFormLabel>
                      <CInputGroup>
                        <CInputGroupText>
                          <CIcon icon={cilPhone} />
                        </CInputGroupText>
                        <CFormInput
                          type="tel"
                          id="homePhone"
                          name="homePhone"
                          value={formData.homePhone}
                          onChange={handleInputChange}
                          invalid={!!formErrors.phone}
                        />
                      </CInputGroup>
                      {formErrors.phone && (
                        <div className="invalid-feedback d-block">{formErrors.phone}</div>
                      )}
                    </div>
                  </CCol>
                </CRow>

                <CRow>
                  <CCol md={12}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="address">{t('customers.form.labels.address')}</CFormLabel>
                      <CInputGroup>
                        <CInputGroupText>
                          <CIcon icon={cilLocationPin} />
                        </CInputGroupText>
                        <CFormInput
                          type="text"
                          id="address"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                        />
                      </CInputGroup>
                    </div>
                  </CCol>
                </CRow>

                <CRow>
                  <CCol md={3}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="aptOrSuite">{t('customers.form.labels.aptSuite')}</CFormLabel>
                      <CFormInput
                        type="text"
                        id="aptOrSuite"
                        name="aptOrSuite"
                        value={formData.aptOrSuite}
                        onChange={handleInputChange}
                      />
                    </div>
                  </CCol>

                  <CCol md={3}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="city">{t('customers.form.labels.city')}</CFormLabel>
                      <CFormInput
                        type="text"
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                      />
                    </div>
                  </CCol>

                  <CCol md={3}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="state">{t('customers.form.labels.state')}</CFormLabel>
                      <CFormInput
                        type="text"
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                      />
                    </div>
                  </CCol>

                  <CCol md={3}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="zipCode">{t('customers.form.labels.zipCode')}</CFormLabel>
                      <CFormInput
                        type="text"
                        id="zipCode"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleInputChange}
                      />
                    </div>
                  </CCol>
                </CRow>

                <CRow>
                  <CCol md={6}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="companyName">{t('customers.form.labels.companyName')}</CFormLabel>
                      <CFormInput
                        type="text"
                        id="companyName"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleInputChange}
                      />
                    </div>
                  </CCol>

                  <CCol md={6}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="customerType">{t('customers.form.labels.customerType')}</CFormLabel>
                      <CFormSelect
                        id="customerType"
                        name="customerType"
                        value={formData.customerType}
                        onChange={handleInputChange}
                      >
                        <option value="">{t('customers.form.select.selectType')}</option>
                        <option value="Residential">{t('customers.form.types.residential')}</option>
                        <option value="Commercial">{t('customers.form.types.commercial')}</option>
                        <option value="Contractor">{t('customers.form.types.contractor')}</option>
                        <option value="Sub Contractor">{t('customers.form.types.subContractor')}</option>
                      </CFormSelect>
                    </div>
                  </CCol>
                </CRow>

                <CRow>
                  <CCol md={6}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="leadSource">{t('customers.form.labels.leadSource')}</CFormLabel>
                      <CFormSelect
                        id="leadSource"
                        name="leadSource"
                        value={formData.leadSource}
                        onChange={handleInputChange}
                      >
                        <option value="">{t('customers.form.select.selectSource')}</option>
                        <option value="Website">{t('customers.form.sources.website')}</option>
                        <option value="Referral">{t('customers.form.sources.referral')}</option>
                        <option value="Google">{t('customers.form.sources.google')}</option>
                        <option value="Facebook">{t('customers.form.sources.facebook')}</option>
                        <option value="Phone Call">{t('customers.form.sources.phoneCall')}</option>
                        <option value="Walk-in">{t('customers.form.sources.walkIn')}</option>
                        <option value="Other">{t('customers.form.sources.other')}</option>
                      </CFormSelect>
                    </div>
                  </CCol>

                  <CCol md={6}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="defaultDiscount">{t('customers.form.labels.defaultDiscount')}</CFormLabel>
                      <CFormInput
                        type="number"
                        id="defaultDiscount"
                        name="defaultDiscount"
                        value={formData.defaultDiscount}
                        onChange={handleInputChange}
                        min="0"
                        max="100"
                      />
                    </div>
                  </CCol>
                </CRow>

                <CRow>
                  <CCol md={12}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="note">{t('customers.form.labels.notes')}</CFormLabel>
                      <CFormTextarea
                        id="note"
                        name="note"
                        rows="3"
                        value={formData.note}
                        onChange={handleInputChange}
                        placeholder={t('customers.form.placeholders.notes')}
                      />
                    </div>
                  </CCol>
                </CRow>

                <div className="d-flex justify-content-end gap-2">
                  <CButton
                    type="button"
                    color="light"
                    onClick={handleCancel}
                    disabled={loading}
                  >
                    {t('customers.form.actions.cancel')}
                  </CButton>
                  <CButton
                    type="submit"
                    color="primary"
                    disabled={loading}
                    className="d-flex align-items-center gap-2"
                  >
                    {loading ? (
                      <CSpinner size="sm" />
                    ) : (
                      <CIcon icon={cilSave} size="sm" />
                    )}
                    {isEditing ? t('customers.form.actions.update') : t('customers.form.actions.create')}
                  </CButton>
                </div>
              </CForm>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </CContainer>
  );
};

export default withContractorScope(CustomerForm, 'customers');
