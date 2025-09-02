import React, { useState, useEffect, useCallback } from 'react';
import {
  CCard,
  CCardBody,
  CCardHeader,
  CRow,
  CCol,
  CSpinner,
  CAlert,
  CBadge,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CModal,
  CModalBody,
  CModalFooter,
  CButton,
  CFormLabel
} from '@coreui/react';
import { useTranslation } from 'react-i18next';
import axiosInstance from '../../../../helpers/axiosInstance';
import PageHeader from '../../../../components/PageHeader';

// Helper function to get auth headers

const StylePicturesTab = ({ manufacturer }) => {
  const { t } = useTranslation();
  const api_url = import.meta.env.VITE_API_URL;
  const [stylesMeta, setStylesMeta] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredId, setHoveredId] = useState(null);

  // Edit modal states
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  // Create/Delete style
  const [createModal, setCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', shortName: '', description: '', code: '', imageFile: null });
  const [createBusy, setCreateBusy] = useState(false);
  const [deleteAsk, setDeleteAsk] = useState({ open: false, styleName: '' });
  const [reassignTo, setReassignTo] = useState('');

  // Handle image load error - memoized to prevent re-renders
  const handleImageError = useCallback((e, style) => {
    const fname = style?.styleVariants?.[0]?.image;
    // Prevent infinite loops by checking what's already been tried
    if (fname && !e.target.dataset.fallbackTried && e.target.src.indexOf('/uploads/manufacturer_catalogs/') === -1) {
      e.target.dataset.fallbackTried = '1';
      e.target.src = `${api_url}/uploads/manufacturer_catalogs/${fname}`;
    } else if (e.target.src.indexOf('/images/nologo.png') === -1) {
      e.target.src = '/images/nologo.png';
    }
  }, [api_url]);

  // Add CSS styles for better mobile experience and collection hover effects
  React.useEffect(() => {
    const styleSheet = document.createElement('style');
    styleSheet.innerHTML = `
      .collection-hover {
        transition: all 0.3s ease;
      }

      .collection-hover:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }

      @media (max-width: 576px) {
        .collection-hover {
          margin-bottom: 1rem;
        }

        .collection-hover:hover {
          transform: none;
        }

        .collection-hover:active {
          transform: scale(0.98);
        }
      }

      @media (hover: none) and (pointer: coarse) {
        .collection-hover:hover {
          transform: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
      }
    `;
    document.head.appendChild(styleSheet);

    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

  // Fetch styles with images when component mounts or manufacturer changes
  useEffect(() => {
    if (manufacturer?.id) {
      fetchStylesMeta();
    }
  }, [manufacturer?.id]);

  const fetchStylesMeta = async () => {
    if (!manufacturer?.id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await axiosInstance.get(`/api/manufacturers/${manufacturer.id}/styles-meta`, {
  // Authorization handled by axios interceptors
      });

      if (response.data && response.data.styles && Array.isArray(response.data.styles)) {
        setStylesMeta(response.data.styles);
      } else if (Array.isArray(response.data)) {
        // Fallback for old format
        setStylesMeta(response.data);
      } else {
        setStylesMeta([]);
      }
    } catch (error) {
      console.error('Error fetching styles meta:', error);
      setError('Failed to load style pictures. Please try again.');
      setStylesMeta([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter styles based on search term
  const filteredStyles = stylesMeta.filter(styleMeta =>
    styleMeta.style?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    styleMeta.styleVariants?.[0]?.shortName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle edit image click
  const handleEditImage = (style) => {
    setSelectedStyle(style);
    setSelectedFile(null);
    setEditModalVisible(true);
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
  };

  // Handle image upload/update
  const handleImageUpload = async () => {
    if (!selectedStyle || !selectedFile) return;

    setUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append('styleImage', selectedFile);
      formData.append('name', selectedStyle.style);
      formData.append('shortName', selectedStyle.styleVariants?.[0]?.shortName || '');
      formData.append('description', selectedStyle.styleVariants?.[0]?.description || '');
      formData.append('manufacturerId', manufacturer.id);
      formData.append('catalogId', selectedStyle.id);
      formData.append('code', selectedStyle.styleVariants?.[0]?.code || '');

      const response = await axiosInstance.post('/api/manufacturers/style/create', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          // Authorization handled by axios interceptors
        }
      });

      if (response.data.success) {
        // Refresh the styles data
        await fetchStylesMeta();
        setEditModalVisible(false);
        setSelectedStyle(null);
        setSelectedFile(null);

        // Show success message (you can add a toast notification here)
        console.log('Image updated successfully');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      // Show error message (you can add a toast notification here)
    } finally {
      setUploadingImage(false);
    }
  };

  if (loading) {
    return (
      <CCard>
        <CCardBody className="text-center p-5">
          <CSpinner color="primary" />
          <div className="mt-3">{t('styles.loading','Loading style pictures...')}</div>
        </CCardBody>
      </CCard>
    );
  }

  if (error) {
    return (
  <CCard>
        <CCardBody>
          <CAlert color="danger">
    {t('styles.loadFailed','Failed to load style pictures. Please try again.')}
          </CAlert>
        </CCardBody>
      </CCard>
    );
  }

  if (!manufacturer?.id) {
    return (
  <CCard>
        <CCardBody>
          <CAlert color="info">
    {t('styles.selectManufacturerInfo','Please select a manufacturer to view style pictures.')}
          </CAlert>
        </CCardBody>
      </CCard>
    );
  }

  if (stylesMeta.length === 0) {
    return (
  <CCard>
        <CCardBody>
          <CAlert color="info">
    {t('styles.noStylesInfo','No styles with pictures found for this manufacturer. Upload style images in the catalog mapping section to see them here.')}
          </CAlert>
        </CCardBody>
      </CCard>
    );
  }

  return (
    <div>
      <CCard>
        <CCardHeader>
          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3">
            <div>
              <h5 className="mb-1">
                {t('styles.header','Style Pictures for {{name}}',{ name: manufacturer.name })}
                <CBadge color="primary" className="ms-2">
                  {t('styles.count','{{count}} Styles',{ count: filteredStyles.length })} {searchTerm ? t('styles.filtered','(filtered from {{total}})',{ total: stylesMeta.length }) : ''}
                </CBadge>
              </h5>
              <div className="d-flex gap-2 align-items-center" style={{ minWidth: '250px' }}>
                <CButton color="success" size="sm" onClick={() => setCreateModal(true)}>
                  {t('styles.create', 'Add Style')}
                </CButton>
                {/* Search Bar */}
                <div style={{ minWidth: '250px' }}>
                  <CInputGroup size="sm">
                    <CInputGroupText>
                      <i className="bi bi-search"></i>
                    </CInputGroupText>
                    <CFormInput
                      placeholder={t('styles.searchPlaceholder','Search styles...')}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </CInputGroup>
                </div>
              </div>
              <small className="text-muted">
                {t('styles.helperText','View all styles with their associated pictures. Images are used in quote creation to help customers visualize their selections.')}
              </small>
            </div>

            {/* Search Bar */}
            <div style={{ minWidth: '250px' }}>
              <CInputGroup size="sm">
                <CInputGroupText>
                  <i className="bi bi-search"></i>
                </CInputGroupText>
                <CFormInput
                  placeholder={t('styles.searchPlaceholder','Search styles...')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </CInputGroup>
            </div>
          </div>
        </CCardHeader>
        <CCardBody>
          {filteredStyles.length === 0 ? (
            <CAlert color="info" className="text-center">
              {searchTerm ? (
                <>
                  {t('styles.noneMatch','No styles found matching "{{term}}".',{ term: searchTerm })}
                  <br />
                  <small>{t('styles.tryAdjust','Try adjusting your search terms or clear the search to see all styles.')}</small>
                </>
              ) : (
                t('styles.noneAvailable','No styles with pictures found for this manufacturer.')
              )}
            </CAlert>
          ) : (
            <div className="d-flex flex-wrap justify-content-start gap-3">
              {filteredStyles.map((style, index) => (
                <div key={style.id || index} className="text-center" style={{ minWidth: '80px', maxWidth: '120px' }}>
                  <div
                    className="position-relative"
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() => setHoveredId(style.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    <div
                      className="collection-hover border rounded shadow-sm position-relative d-inline-block"
                      style={{
                        overflow: 'hidden',
                        borderRadius: '8px',
                        transition: 'transform 0.3s ease',
                        backgroundColor: '#f8f9fa',
                        maxWidth: '100%'
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
                          maxWidth: '120px',
                          maxHeight: '150px',
                          height: 'auto',
                          width: 'auto',
                          borderRadius: '8px',
                          transition: 'transform 0.3s ease',
                          transform: hoveredId === style.id ? 'scale(1.02)' : 'scale(1)',
                          display: 'block'
                        }}
                        className="img-fluid"
                        onError={(e) => handleImageError(e, style)}
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
                        <CButton
                          color="light"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditImage(style);
                          }}
                          style={{ fontSize: '0.75rem' }}
                        >
                          <i className="bi bi-pencil"></i> {t('types.ui.uploadImage','Upload Image')}
                        </CButton>
                        <CButton
                          color="danger"
                          size="sm"
                          className="ms-2"
                          onClick={(e) => { e.stopPropagation(); setDeleteAsk({ open: true, styleName: style.style }); setReassignTo(''); }}
                          style={{ fontSize: '0.75rem' }}
                        >
                          <i className="bi bi-trash"></i>
                        </CButton>
                      </div>
                    </div>

      {/* Create Style Modal */}
      <CModal visible={createModal} onClose={() => setCreateModal(false)} className="no-gradient-modal">
        <PageHeader title={t('styles.createHeader', 'Add Style')} />
        <CModalBody>
          <div className="row g-3">
            <div className="col-md-6">
              <CFormLabel>{t('styles.name','Style Name')}</CFormLabel>
              <CFormInput value={createForm.name} onChange={(e)=>setCreateForm(p=>({...p,name:e.target.value}))}/>
            </div>
            <div className="col-md-6">
              <CFormLabel>{t('styles.short','Short Name')}</CFormLabel>
              <CFormInput value={createForm.shortName} onChange={(e)=>setCreateForm(p=>({...p,shortName:e.target.value}))}/>
            </div>
            <div className="col-12">
              <CFormLabel>{t('common.description','Description')}</CFormLabel>
              <CFormInput value={createForm.description} onChange={(e)=>setCreateForm(p=>({...p,description:e.target.value}))}/>
            </div>
            <div className="col-md-6">
              <CFormLabel>{t('common.code','Code')}</CFormLabel>
              <CFormInput value={createForm.code} onChange={(e)=>setCreateForm(p=>({...p,code:e.target.value}))}/>
            </div>
            <div className="col-md-6">
              <CFormLabel>{t('common.image','Image')}</CFormLabel>
              <input className="form-control" type="file" accept="image/*" onChange={(e)=>setCreateForm(p=>({...p,imageFile:e.target.files?.[0]||null}))}/>
            </div>
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={()=>setCreateModal(false)} disabled={createBusy}>Cancel</CButton>
          <CButton color="primary" disabled={createBusy || !createForm.name.trim()} onClick={async()=>{
            setCreateBusy(true);
            try{
              const fd=new FormData();
              if(createForm.imageFile) fd.append('styleImage', createForm.imageFile);
              fd.append('manufacturerId', manufacturer.id);
              fd.append('name', createForm.name.trim());
              fd.append('shortName', createForm.shortName||'');
              fd.append('description', createForm.description||'');
              fd.append('code', createForm.code||'');
              await axiosInstance.post(`/api/manufacturers/${manufacturer.id}/styles`, fd, { headers: { 'Content-Type': 'multipart/form-data' }});
              await fetchStylesMeta();
              setCreateModal(false);
            }catch(e){ console.error(e); }
            finally{ setCreateBusy(false);} }}>
            {createBusy? <><CSpinner size="sm" className="me-2"/>Saving...</>: 'Save'}
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Delete Style Confirm */}
      <CModal visible={deleteAsk.open} onClose={()=>setDeleteAsk({open:false,styleName:''})} className="no-gradient-modal">
        <PageHeader title={t('styles.deleteHeader','Delete Style')} />
        <CModalBody>
          <p>{t('styles.deleteConfirm','Delete style')} <strong>{deleteAsk.styleName}</strong>?</p>
          <CFormLabel>{t('styles.reassign','Reassign items to (leave empty to clear)')}</CFormLabel>
          <CFormInput value={reassignTo} onChange={(e)=>setReassignTo(e.target.value)} placeholder={t('styles.reassignPh','New style name or blank')}/>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={()=>setDeleteAsk({open:false,styleName:''})}>Cancel</CButton>
          <CButton color="danger" onClick={async()=>{
            try{
              await axiosInstance.delete(`/api/manufacturers/${manufacturer.id}/styles/${encodeURIComponent(deleteAsk.styleName)}`, { data: { reassignTo }});
              await fetchStylesMeta();
            }catch(e){ console.error(e); }
            finally{ setDeleteAsk({open:false,styleName:''}); setReassignTo(''); }
          }}>
            {t('common.delete','Delete')}
          </CButton>
        </CModalFooter>
      </CModal>

                    {/* Style Info */}
                    <div className="mt-2" style={{ maxWidth: '120px' }}>
                      <div
                        className="text-muted fw-semibold text-truncate"
                        title={style.styleVariants?.[0]?.shortName || style.style}
                        style={{ fontSize: '0.8rem', lineHeight: '1.2' }}
                      >
                        {style.styleVariants?.[0]?.shortName || style.style}
                      </div>

                      {style.styleVariants?.length > 0 && (
                        <div className="text-center mt-1">
                          <CBadge
                            color="secondary"
                            style={{ fontSize: '0.6rem' }}
                          >
                            {style.styleVariants.length} {t('styles.variants','variants')}
                          </CBadge>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CCardBody>
      </CCard>

      {/* Image Edit Modal */}
      <style>{`
        .no-gradient-modal .modal-header {
          background: #fff !important;
          border-bottom: 1px solid #dee2e6 !important;
          color: #212529 !important;
        }
        .no-gradient-modal .modal-title {
          color: #212529 !important;
        }
      `}</style>
      <CModal
        visible={editModalVisible}
        onClose={() => {
          setEditModalVisible(false);
          setSelectedStyle(null);
          setSelectedFile(null);
        }}
        size="lg"
        className="no-gradient-modal"
      >
  <PageHeader title={t('styles.editImage','Edit Style Image')} />
        <CModalBody>
          {selectedStyle && (
            <>
              <div className="mb-3">
    <strong>{t('common.style','Style')}:</strong> {selectedStyle.style}
              </div>

              {/* Current Image Preview */}
              <div className="mb-4">
    <h6>{t('types.ui.currentImage','Current Image:')}</h6>
                <div
                  className="d-flex justify-content-center p-3 border rounded"
                  style={{ backgroundColor: '#f8f9fa' }}
                >
                  <img
                    src={
                      selectedStyle.styleVariants?.[0]?.image
                        ? `${api_url}/uploads/images/${selectedStyle.styleVariants[0].image}`
                        : '/default-image.png'
                    }
                    alt={selectedStyle.style}
                    style={{
                      maxWidth: '200px',
                      maxHeight: '200px',
                      objectFit: 'contain',
                      border: '1px solid #dee2e6',
                      borderRadius: '4px'
                    }}
                    onError={(e) => handleImageError(e, selectedStyle)}
                  />
                </div>
              </div>

              {/* File Upload */}
              <div className="mb-3">
                <CFormLabel htmlFor="imageUpload">{t('styles.uploadNewImage','Upload New Image:')}</CFormLabel>
                <input
                  type="file"
                  id="imageUpload"
                  className="form-control"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                <div className="mt-2 text-muted">
                  {selectedFile ? (
                    <>{t('styles.selected','Selected')}: {selectedFile.name}</>
                  ) : selectedStyle.styleVariants?.[0]?.image ? (
                    <>{t('types.ui.current','Current')}: {selectedStyle.styleVariants[0].image}</>
                  ) : (
                    <>{t('types.ui.noImage','No image uploaded')}</>
                  )}
                </div>
              </div>

              {/* Preview of new image */}
              {selectedFile && (
                <div className="mb-3">
                  <h6>{t('styles.previewNewImage','New Image Preview:')}</h6>
                  <div
                    className="d-flex justify-content-center p-3 border rounded"
                    style={{ backgroundColor: '#f8f9fa' }}
                  >
                    <img
                      src={URL.createObjectURL(selectedFile)}
                      alt="Preview"
                      style={{
                        maxWidth: '200px',
                        maxHeight: '200px',
                        objectFit: 'contain',
                        border: '1px solid #dee2e6',
                        borderRadius: '4px'
                      }}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            onClick={() => {
              setEditModalVisible(false);
              setSelectedStyle(null);
              setSelectedFile(null);
            }}
          >
            {t('common.cancel','Cancel')}
          </CButton>
          <CButton
            color="primary"
            onClick={handleImageUpload}
            disabled={!selectedFile || uploadingImage}
          >
            {uploadingImage ? (
              <>
                <CSpinner size="sm" className="me-2" />
                {t('common.uploading','Uploading...')}
              </>
            ) : (
              t('types.ui.uploadImage','Upload Image')
            )}
          </CButton>
        </CModalFooter>
      </CModal>
    </div>
  );
};

export default StylePicturesTab;
