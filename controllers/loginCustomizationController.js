const LoginCustomization = require('../models/LoginCustomization');
const { writeFrontendLoginCustomization } = require('../utils/frontendLoginConfigWriter');
const { regenerateBrandSnapshot } = require('../server/branding/regenerateBrandSnapshot');
const { compileCustomization, stripRuntimeFields, refreshLoginCustomization, extractEmailSettings } = require('../services/loginCustomizationCache');
const { applyTransportConfig, createTestTransporter } = require('../utils/mail');

const toNullIfEmpty = (value) => {
  if (value === undefined || value === null) return null;
  const str = String(value).trim();
  return str.length ? str : null;
};

const toNullableInteger = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
};

const mapEmailSettingsForPersistence = (settings = {}) => ({
  smtpHost: toNullIfEmpty(settings.smtpHost),
  smtpPort: toNullableInteger(settings.smtpPort),
  smtpSecure: typeof settings.smtpSecure === 'boolean' ? settings.smtpSecure : null,
  smtpUser: toNullIfEmpty(settings.smtpUser),
  smtpPass: toNullIfEmpty(settings.smtpPass),
  emailFrom: toNullIfEmpty(settings.emailFrom),
});

exports.saveCustomization = async (req, res) => {
  try {
    const existingRecord = await LoginCustomization.findOne({ where: { id: 1 } });
    const mergedInput = {
      ...(existingRecord ? existingRecord.toJSON() : {}),
      ...(req.body || {}),
    };

    const normalized = compileCustomization(mergedInput);
    const payload = stripRuntimeFields(normalized);
    const emailSettings = extractEmailSettings(normalized);
    const dbPayload = {
      ...payload,
      ...mapEmailSettingsForPersistence(emailSettings),
    };

    delete dbPayload.id;
    delete dbPayload.createdAt;
    delete dbPayload.updatedAt;

    let customization = existingRecord;

    if (customization) {
      await customization.update(dbPayload);
    } else {
      customization = await LoginCustomization.create({ id: 1, ...dbPayload });
    }

    try {
      await writeFrontendLoginCustomization(normalized);
    } catch (e) {
      console.error('Failed persisting static login customization:', e);
    }

    try {
      await regenerateBrandSnapshot();
    } catch (brandErr) {
      console.error('Failed to regenerate brand snapshot after login customization save:', brandErr);
    }

    await refreshLoginCustomization();

    const applyResult = applyTransportConfig(emailSettings);
    if (!applyResult.success) {
      console.warn('SMTP settings incomplete after save; email sending remains disabled.');
    }

    return res.status(200).json({ message: 'Customization saved successfully', customization: normalized });
  } catch (error) {
    console.error('Error saving customization:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getCustomization = async (req, res) => {
  try {
    const record = await LoginCustomization.findOne({ where: { id: 1 } });
    const customization = compileCustomization(record ? record.toJSON() : {});
    return res.status(200).json({ customization });
  } catch (error) {
    console.error('Error fetching customization:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.testEmail = async (req, res) => {
  try {
    const { email, settings } = req.body || {};
    const targetEmail = typeof email === 'string' ? email.trim() : '';

    if (!targetEmail) {
      return res.status(400).json({ success: false, message: 'Test email address is required.' });
    }

    const normalized = compileCustomization(settings || {});
    const emailSettings = extractEmailSettings(normalized);

    let testTransport;
    try {
      const result = createTestTransporter(emailSettings);
      testTransport = result;
      const timestamp = new Date().toISOString();
      const mailOptions = {
        to: targetEmail,
        subject: 'NJ Cabinets SMTP Test',
        text: `Success! Your NJ Cabinets email configuration is working. (${timestamp})`,
        html: `<p>Success! Your NJ Cabinets email configuration is working.</p><p><strong>Timestamp:</strong> ${timestamp}</p>`,
      };

      if (!mailOptions.from && result.defaultFrom) {
        mailOptions.from = result.defaultFrom;
      }

      await result.transporter.sendMail(mailOptions);
      if (typeof result.transporter.close === 'function') {
        result.transporter.close();
      }
    } catch (testError) {
      if (testTransport && testTransport.transporter && typeof testTransport.transporter.close === 'function') {
        testTransport.transporter.close();
      }
      return res.status(400).json({ success: false, message: testError.message || 'Unable to send test email. Verify your SMTP credentials.' });
    }

    return res.status(200).json({ success: true, message: `Test email sent to ${targetEmail}.` });
  } catch (error) {
    console.error('Error sending test email:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};


