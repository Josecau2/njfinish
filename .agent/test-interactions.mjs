import { chromium } from 'playwright';
import fs from 'fs';

async function testAllInteractions() {
  console.log('\n🧪 PHASE 2: Testing all interactions...');

  const interactions = JSON.parse(fs.readFileSync('discovered-interactions.json', 'utf8'));
  const errors = [];

  const browser = await chromium.launch({ headless: true, slowMo: 100 });
  const page = await browser.newPage();

  // Capture all errors
  page.on('pageerror', error => {
    errors.push({
      id: `error-${errors.length + 1}`,
      type: 'pageerror',
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push({
        id: `error-${errors.length + 1}`,
        type: 'console-error',
        message: msg.text(),
        timestamp: new Date().toISOString()
      });
    }
  });

  let tested = 0;
  let failed = 0;

  // Group interactions by route
  const byRoute = {};
  interactions.forEach(int => {
    if (!byRoute[int.route]) byRoute[int.route] = [];
    byRoute[int.route].push(int);
  });

  for (const [route, routeInteractions] of Object.entries(byRoute)) {
    console.log(`\n📍 Testing route: ${route} (${routeInteractions.length} interactions)`);

    try {
      await page.goto(`http://localhost:3000${route}`, {
        waitUntil: 'networkidle',
        timeout: 15000
      });
      await page.waitForTimeout(1000);

      for (const interaction of routeInteractions) {
        tested++;
        const errorsBefore = errors.length;

        try {
          console.log(`  Testing ${interaction.type}: ${interaction.text || interaction.selector}`);

          switch (interaction.type) {
            case 'button':
              const button = page.locator(interaction.selector).first();
              if (await button.isVisible() && await button.isEnabled()) {
                await button.click({ timeout: 5000 });
              }
              break;

            case 'link':
              const link = page.locator(interaction.selector).first();
              if (await link.isVisible()) {
                // Check if it's an external link or download
                const href = await link.getAttribute('href');
                if (href && !href.startsWith('http') && !href.includes('download')) {
                  await link.click({ timeout: 5000 });
                  await page.waitForTimeout(500);
                }
              }
              break;

            case 'input':
            case 'textarea':
              const input = page.locator(interaction.selector).first();
              if (await input.isVisible() && await input.isEnabled()) {
                await input.fill('test input data');
                await input.blur();
              }
              break;

            case 'select':
              const select = page.locator(interaction.selector).first();
              if (await select.isVisible() && await select.isEnabled()) {
                const options = await select.locator('option').count();
                if (options > 1) {
                  await select.selectOption({ index: 1 });
                }
              }
              break;

            case 'form':
              // Don't actually submit forms, just trigger validation
              const form = page.locator(interaction.selector).first();
              if (await form.isVisible()) {
                await form.evaluate(form => {
                  const event = new Event('submit', { cancelable: true });
                  form.dispatchEvent(event);
                  event.preventDefault();
                });
              }
              break;

            case 'clickable':
              const clickable = page.locator(interaction.selector).first();
              if (await clickable.isVisible()) {
                await clickable.click({ timeout: 5000 });
              }
              break;
          }

          await page.waitForTimeout(500);

          const errorsAfter = errors.length;
          if (errorsAfter > errorsBefore) {
            failed++;
            const newErrors = errors.slice(errorsBefore);
            newErrors.forEach(err => {
              err.interaction = interaction;
              err.route = route;
            });
            console.log(`    ❌ Caused ${errorsAfter - errorsBefore} error(s)`);
          } else {
            console.log(`    ✓ OK`);
          }

        } catch (testError) {
          console.log(`    ⚠️  Interaction failed: ${testError.message}`);
          errors.push({
            id: `error-${errors.length + 1}`,
            type: 'test-failure',
            message: testError.message,
            interaction,
            route,
            timestamp: new Date().toISOString()
          });
          failed++;
        }
      }

    } catch (error) {
      console.error(`  ❌ Route failed to load: ${error.message}`);
      errors.push({
        id: `error-${errors.length + 1}`,
        type: 'route-load-failure',
        message: error.message,
        route,
        timestamp: new Date().toISOString()
      });
    }
  }

  await browser.close();

  console.log(`\n📊 Testing Summary:`);
  console.log(`   Total interactions tested: ${tested}`);
  console.log(`   Failed interactions: ${failed}`);
  console.log(`   Total errors captured: ${errors.length}`);

  return errors;
}

const errors = await testAllInteractions();
fs.writeFileSync('captured-errors.json', JSON.stringify(errors, null, 2));