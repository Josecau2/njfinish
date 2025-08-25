// Simulate a front-end pricing scenario: multiplier + assembly + discount + tax
// Run with: npm run test:pricing

import { applyMultiplierToItems, computeSummary } from '../src/utils/pricing.js';

function format(n) {
  return `$${Number(n || 0).toFixed(2)}`;
}

// Test scenario
const multiplier = 1.4; // e.g., Contractor
const taxRate = 7.0; // percent
const discountPercent = 5.0; // percent

// Catalog items (basePrice = vendor/catalog price)
const items = [
  { name: 'Base Cabinet 30"', basePrice: 100, qty: 1, assemblyFee: 15, includeAssemblyFee: true },
  { name: 'Wall Cabinet 24"', basePrice: 80, qty: 2, assemblyFee: 12, includeAssemblyFee: true },
  { name: 'Toe Kick', basePrice: 20, qty: 4, assemblyFee: 0, includeAssemblyFee: false },
];

// Custom line items (user-entered)
const customItems = [
  { name: 'Delivery', price: 50 },
  { name: 'Design Service', price: 75 },
];

// Apply multiplier to catalog items
const withPrices = applyMultiplierToItems(items, multiplier);

// Compute summary with tax/discount
const summary = computeSummary({
  items: withPrices,
  customItems,
  modificationsTotal: 0,
  taxRate,
  discountPercent,
  multiplier,
});

// Output
console.log('--- Pricing Simulation ---');
console.log(`Multiplier: x${multiplier}`);
console.log('Items:');
withPrices.forEach((it, i) => {
  console.log(
    `  ${i + 1}. ${it.name} | qty=${it.qty} | price=${format(it.price)} | assembly/unit=${format(
      it.includeAssemblyFee ? it.assemblyFee : 0
    )} | total=${format(it.total)}`
  );
});
console.log('Summary:');
console.log(`  Cabinets & Parts: ${format(summary.cabinets)}`);
console.log(`  Assembly Fee:     ${format(summary.assemblyFee)}`);
console.log(`  Modifications:    ${format(summary.modificationsCost)}`);
console.log(`  Style Total:      ${format(summary.styleTotal)}`);
console.log(`  Discount (${discountPercent}%): ${format(summary.discountAmount)}`);
console.log(`  Total:            ${format(summary.total)}`);
console.log(`  Tax (${taxRate}%):      ${format(summary.taxAmount)}`);
console.log(`  Grand Total:      ${format(summary.grandTotal)}`);

// Simple assertions
function assert(cond, msg) {
  if (!cond) {
    console.error('Assertion failed:', msg);
    process.exit(1);
  }
}

// Check a couple of expected values
const first = withPrices[0];
assert(Math.abs(first.price - 140) < 1e-6, 'First item price should be 100 * 1.4 = 140');
assert(
  Math.abs(first.total - (140 + 15)) < 1e-6,
  'First item total should be price + assembly (qty=1)'
);

console.log('All checks passed.');
