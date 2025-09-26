const { Order, Proposals, Customer, UserGroup, Manufacturer } = require('../models');
const sequelize = require('../config/db');
const { DataTypes } = require('sequelize');

// Ensure the orders table has required columns in environments where global sync doesn't alter
async function ensureOrdersSchema() {
  try {
    const qi = sequelize.getQueryInterface();
    const table = await qi.describeTable('orders').catch(() => null);
    if (!table) {
      // Table missing: create via model
      await Order.sync();
      return;
    }
    const adds = [];
    if (!table.accepted_at) {
      adds.push(qi.addColumn('orders', 'accepted_at', { type: DataTypes.DATE, allowNull: true }));
    }
    if (!table.accepted_by_user_id) {
      adds.push(qi.addColumn('orders', 'accepted_by_user_id', { type: DataTypes.INTEGER, allowNull: true }));
    }
    if (!table.accepted_by_label) {
      adds.push(qi.addColumn('orders', 'accepted_by_label', { type: DataTypes.STRING, allowNull: true }));
    }
    if (!table.grand_total_cents) {
      adds.push(qi.addColumn('orders', 'grand_total_cents', { type: DataTypes.INTEGER, allowNull: true }));
    }
    if (!table.snapshot) {
      // JSON not supported on all MySQL versions; Sequelize maps to LONGTEXT if needed
      adds.push(qi.addColumn('orders', 'snapshot', { type: DataTypes.JSON, allowNull: true }));
    }
    if (adds.length) await Promise.all(adds);
  } catch (e) {
    // Log once but don't block requests
    console.warn('ordersController.ensureOrdersSchema warning:', e?.message || e);
  }
}

// List orders, optionally mine=true for scoped view
const listOrders = async (req, res) => {
  try {
    console.log('📋 [DEBUG] listOrders called:', {
      mineFlag: req.query.mine,
      userId: req.user?.id,
      userGroupId: req.user?.group_id,
      timestamp: new Date().toISOString()
    });

    await ensureOrdersSchema();
  const mineFlag = (req.query.mine || '').toString().toLowerCase() === 'true';
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 25; // show more by default to avoid hiding fresh accepts
    const offset = (page - 1) * limit;

    const where = {};
    const user = req.user;
    const role = (user?.role || '').toString().toLowerCase();
    const isAdmin = role === 'admin' || role === 'super_admin';
    const isContractor = !!(user?.group && ((user.group.group_type === 'contractor') || (user.group.type === 'contractor')));

    // Scoping rules:
    // - Admins: can see all (unless they explicitly pass mine=true to self-scope)
    // - Contractors: see only their group orders
    // - Non-admin staff: see only orders they accepted
    if (!isAdmin) {
      if (isContractor && user?.group_id) {
        where.owner_group_id = user.group_id;
      } else if (user?.id) {
        where.accepted_by_user_id = user.id;
      }
    } else if (mineFlag && user?.id) {
      // Optional: allow admin to self-scope via mine=true
      where.accepted_by_user_id = user.id;
    }

    console.log('🔍 [DEBUG] Orders query:', { where, limit, offset });

    const { rows, count } = await Order.findAndCountAll({
      where,
      include: [
        {
          model: Proposals,
          as: 'proposal',
          attributes: ['id', 'description', 'customerId']
        },
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name', 'email']
        },
        {
          model: UserGroup,
          as: 'ownerGroup',
          attributes: ['id', 'name']
        },
        {
          model: Manufacturer,
          as: 'manufacturer',
          attributes: ['id', 'name'],
          required: false // LEFT JOIN in case manufacturer is missing
        }
      ],
      // Order by acceptance time first, then created time, then id to stabilize ordering
      // Avoid ambiguous columns by not using COALESCE across joined tables
      order: [
        ['accepted_at', 'DESC'],
        ['createdAt', 'DESC'],
        ['id', 'DESC']
      ],
      limit,
      offset
    });

    console.log('✅ [DEBUG] Orders found:', {
      count: rows.length,
      totalCount: count,
      orders: rows.map(o => ({
        id: o.id,
        proposal_id: o.proposal_id,
        customer: o.customer?.name || o.proposal?.customerName || 'N/A',
        customerId: o.customer_id || o.proposal?.customerId,
        manufacturer: o.manufacturer?.name || 'Unknown',
        manufacturerId: o.manufacturer_id,
        status: o.status,
        accepted_at: o.accepted_at,
        description: o.proposal?.description || 'N/A'
      }))
    });

    res.status(200).json({
      success: true,
      data: rows,
      pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) }
    });
  } catch (err) {
    console.error('❌ [DEBUG] Error listing orders:', {
      error: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};// Get single order with snapshot
const getOrder = async (req, res) => {
  try {
    await ensureOrdersSchema();
    const { id } = req.params;
    const order = await Order.findByPk(id, {
      include: [
        { model: Proposals, as: 'proposal', attributes: ['id', 'description'] },
        { model: Customer, as: 'customer', attributes: ['id', 'name', 'email'] },
        { model: UserGroup, as: 'ownerGroup', attributes: ['id', 'name'] }
      ]
    });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // Visibility rules for single order
    const user = req.user;
    const role = (user?.role || '').toString().toLowerCase();
    const isAdmin = role === 'admin' || role === 'super_admin';
    const isContractor = !!(user?.group && ((user.group.group_type === 'contractor') || (user.group.type === 'contractor')));
    if (!isAdmin) {
      if (isContractor) {
        if (user?.group_id && order.owner_group_id && order.owner_group_id !== user.group_id) {
          return res.status(403).json({ success: false, message: 'Forbidden' });
        }
      } else {
        if (order.accepted_by_user_id && order.accepted_by_user_id !== user?.id) {
          return res.status(403).json({ success: false, message: 'Forbidden' });
        }
      }
    }

    res.status(200).json({ success: true, data: order });
  } catch (err) {
    console.error('Error fetching order:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  listOrders,
  getOrder,
  // Exported for reuse (e.g., accept flow ensures schema before creating orders)
  ensureOrdersSchema,
};
// Admin-only: delete an order and cascade related payments
const deleteOrder = async (req, res) => {
  try {
    await ensureOrdersSchema();
    const { id } = req.params;
    const order = await Order.findByPk(id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // Hard-delete order; associated payments are configured with ON DELETE CASCADE
    await order.destroy();
    return res.status(200).json({ success: true, message: 'Order deleted successfully' });
  } catch (err) {
    console.error('Error deleting order:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports.deleteOrder = deleteOrder;
