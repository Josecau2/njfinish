const { Op, literal } = require('sequelize');
const { ContactInfo, ContactThread, ContactMessage, User } = require('../models');
const env = require('../config/env');
const notificationController = require('./notificationController');

// Helpers to detect common schema errors
function isMissingTableError(err) {
  const code = err?.original?.code || err?.parent?.code;
  const msg = String(err?.message || '').toLowerCase();
  return code === 'ER_NO_SUCH_TABLE' || msg.includes('no such table') || msg.includes("doesn't exist");
}
function isUnknownColumnError(err) {
  const code = err?.original?.code || err?.parent?.code;
  const msg = String(err?.message || '').toLowerCase();
  const sql = String(err?.sql || '').toLowerCase();
  // ER_BAD_FIELD_ERROR can mean missing table (when referencing table.column) or missing column
  return code === 'ER_BAD_FIELD_ERROR' || msg.includes('unknown column') || 
         (sql.includes('contact_threads') || sql.includes('contact_messages') || sql.includes('contact_info'));
}

// Ensure tables exist at first use (cheap when already present)
let ensured = { info: false, thread: false, message: false };
async function ensureContactInfo() {
  if (ensured.info) return;
  try {
    if (env.DB_RUNTIME_ALTER) {
      await ContactInfo.sync({ alter: true });
    } else {
      await ContactInfo.sync(); // create if missing only
    }
    ensured.info = true;
  } catch (e) {
    console.warn('ContactInfo.sync failed:', e.message);
  }
}
async function ensureContactThread() {
  if (ensured.thread) return;
  try {
    if (env.DB_RUNTIME_ALTER) {
      await ContactThread.sync({ alter: true });
    } else {
      await ContactThread.sync();
    }
    ensured.thread = true;
  } catch (e) { console.warn('ContactThread.sync failed:', e.message); }
}
async function ensureContactMessage() {
  if (ensured.message) return;
  try {
    if (env.DB_RUNTIME_ALTER) {
      await ContactMessage.sync({ alter: true });
    } else {
      await ContactMessage.sync();
    }
    ensured.message = true;
  } catch (e) { console.warn('ContactMessage.sync failed:', e.message); }
}

// Contact Info
async function getContactInfo(req, res) {
  try {
    await ensureContactInfo();
    const info = await ContactInfo.findOne({ order: [['updatedAt', 'DESC']] });
    return res.json({ success: true, data: info });
  } catch (err) {
    console.error('getContactInfo error:', err);
    // Auto-create table if missing to avoid blocking UI
    if (isMissingTableError(err)) {
      try {
        await ContactInfo.sync();
        return res.json({ success: true, data: null });
      } catch (e) {
        console.error('ContactInfo.sync() failed:', e);
      }
    } else if (isUnknownColumnError(err)) {
      // Attempt to auto-migrate missing columns once
      try {
        if (env.DB_RUNTIME_ALTER) {
          await ContactInfo.sync({ alter: true });
        } else {
          // In production without runtime alter, respond empty and rely on migrations
          return res.json({ success: true, data: null });
        }
        const info = await ContactInfo.findOne({ order: [['updatedAt', 'DESC']] });
        return res.json({ success: true, data: info });
      } catch (e) {
        console.error('ContactInfo.sync({alter:true}) failed:', e);
      }
    }
  // Fallback to a benign empty response so the UI can still merge PDF config
  return res.json({ success: true, data: null });
  }
}

