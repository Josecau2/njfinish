import { chromium } from 'playwright';
import fs from 'fs';

async function discoverInteractions(routes) {
  console.log('🔍 PHASE 1.2: Discovering all interactions...');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const allInteractions = [];

  // Focus on core routes first (filter out parameterized routes for discovery)
  const coreRoutes = routes.filter(route =>
    !route.includes(':') &&
    !route.includes('*') &&
    route.length > 1 &&
    !route.includes('noise')
  );

  console.log(`Testing ${coreRoutes.length} core routes out of ${routes.length} total routes`);

  for (const route of coreRoutes.slice(0, 15)) { // Limit to first 15 for efficiency
    console.log(`\n📍 Analyzing route: ${route}`);

    try {
      await page.goto(`http://localhost:3000${route}`, {
        waitUntil: 'networkidle',
        timeout: 10000
      });
      await page.waitForTimeout(2000);

      const interactions = await page.evaluate(() => {
        const elements = [];

        // Buttons
        document.querySelectorAll('button, [role="button"]').forEach((btn, i) => {
          const text = btn.textContent?.trim() || btn.getAttribute('aria-label') || `button-${i}`;
          elements.push({
            type: 'button',
            selector: `button:nth-of-type(${i+1})`,
            text: text.substring(0, 50),
            id: btn.id,
            dataTestId: btn.getAttribute('data-testid'),
            classes: btn.className
          });
        });

        // Links
        document.querySelectorAll('a[href]').forEach((link, i) => {
          elements.push({
            type: 'link',
            selector: `a[href]:nth-of-type(${i+1})`,
            text: link.textContent?.trim().substring(0, 50),
            href: link.getAttribute('href')
          });
        });

        // Inputs
        document.querySelectorAll('input, textarea, select').forEach((input, i) => {
          elements.push({
            type: input.tagName.toLowerCase(),
            selector: `${input.tagName.toLowerCase()}:nth-of-type(${i+1})`,
            name: input.name,
            id: input.id,
            placeholder: input.placeholder,
            inputType: input.type
          });
        });

        // Forms
        document.querySelectorAll('form').forEach((form, i) => {
          elements.push({
            type: 'form',
            selector: `form:nth-of-type(${i+1})`,
            action: form.action,
            id: form.id
          });
        });

        // Clickable elements with onClick
        document.querySelectorAll('[onclick], [data-click]').forEach((el, i) => {
          elements.push({
            type: 'clickable',
            selector: `[onclick]:nth-of-type(${i+1})`,
            text: el.textContent?.trim().substring(0, 50)
          });
        });

        return elements;
      });

      interactions.forEach(interaction => {
        allInteractions.push({
          route,
          ...interaction
        });
      });

      console.log(`  Found ${interactions.length} interactive elements`);

    } catch (error) {
      console.error(`  ❌ Error analyzing ${route}:`, error.message);
    }
  }

  await browser.close();

  console.log(`\n✓ Total interactions discovered: ${allInteractions.length}`);
  return allInteractions;
}

const routes = JSON.parse(fs.readFileSync('discovered-routes.json', 'utf8'));
const interactions = await discoverInteractions(routes);
fs.writeFileSync('discovered-interactions.json', JSON.stringify(interactions, null, 2));