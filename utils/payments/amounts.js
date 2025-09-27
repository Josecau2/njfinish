const coerceInt = (value) => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'bigint') return Number(value);
  const num = Number(value);
  return Number.isFinite(num) ? Math.round(num) : 0;
};

const sumValues = (values = []) => values.reduce((total, value) => total + coerceInt(value), 0);

const extractSnapshotTotal = (snapshot) => {
  if (!snapshot) return 0;
  let data = snapshot;
  if (typeof snapshot === 'string') {
    try {
      data = JSON.parse(snapshot);
    } catch (err) {
      return 0;
    }
  }

  if (!data || typeof data !== 'object') return 0;

  const candidateKeys = [
    'grand_total_cents',
    'grandTotalCents',
    'grand_totalCents',
    'grandTotal',
  ];

  for (const key of candidateKeys) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const value = coerceInt(data[key]);
      if (value > 0) return value;
    }
  }

  const totals = data.totals || data.pricing || {};
  for (const key of candidateKeys) {
    if (Object.prototype.hasOwnProperty.call(totals, key)) {
      const value = coerceInt(totals[key]);
      if (value > 0) return value;
    }
  }

  return 0;
};

const deriveFromOrderFields = (order = {}) => {
  const parts = coerceInt(order.parts_cents);
  const assembly = coerceInt(order.assembly_cents);
  const mods = coerceInt(order.mods_cents);
  const delivery = coerceInt(order.delivery_cents);
  const tax = coerceInt(order.tax_cents);
  const discount = coerceInt(order.discount_cents);

  const subtotal = sumValues([parts, assembly, mods, delivery, tax]);
  const total = subtotal - discount;
  return total > 0 ? total : 0;
};

const getOrderAmountCents = (order) => {
  if (!order) {
    return { amount_cents: 0, currency: 'USD' };
  }

  const currency = order.currency || 'USD';
  const primary = coerceInt(order.grand_total_cents);
  if (primary > 0) {
    return { amount_cents: primary, currency };
  }

  const snapshotTotal = extractSnapshotTotal(order.snapshot);
  if (snapshotTotal > 0) {
    return { amount_cents: snapshotTotal, currency };
  }

  const derived = deriveFromOrderFields(order);
  return { amount_cents: derived, currency };
};

const formatCents = (amountCents = 0) => {
  const cents = coerceInt(amountCents);
  return cents / 100;
};

module.exports = {
  coerceInt,
  getOrderAmountCents,
  formatCents,
};

