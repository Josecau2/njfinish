import { useEffect, useState } from 'react';
import {
  CButton, CFormInput, CFormLabel, CFormCheck,
  CContainer, CRow, CCol, CTooltip,
  CCard, CCardHeader, CCardBody, CBadge,
  CSpinner, CInputGroup, CInputGroupText
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilTrash, cilPlus, cilSave, cilX, cilCheckAlt } from '@coreui/icons';
import { useDispatch, useSelector } from 'react-redux';
import { addTax, fetchTaxes, deleteTax, setDefaultTax } from '../../../store/slices/taxSlice';
import { CiCircleQuestion } from "react-icons/ci";
import { FaCoins, FaPercentage } from "react-icons/fa";
import { useTranslation } from 'react-i18next';

const TaxesPage = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { taxes, loading } = useSelector((state) => state.taxes);
  const [newTaxes, setNewTaxes] = useState([]);

  useEffect(() => {
    dispatch(fetchTaxes());
  }, [dispatch]);

  const handleNewTaxChange = (index, field, val) => {
    const updated = [...newTaxes];
    updated[index][field] = val;
    setNewTaxes(updated);
  };

  const handleAddTaxRow = () => {
    if (newTaxes.length === 0) {
      setNewTaxes([{ label: '', value: '' }]);
      return;
    }

    const lastTax = newTaxes[newTaxes.length - 1];
    if (!lastTax.label.trim() || !lastTax.value.trim()) {
      alert(t('settings.taxes.alerts.completeFields'));
      return;
    }

    setNewTaxes((prev) => [...prev, { label: '', value: '' }]);
  };

  const handleSaveNewTax = async (index) => {
    try {
      const tax = newTaxes[index];
      await dispatch(addTax(tax)).unwrap();
      setNewTaxes((prev) => prev.filter((_, i) => i !== index));
    } catch (error) {
      alert(t('settings.taxes.alerts.addFailed'));
    }
  };

  const handleDelete = (id) => {
    dispatch(deleteTax(id));
  };

  const handleDefaultChange = (id) => {
    dispatch(setDefaultTax(id));
  };

  const handleCancelNewTax = (index) => {
    setNewTaxes((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <CContainer fluid className="p-2 m-2" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header Section */}
      <CCard className="border-0 shadow-sm mb-2" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <CCardBody className="py-4">
          <CRow className="align-items-center">
            <CCol>
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
                  <FaCoins className="text-white" style={{ fontSize: '24px' }} />
                </div>
                <div>
                  <h3 className="text-white mb-1 fw-bold">{t('settings.taxes.header')}</h3>
                  <p className="text-white-50 mb-0">{t('settings.taxes.subtitle')}</p>
                </div>
              </div>
            </CCol>
            <CCol xs="auto">
              <CButton 
                color="light" 
                className="shadow-sm px-4 fw-semibold"
                onClick={handleAddTaxRow}
                disabled={
                  newTaxes.length > 0 &&
                  (!newTaxes[newTaxes.length - 1].label.trim() ||
                    !newTaxes[newTaxes.length - 1].value.trim())
                }
                style={{ 
                  borderRadius: '5px',
                  border: 'none',
                  transition: 'all 0.3s ease'
                }}
              >
                <CIcon icon={cilPlus} className="me-2" />
                {t('settings.taxes.addTax')}
              </CButton>
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      {/* Stats Card */}
      <CCard className="border-0 shadow-sm mb-1">
        <CCardBody>
          <CRow className="align-items-center">
            <CCol md={6}>
              <div className="d-flex align-items-center gap-3">
                <CTooltip
                  content={t('settings.taxes.help.tooltip')}
                  placement="bottom"
                >
                  <div className="d-flex align-items-center gap-2 text-muted">
                    <CiCircleQuestion style={{ fontSize: '20px', cursor: 'pointer' }} />
                    <small>{t('settings.taxes.help.hover')}</small>
                  </div>
                </CTooltip>
              </div>
            </CCol>
            <CCol md={6} className="text-md-end mt-3 mt-md-0">
              <div className="d-flex justify-content-md-end align-items-center gap-3">
                <CBadge 
                  color="info" 
                  className="px-3 py-2"
                  style={{ 
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}
                >
                  {t('settings.taxes.stats.total', { count: taxes?.length || 0 })}
                </CBadge>
                <CBadge 
                  color="success" 
                  className="px-3 py-2"
                  style={{ 
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}
                >
                  {t('settings.taxes.stats.defaultCount', { count: taxes?.filter(tax => tax.isDefault).length || 0 })}
                </CBadge>
              </div>
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      {/* Loading State */}
      {loading && (
        <CCard className="border-0 shadow-sm">
          <CCardBody className="text-center py-5">
            <CSpinner color="primary" size="lg" />
            <p className="text-muted mt-3 mb-0">{t('settings.taxes.loading')}</p>
          </CCardBody>
        </CCard>
      )}

      {/* Taxes List */}
      {!loading && (
        <CCard className="border-0 shadow-sm">
          <CCardBody className="p-0">
            
            {/* Existing Taxes */}
            {taxes?.length > 0 ? (
              <div className="p-3">
                <h6 className="text-muted fw-semibold mb-3 px-2">{t('settings.taxes.existing.title')}</h6>
                {taxes.map((tax, index) => (
                  <div
                    key={tax.id}
                    className="mb-3"
                    style={{
                      backgroundColor: '#f8f9fa',
                      borderRadius: '12px',
                      border: '1px solid #e3e6f0',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '';
                    }}
                  >
                    <div className="p-4">
                      <CRow className="align-items-center">
                        <CCol xs={12} md={4} className="mb-3 mb-md-0">
                          <CFormLabel className="mb-2 fw-semibold text-dark">
                            {t('settings.taxes.fields.taxLabel')}
                          </CFormLabel>
                          <CFormInput 
                            value={tax.label} 
                            readOnly 
                            className="fw-medium"
                            style={{ 
                              backgroundColor: 'white',
                              border: '1px solid #dee2e6',
                              borderRadius: '8px',
                              fontSize: '14px'
                            }} 
                          />
                        </CCol>

                        <CCol xs={12} md={3} className="mb-3 mb-md-0">
                          <CFormLabel className="mb-2 fw-semibold text-dark">
                            {t('settings.taxes.fields.taxRate')}
                          </CFormLabel>
                          <CInputGroup>
                            <CFormInput 
                              value={tax.value} 
                              readOnly 
                              className="fw-medium text-center"
                              style={{ 
                                backgroundColor: 'white',
                                border: '1px solid #dee2e6',
                                fontSize: '14px'
                              }} 
                            />
                            <CInputGroupText 
                              style={{ 
                                backgroundColor: '#e9ecef',
                                border: '1px solid #dee2e6',
                                borderLeft: 'none'
                              }}
                            >
                              <FaPercentage size="12" />
                            </CInputGroupText>
                          </CInputGroup>
                        </CCol>

                        <CCol xs={6} md={2} className="mb-3 mb-md-0 text-center">
                          <CFormLabel className="mb-2 fw-semibold text-dark d-block">
                            {t('settings.taxes.fields.default')}
                          </CFormLabel>
                          <div className="d-flex justify-content-center align-items-center" style={{ height: '38px' }}>
                            {tax.isDefault ? (
                              <CBadge 
                                color="success" 
                                className="px-3 py-2"
                                style={{ 
                                  borderRadius: '20px',
                                  fontSize: '11px',
                                  fontWeight: '600'
                                }}
                              >
                                <CIcon icon={cilCheckAlt} className="me-1" size="sm" />
                                {t('settings.taxes.fields.defaultBadge')}
                              </CBadge>
                            ) : (
                              <CTooltip content={t('settings.taxes.fields.setDefault')} placement="top">
                                <CFormCheck
                                  type="radio"
                                  name="defaultTax"
                                  checked={tax.isDefault}
                                  onChange={() => handleDefaultChange(tax.id)}
                                  id={`defaultTax-${tax.id}`}
                                  style={{ transform: 'scale(1.2)' }}
                                />
                              </CTooltip>
                            )}
                          </div>
                        </CCol>

                        <CCol xs={6} md={3} className="text-center">
                          <CFormLabel className="mb-2 fw-semibold text-dark d-block">
                            {t('settings.taxes.fields.actions')}
                          </CFormLabel>
                          <CButton
                            color="light"
                            size="sm"
                            className="p-2"
                            onClick={() => handleDelete(tax.id)}
                            style={{
                              borderRadius: '8px',
                              border: '1px solid #e3e6f0',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#ffe6e6';
                              e.currentTarget.style.borderColor = '#dc3545';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '';
                              e.currentTarget.style.borderColor = '#e3e6f0';
                            }}
                          >
                            <CIcon
                              icon={cilTrash}
                              size="sm"
                              style={{ color: '#dc3545' }}
                            />
                          </CButton>
                        </CCol>
                      </CRow>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              !loading && (
                <div className="text-center py-5">
                  <FaCoins className="text-muted mb-3" style={{ fontSize: '48px', opacity: 0.3 }} />
                  <p className="text-muted mb-1 fs-5">{t('settings.taxes.empty.title')}</p>
                  <small className="text-muted">{t('settings.taxes.empty.subtitle')}</small>
                </div>
              )
            )}

            {/* New Tax Forms */}
            {newTaxes.length > 0 && (
              <div className="p-3 border-top border-light">
                <h6 className="text-muted fw-semibold mb-3 px-2">{t('settings.taxes.new.title')}</h6>
                {newTaxes.map((tax, i) => (
                  <div
                    key={i}
                    className="mb-3"
                    style={{
                      backgroundColor: '#fff7e6',
                      borderRadius: '12px',
                      border: '2px dashed #ffc107',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <div className="p-4">
                      <CRow className="align-items-end">
                        <CCol xs={12} md={4} className="mb-3 mb-md-0">
                          <CFormLabel className="mb-2 fw-semibold text-dark">
                            {t('settings.taxes.new.taxLabelRequired')}
                          </CFormLabel>
                          <CFormInput
                            value={tax.label}
                            onChange={(e) => handleNewTaxChange(i, 'label', e.target.value)}
                            placeholder={t('settings.taxes.new.placeholderLabel')}
                            autoFocus
                            style={{ 
                              borderRadius: '8px',
                              border: '1px solid #ffc107',
                              fontSize: '14px',
                              boxShadow: '0 2px 8px rgba(255, 193, 7, 0.2)'
                            }}
                          />
                        </CCol>

                        <CCol xs={12} md={3} className="mb-3 mb-md-0">
                          <CFormLabel className="mb-2 fw-semibold text-dark">
                            {t('settings.taxes.new.taxRateRequired')}
                          </CFormLabel>
                          <CInputGroup>
                            <CFormInput
                              type="number"
                              value={tax.value}
                              onChange={(e) => handleNewTaxChange(i, 'value', e.target.value)}
                              placeholder={t('settings.taxes.new.placeholderRate')}
                              min={0}
                              max={100}
                              step="0.01"
                              style={{ 
                                borderRadius: '8px 0 0 8px',
                                border: '1px solid #ffc107',
                                fontSize: '14px'
                              }}
                            />
                            <CInputGroupText 
                              style={{ 
                                backgroundColor: '#ffc107',
                                border: '1px solid #ffc107',
                                borderRadius: '0 8px 8px 0',
                                color: 'white',
                                fontWeight: '600'
                              }}
                            >
                              <FaPercentage size="12" />
                            </CInputGroupText>
                          </CInputGroup>
                        </CCol>

                        <CCol xs={12} md={5}>
                          <div className="d-flex gap-2">
                            <CButton
                              color="success"
                              onClick={() => handleSaveNewTax(i)}
                              className="flex-grow-1"
                              disabled={!tax.label.trim() || !tax.value.trim()}
                              style={{ 
                                borderRadius: '8px',
                                fontWeight: '600',
                                boxShadow: '0 4px 12px rgba(72, 180, 97, 0.3)'
                              }}
                            >
                              <CIcon icon={cilSave} className="me-2" />
                              {t('settings.taxes.new.save')}
                            </CButton>
                            <CButton
                              color="light"
                              variant="outline"
                              onClick={() => handleCancelNewTax(i)}
                              className="flex-grow-1"
                              style={{ 
                                borderRadius: '8px',
                                fontWeight: '600',
                                borderColor: '#6c757d',
                                color: '#495057'
                              }}
                            >
                              <CIcon icon={cilX} className="me-2" />
                              {t('settings.taxes.new.cancel')}
                            </CButton>
                          </div>
                        </CCol>
                      </CRow>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CCardBody>
        </CCard>
      )}
    </CContainer>
  );
};

export default TaxesPage;