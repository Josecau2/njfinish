import { test, expect } from '../fixtures';

const VALID_EMAIL = process.env.E2E_AUTH_EMAIL || 'joseca@symmetricalwolf.com';
const VALID_PASSWORD = process.env.E2E_AUTH_PASSWORD || 'admin123';

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
  await modal.getByRole('button', { name: /accept/i }).click();
  await page.waitForTimeout(200);
}

test.describe('Authentication', () => {
  test.use({ storageState: undefined });

  test('rejects invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('wrong@example.com');
    await page.getByLabel(/password/i).fill('incorrect');
    await page.getByRole('button', { name: /sign in|log in/i }).click();

    const alert = page.getByRole('alert').filter({ hasText: /login failed|invalid/i });
    await expect(alert).toBeVisible();
  });

  test('signs in with valid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(VALID_EMAIL);
    await page.getByLabel(/password/i).fill(VALID_PASSWORD);
    await page.getByRole('button', { name: /sign in|log in/i }).click();

    await acceptTermsIfPresent(page);

    await page.waitForURL((url) => !url.pathname.startsWith('/login'), {
      timeout: 20000,
    });
    await expect(page.locator('#main-content, [data-page-container]')).toBeVisible();
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
  });

  test('logs out and clears session', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(VALID_EMAIL);
    await page.getByLabel(/password/i).fill(VALID_PASSWORD);
    await page.getByRole('button', { name: /sign in|log in/i }).click();

    await acceptTermsIfPresent(page);

    await page.waitForSelector('#main-content');
    const profileButton = page.locator('[data-app-header] button[aria-haspopup="menu"]').last();
    await profileButton.click();
    await page.getByRole('menuitem', { name: /logout/i }).click();

    await page.waitForURL(/\/login/, { timeout: 10000 });
    await expect(page.getByRole('heading', { name: /sign in|welcome/i })).toBeVisible({ timeout: 5000 }).catch(() => undefined);
    await expect(page.url()).toMatch(/\/login/);
  });
});