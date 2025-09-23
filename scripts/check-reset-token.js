#!/usr/bin/env node
require('dotenv').config();
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { User } = require('../models');

(async () => {
  const argv = yargs(hideBin(process.argv))
    .option('email', { type: 'string', demandOption: true })
    .help().argv;

  const user = await User.findOne({ where: { email: argv.email } });
  if (!user) {
    console.error('User not found');
    process.exit(1);
  }
  const token = user.resetToken;
  const exp = user.resetTokenExpiry;
  console.log('resetToken:', token);
  console.log('resetTokenExpiry:', exp);
  if (token) {
    const appUrl = (process.env.APP_URL && process.env.APP_URL.trim()) || 'http://localhost:8080';
    console.log('Reset URL:', `${appUrl}/reset-password/${token}`);
  }
  process.exit(0);
})();
