/**
 * Automated Accessibility Testing with Playwright + Axe
 * Tests WCAG 2.1 Level AA compliance across key pages
 */

import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const BASE_URL = 'http://localhost:3000'

// Test authenticated pages (requires login)
test.describe('Accessibility - Authenticated Pages', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto(`${BASE_URL}/login`)

    // Fill login form (adjust selectors as needed)
    await page.fill('input[name="email"]', 'admin@test.com')
    await page.fill('input[name="password"]', 'password')
    await page.click('button[type="submit"]')

    // Wait for navigation to dashboard
    await page.waitForURL('**/dashboard', { timeout: 5000 }).catch(() => {
      // If already logged in or different redirect, continue
    })
  })

  test('Dashboard - no critical accessibility violations', async ({ page }) => {
    await page.goto(`${BASE_URL}/`)
    await page.waitForLoadState('networkidle')

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('Customers Page - no critical accessibility violations', async ({ page }) => {
    await page.goto(`${BASE_URL}/customers`)
    await page.waitForLoadState('networkidle')

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()

    // Allow minor violations but no critical ones
    const criticalViolations = accessibilityScanResults.violations.filter(
      v => v.impact === 'critical' || v.impact === 'serious'
    )

    expect(criticalViolations).toEqual([])
  })

  test('Proposals Page - no critical accessibility violations', async ({ page }) => {
    await page.goto(`${BASE_URL}/proposals`)
    await page.waitForLoadState('networkidle')

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()

    const criticalViolations = accessibilityScanResults.violations.filter(
      v => v.impact === 'critical' || v.impact === 'serious'
    )

    expect(criticalViolations).toEqual([])
  })

  test('Orders Page - no critical accessibility violations', async ({ page }) => {
    await page.goto(`${BASE_URL}/orders`)
    await page.waitForLoadState('networkidle')

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()

    const criticalViolations = accessibilityScanResults.violations.filter(
      v => v.impact === 'critical' || v.impact === 'serious'
    )

    expect(criticalViolations).toEqual([])
  })

  test('Payments Page - no critical accessibility violations', async ({ page }) => {
    await page.goto(`${BASE_URL}/payments`)
    await page.waitForLoadState('networkidle')

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()

    const criticalViolations = accessibilityScanResults.violations.filter(
      v => v.impact === 'critical' || v.impact === 'serious'
    )

    expect(criticalViolations).toEqual([])
  })
})

// Test public pages (no auth required)
test.describe('Accessibility - Public Pages', () => {
  test('Login Page - no accessibility violations', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)
    await page.waitForLoadState('networkidle')

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('Request Access Page - no accessibility violations', async ({ page }) => {
    await page.goto(`${BASE_URL}/request-access`)
    await page.waitForLoadState('networkidle')

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('Forgot Password Page - no accessibility violations', async ({ page }) => {
    await page.goto(`${BASE_URL}/forgot-password`)
    await page.waitForLoadState('networkidle')

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })
})

// Test keyboard navigation
test.describe('Keyboard Navigation', () => {
  test('Tab navigation works on login page', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)

    // Press Tab to focus first input
    await page.keyboard.press('Tab')

    // Check if email input is focused
    const emailFocused = await page.evaluate(() =>
      document.activeElement?.getAttribute('name') === 'email' ||
      document.activeElement?.getAttribute('type') === 'email'
    )

    expect(emailFocused).toBeTruthy()

    // Tab to password
    await page.keyboard.press('Tab')

    const passwordFocused = await page.evaluate(() =>
      document.activeElement?.getAttribute('type') === 'password'
    )

    expect(passwordFocused).toBeTruthy()
  })

  test('Skip to main content link exists', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)

    // Press Tab to focus skip link (if it exists)
    await page.keyboard.press('Tab')

    const skipLinkText = await page.evaluate(() => {
      const active = document.activeElement
      return active?.textContent?.toLowerCase() || ''
    })

    // Skip links are optional but recommended
    // This test documents whether they exist
    console.log('Skip link present:', skipLinkText.includes('skip'))
  })
})

// Test color contrast
test.describe('Color Contrast', () => {
  test('Sufficient color contrast on key elements', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)
    await page.waitForLoadState('networkidle')

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .disableRules(['region']) // Focus only on contrast
      .analyze()

    const contrastViolations = accessibilityScanResults.violations.filter(
      v => v.id === 'color-contrast'
    )

    expect(contrastViolations).toEqual([])
  })
})

// Test ARIA usage
test.describe('ARIA Attributes', () => {
  test('No ARIA violations on dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/`)
    // Login if needed (simplified for demo)

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['best-practice'])
      .include('[role]')
      .include('[aria-label]')
      .include('[aria-labelledby]')
      .analyze()

    const ariaViolations = accessibilityScanResults.violations.filter(
      v => v.id.startsWith('aria-')
    )

    // Allow minor issues but log them
    if (ariaViolations.length > 0) {
      console.warn('ARIA Warnings:', ariaViolations.map(v => v.id))
    }

    const criticalAriaIssues = ariaViolations.filter(v => v.impact === 'critical')
    expect(criticalAriaIssues).toEqual([])
  })
})
