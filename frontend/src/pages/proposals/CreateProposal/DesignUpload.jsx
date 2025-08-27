import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  CCard,
  CCardBody,
  CNav,
  CNavItem,
  CNavLink,
  CButton,
  CFormInput,
  CSpinner,
} from '@coreui/react'
import axiosInstance from '../../../helpers/axiosInstance';

// Helper function to get auth headers
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

const DesignImportStep = ({ updateFormData, manufacturerData, onStyleSelect, formData, hideBack, prevStep }) => {
  const { t } = useTranslation();

  const api_url = import.meta.env.VITE_API_URL;
  const [activeTab, setActiveTab] = useState('manual')
  const [searchTerm, setSearchTerm] = useState("")
  const [hoveredId, setHoveredId] = useState(null)
  const [stylesMeta, setStylesMeta] = useState([]);

  const handleTabSelect = (tab) => {
    setActiveTab(tab)
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    updateFormData({ designFile: file })
  }

  // const filteredCollections = manufacturerData?.collections.filter(c =>
  //   c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //   c.short_name.toLowerCase().includes(searchTerm.toLowerCase())
  // )
 const filteredCollections = stylesMeta?.length
  ? stylesMeta.filter(s => {
      const q = searchTerm.toLowerCase();
      const matchStyle = (s.style || '').toLowerCase().includes(q);
      const matchVariant = Array.isArray(s.styleVariants) && s.styleVariants.some(v => (v.shortName || '').toLowerCase().includes(q));
      return !q || matchStyle || matchVariant;
    })
  : [];

  useEffect(() => {
    // Assuming we fetch collection only for the first manufacturer

    const selectedManufacturerId = formData.manufacturersData?.[0]?.manufacturer;
    if (selectedManufacturerId) {
      fetchManufacturerStylesMeta(selectedManufacturerId);
    }
  }, [formData]);

  const fetchManufacturerStylesMeta = async (manufacturerId) => {
    try {
      const response = await axiosInstance.get(`/api/manufacturers/${manufacturerId}/styles-meta`, {
        headers: getAuthHeaders(),
      });
      
      // Handle both old array format and new object format
      if (response.data && response.data.styles && Array.isArray(response.data.styles)) {
        setStylesMeta(response.data.styles);
      } else if (Array.isArray(response.data)) {
        // Fallback for old format
        setStylesMeta(response.data);
      } else {
        setStylesMeta([]);
      }
    } catch (error) {
      console.error('Error fetching styles meta', error);
      setStylesMeta([]);
    }
  };


  return (
    <div className="w-100 proposal-form-mobile">
      <CCard className="my-4 shadow-sm w-100">
        <CCardBody className="p-4">
          <div className="d-flex justify-content-between">
            <h5 className="mb-4 text-dark fw-semibold">{t('proposals.create.design.title')}</h5>

            {!hideBack && (
              <CButton
                color="secondary"
                variant="outline"
                onClick={prevStep}
                style={{ borderRadius: '6px', minWidth: '90px' }}
              >
                {t('common.back')}
              </CButton>
            )}
          </div>

          <CNav variant="tabs" role="tablist" className="mb-4 tabs-container">
            <CNavItem>
              <CNavLink
                active={activeTab === 'manual'}
                onClick={() => handleTabSelect('manual')}
                style={{ cursor: 'pointer' }}
              >
                {t('proposals.create.design.tabs.manualEntry')}
              </CNavLink>
            </CNavItem>
            <CNavItem>
              <CNavLink
                active={activeTab === 'import'}
                onClick={() => handleTabSelect('import')}
                style={{ cursor: 'pointer' }}
              >
                {t('proposals.create.design.tabs.import2020')}
              </CNavLink>
            </CNavItem>
          </CNav>

          {activeTab === 'import' ? (
            <div className="form-section text-center py-5">
              <p className="text-muted mb-4">{t('proposals.create.design.supportedTypes', { types: '.TXT, .CSV' })}</p>

              <div
                className="upload-area p-5 border border-dashed rounded mb-4 bg-light d-flex flex-column align-items-center justify-content-center"
                style={{ cursor: 'pointer' }}
                onClick={() => document.getElementById('fileInput').click()}
              >
                <i className="bi bi-cloud-upload fs-1 text-muted mb-3"></i>
                <p className="text-muted mb-2">{t('proposals.create.design.selectExportedFile')}</p>
                <CButton color="success" onClick={() => document.getElementById('fileInput').click()}>
                  {t('proposals.create.design.selectFileCta')}
                </CButton>
                <CFormInput
                  type="file"
                  id="fileInput"
                  style={{ display: 'none' }}
                  onChange={handleFileSelect}
                  accept=".txt,.csv"
                />
              </div>

              <p className="text-primary mb-2" style={{ cursor: 'pointer' }} onClick={() => handleTabSelect('manual')}>
                {t('proposals.create.design.no2020SwitchToManual')}
              </p>

              <CButton color="link" className="text-primary p-0">
                <i className="bi bi-question-circle me-1"></i> {t('proposals.create.design.howToExport')}
              </CButton>
            </div>
          ) : (
            // filteredCollections &&
            //   filteredCollections.length == 0 ? (
            //   <div className="text-center py-5">
            //     <h6 className="text-muted mb-3">Manual Entry</h6>
            //     <p className="text-muted">You can manually select cabinet styles and enter individual parts here.</p>
            //     <p className="text-muted">This section will guide you through step-by-step inputs.</p>
            //     <CButton color="info" variant="outline" size="sm" onClick={() => alert('To be implemented')}>
            //       Simulate Manual Form
            //     </CButton>
            //   </div>
            // ) : (
              <div className="form-section text-center py-5">
                <div className="mb-4 d-flex justify-content-center">
                  <CFormInput
                    placeholder={t('proposals.create.design.searchStylePlaceholder')}
                    style={{ maxWidth: 300 }}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="d-flex flex-wrap justify-content-center gap-4">
                  <div className="d-flex flex-wrap justify-content-center gap-4">
                    {filteredCollections?.map((style) => (
                      <div
                        key={style.id}
                        className="position-relative text-center"
                        style={{ width: 100, cursor: 'pointer' }}
                        onMouseEnter={() => setHoveredId(style.id)}
                        onMouseLeave={() => setHoveredId(null)}
                        onClick={() => onStyleSelect(style.id)}
                      >
                        <div
                          className="collection-hover border rounded shadow-sm position-relative"
                          style={{
                            overflow: 'hidden',
                            borderRadius: '8px',
                            transition: 'transform 0.3s ease',
                          }}
                        >
                          <img
                            src={
                              style.styleVariants?.[0]?.image
                                ? `${api_url}/uploads/images/${style.styleVariants[0].image}`
                                : "/images/nologo.png"
                            }
                            alt={style.styleVariants?.[0]?.shortName || style.style}
                            style={{
                              width: '100%',
                              height: 210,
                              objectFit: 'cover',
                              borderRadius: '8px',
                              transition: 'transform 0.3s ease',
                              transform: hoveredId === style.id ? 'scale(1.05)' : 'scale(1)',
                            }}
                            className="img-fluid"
                            onError={(e) => {
                              const fname = style.styleVariants?.[0]?.image;
                              if (fname && !e.target.dataset.fallbackTried) {
                                e.target.dataset.fallbackTried = '1';
                                e.target.src = `${api_url}/uploads/manufacturer_catalogs/${fname}`;
                              } else {
                                e.target.src = '/images/nologo.png';
                              }
                            }}
                          />
                          <div
                            className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                            style={{
                              backgroundColor: 'rgba(0, 0, 0, 0.6)',
                              color: '#fff',
                              opacity: hoveredId === style.id ? 1 : 0,
                              transition: 'opacity 0.3s ease',
                              fontSize: '0.85rem',
                              fontWeight: '500',
                              borderRadius: '8px',
                            }}
                          >
              {style.style || t('common.na')}
                          </div>
                        </div>
            <div className="mt-2 text-muted fw-semibold">{style.styleVariants?.[0]?.shortName || style.style}</div>
                      </div>
                    ))}
                  </div>

                </div>
              </div>
            // )
          )}

        </CCardBody>
      </CCard>
    </div>
  )
}

export default DesignImportStep
