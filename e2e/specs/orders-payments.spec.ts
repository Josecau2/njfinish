import { test, expect } from '../fixtures';

const WAIT_TIMEOUT = 25000;

test.describe('Orders module', () => {
  test('order list shows status filters and table data', async ({ gotoApp, page }) => {
    await gotoApp('/orders');
    await expect(page.getByRole('heading', { name: /Orders/i })).toBeVisible({ timeout: WAIT_TIMEOUT });
    const filterLabels = ['All', 'New', 'Processing', 'Paid', 'Cancelled'];
    for (const label of filterLabels) {
      await expect(page.getByRole('button', { name: new RegExp(label, 'i') })).toBeVisible();
    }
    await expect(page.getByPlaceholder(/Search by customer/i)).toBeVisible();
  });

  test('can open order details when data exists', async ({ gotoApp, page }) => {
    await gotoApp('/orders');
    const emptyState = page.getByText(/No orders found/i);
    if (await emptyState.isVisible().catch(() => false)) {
      await expect(emptyState).toBeVisible();
      return;
    }
    const firstRow = page.locator('table tbody tr').first();
    await firstRow.click();
    await page.waitForURL(/\/orders\//, { timeout: WAIT_TIMEOUT });
    await expect(page.getByRole('heading', { name: /Order Details/i })).toBeVisible({ timeout: WAIT_TIMEOUT });
    await expect(page.getByText(/Summary|Manufacturer/i)).toBeVisible();
  });

  test('my orders view loads for scoped data', async ({ gotoApp, page }) => {
    await gotoApp('/my-orders');
    await expect(page.getByRole('heading', { name: /My Orders/i })).toBeVisible({ timeout: WAIT_TIMEOUT });
  });
});

test.describe('Payments module', () => {
  test('payments list renders and search is available', async ({ gotoApp, page }) => {
    await gotoApp('/payments');
    await expect(page.getByRole('heading', { name: /All Payments|Payments/i })).toBeVisible({ timeout: WAIT_TIMEOUT });
    await expect(page.getByPlaceholder(/Search by customer, contractor, or transaction ID/i)).toBeVisible();
    await expect(page.getByText(/Showing/i)).toBeVisible({ timeout: WAIT_TIMEOUT });
  });

  test('payment configuration page exposes gateway controls', async ({ gotoApp, page }) => {
    await gotoApp('/settings/payment-config');
    await expect(page.getByRole('heading', { name: /Payment Configuration/i })).toBeVisible({ timeout: WAIT_TIMEOUT });
    await expect(page.getByText(/Stripe|Manual/i)).toBeVisible();
  });
});