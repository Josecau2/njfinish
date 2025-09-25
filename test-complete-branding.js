#!/usr/bin/env node
/**
 * Comprehensive Branding System Test
 * Tests the complete login customization workflow
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

console.log('🧪 COMPREHENSIVE BRANDING SYSTEM TEST');
console.log('=====================================\n');

// Test 1: Check if server is running
async function testServerRunning() {
    console.log('📡 TEST 1: Server Status');
    console.log('------------------------');

    return new Promise((resolve) => {
        const req = http.get('http://localhost:8080', (res) => {
            console.log('✅ Server is running on http://localhost:8080');
            console.log(`   Status: ${res.statusCode}`);
            resolve(true);
        });

        req.on('error', (err) => {
            console.log('❌ Server is not running');
            console.log(`   Error: ${err.message}`);
            console.log('   Start server with: npm run dev');
            resolve(false);
        });

        req.setTimeout(5000, () => {
            console.log('❌ Server timeout');
            req.destroy();
            resolve(false);
        });
    });
}

// Test 2: Check backend files
function testBackendFiles() {
    console.log('\n📁 TEST 2: Backend File Structure');
    console.log('----------------------------------');

    const files = [
        'server/branding/materializeBranding.js',
        'server/branding/regenerateBrandSnapshot.js',
        'server/middleware/withBrandInline.js',
        'public/brand/inline.html'
    ];

    let allFilesExist = true;

    files.forEach(file => {
        const exists = fs.existsSync(file);
        console.log(`${exists ? '✅' : '❌'} ${file}`);
        if (!exists) allFilesExist = false;
    });

    return allFilesExist;
}

// Test 3: Check inline.html content
function testInlineHtmlContent() {
    console.log('\n🔍 TEST 3: Inline HTML Content');
    console.log('-------------------------------');

    const inlinePath = 'public/brand/inline.html';

    if (!fs.existsSync(inlinePath)) {
        console.log('❌ inline.html not found');
        return false;
    }

    const content = fs.readFileSync(inlinePath, 'utf8');

    const checks = [
        { name: 'Contains window.__BRAND__', test: content.includes('window.__BRAND__') },
        { name: 'Contains CSS custom properties', test: content.includes('--brand-') },
        { name: 'Contains logo data URI', test: content.includes('logoDataURI') },
        { name: 'Contains color data', test: content.includes('headerBg') },
        { name: 'Contains login customization', test: content.includes('window.__LOGIN_CUSTOMIZATION__') }
    ];

    let allPassed = true;
    checks.forEach(check => {
        console.log(`${check.test ? '✅' : '❌'} ${check.name}`);
        if (!check.test) allPassed = false;
    });

    if (allPassed) {
        console.log('✨ inline.html contains all required branding data');
    }

    return allPassed;
}

// Test 4: Check HTML template integration
function testHtmlTemplate() {
    console.log('\n📄 TEST 4: HTML Template Integration');
    console.log('------------------------------------');

    const buildHtml = 'build/index.html';
    const frontendHtml = 'frontend/index.html';

    let templateFound = false;
    let hasPlaceholder = false;

    // Check build directory first
    if (fs.existsSync(buildHtml)) {
        templateFound = true;
        const content = fs.readFileSync(buildHtml, 'utf8');
        hasPlaceholder = content.includes('<!--BRAND_INLINE-->');
        console.log(`✅ Found HTML template: ${buildHtml}`);
        console.log(`${hasPlaceholder ? '✅' : '❌'} Contains <!--BRAND_INLINE--> placeholder`);
    } else if (fs.existsSync(frontendHtml)) {
        templateFound = true;
        const content = fs.readFileSync(frontendHtml, 'utf8');
        hasPlaceholder = content.includes('<!--BRAND_INLINE-->');
        console.log(`✅ Found HTML template: ${frontendHtml}`);
        console.log(`${hasPlaceholder ? '✅' : '❌'} Contains <!--BRAND_INLINE--> placeholder`);
    } else {
        console.log('❌ HTML template not found');
    }

    return templateFound && hasPlaceholder;
}

// Test 5: Test middleware integration
function testMiddlewareIntegration() {
    console.log('\n🔧 TEST 5: Middleware Integration');
    console.log('---------------------------------');

    try {
        const { withBrandInline } = require('./server/middleware/withBrandInline');
        const testHtml = '<!DOCTYPE html><html><head><!--BRAND_INLINE--></head><body></body></html>';
        const result = withBrandInline(testHtml);

        const checks = [
            { name: 'Middleware function loads', test: typeof withBrandInline === 'function' },
            { name: 'Placeholder replacement works', test: !result.includes('<!--BRAND_INLINE-->') },
            { name: 'Brand data injected', test: result.includes('window.__BRAND__') }
        ];

        let allPassed = true;
        checks.forEach(check => {
            console.log(`${check.test ? '✅' : '❌'} ${check.name}`);
            if (!check.test) allPassed = false;
        });

        return allPassed;
    } catch (error) {
        console.log(`❌ Middleware test failed: ${error.message}`);
        return false;
    }
}

// Test 6: Database integration
async function testDatabaseIntegration() {
    console.log('\n🗄️  TEST 6: Database Integration');
    console.log('--------------------------------');

    try {
        // Test regenerateBrandSnapshot
        const { regenerateBrandSnapshot } = require('./server/branding/regenerateBrandSnapshot');

        console.log('📊 Testing brand snapshot generation...');
        await regenerateBrandSnapshot();
        console.log('✅ Brand snapshot regenerated successfully');

        return true;
    } catch (error) {
        console.log(`❌ Database integration test failed: ${error.message}`);
        return false;
    }
}

// Run all tests
async function runAllTests() {
    console.log('Starting comprehensive branding system test...\n');

    const results = [];

    // Run tests
    results.push({ name: 'Server Running', passed: await testServerRunning() });
    results.push({ name: 'Backend Files', passed: testBackendFiles() });
    results.push({ name: 'Inline HTML Content', passed: testInlineHtmlContent() });
    results.push({ name: 'HTML Template Integration', passed: testHtmlTemplate() });
    results.push({ name: 'Middleware Integration', passed: testMiddlewareIntegration() });
    results.push({ name: 'Database Integration', passed: await testDatabaseIntegration() });

    // Summary
    console.log('\n📊 TEST SUMMARY');
    console.log('===============');

    const passedCount = results.filter(r => r.passed).length;
    const totalTests = results.length;

    results.forEach(result => {
        console.log(`${result.passed ? '✅' : '❌'} ${result.name}`);
    });

    console.log(`\n🎯 Overall Result: ${passedCount}/${totalTests} tests passed`);

    if (passedCount === totalTests) {
        console.log('🎉 ALL TESTS PASSED! The branding system is working correctly.');
        console.log('\n📝 Next Steps:');
        console.log('   1. Open http://localhost:8080 to test the login page');
        console.log('   2. Open http://localhost:8080/test-branding.html for detailed frontend tests');
        console.log('   3. Test login customization changes in the admin panel');
    } else {
        console.log('⚠️  Some tests failed. Check the output above for details.');
    }

    console.log('\n🔗 Useful URLs:');
    console.log('   - Main App: http://localhost:8080');
    console.log('   - Branding Test: http://localhost:8080/test-branding.html');
    console.log('   - Brand Assets: http://localhost:8080/brand/');
}

// Run the tests
runAllTests().catch(error => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
});