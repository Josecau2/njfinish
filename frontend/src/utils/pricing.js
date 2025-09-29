// Pure pricing helpers to mirror ItemSelectionContentEdit logic
import { isShowroomModeActive, getShowroomMultiplier } from './showroomUtils'

/**
 * Apply manufacturer, user group, and showroom multipliers to items and compute per-line totals.
 * Item shape: { basePrice?: number, price?: number, qty: number, assemblyFee?: number, includeAssemblyFee?: boolean }
 * Returns new array with price and total set.
 * @param {Array} items - Array of items to apply multipliers to
 * @param {number} manufacturerMultiplier - Manufacturer cost multiplier (applied first)
 * @param {number} userGroupMultiplier - User group multiplier (applied second)
 * @param {boolean} applyShowroom - Whether to apply showroom multiplier (applied third)
 */
export function applyMultiplierToItems(
  items,
  manufacturerMultiplier = 1,
  userGroupMultiplier = 1,
  applyShowroom = true,
) {
  const manufacturerM = Number(manufacturerMultiplier || 1)
  const userGroupM = Number(userGroupMultiplier || 1)
  const showroomM = applyShowroom && isShowroomModeActive() ? getShowroomMultiplier() : 1

  return (items || []).map((it) => {
    const base = it.basePrice != null ? Number(it.basePrice) : Number(it.price || 0)
    const qty = Number(it.qty || 1)
    const unitAssembly = it.includeAssemblyFee ? Number(it.assemblyFee || 0) : 0

    // Apply multiplier chain: manufacturer → user group → showroom
    const manufacturerAdjustedPrice = base * manufacturerM
    const userGroupAdjustedPrice = manufacturerAdjustedPrice * userGroupM
    const finalPrice = userGroupAdjustedPrice * showroomM

    // Assembly fees are also affected by showroom multiplier
    const adjustedAssemblyFee = unitAssembly * showroomM

    const total = qty * finalPrice + adjustedAssemblyFee * qty
    return {
      ...it,
      price: finalPrice,
      assemblyFee: adjustedAssemblyFee,
      total,
      _showroomMultiplier: showroomM, // Track for debugging
    }
  })
}

/**
 * Compute proposal summary given items and options.
 * customItems: [{ price: number }] -> multiplied
 * modificationsTotal: number
 * taxRate: percent number (e.g., 7 means 7%)
 * discountPercent: percent number
 * @param {boolean} applyShowroom - Whether to apply showroom multiplier to calculations
 */
export function computeSummary({
  items = [],
  customItems = [],
  modificationsTotal = 0,
  taxRate = 0,
  discountPercent = 0,
  multiplier = 1,
  applyShowroom = true,
}) {
  const m = Number(multiplier || 1)
  const showroomM = applyShowroom && isShowroomModeActive() ? getShowroomMultiplier() : 1

  // Items are assumed already multiplied in price when passed here
  const cabinetPartsTotal = items.reduce(
    (sum, it) => sum + Number(it.price || 0) * Number(it.qty || 1),
    0,
  )

  // Custom items multiplied by group multiplier and showroom multiplier
  const customItemsTotal = customItems.reduce(
    (sum, ci) => sum + Number(ci.price || 0) * m * showroomM,
    0,
  )

  // Assembly per unit x qty on included rows (already adjusted for showroom in applyMultiplierToItems)
  const assemblyFeeTotal = items.reduce((sum, it) => {
    const qty = Number(it.qty || 1)
    const unitAssembly = it.includeAssemblyFee ? Number(it.assemblyFee || 0) : 0
    return sum + unitAssembly * qty
  }, 0)

  // Modifications also affected by showroom multiplier
  const modifications = Number(modificationsTotal || 0) * showroomM

  const cabinets = cabinetPartsTotal + customItemsTotal
  const styleTotal = cabinets + assemblyFeeTotal + modifications
  const discount = (styleTotal * Number(discountPercent || 0)) / 100
  const totalAfterDiscount = styleTotal - discount
  const taxAmount = (totalAfterDiscount * Number(taxRate || 0)) / 100
  const grandTotal = totalAfterDiscount + taxAmount

  return {
    cabinets: round2(cabinets),
    assemblyFee: round2(assemblyFeeTotal),
    modificationsCost: round2(modifications),
    styleTotal: round2(styleTotal),
    discountPercent: Number(discountPercent || 0),
    discountAmount: round2(discount),
    total: round2(totalAfterDiscount),
    taxRate: Number(taxRate || 0),
    taxAmount: round2(taxAmount),
    grandTotal: round2(grandTotal),
    _showroomActive: applyShowroom && isShowroomModeActive(),
    _showroomMultiplier: showroomM,
  }
}

function round2(n) {
  const v = Number(n || 0)
  return Math.round(v * 100) / 100
}
