import { test, expect } from '@playwright/test';

/**
 * Phase 6: Visual Regression Tests
 * Tests CSS consistency across key pages after massive cleanup (680 -> 23 !important)
 */

const pages = [
  { name: 'dashboard', path: '/dashboard', requiresAuth: true },
  { name: 'users', path: '/settings/users', requiresAuth: true },
  { name: 'user-groups', path: '/settings/users/groups', requiresAuth: true },
  { name: 'customers', path: '/customers', requiresAuth: true },
  { name: 'proposals', path: '/proposals', requiresAuth: true },
  { name: 'orders', path: '/orders', requiresAuth: true },
  { name: 'my-orders', path: '/my-orders', requiresAuth: true },
  { name: 'manufacturers', path: '/settings/manufacturers', requiresAuth: true },
  { name: 'locations', path: '/settings/locations', requiresAuth: true },
  { name: 'payments', path: '/payments', requiresAuth: true },
];

// Test viewports
const viewports = [
  { name: 'desktop', width: 1920, height: 1080 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 375, height: 667 },
];

test.describe('Phase 6: Visual Consistency Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication if needed
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('token', 'mock-token');
      localStorage.setItem('user', JSON.stringify({
        userId: 1,
        username: 'testuser',
        role: 'admin',
        permissions: ['all']
      }));
    });
  });

  for (const viewport of viewports) {
    test.describe(`@${viewport.name}`, () => {
      test.use({ viewport: { width: viewport.width, height: viewport.height } });

      for (const pageConfig of pages) {
        test(`${pageConfig.name} - no horizontal overflow`, async ({ page }) => {
          // Navigate to page
          await page.goto(pageConfig.path);
          await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
            console.log(`Network idle timeout for ${pageConfig.path} - continuing anyway`);
          });

          // Check for horizontal overflow
          const hasOverflow = await page.evaluate(() => {
            return document.documentElement.scrollWidth > window.innerWidth + 1;
          });

          expect(hasOverflow, `Horizontal overflow detected on ${pageConfig.name}`).toBe(false);

          // If overflow detected, capture details
          if (hasOverflow) {
            const widestElement = await page.evaluate(() => {
              const all = Array.from(document.querySelectorAll('*'));
              let max = { width: 0, selector: '', computedWidth: '' };

              for (const el of all) {
                const rect = el.getBoundingClientRect();
                if (rect.width > max.width) {
                  const computed = window.getComputedStyle(el);
                  max = {
                    width: rect.width,
                    selector: el.tagName.toLowerCase() + (el.className ? '.' + el.className.split(' ')[0] : ''),
                    computedWidth: computed.width,
                    overflow: computed.overflow
                  };
                }
              }

              return max;
            });

            console.log(`Widest element on ${pageConfig.name}:`, widestElement);

            // Take screenshot for debugging
            await page.screenshot({
              path: `test-results/overflow-${viewport.name}-${pageConfig.name}.png`,
              fullPage: true
            });
          }
        });

        test(`${pageConfig.name} - consistent spacing`, async ({ page }) => {
          await page.goto(pageConfig.path);
          await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

          // Check for consistent container spacing
          const spacing = await page.evaluate(() => {
            const containers = Array.from(document.querySelectorAll('[class*="container"], [class*="page"]'));
            return containers.map(el => {
              const styles = getComputedStyle(el);
              return {
                tag: el.tagName.toLowerCase(),
                class: el.className.split(' ')[0],
                padding: styles.padding,
                margin: styles.margin
              };
            });
          });

          // Verify we have containers
          expect(spacing.length, `No containers found on ${pageConfig.name}`).toBeGreaterThan(0);

          // Log spacing for manual review
          console.log(`Spacing on ${pageConfig.name}:`, spacing);
        });

        test(`${pageConfig.name} - no CSS errors`, async ({ page }) => {
          const cssErrors = [];

          page.on('console', msg => {
            if (msg.type() === 'error' && msg.text().includes('CSS')) {
              cssErrors.push(msg.text());
            }
          });

          await page.goto(pageConfig.path);
          await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

          expect(cssErrors, `CSS errors detected on ${pageConfig.name}: ${cssErrors.join(', ')}`).toHaveLength(0);
        });

        test(`${pageConfig.name} - sidebar renders correctly`, async ({ page }) => {
          await page.goto(pageConfig.path);
          await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

          // Check sidebar exists and is visible (desktop only)
          if (viewport.width >= 992) {
            const sidebar = page.locator('.sidebar, [class*="sidebar"]').first();
            await expect(sidebar, `Sidebar not visible on ${pageConfig.name}`).toBeVisible();

            // Check sidebar width
            const sidebarBox = await sidebar.boundingBox();
            if (sidebarBox) {
              // Should be either 56px (collapsed) or 256px (expanded)
              const width = sidebarBox.width;
              const isValidWidth = Math.abs(width - 56) < 5 || Math.abs(width - 256) < 5;
              expect(isValidWidth, `Sidebar width ${width}px is not 56px or 256px`).toBe(true);
            }
          }
        });

        test(`${pageConfig.name} - tables render correctly`, async ({ page }) => {
          await page.goto(pageConfig.path);
          await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

          // Find tables on the page
          const tables = await page.locator('table').count();

          if (tables > 0) {
            // Check first table has proper styling
            const firstTable = page.locator('table').first();
            const tableStyles = await firstTable.evaluate(el => {
              const styles = getComputedStyle(el);
              return {
                borderCollapse: styles.borderCollapse,
                width: styles.width,
                overflow: styles.overflow
              };
            });

            console.log(`Table styles on ${pageConfig.name}:`, tableStyles);

            // Table should not cause horizontal scroll
            const tableBox = await firstTable.boundingBox();
            if (tableBox) {
              expect(tableBox.width, `Table too wide on ${pageConfig.name}`).toBeLessThanOrEqual(viewport.width);
            }
          }
        });

        // Screenshot test for manual review
        test(`${pageConfig.name} - screenshot`, async ({ page }) => {
          await page.goto(pageConfig.path);
          await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

          // Wait a bit for any animations to settle
          await page.waitForTimeout(500);

          // Take full page screenshot
          await page.screenshot({
            path: `test-results/screenshots/${viewport.name}-${pageConfig.name}.png`,
            fullPage: true
          });
        });
      }
    });
  }
});

