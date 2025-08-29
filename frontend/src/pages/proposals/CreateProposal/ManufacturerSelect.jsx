import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import CreatableSelect from 'react-select/creatable';
import { useDispatch, useSelector } from 'react-redux';
import {
  CCard,
  CCardBody,
  CForm,
  CFormLabel,
  CFormFeedback,
  CRow,
  CCol,
  CButton,
  CFormInput,
} from '@coreui/react';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { motion } from 'framer-motion';
import { fetchManufacturers } from '../../../store/slices/manufacturersSlice';
import { isAdmin } from '../../../helpers/permissions';
import './ManufacturerSelect.css';

const ManufacturerStep = ({ formData, updateFormData, nextStep, prevStep, hideBack }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { list: allManufacturers, loading } = useSelector((state) => state.manufacturers);
  const authUser = useSelector((state) => state.auth?.user);
  const isUserAdmin = isAdmin(authUser);
  const api_url = import.meta.env.VITE_API_URL;
  const [selectedManufacturer, setSelectedManufacturer] = useState(null);

  // Memoize enabled manufacturers to prevent unnecessary filtering and re-renders
  const enabledManufacturers = useMemo(() => {
    return allManufacturers.filter(manufacturer => manufacturer.enabled !== false);
  }, [allManufacturers]);

  useEffect(() => {
    dispatch(fetchManufacturers());
  }, [dispatch]);

  // Initialize selected manufacturer from form data
  useEffect(() => {
    if (formData.manufacturer && enabledManufacturers.length > 0) {
      const manufacturer = enabledManufacturers.find(m => m.id == formData.manufacturer);
      if (manufacturer) {
        setSelectedManufacturer(manufacturer);
      }
    }
  }, [formData.manufacturer, enabledManufacturers]);

  // Memoize validation schema to prevent recreation on every render
  const validationSchema = useMemo(() => Yup.object().shape({
    manufacturer: Yup.string().required(
      t('proposals.create.manufacturer.validation.manufacturerRequired')
    ),
    ...(isUserAdmin
      ? {
          versionName: Yup.string().required(
            t('proposals.create.manufacturer.validation.versionNameRequired')
          ),
        }
      : {}),
  }), [t, isUserAdmin]);

  const handleManufacturerSelect = useCallback((manufacturer, setFieldValue) => {
    setSelectedManufacturer(manufacturer);

    // Prefer existing versionName; otherwise default to the manufacturer name
    const versionName = (formData.versionName && formData.versionName.trim())
      ? formData.versionName
      : (manufacturer.name || '');

    // Keep Formik fields in sync so validation/UI stays consistent
    setFieldValue('manufacturer', manufacturer.id);
    setFieldValue('versionName', versionName);

    // Persist selection in our proposal form data and prepare manufacturersData entry
    const newEntry = {
      manufacturer: manufacturer.id,
      versionName: versionName || '',
    };

    updateFormData({
      ...formData,
      manufacturer: manufacturer.id,
      manufacturerId: manufacturer.id,
      versionName,
      manufacturersData: [newEntry],
    });

    // Immediately advance to Step 3
    nextStep();
  }, [formData, updateFormData, nextStep]);

  const ManufacturerCard = React.memo(({ manufacturer, isSelected, onClick }) => {
    const [imageError, setImageError] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    
    const handleImageError = useCallback(() => {
      setImageError(true);
      setImageLoaded(true);
    }, []);
    
    const handleImageLoad = useCallback(() => {
      setImageLoaded(true);
      setImageError(false);
    }, []);
    
    // Determine image source - avoid re-renders by computing once
    const imageSrc = useMemo(() => {
      if (!manufacturer.image || imageError) {
        return '/images/nologo.png';
      }
      return `${api_url}/uploads/images/${manufacturer.image}`;
    }, [manufacturer.image, imageError, api_url]);
    
    // Memoize card styles to prevent re-renders
    const cardStyles = useMemo(() => ({
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      borderWidth: isSelected ? '2px' : '1px',
      backgroundColor: isSelected ? '#f8f9ff' : '#fff',
      position: 'relative',
      overflow: 'hidden'
    }), [isSelected]);
    
    const imageStyles = useMemo(() => ({
      maxWidth: '100%',
      maxHeight: '80px',
      objectFit: 'contain',
      borderRadius: '8px',
      filter: isSelected ? 'brightness(1.1)' : 'brightness(1)',
      transition: 'filter 0.3s ease',
      backgroundColor: imageError ? '#f8f9fa' : 'transparent',
      border: imageError ? '2px dashed #dee2e6' : 'none',
      opacity: imageLoaded ? 1 : 0.7
    }), [isSelected, imageError, imageLoaded]);
    
    const nameStyles = useMemo(() => ({
      fontSize: '0.9rem',
      color: isSelected ? '#0d6efd' : '#495057',
      transition: 'color 0.3s ease'
    }), [isSelected]);
    
    return (
      <motion.div
        className="h-100"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.2 }}
      >
        <CCard
          className={`h-100 manufacturer-card ${isSelected ? 'border-primary shadow-lg' : 'border-light shadow-sm'}`}
          style={cardStyles}
          onClick={onClick}
        >
          {isSelected && (
            <div
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                backgroundColor: '#0d6efd',
                color: 'white',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 'bold',
                zIndex: 2
              }}
            >
              ✓
            </div>
          )}
          <CCardBody className="text-center p-3 d-flex flex-column">
            <div 
              className="manufacturer-logo-container mb-3"
              style={{
                flex: '1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '80px'
              }}
            >
              <img
                src={imageSrc}
                alt={manufacturer.name}
                style={imageStyles}
                onError={handleImageError}
                onLoad={handleImageLoad}
                loading="lazy"
              />
            </div>
            <h6 
              className="manufacturer-name mb-0 fw-semibold"
              style={nameStyles}
            >
              {manufacturer.name}
            </h6>
          </CCardBody>
        </CCard>
      </motion.div>
    );
  });

  return (
    <div className="my-4 w-100 proposal-form-mobile">
      <CCard>
        <CCardBody className="p-4">
          <h4 className="mb-4 fw-semibold">{t('proposals.create.manufacturer.title')}</h4>

          <Formik
            initialValues={{
              manufacturer: formData.manufacturer || '',
              versionName: formData.versionName || '',
            }}
            enableReinitialize
            validationSchema={validationSchema}
            onSubmit={(values) => {
              const newEntry = {
                manufacturer: values.manufacturer,
                versionName: values.versionName || '',
              };

              updateFormData({
                ...formData,
                manufacturersData: [newEntry],
                manufacturerId: values.manufacturer,
              });

              nextStep();
            }}
          >
            {({ values, errors, touched, handleChange, handleBlur, setFieldValue, handleSubmit }) => {
              return (
                <CForm onSubmit={handleSubmit} noValidate>
                  <div className="form-section">
                    
                    {/* Manufacturer Grid Selection */}
                    <div className="mb-4">
                      <CFormLabel className="fw-semibold mb-3">
                        {t('proposals.create.manufacturer.labels.manufacturer')}{' '}
                        <span className="text-danger">*</span>
                      </CFormLabel>
                      
                      {loading ? (
                        <div className="text-center py-5">
                          <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                          <p className="text-muted mt-2 mb-0">Loading manufacturers...</p>
                        </div>
                      ) : (
                        <>
                          <CRow className="g-3 mb-3">
                            {enabledManufacturers.map((manufacturer) => (
                              <CCol 
                                key={manufacturer.id} 
                                xs={6} 
                                md={4} 
                                lg={3}
                                className="manufacturer-grid-item"
                              >
                                <ManufacturerCard
                                  manufacturer={manufacturer}
                                  isSelected={selectedManufacturer?.id === manufacturer.id}
                                  onClick={() => handleManufacturerSelect(manufacturer, setFieldValue)}
                                />
                              </CCol>
                            ))}
                          </CRow>
                          
                          {errors.manufacturer && touched.manufacturer && (
                            <div className="text-danger small mt-2">
                              {errors.manufacturer}
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Version Name Field for Admin Users */}
                    {isUserAdmin && (
                      <CRow className="mb-4">
                        <CCol>
                          <CFormLabel htmlFor="versionName" className="fw-semibold">
                            {t('proposals.create.manufacturer.labels.versionName')}{' '}
                            <span className="text-danger">*</span>
                          </CFormLabel>
                          <CFormInput
                            id="versionName"
                            name="versionName"
                            type="text"
                            placeholder={t(
                              'proposals.create.manufacturer.placeholders.enterVersionName'
                            )}
                            value={values.versionName}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            invalid={!!errors.versionName && touched.versionName}
                            style={{ height: '42px', borderRadius: '6px' }}
                          />
                          <CFormFeedback invalid>{errors.versionName}</CFormFeedback>
                        </CCol>
                      </CRow>
                    )}
                    
                  </div>

                  <div className="button-group">
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
                    <CButton 
                      type="submit" 
                      color="primary" 
                      style={{ borderRadius: '6px', minWidth: '90px' }}
                      disabled={!selectedManufacturer}
                    >
                      {t('common.next')}
                    </CButton>
                  </div>
                </CForm>
              );
            }}
          </Formik>

          {isUserAdmin && (
            <div
              className="mt-5 p-4 rounded text-center"
              style={{
                backgroundColor: '#e9f0f6',
                border: '1px solid #b3c7db',
                color: '#2c3e50',
                fontSize: '0.95rem',
                margin: '0 auto',
              }}
            >
              <h6 className="mb-2 fw-semibold" style={{ letterSpacing: '0.03em' }}>
                {t('proposals.create.manufacturer.cta.needAnother')}
              </h6>
              <CButton
                color="primary"
                variant="outline"
                size="sm"
                style={{
                  borderRadius: '25px',
                  padding: '6px 20px',
                  fontWeight: '600',
                  letterSpacing: '0.05em',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#0275d8';
                  e.currentTarget.style.color = '#fff';
                  e.currentTarget.style.borderColor = '#0275d8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#0275d8';
                  e.currentTarget.style.borderColor = '#0275d8';
                }}
              >
                {t('proposals.create.manufacturer.cta.addManufacturer')}
              </CButton>
            </div>
          )}
        </CCardBody>
      </CCard>
    </div>
  );
};

export default ManufacturerStep;
