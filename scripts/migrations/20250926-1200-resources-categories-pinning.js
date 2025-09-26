'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { DataTypes } = Sequelize;

    const ensureIndex = async (tableName, indexName, fields, options = {}) => {
      const indexes = await queryInterface.showIndex(tableName).catch(() => []);
      if (!indexes.some((idx) => idx.name === indexName)) {
        await queryInterface.addIndex(tableName, fields, { name: indexName, ...options });
      }
    };

    const ensureColumn = async (tableName, tableDefinition, columnName, definition) => {
      if (!tableDefinition[columnName]) {
        await queryInterface.addColumn(tableName, columnName, definition);
        tableDefinition[columnName] = definition;
      }
    };

    // Resource Categories table (create or extend)
    let resourceCategories = await queryInterface.describeTable('resource_categories').catch(() => null);
    if (!resourceCategories) {
      await queryInterface.createTable('resource_categories', {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        name: {
          type: DataTypes.STRING(120),
          allowNull: false,
        },
        slug: {
          type: DataTypes.STRING(160),
          allowNull: false,
          unique: true,
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        color: {
          type: DataTypes.STRING(32),
          allowNull: true,
        },
        icon: {
          type: DataTypes.STRING(64),
          allowNull: true,
        },
        parent_id: {
          type: DataTypes.INTEGER,
          allowNull: true,
          references: {
            model: 'resource_categories',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        sort_order: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        is_active: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
        is_pinned: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        pinned_order: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        thumbnail_url: {
          type: DataTypes.STRING(512),
          allowNull: true,
        },
        metadata: {
          type: DataTypes.JSON,
          allowNull: true,
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        updated_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
      });
      resourceCategories = await queryInterface.describeTable('resource_categories');
    } else {
      await ensureColumn('resource_categories', resourceCategories, 'color', {
        type: DataTypes.STRING(32),
        allowNull: true,
      });
      await ensureColumn('resource_categories', resourceCategories, 'icon', {
        type: DataTypes.STRING(64),
        allowNull: true,
      });
      await ensureColumn('resource_categories', resourceCategories, 'is_active', {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      });
      await ensureColumn('resource_categories', resourceCategories, 'is_pinned', {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });
      await ensureColumn('resource_categories', resourceCategories, 'pinned_order', {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      });
      await ensureColumn('resource_categories', resourceCategories, 'thumbnail_url', {
        type: DataTypes.STRING(512),
        allowNull: true,
      });
      await ensureColumn('resource_categories', resourceCategories, 'metadata', {
        type: DataTypes.JSON,
        allowNull: true,
      });
    }

    await ensureIndex('resource_categories', 'resource_categories_parent_idx', ['parent_id']);
    await ensureIndex('resource_categories', 'resource_categories_slug_idx', ['slug'], { unique: true });
    await ensureIndex('resource_categories', 'resource_categories_pinned_idx', ['is_pinned', 'pinned_order']);

    // Resource Links (create or extend)
    let resourceLinks = await queryInterface.describeTable('resource_links').catch(() => null);
    if (!resourceLinks) {
      await queryInterface.createTable('resource_links', {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        title: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        url: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        type: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        category_id: {
          type: DataTypes.INTEGER,
          allowNull: true,
          references: { model: 'resource_categories', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        thumbnail_url: {
          type: DataTypes.STRING(512),
          allowNull: true,
        },
        is_pinned: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        pinned_order: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        tags: {
          type: DataTypes.JSON,
          allowNull: true,
        },
        cta_label: {
          type: DataTypes.STRING(120),
          allowNull: true,
        },
        cta_url: {
          type: DataTypes.STRING(512),
          allowNull: true,
        },
        status: {
          type: DataTypes.STRING(32),
          allowNull: false,
          defaultValue: 'active',
        },
        metadata: {
          type: DataTypes.JSON,
          allowNull: true,
        },
        visible_to_group_types: {
          type: DataTypes.JSON,
          allowNull: true,
          defaultValue: JSON.stringify(['admin']),
        },
        visible_to_group_ids: {
          type: DataTypes.JSON,
          allowNull: true,
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        updated_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
      });
      resourceLinks = await queryInterface.describeTable('resource_links');
    }
    await ensureColumn('resource_links', resourceLinks, 'description', {
      type: DataTypes.TEXT,
      allowNull: true,
    });
    await ensureColumn('resource_links', resourceLinks, 'category_id', {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'resource_categories',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await ensureColumn('resource_links', resourceLinks, 'thumbnail_url', {
      type: DataTypes.STRING(512),
      allowNull: true,
    });
    await ensureColumn('resource_links', resourceLinks, 'is_pinned', {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await ensureColumn('resource_links', resourceLinks, 'pinned_order', {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
    await ensureColumn('resource_links', resourceLinks, 'tags', {
      type: DataTypes.JSON,
      allowNull: true,
    });
    await ensureColumn('resource_links', resourceLinks, 'cta_label', {
      type: DataTypes.STRING(120),
      allowNull: true,
    });
    await ensureColumn('resource_links', resourceLinks, 'cta_url', {
      type: DataTypes.STRING(512),
      allowNull: true,
    });
    await ensureColumn('resource_links', resourceLinks, 'status', {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: 'active',
    });
    await ensureColumn('resource_links', resourceLinks, 'metadata', {
      type: DataTypes.JSON,
      allowNull: true,
    });
    await ensureColumn('resource_links', resourceLinks, 'visible_to_group_types', {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: ['admin'],
    });
    await ensureColumn('resource_links', resourceLinks, 'visible_to_group_ids', {
      type: DataTypes.JSON,
      allowNull: true,
    });
    // Timestamps (if table pre-existed without underscored timestamps)
    await ensureColumn('resource_links', resourceLinks, 'created_at', {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    });
    await ensureColumn('resource_links', resourceLinks, 'updated_at', {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    });

    await ensureIndex('resource_links', 'resource_links_category_idx', ['category_id']);
    await ensureIndex('resource_links', 'resource_links_pinned_idx', ['is_pinned', 'pinned_order']);

    // Resource Files (create or extend)
    let resourceFiles = await queryInterface.describeTable('resource_files').catch(() => null);
    if (!resourceFiles) {
      await queryInterface.createTable('resource_files', {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        original_name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        file_path: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        file_size: {
          type: DataTypes.BIGINT,
          allowNull: false,
        },
        file_type: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        mime_type: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        status: {
          type: DataTypes.STRING(32),
          allowNull: false,
          defaultValue: 'active',
        },
        category_id: {
          type: DataTypes.INTEGER,
          allowNull: true,
          references: { model: 'resource_categories', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        thumbnail_url: {
          type: DataTypes.STRING(512),
          allowNull: true,
        },
        is_pinned: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        pinned_order: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        tags: {
          type: DataTypes.JSON,
          allowNull: true,
        },
        cta_label: {
          type: DataTypes.STRING(120),
          allowNull: true,
        },
        cta_url: {
          type: DataTypes.STRING(512),
          allowNull: true,
        },
        metadata: {
          type: DataTypes.JSON,
          allowNull: true,
        },
        is_deleted: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        file_category: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        visible_to_group_types: {
          type: DataTypes.JSON,
          allowNull: true,
          defaultValue: JSON.stringify(['admin']),
        },
        visible_to_group_ids: {
          type: DataTypes.JSON,
          allowNull: true,
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        updated_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
      });
      resourceFiles = await queryInterface.describeTable('resource_files');
    }
    await ensureColumn('resource_files', resourceFiles, 'description', {
      type: DataTypes.TEXT,
      allowNull: true,
    });
    await ensureColumn('resource_files', resourceFiles, 'category_id', {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'resource_categories',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await ensureColumn('resource_files', resourceFiles, 'thumbnail_url', {
      type: DataTypes.STRING(512),
      allowNull: true,
    });
    await ensureColumn('resource_files', resourceFiles, 'is_pinned', {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await ensureColumn('resource_files', resourceFiles, 'pinned_order', {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
    await ensureColumn('resource_files', resourceFiles, 'tags', {
      type: DataTypes.JSON,
      allowNull: true,
    });
    await ensureColumn('resource_files', resourceFiles, 'cta_label', {
      type: DataTypes.STRING(120),
      allowNull: true,
    });
    await ensureColumn('resource_files', resourceFiles, 'cta_url', {
      type: DataTypes.STRING(512),
      allowNull: true,
    });
    await ensureColumn('resource_files', resourceFiles, 'status', {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: 'active',
    });
    await ensureColumn('resource_files', resourceFiles, 'metadata', {
      type: DataTypes.JSON,
      allowNull: true,
    });
    await ensureColumn('resource_files', resourceFiles, 'is_deleted', {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await ensureColumn('resource_files', resourceFiles, 'file_category', {
      type: DataTypes.STRING,
      allowNull: true,
    });
    await ensureColumn('resource_files', resourceFiles, 'visible_to_group_types', {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: ['admin'],
    });
    await ensureColumn('resource_files', resourceFiles, 'visible_to_group_ids', {
      type: DataTypes.JSON,
      allowNull: true,
    });
    // Timestamps (if table pre-existed without underscored timestamps)
    await ensureColumn('resource_files', resourceFiles, 'created_at', {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    });
    await ensureColumn('resource_files', resourceFiles, 'updated_at', {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    });

    await ensureIndex('resource_files', 'resource_files_category_idx', ['category_id']);
    await ensureIndex('resource_files', 'resource_files_pinned_idx', ['is_pinned', 'pinned_order']);

    // Resource Announcements
    let resourceAnnouncements = await queryInterface.describeTable('resource_announcements').catch(() => null);
    if (!resourceAnnouncements) {
      await queryInterface.createTable('resource_announcements', {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        title: {
          type: DataTypes.STRING(180),
          allowNull: false,
        },
        summary: {
          type: DataTypes.STRING(280),
          allowNull: true,
        },
        body: {
          type: DataTypes.TEXT('long'),
          allowNull: true,
        },
        category_id: {
          type: DataTypes.INTEGER,
          allowNull: true,
          references: {
            model: 'resource_categories',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        is_pinned: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        pinned_order: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        publish_at: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        expire_at: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        cta_label: {
          type: DataTypes.STRING(120),
          allowNull: true,
        },
        cta_url: {
          type: DataTypes.STRING(512),
          allowNull: true,
        },
        status: {
          type: DataTypes.STRING(32),
          allowNull: false,
          defaultValue: 'published',
        },
        visible_to_group_types: {
          type: DataTypes.JSON,
          allowNull: true,
        },
        visible_to_group_ids: {
          type: DataTypes.JSON,
          allowNull: true,
        },
        metadata: {
          type: DataTypes.JSON,
          allowNull: true,
        },
        created_by: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        updated_by: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        updated_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
      });
      resourceAnnouncements = await queryInterface.describeTable('resource_announcements');
    } else {
      await ensureColumn('resource_announcements', resourceAnnouncements, 'summary', {
        type: DataTypes.STRING(280),
        allowNull: true,
      });
      await ensureColumn('resource_announcements', resourceAnnouncements, 'body', {
        type: DataTypes.TEXT('long'),
        allowNull: true,
      });
      await ensureColumn('resource_announcements', resourceAnnouncements, 'category_id', {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'resource_categories',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });
      await ensureColumn('resource_announcements', resourceAnnouncements, 'is_pinned', {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });
      await ensureColumn('resource_announcements', resourceAnnouncements, 'pinned_order', {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      });
      await ensureColumn('resource_announcements', resourceAnnouncements, 'publish_at', {
        type: DataTypes.DATE,
        allowNull: true,
      });
      await ensureColumn('resource_announcements', resourceAnnouncements, 'expire_at', {
        type: DataTypes.DATE,
        allowNull: true,
      });
      await ensureColumn('resource_announcements', resourceAnnouncements, 'cta_label', {
        type: DataTypes.STRING(120),
        allowNull: true,
      });
      await ensureColumn('resource_announcements', resourceAnnouncements, 'cta_url', {
        type: DataTypes.STRING(512),
        allowNull: true,
      });
      await ensureColumn('resource_announcements', resourceAnnouncements, 'status', {
        type: DataTypes.STRING(32),
        allowNull: false,
        defaultValue: 'published',
      });
      await ensureColumn('resource_announcements', resourceAnnouncements, 'visible_to_group_types', {
        type: DataTypes.JSON,
        allowNull: true,
      });
      await ensureColumn('resource_announcements', resourceAnnouncements, 'visible_to_group_ids', {
        type: DataTypes.JSON,
        allowNull: true,
      });
      await ensureColumn('resource_announcements', resourceAnnouncements, 'metadata', {
        type: DataTypes.JSON,
        allowNull: true,
      });
      await ensureColumn('resource_announcements', resourceAnnouncements, 'created_by', {
        type: DataTypes.INTEGER,
        allowNull: true,
      });
      await ensureColumn('resource_announcements', resourceAnnouncements, 'updated_by', {
        type: DataTypes.INTEGER,
        allowNull: true,
      });
    }

    await ensureIndex('resource_announcements', 'resource_announcements_category_idx', ['category_id']);
    await ensureIndex('resource_announcements', 'resource_announcements_pinned_idx', ['is_pinned', 'pinned_order']);
    await ensureIndex('resource_announcements', 'resource_announcements_status_idx', ['status']);
    await ensureIndex('resource_announcements', 'resource_announcements_publish_idx', ['publish_at']);
  },

  down: async (queryInterface) => {
    const dropIndexIfExists = async (tableName, indexName) => {
      const indexes = await queryInterface.showIndex(tableName).catch(() => []);
      if (indexes.some((idx) => idx.name === indexName)) {
        await queryInterface.removeIndex(tableName, indexName);
      }
    };

    const removeColumnIfExists = async (tableName, columnName) => {
      const definition = await queryInterface.describeTable(tableName).catch(() => null);
      if (definition && definition[columnName]) {
        await queryInterface.removeColumn(tableName, columnName);
      }
    };

    await dropIndexIfExists('resource_announcements', 'resource_announcements_publish_idx');
    await dropIndexIfExists('resource_announcements', 'resource_announcements_status_idx');
    await dropIndexIfExists('resource_announcements', 'resource_announcements_pinned_idx');
    await dropIndexIfExists('resource_announcements', 'resource_announcements_category_idx');
    await queryInterface.dropTable('resource_announcements').catch(() => {});

    await dropIndexIfExists('resource_files', 'resource_files_pinned_idx');
    await dropIndexIfExists('resource_files', 'resource_files_category_idx');
    await removeColumnIfExists('resource_files', 'metadata');
    await removeColumnIfExists('resource_files', 'status');
    await removeColumnIfExists('resource_files', 'cta_url');
    await removeColumnIfExists('resource_files', 'cta_label');
    await removeColumnIfExists('resource_files', 'tags');
    await removeColumnIfExists('resource_files', 'pinned_order');
    await removeColumnIfExists('resource_files', 'is_pinned');
    await removeColumnIfExists('resource_files', 'thumbnail_url');
    await removeColumnIfExists('resource_files', 'category_id');
    await removeColumnIfExists('resource_files', 'description');

    await dropIndexIfExists('resource_links', 'resource_links_pinned_idx');
    await dropIndexIfExists('resource_links', 'resource_links_category_idx');
    await removeColumnIfExists('resource_links', 'metadata');
    await removeColumnIfExists('resource_links', 'status');
    await removeColumnIfExists('resource_links', 'cta_url');
    await removeColumnIfExists('resource_links', 'cta_label');
    await removeColumnIfExists('resource_links', 'tags');
    await removeColumnIfExists('resource_links', 'pinned_order');
    await removeColumnIfExists('resource_links', 'is_pinned');
    await removeColumnIfExists('resource_links', 'thumbnail_url');
    await removeColumnIfExists('resource_links', 'category_id');
    await removeColumnIfExists('resource_links', 'description');

    await dropIndexIfExists('resource_categories', 'resource_categories_pinned_idx');
    await dropIndexIfExists('resource_categories', 'resource_categories_slug_idx');
    await dropIndexIfExists('resource_categories', 'resource_categories_parent_idx');
    await queryInterface.dropTable('resource_categories').catch(() => {});
  },
};
