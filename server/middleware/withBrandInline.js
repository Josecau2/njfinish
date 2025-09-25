const fs = require('fs');
const { INLINE_PATH } = require('../branding/materializeBranding');

let cachedInline = null;
let cachedMtimeMs = 0;

function readInline() {
  try {
    const stats = fs.statSync(INLINE_PATH);
    if (!cachedInline || stats.mtimeMs !== cachedMtimeMs) {
      cachedInline = fs.readFileSync(INLINE_PATH, 'utf8');
      cachedMtimeMs = stats.mtimeMs;
    }
    return cachedInline;
  } catch (err) {
    return '<!-- no brand inline available -->';
  }
}

function withBrandInline(html) {
  if (typeof html !== 'string') return html;
  const inline = readInline();
  if (html.includes('<!--BRAND_INLINE-->')) {
    return html.replace('<!--BRAND_INLINE-->', inline);
  }
  if (html.includes('</head>')) {
    return html.replace('</head>', `${inline}\n</head>`);
  }
  return `${inline}\n${html}`;
}

module.exports = { withBrandInline, readInline };
