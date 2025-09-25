import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CModal,
  CModalBody,
  CModalFooter,
  CFormInput,
  CFormSwitch,
  CFormCheck,
  CFormLabel,
  CFormTextarea,
  CButton,
  CSpinner,
} from '@coreui/react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axiosInstance from '../../helpers/axiosInstance';
import PageHeader from '../PageHeader';
import { buildProposalPdfHtml, DEFAULT_PROPOSAL_PDF_COLUMNS } from '../../helpers/proposalPdfBuilder';

const EmailProposalModal = ({ show, onClose, formData, onSend }) => {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [pdfCustomization, setPdfCustomization] = useState(null);
  const [styleData, setStyleData] = useState(null);
  const [manufacturerNameData, setManufacturerNameData] = useState(null);

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

  const fetchPdfCustomization = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/api/settings/customization/pdf');
      setPdfCustomization(res.data || {});
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

  const buildHtml = useCallback(
    (values) =>
      buildProposalPdfHtml({
        formData,
        options: {
          selectedColumns: values.selectedColumns,
          showProposalItems: true,
          showPriceSummary: true,
          selectedVersions: [],
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

  const formik = useFormik({
    initialValues: {
      email: formData?.customerEmail || '',
      body: '',
      sendCopy: true,
      updateCustomerEmail: false,
      selectedColumns: DEFAULT_PROPOSAL_PDF_COLUMNS.slice(),
    },
    enableReinitialize: true,
    validationSchema: Yup.object({
      email: Yup.string()
        .email(t('proposalCommon.validation.invalidEmail'))
        .required(t('proposalCommon.validation.emailRequired')),
      body: Yup.string().required(t('proposalCommon.validation.bodyRequired')),
      selectedColumns: Yup.array().min(1, t('proposalCommon.validation.selectAtLeastOneColumn')),
    }),
    onSubmit: async (values) => {
      try {
        setLoading(true);
        const htmlContent = buildHtml(values);
        const htmlBody = (values.body || '')
          .split(/\r?\n/)
          .map((line) => (line.length ? line : '&nbsp;'))
          .join('<br />');
        await axiosInstance.post('/api/proposals/send-email', {
          email: values.email,
          body: htmlBody,
          sendCopy: values.sendCopy,
          updateCustomerEmail: values.updateCustomerEmail,
          htmlContent,
        });
        setLoading(false);
        onClose();
        if (onSend) onSend();
      } catch (error) {
        setLoading(false);
        console.error('Send email failed:', error);
      }
    },
  });

  const catalogCount = useMemo(() => {
    const catalog = formData?.selectedCatalog;
    if (!catalog) return 0;
    if (Array.isArray(catalog)) return catalog.length;
    try {
      const parsed = JSON.parse(catalog);
      return Array.isArray(parsed) ? parsed.length : 0;
    } catch (error) {
      return 0;
    }
  }, [formData?.selectedCatalog]);

  return (
    <CModal visible={show} onClose={onClose} alignment="center" size="lg" scrollable>
      <PageHeader title={t('proposalCommon.emailTitle')} onClose={onClose} />

      <form onSubmit={formik.handleSubmit}>
        <CModalBody className="px-4 pb-4">
          <div className="mb-4">
            <CFormLabel htmlFor="email" className="fw-semibold">
              {t('proposalCommon.emailAddress')}
            </CFormLabel>
            <CFormInput
              id="email"
              type="email"
              name="email"
              placeholder={t('proposalCommon.emailPlaceholder')}
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              disabled={loading}
            />
            {formik.touched.email && formik.errors.email && (
              <div className="text-danger small mt-1">{formik.errors.email}</div>
            )}
          </div>

          <div className="mb-4">
            <CFormLabel htmlFor="body" className="fw-semibold">
              {t('proposalCommon.emailBody')}
            </CFormLabel>
            <div className="border rounded p-2 bg-body">
              <CFormTextarea
                id="body"
                name="body"
                rows={6}
                value={formik.values.body}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                disabled={loading}
                placeholder={t('proposalCommon.emailBodyPlaceholder', 'Write your message...')}
              />
            </div>
            {formik.touched.body && formik.errors.body && (
              <div className="text-danger small mt-1">{formik.errors.body}</div>
            )}
          </div>

          <div className="mb-4 d-flex align-items-center gap-2">
            <CFormSwitch
              id="sendCopy"
              name="sendCopy"
              className="me-1"
              checked={formik.values.sendCopy}
              onChange={formik.handleChange}
              disabled={loading}
              size="md"
              style={{ transform: 'scale(1.5)' }}
            />
            <CFormLabel htmlFor="sendCopy" className="mb-0">
              {t('proposalCommon.includeItems')}
            </CFormLabel>
          </div>

          {catalogCount > 0 && (
            <div className="mb-3 small text-muted">
              {t('proposalCommon.catalogItemsIncluded', {
                count: catalogCount,
                defaultValue: '{{count}} catalog items will be included in the PDF.',
              })}
            </div>
          )}

          <div className="mb-0 d-flex justify-content-end align-items-center gap-2">
            <CFormCheck
              type="checkbox"
              id="updateCustomerEmail"
              name="updateCustomerEmail"
              checked={formik.values.updateCustomerEmail}
              onChange={formik.handleChange}
              disabled={loading}
              style={{ width: '20px', height: '20px' }}
            />
            <CFormLabel htmlFor="updateCustomerEmail" className="line-height-2 mb-0 fw-semibold">
              {t('proposalCommon.updateCustomerEmail')}
            </CFormLabel>
          </div>
        </CModalBody>

        <CModalFooter className="px-4 pb-4">
          <CButton color="secondary" variant="outline" onClick={onClose} disabled={loading}>
            {t('common.cancel')}
          </CButton>
          <CButton type="submit" color="primary" disabled={loading}>
            {loading ? (
              <>
                <CSpinner size="sm" className="me-2" />
                {t('proposalCommon.sending')}
              </>
            ) : (
              t('proposalCommon.sendEmail')
            )}
          </CButton>
        </CModalFooter>
      </form>
    </CModal>
  );
};

export default EmailProposalModal;