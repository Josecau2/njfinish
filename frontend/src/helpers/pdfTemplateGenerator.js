// Centralized PDF template generator for consistent proposal formatting
// This ensures all users get the same customized PDF when printing proposals

import { buildUploadUrl } from '../utils/uploads'

export const generateProposalPdfTemplate = (
  formData,
  values,
  pdfCustomization,
  t,
  shortLabel,
  i18n,
) => {
  const {
    companyName,
    companyPhone,
    companyEmail,
    companyAddress,
    companyWebsite,
    headerColor = '#5a2a2a',
    headerLogo,
    pdfFooter,
    headerTxtColor = '#FFFFFF',
  } = pdfCustomization || {}

  // Construct logo URL consistently
  const api_url = import.meta.env.VITE_API_URL
  const logoUrl = headerLogo ? buildUploadUrl(`/uploads/manufacturer_catalogs/${headerLogo}`) : null

  // Get proposal data consistently
  const proposalSummary = {
    description: formData?.description || 'kitchen project',
    customer: formData?.customerName || '',
    date: new Date().toLocaleDateString(i18n.language || 'en-US'),
  }

  // Get manufacturer data consistently
  const manufacturerData = formData?.manufacturersData?.[0]
  const selectedVersionData = manufacturerData?.items || []
  const summary = manufacturerData?.summary || {}

  // Calculate price summary consistently
  const priceSummary =
    selectedVersionData.length > 0
      ? {
          cabinets: summary.cabinets || 0,
          assemblyFee: summary.assemblyFee || 0,
          modifications: summary.modificationsCost || 0,
          styleTotal: summary.styleTotal || 0,
          total: summary.total || 0,
          tax: summary.tax || 0,
          grandTotal: summary.grandTotal || (summary.total || 0) + (summary.tax || 0),
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

  // Filter proposal items based on user selections
  let proposalItems = []
  if (values.showProposalItems && selectedVersionData?.length > 0) {
    proposalItems = selectedVersionData.filter((item) => {
      if (!values.selectedVersions?.length) return true
      return values.selectedVersions.includes(item.versionName)
    })
  }

  // Generate table headers based on selected columns
  const generateTableHeaders = () => {
    const columnMap = {
      no: t('proposalColumns.no'),
      qty: t('proposalColumns.qty'),
      item: t('proposalColumns.item'),
      assembled: t('proposalColumns.assembled'),
      hingeSide: t('proposalColumns.hingeSide'),
      exposedSide: t('proposalColumns.exposedSide'),
      price: t('proposalColumns.price'),
      assemblyCost: t('proposalColumns.assemblyCost'),
      total: t('proposalColumns.total'),
    }

    return values.selectedColumns
      .map(
        (col) => `<th style="border: 1px solid #ccc; padding: 5px;">${columnMap[col] || col}</th>`,
      )
      .join('')
  }

  // Generate table rows based on selected columns
  const generateTableRows = () => {
    return proposalItems
      .map((item, index) => {
        const cells = values.selectedColumns
          .map((column) => {
            switch (column) {
              case 'no':
                return `<td style="border: 1px solid #ccc; padding: 5px;">${index + 1}</td>`
              case 'qty':
                return `<td style="border: 1px solid #ccc; padding: 5px;">${item.qty}</td>`
              case 'item':
                return `<td style="border: 1px solid #ccc; padding: 5px;">${item.code || ''}</td>`
              case 'assembled':
                return `<td style="border: 1px solid #ccc; padding: 5px;">${item.assembled}</td>`
              case 'hingeSide':
                return `<td style="border: 1px solid #ccc; padding: 5px;">${shortLabel(item.hingeSide)}</td>`
              case 'exposedSide':
                return `<td style="border: 1px solid #ccc; padding: 5px;">${shortLabel(item.exposedSide)}</td>`
              case 'price':
                return `<td style="border: 1px solid #ccc; padding: 5px;">$${parseFloat(item.price).toFixed(2)}</td>`
              case 'assemblyCost':
                return `<td style="border: 1px solid #ccc; padding: 5px;">$${item.includeAssemblyFee ? parseFloat(item.assemblyFee).toFixed(2) : '0.00'}</td>`
              case 'total':
                return `<td style="border: 1px solid #ccc; padding: 5px;">$${parseFloat(item.total).toFixed(2)}</td>`
              default:
                return '<td style="border: 1px solid #ccc; padding: 5px;"></td>'
            }
          })
          .join('')

        const itemRow = `<tr>${cells}</tr>`

        // Add modifications if they exist
        const modRows =
          item.modifications && item.modifications.length > 0
            ? `
                <tr>
                    <td colspan="${values.selectedColumns.length}" style="padding: 5px; background-color: #f9f9f9;"><strong>${t('proposalDoc.modifications')}</strong></td>
                </tr>
                ${item.modifications
                  .map((mod, modIdx) => {
                    const modTotal = (parseFloat(mod.price) || 0) * (mod.qty || 0)
                    const modCells = values.selectedColumns
                      .map((column) => {
                        switch (column) {
                          case 'no':
                            return `<td style="border: 1px solid #ccc; padding: 5px;">-</td>`
                          case 'qty':
                            return `<td style="border: 1px solid #ccc; padding: 5px;">${mod.qty || ''}</td>`
                          case 'item':
                            return `<td style="border: 1px solid #ccc; padding: 5px;">${mod.name || ''}</td>`
                          case 'assembled':
                          case 'hingeSide':
                          case 'exposedSide':
                          case 'assemblyCost':
                            return `<td style="border: 1px solid #ccc; padding: 5px;"></td>`
                          case 'price':
                            return `<td style="border: 1px solid #ccc; padding: 5px;">$${(parseFloat(mod.price) || 0).toFixed(2)}</td>`
                          case 'total':
                            return `<td style="border: 1px solid #ccc; padding: 5px;">$${modTotal.toFixed(2)}</td>`
                          default:
                            return '<td style="border: 1px solid #ccc; padding: 5px;"></td>'
                        }
                      })
                      .join('')
                    return `<tr>${modCells}</tr>`
                  })
                  .join('')}
                `
            : ''

        return itemRow + modRows
      })
      .join('')
  }

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
            border-bottom: 2px solid ${headerColor};
            background-color: ${headerColor};
        }

        .logo {
            max-width: 120px;
            max-height: 80px;
        }

        .company-name {
            font-size: 24px;
            font-weight: bold;
            color: ${headerTxtColor};
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
            ${
              logoUrl
                ? `<img src="${logoUrl}" alt="${t('proposalDoc.altCompanyLogo')}" class="logo">`
                : `<div class="company-name">${companyName || t('proposalDoc.fallbackCompanyName')}</div>`
            }
        </div>
        <div class="company-info">
            ${companyName ? `<div><strong>${companyName}</strong></div>` : ''}
            ${companyPhone ? `<div>${companyPhone}</div>` : ''}
            ${companyEmail ? `<div>${companyEmail}</div>` : ''}
            ${companyWebsite ? `<div>${companyWebsite}</div>` : ''}
            ${companyAddress ? `<div>${companyAddress}</div>` : ''}
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
                <th>${t('proposalDoc.summary.date')}</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>${proposalSummary.description}</td>
                <td>${proposalSummary.date}</td>
            </tr>
        </tbody>
    </table>

    ${
      proposalItems && proposalItems.length > 0
        ? `
    <!-- Proposal Items Section -->
    <div class="section-header">${t('proposalDoc.sections.proposalItems')}</div>
    <table class="items-table">
        <thead>
            <tr style="background-color: #f0f0f0;">
                ${generateTableHeaders()}
            </tr>
        </thead>
        <tbody>
            <!-- Category Row -->
            <tr class="category-row">
                <td colspan="${values.selectedColumns.length}" style="padding: 6px;"><strong>${t('proposalColumns.items')}</strong></td>
            </tr>
            <!-- Dynamically inserted rows -->
            ${generateTableRows()}
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
            <tr>
                <td class="text-left">${t('proposalDoc.priceSummary.styleTotal')}</td>
                <td class="text-right">$${priceSummary.styleTotal.toFixed(2)}</td>
            </tr>
            <tr>
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
    `
        : ''
    }

    ${
      formData?.selectedCatalog?.length > 0
        ? `
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
            ${formData.selectedCatalog
              .map(
                (item) => `
            <tr>
                <td>${item.itemName || ''}</td>
                <td>${item.quantity || 0}</td>
                <td>$${item.unitPrice || 0}</td>
                <td>$${(item.unitPrice * item.quantity).toFixed(2)}</td>
            </tr>
            `,
              )
              .join('')}
        </tbody>
    </table>
    `
        : ''
    }

    <!-- Footer -->
    <div class="main-footer-div">
        ${pdfFooter || ''}
    </div>
</body>
</html>
    `
}
