const express = require('express');
const { Op } = require('sequelize');
const router = express.Router();
const { PaymentConfiguration } = require('../models');
const { verifyToken } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permissions');
const { sanitizePaymentEmbed } = require('../utils/htmlSanitizer');
const env = require('../config/env');

/**
 * @openapi
 * components:
 *   schemas:
 *     PaymentConfiguration:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Configuration ID
 *         gatewayProvider:
 *           type: string
 *           enum: [stripe, custom]
 *           description: Payment gateway provider
 *         gatewayUrl:
 *           type: string
 *           description: Custom gateway URL (for non-Stripe providers)
 *         embedCode:
 *           type: string
 *           description: HTML embed code for custom payment forms (sanitized)
 *         stripePublishableKey:
 *           type: string
 *           description: Stripe publishable key
 *         cardPaymentsEnabled:
 *           type: boolean
 *           description: Whether card payments are enabled
 *         supportedCurrencies:
 *           type: array
 *           items:
 *             type: string
 *           description: List of supported currency codes
 *           example: ["USD", "EUR", "GBP"]
 *         settings:
 *           type: object
 *           description: Additional gateway-specific settings
 *         isActive:
 *           type: boolean
 *           description: Whether this configuration is currently active
 *         hasSecretKey:
 *           type: boolean
 *           description: Indicates if API secret key is configured (key itself is never returned)
 *         hasWebhookSecret:
 *           type: boolean
 *           description: Indicates if webhook secret is configured (secret itself is never returned)
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     PublicPaymentConfiguration:
 *       type: object
 *       description: Publicly accessible payment configuration (no sensitive keys)
 *       properties:
 *         gatewayProvider:
 *           type: string
 *           enum: [stripe, custom]
 *         cardPaymentsEnabled:
 *           type: boolean
 *         publishableKey:
 *           type: string
 *           description: Stripe publishable key (safe to expose)
 *         gatewayUrl:
 *           type: string
 *           description: Custom gateway URL (only for non-Stripe providers)
 *         embedCode:
 *           type: string
 *           description: Sanitized HTML embed code (only for non-Stripe providers)
 *         supportedCurrencies:
 *           type: array
 *           items:
 *             type: string
 */

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

/**
 * @openapi
 * /api/payment-config:
 *   get:
 *     tags:
 *       - Payments
 *     summary: Get active payment configuration (admin only)
 *     description: Retrieves the currently active payment configuration with sensitive keys redacted. Admin users can see whether keys are configured via hasSecretKey and hasWebhookSecret flags. Falls back to environment variables if no active configuration exists.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved payment configuration
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentConfiguration'
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       403:
 *         description: Forbidden - User lacks admin:settings permission
 *       500:
 *         description: Internal server error
 */
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

/**
 * @openapi
 * /api/payment-config/public:
 *   get:
 *     tags:
 *       - Payments
 *     summary: Get public payment configuration (no authentication required)
 *     description: Retrieves publicly accessible payment configuration information needed by the frontend payment flow. Only returns safe-to-expose information like publishable keys. No sensitive secrets are included. Falls back to environment variables if no configuration is active.
 *     responses:
 *       200:
 *         description: Successfully retrieved public payment configuration
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PublicPaymentConfiguration'
 *       404:
 *         description: Payment configuration not found and card payments are disabled
 *       500:
 *         description: Internal server error
 */
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

/**
 * @openapi
 * /api/payment-config:
 *   post:
 *     tags:
 *       - Payments
 *     summary: Create new payment configuration (admin only)
 *     description: Creates a new payment configuration and automatically sets it as active. Any previously active configuration is deactivated. Sanitizes HTML embed code for security. All sensitive keys (apiKey, webhookSecret) are stored securely and never returned in responses.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               gatewayProvider:
 *                 type: string
 *                 enum: [stripe, custom]
 *                 default: stripe
 *                 description: Payment gateway provider
 *               gatewayUrl:
 *                 type: string
 *                 description: Custom gateway URL (for non-Stripe providers)
 *               embedCode:
 *                 type: string
 *                 description: HTML embed code for custom payment forms (will be sanitized)
 *               apiKey:
 *                 type: string
 *                 description: Stripe secret key or custom gateway API key
 *               webhookSecret:
 *                 type: string
 *                 description: Stripe webhook secret
 *               stripePublishableKey:
 *                 type: string
 *                 description: Stripe publishable key
 *               cardPaymentsEnabled:
 *                 type: boolean
 *                 default: false
 *                 description: Enable/disable card payments
 *               supportedCurrencies:
 *                 oneOf:
 *                   - type: array
 *                     items:
 *                       type: string
 *                   - type: string
 *                     description: Comma-separated currency codes
 *                 description: Supported currency codes
 *                 example: ["USD", "EUR"]
 *               settings:
 *                 oneOf:
 *                   - type: object
 *                   - type: string
 *                     description: JSON string of settings
 *                 description: Additional gateway-specific settings
 *     responses:
 *       201:
 *         description: Payment configuration created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentConfiguration'
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       403:
 *         description: Forbidden - User lacks admin:settings permission
 *       500:
 *         description: Internal server error
 */
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

/**
 * @openapi
 * /api/payment-config/{id}:
 *   put:
 *     tags:
 *       - Payments
 *     summary: Update existing payment configuration (admin only)
 *     description: Updates an existing payment configuration. If isActive is set to true, all other configurations are automatically deactivated. Sanitizes HTML embed code for security. Only provided fields are updated.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Payment configuration ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               gatewayProvider:
 *                 type: string
 *                 enum: [stripe, custom]
 *                 description: Payment gateway provider
 *               gatewayUrl:
 *                 type: string
 *                 description: Custom gateway URL
 *               embedCode:
 *                 type: string
 *                 description: HTML embed code (will be sanitized)
 *               apiKey:
 *                 type: string
 *                 description: API secret key (stored securely, never returned)
 *               webhookSecret:
 *                 type: string
 *                 description: Webhook secret (stored securely, never returned)
 *               stripePublishableKey:
 *                 type: string
 *                 description: Stripe publishable key
 *               cardPaymentsEnabled:
 *                 type: boolean
 *                 description: Enable/disable card payments
 *               supportedCurrencies:
 *                 oneOf:
 *                   - type: array
 *                     items:
 *                       type: string
 *                   - type: string
 *                     description: Comma-separated currency codes
 *               settings:
 *                 oneOf:
 *                   - type: object
 *                   - type: string
 *                     description: JSON string of settings
 *               isActive:
 *                 type: boolean
 *                 description: Set as active configuration (deactivates others)
 *     responses:
 *       200:
 *         description: Payment configuration updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentConfiguration'
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       403:
 *         description: Forbidden - User lacks admin:settings permission
 *       404:
 *         description: Payment configuration not found
 *       500:
 *         description: Internal server error
 */
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

/**
 * @openapi
 * /api/payment-config/{id}:
 *   delete:
 *     tags:
 *       - Payments
 *     summary: Delete payment configuration (admin only)
 *     description: Permanently deletes a payment configuration. Use with caution as this operation cannot be undone. If you delete the active configuration, you may need to create or activate another one.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Payment configuration ID
 *     responses:
 *       200:
 *         description: Payment configuration deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Payment configuration deleted successfully
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       403:
 *         description: Forbidden - User lacks admin:settings permission
 *       404:
 *         description: Payment configuration not found
 *       500:
 *         description: Internal server error
 */
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





