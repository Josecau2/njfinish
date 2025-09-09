// Migration to create payments table
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Idempotent guard: skip if table already exists
    const [tables] = await queryInterface.sequelize.query("SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payments'");
    if (Array.isArray(tables) && tables.length) return;
    await queryInterface.createTable('payments', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      orderId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'orders',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      currency: {
        type: Sequelize.STRING(3),
        defaultValue: 'USD',
      },
      status: {
        type: Sequelize.ENUM('pending', 'processing', 'completed', 'failed', 'cancelled'),
        defaultValue: 'pending',
      },
      paymentMethod: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      transactionId: {
        type: Sequelize.STRING(255),
        allowNull: true,
        unique: true,
      },
      gatewayResponse: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      paidAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      createdBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // Add indexes (silently ignore if they somehow already exist)
    const safeAdd = async (cols, opts) => {
      try { await queryInterface.addIndex('payments', cols, opts); } catch(e){ if(!/exists|duplicate/i.test(e.message)) throw e; }
    };
    await safeAdd(['orderId'], { name: 'idx_payments_order_id' });
    await safeAdd(['status'], { name: 'idx_payments_status' });
    await safeAdd(['transactionId'], { name: 'idx_payments_transaction_id' });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('payments');
  },
};
