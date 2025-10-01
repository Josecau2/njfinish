import { test, expect } from '@playwright/test';
import manifest from '../AUDIT/manifest.json';

const viewports = [
  { name: 'iphone-se', width: 375, height: 667 },
  { name: 'iphone-13', width: 390, height: 844 },
  { name: 'ipad', width: 768, height: 1024 }
];

for (const vp of viewports) {
  test.describe(`No overflow @${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    for (const route of manifest.routes) {
      test(`${route.path}`, async ({ page }) => {
        await page.goto(route.path);
        await page.waitForLoadState('networkidle');

        const hasOverflow = await page.evaluate(() => {
          return document.documentElement.scrollWidth > window.innerWidth + 1;
        });

        expect(hasOverflow, 'Page has horizontal overflow').toBe(false);

        // If failed, take screenshot for debugging
        if (hasOverflow) {
          await page.screenshot({
            path: `overflow-${vp.name}-${route.path.replace(/\//g, '-')}.png`,
            fullPage: true
          });

          // Find the offending element
          const widest = await page.evaluate(() => {
            const all = Array.from(document.querySelectorAll('*'));
            let max = { width: 0, selector: '' };

            for (const el of all) {
              const rect = el.getBoundingClientRect();
              if (rect.width > max.width) {
                max = {
                  width: rect.width,
                  selector: el.tagName + (el.className ? '.' + el.className : '')
                };
              }
            }

            return max;
          });

          console.log('Widest element:', widest);
        }
      });
    }
  });
}