import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useFormik } from 'formik';
import {
    CModal,
    CModalHeader,
    CModalTitle,
    CModalBody,
    CModalFooter,
    CButton,
    CFormSwitch,
    CFormLabel,
} from '@coreui/react';
import Select from 'react-select';
import axiosInstance from '../../helpers/axiosInstance';

const PrintProposalModal = ({ show, onClose, formData }) => {
    const { t, i18n } = useTranslation();
         // helper to localize short codes for hinge/exposed side
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
    const api_url = import.meta.env.VITE_API_URL;
    const selectedVersion = useSelector((state) => state.selectedVersion.data);
    const selectVersionNew = useSelector(state => state.selectVersionNew.data);
    const [isLoading, setIsLoading] = useState(false);
    const [pdfCustomization, setPdfCustomization] = useState(null);

    // Determine if current user is a contractor (hide internal-only controls)
    const loggedInUser = (() => {
        try {
            return JSON.parse(localStorage.getItem('user'));
        } catch (_) {
            return null;
        }
    })();
    const isContractor = !!(
        (loggedInUser?.group && loggedInUser.group.group_type === 'contractor') ||
        (loggedInUser?.role && String(loggedInUser.role).toLowerCase() === 'contractor')
    );

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


    // Generate HTML template
    const generateHTMLTemplate = (values) => {
        const logoUrl = headerLogo ? `${api_url}${headerLogo}` : null;

        const selectedCols = values.selectedColumns;
        const columnHeaders = selectedCols.map(col => {
            const colName = col === 'no' ? t('proposalColumns.no') :
                col === 'qty' ? t('proposalColumns.qty') :
                    col === 'item' ? t('proposalColumns.item') :
                        col === 'assembled' ? t('proposalColumns.assembled') :
                            col === 'hingeSide' ? t('proposalColumns.hingeSide') :
                                col === 'exposedSide' ? t('proposalColumns.exposedSide') :
                                    col === 'price' ? t('proposalColumns.price') :
                                        col === 'assemblyCost' ? t('proposalColumns.assemblyCost') :
                                            col === 'total' ? t('proposalColumns.total') : col;
            return `<th>${colName}</th>`;
        }).join('');

        const proposalItemRows = proposalItems.map((item, index) => {
            const cells = selectedCols.map(col => {
                switch (col) {
                    case 'no': return `<td>${index + 1}</td>`;
                    case 'item': return `<td>${item.item}</td>`;
                    case 'qty': return `<td>${item.qty}</td>`;
                    case 'assembled': return `<td>${item.assembled}</td>`;
                    case 'hingeSide': return `<td>${shortLabel(item.hingeSide)}</td>`;
                    case 'exposedSide': return `<td>${shortLabel(item.exposedSide)}</td>`;
                    case 'price': return `<td>$${item.price.toFixed(2)}</td>`;
                    case 'assemblyCost': return `<td>$${item.assemblyCost.toFixed(2)}</td>`;
                    case 'total': return `<td>$${item.total.toFixed(2)}</td>`;
                    default: return '<td></td>';
                }
            }).join('');
            return `<tr>${cells}</tr>`;
        }).join('');

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
                        <td style="border: 1px solid #ccc; padding: 5px;">${shortLabel(item.hingeSide)}</td>
                        <td style="border: 1px solid #ccc; padding: 5px;">${shortLabel(item.exposedSide)}</td>
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

    const downloadWithPuppeteer = async (values) => {
        try {
            const htmlContent = generateHTMLTemplate(values);
            setIsLoading(true);
            const response = await axiosInstance.post('/api/generate-pdf', {
                html: htmlContent,
                options: {
                    format: 'A4',
                    margin: {
                        top: '20mm',
                        right: '20mm',
                        bottom: '20mm',
                        left: '20mm'
                    }
                }
            }, {
                responseType: 'blob'
            });

            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'proposal.pdf';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

        } catch (error) {
            console.error('Error generating PDF:', error);
        } finally {
            setIsLoading(false);
        }
    };





    const formik = useFormik({
        initialValues: {
            showProposalItems: true,
            showGroupItems: true,
            selectedVersions: [],
            selectedColumns: ['no', 'qty', 'item', 'assembled', 'hingeSide', 'exposedSide', 'price', 'assemblyCost', 'total'],
        },
        onSubmit: (values) => {
            downloadWithPuppeteer(values);

        }
    });

    // Version and column options (same as before)
    const versionOptions = formData?.manufacturersData?.map((item) => ({
        value: item.versionName,
        label: item.versionName,
    })) || [];

    const columnOptions = [
        { value: 'no', label: 'No.' },
        { value: 'qty', label: 'Qty', isFixed: true },
        { value: 'item', label: 'Item' },
        { value: 'assembled', label: 'Assembled' },
        { value: 'hingeSide', label: 'Hinge Side' },
        { value: 'exposedSide', label: 'Exposed Side' },
        { value: 'price', label: 'Price', isFixed: true },
        { value: 'assemblyCost', label: 'Assembly Cost' },
        { value: 'total', label: 'Total' },
    ];

    return (
        <CModal visible={show} onClose={onClose} size="lg" alignment="center" scrollable>
            <CModalHeader closeButton className="border-bottom-0 pb-0">
                <CModalTitle className="h4">{t('proposalCommon.printTitle')}</CModalTitle>
            </CModalHeader>
            <form onSubmit={formik.handleSubmit}>
                <CModalBody className="pt-0">
                    {/* Same form content as before */}
                    <div className="mb-4 p-3 bg-light rounded">
                        <div className="d-flex gap-4">
                            <div className="d-flex align-items-center">
                                <CFormSwitch
                                    id="showProposalItems"
                                    label={<span className="fw-medium">{t('proposalCommon.showProposalItems')}</span>}
                                    checked={formik.values.showProposalItems}
                                    onChange={formik.handleChange}
                                    className="me-2"
                                />
                            </div>
                            <div className="d-flex align-items-center">
                                <CFormSwitch
                                    id="showGroupItems"
                                    label={<span className="fw-medium">{t('proposalCommon.showGroupItems')}</span>}
                                    checked={formik.values.showGroupItems}
                                    onChange={formik.handleChange}
                                    className="me-2"
                                />
                            </div>
                        </div>
                    </div>

                    {!isContractor && (
                        <div className="mb-4">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <CFormLabel htmlFor="selectedVersions" className="fw-medium">
                                    {t('proposalCommon.selectVersion')}
                                </CFormLabel>
                            </div>
                            <Select
                                id="selectedVersions"
                                name="selectedVersions"
                                options={versionOptions}
                                isMulti
                                value={versionOptions.filter(option =>
                                    formik.values.selectedVersions.includes(option.value)
                                )}
                                onChange={(selected) => {
                                    formik.setFieldValue(
                                        'selectedVersions',
                                        selected ? selected.map(option => option.value) : []
                                    );
                                }}
                                className="basic-multi-select"
                                classNamePrefix="select"
                                placeholder={t('proposalCommon.selectVersionsPlaceholder')}
                            />
                        </div>
                    )}

                    <div className="mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <CFormLabel htmlFor="selectedColumns" className="fw-medium">
                                {t('proposalCommon.selectColumns')}
                            </CFormLabel>
                        </div>
                        <Select
                            id="selectedColumns"
                            name="selectedColumns"
                            options={columnOptions}
                            isMulti
                            value={columnOptions.filter(option =>
                                formik.values.selectedColumns.includes(option.value)
                            )}
                            onChange={(selected) => {
                                const fixedColumns = columnOptions
                                    .filter(opt => opt.isFixed)
                                    .map(opt => opt.value);
                                const selectedValues = selected
                                    ? [...fixedColumns, ...selected.map(option => option.value)]
                                    : fixedColumns;
                                formik.setFieldValue('selectedColumns', [...new Set(selectedValues)]);
                            }}
                            classNamePrefix="select"
                            placeholder={t('proposalCommon.selectColumnsPlaceholder')}
                        />
                    </div>
                </CModalBody>

                <CModalFooter className="border-top-0 pt-0">
                    <CButton
                        color="secondary"
                        onClick={onClose}
                        variant="outline"
                        className="px-4"
                    >
                        {t('common.cancel')}
                    </CButton>
                    <CButton
                        color="primary"
                        type="submit"
                        className="px-4"
                    >
                        <i className="cil-cloud-download me-2"></i>
                        {isLoading ? t('proposalCommon.downloading') : t('proposalCommon.downloadPdf')}
                    </CButton>
                </CModalFooter>
            </form>
        </CModal>
    );
};

export default PrintProposalModal;