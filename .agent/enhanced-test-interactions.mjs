import { chromium } from 'playwright';
import fs from 'fs';

async function testAllRoutesComprehensively() {
  console.log('\n🧪 ENHANCED PHASE 2: Testing ALL routes comprehensively...');

  const routeData = JSON.parse(fs.readFileSync('discovered-routes.json', 'utf8'));
  const routes = routeData.routes;
  const errors = [];

  const browser = await chromium.launch({ headless: true, slowMo: 100 });
  const page = await browser.newPage();

  // Capture all errors with enhanced detail
  page.on('pageerror', error => {
    errors.push({
      id: `error-${errors.length + 1}`,
      type: 'pageerror',
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      url: page.url()
    });
    console.log(`    ❌ PAGE ERROR: ${error.message}`);
  });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push({
        id: `error-${errors.length + 1}`,
        type: 'console-error',
        message: msg.text(),
        timestamp: new Date().toISOString(),
        url: page.url()
      });
      console.log(`    ❌ CONSOLE ERROR: ${msg.text()}`);
    }
  });

  // Enhanced error capturing for network errors
  page.on('response', response => {
    if (response.status() >= 400) {
      console.log(`    ⚠️  HTTP ${response.status()}: ${response.url()}`);
    }
  });

  let tested = 0;
  let failed = 0;

  // Filter routes - remove parameterized ones for direct testing
  const testableRoutes = routes.filter(route =>
    !route.includes(':') &&
    !route.includes('*') &&
    !route.includes('noise') &&
    route !== '/'  // Skip root as it redirects
  );

  console.log(`\n📊 Testing ${testableRoutes.length} routes out of ${routes.length} total routes`);

  for (const route of testableRoutes) {
    console.log(`\n📍 Testing route: ${route}`);
    tested++;
    const errorsBefore = errors.length;

    try {
      // Go to route and wait for it to load
      await page.goto(`http://localhost:3000${route}`, {
        waitUntil: 'networkidle',
        timeout: 15000
      });
      await page.waitForTimeout(2000);

      // Get current URL to see if we were redirected
      const currentUrl = page.url();
      console.log(`  Current URL: ${currentUrl}`);

      // If we're on login page, try to authenticate and test the actual route
      if (currentUrl.includes('/login')) {
        console.log(`  Route requires authentication - attempting login...`);

        // Try to fill login form (use test credentials if available)
        try {
          await page.fill('input[name="email"], input[type="email"]', 'test@example.com');
          await page.fill('input[name="password"], input[type="password"]', 'testpassword');
          await page.click('button[type="submit"], button:has-text("Sign In")');
          await page.waitForTimeout(3000);

          // If still on login, we couldn't authenticate - that's ok, just note it
          if (page.url().includes('/login')) {
            console.log(`  Authentication failed (expected) - checking for errors on login page`);
          } else {
            console.log(`  Authentication succeeded - now testing protected route`);
            await page.goto(`http://localhost:3000${route}`);
            await page.waitForTimeout(2000);
          }
        } catch (authError) {
          console.log(`  Authentication attempt failed: ${authError.message}`);
        }
      }

      // Now discover and test interactions on the current page
      const interactions = await page.evaluate(() => {
        const elements = [];

        // Buttons (more comprehensive)
        document.querySelectorAll('button, [role="button"], input[type="button"], input[type="submit"]').forEach((btn, i) => {
          if (btn.offsetParent !== null) { // Only visible elements
            const text = btn.textContent?.trim() || btn.getAttribute('aria-label') || btn.value || `button-${i}`;
            elements.push({
              type: 'button',
              selector: `button:nth-of-type(${i+1})`,
              text: text.substring(0, 50),
              id: btn.id,
              visible: true
            });
          }
        });

        // Links
        document.querySelectorAll('a[href]').forEach((link, i) => {
          if (link.offsetParent !== null) {
            elements.push({
              type: 'link',
              selector: `a[href]:nth-of-type(${i+1})`,
              text: link.textContent?.trim().substring(0, 50),
              href: link.getAttribute('href'),
              visible: true
            });
          }
        });

        return elements;
      });

      // Test each interaction
      for (const interaction of interactions.slice(0, 10)) { // Limit to prevent timeout
        try {
          console.log(`    Testing ${interaction.type}: ${interaction.text}`);

          const interactionErrorsBefore = errors.length;

          switch (interaction.type) {
            case 'button':
              const button = page.locator(interaction.selector).first();
              if (await button.isVisible({ timeout: 1000 })) {
                await button.click({ timeout: 5000 });
                await page.waitForTimeout(500);
              }
              break;

            case 'link':
              const link = page.locator(interaction.selector).first();
              if (await link.isVisible({ timeout: 1000 })) {
                const href = await link.getAttribute('href');
                // Only click internal links
                if (href && href.startsWith('/') && !href.includes('download')) {
                  await link.click({ timeout: 5000 });
                  await page.waitForTimeout(500);
                }
              }
              break;
          }

          const interactionErrorsAfter = errors.length;
          if (interactionErrorsAfter > interactionErrorsBefore) {
            const newErrors = errors.slice(interactionErrorsBefore);
            newErrors.forEach(err => {
              err.interaction = interaction;
              err.route = route;
            });
          }

        } catch (interactionError) {
          console.log(`      ⚠️  Interaction failed: ${interactionError.message.substring(0, 100)}`);
        }
      }

      console.log(`    Interactions tested: ${interactions.length} found, ${Math.min(interactions.length, 10)} tested`);

    } catch (routeError) {
      console.error(`  ❌ Route failed: ${routeError.message}`);
      errors.push({
        id: `error-${errors.length + 1}`,
        type: 'route-failure',
        message: routeError.message,
        route,
        timestamp: new Date().toISOString()
      });
      failed++;
    }

    const errorsAfter = errors.length;
    if (errorsAfter > errorsBefore) {
      console.log(`  ❌ Route caused ${errorsAfter - errorsBefore} error(s)`);
      failed++;
    } else {
      console.log(`  ✅ Route clean`);
    }
  }

  await browser.close();

  console.log(`\n📊 COMPREHENSIVE Testing Summary:`);
  console.log(`   Total routes tested: ${tested}`);
  console.log(`   Routes with errors: ${failed}`);
  console.log(`   Total errors captured: ${errors.length}`);

  // Group errors by type
  const errorsByType = {};
  errors.forEach(err => {
    if (!errorsByType[err.type]) errorsByType[err.type] = [];
    errorsByType[err.type].push(err);
  });

  console.log(`\n📊 Error Breakdown:`);
  Object.entries(errorsByType).forEach(([type, errs]) => {
    console.log(`   ${type}: ${errs.length} errors`);
  });

  return errors;
}

const errors = await testAllRoutesComprehensively();
fs.writeFileSync('comprehensive-errors.json', JSON.stringify(errors, null, 2));