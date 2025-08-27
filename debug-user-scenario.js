// Debug the actual user scenario with 0% discount and 0% tax
// Run this with: node debug-user-scenario.js

console.log('=== ACTUAL USER SCENARIO DEBUG ===\n');

const actualScenario = {
    currentGrandTotal: 589.15,
    discountPercent: 0,   // 0% discount from screenshot
    defaultTaxValue: 0,   // 0% tax from screenshot
    
    // Style prices (estimated)
    currentStylePrice: 50,  // Base Champagne style price
    iceWhitePrice: 75,      // Ice White style price
    laitGreyPrice: 80,      // Lait Grey style price
    
    // Multipliers (estimated)
    manufacturerCostMultiplier: 1.5,
    userGroupMultiplier: 1.2
};

console.log('Actual scenario:', JSON.stringify(actualScenario, null, 2));

function calculateComparisonTotal(alternativeStylePrice, data) {
    console.log(`\n=== CALCULATING FOR STYLE PRICE: ${alternativeStylePrice} ===`);
    
    // Style difference calculation
    const styleDifference = alternativeStylePrice - data.currentStylePrice;
    const manufacturerAdjusted = styleDifference * data.manufacturerCostMultiplier;
    const finalStyleDifference = manufacturerAdjusted * data.userGroupMultiplier;
    
    console.log('Style difference (base):', styleDifference);
    console.log('After manufacturer multiplier:', manufacturerAdjusted);
    console.log('Final style difference:', finalStyleDifference);
    
    // Back-calculate current style total
    const discountMultiplier = (1 - (data.discountPercent / 100));
    const taxMultiplier = (1 + (data.defaultTaxValue / 100));
    const currentStyleTotal = data.currentGrandTotal / (discountMultiplier * taxMultiplier);
    
    console.log('Discount multiplier:', discountMultiplier);
    console.log('Tax multiplier:', taxMultiplier);
    console.log('Back-calculated style total:', currentStyleTotal);
    
    // Calculate new style total
    const newStyleTotal = currentStyleTotal + finalStyleDifference;
    console.log('New style total:', newStyleTotal);
    
    // Apply discount and tax
    const discountAmount = (newStyleTotal * data.discountPercent) / 100;
    const totalAfterDiscount = newStyleTotal - discountAmount;
    const taxAmount = (totalAfterDiscount * data.defaultTaxValue) / 100;
    const grandTotal = totalAfterDiscount + taxAmount;
    
    console.log('Discount amount:', discountAmount);
    console.log('Total after discount:', totalAfterDiscount);
    console.log('Tax amount:', taxAmount);
    console.log('FINAL GRAND TOTAL:', grandTotal);
    
    return grandTotal;
}

// Test Ice White
const iceWhiteTotal = calculateComparisonTotal(actualScenario.iceWhitePrice, actualScenario);

// Test Lait Grey  
const laitGreyTotal = calculateComparisonTotal(actualScenario.laitGreyPrice, actualScenario);

console.log('\n=== COMPARISON WITH SCREENSHOT ===');
console.log('Current grand total:', actualScenario.currentGrandTotal);
console.log('Ice White calculated:', iceWhiteTotal);
console.log('Ice White from screenshot: 1214.15');
console.log('Lait Grey calculated:', laitGreyTotal);
console.log('Lait Grey from screenshot: 1231.60');

console.log('\n=== ANALYSIS ===');
const iceWhiteRatio = 1214.15 / actualScenario.currentGrandTotal;
const laitGreyRatio = 1231.60 / actualScenario.currentGrandTotal;

console.log('Ice White ratio (screenshot):', iceWhiteRatio);
console.log('Lait Grey ratio (screenshot):', laitGreyRatio);

// Try to reverse engineer what could cause this
const possibleStyleDiff1 = 1214.15 - 589.15; // 625
const possibleStyleDiff2 = 1231.60 - 589.15; // 642.45

console.log('\nPossible issues:');
console.log('1. If adding raw cabinet total instead of style difference:', possibleStyleDiff1);
console.log('2. If adding raw cabinet total instead of style difference:', possibleStyleDiff2);
console.log('3. These amounts suggest the entire cabinet cost is being added, not just the style difference');

// Test if the issue is adding the entire current total instead of just style difference
console.log('\n=== TESTING DOUBLE-ADDITION THEORY ===');
const doubleAdditionTest1 = actualScenario.currentGrandTotal + actualScenario.currentGrandTotal;
const doubleAdditionTest2 = actualScenario.currentGrandTotal + 625;
const doubleAdditionTest3 = actualScenario.currentGrandTotal + 642.45;

console.log('If doubling current total:', doubleAdditionTest1);
console.log('If adding ~625:', doubleAdditionTest2);
console.log('If adding ~642:', doubleAdditionTest3);

if (Math.abs(doubleAdditionTest2 - 1214.15) < 1) {
    console.log('🚨 FOUND THE ISSUE: Adding cabinet total instead of style difference!');
}
if (Math.abs(doubleAdditionTest3 - 1231.60) < 1) {
    console.log('🚨 FOUND THE ISSUE: Adding cabinet total instead of style difference!');
}
