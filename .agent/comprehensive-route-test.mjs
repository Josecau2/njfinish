#!/usr/bin/env node

import { chromium } from '@playwright/test';
import fs from 'fs';

async function testComprehensiveRoutes() {
  console.log('🔐 COMPREHENSIVE ROUTE TESTING: Testing ALL application routes...');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const errors = [];

  // Enhanced error capture
  page.on('pageerror', error => {
    const errorObj = {
      type: 'page-error',
      message: error.message,
      stack: error.stack?.substring(0, 300),
      timestamp: new Date().toISOString(),
      url: page.url()
    };
    errors.push(errorObj);
    console.log(`❌ PAGE ERROR: ${error.message.substring(0, 100)}...`);
  });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      const errorObj = {
        type: 'console-error',
        message: msg.text(),
        timestamp: new Date().toISOString(),
        url: page.url()
      };
      // Filter out network errors which are infrastructure issues
      if (!msg.text().includes('Failed to load resource') &&
          !msg.text().includes('net::ERR_') &&
          !msg.text().includes('404 (Not Found)') &&
          !msg.text().includes('429 (Too Many Requests)')) {
        errors.push(errorObj);
        console.log(`❌ CONSOLE ERROR: ${msg.text().substring(0, 100)}...`);
      }
    }
  });

  console.log('1. Navigating to login page...');
  await page.goto('http://localhost:3000/login');

  console.log('2. Filling login credentials...');
  await page.fill('input[name="email"], input[type="email"]', 'joseca@symmetricalwolf.com');
  await page.fill('input[name="password"], input[type="password"]', 'admin123');

  console.log('3. Submitting login form...');
  await page.click('button[type="submit"], .btn-primary, [role="button"]');
  await page.waitForURL(/dashboard|\/$/);
  console.log(`Current URL after login: ${page.url()}`);

  // Read comprehensive route list
  const routeData = JSON.parse(fs.readFileSync('.agent/comprehensive-route-list.json', 'utf8'));
  const routes = routeData.routes;

  console.log(`4. Testing ${routes.length} routes for JavaScript errors...`);

  const routeResults = {};

  for (const route of routes) {
    console.log(`\n📍 Testing route: ${route}`);
    const initialErrorCount = errors.length;

    try {
      await page.goto(`http://localhost:3000${route}`, {
        waitUntil: 'networkidle',
        timeout: 15000
      });

      console.log(`  Current URL: ${page.url()}`);

      // Wait for any async content to load
      await page.waitForTimeout(1500);

      // Try to interact with dynamic content
      try {
        const tables = await page.$$('table');
        const buttons = await page.$$('button:not([disabled])');
        const inputs = await page.$$('input');
        console.log(`  Found: ${tables.length} tables, ${buttons.length} buttons, ${inputs.length} inputs`);

        // Scroll to trigger lazy loading
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(500);

        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(500);

        // Click a button if available (limit to prevent loops)
        if (buttons.length > 0) {
          try {
            await buttons[0].click();
            await page.waitForTimeout(500);
          } catch (err) {
            // Button click failed, continue
          }
        }
      } catch (interactionError) {
        console.log(`  Interaction warning: ${interactionError.message.substring(0, 50)}...`);
      }

      // Check for new errors specific to this route
      const newErrors = errors.slice(initialErrorCount);
      routeResults[route] = {
        status: newErrors.length === 0 ? 'clean' : 'errors',
        errorCount: newErrors.length,
        errors: newErrors
      };

      if (newErrors.length === 0) {
        console.log(`  ✅ Route appears clean`);
      } else {
        console.log(`  ❌ Route caused ${newErrors.length} new error(s)`);
      }

    } catch (error) {
      console.log(`  ⚠️  Navigation issue: ${error.message.substring(0, 80)}...`);
      routeResults[route] = {
        status: 'navigation-failed',
        errorCount: 0,
        navigationError: error.message
      };
    }
  }

  await browser.close();

  console.log(`\n📊 Comprehensive Route Test Results:`);
  console.log(`   Total errors found: ${errors.length}`);

  const cleanRoutes = Object.entries(routeResults).filter(([_, result]) => result.status === 'clean');
  const errorRoutes = Object.entries(routeResults).filter(([_, result]) => result.status === 'errors');
  const failedRoutes = Object.entries(routeResults).filter(([_, result]) => result.status === 'navigation-failed');

  console.log(`   Clean routes: ${cleanRoutes.length}`);
  console.log(`   Routes with errors: ${errorRoutes.length}`);
  console.log(`   Routes with navigation failures: ${failedRoutes.length}`);

  if (errors.length === 0) {
    console.log(`✅ No JavaScript runtime errors found across all ${routes.length} routes!`);
  } else {
    console.log(`\n❌ Errors discovered:`);
    const uniqueErrors = [...new Map(errors.map(e => [e.message, e])).values()];
    uniqueErrors.forEach((error, index) => {
      console.log(`   ${index + 1}. [${error.type}] ${error.message.substring(0, 120)}...`);
      const route = new URL(error.url).pathname;
      if (route !== '/login') {
        console.log(`      Route: ${route}`);
      }
    });

    if (errorRoutes.length > 0) {
      console.log(`\n🔍 Routes with errors:`);
      errorRoutes.forEach(([route, result]) => {
        console.log(`   - ${route} (${result.errorCount} error${result.errorCount > 1 ? 's' : ''})`);
      });
    }
  }

  // Save detailed results
  const testReport = {
    timestamp: new Date().toISOString(),
    totalRoutes: routes.length,
    totalErrors: errors.length,
    uniqueErrors: [...new Map(errors.map(e => [e.message, e])).values()].length,
    routeResults,
    errors
  };

  fs.writeFileSync('.agent/comprehensive-route-test-results.json', JSON.stringify(testReport, null, 2));
  console.log(`\n📄 Detailed results saved to: .agent/comprehensive-route-test-results.json`);

  return { errors, routeResults };
}

testComprehensiveRoutes().catch(console.error);