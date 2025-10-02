import { test, expect } from '../fixtures';

const WAIT_TIMEOUT = 25000;

type PageCheck = {
  path: string;
  heading: RegExp | string;
  assertions?: (page: import('@playwright/test').Page) => Promise<void>;
};

const pageChecks: PageCheck[] = [
  {
    path: '/profile',
    heading: /My Profile/i,
    assertions: async (page) => {
      await expect(page.getByLabel(/Full Name/i)).toBeVisible();
    },
  },
  {
    path: '/resources',
    heading: /Resources/i,
    assertions: async (page) => {
      await expect(page.getByPlaceholder(/Search resources/i)).toBeVisible();
    },
  },
  {
    path: '/contracts',
    heading: /Contracts/i,
  },
  {
    path: '/contact',
    heading: /Contact Us/i,
  },
  {
    path: '/notifications',
    heading: /Notifications/i,
  },
  {
    path: '/admin/contractors',
    heading: /Contractors/i,
  },
  {
    path: '/admin/leads',
    heading: /Leads/i,
  },
  {
    path: '/admin/notifications',
    heading: /Notifications/i,
  },
];

test.describe('Supplemental modules', () => {
  for (const entry of pageChecks) {
    test(`loads ${entry.path} and shows expected content`, async ({ gotoApp, page }) => {
      await gotoApp(entry.path);
      await expect(page.getByRole('heading', { name: entry.heading })).toBeVisible({ timeout: WAIT_TIMEOUT });
      if (entry.assertions) {
        await entry.assertions(page);
      }
    });
  }
});