'use strict';

module.exports = {
  async up({ context: qi }) {
    // Helper to create table if missing
    async function ensureTable(name, define) {
      try {
        await qi.describeTable(name);
        // exists
      } catch (_) {
        await qi.createTable(name, define);
      }
    }

    // contact_info
    await ensureTable('contact_info', {
      id: { type: 'INTEGER', allowNull: false, primaryKey: true, autoIncrement: true },
      companyName: { type: 'VARCHAR(255)', allowNull: true },
      email: { type: 'VARCHAR(255)', allowNull: true },
      phone: { type: 'VARCHAR(255)', allowNull: true },
      address: { type: 'TEXT', allowNull: true },
      website: { type: 'VARCHAR(255)', allowNull: true },
      hours: { type: 'VARCHAR(255)', allowNull: true },
      socials: { type: qi.sequelize.getDialect() === 'mysql' ? 'JSON' : 'TEXT', allowNull: true },
      notes: { type: 'TEXT', allowNull: true },
      updated_by: { type: 'INTEGER', allowNull: true },
      showCompanyName: { type: 'TINYINT(1)', allowNull: false, defaultValue: 1 },
      showEmail: { type: 'TINYINT(1)', allowNull: false, defaultValue: 1 },
      showPhone: { type: 'TINYINT(1)', allowNull: false, defaultValue: 1 },
      showAddress: { type: 'TINYINT(1)', allowNull: false, defaultValue: 1 },
      showWebsite: { type: 'TINYINT(1)', allowNull: false, defaultValue: 1 },
      showHours: { type: 'TINYINT(1)', allowNull: false, defaultValue: 1 },
      showNotes: { type: 'TINYINT(1)', allowNull: false, defaultValue: 1 },
      createdAt: { type: 'DATETIME', allowNull: false, defaultValue: qi.sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: 'DATETIME', allowNull: false, defaultValue: qi.sequelize.literal('CURRENT_TIMESTAMP') },
    });

    // contact_threads
    await ensureTable('contact_threads', {
      id: { type: 'INTEGER', allowNull: false, primaryKey: true, autoIncrement: true },
      user_id: { type: 'INTEGER', allowNull: true },
      subject: { type: 'VARCHAR(255)', allowNull: false },
      status: { type: "ENUM('open','closed')", allowNull: false, defaultValue: 'open' },
      last_message_at: { type: 'DATETIME', allowNull: true },
      createdAt: { type: 'DATETIME', allowNull: false, defaultValue: qi.sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: 'DATETIME', allowNull: false, defaultValue: qi.sequelize.literal('CURRENT_TIMESTAMP') },
    });
    // Indexes
    try { await qi.addIndex('contact_threads', ['user_id']); } catch (_) {}
    try { await qi.addIndex('contact_threads', ['status']); } catch (_) {}
    try { await qi.addIndex('contact_threads', ['last_message_at']); } catch (_) {}

    // contact_messages
    await ensureTable('contact_messages', {
      id: { type: 'INTEGER', allowNull: false, primaryKey: true, autoIncrement: true },
      thread_id: { type: 'INTEGER', allowNull: false },
      author_user_id: { type: 'INTEGER', allowNull: true },
      is_admin: { type: 'TINYINT(1)', allowNull: false, defaultValue: 0 },
      body: { type: 'TEXT', allowNull: false },
      read_by_recipient: { type: 'TINYINT(1)', allowNull: false, defaultValue: 0 },
      read_at: { type: 'DATETIME', allowNull: true },
      createdAt: { type: 'DATETIME', allowNull: false, defaultValue: qi.sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: 'DATETIME', allowNull: false, defaultValue: qi.sequelize.literal('CURRENT_TIMESTAMP') },
    });
    try { await qi.addIndex('contact_messages', ['thread_id']); } catch (_) {}
    try { await qi.addIndex('contact_messages', ['createdAt']); } catch (_) {}

    // terms
    await ensureTable('terms', {
      id: { type: 'INTEGER', allowNull: false, primaryKey: true, autoIncrement: true },
      version: { type: 'INTEGER', allowNull: false },
      content: { type: 'LONGTEXT', allowNull: false },
      created_by_user_id: { type: 'INTEGER', allowNull: true },
      createdAt: { type: 'DATETIME', allowNull: false, defaultValue: qi.sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: 'DATETIME', allowNull: false, defaultValue: qi.sequelize.literal('CURRENT_TIMESTAMP') },
    });
    try { await qi.addIndex('terms', ['version'], { unique: true }); } catch (_) {}

    // terms_acceptances
    await ensureTable('terms_acceptances', {
      id: { type: 'INTEGER', allowNull: false, primaryKey: true, autoIncrement: true },
      user_id: { type: 'INTEGER', allowNull: false },
      terms_version: { type: 'INTEGER', allowNull: false },
      accepted_at: { type: 'DATETIME', allowNull: false, defaultValue: qi.sequelize.literal('CURRENT_TIMESTAMP') },
      createdAt: { type: 'DATETIME', allowNull: false, defaultValue: qi.sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: 'DATETIME', allowNull: false, defaultValue: qi.sequelize.literal('CURRENT_TIMESTAMP') },
    });
    try { await qi.addIndex('terms_acceptances', ['user_id', 'terms_version'], { unique: true }); } catch (_) {}
    try { await qi.addIndex('terms_acceptances', ['user_id']); } catch (_) {}
  },

  async down({ context: qi }) {
    // Non-destructive: don't drop tables by default to avoid data loss
    return Promise.resolve();
  }
};
