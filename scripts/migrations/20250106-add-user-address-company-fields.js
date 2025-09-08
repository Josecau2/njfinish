const { Sequelize } = require('sequelize');

module.exports = {
  async up(queryInterface, Sequelize) {
    const columns = [
      'street_address','city','state','zip_code','country',
      'company_name','company_street_address','company_city','company_state','company_zip_code','company_country'
    ];

    // Fetch existing columns in one query
    const [rows] = await queryInterface.sequelize.query(
      "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'"
    );
    const existing = new Set(rows.map(r => r.COLUMN_NAME));

    const addIfMissing = async (name) => {
      if (existing.has(name)) return; // already there
      let type = Sequelize.STRING;
      await queryInterface.addColumn('users', name, { type, allowNull: true });
    };

    for (const col of columns) {
      // Sequential to keep logs readable
      await addIfMissing(col);
    }
  },

  async down() {
    // No-op: keep data (non-destructive rollback)
    return Promise.resolve();
  }
};
