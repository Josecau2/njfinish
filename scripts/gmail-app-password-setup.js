#!/usr/bin/env node
/**
 * Gmail App Password Setup Guide
 * This script helps set up Gmail with App Password for SMTP authentication
 */

console.log('📧 Gmail App Password Setup Guide');
console.log('================================');
console.log('');

console.log('🔐 ISSUE DETECTED: Gmail requires App Password');
console.log('Your Gmail account has 2-Factor Authentication enabled,');
console.log('which requires an App Password instead of your regular password.');
console.log('');

console.log('📋 STEPS TO FIX:');
console.log('');

console.log('1. Go to your Google Account settings:');
console.log('   https://myaccount.google.com/');
console.log('');

console.log('2. Navigate to Security → 2-Step Verification');
console.log('   (Make sure 2-Step Verification is enabled)');
console.log('');

console.log('3. Go to Security → App passwords');
console.log('   https://myaccount.google.com/apppasswords');
console.log('');

console.log('4. Create a new App Password:');
console.log('   - Select app: "Mail"');
console.log('   - Select device: "Other (custom name)"');
console.log('   - Enter name: "NJ Cabinets App"');
console.log('   - Click "Generate"');
console.log('');

console.log('5. Copy the 16-character App Password (format: xxxx xxxx xxxx xxxx)');
console.log('');

console.log('6. Update your .env file:');
console.log('   SMTP_PASS=xxxxxxxxxxxxxxxxx  # Replace with the App Password (remove spaces)');
console.log('');

console.log('7. Restart your backend server:');
console.log('   - Stop current server (Ctrl+C)');
console.log('   - Run: node index.js');
console.log('');

console.log('8. Test again:');
console.log('   node scripts/test-forgot-password-email.js');
console.log('');

console.log('⚠️  IMPORTANT NOTES:');
console.log('- App Passwords are different from your regular Gmail password');
console.log('- App Passwords are 16 characters long without spaces');
console.log('- Keep the App Password secure - it provides full account access');
console.log('- If you revoke the App Password later, update the .env file');
console.log('');

console.log('📧 CURRENT CONFIGURATION:');
console.log(`SMTP_HOST: ${process.env.SMTP_HOST || 'Not set'}`);
console.log(`SMTP_PORT: ${process.env.SMTP_PORT || 'Not set'}`);
console.log(`SMTP_USER: ${process.env.SMTP_USER || 'Not set'}`);
console.log(`SMTP_PASS: ${process.env.SMTP_PASS ? '****** (set but needs to be App Password)' : 'Not set'}`);
console.log(`EMAIL_FROM: ${process.env.EMAIL_FROM || 'Not set'}`);
console.log('');

console.log('✅ Once you\'ve updated the App Password, forgot password emails will work!');