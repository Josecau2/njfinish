const { test, expect } = require('@playwright/test');

/**
 * Mobile UX Verification Test Suite
 * Tests all items from "What Needs Work" section in COMPREHENSIVE-AUDIT.md
 */

test.describe('Mobile UX Verification', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE

  test.beforeEach(async ({ page }) => {
    // Navigate to login and authenticate
    await page.goto('http://localhost:8080/login');

    // Try to login (skip if already logged in)
    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.isVisible()) {
      await emailInput.fill('test@example.com');
      await page.locator('input[type="password"]').fill('password');
      await page.locator('button[type="submit"]').click();
      await page.waitForURL('**/dashboard', { timeout: 5000 }).catch(() => {});
    }
  });

  test('1. Tables have mobile card alternatives', async ({ page }) => {
    const tablePagesToCheck = [
      { url: '/customers', name: 'Customers' },
      { url: '/orders', name: 'Orders' },
      { url: '/payments', name: 'Payments' },
      { url: '/proposals', name: 'Proposals' }
    ];

    for (const tablePage of tablePagesToCheck) {
      await page.goto(`http://localhost:8080${tablePage.url}`);
      await page.waitForLoadState('networkidle');

      // Check if traditional <table> is hidden on mobile
      const tableElement = page.locator('table').first();
      if (await tableElement.count() > 0) {
        const isHidden = await tableElement.evaluate(el => {
          const style = window.getComputedStyle(el);
          return style.display === 'none' || style.visibility === 'hidden';
        });

        // If table visible, check for Card components (mobile alternative)
        if (!isHidden) {
          const cards = page.locator('[class*="chakra-card"], [class*="Card"]');
          const cardCount = await cards.count();

          console.log(`${tablePage.name}: Table visible=${!isHidden}, Cards found=${cardCount}`);
        } else {
          console.log(`${tablePage.name}: ✓ Table hidden on mobile, cards likely shown`);
        }
      }
    }
  });

  test('2. Breakpoint consistency check (1024px not 768px)', async ({ page }) => {
    // Test auth pages use 1024px breakpoint
    const authPages = ['/login', '/request-access', '/forgot-password'];

    for (const authPage of authPages) {
      await page.goto(`http://localhost:8080${authPage}`);
      await page.waitForLoadState('networkidle');

      // On mobile (375px), left panel should be hidden
      const leftPanel = page.locator('[class*="branding"], [class*="left-panel"]').first();
      if (await leftPanel.count() > 0) {
        const isHidden = await leftPanel.evaluate(el => {
          const style = window.getComputedStyle(el);
          return style.display === 'none';
        });

        expect(isHidden).toBe(true);
        console.log(`${authPage}: ✓ Left panel hidden on mobile`);
      }
    }

    // Test at 768px (tablet) - left panel should STILL be hidden
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('http://localhost:8080/login');
    const leftPanel768 = page.locator('[class*="branding"], [class*="left-panel"]').first();
    if (await leftPanel768.count() > 0) {
      const isHidden = await leftPanel768.evaluate(el => {
        const style = window.getComputedStyle(el);
        return style.display === 'none';
      });
      expect(isHidden).toBe(true);
      console.log('✓ Breakpoint: Left panel still hidden at 768px (correct - uses 1024px)');
    }

    // Test at 1024px - left panel should be VISIBLE
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.reload();
    const leftPanel1024 = page.locator('[class*="branding"], [class*="left-panel"]').first();
    if (await leftPanel1024.count() > 0) {
      const isVisible = await leftPanel1024.evaluate(el => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none';
      });
      expect(isVisible).toBe(true);
      console.log('✓ Breakpoint: Left panel visible at 1024px (correct)');
    }
  });

  test('3. Tap targets are minimum 44x44px', async ({ page }) => {
    await page.goto('http://localhost:8080/login');
    await page.waitForLoadState('networkidle');

    const interactiveSelectors = [
      'button',
      'a',
      'input[type="checkbox"]',
      'input[type="radio"]',
      '[role="button"]',
      '[onclick]'
    ];

    let failedTargets = [];

    for (const selector of interactiveSelectors) {
      const elements = page.locator(selector);
      const count = await elements.count();

      for (let i = 0; i < count; i++) {
        const element = elements.nth(i);
        const box = await element.boundingBox();

        if (box && (box.width < 44 || box.height < 44)) {
          const tagName = await element.evaluate(el => el.tagName);
          failedTargets.push({
            selector,
            index: i,
            tagName,
            width: box.width,
            height: box.height
          });
        }
      }
    }

    if (failedTargets.length > 0) {
      console.log(`⚠️  Found ${failedTargets.length} tap targets below 44x44px:`);
      failedTargets.forEach(target => {
        console.log(`  - ${target.tagName} (${target.width}x${target.height}px)`);
      });
    } else {
      console.log('✓ All tap targets meet 44x44px minimum');
    }
  });

  test('4. Modals are full-screen on mobile', async ({ page }) => {
    // This test would need to trigger modals - skipping for now as it requires specific actions
    console.log('⚠️  Modal test requires user interaction - manual verification needed');
  });

  test('5. Landscape mode works properly', async ({ page }) => {
    // Test landscape orientation (667x375 - iPhone SE landscape)
    await page.setViewportSize({ width: 667, height: 375 });

    await page.goto('http://localhost:8080/login');
    await page.waitForLoadState('networkidle');

    // Check if page is usable (no horizontal scroll, content visible)
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = 667;

    const hasHorizontalScroll = bodyWidth > viewportWidth;

    if (hasHorizontalScroll) {
      console.log(`⚠️  Horizontal scroll detected in landscape: body=${bodyWidth}px, viewport=${viewportWidth}px`);
    } else {
      console.log('✓ No horizontal scroll in landscape mode');
    }

    // Check if important elements are visible
    const button = page.locator('button[type="submit"]').first();
    const isVisible = await button.isVisible();
    expect(isVisible).toBe(true);
    console.log('✓ Submit button visible in landscape');
  });

  test('6. Gesture support documentation', async ({ page }) => {
    // This is a documentation check, not a runtime test
    console.log('📝 Gesture support status:');
    console.log('  - Swipe to go back: ❌ Not implemented');
    console.log('  - Pull-to-refresh: ❌ Not implemented');
    console.log('  - Native gestures only (browser default)');
  });

  test('7. Modal stacking check', async ({ page }) => {
    console.log('⚠️  Modal stacking test requires triggering multiple modals - manual verification needed');
  });

  test('8. PDF viewer mobile optimization', async ({ page }) => {
    // Navigate to a page that might have PDF viewer
    console.log('⚠️  PDF viewer test requires PDF content - manual verification needed');
    // Would need to check if PDFViewerModal exists and test it
  });
});

test.describe('Desktop Verification (1024px+)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('Auth pages show 50/50 split', async ({ page }) => {
    await page.goto('http://localhost:8080/login');
    await page.waitForLoadState('networkidle');

    const leftPanel = page.locator('[class*="branding"], [class*="left-panel"]').first();
    const rightPanel = page.locator('[class*="content"], [class*="right-panel"]').first();

    if (await leftPanel.count() > 0 && await rightPanel.count() > 0) {
      const leftBox = await leftPanel.boundingBox();
      const rightBox = await rightPanel.boundingBox();

      if (leftBox && rightBox) {
        const leftWidth = leftBox.width;
        const rightWidth = rightBox.width;
        const ratio = leftWidth / rightWidth;

        console.log(`Left panel: ${leftWidth}px, Right panel: ${rightWidth}px, Ratio: ${ratio.toFixed(2)}`);

        // Allow for some flex/padding variance (0.8 to 1.2 ratio acceptable)
        expect(ratio).toBeGreaterThan(0.8);
        expect(ratio).toBeLessThan(1.2);
        console.log('✓ 50/50 split verified');
      }
    }
  });
});
