'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { DataTypes } = Sequelize;

    // Helper to create index if not exists
    async function ensureIndex(table, name, fields, options = {}) {
      const indexes = await queryInterface.showIndex(table).catch(() => []);
      const normalizedTarget = fields.map(f => String(f).toLowerCase()).join(',');
      const exists = indexes.some((idx) => {
        if (idx.name === name) return true;
        const idxFields = (idx.fields || []).map(f => String(f.attribute || f.columnName || f).toLowerCase()).join(',');
        return idxFields === normalizedTarget;
      });
      if (!exists) {
        await queryInterface.addIndex(table, fields, { name, ...options });
      }
    }

    // 1) resource_categories
    let resourceCategories = await queryInterface.describeTable('resource_categories').catch(() => null);
    if (!resourceCategories) {
      await queryInterface.createTable('resource_categories', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
        name: { type: DataTypes.STRING(120), allowNull: false },
        slug: { type: DataTypes.STRING(160), allowNull: false, unique: true },
        description: { type: DataTypes.TEXT, allowNull: true },
        color: { type: DataTypes.STRING(32), allowNull: true },
        icon: { type: DataTypes.STRING(64), allowNull: true },
        parent_id: { type: DataTypes.INTEGER, allowNull: true },
        sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
        is_pinned: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        pinned_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        thumbnail_url: { type: DataTypes.STRING(512), allowNull: true },
        metadata: { type: DataTypes.JSON, allowNull: true },
        created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      });
      resourceCategories = await queryInterface.describeTable('resource_categories');
    }
    await ensureIndex('resource_categories', 'resource_categories_parent_idx', ['parent_id']);
    await ensureIndex('resource_categories', 'resource_categories_slug_idx', ['slug'], { unique: true });
    await ensureIndex('resource_categories', 'resource_categories_pinned_idx', ['is_pinned', 'pinned_order']);

    // 2) resource_links
    let resourceLinks = await queryInterface.describeTable('resource_links').catch(() => null);
    if (!resourceLinks) {
      await queryInterface.createTable('resource_links', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
        title: { type: DataTypes.STRING, allowNull: false },
        url: { type: DataTypes.STRING, allowNull: false },
        type: { type: DataTypes.STRING, allowNull: false },
        description: { type: DataTypes.TEXT, allowNull: true },
        category_id: { type: DataTypes.INTEGER, allowNull: true },
        thumbnail_url: { type: DataTypes.STRING(512), allowNull: true },
        is_pinned: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        pinned_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        tags: { type: DataTypes.JSON, allowNull: true },
        cta_label: { type: DataTypes.STRING(120), allowNull: true },
        cta_url: { type: DataTypes.STRING(512), allowNull: true },
        status: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'active' },
        metadata: { type: DataTypes.JSON, allowNull: true },
        visible_to_group_types: { type: DataTypes.JSON, allowNull: true },
        visible_to_group_ids: { type: DataTypes.JSON, allowNull: true },
        created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      });
      resourceLinks = await queryInterface.describeTable('resource_links');
    }
    await ensureIndex('resource_links', 'resource_links_category_idx', ['category_id']);
    await ensureIndex('resource_links', 'resource_links_pinned_idx', ['is_pinned', 'pinned_order']);

    // 3) resource_files
    let resourceFiles = await queryInterface.describeTable('resource_files').catch(() => null);
    if (!resourceFiles) {
      await queryInterface.createTable('resource_files', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
        name: { type: DataTypes.STRING, allowNull: false },
        original_name: { type: DataTypes.STRING, allowNull: false },
        description: { type: DataTypes.TEXT, allowNull: true },
        file_path: { type: DataTypes.STRING, allowNull: false },
        file_size: { type: DataTypes.BIGINT, allowNull: false },
        file_type: { type: DataTypes.STRING, allowNull: true },
        mime_type: { type: DataTypes.STRING, allowNull: true },
        status: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'active' },
        category_id: { type: DataTypes.INTEGER, allowNull: true },
        thumbnail_url: { type: DataTypes.STRING(512), allowNull: true },
        is_pinned: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        pinned_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        tags: { type: DataTypes.JSON, allowNull: true },
        cta_label: { type: DataTypes.STRING(120), allowNull: true },
        cta_url: { type: DataTypes.STRING(512), allowNull: true },
        metadata: { type: DataTypes.JSON, allowNull: true },
        is_deleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        file_category: { type: DataTypes.STRING, allowNull: true },
        visible_to_group_types: { type: DataTypes.JSON, allowNull: true },
        visible_to_group_ids: { type: DataTypes.JSON, allowNull: true },
        created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      });
      resourceFiles = await queryInterface.describeTable('resource_files');
    }
    await ensureIndex('resource_files', 'resource_files_category_idx', ['category_id']);
    await ensureIndex('resource_files', 'resource_files_pinned_idx', ['is_pinned', 'pinned_order']);

    // 4) resource_announcements
    let resourceAnnouncements = await queryInterface.describeTable('resource_announcements').catch(() => null);
    if (!resourceAnnouncements) {
      await queryInterface.createTable('resource_announcements', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
        title: { type: DataTypes.STRING(180), allowNull: false },
        summary: { type: DataTypes.STRING(280), allowNull: true },
        body: { type: DataTypes.TEXT('long'), allowNull: true },
        category_id: { type: DataTypes.INTEGER, allowNull: true },
        is_pinned: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        pinned_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        publish_at: { type: DataTypes.DATE, allowNull: true },
        expire_at: { type: DataTypes.DATE, allowNull: true },
        cta_label: { type: DataTypes.STRING(120), allowNull: true },
        cta_url: { type: DataTypes.STRING(512), allowNull: true },
        status: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'published' },
        visible_to_group_types: { type: DataTypes.JSON, allowNull: true },
        visible_to_group_ids: { type: DataTypes.JSON, allowNull: true },
        metadata: { type: DataTypes.JSON, allowNull: true },
        created_by: { type: DataTypes.INTEGER, allowNull: true },
        updated_by: { type: DataTypes.INTEGER, allowNull: true },
        created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      });
      resourceAnnouncements = await queryInterface.describeTable('resource_announcements');
    }
    await ensureIndex('resource_announcements', 'resource_announcements_category_idx', ['category_id']);
    await ensureIndex('resource_announcements', 'resource_announcements_pinned_idx', ['is_pinned', 'pinned_order']);
    await ensureIndex('resource_announcements', 'resource_announcements_status_idx', ['status']);
    await ensureIndex('resource_announcements', 'resource_announcements_publish_idx', ['publish_at']);
  },

  down: async (queryInterface /*, Sequelize */) => {
    // Safe no-op: do not drop tables automatically in down to avoid accidental data loss
    // This migration is an "ensure" pass. If you need to rollback, handle manually.
    return Promise.resolve();
  },
};
