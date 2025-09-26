'use strict';

const sequelize = require('../config/db');

// Format: NJ-001-092525 (NJ-{seq3}-{mmddyy})
function parseDateLike(value) {
  if (value instanceof Date) return value;
  if (typeof value === 'string') {
    // Handle YYYY-MM-DD explicitly as local date to avoid TZ off-by-one
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (m) {
      const y = Number(m[1]);
      const mo = Number(m[2]);
      const da = Number(m[3]);
      return new Date(y, mo - 1, da);
    }
  }
  return new Date(value);
}

function formatNumber(prefix, seq, date) {
  const d = parseDateLike(date);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  const seqStr = String(seq).padStart(3, '0');
  return `${prefix}-${seqStr}-${mm}${dd}${yy}`;
}

// Compute next candidate number without reserving; callers should include
// the date/seq/number in their INSERT and retry on unique conflicts.
async function nextCandidate(entity, onDate = new Date()) {
  const isProposal = entity === 'proposal';
  const table = isProposal ? 'proposals' : 'orders';
  const colSeq = isProposal ? 'proposal_number_seq' : 'order_number_seq';
  const colDate = isProposal ? 'proposal_number_date' : 'order_number_date';
  const dateOnly = (onDate instanceof Date ? onDate : new Date(onDate)).toISOString().slice(0, 10);

  const [[row]] = await sequelize.query(
    `SELECT MAX(${colSeq}) AS maxSeq FROM ${table} WHERE ${colDate} = :dateOnly`,
    { replacements: { dateOnly } }
  );
  const base = Number(row?.maxSeq || 0) + 1;
  const prefix = isProposal ? 'NJQ' : 'NJ';
  const number = formatNumber(prefix, base, dateOnly);
  return { dateOnly, seq: base, number };
}

module.exports = { formatNumber, nextCandidate, parseDateLike };
