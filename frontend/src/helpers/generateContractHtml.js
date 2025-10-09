// Helper to build printable contract HTML outside React component scope.
// Accepts a translation function so consuming code can provide localized labels.
const escapeHtml = (value) => {
  const stringValue = String(value ?? '');
  return stringValue
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

/**
 * Resolves logo URL from pdfCustomization with multiple fallback keys
 * Checks: headerLogoDataUri → headerLogo → logo → logoImage
 * Prefixes relative paths with /public-uploads to prevent CORB errors
 */
const resolveLogoUrl = (pdfCustomization) => {
  if (!pdfCustomization) return null;

  // Check multiple keys for logo (legacy support)
  const logoValue = pdfCustomization.headerLogoDataUri
    || pdfCustomization.headerLogo
    || pdfCustomization.logo
    || pdfCustomization.logoImage;

  if (!logoValue) return null;

  // Data URIs pass through directly
  if (logoValue.startsWith('data:')) {
    return logoValue;
  }

  // Absolute URLs (http/https) pass through
  if (logoValue.match(/^https?:\/\//)) {
    return logoValue;
  }

  // Relative paths get /public-uploads prefix
  const cleanPath = logoValue.startsWith('/') ? logoValue : `/${logoValue}`;
  return `/public-uploads${cleanPath}`;
};


export const generateContractHtml = (formData, options = {}) => {
  const {
    t = (key) => key,
    pdfCustomization = {},
  } = options

  const items = formData?.manufacturersData?.[0]?.items || []

  // Extract customization settings
  const headerBgColor = pdfCustomization.headerBg || pdfCustomization.headerBgColor || '#2c3e50';
  const headerTxtColor = pdfCustomization.headerTxtColor || '#ffffff';
  const companyName = pdfCustomization.companyName || '';
  const companyPhone = pdfCustomization.companyPhone || '';
  const companyEmail = pdfCustomization.companyEmail || '';
  const companyWebsite = pdfCustomization.companyWebsite || '';
  const companyAddress = pdfCustomization.companyAddress || '';
  const logoUrl = resolveLogoUrl(pdfCustomization);

  const pdf = {
    title: t('nav.contracts'),
    sectionHeader: t('contracts.pdf.sectionHeader'),
    columns: {
      no: t('contracts.pdf.columns.no'),
      qty: t('contracts.pdf.columns.qty'),
      item: t('contracts.pdf.columns.item'),
      assembled: t('contracts.pdf.columns.assembled'),
      hingeSide: t('contracts.pdf.columns.hingeSide'),
      exposedSide: t('contracts.pdf.columns.exposedSide'),
      price: t('contracts.pdf.columns.price'),
      assemblyFee: t('contracts.pdf.columns.assemblyFee'),
      total: t('contracts.pdf.columns.total'),
    },
    categories: {
      items: t('contracts.pdf.categories.items'),
    },
    summary: {
      cabinets: t('contracts.pdf.summary.cabinetsParts'),
      assemblyFee: t('contracts.pdf.summary.assemblyFee'),
      modifications: t('contracts.pdf.summary.modifications'),
      styleTotal: t('contracts.pdf.summary.styleTotal'),
      total: t('contracts.pdf.summary.total'),
      tax: t('contracts.pdf.summary.tax'),
      grandTotal: t('contracts.pdf.summary.grandTotal'),
    },
    yes: t('common.yes'),
    no: t('common.no'),
    na: t('common.na'),
  }

  const proposalItems = items.map((item) => ({
    qty: item.qty || 0,
    code: item.code || '',
    assembled: !!item.isRowAssembled,
    hingeSide: item.hingeSide || null,
    exposedSide: item.exposedSide || null,
    price: parseFloat(item.price) || 0,
    assemblyCost: item.includeAssemblyFee ? parseFloat(item.assemblyFee) || 0 : 0,
    total: item.includeAssemblyFee ? parseFloat(item.total) || 0 : parseFloat(item.price) || 0,
    modifications: item.modifications || {},
  }))

  const summary = formData?.manufacturersData?.[0]?.summary || {}

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
      }

  return `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="utf-8">
          <title>${escapeHtml(pdf.title)}</title>
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
                line-height: 1.6;
                color: #2d3748;
              }

              /* Branded Header Section */
              .pdf-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                padding: 24px;
                margin-bottom: 32px;
                background: ${headerBgColor};
                background: linear-gradient(135deg, ${headerBgColor} 0%, ${headerBgColor}dd 100%);
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
              }

              .header-left {
                flex: 1;
                display: flex;
                align-items: center;
                gap: 20px;
              }

              .logo-container {
                flex-shrink: 0;
              }

              .logo {
                max-width: 120px;
                max-height: 80px;
                object-fit: contain;
              }

              .company-name {
                font-size: 28px;
                font-weight: 700;
                color: ${headerTxtColor};
                margin-bottom: 4px;
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
              }

              .document-title {
                font-size: 16px;
                font-weight: 600;
                color: ${headerTxtColor};
                opacity: 0.9;
                text-transform: uppercase;
                letter-spacing: 1px;
              }

              .header-right {
                text-align: right;
              }

              .company-info {
                line-height: 1.8;
                color: ${headerTxtColor};
                font-size: 13px;
              }

              .company-info div {
                margin-bottom: 4px;
                opacity: 0.95;
              }

              .company-info strong {
                font-weight: 600;
                margin-right: 8px;
              }

              /* Content Sections */
              .section-header {
                font-size: 18px;
                font-weight: 700;
                margin: 32px 0 16px 0;
                padding-bottom: 8px;
                border-bottom: 3px solid ${headerBgColor};
                color: #1a202c;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }

              /* Items Table */
              .items-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 24px;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
              }

              .items-table th {
                background: linear-gradient(180deg, #f7fafc 0%, #edf2f7 100%);
                padding: 12px 10px;
                border: 1px solid #cbd5e0;
                font-weight: 700;
                text-align: left;
                font-size: 11px;
                color: #2d3748;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }

              .items-table td {
                padding: 10px;
                border: 1px solid #e2e8f0;
                font-size: 11px;
                color: #4a5568;
              }

              .items-table tr:nth-child(even) {
                background-color: #f7fafc;
              }

              .items-table tr:hover {
                background-color: #edf2f7;
              }

              .category-row {
                background: linear-gradient(180deg, #e2e8f0 0%, #cbd5e0 100%) !important;
                font-weight: 700;
                color: #2d3748;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }

              .category-row td {
                padding: 10px !important;
                font-size: 12px !important;
              }

              .text-right {
                text-align: right;
              }

              .text-left {
                text-align: left;
              }

              .text-center {
                text-align: center;
              }

              /* Price Summary */
              .price-summary {
                background: linear-gradient(180deg, #ffffff 0%, #f7fafc 100%);
                border: 2px solid #e2e8f0;
                border-radius: 8px;
                padding: 20px;
                margin-top: 24px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
              }

              .price-summary table {
                width: 100%;
                border-collapse: collapse;
              }

              .price-summary td {
                padding: 8px 0;
                font-size: 13px;
              }

              .price-summary .text-left {
                color: #4a5568;
                font-weight: 600;
              }

              .price-summary .text-right {
                color: #2d3748;
                font-weight: 600;
              }

              .price-summary .total-row {
                font-weight: 700;
                border-top: 2px solid #cbd5e0;
                border-bottom: 1px solid #e2e8f0;
                padding-top: 10px !important;
              }

              .price-summary .grand-total {
                font-weight: 700;
                font-size: 16px;
                color: #1a202c;
                background: linear-gradient(180deg, #edf2f7 0%, #e2e8f0 100%);
                border-radius: 6px;
                padding: 12px 0 !important;
                margin-top: 8px;
              }

              .price-summary .grand-total td {
                padding-left: 12px;
                padding-right: 12px;
              }

              /* Footer */
              .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 2px solid #e2e8f0;
                text-align: center;
                color: #718096;
                font-size: 11px;
              }

              /* Print Optimizations */
              @media print {
                body {
                  print-color-adjust: exact;
                  -webkit-print-color-adjust: exact;
                }

                .pdf-header {
                  page-break-inside: avoid;
                }

                .items-table {
                  page-break-inside: auto;
                }

                .items-table tr {
                  page-break-inside: avoid;
                  page-break-after: auto;
                }

                .price-summary {
                  page-break-inside: avoid;
                }
              }
          </style>
      </head>
      <body>
          <!-- Branded Header -->
          <div class="pdf-header">
              <div class="header-left">
                  ${logoUrl ? `
                  <div class="logo-container">
                      <img src="${logoUrl}" alt="Company Logo" class="logo" />
                  </div>
                  ` : ''}
                  <div>
                      ${companyName ? `<div class="company-name">${escapeHtml(companyName)}</div>` : ''}
                      <div class="document-title">${escapeHtml(pdf.title)}</div>
                  </div>
              </div>
              ${companyName || companyPhone || companyEmail || companyWebsite || companyAddress ? `
              <div class="header-right">
                  <div class="company-info">
                      ${companyPhone ? `<div><strong>Phone:</strong> ${escapeHtml(companyPhone)}</div>` : ''}
                      ${companyEmail ? `<div><strong>Email:</strong> ${escapeHtml(companyEmail)}</div>` : ''}
                      ${companyWebsite ? `<div><strong>Web:</strong> ${escapeHtml(companyWebsite)}</div>` : ''}
                      ${companyAddress ? `<div><strong>Address:</strong> ${escapeHtml(companyAddress)}</div>` : ''}
                  </div>
              </div>
              ` : ''}
          </div>

          <!-- Contract Content -->
          ${
            items && items.length > 0
              ? `
          <div class="section-header">${escapeHtml(pdf.sectionHeader)}</div>
          <table class="items-table">
              <thead>
                  <tr>
                      <th>${escapeHtml(pdf.columns.no)}</th>
                      <th>${escapeHtml(pdf.columns.qty)}</th>
                      <th>${escapeHtml(pdf.columns.item)}</th>
                      <th class="text-center">${escapeHtml(pdf.columns.assembled)}</th>
                      <th class="text-center">${escapeHtml(pdf.columns.hingeSide)}</th>
                      <th class="text-center">${escapeHtml(pdf.columns.exposedSide)}</th>
                      <th class="text-right">${escapeHtml(pdf.columns.price)}</th>
                      <th class="text-right">${escapeHtml(pdf.columns.assemblyFee)}</th>
                      <th class="text-right">${escapeHtml(pdf.columns.total)}</th>
                  </tr>
              </thead>
              <tbody>
                  <tr class="category-row">
                      <td colspan="9"><strong>${escapeHtml(pdf.categories.items)}</strong></td>
                  </tr>
                  ${items
                    .map(
                      (item, index) => {
                        const qty = item.qty || 0;
                        const code = escapeHtml(item.code || '');
                        const assembled = item.isRowAssembled ? pdf.yes : pdf.no;
                        const hingeSide = escapeHtml(item.hingeSide || pdf.na);
                        const exposedSide = escapeHtml(item.exposedSide || pdf.na);
                        const price = parseFloat(item.price) || 0;
                        const assemblyFee = item.includeAssemblyFee ? (parseFloat(item.assemblyFee) || 0) : 0;
                        const total = item.includeAssemblyFee
                          ? (parseFloat(item.total) || 0)
                          : (parseFloat(item.price) || 0);

                        return `
                      <tr>
                          <td>${index + 1}</td>
                          <td>${qty}</td>
                          <td>${code}</td>
                          <td class="text-center">${assembled}</td>
                          <td class="text-center">${hingeSide}</td>
                          <td class="text-center">${exposedSide}</td>
                          <td class="text-right">$${price.toFixed(2)}</td>
                          <td class="text-right">$${assemblyFee.toFixed(2)}</td>
                          <td class="text-right">$${total.toFixed(2)}</td>
                      </tr>
                        `;
                      }
                    )
                    .join('')}
              </tbody>
          </table>

          <!-- Price Summary -->
          ${(() => {
            const summary = formData?.manufacturersData?.[0]?.summary || {};
            const priceSummary = {
              cabinets: summary.cabinets || 0,
              assemblyFee: summary.assemblyFee || 0,
              modifications: summary.modificationsCost || 0,
              styleTotal: summary.styleTotal || 0,
              total: summary.total || 0,
              tax: summary.taxAmount || 0,
              grandTotal: summary.grandTotal || 0,
            };

            return `
          <div class="price-summary">
              <table>
                  <tr>
                      <td class="text-left">${escapeHtml(pdf.summary.cabinets)}</td>
                      <td class="text-right">$${priceSummary.cabinets.toFixed(2)}</td>
                  </tr>
                  <tr>
                      <td class="text-left">${escapeHtml(pdf.summary.assemblyFee)}</td>
                      <td class="text-right">$${priceSummary.assemblyFee.toFixed(2)}</td>
                  </tr>
                  <tr class="total-row">
                      <td class="text-left">${escapeHtml(pdf.summary.modifications)}</td>
                      <td class="text-right">$${priceSummary.modifications.toFixed(2)}</td>
                  </tr>
                  <tr>
                      <td class="text-left">${escapeHtml(pdf.summary.styleTotal)}</td>
                      <td class="text-right">$${priceSummary.styleTotal.toFixed(2)}</td>
                  </tr>
                  <tr>
                      <td class="text-left">${escapeHtml(pdf.summary.total)}</td>
                      <td class="text-right">$${priceSummary.total.toFixed(2)}</td>
                  </tr>
                  <tr class="total-row">
                      <td class="text-left">${escapeHtml(pdf.summary.tax)}</td>
                      <td class="text-right">$${priceSummary.tax.toFixed(2)}</td>
                  </tr>
                  <tr class="grand-total">
                      <td class="text-left">${escapeHtml(pdf.summary.grandTotal)}</td>
                      <td class="text-right">$${priceSummary.grandTotal.toFixed(2)}</td>
                  </tr>
              </table>
          </div>
            `;
          })()}
          `
              : '<div class="section-header">No items to display</div>'
          }

          <!-- Footer -->
          <div class="footer">
              ${companyName ? `<div>© ${new Date().getFullYear()} ${escapeHtml(companyName)}. All rights reserved.</div>` : ''}
              <div>Generated on ${new Date().toLocaleDateString()}</div>
          </div>
      </body>
      </html>
    `;
}

