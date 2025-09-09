#!/usr/bin/env node
/**
 * Fetch Inter font woff2 files locally to avoid external Google Fonts calls (CSP compliance)
 * Downloads from rsms/inter GitHub CDN fallback.
 */
import fs from 'fs';
import path from 'path';
import https from 'https';

const weights = [400,500,600,700];
// rsms distribution uses Inter-Regular, Inter-Medium, Inter-SemiBold, Inter-Bold naming
const baseUrl = 'https://rsms.me/inter/font-files';
const outDir = path.resolve(process.cwd(), 'public', 'fonts');

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, res => {
      if (res.statusCode !== 200) {
        file.close();
        fs.unlink(dest, () => {});
        return reject(new Error('Failed ' + url + ' status=' + res.statusCode));
      }
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', err => {
      file.close();
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

(async () => {
  const tasks = [];
  for (const w of weights) {
    const nameMap = { 400: 'Regular', 500: 'Medium', 600: 'SemiBold', 700: 'Bold' };
    const filename = `Inter-${nameMap[w]}.woff2`;
    const url = `${baseUrl}/${filename}`;
    const dest = path.join(outDir, filename);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 0) {
      console.log('✓ Cached', filename);
      continue;
    }
    console.log('↓ Downloading', filename);
    tasks.push(download(url, dest));
  }
  await Promise.all(tasks);
  // Remove any incorrectly named numeric weight files from previous runs
  for (const bad of ['Inter-400.woff2','Inter-500.woff2','Inter-600.woff2','Inter-700.woff2']) {
    const p = path.join(outDir, bad);
    if (fs.existsSync(p)) {
      try { fs.unlinkSync(p); console.log('✗ Removed legacy file', bad); } catch {}
    }
  }
  // Generate a CSS file for local @font-face declarations
  const cssPath = path.join(outDir, 'inter.css');
  const css = weights.map(w => {
    const nameMap = { 400: 'Regular', 500: 'Medium', 600: 'SemiBold', 700: 'Bold' };
    return `@font-face {\n  font-family: 'Inter';\n  font-style: normal;\n  font-weight: ${w};\n  font-display: swap;\n  src: url('/fonts/Inter-${nameMap[w]}.woff2') format('woff2');\n}`;
  }).join('\n\n');
  fs.writeFileSync(cssPath, css, 'utf8');
  console.log('✓ Generated inter.css with', weights.length, 'faces');
})();
