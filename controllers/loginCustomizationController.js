const LoginCustomization = require('../models/LoginCustomization');
const { writeFrontendLoginCustomization } = require('../utils/frontendLoginConfigWriter');
const { compileCustomization, stripRuntimeFields, refreshLoginCustomization } = require('../services/loginCustomizationCache');

exports.saveCustomization = async (req, res) => {
  try {
    const normalized = compileCustomization(req.body || {});
    const payload = stripRuntimeFields(normalized);

    let customization = await LoginCustomization.findOne({ where: { id: 1 } });

    if (customization) {
      await customization.update(payload);
    } else {
      customization = await LoginCustomization.create({ id: 1, ...payload });
    }

    try {
      await writeFrontendLoginCustomization(normalized);
    } catch (e) {
      console.error('Failed persisting static login customization:', e);
    }

    await refreshLoginCustomization();

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
