import { test, expect } from '@playwright/test';
import manifest from '../AUDIT/manifest.json';

test.describe('i18n coverage', () => {
  for (const route of manifest.routes) {
    test(`no hardcoded strings on ${route.path}`, async ({ page }) => {
      await page.goto(route.path);

      // Heuristic: look for common hardcoded English patterns
      const suspiciousText = await page.evaluate(() => {
        const walker = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_TEXT,
          null
        );

        const hardcoded = [];
        let node;

        while (node = walker.nextNode()) {
          const text = (node.textContent || '').trim();
          // Skip empty, numbers-only, or single chars
          if (!text || /^[\d\s\-\+\*\/\.\,]+$/.test(text) || text.length === 1) continue;

          // Flag common English words that should be translated
          if (/\b(Submit|Cancel|Save|Delete|Edit|Search|Filter|Export|Loading|Error)\b/i.test(text)) {
            hardcoded.push(text);
          }
        }

        return hardcoded;
      });

      // Allow up to 3 exceptions (logo text, etc.)
      expect(suspiciousText.length,
        `Found potential hardcoded strings: ${suspiciousText.join(', ')}`
      ).toBeLessThanOrEqual(3);
    });
  }
});