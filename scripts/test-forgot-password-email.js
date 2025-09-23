#!/usr/bin/env node
/**
 * Comprehensive test for forgot password functionality with actual email sending
 * This script tests the complete forgot password flow and sends a test email to fleitipon@icloud.com
 *
 * Usage:
 *   node scripts/test-forgot-password-email.js
 */

require('dotenv').config();
const axios = require('axios');
const { User } = require('../models');
const { sendMail, transporter, getDefaultFrom } = require('../utils/mail');

// Configuration
const TEST_EMAIL = 'fleitipon@icloud.com';
const API_BASE_URL = process.env.APP_URL || 'http://localhost:8080';
const API_PORT = process.env.PORT || 8080;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const logSection = (title) => {
  console.log('\n' + '='.repeat(60));
  log(`${title}`, 'bright');
  console.log('='.repeat(60));
};

const logStep = (step, message) => {
  log(`[${step}] ${message}`, 'cyan');
};

const logSuccess = (message) => {
  log(`✓ ${message}`, 'green');
};

const logError = (message) => {
  log(`✗ ${message}`, 'red');
};

const logWarning = (message) => {
  log(`⚠ ${message}`, 'yellow');
};

async function testEmailConfiguration() {
  logSection('EMAIL CONFIGURATION TEST');

  try {
    logStep('1.1', 'Checking email transporter configuration...');

    if (!transporter) {
      logError('Email transporter is not configured');
      logWarning('Please ensure SMTP configuration is set in .env file:');
      console.log('  SMTP_HOST=smtp.gmail.com');
      console.log('  SMTP_PORT=587');
      console.log('  SMTP_SECURE=false');
      console.log('  SMTP_USER=your-email@gmail.com');
      console.log('  SMTP_PASS=your-app-password');
      console.log('  EMAIL_FROM=Your Name <your-email@gmail.com>');
      return false;
    }

    logSuccess('Email transporter is configured');

    logStep('1.2', 'Testing email connection...');
    await transporter.verify();
    logSuccess('Email connection verified successfully');

    logStep('1.3', 'Checking default FROM address...');
    const defaultFrom = getDefaultFrom();
    if (defaultFrom) {
      logSuccess(`Default FROM address: ${defaultFrom}`);
    } else {
      logWarning('No default FROM address configured');
    }

    return true;
  } catch (error) {
    logError(`Email configuration test failed: ${error.message}`);
    return false;
  }
}

async function ensureTestUser() {
  logSection('TEST USER SETUP');

  try {
    logStep('2.1', `Looking for existing user with email: ${TEST_EMAIL}...`);

    let user = await User.findOne({ where: { email: TEST_EMAIL } });

    if (user) {
      logSuccess(`Found existing user: ${user.firstName} ${user.lastName} (${user.email})`);

      // Clear any existing reset tokens
      if (user.resetToken) {
        logStep('2.2', 'Clearing existing reset token...');
        user.resetToken = null;
        user.resetTokenExpiry = null;
        await user.save();
        logSuccess('Reset token cleared');
      }
    } else {
      logStep('2.2', `Creating test user with email: ${TEST_EMAIL}...`);

      // Find a user role to use (User role)
      const userRole = await require('../models').UserRole.findOne({ where: { role: 'User' } });
      if (!userRole) {
        throw new Error('No User role found in database. Cannot create test user.');
      }

      user = await User.create({
        firstName: 'Test',
        lastName: 'User',
        email: TEST_EMAIL,
        password: '$2b$10$dummy.hash.for.test.user', // Dummy hash since we're only testing forgot password
        role_id: userRole.id,
        isActive: true,
        isDeleted: false
      });

      logSuccess(`Created test user: ${user.firstName} ${user.lastName} (${user.email})`);
    }

    return user;
  } catch (error) {
    logError(`Failed to set up test user: ${error.message}`);
    throw error;
  }
}

