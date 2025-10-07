const { getPuppeteer } = require('./puppeteerLauncher');

const DEFAULT_PDF_OPTIONS = {
  format: 'A4',
  margin: {
    top: '20mm',
    right: '20mm',
    bottom: '20mm',
    left: '20mm',
  },
  printBackground: true,
  preferCSSPageSize: false,
};

async function generatePdfBuffer(html, options = {}) {
  if (!html || typeof html !== 'string') {
    const error = new Error('HTML content is required');
    error.statusCode = 400;
    throw error;
  }

  const { puppeteer, launchOptions } = getPuppeteer();
  if (!puppeteer) {
    const error = new Error('PDF generator is not available');
    error.statusCode = 500;
    throw error;
  }

  let browser;

  try {
    browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();

    await page.setViewport({ width: 1200, height: 800 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });

    const pdfOptions = {
      ...DEFAULT_PDF_OPTIONS,
      ...options,
    };

    return await page.pdf(pdfOptions);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

module.exports = {
  generatePdfBuffer,
};
