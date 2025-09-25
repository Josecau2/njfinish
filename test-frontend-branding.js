/**
 * Frontend Branding Test Script
 * Tests that the branding system is working correctly in the browser
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function testFrontendBranding() {
    console.log('🚀 Starting Frontend Branding Test...\n');

    const browser = await puppeteer.launch({ headless: false, slowMo: 100 });
    const page = await browser.newPage();

    try {
        // Navigate to login page
        console.log('📍 Navigating to login page...');
        await page.goto('http://localhost:8080', { waitUntil: 'networkidle0' });

        // Test 1: Check if window.__BRAND__ is available
        console.log('\n✅ TEST 1: Checking window.__BRAND__ availability...');
        const brandObject = await page.evaluate(() => {
            return typeof window.__BRAND__ !== 'undefined' ? window.__BRAND__ : null;
        });

        if (brandObject) {
            console.log('   ✓ window.__BRAND__ is available');
            console.log(`   ✓ Logo Data URI: ${brandObject.logoDataURI ? 'Present' : 'Missing'}`);
            console.log(`   ✓ Colors: ${brandObject.colors ? Object.keys(brandObject.colors).join(', ') : 'Missing'}`);
            console.log(`   ✓ Login Config: ${brandObject.login ? 'Present' : 'Missing'}`);
        } else {
            console.log('   ❌ window.__BRAND__ is not available');
        }

        // Test 2: Check if login customization is applied
        console.log('\n✅ TEST 2: Checking login customization...');
        const loginTitle = await page.$eval('h1, .login-title, [data-testid="login-title"]', el => el.textContent).catch(() => null);
        const loginSubtitle = await page.$eval('.login-subtitle, [data-testid="login-subtitle"]', el => el.textContent).catch(() => null);

        console.log(`   Login Title: ${loginTitle || 'Not found'}`);
        console.log(`   Login Subtitle: ${loginSubtitle || 'Not found'}`);

        // Test 3: Check if logo is displayed
        console.log('\n✅ TEST 3: Checking logo display...');
        const logoElements = await page.$$eval('img, .brand-logo, [class*="logo"]', elements => {
            return elements.map(el => ({
                tag: el.tagName,
                src: el.src || 'no src',
                className: el.className,
                hasDataURI: (el.src || '').startsWith('data:'),
                visible: el.offsetWidth > 0 && el.offsetHeight > 0
            }));
        });

        console.log('   Logo elements found:');
        logoElements.forEach((logo, i) => {
            console.log(`     ${i + 1}. ${logo.tag} (${logo.className})`);
            console.log(`        Src: ${logo.src.substring(0, 50)}${logo.src.length > 50 ? '...' : ''}`);
            console.log(`        Data URI: ${logo.hasDataURI ? 'Yes' : 'No'}`);
            console.log(`        Visible: ${logo.visible ? 'Yes' : 'No'}`);
        });

        // Test 4: Check if custom colors are applied
        console.log('\n✅ TEST 4: Checking custom colors...');
        const customStyles = await page.evaluate(() => {
            const root = document.documentElement;
            const computedStyle = getComputedStyle(root);
            return {
                headerBg: computedStyle.getPropertyValue('--brand-header-bg').trim(),
                headerText: computedStyle.getPropertyValue('--brand-header-text').trim(),
                sidebarBg: computedStyle.getPropertyValue('--brand-sidebar-bg').trim(),
                logoBg: computedStyle.getPropertyValue('--brand-logo-bg').trim()
            };
        });

        console.log('   CSS Custom Properties:');
        Object.entries(customStyles).forEach(([key, value]) => {
            console.log(`     --brand-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value || 'Not set'}`);
        });

        // Test 5: Check for JavaScript errors
        console.log('\n✅ TEST 5: Checking for JavaScript errors...');
        const errors = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                errors.push(msg.text());
            }
        });

        // Wait a bit to catch any delayed errors
        await page.waitForTimeout(2000);

        if (errors.length > 0) {
            console.log('   ❌ JavaScript errors found:');
            errors.forEach(error => console.log(`     - ${error}`));
        } else {
            console.log('   ✓ No JavaScript errors detected');
        }

        // Test 6: Test page refresh persistence
        console.log('\n✅ TEST 6: Testing page refresh persistence...');
        await page.reload({ waitUntil: 'networkidle0' });

        const brandAfterRefresh = await page.evaluate(() => {
            return typeof window.__BRAND__ !== 'undefined';
        });

        console.log(`   Brand data after refresh: ${brandAfterRefresh ? 'Present' : 'Missing'}`);

        console.log('\n🎉 Frontend Branding Test Complete!');

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await browser.close();
    }
}

// Check if puppeteer is available
try {
    require('puppeteer');
    testFrontendBranding().catch(console.error);
} catch (e) {
    console.log('⚠️  Puppeteer not available. Installing...');
    console.log('Run: npm install puppeteer');
    console.log('Then run this script again.');

    // Alternative manual test instructions
    console.log('\n📋 MANUAL TEST INSTRUCTIONS:');
    console.log('1. Open http://localhost:8080 in your browser');
    console.log('2. Open Developer Tools (F12)');
    console.log('3. In the Console, run: console.log(window.__BRAND__)');
    console.log('4. Check that the logo is displayed correctly');
    console.log('5. Refresh the page and verify everything still works');
}