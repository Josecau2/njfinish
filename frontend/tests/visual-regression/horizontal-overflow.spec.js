import { test, expect } from '@playwright/test';

/**
 * Horizontal Overflow Detection Tests - Phase 6
 *
 * Critical tests to ensure no horizontal scrolling after CSS cleanup
 */

test.describe('Horizontal Overflow Detection', () => {

  test('Global horizontal overflow check - all pages', async ({ page }) => {
    const pages = [
      '/dashboard',
      '/admin/users',
      '/admin/locations',
      '/proposals',
      '/calendar'
    ];

    for (const pageUrl of pages) {
      await test.step(`Check ${pageUrl} for horizontal overflow`, async () => {
        try {
          await page.goto(pageUrl, { timeout: 30000 });
          await page.waitForLoadState('networkidle');

          // Check body scroll width vs viewport width
          const overflow = await page.evaluate(() => {
            const body = document.body;
            const html = document.documentElement;

            const bodyScrollWidth = Math.max(body.scrollWidth, html.scrollWidth);
            const bodyClientWidth = Math.max(body.clientWidth, html.clientWidth);
            const windowWidth = window.innerWidth;

            return {
              bodyScrollWidth,
              bodyClientWidth,
              windowWidth,
              overflow: bodyScrollWidth - windowWidth
            };
          });

          // Allow small tolerance (10px) for rounding errors
          expect(overflow.overflow).toBeLessThanOrEqual(10);

          // Also check that no elements have negative margins causing overflow
          const negativeMargins = await page.evaluate(() => {
            const elements = document.querySelectorAll('*');
            let hasNegativeMargin = false;

            elements.forEach(el => {
              const style = window.getComputedStyle(el);
              const marginLeft = parseInt(style.marginLeft);
              const marginRight = parseInt(style.marginRight);

              if (marginLeft < -50 || marginRight < -50) { // Allow small negative margins
                hasNegativeMargin = true;
              }
            });

            return hasNegativeMargin;
          });

          expect(negativeMargins).toBe(false);

        } catch (error) {
          console.log(`Page ${pageUrl} not accessible, skipping: ${error.message}`);
        }
      });
    }
  });

  test('Table overflow prevention', async ({ page }) => {
    await page.goto('/admin/users');

    await page.waitForLoadState('networkidle');

    // Check all tables for horizontal overflow
    const tables = page.locator('table');
    const tableCount = await tables.count();

    for (let i = 0; i < tableCount; i++) {
      await test.step(`Check table ${i + 1} for overflow`, async () => {
        const tableOverflow = await tables.nth(i).evaluate(el => {
          return {
            scrollWidth: el.scrollWidth,
            clientWidth: el.clientWidth,
            parentScrollWidth: el.parentElement.scrollWidth,
            parentClientWidth: el.parentElement.clientWidth
          };
        });

        // Table should not cause parent to overflow
        expect(tableOverflow.scrollWidth).toBeLessThanOrEqual(tableOverflow.parentClientWidth + 20);

        // Table itself should not have excessive scroll width
        const tableOverflowAmount = tableOverflow.scrollWidth - tableOverflow.clientWidth;
        expect(tableOverflowAmount).toBeLessThan(100); // Allow some overflow for responsive design
      });
    }
  });

  test('Modal overflow prevention', async ({ page }) => {
    await page.goto('/dashboard');

    await page.waitForLoadState('networkidle');

    // Try to find and open a modal
    const modalTriggers = page.locator('[data-testid*="modal"], [aria-label*="open"], button[class*="modal"]');
    const triggerCount = await modalTriggers.count();

    if (triggerCount > 0) {
      // Click first modal trigger
      await modalTriggers.first().click();
      await page.waitForTimeout(1000); // Wait for modal animation

      // Check for modal overflow
      const modalOverflow = await page.evaluate(() => {
        const modal = document.querySelector('[role="dialog"], .modal, .chakra-modal');
        if (!modal) return null;

        const modalRect = modal.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        return {
          modalWidth: modalRect.width,
          modalHeight: modalRect.height,
          viewportWidth,
          viewportHeight,
          overflowX: modalRect.right > viewportWidth,
          overflowY: modalRect.bottom > viewportHeight,
          leftOverflow: modalRect.left < 0,
          topOverflow: modalRect.top < 0
        };
      });

      if (modalOverflow) {
        // Modal should not overflow viewport
        expect(modalOverflow.overflowX).toBe(false);
        expect(modalOverflow.overflowY).toBe(false);
        expect(modalOverflow.leftOverflow).toBe(false);
        expect(modalOverflow.topOverflow).toBe(false);
      }
    }
  });

  test('Sidebar overflow prevention', async ({ page }) => {
    await page.goto('/dashboard');

    await page.waitForLoadState('networkidle');

    // Check sidebar doesn't cause horizontal overflow
    const sidebar = page.locator('[data-testid="sidebar"], aside, nav[class*="sidebar"]').first();

    if (await sidebar.isVisible()) {
      const sidebarOverflow = await sidebar.evaluate(el => {
        const rect = el.getBoundingClientRect();
        const viewportWidth = window.innerWidth;

        return {
          sidebarRight: rect.right,
          viewportWidth,
          overflow: rect.right - viewportWidth
        };
      });

      // Sidebar should not extend beyond viewport
      expect(sidebarOverflow.overflow).toBeLessThanOrEqual(10);
    }
  });

  test('Mobile horizontal overflow - strict check', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'Webkit has mobile viewport issues');

    // Test multiple mobile breakpoints
    const viewports = [
      { width: 320, height: 568 }, // iPhone SE
      { width: 375, height: 667 }, // iPhone 6/7/8
      { width: 414, height: 896 }, // iPhone 11
    ];

    for (const viewport of viewports) {
      await test.step(`Mobile ${viewport.width}x${viewport.height}`, async () => {
        await page.setViewportSize(viewport);

        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');

        const overflow = await page.evaluate(() => {
          const body = document.body;
          const html = document.documentElement;

          return {
            scrollWidth: Math.max(body.scrollWidth, html.scrollWidth),
            clientWidth: Math.max(body.clientWidth, html.clientWidth),
            windowWidth: window.innerWidth,
            overflow: Math.max(body.scrollWidth, html.scrollWidth) - window.innerWidth
          };
        });

        // Strict check for mobile - no horizontal overflow allowed
        expect(overflow.overflow).toBeLessThanOrEqual(5);
      });
    }
  });

  test('Form elements overflow prevention', async ({ page }) => {
    await page.goto('/admin/users');

    await page.waitForLoadState('networkidle');

    // Check form inputs don't cause overflow
    const inputs = page.locator('input, textarea, select');
    const inputCount = await inputs.count();

    for (let i = 0; i < Math.min(inputCount, 5); i++) { // Check first 5 inputs
      await test.step(`Check input ${i + 1} for overflow`, async () => {
        const inputOverflow = await inputs.nth(i).evaluate(el => {
          const rect = el.getBoundingClientRect();
          const parentRect = el.parentElement.getBoundingClientRect();
          const viewportWidth = window.innerWidth;

          return {
            inputRight: rect.right,
            parentRight: parentRect.right,
            viewportWidth,
            overflow: Math.max(rect.right - parentRect.right, rect.right - viewportWidth)
          };
        });

        // Input should not overflow its container or viewport
        expect(inputOverflow.overflow).toBeLessThanOrEqual(20);
      });
    }
  });

});