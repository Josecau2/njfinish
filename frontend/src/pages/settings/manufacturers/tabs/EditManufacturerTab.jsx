import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  CForm,
  CFormInput,
  CFormLabel,
  CFormTextarea,
  CFormCheck,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CAlert,
  CRow,
  CCol,
  CContainer,
  CFormText,
} from '@coreui/react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../helpers/axiosInstance';

const EditManufacturerTab = ({ manufacturer, id }) => {
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
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleFileChange = (e) => {
    setFiles([...e.target.files]);
  };

  const handlePriceTypeChange = (isPriceMSRP) => {
    setFormData((prev) => ({
      ...prev,
      isPriceMSRP,
    }));
  };

  const calculateMultiplierExample = () => {
    if (!formData.costMultiplier) return null;

    const msrp = 200.0;
    const cost = 100.0;
    const multiplier = parseFloat(formData.costMultiplier);

    return (
      <CFormText className="text-muted">
        If cabinet's MSRP is ${msrp.toFixed(2)} and you pay ${cost.toFixed(2)} to manufacturer,
        your multiplier would be {multiplier.toFixed(1)}
      </CFormText>
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();

      Object.keys(formData).forEach((key) => {
        formDataToSend.append(key, formData[key]);
      });

      if (logoImage) {
        formDataToSend.append('manufacturerImage', logoImage);
      }

      files.forEach((file) => {
        formDataToSend.append('catalogFiles', file);
      });

      let res = await axiosInstance.put(`/api/manufacturers/${id}/update`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });

      if (res.data.status == 200) {
        setMessage({
          text: 'Manufacturer updated successfully!',
          type: 'success',
        });
        setTimeout(() => navigate('/settings/manufacturers'), 2000);
      }
    } catch (error) {
      console.error('Update error:', error);
      setMessage({
        text: `Error: ${error.response?.data?.message || 'Could not update manufacturer data'}`,
        type: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <CContainer className="mt-4 mb-4">
      <CCard>
        <CCardHeader className="d-flex justify-content-between align-items-center bg-white border-bottom">
          <h5 className="mb-0">Edit Manufacturer</h5>
          <CButton color="light" onClick={() => navigate(-1)}>Back</CButton>
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
                      <CFormLabel htmlFor="name">Manufacturer Name *</CFormLabel>
                      <CFormInput type="text" id="name" name="name" value={formData.name} onChange={handleChange} required />
                    </div>
                  </CCol>
                  <CCol md={6}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="email">Order Email *</CFormLabel>
                      <CFormInput type="email" id="email" name="email" value={formData.email} onChange={handleChange} required />
                    </div>
                  </CCol>
                </CRow>

                <CRow>
                  <CCol md={6}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="manufacturerImage">Update Manufacturer Image</CFormLabel>
                      <CFormInput type="file" id="manufacturerImage" accept="image/*" onChange={(e) => setLogoImage(e.target.files[0])} />
                      {logoImage && <div className="mt-2 text-success">New image selected: {logoImage.name}</div>}
                    </div>
                  </CCol>
                </CRow>

                <CRow>
                  <CCol md={6}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="phone">Phone *</CFormLabel>
                      <CFormInput type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} required />
                    </div>
                  </CCol>
                  <CCol md={6}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="website">Website *</CFormLabel>
                      <CFormInput type="url" id="website" name="website" value={formData.website} onChange={handleChange} required />
                    </div>
                  </CCol>
                </CRow>

                <div className="mb-3">
                  <CFormLabel htmlFor="address">Address *</CFormLabel>
                  <CFormInput type="text" id="address" name="address" value={formData.address} onChange={handleChange} required />
                </div>
              </CCardBody>
            </CCard>

            <CCard className="mb-4">
              <CCardBody>
                <div className="mb-3">
                  <CFormLabel>Price Information</CFormLabel>
                  <CFormCheck type="radio" id="msrpPrices" label="Prices in the attached files are MSRP" checked={formData.isPriceMSRP} onChange={() => handlePriceTypeChange(true)} className="mb-2" />
                  <CFormCheck type="radio" id="costPrices" label="Prices in the attached files are my cost when ordering from manufacturer" checked={!formData.isPriceMSRP} onChange={() => handlePriceTypeChange(false)} />
                </div>

                <CRow>
                  <CCol md={4}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="costMultiplier">Cost multiplier *</CFormLabel>
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
                  <CFormLabel htmlFor="instructions">Instructions</CFormLabel>
                  <CFormTextarea id="instructions" rows={4} name="instructions" value={formData.instructions} onChange={handleChange} />
                </div>
              </CCardBody>
            </CCard>

            <CCard className="mb-4">
              <CCardBody>
                <div className="mb-3">
                  <CFormLabel htmlFor="catalogFiles">Upload New Catalog Files</CFormLabel>
                  <CFormInput type="file" id="catalogFiles" multiple onChange={handleFileChange} />
                  <CFormText className="text-muted">Supported:Excel, CSV files</CFormText>
                </div>
              </CCardBody>
            </CCard>

            <div className="text-end">
              <CButton type="submit" color="primary" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </CButton>
            </div>
          </CForm>
        </CCardBody>
      </CCard>
    </CContainer>
  );
};

export default EditManufacturerTab;
