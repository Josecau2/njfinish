#!/usr/bin/env node

import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// Route discovery to find all app routes
async function discoverAllRoutes() {
  console.log('🔍 ROUTE DISCOVERY: Finding all application routes...');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Authenticate first
  console.log('1. Authenticating...');
  await page.goto('http://localhost:3000/login');
  await page.fill('input[name="email"], input[type="email"]', 'joseca@symmetricalwolf.com');
  await page.fill('input[name="password"], input[type="password"]', 'admin123');
  await page.click('button[type="submit"], .btn-primary, [role="button"]');
  await page.waitForURL(/dashboard|\/$/);

  const discoveredRoutes = new Set();

  // Core application routes based on navigation structure
  const coreRoutes = [
    '/',
    '/dashboard',
    '/customers',
    '/customers/add',
    '/orders',
    '/payments',
    '/quotes',
    '/proposals',
    '/proposals/create',
    '/profile',
    '/calendar',
    '/resources',
    '/admin/contractors',
    '/admin/leads',
    '/settings/customization',
    '/settings/locations',
    '/settings/manufacturers',
    '/settings/multipliers',
    '/settings/taxes',
    '/settings/terms',
    '/settings/users',
    '/contact',
    '/audit'
  ];

  console.log('2. Testing core routes for accessibility...');
  for (const route of coreRoutes) {
    try {
      await page.goto(`http://localhost:3000${route}`, { waitUntil: 'networkidle' });
      const url = new URL(page.url());
      discoveredRoutes.add(url.pathname);
      console.log(`   ✓ ${route} → ${url.pathname}`);
    } catch (error) {
      console.log(`   ✗ ${route} failed: ${error.message}`);
    }
    await page.waitForTimeout(500); // Brief pause between routes
  }

  // Look for additional routes by examining navigation elements
  console.log('3. Scanning for additional routes in navigation...');
  try {
    await page.goto('http://localhost:3000/dashboard');
    const links = await page.$$eval('a[href]', (anchors) =>
      anchors.map(a => a.getAttribute('href'))
        .filter(href => href && href.startsWith('/') && !href.includes('#'))
        .slice(0, 30) // Limit to prevent infinite scanning
    );

    for (const link of links) {
      if (!discoveredRoutes.has(link)) {
        try {
          await page.goto(`http://localhost:3000${link}`, { waitUntil: 'networkidle', timeout: 10000 });
          const url = new URL(page.url());
          discoveredRoutes.add(url.pathname);
          console.log(`   ✓ Found: ${link} → ${url.pathname}`);
        } catch (error) {
          console.log(`   ✗ ${link} failed: ${error.message}`);
        }
      }
    }
  } catch (error) {
    console.log(`   Navigation scanning failed: ${error.message}`);
  }

  await browser.close();

  const routes = Array.from(discoveredRoutes).sort();

  // Save discovered routes
  const routeData = {
    discovered_at: new Date().toISOString(),
    total_routes: routes.length,
    routes: routes
  };

  fs.writeFileSync('discovered-routes.json', JSON.stringify(routeData, null, 2));

  console.log(`\n📊 ROUTE DISCOVERY COMPLETE:`);
  console.log(`   Total routes discovered: ${routes.length}`);
  console.log(`   Routes saved to: discovered-routes.json`);
  console.log(`\n📋 Discovered routes:`);
  routes.forEach((route, index) => {
    console.log(`   ${(index + 1).toString().padStart(2, '0')}. ${route}`);
  });

  return routes;
}

// Run the discovery
discoverAllRoutes().catch(console.error);