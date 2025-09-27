const fs = require('fs');
const { INLINE_PATH } = require('../branding/materializeBranding');

let cachedInline = null;
let cachedMtimeMs = 0;

function applyNonce(content, nonce) {
  if (!content || typeof content !== 'string') {
    return content;
  }
  if (!nonce) {
    return content.replace(/__CSP_NONCE__/g, '');
  }
  return content.replace(/__CSP_NONCE__/g, nonce);
}

function normalizeNonce(options) {
  if (!options) return '';
  if (typeof options === 'string') return options;
  if (typeof options === 'object' && options.nonce) return options.nonce;
  return '';
}

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

function withBrandInline(html, options) {
  if (typeof html !== 'string') return html;
  const nonce = normalizeNonce(options);
  const inline = applyNonce(readInline(), nonce);
  let output = applyNonce(html, nonce);
  if (output.includes('<!--BRAND_INLINE-->')) {
    return output.replace('<!--BRAND_INLINE-->', inline);
  }
  if (output.includes('</head>')) {
    return output.replace('</head>', `${inline}\n</head>`);
  }
  return `${inline}\n${output}`;
}

module.exports = { withBrandInline, readInline, applyNonce };
