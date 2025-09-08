const express = require('express');
const router = express.Router();
const { PaymentConfiguration } = require('../models');
const { verifyToken } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permissions');

// Get payment configuration (admin only)
router.get('/', verifyToken, requirePermission('admin:settings'), async (req, res) => {
  try {
    const config = await PaymentConfiguration.findOne({
      where: { isActive: true },
      order: [['createdAt', 'DESC']],
    });

    if (!config) {
      return res.json({
        gatewayProvider: 'stripe',
        gatewayUrl: '',
        embedCode: '',
        isActive: false,
        supportedCurrencies: ['USD'],
        settings: {},
      });
    }

    // Don't expose sensitive data in response
    const safeConfig = {
      id: config.id,
      gatewayProvider: config.gatewayProvider,
      gatewayUrl: config.gatewayUrl,
      embedCode: config.embedCode,
      isActive: config.isActive,
      supportedCurrencies: config.supportedCurrencies,
      settings: config.settings,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    };

    res.json(safeConfig);
  } catch (error) {
    console.error('Error fetching payment configuration:', error);
    res.status(500).json({ error: 'Failed to fetch payment configuration' });
  }
});

// Get public payment configuration (for embedding)
router.get('/public', async (req, res) => {
  try {
    const config = await PaymentConfiguration.findOne({
      where: { isActive: true },
      order: [['createdAt', 'DESC']],
    });

    if (!config || !config.isActive) {
      return res.status(404).json({ error: 'Payment configuration not found' });
    }

    // Only return public-safe data
    const publicConfig = {
      gatewayProvider: config.gatewayProvider,
      gatewayUrl: config.gatewayUrl,
      embedCode: config.embedCode,
      supportedCurrencies: config.supportedCurrencies,
    };

    res.json(publicConfig);
  } catch (error) {
    console.error('Error fetching public payment configuration:', error);
    res.status(500).json({ error: 'Failed to fetch payment configuration' });
  }
});

// Create or update payment configuration (admin only)
router.post('/', verifyToken, requirePermission('admin:settings'), async (req, res) => {
  try {
    const {
      gatewayProvider,
      gatewayUrl,
      embedCode,
      apiKey,
      webhookSecret,
      supportedCurrencies,
      settings,
    } = req.body;

    const user = req.user;

    // Deactivate existing configurations
    await PaymentConfiguration.update(
      { isActive: false },
      { where: { isActive: true } }
    );

    const config = await PaymentConfiguration.create({
      gatewayProvider: gatewayProvider || 'stripe',
      gatewayUrl,
      embedCode,
      apiKey,
      webhookSecret,
      supportedCurrencies: supportedCurrencies || ['USD'],
      settings: settings || {},
      isActive: true,
      createdBy: user.id,
    });

    // Return safe config (without sensitive data)
    const safeConfig = {
      id: config.id,
      gatewayProvider: config.gatewayProvider,
      gatewayUrl: config.gatewayUrl,
      embedCode: config.embedCode,
      isActive: config.isActive,
      supportedCurrencies: config.supportedCurrencies,
      settings: config.settings,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    };

    res.status(201).json(safeConfig);
  } catch (error) {
    console.error('Error creating payment configuration:', error);
    res.status(500).json({ error: 'Failed to create payment configuration' });
  }
});

// Update payment configuration (admin only)
router.put('/:id', verifyToken, requirePermission('admin:settings'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      gatewayProvider,
      gatewayUrl,
      embedCode,
      apiKey,
      webhookSecret,
      supportedCurrencies,
      settings,
      isActive,
    } = req.body;

    const config = await PaymentConfiguration.findByPk(id);
    if (!config) {
      return res.status(404).json({ error: 'Payment configuration not found' });
    }

    // If activating this config, deactivate others
    if (isActive && !config.isActive) {
      await PaymentConfiguration.update(
        { isActive: false },
        { where: { isActive: true, id: { [require('sequelize').Op.ne]: id } } }
      );
    }

    const updateData = {};
    if (gatewayProvider !== undefined) updateData.gatewayProvider = gatewayProvider;
    if (gatewayUrl !== undefined) updateData.gatewayUrl = gatewayUrl;
    if (embedCode !== undefined) updateData.embedCode = embedCode;
    if (apiKey !== undefined) updateData.apiKey = apiKey;
    if (webhookSecret !== undefined) updateData.webhookSecret = webhookSecret;
    if (supportedCurrencies !== undefined) updateData.supportedCurrencies = supportedCurrencies;
    if (settings !== undefined) updateData.settings = settings;
    if (isActive !== undefined) updateData.isActive = isActive;

    await config.update(updateData);

    // Return safe config (without sensitive data)
    const updatedConfig = await PaymentConfiguration.findByPk(id);
    const safeConfig = {
      id: updatedConfig.id,
      gatewayProvider: updatedConfig.gatewayProvider,
      gatewayUrl: updatedConfig.gatewayUrl,
      embedCode: updatedConfig.embedCode,
      isActive: updatedConfig.isActive,
      supportedCurrencies: updatedConfig.supportedCurrencies,
      settings: updatedConfig.settings,
      createdAt: updatedConfig.createdAt,
      updatedAt: updatedConfig.updatedAt,
    };

    res.json(safeConfig);
  } catch (error) {
    console.error('Error updating payment configuration:', error);
    res.status(500).json({ error: 'Failed to update payment configuration' });
  }
});

// Delete payment configuration (admin only)
router.delete('/:id', verifyToken, requirePermission('admin:settings'), async (req, res) => {
  try {
    const { id } = req.params;

    const config = await PaymentConfiguration.findByPk(id);
    if (!config) {
      return res.status(404).json({ error: 'Payment configuration not found' });
    }

    await config.destroy();
    res.json({ success: true, message: 'Payment configuration deleted successfully' });
  } catch (error) {
    console.error('Error deleting payment configuration:', error);
    res.status(500).json({ error: 'Failed to delete payment configuration' });
  }
});

module.exports = router;
