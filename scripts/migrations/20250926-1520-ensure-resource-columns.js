'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const { DataTypes } = Sequelize;

    // resource_links: add descriptive columns if missing
    const links = await queryInterface.describeTable('resource_links').catch(() => null);
    if (links) {
      if (!links.description) {
        await queryInterface.addColumn('resource_links', 'description', { type: DataTypes.TEXT, allowNull: true });
      }
      if (!links.thumbnail_url) {
        await queryInterface.addColumn('resource_links', 'thumbnail_url', { type: DataTypes.STRING(512), allowNull: true });
      }
      if (!links.tags) {
        await queryInterface.addColumn('resource_links', 'tags', { type: DataTypes.JSON, allowNull: true });
      }
      if (!links.cta_label) {
        await queryInterface.addColumn('resource_links', 'cta_label', { type: DataTypes.STRING(120), allowNull: true });
      }
      if (!links.cta_url) {
        await queryInterface.addColumn('resource_links', 'cta_url', { type: DataTypes.STRING(512), allowNull: true });
      }
    }

    // resource_files: add description column if missing
    const files = await queryInterface.describeTable('resource_files').catch(() => null);
    if (files && !files.description) {
      await queryInterface.addColumn('resource_files', 'description', { type: DataTypes.TEXT, allowNull: true });
    }
  },

  async down(queryInterface, Sequelize) {
    // Idempotent safe down: remove columns if present
    const links = await queryInterface.describeTable('resource_links').catch(() => null);
    if (links) {
      if (links.description) {
        await queryInterface.removeColumn('resource_links', 'description');
      }
      if (links.thumbnail_url) {
        await queryInterface.removeColumn('resource_links', 'thumbnail_url');
      }
      if (links.tags) {
        await queryInterface.removeColumn('resource_links', 'tags');
      }
      if (links.cta_label) {
        await queryInterface.removeColumn('resource_links', 'cta_label');
      }
      if (links.cta_url) {
        await queryInterface.removeColumn('resource_links', 'cta_url');
      }
    }

    const files = await queryInterface.describeTable('resource_files').catch(() => null);
    if (files && files.description) {
      await queryInterface.removeColumn('resource_files', 'description');
    }
  }
};
