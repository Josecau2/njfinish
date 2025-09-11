const Customization = require('../models/Customization')
const PdfCustomization = require('../models/PdfCustomization')
const { updateFrontendCustomization } = require('../utils/frontendConfigWriter')
const LoginCustomization = require('../models/LoginCustomization')

exports.getCustomization = async (req, res) => {
  try {
    const customization = await Customization.findOne({ order: [['updatedAt', 'DESC']] })
    res.json(customization || {})
  } catch (err) {
    console.error('Error fetching customization:', err)
    res.status(500).json({ error: 'Failed to fetch customization' })
  }
}

exports.saveCustomization = async (req, res) => {
  try {
    let logoImagePath = null
    let logoFilePath = null

    if (req.file) {
      logoImagePath = `/uploads/images/${req.file.filename}`
      logoFilePath = req.file.path // Full path for copying to frontend
    }

    const payload = {
      ...req.body,
    }

    if (logoImagePath) {
      payload.logoImage = logoImagePath
    }

    const existing = await Customization.findOne()
    let uiCustomization

    if (existing) {
      await existing.update(payload)
      uiCustomization = { ...existing.dataValues, ...payload }
    } else {
      const created = await Customization.create(payload)
      uiCustomization = created.dataValues
    }

    // Get login customization for combined frontend config
    const loginCustomization = await LoginCustomization.findOne({ where: { id: 1 } })

    // Update frontend configuration immediately
    try {
      await updateFrontendCustomization(
        uiCustomization,
        loginCustomization?.dataValues || {},
        { main: logoFilePath }
      )
      console.log('✅ Frontend customization updated successfully')
    } catch (frontendError) {
      console.error('❌ Frontend customization update failed:', frontendError)
      // Don't fail the main request, but log the error
    }

    res.json({ success: true, updated: !!existing, created: !existing })
  } catch (err) {
    console.error('Error saving customization:', err)
    res.status(500).json({ error: 'Failed to save customization' })
  }
}

exports.saveCustomizationpdf = async (req, res) => {
  try {
    if (req.file) {
      req.body.headerLogo = `/uploads/manufacturer_catalogs/${req.file.filename}`;
    }

    const existing = await PdfCustomization.findOne();

    if (existing) {
      await existing.update(req.body);
      return res.json({ success: true, updated: true });
    }

    await PdfCustomization.create(req.body);
    res.json({ success: true, created: true });

  } catch (err) {
    console.error('Error saving customization:', err);
    res.status(500).json({ error: 'Failed to save customization' });
  }
};



exports.getCustomizationpdf = async (req, res) => {
  try {
    const customization = await PdfCustomization.findOne({ order: [['updatedAt', 'DESC']] })
    res.json(customization || {})
  } catch (err) {
    console.error('Error fetching customization:', err)
    res.status(500).json({ error: 'Failed to fetch customization' })
  }
}

exports.getCustomizationdeletelogo = async (req, res) => {
  try {
    const customization = await Customization.findOne({
      order: [['updatedAt', 'DESC']],
    });

    if (!customization) {
      return res.status(404).json({ error: 'Customization not found' });
    }

    customization.logoImage = null; // or '' if you prefer
    await customization.save();

    res.json({ success: true, message: 'Logo image deleted', customization });
  } catch (err) {
    console.error('Error deleting logo image:', err);
    res.status(500).json({ error: 'Failed to delete logo image' });
  }
};


exports.generatepdf = async (req, res) => {
  try {
    console.log('PDF Generation - Starting, checking imports...');
    const { getPuppeteer } = require('../utils/puppeteerLauncher');
    const { html, options } = req.body;

    if (!html) {
      return res.status(400).json({ error: 'HTML content is required' });
    }

    console.log('PDF Generation - Starting...');

    const result = getPuppeteer();
    console.log('PDF Generation - getPuppeteer result:', {
      hasPuppeteer: !!result.puppeteer,
      launchOptions: result.launchOptions
    });

    const { puppeteer, launchOptions } = result;

    console.log('PDF Generation - Launch options:', launchOptions);

    let browser;
    try {
      console.log('PDF Generation - About to launch browser with options:', launchOptions);
      browser = await puppeteer.launch(launchOptions);
      console.log('PDF Generation - Browser launched successfully');

      const page = await browser.newPage();
      console.log('PDF Generation - New page created');

      // Set viewport and user agent for better rendering
      await page.setViewport({ width: 1200, height: 800 });
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

      await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });
      console.log('PDF Generation - HTML content set');

      // Default PDF options
      const pdfOptions = {
        format: 'A4',
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm'
        },
        printBackground: true,
        preferCSSPageSize: false,
        ...options
      };

      console.log('PDF Generation - Generating PDF with options:', pdfOptions);
      const pdf = await page.pdf(pdfOptions);
      console.log('PDF Generation - PDF generated successfully, size:', pdf.length);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="document.pdf"');
      res.send(pdf);

    } catch (pageError) {
      console.error('PDF Generation - Page/PDF error:', pageError);
      throw pageError;
    } finally {
      if (browser) {
        await browser.close();
        console.log('PDF Generation - Browser closed');
      }
    }

  } catch (error) {
    console.error('PDF Generation - Error:', error);
    res.status(500).json({
      error: 'Failed to generate PDF',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
