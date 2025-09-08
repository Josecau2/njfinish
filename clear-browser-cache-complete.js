const puppeteer = require('puppeteer');

async function clearAllBrowserData() {
  console.log('Starting complete browser cache clearing...');

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    // Clear all browser data
    console.log('Clearing browser storage...');
    await page.goto('http://localhost:8080', { waitUntil: 'domcontentloaded' });

    // Clear everything possible
    await page.evaluate(() => {
      // Clear localStorage
      if (typeof localStorage !== 'undefined') {
        localStorage.clear();
        console.log('LocalStorage cleared');
      }

      // Clear sessionStorage
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.clear();
        console.log('SessionStorage cleared');
      }

      // Clear cookies
      document.cookie.split(";").forEach(function(c) {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      console.log('Cookies cleared');
    });

    // Clear browser cache using CDP
    const client = await page.target().createCDPSession();
    await client.send('Network.clearBrowserCache');
    await client.send('Network.clearBrowserCookies');
    await client.send('Storage.clearDataForOrigin', {
      origin: 'http://localhost:8080',
      storageTypes: 'all'
    });

    console.log('All browser data cleared successfully!');
    console.log('Browser will remain open for manual testing. Close it when done.');

    // Keep browser open for manual testing
    // Don't close automatically - let user test manually

  } catch (error) {
    console.error('Error clearing browser data:', error);
    await browser.close();
  }
}

clearAllBrowserData();
