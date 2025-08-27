// Pure pricing helpers to mirror ItemSelectionContentEdit logic

/**
 * Apply manufacturer and user group multipliers to items and compute per-line totals.
 * Item shape: { basePrice?: number, price?: number, qty: number, assemblyFee?: number, includeAssemblyFee?: boolean }
 * Returns new array with price and total set.
 * @param {Array} items - Array of items to apply multipliers to
 * @param {number} manufacturerMultiplier - Manufacturer cost multiplier (applied first)
 * @param {number} userGroupMultiplier - User group multiplier (applied second)
 */
export function applyMultiplierToItems(items, manufacturerMultiplier = 1, userGroupMultiplier = 1) {
  const manufacturerM = Number(manufacturerMultiplier || 1);
  const userGroupM = Number(userGroupMultiplier || 1);
  
  return (items || []).map((it) => {
    const base = it.basePrice != null ? Number(it.basePrice) : Number(it.price || 0);
    const qty = Number(it.qty || 1);
    const unitAssembly = it.includeAssemblyFee ? Number(it.assemblyFee || 0) : 0;
    
    // Apply manufacturer multiplier first, then user group multiplier
    const manufacturerAdjustedPrice = base * manufacturerM;
    const finalPrice = manufacturerAdjustedPrice * userGroupM;
    
    const total = qty * finalPrice + unitAssembly * qty;
    return { ...it, price: finalPrice, total };
  });
}

/**
 * Compute proposal summary given items and options.
 * customItems: [{ price: number }] -> multiplied
 * modificationsTotal: number
 * taxRate: percent number (e.g., 7 means 7%)
 * discountPercent: percent number
 */
export function computeSummary({
  items = [],
  customItems = [],
  modificationsTotal = 0,
  taxRate = 0,
  discountPercent = 0,
  multiplier = 1,
}) {
  const m = Number(multiplier || 1);
  // Items are assumed already multiplied in price when passed here
  const cabinetPartsTotal = items.reduce((sum, it) => sum + Number(it.price || 0) * Number(it.qty || 1), 0);
  // Custom items multiplied by group multiplier
  const customItemsTotal = customItems.reduce((sum, ci) => sum + Number(ci.price || 0) * m, 0);
  // Assembly per unit x qty on included rows
  const assemblyFeeTotal = items.reduce((sum, it) => {
    const qty = Number(it.qty || 1);
    const unitAssembly = it.includeAssemblyFee ? Number(it.assemblyFee || 0) : 0;
    return sum + unitAssembly * qty;
  }, 0);

  const modifications = Number(modificationsTotal || 0);
  const cabinets = cabinetPartsTotal + customItemsTotal;
  const styleTotal = cabinets + assemblyFeeTotal + modifications;
  const discount = (styleTotal * Number(discountPercent || 0)) / 100;
  const totalAfterDiscount = styleTotal - discount;
  const taxAmount = (totalAfterDiscount * Number(taxRate || 0)) / 100;
  const grandTotal = totalAfterDiscount + taxAmount;

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
  };
}

function round2(n) {
  const v = Number(n || 0);
  return Math.round(v * 100) / 100;
}
