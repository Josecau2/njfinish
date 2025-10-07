const Customization = require('../models/Customization')
const PdfCustomization = require('../models/PdfCustomization')
const { sanitizeHtml } = require('../utils/htmlSanitizer')
const { generatePdfBuffer } = require('../utils/pdfGenerator')
const { regenerateBrandSnapshot } = require('../server/branding/regenerateBrandSnapshot')

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

    if (payload.logoText !== undefined && payload.logoText !== null) {
      payload.logoText = sanitizeHtml(String(payload.logoText), { allowedTags: [], allowedAttributes: {}, allowDataAttributes: false }).trim()
    }

    if (typeof payload.companyName === 'string') {
      payload.companyName = sanitizeHtml(payload.companyName, { allowedTags: [], allowedAttributes: {}, allowDataAttributes: false }).trim()
    }

    if (logoImagePath) {
      payload.logoImage = logoImagePath
    }

    const existing = await Customization.findOne()
    let isUpdate = false
    if (existing) {
      await existing.update(payload)
      isUpdate = true
    } else {
      await Customization.create(payload)
    }

    try {
      await regenerateBrandSnapshot()
    } catch (persistErr) {
      console.error('Failed to regenerate brand snapshot:', persistErr)
    }

    return res.json({ success: true, updated: isUpdate, created: !isUpdate })
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

    const pdfPayload = { ...req.body };
    Object.keys(pdfPayload).forEach((key) => {
      if (typeof pdfPayload[key] === 'string') {
        pdfPayload[key] = sanitizeHtml(pdfPayload[key], { allowedTags: [], allowedAttributes: {}, allowDataAttributes: false }).trim();
      }
    });

    const existing = await PdfCustomization.findOne();

    if (existing) {
      await existing.update(pdfPayload);
      return res.json({ success: true, updated: true });
    }

    await PdfCustomization.create(pdfPayload);
    return res.json({ success: true, created: true });

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
    try {
      await regenerateBrandSnapshot()
    } catch (persistErr) {
      console.error('Failed to regenerate brand snapshot after logo deletion:', persistErr)
    }

    res.json({ success: true, message: 'Logo image deleted', customization });
  } catch (err) {
    console.error('Error deleting logo image:', err);
    res.status(500).json({ error: 'Failed to delete logo image' });
  }
};


exports.generatepdf = async (req, res) => {
  try {
    const { html, options } = req.body || {};
    const pdfBuffer = await generatePdfBuffer(html, options);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="document.pdf"');
    res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF Generation - Error:', error);
    const statusCode = error.statusCode || error.status || 500;
    res.status(statusCode).json({
      error: 'Failed to generate PDF',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};
