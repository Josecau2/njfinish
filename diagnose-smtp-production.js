#!/usr/bin/env node
/**
 * Diagnose SMTP configuration for production
 */

require('dotenv').config();

async function diagnoseSMTPConfig() {
  console.log('📧 SMTP Configuration Diagnosis');
  console.log('===============================');
  console.log('');

  // Check environment variables
  console.log('🔍 Environment Variables:');
  console.log(`SMTP_HOST: ${process.env.SMTP_HOST || '❌ Not set'}`);
  console.log(`SMTP_PORT: ${process.env.SMTP_PORT || '❌ Not set'}`);
  console.log(`SMTP_SECURE: ${process.env.SMTP_SECURE || '❌ Not set'}`);
  console.log(`SMTP_USER: ${process.env.SMTP_USER || '❌ Not set'}`);
  console.log(`SMTP_PASS: ${process.env.SMTP_PASS ? '✅ Set (hidden)' : '❌ Not set'}`);
  console.log(`EMAIL_FROM: ${process.env.EMAIL_FROM || '❌ Not set'}`);
  console.log(`APP_URL: ${process.env.APP_URL || '❌ Not set'}`);
  console.log(`NODE_ENV: ${process.env.NODE_ENV || '❌ Not set'}`);
  console.log('');

  // Test mail utility
  try {
    console.log('🧪 Testing mail utility...');
    const { sendMail, transporter } = require('./utils/mail');

    console.log('✅ Mail utility loaded successfully');

    // Test SMTP connection
    console.log('🔌 Testing SMTP connection...');
    const isReady = await transporter.verify();

    if (isReady) {
      console.log('✅ SMTP connection successful');

      // Send test email
      console.log('📤 Sending test email...');
      const testResult = await sendMail({
        to: 'joseca@symmetricalwolf.com',
        subject: '🧪 SMTP Test - Production Diagnosis',
        text: 'This is a test email to verify SMTP configuration in production.',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>🧪 SMTP Test - Production Diagnosis</h2>
            <p>This is a test email to verify SMTP configuration in production.</p>
            <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
            <p><strong>Server:</strong> ${process.env.NODE_ENV} environment</p>
          </div>
        `
      });

      console.log('✅ Test email sent successfully!');
      console.log(`Message ID: ${testResult.messageId}`);

    } else {
      console.log('❌ SMTP connection failed');
    }

  } catch (error) {
    console.log('❌ SMTP test failed:');
    console.log(`Error: ${error.message}`);

    if (error.code === 'EAUTH') {
      console.log('');
      console.log('🔐 Authentication Error - Possible Solutions:');
      console.log('1. Verify Gmail App Password is correct');
      console.log('2. Make sure SMTP_USER matches the Gmail account');
      console.log('3. Check if 2-Factor Authentication is enabled');
      console.log('4. Try generating a new App Password');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('');
      console.log('🚫 Connection Refused - Possible Solutions:');
      console.log('1. Check firewall settings on production server');
      console.log('2. Verify SMTP_HOST and SMTP_PORT are correct');
      console.log('3. Check if production server can reach smtp.gmail.com');
    } else if (error.code === 'ENOTFOUND') {
      console.log('');
      console.log('🌐 DNS Resolution Error - Possible Solutions:');
      console.log('1. Check DNS settings on production server');
      console.log('2. Verify internet connectivity');
      console.log('3. Try using IP address instead of hostname');
    }
  }

  console.log('');
  console.log('🎯 Next Steps if SMTP is working:');
  console.log('1. Check email spam/junk folder');
  console.log('2. Verify email address is correct');
  console.log('3. Check backend server logs for errors');
  console.log('4. Test with a different email address');
}

// Run the diagnosis
if (require.main === module) {
  diagnoseSMTPConfig()
    .then(() => {
      console.log('\n✅ SMTP diagnosis completed!');
    })
    .catch((error) => {
      console.error('\n💥 Diagnosis failed:', error.message);
    });
}

module.exports = { diagnoseSMTPConfig };