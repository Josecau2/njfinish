const test = require('node:test');
const assert = require('node:assert/strict');

const { coerceInt, getOrderAmountCents, formatCents } = require('../../../utils/payments/amounts');

test('coerceInt normalizes various input types', () => {
  assert.equal(coerceInt(42), 42);
  assert.equal(coerceInt('42.7'), 43);
  assert.equal(coerceInt(null), 0);
  assert.equal(coerceInt(undefined), 0);
  assert.equal(coerceInt(10.4), 10);
  assert.equal(coerceInt(BigInt(55)), 55);
});

test('getOrderAmountCents prefers grand_total_cents when present', () => {
  const result = getOrderAmountCents({ grand_total_cents: 12345, currency: 'usd' });
  assert.deepEqual(result, { amount_cents: 12345, currency: 'usd' });
});

test('getOrderAmountCents parses snapshot when total missing', () => {
  const snapshot = JSON.stringify({ grand_total_cents: 9876, currency: 'usd' });
  const result = getOrderAmountCents({ snapshot });
  assert.equal(result.amount_cents, 9876);
  assert.equal(result.currency, 'USD');
});

test('getOrderAmountCents derives from individual fields as fallback', () => {
  const order = {
    parts_cents: 1000,
    assembly_cents: 500,
    mods_cents: 250,
    delivery_cents: 100,
    tax_cents: 150,
    discount_cents: 200,
  };
  const result = getOrderAmountCents(order);
  assert.equal(result.amount_cents, 1800);
});

test('formatCents returns decimal amount', () => {
  assert.equal(formatCents(12345), 123.45);
  assert.equal(formatCents('200'), 2);
  assert.equal(formatCents(null), 0);
});
