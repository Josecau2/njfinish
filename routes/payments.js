const express = require('express');
const router = express.Router();
const { Payment, Order, User, UserGroup } = require('../models');
const { verifyToken, verifyTokenWithGroup } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permissions');
const { Op } = require('sequelize');

// Get payments list (scoped by user role)
router.get('/', verifyTokenWithGroup, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, orderId } = req.query;
    const offset = (page - 1) * limit;
    const user = req.user;

    let whereClause = {};
    let orderWhereClause = {};

    // Apply filters
    if (status) {
      whereClause.status = status;
    }
    if (orderId) {
      whereClause.orderId = orderId;
    }

    // Scope by user role
    if (user.role !== 'Admin') {
      // For contractors, only show payments for their group's orders
      const userGroup = await UserGroup.findByPk(user.group_id);
      if (userGroup) {
        orderWhereClause.owner_group_id = userGroup.id;
      } else {
        // If no group, show only their own orders
        orderWhereClause.accepted_by_user_id = user.id;
      }
    }

    const payments = await Payment.findAndCountAll({
      where: whereClause,
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
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
    });

    res.json({
      payments: payments.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(payments.count / limit),
        totalItems: payments.count,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// Get payment by ID
router.get('/:id', verifyTokenWithGroup, async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    let orderWhereClause = {};
    if (user.role !== 'Admin') {
      const userGroup = await UserGroup.findByPk(user.group_id);
      if (userGroup) {
        orderWhereClause.owner_group_id = userGroup.id;
      } else {
        orderWhereClause.accepted_by_user_id = user.id;
      }
    }

    const payment = await Payment.findByPk(id, {
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

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json(payment);
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({ error: 'Failed to fetch payment' });
  }
});

// Create payment (admin only)
router.post('/', verifyTokenWithGroup, requirePermission('payments:create'), async (req, res) => {
  try {
    const { orderId, amount, currency = 'USD', paymentMethod } = req.body;
    const user = req.user;

    // Verify order exists and user has access
    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if payment already exists for this order
    const existingPayment = await Payment.findOne({
      where: { orderId, status: { [Op.in]: ['pending', 'processing', 'completed'] } }
    });

    if (existingPayment) {
      return res.status(400).json({ error: 'Payment already exists for this order' });
    }

    const payment = await Payment.create({
      orderId,
      amount,
      currency,
      paymentMethod,
      createdBy: user.id,
    });

    const createdPayment = await Payment.findByPk(payment.id, {
      include: [
        {
          model: Order,
          as: 'order',
          include: [
            {
              model: User,
              as: 'creator',
              attributes: ['id', 'name', 'email'],
            },
          ],
        },
      ],
    });

    res.status(201).json(createdPayment);
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

// Update payment status
router.put('/:id/status', verifyTokenWithGroup, requirePermission('payments:update'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, transactionId, gatewayResponse } = req.body;

    const payment = await Payment.findByPk(id);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const updateData = { status };
    if (transactionId) updateData.transactionId = transactionId;
    if (gatewayResponse) updateData.gatewayResponse = JSON.stringify(gatewayResponse);
    if (status === 'completed') updateData.paidAt = new Date();

    await payment.update(updateData);

    const updatedPayment = await Payment.findByPk(id, {
      include: [
        {
          model: Order,
          as: 'order',
          include: [
            {
              model: User,
              as: 'creator',
              attributes: ['id', 'name', 'email'],
            },
          ],
        },
      ],
    });

    res.json(updatedPayment);
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ error: 'Failed to update payment status' });
  }
});

// Apply (complete) a payment manually (admin action)
router.put('/:id/apply', verifyTokenWithGroup, requirePermission('payments:update'), async (req, res) => {
  try {
    const { id } = req.params;
    const { transactionId, paymentMethod } = req.body || {};

    const payment = await Payment.findByPk(id);
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    if (payment.status === 'completed') {
      return res.json(payment); // already applied
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
    console.error('Error applying payment:', error);
    res.status(500).json({ error: 'Failed to apply payment' });
  }
});

// Payment webhook endpoint (for third-party payment confirmations)
router.post('/webhook', async (req, res) => {
  try {
    const { transactionId, status, orderId, gatewayResponse } = req.body;

    // Find payment by transaction ID or order ID
    let payment;
    if (transactionId) {
      payment = await Payment.findOne({ where: { transactionId } });
    } else if (orderId) {
      payment = await Payment.findOne({ where: { orderId } });
    }

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Update payment status based on webhook
    const updateData = {
      status: status === 'success' ? 'completed' : status === 'failed' ? 'failed' : 'processing',
      gatewayResponse: JSON.stringify(gatewayResponse || req.body),
    };

    if (transactionId && !payment.transactionId) {
      updateData.transactionId = transactionId;
    }

    if (updateData.status === 'completed') {
      updateData.paidAt = new Date();
    }

    await payment.update(updateData);

    res.json({ success: true, message: 'Payment status updated' });
  } catch (error) {
    console.error('Error processing payment webhook:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
});

// Delete payment (admin only)
router.delete('/:id', verifyTokenWithGroup, requirePermission('payments:delete'), async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await Payment.findByPk(id);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Only allow deletion of pending or failed payments
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

module.exports = router;
