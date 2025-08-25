import React, { useEffect, useState } from 'react';
import {
  CAlert,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CContainer,
  CForm,
  CFormCheck,
  CFormInput,
  CFormLabel,
  CFormText,
  CFormTextarea,
  CRow,
} from '@coreui/react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axiosInstance from '../../../../helpers/axiosInstance';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const EditManufacturerTab = ({ manufacturer, id }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
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
  const [logoImage, setLogoImage] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (manufacturer) {
      setFormData({
        name: manufacturer.name || '',
        email: manufacturer.email || '',
        phone: manufacturer.phone || '',
        address: manufacturer.address || '',
        website: manufacturer.website || '',
        isPriceMSRP: manufacturer.isPriceMSRP ?? true,
        costMultiplier: manufacturer.costMultiplier || '',
        instructions: manufacturer.instructions || '',
      });
    }
  }, [manufacturer]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleFileChange = (e) => setFiles([...e.target.files]);

  const handlePriceTypeChange = (isPriceMSRP) => setFormData((prev) => ({ ...prev, isPriceMSRP }));

  const calculateMultiplierExample = () => {
    if (!formData.costMultiplier) return null;
    const msrp = 200.0;
    const cost = 100.0;
    const multiplier = parseFloat(formData.costMultiplier);
    return (
      <CFormText className="text-muted">
        {t('settings.manufacturers.example.multiplier', {
          msrp: msrp.toFixed(2),
          cost: cost.toFixed(2),
          multiplier: multiplier.toFixed(1),
        })}
      </CFormText>
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach((key) => formDataToSend.append(key, formData[key]));
      if (logoImage) formDataToSend.append('manufacturerImage', logoImage);
      files.forEach((file) => formDataToSend.append('catalogFiles', file));

      const res = await axiosInstance.put(`/api/manufacturers/${id}/update`, formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data', ...getAuthHeaders() },
      });

      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (res.data.status === 200) {
        setMessage({ text: t('settings.manufacturers.edit.updated'), type: 'success' });
        setTimeout(() => navigate('/settings/manufacturers'), 2000);
      } else {
        setMessage({ text: res.data.message || t('settings.manufacturers.edit.updateFailed'), type: 'danger' });
      }
    } catch (error) {
      console.error('Update error:', error);
      setMessage({ text: `Error: ${error.response?.data?.message || t('settings.manufacturers.edit.updateFailed')}`, type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <CContainer className="mt-4 mb-4">
      <CCard>
        <CCardHeader className="d-flex justify-content-between align-items-center bg-body border-bottom">
          <h5 className="mb-0">{t('settings.manufacturers.edit.title')}</h5>
          <CButton color="light" onClick={() => navigate(-1)}>
            {t('settings.manufacturers.edit.back')}
          </CButton>
        </CCardHeader>
        <CCardBody>
          {message.text && (
            <CAlert color={message.type} dismissible onClose={() => setMessage({ text: '', type: '' })}>
              {message.text}
            </CAlert>
          )}

          <CForm onSubmit={handleSubmit}>
            <CCard className="mb-4">
              <CCardBody>
                <CRow>
                  <CCol md={6}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="name">{t('settings.manufacturers.fields.manufacturerName')} *</CFormLabel>
                      <CFormInput id="name" name="name" value={formData.name} onChange={handleChange} required />
                    </div>
                  </CCol>
                  <CCol md={6}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="email">{t('settings.manufacturers.fields.orderEmail')} *</CFormLabel>
                      <CFormInput type="email" id="email" name="email" value={formData.email} onChange={handleChange} required />
                    </div>
                  </CCol>
                </CRow>

                <CRow>
                  <CCol md={6}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="phone">{t('settings.manufacturers.fields.phone')} *</CFormLabel>
                      <CFormInput id="phone" name="phone" value={formData.phone} onChange={handleChange} required />
                    </div>
                  </CCol>
                  <CCol md={6}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="website">{t('settings.manufacturers.fields.website')} *</CFormLabel>
                      <CFormInput id="website" name="website" value={formData.website} onChange={handleChange} required />
                    </div>
                  </CCol>
                </CRow>

                <div className="mb-3">
                  <CFormLabel htmlFor="address">{t('settings.manufacturers.fields.address')} *</CFormLabel>
                  <CFormInput id="address" name="address" value={formData.address} onChange={handleChange} required />
                </div>

                <div className="mb-3">
                  <CFormLabel htmlFor="manufacturerImage">{t('settings.manufacturers.edit.updateImage')}</CFormLabel>
                  <CFormInput type="file" id="manufacturerImage" accept="image/*" onChange={(e) => setLogoImage(e.target.files[0])} />
                  {logoImage && <div className="mt-2 text-success">{t('settings.manufacturers.edit.newImageSelected', { name: logoImage.name })}</div>}
                </div>
              </CCardBody>
            </CCard>

            <CCard className="mb-4">
              <CCardBody>
                <div className="mb-3">
                  <CFormLabel>{t('settings.manufacturers.edit.priceInfo')}</CFormLabel>
                  <CFormCheck
                    type="radio"
                    id="msrpPrices"
                    label={t('settings.manufacturers.fields.msrpOption')}
                    checked={formData.isPriceMSRP}
                    onChange={() => handlePriceTypeChange(true)}
                    className="mb-2"
                  />
                  <CFormCheck
                    type="radio"
                    id="costPrices"
                    label={t('settings.manufacturers.fields.costOption')}
                    checked={!formData.isPriceMSRP}
                    onChange={() => handlePriceTypeChange(false)}
                  />
                </div>

                <CRow>
                  <CCol md={4}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="costMultiplier">{t('settings.manufacturers.edit.costMultiplier')} *</CFormLabel>
                      <CFormInput type="number" step="0.1" id="costMultiplier" name="costMultiplier" value={formData.costMultiplier} onChange={handleChange} required />
                      {calculateMultiplierExample()}
                    </div>
                  </CCol>
                </CRow>
              </CCardBody>
            </CCard>

            <CCard className="mb-4">
              <CCardBody>
                <div className="mb-3">
                  <CFormLabel htmlFor="instructions">{t('settings.manufacturers.fields.instructions')}</CFormLabel>
                  <CFormTextarea id="instructions" rows={4} name="instructions" value={formData.instructions} onChange={handleChange} />
                </div>
              </CCardBody>
            </CCard>

            <CCard className="mb-4">
              <CCardBody>
                <div className="mb-3">
                  <CFormLabel htmlFor="catalogFiles">{t('settings.manufacturers.edit.uploadNewCatalog')}</CFormLabel>
                  <CFormInput type="file" id="catalogFiles" multiple onChange={handleFileChange} />
                  <CFormText className="text-muted">{t('settings.manufacturers.edit.supported')}</CFormText>
                </div>
              </CCardBody>
            </CCard>

            <div className="text-end">
              <CButton type="submit" color="primary" disabled={loading}>
                {loading ? t('settings.manufacturers.edit.saving') : t('settings.manufacturers.edit.saveChanges')}
              </CButton>
            </div>
          </CForm>
        </CCardBody>
      </CCard>
    </CContainer>
  );
};

export default EditManufacturerTab;
