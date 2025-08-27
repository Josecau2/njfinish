// Debug script to test pricing calculations and identify the discrepancy
// Run this with: node debug-pricing-comparison.js

console.log('=== PRICING COMPARISON DEBUG SCRIPT ===\n');

// Mock data similar to what we'd see in the Edit component
const mockData = {
    // Current style data
    selectedStyleData: { price: 100 }, // Base style price
    
    // Alternative style we're comparing to
    alternativeStylePrice: 120, // Base alternative style price
    
    // Multipliers
    manufacturerCostMultiplier: 1.2,
    userGroupMultiplier: 1.1,
    
    // Current proposal items (already multiplied in Edit)
    filteredItems: [
        { price: 132, qty: 2 }, // This would be: 100 * 1.2 * 1.1 = 132 per item
        { price: 66, qty: 1 }   // This would be: 50 * 1.2 * 1.1 = 66 per item
    ],
    
    // Custom items (not yet multiplied)
    customItems: [
        { price: 25 }, // Base price, needs user multiplier
        { price: 15 }  // Base price, needs user multiplier
    ],
    
    // Other values
    totalModificationsCost: 50,
    isAssembled: false,
    discountPercent: 5,
    defaultTaxValue: 8.5
};

console.log('Mock data:', JSON.stringify(mockData, null, 2));
console.log('\n=== CURRENT TOTAL CALCULATION (Main) ===');

// This is how the main calculation works in Edit
const cabinetPartsTotal_Main = mockData.filteredItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
const customItemsTotal_Main = mockData.customItems.reduce((sum, item) => sum + (item.price * mockData.userGroupMultiplier), 0);
const modificationsTotal_Main = mockData.totalModificationsCost;
const assemblyFeeTotal_Main = 0; // Not assembled

const styleTotal_Main = cabinetPartsTotal_Main + assemblyFeeTotal_Main + customItemsTotal_Main + modificationsTotal_Main;
const discountAmount_Main = (styleTotal_Main * mockData.discountPercent) / 100;
const totalAfterDiscount_Main = styleTotal_Main - discountAmount_Main;
const taxAmount_Main = (totalAfterDiscount_Main * mockData.defaultTaxValue) / 100;
const grandTotal_Main = totalAfterDiscount_Main + taxAmount_Main;

console.log('Cabinet parts total:', cabinetPartsTotal_Main);
console.log('Custom items total:', customItemsTotal_Main);
console.log('Modifications total:', modificationsTotal_Main);
console.log('Style total:', styleTotal_Main);
console.log('Discount amount:', discountAmount_Main);
console.log('Total after discount:', totalAfterDiscount_Main);
console.log('Tax amount:', taxAmount_Main);
console.log('GRAND TOTAL (Main):', grandTotal_Main);

console.log('\n=== STYLE COMPARISON CALCULATION (Current Implementation) ===');

// This is the current calculateTotalForStyle in Edit
const currentStylePrice = mockData.selectedStyleData.price;
const styleDifference = mockData.alternativeStylePrice - currentStylePrice;
const manufacturerAdjustedDifference = styleDifference * mockData.manufacturerCostMultiplier;
const finalStyleDifference = manufacturerAdjustedDifference * mockData.userGroupMultiplier;

const cabinetPartsTotal_Comparison = mockData.filteredItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
const customItemsTotal_Comparison = mockData.customItems.reduce((sum, item) => sum + item.price, 0); // Fixed: no multiplier like Create
const modificationsTotal_Comparison = mockData.totalModificationsCost;
const assemblyFeeTotal_Comparison = 0;

const newStyleTotal = cabinetPartsTotal_Comparison + assemblyFeeTotal_Comparison + customItemsTotal_Comparison + modificationsTotal_Comparison + finalStyleDifference;
const discountAmount_Comparison = (newStyleTotal * mockData.discountPercent) / 100;
const totalAfterDiscount_Comparison = newStyleTotal - discountAmount_Comparison;
const taxAmount_Comparison = (totalAfterDiscount_Comparison * mockData.defaultTaxValue) / 100;
const grandTotal_Comparison = totalAfterDiscount_Comparison + taxAmount_Comparison;

console.log('Style difference (base):', styleDifference);
console.log('Style difference (after manufacturer multiplier):', manufacturerAdjustedDifference);
console.log('Style difference (final):', finalStyleDifference);
console.log('Cabinet parts total:', cabinetPartsTotal_Comparison);
console.log('Custom items total:', customItemsTotal_Comparison);
console.log('Modifications total:', modificationsTotal_Comparison);
console.log('New style total:', newStyleTotal);
console.log('Discount amount:', discountAmount_Comparison);
console.log('Total after discount:', totalAfterDiscount_Comparison);
console.log('Tax amount:', taxAmount_Comparison);
console.log('GRAND TOTAL (Comparison):', grandTotal_Comparison);

console.log('\n=== ANALYSIS ===');
console.log('Difference between main and comparison:', grandTotal_Comparison - grandTotal_Main);
console.log('Expected difference should be:', finalStyleDifference * (1 - mockData.discountPercent/100) * (1 + mockData.defaultTaxValue/100));

console.log('\n=== CREATE COMPONENT SIMULATION ===');
// Let's simulate how Create component would work with raw prices
const rawFilteredItems = [
    { price: 100, qty: 2 }, // Raw prices before multipliers
    { price: 50, qty: 1 }
];

const cabinetPartsTotal_Create = rawFilteredItems.reduce((sum, item) => sum + (item.price * mockData.manufacturerCostMultiplier * mockData.userGroupMultiplier * item.qty), 0);
const customItemsTotal_Create = mockData.customItems.reduce((sum, item) => sum + item.price, 0); // No multiplier in Create comparison
const styleTotal_Create = cabinetPartsTotal_Create + customItemsTotal_Create + mockData.totalModificationsCost;

console.log('Create - Cabinet parts total (with multipliers):', cabinetPartsTotal_Create);
console.log('Create - Custom items total (no multipliers):', customItemsTotal_Create);
console.log('Create - Style total:', styleTotal_Create);

// For Create comparison
const styleDifference_Create = mockData.alternativeStylePrice - mockData.selectedStyleData.price;
const finalStyleDifference_Create = styleDifference_Create * mockData.manufacturerCostMultiplier * mockData.userGroupMultiplier;
const newStyleTotal_Create = styleTotal_Create + finalStyleDifference_Create;
const discountAmount_Create = (newStyleTotal_Create * mockData.discountPercent) / 100;
const totalAfterDiscount_Create = newStyleTotal_Create - discountAmount_Create;
const taxAmount_Create = (totalAfterDiscount_Create * mockData.defaultTaxValue) / 100;
const grandTotal_Create = totalAfterDiscount_Create + taxAmount_Create;

console.log('Create - Style difference (final):', finalStyleDifference_Create);
console.log('Create - New style total:', newStyleTotal_Create);
console.log('Create - GRAND TOTAL:', grandTotal_Create);

console.log('\n=== ISSUE IDENTIFICATION ===');
console.log('The issue might be in how we handle:');
console.log('1. Whether filteredItems already have multipliers applied');
console.log('2. Whether custom items should have multipliers in comparison');
console.log('3. Whether the style difference calculation is correct');

console.log('\nTo fix this, we need to ensure Edit comparison matches Create logic exactly.');
