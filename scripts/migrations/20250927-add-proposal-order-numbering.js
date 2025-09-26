'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const { DataTypes } = Sequelize;

    // Proposals table changes
    const proposals = await queryInterface.describeTable('proposals').catch(() => null);
    if (proposals) {
      if (!proposals.proposal_number) {
        await queryInterface.addColumn('proposals', 'proposal_number', {
          type: DataTypes.STRING(32),
          allowNull: true,
          comment: 'Normalized human number e.g., NJ-001-092525'
        });
      }
      if (!proposals.proposal_number_date) {
        await queryInterface.addColumn('proposals', 'proposal_number_date', {
          type: DataTypes.DATEONLY,
          allowNull: true,
          comment: 'Date part used for daily sequence (YYYY-MM-DD)'
        });
      }
      if (!proposals.proposal_number_seq) {
        await queryInterface.addColumn('proposals', 'proposal_number_seq', {
          type: DataTypes.INTEGER,
          allowNull: true,
          comment: 'Daily sequence integer for uniqueness enforcement'
        });
      }

      // Unique composite index for date+seq (enforce per-day uniqueness)
      const existingIdx = (proposals.indexes || proposals).proposal_number_date_seq_unique;
      try {
        await queryInterface.addIndex('proposals', ['proposal_number_date', 'proposal_number_seq'], {
          name: 'uniq_proposals_number_date_seq',
          unique: true
        });
      } catch (_) {}

      // Optional unique index on final number string
      try {
        await queryInterface.addIndex('proposals', ['proposal_number'], {
          name: 'uniq_proposals_proposal_number',
          unique: true
        });
      } catch (_) {}
    }

    // Orders table changes
    const orders = await queryInterface.describeTable('orders').catch(() => null);
    if (orders) {
      if (!orders.order_number) {
        await queryInterface.addColumn('orders', 'order_number', {
          type: DataTypes.STRING(32),
          allowNull: true,
          comment: 'Normalized human number e.g., NJ-001-092525'
        });
      }
      if (!orders.order_number_date) {
        await queryInterface.addColumn('orders', 'order_number_date', {
          type: DataTypes.DATEONLY,
          allowNull: true,
          comment: 'Date part used for daily sequence (YYYY-MM-DD)'
        });
      }
      if (!orders.order_number_seq) {
        await queryInterface.addColumn('orders', 'order_number_seq', {
          type: DataTypes.INTEGER,
          allowNull: true,
          comment: 'Daily sequence integer for uniqueness enforcement'
        });
      }

      try {
        await queryInterface.addIndex('orders', ['order_number_date', 'order_number_seq'], {
          name: 'uniq_orders_number_date_seq',
          unique: true
        });
      } catch (_) {}

      try {
        await queryInterface.addIndex('orders', ['order_number'], {
          name: 'uniq_orders_order_number',
          unique: true
        });
      } catch (_) {}
    }
  },

  async down(queryInterface, Sequelize) {
    const proposals = await queryInterface.describeTable('proposals').catch(() => null);
    if (proposals) {
      try { await queryInterface.removeIndex('proposals', 'uniq_proposals_number_date_seq'); } catch (_) {}
      try { await queryInterface.removeIndex('proposals', 'uniq_proposals_proposal_number'); } catch (_) {}
      if (proposals.proposal_number_seq) {
        await queryInterface.removeColumn('proposals', 'proposal_number_seq');
      }
      if (proposals.proposal_number_date) {
        await queryInterface.removeColumn('proposals', 'proposal_number_date');
      }
      if (proposals.proposal_number) {
        await queryInterface.removeColumn('proposals', 'proposal_number');
      }
    }

    const orders = await queryInterface.describeTable('orders').catch(() => null);
    if (orders) {
      try { await queryInterface.removeIndex('orders', 'uniq_orders_number_date_seq'); } catch (_) {}
      try { await queryInterface.removeIndex('orders', 'uniq_orders_order_number'); } catch (_) {}
      if (orders.order_number_seq) {
        await queryInterface.removeColumn('orders', 'order_number_seq');
      }
      if (orders.order_number_date) {
        await queryInterface.removeColumn('orders', 'order_number_date');
      }
      if (orders.order_number) {
        await queryInterface.removeColumn('orders', 'order_number');
      }
    }
  }
};
