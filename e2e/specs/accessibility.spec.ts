import { test, expect } from '../fixtures';
import AxeBuilder from '@axe-core/playwright';

const pathsToAudit = ['/', '/customers', '/quotes', '/orders', '/payments', '/settings/users'];

test.describe('Accessibility smoke checks', () => {
  for (const path of pathsToAudit) {
    test(`has no critical accessibility violations on ${path}`, async ({ gotoApp, page }) => {
      await gotoApp(path);
      await page.waitForTimeout(500);

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      const serious = results.violations.filter((violation) =>
        ['serious', 'critical'].includes(String(violation.impact || '').toLowerCase()),
      );

      if (serious.length) {
        console.table(
          serious.map((v) => ({
            id: v.id,
            impact: v.impact,
            description: v.description,
            nodes: v.nodes.length,
          })),
        );
      }

      expect(serious, `Accessibility issues detected on ${path}`).toEqual([]);
    });
  }
});