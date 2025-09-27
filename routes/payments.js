const express = require('express');
const { Op } = require('sequelize');
const router = express.Router();

const {
  Payment,
  Order,
  User,
  UserGroup,
  PaymentConfiguration,
  ProcessedWebhookEvent,
} = require('../models');
const { verifyTokenWithGroup } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permissions');
const { getStripeClient } = require('../services/stripeClient');
const env = require('../config/env');
const { getOrderAmountCents, formatCents } = require('../utils/payments/amounts');

const stripeWebhookRaw = express.raw({ type: 'application/json' });

const STRIPE_ALLOWED_EVENTS = new Set([
  'payment_intent.succeeded',
  'payment_intent.payment_failed',
]);

const coerceBool = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return ['true', '1', 'yes', 'on'].includes(value.trim().toLowerCase());
  }
  return Boolean(value);
};

const sanitizeStripeIntent = (intent) => {
  if (!intent || typeof intent !== 'object') return null;
  const result = {
    id: intent.id,
    status: intent.status,
    amount: intent.amount,
    currency: intent.currency,
    capture_method: intent.capture_method,
    payment_method_types: intent.payment_method_types,
  };

  if (intent.last_payment_error) {
    result.last_payment_error = {
      message: intent.last_payment_error.message,
      code: intent.last_payment_error.code,
      type: intent.last_payment_error.type,
    };
  }

  if (intent.charges && Array.isArray(intent.charges.data) && intent.charges.data.length) {
    const charge = intent.charges.data[0];
    result.charges = [{
      id: charge.id,
      status: charge.status,
      receipt_url: charge.receipt_url,
      balance_transaction: charge.balance_transaction,
      payment_method_details: charge.payment_method_details
        ? { type: charge.payment_method_details.type }
        : undefined,
    }];
  }

  return result;
};

const serializeGatewayResponse = (payload) => {
  try {
    return JSON.stringify(payload);
  } catch (err) {
    return null;
  }
};

const loadStripeSettings = async () => {
  const config = await PaymentConfiguration.findOne({
    where: { isActive: true },
    order: [['createdAt', 'DESC']],
  });

  const settings = (config && typeof config.settings === 'object') ? config.settings : {};
  const cardPaymentsEnabled = (config && config.cardPaymentsEnabled !== undefined)
    ? coerceBool(config.cardPaymentsEnabled)
    : coerceBool(env.STRIPE_ENABLED);

  return {
    config,
    gatewayProvider: (config?.gatewayProvider || 'stripe').toLowerCase(),
    cardPaymentsEnabled,
    secretKey: config?.apiKey || env.STRIPE_SECRET_KEY || '',
    publishableKey: config?.stripePublishableKey || env.STRIPE_PUBLISHABLE_KEY || '',
    webhookSecret: config?.webhookSecret || env.STRIPE_WEBHOOK_SECRET || '',
    pathToken: settings.stripeWebhookPathToken || settings.webhookPathToken || env.STRIPE_WEBHOOK_PATH_TOKEN || '',
  };
};

const buildOrderScope = async (user) => {
  if (!user) return {};
  const role = String(user.role || '').toLowerCase();
  if (role === 'admin' || role === 'super_admin') {
    return {};
  }

  const userGroup = user.group_id ? await UserGroup.findByPk(user.group_id) : null;

  if (userGroup) {
    return { owner_group_id: userGroup.id };
  }

  if (user?.id) {
    return { accepted_by_user_id: user.id };
  }

  return {};
};

const findPaymentForUser = async (id, user) => {
  const orderWhereClause = await buildOrderScope(user);

  return Payment.findByPk(id, {
    include: [
      {
        model: Order,
        as: 'order',
        where: orderWhereClause,
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'name', 'email'],
          },
          {
            model: UserGroup,
            as: 'ownerGroup',
            attributes: ['id', 'name'],
          },
        ],
      },
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'name', 'email'],
      },
    ],
  });
};

const ensureManualGateway = (payment, message) => {
  if (payment.gateway === 'stripe') {
    const error = new Error(message || 'Stripe payments must be completed via Stripe.');
    error.status = 409;
    throw error;
  }
};

