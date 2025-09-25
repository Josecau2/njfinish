#!/usr/bin/env node
/* eslint-disable no-console */
// E2E via HTTP: Create a proposal, accept it via /api/quotes/:id/accept, assert manufacturerEmail sent (or simulated if --noSend)
const path = require('node:path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const axios = require('axios');

async function main() {
  const base = process.env.BASE_URL || 'http://localhost:8080';
  const token = process.env.JWT;
  if (!token) {
    console.warn('⚠️ Missing JWT in env, this test may fail auth. Set JWT to a valid admin token.');
  }
  const argv = process.argv.slice(2);
  const doSend = argv.includes('--send');
  const manuIdx = argv.indexOf('--manufacturer');
  const manuName = manuIdx > -1 ? argv[manuIdx + 1] : null;

  // Create a proposal
  console.log('📝 Creating proposal via API...');
  const createPayload = {
    action: '0',
    formData: {
      customerName: 'HTTP Test Customer',
      customerEmail: 'http-test@example.com',
      description: 'HTTP Accept Test',
      status: 'Draft',
      manufacturersData: [
        {
          manufacturer: manuName ? undefined : 1,
          manufacturerName: manuName || 'Test Manufacturer',
          selectedStyle: 1,
          styleName: 'Test Style',
          items: [{ id: 1, name: 'B12', price: 100, quantity: 1 }],
          summary: { total: 100, grandTotal: 100 }
        }
      ]
    }
  };
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const createRes = await axios.post(`${base}/api/create-proposals`, createPayload, { headers });
  const proposalId = createRes.data?.data?.id || createRes.data?.dataId || createRes.data?.id;
  if (!proposalId) throw new Error('No proposalId from create');
  console.log('✅ Created proposal', proposalId);

  // Accept via API
  console.log(`🔄 Accepting proposal ${proposalId} via HTTP (${doSend ? 'REAL SEND' : 'noSend=1'})...`);
  const body = doSend ? {} : { noSend: '1' };
  const acceptRes = await axios.post(`${base}/api/quotes/${proposalId}/accept`, body, { headers });
  const data = acceptRes.data;
  console.log('Response:', JSON.stringify(data, null, 2));
  const m = data?.manufacturerEmail;
  if (!m) throw new Error('No manufacturerEmail in response');

  if (doSend) {
    if (!m.sent) throw new Error(`Manufacturer email not sent. Reason: ${m.error || m.reason}`);
    console.log('✅ Manufacturer email sent (real send).');
  } else {
    if (!m.simulated) throw new Error('Expected simulated send but did not get simulated flag');
    console.log('✅ Manufacturer email attempted (simulated).');
  }
}

main().catch((e) => {
  console.error('Test failed:', e?.response?.data || e?.message || e);
  process.exit(1);
});
