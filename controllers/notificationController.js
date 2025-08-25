const { Op } = require('sequelize');
const { Notification, User } = require('../models');

// Utility: get admin users to notify
async function getAdminUsers() {
  // Basic admin detection by role column. Adjust if you later add role mapping.
  const admins = await User.findAll({ where: { role: 'Admin', isDeleted: { [Op.not]: true } }, attributes: ['id', 'name', 'email'] });
  return admins;
}

// Utility: bulk create notifications for given user IDs
async function createNotificationsForUsers(userIds = [], notificationData = {}) {
  if (!Array.isArray(userIds) || userIds.length === 0) return [];
  const rows = userIds.map((uid) => ({
    recipient_user_id: uid,
    type: notificationData.type || 'system',
    title: notificationData.title || 'Notification',
    message: notificationData.message || '',
    payload: notificationData.payload || null,
    priority: notificationData.priority || 'medium',
    action_url: notificationData.action_url || null,
    created_by: notificationData.created_by || null,
  }));
  const created = await Notification.bulkCreate(rows);
  return created;
}

// GET /api/notifications
async function getNotifications(req, res) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const unreadOnly = req.query.unread_only === 'true';
    const readOnly = req.query.read_only === 'true';
    const typeFilter = req.query.type || null;

    const where = { recipient_user_id: user.id };
    if (unreadOnly) where.is_read = false;
    if (readOnly) where.is_read = true;
    if (typeFilter) where.type = typeFilter;

    const [rows, total, unreadCount] = await Promise.all([
      Notification.findAll({ where, order: [['created_at', 'DESC']], limit, offset }),
      Notification.count({ where: { recipient_user_id: user.id } }),
      Notification.count({ where: { recipient_user_id: user.id, is_read: false } }),
    ]);

    return res.json({
      success: true,
      data: rows,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (err) {
    console.error('getNotifications error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// GET /api/notifications/unread-count
async function getUnreadCount(req, res) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const unreadCount = await Notification.count({ where: { recipient_user_id: user.id, is_read: false } });
    return res.json({ success: true, unreadCount });
  } catch (err) {
    console.error('getUnreadCount error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// POST /api/notifications/:id/read
async function markAsRead(req, res) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const id = Number(req.params.id);
    const notification = await Notification.findOne({ where: { id, recipient_user_id: user.id } });
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
    if (!notification.is_read) {
      await notification.update({ is_read: true, read_at: new Date() });
    }
    return res.json({ success: true, id: notification.id });
  } catch (err) {
    console.error('markAsRead error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// POST /api/notifications/mark-all-read
async function markAllAsRead(req, res) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const [updated] = await Notification.update(
      { is_read: true, read_at: new Date() },
      { where: { recipient_user_id: user.id, is_read: false } }
    );
    return res.json({ success: true, updated });
  } catch (err) {
    console.error('markAllAsRead error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

module.exports = {
  // utilities used by eventManager
  getAdminUsers,
  createNotificationsForUsers,
  // API handlers
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
};
