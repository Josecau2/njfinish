import type { FullConfig } from '@playwright/test';
import { chromium } from '@playwright/test';
import path from 'path';

const STORAGE_STATE = path.resolve(__dirname, '.auth/admin.json');

async function acceptTermsIfPresent(page: import('@playwright/test').Page) {
  const modal = page.locator('role=dialog[name="Terms & Conditions"]');
  if (!(await modal.first().isVisible().catch(() => false))) {
    return;
  }
  const body = modal.locator('.chakra-modal__body');
  if (await body.count()) {
    await body.evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    }).catch(() => undefined);
  }
  const acceptButton = modal.getByRole('button', { name: /accept/i });
  if (await acceptButton.isEnabled()) {
    await acceptButton.click();
  } else {
    await page.waitForTimeout(500);
    await acceptButton.click();
  }
  await page.waitForTimeout(500);
}

export default async function globalSetup(config: FullConfig) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const baseURL =
    process.env.E2E_BASE_URL ||
    (config.projects[0]?.use?.baseURL as string | undefined) ||
    'http://localhost:5173';
  const loginUrl = new URL('/login', baseURL).toString();

  const email = process.env.E2E_AUTH_EMAIL || 'joseca@symmetricalwolf.com';
  const password = process.env.E2E_AUTH_PASSWORD || 'admin123';

  await page.goto(loginUrl, { waitUntil: 'networkidle' });

  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /sign in|log in/i }).click();

  await acceptTermsIfPresent(page);

  await page.waitForLoadState('networkidle');
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), {
    timeout: 20000,
  });
  await page.waitForSelector('#main-content, [data-page-container]', { timeout: 20000 }).catch(() => undefined);

  await context.storageState({ path: STORAGE_STATE });
  await browser.close();
}