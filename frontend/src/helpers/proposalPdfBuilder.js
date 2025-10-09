import resolveAssetUrl from '../utils/assetUtils'
import { getUploadApiBase } from '../utils/uploads'

const DEFAULT_COLUMNS = [
  'no',
  'qty',
  'item',
  'assembled',
  'hingeSide',
  'exposedSide',
  'price',
  'assemblyCost',
  'total',
]

const defaultTranslator = (key, defaultValue) => (defaultValue !== undefined ? defaultValue : key)
const identityShortLabel = (code) => code ?? ''

const toNumber = (value) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0
  }
  if (value === null || value === undefined) {
    return 0
  }
  const parsed = parseFloat(String(value).replace(/[^0-9.-]/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

const safeToFixed = (value, decimals = 2) => toNumber(value).toFixed(decimals)

const ensureArray = (value) => {
  if (!value) {
    return []
  }
  if (Array.isArray(value)) {
    return value
  }
  if (typeof value === 'object') {
    return Object.values(value)
  }
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    return []
  }
}

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

const sanitizeFooterHtml = (html = '') => {
  if (typeof html !== 'string') {
    return ''
  }

  let sanitized = html
  sanitized = sanitized.replace(/<\s*script[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi, '')
  sanitized = sanitized.replace(/on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
  sanitized = sanitized.replace(/javascript\s*:/gi, '')
  sanitized = sanitized.replace(/<\s*\/?\s*(?:iframe|object|embed|link|style)\b[^>]*>/gi, '')

  return sanitized
}

const computeManufacturerName = (formData, manufacturerData, manufacturerNameData) => {
  return (
    manufacturerData?.manufacturerData?.name ||
    manufacturerData?.name ||
    manufacturerData?.manufacturer?.name ||
    manufacturerNameData?.name ||
    manufacturerNameData?.manufacturer?.name ||
    formData?.manufacturerData?.name ||
    ''
  )
}

const computeStyleName = (manufacturerData, styleData) => {
  if (!manufacturerData) {
    return ''
  }

  return (
    manufacturerData?.styleName ||
    manufacturerData?.selectedStyleData?.style ||
    styleData?.style ||
    manufacturerData?.styleData?.style ||
    ''
  )
}

const buildColumnHeaders = (cols, t) => {
  return cols
    .map((col) => {
      const columnTranslations = {
        no: t('proposalColumns.no', 'No.'),
        qty: t('proposalColumns.qty', 'Qty'),
        item: t('proposalColumns.item', 'Item'),
        assembled: t('proposalColumns.assembled', 'Assembled'),
        hingeSide: t('proposalColumns.hingeSide', 'Hinge Side'),
        exposedSide: t('proposalColumns.exposedSide', 'Exposed Side'),
        price: t('proposalColumns.price', 'Price'),
        assemblyCost: t('proposalColumns.assemblyCost', 'Assembly Cost'),
        total: t('proposalColumns.total', 'Total'),
      }

      const alignRight = ['price', 'assemblyCost', 'total'].includes(col)
        ? 'text-align: right;'
        : ''
      return `<th style="border: 1px solid #e5e7eb; padding: 8px 10px; ${alignRight}">${columnTranslations[col] || col}</th>`
    })
    .join('')
}

const buildItemRows = (items, cols, t, shortLabel) => {
  const yesLabel = t('common.yes', 'Yes')
  const noLabel = t('common.no', 'No')
  const naLabel = t('common.na', 'N/A')

  return items
    .map((item, index) => {
      const rowCells = cols
        .map((col) => {
          switch (col) {
            case 'no':
              return `<td style="border: 1px solid #e5e7eb; padding: 7px 10px; font-size: 9.5px;">${index + 1}</td>`
            case 'qty':
              return `<td style="border: 1px solid #e5e7eb; padding: 7px 10px; font-size: 9.5px;">${toNumber(item.qty)}</td>`
            case 'item':
              return `<td style="border: 1px solid #e5e7eb; padding: 7px 10px; font-size: 9.5px; font-weight: 500;">${escapeHtml(item.code || '')}</td>`
            case 'assembled':
              return `<td style="border: 1px solid #e5e7eb; padding: 7px 10px; font-size: 9.5px;">${item.isRowAssembled ? yesLabel : noLabel}</td>`
            case 'hingeSide':
              return `<td style="border: 1px solid #e5e7eb; padding: 7px 10px; font-size: 9.5px;">${shortLabel(item.hingeSide || naLabel)}</td>`
            case 'exposedSide':
              return `<td style="border: 1px solid #e5e7eb; padding: 7px 10px; font-size: 9.5px;">${shortLabel(item.exposedSide || naLabel)}</td>`
            case 'price':
              return `<td style="border: 1px solid #e5e7eb; padding: 7px 10px; text-align: right; font-size: 9.5px;">$${safeToFixed(item.price)}</td>`
            case 'assemblyCost': {
              const assemblyCost = item.includeAssemblyFee ? item.assemblyFee : 0
              return `<td style="border: 1px solid #e5e7eb; padding: 7px 10px; text-align: right; font-size: 9.5px;">$${safeToFixed(assemblyCost)}</td>`
            }
            case 'total': {
              const totalValue = item.includeAssemblyFee ? item.total : item.price
              return `<td style="border: 1px solid #e5e7eb; padding: 7px 10px; text-align: right; font-size: 9.5px; font-weight: 600;">$${safeToFixed(totalValue)}</td>`
            }
            default:
              return `<td style="border: 1px solid #e5e7eb; padding: 7px 10px; font-size: 9.5px;"></td>`
          }
        })
        .join('')

      const descriptionRow = item.description
        ? `<tr class="item-description-row"><td colspan="${cols.length}" style="border: 1px solid #e5e7eb; border-top: none; padding: 6px 10px; font-size: 9px; color: #6b7280; background: #fafbfc; font-style: italic;">${escapeHtml(item.description)}</td></tr>`
        : ''

      const mods = ensureArray(item.modifications)
      let modificationsRows = ''

      if (mods.length > 0) {
        const modsHeader = `<tr class="mods-header-row"><td colspan="${cols.length}" style="padding: 7px 10px; background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); font-style: italic; font-weight: 600; font-size: 9.5px; color: #374151; border: 1px solid #e5e7eb; border-top: none;">${t('proposalDoc.modifications', 'Modifications')}</td></tr>`
        const modRows = mods
          .map((mod) => {
            const price = toNumber(mod.price)
            const qty = toNumber(mod.qty || 1)
            const total = price * qty

            const modCells = cols
              .map((col) => {
                switch (col) {
                  case 'no':
                    return `<td style="border: 1px solid #e5e7eb; border-top: none; padding: 6px 10px; font-size: 9px; color: #9ca3af;">-</td>`
                  case 'qty':
                    return `<td style="border: 1px solid #e5e7eb; border-top: none; padding: 6px 10px; font-size: 9px;">${qty || ''}</td>`
                  case 'item':
                    return `<td style="border: 1px solid #e5e7eb; border-top: none; padding: 6px 10px; font-size: 9px; color: #374151;">${escapeHtml(mod.name || mod.description || '')}</td>`
                  case 'price':
                    return `<td style="border: 1px solid #e5e7eb; border-top: none; padding: 6px 10px; text-align: right; font-size: 9px;">$${safeToFixed(price)}</td>`
                  case 'total':
                    return `<td style="border: 1px solid #e5e7eb; border-top: none; padding: 6px 10px; text-align: right; font-size: 9px; font-weight: 600;">$${safeToFixed(total)}</td>`
                  case 'assemblyCost':
                  case 'assembled':
                  case 'hingeSide':
                  case 'exposedSide':
                    return `<td style="border: 1px solid #e5e7eb; border-top: none; padding: 6px 10px; font-size: 9px;"></td>`
                  default:
                    return `<td style="border: 1px solid #e5e7eb; border-top: none; padding: 6px 10px; font-size: 9px;"></td>`
                }
              })
              .join('')

            return `<tr class="mod-row">${modCells}</tr>`
          })
          .join('')

        modificationsRows = modsHeader + modRows
      }

      return `<tr>${rowCells}</tr>${descriptionRow}${modificationsRows}`
    })
    .join('')
}

const buildPriceSummary = (summary, t) => {
  return `
        <div class="price-summary">
            <table>
                <tr>
                    <td class="text-left"><strong>${t('proposalDoc.priceSummary.cabinets', 'Cabinets & Parts:')}</strong></td>
                    <td class="text-right"><strong>$${safeToFixed(summary.cabinets)}</strong></td>
                </tr>
                <tr>
                    <td class="text-left"><strong>${t('proposalDoc.priceSummary.assembly', 'Assembly fee:')}</strong></td>
                    <td class="text-right"><strong>$${safeToFixed(summary.assemblyFee)}</strong></td>
                </tr>
                <tr>
                    <td class="text-left"><strong>${t('proposalDoc.priceSummary.modifications', 'Modifications:')}</strong></td>
                    <td class="text-right"><strong>$${safeToFixed(summary.modifications)}</strong></td>
                </tr>
                <tr class="total-row">
                    <td class="text-left"><strong>${t('proposalDoc.priceSummary.styleTotal', 'Style Total:')}</strong></td>
                    <td class="text-right"><strong>$${safeToFixed(summary.styleTotal)}</strong></td>
                </tr>
                <tr>
                    <td class="text-left"><strong>${t('proposalDoc.priceSummary.total', 'Total:')}</strong></td>
                    <td class="text-right"><strong>$${safeToFixed(summary.total)}</strong></td>
                </tr>
                <tr class="total-row">
                    <td class="text-left"><strong>${t('proposalDoc.priceSummary.tax', 'Tax:')}</strong></td>
                    <td class="text-right"><strong>$${safeToFixed(summary.tax)}</strong></td>
                </tr>
                <tr class="grand-total">
                    <td class="text-left">${t('proposalDoc.priceSummary.grandTotal', 'Grand Total')}</td>
                    <td class="text-right">$${safeToFixed(summary.grandTotal)}</td>
                </tr>
            </table>
        </div>
    `
}

export const buildProposalPdfHtml = ({
  formData = {},
  options = {},
  pdfCustomization = {},
  t = defaultTranslator,
  i18n = { language: 'en-US' },
  shortLabel = identityShortLabel,
  styleData,
  manufacturerNameData,
} = {}) => {
  const apiUrl =
    typeof import.meta !== 'undefined' && import.meta?.env ? import.meta.env.VITE_API_URL || '' : ''
  const uploadBase = getUploadApiBase()

  const {
    selectedColumns = DEFAULT_COLUMNS,
    showProposalItems = true,
    showPriceSummary = true,
    selectedVersions = [],
    includeCatalog = true,
    suppressPrices = false,
  } = options

  // If suppressPrices, remove price-related columns and hide summaries/catalog pricing
  const effectiveColumns = Array.isArray(selectedColumns)
    ? selectedColumns.filter((c) =>
        suppressPrices ? !['price', 'assemblyCost', 'total'].includes(c) : true,
      )
    : DEFAULT_COLUMNS.filter((c) =>
        suppressPrices ? !['price', 'assemblyCost', 'total'].includes(c) : true,
      )

  let manufacturersData = formData?.manufacturersData
  if (typeof manufacturersData === 'string') {
    try {
      manufacturersData = JSON.parse(manufacturersData)
    } catch (_) {
      manufacturersData = []
    }
  }
  if (!Array.isArray(manufacturersData)) {
    manufacturersData = ensureArray(manufacturersData)
  }

  const manufacturerData = manufacturersData[0] || {}
  const items = ensureArray(manufacturerData.items)

  const filteredItems = !selectedVersions?.length
    ? items
    : items.filter(
        (item) =>
          selectedVersions.includes(item.versionName) ||
          selectedVersions.includes(item.selectVersion),
      )

  const summaryRaw = manufacturerData?.summary || {}
  const priceSummary = {
    cabinets: toNumber(summaryRaw.cabinets),
    assemblyFee: toNumber(summaryRaw.assemblyFee),
    modifications: toNumber(summaryRaw.modificationsCost),
    styleTotal: toNumber(summaryRaw.styleTotal),
    total: toNumber(summaryRaw.total),
    tax: toNumber(summaryRaw.taxAmount ?? summaryRaw.tax),
    grandTotal: toNumber(summaryRaw.grandTotal),
  }

  const yesLabel = t('common.yes', 'Yes')
  const noLabel = t('common.no', 'No')
  const naLabel = t('common.na', 'N/A')

  const proposalItems = filteredItems.map((item) => ({
    ...item,
    qty: toNumber(item.qty || item.quantity || 0),
    price: toNumber(item.price),
    assemblyFee: toNumber(item.assemblyFee),
    total: toNumber(item.total),
    hingeSide: item.hingeSide || naLabel,
    exposedSide: item.exposedSide || naLabel,
    isRowAssembled: Boolean(item.isRowAssembled),
    modifications: ensureArray(item.modifications),
    description: item.description || '',
    code: item.code || item.itemNumber || '',
  }))

  const columnHeaders = buildColumnHeaders(effectiveColumns, t)
  const proposalItemRows = buildItemRows(proposalItems, effectiveColumns, t, shortLabel)

  const {
    companyName,
    companyPhone,
    companyEmail,
    companyAddress,
    companyWebsite,
    headerBgColor = '#000000',
    // Different endpoints / legacy data may provide any of these keys
    headerLogoDataUri,
    headerLogo, // preferred (may already be absolute from backend controller)
    logo, // legacy key saved from customization UI (raw filename or path)
    logoImage, // fallback from main customization table
    pdfFooter,
    headerTxtColor = '#FFFFFF',
  } = pdfCustomization || {}

  const proposalSummary = {
    description:
      formData?.description || t('proposalDoc.defaultProjectDescription', 'Kitchen Project'),
    customer: formData?.customerName || formData?.customer?.name || '',
    date: new Date(formData?.date || Date.now()).toLocaleDateString(i18n?.language || 'en-US'),
  }

  const designerName = formData?.designerData?.name || ''
  const manufacturerName = computeManufacturerName(formData, manufacturerData, manufacturerNameData)
  const styleName = computeStyleName(manufacturerData, styleData)
  const manufacturerId = manufacturerData?.manufacturer || manufacturerData?.manufacturerId

  // --- Robust logo resolution ---
  // We accept several possible inputs for the logo, in priority order.
  // 1. headerLogo (already absolute per backend controller getCustomizationpdf)
  // 2. headerLogo relative path
  // 3. logo (legacy field) / logoImage (main customization) -> may be filename or relative path
  // 4. If none, null => text fallback
  const candidateLogoRaw = headerLogoDataUri || headerLogo || logo || logoImage || null

  const resolveLogoUrl = (raw) => {
    if (!raw || typeof raw !== 'string') return null
    const trimmed = raw.trim()
    if (!trimmed) return null

    // Absolute URL
    if (/^(data:|https?:\/\/)/i.test(trimmed) || /^\/\//.test(trimmed)) {
      const currentOrigin = typeof window !== 'undefined' ? window.location.origin : undefined
      const currentHostname = typeof window !== 'undefined' ? window.location.hostname : ''
      try {
        const parsed = new URL(trimmed, currentOrigin)
        if (
          (parsed.hostname === currentHostname || parsed.hostname === '') &&
          parsed.pathname.startsWith('/uploads/') &&
          uploadBase
        ) {
          return `${uploadBase.replace(/\/+$/, '')}${parsed.pathname}${parsed.search}${parsed.hash}`
        }
        return parsed.href
      } catch (_) {
        return trimmed
      }
    }

    const resolved = resolveAssetUrl(trimmed, apiUrl || uploadBase)
    if (resolved && resolved.startsWith('/uploads') && uploadBase) {
      return `${uploadBase.replace(/\/+$/, '')}${resolved}`
    }
    return resolved
  }

  const logoUrl = resolveLogoUrl(candidateLogoRaw)

  const selectedCatalog = includeCatalog ? ensureArray(formData?.selectedCatalog) : []
  const footerContent = pdfFooter
    ? pdfCustomization?.allowRawFooter
      ? sanitizeFooterHtml(pdfFooter)
      : escapeHtml(pdfFooter)
    : ''

  return `
        <!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
  <title>${t('proposalDoc.title', 'Proposal')}${formData?.proposal_number ? ' ' + escapeHtml(formData.proposal_number) : ''}</title>
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
            width: 100%;
            max-width: 794px;
            margin: 0 auto;
            background-color: #ffffff;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05);
            border-radius: 12px;
            overflow: hidden;
            padding: 32px 38px 48px;
        }

        @media screen and (max-width: 1024px) {
            body {
                padding: 28px;
            }

            .page-wrapper {
                padding: 32px 34px 44px;
            }
        }

        @media screen and (max-width: 768px) {
            body {
                padding: 18px;
            }

            .page-wrapper {
                padding: 26px 22px 38px;
                box-shadow: 0 12px 32px rgba(31, 41, 55, 0.16);
                border-radius: 14px;
            }

            .header {
                flex-direction: column;
                align-items: center;
                text-align: center;
            }

            .header-right {
                margin-top: 18px;
            }

            .company-info {
                text-align: center;
            }

            .summary-table th,
            .summary-table td {
                font-size: 11px;
                padding: 10px 8px;
            }

            .items-table th {
                font-size: 10px;
                padding: 8px 6px;
            }

            .items-table td {
                font-size: 9.5px;
                padding: 6px 5px;
            }
        }

        @media screen and (max-width: 480px) {
            body {
                padding: 12px;
            }

            .page-wrapper {
                padding: 20px 16px 32px;
                box-shadow: none;
                border-radius: 8px;
            }

            .header {
                padding: 16px;
            }

            .summary-table th,
            .summary-table td {
                font-size: 10px;
                padding: 8px 6px;
            }

            .items-table th {
                font-size: 9px;
                padding: 6px 4px;
            }

            .items-table td {
                font-size: 8.5px;
                padding: 5px 4px;
            }
        }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 30px;
      padding: 20px;
      border-bottom: 2px solid ${headerBgColor};
      background-color: ${headerBgColor};
      border-top-left-radius: 18px;
      border-top-right-radius: 18px;
      /* Ensure inner content (logo, text) respects rounded corners */
      overflow: hidden;
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

        .content-wrapper {
            margin-bottom: 30px;
        }

    .greeting {
            font-size: 13px;
            font-weight: 500;
            margin-bottom: 12px;
            color: #1f2937;
        }

    .description {
            font-size: 11px;
            margin-bottom: 20px;
            color: #6b7280;
            line-height: 1.6;
        }

        .summary-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            margin-bottom: 24px;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
        }

        .summary-table th {
            background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
            padding: 10px 12px;
            border: 1px solid #e5e7eb;
            font-weight: 600;
            text-align: left;
            font-size: 10px;
            color: #374151;
            text-transform: uppercase;
            letter-spacing: 0.3px;
        }

        .summary-table th:first-child {
            border-top-left-radius: 8px;
        }

        .summary-table th:last-child {
            border-top-right-radius: 8px;
        }

        .summary-table td {
            padding: 10px 12px;
            border: 1px solid #e5e7eb;
            border-top: none;
            font-size: 10.5px;
            color: #374151;
        }

        .summary-table tbody tr:last-child td:first-child {
            border-bottom-left-radius: 8px;
        }

        .summary-table tbody tr:last-child td:last-child {
            border-bottom-right-radius: 8px;
        }

        .section-header {
            font-size: 14px;
            font-weight: 600;
            margin: 24px 0 12px 0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #111827;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 6px;
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

        .items-table tbody tr {
            transition: background-color 0.15s ease;
        }

        .items-table tbody tr:hover {
            background-color: #f9fafb;
        }

        .items-table tr:nth-child(even) {
            background-color: #fafbfc;
        }

        .category-row {
            background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%) !important;
            font-weight: 600;
        }

        .category-row td {
            border-top: 1px solid #d1d5db !important;
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

        .price-summary .total-row {
            font-weight: 600;
            border-top: 1px solid #d1d5db;
            padding-top: 8px;
        }

        .price-summary .total-row td {
            padding-top: 8px;
        }

        .price-summary .grand-total {
            font-weight: 700;
            font-size: 13px;
            color: #111827;
            padding-top: 10px;
            border-top: 2px solid #9ca3af;
        }

        .price-summary .grand-total td {
            padding-top: 10px;
        }

        .style-info {
            margin: 20px 0;
            padding: 14px 18px;
            background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%);
            border-left: 3px solid #3b82f6;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
        }

        .style-info h4 {
            font-size: 12px;
            font-weight: 600;
            margin-bottom: 10px;
            color: #111827;
            text-transform: uppercase;
            letter-spacing: 0.4px;
        }

        .style-details {
            display: flex;
            gap: 24px;
            flex-wrap: wrap;
        }

        .style-detail-item {
            display: flex;
            gap: 8px;
            align-items: baseline;
        }

        .style-detail-label {
            font-size: 10px;
            color: #6b7280;
            font-weight: 500;
        }

        .style-detail-value {
            font-size: 10.5px;
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

            .page-break {
                page-break-before: always;
            }
        }
    </style>
</head>
<body>
    <div class="page-wrapper">
        <div class="header">
            <div class="header-left">
                ${logoUrl ? `<img src="${logoUrl}" alt="${escapeHtml(t('proposalDoc.altCompanyLogo', 'Company Logo'))}" class="logo">` : `<div class="company-name">${escapeHtml(companyName || t('proposalDoc.fallbackCompanyName', 'Your Company'))}</div>`}
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

        <div class="content-wrapper">
        <div class="greeting">
            ${t('proposalDoc.greeting', { name: proposalSummary.customer })}
        </div>

        <div class="description">
            ${t('proposalDoc.descriptionIntro', 'Thank you for the opportunity to present this proposal. Below you will find a detailed summary of the recommended products and pricing.')}
        </div>

        <table class="summary-table">
            <thead>
                <tr>
                    <th>${t('proposals.headers.description', 'Description')}</th>
                    <th>${t('proposals.headers.designer', 'Designer')}</th>
                    <th>${t('proposals.headers.customer', 'Customer')}</th>
                    <th>${t('proposals.headers.date', 'Date')}</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>${escapeHtml(proposalSummary.description)}</td>
                    <td>${escapeHtml(designerName || t('common.na', 'N/A'))}</td>
                    <td>${escapeHtml(proposalSummary.customer || t('common.na', 'N/A'))}</td>
                    <td>${escapeHtml(proposalSummary.date)}</td>
                </tr>
            </tbody>
        </table>

        ${
          styleName || manufacturerName || manufacturerId
            ? `
        <div class="style-info">
            <h4>${t('proposalDoc.styleInformation', 'Style Information')}</h4>
            <div class="style-details">
                <div class="style-detail-item">
                    <div class="style-detail-label">${t('proposalDoc.manufacturer', 'Manufacturer')}:</div>
                    <div class="style-detail-value">${escapeHtml(manufacturerName || (manufacturerId ? t('common.loading', 'Loading...') : t('common.na', 'N/A')))}</div>
                </div>
                <div class="style-detail-item">
                    <div class="style-detail-label">${t('proposalDoc.styleName', 'Style')}:</div>
                    <div class="style-detail-value">${escapeHtml(styleName || t('common.na', 'N/A'))}</div>
                </div>
            </div>
        </div>
        `
            : ''
        }

        ${
          showProposalItems && proposalItems.length > 0
            ? `
    <div class="section-header">${t('proposalDoc.sections.proposalItems', 'Proposal Items')}</div>
        <table class="items-table">
            <thead>
        <tr style="background-color: #f8f9fa;">${columnHeaders}</tr>
            </thead>
            <tbody>
                <tr class="category-row">
          <td colspan="${effectiveColumns.length}" style="padding: 7px 10px; background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); font-style: italic; font-weight: 600;"><strong>${t('proposalColumns.items', 'Items')}</strong></td>
                </tr>
                ${proposalItemRows}
            </tbody>
        </table>
    ${suppressPrices ? '' : showPriceSummary ? buildPriceSummary(priceSummary, t) : ''}
        `
            : ''
        }

    ${
      includeCatalog && !suppressPrices && selectedCatalog.length > 0
        ? `
        <div class="section-header">${t('proposalDoc.sections.catalogItems', 'Catalog Items')}</div>
        <table class="items-table">
            <thead>
                <tr>
                    <th>${t('proposalDoc.catalog.itemName', 'Item Name')}</th>
                    <th>${t('proposalDoc.catalog.quantity', 'Quantity')}</th>
                    <th>${t('proposalDoc.catalog.unitPrice', 'Unit Price')}</th>
                    <th>${t('proposalDoc.catalog.total', 'Total')}</th>
                </tr>
            </thead>
            <tbody>
                ${selectedCatalog
                  .map(
                    (item) => `
                <tr>
                    <td>${escapeHtml(item.itemName || '')}</td>
                    <td>${toNumber(item.quantity)}</td>
                    <td>$${safeToFixed(item.unitPrice)}</td>
                    <td>$${safeToFixed(toNumber(item.unitPrice) * toNumber(item.quantity))}</td>
                </tr>
                `,
                  )
                  .join('')}
            </tbody>
        </table>
        `
        : ''
    }

        ${footerContent ? `<div class="main-footer-div">${footerContent}</div>` : ''}
    </div>
</div>
</body>
</html>
        `
}

export const DEFAULT_PROPOSAL_PDF_COLUMNS = DEFAULT_COLUMNS.slice()
