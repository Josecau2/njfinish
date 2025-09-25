import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getContrastColor } from '../../../../utils/colorUtils';
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
import { fetchManufacturerById } from '../../../../store/slices/manufacturersSlice';

const EditManufacturerTab = ({ manufacturer, id }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
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
    deliveryFee: '',
    orderEmailSubject: '',
    orderEmailTemplate: '',
    orderEmailMode: 'pdf',
    autoEmailOnAccept: true,
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
        assembledEtaDays: manufacturer.assembledEtaDays || '',
        unassembledEtaDays: manufacturer.unassembledEtaDays || '',
        deliveryFee: manufacturer.deliveryFee || '',
        orderEmailSubject: manufacturer.orderEmailSubject || '',
        orderEmailTemplate: manufacturer.orderEmailTemplate || '',
        orderEmailMode: manufacturer.orderEmailMode || 'pdf',
        autoEmailOnAccept: manufacturer.autoEmailOnAccept ?? true,
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

    console.log('Form data before submit:', formData);

    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach((key) => {
        const value = formData[key] || '';
        console.log(`Appending ${key}:`, value);
        formDataToSend.append(key, value);
      });

      if (logoImage) formDataToSend.append('manufacturerImage', logoImage);
      files.forEach((file) => formDataToSend.append('catalogFiles', file));

      console.log('Sending update request...');
      const res = await axiosInstance.put(`/api/manufacturers/${id}/update`, formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      console.log('Server response:', res.data);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (res.data.status === 200) {
        setMessage({ text: t('settings.manufacturers.edit.updated'), type: 'success' });
        // Refetch manufacturer data to update the form with latest values
        dispatch(fetchManufacturerById({ id, includeCatalog: false }));
        setTimeout(() => navigate('/settings/manufacturers'), 2000);
      } else {
        setMessage({ text: res.data.message || t('settings.manufacturers.edit.updateFailed'), type: 'danger' });
      }
    } catch (error) {
      console.error('Update error:', error);
      console.error('Error details:', error.response?.data);
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
          <CButton color="light" onClick={() => navigate(-1)} className="icon-btn" aria-label={t('settings.manufacturers.edit.back')}>
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
                      <CFormInput
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        inputMode="tel"
                        aria-describedby="phoneHelp"
                      />
                      <CFormText id="phoneHelp" className="text-muted">
                        {t('settings.manufacturers.help.phoneFormat', 'Include country/area code if needed')}
                      </CFormText>
                    </div>
                  </CCol>
                  <CCol md={6}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="website">{t('settings.manufacturers.fields.website')} *</CFormLabel>
                      <CFormInput
                        type="url"
                        id="website"
                        name="website"
                        value={formData.website}
                        onChange={handleChange}
                        required
                        inputMode="url"
                        aria-describedby="websiteHelp"
                      />
                      <CFormText id="websiteHelp" className="text-muted">
                        {t('settings.manufacturers.help.websiteFormat', 'https://example.com')}
                      </CFormText>
                    </div>
                  </CCol>
                </CRow>

                <div className="mb-3">
                  <CFormLabel htmlFor="address">{t('settings.manufacturers.fields.address')} *</CFormLabel>
                  <CFormInput id="address" name="address" value={formData.address} onChange={handleChange} required />
                </div>

                <CRow>
                  <CCol md={6}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="assembledEtaDays">
                        {t('settings.manufacturers.fields.assembledEtaDays', 'Assembled Items ETA')}
                      </CFormLabel>
                      <CFormInput
                        type="text"
                        id="assembledEtaDays"
                        name="assembledEtaDays"
                        value={formData.assembledEtaDays}
                        onChange={handleChange}
                        placeholder="e.g., 7-14 days"
                        aria-describedby="assembledEtaHelp"
                      />
                      <CFormText id="assembledEtaHelp" className="text-muted">
                        {t('settings.manufacturers.help.assembledEta', 'Estimated delivery time for assembled cabinets')}
                      </CFormText>
                    </div>
                  </CCol>
                  <CCol md={6}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="unassembledEtaDays">
                        {t('settings.manufacturers.fields.unassembledEtaDays', 'Unassembled Items ETA')}
                      </CFormLabel>
                      <CFormInput
                        type="text"
                        id="unassembledEtaDays"
                        name="unassembledEtaDays"
                        value={formData.unassembledEtaDays}
                        onChange={handleChange}
                        placeholder="e.g., 3-7 days"
                        aria-describedby="unassembledEtaHelp"
                      />
                      <CFormText id="unassembledEtaHelp" className="text-muted">
                        {t('settings.manufacturers.help.unassembledEta', 'Estimated delivery time for unassembled cabinets')}
                      </CFormText>
                    </div>
                  </CCol>
                </CRow>

                <div className="mb-3">
                  <CFormLabel htmlFor="manufacturerImage">{t('settings.manufacturers.edit.updateImage')}</CFormLabel>

                  {/* Display current image if exists */}
                  {manufacturer?.image && !logoImage && (
                    <div className="mb-3">
                      <p className="text-muted">{t('settings.manufacturers.edit.currentImage')}:</p>
                      <img
                        src={`${import.meta.env.VITE_API_URL}/uploads/images/${manufacturer.image}`}
                        alt={manufacturer.name}
                        style={{ maxWidth: '200px', maxHeight: '150px', objectFit: 'contain' }}
                        className="border rounded"
                      />
                    </div>
                  )}

                  <CFormInput
                    type="file"
                    id="manufacturerImage"
                    accept="image/*"
                    onChange={(e) => setLogoImage(e.target.files[0])}
                    aria-describedby="manufacturerImageHelp"
                  />
                  <CFormText id="manufacturerImageHelp" className="text-muted">
                    {t('settings.manufacturers.edit.imageHelp', 'PNG or JPG recommended. Max ~5MB.')}
                  </CFormText>
                  {logoImage && (
                    <div className="mt-2">
                      <div className="text-success">{t('settings.manufacturers.edit.newImageSelected', { name: logoImage.name })}</div>
                      {/* Preview of new image */}
                      <img
                        src={URL.createObjectURL(logoImage)}
                        alt="Preview"
                        style={{ maxWidth: '200px', maxHeight: '150px', objectFit: 'contain' }}
                        className="border rounded mt-2"
                      />
                    </div>
                  )}
                </div>
              </CCardBody>
            </CCard>

            <CCard className="mb-4">
              <CCardBody>
                <CRow>
                  <CCol md={6}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="orderEmailSubject">Manufacturer Email Subject</CFormLabel>
                      <CFormInput id="orderEmailSubject" name="orderEmailSubject" value={formData.orderEmailSubject} onChange={handleChange} />
                    </div>
                  </CCol>
                  <CCol md={6}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="orderEmailMode">Send Mode</CFormLabel>
                      <select id="orderEmailMode" name="orderEmailMode" className="form-select" value={formData.orderEmailMode} onChange={handleChange}>
                        <option value="pdf">PDF only</option>
                        <option value="plain">Plain text only</option>
                        <option value="both">Both</option>
                      </select>
                      <div className="form-text">Choose whether to send a PDF, a plain email, or both.</div>
                    </div>
                  </CCol>
                </CRow>
                <div className="mb-3">
                  <CFormLabel htmlFor="orderEmailTemplate">Manufacturer Email Template (no prices)</CFormLabel>
                  <CFormTextarea id="orderEmailTemplate" name="orderEmailTemplate" rows={6} value={formData.orderEmailTemplate} onChange={handleChange} placeholder="Dear Manufacturer, Please find the attached order PDF. ..." />
                  <CFormText>Simple HTML allowed. Keep it minimal; prices are not included.</CFormText>
                </div>
                <div className="form-check form-switch">
                  <input className="form-check-input" type="checkbox" role="switch" id="autoEmailOnAccept" name="autoEmailOnAccept" checked={!!formData.autoEmailOnAccept} onChange={(e)=> setFormData(prev=> ({...prev, autoEmailOnAccept: e.target.checked}))} />
                  <label className="form-check-label" htmlFor="autoEmailOnAccept">Automatically email manufacturer on acceptance</label>
                </div>
              </CCardBody>
            </CCard>

            <CCard className="mb-4">
              <CCardBody>
                <fieldset className="mb-3">
                  <CFormLabel as="legend">{t('settings.manufacturers.edit.priceInfo')}</CFormLabel>
                  <span className="visually-hidden" id="priceTypeDesc">
                    {t('settings.manufacturers.help.priceInfo', 'Choose how prices are handled')}
                  </span>
                  <CFormCheck
                    type="radio"
                    name="priceType"
                    id="msrpPrices"
                    label={t('settings.manufacturers.fields.msrpOption')}
                    checked={formData.isPriceMSRP}
                    onChange={() => handlePriceTypeChange(true)}
                    className="mb-2"
                    aria-describedby="priceTypeDesc"
                  />
                  <CFormCheck
                    type="radio"
                    name="priceType"
                    id="costPrices"
                    label={t('settings.manufacturers.fields.costOption')}
                    checked={!formData.isPriceMSRP}
                    onChange={() => handlePriceTypeChange(false)}
                    aria-describedby="priceTypeDesc"
                  />
                </fieldset>

                <CRow>
                  <CCol md={4}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="costMultiplier">{t('settings.manufacturers.edit.costMultiplier')} *</CFormLabel>
                      <CFormInput
                        type="number"
                        step="0.1"
                        id="costMultiplier"
                        name="costMultiplier"
                        value={formData.costMultiplier}
                        onChange={handleChange}
                        required
                        inputMode="decimal"
                      />
                      {calculateMultiplierExample()}
                    </div>
                  </CCol>
                  <CCol md={4}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="deliveryFee">{t('settings.manufacturers.edit.deliveryFee')}</CFormLabel>
                      <CFormInput
                        type="number"
                        step="0.01"
                        min="0"
                        id="deliveryFee"
                        name="deliveryFee"
                        value={formData.deliveryFee}
                        onChange={handleChange}
                        inputMode="decimal"
                        aria-describedby="deliveryFeeHelp"
                      />
                      <CFormText id="deliveryFeeHelp" className="text-muted">{t('settings.manufacturers.edit.deliveryFeeHelp')}</CFormText>
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
                  <CFormInput
                    type="file"
                    id="catalogFiles"
                    multiple
                    onChange={handleFileChange}
                    aria-describedby="catalogFilesHelp"
                  />
                  <CFormText id="catalogFilesHelp" className="text-muted">{t('settings.manufacturers.edit.supported')}</CFormText>
                </div>
              </CCardBody>
            </CCard>

            <div className="text-end">
              <CButton
                type="submit"
                disabled={loading}
                style={{
                  background: headerBg,
                  color: textColor,
                  border: 'none'
                }}
              >
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
