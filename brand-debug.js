// Brand Debug Test - Run this in the browser console
console.log('=== BRAND DEBUG TEST ===');

// Test 1: Check if window objects exist
console.log('1. Window Objects:');
console.log('  window.__BRAND__:', typeof window.__BRAND__, window.__BRAND__ ? '✅' : '❌');
console.log('  window.__LOGIN_CUSTOMIZATION__:', typeof window.__LOGIN_CUSTOMIZATION__, window.__LOGIN_CUSTOMIZATION__ ? '✅' : '❌');
console.log('  window.__APP_CUSTOMIZATION__:', typeof window.__APP_CUSTOMIZATION__, window.__APP_CUSTOMIZATION__ ? '✅' : '❌');

// Test 2: Check brand functions (if available)
if (typeof getBrand === 'function') {
    console.log('2. getBrand() function:');
    const brand = getBrand();
    console.log('  getBrand():', brand);
    console.log('  logoDataURI:', brand.logoDataURI ? '✅ Present' : '❌ Missing');
} else {
    console.log('2. getBrand() function: ❌ Not available');

    // Manually check window.__BRAND__
    if (window.__BRAND__) {
        console.log('  Manual check - window.__BRAND__.logoDataURI:', window.__BRAND__.logoDataURI ? '✅ Present' : '❌ Missing');
    }
}

// Test 3: Check if logo element exists
console.log('3. Logo Elements:');
const logoElements = document.querySelectorAll('img[src*="data:"], .brand-logo, [class*="logo"]');
console.log(`  Found ${logoElements.length} potential logo elements:`);
logoElements.forEach((el, i) => {
    console.log(`    ${i+1}. ${el.tagName} (${el.className})`);
    console.log(`       src: ${el.src ? el.src.substring(0, 50) + '...' : 'no src'}`);
    console.log(`       visible: ${el.offsetWidth > 0 && el.offsetHeight > 0 ? 'yes' : 'no'}`);
});

// Test 4: Check CSS custom properties
console.log('4. CSS Custom Properties:');
const root = document.documentElement;
const style = getComputedStyle(root);
const brandVars = ['--brand-header-bg', '--brand-header-text', '--brand-sidebar-bg', '--brand-logo-bg'];
brandVars.forEach(varName => {
    const value = style.getPropertyValue(varName).trim();
    console.log(`  ${varName}: ${value || '❌ Not set'}`);
});

// Test 5: Check for React components
console.log('5. React Component Check:');
const reactRoot = document.getElementById('root');
if (reactRoot && reactRoot.innerHTML) {
    console.log('  React app mounted: ✅');
    console.log('  Contains data-react attributes:', reactRoot.innerHTML.includes('data-react') ? '✅' : '❌');
} else {
    console.log('  React app mounted: ❌');
}

console.log('=== END BRAND DEBUG TEST ===');

// Return useful data for inspection
return {
    brandAvailable: typeof window.__BRAND__ !== 'undefined',
    loginCustomizationAvailable: typeof window.__LOGIN_CUSTOMIZATION__ !== 'undefined',
    brand: window.__BRAND__,
    loginCustomization: window.__LOGIN_CUSTOMIZATION__
};