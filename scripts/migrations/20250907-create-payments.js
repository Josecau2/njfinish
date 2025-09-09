// Migration to create payments table
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Ensure orders table exists (safety net if earlier migration was placeholder)
    const qi = queryInterface;
    const sequelize = qi.sequelize;
    async function hasTable(name){
      const [rows] = await sequelize.query("SELECT COUNT(*) AS c FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?", { replacements: [name] });
      return Number((Array.isArray(rows)?rows[0]?.c:rows?.c)||0) > 0;
    }
    if (!(await hasTable('orders'))){
      console.warn('[PAYMENTS MIGRATION] orders table missing – creating minimal fallback');
      await sequelize.query(`CREATE TABLE orders ( id INT AUTO_INCREMENT PRIMARY KEY ) ENGINE=InnoDB;`);
    }
    // Create payments table if missing
    const hasPayments = await hasTable('payments');
    if (!hasPayments){
      await qi.createTable('payments', {
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
    }
    // Idempotent indexes
    async function ensureIndex(table, idxName, cols){
      const [r] = await sequelize.query(`SHOW INDEX FROM \`${table}\` WHERE Key_name = ?`, { replacements: [idxName] });
      if (!Array.isArray(r) || r.length === 0){
        try { await qi.addIndex(table, cols, { name: idxName }); } catch(e){ if(!/Duplicate|exists/.test(e.message)) throw e; }
      }
    }
    await ensureIndex('payments', 'idx_payments_order_id', ['orderId']);
    await ensureIndex('payments', 'idx_payments_status', ['status']);
    await ensureIndex('payments', 'idx_payments_transaction_id', ['transactionId']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('payments');
  },
};
