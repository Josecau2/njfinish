// Smoke test placeholder for orders creation after acceptance
// Run after starting server and having at least one accepted proposal
const axios = require('axios');

(async () => {
  const base = process.env.API_BASE || 'http://localhost:8080';
  const token = process.env.API_TOKEN || '';
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  try {
    const res = await axios.get(`${base}/api/orders?mine=true`, { headers });
    console.log('Orders list:', (res.data?.data || []).length);
  } catch (e) {
    console.error('Orders list failed:', e.response?.status, e.response?.data || e.message);
  }
})();
