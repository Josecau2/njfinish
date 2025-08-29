import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    CModal,
    CModalHeader,
    CModalTitle,
    CModalBody,
    CModalFooter,
    CFormInput,
    CFormSwitch,
    CFormCheck,
    CFormLabel,
    CButton,
    CSpinner,
} from '@coreui/react';
import Select from 'react-select';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { generateProposalPdfTemplate } from '../../helpers/pdfTemplateGenerator';
import axiosInstance from '../../helpers/axiosInstance'
import { useSelector } from 'react-redux';
import PageHeader from '../PageHeader';



const EmailProposalModal = ({ show, onClose, formData, onSend }) => {
    const { t, i18n } = useTranslation();
        const api_url = import.meta.env.VITE_API_URL;
        const shortLabel = (code) => {
            switch (code) {
                case 'L':
                    return t('common.short.left', { defaultValue: 'L' })
                case 'R':
                    return t('common.short.right', { defaultValue: 'R' })
                case 'B':
                    return t('common.short.both', { defaultValue: 'B' })
                default:
                    return code
            }
        }
    const selectedVersion = useSelector((state) => state.selectedVersion.data);
    const selectVersionNew = useSelector(state => state.selectVersionNew.data);
    const [loading, setLoading] = useState(false);
    const [pdfCustomization, setPdfCustomization] = useState(null);

    // Fetch PDF customization
    const fetchPdfCustomization = async () => {
        try {
            const res = await axiosInstance.get('/api/settings/customization/pdf');
            setPdfCustomization(res.data || {});
        } catch (error) {
            console.error('Error fetching PDF customization:', error);
        }
    };

    useEffect(() => {
        fetchPdfCustomization();
    }, []); // Empty dependency array - only run once on mount

    const {
        companyName,
        companyPhone,
        companyEmail,
        companyAddress,
        companyWebsite,
        headerColor = '#5a2a2a',
        headerLogo,
        pdfFooter,
        headerTxtColor
    } = pdfCustomization || {};


    // Proposal data
    const proposalSummary = {
        description: formData?.description || 'kitchen project',
        customer: formData?.customerName || '',
        date: new Date().toLocaleDateString(i18n.language || 'en-US'),
    };



    const summary = formData?.manufacturersData?.[0]?.summary || {};

    const priceSummary = formData?.manufacturersData?.[0]?.items?.length
        ? {
            cabinets: summary.cabinets || 0,
            assemblyFee: summary.assemblyFee || 0,
            modifications: summary.modificationsCost || 0,
            styleTotal: summary.styleTotal || 0,
            total: summary.total || 0,
            tax: summary.taxAmount || 0,
            grandTotal: summary.grandTotal || 0,
        }
        : {
            cabinets: 0,
            assemblyFee: 0,
            modifications: 0,
            styleTotal: 0,
            total: 0,
            tax: 0,
            grandTotal: 0,
        };

    const items = formData?.manufacturersData?.[0]?.items || [];

    const proposalItems = items.map((item) => ({
        qty: item.qty || 0,
        code: item.code || '',
        assembled: item.isRowAssembled ? t('common.yes') : t('common.no'),
        hingeSide: item.hingeSide || t('common.na'),
        exposedSide: item.exposedSide || t('common.na'),
        price: parseFloat(item.price) || 0,
        assemblyCost: item.includeAssemblyFee ? parseFloat(item.assemblyFee) || 0 : 0,
        total: item.includeAssemblyFee ? parseFloat(item.total) || 0 : parseFloat(item.price) || 0,
        modifications: item.modifications || {}
    }));



    const versions = formData?.manufacturersData?.map((item) => ({
        label: item.versionName,
        value: item.versionName,
    })) || [];


    const columnOptions = [
        { value: 'no', label: t('proposalColumns.no') },
        { value: 'qty', label: t('proposalColumns.qty'), isFixed: true },
        { value: 'item', label: t('proposalColumns.item') },
        { value: 'assembled', label: t('proposalColumns.assembled') },
        { value: 'hingeSide', label: t('proposalColumns.hingeSide') },
        { value: 'exposedSide', label: t('proposalColumns.exposedSide') },
        { value: 'price', label: t('proposalColumns.price'), isFixed: true },
        { value: 'assemblyCost', label: t('proposalColumns.assemblyCost') },
        { value: 'total', label: t('proposalColumns.total') },
    ];
    // Generate HTML template (copied from PrintProposalModal)
    const generateHTMLTemplate = (values) => {
        const logoUrl = headerLogo ? `${api_url}${headerLogo}` : null;
        const selectedCols = values.selectedColumns;
        const columnHeaders = selectedCols
            .map((col) => {
                const colName =
                    col === 'no'
                        ? t('proposalColumns.no')
                        : col === 'qty'
                            ? t('proposalColumns.qty')
                            : col === 'item'
                                ? t('proposalColumns.item')
                                : col === 'assembled'
                                    ? t('proposalColumns.assembled')
                                    : col === 'hingeSide'
                                        ? t('proposalColumns.hingeSide')
                                        : col === 'exposedSide'
                                            ? t('proposalColumns.exposedSide')
                                            : col === 'price'
                                                ? t('proposalColumns.price')
                                                : col === 'assemblyCost'
                                                    ? t('proposalColumns.assemblyCost')
                                                    : col === 'total'
                                                        ? t('proposalColumns.total')
                                                        : col;
                return `<th>${colName}</th>`;
            })
            .join('');

        const proposalItemRows = proposalItems
            .map((item, index) => {
                const cells = selectedCols
                    .map((col) => {
                        switch (col) {
                            case 'no':
                                return `<td>${index + 1}</td>`;
                            case 'qty':
                                return `<td>${item.qty}</td>`;
                            case 'item':
                                return `<td>${item.item}</td>`;
                            case 'assembled':
                                return `<td>${item.assembled}</td>`;
                                case 'hingeSide':
                                    return `<td>${shortLabel(item.hingeSide)}</td>`;
                                case 'exposedSide':
                                    return `<td>${shortLabel(item.exposedSide)}</td>`;
                            case 'price':
                                return `<td>$${item.price.toFixed(2)}</td>`;
                            case 'assemblyCost':
                                return `<td>$${item.assemblyCost.toFixed(2)}</td>`;
                            case 'total':
                                return `<td>$${item.total.toFixed(2)}</td>`;
                            default:
                                return '<td></td>';
                        }
                    })
                    .join('');
                return `<tr>${cells}</tr>`;
            })
            .join('');

        return `
        
        <!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${t('proposalDoc.title')}</title>
    <style>
        @page {
            margin: 20mm;
            size: A4;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
        }

        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 30px;
            padding: 20px;
            border-bottom: 2px solid ${headerColor}; /* Default header color */
            background-color: ${headerColor}; /* Default header color */
        }

        .logo {
            max-width: 120px;
            max-height: 80px;
        }

        .company-name {
            font-size: 24px;
            font-weight: bold;
            color: white;
        }

        .company-info {
            text-align: right;
            line-height: 1.6;
            color: ${headerTxtColor};
        }

        .company-info div {
            margin-bottom: 2px;
        }

        .greeting {
            font-size: 14px;
            margin-bottom: 15px;
            color: #333;
        }

        .description {
            font-size: 12px;
            margin-bottom: 25px;
            color: #666;
        }

        .summary-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }

        .summary-table th {
            background-color: #f8f9fa;
            padding: 12px;
            border: 1px solid #dee2e6;
            font-weight: bold;
            text-align: left;
        }

        .summary-table td {
            padding: 12px;
            border: 1px solid #dee2e6;
        }

        .section-header {
            font-size: 16px;
            font-weight: bold;
            margin: 25px 0 15px 0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }

        .items-table th {
            background-color: #f8f9fa;
            padding: 10px 8px;
            border: 1px solid #dee2e6;
            font-weight: bold;
            text-align: left;
            font-size: 11px;
        }

        .items-table td {
            padding: 8px;
            border: 1px solid #dee2e6;
            font-size: 10px;
        }

        .items-table tr:nth-child(even) {
            background-color: #f9f9f9;
        }

        .category-row {
            background-color: #e6e6e6 !important;
            font-weight: bold;
        }   

        .text-right {
            text-align: right;
        }

        .text-left {
            text-align: left;
        }

        .main-footer-div {
            margin-top: 50px;
            text-align: center;
            color: #666;
            font-size: 10px;
        }

        .price-summary {
            background-color: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 0.5rem;
            padding: 1rem;
            margin-top: 1rem;
            font-family: 'Arial', sans-serif;
            font-size: 0.95rem;
        }

        .price-summary table {
            width: 100%;
            border-collapse: collapse;
        }

        .price-summary td {
            padding: 0.25rem 0;
        }

        .price-summary .text-left {
            text-align: left;
            color: #212529;
            font-weight: 500;
        }

        .price-summary .text-right {
            text-align: right;
            color: #212529;
            font-weight: 500;
        }

        .price-summary .total-row {
            font-weight: bold;
            border-bottom: 1px solid #ced4da;
            padding-top: 0.25rem;
        }

        .price-summary .grand-total {
            font-weight: bold;
            font-size: 1.05rem;
            color: #1a1a1a;
            padding-top: 0.75rem;
        }

        @media print {
            body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            
            .page-break {
                page-break-before: always;
            }
        }
    </style>
</head>
<body>
    <!-- Header Section -->
    <div class="header">
        <div>
            ${logoUrl ? `<img src="${logoUrl}" alt="${t('proposalDoc.altCompanyLogo')}" class="logo">` : `<div class="company-name">${companyName || t('proposalDoc.fallbackCompanyName')}</div>`}
        </div>
        <div class="company-info">
            <div><strong>${companyName || ''}</strong></div>
            <div>${companyPhone || ''}</div>
            <div>${companyEmail || ''}</div>
            <div>${companyWebsite || ''}</div>
            <div>${companyAddress || ''}</div>
        </div>
    </div>

    <!-- Greeting -->
    <div class="greeting">
    ${t('proposalDoc.greeting', { name: proposalSummary.customer })}
    </div>

    <div class="description">
    ${t('proposalDoc.descriptionIntro')}
    </div>

    <!-- Proposal Summary -->
    <table class="summary-table">
        <thead>
            <tr>
                <th>${t('proposalDoc.summary.description')}</th>
                <!--  <th>Customer</th>-->
                <th>${t('proposalDoc.summary.date')}</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>${proposalSummary.description}</td>
                <!--  <td>${proposalSummary.customer}</td> -->
                <td>${proposalSummary.date}</td>
            </tr>
        </tbody>
    </table>

    ${proposalItems && proposalItems.length > 0 ? `
    <!-- Proposal Items Section -->
    <div class="section-header">${t('proposalDoc.sections.proposalItems')}</div>
    <table class="items-table">
        <thead>
            <tr style="background-color: #f0f0f0;">
                <th style="border: 1px solid #ccc; padding: 5px;">${t('proposalColumns.no')}</th>
                <th style="border: 1px solid #ccc; padding: 5px;">${t('proposalColumns.qty')}</th>
                <th style="border: 1px solid #ccc; padding: 5px;">${t('proposalColumns.item')}</th>
                <th style="border: 1px solid #ccc; padding: 5px;">${t('proposalColumns.assembled')}</th>
                <th style="border: 1px solid #ccc; padding: 5px;">${t('proposalColumns.hingeSide')}</th>
                <th style="border: 1px solid #ccc; padding: 5px;">${t('proposalColumns.exposedSide')}</th>
                <th style="border: 1px solid #ccc; padding: 5px;">${t('proposalColumns.price')}</th>
                <th style="border: 1px solid #ccc; padding: 5px;">${t('proposalColumns.assemblyCost')}</th>
                <th style="border: 1px solid #ccc; padding: 5px;">${t('proposalColumns.total')}</th>
            </tr>
        </thead>
        <tbody>
            <!-- Category Row -->
            <tr class="category-row">
                <td colspan="9" style="padding: 6px;"><strong>${t('proposalColumns.items')}</strong></td>
            </tr>
            <!-- Dynamically inserted rows -->
            ${proposalItems
                    .map((item, index) => {
                        const itemRow = `
                    <tr>
                        <td style="border: 1px solid #ccc; padding: 5px;">${index + 1}</td>
                        <td style="border: 1px solid #ccc; padding: 5px;">${item.qty}</td>
                        <td style="border: 1px solid #ccc; padding: 5px;">${item.code || ''}</td>
                        <td style="border: 1px solid #ccc; padding: 5px;">${item.assembled}</td>
                        <td style="border: 1px solid #ccc; padding: 5px;">${item.hingeSide}</td>
                        <td style="border: 1px solid #ccc; padding: 5px;">${item.exposedSide}</td>
                        <td style="border: 1px solid #ccc; padding: 5px;">$${parseFloat(item.price).toFixed(2)}</td>
                        <td style="border: 1px solid #ccc; padding: 5px;">$${item.includeAssemblyFee ? parseFloat(item.assemblyFee).toFixed(2) : '0.00'}</td>
                        <td style="border: 1px solid #ccc; padding: 5px;">$${parseFloat(item.total).toFixed(2)}</td>
                    </tr>
                    `;
                        const modRows = item.modifications && item.modifications.length > 0
                            ? `
                        <tr>
                            <td colspan="9" style="padding: 5px;  background-color: #f9f9f9;"><strong>${t('proposalDoc.modifications')}</strong></td>
                        </tr>
                        ${item.modifications
                                .map((mod, modIdx) => {
                                    const modTotal = (parseFloat(mod.price) || 0) * (mod.qty || 0);
                                    return `
                                    <tr>
                                        <td  padding: 5px;">-</td>
                                        <td  padding: 5px;">${mod.qty || ''}</td>
                                        <td  padding: 5px;">${mod.name || ''}</td>
                                        <td colspan="3"  padding: 5px;"></td>
                                        <td  padding: 5px;">$${(parseFloat(mod.price) || 0).toFixed(2)}</td>
                                        <td  padding: 5px;"></td>
                                        <td  padding: 5px;">$${modTotal.toFixed(2)}</td>
                                    </tr>
                                `;
                                })
                                .join('')}
                        `
                            : '';
                        return itemRow + modRows;
                    })
                    .join('')}
        </tbody>
    </table>
    <!-- Price Summary -->
    <div class="price-summary">
        <table>
            <tr>
                <td class="text-left">${t('proposalDoc.priceSummary.cabinets')}</td>
                <td class="text-right">$${priceSummary.cabinets.toFixed(2)}</td>
            </tr>
            <tr>
                <td class="text-left">${t('proposalDoc.priceSummary.assembly')}</td>
                <td class="text-right">$${priceSummary.assemblyFee.toFixed(2)}</td>
            </tr>
            <tr class="total-row">
                <td class="text-left">${t('proposalDoc.priceSummary.modifications')}</td>
                <td class="text-right">$${priceSummary.modifications.toFixed(2)}</td>
            </tr>
            <tr >
                <td class="text-left">${t('proposalDoc.priceSummary.styleTotal')}</td>
                <td class="text-right">$${priceSummary.styleTotal.toFixed(2)}</td>
            </tr>
            <tr >
                <td class="text-left">${t('proposalDoc.priceSummary.total')}</td>
                <td class="text-right">$${priceSummary.total.toFixed(2)}</td>
            </tr>
            <tr class="total-row">
                <td class="text-left">${t('proposalDoc.priceSummary.tax')}</td>
                <td class="text-right">$${priceSummary.tax.toFixed(2)}</td>
            </tr>
            <tr class="grand-total">
                <td class="text-left">${t('proposalDoc.priceSummary.grandTotal')}</td>
                <td class="text-right">$${priceSummary.grandTotal.toFixed(2)}</td>
            </tr>
        </table>
    </div>
    ` : ''}

    ${formData?.selectedCatalog?.length > 0 ? `
    <!-- Catalog Items -->
    <div class="section-header">${t('proposalDoc.sections.catalogItems')}</div>
    <table class="items-table">
        <thead>
            <tr>
                <th>${t('proposalDoc.catalog.itemName')}</th>
                <th>${t('proposalDoc.catalog.quantity')}</th>
                <th>${t('proposalDoc.catalog.unitPrice')}</th>
                <th>${t('proposalDoc.catalog.total')}</th>
            </tr>
        </thead>
        <tbody>
            ${formData.selectedCatalog.map(item => `
            <tr>
                <td>${item.itemName || ''}</td>
                <td>${item.quantity || 0}</td>
                <td>$${item.unitPrice || 0}</td>
                <td>$${(item.unitPrice * item.quantity).toFixed(2)}</td>
            </tr>
            `).join('')}
        </tbody>
    </table>
    ` : ''}

    <!-- Footer -->
    <div class="main-footer-div">
        ${pdfFooter}
    </div>
</body>
</html>

        `;
    };

    const formik = useFormik({
        initialValues: {
            email: formData?.customerEmail || '',
            body: '',
            versions: [],
            sendCopy: true,
            updateCustomerEmail: false,
            selectedColumns: [
                'no',
                'qty',
                'item',
                'assembled',
                'hingeSide',
                'exposedSide',
                'price',
                'assemblyCost',
                'total',
            ],
        },
        enableReinitialize: true,
        validationSchema: Yup.object({
            email: Yup.string()
                .email('Invalid email')
                .required('Email is required'),
            body: Yup.string().required('Email body is required'),
            versions: Yup.array().min(1, 'Select at least one version'),
            selectedColumns: Yup.array().min(
                1,
                'Select at least one column'
            ),
        }),
        onSubmit: async (values) => {
            try {
                setLoading(true);
                const htmlContent = generateHTMLTemplate(values);
                await axiosInstance.post('/api/proposals/send-email', {
                    email: values.email,
                    body: values.body,
                    versions: values.versions.map((v) => v.value).join(', '),
                    sendCopy: values.sendCopy,
                    htmlContent, // Send HTML content to backend
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

    return (
        <CModal visible={show} onClose={onClose} alignment="center" size="lg" scrollable>
            <PageHeader 
                title={t('proposalCommon.emailTitle')} 
                onClose={onClose}
            />

            <form onSubmit={formik.handleSubmit}>
                <CModalBody className="px-4 pb-4">
                    {/* Email */}
                    <div className="mb-4">
                        <CFormLabel htmlFor="email" className="fw-semibold">{t('proposalCommon.emailAddress')}</CFormLabel>
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

                    {/* Email Body */}
                    <div className="mb-4">
                        <CFormLabel htmlFor="body" className="fw-semibold">{t('proposalCommon.emailBody')}</CFormLabel>
                        <div className="border rounded p-2 bg-body">
                            <CKEditor
                                editor={ClassicEditor}
                                data={formik.values.body}
                                disabled={loading}
                                onChange={(_, editor) => formik.setFieldValue('body', editor.getData())}
                                onBlur={() => formik.setFieldTouched('body', true)}
                            />
                        </div>
                        {formik.touched.body && formik.errors.body && (
                            <div className="text-danger small mt-1">{formik.errors.body}</div>
                        )}
                    </div>

                    {/* Include Proposal Items Toggle */}
                    <div className="mb-4 d-flex align-items-center gap-2">
                        <CFormSwitch
                            id="sendCopy"
                            name="sendCopy"
                            className="me-1"
                            checked={formik.values.sendCopy}
                            onChange={formik.handleChange}
                            disabled={loading}
                            size="md"
                            style={{ transform: "scale(1.5)" }}
                        />
                        <CFormLabel htmlFor="sendCopy" className="mb-0">{t('proposalCommon.includeItems')}</CFormLabel>
                    </div>

                    {/* Version Multi-select */}
                    <div className="mb-4">
                        <CFormLabel className="fw-semibold">{t('proposalCommon.selectVersion')}</CFormLabel>
                        <Select
                            isMulti
                            name="versions"
                            options={versions}
                            classNamePrefix="react-select"
                            value={formik.values.versions}
                            placeholder={t('proposalCommon.selectVersionsPlaceholder')}
                            onChange={(selected) => formik.setFieldValue('versions', selected)}
                            onBlur={() => formik.setFieldTouched('versions', true)}
                            isDisabled={loading}
                        />
                        {formik.touched.versions && formik.errors.versions && (
                            <div className="text-danger small mt-1">{formik.errors.versions}</div>
                        )}
                    </div>

                    {/* Update Customer Email Checkbox */}
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
                        <CFormLabel
                            htmlFor="updateCustomerEmail"
                            className="line-height-2 mb-0 fw-semibold"
                        >
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