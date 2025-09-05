const { Order, Proposals, Customer, UserGroup } = require('../models');

// List orders, optionally mine=true for scoped view
const listOrders = async (req, res) => {
  try {
    const mineFlag = (req.query.mine || '').toString().toLowerCase() === 'true';
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    const where = {};
    if (mineFlag) {
      // For contractors, show orders where owner_group_id = user.group_id
      const user = req.user;
      if (user?.group_id) where.owner_group_id = user.group_id;
    }

    const { rows, count } = await Order.findAndCountAll({
      where,
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'name', 'email'] },
        { model: UserGroup, as: 'ownerGroup', attributes: ['id', 'name'] }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    res.status(200).json({
      success: true,
      data: rows,
      pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) }
    });
  } catch (err) {
    console.error('Error listing orders:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get single order with snapshot
const getOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findByPk(id, {
      include: [
        { model: Proposals, as: 'proposal', attributes: ['id', 'description'] },
        { model: Customer, as: 'customer', attributes: ['id', 'name', 'email'] },
        { model: UserGroup, as: 'ownerGroup', attributes: ['id', 'name'] }
      ]
    });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // Contractor scoping: ensure visibility
    const user = req.user;
    if (user?.group_id && order.owner_group_id && order.owner_group_id !== user.group_id) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    res.status(200).json({ success: true, data: order });
  } catch (err) {
    console.error('Error fetching order:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  listOrders,
  getOrder
};
