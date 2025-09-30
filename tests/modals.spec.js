import { test, expect } from '@playwright/test';
import manifest from '../AUDIT/manifest.json';

const viewports = [
  { name: 'iphone-13', width: 390, height: 844 },
  { name: 'laptop', width: 1366, height: 768 }
];

for (const vp of viewports) {
  test.describe(`modals @${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    for (const name of manifest.modals) {
      test(`open ${name}`, async ({ page }) => {
        await page.goto(`/__audit__/modals?open=${encodeURIComponent(name)}`);

        const dialog = page.getByRole('dialog');
        await expect(dialog).toBeVisible({ timeout: 5000 });

        // Mobile full-screen expectation
        if (vp.width < 768) {
          const size = await dialog.boundingBox();
          expect(size?.width).toBeGreaterThanOrEqual(vp.width - 4);
          expect(size?.height).toBeGreaterThanOrEqual(vp.height - 4);
        }

        // Ensure scroll is inside the modal, not body
        const bodyScrollLocked = await page.evaluate(() =>
          document.scrollingElement.clientHeight === document.scrollingElement.scrollHeight
        );
        expect(bodyScrollLocked, 'Body scroll not locked').toBeTruthy();
      });
    }
  });
}