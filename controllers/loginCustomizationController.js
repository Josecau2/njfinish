// controllers/loginCustomizationController.js
const LoginCustomization = require('../models/LoginCustomization');
const { updateFrontendCustomization } = require('../utils/frontendConfigWriter');
const Customization = require('../models/Customization');

exports.saveCustomization = async (req, res) => {
  try {
    const data = req.body;

    let customization = await LoginCustomization.findOne({ where: { id: 1 } });

    if (customization) {
      await customization.update(data);
    } else {
      customization = await LoginCustomization.create(data);
    }

    // Get UI customization for combined frontend config
    const uiCustomization = await Customization.findOne();

    // Update frontend configuration immediately
    try {
      await updateFrontendCustomization(
        uiCustomization?.dataValues || {},
        customization.dataValues,
        { login: null } // Login logo handling would be added here if needed
      );
      console.log('✅ Frontend login customization updated successfully');
    } catch (frontendError) {
      console.error('❌ Frontend customization update failed:', frontendError);
      // Don't fail the main request, but log the error
    }

    return res.status(200).json({ message: 'Customization saved successfully', customization });
  } catch (error) {
    console.error('Error saving customization:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getCustomization = async (req, res) => {
  try {
    const customization = await LoginCustomization.findOne({ where: { id: 1 } });

    if (!customization) {
      return res.status(404).json({ message: 'No customization found' });
    }

    return res.status(200).json({ customization });
  } catch (error) {
    console.error('Error fetching customization:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
