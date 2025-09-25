// Idempotent migration: add email columns for manufacturer auto-email settings if missing
/* eslint-disable no-console */

module.exports = {
  // Our migrate runner calls with (queryInterface, Sequelize)
  up: async (queryInterface, Sequelize) => {
    const { DataTypes } = Sequelize;
    const table = 'manufacturers';
    const tableInfo = await queryInterface.describeTable(table).catch(() => null);
    if (!tableInfo) {
      console.log(`[migrate] Table ${table} not found; skipping`);
      return;
    }
    const adds = [];
    if (!tableInfo.order_email_subject) {
      adds.push(queryInterface.addColumn(table, 'order_email_subject', { type: DataTypes.STRING(255), allowNull: true }));
    }
    if (!tableInfo.order_email_template) {
      adds.push(queryInterface.addColumn(table, 'order_email_template', { type: DataTypes.TEXT, allowNull: true }));
    }
    if (!tableInfo.order_email_mode) {
      adds.push(queryInterface.addColumn(table, 'order_email_mode', { type: DataTypes.STRING(16), allowNull: true, defaultValue: 'pdf' }));
    }
    if (!tableInfo.auto_email_on_accept) {
      adds.push(queryInterface.addColumn(table, 'auto_email_on_accept', { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: true }));
    }
    if (adds.length) {
      await Promise.all(adds);
      console.log(`[migrate] Added ${adds.length} column(s) to ${table}`);
    } else {
      console.log(`[migrate] ${table} already has email columns`);
    }
  },
  down: async (queryInterface) => {
    const table = 'manufacturers';
    const tableInfo = await queryInterface.describeTable(table).catch(() => null);
    if (!tableInfo) return;
    const drops = [];
    if (tableInfo.order_email_subject) drops.push(queryInterface.removeColumn(table, 'order_email_subject'));
    if (tableInfo.order_email_template) drops.push(queryInterface.removeColumn(table, 'order_email_template'));
    if (tableInfo.order_email_mode) drops.push(queryInterface.removeColumn(table, 'order_email_mode'));
    if (tableInfo.auto_email_on_accept) drops.push(queryInterface.removeColumn(table, 'auto_email_on_accept'));
    if (drops.length) await Promise.all(drops);
    console.log(`[migrate] Removed email columns from ${table}`);
  }
};
