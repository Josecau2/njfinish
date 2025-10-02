import { test, expect } from '../fixtures';

const navTargets: Array<{
  trigger: string;
  sub?: string;
  heading: RegExp | string;
  path: RegExp;
}> = [
  {
    trigger: 'Dashboard',
    heading: /Dashboard/i,
    path: /\/$/,
  },
  {
    trigger: 'Quotes',
    sub: 'View Quotes',
    heading: /Quotes/i,
    path: /\/quotes$/,
  },
  {
    trigger: 'Quotes',
    sub: 'Create Quote',
    heading: /Customer|Quote/i,
    path: /\/quotes\/create/,
  },
  {
    trigger: 'Customers',
    heading: /Customers/i,
    path: /\/customers$/,
  },
  {
    trigger: 'Orders',
    sub: 'Orders',
    heading: /Orders/i,
    path: /\/orders$/,
  },
  {
    trigger: 'Orders',
    sub: 'My Orders',
    heading: /My Orders/i,
    path: /\/my-orders$/,
  },
  {
    trigger: 'Payments',
    heading: /Payments/i,
    path: /\/payments$/,
  },
  {
    trigger: 'Resources',
    heading: /Resources/i,
    path: /\/resources$/,
  },
  {
    trigger: 'Calendar',
    heading: /Calendar/i,
    path: /\/calender|\/calendar/,
  },
  {
    trigger: 'Settings',
    sub: 'Users',
    heading: /Users/i,
    path: /\/settings\/users$/,
  },
  {
    trigger: 'Settings',
    sub: 'User Groups',
    heading: /User Groups/i,
    path: /\/settings\/users\/groups/,
  },
  {
    trigger: 'Settings',
    sub: 'Manufacturers',
    heading: /Manufacturers/i,
    path: /\/settings\/manufacturers$/,
  },
  {
    trigger: 'Settings',
    sub: 'Multipliers',
    heading: /Multipliers/i,
    path: /\/settings\/usergroup\/multipliers/,
  },
  {
    trigger: 'Settings',
    sub: 'Locations',
    heading: /Locations/i,
    path: /\/settings\/locations/,
  },
  {
    trigger: 'Settings',
    sub: 'Taxes',
    heading: /Taxes/i,
    path: /\/settings\/taxes/,
  },
  {
    trigger: 'Settings',
    sub: 'Customization',
    heading: /Customization/i,
    path: /\/settings\/customization/,
  },
  {
    trigger: 'Settings',
    sub: 'PDF Layout',
    heading: /PDF Layout/i,
    path: /\/settings\/pdflayoutcustomization/,
  },
  {
    trigger: 'Settings',
    sub: 'Login Page',
    heading: /Login Customizer|Login Page/i,
    path: /\/settings\/loginlayoutcustomization/,
  },
  {
    trigger: 'Settings',
    sub: 'UI Customization',
    heading: /UI Customization/i,
    path: /\/settings\/ui-customization/,
  },
  {
    trigger: 'Settings',
    sub: 'Terms & Conditions',
    heading: /Terms/i,
    path: /\/settings\/terms/,
  },
  {
    trigger: 'Settings',
    sub: 'Payment Configuration',
    heading: /Payment Configuration/i,
    path: /\/settings\/payment-config/,
  },
  {
    trigger: 'Admin',
    sub: 'Contractors',
    heading: /Contractors/i,
    path: /\/admin\/contractors/,
  },
  {
    trigger: 'Admin',
    sub: 'Leads',
    heading: /Leads/i,
    path: /\/admin\/leads/,
  },
  {
    trigger: 'Admin',
    sub: 'Notifications',
    heading: /Notifications/i,
    path: /\/admin\/notifications/,
  },
];

async function ensureNavPath(page: import('@playwright/test').Page, target: typeof navTargets[number]) {
  const rootButton = page.getByRole('button', { name: target.trigger, exact: false }).first();
  await rootButton.click();
  if (target.sub) {
    const subButton = page.getByRole('button', { name: target.sub, exact: false }).first();
    await subButton.click();
  }
  await page.waitForURL(target.path, { timeout: 20000 });
  await expect(page.getByRole('heading', { name: target.heading })).toBeVisible({ timeout: 20000 });
}

test.describe('Dashboard & Navigation', () => {
  test('renders dashboard summary cards and widgets', async ({ gotoApp, page, assertNoErrorToast }) => {
    await gotoApp('/');

    await expect(page.getByRole('heading', { name: /Dashboard/i })).toBeVisible();
    await expect(page.getByText(/Active Orders/i)).toBeVisible();
    await expect(page.getByText(/Active Quotes/i)).toBeVisible();
    await expect(page.getByText(/Latest Product Updates/i)).toBeVisible();
    await expect(page.getByText(/Quick Links/i)).toBeVisible();

    await assertNoErrorToast();
  });

  test('navigates through primary sidebar destinations', async ({ gotoApp, page }) => {
    await gotoApp('/');

    for (const target of navTargets) {
      await ensureNavPath(page, target);
    }
  });
});