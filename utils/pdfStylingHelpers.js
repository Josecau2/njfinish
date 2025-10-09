/**
 * Shared PDF styling and header utilities for consistent branding across all PDF documents
 * (proposals, orders, receipts, invoices, etc.)
 */

const escapeHtml = (str = '') => {
  if (typeof str !== 'string') {
    return str ?? ''
  }
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Resolve logo URL from various possible inputs (data URI, relative path, absolute URL)
 * Handles legacy keys and ensures proper path construction
 */
const resolveLogoUrl = (pdfCustomization = {}, apiUrl = '', uploadBase = '') => {
  const {
    headerLogoDataUri,
    headerLogo,
    logo,
    logoImage,
  } = pdfCustomization

  const candidateLogoRaw = headerLogoDataUri || headerLogo || logo || logoImage || null

  if (!candidateLogoRaw || typeof candidateLogoRaw !== 'string') return null
  const trimmed = candidateLogoRaw.trim()
  if (!trimmed) return null

  // Already a data URI or absolute URL
  if (/^(data:|https?:\/\/)/i.test(trimmed) || /^\/\//.test(trimmed)) {
    return trimmed
  }

  // Handle relative paths - normalize and prepend base
  const normalized = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  const base = uploadBase || apiUrl?.replace(/\/+$/, '') || ''

  if (!base) return normalized // relative only

  // Prefer public-uploads path to avoid CORB
  if (normalized.startsWith('/uploads/')) {
    return `${base}/public-uploads${normalized}`
  }

  return `${base}${normalized}`
}

/**
 * Generate consistent styled header HTML for all PDF documents
 * Includes logo (if available) and company contact information
 */
const buildPdfHeader = ({
  pdfCustomization = {},
  title = '',
  apiUrl = '',
  uploadBase = '',
  t = (key, defaultValue) => defaultValue || key,
} = {}) => {
  const {
    companyName,
    companyPhone,
    companyEmail,
    companyWebsite,
    companyAddress,
    headerBgColor = '#000000',
    headerTxtColor = '#FFFFFF',
  } = pdfCustomization

  const logoUrl = resolveLogoUrl(pdfCustomization, apiUrl, uploadBase)

  return `
    <div class="header">
      <div class="header-left">
        ${logoUrl
          ? `<img src="${logoUrl}" alt="${escapeHtml(t('pdf.altCompanyLogo', 'Company Logo'))}" class="logo">`
          : `<div class="company-name">${escapeHtml(companyName || t('pdf.fallbackCompanyName', 'Your Company'))}</div>`
        }
      </div>
      <div class="header-right">
        <div class="company-info">
          ${companyName ? `<div><strong>${escapeHtml(companyName)}</strong></div>` : ''}
          ${companyPhone ? `<div>${escapeHtml(companyPhone)}</div>` : ''}
          ${companyEmail ? `<div>${escapeHtml(companyEmail)}</div>` : ''}
          ${companyWebsite ? `<div>${escapeHtml(companyWebsite)}</div>` : ''}
          ${companyAddress ? `<div style="white-space: pre-line; font-style: italic; margin-top: 0.5rem;">${escapeHtml(companyAddress)}</div>` : ''}
        </div>
      </div>
    </div>
  `
}

/**
 * Shared CSS styles for all PDF documents
 * Ensures consistent branding, typography, and layout
 */
const getPdfStyles = (pdfCustomization = {}) => {
  const {
    headerBgColor = '#000000',
    headerTxtColor = '#FFFFFF',
  } = pdfCustomization

  return `
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
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
        font-size: 11px;
        line-height: 1.5;
        color: #1f2937;
        background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%);
        padding: 24px;
      }

      .page-wrapper {
        max-width: 820px;
        margin: 0 auto;
        background: #ffffff;
        border-radius: 12px;
        box-shadow: 0 20px 45px rgba(15, 23, 42, 0.12);
        overflow: hidden;
      }

      .header {
        display: flex;
        justify-content: space-between;
        align-items: stretch;
        padding: 28px 32px;
        background: ${headerBgColor};
        color: ${headerTxtColor};
      }

      .header-left {
        display: flex;
        align-items: center;
      }

      .header-left .logo {
        max-height: 64px;
        max-width: 220px;
        object-fit: contain;
        display: block;
      }

      .header-left .company-name {
        font-size: 24px;
        font-weight: 700;
        letter-spacing: 1px;
      }

      .header-right {
        text-align: right;
        display: flex;
        align-items: center;
      }

      .header-right .company-info {
        font-size: 11px;
        line-height: 1.6;
        letter-spacing: 0.3px;
      }

      .content-wrapper {
        padding: 32px;
      }

      .greeting {
        font-size: 13px;
        margin-bottom: 18px;
        color: #1f2937;
      }

      .description {
        font-size: 11px;
        margin-bottom: 24px;
        color: #475569;
      }

      .summary-table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
        margin-bottom: 30px;
        border-radius: 10px;
        overflow: hidden;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
      }

      .summary-table th {
        background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
        padding: 10px 12px;
        border: 1px solid #e5e7eb;
        font-weight: 600;
        text-align: left;
        font-size: 10.5px;
        color: #1f2937;
        text-transform: uppercase;
        letter-spacing: 0.3px;
      }

      .summary-table th:first-child {
        border-top-left-radius: 10px;
      }

      .summary-table th:last-child {
        border-top-right-radius: 10px;
      }

      .summary-table td {
        padding: 10px 12px;
        border: 1px solid #e5e7eb;
        border-top: none;
        font-size: 10.5px;
        color: #374151;
      }

      .items-table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
        margin-bottom: 16px;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
      }

      .items-table th {
        background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
        padding: 8px 10px;
        border: 1px solid #e5e7eb;
        font-weight: 600;
        text-align: left;
        font-size: 9.5px;
        color: #374151;
        text-transform: uppercase;
        letter-spacing: 0.3px;
      }

      .items-table th:first-child {
        border-top-left-radius: 8px;
      }

      .items-table th:last-child {
        border-top-right-radius: 8px;
      }

      .items-table td {
        padding: 7px 10px;
        border: 1px solid #e5e7eb;
        border-top: none;
        font-size: 9.5px;
        color: #374151;
      }

      .items-table tr:nth-child(even) {
        background-color: #fafbfc;
      }

      .text-right {
        text-align: right;
      }

      .text-left {
        text-align: left;
      }

      .main-footer-div {
        margin-top: 40px;
        text-align: center;
        color: #9ca3af;
        font-size: 9px;
        padding-top: 20px;
        border-top: 1px solid #e5e7eb;
      }

      .price-summary {
        background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%);
        border: 1px solid #e5e7eb;
        border-radius: 10px;
        padding: 16px 20px;
        margin-top: 16px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-size: 11px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      }

      .price-summary table {
        width: 100%;
        border-collapse: collapse;
      }

      .price-summary td {
        padding: 6px 0;
      }

      .price-summary .text-left {
        text-align: left;
        color: #374151;
        font-weight: 500;
      }

      .price-summary .text-right {
        text-align: right;
        color: #111827;
        font-weight: 600;
      }

      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          background-color: #ffffff;
          padding: 0;
        }

        .page-wrapper {
          max-width: none;
          margin: 0;
          padding: 0;
          box-shadow: none;
          border-radius: 0;
        }
      }
    </style>
  `
}

module.exports = {
  escapeHtml,
  resolveLogoUrl,
  buildPdfHeader,
  getPdfStyles,
}
