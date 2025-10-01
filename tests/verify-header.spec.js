import { test, expect } from '@playwright/test';

test('AppHeader meets specifications', async ({ page }) => {
  await page.goto('/');

  const header = page.locator('[data-app-header]');
  await expect(header).toBeVisible();

  // Height should be 60px
  const box = await header.boundingBox();
  expect(box.height).toBeGreaterThanOrEqual(56);
  expect(box.height).toBeLessThanOrEqual(64);

  // Should be sticky
  const position = await header.evaluate(el =>
    getComputedStyle(el).position
  );
  expect(position).toBe('sticky');

  // All icon buttons >= 44x44
  const iconButtons = await page.locator('[data-app-header] button:has(svg):not(:has-text(/./))').all();

  for (const btn of iconButtons) {
    const btnBox = await btn.boundingBox();
    expect(btnBox.width, 'Icon button width').toBeGreaterThanOrEqual(44);
    expect(btnBox.height, 'Icon button height').toBeGreaterThanOrEqual(44);
  }

  // Should have bottom border
  const borderBottom = await header.evaluate(el =>
    getComputedStyle(el).borderBottomWidth
  );
  expect(borderBottom).not.toBe('0px');
});