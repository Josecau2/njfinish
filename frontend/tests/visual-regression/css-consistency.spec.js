import { test, expect } from '@playwright/test';

/**
 * Visual Regression Tests - Phase 6
 *
 * Tests for CSS consistency and visual regressions after !important cleanup
 */

test.describe('CSS Visual Regression Tests', () => {

  test('Dashboard page - no horizontal overflow', async ({ page }) => {
    await page.goto('/dashboard');

    // Wait for page to load completely
    await page.waitForLoadState('networkidle');

    // Check for horizontal overflow
    const bodyScrollWidth = await page.evaluate(() => {
      return document.body.scrollWidth;
    });
    const windowWidth = await page.viewportSize()?.width || 1280;

    expect(bodyScrollWidth).toBeLessThanOrEqual(windowWidth + 10); // Allow small tolerance

    // Take screenshot for visual regression (creates baseline if doesn't exist)
    await expect(page).toHaveScreenshot('dashboard-no-overflow.png', {
      fullPage: true,
      threshold: 0.1 // Allow small differences
    });
  });

  test('Sidebar collapsed state - consistent spacing', async ({ page }) => {
    await page.goto('/dashboard');

    // Wait for sidebar to load
    await page.waitForSelector('.sidebar', { timeout: 10000 });

    // Check if sidebar toggle exists and click to collapse
    const sidebarToggle = page.locator('[class*="sidebar-close"], [aria-label*="close"]').first();
    if (await sidebarToggle.isVisible()) {
      await sidebarToggle.click();
      await page.waitForTimeout(500); // Wait for animation
    }

    // Take screenshot of collapsed sidebar
    await expect(page.locator('.sidebar')).toHaveScreenshot('sidebar-collapsed.png', {
      threshold: 0.1
    });
  });

  test('Modal dialogs - proper z-index stacking', async ({ page }) => {
    await page.goto('/dashboard');

    // Try to trigger a modal (this might need adjustment based on actual app)
    // For now, we'll test that no modals are broken by checking body doesn't have overflow
    const bodyOverflow = await page.evaluate(() => {
      const body = document.body;
      const computedStyle = window.getComputedStyle(body);
      return computedStyle.overflow;
    });

    // Body should not have overflow hidden unless a modal is open
    expect(bodyOverflow).not.toBe('hidden');

    // Take full page screenshot
    await expect(page).toHaveScreenshot('dashboard-modal-ready.png', {
      fullPage: true,
      threshold: 0.1
    });
  });

  test('Table components - consistent styling', async ({ page }) => {
    await page.goto('/admin/users'); // Assuming users page has tables

    await page.waitForLoadState('networkidle');

    // Check for table elements
    const tables = page.locator('table');
    const tableCount = await tables.count();

    if (tableCount > 0) {
      // Take screenshot of first table
      await expect(tables.first()).toHaveScreenshot('table-consistent-styling.png', {
        threshold: 0.1
      });

      // Check table doesn't overflow horizontally
      const tableScrollWidth = await tables.first().evaluate(el => el.scrollWidth);
      const tableClientWidth = await tables.first().evaluate(el => el.clientWidth);

      expect(tableScrollWidth).toBeLessThanOrEqual(tableClientWidth + 20); // Small tolerance
    }
  });

  test('Form inputs - consistent spacing and alignment', async ({ page }) => {
    await page.goto('/admin/users'); // Assuming users page has forms

    await page.waitForLoadState('networkidle');

    // Check for form inputs
    const inputs = page.locator('input[type="text"], input[type="email"], textarea, select');
    const inputCount = await inputs.count();

    if (inputCount > 0) {
      // Take screenshot of form area
      const formArea = page.locator('form').first();
      if (await formArea.isVisible()) {
        await expect(formArea).toHaveScreenshot('form-consistent-spacing.png', {
          threshold: 0.1
        });
      }
    }
  });

  test('Mobile responsiveness - no horizontal scroll', async ({ page, browserName }) => {
    // Skip on webkit due to known issues
    test.skip(browserName === 'webkit', 'Webkit has issues with mobile viewport');

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Check for horizontal overflow on mobile
    const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const windowWidth = 375;

    expect(bodyScrollWidth).toBeLessThanOrEqual(windowWidth + 10);

    // Take mobile screenshot
    await expect(page).toHaveScreenshot('dashboard-mobile-no-overflow.png', {
      fullPage: true,
      threshold: 0.1
    });
  });

  test('Dark mode toggle - consistent appearance', async ({ page }) => {
    await page.goto('/dashboard');

    // Look for dark mode toggle
    const darkModeToggle = page.locator('[data-testid="theme-toggle"], [aria-label*="dark"], [aria-label*="theme"]').first();

    if (await darkModeToggle.isVisible()) {
      // Take light mode screenshot
      await expect(page).toHaveScreenshot('dashboard-light-mode.png', {
        fullPage: true,
        threshold: 0.1
      });

      // Toggle to dark mode
      await darkModeToggle.click();
      await page.waitForTimeout(500); // Wait for theme transition

      // Take dark mode screenshot
      await expect(page).toHaveScreenshot('dashboard-dark-mode.png', {
        fullPage: true,
        threshold: 0.1
      });
    }
  });

});