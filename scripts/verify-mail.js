#!/usr/bin/env node
/**
 * Quick SMTP verification and test mail sender.
 * Usage:
 *   node scripts/verify-mail.js --to you@example.com [--subject "Test"] [--text "Hello"]
 */
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { transporter, sendMail, getDefaultFrom } = require('../utils/mail');

(async () => {
  const argv = yargs(hideBin(process.argv))
    .option('verify', { type: 'boolean', default: false, describe: 'Verify transport only (no send)' })
    .option('to', { type: 'string', demandOption: false })
    .option('subject', { type: 'string', default: 'SMTP Verify Test' })
    .option('text', { type: 'string', default: 'This is a test email from verify-mail.js' })
    .help().argv;

  if (!transporter) {
    console.error('[verify-mail] No transporter configured. Check your .env SMTP_* or GMAIL_* variables.');
    process.exit(1);
  }

  try {
    await transporter.verify();
    console.log('[verify-mail] Transport verified successfully.');
  } catch (e) {
    console.error('[verify-mail] Transport verification failed:', e.message);
  }

  if (argv.verify) {
    process.exit(0);
    return;
  }

  if (!argv.to) {
    console.error('[verify-mail] --to is required unless --verify is used');
    process.exit(1);
  }

  try {
    const info = await sendMail({
      to: argv.to,
      subject: argv.subject,
      text: argv.text,
    });
    console.log('[verify-mail] Test mail sent. MessageId:', info.messageId);
    if (info.accepted && info.accepted.length) {
      console.log('[verify-mail] Accepted:', info.accepted.join(', '));
    }
    if (info.rejected && info.rejected.length) {
      console.warn('[verify-mail] Rejected:', info.rejected.join(', '));
    }
  } catch (e) {
    console.error('[verify-mail] Send failed:', e.message);
    process.exit(2);
  }

  process.exit(0);
})();
