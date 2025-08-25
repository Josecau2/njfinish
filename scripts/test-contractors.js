const axios = require('axios');

(async () => {
  try {
    const base = process.env.API_BASE || 'http://localhost:8080';
    const login = await axios.post(`${base}/api/auth/login`, {
      email: process.env.TEST_EMAIL || 'admin@example.com',
      password: process.env.TEST_PASSWORD || 'AdminPass123!'
    }, { validateStatus: () => true });

    if (!login.data || !login.data.token) {
      console.error('Login failed:', login.status, login.data);
      process.exit(1);
    }

    const token = login.data.token;
    const res = await axios.get(`${base}/api/contractors?page=1&limit=5`, {
      headers: { Authorization: `Bearer ${token}` },
      validateStatus: () => true
    });

    console.log('Status:', res.status);
    if (res.status !== 200) {
      console.error('Error body:', res.data);
      process.exit(2);
    }

    console.log('Count:', Array.isArray(res.data.data) ? res.data.data.length : 'N/A');
    console.log('First item keys:', res.data.data && res.data.data[0] ? Object.keys(res.data.data[0]) : []);
    process.exit(0);
  } catch (e) {
    console.error('Request error:', e.message);
    process.exit(3);
  }
})();
