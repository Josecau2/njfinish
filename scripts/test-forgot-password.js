#!/usr/bin/env node
/**
 * Test the forgot-password controller directly without HTTP.
 * Usage:
 *   node scripts/test-forgot-password.js [--email user@example.com] [--host http://localhost:8080]
 */
require('dotenv').config();
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const authController = require('../controllers/authController');
const { User } = require('../models');

(async () => {
  const argv = yargs(hideBin(process.argv))
    .option('email', { type: 'string', describe: 'Email to send reset link to' })
    .option('host', { type: 'string', default: process.env.APP_URL || 'http://localhost:8080' })
    .help().argv;

  let email = argv.email;
  if (!email) {
    // Pick the first active user as a fallback
    const user = await User.findOne({ where: { isDeleted: false }, order: [['id', 'ASC']] });
    if (!user) {
      console.error('[test-forgot-password] No users found. Please create a user or pass --email');
      process.exit(1);
    }
    email = user.email;
  }

  const url = new URL(argv.host);
  const mockReq = {
    body: { email },
    protocol: url.protocol.replace(':', '') || 'http',
    get: (header) => {
      if (header.toLowerCase() === 'host') return url.host;
      return undefined;
    },
  };

  const mockRes = (() => {
    let statusCode = 200;
    return {
      status(code) { statusCode = code; return this; },
      json(payload) { console.log('[test-forgot-password] Response', statusCode, payload); process.exit(0); },
    };
  })();

  try {
    await authController.forgotPassword(mockReq, mockRes);
  } catch (e) {
    console.error('[test-forgot-password] Error:', e);
    process.exit(2);
  }
})();