const ensureStripeGateway = (payment) => {
  if (payment.gateway && payment.gateway !== 'stripe') {
    payment.gateway = 'stripe';
  }
};

router.get('/', verifyTokenWithGroup, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, orderId, gateway } = req.query;
    const offset = (page - 1) * limit;
    const whereClause = {};

    if (status && status !== 'all') {
      whereClause.status = status;
    }
    if (orderId) {
      whereClause.orderId = orderId;
    }
    if (gateway && gateway !== 'all') {
      whereClause.gateway = gateway;
    }

    const orderWhereClause = await buildOrderScope(req.user);

    const payments = await Payment.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Order,
          as: 'order',
          where: orderWhereClause,
          include: [
            { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
            { model: UserGroup, as: 'ownerGroup', attributes: ['id', 'name'] },
          ],
        },
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
      ],
      limit: Number(limit),
      offset: Number(offset),
      order: [['createdAt', 'DESC']],
    });

    res.json({
      payments: payments.rows,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(payments.count / limit),
        totalItems: payments.count,
        itemsPerPage: Number(limit),
      },
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

router.get('/:id', verifyTokenWithGroup, async (req, res) => {
  try {
    const payment = await findPaymentForUser(req.params.id, req.user);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json(payment);
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({ error: 'Failed to fetch payment' });
  }
});

router.post('/', verifyTokenWithGroup, requirePermission('payments:create'), async (req, res) => {
  try {
    const { orderId, gateway = 'manual', paymentMethod } = req.body || {};

    if (!orderId) {
      return res.status(400).json({ error: 'orderId is required' });
    }

    const order = await Order.findByPk(orderId, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
        { model: UserGroup, as: 'ownerGroup', attributes: ['id', 'name'] },
      ],
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const existingPayment = await Payment.findOne({
      where: {
        orderId,
        status: { [Op.in]: ['pending', 'processing', 'completed'] },
      },
    });

    if (existingPayment) {
      return res.status(400).json({ error: 'Payment already exists for this order' });
    }

    const { amount_cents, currency } = getOrderAmountCents(order);
    if (!amount_cents) {
      return res.status(400).json({ error: 'Unable to determine order total' });
    }

    let resolvedGateway = 'manual';
    if (gateway === 'stripe') {
      const stripeSettings = await loadStripeSettings();
      if (stripeSettings.gatewayProvider === 'stripe' && stripeSettings.cardPaymentsEnabled) {
        resolvedGateway = 'stripe';
      }
    }

    const payment = await Payment.create({
      orderId,
      gateway: resolvedGateway,
      amount_cents,
      amount: formatCents(amount_cents),
      currency,
      paymentMethod,
      createdBy: req.user?.id || null,
    });

    const createdPayment = await Payment.findByPk(payment.id, {
      include: [
        { model: Order, as: 'order', include: [
          { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
          { model: UserGroup, as: 'ownerGroup', attributes: ['id', 'name'] },
        ] },
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
      ],
    });

    res.status(201).json(createdPayment);
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

router.put('/:id/status', verifyTokenWithGroup, requirePermission('payments:update'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, transactionId, gatewayResponse } = req.body || {};

    const payment = await Payment.findByPk(id);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    ensureManualGateway(payment, 'Use the Stripe payment flow to update this payment.');

    const updateData = {};
    if (status) updateData.status = status;
    if (transactionId) updateData.transactionId = transactionId;
    if (gatewayResponse) updateData.gatewayResponse = serializeGatewayResponse(gatewayResponse) || payment.gatewayResponse;
    if (status === 'completed') {
      updateData.paidAt = new Date();
    }

    await payment.update(updateData);

    const updatedPayment = await Payment.findByPk(id, {
      include: [
        {
          model: Order,
          as: 'order',
          include: [
            { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
            { model: UserGroup, as: 'ownerGroup', attributes: ['id', 'name'] },
          ],
        },
      ],
    });

    res.json(updatedPayment);
  } catch (error) {
    const statusCode = error.status || 500;
    if (statusCode >= 500) {
      console.error('Error updating payment status:', error);
    }
    res.status(statusCode).json({ error: error.message || 'Failed to update payment status' });
  }
});

router.put('/:id/apply', verifyTokenWithGroup, requirePermission('payments:update'), async (req, res) => {
  try {
    const { id } = req.params;
    const { transactionId, paymentMethod } = req.body || {};

    const payment = await Payment.findByPk(id);
    if (!payment) return res.status(404).json({ error: 'Payment not found' });

    ensureManualGateway(payment, 'Manual apply is disabled for Stripe payments.');

    if (payment.status === 'completed') {
      return res.json(payment);
    }

    await payment.update({
      status: 'completed',
      paidAt: new Date(),
      transactionId: transactionId || payment.transactionId,
      paymentMethod: paymentMethod || payment.paymentMethod,
    });

    const updatedPayment = await Payment.findByPk(id, {
      include: [
        {
          model: Order,
          as: 'order',
          include: [
            { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
            { model: UserGroup, as: 'ownerGroup', attributes: ['id', 'name'] },
          ],
        },
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
      ],
    });

    res.json(updatedPayment);
  } catch (error) {
    const statusCode = error.status || 500;
    if (statusCode >= 500) {
      console.error('Error applying payment:', error);
    }
    res.status(statusCode).json({ error: error.message || 'Failed to apply payment' });
  }
});

router.post('/:id/stripe-intent', verifyTokenWithGroup, async (req, res) => {
  try {
    const stripeSettings = await loadStripeSettings();
    if (stripeSettings.gatewayProvider !== 'stripe' || !stripeSettings.cardPaymentsEnabled) {
      return res.status(400).json({ error: 'Stripe card payments are not enabled.' });
    }

    if (!stripeSettings.publishableKey) {
      return res.status(500).json({ error: 'Stripe publishable key is not configured.' });
    }

    const stripe = getStripeClient(stripeSettings.secretKey);
    if (!stripe) {
      return res.status(500).json({ error: 'Stripe is not configured.' });
    }

    const payment = await findPaymentForUser(req.params.id, req.user);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const order = payment.order;
    const { amount_cents, currency } = getOrderAmountCents(order);
    if (!amount_cents) {
      return res.status(400).json({ error: 'Unable to determine order total.' });
    }

    ensureStripeGateway(payment);

    let intent = null;
    if (payment.transactionId) {
      try {
        intent = await stripe.paymentIntents.retrieve(payment.transactionId);
      } catch (error) {
        if (!error || error.code !== 'resource_missing') {
          throw error;
        }
      }
    }

    const metadata = {
      paymentId: String(payment.id),
      orderId: order ? String(order.id) : '',
      order_number: order?.order_number || '',
      user_id: req.user?.id ? String(req.user.id) : '',
      group_id: req.user?.group_id ? String(req.user.group_id) : '',
    };

    if (intent && ['succeeded', 'canceled'].includes(intent.status)) {
      intent = null;
    }

    if (intent) {
      const updatePayload = {};
      if (intent.amount !== amount_cents) {
        updatePayload.amount = amount_cents;
      }
      if (intent.currency !== currency.toLowerCase()) {
        updatePayload.currency = currency.toLowerCase();
      }
      if (Object.keys(updatePayload).length) {
        intent = await stripe.paymentIntents.update(intent.id, updatePayload);
      }
    }

    if (!intent) {
      intent = await stripe.paymentIntents.create({
        amount: amount_cents,
        currency: currency.toLowerCase(),
        automatic_payment_methods: { enabled: true },
        metadata,
      });
    }

    await payment.update({
      gateway: 'stripe',
      amount_cents,
      amount: formatCents(amount_cents),
      currency,
      transactionId: intent.id,
      status: payment.status === 'completed' ? 'completed' : 'pending',
    });

    res.json({
      clientSecret: intent.client_secret,
      publishableKey: stripeSettings.publishableKey,
      intentId: intent.id,
      paymentId: payment.id,
      amount_cents,
      currency,
    });
  } catch (error) {
    const statusCode = error.status || 500;
    console.error('Error creating Stripe intent:', error);
    res.status(statusCode).json({ error: error.message || 'Failed to create payment intent' });
  }
});

router.delete('/:id', verifyTokenWithGroup, requirePermission('payments:delete'), async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await Payment.findByPk(id);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (!['pending', 'failed', 'cancelled'].includes(payment.status)) {
      return res.status(400).json({ error: 'Cannot delete completed or processing payments' });
    }

    await payment.destroy();
    res.json({ success: true, message: 'Payment deleted successfully' });
  } catch (error) {
    console.error('Error deleting payment:', error);
    res.status(500).json({ error: 'Failed to delete payment' });
  }
});

const handleStripeWebhook = async (req, res) => {
  try {
    const stripeSettings = await loadStripeSettings();
    if (stripeSettings.gatewayProvider !== 'stripe') {
      return res.status(400).json({ error: 'Stripe is not configured.' });
    }

    if (!stripeSettings.webhookSecret) {
      return res.status(500).json({ error: 'Stripe webhook secret is not configured.' });
    }

    const expectedToken = stripeSettings.pathToken;
    if (expectedToken && expectedToken !== req.params.token) {
      return res.status(404).json({ error: 'Webhook endpoint not found.' });
    }

    const stripe = getStripeClient(stripeSettings.secretKey);
    if (!stripe) {
      return res.status(500).json({ error: 'Stripe is not configured.' });
    }

    const signature = req.headers['stripe-signature'];
    if (!signature) {
      return res.status(400).json({ error: 'Missing Stripe signature header' });
    }

    const rawBody = req.body instanceof Buffer ? req.body : Buffer.from(req.body || '');
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        stripeSettings.webhookSecret,
        { tolerance: env.STRIPE_WEBHOOK_TOLERANCE_SECONDS || 300 },
      );
    } catch (err) {
      console.error('Stripe webhook signature verification failed:', err.message);
      return res.status(400).json({ error: 'Invalid signature' });
    }

    if (!STRIPE_ALLOWED_EVENTS.has(event.type)) {
      return res.json({ received: true, ignored: true });
    }

    const existingEvent = await ProcessedWebhookEvent.findOne({ where: { stripe_event_id: event.id } });
    if (existingEvent && existingEvent.processed_at) {
      return res.json({ received: true, duplicate: true });
    }

    const intent = event.data?.object;
    if (!intent || !intent.id) {
      return res.status(400).json({ error: 'Invalid event payload' });
    }

    const payment = await Payment.findOne({
      where: { transactionId: intent.id },
      include: [{ model: Order, as: 'order' }],
    });

    const sanitizedIntent = sanitizeStripeIntent(intent);

    if (!payment) {
      await ProcessedWebhookEvent.upsert({
        stripe_event_id: event.id,
        type: event.type,
        payment_id: null,
        payload: sanitizedIntent,
        received_at: existingEvent?.received_at || new Date(),
        processed_at: new Date(),
      });
      return res.json({ received: true, paymentMissing: true });
    }

    ensureStripeGateway(payment);

    if (event.type === 'payment_intent.succeeded') {
      const receiptUrl = intent.charges?.data?.[0]?.receipt_url || null;
      await payment.update({
        status: 'completed',
        gateway: 'stripe',
        amount_cents: intent.amount || payment.amount_cents,
        amount: formatCents(intent.amount || payment.amount_cents),
        currency: intent.currency ? intent.currency.toUpperCase() : payment.currency,
        receipt_url: receiptUrl,
        paidAt: new Date(),
        gatewayResponse: serializeGatewayResponse(sanitizedIntent) || payment.gatewayResponse,
      });
    }

    if (event.type === 'payment_intent.payment_failed') {
      const failureMessage = intent.last_payment_error?.message || 'Payment failed';
      await payment.update({
        status: 'failed',
        gateway: 'stripe',
        gatewayResponse: serializeGatewayResponse({ ...sanitizedIntent, failureMessage }) || payment.gatewayResponse,
      });
    }

    await ProcessedWebhookEvent.upsert({
      stripe_event_id: event.id,
      type: event.type,
      payment_id: payment.id,
      payload: sanitizedIntent,
      received_at: existingEvent?.received_at || new Date(),
      processed_at: new Date(),
    });

    res.json({ received: true });
  } catch (error) {
    console.error('Error processing Stripe webhook:', error);
    res.status(500).json({ error: 'Failed to handle webhook' });
  }
};

module.exports = router;
module.exports.stripeWebhookRaw = stripeWebhookRaw;
module.exports.handleStripeWebhook = handleStripeWebhook;

