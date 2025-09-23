#!/usr/bin/env node
/**
 * Check if the backend server is running and email configuration is ready
 */

require('dotenv').config();
const axios = require('axios');

const API_BASE_URL = process.env.APP_URL || 'http://localhost:8080';
const PORT = process.env.PORT || 8080;

async function checkServerStatus() {
  console.log('🔍 Checking Backend Server Status');
  console.log('================================');
  console.log(`URL: ${API_BASE_URL}`);
  console.log(`Port: ${PORT}`);
  console.log('');

  try {
    // Check if server is responding
    console.log('📡 Checking server connectivity...');
    const response = await axios.get(`${API_BASE_URL}/api/health`, {
      timeout: 5000
    });

    console.log('✅ Server is running and responding');
    console.log(`Status: ${response.status}`);

    return true;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Server is not running');
      console.log('Please start the backend server with: node index.js');
    } else if (error.response && error.response.status === 404) {
      console.log('⚠️  Server is running but /api/health endpoint not found');
      console.log('This is okay - server appears to be running');
      return true;
    } else {
      console.log(`❌ Connection failed: ${error.message}`);
    }
    return false;
  }
}

async function checkEmailConfig() {
  console.log('📧 Checking Email Configuration');
  console.log('==============================');

  const requiredEnvVars = [
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASS',
    'EMAIL_FROM'
  ];

  let allConfigured = true;

  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar];
    if (value) {
      if (envVar === 'SMTP_PASS') {
        console.log(`✅ ${envVar}: ${'*'.repeat(value.length)} (hidden)`);
      } else {
        console.log(`✅ ${envVar}: ${value}`);
      }
    } else {
      console.log(`❌ ${envVar}: Not set`);
      allConfigured = false;
    }
  }

  if (!allConfigured) {
    console.log('\n⚠️  Email configuration incomplete!');
    console.log('Please ensure all SMTP settings are configured in .env file.');
  } else {
    console.log('\n✅ Email configuration appears complete');
  }

  return allConfigured;
}

async function runCheck() {
  console.log('🚀 Pre-flight Check for Forgot Password Testing\n');

  const serverOk = await checkServerStatus();
  console.log('');

  const emailOk = await checkEmailConfig();
  console.log('');

  if (serverOk && emailOk) {
    console.log('🎉 All checks passed! Ready to test forgot password functionality.');
    console.log('\nNext steps:');
    console.log('1. Run: node scripts/test-forgot-password-http.js (quick HTTP test)');
    console.log('2. Run: node scripts/test-forgot-password-email.js (full email test)');
  } else {
    console.log('⚠️  Some issues found. Please resolve them before testing.');

    if (!serverOk) {
      console.log('- Start the backend server: node index.js');
    }

    if (!emailOk) {
      console.log('- Configure email settings in .env file');
    }
  }
}

if (require.main === module) {
  runCheck().catch(console.error);
}

module.exports = { checkServerStatus, checkEmailConfig };