async function testForgotPasswordAPI() {
  logSection('FORGOT PASSWORD API TEST');

  try {
    logStep('3.1', `Making API request to: ${API_BASE_URL}/api/forgot-password`);

    const response = await axios.post(`${API_BASE_URL}/api/forgot-password`, {
      email: TEST_EMAIL
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    logSuccess(`API request successful (Status: ${response.status})`);
    logSuccess(`Response: ${response.data.message}`);

    return response.data;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      logError(`Cannot connect to server at ${API_BASE_URL}`);
      logWarning('Please ensure the backend server is running on the correct port');
      logWarning(`Try running: node index.js`);
    } else if (error.response) {
      logError(`API request failed (Status: ${error.response.status})`);
      logError(`Response: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      logError(`API request failed: ${error.message}`);
    }
    throw error;
  }
}

async function verifyResetToken() {
  logSection('RESET TOKEN VERIFICATION');

  try {
    logStep('4.1', 'Checking if reset token was generated...');

    const user = await User.findOne({ where: { email: TEST_EMAIL } });

    if (!user) {
      logError('Test user not found in database');
      return null;
    }

    if (!user.resetToken) {
      logError('No reset token was generated');
      return null;
    }

    logSuccess(`Reset token generated: ${user.resetToken.substring(0, 8)}...`);

    logStep('4.2', 'Checking token expiry...');
    const now = new Date();
    const expiry = new Date(user.resetTokenExpiry);

    if (expiry <= now) {
      logError('Reset token has already expired');
      return null;
    }

    const timeUntilExpiry = Math.round((expiry - now) / (1000 * 60)); // minutes
    logSuccess(`Token expires in ${timeUntilExpiry} minutes (${expiry.toISOString()})`);

    logStep('4.3', 'Building reset link...');
    const resetLink = `${API_BASE_URL}/reset-password/${user.resetToken}`;
    logSuccess(`Reset link: ${resetLink}`);

    return {
      token: user.resetToken,
      expiry: user.resetTokenExpiry,
      resetLink
    };
  } catch (error) {
    logError(`Failed to verify reset token: ${error.message}`);
    throw error;
  }
}

async function testDirectEmailSend(resetLink) {
  logSection('DIRECT EMAIL TEST');

  try {
    logStep('5.1', `Sending test email directly to: ${TEST_EMAIL}...`);

    const emailContent = {
      to: TEST_EMAIL,
      subject: '🔐 Password Reset Test - NJ Cabinets',
      text: `
Password Reset Test Email

This is a test email to verify that the forgot password functionality is working correctly.

Reset Link: ${resetLink}

If you received this email, the forgot password system is working properly!

This link is valid for 1 hour.

---
NJ Cabinets Password Reset System Test
      `.trim(),
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">🔐 Password Reset Test - NJ Cabinets</h2>

          <p>This is a test email to verify that the forgot password functionality is working correctly.</p>

          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Reset Link:</strong></p>
            <a href="${resetLink}" style="color: #2563eb; word-break: break-all;">${resetLink}</a>
          </div>

          <p style="color: #059669; font-weight: bold;">✓ If you received this email, the forgot password system is working properly!</p>

          <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">
            This link is valid for 1 hour.<br>
            <em>NJ Cabinets Password Reset System Test</em>
          </p>
        </div>
      `
    };

    const info = await sendMail(emailContent);

    logSuccess('Email sent successfully!');
    logSuccess(`Message ID: ${info.messageId}`);

    if (info.accepted && info.accepted.length > 0) {
      logSuccess(`Email accepted for delivery to: ${info.accepted.join(', ')}`);
    }

    if (info.rejected && info.rejected.length > 0) {
      logWarning(`Email rejected for: ${info.rejected.join(', ')}`);
    }

    return info;
  } catch (error) {
    logError(`Failed to send test email: ${error.message}`);
    throw error;
  }
}

async function runFullTest() {
  try {
    logSection('FORGOT PASSWORD FUNCTIONALITY TEST');
    log(`Testing email delivery to: ${TEST_EMAIL}`, 'bright');
    log(`API Base URL: ${API_BASE_URL}`, 'bright');
    log(`Server Port: ${API_PORT}`, 'bright');

    // Step 1: Test email configuration
    const emailConfigOk = await testEmailConfiguration();
    if (!emailConfigOk) {
      logError('Email configuration test failed. Cannot proceed with email tests.');
      process.exit(1);
    }

    // Step 2: Ensure test user exists
    const testUser = await ensureTestUser();

    // Step 3: Test the forgot password API
    const apiResponse = await testForgotPasswordAPI();

    // Step 4: Verify reset token was created
    const tokenInfo = await verifyResetToken();
    if (!tokenInfo) {
      logError('Reset token verification failed');
      process.exit(1);
    }

    // Step 5: Send a direct test email
    const emailInfo = await testDirectEmailSend(tokenInfo.resetLink);

    // Final summary
    logSection('TEST SUMMARY');
    logSuccess('All tests completed successfully!');
    console.log('\nTest Results:');
    logSuccess(`✓ Email configuration verified`);
    logSuccess(`✓ Test user ready: ${testUser.email}`);
    logSuccess(`✓ Forgot password API working`);
    logSuccess(`✓ Reset token generated: ${tokenInfo.token.substring(0, 8)}...`);
    logSuccess(`✓ Email sent to: ${TEST_EMAIL}`);

    console.log('\nNext Steps:');
    log('1. Check the email inbox for fleitipon@icloud.com', 'yellow');
    log('2. Verify the reset link works by clicking it', 'yellow');
    log('3. Test the actual password reset process', 'yellow');

    log('\n✅ Forgot password functionality is working correctly!', 'green');

  } catch (error) {
    logSection('TEST FAILED');
    logError(`Test failed with error: ${error.message}`);

    if (error.stack) {
      console.log('\nError stack trace:');
      console.log(error.stack);
    }

    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  log('\n\nTest interrupted by user', 'yellow');
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  logError(`Unhandled promise rejection: ${reason.message || reason}`);
  process.exit(1);
});

// Run the test
if (require.main === module) {
  runFullTest();
}

module.exports = {
  testEmailConfiguration,
  ensureTestUser,
  testForgotPasswordAPI,
  verifyResetToken,
  testDirectEmailSend,
  runFullTest
};