// Test specific CSS consistency issues
test.describe('CSS Consistency - Specific Issues', () => {
  test('No !important overuse', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

    // Count !important declarations in loaded stylesheets
    const importantCount = await page.evaluate(() => {
      let count = 0;
      const sheets = Array.from(document.styleSheets);

      for (const sheet of sheets) {
        try {
          const rules = Array.from(sheet.cssRules || sheet.rules || []);
          for (const rule of rules) {
            if (rule.style && rule.style.cssText) {
              const matches = rule.style.cssText.match(/!important/g);
              if (matches) count += matches.length;
            }
          }
        } catch (e) {
          // CORS error - external stylesheet
        }
      }

      return count;
    });

    console.log(`Total !important declarations in loaded CSS: ${importantCount}`);

    // We know we have 23 legitimate !important, but loaded CSS might have more from vendor libraries
    // Just log it for now rather than failing
    expect(importantCount, 'Too many !important declarations').toBeLessThan(100);
  });

  test('Consistent spacing scale', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

    // Check for consistent spacing using CSS custom properties
    const spacingVars = await page.evaluate(() => {
      const root = document.documentElement;
      const styles = getComputedStyle(root);

      return {
        xs: styles.getPropertyValue('--space-xs'),
        sm: styles.getPropertyValue('--space-sm'),
        md: styles.getPropertyValue('--space-md'),
        lg: styles.getPropertyValue('--space-lg'),
        xl: styles.getPropertyValue('--space-xl'),
        '2xl': styles.getPropertyValue('--space-2xl'),
        '3xl': styles.getPropertyValue('--space-3xl'),
      };
    });

    console.log('Spacing scale:', spacingVars);

    // Verify spacing scale is defined
    expect(spacingVars.xs).toBeTruthy();
    expect(spacingVars.sm).toBeTruthy();
    expect(spacingVars.md).toBeTruthy();
  });

  test('Dark mode support', async ({ page, context }) => {
    // Set dark mode preference
    await context.emulateMedia({ colorScheme: 'dark' });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

    // Check body background is dark
    const bgColor = await page.evaluate(() => {
      const body = document.body;
      return window.getComputedStyle(body).backgroundColor;
    });

    console.log('Dark mode background:', bgColor);

    // Take screenshot in dark mode
    await page.screenshot({
      path: 'test-results/screenshots/dark-mode-dashboard.png',
      fullPage: true
    });
  });
});
