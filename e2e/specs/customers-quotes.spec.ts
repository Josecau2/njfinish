import { test, expect } from '../fixtures';
import { uniqueEmail, randomPhone, uniqueId } from '../utils/data';

const WAIT_TIMEOUT = 20000;

test.describe('Customers module', () => {
  test('list renders and search input is available', async ({ gotoApp, page }) => {
    await gotoApp('/customers');
    await expect(page.getByRole('heading', { name: /Customers/i })).toBeVisible({ timeout: WAIT_TIMEOUT });
    await expect(page.getByPlaceholder(/Search customers/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Add Customer/i })).toBeVisible();
  });

  test('form shows validation errors when required fields missing', async ({ gotoApp, page }) => {
    await gotoApp('/customers');
    await page.getByRole('button', { name: /Add Customer/i }).click();
    await expect(page.getByRole('heading', { name: /Add Customer/i })).toBeVisible();

    await page.getByRole('button', { name: /Create Customer/i }).click();

    await expect(page.getByText(/Name is required/i)).toBeVisible();
    await expect(page.getByText(/At least one phone number is required/i)).toBeVisible();
  });

  test('allows creating a new customer and locating it via search', async ({ gotoApp, page, closeSweetAlertIfOpen }) => {
    const customerName = `Auto ${uniqueId('customer')}`;
    const customerEmail = uniqueEmail('customer');
    const customerPhone = randomPhone();

    await gotoApp('/customers');
    await page.getByRole('button', { name: /Add Customer/i }).click();

    await page.getByLabel(/Full Name/i).fill(customerName);
    await page.getByLabel(/Email/i).fill(customerEmail);
    await page.getByLabel(/Mobile Phone/i).fill(customerPhone);

    await page.getByRole('button', { name: /Create Customer/i }).click();

    await closeSweetAlertIfOpen();
    await page.waitForURL(/\/customers$/, { timeout: WAIT_TIMEOUT });

    const searchInput = page.getByPlaceholder(/Search customers/i);
    await searchInput.fill(customerName);
    await searchInput.press('Enter');

    await expect(page.getByText(customerName, { exact: false })).toBeVisible({ timeout: WAIT_TIMEOUT });
  });
});

test.describe('Quotes module', () => {
  test('list view exposes status filters and actions', async ({ gotoApp, page }) => {
    await gotoApp('/quotes');
    await expect(page.getByRole('heading', { name: /Quotes/i })).toBeVisible({ timeout: WAIT_TIMEOUT });
    await expect(page.getByPlaceholder(/Search by customer name/i)).toBeVisible();

    const statuses = ['All', 'Draft', 'Sent', 'Accepted', 'Rejected'];
    for (const status of statuses) {
      const statusButton = page.getByRole('button', { name: new RegExp(status, 'i') }).first();
      await statusButton.click();
      await expect(statusButton).toHaveAttribute('aria-pressed', /true|false/);
    }
  });

  test('create quote wizard shows all steps and progress indicator', async ({ gotoApp, page }) => {
    await gotoApp('/quotes/create');

    const stepLabels = [
      'Customer Information',
      'Manufacturer Selection',
      'Design & Style',
      'Quote Summary',
    ];

    for (const label of stepLabels) {
      await expect(page.getByText(label, { exact: false })).toBeVisible({ timeout: WAIT_TIMEOUT });
    }

    await expect(page.getByRole('progressbar')).toBeVisible();
  });
});