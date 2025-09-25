import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFormik } from 'formik';
import {
  CModal,
  CModalBody,
  CModalFooter,
  CButton,
  CFormSwitch,
  CFormLabel,
  CSpinner,
} from '@coreui/react';
import axiosInstance from '../../helpers/axiosInstance';
import PageHeader from '../PageHeader';
import { buildProposalPdfHtml, DEFAULT_PROPOSAL_PDF_COLUMNS } from '../../helpers/proposalPdfBuilder';

const BASE_PAGE_WIDTH_PX = 794;

const PrintProposalModal = ({ show, onClose, formData }) => {
  const { t, i18n } = useTranslation();
  const [pdfCustomization, setPdfCustomization] = useState(null);
  const [styleData, setStyleData] = useState(null);
  const [manufacturerNameData, setManufacturerNameData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [modalSize, setModalSize] = useState('xl');
  const [containerPadding, setContainerPadding] = useState(20);
  const [isMobile, setIsMobile] = useState(false);

  const previewContainerRef = useRef(null);
  const previewIframeRef = useRef(null);

  const shortLabel = useCallback(
    (code) => {
      switch (code) {
        case 'L':
          return t('common.short.left', { defaultValue: 'L' });
        case 'R':
          return t('common.short.right', { defaultValue: 'R' });
        case 'B':
          return t('common.short.both', { defaultValue: 'B' });
        default:
          return code ?? t('common.na', 'N/A');
      }
    },
    [t]
  );

  const isContractor = useMemo(() => {
    try {
      const storedUser = JSON.parse(localStorage.getItem('user'));
      if (!storedUser) return false;
      const groupType = storedUser?.group?.group_type || storedUser?.group_type;
      const role = (storedUser?.role || '').toLowerCase();
      return groupType === 'contractor' || role === 'contractor';
    } catch (error) {
      return false;
    }
  }, []);

  const buildHtml = useCallback(
    (values) =>
      buildProposalPdfHtml({
        formData,
        options: {
          selectedColumns: values.selectedColumns,
          showProposalItems: values.showProposalItems,
          showPriceSummary: values.showPriceSummary,
          selectedVersions: values.selectedVersions,
          includeCatalog: true,
        },
        pdfCustomization,
        t,
        i18n,
        shortLabel,
        styleData,
        manufacturerNameData,
      }),
    [formData, pdfCustomization, t, i18n, shortLabel, styleData, manufacturerNameData]
  );

  const fetchPdfCustomization = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/api/settings/customization/pdf');
      setPdfCustomization(response.data || {});
    } catch (error) {
      console.error('Error fetching PDF customization:', error);
    }
  }, []);

  const fetchStyleData = useCallback(async (manufacturerId, styleId) => {
    if (!manufacturerId || !styleId) return;
    try {
      const response = await axiosInstance.get(`/api/manufacturers/${manufacturerId}/styles-meta`);
      const styles = response.data?.styles || [];
      const matchedStyle = styles.find((style) => style.id === styleId);
      setStyleData(matchedStyle || null);
    } catch (error) {
      console.error('Error fetching style data:', error);
    }
  }, []);

  const fetchManufacturerName = useCallback(async (manufacturerId) => {
    if (!manufacturerId) return;
    try {
      const response = await axiosInstance.get(`/api/manufacturers/${manufacturerId}`);
      setManufacturerNameData(response.data || null);
    } catch (error) {
      console.error('Error fetching manufacturer data:', error);
    }
  }, []);

  useEffect(() => {
    if (!show) return;
    fetchPdfCustomization();
  }, [show, fetchPdfCustomization]);

  useEffect(() => {
    if (!show) return;
    const manufacturerData = Array.isArray(formData?.manufacturersData)
      ? formData.manufacturersData[0]
      : null;
    const manufacturerId = manufacturerData?.manufacturer || manufacturerData?.manufacturerId;
    const styleId = manufacturerData?.selectedStyle || manufacturerData?.styleId;
    fetchStyleData(manufacturerId, styleId);
    fetchManufacturerName(manufacturerId);
  }, [show, formData?.manufacturersData, fetchStyleData, fetchManufacturerName]);

  const calculateModalSize = useCallback(() => {
    const width = window.innerWidth || document.documentElement.clientWidth || 0;
    if (width < 576) return 'fullscreen';
    if (width < 768) return 'lg';
    if (width < 992) return 'xl';
    return 'xl';
  }, []);

  const updateResponsiveState = useCallback(() => {
    const newSize = calculateModalSize();
    setModalSize(newSize);
    setIsMobile(newSize === 'fullscreen');

    const width = window.innerWidth || document.documentElement.clientWidth || 0;
    const dynamicPadding = Math.max(12, Math.min(32, Math.round(width * 0.04)));
    setContainerPadding(dynamicPadding);
  }, [calculateModalSize]);

  useLayoutEffect(() => {
    updateResponsiveState();
    window.addEventListener('resize', updateResponsiveState);
    return () => window.removeEventListener('resize', updateResponsiveState);
  }, [updateResponsiveState]);

  useEffect(() => {
    if (!showPreview) return;
    const iframe = previewIframeRef.current;
    if (!iframe) return;

    const adjustHeight = () => {
      try {
        const body = iframe.contentDocument?.body;
        if (body) iframe.style.height = `${body.scrollHeight}px`;
      } catch (error) {
        /* ignore cross-domain errors */
      }
    };

    iframe.addEventListener('load', adjustHeight);
    const timeoutId = setTimeout(adjustHeight, 150);
    return () => {
      iframe.removeEventListener('load', adjustHeight);
      clearTimeout(timeoutId);
    };
  }, [previewHtml, showPreview]);

  const formik = useFormik({
    initialValues: {
      showProposalItems: true,
      showGroupItems: true,
      showPriceSummary: true,
      selectedVersions: [],
      selectedColumns: DEFAULT_PROPOSAL_PDF_COLUMNS,
    },
    enableReinitialize: false,
    onSubmit: async (values, helpers) => {
      await handleDownload(values);
      helpers.setSubmitting(false);
    },
  });

  const refreshPreview = useCallback(
    (nextValues) => {
      if (!showPreview) return;
      const html = buildHtml(nextValues);
      setPreviewHtml(html);
    },
    [buildHtml, showPreview]
  );

  useEffect(() => {
    if (!showPreview) return;
    const html = buildHtml(formik.values);
    setPreviewHtml(html);
  }, [showPreview, buildHtml, pdfCustomization, styleData, manufacturerNameData]);

  const handleDownload = useCallback(
    async (values) => {
      try {
        setIsLoading(true);
        const htmlContent = buildHtml(values);
        const response = await axiosInstance.post(
          '/api/generate-pdf',
          {
            html: htmlContent,
            options: {
              format: 'A4',
              margin: {
                top: '20mm',
                right: '20mm',
                bottom: '20mm',
                left: '20mm',
              },
            },
          },
          { responseType: 'blob' }
        );

        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'quote.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Error generating PDF:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [buildHtml]
  );

  const handlePrint = useCallback(
    (values) => {
      const htmlContent = buildHtml(values);
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        printWindow.onload = () => {
          printWindow.print();
          printWindow.close();
        };
      } else {
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        document.body.appendChild(iframe);
        const doc = iframe.contentWindow?.document;
        if (doc) {
          doc.open();
          doc.write(htmlContent);
          doc.close();
          iframe.onload = () => {
            iframe.contentWindow?.print();
            setTimeout(() => document.body.removeChild(iframe), 1000);
          };
        }
      }
    },
    [buildHtml]
  );

  const openPreview = useCallback(
    (values) => {
      setShowPreview(true);
      const htmlContent = buildHtml(values);
      setPreviewHtml(htmlContent);
      requestAnimationFrame(() => requestAnimationFrame(() => updateResponsiveState()));
    },
    [buildHtml, updateResponsiveState]
  );

  const onToggle = useCallback(
    (field) => (event) => {
      formik.handleChange(event);
      const nextValues = { ...formik.values, [field]: event.target.checked };
      refreshPreview(nextValues);
    },
    [formik, refreshPreview]
  );

  const onCheckboxListChange = useCallback(
    (field, value) => (event) => {
      const nextValues = { ...formik.values };
      const list = new Set(nextValues[field]);
      if (event.target.checked) {
        list.add(value);
      } else {
        list.delete(value);
      }
      if (field === 'selectedColumns' && list.size === 0) return; // keep at least one column
      nextValues[field] = Array.from(list);
      formik.setFieldValue(field, nextValues[field]);
      refreshPreview(nextValues);
    },
    [formik, refreshPreview]
  );

  const manufacturerData = useMemo(() => {
    if (!formData?.manufacturersData) return [];
    if (Array.isArray(formData.manufacturersData)) return formData.manufacturersData;
    try {
      const parsed = JSON.parse(formData.manufacturersData);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }, [formData?.manufacturersData]);

  const versionOptions = manufacturerData.map((item) => ({
    value: item.versionName,
    label: item.versionName,
  }));

  const columnOptions = useMemo(
    () => [
      { value: 'no', label: t('proposalColumns.no') },
      { value: 'qty', label: t('proposalColumns.qty'), isFixed: true },
      { value: 'item', label: t('proposalColumns.item') },
      { value: 'assembled', label: t('proposalColumns.assembled') },
      { value: 'hingeSide', label: t('proposalColumns.hingeSide') },
      { value: 'exposedSide', label: t('proposalColumns.exposedSide') },
      { value: 'price', label: t('proposalColumns.price'), isFixed: true },
      { value: 'assemblyCost', label: t('proposalColumns.assemblyCost') },
      { value: 'total', label: t('proposalColumns.total') },
    ],
    [t]
  );

  return (
    <>
      <CModal
        visible={show}
        onClose={onClose}
        size={isMobile ? 'fullscreen' : 'lg'}
        alignment="center"
        scrollable
        className={isMobile ? 'print-quote-mobile-modal' : ''}
      >
        <PageHeader title={t('proposalCommon.printTitle')} onClose={onClose} />
        <form onSubmit={formik.handleSubmit}>
          <CModalBody className="pt-0">
            <div className="mb-4 p-3 bg-light rounded" style={{ border: '1px solid #e3e6ea' }}>
              <div className="fw-semibold text-uppercase small mb-2" style={{ letterSpacing: '.5px' }}>
                {t('proposalCommon.visibilityOptions', 'Visibility Options')}
              </div>
              <div className="row g-3">
                <div className="col-12 col-md-4 d-flex align-items-center">
                  <CFormSwitch
                    id="showProposalItems"
                    label={<span className="fw-medium">{t('proposalCommon.showProposalItems')}</span>}
                    checked={formik.values.showProposalItems}
                    onChange={onToggle('showProposalItems')}
                    className="me-2"
                  />
                </div>
                <div className="col-12 col-md-4 d-flex align-items-center">
                  <CFormSwitch
                    id="showGroupItems"
                    label={<span className="fw-medium">{t('proposalCommon.showGroupItems')}</span>}
                    checked={formik.values.showGroupItems}
                    onChange={onToggle('showGroupItems')}
                    className="me-2"
                  />
                </div>
                <div className="col-12 col-md-4 d-flex align-items-center">
                  <CFormSwitch
                    id="showPriceSummary"
                    label={<span className="fw-medium">{t('proposalCommon.showPriceSummary', 'Show Price Summary')}</span>}
                    checked={formik.values.showPriceSummary}
                    onChange={onToggle('showPriceSummary')}
                    className="me-2"
                  />
                </div>
              </div>
            </div>

            {!isContractor && versionOptions.length > 0 && (
              <div className="mb-4 p-3 border rounded" style={{ border: '1px solid #e3e6ea' }}>
                <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                  <CFormLabel htmlFor="selectedVersions" className="fw-medium mb-0">
                    {t('proposalCommon.selectVersion')}
                  </CFormLabel>
                  {versionOptions.length > 1 && (
                    <div className="small d-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => {
                          const all = versionOptions.map((option) => option.value);
                          formik.setFieldValue('selectedVersions', all);
                          refreshPreview({ ...formik.values, selectedVersions: all });
                        }}
                      >
                        {t('common.selectAll', 'Select All')}
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => {
                          formik.setFieldValue('selectedVersions', []);
                          refreshPreview({ ...formik.values, selectedVersions: [] });
                        }}
                      >
                        {t('common.clear', 'Clear')}
                      </button>
                    </div>
                  )}
                </div>
                <div className={isMobile ? 'd-flex flex-column gap-2' : 'row g-2'} role="group" aria-label={t('proposalCommon.selectVersion')}>
                  {versionOptions.map((opt) => {
                    const checked = formik.values.selectedVersions.includes(opt.value);
                    return (
                      <div key={opt.value} className={isMobile ? '' : 'col-6 col-md-4'}>
                        <label
                          className={`d-flex align-items-center rounded border p-2 small ${isMobile ? 'w-100' : ''}`}
                          style={{ gap: '8px', background: checked ? '#eef6ff' : '#fff', cursor: 'pointer', minHeight: 42 }}
                        >
                          <input
                            type="checkbox"
                            value={opt.value}
                            checked={checked}
                            onChange={onCheckboxListChange('selectedVersions', opt.value)}
                            style={{ marginRight: 4 }}
                          />
                          <span className="text-truncate" style={{ maxWidth: '100%' }}>
                            {opt.label}
                          </span>
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mb-3 p-3 border rounded" style={{ border: '1px solid #e3e6ea' }}>
              <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                <CFormLabel htmlFor="selectedColumns" className="fw-medium mb-0">
                  {t('proposalCommon.selectColumns')}
                </CFormLabel>
                <div className="small d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => {
                      formik.setFieldValue('selectedColumns', DEFAULT_PROPOSAL_PDF_COLUMNS);
                      refreshPreview({ ...formik.values, selectedColumns: DEFAULT_PROPOSAL_PDF_COLUMNS });
                    }}
                  >
                    {t('common.selectAll', 'Select All')}
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => {
                      const minimal = ['no'];
                      formik.setFieldValue('selectedColumns', minimal);
                      refreshPreview({ ...formik.values, selectedColumns: minimal });
                    }}
                  >
                    {t('common.clear', 'Clear')}
                  </button>
                </div>
              </div>
              <div className={isMobile ? 'd-flex flex-column gap-2' : 'row g-2'} role="group" aria-label={t('proposalCommon.selectColumns')}>
                {columnOptions.map((opt) => {
                  const checked = formik.values.selectedColumns.includes(opt.value);
                  return (
                    <div key={opt.value} className={isMobile ? '' : 'col-6 col-md-4'}>
                      <label
                        className={`d-flex align-items-center rounded border p-2 small ${isMobile ? 'w-100' : ''}`}
                        style={{ gap: '8px', background: checked ? '#eef6ff' : '#fff', cursor: 'pointer', minHeight: 42 }}
                      >
                          <input
                            type="checkbox"
                            value={opt.value}
                            checked={checked}
                            onChange={onCheckboxListChange('selectedColumns', opt.value)}
                            disabled={opt.isFixed}
                            style={{ marginRight: 4, cursor: opt.isFixed ? 'not-allowed' : 'pointer' }}
                          />
                          <span
                            className="text-truncate"
                            style={{ maxWidth: '100%', color: opt.isFixed ? '#6c757d' : undefined }}
                          >
                            {opt.label}
                          </span>
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          </CModalBody>

          <CModalFooter className={`border-top-0 pt-0 ${isMobile ? 'flex-column gap-2' : ''}`}>
            <div className={`d-flex ${isMobile ? 'w-100 flex-column gap-2' : 'align-items-center gap-2'}`} style={{ width: '100%' }}>
              <div className={`d-flex ${isMobile ? 'w-100 flex-column gap-2' : 'gap-2 ms-auto'}`}>
                <CButton color="secondary" onClick={onClose} variant="outline" className={isMobile ? 'w-100' : 'px-4'}>
                  {t('common.cancel')}
                </CButton>
                {!isMobile && (
                  <CButton
                    color="info"
                    onClick={() => openPreview(formik.values)}
                    variant="outline"
                    className="px-4"
                  >
                    <i className="cil-magnifying-glass me-2"></i>
                    {t('proposalCommon.preview', 'Preview')}
                  </CButton>
                )}
                <CButton
                  color="success"
                  onClick={() => handlePrint(formik.values)}
                  variant="outline"
                  className={isMobile ? 'w-100' : 'px-4'}
                >
                  <i className="cil-print me-2"></i>
                  {t('proposalCommon.print', 'Print')}
                </CButton>
                <CButton
                  color="primary"
                  type="submit"
                  className={isMobile ? 'w-100' : 'px-4'}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <CSpinner size="sm" className="me-2" />
                      {t('proposalCommon.downloading')}
                    </>
                  ) : (
                    <>
                      <i className="cil-cloud-download me-2"></i>
                      {t('proposalCommon.downloadPdf')}
                    </>
                  )}
                </CButton>
              </div>
            </div>
          </CModalFooter>
        </form>
      </CModal>

      {isMobile && (
        <style>{`
          .print-quote-mobile-modal .modal-content { border-radius: 0; min-height: 100vh; }
          .print-quote-mobile-modal .modal-body { max-height: calc(100vh - 160px); overflow-y: auto; }
          .print-quote-mobile-modal .modal-footer { position: sticky; bottom: 0; background: #fff; box-shadow: 0 -2px 4px rgba(0,0,0,0.06); }
          @media (max-width: 575.98px) {
            .print-quote-mobile-modal .btn { font-size: 0.95rem; }
          }
        `}</style>
      )}

      <CModal
        visible={showPreview}
        onClose={() => setShowPreview(false)}
        size={modalSize}
        alignment="center"
        scrollable
        data-testid="quote-preview"
      >
        <PageHeader title={t('proposalCommon.previewTitle', 'Quote Preview')} onClose={() => setShowPreview(false)} />
        <CModalBody style={{ padding: 0 }} className="quote-preview-content">
          <div
            ref={previewContainerRef}
            style={{
              maxHeight:
                window.innerWidth < 768
                  ? 'calc(100vh - 120px)'
                  : window.innerWidth < 992
                  ? '75vh'
                  : '80vh',
              overflow: 'auto',
              background: '#f8f9fa',
              padding: containerPadding,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <iframe
                ref={previewIframeRef}
                title="quote-preview-frame"
                srcDoc={previewHtml || '<html><body style="font-family:sans-serif;padding:2rem;">Loading...</body></html>'}
                style={{
                  width: BASE_PAGE_WIDTH_PX,
                  minHeight: '1120px',
                  border: '1px solid #d0d7de',
                  background: 'white',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                }}
              />
            </div>
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowPreview(false)} variant="outline">
            {t('common.close')}
          </CButton>
          <CButton color="primary" onClick={() => handleDownload(formik.values)} disabled={isLoading}>
            {isLoading ? (
              <>
                <CSpinner size="sm" className="me-2" />
                {t('proposalCommon.downloading')}
              </>
            ) : (
              <>
                <i className="cil-cloud-download me-2"></i>
                {t('proposalCommon.downloadPdf')}
              </>
            )}
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  );
};

export default PrintProposalModal;