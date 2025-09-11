// Controller to serve current embedded customization (dynamic fetch to avoid rebuild dependency)
const path = require('path');
const fs = require('fs');

exports.getEmbedded = (req, res) => {
  try {
    const configPath = path.join(__dirname, '../frontend/src/config/customization.js');
    if (!fs.existsSync(configPath)) {
      return res.status(404).json({ success: false, message: 'Customization config not found' });
    }
    const raw = fs.readFileSync(configPath, 'utf8');
    // Extract JSON after export const EMBEDDED_CUSTOMIZATION = ...
    const match = raw.match(/export const EMBEDDED_CUSTOMIZATION = (\{[\s\S]*?\})/);
    if (!match) {
      return res.status(500).json({ success: false, message: 'Could not parse customization config' });
    }
    const data = JSON.parse(match[1]);
    return res.json({ success: true, data });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Failed to load customization', error: e.message });
  }
};
