'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = 'login_customizations';
    const addColumn = async (name, definition) => {
      try {
        await queryInterface.addColumn(table, name, definition);
      } catch (error) {
        const message = String(error && error.message || '');
        if (message.includes('Duplicate column name') || message.includes('already exists')) {
          return;
        }
        throw error;
      }
    };

    await addColumn('smtp_host', { type: Sequelize.STRING(255), allowNull: true });
    await addColumn('smtp_port', { type: Sequelize.INTEGER, allowNull: true });
    await addColumn('smtp_secure', { type: Sequelize.BOOLEAN, allowNull: true });
    await addColumn('smtp_user', { type: Sequelize.STRING(255), allowNull: true });
    await addColumn('smtp_pass', { type: Sequelize.STRING(255), allowNull: true });
    await addColumn('email_from', { type: Sequelize.STRING(255), allowNull: true });
  },

  async down(queryInterface) {
    const table = 'login_customizations';
    const removeColumn = async (name) => {
      try {
        await queryInterface.removeColumn(table, name);
      } catch (error) {
        const message = String(error && error.message || '');
        if (message.includes('Check that column/key exists') || message.includes('Unknown column') || message.includes('doesn')) {
          return;
        }
        throw error;
      }
    };

    await removeColumn('email_from');
    await removeColumn('smtp_pass');
    await removeColumn('smtp_user');
    await removeColumn('smtp_secure');
    await removeColumn('smtp_port');
    await removeColumn('smtp_host');
  },
};
