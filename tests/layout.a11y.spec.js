import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import manifest from '../AUDIT/manifest.json';

const viewports = [
  { name: 'iphone-13', width: 390, height: 844 },
  { name: 'iphone-se', width: 375, height: 667 },
  { name: 'ipad', width: 768, height: 1024 },
  { name: 'laptop', width: 1366, height: 768 },
  { name: 'desktop', width: 1920, height: 1080 }
];

const colorModes = ['light', 'dark'];

for (const mode of colorModes) {
  for (const vp of viewports) {
    test.describe(`layout @${vp.name} @${mode}`, () => {
      test.use({
        viewport: { width: vp.width, height: vp.height },
        colorScheme: mode
      });

      for (const route of manifest.routes) {
        test(`audit: ${route.path}`, async ({ page }) => {
          await page.goto(route.path);

          // Force color mode
          await page.evaluate((m) => {
            localStorage.setItem('chakra-ui-color-mode', m);
            window.dispatchEvent(new Event('storage'));
          }, mode);
          await page.waitForTimeout(100);

          // 1) No horizontal overflow
          const noOverflow = await page.evaluate(() =>
            document.documentElement.scrollWidth <= window.innerWidth + 1
          );
          expect(noOverflow, 'Horizontal overflow detected').toBeTruthy();

          // 2) Sticky header present & height sane
          const headerH = await page.evaluate(() => {
            const el = document.querySelector('[data-app-header]');
            if (!el) return -1;
            const r = el.getBoundingClientRect();
            return Math.round(r.height);
          });
          expect(headerH).toBeGreaterThanOrEqual(56);
          expect(headerH).toBeLessThanOrEqual(72);

          // 3) Icon-only tap targets >= 44x44
          const tooSmall = await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button, [role="button"]'));
            const iconOnly = btns.filter(b => {
              const hasText = (b.textContent || '').trim().length > 0;
              const hasAria = !!b.getAttribute('aria-label');
              return !hasText && (hasAria || b.querySelector('svg'));
            });
            return iconOnly.filter(b => {
              const r = b.getBoundingClientRect();
              return r.width < 44 || r.height < 44;
            }).length;
          });
          expect(tooSmall, 'Icon buttons <44x44').toBe(0);

          // 4) Overlapping clickable elements heuristic
          const overlaps = await page.evaluate(() => {
            function rect(n) {
              const r = n.getBoundingClientRect();
              return { x: r.x, y: r.y, r: r.x + r.width, b: r.y + r.height };
            }
            function inter(a, b) {
              return !(a.r <= b.x || b.r <= a.x || a.b <= b.y || b.b <= a.y);
            }
            const nodes = Array.from(document.querySelectorAll('a, button, [role="button"], [role="link"]'));
            const clickable = nodes.filter(n => getComputedStyle(n).pointerEvents !== 'none');
            const rects = clickable.map(n => ({ n, r: rect(n) }));
            let count = 0;
            for (let i = 0; i < rects.length; i++) {
              for (let j = i + 1; j < rects.length; j++) {
                if (inter(rects[i].r, rects[j].r)) count++;
                if (count > 3) return count;
              }
            }
            return count;
          });
          expect(overlaps, 'Excessive overlaps').toBeLessThanOrEqual(3);

          // 5) Icon sizes in sane range (14-32px)
          const badIcons = await page.evaluate(() => {
            const svgs = Array.from(document.querySelectorAll('svg'));
            return svgs.filter(svg => {
              const r = svg.getBoundingClientRect();
              return r.width > 0 && (r.width < 14 || r.width > 32 || r.height < 14 || r.height > 32);
            }).length;
          });
          expect(badIcons, 'Suspicious icon sizes').toBeLessThanOrEqual(2);

          // 6) Baseline left padding (page container)
          const leftEdge = await page.evaluate(() => {
            const pc = document.querySelector('[data-page-container]');
            if (!pc) return -1;
            return Math.round(pc.getBoundingClientRect().left);
          });
          expect(leftEdge).toBeGreaterThan(8);
          expect(leftEdge).toBeLessThan(40);

          // 7) Clipping heuristic: elements with overflow hidden but content taller
          const clippers = await page.evaluate(() => {
            const all = Array.from(document.querySelectorAll('*'));
            const clipped = all.filter(el => {
              const cs = getComputedStyle(el);
              if (!/(hidden|clip)/.test(cs.overflow) && !/(hidden|clip)/.test(cs.overflowY)) return false;
              return el.scrollHeight - el.clientHeight > 6;
            });
            return clipped.length;
          });
          expect(clippers, 'Potentially clipped content').toBeLessThanOrEqual(5);

          // 8) Keyboard focus indicators
          await page.keyboard.press('Tab');
          const hasFocusRing = await page.evaluate(() => {
            const focused = document.activeElement;
            if (!focused) return false;
            const styles = getComputedStyle(focused);
            return styles.outline !== 'none' ||
                   styles.outlineWidth !== '0px' ||
                   /shadow/.test(styles.boxShadow);
          });
          expect(hasFocusRing, 'No focus indicators').toBeTruthy();

          // 9) Dark mode border visibility
          if (mode === 'dark') {
            const poorContrast = await page.evaluate(() => {
              const header = document.querySelector('[data-app-header]');
              if (!header) return false;
              const border = getComputedStyle(header).borderBottomColor;
              return border === 'transparent' || border === 'rgba(0, 0, 0, 0)';
            });
            expect(poorContrast, 'Dark mode border not visible').toBeFalsy();
          }

          // 10) Axe accessibility (color-contrast can be noisy)
          const results = await new AxeBuilder({ page })
            .disableRules(['color-contrast'])
            .analyze();
          expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
        });
      }
    });
  }
}