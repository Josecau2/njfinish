#!/usr/bin/env node
/**
 * Send a real Request Access test email to a lead and admin using current config.
 *
 * Usage (PowerShell):
 *   node scripts/test-request-access-email.js --lead you@example.com --admin admin@example.com
 *   # admin is optional; will use ADMIN_NOTIFY_EMAIL or defaultFrom if omitted
 */
const { sendMail, getDefaultFrom, applyTransportConfig } = require('../utils/mail');
const { getRequestAccessConfig } = require('../services/loginCustomizationCache');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

(async () => {
  const argv = yargs(hideBin(process.argv))
    .option('lead', { type: 'string', demandOption: true, describe: 'Lead email recipient' })
    .option('first', { type: 'string', default: 'Test' })
    .option('last', { type: 'string', default: 'User' })
    .option('name', { type: 'string' })
    .option('company', { type: 'string', default: 'Test Company' })
    .option('phone', { type: 'string', default: '555-000-0000' })
    .option('city', { type: 'string', default: 'Newark' })
    .option('state', { type: 'string', default: 'NJ' })
    .option('zip', { type: 'string', default: '07001' })
    .option('admin', { type: 'string', describe: 'Explicit admin email (comma-separated for many)' })
    .help().argv;

  const email = String(argv.lead).trim();
  const firstName = (argv.first || '').trim();
  const lastName = (argv.last || '').trim();
  const name = (argv.name || `${firstName} ${lastName}`).trim();
  const company = (argv.company || '').trim();
  const phone = (argv.phone || '').trim();
  const city = (argv.city || '').trim();
  const state = (argv.state || '').trim();
  const zip = (argv.zip || '').trim();

  // Make sure current mail configuration is applied
  applyTransportConfig();

  const requestAccessConfig = await getRequestAccessConfig();

  const companyLine = company ? `\nCompany: ${company}` : '';
  const phoneLine = phone ? `\nPhone: ${phone}` : '';
  const location = [city, state, zip].filter(Boolean).join(', ');
  const locationLine = location ? `\nLocation: ${location}` : '';
  const messageBlock = '\n\nMessage:\nThis is a test lead submission triggered by scripts/test-request-access-email.js';

  const context = {
    name,
    firstName: firstName || 'there',
    lastName,
    email,
    company,
    message: 'This is a test lead submission',
    phone,
    city,
    state,
    zip,
    location,
    companyLine,
    phoneLine,
    locationLine,
    messageBlock,
  };

  const render = (template = '', ctx = {}) => template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => (ctx[k] ?? ''));
  const toHtml = (text = '') => String(text).split(/\r?\n/).map(l => l.trim()).map(l => l.length ? l : '&nbsp;').join('<br />');

  const adminRecipients = (argv.admin ? String(argv.admin) : (process.env.ADMIN_NOTIFY_EMAIL || ''))
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  const fallbackAdmin = getDefaultFrom();
  const adminTo = adminRecipients.length ? adminRecipients : (fallbackAdmin ? [fallbackAdmin] : []);

  const adminBody = render(requestAccessConfig.adminBody, context);
  const leadBody = render(requestAccessConfig.leadBody, context);

  console.log('\nRequest Access Test — About to send:');
  console.log('  From      :', getDefaultFrom() || '(default from unset)');
  console.log('  Lead to   :', email);
  console.log('  Admin to  :', adminTo.join(', ') || '(none)');

  try {
    if (adminTo.length) {
      await sendMail({ to: adminTo, subject: requestAccessConfig.adminSubject, html: toHtml(adminBody) });
      console.log('✓ Admin notification sent');
    } else {
      console.log('! No admin recipient resolved; skipped admin notification');
    }
  } catch (e) {
    console.error('✗ Admin send failed:', e?.message || e);
  }

  try {
    await sendMail({ to: email, subject: requestAccessConfig.leadSubject, html: toHtml(leadBody) });
    console.log('✓ Lead confirmation sent');
  } catch (e) {
    console.error('✗ Lead send failed:', e?.message || e);
    process.exit(2);
  }

  console.log('\nAll done. Check your inboxes.');
  process.exit(0);
})();
