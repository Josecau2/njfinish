import { test as base, expect } from '@playwright/test';

export type AppFixtures = {
  gotoApp: (path?: string, opts?: { waitUntil?: 'load' | 'domcontentloaded' | 'networkidle' }) => Promise<void>;
  closeSweetAlertIfOpen: () => Promise<void>;
  assertNoErrorToast: () => Promise<void>;
};

export const test = base.extend<AppFixtures>({
  gotoApp: async ({ page, baseURL }, use) => {
    const goto = async (
      path = '/',
      opts: { waitUntil?: 'load' | 'domcontentloaded' | 'networkidle' } = {},
    ) => {
      const target = (() => {
        if (!path) return baseURL ?? '/';
        if (/^https?:/i.test(path)) return path;
        if (path.startsWith('/') || !baseURL) return path;
        return `${baseURL}/${path}`;
      })();
      await page.goto(target, { waitUntil: opts.waitUntil ?? 'domcontentloaded' });
      await page.waitForSelector('#main-content, [data-page-container]', { timeout: 20000 });
    };
    await use(goto);
  },
  closeSweetAlertIfOpen: async ({ page }, use) => {
    const closer = async () => {
      const container = page.locator('.swal2-container');
      if (!(await container.count())) return;
      const confirm = container.getByRole('button', { name: /ok|confirm|close|dismiss/i }).first();
      if (await confirm.isVisible().catch(() => false)) {
        await confirm.click();
        await page.waitForTimeout(200);
      } else {
        await container.click({ position: { x: 1, y: 1 } });
        await page.waitForTimeout(200);
      }
    };
    await use(closer);
  },
  assertNoErrorToast: async ({ page }, use) => {
    const assertion = async () => {
      const alert = page.locator('[role="alert"]').filter({ hasText: /error|failed|warning/i });
      if (await alert.count()) {
        throw new Error('Error toast detected on page');
      }
    };
    await use(assertion);
  },
});

export { expect } from '@playwright/test';