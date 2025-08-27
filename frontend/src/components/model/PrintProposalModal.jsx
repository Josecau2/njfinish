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
import { generateProposalPdfTemplate } from '../../helpers/pdfTemplateGenerator';

// Helper function to get auth headers
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

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
    
    // Add state for style metadata if we need to fetch it
    const [styleData, setStyleData] = useState(null);
    const [manufacturerNameData, setManufacturerNameData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [pdfCustomization, setPdfCustomization] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const [previewHtml, setPreviewHtml] = useState('');

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

    const fetchStyleData = async (manufacturerId, styleId) => {
        try {
            const res = await axiosInstance.get(`/api/manufacturers/${manufacturerId}/styles-meta`, {
                headers: getAuthHeaders()
            });
            const styles = res.data?.styles || [];
            const foundStyle = styles.find(style => style.id === styleId);
            setStyleData(foundStyle || null);
        } catch (error) {
            console.error('Error fetching style data:', error);
        }
    };

    const fetchManufacturerName = async (manufacturerId) => {
        try {
            const res = await axiosInstance.get(`/api/manufacturers/${manufacturerId}`, {
                headers: getAuthHeaders()
            });
            setManufacturerNameData(res.data || null);
        } catch (error) {
            console.error('Error fetching manufacturer data:', error);
        }
    };

    useEffect(() => {
        fetchPdfCustomization();
        
        // Fetch style data and manufacturer data if we have manufacturer and style IDs
        const manufacturerData = formData?.manufacturersData?.[0];
        if (manufacturerData?.manufacturer && manufacturerData?.selectedStyle) {
            fetchStyleData(manufacturerData.manufacturer, manufacturerData.selectedStyle);
            fetchManufacturerName(manufacturerData.manufacturer);
        }
    }, [formData]); // Add formData as dependency

    const {
        companyName,
        companyPhone,
        companyEmail,
        companyAddress,
        companyWebsite,
        headerBgColor = '#000000',
        headerLogo,
        pdfFooter,
        headerTxtColor = '#FFFFFF'
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
        const customerName = formData?.customerName || formData?.customer?.name || '';
        const designerName = formData?.designerData?.name || '';
        const docDate = (formData?.date ? new Date(formData.date) : new Date()).toLocaleDateString(i18n.language || 'en-US');
        
        // Get style and manufacturer information
        const manufacturerData = formData?.manufacturersData?.[0] || {};
        
        // Debug: Log the manufacturer data structure to understand what's available
        console.log('PrintProposal manufacturerData:', manufacturerData);
        
        // Get the manufacturer name - try multiple possible paths
        let manufacturerName = '';
        if (manufacturerData?.manufacturerData?.name) {
            manufacturerName = manufacturerData.manufacturerData.name;
        } else if (manufacturerData?.name) {
            manufacturerName = manufacturerData.name;
        } else if (manufacturerData?.manufacturer?.name) {
            manufacturerName = manufacturerData.manufacturer.name;
        } else if (manufacturerNameData?.name) {
            // Use fetched manufacturer data
            manufacturerName = manufacturerNameData.name;
        } else if (formData?.manufacturerData?.name) {
            manufacturerName = formData.manufacturerData.name;
        } else if (selectVersionNew?.manufacturerData?.name) {
            manufacturerName = selectVersionNew.manufacturerData.name;
        }
        
        // For style name, we need to check multiple possible sources
        let styleName = '';
        
        // First, check if style name is directly stored 
        if (manufacturerData?.styleName) {
            styleName = manufacturerData.styleName;
        } 
        // Check if selectedStyleData exists (from EditProposal context)
        else if (manufacturerData?.selectedStyleData?.style) {
            styleName = manufacturerData.selectedStyleData.style;
        }
        // Check if we have fetched style data
        else if (styleData?.style) {
            styleName = styleData.style;
        }
        // Fallback: try to get from any stored style information
        else if (manufacturerData?.styleData?.style) {
            styleName = manufacturerData.styleData.style;
        }
        
    console.log('PrintProposal extracted names:', { manufacturerName, styleName });
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
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
            margin: 0;
            padding: 0;
        }

        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 30px;
            padding: 2rem;
            background-color: ${headerBgColor};
            color: ${headerTxtColor};
            min-height: 120px;
            overflow: hidden;
        }

        .header-left {
            flex: 0 0 auto;
            max-width: 50%;
        }

        .header-right {
            flex: 0 0 auto;
            max-width: 45%;
            text-align: right;
            word-wrap: break-word;
        }

        .logo {
            max-width: 200px;
            max-height: 80px;
            object-fit: contain;
            background: rgba(255,255,255,0.1);
            padding: 0.5rem;
            border-radius: 8px;
        }

        .company-name {
            font-size: 1.8rem;
            font-weight: bold;
            color: ${headerTxtColor};
            margin: 0;
            word-wrap: break-word;
        }

        .company-info {
            text-align: right;
            line-height: 1.4;
            color: ${headerTxtColor};
            font-size: 0.9rem;
            word-wrap: break-word;
            overflow-wrap: break-word;
        }

        .company-info div {
            margin-bottom: 3px;
            word-wrap: break-word;
        }

        .content-wrapper {
            padding: 2rem;
        }

        .greeting {
            font-size: 1rem;
            margin-bottom: 1.5rem;
            color: #333;
            line-height: 1.6;
        }

        .description {
            font-size: 1rem;
            margin-bottom: 1.5rem;
            color: #333;
            line-height: 1.6;
        }

        .summary-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 2rem;
            border: 1px solid #dee2e6;
        }

        .summary-table th {
            background-color: #f8f9fa;
            padding: 0.75rem;
            border: 1px solid #dee2e6;
            font-weight: 600;
            text-align: left;
        }

        .summary-table td {
            padding: 0.75rem;
            border: 1px solid #dee2e6;
        }

        .section-header {
            font-size: 1.5rem;
            font-weight: 600;
            margin: 2rem 0 1.5rem 0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #2563eb;
        }

        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 1.5rem;
            border: 1px solid #dee2e6;
        }

        .items-table th {
            background-color: #f8f9fa;
            padding: 0.75rem;
            border: 1px solid #dee2e6;
            font-weight: 600;
            text-align: left;
            font-size: 11px;
        }

        .items-table td {
            padding: 0.75rem;
            border: 1px solid #dee2e6;
            font-size: 11px;
        }

        .items-table tr:nth-child(even) {
            background-color: #f9f9f9;
        }

        .category-row {
            background-color: #f8f9fa !important;
            font-weight: bold;
            font-style: italic;
        }

        .text-right {
            text-align: right;
        }

        .text-left {
            text-align: left;
        }

        .price-summary {
            background-color: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 1.5rem;
            margin-top: 1.5rem;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 1rem;
        }

        .price-summary table {
            width: 100%;
            border-collapse: collapse;
        }

        .price-summary td {
            padding: 0.5rem 0;
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
            border-top: 1px solid #dee2e6;
            padding-top: 0.5rem;
        }

        .price-summary .grand-total {
            font-weight: bold;
            font-size: 1.2rem;
            color: #1a1a1a;
            padding-top: 0.5rem;
            border-top: 2px solid #495057;
            margin-top: 0.5rem;
        }

        .style-info {
            background-color: #e8f4fd;
            border: 1px solid #b3d7ff;
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 2rem;
            font-size: 1rem;
        }

        .style-info h4 {
            color: #2563eb;
            margin: 0 0 0.5rem 0;
            font-size: 1.1rem;
            font-weight: 600;
        }

        .style-details {
            display: flex;
            gap: 2rem;
            flex-wrap: wrap;
        }
        
        .style-detail-item {
            flex: 1;
            min-width: 200px;
        }
        
        .style-detail-label {
            font-weight: 600;
            color: #495057;
            margin-bottom: 0.25rem;
            font-size: 0.875rem;
        }
        
        .style-detail-value {
            font-size: 1rem;
            color: #212529;
            font-weight: 500;
        }

        .style-detail-item {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
        }

        .style-detail-label {
            font-weight: 600;
            color: #374151;
            font-size: 0.9rem;
        }

        .main-footer-div {
            margin-top: 1.5rem;
            padding: 1.5rem;
            background-color: #f8f9fa;
            color: #6c757d;
            font-size: 0.9rem;
            line-height: 1.6;
            border-top: 1px solid #dee2e6;
            white-space: pre-line;
            border-radius: 8px;
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
        <div class="header-left">
            ${logoUrl ? `<img src="${logoUrl}" alt="${t('proposalDoc.altCompanyLogo')}" class="logo">` : `<div class="company-name">${companyName || t('proposalDoc.fallbackCompanyName')}</div>`}
        </div>
        <div class="header-right">
            <div class="company-info">
                ${companyName ? `<div><strong>${companyName}</strong></div>` : ''}
                ${companyPhone ? `<div>${companyPhone}</div>` : ''}
                ${companyEmail ? `<div>${companyEmail}</div>` : ''}
                ${companyWebsite ? `<div>${companyWebsite}</div>` : ''}
                ${companyAddress ? `<div style="white-space: pre-line; font-style: italic; margin-top: 0.5rem;">${companyAddress}</div>` : ''}
            </div>
        </div>
    </div>

    <!-- Content Wrapper -->
    <div class="content-wrapper">
        <!-- Greeting -->
        <div class="greeting">
        ${t('proposalDoc.greeting', { name: customerName })}
        </div>

        <div class="description">
        ${t('proposalDoc.descriptionIntro')}
        </div>

        <!-- Proposal Summary (matches customization preview) -->
        <table class="summary-table">
            <thead>
                <tr>
                    <th>${t('proposals.headers.description')}</th>
                    <th>${t('proposals.headers.designer')}</th>
                    <th>${t('proposals.headers.customer')}</th>
                    <th>${t('proposals.headers.date')}</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>${proposalSummary.description}</td>
                    <td>${designerName || t('common.na')}</td>
                    <td>${customerName || t('common.na')}</td>
                    <td>${docDate}</td>
                </tr>
            </tbody>
        </table>

        <!-- Style and Manufacturer Information -->
        ${styleName || manufacturerName ? `
        <div class="style-info">
            <h4>${t('proposalDoc.styleInformation', 'Style Information')}</h4>
            <div class="style-details">
                ${manufacturerName ? `
                <div class="style-detail-item">
                    <div class="style-detail-label">${t('proposalDoc.manufacturer', 'Manufacturer')}:</div>
                    <div class="style-detail-value">${manufacturerName}</div>
                </div>
                ` : ''}
                ${styleName ? `
                <div class="style-detail-item">
                    <div class="style-detail-label">${t('proposalDoc.styleName', 'Style')}:</div>
                    <div class="style-detail-value">${styleName}</div>
                </div>
                ` : ''}
            </div>
        </div>
        ` : ''}

        ${proposalItems && proposalItems.length > 0 ? `
        <!-- Proposal Items Section -->
        <div class="section-header">${t('proposalDoc.sections.proposalItems')}</div>
        <table class="items-table">
            <thead>
                <tr style="background-color: #f8f9fa;">
                    <th style="border: 1px solid #dee2e6; padding: 0.75rem;">${t('proposalColumns.no')}</th>
                    <th style="border: 1px solid #dee2e6; padding: 0.75rem;">${t('proposalColumns.qty')}</th>
                    <th style="border: 1px solid #dee2e6; padding: 0.75rem;">${t('proposalColumns.item')}</th>
                    <th style="border: 1px solid #dee2e6; padding: 0.75rem;">${t('proposalColumns.assembled')}</th>
                    <th style="border: 1px solid #dee2e6; padding: 0.75rem;">${t('proposalColumns.hingeSide')}</th>
                    <th style="border: 1px solid #dee2e6; padding: 0.75rem;">${t('proposalColumns.exposedSide')}</th>
                    <th style="border: 1px solid #dee2e6; padding: 0.75rem; text-align: right;">${t('proposalColumns.price')}</th>
                    <th style="border: 1px solid #dee2e6; padding: 0.75rem; text-align: right;">${t('proposalColumns.assemblyCost')}</th>
                    <th style="border: 1px solid #dee2e6; padding: 0.75rem; text-align: right;">${t('proposalColumns.total')}</th>
                </tr>
            </thead>
            <tbody>
                <!-- Category Row -->
                <tr class="category-row">
                    <td colspan="9" style="padding: 0.75rem; background-color: #f8f9fa; font-style: italic;"><strong>${t('proposalColumns.items')}</strong></td>
                </tr>
                <!-- Dynamically inserted rows -->
                ${proposalItems
                        .map((item, index) => {
                            const itemRow = `
                        <tr>
                            <td style="border: 1px solid #dee2e6; padding: 0.75rem;">${index + 1}</td>
                            <td style="border: 1px solid #dee2e6; padding: 0.75rem;">${item.qty}</td>
                            <td style="border: 1px solid #dee2e6; padding: 0.75rem;">${item.code || ''}</td>
                            <td style="border: 1px solid #dee2e6; padding: 0.75rem;">${item.assembled}</td>
                            <td style="border: 1px solid #dee2e6; padding: 0.75rem;">${shortLabel(item.hingeSide)}</td>
                            <td style="border: 1px solid #dee2e6; padding: 0.75rem;">${shortLabel(item.exposedSide)}</td>
                            <td style="border: 1px solid #dee2e6; padding: 0.75rem; text-align: right;">$${parseFloat(item.price).toFixed(2)}</td>
                            <td style="border: 1px solid #dee2e6; padding: 0.75rem; text-align: right;">$${item.includeAssemblyFee ? parseFloat(item.assemblyFee).toFixed(2) : '0.00'}</td>
                            <td style="border: 1px solid #dee2e6; padding: 0.75rem; text-align: right;">$${parseFloat(item.total).toFixed(2)}</td>
                        </tr>
                        `;
                            const modRows = item.modifications && item.modifications.length > 0
                                ? `
                            <tr>
                                <td colspan="9" style="padding: 0.75rem; background-color: #f9f9f9; font-style: italic;"><strong>${t('proposalDoc.modifications')}</strong></td>
                            </tr>
                            ${item.modifications
                                    .map((mod, modIdx) => {
                                        const modTotal = (parseFloat(mod.price) || 0) * (mod.qty || 0);
                                        return `
                                        <tr>
                                            <td style="border: 1px solid #dee2e6; padding: 0.75rem;">-</td>
                                            <td style="border: 1px solid #dee2e6; padding: 0.75rem;">${mod.qty || ''}</td>
                                            <td style="border: 1px solid #dee2e6; padding: 0.75rem;">${mod.name || ''}</td>
                                            <td colspan="3" style="border: 1px solid #dee2e6; padding: 0.75rem;"></td>
                                            <td style="border: 1px solid #dee2e6; padding: 0.75rem; text-align: right;">$${(parseFloat(mod.price) || 0).toFixed(2)}</td>
                                            <td style="border: 1px solid #dee2e6; padding: 0.75rem;"></td>
                                            <td style="border: 1px solid #dee2e6; padding: 0.75rem; text-align: right;">$${modTotal.toFixed(2)}</td>
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
                    <td class="text-left"><strong>${t('proposalDoc.priceSummary.cabinets')}</strong></td>
                    <td class="text-right"><strong>$${priceSummary.cabinets.toFixed(2)}</strong></td>
                </tr>
                <tr>
                    <td class="text-left"><strong>${t('proposalDoc.priceSummary.assembly')}</strong></td>
                    <td class="text-right"><strong>$${priceSummary.assemblyFee.toFixed(2)}</strong></td>
                </tr>
                <tr>
                    <td class="text-left"><strong>${t('proposalDoc.priceSummary.modifications')}</strong></td>
                    <td class="text-right"><strong>$${priceSummary.modifications.toFixed(2)}</strong></td>
                </tr>
                <tr class="total-row">
                    <td class="text-left"><strong>${t('proposalDoc.priceSummary.styleTotal')}</strong></td>
                    <td class="text-right"><strong>$${priceSummary.styleTotal.toFixed(2)}</strong></td>
                </tr>
                <tr>
                    <td class="text-left"><strong>${t('proposalDoc.priceSummary.total')}</strong></td>
                    <td class="text-right"><strong>$${priceSummary.total.toFixed(2)}</strong></td>
                </tr>
                <tr class="total-row">
                    <td class="text-left"><strong>${t('proposalDoc.priceSummary.tax')}</strong></td>
                    <td class="text-right"><strong>$${priceSummary.tax.toFixed(2)}</strong></td>
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
        ${pdfFooter ? `<div class="main-footer-div">${pdfFooter}</div>` : ''}
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

    const showPreviewModal = (values) => {
        const htmlContent = generateHTMLTemplate(values);
        setPreviewHtml(htmlContent);
        setShowPreview(true);
    };





    const formik = useFormik({
        initialValues: {
            showProposalItems: true,
            showGroupItems: true,
            selectedVersions: [],
            selectedColumns: ['no', 'qty', 'item', 'assembled', 'hingeSide', 'exposedSide', 'price', 'assemblyCost', 'total'],
        },
        onSubmit: (values, { setSubmitting }) => {
            // This will be triggered by download button
            downloadWithPuppeteer(values);
            setSubmitting(false);
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
        <>
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
                            color="info"
                            onClick={() => showPreviewModal(formik.values)}
                            variant="outline"
                            className="px-4"
                        >
                            <i className="cil-magnifying-glass me-2"></i>
                            {t('proposalCommon.preview', 'Preview')}
                        </CButton>
                        <CButton
                            color="primary"
                            type="submit"
                            className="px-4"
                            disabled={isLoading}
                        >
                            <i className="cil-cloud-download me-2"></i>
                            {isLoading ? t('proposalCommon.downloading') : t('proposalCommon.downloadPdf')}
                        </CButton>
                    </CModalFooter>
                </form>
            </CModal>

            {/* Preview Modal */}
            <CModal 
                visible={showPreview} 
                onClose={() => setShowPreview(false)} 
                size="xl" 
                alignment="center" 
                scrollable
            >
                <CModalHeader closeButton>
                    <CModalTitle>
                        <i className="cil-description me-2"></i>
                        {t('proposalCommon.previewTitle', 'Proposal Preview')}
                    </CModalTitle>
                </CModalHeader>
                <CModalBody style={{ padding: '0' }}>
                    <div style={{ 
                        maxHeight: '80vh', 
                        overflow: 'auto',
                        background: '#f8f9fa',
                        padding: '20px'
                    }}>
                        <div 
                            style={{ 
                                background: 'white',
                                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                                margin: '0 auto',
                                maxWidth: '210mm', // A4 width
                                minHeight: '297mm' // A4 height
                            }}
                            dangerouslySetInnerHTML={{ __html: previewHtml }}
                        />
                    </div>
                </CModalBody>
                <CModalFooter>
                    <CButton
                        color="secondary"
                        onClick={() => setShowPreview(false)}
                        variant="outline"
                    >
                        {t('common.close')}
                    </CButton>
                    <CButton
                        color="primary"
                        onClick={() => {
                            setShowPreview(false);
                            downloadWithPuppeteer(formik.values);
                        }}
                        disabled={isLoading}
                    >
                        <i className="cil-cloud-download me-2"></i>
                        {isLoading ? t('proposalCommon.downloading') : t('proposalCommon.downloadPdf')}
                    </CButton>
                </CModalFooter>
            </CModal>
        </>
    );
};

export default PrintProposalModal;