import React, { useEffect, useLayoutEffect, useState, useRef } from 'react';
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
// Removed react-select; using checkboxes for column & version selection
import axiosInstance from '../../helpers/axiosInstance';
import { generateProposalPdfTemplate } from '../../helpers/pdfTemplateGenerator';
import PageHeader from '../PageHeader';

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

    // Preview scaling state/refs for mobile-friendly rendering
    const previewContainerRef = useRef(null);
    const previewContentRef = useRef(null);
    const [previewScale, setPreviewScale] = useState(1);
    const [contentHeight, setContentHeight] = useState(0);
    const [containerPadding, setContainerPadding] = useState(20);
    const [modalSize, setModalSize] = useState('xl');
    const BASE_PAGE_WIDTH_PX = 794; // ~210mm @96dpi
    const previewIframeRef = useRef(null);
    const [isMobile, setIsMobile] = useState(false);

    // Calculate responsive modal size based on viewport
    const calculateModalSize = () => {
        const vw = window.innerWidth || document.documentElement.clientWidth || 0;
        if (vw < 576) return 'sm';     // Mobile phones
        if (vw < 768) return 'lg';     // Large mobile/small tablets
        if (vw < 992) return 'xl';     // Tablets
        if (vw < 1400) return 'xl';    // Small desktop
        return 'xl';                   // Large desktop
    };

    const recomputePreviewScale = () => {
        try {
            const container = previewContainerRef.current;
            const content = previewContentRef.current;
            if (!container || !content) return;

            // Update modal size based on viewport
            const newModalSize = calculateModalSize();
            if (newModalSize !== modalSize) {
                setModalSize(newModalSize);
            }

            // Dynamic padding based on viewport width (min 12px, max 32px)
            const vw = window.innerWidth || document.documentElement.clientWidth || 0;
            const dynamicPadding = Math.max(12, Math.min(32, Math.round(vw * 0.04)));
            if (dynamicPadding !== containerPadding) setContainerPadding(dynamicPadding);

            // Compute available width excluding padding
            const styles = window.getComputedStyle(container);
            const padLeft = parseFloat(styles.paddingLeft || '0');
            const padRight = parseFloat(styles.paddingRight || '0');
            const availableWidth = (container.clientWidth || 0) - padLeft - padRight;
            if (!availableWidth || availableWidth <= 0) return;

            // Better scaling calculation that accounts for different viewport sizes
            let scale = availableWidth / BASE_PAGE_WIDTH_PX;

            // Mobile-specific scaling improvements
            if (vw < 576) {
                // Mobile phones: prioritize readability over full width
                scale = Math.min(scale, 0.8);
                scale = Math.max(scale, 0.4); // Ensure minimum readability
            } else if (vw < 768) {
                // Large mobile/small tablets
                scale = Math.min(scale, 0.9);
                scale = Math.max(scale, 0.5);
            } else if (vw < 1200) {
                // Tablets and small desktop: never scale above 100%
                scale = Math.min(scale, 1);
                scale = Math.max(scale, 0.6);
            } else {
                // Large screens: allow slight zoom
                scale = Math.min(scale, 1.2);
                scale = Math.max(scale, 0.7);
            }

            setPreviewScale(scale);

            // Measure full content height to compute scaled wrapper height
            const naturalHeight = content.scrollHeight || content.offsetHeight || 0;
            setContentHeight(naturalHeight);
        } catch (_) {
            // no-op
        }
    };

    // Recompute scale immediately when preview opens using layout effect for first paint accuracy
    useLayoutEffect(() => {
        if (!showPreview) return;
        const r = () => recomputePreviewScale();
        r();
        window.addEventListener('resize', r);
        return () => window.removeEventListener('resize', r);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showPreview, previewHtml]);

    // Initialize modal size on component mount and handle resize
    useEffect(() => {
        const updateModalSize = () => {
            const newSize = calculateModalSize();
            setModalSize(newSize);
            setIsMobile(window.innerWidth < 576);
        };

        updateModalSize();
        window.addEventListener('resize', updateModalSize);
        return () => window.removeEventListener('resize', updateModalSize);
    }, []);

    // Also observe DOM mutations inside the preview to keep height in sync
    useEffect(() => {
        if (!showPreview || !previewContentRef.current) return;
        const observer = new MutationObserver(() => recomputePreviewScale());
        observer.observe(previewContentRef.current, { childList: true, subtree: true });
        return () => observer.disconnect();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showPreview, previewContentRef.current]);

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
            const res = await axiosInstance.get(`/api/manufacturers/${manufacturerId}/styles-meta`);
            const styles = res.data?.styles || [];
            const foundStyle = styles.find(style => style.id === styleId);
            setStyleData(foundStyle || null);
        } catch (error) {
            console.error('Error fetching style data:', error);
        }
    };

    const fetchManufacturerName = async (manufacturerId) => {
        try {
            const res = await axiosInstance.get(`/api/manufacturers/${manufacturerId}`);
            setManufacturerNameData(res.data || null);
        } catch (error) {
            console.error('Error fetching manufacturer data:', error);
        }
    };

    useEffect(() => {
        if (!show) return; // Don't fetch if modal is not shown

        fetchPdfCustomization();
    }, [show]); // Only refetch when modal is shown

    // Refresh preview when async customization loads
    useEffect(() => {
        if (showPreview) {
            const htmlContent = generateHTMLTemplate(formik.values);
            setPreviewHtml(htmlContent);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pdfCustomization]);

    useEffect(() => {
        if (!show) return; // Don't fetch if modal is not shown

        // Fetch style data and manufacturer data if we have manufacturer and style IDs
        const manufacturerData = formData?.manufacturersData?.[0];
        if (manufacturerData?.manufacturer && manufacturerData?.selectedStyle) {
            fetchStyleData(manufacturerData.manufacturer, manufacturerData.selectedStyle);
            fetchManufacturerName(manufacturerData.manufacturer);
        }
    }, [show, formData?.manufacturersData?.[0]?.manufacturer, formData?.manufacturersData?.[0]?.selectedStyle]); // More specific dependencies

    // Refresh preview when style/manufacturer meta loads
    useEffect(() => {
        if (showPreview) {
            const htmlContent = generateHTMLTemplate(formik.values);
            setPreviewHtml(htmlContent);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [styleData, manufacturerNameData]);

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
        description: formData?.description || t('proposalDoc.defaultProjectDescription', { defaultValue: 'Kitchen Project' }),
        customer: formData?.customerName || '',
        date: new Date().toLocaleDateString(i18n.language || 'en-US'),
    };

    const summary = formData?.manufacturersData?.[0]?.summary || {};

    // PDF generation should use original prices without showroom multiplier
    const priceSummary = formData?.manufacturersData?.[0]?.items?.length
        ? {
            cabinets: Number(summary.cabinets) || 0,
            assemblyFee: Number(summary.assemblyFee) || 0,
            modifications: Number(summary.modificationsCost) || 0,
            styleTotal: Number(summary.styleTotal) || 0,
            total: Number(summary.total) || 0,
            tax: Number(summary.taxAmount) || 0,
            grandTotal: Number(summary.grandTotal) || 0,
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
        item: item.description ? `${item.code} - ${item.description}` : item.code || '',
    description: item.description || '',
        assembled: item.isRowAssembled ? t('common.yes') : t('common.no'),
        hingeSide: item.hingeSide || t('common.na'),
        exposedSide: item.exposedSide || t('common.na'),
        price: parseFloat(item.price) || 0,
        assemblyCost: item.includeAssemblyFee ? (parseFloat(item.assemblyFee) || 0) : 0,
        total: item.includeAssemblyFee ? (parseFloat(item.total) || 0) : (parseFloat(item.price) || 0),
        modifications: item.modifications || {}
    }));


    // Generate HTML template
    const generateHTMLTemplate = (values) => {
        // Helper function to safely format numbers
        const safeToFixed = (value, decimals = 2) => {
            const num = Number(value);
            return isNaN(num) ? '0.00' : num.toFixed(decimals);
        };

        const logoUrl = headerLogo ? `${api_url}${headerLogo}` : null;
        const customerName = formData?.customerName || formData?.customer?.name || '';
        const designerName = formData?.designerData?.name || '';
        const docDate = (formData?.date ? new Date(formData.date) : new Date()).toLocaleDateString(i18n.language || 'en-US');

        // Get style and manufacturer information
        const manufacturerData = formData?.manufacturersData?.[0] || {};

        // Debug: Log the manufacturer data structure to understand what's available
        console.log('PrintProposal manufacturerData:', manufacturerData);

        // Get the manufacturer name - broaden possible shapes
        // Possible shapes observed / anticipated:
        // manufacturerData: { manufacturerData: { name }, manufacturer: <id|object>, name }
        // manufacturerNameData: { name } OR { manufacturer: { name } }
        let manufacturerName = '';
        const manufacturerId = manufacturerData?.manufacturer || manufacturerData?.manufacturerId;
        manufacturerName =
            manufacturerData?.manufacturerData?.name ||
            manufacturerData?.name ||
            manufacturerData?.manufacturer?.name ||
            manufacturerNameData?.name ||
            manufacturerNameData?.manufacturer?.name ||
            formData?.manufacturerData?.name ||
            selectVersionNew?.manufacturerData?.name ||
            '';

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

        // Build dynamic table headers based on selected columns
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
            const rightAlign = ['price', 'assemblyCost', 'total'].includes(col) ? 'text-align: right;' : '';
            return `<th style="border: 1px solid #dee2e6; padding: 0.75rem; ${rightAlign}">${colName}</th>`;
        }).join('');

        // Escape helper for descriptions
        const escapeHtml = (str = '') => str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');

        // Build dynamic item rows (with description row & modifications rows)
        const proposalItemRows = proposalItems.map((item, index) => {
            const rowCells = selectedCols.map(col => {
                switch (col) {
                    case 'no': return `<td style="border: 1px solid #dee2e6; padding: 0.75rem;">${index + 1}</td>`;
                    case 'qty': return `<td style="border: 1px solid #dee2e6; padding: 0.75rem;">${item.qty}</td>`;
                    case 'item': return `<td style="border: 1px solid #dee2e6; padding: 0.75rem;">${item.code || ''}</td>`;
                    case 'assembled': return `<td style="border: 1px solid #dee2e6; padding: 0.75rem;">${item.assembled}</td>`;
                    case 'hingeSide': return `<td style="border: 1px solid #dee2e6; padding: 0.75rem;">${shortLabel(item.hingeSide)}</td>`;
                    case 'exposedSide': return `<td style="border: 1px solid #dee2e6; padding: 0.75rem;">${shortLabel(item.exposedSide)}</td>`;
                    case 'price': return `<td style="border: 1px solid #dee2e6; padding: 0.75rem; text-align: right;">$${safeToFixed(item.price)}</td>`;
                    case 'assemblyCost': return `<td style="border: 1px solid #dee2e6; padding: 0.75rem; text-align: right;">$${safeToFixed(item.assemblyCost)}</td>`;
                    case 'total': return `<td style="border: 1px solid #dee2e6; padding: 0.75rem; text-align: right;">$${safeToFixed(item.total)}</td>`;
                    default: return `<td style="border: 1px solid #dee2e6; padding: 0.75rem;"></td>`;
                }
            }).join('');

            // Optional description row spanning all columns
            const descriptionRow = item.description
                ? `<tr class="item-description-row"><td colspan="${selectedCols.length}" style="border: 1px solid #dee2e6; padding: 0.5rem 0.75rem; font-size: 10px; color: #555; background:#fff; font-style: italic;">${escapeHtml(item.description)}</td></tr>`
                : '';

            // Modifications rows (if any) for this item
            let modificationsRows = '';
            const mods = Array.isArray(item.modifications) ? item.modifications : [];
            if (mods.length > 0) {
                const modsHeader = `<tr class="mods-header-row"><td colspan="${selectedCols.length}" style="padding: 0.5rem 0.75rem; background:#f9f9f9; font-style: italic; font-weight:600;">${t('proposalDoc.modifications')}</td></tr>`;
                const modsLines = mods.map(mod => {
                    const modTotal = (parseFloat(mod.price) || 0) * (mod.qty || 0);
                    const modCells = selectedCols.map(col => {
                        switch (col) {
                            case 'no': return `<td style="border: 1px solid #dee2e6; padding:0.75rem;">-</td>`;
                            case 'qty': return `<td style="border: 1px solid #dee2e6; padding:0.75rem;">${mod.qty || ''}</td>`;
                            case 'item': return `<td style="border: 1px solid #dee2e6; padding:0.75rem;">${mod.name || ''}</td>`;
                            case 'assembled': return `<td style="border: 1px solid #dee2e6; padding:0.75rem;"></td>`;
                            case 'hingeSide': return `<td style="border: 1px solid #dee2e6; padding:0.75rem;"></td>`;
                            case 'exposedSide': return `<td style="border: 1px solid #dee2e6; padding:0.75rem;"></td>`;
                            case 'price': return `<td style="border: 1px solid #dee2e6; padding:0.75rem; text-align:right;">$${safeToFixed(parseFloat(mod.price) || 0)}</td>`;
                            case 'assemblyCost': return `<td style="border: 1px solid #dee2e6; padding:0.75rem;"></td>`;
                            case 'total': return `<td style="border: 1px solid #dee2e6; padding:0.75rem; text-align:right;">$${safeToFixed(modTotal)}</td>`;
                            default: return `<td style="border: 1px solid #dee2e6; padding:0.75rem;"></td>`;
                        }
                    }).join('');
                    return `<tr>${modCells}</tr>`;
                }).join('');
                modificationsRows = modsHeader + modsLines;
            }

            return `<tr>${rowCells}</tr>${descriptionRow}${modificationsRows}`;
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
            align-items: center; /* vertically center both logo & info */
            margin-bottom: 28px;
            padding: 1.5rem 2rem; /* symmetrical top/bottom */
            background-color: ${headerBgColor};
            color: ${headerTxtColor};
            min-height: 110px;
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

        .company-info div:last-child { margin-bottom: 0; }

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
    ${ (styleName || manufacturerName || manufacturerData?.manufacturer) ? `
        <div class="style-info">
            <h4>${t('proposalDoc.styleInformation', 'Style Information')}</h4>
            <div class="style-details">
                <div class="style-detail-item">
                    <div class="style-detail-label">${t('proposalDoc.manufacturer', 'Manufacturer')}:</div>
            <div class="style-detail-value">${manufacturerName || (manufacturerId ? t('common.loading', 'Loading...') : t('common.na'))}</div>
                </div>
                <div class="style-detail-item">
                    <div class="style-detail-label">${t('proposalDoc.styleName', 'Style')}:</div>
                    <div class="style-detail-value">${styleName || t('common.na')}</div>
                </div>
            </div>
        </div>
        ` : ''}

        ${proposalItems && proposalItems.length > 0 ? `
        <!-- Proposal Items Section -->
        <div class="section-header">${t('proposalDoc.sections.proposalItems')}</div>
        <table class="items-table">
            <thead>
                <tr style="background-color: #f8f9fa;">${columnHeaders}</tr>
            </thead>
            <tbody>
                <tr class="category-row">
                    <td colspan="${selectedCols.length}" style="padding:0.75rem; background-color:#f8f9fa; font-style: italic;"><strong>${t('proposalColumns.items')}</strong></td>
                </tr>
                ${proposalItemRows}
            </tbody>
        </table>
        <!-- Price Summary -->
        ${values.showPriceSummary ? `
        <div class="price-summary">
            <table>
                <tr>
                    <td class="text-left"><strong>${t('proposalDoc.priceSummary.cabinets')}</strong></td>
                    <td class="text-right"><strong>$${safeToFixed(priceSummary.cabinets)}</strong></td>
                </tr>
                <tr>
                    <td class="text-left"><strong>${t('proposalDoc.priceSummary.assembly')}</strong></td>
                    <td class="text-right"><strong>$${safeToFixed(priceSummary.assemblyFee)}</strong></td>
                </tr>
                <tr>
                    <td class="text-left"><strong>${t('proposalDoc.priceSummary.modifications')}</strong></td>
                    <td class="text-right"><strong>$${safeToFixed(priceSummary.modifications)}</strong></td>
                </tr>
                <tr class="total-row">
                    <td class="text-left"><strong>${t('proposalDoc.priceSummary.styleTotal')}</strong></td>
                    <td class="text-right"><strong>$${safeToFixed(priceSummary.styleTotal)}</strong></td>
                </tr>
                <tr>
                    <td class="text-left"><strong>${t('proposalDoc.priceSummary.total')}</strong></td>
                    <td class="text-right"><strong>$${safeToFixed(priceSummary.total)}</strong></td>
                </tr>
                <tr class="total-row">
                    <td class="text-left"><strong>${t('proposalDoc.priceSummary.tax')}</strong></td>
                    <td class="text-right"><strong>$${safeToFixed(priceSummary.tax)}</strong></td>
                </tr>
                <tr class="grand-total">
                    <td class="text-left">${t('proposalDoc.priceSummary.grandTotal')}</td>
                    <td class="text-right">$${safeToFixed(priceSummary.grandTotal)}</td>
                </tr>
            </table>
        </div>
        ` : ''}
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
                    <td>$${safeToFixed(item.unitPrice * item.quantity)}</td>
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
    };

    const printQuote = (values) => {
        try {
            const htmlContent = generateHTMLTemplate(values);

            // Create a new window/iframe for printing
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(htmlContent);
                printWindow.document.close();

                // Wait for content to load then print
                printWindow.onload = () => {
                    printWindow.print();
                    printWindow.close();
                };
            } else {
                // Fallback: create hidden iframe
                const iframe = document.createElement('iframe');
                iframe.style.position = 'absolute';
                iframe.style.left = '-9999px';
                iframe.style.width = '1px';
                iframe.style.height = '1px';

                document.body.appendChild(iframe);

                iframe.contentDocument.open();
                iframe.contentDocument.write(htmlContent);
                iframe.contentDocument.close();

                iframe.onload = () => {
                    iframe.contentWindow.print();
                    setTimeout(() => {
                        document.body.removeChild(iframe);
                    }, 1000);
                };
            }
        } catch (error) {
            console.error('Error printing quote:', error);
        }
    };

    const showPreviewModal = (values) => {
        const htmlContent = generateHTMLTemplate(values);
        // Open modal first so refs mount, then inject HTML & force immediate scale recalculation
        setShowPreview(true);
        setPreviewHtml(htmlContent);
        // Use double rAF to ensure DOM nodes are in place & painted before measuring
        requestAnimationFrame(() => requestAnimationFrame(() => {
            recomputePreviewScale();
        }));
    };

    // Keep iframe height synced once content loads (using srcDoc prop below)
    useEffect(() => {
        if (!showPreview) return;
        const iframe = previewIframeRef.current;
        if (!iframe) return;
        const adjust = () => {
            try {
                const body = iframe.contentDocument?.body;
                if (body) iframe.style.height = body.scrollHeight + 'px';
            } catch(_) { /* ignore */ }
        };
        iframe.addEventListener('load', adjust);
        const t = setTimeout(adjust, 150); // fallback adjust
        return () => { iframe.removeEventListener('load', adjust); clearTimeout(t); };
    }, [previewHtml, showPreview]);





    const formik = useFormik({
        initialValues: {
            showProposalItems: true,
            showGroupItems: true,
            showPriceSummary: true,
            selectedVersions: [],
            selectedColumns: ['no', 'qty', 'item', 'assembled', 'hingeSide', 'exposedSide', 'price', 'assemblyCost', 'total'],
        },
        onSubmit: (values, { setSubmitting }) => {
            // This will be triggered by download button
            downloadWithPuppeteer(values);
            setSubmitting(false);
        }
    });

    // Auto-update preview when columns change
    useEffect(() => {
        if (showPreview) {
            const htmlContent = generateHTMLTemplate(formik.values);
            setPreviewHtml(htmlContent);
        }
    }, [
        formik.values.selectedColumns,
        formik.values.showProposalItems,
        formik.values.showGroupItems,
        formik.values.showPriceSummary,
        showPreview,
        formData
    ]);

    // Version and column options (same as before)
    const versionOptions = formData?.manufacturersData?.map((item) => ({
        value: item.versionName,
        label: item.versionName,
    })) || [];

    const columnOptions = [
        { value: 'no', label: t('proposalColumns.no') },
        { value: 'qty', label: t('proposalColumns.qty'), isFixed: true },
        { value: 'item', label: t('proposalColumns.item') },
        { value: 'assembled', label: t('proposalColumns.assembled') },
        { value: 'hingeSide', label: t('proposalColumns.hingeSide') },
        { value: 'exposedSide', label: t('proposalColumns.exposedSide') },
    // Removed isFixed so price can now be deselected and the list can show without pricing
    { value: 'price', label: t('proposalColumns.price') },
        { value: 'assemblyCost', label: t('proposalColumns.assemblyCost') },
        { value: 'total', label: t('proposalColumns.total') },
    ];

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
                <PageHeader
                    title={t('proposalCommon.printTitle')}
                    onClose={onClose}
                />
                <form onSubmit={formik.handleSubmit}>
                    <CModalBody className="pt-0">
                        {/* Switch Group */}
                        <div className="mb-4 p-3 bg-light rounded" style={{ border: '1px solid #e3e6ea' }}>
                            <div className="fw-semibold text-uppercase small mb-2" style={{ letterSpacing: '.5px' }}>{t('proposalCommon.visibilityOptions', 'Visibility Options')}</div>
                            <div className="row g-3">
                                <div className="col-12 col-md-4 d-flex align-items-center">
                                    <CFormSwitch
                                        id="showProposalItems"
                                        label={<span className="fw-medium">{t('proposalCommon.showProposalItems')}</span>}
                                        checked={formik.values.showProposalItems}
                                        onChange={(e) => {
                                            formik.handleChange(e);
                                            if (showPreview) {
                                                const htmlContent = generateHTMLTemplate(formik.values);
                                                setPreviewHtml(htmlContent);
                                            }
                                        }}
                                        className="me-2"
                                    />
                                </div>
                                <div className="col-12 col-md-4 d-flex align-items-center">
                                    <CFormSwitch
                                        id="showGroupItems"
                                        label={<span className="fw-medium">{t('proposalCommon.showGroupItems')}</span>}
                                        checked={formik.values.showGroupItems}
                                        onChange={(e) => {
                                            formik.handleChange(e);
                                            if (showPreview) {
                                                const htmlContent = generateHTMLTemplate(formik.values);
                                                setPreviewHtml(htmlContent);
                                            }
                                        }}
                                        className="me-2"
                                    />
                                </div>
                                <div className="col-12 col-md-4 d-flex align-items-center">
                                    <CFormSwitch
                                        id="showPriceSummary"
                                        label={<span className="fw-medium">{t('proposalCommon.showPriceSummary', 'Show Price Summary')}</span>}
                                        checked={formik.values.showPriceSummary}
                                        onChange={(e) => {
                                            formik.handleChange(e);
                                            if (showPreview) {
                                                const htmlContent = generateHTMLTemplate(formik.values);
                                                setPreviewHtml(htmlContent);
                                            }
                                        }}
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
                                            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => {
                                                const all = versionOptions.map(v => v.value);
                                                formik.setFieldValue('selectedVersions', all);
                                                if (showPreview) setPreviewHtml(generateHTMLTemplate({ ...formik.values, selectedVersions: all }));
                                            }}>{t('common.selectAll', 'Select All')}</button>
                                            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => {
                                                formik.setFieldValue('selectedVersions', []);
                                                if (showPreview) setPreviewHtml(generateHTMLTemplate({ ...formik.values, selectedVersions: [] }));
                                            }}>{t('common.clear', 'Clear')}</button>
                                        </div>
                                    )}
                                </div>
                                <div className={isMobile ? 'd-flex flex-column gap-2' : 'row g-2'} role="group" aria-label={t('proposalCommon.selectVersion')}>
                                    {versionOptions.map(opt => {
                                        const checked = formik.values.selectedVersions.includes(opt.value);
                                        return (
                                            <div key={opt.value} className={isMobile ? '' : 'col-6 col-md-4'}>
                                                <label className={`d-flex align-items-center rounded border p-2 small ${isMobile ? 'w-100' : ''}`}
                                                       style={{ gap: '8px', background: checked ? '#eef6ff' : '#fff', cursor: 'pointer', minHeight: 42 }}>
                                                    <input
                                                        type="checkbox"
                                                        value={opt.value}
                                                        checked={checked}
                                                        onChange={(e) => {
                                                            let next = [...formik.values.selectedVersions];
                                                            if (e.target.checked) next.push(opt.value); else next = next.filter(v => v !== opt.value);
                                                            formik.setFieldValue('selectedVersions', next);
                                                            if (showPreview) {
                                                                const updatedValues = { ...formik.values, selectedVersions: next };
                                                                setPreviewHtml(generateHTMLTemplate(updatedValues));
                                                            }
                                                        }}
                                                        style={{ marginRight: 4 }}
                                                    />
                                                    <span className="text-truncate" style={{ maxWidth: '100%' }}>{opt.label}</span>
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
                                            const all = columnOptions.map(c => c.value);
                                            formik.setFieldValue('selectedColumns', all);
                                            if (showPreview) setPreviewHtml(generateHTMLTemplate({ ...formik.values, selectedColumns: all }));
                                        }}
                                    >{t('common.selectAll', 'Select All')}</button>
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-outline-secondary"
                                        onClick={() => {
                                            // Keep first column (no) as a minimum fallback
                                            const min = ['no'];
                                            formik.setFieldValue('selectedColumns', min);
                                            if (showPreview) setPreviewHtml(generateHTMLTemplate({ ...formik.values, selectedColumns: min }));
                                        }}
                                    >{t('common.clear', 'Clear')}</button>
                                </div>
                            </div>
                            <div className={isMobile ? 'd-flex flex-column gap-2' : 'row g-2'} role="group" aria-label={t('proposalCommon.selectColumns')}>
                                {columnOptions.map(opt => {
                                    const checked = formik.values.selectedColumns.includes(opt.value);
                                    return (
                                        <div key={opt.value} className={isMobile ? '' : 'col-6 col-md-4'}>
                                            <label className={`d-flex align-items-center rounded border p-2 small ${isMobile ? 'w-100' : ''}`}
                                                   style={{ gap: '8px', background: checked ? '#eef6ff' : '#fff', cursor: 'pointer', minHeight: 42 }}>
                                                <input
                                                    type="checkbox"
                                                    value={opt.value}
                                                    checked={checked}
                                                    onChange={(e) => {
                                                        let next = [...formik.values.selectedColumns];
                                                        if (e.target.checked) {
                                                            next.push(opt.value);
                                                        } else {
                                                            next = next.filter(c => c !== opt.value);
                                                        }
                                                        if (next.length === 0) return; // ensure at least one column
                                                        formik.setFieldValue('selectedColumns', next);
                                                        if (showPreview) {
                                                            const updatedValues = { ...formik.values, selectedColumns: next };
                                                            setPreviewHtml(generateHTMLTemplate(updatedValues));
                                                        }
                                                    }}
                                                    style={{ marginRight: 4 }}
                                                />
                                                <span className="text-truncate" style={{ maxWidth: '100%' }}>{opt.label}</span>
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
                                <CButton
                                    color="secondary"
                                    onClick={onClose}
                                    variant="outline"
                                    className={isMobile ? 'w-100' : 'px-4'}
                                >
                                    {t('common.cancel')}
                                </CButton>
                                {!isMobile && (
                                    <CButton
                                        color="info"
                                        onClick={() => showPreviewModal(formik.values)}
                                        variant="outline"
                                        className="px-4"
                                    >
                                        <i className="cil-magnifying-glass me-2"></i>
                                        {t('proposalCommon.preview', 'Preview')}
                                    </CButton>
                                )}
                                <CButton
                                    color="success"
                                    onClick={() => printQuote(formik.values)}
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
                                    <i className="cil-cloud-download me-2"></i>
                                    {isLoading ? t('proposalCommon.downloading') : t('proposalCommon.downloadPdf')}
                                </CButton>
                            </div>
                        </div>
                    </CModalFooter>
                </form>
            </CModal>
                        {isMobile && (
                                <style>{`
                                    .print-quote-mobile-modal .modal-content {border-radius:0; min-height:100vh;}
                                    .print-quote-mobile-modal .modal-body {max-height: calc(100vh - 160px); overflow-y:auto;}
                                    .print-quote-mobile-modal .modal-footer {position:sticky; bottom:0; background:#fff; box-shadow:0 -2px 4px rgba(0,0,0,0.06);}
                                    @media (max-width:575.98px){
                                        .print-quote-mobile-modal .btn {font-size:0.95rem;}
                                    }
                                `}</style>
                        )}

            {/* Preview Modal */}
            <CModal
                visible={showPreview}
                onClose={() => setShowPreview(false)}
                size={modalSize}
                alignment="center"
                scrollable
                data-testid="quote-preview"
            >
                <PageHeader
                    title={t('proposalCommon.previewTitle', 'Quote Preview')}
                    onClose={() => setShowPreview(false)}
                />
                <CModalBody style={{ padding: 0 }} className="quote-preview-content">
                    <div
                        ref={previewContainerRef}
                        style={{
                            maxHeight: window.innerWidth < 768
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
                    <CButton
                        color="secondary"
                        onClick={() => setShowPreview(false)}
                        variant="outline"
                    >
                        {t('common.close')}
                    </CButton>
                    <CButton
                        color="success"
                        variant="outline"
                        onClick={() => {
                            printQuote(formik.values);
                        }}
                    >
                        <i className="cil-print me-2" />{t('proposalCommon.print', 'Print')}
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