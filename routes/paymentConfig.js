const express = require('express');
const { Op } = require('sequelize');
const router = express.Router();
const { PaymentConfiguration } = require('../models');
const { verifyToken } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permissions');
const { sanitizePaymentEmbed } = require('../utils/htmlSanitizer');
const env = require('../config/env');

const parseJson = (value, fallback) => {
  if (!value) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch (err) {
    return fallback;
  }
};

const coerceCurrencies = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    return value.split(',').map((c) => c.trim().toUpperCase()).filter(Boolean);
  }
  return ['USD'];
};

const buildSafeConfig = (config) => {
  if (!config) {
    return {
      gatewayProvider: 'stripe',
      gatewayUrl: '',
      embedCode: '',
      isActive: false,
      stripePublishableKey: env.STRIPE_PUBLISHABLE_KEY || '',
      cardPaymentsEnabled: Boolean(env.STRIPE_ENABLED),
      supportedCurrencies: ['USD'],
      settings: {},
      hasSecretKey: Boolean(env.STRIPE_SECRET_KEY),
      hasWebhookSecret: Boolean(env.STRIPE_WEBHOOK_SECRET),
    };
  }

  return {
    id: config.id,
    gatewayProvider: config.gatewayProvider,
    gatewayUrl: config.gatewayUrl,
    embedCode: sanitizePaymentEmbed(config.embedCode || ''),
    isActive: config.isActive,
    supportedCurrencies: config.supportedCurrencies || ['USD'],
    settings: config.settings || {},
    stripePublishableKey: config.stripePublishableKey || '',
    cardPaymentsEnabled: Boolean(config.cardPaymentsEnabled),
    createdAt: config.createdAt,
    updatedAt: config.updatedAt,
    hasSecretKey: Boolean(config.apiKey),
    hasWebhookSecret: Boolean(config.webhookSecret),
  };
};

router.get('/', verifyToken, requirePermission('admin:settings'), async (req, res) => {
  try {
    const config = await PaymentConfiguration.findOne({
      where: { isActive: true },
      order: [['createdAt', 'DESC']],
    });

    res.json(buildSafeConfig(config));
  } catch (error) {
    console.error('Error fetching payment configuration:', error);
    res.status(500).json({ error: 'Failed to fetch payment configuration' });
  }
});

router.get('/public', async (req, res) => {
  try {
    const config = await PaymentConfiguration.findOne({
      where: { isActive: true },
      order: [['createdAt', 'DESC']],
    });

    if (!config || !config.isActive) {
      const fallback = {
        gatewayProvider: 'stripe',
        cardPaymentsEnabled: Boolean(env.STRIPE_ENABLED),
        publishableKey: env.STRIPE_PUBLISHABLE_KEY || '',
      };
      if (!fallback.cardPaymentsEnabled) {
        return res.status(404).json({ error: 'Payment configuration not found' });
      }
      return res.json(fallback);
    }

    const response = {
      gatewayProvider: config.gatewayProvider,
      cardPaymentsEnabled: Boolean(config.cardPaymentsEnabled),
      publishableKey: config.stripePublishableKey || env.STRIPE_PUBLISHABLE_KEY || '',
    };

    if (config.gatewayProvider !== 'stripe') {
      response.gatewayUrl = config.gatewayUrl;
      response.embedCode = sanitizePaymentEmbed(config.embedCode || '');
      response.supportedCurrencies = config.supportedCurrencies || ['USD'];
    }

    res.json(response);
  } catch (error) {
    console.error('Error fetching public payment configuration:', error);
    res.status(500).json({ error: 'Failed to fetch payment configuration' });
  }
});

router.post('/', verifyToken, requirePermission('admin:settings'), async (req, res) => {
  try {
    const {
      gatewayProvider = 'stripe',
      gatewayUrl = '',
      embedCode = '',
      apiKey,
      webhookSecret,
      stripePublishableKey,
      cardPaymentsEnabled = false,
      supportedCurrencies,
      settings,
    } = req.body || {};

    const user = req.user;

    await PaymentConfiguration.update(
      { isActive: false },
      { where: { isActive: true } }
    );

    const sanitizedEmbed = sanitizePaymentEmbed(embedCode || '');

    const config = await PaymentConfiguration.create({
      gatewayProvider,
      gatewayUrl,
      embedCode: sanitizedEmbed,
      apiKey: apiKey || null,
      webhookSecret: webhookSecret || null,
      stripePublishableKey: stripePublishableKey || null,
      cardPaymentsEnabled: Boolean(cardPaymentsEnabled),
      supportedCurrencies: coerceCurrencies(supportedCurrencies),
      settings: parseJson(settings, {}),
      isActive: true,
      createdBy: user.id,
    });

    res.status(201).json(buildSafeConfig(config));
  } catch (error) {
    console.error('Error creating payment configuration:', error);
    res.status(500).json({ error: 'Failed to create payment configuration' });
  }
});

router.put('/:id', verifyToken, requirePermission('admin:settings'), async (req, res) => {
  try {
    const { id } = req.params;
    const config = await PaymentConfiguration.findByPk(id);
    if (!config) {
      return res.status(404).json({ error: 'Payment configuration not found' });
    }

    const {
      gatewayProvider,
      gatewayUrl,
      embedCode,
      apiKey,
      webhookSecret,
      stripePublishableKey,
      cardPaymentsEnabled,
      supportedCurrencies,
      settings,
      isActive,
    } = req.body || {};

    const updateData = {};

    if (gatewayProvider !== undefined) updateData.gatewayProvider = gatewayProvider;
    if (gatewayUrl !== undefined) updateData.gatewayUrl = gatewayUrl;
    if (embedCode !== undefined) updateData.embedCode = sanitizePaymentEmbed(embedCode || '');
    if (apiKey !== undefined) updateData.apiKey = apiKey || null;
    if (webhookSecret !== undefined) updateData.webhookSecret = webhookSecret || null;
    if (stripePublishableKey !== undefined) updateData.stripePublishableKey = stripePublishableKey || null;
    if (cardPaymentsEnabled !== undefined) updateData.cardPaymentsEnabled = Boolean(cardPaymentsEnabled);
    if (supportedCurrencies !== undefined) updateData.supportedCurrencies = coerceCurrencies(supportedCurrencies);
    if (settings !== undefined) updateData.settings = parseJson(settings, {});
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    if (updateData.isActive) {
      await PaymentConfiguration.update(
        { isActive: false },
        { where: { isActive: true, id: { [Op.ne]: id } } }
      );
    }

    await config.update(updateData);

    const refreshed = await PaymentConfiguration.findByPk(id);
    res.json(buildSafeConfig(refreshed));
  } catch (error) {
    console.error('Error updating payment configuration:', error);
    res.status(500).json({ error: 'Failed to update payment configuration' });
  }
});

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





