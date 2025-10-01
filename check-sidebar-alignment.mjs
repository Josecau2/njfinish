import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('🔍 Navigating to login page...');
  await page.goto('http://localhost:3000/login');

  console.log('🔑 Logging in...');
  await page.fill('input[type="email"]', 'joseca@symmetricalwolf.com');
  await page.fill('input[type="password"]', 'Jose1234!');
  await page.click('button[type="submit"]');

  console.log('⏳ Waiting for dashboard...');
  await page.waitForURL('http://localhost:3000/', { timeout: 10000 });
  await page.waitForTimeout(2000);

  console.log('📏 Checking sidebar icon alignment...');

  // Get sidebar state
  const sidebarNav = await page.locator('[data-collapsed]').first();
  const isCollapsed = await sidebarNav.getAttribute('data-collapsed');
  console.log(`Sidebar collapsed state: ${isCollapsed}`);

  // Get all nav icons
  const icons = await page.locator('.nav-icon').all();
  console.log(`Found ${icons.length} nav icons`);

  const iconPositions = [];
  for (let i = 0; i < Math.min(icons.length, 10); i++) {
    const icon = icons[i];
    const box = await icon.boundingBox();
    const styles = await icon.evaluate(el => {
      const computed = window.getComputedStyle(el);
      const parent = el.closest('.nav-link') || el.closest('button');
      const parentComputed = parent ? window.getComputedStyle(parent) : null;
      return {
        iconPaddingLeft: computed.paddingLeft,
        iconPaddingRight: computed.paddingRight,
        iconMargin: computed.margin,
        parentPaddingLeft: parentComputed?.paddingLeft || 'N/A',
        parentPaddingRight: parentComputed?.paddingRight || 'N/A',
        parentGap: parentComputed?.gap || 'N/A',
        parentJustifyContent: parentComputed?.justifyContent || 'N/A'
      };
    });

    iconPositions.push({
      index: i,
      left: box?.x || 0,
      ...styles
    });
  }

  console.log('\n📊 Icon Alignment Analysis:');
  console.log('═'.repeat(80));

  iconPositions.forEach(pos => {
    console.log(`Icon ${pos.index}:`);
    console.log(`  Position Left: ${pos.left.toFixed(2)}px`);
    console.log(`  Icon Padding: ${pos.iconPaddingLeft} / ${pos.iconPaddingRight}`);
    console.log(`  Icon Margin: ${pos.iconMargin}`);
    console.log(`  Parent Padding: ${pos.parentPaddingLeft} / ${pos.parentPaddingRight}`);
    console.log(`  Parent Gap: ${pos.parentGap}`);
    console.log(`  Parent Justify: ${pos.parentJustifyContent}`);
    console.log('─'.repeat(80));
  });

  // Check if all icons have the same left position
  const uniqueLefts = [...new Set(iconPositions.map(p => Math.round(p.left)))];
  console.log(`\n✅ Unique left positions: ${uniqueLefts.join(', ')}`);

  if (uniqueLefts.length === 1) {
    console.log('✅ SUCCESS: All icons are perfectly aligned!');
  } else {
    console.log(`❌ PROBLEM: Icons have ${uniqueLefts.length} different alignments`);
    console.log('Expected: All icons at the same left position');
    console.log(`Found: ${uniqueLefts.length} different positions`);
  }

  console.log('\n📸 Taking screenshot...');
  await page.screenshot({ path: 'sidebar-alignment.png', fullPage: true });
  console.log('Screenshot saved as sidebar-alignment.png');

  console.log('\n⏸️  Browser will stay open for manual inspection...');
  console.log('Press Ctrl+C when done.');

  // Keep browser open for manual inspection
  await page.waitForTimeout(300000); // 5 minutes

  await browser.close();
})().catch(console.error);
