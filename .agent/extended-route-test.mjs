#!/usr/bin/env node

import { chromium } from '@playwright/test';
import fs from 'fs';

async function testExtendedRoutes() {
  console.log('🔐 EXTENDED ROUTE TESTING: Checking all routes for JavaScript errors...');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const errors = [];

  // Enhanced error capture
  page.on('pageerror', error => {
    const errorObj = {
      type: 'page-error',
      message: error.message,
      stack: error.stack?.substring(0, 200),
      timestamp: new Date().toISOString(),
      url: page.url()
    };
    errors.push(errorObj);
    console.log(`❌ PAGE ERROR: ${error.message}`);
  });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      const errorObj = {
        type: 'console-error',
        message: msg.text(),
        timestamp: new Date().toISOString(),
        url: page.url()
      };
      errors.push(errorObj);
      console.log(`❌ CONSOLE ERROR: ${msg.text()}`);
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

  // Read discovered routes
  const routeData = JSON.parse(fs.readFileSync('discovered-routes.json', 'utf8'));
  const routes = routeData.routes;

  console.log(`4. Testing ${routes.length} routes for JavaScript errors...`);

  const routeResults = {};

  for (const route of routes) {
    console.log(`\n📍 Testing route: ${route}`);
    const routeErrors = [];
    const initialErrorCount = errors.length;

    try {
      await page.goto(`http://localhost:3000${route}`, {
        waitUntil: 'networkidle',
        timeout: 15000
      });

      console.log(`  Current URL: ${page.url()}`);

      // Wait for any async content to load
      await page.waitForTimeout(2000);

      // Try to interact with any dynamic content
      try {
        const tables = await page.$$('table');
        const buttons = await page.$$('button:not([disabled])');
        console.log(`  Found tables: ${tables.length}, buttons: ${buttons.length}`);

        // Scroll to trigger lazy loading
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(1000);

        // Click a few buttons if they exist (limit to prevent infinite loops)
        for (let i = 0; i < Math.min(buttons.length, 3); i++) {
          try {
            await buttons[i].click();
            await page.waitForTimeout(500);
          } catch (err) {
            // Button click failed, continue
          }
        }
      } catch (interactionError) {
        console.log(`  Interaction error: ${interactionError.message}`);
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
      console.log(`  ❌ Navigation failed: ${error.message}`);
      routeResults[route] = {
        status: 'navigation-failed',
        errorCount: 0,
        navigationError: error.message
      };
    }
  }

  await browser.close();

  console.log(`\n📊 Extended Route Test Results:`);
  console.log(`   Total errors found: ${errors.length}`);

  const cleanRoutes = Object.entries(routeResults).filter(([_, result]) => result.status === 'clean');
  const errorRoutes = Object.entries(routeResults).filter(([_, result]) => result.status === 'errors');
  const failedRoutes = Object.entries(routeResults).filter(([_, result]) => result.status === 'navigation-failed');

  console.log(`   Clean routes: ${cleanRoutes.length}`);
  console.log(`   Routes with errors: ${errorRoutes.length}`);
  console.log(`   Routes with navigation failures: ${failedRoutes.length}`);

  if (errors.length === 0) {
    console.log(`✅ No JavaScript runtime errors found across all routes!`);
  } else {
    console.log(`\n❌ Errors discovered:`);
    errors.forEach((error, index) => {
      console.log(`   ${index + 1}. [${error.type}] ${error.message.substring(0, 100)}...`);
      if (error.url && error.url !== 'http://localhost:3000/login') {
        console.log(`      Route: ${new URL(error.url).pathname}`);
      }
    });
  }

  // Save detailed results
  const testReport = {
    timestamp: new Date().toISOString(),
    totalRoutes: routes.length,
    totalErrors: errors.length,
    routeResults,
    errors
  };

  fs.writeFileSync('.agent/extended-route-test-results.json', JSON.stringify(testReport, null, 2));
  console.log(`\n📄 Detailed results saved to: .agent/extended-route-test-results.json`);

  return { errors, routeResults };
}

testExtendedRoutes().catch(console.error);