/* eslint-disable no-console */
'use strict';

(async () => {
  const sequelize = require('../config/db');
  try {
    const qi = sequelize.getQueryInterface();
    const table = await qi.describeTable('orders').catch(() => null);
    console.log(JSON.stringify(table, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    try { await sequelize.close(); } catch (_) {}
  }
})();
