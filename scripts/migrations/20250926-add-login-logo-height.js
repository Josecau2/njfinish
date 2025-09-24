module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('login_customizations', 'login_logo_height', {
      type: Sequelize.INTEGER,
      allowNull: true,
    }).catch((err) => {
      const msg = String(err?.message || err || '');
      if (!msg.includes('Duplicate column name') && !msg.includes('already exists')) {
        throw err;
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('login_customizations', 'login_logo_height').catch((err) => {
      const msg = String(err?.message || err || '');
      if (!msg.includes('Check that column/key exists') && !msg.includes('Unknown column')) {
        throw err;
      }
    });
  },
};
