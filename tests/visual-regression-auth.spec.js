import { test, expect } from '@playwright/test';

/**
 * Phase 9: Visual Regression Tests with Real Authentication
 * Tests CSS consistency and visual regressions after !important cleanup
 * Uses real login credentials: joseca@symmetricalwolf.com / admin123
 */

const pages = [
  { name: 'dashboard', path: '/dashboard' },
  { name: 'users', path: '/settings/users' },
  { name: 'customers', path: '/customers' },
  { name: 'proposals', path: '/proposals' },
  { name: 'orders', path: '/orders' },
  { name: 'manufacturers', path: '/settings/manufacturers' },
];

// Test viewports for visual regression
const viewports = [
  { name: 'desktop', width: 1920, height: 1080 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 375, height: 667 },
];

test.describe('Phase 9: Visual Regression Tests with Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Set longer timeout for login
    test.setTimeout(60000);

    // Navigate to login page
    await page.goto('/');

    // Wait for login form to be visible
    await page.waitForSelector('input[type="email"], input[name="email"], [data-testid="email-input"]', { timeout: 10000 });

    // Fill login credentials
    const emailInput = page.locator('input[type="email"], input[name="email"], [data-testid="email-input"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"], [data-testid="password-input"]').first();

    await emailInput.fill('joseca@symmetricalwolf.com');
    await passwordInput.fill('admin123');

    // Click login button
    const loginButton = page.locator('button[type="submit"], [data-testid="login-button"], button:has-text("Login"), button:has-text("Sign In")').first();
    await loginButton.click();

    // Wait for successful login - look for dashboard or navigation
    await page.waitForURL('**/dashboard', { timeout: 30000 });

    // Verify we're logged in
    await expect(page).toHaveURL(/.*\/dashboard/);
  });

  for (const viewport of viewports) {
    test.describe(`@${viewport.name} viewport`, () => {
      test.use({ viewport: { width: viewport.width, height: viewport.height } });

      for (const pageConfig of pages) {
        test(`${pageConfig.name} - visual regression test`, async ({ page }) => {
          // Navigate to the page
          await page.goto(pageConfig.path);

          // Wait for page to load completely
          await page.waitForLoadState('networkidle');

          // Wait a bit more for any dynamic content
          await page.waitForTimeout(2000);

          // Take screenshot for visual regression
          await expect(page).toHaveScreenshot(`${pageConfig.name}-${viewport.name}.png`, {
            fullPage: true,
            threshold: 0.1, // Allow 0.1% difference for minor rendering variations
          });
        });

        test(`${pageConfig.name} - no horizontal overflow @${viewport.name}`, async ({ page }) => {
          await page.goto(pageConfig.path);
          await page.waitForLoadState('networkidle');

          // Check for horizontal overflow
          const body = page.locator('body');
          const scrollWidth = await body.evaluate(el => el.scrollWidth);
          const clientWidth = await body.evaluate(el => el.clientWidth);

          // Allow small differences (scrollbars, rounding)
          expect(scrollWidth - clientWidth).toBeLessThanOrEqual(20);
        });

        test(`${pageConfig.name} - responsive layout @${viewport.name}`, async ({ page }) => {
          await page.goto(pageConfig.path);
          await page.waitForLoadState('networkidle');

          // Check that key elements are visible and properly sized
          const mainContent = page.locator('main, [role="main"], .main-content, #main-content').first();
          await expect(mainContent).toBeVisible();

          // Check for proper responsive behavior
          if (viewport.name === 'mobile') {
            // On mobile, check that sidebar is hidden or collapsed
            const sidebar = page.locator('.sidebar, [data-testid="sidebar"], .app-sidebar').first();
            const isVisible = await sidebar.isVisible();

            if (isVisible) {
              // If visible, should be narrow or collapsed
              const sidebarWidth = await sidebar.evaluate(el => el.offsetWidth);
              expect(sidebarWidth).toBeLessThan(300); // Should be narrow on mobile
            }
          }
        });
      }
    });
  }

  test('login flow verification', async ({ page }) => {
    // Test the complete login flow
    await page.goto('/');

    // Verify login form elements
    await expect(page.locator('input[type="email"]').first()).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();

    // Perform login
    await page.locator('input[type="email"]').first().fill('joseca@symmetricalwolf.com');
    await page.locator('input[type="password"]').first().fill('admin123');

    const loginButton = page.locator('button[type="submit"]').first();
    await loginButton.click();

    // Verify successful login
    await page.waitForURL('**/dashboard');
    await expect(page).toHaveURL(/.*\/dashboard/);

    // Verify dashboard content loads
    await expect(page.locator('text=Dashboard').first()).toBeVisible();
  });

  test('CSS cascade verification', async ({ page }) => {
    // Navigate to dashboard after login
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Verify that CSS is properly applied without !important conflicts
    const bodyStyles = await page.evaluate(() => {
      const body = document.body;
      const computed = window.getComputedComputedStyle(body);
      return {
        fontFamily: computed.fontFamily,
        fontSize: computed.fontSize,
        backgroundColor: computed.backgroundColor,
        color: computed.color
      };
    });

    // Verify Chakra UI theme is applied
    expect(bodyStyles.fontFamily).toContain('system-ui'); // Chakra default
    expect(bodyStyles.backgroundColor).toBeTruthy();
    expect(bodyStyles.color).toBeTruthy();
  });
});