async function saveContactInfo(req, res) {
  try {
    const body = req.body || {};
    let info = await ContactInfo.findOne();
    if (info) {
      await info.update({ ...body, updated_by: req.user?.id || null });
    } else {
      info = await ContactInfo.create({ ...body, updated_by: req.user?.id || null });
    }
    return res.json({ success: true, data: info });
  } catch (err) {
    console.error('saveContactInfo error:', err);
    if (isMissingTableError(err)) {
      try {
        await ContactInfo.sync();
        // retry once
        const body = req.body || {};
        let info = await ContactInfo.findOne();
        if (info) {
          await info.update({ ...body, updated_by: req.user?.id || null });
        } else {
          info = await ContactInfo.create({ ...body, updated_by: req.user?.id || null });
        }
        return res.json({ success: true, data: info });
      } catch (e) {
        console.error('ContactInfo.sync() + retry failed:', e);
      }
    } else if (isUnknownColumnError(err)) {
      try {
        if (env.DB_RUNTIME_ALTER) {
          await ContactInfo.sync({ alter: true });
        } else {
          return res.status(503).json({ success: false, message: 'Schema update required. Please run migrations.' });
        }
        const body = req.body || {};
        let info = await ContactInfo.findOne();
        if (info) {
          await info.update({ ...body, updated_by: req.user?.id || null });
        } else {
          info = await ContactInfo.create({ ...body, updated_by: req.user?.id || null });
        }
        return res.json({ success: true, data: info });
      } catch (e) {
        console.error('ContactInfo alter + retry failed:', e);
      }
    }
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// Threads
function isAdmin(user) { return user && (user.role === 'Admin' || user.group_id === 1); }

async function createThread(req, res) {
  try {
  await Promise.all([ensureContactThread(), ensureContactMessage()]);
    const user = req.user;
    const { subject, message } = req.body;
    if (!subject || !message) return res.status(400).json({ success: false, message: 'Subject and message are required' });
    const thread = await ContactThread.create({ user_id: user.id, subject, status: 'open', last_message_at: new Date() });
    await ContactMessage.create({ thread_id: thread.id, author_user_id: user.id, is_admin: false, body: message });

    // Notify admins
    try {
      const admins = await notificationController.getAdminUsers();
      const adminIds = admins.map(a => a.id);
      if (adminIds.length) {
        await notificationController.createNotificationsForUsers(adminIds, {
          type: 'contact.message',
          title: 'New contact message',
          message: `${user.name || 'User'}: ${subject}`,
          payload: { threadId: thread.id },
          priority: 'high',
          action_url: `/contact`
        });
      }
    } catch (e) { console.warn('Notify admins failed:', e.message); }

    return res.json({ success: true, data: { threadId: thread.id } });
  } catch (err) {
    console.error('createThread error:', err);
    if (isMissingTableError(err) || isUnknownColumnError(err)) {
      try {
        if (isMissingTableError(err)) {
          await ContactThread.sync();
          await ContactMessage.sync();
        } else if (env.DB_RUNTIME_ALTER) {
          await ContactThread.sync({ alter: true });
          await ContactMessage.sync({ alter: true });
        } else {
          return res.status(503).json({ success: false, message: 'Schema update required. Please run migrations.' });
        }
        return res.status(400).json({ success: false, message: 'Messaging is initializing, please retry' });
      } catch (e) {
        console.error('Auto-fix createThread failed:', e);
      }
    }
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

async function listThreads(req, res) {
  try {
  await Promise.all([ensureContactThread(), ensureContactMessage()]);
    const user = req.user;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const status = req.query.status;
    const q = (req.query.q || '').trim();
    const userIdFilter = Number(req.query.userId) || null;

    const where = {};
    if (!isAdmin(user)) {
      where.user_id = user.id; // user sees own
    } else if (userIdFilter) {
      // Admin can filter by specific user
      where.user_id = userIdFilter;
    }
    if (status) where.status = status;
    if (q) where.subject = { [Op.like]: `%${q}%` };

  // Debug removed or gated

    // Compute unread counts relative to the viewer
    const unreadExpr = isAdmin(user)
      ? `(SELECT COUNT(*) FROM contact_messages cm WHERE cm.thread_id = ContactThread.id AND cm.is_admin = 0 AND cm.read_by_recipient = 0)`
      : `(SELECT COUNT(*) FROM contact_messages cm WHERE cm.thread_id = ContactThread.id AND cm.is_admin = 1 AND cm.read_by_recipient = 0)`;

  // Debug removed or gated

    const [rows, total] = await Promise.all([
      ContactThread.findAll({
        where,
        include: isAdmin(user) ? [{ model: User, as: 'owner', attributes: ['id', 'name'] }] : [],
        order: [['last_message_at', 'DESC']],
        limit,
        offset,
      }),
      ContactThread.count({ where })
    ]);

  // Debug removed or gated

    // Add unreadCount as 0 for now to not break the frontend
    const rowsWithUnread = rows.map(row => ({
      ...row.toJSON(),
      unreadCount: 0
    }));

    return res.json({ success: true, data: rowsWithUnread, pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total/limit)) } });
  } catch (err) {
    console.error('listThreads error:', err);
    if (isMissingTableError(err) || isUnknownColumnError(err)) {
      try {
        // Try to fix schema issues automatically
        if (isMissingTableError(err)) {
          await ContactThread.sync();
          await ContactMessage.sync();
        } else if (env.DB_RUNTIME_ALTER) {
          await ContactThread.sync({ alter: true });
          await ContactMessage.sync({ alter: true });
        } else {
          return res.json({ success: true, data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 1 } });
        }
        // Return an empty page so UI can load
        return res.json({ success: true, data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 1 } });
      } catch (e) {
        console.error('Auto-fix contact thread/message tables failed:', e);
      }
    }
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

async function getThread(req, res) {
  try {
    await Promise.all([ensureContactThread(), ensureContactMessage()]);
    const user = req.user;
    const id = Number(req.params.id);
    const thread = await ContactThread.findByPk(id, {
      include: [
        { model: ContactMessage, as: 'messages', include: [{ model: User, as: 'author', attributes: ['id','name'] }], order: [['createdAt','ASC']] },
        { model: User, as: 'owner', attributes: ['id','name'] },
      ]
    });
    if (!thread) return res.status(404).json({ success: false, message: 'Thread not found' });
    if (!isAdmin(user) && thread.user_id !== user.id) return res.status(403).json({ success: false, message: 'Forbidden' });
    return res.json({ success: true, data: thread });
  } catch (err) {
    console.error('getThread error:', err);
    if (isMissingTableError(err) || isUnknownColumnError(err)) {
      try {
        if (isMissingTableError(err)) {
          await ContactThread.sync();
          await ContactMessage.sync();
        } else if (env.DB_RUNTIME_ALTER) {
          await ContactThread.sync({ alter: true });
          await ContactMessage.sync({ alter: true });
        }
        return res.status(404).json({ success: false, message: 'Thread not found' });
      } catch (e) {
        console.error('Auto-fix getThread failed:', e);
      }
    }
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

async function postMessage(req, res) {
  try {
  await Promise.all([ensureContactThread(), ensureContactMessage()]);
    const user = req.user;
    const id = Number(req.params.id);
    const { body } = req.body;
    if (!body) return res.status(400).json({ success: false, message: 'Message body is required' });
    const thread = await ContactThread.findByPk(id);
    if (!thread) return res.status(404).json({ success: false, message: 'Thread not found' });
    if (!isAdmin(user) && thread.user_id !== user.id) return res.status(403).json({ success: false, message: 'Forbidden' });

    const isAdminAuthor = isAdmin(user);
    const msg = await ContactMessage.create({ thread_id: id, author_user_id: user.id, is_admin: isAdminAuthor, body });
    await thread.update({ last_message_at: new Date(), status: 'open' });

    // Notify recipient
    try {
      if (isAdminAuthor && thread.user_id) {
        // notify the user
        await notificationController.createNotificationsForUsers([thread.user_id], {
          type: 'contact.reply', title: 'We replied to your message', message: body.slice(0, 120), payload: { threadId: id }, priority: 'medium', action_url: `/contact`
        });
      } else if (!isAdminAuthor) {
        // notify admins
        const admins = await notificationController.getAdminUsers();
        const adminIds = admins.map(a => a.id);
        if (adminIds.length) {
          await notificationController.createNotificationsForUsers(adminIds, {
            type: 'contact.message', title: 'New contact message', message: body.slice(0, 120), payload: { threadId: id }, priority: 'high', action_url: `/contact`
          });
        }
      }
    } catch (e) { console.warn('Notify recipient failed:', e.message); }

    return res.json({ success: true, data: msg });
  } catch (err) {
    console.error('postMessage error:', err);
    if (isMissingTableError(err) || isUnknownColumnError(err)) {
      try {
        if (isMissingTableError(err)) {
          await ContactThread.sync();
          await ContactMessage.sync();
        } else if (env.DB_RUNTIME_ALTER) {
          await ContactThread.sync({ alter: true });
          await ContactMessage.sync({ alter: true });
        } else {
          return res.status(503).json({ success: false, message: 'Schema update required. Please run migrations.' });
        }
        return res.status(400).json({ success: false, message: 'Messaging is initializing, please retry' });
      } catch (e) {
        console.error('Auto-fix postMessage failed:', e);
      }
    }
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

async function markRead(req, res) {
  try {
  await Promise.all([ensureContactThread(), ensureContactMessage()]);
    const user = req.user;
    const id = Number(req.params.id);
    const thread = await ContactThread.findByPk(id);
    if (!thread) return res.status(404).json({ success: false, message: 'Thread not found' });
    if (!isAdmin(user) && thread.user_id !== user.id) return res.status(403).json({ success: false, message: 'Forbidden' });

    const isAdminReader = isAdmin(user);
    await ContactMessage.update(
      { read_by_recipient: true, read_at: new Date() },
      {
        where: {
          thread_id: id,
          is_admin: { [Op.ne]: isAdminReader }, // messages from the other side
          read_by_recipient: false,
        }
      }
    );
    return res.json({ success: true });
  } catch (err) {
    console.error('markRead error:', err);
    if (isMissingTableError(err) || isUnknownColumnError(err)) {
      try {
        if (isMissingTableError(err)) {
          await ContactThread.sync();
          await ContactMessage.sync();
        } else if (env.DB_RUNTIME_ALTER) {
          await ContactThread.sync({ alter: true });
          await ContactMessage.sync({ alter: true });
        } else {
          return res.json({ success: true });
        }
        return res.json({ success: true });
      } catch (e) {
        console.error('Auto-fix markRead failed:', e);
      }
    }
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

async function closeThread(req, res) {
  try {
    await ensureContactThread();
    const user = req.user;
    const id = Number(req.params.id);
    const thread = await ContactThread.findByPk(id);
    if (!thread) return res.status(404).json({ success: false, message: 'Thread not found' });
    if (!isAdmin(user) && thread.user_id !== user.id) return res.status(403).json({ success: false, message: 'Forbidden' });
    await thread.update({ status: 'closed' });
    return res.json({ success: true, data: thread });
  } catch (err) {
    console.error('closeThread error:', err);
    if (isMissingTableError(err) || isUnknownColumnError(err)) {
      try {
        if (isMissingTableError(err)) {
          await ContactThread.sync();
        } else if (env.DB_RUNTIME_ALTER) {
          await ContactThread.sync({ alter: true });
        }
        return res.status(404).json({ success: false, message: 'Thread not found' });
      } catch (e) {
        console.error('Auto-fix closeThread failed:', e);
      }
    }
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

module.exports = {
  getContactInfo,
  saveContactInfo,
  createThread,
  listThreads,
  getThread,
  postMessage,
  markRead,
  closeThread,
};
