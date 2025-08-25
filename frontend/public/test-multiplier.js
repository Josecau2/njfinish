// Frontend test utility to verify multiplier functionality
// Add this to your browser console when testing proposals

window.testUserMultiplier = function() {
    console.log('🧪 Testing User Group Multiplier in Frontend...\n');
    
    // Test 1: Check if multiplier is loaded
    const multiplierElements = document.querySelectorAll('[data-testid="multiplier"], .multiplier-value');
    if (multiplierElements.length > 0) {
        console.log('✅ Found multiplier elements on page');
        multiplierElements.forEach(el => {
            console.log(`   Multiplier element: ${el.textContent}`);
        });
    } else {
        console.log('⚠️  No multiplier elements found');
    }
    
    // Test 2: Check localStorage for user data
    const userData = localStorage.getItem('user');
    if (userData) {
        try {
            const user = JSON.parse(userData);
            console.log('👤 User data found:');
            console.log(`   Email: ${user.email || 'N/A'}`);
            console.log(`   Group: ${user.group_name || user.groupName || 'N/A'}`);
        } catch (e) {
            console.log('❌ Error parsing user data');
        }
    }
    
    // Test 3: Check for proposal items and their prices
    const priceElements = document.querySelectorAll('[class*="price"], .price, td:contains("$")');
    if (priceElements.length > 0) {
        console.log('💰 Found price elements:');
        const prices = [];
        priceElements.forEach((el, index) => {
            const text = el.textContent.trim();
            if (text.includes('$') && text.match(/\$[\d,]+\.?\d*/)) {
                prices.push(text);
                if (index < 5) { // Show first 5 prices
                    console.log(`   ${text}`);
                }
            }
        });
        console.log(`   Total price elements: ${prices.length}`);
    }
    
    // Test 4: Make a test API call to check multiplier
    if (window.fetch) {
        const token = localStorage.getItem('token');
        if (token) {
            fetch('/api/user/multiplier', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(data => {
                console.log('🔌 API Response for user multiplier:');
                console.log(`   Multiplier: ${data.multiplier || 'N/A'}`);
                console.log(`   Group: ${data.groupName || 'N/A'}`);
                console.log(`   Message: ${data.message || 'N/A'}`);
                
                if (data.multiplier && data.multiplier !== 1.0) {
                    console.log(`✅ Multiplier is active: ${data.multiplier}x`);
                } else {
                    console.log('⚠️  No multiplier applied (using 1.0x)');
                }
            })
            .catch(error => {
                console.log('❌ API call failed:', error.message);
            });
        } else {
            console.log('⚠️  No auth token found');
        }
    }
    
    // Test 5: Check Redux store if available
    if (window.__REDUX_DEVTOOLS_EXTENSION__ || window.store) {
        console.log('🏪 Redux store detected - check multiplier state');
    }
    
    console.log('\n📋 Manual Test Steps:');
    console.log('1. Navigate to proposal creation/edit page');
    console.log('2. Add a catalog item to the proposal');
    console.log('3. Check if the displayed price = base price × multiplier');
    console.log('4. Verify total calculations include multiplied prices');
    
    return {
        message: 'Multiplier test completed - check console output above',
        timestamp: new Date().toISOString()
    };
};

// Auto-run when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(() => {
            console.log('🔧 User Group Multiplier test utility loaded');
            console.log('📝 Run: testUserMultiplier() to test multiplier functionality');
        }, 1000);
    });
} else {
    setTimeout(() => {
        console.log('🔧 User Group Multiplier test utility loaded');
        console.log('📝 Run: testUserMultiplier() to test multiplier functionality');
    }, 1000);
}

// Quick price calculation test
window.testPriceCalculation = function(basePrice, multiplier) {
    basePrice = basePrice || 100;
    multiplier = multiplier || 1.4;
    
    const result = basePrice * multiplier;
    console.log(`💰 Price Calculation Test:`);
    console.log(`   Base Price: $${basePrice.toFixed(2)}`);
    console.log(`   Multiplier: ${multiplier}x`);
    console.log(`   Result: $${result.toFixed(2)}`);
    
    return result;
};

console.log('✅ Multiplier test utilities loaded');
