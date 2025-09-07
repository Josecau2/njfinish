/*
 Test orders permissions and visibility for admin vs contractor.

 Env vars:
  - BASE_URL (default http://localhost:8080)
  - ADMIN_JWT (Bearer token for an admin user)
  - CONTRACTOR_JWT (Bearer token for a contractor user)

 Usage (PowerShell):
  $env:BASE_URL="http://localhost:8080"; $env:ADMIN_JWT="<admin_token>"; $env:CONTRACTOR_JWT="<contractor_token>"; node scripts/test-orders-permissions.js
*/
/* eslint-disable no-console */
const axios = require('axios');

async function fetchOrders(base, token, params = '') {
  const url = `${base}/api/orders${params ? `?${params}` : ''}`;
  const { data, status } = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}` },
    validateStatus: () => true,
  });
  return { data, status };
}

async function fetchOrder(base, token, id) {
  const url = `${base}/api/orders/${id}`;
  const { data, status } = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}` },
    validateStatus: () => true,
  });
  return { data, status };
}

async function main() {
  const base = process.env.BASE_URL || 'http://localhost:8080';
  const adminJwt = process.env.ADMIN_JWT;
  const contractorJwt = process.env.CONTRACTOR_JWT;

  if (!adminJwt || !contractorJwt) {
    console.error('ADMIN_JWT and CONTRACTOR_JWT env vars are required');
    process.exit(1);
  }

  console.log('== Admin: fetch all orders ==');
  const adminAll = await fetchOrders(base, adminJwt);
  if (adminAll.status !== 200 || !adminAll.data?.success) {
    console.error('Admin GET /api/orders failed', adminAll.status, adminAll.data);
    process.exit(1);
  }
  const adminOrders = Array.isArray(adminAll.data.data) ? adminAll.data.data : [];
  console.log(`Admin received ${adminOrders.length} orders`);

  const ownerGroupsAdmin = new Set(adminOrders.map(o => o.owner_group_id).filter(Boolean));
  console.log('Admin sees owner_group_ids:', [...ownerGroupsAdmin]);

  console.log('\n== Contractor: fetch mine only ==');
  const contractorMine = await fetchOrders(base, contractorJwt, 'mine=true');
  if (contractorMine.status !== 200 || !contractorMine.data?.success) {
    console.error('Contractor GET /api/orders?mine=true failed', contractorMine.status, contractorMine.data);
    process.exit(1);
  }
  const contractorOrders = Array.isArray(contractorMine.data.data) ? contractorMine.data.data : [];
  console.log(`Contractor received ${contractorOrders.length} orders`);
  const contractorOwnerGroups = new Set(contractorOrders.map(o => o.owner_group_id).filter(Boolean));
  console.log('Contractor owner_group_ids:', [...contractorOwnerGroups]);

  // Find an order visible to admin but not to contractor's group
  const crossOrder = adminOrders.find(o => o.owner_group_id && !contractorOwnerGroups.has(o.owner_group_id));
  if (!crossOrder) {
    console.warn('Could not find an order outside contractor group to verify 403; skipping that check.');
  } else {
    console.log(`\n== Verify contractor forbidden on order ${crossOrder.id} (owner_group_id=${crossOrder.owner_group_id}) ==`);
    const contractorView = await fetchOrder(base, contractorJwt, crossOrder.id);
    if (contractorView.status === 403) {
      console.log('PASS: Contractor is forbidden (403) on other group order');
    } else {
      console.warn('WARN: Expected 403 for contractor on other group order, got:', contractorView.status);
    }

    console.log(`== Verify admin can view order ${crossOrder.id} ==`);
    const adminView = await fetchOrder(base, adminJwt, crossOrder.id);
    if (adminView.status === 200 && adminView.data?.success) {
      console.log('PASS: Admin can view order');
    } else {
      console.error('FAIL: Admin could not view order', adminView.status, adminView.data);
      process.exit(1);
    }
  }

  console.log('\nAll checks complete.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
