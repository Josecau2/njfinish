const { Op } = require('sequelize');
const { Terms, TermsAcceptance, User } = require('../models');

// Ensure tables exist (defensive)
async function ensureModels() {
  try {
    await Terms.sync();
    await TermsAcceptance.sync();
  } catch (e) {
    // continue
  }
}

exports.getLatestTerms = async (req, res) => {
  await ensureModels();
  try {
    const latest = await Terms.findOne({ order: [['version', 'DESC']] });
    return res.json({ success: true, data: latest });
  } catch (e) {
    return res.status(200).json({ success: true, data: null });
  }
};

exports.saveTerms = async (req, res) => {
  await ensureModels();
  try {
    const { content, bumpVersion } = req.body || {};
    if (!content || typeof content !== 'string') {
      return res.status(400).json({ success: false, message: 'Content required' });
    }
    // Determine version
    const latest = await Terms.findOne({ order: [['version', 'DESC']] });
    let nextVersion;
    
    if (!latest) {
      // No existing terms, start with version 1
      nextVersion = 1;
    } else if (bumpVersion) {
      // Create new version by incrementing
      nextVersion = latest.version + 1;
    } else {
      // Update existing version
      nextVersion = latest.version;
    }
    
    const created = await Terms.create({ content, version: nextVersion, created_by_user_id: req.user?.id || null });
    return res.json({ success: true, data: created });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Failed to save terms' });
  }
};

exports.getAcceptanceStatus = async (req, res) => {
  await ensureModels();
  try {
    const latest = await Terms.findOne({ order: [['version', 'DESC']] });
    if (!latest) return res.json({ success: true, data: [] });
    const users = await User.findAll({ attributes: ['id', 'name', 'email', 'role'] });
    const accepts = await TermsAcceptance.findAll({ where: { terms_version: latest.version } });
    const acceptedBy = new Set(accepts.map((a) => a.user_id));
    const rows = users.map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, accepted: acceptedBy.has(u.id) }));
    return res.json({ success: true, data: { version: latest.version, users: rows } });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Failed to load acceptance' });
  }
};

exports.acceptLatest = async (req, res) => {
  await ensureModels();
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const latest = await Terms.findOne({ order: [['version', 'DESC']] });
    if (!latest) return res.status(400).json({ success: false, message: 'No terms defined' });
    await TermsAcceptance.findOrCreate({ where: { user_id: userId, terms_version: latest.version }, defaults: {} });
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Failed to accept terms' });
  }
};
