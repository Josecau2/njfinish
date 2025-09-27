const Stripe = require('stripe');
const env = require('../config/env');

let cachedClient = null;
let cachedKey = null;

const getStripeClient = (secretKey) => {
  const key = secretKey || env.STRIPE_SECRET_KEY;
  if (!key) {
    if (env.NODE_ENV === 'production') {
      throw new Error('Stripe secret key is not configured');
    }
    console.warn('[Stripe] Secret key missing; Stripe features disabled.');
    return null;
  }

  if (cachedClient && cachedKey === key) {
    return cachedClient;
  }

  cachedClient = new Stripe(key, {
    apiVersion: '2025-08-27.basil',
  });
  cachedKey = key;
  return cachedClient;
};

module.exports = { getStripeClient };



