// Test the new simplified approach
// Run this with: node debug-simplified-approach.js

console.log('=== SIMPLIFIED APPROACH TEST ===\n');

const testData = {
    // Current calculated values (from main calculation)
    currentGrandTotal: 589.15,
    currentTaxAmount: 45.23,
    currentDiscountAmount: 28.50,
    
    // Style difference
    selectedStylePrice: 50,
    alternativeStylePrice: 75,
    manufacturerCostMultiplier: 1.3,
    userGroupMultiplier: 1.2,
    
    // Rates
    discountPercent: 5,
    defaultTaxValue: 8.5
};

console.log('Test data:', JSON.stringify(testData, null, 2));

// New simplified calculation
console.log('\n=== SIMPLIFIED CALCULATION ===');

// Step 1: Calculate style difference with multipliers
const styleDifference = testData.alternativeStylePrice - testData.selectedStylePrice;
const manufacturerAdjusted = styleDifference * testData.manufacturerCostMultiplier;
const finalStyleDifference = manufacturerAdjusted * testData.userGroupMultiplier;

console.log('Style difference (base):', styleDifference);
console.log('Final style difference (multiplied):', finalStyleDifference);

// Step 2: Back-calculate current style total (corrected formula)
const discountMultiplier = (1 - (testData.discountPercent / 100));
const taxMultiplier = (1 + (testData.defaultTaxValue / 100));
const currentStyleTotal = testData.currentGrandTotal / (discountMultiplier * taxMultiplier);
console.log('Current style total (back-calculated):', currentStyleTotal);

// Step 3: Calculate new style total
const newStyleTotal = currentStyleTotal + finalStyleDifference;
console.log('New style total:', newStyleTotal);

// Step 4: Apply discount and tax
const discountAmount = (newStyleTotal * testData.discountPercent) / 100;
const totalAfterDiscount = newStyleTotal - discountAmount;
const taxAmount = (totalAfterDiscount * testData.defaultTaxValue) / 100;
const grandTotal = totalAfterDiscount + taxAmount;

console.log('Discount amount:', discountAmount);
console.log('Total after discount:', totalAfterDiscount);
console.log('Tax amount:', taxAmount);
console.log('NEW GRAND TOTAL:', grandTotal);

console.log('\n=== COMPARISON ===');
console.log('Current grand total:', testData.currentGrandTotal);
console.log('Comparison grand total:', grandTotal);
console.log('Difference:', grandTotal - testData.currentGrandTotal);
console.log('Ratio:', grandTotal / testData.currentGrandTotal);

// Verify the back-calculation is correct
console.log('\n=== VERIFICATION ===');
const verificationCheck = currentStyleTotal * (1 - testData.discountPercent/100) * (1 + testData.defaultTaxValue/100);
console.log('Verification: should equal current grand total:', verificationCheck);
console.log('Current grand total:', testData.currentGrandTotal);
console.log('Verification matches:', Math.abs(verificationCheck - testData.currentGrandTotal) < 0.01);

if (grandTotal / testData.currentGrandTotal < 1.2) {
    console.log('\n✅ SUCCESS: Ratio is reasonable (under 1.2x)');
} else {
    console.log('\n❌ STILL AN ISSUE: Ratio is too high');
}
