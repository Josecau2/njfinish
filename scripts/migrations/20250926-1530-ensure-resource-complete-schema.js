'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const { DataTypes } = Sequelize;

    // Helper to add column if missing
    async function addColIfMissing(tableName, tableDesc, colName, colDef) {
      if (!tableDesc[colName]) {
        await queryInterface.addColumn(tableName, colName, colDef);
      }
    }

    // resource_categories
    let cat = await queryInterface.describeTable('resource_categories').catch(() => null);
    if (cat) {
      await addColIfMissing('resource_categories', cat, 'name', { type: DataTypes.STRING(120), allowNull: false });
      await addColIfMissing('resource_categories', cat, 'slug', { type: DataTypes.STRING(160), allowNull: false });
      await addColIfMissing('resource_categories', cat, 'description', { type: DataTypes.TEXT, allowNull: true });
      await addColIfMissing('resource_categories', cat, 'color', { type: DataTypes.STRING(32), allowNull: true });
      await addColIfMissing('resource_categories', cat, 'icon', { type: DataTypes.STRING(64), allowNull: true });
      await addColIfMissing('resource_categories', cat, 'parent_id', { type: DataTypes.INTEGER, allowNull: true });
      await addColIfMissing('resource_categories', cat, 'sort_order', { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 });
      await addColIfMissing('resource_categories', cat, 'is_active', { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true });
      await addColIfMissing('resource_categories', cat, 'is_pinned', { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false });
      await addColIfMissing('resource_categories', cat, 'pinned_order', { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 });
      await addColIfMissing('resource_categories', cat, 'thumbnail_url', { type: DataTypes.STRING(512), allowNull: true });
      await addColIfMissing('resource_categories', cat, 'metadata', { type: DataTypes.JSON, allowNull: true });
      await addColIfMissing('resource_categories', cat, 'created_at', { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW });
      await addColIfMissing('resource_categories', cat, 'updated_at', { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW });
    }

    // resource_links
    let links = await queryInterface.describeTable('resource_links').catch(() => null);
    if (links) {
      await addColIfMissing('resource_links', links, 'title', { type: DataTypes.STRING, allowNull: false });
      await addColIfMissing('resource_links', links, 'url', { type: DataTypes.STRING, allowNull: false });
      await addColIfMissing('resource_links', links, 'type', { type: DataTypes.STRING, allowNull: false });
      await addColIfMissing('resource_links', links, 'description', { type: DataTypes.TEXT, allowNull: true });
      await addColIfMissing('resource_links', links, 'category_id', { type: DataTypes.INTEGER, allowNull: true });
      await addColIfMissing('resource_links', links, 'thumbnail_url', { type: DataTypes.STRING(512), allowNull: true });
      await addColIfMissing('resource_links', links, 'is_pinned', { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false });
      await addColIfMissing('resource_links', links, 'pinned_order', { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 });
      await addColIfMissing('resource_links', links, 'tags', { type: DataTypes.JSON, allowNull: true });
      await addColIfMissing('resource_links', links, 'cta_label', { type: DataTypes.STRING(120), allowNull: true });
      await addColIfMissing('resource_links', links, 'cta_url', { type: DataTypes.STRING(512), allowNull: true });
      await addColIfMissing('resource_links', links, 'status', { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'active' });
      await addColIfMissing('resource_links', links, 'metadata', { type: DataTypes.JSON, allowNull: true });
      await addColIfMissing('resource_links', links, 'visible_to_group_types', { type: DataTypes.JSON, allowNull: true });
      await addColIfMissing('resource_links', links, 'visible_to_group_ids', { type: DataTypes.JSON, allowNull: true });
      await addColIfMissing('resource_links', links, 'created_at', { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW });
      await addColIfMissing('resource_links', links, 'updated_at', { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW });
    }

    // resource_files
    let files = await queryInterface.describeTable('resource_files').catch(() => null);
    if (files) {
      await addColIfMissing('resource_files', files, 'name', { type: DataTypes.STRING, allowNull: false });
      await addColIfMissing('resource_files', files, 'original_name', { type: DataTypes.STRING, allowNull: false });
      await addColIfMissing('resource_files', files, 'description', { type: DataTypes.TEXT, allowNull: true });
      await addColIfMissing('resource_files', files, 'file_path', { type: DataTypes.STRING, allowNull: false });
      await addColIfMissing('resource_files', files, 'file_size', { type: DataTypes.BIGINT, allowNull: false });
      await addColIfMissing('resource_files', files, 'file_type', { type: DataTypes.STRING, allowNull: true });
      await addColIfMissing('resource_files', files, 'mime_type', { type: DataTypes.STRING, allowNull: true });
      await addColIfMissing('resource_files', files, 'status', { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'active' });
      await addColIfMissing('resource_files', files, 'category_id', { type: DataTypes.INTEGER, allowNull: true });
      await addColIfMissing('resource_files', files, 'thumbnail_url', { type: DataTypes.STRING(512), allowNull: true });
      await addColIfMissing('resource_files', files, 'is_pinned', { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false });
      await addColIfMissing('resource_files', files, 'pinned_order', { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 });
      await addColIfMissing('resource_files', files, 'tags', { type: DataTypes.JSON, allowNull: true });
      await addColIfMissing('resource_files', files, 'cta_label', { type: DataTypes.STRING(120), allowNull: true });
      await addColIfMissing('resource_files', files, 'cta_url', { type: DataTypes.STRING(512), allowNull: true });
      await addColIfMissing('resource_files', files, 'metadata', { type: DataTypes.JSON, allowNull: true });
      await addColIfMissing('resource_files', files, 'is_deleted', { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false });
      await addColIfMissing('resource_files', files, 'file_category', { type: DataTypes.STRING, allowNull: true });
      await addColIfMissing('resource_files', files, 'visible_to_group_types', { type: DataTypes.JSON, allowNull: true });
      await addColIfMissing('resource_files', files, 'visible_to_group_ids', { type: DataTypes.JSON, allowNull: true });
      await addColIfMissing('resource_files', files, 'created_at', { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW });
      await addColIfMissing('resource_files', files, 'updated_at', { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW });
    }

    // resource_announcements
    let ann = await queryInterface.describeTable('resource_announcements').catch(() => null);
    if (ann) {
      await addColIfMissing('resource_announcements', ann, 'title', { type: DataTypes.STRING(180), allowNull: false });
      await addColIfMissing('resource_announcements', ann, 'summary', { type: DataTypes.STRING(280), allowNull: true });
      await addColIfMissing('resource_announcements', ann, 'body', { type: DataTypes.TEXT('long'), allowNull: true });
      await addColIfMissing('resource_announcements', ann, 'category_id', { type: DataTypes.INTEGER, allowNull: true });
      await addColIfMissing('resource_announcements', ann, 'is_pinned', { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false });
      await addColIfMissing('resource_announcements', ann, 'pinned_order', { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 });
      await addColIfMissing('resource_announcements', ann, 'publish_at', { type: DataTypes.DATE, allowNull: true });
      await addColIfMissing('resource_announcements', ann, 'expire_at', { type: DataTypes.DATE, allowNull: true });
      await addColIfMissing('resource_announcements', ann, 'cta_label', { type: DataTypes.STRING(120), allowNull: true });
      await addColIfMissing('resource_announcements', ann, 'cta_url', { type: DataTypes.STRING(512), allowNull: true });
      await addColIfMissing('resource_announcements', ann, 'status', { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'published' });
      await addColIfMissing('resource_announcements', ann, 'visible_to_group_types', { type: DataTypes.JSON, allowNull: true });
      await addColIfMissing('resource_announcements', ann, 'visible_to_group_ids', { type: DataTypes.JSON, allowNull: true });
      await addColIfMissing('resource_announcements', ann, 'metadata', { type: DataTypes.JSON, allowNull: true });
      await addColIfMissing('resource_announcements', ann, 'created_by', { type: DataTypes.INTEGER, allowNull: true });
      await addColIfMissing('resource_announcements', ann, 'updated_by', { type: DataTypes.INTEGER, allowNull: true });
      await addColIfMissing('resource_announcements', ann, 'created_at', { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW });
      await addColIfMissing('resource_announcements', ann, 'updated_at', { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW });
    }
  },

  async down(queryInterface, Sequelize) {
    // No destructive rollback; this migration only ensures presence.
    return Promise.resolve();
  },
};
