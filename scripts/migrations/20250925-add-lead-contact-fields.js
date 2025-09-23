const TABLE = 'leads';

const getColumnDefinitions = (Sequelize) => [
  { name: 'firstName', options: { type: Sequelize.STRING(191), allowNull: true } },
  { name: 'lastName', options: { type: Sequelize.STRING(191), allowNull: true } },
  { name: 'phone', options: { type: Sequelize.STRING(32), allowNull: true } },
  { name: 'city', options: { type: Sequelize.STRING(191), allowNull: true } },
  { name: 'state', options: { type: Sequelize.STRING(64), allowNull: true } },
  { name: 'zip', options: { type: Sequelize.STRING(32), allowNull: true } },
];

const fetchExistingColumnNames = async (sequelize) => {
  const [rows] = await sequelize.query(
    "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'leads'"
  );
  return new Set(rows.map((row) => row.COLUMN_NAME));
};

module.exports = {
  async up(queryInterface, Sequelize) {
    const sequelize = queryInterface.sequelize;
    const existing = await fetchExistingColumnNames(sequelize);
    const definitions = getColumnDefinitions(Sequelize);

    for (const column of definitions) {
      if (!existing.has(column.name)) {
        await queryInterface.addColumn(TABLE, column.name, column.options);
      }
    }

    try {
      await sequelize.query(`
        UPDATE ${TABLE}
        SET
          firstName = CASE
            WHEN (firstName IS NULL OR firstName = '')
              THEN TRIM(SUBSTRING_INDEX(name, ' ', 1))
            ELSE firstName
          END,
          lastName = CASE
            WHEN (lastName IS NULL OR lastName = '') THEN TRIM(
              CASE
                WHEN name LIKE '% %' THEN SUBSTRING(name, LENGTH(SUBSTRING_INDEX(name, ' ', 1)) + 1)
                ELSE ''
              END
            )
            ELSE lastName
          END
        WHERE name IS NOT NULL AND name <> '';
      `);
    } catch (err) {
      console.warn('[leads migration] Unable to backfill first/last names:', err?.message || err);
    }
  },

  async down(queryInterface, Sequelize) {
    const sequelize = queryInterface.sequelize;
    const existing = await fetchExistingColumnNames(sequelize);
    const definitions = getColumnDefinitions(Sequelize);

    for (const column of definitions.reverse()) {
      if (existing.has(column.name)) {
        await queryInterface.removeColumn(TABLE, column.name);
      }
    }
  },
};
