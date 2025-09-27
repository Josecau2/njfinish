const sanitizeHtmlLib = require('sanitize-html');
const { URL } = require('url');

const removeNullBytes = (text = '') => text.replace(/\u0000/g, '');

const BASE_ALLOWED_TAGS = [
  'a', 'abbr', 'b', 'blockquote', 'br', 'caption', 'code', 'col', 'colgroup', 'div', 'em', 'figcaption',
  'figure', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'i', 'img', 'li', 'mark', 'ol', 'p', 'pre', 'section',
  'small', 'span', 'strong', 'sub', 'sup', 'table', 'tbody', 'td', 'tfoot', 'th', 'thead', 'tr', 'u', 'ul'
];

const BASE_ALLOWED_ATTRIBUTES = {
  a: ['href', 'name', 'target', 'rel', 'title'],
  img: ['src', 'alt', 'title', 'width', 'height', 'loading', 'decoding'],
  table: ['role', 'summary'],
  '*': ['class', 'id', 'style', 'title', 'role', 'aria-label', 'aria-hidden', 'aria-describedby', 'aria-controls', 'aria-expanded']
};

const BASE_ALLOWED_STYLES = {
  '*': {
    color: [/^#[0-9a-fA-F]{3,8}$/i, /^rgb(a)?\(/i, /^hsl(a)?\(/i],
    'background-color': [/^#[0-9a-fA-F]{3,8}$/i, /^rgb(a)?\(/i, /^hsl(a)?\(/i],
    'text-align': [/^(left|right|center|justify)$/i],
    'font-weight': [/^(normal|bold|bolder|lighter|[1-9]00)$/],
    'font-style': [/^(normal|italic|oblique)$/i],
    'text-decoration': [/^(none|underline|line-through|overline)$/i],
    'letter-spacing': [/^-?\d+(\.\d+)?(px|em|rem|%)$/i],
    'line-height': [/^(normal|\d+(\.\d+)?(px|em|rem|%)?)$/i],
  }
};

const DEFAULT_SCHEMES = ['http', 'https', 'mailto', 'tel', 'data'];

function parseHosts(input) {
  if (!input) return [];
  if (Array.isArray(input)) return input.filter(Boolean).map((host) => String(host).toLowerCase());
  return String(input)
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => value.toLowerCase());
}

function withAnchorTransform(transform = {}) {
  return {
    ...transform,
    a: (tagName, attribs) => {
      const nextAttribs = { ...attribs };
      if (nextAttribs.href) {
        try {
          const parsed = new URL(nextAttribs.href, 'https://placeholder.local');
          if (!['http:', 'https:', 'mailto:', 'tel:'].includes(parsed.protocol)) {
            delete nextAttribs.href;
          }
        } catch (_) {
          delete nextAttribs.href;
        }
      }
      if (nextAttribs.target && nextAttribs.target.toLowerCase() === '_blank') {
        nextAttribs.rel = 'noopener noreferrer';
      }
      return {
        tagName,
        attribs: nextAttribs,
      };
    },
  };
}

function iframeTransformFactory(allowedHosts) {
  const hostSet = new Set(parseHosts(allowedHosts));
  return (tagName, attribs) => {
    const nextAttribs = { ...attribs };
    const src = nextAttribs.src || '';
    if (!src) {
      return { tagName: 'div', text: '' };
    }
    try {
      const parsed = new URL(src, 'https://placeholder.local');
      if (parsed.protocol !== 'https:') {
        return { tagName: 'div', text: '' };
      }
      if (hostSet.size > 0 && !hostSet.has(parsed.hostname.toLowerCase())) {
        return { tagName: 'div', text: '' };
      }
      const safeAttribs = {};
      ['src', 'allow', 'allowfullscreen', 'frameborder', 'height', 'width', 'title', 'loading', 'referrerpolicy'].forEach((key) => {
        if (nextAttribs[key]) safeAttribs[key] = nextAttribs[key];
      });
      return { tagName, attribs: safeAttribs };
    } catch (_) {
      return { tagName: 'div', text: '' };
    }
  };
}

function sanitizeHtml(input, options = {}) {
  if (!input) return '';
  const allowIframes = Boolean(options.allowIframes);
  const allowedIframeHosts = options.allowedIframeHosts || [];
  const userAllowedTags = Array.isArray(options.allowedTags) ? options.allowedTags : [];
  const allowedSchemes = Array.isArray(options.allowedSchemes) ? options.allowedSchemes : DEFAULT_SCHEMES;
  const allowDataAttributes = options.allowDataAttributes !== false; // default true

  const allowedAttributes = {
    ...BASE_ALLOWED_ATTRIBUTES,
    ...(options.allowedAttributes || {}),
  };

  const allowedStyles = {
    ...BASE_ALLOWED_STYLES,
    ...(options.allowedStyles || {}),
  };

  const transformTags = withAnchorTransform(options.transformTags || {});

  const sanitizerOptions = {
    allowedTags: Array.from(new Set([...BASE_ALLOWED_TAGS, ...userAllowedTags])),
    allowedAttributes,
    allowedStyles,
    allowedSchemes,
    allowProtocolRelative: false,
    allowDataAttributes,
    textFilter: removeNullBytes,
    parser: { lowerCaseAttributeNames: false },
    transformTags,
  };

  if (allowIframes) {
    sanitizerOptions.allowedTags.push('iframe');
    sanitizerOptions.allowedAttributes.iframe = ['src', 'allow', 'allowfullscreen', 'frameborder', 'height', 'width', 'title', 'loading', 'referrerpolicy'];
    sanitizerOptions.allowedSchemesByTag = {
      ...(options.allowedSchemesByTag || {}),
      iframe: ['https'],
    };
    sanitizerOptions.transformTags = {
      ...transformTags,
      iframe: iframeTransformFactory(allowedIframeHosts),
    };
  }

  const sanitized = sanitizeHtmlLib(String(input), sanitizerOptions);
  return sanitized.trim();
}

function sanitizePaymentEmbed(html, options = {}) {
  const allowedScriptHosts = new Set(
    parseHosts(options.allowedScriptHosts || process.env.PAYMENT_EMBED_ALLOWED_SCRIPT_HOSTS || '')
  );

  if (allowedScriptHosts.size === 0) {
    ['js.stripe.com', 'pay.stripe.com', 'checkout.stripe.com'].forEach((host) => allowedScriptHosts.add(host));
  }

  const allowedIframeHosts = options.allowedIframeHosts || Array.from(allowedScriptHosts);

  const sanitized = sanitizeHtmlLib(String(html || ''), {
    allowedTags: Array.from(new Set([
      ...BASE_ALLOWED_TAGS,
      'button', 'form', 'iframe', 'input', 'label', 'script', 'section', 'select', 'option'
    ])),
    allowedAttributes: {
      ...BASE_ALLOWED_ATTRIBUTES,
      form: ['action', 'method', 'target', 'novalidate', 'id', 'class'],
      input: ['type', 'name', 'value', 'id', 'class', 'placeholder', 'required', 'checked', 'autocomplete', 'min', 'max', 'step'],
      button: ['type', 'name', 'value', 'id', 'class'],
      select: ['name', 'id', 'class', 'required'],
      option: ['value', 'selected'],
      script: ['src', 'async', 'defer', 'crossorigin', 'referrerpolicy'],
      iframe: ['src', 'allow', 'allowfullscreen', 'frameborder', 'height', 'width', 'title', 'loading', 'referrerpolicy'],
    },
    allowedStyles: BASE_ALLOWED_STYLES,
    allowedSchemes: ['https', 'data'],
    allowedSchemesByTag: { script: ['https'], iframe: ['https'], img: ['https', 'data'] },
    allowProtocolRelative: false,
    allowDataAttributes: true,
    textFilter: removeNullBytes,
    transformTags: {
      ...withAnchorTransform(),
      iframe: iframeTransformFactory(allowedIframeHosts),
    },
    exclusiveFilter(frame) {
      if (frame.tag === 'script') {
        const src = frame.attribs?.src || '';
        if (!src) return true;
        try {
          const parsed = new URL(src);
          if (parsed.protocol !== 'https:') return true;
          if (!allowedScriptHosts.has(parsed.hostname.toLowerCase())) return true;
        } catch (_) {
          return true;
        }
      }
      if (frame.tag === 'iframe') {
        const src = frame.attribs?.src || '';
        if (!src) return true;
        try {
          const parsed = new URL(src);
          if (parsed.protocol !== 'https:') return true;
          if (allowedIframeHosts.length && !allowedIframeHosts.some((host) => host.toLowerCase() === parsed.hostname.toLowerCase())) {
            return true;
          }
        } catch (_) {
          return true;
        }
      }
      return false;
    },
  });

  return sanitized.trim();
}

function stringifyForInlineScript(value) {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/\\u2028/g, '\\u2028')
    .replace(/\\u2029/g, '\\u2029')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
    .replace(/\u0000/g, '');
}

module.exports = {
  sanitizeHtml,
  sanitizePaymentEmbed,
  stringifyForInlineScript,
};