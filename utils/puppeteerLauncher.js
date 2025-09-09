const fs = require('fs');
const path = require('path');

// Try to require puppeteer-core first (no bundled Chromium), fallback to puppeteer if present
function requirePuppeteer() {
  try {
    // eslint-disable-next-line import/no-extraneous-dependencies, global-require
    return require('puppeteer-core');
  } catch (_) {
    try {
      // eslint-disable-next-line import/no-extraneous-dependencies, global-require
      return require('puppeteer');
    } catch (err) {
      throw new Error('Neither puppeteer-core nor puppeteer is installed. Install one of them.');
    }
  }
}

function findExecutable() {
  // 1) Env override wins
  const fromEnv = process.env.PUPPETEER_EXECUTABLE_PATH;
  if (fromEnv && fs.existsSync(fromEnv)) return fromEnv;

  // 2) Common Linux paths
  const candidates = [
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/opt/google/chrome/chrome',
  ];

  // 3) Windows dev paths
  const winCandidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    process.env.PROGRAMFILES + '\\Google\\Chrome\\Application\\chrome.exe',
    process.env['PROGRAMFILES(X86)'] + '\\Google\\Chrome\\Application\\chrome.exe'
  ];

  const all = process.platform === 'win32' ? winCandidates : candidates;
  for (const p of all) {
    try {
      if (fs.existsSync(p)) return p;
    } catch (_) {}
  }
  // 4) Unknown – caller can still launch without executablePath if puppeteer (not core) is installed with a bundled browser.
  return undefined;
}

function getPuppeteer() {
  const puppeteer = requirePuppeteer();
  const executablePath = findExecutable();

  const launchOptions = {
    headless: true,
    executablePath,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  };

  // Clean undefined to avoid passing an empty key
  if (!executablePath) delete launchOptions.executablePath;

  return { puppeteer, launchOptions };
}

module.exports = { getPuppeteer };
