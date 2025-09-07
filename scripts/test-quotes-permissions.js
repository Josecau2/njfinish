/*
 Test quotes/proposals permissions and visibility.

 Env vars:
  - BASE_URL (default http://localhost:8080)
  - ADMIN_JWT (Bearer token for an admin user)
  - CONTRACTOR_JWT (Bearer token for a contractor user)
  - STAFF_JWT (Bearer token for a non-admin, non-contractor staff user)

 Usage (PowerShell):
  $env:BASE_URL="http://localhost:8080"; $env:ADMIN_JWT="<admin>"; $env:CONTRACTOR_JWT="<contractor>"; $env:STAFF_JWT="<staff>"; node scripts/test-quotes-permissions.js
*/
/* eslint-disable no-console */
const axios = require('axios');

async function fetchQuotes(base, token, params = '') {
  const url = `${base}/api/proposals${params ? `?${params}` : ''}`;
  const { data, status } = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}` },
    validateStatus: () => true,
  });
  return { data, status };
}

async function fetchQuote(base, token, id) {
  const url = `${base}/api/proposals/proposalByID/${id}`;
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
  const staffJwt = process.env.STAFF_JWT;

  if (!adminJwt || !contractorJwt || !staffJwt) {
    console.error('ADMIN_JWT, CONTRACTOR_JWT, and STAFF_JWT env vars are required');
    process.exit(1);
  }

  console.log('== Admin: fetch all quotes ==');
  const adminAll = await fetchQuotes(base, adminJwt);
  if (adminAll.status !== 200 || !adminAll.data?.success) {
    console.error('Admin GET /api/proposals failed', adminAll.status, adminAll.data);
    process.exit(1);
  }
  const adminQuotes = Array.isArray(adminAll.data.data) ? adminAll.data.data : [];
  console.log(`Admin received ${adminQuotes.length} proposals`);

  console.log('\n== Contractor: fetch mine only (implicit) ==');
  const contractorMine = await fetchQuotes(base, contractorJwt);
  if (contractorMine.status !== 200 || !contractorMine.data?.success) {
    console.error('Contractor GET /api/proposals failed', contractorMine.status, contractorMine.data);
    process.exit(1);
  }
  const contractorQuotes = Array.isArray(contractorMine.data.data) ? contractorMine.data.data : [];
  const contractorUserIdSet = new Set(contractorQuotes.map(q => q.created_by_user_id));
  console.log('Contractor created_by_user_ids seen:', [...contractorUserIdSet]);

  const crossAdminOnly = adminQuotes.find(q => q.created_by_user_id && !contractorUserIdSet.has(q.created_by_user_id));
  if (!crossAdminOnly) {
    console.warn('Could not find a cross-user proposal to test contractor 403 on details.');
  } else {
    console.log(`\n== Verify contractor forbidden on proposal ${crossAdminOnly.id} ==`);
    const contractorView = await fetchQuote(base, contractorJwt, crossAdminOnly.id);
    if (contractorView.status === 403) {
      console.log('PASS: Contractor forbidden (403) on other user proposal');
    } else {
      console.warn('WARN: Expected 403 for contractor on other user proposal, got:', contractorView.status);
    }
  }

  console.log('\n== Staff (non-admin) should see only accepted_by=self ==');
  const staffAll = await fetchQuotes(base, staffJwt);
  if (staffAll.status !== 200 || !staffAll.data?.success) {
    console.error('Staff GET /api/proposals failed', staffAll.status, staffAll.data);
    process.exit(1);
  }
  const staffQuotes = Array.isArray(staffAll.data.data) ? staffAll.data.data : [];
  const staffAcceptedBySet = new Set(staffQuotes.map(q => q.accepted_by));
  console.log('Staff accepted_by values seen:', [...staffAcceptedBySet]);

  const crossOther = adminQuotes.find(q => q.id && !(q.accepted_by && (q.accepted_by === staffAll.data.userId || q.accepted_by === String(staffAll.data.userId))));
  if (crossOther) {
    console.log(`\n== Verify staff forbidden on unrelated proposal ${crossOther.id} ==`);
    const staffView = await fetchQuote(base, staffJwt, crossOther.id);
    if (staffView.status === 403) {
      console.log('PASS: Staff forbidden (403) on unrelated proposal');
    } else {
      console.warn('WARN: Expected 403 for staff on unrelated proposal, got:', staffView.status);
    }
  } else {
    console.warn('Could not find a suitable unrelated proposal to verify staff 403; skipping.');
  }

  console.log('\nAll quote permission checks complete.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
