// Ensures proposal status enum contains expected values (MySQL workaround via dynamic ALTER)
'use strict';
module.exports = {
  async up(qi){
    const sequelize = qi.sequelize;
    // Detect enum definition
    const [rows] = await sequelize.query("SHOW COLUMNS FROM proposals LIKE 'status'");
    if(!Array.isArray(rows) || !rows.length) return; // column missing
    const type = rows[0].Type; // e.g. enum('draft','sent',...)
    const needed = ['draft','sent','accepted','rejected','expired'];
    const present = needed.every(v => type.includes("'"+v+"'"));
    if(present) return; // already contains all (legacy extras allowed)
    // Build union set preserving existing list order first
    const existingVals = [...type.matchAll(/'([^']+)'/g)].map(m=>m[1]);
    const merged = Array.from(new Set([...existingVals, ...needed]));
    const enumSql = "ENUM("+merged.map(v=>`'${v.replace(/'/g,"''")}'`).join(',')+")";
    try {
      await sequelize.query(`ALTER TABLE proposals MODIFY COLUMN status ${enumSql} NULL`);
    } catch(e){ if(!/duplicate|exists/i.test(e.message)) throw e; }
  },
  async down(){ return Promise.resolve(); }
};
