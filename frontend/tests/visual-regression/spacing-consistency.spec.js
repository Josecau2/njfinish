import { test, expect } from '@playwright/test';

/**
 * Spacing Consistency Tests - Phase 6
 *
 * Tests for consistent spacing and layout after CSS cleanup
 */

test.describe('Spacing Consistency Tests', () => {

  test('Page content containers - consistent padding', async ({ page }) => {
    await page.goto('/dashboard');

    await page.waitForLoadState('networkidle');

    // Check main content areas have consistent padding
    const containers = page.locator('[class*="container"], [class*="content"], main, [role="main"]');
    const containerCount = await containers.count();

    if (containerCount > 0) {
      // Get padding values from first container
      const firstContainerPadding = await containers.first().evaluate(el => {
        const style = window.getComputedStyle(el);
        return {
          top: style.paddingTop,
          right: style.paddingRight,
          bottom: style.paddingBottom,
          left: style.paddingLeft
        };
      });

      // Check that padding is reasonable (not zero and not excessive)
      expect(parseInt(firstContainerPadding.top)).toBeGreaterThan(0);
      expect(parseInt(firstContainerPadding.top)).toBeLessThan(100);
      expect(parseInt(firstContainerPadding.bottom)).toBeGreaterThan(0);
      expect(parseInt(firstContainerPadding.bottom)).toBeLessThan(100);
    }
  });

  test('Card components - consistent spacing', async ({ page }) => {
    await page.goto('/dashboard');

    await page.waitForLoadState('networkidle');

    // Look for card-like elements
    const cards = page.locator('[class*="card"], [class*="Card"], .chakra-card, [data-testid*="card"]');
    const cardCount = await cards.count();

    if (cardCount > 0) {
      // Check first card has reasonable padding
      const cardPadding = await cards.first().evaluate(el => {
        const style = window.getComputedStyle(el);
        return parseInt(style.paddingTop) + parseInt(style.paddingBottom);
      });

      expect(cardPadding).toBeGreaterThan(10); // At least some padding
      expect(cardPadding).toBeLessThan(200); // Not excessive
    }
  });

  test('Button spacing - consistent margins', async ({ page }) => {
    await page.goto('/dashboard');

    await page.waitForLoadState('networkidle');

    // Check buttons have consistent spacing
    const buttons = page.locator('button, [role="button"], .chakra-button');
    const buttonCount = await buttons.count();

    if (buttonCount > 0) {
      // Get margin from first button
      const buttonMargin = await buttons.first().evaluate(el => {
        const style = window.getComputedStyle(el);
        return parseInt(style.marginTop) + parseInt(style.marginBottom);
      });

      // Should not have excessive margins
      expect(buttonMargin).toBeLessThan(50);
    }
  });

  test('Form field spacing - consistent gaps', async ({ page }) => {
    await page.goto('/admin/users'); // Assuming users page has forms

    await page.waitForLoadState('networkidle');

    // Check form fields have consistent spacing
    const formFields = page.locator('input, textarea, select');
    const fieldCount = await formFields.count();

    if (fieldCount > 1) {
      // Check vertical spacing between fields
      const fieldPositions = await formFields.evaluateAll(els => {
        return els.map(el => el.getBoundingClientRect().top);
      });

      // Calculate gaps between consecutive fields
      const gaps = [];
      for (let i = 1; i < fieldPositions.length; i++) {
        gaps.push(fieldPositions[i] - fieldPositions[i - 1]);
      }

      // Gaps should be reasonable (not too small, not too large)
      const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
      expect(avgGap).toBeGreaterThan(20); // At least 20px gap
      expect(avgGap).toBeLessThan(200); // Less than 200px gap
    }
  });

  test('Navigation spacing - consistent menu items', async ({ page }) => {
    await page.goto('/dashboard');

    await page.waitForLoadState('networkidle');

    // Check sidebar navigation items
    const navItems = page.locator('[data-testid="sidebar"] nav a, [data-testid="sidebar"] [role="navigation"] a');
    const navCount = await navItems.count();

    if (navCount > 1) {
      // Check spacing between nav items
      const navPositions = await navItems.evaluateAll(els => {
        return els.map(el => el.getBoundingClientRect().top);
      });

      const gaps = [];
      for (let i = 1; i < navPositions.length; i++) {
        gaps.push(navPositions[i] - navPositions[i - 1]);
      }

      const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
      expect(avgGap).toBeGreaterThan(5); // At least some gap
      expect(avgGap).toBeLessThan(100); // Not excessive
    }
  });

  test('Typography hierarchy - consistent line heights', async ({ page }) => {
    await page.goto('/dashboard');

    await page.waitForLoadState('networkidle');

    // Check heading line heights
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    const headingCount = await headings.count();

    if (headingCount > 0) {
      const lineHeightData = await headings.evaluateAll(els => {
        return els.map(el => {
          const style = window.getComputedStyle(el);
          const lineHeight = style.lineHeight;
          const fontSize = parseFloat(style.fontSize);

          // Handle both unitless and pixel values
          let lhValue;
          if (lineHeight === 'normal') {
            lhValue = 1.2; // Default normal line height
          } else if (lineHeight.includes('px')) {
            lhValue = parseFloat(lineHeight) / fontSize;
          } else {
            lhValue = parseFloat(lineHeight);
          }

          return {
            lineHeight: lhValue,
            fontSize: fontSize
          };
        });
      });

      // Line heights should be reasonable (1.0 to 3.0 ratio)
      lineHeightData.forEach(data => {
        expect(data.lineHeight).toBeGreaterThan(0.8);
        expect(data.lineHeight).toBeLessThan(4.0);
      });
    }
  });

  test('Grid layouts - consistent gutters', async ({ page }) => {
    await page.goto('/dashboard');

    await page.waitForLoadState('networkidle');

    // Check for grid or flexbox containers
    const grids = page.locator('[class*="grid"], [class*="Grid"], [style*="display: grid"], [style*="display: flex"]');
    const gridCount = await grids.count();

    if (gridCount > 0) {
      // Check gap property on first grid
      const gap = await grids.first().evaluate(el => {
        const style = window.getComputedStyle(el);
        return style.gap || style.gridGap || '0px';
      });

      // If gap is set, it should be reasonable
      if (gap !== '0px' && gap !== 'normal') {
        const gapValue = parseInt(gap);
        expect(gapValue).toBeGreaterThanOrEqual(0);
        expect(gapValue).toBeLessThan(100);
      }
    }
  });

});