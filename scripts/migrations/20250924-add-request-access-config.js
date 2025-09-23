'use strict';

const TABLE = 'login_customizations';
const COLUMNS = {
  request_access_title: { type: 'STRING', length: 191 },
  request_access_subtitle: { type: 'STRING', length: 191 },
  request_access_description: { type: 'TEXT' },
  request_access_benefits: { type: 'JSON' },
  request_access_success_message: { type: 'STRING', length: 255 },
  request_access_admin_subject: { type: 'STRING', length: 255 },
  request_access_admin_body: { type: 'TEXT' },
  request_access_lead_subject: { type: 'STRING', length: 255 },
  request_access_lead_body: { type: 'TEXT' }
};

const mapColumn = (Sequelize, def) => {
  switch (def.type) {
    case 'STRING':
      return { type: Sequelize.STRING(def.length || 255), allowNull: true };
    case 'TEXT':
      return { type: Sequelize.TEXT('long'), allowNull: true };
    case 'JSON':
      return { type: Sequelize.JSON, allowNull: true };
    default:
      throw new Error(`Unsupported column type: ${def.type}`);
  }
};

async function columnExists(queryInterface, column) {
  try {
    const table = await queryInterface.describeTable(TABLE);
    return !!table[column];
  } catch (err) {
    console.warn(`[request-access-config] Unable to describe table ${TABLE}:`, err?.message || err);
    return false;
  }
}

module.exports = {
  async up(queryInterface, Sequelize) {
    for (const [column, def] of Object.entries(COLUMNS)) {
      // eslint-disable-next-line no-await-in-loop
      const exists = await columnExists(queryInterface, column);
      if (exists) continue;
      // eslint-disable-next-line no-await-in-loop
      await queryInterface.addColumn(TABLE, column, mapColumn(Sequelize, def));
    }
  },

  async down(queryInterface) {
    for (const column of Object.keys(COLUMNS)) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await queryInterface.removeColumn(TABLE, column);
      } catch (err) {
        console.warn(`[request-access-config] Failed to drop column ${column}:`, err?.message || err);
      }
    }
  }
};
