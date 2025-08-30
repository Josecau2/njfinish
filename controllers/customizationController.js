const Customization = require('../models/Customization')
const PdfCustomization = require('../models/PdfCustomization')

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

    if (req.file) {
      logoImagePath = `/uploads/images/${req.file.filename}`
    }

    const payload = {
      ...req.body,
    }

    if (logoImagePath) {
      payload.logoImage = logoImagePath
    }

    const existing = await Customization.findOne()
    if (existing) {
      await existing.update(payload)
      return res.json({ success: true, updated: true })
    }

    await Customization.create(payload)
    res.json({ success: true, created: true })
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
  const { getPuppeteer } = require('../utils/puppeteerLauncher');
  const { html, options } = req.body;
  const { puppeteer, launchOptions } = getPuppeteer();
  const browser = await puppeteer.launch(launchOptions);
  const page = await browser.newPage();
  await page.setContent(html);
  
  const pdf = await page.pdf(options);
  await browser.close();
  
  res.setHeader('Content-Type', 'application/pdf');
  res.send(pdf);
};
