/**
 * Debug: Fetch orders via HTTP API using a JWT
 * Env:
 *   BASE_URL (default http://localhost:8080)
 *   JWT (Bearer token)
 * Usage:
 *   node scripts/debug-fetch-orders.js
 */
/* eslint-disable no-console */
const fetch = require('node-fetch');

async function main() {
  const base = process.env.BASE_URL || 'http://localhost:8080';
  const token = process.env.JWT;
  if (!token) {
    console.error('JWT env var is required');
    process.exit(1);
  }

  const url = `${base}/api/orders`;
  console.log('📡 GET', url);
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json().catch(() => ({}));
  console.log('✅ status', res.status);
  if (!json?.success) {
    console.error('❌ API error:', json);
    process.exit(1);
  }
  const list = Array.isArray(json.data) ? json.data : [];
  console.log(`\n🔎 Received ${list.length} order(s)`);
  const slim = list.map((o) => ({
    id: o.id,
    proposal_id: o.proposal_id,
    customer: o.customer?.name || o.proposal?.customerName || null,
    manufacturer: o.manufacturer?.name || null,
    accepted_at: o.accepted_at,
    createdAt: o.createdAt,
  }));
  console.table(slim);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
