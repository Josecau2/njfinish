// Helper to build printable contract HTML outside React component scope.
// Accepts a translation function so consuming code can provide localized labels.
export const generateContractHtml = (formData, options = {}) => {
  const {
    t = (key) => key,
    headerColor = 'var(--chakra-colors-white)',
    headerTextColor = 'var(--chakra-colors-black)',
  } = options

  const items = formData?.manufacturersData?.[0]?.items || []

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
      <title>${pdf.title}</title>
          <style>
              @page { margin: 20mm; size: A4; }
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: 'Arial', sans-serif; font-size: 12px; line-height: 1.4; color: var(--chakra-colors-gray-700); }
              .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; padding: 20px; border-bottom: 2px solid ${headerColor}; background-color: ${headerColor}; }
              .logo { max-width: 120px; max-height: 80px; }
              .company-name { font-size: 24px; font-weight: bold; color: white; }
              .company-info { text-align: right; line-height: 1.6; color: ${headerTextColor}; }
              .section-header { font-size: 16px; font-weight: bold; margin: 25px 0 15px 0; text-transform: uppercase; letter-spacing: 0.5px; }
              .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
              .items-table th { background-color: var(--chakra-colors-gray-50); padding: 10px 8px; border: 1px solid var(--chakra-colors-gray-200); font-weight: bold; text-align: left; font-size: 11px; }
              .items-table td { padding: 8px; border: 1px solid var(--chakra-colors-gray-200); font-size: 10px; }
              .items-table tr:nth-child(even) { background-color: var(--chakra-colors-gray-50); }
              .category-row { background-color: var(--chakra-colors-gray-200) !important; font-weight: bold; }
              .text-right { text-align: right; }
              .text-left { text-align: left; }
              .price-summary { background-color: var(--chakra-colors-gray-50); border: 1px solid var(--chakra-colors-gray-200); border-radius: 0.5rem; padding: 1rem; margin-top: 1rem; font-family: 'Arial', sans-serif; font-size: 0.95rem; }
              .price-summary table { width: 100%; border-collapse: collapse; }
              .price-summary td { padding: 0.25rem 0; }
              .price-summary .text-left { text-align: left; color: var(--chakra-colors-gray-800); font-weight: 500; }
              .price-summary .text-right { text-align: right; color: var(--chakra-colors-gray-800); font-weight: 500; }
              .price-summary .total-row { font-weight: bold; border-bottom: 1px solid var(--chakra-colors-gray-300); padding-top: 0.25rem; }
              .price-summary .grand-total { font-weight: bold; font-size: 1.05rem; color: var(--chakra-colors-gray-900); padding-top: 0.75rem; }
          </style>
      </head>
      <body>
          ${
            proposalItems && proposalItems.length > 0
              ? `
      <div class="section-header">${pdf.sectionHeader}</div>
          <table class="items-table">
              <thead>
                  <tr style="background-color: #f0f0f0;">
            <th style="border: 1px solid #ccc; padding: 5px;">${pdf.columns.no}</th>
            <th style="border: 1px solid #ccc; padding: 5px;">${pdf.columns.qty}</th>
            <th style="border: 1px solid #ccc; padding: 5px;">${pdf.columns.item}</th>
            <th style="border: 1px solid #ccc; padding: 5px;">${pdf.columns.assembled}</th>
            <th style="border: 1px solid #ccc; padding: 5px;">${pdf.columns.hingeSide}</th>
            <th style="border: 1px solid #ccc; padding: 5px;">${pdf.columns.exposedSide}</th>
            <th style="border: 1px solid #ccc; padding: 5px;">${pdf.columns.price}</th>
            <th style="border: 1px solid #ccc; padding: 5px;">${pdf.columns.assemblyFee}</th>
            <th style="border: 1px solid #ccc; padding: 5px;">${pdf.columns.total}</th>
                  </tr>
              </thead>
              <tbody>
                  <tr class="category-row">
            <td colspan="9" style="padding: 6px;"><strong>${pdf.categories.items}</strong></td>
                  </tr>
                  ${proposalItems
                    .map(
                      (item, index) => `
                      <tr>
                          <td style="border: 1px solid #ccc; padding: 5px;">${index + 1}</td>
                          <td style="border: 1px solid #ccc; padding: 5px;">${item.qty}</td>
                          <td style="border: 1px solid #ccc; padding: 5px;">${item.code || ''}</td>
              <td style="border: 1px solid #ccc; padding: 5px;">${item.assembled ? pdf.yes : pdf.no}</td>
              <td style="border: 1px solid #ccc; padding: 5px;">${item.hingeSide || pdf.na}</td>
              <td style="border: 1px solid #ccc; padding: 5px;">${item.exposedSide || pdf.na}</td>
                          <td style="border: 1px solid #ccc; padding: 5px;">$${parseFloat(item.price).toFixed(2)}</td>
              <td style="border: 1px solid #ccc; padding: 5px;">$${item.includeAssemblyFee ? parseFloat(item.assemblyFee).toFixed(2) : '0.00'}</td>
                          <td style="border: 1px solid #ccc; padding: 5px;">$${parseFloat(item.total).toFixed(2)}</td>
                      </tr>
                  `,
                    )
                    .join('')}
              </tbody>
          </table>
          <div class="price-summary">
              <table>
                  <tr>
            <td class="text-left">${pdf.summary.cabinets}</td>
                      <td class="text-right">$${priceSummary.cabinets.toFixed(2)}</td>
                  </tr>
                  <tr>
            <td class="text-left">${pdf.summary.assemblyFee}</td>
                      <td class="text-right">$${priceSummary.assemblyFee.toFixed(2)}</td>
                  </tr>
                  <tr class="total-row">
            <td class="text-left">${pdf.summary.modifications}</td>
                      <td class="text-right">$${priceSummary.modifications.toFixed(2)}</td>
                  </tr>
                  <tr>
            <td class="text-left">${pdf.summary.styleTotal}</td>
                      <td class="text-right">$${priceSummary.styleTotal.toFixed(2)}</td>
                  </tr>
                  <tr>
            <td class="text-left">${pdf.summary.total}</td>
                      <td class="text-right">$${priceSummary.total.toFixed(2)}</td>
                  </tr>
                  <tr class="total-row">
            <td class="text-left">${pdf.summary.tax}</td>
                      <td class="text-right">$${priceSummary.tax.toFixed(2)}</td>
                  </tr>
                  <tr class="grand-total">
            <td class="text-left">${pdf.summary.grandTotal}</td>
                      <td class="text-right">$${priceSummary.grandTotal.toFixed(2)}</td>
                  </tr>
              </table>
          </div>
          `
              : ''
          }
      </body>
      </html>
    `
}

